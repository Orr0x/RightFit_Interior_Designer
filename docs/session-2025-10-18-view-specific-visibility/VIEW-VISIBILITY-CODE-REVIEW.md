# View-Specific Visibility - Critical Code Review
**Date:** 2025-10-18
**Status:** 🔴 CRITICAL BUGS FOUND - System Partially Broken

---

## Executive Summary

**User-Reported Issues:**
1. ✅ "element selector visible on 3D view but doesn't affect what is visible in 3D"
2. ✅ "selector is still a global setting - if you make something invisible in one view it changes the others"

**Investigation Results:**
- ✅ Bug 1 CONFIRMED: 3D view completely ignores `elevationViews.hidden_elements`
- ✅ Bug 2 CONFIRMED: PropertiesPanel uses wrong view ID when in 3D view
- ✅ Per-view independence WORKS for 2D views (plan, elevations)
- 🔴 Per-view independence BROKEN for 3D view

**Root Causes:**
1. `AdaptiveView3D` has zero integration with `elevationViews` filtering system
2. `PropertiesPanel` doesn't know which view user is in (missing `activeView` prop)
3. `active2DView` typed incorrectly (narrow union instead of string)

**Complexity Assessment:** MEDIUM-HIGH
- 2D filtering already works perfectly (no changes needed)
- Need to wire 3D view into existing filtering architecture
- Need to fix view ID routing from Designer → PropertiesPanel

**Recommendation:** FIX AND CONTINUE (not rethink)
- Architecture is sound (proven by working 2D filtering)
- Issues are implementation gaps, not design flaws
- Estimated fix: 2-3 hours

---

## Bug 1: 3D View Ignores hidden_elements Filter

### Current State: AdaptiveView3D.tsx

**Location:** `src/components/designer/AdaptiveView3D.tsx` (lines 476-483)

```typescript
// ❌ BROKEN: No per-view filtering
const visibleElements = useMemo(() => {
  if (!design?.elements) return [];

  // Only filters by performance (maxElements), NOT by hidden_elements!
  const maxElements = currentQuality?.maxElements || 100;
  return design.elements.slice(0, maxElements);
  //     ↑ Returns ALL elements, never filters hidden_elements
}, [design?.elements, currentQuality?.maxElements]);
```

**What Happens:**
1. User clicks "Hide in This View" in 3D view
2. PropertiesPanel calls `handleToggleElementVisibility(elementId, viewId)`
3. `viewId` is wrong (uses `active2DView` instead of '3d') → see Bug 2
4. Even if `viewId` was correct, AdaptiveView3D never receives `elevationViews` prop
5. Element continues rendering in 3D because `visibleElements` never checks `hidden_elements`

**Why It's Broken:**
- No `elevationViews` prop passed to AdaptiveView3D
- No filtering logic in `visibleElements` memo
- Element render loop doesn't check if element is hidden

### Proof: Working 2D Implementation (DesignCanvas2D)

**Location:** `src/components/designer/DesignCanvas2D.tsx` (lines 318-344, 1941-1955)

```typescript
// ✅ CORRECT: Extracts hidden_elements from current view config
const currentViewInfo = React.useMemo(() => {
  const views = elevationViews || getElevationViews();
  const currentView = views.find(v => v.id === active2DView);

  if (currentView) {
    return {
      direction: currentView.direction,
      hiddenElements: currentView.hidden_elements || []  // ✅ Gets per-view list
    };
  }
  // ... fallback ...
}, [active2DView, elevationViews]);

// ✅ CORRECT: Filters elements before rendering
let elementsToRender = active2DView === 'plan'
  ? design.elements
  : design.elements.filter(el => {
      // ... direction checks ...

      // ✅ CORRECT: Checks this specific view's hidden_elements
      if (currentViewInfo.hiddenElements.includes(el.id)) return false;

      return true;
    });
```

**What We Need in AdaptiveView3D:**
```typescript
// ✅ NEEDED: Same pattern as DesignCanvas2D
const currentViewInfo = React.useMemo(() => {
  const views = elevationViews || getElevationViews();
  const view3d = views.find(v => v.id === '3d');
  return {
    hiddenElements: view3d?.hidden_elements || []
  };
}, [elevationViews]);

const visibleElements = useMemo(() => {
  if (!design?.elements) return [];

  // ✅ NEEDED: Filter by hidden_elements FIRST
  return design.elements
    .filter(el => !currentViewInfo.hiddenElements.includes(el.id))
    .slice(0, currentQuality?.maxElements || 100);  // Then performance limit
}, [design?.elements, currentViewInfo.hiddenElements, currentQuality?.maxElements]);
```

---

## Bug 2: Wrong View ID Passed to Toggle Handler

### Current State: PropertiesPanel Logic

**Location:** `src/components/designer/PropertiesPanel.tsx` (lines 127-139)

```typescript
// ❌ CRITICAL BUG: Always uses active2DView, even when in 3D view!
const isElementHidden = (): boolean => {
  if (!selectedElement || !elevationViews) return false;
  const currentView = elevationViews.find(v => v.id === active2DView);
  //                                          Uses active2DView directly
  //                                          But what if activeView === '3d'?
  if (!currentView) return false;
  return currentView.hidden_elements?.includes(selectedElement.id) || false;
};

const handleToggleVisibility = () => {
  if (!selectedElement || !onToggleElementVisibility) return;
  onToggleElementVisibility(selectedElement.id, active2DView);
  //                                            ↑ WRONG when in 3D view!
};
```

**The Problem:**
When user is in 3D view:
- `activeView === '3d'` (Designer state)
- `active2DView === 'plan'` or `'front-default'` (whatever it was before switching to 3D)
- PropertiesPanel uses `active2DView` → modifies WRONG view's hidden_elements
- Element gets hidden in plan/elevation instead of 3D

**Example Scenario:**
```
1. User is in plan view
   - activeView = '2d'
   - active2DView = 'plan'

2. User switches to 3D view
   - activeView = '3d'
   - active2DView = 'plan' (unchanged!)

3. User selects element in 3D, clicks "Hide in This View"
   - PropertiesPanel calls: handleToggleElementVisibility(elementId, 'plan')
   - Modifies elevationViews['plan'].hidden_elements
   - Element hidden in PLAN view, not 3D view!

4. User switches back to plan view
   - Element is hidden there (unexpected!)
   - Element still visible in 3D (expected it to be hidden)
```

### Missing Designer → PropertiesPanel Prop

**Location:** `src/pages/Designer.tsx` (lines 1034-1043)

```typescript
<PropertiesPanel
  selectedElement={selectedElement}
  onUpdateElement={handleUpdateElement}
  roomDimensions={design.roomDimensions}
  onUpdateRoomDimensions={handleUpdateRoomDimensions}
  roomType={design.roomType}
  active2DView={active2DView}
  //          ↑ Only passes active2DView
  //          ❌ MISSING: activeView prop!
  elevationViews={elevationViews}
  onToggleElementVisibility={handleToggleElementVisibility}
/>
```

**What PropertiesPanel Needs:**
```typescript
interface PropertiesPanelProps {
  // ... existing props ...
  activeView: '2d' | '3d';           // ← MISSING!
  active2DView: View2DMode;
  elevationViews?: ElevationViewConfig[];
  onToggleElementVisibility?: (elementId: string, viewId: string) => void;
}
```

**Corrected Logic:**
```typescript
const getCorrectViewId = (): string => {
  // If in 3D view, return '3d'
  if (activeView === '3d') return '3d';

  // If in 2D view, return current 2D view ID
  return active2DView;
};

const handleToggleVisibility = () => {
  if (!selectedElement || !onToggleElementVisibility) return;
  onToggleElementVisibility(selectedElement.id, getCorrectViewId());
  //                                            ↑ CORRECT view ID
};
```

---

## Bug 3: Type System Doesn't Allow View IDs

### Current Type Definition

**Location:** `src/pages/Designer.tsx` (line 56)

```typescript
const [active2DView, setActive2DView] = useState<'plan' | 'front' | 'back' | 'left' | 'right'>('plan');
//                                                ↑ Narrow union - doesn't allow IDs like 'front-default'
```

**The Problem:**
- `active2DView` typed as literal string union
- Can't represent elevation view IDs: `'front-default'`, `'back-dup1'`, etc.
- ViewSelector passes these IDs but TypeScript complains

**Correct Type:**
```typescript
import type { View2DMode } from '@/components/designer/ViewSelector';

const [active2DView, setActive2DView] = useState<View2DMode>('plan');
//                                                ↑ View2DMode = 'plan' | string
```

---

## Data Flow Analysis

### Broken Flow: Hiding Element in 3D View

```
┌─────────────────────────────────────────────────────────────────┐
│ User in 3D View                                                 │
│ - activeView = '3d'                                             │
│ - active2DView = 'plan' (whatever it was before)                │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ User clicks "Hide in This View" button                          │
│ PropertiesPanel.handleToggleVisibility()                        │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ ❌ BUG: Uses active2DView instead of '3d'                       │
│ onToggleElementVisibility(elementId, 'plan')                    │
│                                          ↑ WRONG VIEW ID!       │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ Designer.handleToggleElementVisibility(elementId, 'plan')       │
│ toggleElementVisibility('plan', elementId, elevationViews)      │
│ Updates elevationViews['plan'].hidden_elements                  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ Database updated: design_settings.elevation_views               │
│ PLAN view hidden_elements: [..., elementId]                     │
│ 3D view hidden_elements: [] (unchanged)                         │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ ❌ RESULT: Element hidden in PLAN view (wrong!)                 │
│ ✓ RESULT: Element still visible in 3D view (wrong!)            │
└─────────────────────────────────────────────────────────────────┘
```

### Correct Flow: What Should Happen

```
┌─────────────────────────────────────────────────────────────────┐
│ User in 3D View                                                 │
│ - activeView = '3d'                                             │
│ - active2DView = (doesn't matter)                               │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ User clicks "Hide in This View" button                          │
│ PropertiesPanel.handleToggleVisibility()                        │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Uses activeView to determine view ID                │
│ const viewId = activeView === '3d' ? '3d' : active2DView        │
│ onToggleElementVisibility(elementId, '3d')                      │
│                                          ↑ CORRECT VIEW ID!     │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ Designer.handleToggleElementVisibility(elementId, '3d')         │
│ toggleElementVisibility('3d', elementId, elevationViews)        │
│ Updates elevationViews['3d'].hidden_elements                    │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ Database updated: design_settings.elevation_views               │
│ 3D view hidden_elements: [..., elementId]                       │
│ PLAN view hidden_elements: [] (unchanged)                       │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ AdaptiveView3D receives updated elevationViews                  │
│ Filters visibleElements by hidden_elements['3d']                │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ ✓ RESULT: Element hidden in 3D view only (correct!)            │
│ ✓ RESULT: Element visible in ALL other views (correct!)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Proof: 2D Per-View Independence Works

### Test Case: Hide Element in Front Elevation

```typescript
// User in front elevation view
// active2DView = 'front-default'

// 1. PropertiesPanel passes correct view ID
onToggleElementVisibility(elementId, 'front-default')  // ✅ Correct

// 2. Designer updates correct view config
elevationViews['front-default'].hidden_elements = [..., elementId]  // ✅ Correct

// 3. DesignCanvas2D filters per-view
currentViewInfo = {
  direction: 'front',
  hiddenElements: elevationViews['front-default'].hidden_elements  // ✅ Correct
}

// 4. Element filtered in front view only
if (currentViewInfo.hiddenElements.includes(elementId)) return false;  // ✅ Works

// 5. Other views unaffected
// - Plan view: elevationViews['plan'].hidden_elements = []
// - Back view: elevationViews['back-default'].hidden_elements = []
// All render element normally ✅ Correct
```

**Conclusion:** 2D filtering is 100% correct. Same architecture needs to be applied to 3D.

---

## Complexity Assessment

### What Works (No Changes Needed)

1. ✅ **Data Structure:** `ElevationViewConfig` supports all views (plan, elevations, 3D)
2. ✅ **Helper Functions:** `toggleElementVisibility()`, `isElementVisibleInView()` work correctly
3. ✅ **2D Filtering:** DesignCanvas2D perfectly implements per-view independence
4. ✅ **State Management:** Designer.tsx correctly updates `elevationViews` and persists to database
5. ✅ **UI Components:** PropertiesPanel button renders correctly

### What's Broken (Needs Fixes)

1. 🔴 **AdaptiveView3D:** No `elevationViews` prop, no filtering logic
2. 🔴 **PropertiesPanel:** Missing `activeView` prop, uses wrong view ID for 3D
3. 🔴 **Lazy3DView:** Doesn't pass through `elevationViews` to AdaptiveView3D
4. 🔴 **Designer.tsx:** Doesn't pass `activeView` to PropertiesPanel
5. 🟡 **Type System:** `active2DView` typed too narrowly

**Complexity Rating:** MEDIUM
- 2D system proves architecture works
- Just need to extend same pattern to 3D view
- No fundamental design issues
- Implementation gaps, not design flaws

---

## Fix Strategy

### Fix 1: Wire elevationViews to AdaptiveView3D (1 hour)

**Files to Modify:**
1. `src/pages/Designer.tsx` - Pass `elevationViews` to Lazy3DView
2. `src/components/designer/Lazy3DView.tsx` - Pass through to AdaptiveView3D
3. `src/components/designer/AdaptiveView3D.tsx` - Add filtering logic

**Changes:**
```typescript
// AdaptiveView3D.tsx
interface AdaptiveView3DProps {
  // ... existing props ...
  elevationViews?: ElevationViewConfig[];  // ← Add
}

const AdaptiveView3D: React.FC<AdaptiveView3DProps> = ({
  // ... existing props ...
  elevationViews
}) => {
  // Extract 3D view hidden_elements
  const currentViewInfo = React.useMemo(() => {
    const views = elevationViews || getElevationViews();
    const view3d = views.find(v => v.id === '3d');
    return {
      hiddenElements: view3d?.hidden_elements || []
    };
  }, [elevationViews]);

  // Filter elements before rendering
  const visibleElements = useMemo(() => {
    if (!design?.elements) return [];

    return design.elements
      .filter(el => !currentViewInfo.hiddenElements.includes(el.id))  // ← Add
      .slice(0, currentQuality?.maxElements || 100);
  }, [design?.elements, currentViewInfo.hiddenElements, currentQuality?.maxElements]);

  // ... rest of component ...
};
```

---

### Fix 2: Pass activeView to PropertiesPanel (30 min)

**Files to Modify:**
1. `src/pages/Designer.tsx` - Pass `activeView` prop
2. `src/components/designer/PropertiesPanel.tsx` - Receive and use `activeView`

**Changes:**
```typescript
// Designer.tsx
<PropertiesPanel
  selectedElement={selectedElement}
  onUpdateElement={handleUpdateElement}
  roomDimensions={design.roomDimensions}
  onUpdateRoomDimensions={handleUpdateRoomDimensions}
  roomType={design.roomType}
  activeView={activeView}          // ← Add
  active2DView={active2DView}
  elevationViews={elevationViews}
  onToggleElementVisibility={handleToggleElementVisibility}
/>

// PropertiesPanel.tsx
interface PropertiesPanelProps {
  // ... existing props ...
  activeView: '2d' | '3d';           // ← Add
  active2DView: View2DMode;
  elevationViews?: ElevationViewConfig[];
  onToggleElementVisibility?: (elementId: string, viewId: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  // ... existing props ...
  activeView,                        // ← Add
  active2DView,
  elevationViews,
  onToggleElementVisibility
}) => {
  // Determine correct view ID based on active view
  const getCurrentViewId = (): string => {
    return activeView === '3d' ? '3d' : active2DView;
  };

  // Check if element is hidden in CURRENT view
  const isElementHidden = (): boolean => {
    if (!selectedElement || !elevationViews) return false;
    const viewId = getCurrentViewId();                    // ← Change
    const currentView = elevationViews.find(v => v.id === viewId);
    if (!currentView) return false;
    return currentView.hidden_elements?.includes(selectedElement.id) || false;
  };

  // Toggle visibility in CURRENT view
  const handleToggleVisibility = () => {
    if (!selectedElement || !onToggleElementVisibility) return;
    const viewId = getCurrentViewId();                    // ← Change
    onToggleElementVisibility(selectedElement.id, viewId);
  };

  // ... rest of component ...
};
```

---

### Fix 3: Fix Type System (15 min)

**File to Modify:**
1. `src/pages/Designer.tsx`

**Change:**
```typescript
import type { View2DMode } from '@/components/designer/ViewSelector';

// Before
const [active2DView, setActive2DView] = useState<'plan' | 'front' | 'back' | 'left' | 'right'>('plan');

// After
const [active2DView, setActive2DView] = useState<View2DMode>('plan');
```

---

## Estimated Fix Time

| Fix | Complexity | Time | Priority |
|-----|------------|------|----------|
| Fix 1: Wire elevationViews to 3D | Medium | 1 hour | HIGH |
| Fix 2: Pass activeView to PropertiesPanel | Low | 30 min | HIGH |
| Fix 3: Fix type system | Low | 15 min | MEDIUM |
| **Testing** | - | 30 min | HIGH |
| **Total** | - | **2-3 hours** | - |

---

## Testing Checklist (After Fixes)

### 3D View Filtering
- [ ] Hide element in 3D view → element disappears from 3D only
- [ ] Show hidden element in 3D view → element reappears in 3D
- [ ] Element still visible in plan view when hidden in 3D
- [ ] Element still visible in elevations when hidden in 3D

### Per-View Independence
- [ ] Hide element in plan → hidden only in plan
- [ ] Hide element in front → hidden only in front
- [ ] Hide element in 3D → hidden only in 3D
- [ ] Hide same element in multiple views → independent lists
- [ ] Switch between views → visibility updates correctly

### State Persistence
- [ ] Hide element → refresh page → still hidden in that view
- [ ] Hide element → switch to different room → return → still hidden
- [ ] Database stores correct hidden_elements for each view

---

## Recommendation: FIX AND CONTINUE

### Why Not Rethink?

1. **Architecture is Sound:**
   - 2D filtering proves the design works
   - Data structure supports all views
   - Helper functions are correct
   - State management works

2. **Issues are Localized:**
   - Only 3 files need changes
   - No database migration needed
   - No fundamental design flaw
   - Just implementation gaps

3. **Low Risk:**
   - Changes are additive (not destructive)
   - Backward compatible
   - Can test incrementally
   - Easy to rollback if needed

4. **Fast to Fix:**
   - 2-3 hours total
   - Clear fix strategy
   - Known working pattern (copy from 2D)

### Alternative: Complete Rethink (NOT RECOMMENDED)

If we rethought the approach:
- Would need 8-12 hours minimum
- Risk breaking working 2D system
- Same data structure anyway
- Same helper functions
- Just different props/routing

**Conclusion:** Not worth it. Current architecture is good.

---

## Files That Need Changes

1. **`src/pages/Designer.tsx`**
   - Add `activeView` prop to PropertiesPanel
   - Add `elevationViews` prop to Lazy3DView
   - Fix `active2DView` type

2. **`src/components/designer/PropertiesPanel.tsx`**
   - Add `activeView` prop to interface
   - Add `getCurrentViewId()` helper
   - Update `isElementHidden()` to use correct view ID
   - Update `handleToggleVisibility()` to use correct view ID

3. **`src/components/designer/Lazy3DView.tsx`**
   - Add `elevationViews` prop to interface
   - Pass through to AdaptiveView3D

4. **`src/components/designer/AdaptiveView3D.tsx`**
   - Add `elevationViews` prop to interface
   - Add `currentViewInfo` memo (extract 3D hidden_elements)
   - Update `visibleElements` memo to filter by hidden_elements

---

## Conclusion

**Status:** 🔴 Two critical bugs confirmed

**Root Causes:**
- 3D view not integrated into filtering system
- PropertiesPanel missing activeView prop
- View ID routing broken for 3D

**Architecture:** ✅ SOUND (proven by working 2D system)

**Fix Complexity:** MEDIUM (2-3 hours)

**Recommendation:** **FIX AND CONTINUE**
- Don't rethink architecture
- Apply same pattern from 2D to 3D
- Add missing props/logic
- Test thoroughly

**Next Steps:**
1. User approves fix strategy
2. Implement Fix 1 (elevationViews to 3D)
3. Implement Fix 2 (activeView to PropertiesPanel)
4. Implement Fix 3 (type system)
5. Test all scenarios
6. Commit and document

---

**Status:** ✅ CODE REVIEW COMPLETE - Ready for User Decision
