# Week 19: Corner Cabinets Testing Guide

**Status**: Week 19 Complete - Ready for Testing
**Feature Flag**: `use_dynamic_3d_models`
**Database**: Migrations deployed ✅

---

## 🎯 Testing Objectives

1. Verify all 4 corner cabinet models load from database
2. Confirm geometry matches hardcoded versions (pixel-perfect)
3. Test all 4 rotation angles (0°, 90°, 180°, 270°)
4. Verify auto-rotate functionality
5. Confirm selection highlighting works
6. Check performance (load time < 60ms)

---

## 📋 Pre-Testing Setup

### **Step 1: Enable Feature Flag**

Run this SQL in Supabase:

```sql
-- Enable dynamic 3D models in development
UPDATE feature_flags
SET enabled_dev = TRUE, enabled_production = FALSE
WHERE flag_key = 'use_dynamic_3d_models';

-- Verify flag is enabled
SELECT flag_key, enabled_dev, enabled_production, rollout_percentage
FROM feature_flags
WHERE flag_key = 'use_dynamic_3d_models';
```

Expected result:
```
flag_key                 | enabled_dev | enabled_production | rollout_percentage
use_dynamic_3d_models    | true        | false              | 0
```

### **Step 2: Verify Database Population**

Check corner cabinets are in database:

```sql
-- Check corner cabinet models
SELECT
  component_id,
  component_name,
  geometry_type,
  leg_length,
  corner_depth_base,
  corner_depth_wall
FROM component_3d_models
WHERE is_corner_component = true
ORDER BY component_id;
```

Expected result (4 models):
```
component_id                  | component_name                | leg_length | corner_depth_base | corner_depth_wall
corner-base-cabinet-60        | Corner Base Cabinet 60cm      | 0.6        | 0.6               | 0.4
corner-base-cabinet-90        | Corner Base Cabinet 90cm      | 0.9        | 0.6               | 0.4
new-corner-wall-cabinet-60    | New Corner Wall Cabinet 60cm  | 0.6        | 0.6               | 0.4
new-corner-wall-cabinet-90    | New Corner Wall Cabinet 90cm  | 0.9        | 0.6               | 0.4
```

Check geometry parts:

```sql
-- Check geometry parts count
SELECT
  m.component_id,
  COUNT(gp.id) as part_count
FROM component_3d_models m
LEFT JOIN geometry_parts gp ON gp.model_id = m.id
WHERE m.is_corner_component = true
GROUP BY m.component_id
ORDER BY m.component_id;
```

Expected result:
```
component_id                  | part_count
corner-base-cabinet-60        | 8
corner-base-cabinet-90        | 8
new-corner-wall-cabinet-60    | 6
new-corner-wall-cabinet-90    | 6
```

### **Step 3: Clear Browser Cache**

1. Open Developer Tools (F12)
2. Right-click refresh button → "Empty Cache and Hard Reload"
3. Or: Settings → Clear browsing data → Cached images and files

---

## 🧪 Test Cases

### **Test 1: Feature Flag Check**

**Objective**: Verify feature flag is being read correctly

**Steps:**
1. Open browser console (F12)
2. Navigate to `/designer`
3. Look for console message: `[FeatureFlagService] Flag 'use_dynamic_3d_models' is enabled: true`

**Expected:**
- ✅ Feature flag check succeeds
- ✅ No errors in console

**If Failed:**
- Check Supabase connection
- Verify flag is enabled in database
- Check FeatureFlagService.ts for errors

---

### **Test 2: Preload Check**

**Objective**: Verify components are preloaded on app startup

**Steps:**
1. Refresh page
2. Check console for: `[DynamicRenderer] Preloaded common components`
3. Check for: `[Model3DLoader] Loaded model from database: corner-base-cabinet-60`

**Expected:**
- ✅ All 8 components preloaded
- ✅ No errors during preload
- ✅ Cache hit messages on subsequent loads

**If Failed:**
- Check Model3DLoaderService for errors
- Verify components exist in database
- Check network tab for failed requests

---

### **Test 3: Corner Base Cabinet 60cm**

**Objective**: Test 60cm base corner cabinet in all rotations

**Steps:**
1. Open `/designer`
2. Create new kitchen room (400cm x 400cm)
3. Add "Corner Base Cabinet 60cm" component
4. Place in front-left corner (0, 0)
5. Check console for: `[DynamicRenderer] Built component: corner-base-cabinet-60 (8 parts)`

**Visual Checks:**
- ✅ L-shaped geometry visible
- ✅ Two perpendicular cabinet legs
- ✅ Plinth at bottom (dark color)
- ✅ Two doors (darker brown)
- ✅ Two handles (silver)
- ✅ Proper positioning at corner

**Rotation Tests:**
1. **0° (Front-Left corner)**:
   - L opens to bottom-right
   - Front door faces forward
   - Side door faces right

2. **90° (Back-Left corner)**:
   - L opens to top-right
   - Front door faces left
   - Side door faces forward

3. **180° (Back-Right corner)**:
   - L opens to top-left
   - Front door faces backward
   - Side door faces left

4. **270° (Front-Right corner)**:
   - L opens to bottom-left
   - Front door faces right
   - Side door faces backward

**Performance:**
- ✅ Load time < 60ms (check console)
- ✅ No lag when rotating
- ✅ Smooth rendering

---

### **Test 4: Corner Base Cabinet 90cm**

**Objective**: Test 90cm base corner cabinet

**Steps:**
1. Add "Corner Base Cabinet 90cm"
2. Place in room
3. Check console for: `[DynamicRenderer] Built component: corner-base-cabinet-90 (8 parts)`

**Visual Checks:**
- ✅ Larger L-shape (90cm legs instead of 60cm)
- ✅ Same geometry structure as 60cm version
- ✅ Proportionally correct

**Comparison Test:**
1. Place 60cm and 90cm corner cabinets side by side
2. Verify 90cm is 1.5x larger
3. Check both have same number of parts (8)

---

### **Test 5: New Corner Wall Cabinet 60cm**

**Objective**: Test 60cm wall corner cabinet

**Steps:**
1. Add "New Corner Wall Cabinet 60cm"
2. Place in room
3. Check console for: `[DynamicRenderer] Built component: new-corner-wall-cabinet-60 (6 parts)`

**Visual Checks:**
- ✅ L-shaped geometry
- ✅ **NO PLINTH** (only 6 parts instead of 8)
- ✅ Positioned at 200cm height (wall cabinet)
- ✅ Shallower depth (40cm vs 60cm for base)

**Difference from Base Cabinet:**
- Base cabinet: 8 parts (includes 2 plinths)
- Wall cabinet: 6 parts (no plinths)
- Wall cabinet: Higher Y position (2.0m)
- Wall cabinet: Shallower depth (0.4m vs 0.6m)

---

### **Test 6: New Corner Wall Cabinet 90cm**

**Objective**: Test 90cm wall corner cabinet

**Steps:**
1. Add "New Corner Wall Cabinet 90cm"
2. Place in room
3. Check console for: `[DynamicRenderer] Built component: new-corner-wall-cabinet-90 (6 parts)`

**Visual Checks:**
- ✅ Larger L-shape than 60cm wall cabinet
- ✅ No plinth
- ✅ Wall cabinet height (200cm)

---

### **Test 7: Selection Highlighting**

**Objective**: Verify selection changes color

**Steps:**
1. Place any corner cabinet
2. Click to select
3. Observe color change

**Expected:**
- ✅ Unselected: Brown (#8B7355)
- ✅ Selected: Red (#ff6b6b)
- ✅ Color change is instant
- ✅ Handles remain silver

---

### **Test 8: Fallback to Hardcoded**

**Objective**: Test fallback when database fails

**Steps:**
1. Disable feature flag:
   ```sql
   UPDATE feature_flags
   SET enabled_dev = FALSE
   WHERE flag_key = 'use_dynamic_3d_models';
   ```
2. Refresh page
3. Add corner cabinet

**Expected:**
- ✅ Component renders using hardcoded geometry
- ✅ No errors in console
- ✅ Visual appearance identical

---

### **Test 9: Auto-Rotate (if implemented)**

**Objective**: Test automatic rotation near corners

**Steps:**
1. Drag corner cabinet near corner
2. Observe rotation

**Expected:**
- ✅ Auto-rotates to face into room
- ✅ Correct rotation for each corner

---

### **Test 10: Performance Test**

**Objective**: Measure load time

**Steps:**
1. Open console
2. Clear cache
3. Refresh page
4. Add corner cabinet
5. Check console for timing

**Expected:**
- ✅ Cached load: < 10ms
- ✅ Uncached load: < 60ms
- ✅ Build time: < 10ms
- ✅ Total time: < 70ms

**Console Messages to Check:**
```
[Model3DLoader] Loaded model from database: corner-base-cabinet-60
[Model3DLoader] Loaded 8 geometry parts for model: {uuid}
[GeometryBuilder] Built 8 geometry parts
[DynamicRenderer] Built component: corner-base-cabinet-60 (8 parts)
```

---

## 🐛 Common Issues & Fixes

### **Issue 1: Component Not Rendering**

**Symptoms**: Blank space where component should be

**Debug Steps:**
1. Check console for errors
2. Verify feature flag is enabled
3. Check component exists in database:
   ```sql
   SELECT * FROM component_3d_models WHERE component_id = 'corner-base-cabinet-60';
   ```
4. Check geometry parts exist:
   ```sql
   SELECT COUNT(*) FROM geometry_parts WHERE model_id = (
     SELECT id FROM component_3d_models WHERE component_id = 'corner-base-cabinet-60'
   );
   ```

**Fix:**
- If model missing: Run migration again
- If parts missing: Check migration completed successfully
- If flag disabled: Enable flag in database

---

### **Issue 2: Wrong Geometry**

**Symptoms**: Component looks different from hardcoded version

**Debug Steps:**
1. Check formulas in geometry_parts table:
   ```sql
   SELECT part_name, position_x, position_y, position_z
   FROM geometry_parts
   WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'corner-base-cabinet-60')
   ORDER BY render_order;
   ```

2. Verify variables are correct:
   - Check element dimensions (width, height, depth)
   - Check legLength and cornerDepth

**Fix:**
- Update formulas in database if incorrect
- Check FormulaEvaluator.ts for evaluation errors

---

### **Issue 3: Slow Performance**

**Symptoms**: Lag when adding components

**Debug Steps:**
1. Check cache hit rate in console
2. Verify preload ran successfully
3. Check database query time

**Fix:**
- Ensure preload is enabled in App.tsx
- Check Model3DLoaderService cache is working
- Verify database connection is fast

---

## ✅ Success Criteria

**All tests must pass:**
- ✅ Feature flag check succeeds
- ✅ All 4 corner models load from database
- ✅ Geometry matches hardcoded versions exactly
- ✅ All 4 rotations work correctly
- ✅ Selection highlighting works
- ✅ Performance < 60ms per component
- ✅ No errors in console
- ✅ Fallback to hardcoded works

---

## 📊 Test Results Template

```
Week 19 Corner Cabinet Testing - [Date]
==========================================

Feature Flag: [PASS/FAIL]
Preload: [PASS/FAIL]

Corner Base Cabinet 60cm: [PASS/FAIL]
  - 0° rotation: [PASS/FAIL]
  - 90° rotation: [PASS/FAIL]
  - 180° rotation: [PASS/FAIL]
  - 270° rotation: [PASS/FAIL]

Corner Base Cabinet 90cm: [PASS/FAIL]
New Corner Wall Cabinet 60cm: [PASS/FAIL]
New Corner Wall Cabinet 90cm: [PASS/FAIL]

Selection Highlighting: [PASS/FAIL]
Fallback to Hardcoded: [PASS/FAIL]
Performance: [PASS/FAIL]
  - Cached load: [X]ms
  - Uncached load: [X]ms

Issues Found:
1. [Description]
2. [Description]

Overall: [PASS/FAIL]
```

---

## 🚀 Next Steps After Testing

**If All Tests Pass:**
1. Document results
2. Enable flag in staging
3. Start Week 20: Standard cabinets (P1)

**If Tests Fail:**
1. Document failures
2. Fix issues
3. Re-run tests
4. Update migration if needed

---

**Happy Testing! 🎉**
