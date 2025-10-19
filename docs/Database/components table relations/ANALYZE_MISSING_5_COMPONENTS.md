# Analysis of 5 Components Missing 3D Models

**Date**: 2025-10-18
**Session**: feature/database-component-cleanup

---

## Components Missing 3D Models

### 1. corner-cabinet - Corner Base Cabinet ❌
- **Type**: cabinet
- **Category**: base-cabinets
- **Status**: CRITICAL - Only corner base cabinet in database
- **Issue**: 3D model deleted when l-shaped-test-cabinets were removed
- **Action**: MUST CREATE/RESTORE 3D model

### 2. counter-top-horizontal - Counter Top Horizontal ❌
- **Type**: counter-top
- **Category**: counter-tops
- **Status**: UNCERTAIN - May be hardcoded in app
- **User Note**: "the ones in the app work in 2d and 3d unless they are hard coded that was not migrated to the database"
- **Action**: Check if hardcoded in app code

### 3. counter-top-vertical - Counter Top Vertical ❌
- **Type**: counter-top
- **Category**: counter-tops
- **Status**: UNCERTAIN - May be hardcoded in app
- **User Note**: "the ones in the app work in 2d and 3d unless they are hard coded that was not migrated to the database"
- **Action**: Check if hardcoded in app code

### 4. dishwasher - Dishwasher ❌
- **Type**: appliance
- **Category**: appliances
- **Status**: MISSING - Should have 3D model
- **Action**: Check if orphaned 3D model exists or create new

### 5. refrigerator - Refrigerator ❌
- **Type**: appliance
- **Category**: appliances
- **Status**: MISSING - Should have 3D model
- **Action**: Check if orphaned 3D model exists or create new

---

## Investigation Plan

### Step 1: Check for Hardcoded Countertops in App
Search codebase for:
- `counter-top-horizontal`
- `counter-top-vertical`
- Hardcoded 3D geometry for countertops

**Files to Check**:
- src/components/designer/DesignCanvas3D.tsx
- src/utils/3d/
- Any geometry generation files

### Step 2: Check for Orphaned 3D Models
Search component_3d_models_rows.csv for:
- corner-cabinet
- dishwasher
- refrigerator
- Any 3D models that might match

### Step 3: Check component_2d_renders
Verify all 5 have 2D renders (should be yes):
```sql
SELECT component_id, plan_view_type, elevation_type
FROM component_2d_renders
WHERE component_id IN (
  'corner-cabinet',
  'counter-top-horizontal',
  'counter-top-vertical',
  'dishwasher',
  'refrigerator'
);
```

---

## Priority

### CRITICAL: corner-cabinet
- Only corner base cabinet in database
- User confirmed it's broken: "corner base units no long apear in 3d view"
- MUST be fixed for app to work properly

### HIGH: dishwasher, refrigerator
- Core appliances for kitchen design
- Should have 3D models

### MEDIUM: countertops
- May be hardcoded (need to verify)
- Working in app despite missing from DB
- If hardcoded, consider migrating to DB for consistency

---

## Next Actions

1. **Search codebase** for countertop hardcoded geometry
2. **Check CSV exports** for any orphaned matches
3. **Create fix plan** based on findings
