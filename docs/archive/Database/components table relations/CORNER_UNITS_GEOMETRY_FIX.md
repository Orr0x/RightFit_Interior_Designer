# Corner Units Geometry Fix - Migration 20251018000008

**Date**: 2025-10-18
**Migration**: 20251018000008_fix_corner_cabinet_geometry.sql
**Session**: feature/database-component-cleanup

---

## Problem

Migration 20251018000007 incorrectly cloned `corner-cabinet` geometry from `kitchen-sink-corner-90` (a SINK component), causing corner cabinets to render like sinks instead of proper L-shaped cabinets.

Additionally, tall larder corner units may have had incomplete or missing geometry.

## Solution

Clone proper L-shaped geometry from `new-corner-wall-cabinet-60` and `new-corner-wall-cabinet-90` (which have perfect L-shaped corner geometry) to ALL corner units in the database.

---

## Corner Units in Database (5 Total)

| Component ID | Type | Leg Size | Status Before | Status After |
|--------------|------|----------|---------------|--------------|
| corner-cabinet | Base cabinet | 90cm | ❌ Sink geometry | ✅ L-shape + plinth |
| larder-corner-unit-60 | Tall unit | 60cm | ❓ Unknown | ✅ L-shape + plinth |
| larder-corner-unit-90 | Tall unit | 90cm | ❓ Unknown | ✅ L-shape + plinth |
| new-corner-wall-cabinet-60 | Wall cabinet | 60cm | ✅ L-shape | ✅ Unchanged |
| new-corner-wall-cabinet-90 | Wall cabinet | 90cm | ✅ L-shape | ✅ Unchanged |

---

## Migration Steps

### Step 1: Check Pre-Migration Status
Count existing geometry parts for all corner units to understand current state.

### Step 2: Delete Old Geometry
Delete incorrect/incomplete geometry from:
- `corner-cabinet` (sink-based geometry)
- `larder-corner-unit-60` (may be incomplete)
- `larder-corner-unit-90` (may be incomplete)

### Step 3: Add Base Cabinet Geometry
Clone 6 L-shaped parts from `new-corner-wall-cabinet-90` to `corner-cabinet`, then add 7th part (Plinth).

**Parts Added (7 total)**:
1. Cabinet X-leg (horizontal leg)
2. Cabinet Z-leg (vertical leg)
3. Front door
4. Side door
5. Front handle
6. Side handle
7. **Plinth** (NEW - 15cm toe-kick)

### Step 4: Add Tall Larder 60cm Geometry
Clone 6 L-shaped parts from `new-corner-wall-cabinet-60` to `larder-corner-unit-60`, then add plinth.

### Step 5: Add Tall Larder 90cm Geometry
Clone 6 L-shaped parts from `new-corner-wall-cabinet-90` to `larder-corner-unit-90`, then add plinth.

### Step 6: Verify All Corner Units
Count geometry parts for all 5 corner units and confirm:
- Base cabinet: 7 parts (6 L-shape + 1 plinth)
- Tall cabinets: 7 parts each (6 L-shape + 1 plinth)
- Wall cabinets: 6 parts each (6 L-shape, no plinth)

### Step 7: Show Verification Query
List all corner units with part counts and part names for manual verification.

---

## L-Shaped Geometry Structure

### 6 Core Parts (all corner units)

1. **Cabinet X-leg**
   - Horizontal leg of L-shape
   - Width: `legLength`, Height: `height`, Depth: `cornerDepth`
   - Position Z: `cornerDepth / 2 - legLength / 2`

2. **Cabinet Z-leg**
   - Vertical leg of L-shape
   - Width: `cornerDepth`, Height: `height`, Depth: `legLength`
   - Position X: `cornerDepth / 2 - legLength / 2`

3. **Front door**
   - Door on X-leg face
   - Width: `legLength - 0.05`, Height: `height - 0.05`, Depth: `0.02`
   - Position Z: `cornerDepth - legLength / 2 + 0.01`

4. **Side door**
   - Door on Z-leg face
   - Width: `0.02`, Height: `height - 0.05`, Depth: `legLength - 0.05`
   - Position X: `cornerDepth - legLength / 2 + 0.01`

5. **Front handle**
   - Handle on front door
   - Width: `0.02`, Height: `0.15`, Depth: `0.02`
   - Material: metalness=0.80, roughness=0.20

6. **Side handle**
   - Handle on side door
   - Width: `0.02`, Height: `0.15`, Depth: `0.02`
   - Material: metalness=0.80, roughness=0.20

### 7th Part (base/tall units only)

7. **Plinth**
   - 15cm toe-kick at bottom
   - Width: `legLength`, Height: `0.15`, Depth: `legLength`
   - Position Y: `-0.15` (below cabinet body)
   - Render order: `0` (renders first, at bottom)

---

## Formula Variables (Auto-Adjust Per Type)

The same formulas work for all cabinet types because variables resolve differently:

| Variable | Wall Cabinet | Base Cabinet | Tall Cabinet |
|----------|--------------|--------------|--------------|
| cornerDepth | 0.4m (40cm) | 0.6m (60cm) | 0.6m (60cm) |
| height | 0.7m (70cm) | 0.9m (90cm) | 2.0m (200cm) |
| legLength | 0.6 or 0.9 | 0.6 or 0.9 | 0.6 or 0.9 |

**Code Support**:
- [FormulaEvaluator.ts:260-261](src/utils/FormulaEvaluator.ts#L260-L261): `cornerDepth: options?.cornerDepth ?? (options?.isWallCabinet ? 0.4 : 0.6)`
- [EnhancedModels3D.tsx:266-267](src/components/3d/EnhancedModels3D.tsx#L266-L267): `const cornerDepth = isWallCabinet ? 0.4 : 0.6;`

---

## Expected Results

### Visual Appearance in 3D View

All corner units should now render as:
- ✅ Beautiful L-shaped corners (2 legs forming 90° angle)
- ✅ Doors on both faces (front and side)
- ✅ Handles on both doors (metallic appearance)
- ✅ Plinth at bottom (base/tall units only, 15cm toe-kick)
- ✅ Correct rotation for all 4 corner positions (front-left, front-right, back-left, back-right)

### Geometry Part Counts

| Component | Expected Parts | Structure |
|-----------|----------------|-----------|
| corner-cabinet | 7 | 6 L-shape + plinth |
| larder-corner-unit-60 | 7 | 6 L-shape + plinth |
| larder-corner-unit-90 | 7 | 6 L-shape + plinth |
| new-corner-wall-cabinet-60 | 6 | 6 L-shape |
| new-corner-wall-cabinet-90 | 6 | 6 L-shape |

---

## Testing

After running migration:

1. **Check 3D rendering**:
   - Place `corner-cabinet` in room
   - Verify L-shaped appearance
   - Verify doors on both faces
   - Verify plinth at bottom

2. **Check tall larders**:
   - Place `larder-corner-unit-60` in room
   - Place `larder-corner-unit-90` in room
   - Verify L-shape extends full height (200cm)
   - Verify plinth at bottom

3. **Check all corner positions**:
   - Test front-left corner position
   - Test front-right corner position
   - Test back-left corner position
   - Test back-right corner position
   - Verify rotation is correct for each

4. **Check console**:
   - No warnings about missing geometry parts
   - No errors in Model3DLoader
   - All corner units load successfully

---

## Migration Command

```bash
psql -U postgres -d kitchen_planner -f supabase/migrations/20251018000008_fix_corner_cabinet_geometry.sql
```

Or via Supabase:
```bash
npx supabase db reset
```

---

## Success Criteria

✅ All 5 corner units have geometry parts
✅ Base/tall units have 7 parts (L-shape + plinth)
✅ Wall units have 6 parts (L-shape)
✅ No console errors about missing geometry
✅ Corner cabinets render as L-shapes (not sinks!)
✅ All corner positions rotate correctly
✅ Plinth visible on base/tall units only

---

*Analysis complete - ready to run migration*
