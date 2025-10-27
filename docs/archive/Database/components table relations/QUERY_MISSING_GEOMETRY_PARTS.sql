-- =============================================================================
-- FIND 3D MODELS WITHOUT GEOMETRY PARTS
-- Date: 2025-10-18
-- Purpose: Identify component_3d_models that have no geometry_parts
-- Session: feature/database-component-cleanup
-- =============================================================================

-- =============================================================================
-- 1. Find all 3D models without geometry parts
-- =============================================================================

SELECT
  cm.id as model_id,
  cm.component_id,
  cm.component_name,
  cm.geometry_type,
  cm.is_corner_component,
  COUNT(gp.id) as geometry_parts_count,
  CASE
    WHEN COUNT(gp.id) = 0 THEN '❌ MISSING_GEOMETRY'
    ELSE '✅ HAS_GEOMETRY'
  END as status
FROM component_3d_models cm
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
GROUP BY cm.id, cm.component_id, cm.component_name, cm.geometry_type, cm.is_corner_component
HAVING COUNT(gp.id) = 0
ORDER BY cm.component_id;

-- =============================================================================
-- 2. Check specific UUIDs from console warnings
-- =============================================================================

-- From console: No geometry parts found for model: 00092160-23ba-462c-a3d4-b20b433c7f5a
SELECT
  cm.id,
  cm.component_id,
  cm.component_name,
  cm.geometry_type,
  'From console warning' as note
FROM component_3d_models cm
WHERE cm.id = '00092160-23ba-462c-a3d4-b20b433c7f5a';

-- From console: No geometry parts found for model: 2ef3ddf6-2e41-4cea-affd-a76e8e1ec164
SELECT
  cm.id,
  cm.component_id,
  cm.component_name,
  cm.geometry_type,
  'From console warning' as note
FROM component_3d_models cm
WHERE cm.id = '2ef3ddf6-2e41-4cea-affd-a76e8e1ec164';

-- From console: No geometry parts found for model: 04a1f145-221e-43fd-a7d1-2652048c3bb7
SELECT
  cm.id,
  cm.component_id,
  cm.component_name,
  cm.geometry_type,
  'From console warning' as note
FROM component_3d_models cm
WHERE cm.id = '04a1f145-221e-43fd-a7d1-2652048c3bb7';

-- =============================================================================
-- 3. Count 3D models by geometry status
-- =============================================================================

SELECT
  CASE
    WHEN COUNT(gp.id) > 0 THEN '✅ Has geometry parts'
    ELSE '❌ Missing geometry parts'
  END as status,
  COUNT(DISTINCT cm.id) as model_count,
  STRING_AGG(cm.component_id, ', ' ORDER BY cm.component_id) as component_ids
FROM component_3d_models cm
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
GROUP BY CASE WHEN COUNT(gp.id) > 0 THEN '✅ Has geometry parts' ELSE '❌ Missing geometry parts' END
ORDER BY status;

-- =============================================================================
-- 4. Compare corner-cabinet to similar L-shaped components
-- =============================================================================

-- Find L-shaped corner components that DO have geometry
SELECT
  cm.component_id,
  cm.component_name,
  cm.geometry_type,
  COUNT(gp.id) as geometry_parts_count,
  STRING_AGG(gp.part_name, ', ' ORDER BY gp.part_name) as part_names
FROM component_3d_models cm
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
WHERE cm.geometry_type = 'l_shaped_corner'
  AND cm.component_id != 'corner-cabinet'
GROUP BY cm.component_id, cm.component_name, cm.geometry_type
ORDER BY cm.component_id;

-- =============================================================================
-- EXPECTED RESULTS
-- =============================================================================

-- Query 1 should show which components are missing geometry
-- Likely includes: corner-cabinet, dishwasher, refrigerator (created in migration)
--
-- Query 4 should show similar L-shaped components with geometry parts
-- Use these as templates for creating corner-cabinet geometry
