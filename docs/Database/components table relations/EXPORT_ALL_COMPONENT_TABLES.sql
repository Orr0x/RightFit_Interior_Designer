-- =============================================================================
-- EXPORT ALL COMPONENT-RELATED TABLES
-- Date: 2025-10-18
-- Purpose: Export all tables with foreign key relationships to components table
-- Session: feature/database-component-cleanup
-- =============================================================================

-- Instructions:
-- Run each query and export results as JSON to the folder:
-- docs/Database/components table relations/
--
-- File naming: {table_name}.json
-- Example: components.json, component_3d_models.json, etc.

-- =============================================================================
-- CORE COMPONENT TABLES
-- =============================================================================

-- 1. COMPONENTS (Main catalog)
-- Export as: components.json
SELECT * FROM components ORDER BY component_id;

-- 2. COMPONENT_3D_MODELS (OLD 3D system)
-- Export as: component_3d_models.json
SELECT * FROM component_3d_models ORDER BY component_id;

-- 3. COMPONENT_2D_RENDERS (2D rendering)
-- Export as: component_2d_renders.json
SELECT * FROM component_2d_renders ORDER BY component_id;

-- 4. GEOMETRY_PARTS (3D sub-meshes)
-- Export as: geometry_parts.json
SELECT * FROM geometry_parts ORDER BY model_id, render_order;

-- 5. MATERIAL_DEFINITIONS (3D materials)
-- Export as: material_definitions.json
SELECT * FROM material_definitions ORDER BY material_name;

-- =============================================================================
-- NEW 3D SYSTEM TABLES
-- =============================================================================

-- 6. MODEL_3D (NEW 3D models)
-- Export as: model_3d.json
SELECT * FROM model_3d ORDER BY component_id;

-- 7. MODEL_3D_CONFIG (3D rendering config)
-- Export as: model_3d_config.json
SELECT * FROM model_3d_config ORDER BY component_id;

-- 8. MODEL_3D_PATTERNS (Pattern-based config)
-- Export as: model_3d_patterns.json
SELECT * FROM model_3d_patterns ORDER BY priority DESC, name;

-- 9. MODEL_3D_VARIANTS (Component variants)
-- Export as: model_3d_variants.json
SELECT * FROM model_3d_variants ORDER BY model_3d_id, variant_key;

-- =============================================================================
-- RELATED COMPONENT TABLES (if they exist)
-- =============================================================================

-- 10. COMPONENT_HARDWARE (if exists)
-- Export as: component_hardware.json
-- SELECT * FROM component_hardware ORDER BY component_id;

-- 11. COMPONENT_MATERIALS (if exists)
-- Export as: component_materials.json
-- SELECT * FROM component_materials ORDER BY component_id;

-- 12. COMPONENT_MATERIAL_COSTS (if exists)
-- Export as: component_material_costs.json
-- SELECT * FROM component_material_costs ORDER BY component_id;

-- 13. COMPONENT_MATERIAL_FINISHES (if exists)
-- Export as: component_material_finishes.json
-- SELECT * FROM component_material_finishes ORDER BY component_id;

-- 14. COMPONENT_METADATA (if exists)
-- Export as: component_metadata.json
-- SELECT * FROM component_metadata ORDER BY component_id;

-- 15. APPLIANCE_3D_TYPES (references model_3d)
-- Export as: appliance_3d_types.json
SELECT * FROM appliance_3d_types ORDER BY id;

-- 16. FURNITURE_3D_MODELS (references model_3d)
-- Export as: furniture_3d_models.json
SELECT * FROM furniture_3d_models ORDER BY id;

-- =============================================================================
-- ORPHANED RECORDS CHECKS
-- =============================================================================

-- ORPHANED: component_3d_models (no matching component)
SELECT
  'component_3d_models' as table_name,
  component_id,
  component_name,
  'ORPHANED' as status
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1 FROM components c WHERE c.component_id = cm.component_id
)
ORDER BY component_id;

-- ORPHANED: component_2d_renders (no matching component)
SELECT
  'component_2d_renders' as table_name,
  component_id,
  NULL as component_name,
  'ORPHANED' as status
FROM component_2d_renders cr
WHERE NOT EXISTS (
  SELECT 1 FROM components c WHERE c.component_id = cr.component_id
)
ORDER BY component_id;

-- ORPHANED: geometry_parts (no matching 3D model)
SELECT
  'geometry_parts' as table_name,
  id,
  part_name,
  model_id,
  'ORPHANED' as status
FROM geometry_parts gp
WHERE NOT EXISTS (
  SELECT 1 FROM component_3d_models cm WHERE cm.id = gp.model_id
)
ORDER BY model_id;

-- ORPHANED: model_3d (no matching component) - component_id is nullable so check both
SELECT
  'model_3d' as table_name,
  id,
  component_id,
  geometry_type,
  CASE
    WHEN component_id IS NULL THEN 'NO COMPONENT ID'
    ELSE 'ORPHANED'
  END as status
FROM model_3d m3d
WHERE component_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM components c WHERE c.component_id::text = m3d.component_id::text
  )
ORDER BY component_id;

-- ORPHANED: model_3d_config (no matching component)
SELECT
  'model_3d_config' as table_name,
  id,
  component_id,
  primary_material,
  CASE
    WHEN component_id IS NULL THEN 'NO COMPONENT ID'
    ELSE 'ORPHANED'
  END as status
FROM model_3d_config m3dc
WHERE component_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM components c WHERE c.component_id::text = m3dc.component_id::text
  )
ORDER BY component_id;

-- ORPHANED: model_3d_variants (no matching model_3d)
SELECT
  'model_3d_variants' as table_name,
  id,
  model_3d_id,
  variant_key,
  'ORPHANED' as status
FROM model_3d_variants m3dv
WHERE NOT EXISTS (
  SELECT 1 FROM model_3d m3d WHERE m3d.id = m3dv.model_3d_id
)
ORDER BY model_3d_id;

-- =============================================================================
-- MISSING RECORDS CHECKS
-- =============================================================================

-- MISSING: Components without component_3d_models
SELECT
  'components' as table_name,
  component_id,
  name,
  type,
  'MISSING component_3d_models' as issue
FROM components c
WHERE NOT EXISTS (
  SELECT 1 FROM component_3d_models cm WHERE cm.component_id = c.component_id
)
ORDER BY component_id;

-- MISSING: Components without component_2d_renders
SELECT
  'components' as table_name,
  component_id,
  name,
  type,
  'MISSING component_2d_renders' as issue
FROM components c
WHERE NOT EXISTS (
  SELECT 1 FROM component_2d_renders cr WHERE cr.component_id = c.component_id
)
ORDER BY component_id;

-- MISSING: Components without model_3d
SELECT
  'components' as table_name,
  component_id,
  name,
  type,
  'MISSING model_3d' as issue
FROM components c
WHERE NOT EXISTS (
  SELECT 1 FROM model_3d m3d WHERE m3d.component_id::text = c.component_id
)
ORDER BY component_id;

-- MISSING: Components without model_3d_config
SELECT
  'components' as table_name,
  component_id,
  name,
  type,
  'MISSING model_3d_config' as issue
FROM components c
WHERE NOT EXISTS (
  SELECT 1 FROM model_3d_config m3dc WHERE m3dc.component_id::text = c.component_id
)
ORDER BY component_id;

-- =============================================================================
-- SUMMARY STATISTICS
-- =============================================================================

SELECT
  'Total components' as metric,
  COUNT(*) as count
FROM components
UNION ALL
SELECT
  'Components with component_3d_models' as metric,
  COUNT(DISTINCT c.component_id)
FROM components c
INNER JOIN component_3d_models cm ON c.component_id = cm.component_id
UNION ALL
SELECT
  'Components with component_2d_renders' as metric,
  COUNT(DISTINCT c.component_id)
FROM components c
INNER JOIN component_2d_renders cr ON c.component_id = cr.component_id
UNION ALL
SELECT
  'Components with model_3d' as metric,
  COUNT(DISTINCT c.component_id)
FROM components c
INNER JOIN model_3d m3d ON c.component_id = m3d.component_id::text
UNION ALL
SELECT
  'Components with model_3d_config' as metric,
  COUNT(DISTINCT c.component_id)
FROM components c
INNER JOIN model_3d_config m3dc ON c.component_id = m3dc.component_id::text
UNION ALL
SELECT
  'Orphaned component_3d_models' as metric,
  COUNT(*)
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1 FROM components c WHERE c.component_id = cm.component_id
)
UNION ALL
SELECT
  'Orphaned component_2d_renders' as metric,
  COUNT(*)
FROM component_2d_renders cr
WHERE NOT EXISTS (
  SELECT 1 FROM components c WHERE c.component_id = cr.component_id
)
UNION ALL
SELECT
  'Orphaned geometry_parts' as metric,
  COUNT(*)
FROM geometry_parts gp
WHERE NOT EXISTS (
  SELECT 1 FROM component_3d_models cm WHERE cm.id = gp.model_id
)
UNION ALL
SELECT
  'Orphaned model_3d (has component_id but no component)' as metric,
  COUNT(*)
FROM model_3d m3d
WHERE component_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM components c WHERE c.component_id::text = m3d.component_id::text
  )
UNION ALL
SELECT
  'Orphaned model_3d_config (has component_id but no component)' as metric,
  COUNT(*)
FROM model_3d_config m3dc
WHERE component_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM components c WHERE c.component_id::text = m3dc.component_id::text
  )
UNION ALL
SELECT
  'Orphaned model_3d_variants' as metric,
  COUNT(*)
FROM model_3d_variants m3dv
WHERE NOT EXISTS (
  SELECT 1 FROM model_3d m3d WHERE m3d.id = m3dv.model_3d_id
);

-- =============================================================================
-- NS/EW COMPONENTS CHECK
-- =============================================================================

SELECT
  'NS/EW components in components table' as metric,
  COUNT(*) as count
FROM components
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew'
UNION ALL
SELECT
  'NS/EW in component_3d_models' as metric,
  COUNT(*) as count
FROM component_3d_models
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew'
UNION ALL
SELECT
  'NS/EW in component_2d_renders' as metric,
  COUNT(*) as count
FROM component_2d_renders
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew'
UNION ALL
SELECT
  'NS/EW in model_3d' as metric,
  COUNT(*) as count
FROM model_3d
WHERE component_id::text LIKE '%-ns' OR component_id::text LIKE '%-ew'
UNION ALL
SELECT
  'NS/EW in model_3d_config' as metric,
  COUNT(*) as count
FROM model_3d_config
WHERE component_id::text LIKE '%-ns' OR component_id::text LIKE '%-ew';
