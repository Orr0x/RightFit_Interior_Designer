# Fix Plan: 5 Components Missing 3D Models

**Date**: 2025-10-18
**Session**: feature/database-component-cleanup
**Status**: Analysis Complete, Fix Plan Ready

---

## Summary of Missing Components

| component_id | name | type | status | fix_approach |
|--------------|------|------|--------|--------------|
| corner-cabinet | Corner Base Cabinet | cabinet | ❌ CRITICAL | Need to create 3D model |
| counter-top-horizontal | Counter Top Horizontal | counter-top | ⚠️ UNCERTAIN | Check if procedurally generated |
| counter-top-vertical | Counter Top Vertical | counter-top | ⚠️ UNCERTAIN | Check if procedurally generated |
| dishwasher | Dishwasher | appliance | ⚠️ DUPLICATE | `dishwasher-60` has 3D model |
| refrigerator | Refrigerator | appliance | ❌ MISSING | Need to create 3D model |

---

## Detailed Analysis

### 1. corner-cabinet - Corner Base Cabinet ❌ CRITICAL

**Problem**:
- Component exists: `corner-cabinet` (90×90×90cm)
- No 3D model in component_3d_models
- User confirmed broken: "corner base units no long apear in 3d view"

**Root Cause**:
- Deleted when `l-shaped-test-cabinet-60` and `l-shaped-test-cabinet-90` were removed
- Original 3D model was likely linked to one of the test cabinets

**Component Details**:
```
component_id: corner-cabinet
name: Corner Base Cabinet
width: 90cm, depth: 90cm, height: 90cm
type: cabinet, category: base-cabinets
special_config: {"is_corner": true, "door_width": 30, "side_width": 60, "corner_type": "L-shaped"}
mount_height: 0cm, max_height: 85cm
```

**Fix Options**:

**Option A: Create new L-shaped corner 3D model** (RECOMMENDED)
- Create component_3d_model entry with `geometry_type: 'l_shaped_corner'`
- Similar to existing corner models in database:
  - `kitchen-sink-corner-90` (L-shaped corner sink)
  - `new-corner-wall-cabinet-90` (L-shaped corner wall cabinet)
  - `larder-corner-unit-90` (L-shaped tall corner larder)
- Set parameters:
  ```sql
  geometry_type: 'l_shaped_corner'
  is_corner_component: true
  leg_length: 0.9000  -- 90cm legs
  corner_depth_wall: 0.6000  -- 60cm wall depth
  corner_depth_base: 0.6000  -- 60cm base depth
  rotation_center_x: 'legLength/2'
  rotation_center_y: 0
  rotation_center_z: 'legLength/2'
  ```

**Option B: Map to existing corner base cabinet**
- Check if there's an orphaned corner base cabinet 3D model
- Rename/remap if found

---

### 2. counter-top-horizontal - Counter Top Horizontal ⚠️

**Component Details**:
```
component_id: counter-top-horizontal
name: Counter Top Horizontal
width: 300cm, depth: 60cm, height: 4cm
type: counter-top, category: counter-tops
description: "Horizontal counter top - 300cm x 60cm x 4cm (left-to-right)"
mount_height: 90cm (standard worktop height)
```

**Investigation Needed**:
- Check if countertops are procedurally generated in 3D view
- User note: "the ones in the app work in 2d and 3d unless they are hard coded"
- If they work in 3D view, they might be:
  1. Procedurally generated (simple box geometry)
  2. Hardcoded in 3D rendering logic
  3. Using a default/fallback 3D model

**Fix Options**:

**Option A: Create standard box 3D model**
```sql
geometry_type: 'standard'
is_corner_component: false
has_direction: false  -- countertops don't have front/back
auto_rotate_enabled: false
```

**Option B: Leave as procedural** (if confirmed)
- Document that countertops are procedurally generated
- No database entry needed

---

### 3. counter-top-vertical - Counter Top Vertical ⚠️

**Component Details**:
```
component_id: counter-top-vertical
name: Counter Top Vertical
width: 60cm, depth: 300cm, height: 4cm
type: counter-top, category: counter-tops
description: "Vertical counter top - 60cm x 300cm x 4cm (front-to-back)"
mount_height: 90cm (standard worktop height)
```

**Same as counter-top-horizontal** - just rotated dimensions.

---

### 4. dishwasher - Dishwasher ⚠️ DUPLICATE

**Problem**:
- `dishwasher` exists in components (60×58×82cm)
- `dishwasher-60` exists in components (60×60×85cm) **AND has 3D model**

**Discovery**:
- component_3d_models has: `dishwasher-60` (00eae6e3-db91-499a-be77-5e486cd3ceac)
- Both components exist in database

**Fix Options**:

**Option A: Map dishwasher → dishwasher-60 3D model** (QUICK FIX)
```sql
INSERT INTO component_3d_models (
  component_id, component_name, component_type, category, geometry_type,
  has_direction, auto_rotate_enabled, default_width, default_height, default_depth,
  wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom
)
SELECT
  'dishwasher',  -- new component_id
  'Dishwasher',  -- new name
  component_type, category, geometry_type,
  has_direction, auto_rotate_enabled,
  0.6000, 0.8200, 0.5800,  -- dishwasher dimensions
  wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom
FROM component_3d_models
WHERE component_id = 'dishwasher-60';
```

**Option B: Consolidate dishwasher variants**
- Decide if both dishwasher and dishwasher-60 should exist
- Remove duplicate if not needed

---

### 5. refrigerator - Refrigerator ❌ MISSING

**Component Details**:
```
component_id: refrigerator
name: Refrigerator
width: 60cm, depth: 60cm, height: 180cm
type: appliance, category: appliances
mount_height: 0cm, max_height: 180cm
```

**Fix**: Create standard 3D model
```sql
geometry_type: 'standard'
is_corner_component: false
has_direction: true  -- front panel different
auto_rotate_enabled: true
default_width: 0.6000
default_height: 1.8000
default_depth: 0.6000
wall_rotation_left: 90
wall_rotation_right: 270
wall_rotation_top: 0
wall_rotation_bottom: 180
```

---

## Recommended Fix Order

### Priority 1: CRITICAL - corner-cabinet
1. Create L-shaped corner 3D model entry
2. Link geometry_parts (if needed)
3. Test in 3D view

### Priority 2: HIGH - dishwasher
1. Clone dishwasher-60 3D model
2. Update dimensions to match dishwasher component
3. Test in 3D view

### Priority 3: HIGH - refrigerator
1. Create standard box 3D model
2. Set up wall rotations
3. Test in 3D view

### Priority 4: MEDIUM - countertops
1. **First**: Check if procedurally generated
2. **If not**: Create simple box 3D models
3. **If yes**: Document and skip

---

## SQL Scripts to Create

### 1. CREATE_CORNER_CABINET_3D_MODEL.sql
Create L-shaped corner cabinet 3D model based on existing corner patterns

### 2. CREATE_DISHWASHER_3D_MODEL.sql
Clone dishwasher-60 model with corrected dimensions

### 3. CREATE_REFRIGERATOR_3D_MODEL.sql
Create standard refrigerator 3D model

### 4. CREATE_COUNTERTOP_3D_MODELS.sql (optional)
Create procedural box models for horizontal/vertical countertops

---

## Next Steps

1. **User Decision**: Are countertops procedurally generated in 3D view?
   - If YES: Skip countertop 3D model creation
   - If NO: Create simple box 3D models

2. **Create SQL migration**: Add 3D models for missing components

3. **Test in 3D view**: Verify all components render correctly

4. **Document**: Update database status summary

---

## Expected Result After Fix

```
components:          192
component_3d_models: 192 (or 190 if countertops are procedural)
component_2d_renders: 192

Perfect 1:1:1 ratio! ✅
```

---

*Generated: 2025-10-18*
*Branch: feature/database-component-cleanup*
