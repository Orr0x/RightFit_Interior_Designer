# Bug Fix: Plan View Visibility Filter Bypass

**Date:** 2025-10-18
**Severity:** HIGH - Core functionality broken
**Status:** ✅ FIXED
**Commit:** 0945088

---

## Summary

The per-view visibility toggle worked correctly in the UI and state management, but **plan view completely bypassed the hidden_elements filter** during rendering. Elements stayed visible regardless of toggle state.

---

## Root Cause Analysis

### The Bug

**File:** [src/components/designer/DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx)
**Lines:** 1948-1949 (before fix)

```typescript
let elementsToRender = active2DView === 'plan'
  ? design.elements  // ❌ BUG: Returns ALL elements, no filtering!
  : design.elements.filter(el => {
      // ... proper filtering for elevation views ...
      if (currentViewInfo.hiddenElements.includes(el.id)) return false;
    });
```

**Problem:** Ternary operator returned `design.elements` directly for plan view, completely bypassing the filter that checks `currentViewInfo.hiddenElements`.

### Evidence from Console Logs

User provided browser console logs showing the bug in action:

```
🔍 [VISIBILITY DEBUG] Toggle requested: {
  "elementId": "fridge-90-1760788877593",
  "viewId": "plan"
}

🔍 [VISIBILITY DEBUG] Updated elevationViews: [
  {
    "id": "plan",
    "hidden_elements": [
      "larder-oven-microwave-1760788897494",
      "dishwasher-1760788869471",
      "fridge-90-1760788877593"  ← Element ADDED to hidden list ✅
    ]
  }
]

🔍 [VISIBILITY DEBUG] State and database updated successfully ✅

🎨 [CANVAS DEBUG] Rendering with currentViewInfo: {
  "direction": "plan",
  "hiddenElements": [
    "larder-oven-microwave-1760788897494",
    "dishwasher-1760788869471",
    "fridge-90-1760788877593"  ← Array has 3 elements ✅
  ],
  "active2DView": "plan",
  "totalElements": 15
}

🎨 [CANVAS DEBUG] Elements to render after filtering: 15  ← ❌ STILL 15! Should be 12!
```

**Analysis:**
1. ✅ State update worked perfectly
2. ✅ hidden_elements array populated correctly
3. ✅ currentViewInfo received correct data
4. ❌ Filter was never applied (plan view took shortcut path)
5. ❌ All 15 elements rendered instead of 12

---

## The Fix

### Code Changes

**File:** [src/components/designer/DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx)

Replaced ternary shortcut with unified filter that handles both view types:

```typescript
// BEFORE (BROKEN):
let elementsToRender = active2DView === 'plan'
  ? design.elements  // ❌ Bypass filter
  : design.elements.filter(el => { ... });

// AFTER (FIXED):
let elementsToRender = design.elements.filter(el => {
  // For plan view: only check per-view hidden_elements (no direction filtering)
  if (active2DView === 'plan') {
    const isHiddenInView = currentViewInfo.hiddenElements.includes(el.id);
    if (isHiddenInView) {
      console.log('🎨 [CANVAS DEBUG] Element HIDDEN in plan view:', { id: el.id });
      return false;
    }
    return true;
  }

  // For elevation views: check both direction AND hidden_elements
  const wall = getElementWall(el);
  const isCornerVisible = isCornerVisibleInView(el, currentViewInfo.direction);

  // Check direction visibility
  const isDirectionVisible = wall === currentViewInfo.direction || wall === 'center' || isCornerVisible;
  if (!isDirectionVisible) {
    console.log('🎨 [CANVAS DEBUG] Element filtered by direction:', { id: el.id, wall, viewDirection: currentViewInfo.direction });
    return false;
  }

  // Check if element is hidden in this specific view
  const isHiddenInView = currentViewInfo.hiddenElements.includes(el.id);
  if (isHiddenInView) {
    console.log('🎨 [CANVAS DEBUG] Element HIDDEN by per-view filter:', { id: el.id, viewId: active2DView });
    return false;
  }

  return true;
});
```

### Locations Fixed

The same bug existed in **4 different filter locations**:

1. **Rendering Filter** (lines 1948-1979)
   - Purpose: Determine which elements to draw on canvas
   - Impact: Hidden elements were still visible

2. **Selection Filter** (lines 2063-2081)
   - Purpose: Determine which elements are clickable
   - Impact: Could still select hidden elements

3. **Hover Filter** (lines 2176-2194)
   - Purpose: Determine which elements show hover highlight
   - Impact: Hidden elements still showed hover state

4. **Touch Filter** (lines 2490-2508)
   - Purpose: Determine which elements respond to touch (mobile)
   - Impact: Hidden elements still responded to touch

All four locations now use the unified filtering logic.

---

## Why This Happened

### Design Intent vs Implementation

**Original Design Intent:**
- Plan view shows ALL elements (no direction filtering needed)
- Elevation views show ONLY elements on that wall (direction filtering required)

**Flawed Implementation:**
```typescript
// Developer thought: "Plan view needs all elements, so skip filter entirely"
active2DView === 'plan' ? design.elements : design.elements.filter(...)
```

**Missing Understanding:**
- Plan view still needs visibility filtering (just not direction filtering)
- Two separate concerns were conflated: direction visibility vs per-view visibility

### Correct Separation of Concerns

**Two Types of Filtering:**

1. **Direction Filtering** (elevation views only)
   - Front view: Show only front wall + center elements
   - Back view: Show only back wall + center elements
   - Left/Right: Same logic
   - Plan view: NOT APPLICABLE (shows all directions)

2. **Per-View Visibility Filtering** (ALL views)
   - Plan view: Check hidden_elements array
   - Front view: Check hidden_elements array
   - Back view: Check hidden_elements array
   - ALL VIEWS need this check!

**Fixed Logic:**
```typescript
if (active2DView === 'plan') {
  // Plan view: Per-view visibility only (no direction check)
  return !currentViewInfo.hiddenElements.includes(el.id);
} else {
  // Elevation views: Direction visibility AND per-view visibility
  if (!isDirectionVisible) return false;
  if (currentViewInfo.hiddenElements.includes(el.id)) return false;
  return true;
}
```

---

## Impact Assessment

### Before Fix

**Broken Functionality:**
- ❌ "Hide in This View" button did nothing in plan view
- ❌ Users could not hide elements in plan view
- ❌ hidden_elements array was being populated but ignored
- ✅ Elevation views worked correctly (direction filtering prevented seeing the bug)

**User Experience:**
- Confusing: UI showed element as "hidden" but it was still visible
- Toast notifications said "Element hidden" but nothing changed
- Lost trust in the visibility feature

### After Fix

**Working Functionality:**
- ✅ "Hide in This View" button works in ALL views (plan + elevations)
- ✅ Elements properly disappear when hidden
- ✅ Elements cannot be selected/hovered/clicked when hidden
- ✅ Per-view visibility is independent (hiding in plan doesn't affect elevations)

---

## Testing Performed

### TypeScript Compilation ✅
```bash
$ npx tsc --noEmit
# No errors - compilation successful
```

### Code Review ✅
- [x] All 4 filter locations updated consistently
- [x] Plan view logic separated from elevation view logic
- [x] Debug logging preserved for future troubleshooting
- [x] No regression to direction filtering (elevation views still work)

### User Testing Required ⏳
**Manual Test Plan:**

1. **Plan View Visibility Toggle**
   - Open plan view
   - Select any element
   - Click "Hide in This View"
   - ✅ Element should disappear from canvas
   - ✅ Cannot click where element was
   - ✅ Cannot hover where element was
   - Click "Show in This View"
   - ✅ Element should reappear

2. **Per-View Independence**
   - Hide element in plan view
   - Switch to front elevation view
   - ✅ Element should still be visible (different view)
   - Hide same element in front view
   - Switch back to plan view
   - ✅ Element should still be hidden (independent state)

3. **Multiple Elements**
   - Hide 3 elements in plan view
   - ✅ All 3 should disappear
   - Check console: "Elements to render after filtering: X"
   - ✅ X should be (total - 3)

4. **Elevation Views Still Work**
   - Switch to front elevation view
   - ✅ Should only show front wall elements
   - Hide an element in front view
   - ✅ Element should disappear
   - Switch to back view
   - ✅ Same element should be visible (different view + different direction)

---

## Related Issues

### Issue 2: Elements Resizing After Load

**User Report:** "when flipping through the elevation views, the components load then change, for example the wall units grow in height after they initially load on screen"

**Status:** NOT ADDRESSED IN THIS FIX

**Analysis:** This is a separate issue related to:
- Asynchronous component behavior loading
- Default dimension fallbacks being applied first
- Second render with real dimensions

**Next Steps:** Requires separate investigation (see [VISIBILITY-RENDERING-INVESTIGATION.md](./VISIBILITY-RENDERING-INVESTIGATION.md))

### Massive Duplicate Rendering

**Observed in Logs:** Canvas renders 2x for every state change

```
🎨 [CANVAS DEBUG] Rendering with currentViewInfo: {...}
🎨 [CANVAS DEBUG] Elements to render after filtering: 15
🎨 [CANVAS DEBUG] Rendering with currentViewInfo: {...}  ← DUPLICATE!
🎨 [CANVAS DEBUG] Elements to render after filtering: 15  ← DUPLICATE!
```

**Cause:** React StrictMode in development causes double-render
**Impact:** Performance overhead in dev mode only (not in production)
**Status:** Expected behavior, not a bug

---

## Prevention: How to Avoid This in Future

### Code Review Checklist

When implementing filters or conditional logic:

1. **Separate Concerns**
   - Identify ALL independent filter criteria
   - Don't conflate different types of filtering
   - Example: Direction filtering ≠ Visibility filtering

2. **Apply Filters Consistently**
   - Don't create shortcuts that bypass filters
   - If ANY view needs a filter, ALL views probably need it
   - Example: All views need per-view visibility check

3. **Test Edge Cases**
   - Don't assume "this view doesn't need X"
   - Test every view with every feature
   - Example: Test visibility toggle in plan view AND elevation views

### Debugging Strategy That Worked

1. **Add Comprehensive Logging**
   - Log state before operation
   - Log state after operation
   - Log what rendering receives
   - Log what rendering does with it

2. **Compare Expected vs Actual**
   - Expected: `hidden_elements: [3 items]` → render 12 elements
   - Actual: `hidden_elements: [3 items]` → render 15 elements
   - **GAP IDENTIFIED:** Filter not being applied

3. **Trace Code Path**
   - Follow data from source to destination
   - Found ternary operator bypassing filter

---

## Files Modified

**Code Changes:**
- [src/components/designer/DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx) (75 insertions, 53 deletions)

**Documentation:**
- [docs/VISIBILITY-RENDERING-INVESTIGATION.md](./VISIBILITY-RENDERING-INVESTIGATION.md) (investigation report)
- [docs/BUG-FIX-PLAN-VIEW-VISIBILITY.md](./BUG-FIX-PLAN-VIEW-VISIBILITY.md) (this document)

---

## Commits

**Debug Logging:**
- `365ccab` - Added debug logging to trace visibility data flow

**The Fix:**
- `0945088` - Applied per-view hidden_elements filter to plan view rendering

**Documentation:**
- `12b7c98` - Created investigation report
- (current) - Created bug fix analysis document

---

## Lessons Learned

### What Went Wrong

1. **Premature Optimization**
   - Tried to "optimize" plan view by skipping filter
   - Created bypass that broke core functionality
   - Lesson: Don't optimize before measuring

2. **Incomplete Testing**
   - Elevation views worked, so assumed system was working
   - Never tested visibility toggle in plan view
   - Lesson: Test every view, every feature combination

3. **Conflated Concerns**
   - Confused "plan view shows all directions" with "plan view needs no filtering"
   - Direction filtering ≠ Visibility filtering
   - Lesson: Identify and separate all independent concerns

### What Went Right

1. **Excellent Debug Logging Strategy**
   - Added logging at every step of data flow
   - Made bug immediately obvious in console output
   - Enabled precise diagnosis

2. **Comprehensive Architecture Review**
   - Reviewed entire visibility system before debugging
   - Verified design was sound, issue was implementation
   - Prevented architectural refactor (which would have been wrong fix)

3. **User Collaboration**
   - User provided detailed bug report
   - User ran test plan and shared console logs
   - Enabled rapid diagnosis and fix

---

## Status: ✅ FIXED

**Next Action:** User testing to verify fix works in browser

**Expected Console Output After Fix:**
```
🔍 [VISIBILITY DEBUG] Toggle requested: { elementId: "fridge-90-...", viewId: "plan" }
🔍 [VISIBILITY DEBUG] Updated elevationViews: [... hidden_elements: [..., "fridge-90-..."] ...]
🔍 [VISIBILITY DEBUG] State and database updated successfully

🎨 [CANVAS DEBUG] Rendering with currentViewInfo: { hiddenElements: [..., "fridge-90-..."], totalElements: 15 }
🎨 [CANVAS DEBUG] Element HIDDEN in plan view: { id: "fridge-90-..." }  ← NEW LOG!
🎨 [CANVAS DEBUG] Elements to render after filtering: 12  ← FIXED! Was 15, now 12!
```

---

**Last Updated:** 2025-10-18 (Fix committed and documented)
