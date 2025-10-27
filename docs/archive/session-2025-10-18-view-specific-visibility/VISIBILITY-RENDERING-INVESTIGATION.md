# Visibility & Rendering Issues Investigation

**Date:** 2025-10-18
**Branch:** feature/view-specific-visibility
**Reporter:** User
**Status:** 🔍 INVESTIGATION IN PROGRESS

---

## Issue Reports

### Issue 1: Visibility Toggle Not Working
**Symptom:** "the visibility toggle is in the properties panel and the toggle seems to work but the component stays visible regardless of the settings"

- UI button responds (changes from "Hide in This View" to "Show in This View")
- Toast notifications appear confirming action
- **BUT: Elements remain visible on canvas regardless of toggle state**

### Issue 2: Elements Loading Then Changing
**Symptom:** "when flipping through the elevation views, the components load then change, for example the wall units grow in height after they initially load on screen, this is also happening with some appliances"

- Elements appear at one size initially
- Then "jump" or "grow" to different dimensions
- Suggests asynchronous rendering or duplicate render passes
- Could indicate fallback values being applied, then real values loading

---

## Suspected Root Cause

**Hypothesis:** Duplicate or conflicting rendering code paths causing:
1. Visibility filters being bypassed or overridden
2. Multiple render passes with different data sources
3. State synchronization issues between React state and canvas rendering

---

## Investigation Plan

### Phase 1: Data Flow Tracing ✅ COMPLETE

**Added Debug Logging:**

1. **Designer.tsx - handleToggleElementVisibility** (lines 373-390)
   - Logs: Current `elevationViews` state before toggle
   - Logs: Visibility check result
   - Logs: Updated `elevationViews` after toggle
   - Logs: Database update confirmation
   - Markers: `🔍 [VISIBILITY DEBUG]`

2. **DesignCanvas2D.tsx - Rendering Filter** (lines 1941-1971)
   - Logs: `currentViewInfo` state (direction + hiddenElements)
   - Logs: Total elements before filtering
   - Logs: Each element filtered by direction
   - Logs: Each element filtered by hidden_elements
   - Logs: Total elements after filtering
   - Markers: `🎨 [CANVAS DEBUG]`

**Expected Console Output When Working:**
```
🔍 [VISIBILITY DEBUG] Toggle requested: { elementId: "cabinet-123", viewId: "front-default" }
🔍 [VISIBILITY DEBUG] Current elevationViews state: [...]
🔍 [VISIBILITY DEBUG] Is currently visible: true
🔍 [VISIBILITY DEBUG] Updated elevationViews: [... hidden_elements: ["cabinet-123"] ...]
🔍 [VISIBILITY DEBUG] State and database updated successfully

🎨 [CANVAS DEBUG] Rendering with currentViewInfo: { direction: "front", hiddenElements: ["cabinet-123"], active2DView: "front-default", totalElements: 5 }
🎨 [CANVAS DEBUG] Element HIDDEN by per-view filter: { id: "cabinet-123", viewId: "front-default" }
🎨 [CANVAS DEBUG] Elements to render after filtering: 4
```

**What to Look For:**
- ❌ If hiddenElements array is empty after toggle → State update failing
- ❌ If hiddenElements has element but still renders → Filter logic broken
- ❌ If multiple render logs with different hiddenElements → Race condition
- ❌ If no canvas debug logs appear → Re-render not triggering

---

### Phase 2: Code Review - Potential Conflicts 🔍 IN PROGRESS

**Areas to Check:**

#### 2.1 Multiple Rendering Code Paths
Search for duplicate element rendering logic:

**Files to Review:**
- [x] `src/components/designer/DesignCanvas2D.tsx` - Main 2D canvas renderer
- [ ] `src/components/designer/AdaptiveView3D.tsx` - 3D view renderer (known to lack visibility integration per previous code review)
- [ ] `src/components/designer/Lazy3DView.tsx` - Lazy-loaded 3D wrapper
- [ ] Any component that calls `drawElement()` or renders elements directly

**Search Patterns:**
```bash
# Find all places that iterate over design.elements
grep -r "design.elements" --include="*.tsx" src/components/designer/

# Find all places that call rendering functions
grep -r "drawElement\|renderElement\|forEach.*element" --include="*.tsx" src/components/designer/
```

#### 2.2 State Synchronization Issues

**Potential Race Conditions:**

1. **elevationViews State Updates**
   - `Designer.tsx` calls `setElevationViews(updated)`
   - Then calls `updateCurrentRoomDesign()` (async database update)
   - Canvas might re-render with old data before DB completes?

2. **currentViewInfo useMemo Dependency**
   - Located in `DesignCanvas2D.tsx` lines 320-344
   - Depends on: `[active2DView, elevationViews]`
   - If `elevationViews` prop doesn't update → `currentViewInfo` stays stale

3. **Component Re-render Triggers**
   - Check if `elevationViews` prop actually changes reference
   - Check if `DesignCanvas2D` is memoized (could prevent re-render)

**Files to Check:**
- [src/pages/Designer.tsx](../src/pages/Designer.tsx#L370-L398) - State management
- [src/components/designer/DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx#L320-L344) - useMemo dependency

#### 2.3 Fallback/Default Values

**Hypothesis:** Elements "grow" because they load with default dimensions, then update with real dimensions.

**Places Using Defaults:**
- `DesignCanvas2D.tsx` - Multiple `element.depth ?? 60` fallbacks
- `PropertiesPanel.tsx` - `getElementDepth()` and `getElementHeight()` helpers with defaults
- `migrateElements.ts` - Element migration with default values

**Check For:**
- Asynchronous data loading (ComponentService, database queries)
- Initial render with partial data, then second render with full data
- Canvas drawing before element data fully loaded

---

### Phase 3: Rendering Architecture Analysis 🔍 PENDING

#### 3.1 Identify All Render Triggers

**Questions:**
1. How many times does canvas re-render on view switch?
2. What triggers each render?
3. Is there a fallback render before final render?

**Add Counter Logging:**
```typescript
let renderCount = 0;
console.log(`🎨 [RENDER #${++renderCount}] Canvas draw triggered`);
```

#### 3.2 Trace Element Dimension Updates

**Add Logging to drawElement Function:**
```typescript
console.log(`📐 [ELEMENT DIMS] Drawing element:`, {
  id: element.id,
  width: element.width,
  depth: element.depth,
  height: element.height,
  hasDefaults: !element.depth || !element.height
});
```

---

### Phase 4: Specific Code Conflicts 🔍 PENDING

#### 4.1 Check for Hidden Re-renders

**Possible Culprits:**
1. **useEffect Dependencies**
   - Too many or incorrect dependencies causing extra renders
   - Missing dependencies causing stale closures

2. **Parent Component Re-renders**
   - Designer.tsx re-rendering frequently?
   - Passing new object/array references as props?

3. **Canvas Ref Updates**
   - Canvas element being recreated?
   - Drawing happening before ref attached?

#### 4.2 Check for Conflicting Filters

**Search for:**
- Any code still using `element.isVisible` (we commented it out but maybe missed something?)
- Any code filtering elements before they reach DesignCanvas2D
- Any global filters applied in Designer.tsx before passing to canvas

---

## Findings & Evidence

### Finding 1: Debug Logs Added ✅
**Status:** Complete
**Files Modified:**
- `src/pages/Designer.tsx`
- `src/components/designer/DesignCanvas2D.tsx`

**Commit:** 365ccab

**Next Step:** User needs to test in browser and share console output

---

### Finding 2: Per-View Visibility System Architecture ✅
**Status:** Verified Correct

**Data Flow (Expected):**
```
1. User clicks "Hide in This View" in PropertiesPanel
   ↓
2. PropertiesPanel.handleToggleVisibility() calls onToggleElementVisibility
   ↓
3. Designer.handleToggleElementVisibility() calls toggleElementVisibility helper
   ↓
4. elevationViewHelpers.toggleElementVisibility() returns updated array
   ↓
5. Designer sets elevationViews state + updates database
   ↓
6. DesignCanvas2D receives new elevationViews prop
   ↓
7. currentViewInfo useMemo recalculates with new hidden_elements array
   ↓
8. Canvas re-renders, filter excludes hidden elements
   ↓
9. Element disappears from canvas ✅
```

**Key Files:**
- [src/utils/elevationViewHelpers.ts](../src/utils/elevationViewHelpers.ts#L210-L235) - Toggle logic
- [src/components/designer/PropertiesPanel.tsx](../src/components/designer/PropertiesPanel.tsx#L136-L139) - UI trigger
- [src/pages/Designer.tsx](../src/pages/Designer.tsx#L370-L398) - State orchestration
- [src/components/designer/DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx#L320-L344) - View info calculation
- [src/components/designer/DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx#L1948-L1971) - Rendering filter

**Architecture is SOUND - issue must be in execution, not design.**

---

### Finding 3: No Obvious Code Duplication ✅
**Status:** Preliminary check complete

**Checked:**
- ✅ Only one `drawElement` function in DesignCanvas2D.tsx
- ✅ Only one main render loop (lines 1969-onwards)
- ✅ No duplicate filtering logic found

**Remaining to Check:**
- [ ] AdaptiveView3D rendering (known issue from previous code review)
- [ ] Async component data loading timing
- [ ] React re-render frequency

---

## Test Plan

### Manual Testing Steps

**User Instructions:**

1. **Open Browser DevTools Console**
   - Press F12
   - Go to Console tab
   - Clear console

2. **Select an Element**
   - Click any element on the canvas
   - Note the element ID in properties panel

3. **Toggle Visibility**
   - Click "Hide in This View" button
   - **Look for console logs starting with 🔍 and 🎨**
   - Share screenshot of console output

4. **Check Element Visibility**
   - Does element disappear from canvas?
   - Does button text change to "Show in This View"?

5. **Switch Views**
   - Click different elevation view buttons (Front/Back/Left/Right)
   - **Look for multiple canvas render logs**
   - Note if elements "jump" or resize during view switch

6. **Share Console Output**
   - Copy all logs with 🔍 or 🎨 markers
   - Share in next message

**What We're Looking For:**

**Scenario A: State Update Failing**
```
🔍 [VISIBILITY DEBUG] Toggle requested: { elementId: "X", viewId: "Y" }
🔍 [VISIBILITY DEBUG] Updated elevationViews: [... hidden_elements: [] ...]  ← EMPTY!
```
**Diagnosis:** Toggle helper function not working

**Scenario B: Filter Not Applied**
```
🔍 [VISIBILITY DEBUG] Updated elevationViews: [... hidden_elements: ["X"] ...]  ← HAS ID
🎨 [CANVAS DEBUG] Rendering with currentViewInfo: { hiddenElements: [] }  ← EMPTY!
```
**Diagnosis:** Prop not updating or useMemo not recalculating

**Scenario C: Multiple Conflicting Renders**
```
🎨 [CANVAS DEBUG] Rendering with currentViewInfo: { hiddenElements: ["X"] }
🎨 [CANVAS DEBUG] Element HIDDEN: X
🎨 [CANVAS DEBUG] Elements to render: 4
🎨 [CANVAS DEBUG] Rendering with currentViewInfo: { hiddenElements: [] }  ← SECOND RENDER!
🎨 [CANVAS DEBUG] Elements to render: 5
```
**Diagnosis:** Multiple render passes, second one overriding first

---

## Potential Fixes (Based on Diagnosis)

### If Scenario A: Helper Function Bug
**Fix:** Debug `toggleElementVisibility()` in elevationViewHelpers.ts

### If Scenario B: Prop Not Updating
**Fix:** Check React DevTools for prop changes, verify elevationViews reference changes

### If Scenario C: Multiple Renders
**Fix:** Add React.memo to DesignCanvas2D, optimize useEffect dependencies

### If Element Resizing Issue
**Likely Causes:**
1. Async component behavior loading after initial render
2. Default values being overridden by real values
3. Z-position calculations happening in second pass

**Fixes:**
1. Preload all component behaviors before rendering
2. Ensure all element dimensions are known before first render
3. Add loading state to prevent premature renders

---

## Related Documentation

- [VIEW-VISIBILITY-CODE-REVIEW.md](./VIEW-VISIBILITY-CODE-REVIEW.md) - Original bug analysis identifying 3D view integration gap
- [GLOBAL-VS-PER-VIEW-VISIBILITY-ANALYSIS.md](./GLOBAL-VS-PER-VIEW-VISIBILITY-ANALYSIS.md) - Why we removed global isVisible
- [ISVISIBLE-REMOVAL-COMPLETION.md](./ISVISIBLE-REMOVAL-COMPLETION.md) - Removal process documentation

---

## Next Steps

1. **User Testing Required** - Run manual test plan above and share console logs
2. **Analyze Console Output** - Determine which scenario (A/B/C) is occurring
3. **Implement Fix** - Based on diagnosis
4. **Add Regression Tests** - Ensure issue doesn't return

---

**Status:** 🔍 AWAITING USER TESTING & CONSOLE OUTPUT

**Last Updated:** 2025-10-18 (Debug logging added)
