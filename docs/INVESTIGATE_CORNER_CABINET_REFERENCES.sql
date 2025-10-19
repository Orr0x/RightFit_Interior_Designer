-- =============================================================================
-- INVESTIGATE CORNER CABINET REFERENCES
-- Date: 2025-10-18
-- Purpose: Find all references to corner cabinets and identify broken links
-- Session: feature/database-component-cleanup
-- =============================================================================

-- =============================================================================
-- 1. Check all corner cabinet component IDs in components table
-- =============================================================================

SELECT
  component_id,
  name,
  type,
  width,
  depth,
  height,
  category
FROM components
WHERE component_id LIKE '%corner%'
   OR name LIKE '%corner%'
   OR name LIKE '%Corner%'
ORDER BY category, component_id;

-- =============================================================================
-- 2. Check component_3d_models for corner cabinets
-- =============================================================================

SELECT
  component_id,
  component_name,
  geometry_type,
  is_corner_component,
  leg_length,
  corner_depth_wall,
  corner_depth_base
FROM component_3d_models
WHERE component_id LIKE '%corner%'
   OR component_name LIKE '%corner%'
   OR is_corner_component = true
ORDER BY component_id;

-- =============================================================================
-- 3. Find ORPHANED 3D models (no matching component)
-- =============================================================================

SELECT
  cm.component_id,
  cm.component_name,
  cm.geometry_type,
  'ORPHANED - No component exists' as status
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1 FROM components c
  WHERE c.component_id = cm.component_id
)
AND (
  cm.component_id LIKE '%corner%'
  OR cm.component_name LIKE '%corner%'
  OR cm.is_corner_component = true
)
ORDER BY cm.component_id;

-- =============================================================================
-- 4. Check component_2d_renders for corner cabinets
-- =============================================================================

SELECT
  component_id,
  plan_view_type,
  elevation_type,
  side_elevation_type
FROM component_2d_renders
WHERE component_id LIKE '%corner%'
ORDER BY component_id;

-- =============================================================================
-- 5. Find ORPHANED 2D renders (no matching component)
-- =============================================================================

SELECT
  cr.component_id,
  cr.plan_view_type,
  'ORPHANED - No component exists' as status
FROM component_2d_renders cr
WHERE NOT EXISTS (
  SELECT 1 FROM components c
  WHERE c.component_id = cr.component_id
)
AND cr.component_id LIKE '%corner%'
ORDER BY cr.component_id;

-- =============================================================================
-- 6. Find components WITHOUT 3D models
-- =============================================================================

SELECT
  c.component_id,
  c.name,
  c.category,
  'MISSING 3D MODEL' as issue
FROM components c
WHERE (
  c.component_id LIKE '%corner%'
  OR c.name LIKE '%corner%'
  OR c.name LIKE '%Corner%'
)
AND NOT EXISTS (
  SELECT 1 FROM component_3d_models cm
  WHERE cm.component_id = c.component_id
)
ORDER BY c.component_id;

-- =============================================================================
-- 7. Find components WITHOUT 2D renders
-- =============================================================================

SELECT
  c.component_id,
  c.name,
  c.category,
  'MISSING 2D RENDER' as issue
FROM components c
WHERE (
  c.component_id LIKE '%corner%'
  OR c.name LIKE '%corner%'
  OR c.name LIKE '%Corner%'
)
AND NOT EXISTS (
  SELECT 1 FROM component_2d_renders cr
  WHERE cr.component_id = c.component_id
)
ORDER BY c.component_id;

-- =============================================================================
-- 8. Complete corner cabinet status summary
-- =============================================================================

WITH corner_components AS (
  SELECT
    component_id,
    name,
    category,
    height
  FROM components
  WHERE component_id LIKE '%corner%'
     OR name LIKE '%corner%'
     OR name LIKE '%Corner%'
),
has_3d AS (
  SELECT DISTINCT component_id
  FROM component_3d_models
  WHERE component_id LIKE '%corner%'
     OR component_name LIKE '%corner%'
     OR is_corner_component = true
),
has_2d AS (
  SELECT DISTINCT component_id
  FROM component_2d_renders
  WHERE component_id LIKE '%corner%'
)
SELECT
  cc.component_id,
  cc.name,
  cc.category,
  cc.height,
  CASE WHEN h3d.component_id IS NOT NULL THEN '✅' ELSE '❌' END as has_3d_model,
  CASE WHEN h2d.component_id IS NOT NULL THEN '✅' ELSE '❌' END as has_2d_render,
  CASE
    WHEN h3d.component_id IS NULL THEN 'MISSING 3D MODEL'
    WHEN h2d.component_id IS NULL THEN 'MISSING 2D RENDER'
    ELSE 'OK'
  END as status
FROM corner_components cc
LEFT JOIN has_3d h3d ON cc.component_id = h3d.component_id
LEFT JOIN has_2d h2d ON cc.component_id = h2d.component_id
ORDER BY cc.category, cc.component_id;

-- =============================================================================
-- 9. Check what l-shaped-test-cabinet references still exist
-- =============================================================================

-- In component_3d_models
SELECT
  'component_3d_models' as table_name,
  component_id,
  component_name
FROM component_3d_models
WHERE component_id IN (
  'l-shaped-test-cabinet-60',
  'l-shaped-test-cabinet-90'
)
UNION ALL
-- In component_2d_renders
SELECT
  'component_2d_renders' as table_name,
  component_id,
  NULL as component_name
FROM component_2d_renders
WHERE component_id IN (
  'l-shaped-test-cabinet-60',
  'l-shaped-test-cabinet-90'
)
UNION ALL
-- In components
SELECT
  'components' as table_name,
  component_id,
  name as component_name
FROM components
WHERE component_id IN (
  'l-shaped-test-cabinet-60',
  'l-shaped-test-cabinet-90'
);

-- =============================================================================
-- 10. List ALL l-shaped and corner cabinet component IDs
-- =============================================================================

SELECT DISTINCT
  COALESCE(c.component_id, cm.component_id, cr.component_id) as component_id,
  c.name as component_name,
  CASE WHEN c.component_id IS NOT NULL THEN '✅' ELSE '❌' END as in_components,
  CASE WHEN cm.component_id IS NOT NULL THEN '✅' ELSE '❌' END as in_3d_models,
  CASE WHEN cr.component_id IS NOT NULL THEN '✅' ELSE '❌' END as in_2d_renders
FROM components c
FULL OUTER JOIN component_3d_models cm ON c.component_id = cm.component_id
FULL OUTER JOIN component_2d_renders cr ON c.component_id = cr.component_id
WHERE
  COALESCE(c.component_id, cm.component_id, cr.component_id) LIKE '%corner%'
  OR COALESCE(c.component_id, cm.component_id, cr.component_id) LIKE '%l-shaped%'
  OR c.name LIKE '%corner%'
  OR c.name LIKE '%Corner%'
  OR cm.component_name LIKE '%corner%'
  OR cm.component_name LIKE '%Corner%'
  OR cm.is_corner_component = true
ORDER BY component_id;
