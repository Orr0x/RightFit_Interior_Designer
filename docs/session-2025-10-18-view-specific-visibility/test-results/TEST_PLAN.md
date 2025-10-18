# View-Specific Visibility - Test Plan
**Session Date:** 2025-10-18
**Feature:** Per-View Element Visibility (Plan, Elevations, 3D)
**Status:** 🟡 PENDING TESTING

---

## Test Objectives

Verify that all view-specific visibility features work correctly:
1. Elements can be hidden/shown independently in each view
2. Visual indicators show hidden state in element selector
3. No render flashes on 3D view load
4. Database persistence of visibility state
5. Correct console logging for debugging

---

## Test Environment Setup

**Required Data:**
- Kitchen design with at least 10 elements (mix of cabinets, appliances)
- Elements should be on different walls (front, back, left, right, center)

**Browser:**
- Chrome/Edge with DevTools open
- Console tab visible for log inspection

**Test Sequence:**
Complete tests in order (1 → 2 → 3 → 4 → 5)

---

## Test 1: Plan View Visibility

### Test Steps
1. Switch to **Plan View** tab
2. Open browser DevTools → Console tab
3. **Select an element** by clicking it in the canvas (or in Element Selector)
4. In **Properties Panel** (right sidebar), click **"Hide in This View"** button
5. Repeat for 2 more elements (3 elements hidden total)
6. Select one of the hidden elements
7. Click **"Show in This View"** button to toggle it visible again

### Expected Results

✅ **Visual Behavior:**
- [ ] Elements disappear from plan canvas immediately when hidden
- [ ] Elements reappear when toggled visible again
- [ ] Hidden elements show in selector with:
  - 40% opacity (dimmed)
  - "Hidden" badge with eye-off icon

✅ **Console Logs:**
```
🔍 [VISIBILITY DEBUG] Toggle requested: {
  "elementId": "element-id-here",
  "viewId": "plan"
}
🔍 [VISIBILITY DEBUG] Is currently visible: true
🔍 [VISIBILITY DEBUG] Updated elevationViews: [
  {
    "id": "plan",
    "hidden_elements": ["element-id-here", ...]
  }
  ...
]
🔍 [VISIBILITY DEBUG] State and database updated successfully

🎨 [CANVAS DEBUG] Rendering with currentViewInfo: {
  "direction": "plan",
  "hiddenElements": ["element-id-here", ...],
  "active2DView": "plan",
  "totalElements": 18
}
🎨 [CANVAS DEBUG] Element HIDDEN in plan view: {
  "id": "element-id-here"
}
🎨 [CANVAS DEBUG] Elements to render after filtering: 15  ← (should be totalElements - hidden count)
```

### Evidence Required

📸 **Screenshots:**
- `test1-plan-before-hide.png` - Plan view with all elements visible
- `test1-plan-after-hide.png` - Plan view with 3 elements hidden (arrows pointing to hidden elements in selector showing badges)
- `test1-plan-element-selector.png` - Close-up of element selector showing "Hidden" badges

📋 **Console Logs:**
- `test1-plan-console-logs.txt` - Copy all console output from the test

---

## Test 2: Elevation View Visibility

### Test Steps
1. Switch to **Front Elevation** tab
2. **Select an element** in the canvas
3. In **Properties Panel**, click **"Hide in This View"**
4. Repeat for 1 more element (2 elements hidden in Front view)
5. Switch to **Right Elevation** tab
6. **Select a different element**
7. Click **"Hide in This View"** (1 element hidden in Right view)
8. Switch back to **Front Elevation**
9. Verify the 2 elements are still hidden

### Expected Results

✅ **Visual Behavior:**
- [ ] Front elevation: 2 elements hidden
- [ ] Right elevation: 1 element hidden
- [ ] Hidden elements in element selector show "Hidden" badge
- [ ] Switching views preserves hidden state per view

✅ **Console Logs:**
```
🔍 [VISIBILITY DEBUG] Toggle requested: {
  "elementId": "element-id",
  "viewId": "front-default"
}

🎨 [CANVAS DEBUG] Rendering with currentViewInfo: {
  "direction": "front",
  "hiddenElements": ["element-id", ...],
  "active2DView": "front-default"
}
🎨 [CANVAS DEBUG] Element HIDDEN by per-view filter: {
  "id": "element-id",
  "viewId": "front-default"
}
```

### Evidence Required

📸 **Screenshots:**
- `test2-front-hidden.png` - Front elevation with 2 hidden elements
- `test2-right-hidden.png` - Right elevation with 1 hidden element
- `test2-element-selector-front.png` - Element selector showing front view hidden badges

📋 **Console Logs:**
- `test2-elevation-console-logs.txt` - Console output from elevation view tests

---

## Test 3: 3D View Visibility (CRITICAL)

### Test Steps
1. Switch to **3D View** tab
2. Select an element in the canvas (click on it)
3. In **Properties Panel** (right sidebar), click **"Hide in This View"** button
4. Hide 3 different elements total
5. Toggle 1 element back to visible ("Show in This View")
6. Switch to **Plan View** - verify those 3 elements are still visible in plan
7. Switch back to **3D View** - verify 2 elements are hidden

### Expected Results

✅ **Visual Behavior:**
- [ ] Elements disappear from 3D canvas immediately when hidden
- [ ] Elements reappear when toggled visible
- [ ] Hidden elements in element selector show "Hidden" badge with 40% opacity
- [ ] Elements hidden in 3D are NOT hidden in Plan/Elevation views

✅ **Console Logs (MOST IMPORTANT):**
```
🔍 [VISIBILITY DEBUG] Toggle requested: {
  "elementId": "element-id",
  "viewId": "3d"  ← MUST BE "3d", NOT "plan"!
}
🔍 [VISIBILITY DEBUG] Updated elevationViews: [
  ...
  {
    "id": "3d",
    "label": "3D View",
    "direction": "3d",
    "hidden_elements": ["element-id", ...]  ← Should contain hidden element IDs
  }
]

🎨 [3D VIEW DEBUG] Filtering elements: {
  "totalElements": 18,
  "hiddenElementIds": ["element-id", ...],  ← Should match hidden_elements above
  "view3DConfig": {
    "id": "3d",
    "hidden_elements": ["element-id", ...]
  },
  "elevationViewsProp": "provided"  ← MUST say "provided", NOT "using fallback"
}
🎨 [3D VIEW DEBUG] Element HIDDEN in 3D view: {
  "id": "element-id"
}
🎨 [3D VIEW DEBUG] Visible elements after filtering: {
  "afterVisibilityFilter": 15,  ← Should be totalElements - hidden count
  "afterPerformanceLimit": 15
}
```

### Evidence Required

📸 **Screenshots:**
- `test3-3d-before-hide.png` - 3D view with all elements visible
- `test3-3d-after-hide.png` - 3D view with 2 elements hidden
- `test3-3d-element-selector.png` - Element selector showing "Hidden" badges in 3D view
- `test3-3d-properties-panel.png` - Properties panel showing "Show in This View" button
- `test3-plan-view-after-3d-hide.png` - Plan view showing elements still visible (proving independence)

📋 **Console Logs:**
- `test3-3d-console-logs.txt` - **COMPLETE** console output showing all toggle events and filtering

---

## Test 4: Per-View Independence

### Test Steps
1. Start fresh (reload page if needed)
2. Hide element "A" in Plan View
3. Hide element "B" in Front Elevation
4. Hide element "C" in 3D View
5. Switch between all 5 views (Plan, Front, Back, Left, Right, 3D)
6. Document which elements are hidden in each view

### Expected Results

✅ **Visual Behavior:**
- [ ] Plan View: Only element "A" hidden
- [ ] Front Elevation: Only element "B" hidden
- [ ] Back Elevation: No elements hidden
- [ ] Left Elevation: No elements hidden
- [ ] Right Elevation: No elements hidden
- [ ] 3D View: Only element "C" hidden

✅ **Database State:**
Export `elevation_views` array from database for current room

### Evidence Required

📸 **Screenshots:**
- `test4-plan.png` - Plan view (A hidden)
- `test4-front.png` - Front elevation (B hidden)
- `test4-3d.png` - 3D view (C hidden)

📋 **Database Export:**
- `test4-database-elevation-views.json` - Export of `design_settings.elevation_views` from database

Expected JSON structure:
```json
[
  {
    "id": "plan",
    "hidden_elements": ["element-A-id"]
  },
  {
    "id": "front-default",
    "hidden_elements": ["element-B-id"]
  },
  {
    "id": "3d",
    "hidden_elements": ["element-C-id"]
  }
]
```

---

## Test 5: Render Flash Fix

### Test Steps
1. **Completely close** the browser tab
2. Open fresh browser tab
3. Navigate to application
4. Open DevTools → Console
5. Select the test room
6. Click **3D View** tab
7. **Watch carefully** - do elements change size/position after initial render?
8. Check console for loading sequence

### Expected Results

✅ **Visual Behavior:**
- [ ] Loading message shows: "Loading 3D scene data..."
- [ ] Elements render ONCE with correct size/color
- [ ] NO flashing or resizing after elements appear
- [ ] Smooth transition from loading to rendered

✅ **Console Logs:**
```
🔄 [AdaptiveView3D] Starting consolidated data load...
✅ [AdaptiveView3D] Loaded room colors for kitchen
✅ [AdaptiveView3D] Loaded room geometry for room <uuid>
✅ [AdaptiveView3D] All async data loaded successfully
🎮 [AdaptiveView3D] Performance detection complete: { ... }
🎨 [3D VIEW DEBUG] Filtering elements: { ... }
[EnhancedCabinet3D] Rendering <element-id> with DynamicComponentRenderer
...
```

**Key Points:**
- "All async data loaded successfully" BEFORE any element rendering
- No multiple render logs for same element
- Single, smooth render

### Evidence Required

📸 **Screenshots:**
- `test5-loading-state.png` - Loading message visible
- `test5-rendered-state.png` - Final rendered 3D view (no flash)

📋 **Console Logs:**
- `test5-initial-load-console.txt` - Complete console output from page load to 3D render

🎥 **Video (Optional but Helpful):**
- `test5-load-sequence.mp4` - Screen recording of 3D view loading (shows no flash)

---

## Test 6: Element Selector Visual Indicators

### Test Steps
1. Hide elements in multiple views (Plan: 2, Front: 1, 3D: 2)
2. For each view, take screenshot of element selector
3. Verify visual indicators match hidden state

### Expected Results

✅ **Visual Behavior:**
- [ ] Hidden elements show at 40% opacity (dimmed/grayed)
- [ ] Hidden elements have "Hidden" badge with eye-off icon
- [ ] Badge is visible and readable
- [ ] Only elements hidden in CURRENT view show indicators

### Evidence Required

📸 **Screenshots:**
- `test6-selector-plan.png` - Element selector in Plan view (2 hidden badges)
- `test6-selector-front.png` - Element selector in Front elevation (1 hidden badge)
- `test6-selector-3d.png` - Element selector in 3D view (2 hidden badges)

---

## Acceptance Criteria

### Must Pass (Critical)

- [ ] **Test 3 (3D View)** - Console logs show `"viewId": "3d"` NOT "plan"
- [ ] **Test 3 (3D View)** - Elements actually disappear from 3D canvas
- [ ] **Test 4 (Independence)** - Each view maintains separate hidden state
- [ ] **Test 5 (Render Flash)** - No element resizing after load

### Should Pass (Important)

- [ ] **Test 1 (Plan View)** - Visibility toggles work
- [ ] **Test 2 (Elevations)** - Visibility toggles work
- [ ] **Test 6 (Visual Indicators)** - Hidden badges appear correctly

### Nice to Have

- [ ] Database state matches UI state
- [ ] Console logs are clean (no errors)
- [ ] Toast messages appear on toggle

---

## How to Submit Results

### File Organization
```
docs/session-2025-10-18-view-specific-visibility/test-results/
├── TEST_PLAN.md (this file)
├── test1-plan-before-hide.png
├── test1-plan-after-hide.png
├── test1-plan-element-selector.png
├── test1-plan-console-logs.txt
├── test2-front-hidden.png
├── test2-right-hidden.png
├── test2-element-selector-front.png
├── test2-elevation-console-logs.txt
├── test3-3d-before-hide.png
├── test3-3d-after-hide.png
├── test3-3d-element-selector.png
├── test3-3d-properties-panel.png
├── test3-plan-view-after-3d-hide.png
├── test3-3d-console-logs.txt  ← MOST IMPORTANT!
├── test4-plan.png
├── test4-front.png
├── test4-3d.png
├── test4-database-elevation-views.json
├── test5-loading-state.png
├── test5-rendered-state.png
├── test5-initial-load-console.txt
├── test6-selector-plan.png
├── test6-selector-front.png
└── test6-selector-3d.png
```

### After Uploading Files

Let me know when files are uploaded. I will:
1. Review all evidence
2. Mark tests as ✅ PASS or ❌ FAIL
3. Update this TEST_PLAN.md with results
4. Create summary report
5. Identify any remaining issues

---

## Test Status Tracking

| Test | Status | Evidence Files | Notes |
|------|--------|----------------|-------|
| Test 1: Plan View | 🟡 PENDING | 0/4 files | |
| Test 2: Elevations | 🟡 PENDING | 0/4 files | |
| Test 3: 3D View | 🟡 PENDING | 0/6 files | **CRITICAL** |
| Test 4: Independence | 🟡 PENDING | 0/4 files | |
| Test 5: Render Flash | 🟡 PENDING | 0/3 files | |
| Test 6: Visual Indicators | 🟡 PENDING | 0/3 files | |

**Legend:**
- 🟡 PENDING - Not yet tested
- 🔵 IN PROGRESS - Files being uploaded
- ✅ PASS - Test successful
- ❌ FAIL - Test failed, needs fix
- ⚠️ PARTIAL - Some parts pass, some fail

---

## Quick Reference: How to Get Console Logs

1. **Open DevTools:** Press F12 or right-click → Inspect
2. **Go to Console tab**
3. **Perform test actions**
4. **Copy logs:**
   - Right-click in console
   - Select "Save as..."
   - Save as `.txt` file with test name

**OR**

1. Right-click in console
2. Select all logs (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into text file
5. Save with test name

---

## Quick Reference: How to Get Database Export

### Method 1: Via Supabase Dashboard
1. Open Supabase dashboard
2. Go to Table Editor
3. Find `room_designs` table
4. Locate your test room
5. Copy `design_settings` column
6. Paste into `test4-database-elevation-views.json`

### Method 2: Via Browser DevTools
1. Open DevTools → Console
2. Run:
```javascript
copy(JSON.stringify(window.__ROOM_DESIGN_SETTINGS__.elevation_views, null, 2))
```
3. Paste into text file
4. Save as `test4-database-elevation-views.json`

### Method 3: Via Application
1. Open browser console
2. Find the elevationViews state in React DevTools
3. Copy the array
4. Save to file

---

**End of Test Plan**
