# View-Specific Visibility Analysis
**Date:** 2025-10-18
**Feature Request:** Per-view element hiding (elevation views) without affecting other views

---

## Executive Summary

**User Request:**
> "I need to be able to make different cabinets invisible in the different elevation views without changing the other views. there is currently a global selector the user can select, hide or delete components but it affects all views."

**Finding:** ✅ **HIGHLY VIABLE** - Infrastructure already exists but is **not connected to rendering logic**

**Current Status:**
- 🟢 Data structure: `ElevationViewConfig.hidden_elements` array **EXISTS**
- 🟢 Helper functions: Toggle/check visibility **IMPLEMENTED**
- 🔴 Rendering logic: **NOT FILTERING** by hidden_elements
- 🔴 UI controls: Hide button **NOT IMPLEMENTED**

**Estimated Implementation:** 4-6 hours (Medium complexity)

---

## Problem Statement

### Current Behavior (Global Delete/Hide)

```
User deletes cabinet in front elevation view
    ↓
Element removed from design_elements array
    ↓
Cabinet disappears from:
    ✗ Plan view
    ✗ Front elevation view
    ✗ Back elevation view
    ✗ Left elevation view
    ✗ Right elevation view
    ✗ 3D view
    ✗ All duplicated elevation views
```

### Desired Behavior (Per-View Hiding)

```
User hides cabinet in front elevation view
    ↓
Element ID added to front-default.hidden_elements array
    ↓
Cabinet visibility:
    ✓ Plan view: VISIBLE
    ✗ Front elevation view: HIDDEN
    ✓ Back elevation view: VISIBLE
    ✓ Left elevation view: VISIBLE
    ✓ Right elevation view: VISIBLE
    ✓ 3D view: VISIBLE
    ✓ Other front duplicates: VISIBLE (independent hidden_elements)
```

---

## Current System Architecture

### 1. Data Structure (Already Exists!)

**Location:** `src/types/project.ts`

```typescript
export interface ElevationViewConfig {
  id: string;                    // "front-default", "back-dup1", etc.
  direction: 'front' | 'back' | 'left' | 'right';
  label: string;
  hidden_elements: string[];     // 🟢 ALREADY EXISTS - Array of element IDs to hide
  is_default: boolean;
  sort_order: number;
}

export interface RoomDesign {
  design_elements: DesignElement[];    // All elements (never deleted for hide)
  design_settings: {
    elevation_views?: ElevationViewConfig[];  // Per-view settings
  }
}
```

**Storage:** Supabase `room_designs` table → `design_settings` JSONB column

---

### 2. Helper Functions (Already Implemented!)

**Location:** `src/utils/elevationViewHelpers.ts`

```typescript
// 🟢 ALREADY IMPLEMENTED
export const toggleElementVisibility = (
  viewId: string,
  elementId: string,
  elevationViews: ElevationViewConfig[]
): ElevationViewConfig[] => {
  return elevationViews.map(view => {
    if (view.id === viewId) {
      const hiddenElements = view.hidden_elements || [];
      const isCurrentlyHidden = hiddenElements.includes(elementId);

      return {
        ...view,
        hidden_elements: isCurrentlyHidden
          ? hiddenElements.filter(id => id !== elementId)  // Show
          : [...hiddenElements, elementId]                  // Hide
      };
    }
    return view;
  });
};

// 🟢 ALREADY IMPLEMENTED
export const isElementVisibleInView = (
  elementId: string,
  viewId: string | null,
  elevationViews: ElevationViewConfig[]
): boolean => {
  if (!viewId) return true;  // Always visible in plan view

  const view = elevationViews.find(v => v.id === viewId);
  if (!view) return true;

  const hiddenElements = view.hidden_elements || [];
  return !hiddenElements.includes(elementId);  // Visible if NOT in hidden list
};
```

---

### 3. Current View State Management

**Location:** `src/components/designer/DesignCanvas2D.tsx` (Lines 317-344)

```typescript
// 🟢 ALREADY EXTRACTS hidden_elements
const currentViewInfo = React.useMemo(() => {
  if (active2DView === 'plan') {
    return { direction: 'plan', hiddenElements: [] };
  }

  const views = elevationViews || getElevationViews();
  const currentView = views.find(v => v.id === active2DView);

  if (currentView) {
    return {
      direction: currentView.direction,
      hiddenElements: currentView.hidden_elements || []  // 🟢 EXTRACTED
    };
  }

  return { direction: 'front', hiddenElements: [] };
}, [active2DView, elevationViews]);
```

**🔴 PROBLEM:** `currentViewInfo.hiddenElements` is extracted but **NEVER USED** to filter elements during rendering!

---

## Implementation Gaps

### Gap 1: Rendering Logic Not Filtering by hidden_elements 🔴

**Location:** `src/components/designer/DesignCanvas2D.tsx`

**Current Code (Line ~1200+):**
```typescript
// Rendering loop renders ALL elements
{design.elements.map((element) => {
  // NO FILTERING BY VISIBILITY
  // Renders element regardless of currentViewInfo.hiddenElements
  const renderData = render2DService.getCached(element.component_id || element.id);
  // ... render element
})}
```

**Required Fix:**
```typescript
// Filter elements by current view's hidden_elements
{design.elements
  .filter(element => {
    // 🔧 NEW: Skip hidden elements in current view
    if (currentViewInfo.hiddenElements?.includes(element.id)) {
      return false;
    }
    return true;
  })
  .map((element) => {
    // ... render visible elements only
  })}
```

---

### Gap 2: UI Controls for Hiding Elements 🔴

**Location:** `src/components/designer/PropertiesPanel.tsx` (Lines 671-688)

**Current Code:**
```typescript
<Button variant="outline" size="sm" className="w-full text-xs">
  Duplicate Element  {/* No onClick handler */}
</Button>
```

**Required Fix:**
```typescript
{/* Only show hide button in elevation views */}
{selectedElement && active2DView !== 'plan' && (
  <Button
    variant="outline"
    size="sm"
    className="w-full text-xs"
    onClick={handleToggleVisibility}
  >
    {isElementHiddenInCurrentView(selectedElement.id)
      ? 'Show in This View'
      : 'Hide in This View'}
  </Button>
)}
```

---

### Gap 3: 3D View Filtering (Optional) 🟡

**Location:** `src/components/designer/AdaptiveView3D.tsx` (Line 477-483)

**Current Code:**
```typescript
const visibleElements = useMemo(() => {
  if (!design?.elements) return [];

  const maxElements = currentQuality?.maxElements || 100;
  return design.elements.slice(0, maxElements);  // 🔴 NO VISIBILITY FILTERING
}, [design?.elements, currentQuality?.maxElements]);
```

**Decision Needed:**
- Should 3D view respect elevation view hidden_elements?
- Or should 3D view always show all elements?

**Recommendation:** 3D view should show ALL elements (ignore hidden_elements) since it's a comprehensive overview.

---

## Implementation Plan

### Phase 1: Wire Up Rendering Filters ✅ (2 hours)

**Files to Modify:**
1. `src/components/designer/DesignCanvas2D.tsx`

**Changes:**
- Add filtering before rendering loop using `currentViewInfo.hiddenElements`
- Test plan view (no filtering) vs elevation views (filtered)

**Acceptance Criteria:**
- Elements in `hidden_elements` array do not render in that specific elevation view
- Same elements still visible in plan view and other elevation views
- 3D view unaffected (shows all elements)

---

### Phase 2: Add UI Controls ✅ (2 hours)

**Files to Modify:**
1. `src/components/designer/PropertiesPanel.tsx` - Add hide/show button
2. `src/pages/Designer.tsx` - Add handler function

**Changes:**
- Add "Hide in This View" / "Show in This View" button to PropertiesPanel
- Only show button when in elevation view (not plan view)
- Wire up to `toggleElementVisibility` helper
- Update `elevationViews` state in Designer
- Persist to database via `updateCurrentRoomDesign`

**Button States:**
- Plan view: Button not shown (global delete only)
- Elevation view + element visible: "Hide in This View"
- Elevation view + element hidden: "Show in This View"

**Acceptance Criteria:**
- Button appears in PropertiesPanel when element selected in elevation view
- Clicking button toggles visibility in current view only
- State persists to database
- Toast notification confirms action

---

### Phase 3: Visual Feedback ✅ (1 hour)

**Files to Modify:**
1. `src/components/designer/DesignCanvas2D.tsx` - Add visual indicator for hidden elements

**Changes:**
- Add faded/ghosted rendering for hidden elements (optional)
- Or add "eye" icon overlay in plan view to show which elements are hidden in elevation views
- Add tooltip showing "Hidden in: front-default, back-dup1" when hovering

**Acceptance Criteria:**
- User can visually identify which elements are hidden in which views
- Clear visual distinction between visible/hidden states

---

### Phase 4: Bulk Operations (Optional) 🔵 (1 hour)

**Files to Modify:**
1. `src/components/designer/ViewSelector.tsx` - Add context menu options

**Changes:**
- Add "Hide All Base Cabinets" to view context menu
- Add "Hide All Wall Cabinets" to view context menu
- Add "Show All Elements" to view context menu
- Add "Copy Hidden Elements from..." to duplicate view's hidden_elements

**Acceptance Criteria:**
- Right-click on elevation view tab shows bulk hide options
- Bulk operations work correctly
- State persists to database

---

## Technical Architecture

### Data Flow for Hide/Show

```
User clicks "Hide in This View" button
    ↓
PropertiesPanel.onClick() → handleToggleVisibility()
    ↓
Designer.handleToggleVisibility(elementId, viewId)
    ↓
toggleElementVisibility(viewId, elementId, elevationViews)
    ↓
elevationViews state updated with new hidden_elements array
    ↓
updateCurrentRoomDesign({ design_settings: { elevation_views } })
    ↓
ProjectContext → Supabase update to room_designs table
    ↓
DesignCanvas2D re-renders with filtered elements
```

### Database Updates

**Before:**
```json
{
  "design_settings": {
    "elevation_views": [
      {
        "id": "front-default",
        "direction": "front",
        "label": "Front View",
        "hidden_elements": [],
        "is_default": true,
        "sort_order": 0
      }
    ]
  }
}
```

**After (user hides element-123 in front view):**
```json
{
  "design_settings": {
    "elevation_views": [
      {
        "id": "front-default",
        "direction": "front",
        "label": "Front View",
        "hidden_elements": ["element-123", "element-456"],  // 🟢 UPDATED
        "is_default": true,
        "sort_order": 0
      }
    ]
  }
}
```

---

## Edge Cases & Considerations

### 1. Deleting vs Hiding
**Question:** Should we keep both delete (global) and hide (per-view)?

**Recommendation:** YES - Two different operations:
- **Delete:** Permanent removal from design (all views)
- **Hide in View:** Temporary per-view visibility control

**UI Distinction:**
- Delete button: Red, destructive styling, "Delete Element"
- Hide button: Neutral, outline styling, "Hide in This View"

---

### 2. Plan View Behavior
**Question:** Should plan view support per-element hiding?

**Recommendation:** NO - Plan view shows all elements always
- Hiding only makes sense in elevation views (to reduce clutter)
- Plan view is the "source of truth" showing complete design

---

### 3. 3D View Behavior
**Question:** Should 3D view respect hidden_elements?

**Recommendation:** NO - 3D view shows all elements always
- 3D view is comprehensive overview
- Elevation hidden_elements are for 2D elevation decluttering only

---

### 4. Selection of Hidden Elements
**Question:** Can user select hidden elements in current view?

**Recommendation:** NO - Hidden elements not selectable in that view
- Prevents confusion (selecting invisible elements)
- User must switch to different view or unhide to select

**Exception:** Plan view can select all elements (even if hidden in elevations)

---

### 5. Duplicate View Behavior
**Question:** When duplicating elevation view, copy hidden_elements?

**Current Implementation:** YES - `duplicateElevationView()` copies hidden_elements

**Recommendation:** KEEP - Makes sense for creating variations
- User can then show/hide additional elements in duplicate

---

### 6. Cross-View References
**Question:** Show indicator in plan view for elements hidden in elevations?

**Recommendation:** YES (Phase 3) - Visual feedback helpful
- Small "eye" icon with slash in plan view
- Tooltip: "Hidden in: front-default, left-dup1"

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance (filtering many elements) | Low | Low | Filter is simple array.includes() - very fast |
| Database migration needed | None | None | Schema already supports hidden_elements |
| Breaking existing views | Low | Medium | Existing views have empty hidden_elements (no change) |
| User confusion (hide vs delete) | Medium | Medium | Clear UI labeling + tooltips |
| Orphaned hidden element IDs | Low | Low | Graceful handling if element deleted globally |

---

## Testing Strategy

### Unit Tests
- `isElementVisibleInView()` - All scenarios (plan, elevation, hidden, visible)
- `toggleElementVisibility()` - Add/remove from hidden_elements array

### Integration Tests
1. Hide element in front view → still visible in back view
2. Hide element in duplicated view → original view unaffected
3. Delete view → hidden_elements lost (expected)
4. Duplicate view → hidden_elements copied
5. Hide multiple elements → all filtered correctly
6. Show previously hidden element → renders immediately

### Manual Testing Checklist
- [ ] Hide base cabinet in front elevation → still visible in plan
- [ ] Hide wall cabinet in front elevation → still visible in back elevation
- [ ] Hide element in front-default → still visible in front-dup1
- [ ] Show hidden element → renders immediately
- [ ] Delete element globally → removed from all views (including hidden_elements)
- [ ] Switch between views → filtering updates correctly
- [ ] Refresh page → hidden state persists from database
- [ ] PropertiesPanel button only shows in elevation views
- [ ] Button label changes based on current visibility state

---

## Code Locations Reference

### Files to Modify (Priority Order)

1. **[src/components/designer/DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx)**
   - Line ~1200+: Add filtering before rendering loop
   - Priority: HIGH

2. **[src/pages/Designer.tsx](../src/pages/Designer.tsx)**
   - Add `handleToggleVisibility()` function
   - Pass to PropertiesPanel as prop
   - Priority: HIGH

3. **[src/components/designer/PropertiesPanel.tsx](../src/components/designer/PropertiesPanel.tsx)**
   - Lines 671-688: Add hide/show button
   - Receive `onToggleVisibility` prop
   - Priority: HIGH

4. **[src/components/designer/ViewSelector.tsx](../src/components/designer/ViewSelector.tsx)** (Optional)
   - Add bulk hide operations to context menu
   - Priority: LOW (Phase 4)

### Files Already Correct (No Changes Needed)

✅ `src/types/project.ts` - Data structure complete
✅ `src/utils/elevationViewHelpers.ts` - Helper functions complete
✅ `src/contexts/ProjectContext.tsx` - State management works

---

## Estimated Effort Breakdown

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase 1** | Wire up rendering filters | 2 hours |
| **Phase 2** | Add UI controls + handlers | 2 hours |
| **Phase 3** | Visual feedback indicators | 1 hour |
| **Phase 4** | Bulk operations (optional) | 1 hour |
| **Testing** | Manual + automated testing | 1 hour |
| **Documentation** | Update user docs | 0.5 hours |
| **Total** | All phases | **4-6 hours** |

**Core Feature (Phases 1-2):** 4 hours
**Complete Feature (All Phases):** 7.5 hours

---

## Recommendation

### ✅ PROCEED WITH IMPLEMENTATION

**Reasons:**
1. **Infrastructure exists** - 70% of code already written
2. **Low risk** - No database migration, no breaking changes
3. **High value** - Solves real user pain point
4. **Clean architecture** - Fits existing patterns perfectly
5. **Fast implementation** - 4 hours for core feature

**Suggested Approach:**
1. Implement Phase 1 + Phase 2 (core feature) - 4 hours
2. Test with user - gather feedback
3. Implement Phase 3 if needed - 1 hour
4. Phase 4 is optional enhancement for later

---

## Alternative Approaches Considered

### Alternative 1: Per-Element Visibility Flags ❌
**Approach:** Add `visible_in_views: string[]` to each DesignElement

**Pros:**
- Element owns its visibility state
- No separate hidden_elements array

**Cons:**
- Requires modifying every element in database
- More complex state updates
- Harder to bulk-hide elements in a view

**Verdict:** REJECTED - Current approach is cleaner

---

### Alternative 2: Separate "Hidden Elements" Collection ❌
**Approach:** Create `hidden_elements` database table

**Pros:**
- Normalized database design
- Easy to query which elements hidden where

**Cons:**
- Additional database table to maintain
- More complex queries
- Over-engineering for simple feature

**Verdict:** REJECTED - JSONB array sufficient

---

### Alternative 3: View-Specific Element Lists ❌
**Approach:** Each view has its own `visible_elements` array (whitelist instead of blacklist)

**Pros:**
- Explicit about what's visible

**Cons:**
- Default behavior is "show nothing" (bad UX)
- Requires adding every element ID to every view
- More storage space

**Verdict:** REJECTED - Hidden elements blacklist is better

---

## Next Steps

**Immediate Actions:**
1. ✅ Get user approval on approach
2. ⏳ Implement Phase 1 (rendering filters)
3. ⏳ Implement Phase 2 (UI controls)
4. ⏳ User testing + feedback
5. ⏳ Phase 3/4 if needed

**Questions for User:**
1. Should 3D view also support per-view hiding? (Recommendation: No)
2. Should plan view show indicators for hidden elements? (Recommendation: Yes, Phase 3)
3. Priority for bulk operations (Phase 4)? (Recommendation: Later)

---

**Document Status:** 📋 COMPLETE - Ready for User Review
**Recommendation:** ✅ PROCEED - High viability, low risk, high value
