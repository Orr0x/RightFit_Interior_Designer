# Database Cleanup TODO

**Status**: Deferred until after alignment/positioning/rotation fixes are complete
**Created**: 2025-10-17

## ✅ Confirmed Active Tables (2025-10-17 Update)

### Room-Related Tables (ACTIVE - DO NOT DELETE):
1. **`room_designs`** ✅ ACTIVE
   - Stores actual room designs with elements
   - Contains: `room_dimensions` (JSONB), `design_elements` (JSONB), room metadata
   - Example: `{"width": 600, "height": 400}` - INNER room dimensions
   - Critical: Used by Designer.tsx, DesignCanvas2D.tsx

2. **`room_types`** ✅ ACTIVE (likely)
   - Room type definitions (kitchen, bedroom, etc.)
   - Referenced by room_type field in room_designs

3. **`room_geometry_templates`** ⚠️ STATUS UNKNOWN
   - May be for complex/L-shaped rooms
   - Need to check if currently used

4. **`room_type_templates`** ⚠️ STATUS UNKNOWN
   - May be starter templates for room types
   - Need to check if currently used

## Tables to Investigate for Cleanup

These tables exist in the database but their current usage is unknown. They may be from previous implementation attempts or legacy systems.

### 1. `geometry_parts` (292KB)
- **Size**: Large table
- **Concern**: High priority to check - could be actively used for parametric component generation
- **Action**: Search codebase for references to `geometry_parts`
- **Possible outcomes**:
  - Active: Part of geometry generation system
  - Deprecated: Can be archived/removed

### 2. `furniture_types` (9.6KB)
- **Concern**: Medium priority
- **Action**: Check if this is used for component categorization
- **Possible outcomes**:
  - Active: Type system in use
  - Deprecated: Superseded by `component_type` field in components table

### 3. `appliance_types` (4.7KB)
- **Concern**: Low priority
- **Action**: Check if used for appliance categorization
- **Possible outcomes**:
  - Active: Appliance type system
  - Deprecated: Superseded by component-level categorization

### 4. `model_3d_config` (2.6KB)
- **Concern**: Medium priority
- **Action**: Check if superseded by `component_3d_models` table
- **Possible outcomes**:
  - Active: Additional 3D configuration layer
  - Deprecated: Old 3D config system (replaced)

### 5. `model_3d` (2.4KB)
- **Concern**: Medium priority
- **Action**: Check relationship with `component_3d_models`
- **Possible outcomes**:
  - Active: Master 3D model registry
  - Deprecated: Old 3D model tracking (replaced)

## Cleanup Strategy (When Ready)

1. **Search codebase**: `grep -r "table_name" src/`
2. **Check imports**: Look for Supabase queries referencing these tables
3. **If unused**:
   - Export data for archive (already done on 2025-10-17)
   - Document why table existed
   - Drop table or mark as deprecated
4. **If used**:
   - Document usage
   - Update this file with status

## Notes
- All tables exported to `docs/Database/json_exports 17-10-2025/` on 2025-10-17
- No immediate harm in leaving them
- Clean up after alignment/positioning/rotation session complete
- Priority: Complete Phase 2-5 of current work session first
