# Visibility System Status Report - 2025-10-18

**Date:** 2025-10-18
**Branch:** feature/view-specific-visibility
**Session:** Continued after context overflow

---

## Summary of Work Completed

### ✅ Issue #1: Plan View Visibility Filter Bypass (FIXED)
**Commit:** 0945088

**Problem:**
- Visibility toggle UI worked correctly
- State was updated properly (hidden_elements array populated)
- BUT: Elements remained visible on canvas in plan view

**Root Cause:**
```typescript
// Line 1948 in DesignCanvas2D.tsx (before fix)
let elementsToRender = active2DView === 'plan'
  ? design.elements  // ❌ Bypassed filter completely!
  : design.elements.filter(el => { ... hidden_elements check ... })
```

**Fix:**
- Unified filtering logic for all views
- Plan view now filters by `hidden_elements` (no direction filtering needed)
- Elevation views filter by direction AND `hidden_elements`
- Applied fix to 4 locations: render, selection, hover, touch

**Result:** ✅ Plan view visibility toggle now works correctly

---

### ✅ Issue #2: 3D View Visibility Filtering (FIXED)
**Commit:** d9fe599

**Problem:**
- 3D view showed all elements regardless of visibility toggle state
- No integration with `elevationViews` system

**Root Cause:**
- `AdaptiveView3D` did not receive `elevationViews` prop
- `visibleElements` useMemo only filtered by performance limits, not visibility
- Missing prop chain: Designer.tsx → Lazy3DView → AdaptiveView3D

**Fix:**
1. Added `elevationViews` prop to `Lazy3DView` interface
2. Added `elevationViews` prop to `AdaptiveView3D` interface
3. Updated `visibleElements` useMemo to filter by `hidden_elements` from '3d' view config
4. Wired prop through component chain
5. Added debug logging

**Result:** ✅ 3D view now respects per-view visibility

---

### ✅ Global isVisible Field Removal (COMPLETED)
**Commits:** 365ccab (debug logging), 0945088 (fix), 786044d (docs)

**Completed:**
- Identified and commented out all 18 references to `isVisible` field
- Verified TypeScript compilation passes (field truly optional)
- Documented removal process for rollback safety
- All views now use per-view `hidden_elements` arrays exclusively

---

## Remaining Issues

### ⏳ Issue #3: Element Selector Visual Indicators (TODO)

**User Report:**
> "its really hard to see what has been made invisible as the element selector doesn't tell you and the properties only open when the item is selected"

**Problem:**
- CanvasElementCounter (element picker) shows all elements
- No visual indication of which elements are hidden in current view
- User must select element to see visibility state in Properties Panel
- Difficult to track which elements are visible/hidden without clicking each one

**Proposed Solution:**

Add visual indicators to CanvasElementCounter showing visibility state:

```typescript
// In element list rendering:
{categoryElements.map((element) => {
  const isSelected = selectedElement?.id === element.id;
  const isHidden = isElementHiddenInCurrentView(element.id); // NEW

  return (
    <div className={`
      ${isSelected ? 'bg-primary/10' : ''}
      ${isHidden ? 'opacity-50' : ''} // Visual dimming
    `}>
      {/* Element info */}

      {/* NEW: Visibility indicator badge */}
      {isHidden && (
        <Badge variant="secondary" className="text-xs">
          <EyeOff className="h-3 w-3" />
          Hidden
        </Badge>
      )}
    </div>
  );
})}
```

**Implementation Steps:**
1. Add `active2DView` and `elevationViews` props to CanvasElementCounter
2. Create helper function `isElementHiddenInCurrentView(elementId)`
3. Add opacity styling to hidden elements (50% opacity or grayed out)
4. Add "Hidden" badge or eye-off icon next to hidden elements
5. Optionally: Add filter dropdown to show/hide hidden elements in list

**Files to Modify:**
- `src/components/designer/CanvasElementCounter.tsx`
- Wire new props from `Designer.tsx` (already has these values)

---

### ⏳ Issue #4: Element Resizing After Load (TODO)

**User Report:**
> "we are still getting size changes of appliances and wall units after load. when flipping through the elevation views, the components load then change, for example the wall units grow in height after they initially load on screen"

**Observed Behavior:**
- Elements appear at one size initially
- Then "jump" or "resize" to different dimensions
- Particularly affects wall units and appliances
- Happens when switching between elevation views

**Suspected Root Causes:**

1. **Asynchronous Component Behavior Loading:**
   - ComponentService loads behaviors async
   - Initial render uses fallback/default dimensions
   - Second render applies real dimensions from component data

2. **Default Dimension Fallbacks:**
   ```typescript
   // Found in multiple locations:
   const depth = element.depth ?? 60; // Default fallback
   const height = element.height ?? 90; // Default fallback
   ```

3. **Multiple Render Passes:**
   - Console logs showed duplicate renders (React StrictMode in dev)
   - First render: incomplete data
   - Second render: complete data

**Investigation Required:**

1. **Trace Component Data Loading:**
   - Check when `ComponentService.getComponentBehavior()` is called
   - Verify if element dimensions are populated before first render
   - Add logging to track dimension changes

2. **Check for Race Conditions:**
   - Does component data load after element is already rendered?
   - Are fallback values being used when real values exist?

3. **Review Render Triggers:**
   - What causes the second render with different dimensions?
   - Is this specific to elevation views or all views?

**Potential Fixes:**

1. **Preload Component Data:**
   ```typescript
   // Ensure all component behaviors loaded before rendering
   useEffect(() => {
     const preload = async () => {
       await Promise.all(
         design.elements.map(el =>
           ComponentService.getComponentBehavior(el.type, el.style)
         )
       );
       setDataReady(true);
     };
     preload();
   }, [design.elements]);

   if (!dataReady) return <LoadingSpinner />;
   ```

2. **Remove Fallback Defaults:**
   - Ensure elements always have real dimensions from creation
   - Don't render until dimensions are known

3. **Optimize Render Passes:**
   - Memoize expensive calculations
   - Prevent unnecessary re-renders

**Files to Investigate:**
- `src/components/designer/DesignCanvas2D.tsx` - Rendering logic
- `src/components/designer/AdaptiveView3D.tsx` - 3D rendering
- `src/services/ComponentService.ts` - Component behavior loading
- `src/components/3d/EnhancedModels3D.tsx` - 3D model components

**Next Steps:**
1. Add detailed logging to track dimension changes
2. Profile component render cycles
3. Identify exact point where dimensions change
4. Implement fix based on findings

---

## Debug Logging Currently Active

### Visibility Toggle Debugging:
**Location:** `src/pages/Designer.tsx` lines 373-390

**Markers:** `🔍 [VISIBILITY DEBUG]`

**Logs:**
- Toggle request (elementId, viewId)
- Current elevationViews state (full JSON)
- Visibility check result
- Updated elevationViews (full JSON)
- Database update confirmation

### Canvas Rendering Debugging:
**Location:** `src/components/designer/DesignCanvas2D.tsx` lines 1941-1971

**Markers:** `🎨 [CANVAS DEBUG]`

**Logs:**
- currentViewInfo (direction, hiddenElements, active2DView, totalElements)
- Each element filtered by direction
- Each element filtered by hidden_elements
- Final count of elements to render

### 3D View Debugging:
**Location:** `src/components/designer/AdaptiveView3D.tsx` lines 488-510

**Markers:** `🎨 [3D VIEW DEBUG]`

**Logs:**
- Total elements before filtering
- hidden_elements array from 3D view config
- Each element hidden in 3D view
- Elements after visibility filter
- Elements after performance limit

---

## Testing Checklist

### ✅ Completed Tests:

- [x] Plan view visibility toggle works
- [x] Elevation view visibility toggle works
- [x] 3D view visibility filter applied
- [x] Per-view independence (hiding in one view doesn't affect others)
- [x] TypeScript compilation passes

### ⏳ Pending Tests:

- [ ] Element selector shows visual indicators for hidden elements
- [ ] Element dimensions stable on first render (no jumping)
- [ ] Element dimensions consistent across view switches
- [ ] Console has no errors or warnings
- [ ] Performance acceptable with many elements

---

## Architecture Summary

### Current Per-View Visibility System:

```
ElevationViewConfig {
  id: 'plan' | 'front-default' | 'back-default' | 'left-default' | 'right-default' | '3d'
  direction: 'plan' | 'front' | 'back' | 'left' | 'right' | '3d'
  label: string
  hidden_elements: string[]  // Array of element IDs hidden in this view
  is_default: boolean
  sort_order: number
}
```

### Data Flow:

```
1. User clicks "Hide in This View" in PropertiesPanel
   ↓
2. handleToggleElementVisibility() in Designer.tsx
   ↓
3. toggleElementVisibility() helper function
   ↓
4. Updates elevationViews state array
   ↓
5. Saves to database (design_settings.elevation_views)
   ↓
6. Canvas components re-render with new elevationViews prop
   ↓
7. Filtering applied:
   - Plan View: filter by hidden_elements only
   - Elevation Views: filter by direction AND hidden_elements
   - 3D View: filter by hidden_elements only
   ↓
8. Element disappears from canvas ✅
```

### Files Involved:

**State Management:**
- `src/pages/Designer.tsx` - elevationViews state, toggle handler

**Helper Functions:**
- `src/utils/elevationViewHelpers.ts` - Toggle, check visibility, manage views

**Rendering Components:**
- `src/components/designer/DesignCanvas2D.tsx` - 2D filtering (plan + elevations)
- `src/components/designer/AdaptiveView3D.tsx` - 3D filtering
- `src/components/designer/Lazy3DView.tsx` - 3D wrapper (passes props)

**UI Components:**
- `src/components/designer/PropertiesPanel.tsx` - Hide/Show button
- `src/components/designer/ViewSelector.tsx` - View switching, shows hidden count
- `src/components/designer/CanvasElementCounter.tsx` - Element list (needs visual indicators)

**Type Definitions:**
- `src/types/project.ts` - ElevationViewConfig interface

---

## Files Modified This Session

**Commits:**
- `365ccab` - Added debug logging
- `0945088` - Fixed plan view visibility filter bypass
- `786044d` - Bug fix documentation
- `d9fe599` - Wired 3D view visibility filtering

**Files Changed:**
- `src/pages/Designer.tsx` (debug logging, 3D prop)
- `src/components/designer/DesignCanvas2D.tsx` (unified filtering logic, debug logging)
- `src/components/designer/AdaptiveView3D.tsx` (visibility filtering, debug logging)
- `src/components/designer/Lazy3DView.tsx` (elevationViews prop)
- `docs/VISIBILITY-RENDERING-INVESTIGATION.md` (investigation report)
- `docs/BUG-FIX-PLAN-VIEW-VISIBILITY.md` (bug analysis)
- `docs/VISIBILITY-SYSTEM-STATUS-2025-10-18.md` (this document)

---

## Next Session Priorities

1. **Add visual indicators to element selector** (Issue #3)
   - Estimated effort: 1-2 hours
   - Impact: High (usability improvement)
   - Complexity: Low

2. **Investigate element resizing issue** (Issue #4)
   - Estimated effort: 2-4 hours
   - Impact: Medium (visual polish)
   - Complexity: Medium-High (requires profiling)

3. **Remove debug logging** (cleanup)
   - Estimated effort: 30 minutes
   - After testing confirms everything works

4. **Merge to main** (if ready)
   - After all issues resolved
   - After user acceptance testing

---

## Status: 🟢 Major Functionality Working

**What Works:**
- ✅ Per-view visibility toggle in plan view
- ✅ Per-view visibility toggle in elevation views
- ✅ Per-view visibility toggle in 3D view
- ✅ Independent visibility per view
- ✅ State persistence to database

**What Needs Improvement:**
- ⏳ Visual indicators in element selector
- ⏳ Element resize/jump on load issue

**Overall Progress:** 75% Complete
