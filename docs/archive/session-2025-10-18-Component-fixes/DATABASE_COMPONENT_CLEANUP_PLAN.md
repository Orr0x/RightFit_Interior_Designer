# Database Component Cleanup Plan
## Session: 2025-10-18 - Database Component Cleanup

---

## Executive Summary

After fixing positioning issues with the per-view visibility system and elevation view coordinate mapping, we can now **remove the NS/EW duplicate component variants** that were created as a workaround for directional rendering.

**Key Finding**: The `-ns` (north-south) and `-ew` (east-west) suffixes were planned but **never actually implemented** in the database. The codebase has fallback logic to handle these variants, but they don't exist as separate database records.

---

## Current System Architecture

### Database Tables

1. **`components`** - Component catalog (UI selector)
   - component_id (PK)
   - name, type, width, depth, height
   - category, room_types
   - mount_type, has_direction, door_side
   - default_z_position, elevation_height
   - ~78 kitchen components

2. **`component_3d_models`** - 3D rendering geometry
   - component_id (FK → components.component_id)
   - geometry_type ('standard', 'l_shaped_corner', 'larder_corner')
   - rotation settings (auto_rotate_enabled, wall_rotation_*)
   - is_corner_component, leg_length
   - Linked to geometry_parts (sub-meshes)

3. **`component_2d_renders`** - 2D rendering metadata
   - component_id (FK → components.component_id)
   - plan_view_type, elevation_type
   - SVG paths for custom shapes
   - fill_color, stroke_color

4. **`geometry_parts`** - 3D sub-meshes
   - model_id (FK → component_3d_models.id)
   - part_name ('cabinet_body', 'door', 'handle', 'plinth')
   - position/dimension formulas (evaluated at runtime)
   - material_name, render_condition

5. **`material_definitions`** - 3D material properties
   - material_name (PK)
   - roughness, metalness, opacity
   - default_color

---

## NS/EW Component Analysis

### What We Discovered

**Fallback Logic Found** (3 locations):
1. [src/hooks/useComponentMetadata.ts:77](src/hooks/useComponentMetadata.ts#L77) - Component metadata lookup
2. [src/services/Model3DLoaderService.ts:141](src/services/Model3DLoaderService.ts#L141) - 3D model loading
3. [src/services/Render2DService.ts:154](src/services/Render2DService.ts#L154) - 2D render config loading

**Code Pattern**:
```typescript
// 🔧 FALLBACK: If not found, try stripping directional suffixes (-ns, -ew)
// These variants are just rotational orientations of the same base component
if (!found && (componentId.endsWith('-ns') || componentId.endsWith('-ew'))) {
  const baseComponentId = componentId.slice(0, -3); // Remove last 3 chars ("-ns" or "-ew")
  found = metadata.find(m => m.component_id === baseComponentId);
}
```

### What This Means

1. **No Duplicate Components**: The database does NOT contain any components with `-ns` or `-ew` suffixes
2. **Fallback Only**: The code handles these variants by stripping the suffix and using the base component
3. **Rotation Handles Direction**: Component rotation (0°, 90°, 180°, 270°) handles all orientations
4. **No Cleanup Needed**: There are no NS/EW duplicates to remove from the database!

---

## Why This System Works

### Rotation System (Current Implementation)

The `component_3d_models` table has sophisticated rotation fields:

```sql
-- Auto-rotate rules (from schema)
has_direction BOOLEAN DEFAULT FALSE,
auto_rotate_enabled BOOLEAN DEFAULT TRUE,
wall_rotation_left INTEGER,    -- 90
wall_rotation_right INTEGER,   -- 270
wall_rotation_top INTEGER,      -- 0
wall_rotation_bottom INTEGER,   -- 180
corner_rotation_front_left INTEGER,
corner_rotation_front_right INTEGER,
corner_rotation_back_left INTEGER,
corner_rotation_back_right INTEGER,
```

**How It Works**:
1. Component has single base definition (e.g., `base-cabinet-60`)
2. When placed, rotation is calculated based on wall position
3. Same component rotates to face correct direction
4. No need for `-ns` or `-ew` variants

### Per-View Visibility System (Just Implemented)

The new per-view visibility system (implemented in previous session) makes directional variants unnecessary:

```typescript
export interface ElevationViewConfig {
  id: string;                     // "front-default", "back-1", etc.
  direction: 'front' | 'back' | 'left' | 'right' | 'plan' | '3d';
  label: string;                   // User-friendly name
  hidden_elements: string[];       // Element IDs to hide in this view
  is_default: boolean;
  sort_order: number;
}
```

**Benefits**:
- Each view can hide/show specific element instances
- Same component rotated differently = different instances
- Visibility controlled per view, not per component type

---

## Actual Cleanup Needed

Since there are **no NS/EW duplicates in the database**, the cleanup is minimal:

### ✅ Code Cleanup Only

**1. Keep Fallback Logic** (Recommended)
- The fallback code is defensive and harmless
- Protects against future edge cases
- Very low performance cost (simple string check)
- **Recommendation**: KEEP the fallback logic

**2. Document Why It Exists** (Optional)
- Add comments explaining the fallback is protective, not corrective
- Clarify that no actual NS/EW components exist

**3. Verify No Legacy Data** (Safety Check)
- Query database to confirm zero components with `-ns` or `-ew` suffixes
- Check existing room_designs for any legacy component_id references

---

## Database Verification Queries

### Check for NS/EW Components

```sql
-- Check components table
SELECT component_id, name
FROM components
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';
-- Expected: 0 rows

-- Check component_3d_models table
SELECT component_id, component_name
FROM component_3d_models
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';
-- Expected: 0 rows

-- Check component_2d_renders table
SELECT component_id
FROM component_2d_renders
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';
-- Expected: 0 rows
```

### Check for Legacy References in Designs

```sql
-- Check room_designs for NS/EW element references
SELECT
  id,
  room_type,
  jsonb_array_length(design_elements) as element_count
FROM room_designs
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(design_elements) AS elem
  WHERE elem->>'component_id' LIKE '%-ns'
     OR elem->>'component_id' LIKE '%-ew'
);
-- Expected: 0 rows (unless old test data exists)
```

---

## Table Relationships Summary

```
components (catalog)
  ├─→ component_3d_models (3D geometry)
  │    └─→ geometry_parts (sub-meshes)
  │         └─→ material_definitions (materials)
  └─→ component_2d_renders (2D rendering)

room_designs (user data)
  └─→ design_elements[] (JSONB)
       └─→ component_id (references components.component_id)
```

**Foreign Key Constraints**:
- `component_3d_models.component_id` → `components.component_id` (ON DELETE CASCADE)
- `component_2d_renders.component_id` → `components.component_id` (ON DELETE CASCADE)
- `geometry_parts.model_id` → `component_3d_models.id` (ON DELETE CASCADE)
- `room_designs.design_elements` → No FK constraint (JSONB, validated in app)

---

## Recommended Actions

### ✅ Immediate Actions (Safe)

1. **Run Verification Queries** - Confirm zero NS/EW components
2. **Document Findings** - Update this document with query results
3. **Add Code Comments** - Explain fallback logic purpose

### ⚠️ Optional Actions (Consider Later)

1. **Remove Fallback Logic** - Only if 100% certain it's unnecessary
   - Risk: Low (defensive code)
   - Benefit: Minimal (tiny performance gain)
   - **Recommendation**: Don't remove, keep as safety net

2. **Add Migration to Clean Legacy Data** - If any old designs have NS/EW references
   - Create migration to strip `-ns`/`-ew` from old design_elements
   - Only if verification query finds legacy data

### ❌ Not Needed

1. **Delete NS/EW Components** - They don't exist!
2. **Update Component Dimensions** - Already fixed in previous session
3. **Create Rotation System** - Already exists in `component_3d_models`

---

## Testing Checklist

Before closing this investigation:

- [ ] Run all verification queries
- [ ] Document query results below
- [ ] Check for any test data with NS/EW components
- [ ] Verify rotation system works in all elevation views
- [ ] Confirm per-view visibility working correctly
- [ ] Test component placement in different orientations

---

## Verification Results

*(To be filled after running queries)*

### Components Table
```
Query: SELECT COUNT(*) FROM components WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';
Result: [PENDING]
```

### Component 3D Models Table
```
Query: SELECT COUNT(*) FROM component_3d_models WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';
Result: [PENDING]
```

### Component 2D Renders Table
```
Query: SELECT COUNT(*) FROM component_2d_renders WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';
Result: [PENDING]
```

### Room Designs Legacy Data
```
Query: [See "Check for Legacy References in Designs" above]
Result: [PENDING]
```

---

## Conclusion

**Initial Assessment**: We expected to find duplicate NS/EW components to clean up.

**CORRECTED Finding**: 32 NS/EW duplicate components DO exist in the database!

**Pattern Discovered**: NS/EW variants are dimension-swapped duplicates:
- NS variant: width × depth (e.g., 30 × 60)
- EW variant: depth × width (e.g., 60 × 30)

**Action Taken**:
1. ✅ Created detailed analysis: [NS_EW_COMPONENTS_ANALYSIS.md](NS_EW_COMPONENTS_ANALYSIS.md)
2. ✅ Created cleanup migration: [20251018000005_cleanup_ns_ew_duplicate_components.sql](../supabase/migrations/20251018000005_cleanup_ns_ew_duplicate_components.sql)
3. ⏳ Ready to execute cleanup (pending user approval)

**Next Steps**: Execute migration to remove 32 duplicate components.

---

## References

- Session: 2025-10-18 View-Specific Visibility
- Session: 2025-10-18 Code Cleanup and Elevation Selection
- Database Schema: [20250129000006_create_3d_models_schema.sql](supabase/migrations/20250129000006_create_3d_models_schema.sql)
- 2D Renders: [20251009000001_create_2d_renders_schema.sql](supabase/migrations/20251009000001_create_2d_renders_schema.sql)
- Component Types: [src/types/project.ts](src/types/project.ts)

---

*Generated: 2025-10-18*
*Branch: feature/database-component-cleanup*
