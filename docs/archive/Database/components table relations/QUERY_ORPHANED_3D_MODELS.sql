-- =============================================================================
-- FIND ORPHANED component_3d_models RECORDS
-- Date: 2025-10-18
-- Purpose: Identify the 4 orphaned 3D models that don't have matching components
-- Session: feature/database-component-cleanup
-- =============================================================================

-- Based on DATABASE_STATUS_SUMMARY.md:
-- - components: 191 records
-- - component_3d_models: 195 records
-- - Difference: +4 orphaned 3D models

-- =============================================================================
-- 1. Find orphaned component_3d_models (component_id doesn't exist in components)
-- =============================================================================

SELECT
  cm.id,
  cm.component_id,
  cm.component_name,
  cm.geometry_type,
  cm.has_direction,
  cm.auto_rotate_enabled,
  'ORPHANED - NO COMPONENT' as status
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1
  FROM components c
  WHERE c.component_id = cm.component_id
)
ORDER BY cm.component_id;

-- =============================================================================
-- 2. Count orphaned records (should be 4)
-- =============================================================================

SELECT
  COUNT(*) as orphaned_count
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1
  FROM components c
  WHERE c.component_id = cm.component_id
);

-- =============================================================================
-- 3. Check if orphaned 3D models have associated geometry_parts
-- =============================================================================

SELECT
  cm.component_id,
  cm.component_name,
  COUNT(gp.id) as geometry_parts_count,
  STRING_AGG(gp.part_name, ', ' ORDER BY gp.part_name) as part_names
FROM component_3d_models cm
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
WHERE NOT EXISTS (
  SELECT 1
  FROM components c
  WHERE c.component_id = cm.component_id
)
GROUP BY cm.component_id, cm.component_name
ORDER BY cm.component_id;

-- =============================================================================
-- 4. Check if orphaned component_ids look like NS/EW variants
-- =============================================================================

SELECT
  cm.component_id,
  cm.component_name,
  CASE
    WHEN cm.component_id LIKE '%-ns' THEN 'NS_VARIANT'
    WHEN cm.component_id LIKE '%-ew' THEN 'EW_VARIANT'
    WHEN cm.component_id LIKE '%l-shaped%' THEN 'L_SHAPED_TEST'
    ELSE 'OTHER'
  END as orphan_type
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1
  FROM components c
  WHERE c.component_id = cm.component_id
)
ORDER BY orphan_type, cm.component_id;

-- =============================================================================
-- 5. Find potential base components for orphaned variants
-- =============================================================================

WITH orphaned_models AS (
  SELECT
    cm.component_id,
    cm.component_name,
    CASE
      WHEN cm.component_id LIKE '%-ns' THEN SUBSTRING(cm.component_id FROM 1 FOR LENGTH(cm.component_id) - 3)
      WHEN cm.component_id LIKE '%-ew' THEN SUBSTRING(cm.component_id FROM 1 FOR LENGTH(cm.component_id) - 3)
      ELSE cm.component_id
    END as potential_base_id
  FROM component_3d_models cm
  WHERE NOT EXISTS (
    SELECT 1
    FROM components c
    WHERE c.component_id = cm.component_id
  )
)
SELECT
  om.component_id as orphaned_id,
  om.component_name as orphaned_name,
  om.potential_base_id,
  CASE
    WHEN c.component_id IS NOT NULL THEN 'BASE_EXISTS'
    ELSE 'NO_BASE'
  END as base_status,
  c.name as base_name,
  c.width as base_width,
  c.depth as base_depth,
  c.height as base_height
FROM orphaned_models om
LEFT JOIN components c ON c.component_id = om.potential_base_id
ORDER BY base_status, om.component_id;

-- =============================================================================
-- 6. Summary: Orphaned records by type
-- =============================================================================

SELECT
  CASE
    WHEN cm.component_id LIKE '%-ns' THEN 'NS Variant'
    WHEN cm.component_id LIKE '%-ew' THEN 'EW Variant'
    WHEN cm.component_id LIKE '%l-shaped%' THEN 'L-Shaped Test'
    ELSE 'Other'
  END as orphan_category,
  COUNT(*) as count,
  STRING_AGG(cm.component_id, ', ' ORDER BY cm.component_id) as component_ids
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1
  FROM components c
  WHERE c.component_id = cm.component_id
)
GROUP BY orphan_category
ORDER BY count DESC;

-- =============================================================================
-- 7. Recommended action query (for reference)
-- =============================================================================

-- Option A: DELETE orphaned 3D models (recommended if they're NS/EW or test data)
-- UNCOMMENT TO EXECUTE:
/*
DELETE FROM component_3d_models
WHERE NOT EXISTS (
  SELECT 1
  FROM components c
  WHERE c.component_id = component_3d_models.component_id
);
*/

-- Option B: List component_ids to manually investigate
/*
SELECT component_id, component_name
FROM component_3d_models
WHERE NOT EXISTS (
  SELECT 1
  FROM components c
  WHERE c.component_id = component_3d_models.component_id
)
ORDER BY component_id;
*/
