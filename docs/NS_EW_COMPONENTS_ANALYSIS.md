# NS/EW Components Analysis
## Session: 2025-10-18 - Database Component Cleanup

---

## Key Discovery: The Width/Depth Swap Pattern

From the JSON export, I can now see the **exact pattern** of NS/EW duplicates:

### Example: Base Cabinet 30cm

| component_id | width | depth | height | orientation |
|--------------|-------|-------|--------|-------------|
| base-cabinet-30 | 30 | 60 | 90 | (base) |
| base-cabinet-30-ns | **30** | **60** | 90 | N/S |
| base-cabinet-30-ew | **60** | **30** | 90 | E/W |

**Pattern**: NS/EW variants are just **width/depth swapped** versions of the same component!

- **NS (North-South)**: Original dimensions (width × depth)
- **EW (East-West)**: Swapped dimensions (depth × width)

---

## Total Duplicates Found

**32 NS/EW variant components** (16 pairs):

### Base Cabinets (10 components = 5 pairs)
- base-cabinet-30-ns / base-cabinet-30-ew
- base-cabinet-40-ns / base-cabinet-40-ew
- base-cabinet-50-ns / base-cabinet-50-ew
- base-cabinet-80-ns / base-cabinet-80-ew
- base-cabinet-100-ns / base-cabinet-100-ew

### Pan Drawers (12 components = 6 pairs)
- pan-drawers-30-ns / pan-drawers-30-ew
- pan-drawers-40-ns / pan-drawers-40-ew
- pan-drawers-50-ns / pan-drawers-50-ew
- pan-drawers-80-ns / pan-drawers-80-ew
- pan-drawers-100-ns / pan-drawers-100-ew
- (Missing pan-drawers-60 variants)

### Wall Cabinets (8 components = 4 pairs)
- wall-cabinet-30-ns / wall-cabinet-30-ew
- wall-cabinet-50-ns / wall-cabinet-50-ew
- wall-cabinet-60-ns / wall-cabinet-60-ew
- wall-cabinet-80-ns / wall-cabinet-80-ew

### Corner Wall Cabinets (4 components = 2 pairs)
- new-corner-wall-cabinet-60-ns / new-corner-wall-cabinet-60-ew
- new-corner-wall-cabinet-90-ns / new-corner-wall-cabinet-90-ew

**NOTE**: Corner cabinets have identical width/depth (60×60, 90×90) so NS/EW variants are truly duplicates!

---

## Why These Exist

The NS/EW variants were created to handle **rotation in plan view**:

### Old System (Pre-Rotation Fix)
- Component placed against **north/south walls** → Use NS variant (width × depth)
- Component placed against **east/west walls** → Use EW variant (depth × width)
- System **swapped dimensions** to make component fit the wall orientation

### New System (Post-Rotation Fix - Current)
- Component has **single base definition** with original dimensions
- **Rotation applied** at render time (0°, 90°, 180°, 270°)
- Rotation automatically **handles width/depth orientation**
- No need for dimension-swapped duplicates

---

## Dimension Analysis

### Base Cabinets Pattern

| Size | NS (width × depth) | EW (width × depth) | Height |
|------|-------------------|-------------------|---------|
| 30cm | 30 × 60 | 60 × 30 | 90 |
| 40cm | 40 × 60 | 60 × 40 | 90 |
| 50cm | 50 × 60 | 60 × 50 | 90 |
| 80cm | 80 × 60 | 60 × 80 | 90 |
| 100cm | 100 × 60 | 60 × 100 | 90 |

**Base component dimensions**: {size} × 60 × 90

### Wall Cabinets Pattern

| Size | NS (width × depth) | EW (width × depth) | Height |
|------|-------------------|-------------------|---------|
| 30cm | 30 × 40 | 40 × 30 | 70 |
| 50cm | 50 × 40 | 40 × 50 | 70 |
| 60cm | 60 × 40 | 40 × 60 | 70 |
| 80cm | 80 × 40 | 40 × 80 | 70 |

**Base component dimensions**: {size} × 40 × 70

### Corner Wall Cabinets (IDENTICAL!)

| Size | NS (width × depth) | EW (width × depth) | Height |
|------|-------------------|-------------------|---------|
| 60cm | 60 × 60 | 60 × 60 | 70 |
| 90cm | 60 × 60 | 60 × 60 | 70 |

**These are 100% duplicates** - width equals depth, so NS/EW are identical!

---

## Current Rotation System

From `component_3d_models` table schema:

```sql
-- Auto-rotate rules
has_direction BOOLEAN DEFAULT FALSE,
auto_rotate_enabled BOOLEAN DEFAULT TRUE,
wall_rotation_left INTEGER,    -- 90°
wall_rotation_right INTEGER,   -- 270°
wall_rotation_top INTEGER,      -- 0°
wall_rotation_bottom INTEGER,   -- 180°
```

**This system already handles orientation** - no need for NS/EW variants!

---

## Cleanup Strategy

### Phase 1: Delete NS/EW Variants (Safe)

**Components to DELETE**: All 32 NS/EW variants

**Why Safe**:
1. Base components exist (e.g., `base-cabinet-30`, `wall-cabinet-60`)
2. Rotation system handles orientation automatically
3. Fallback code already strips `-ns`/`-ew` suffixes

### Phase 2: Update Fallback Code (Post-Cleanup)

**Current Fallback** (3 locations):
```typescript
// 🔧 FALLBACK: If not found, try stripping directional suffixes (-ns, -ew)
if (!found && (componentId.endsWith('-ns') || componentId.endsWith('-ew'))) {
  const baseComponentId = componentId.slice(0, -3);
  found = metadata.find(m => m.component_id === baseComponentId);
}
```

**Options**:
1. **Keep fallback** - Protects against old design data
2. **Remove fallback** - Clean up after migration

**Recommendation**: Keep fallback temporarily, remove after verifying no user designs reference NS/EW variants.

---

## Migration Plan

### Step 1: Check for User References

```sql
-- Check if any room_designs reference NS/EW components
SELECT
  rd.id as design_id,
  rd.room_type,
  elem->>'component_id' as component_id,
  elem->>'name' as element_name
FROM room_designs rd,
  LATERAL jsonb_array_elements(rd.design_elements) as elem
WHERE elem->>'component_id' LIKE '%-ns'
   OR elem->>'component_id' LIKE '%-ew'
LIMIT 100;
```

### Step 2: Migrate User Data (if needed)

```sql
-- Update room_designs to use base components
UPDATE room_designs
SET design_elements = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'component_id' LIKE '%-ew' THEN
        jsonb_set(elem, '{component_id}',
          to_jsonb(substring(elem->>'component_id' from 1 for length(elem->>'component_id') - 3)))
      WHEN elem->>'component_id' LIKE '%-ns' THEN
        jsonb_set(elem, '{component_id}',
          to_jsonb(substring(elem->>'component_id' from 1 for length(elem->>'component_id') - 3)))
      ELSE elem
    END
  )
  FROM jsonb_array_elements(design_elements) as elem
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(design_elements) as elem
  WHERE elem->>'component_id' LIKE '%-ns'
     OR elem->>'component_id' LIKE '%-ew'
);
```

### Step 3: Delete NS/EW Components

```sql
-- Delete from component_2d_renders (if exists)
DELETE FROM component_2d_renders
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';

-- Delete from component_3d_models (if exists)
DELETE FROM component_3d_models
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';

-- Delete from components (main table)
DELETE FROM components
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';
```

### Step 4: Verify Cleanup

```sql
-- Should return 0
SELECT COUNT(*) FROM components
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';

-- Should return 0
SELECT COUNT(*) FROM component_3d_models
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';

-- Should return 0
SELECT COUNT(*) FROM component_2d_renders
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';
```

---

## Risk Assessment

### Low Risk
- ✅ Base components exist for all variants
- ✅ Rotation system already in place
- ✅ Fallback code handles missing variants
- ✅ Per-view visibility system doesn't depend on NS/EW

### Medium Risk
- ⚠️ User designs might reference NS/EW variants
- ⚠️ Need to migrate user data before deletion

### High Risk
- ❌ None identified

---

## Expected Outcomes

### Before Cleanup
- **Total Components**: ~210
- **NS/EW Variants**: 32
- **Base Components**: ~178

### After Cleanup
- **Total Components**: ~178 (-32)
- **NS/EW Variants**: 0
- **Base Components**: ~178 (unchanged)

### Benefits
1. **Simpler Database**: Fewer duplicate components
2. **Cleaner UI**: Component selector shows one option per size
3. **Easier Maintenance**: Single source of truth for each component
4. **Better Performance**: Fewer components to query/render
5. **Correct Architecture**: Rotation handles orientation, not duplicates

---

## Component Categories Affected

### ✅ Has NS/EW Variants (To Clean)
- base-cabinets (5 sizes)
- pan-drawers (5 sizes)
- wall-cabinets (4 sizes)
- corner wall cabinets (2 sizes)

### ❌ No NS/EW Variants (No Action)
- Tall units
- Appliances
- Sinks
- Counter-tops
- Doors/Windows
- Furniture
- Bathroom fixtures
- All other room components

---

## Next Steps

1. ✅ **Analyze data** - COMPLETED (this document)
2. 🔄 **Run user data query** - Check for NS/EW references in designs
3. ⏳ **Create migration** - SQL script to clean NS/EW duplicates
4. ⏳ **Test migration** - Dry run on backup database
5. ⏳ **Execute cleanup** - Run migration on production
6. ⏳ **Verify results** - Confirm deletion and test app
7. ⏳ **Update code** - Optionally remove fallback logic

---

## Summary

**Problem**: 32 NS/EW duplicate components exist with swapped width/depth dimensions.

**Root Cause**: Old workaround for rotation before proper rotation system existed.

**Solution**: Delete all NS/EW variants, rely on rotation system.

**Impact**: -32 components, cleaner architecture, no functionality loss.

**Status**: Analysis complete, ready to create cleanup migration.

---

*Generated: 2025-10-18*
*Branch: feature/database-component-cleanup*
*Data Source: docs/Database/json_exports 17-10-2025/components_rows.json*
