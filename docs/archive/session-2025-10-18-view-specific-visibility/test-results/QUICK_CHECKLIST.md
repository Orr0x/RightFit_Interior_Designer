# Quick Test Checklist

## Before You Start
- [ ] Browser: Chrome/Edge with DevTools open
- [ ] Console tab visible
- [ ] Test room with 10+ elements loaded
- [ ] Have TEST_PLAN.md open for reference

---

## Test 1: Plan View (5 min)
- [ ] Hide 3 elements in plan view
- [ ] Elements disappear immediately
- [ ] Element selector shows "Hidden" badges
- [ ] Take 3 screenshots
- [ ] Save console logs

**Files:** test1-*.png (3 files) + test1-plan-console-logs.txt

---

## Test 2: Elevation Views (5 min)
- [ ] Hide 2 elements in Front elevation
- [ ] Hide 1 element in Right elevation
- [ ] Switch back to Front - still hidden
- [ ] Take 3 screenshots
- [ ] Save console logs

**Files:** test2-*.png (3 files) + test2-elevation-console-logs.txt

---

## Test 3: 3D View ⚠️ CRITICAL (10 min)
- [ ] Switch to 3D view
- [ ] Select element in canvas
- [ ] Click "Hide in This View" in Properties Panel
- [ ] Hide 3 elements total
- [ ] Toggle 1 back to visible
- [ ] Switch to Plan - elements still visible there
- [ ] Back to 3D - 2 elements hidden
- [ ] **CHECK CONSOLE:** `"viewId": "3d"` NOT "plan"!
- [ ] Take 5 screenshots
- [ ] Save console logs

**Files:** test3-*.png (5 files) + test3-3d-console-logs.txt

---

## Test 4: Independence (5 min)
- [ ] Hide element A in Plan
- [ ] Hide element B in Front
- [ ] Hide element C in 3D
- [ ] Switch through all views - verify independence
- [ ] Take 3 screenshots
- [ ] Export database elevation_views

**Files:** test4-*.png (3 files) + test4-database-elevation-views.json

---

## Test 5: Render Flash (5 min)
- [ ] Close browser tab completely
- [ ] Open fresh tab
- [ ] Navigate to app + open DevTools
- [ ] Click 3D View
- [ ] Watch for any element size changes
- [ ] Take 2 screenshots
- [ ] Save console logs

**Files:** test5-*.png (2 files) + test5-initial-load-console.txt
**Optional:** test5-load-sequence.mp4 (video)

---

## Test 6: Visual Indicators (3 min)
- [ ] In Plan: verify hidden badges
- [ ] In Front: verify hidden badges
- [ ] In 3D: verify hidden badges
- [ ] Take 3 screenshots

**Files:** test6-selector-*.png (3 files)

---

## Total Files Expected: 24-25 files

### Critical Evidence (Must Have):
1. ✅ test3-3d-console-logs.txt - Shows `"viewId": "3d"`
2. ✅ test3-3d-after-hide.png - Shows elements missing from 3D
3. ✅ test4-database-elevation-views.json - Shows per-view state

### When Done:
✅ Upload all files to test-results folder
✅ Message: "Test results uploaded, ready for review"
✅ I will review and mark tests as PASS/FAIL
