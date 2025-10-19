-- =============================================================================
-- FIND BROKEN CORNER CABINET LINKS
-- Date: 2025-10-18
-- Purpose: Identify corner cabinet components that exist but have broken 3D/2D links
-- Session: feature/database-component-cleanup
-- =============================================================================

-- Background:
-- User deleted 2 l-shaped corner cabinet rows directly from Supabase database.
-- Now corner base units exist in components table but don't link to 3D/2D tables.

-- =============================================================================
-- 1. Find all corner-related components
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
   OR name LIKE '%l-shaped%'
ORDER BY component_id;

-- =============================================================================
-- 2. Check 3D model links for corner components
-- =============================================================================

SELECT
  c.component_id,
  c.name,
  CASE
    WHEN cm.component_id IS NOT NULL THEN 'HAS_3D_MODEL'
    ELSE 'MISSING_3D_MODEL'
  END as model_3d_status,
  cm.geometry_type,
  cm.has_direction
FROM components c
LEFT JOIN component_3d_models cm ON cm.component_id = c.component_id
WHERE c.component_id LIKE '%corner%'
   OR c.name LIKE '%corner%'
   OR c.name LIKE '%l-shaped%'
ORDER BY model_3d_status, c.component_id;

-- =============================================================================
-- 3. Check 2D render links for corner components
-- =============================================================================

SELECT
  c.component_id,
  c.name,
  CASE
    WHEN cr.component_id IS NOT NULL THEN 'HAS_2D_RENDER'
    ELSE 'MISSING_2D_RENDER'
  END as render_2d_status,
  cr.plan_view_type,
  cr.elevation_type
FROM components c
LEFT JOIN component_2d_renders cr ON cr.component_id = c.component_id
WHERE c.component_id LIKE '%corner%'
   OR c.name LIKE '%corner%'
   OR c.name LIKE '%l-shaped%'
ORDER BY render_2d_status, c.component_id;

-- =============================================================================
-- 4. Comprehensive link status for ALL corner components
-- =============================================================================

SELECT
  c.component_id,
  c.name,
  c.width,
  c.depth,
  c.height,
  CASE WHEN cm.component_id IS NOT NULL THEN '✅' ELSE '❌' END as has_3d,
  CASE WHEN cr.component_id IS NOT NULL THEN '✅' ELSE '❌' END as has_2d,
  CASE WHEN gp.model_id IS NOT NULL THEN '✅ (' || COUNT(gp.id) || ')' ELSE '❌' END as has_geometry,
  CASE
    WHEN cm.component_id IS NULL AND cr.component_id IS NULL THEN 'COMPLETELY_BROKEN'
    WHEN cm.component_id IS NULL THEN 'MISSING_3D_ONLY'
    WHEN cr.component_id IS NULL THEN 'MISSING_2D_ONLY'
    ELSE 'FULLY_LINKED'
  END as link_status
FROM components c
LEFT JOIN component_3d_models cm ON cm.component_id = c.component_id
LEFT JOIN component_2d_renders cr ON cr.component_id = c.component_id
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
WHERE c.component_id LIKE '%corner%'
   OR c.name LIKE '%corner%'
   OR c.name LIKE '%l-shaped%'
GROUP BY c.component_id, c.name, c.width, c.depth, c.height, cm.component_id, cr.component_id
ORDER BY link_status, c.component_id;

-- =============================================================================
-- 5. Find orphaned 3D models that might be for corner cabinets
-- =============================================================================

SELECT
  cm.component_id,
  cm.component_name,
  cm.geometry_type,
  'ORPHANED_3D_MODEL' as status,
  CASE
    WHEN cm.component_id LIKE '%corner%' THEN 'CORNER_RELATED'
    WHEN cm.component_id LIKE '%l-shaped%' THEN 'L_SHAPED_RELATED'
    ELSE 'OTHER'
  END as category
FROM component_3d_models cm
WHERE (cm.component_id LIKE '%corner%' OR cm.component_id LIKE '%l-shaped%')
  AND NOT EXISTS (
    SELECT 1
    FROM components c
    WHERE c.component_id = cm.component_id
  )
ORDER BY category, cm.component_id;

-- =============================================================================
-- 6. Find orphaned 2D renders that might be for corner cabinets
-- =============================================================================

SELECT
  cr.component_id,
  cr.plan_view_type,
  cr.elevation_type,
  'ORPHANED_2D_RENDER' as status
FROM component_2d_renders cr
WHERE (cr.component_id LIKE '%corner%' OR cr.component_id LIKE '%l-shaped%')
  AND NOT EXISTS (
    SELECT 1
    FROM components c
    WHERE c.component_id = cr.component_id
  )
ORDER BY cr.component_id;

-- =============================================================================
-- 7. Summary of corner cabinet data integrity
-- =============================================================================

SELECT
  'Components (corner-related)' as metric,
  COUNT(*) as count
FROM components
WHERE component_id LIKE '%corner%' OR name LIKE '%corner%' OR name LIKE '%l-shaped%'
UNION ALL
SELECT
  'Components with 3D models' as metric,
  COUNT(*) as count
FROM components c
INNER JOIN component_3d_models cm ON cm.component_id = c.component_id
WHERE c.component_id LIKE '%corner%' OR c.name LIKE '%corner%' OR c.name LIKE '%l-shaped%'
UNION ALL
SELECT
  'Components with 2D renders' as metric,
  COUNT(*) as count
FROM components c
INNER JOIN component_2d_renders cr ON cr.component_id = c.component_id
WHERE c.component_id LIKE '%corner%' OR c.name LIKE '%corner%' OR c.name LIKE '%l-shaped%'
UNION ALL
SELECT
  'Orphaned 3D models (corner)' as metric,
  COUNT(*) as count
FROM component_3d_models cm
WHERE (cm.component_id LIKE '%corner%' OR cm.component_id LIKE '%l-shaped%')
  AND NOT EXISTS (SELECT 1 FROM components c WHERE c.component_id = cm.component_id)
UNION ALL
SELECT
  'Orphaned 2D renders (corner)' as metric,
  COUNT(*) as count
FROM component_2d_renders cr
WHERE (cr.component_id LIKE '%corner%' OR cr.component_id LIKE '%l-shaped%')
  AND NOT EXISTS (SELECT 1 FROM components c WHERE c.component_id = cr.component_id);

-- =============================================================================
-- 8. RECOMMENDED FIX: Match orphaned 3D/2D to existing component
-- =============================================================================

-- This query shows potential matches between:
--   - Components that exist but have no 3D/2D data
--   - Orphaned 3D/2D data that has no component

WITH components_missing_links AS (
  SELECT
    c.component_id,
    c.name,
    c.width,
    c.depth,
    c.height,
    CASE WHEN cm.component_id IS NULL THEN true ELSE false END as missing_3d,
    CASE WHEN cr.component_id IS NULL THEN true ELSE false END as missing_2d
  FROM components c
  LEFT JOIN component_3d_models cm ON cm.component_id = c.component_id
  LEFT JOIN component_2d_renders cr ON cr.component_id = c.component_id
  WHERE (c.component_id LIKE '%corner%' OR c.name LIKE '%corner%' OR c.name LIKE '%l-shaped%')
    AND (cm.component_id IS NULL OR cr.component_id IS NULL)
),
orphaned_3d AS (
  SELECT
    cm.component_id as orphaned_id,
    cm.component_name,
    cm.id as model_id,
    cm.geometry_type
  FROM component_3d_models cm
  WHERE (cm.component_id LIKE '%corner%' OR cm.component_id LIKE '%l-shaped%')
    AND NOT EXISTS (SELECT 1 FROM components c WHERE c.component_id = cm.component_id)
),
orphaned_2d AS (
  SELECT
    cr.component_id as orphaned_id,
    cr.id as render_id,
    cr.plan_view_type,
    cr.elevation_type
  FROM component_2d_renders cr
  WHERE (cr.component_id LIKE '%corner%' OR cr.component_id LIKE '%l-shaped%')
    AND NOT EXISTS (SELECT 1 FROM components c WHERE c.component_id = cr.component_id)
)
SELECT
  cml.component_id as existing_component,
  cml.name,
  cml.missing_3d,
  cml.missing_2d,
  o3d.orphaned_id as orphaned_3d_id,
  o3d.component_name as orphaned_3d_name,
  o2d.orphaned_id as orphaned_2d_id,
  '⚠️ NEEDS_MANUAL_REVIEW' as action
FROM components_missing_links cml
CROSS JOIN orphaned_3d o3d
CROSS JOIN orphaned_2d o2d
WHERE cml.missing_3d = true OR cml.missing_2d = true;

-- =============================================================================
-- 9. CLEANUP OPTION: Delete orphaned 3D/2D data for corner cabinets
-- =============================================================================

-- UNCOMMENT TO DELETE ORPHANED 3D MODELS:
/*
DELETE FROM component_3d_models
WHERE (component_id LIKE '%corner%' OR component_id LIKE '%l-shaped%')
  AND NOT EXISTS (
    SELECT 1
    FROM components c
    WHERE c.component_id = component_3d_models.component_id
  );
*/

-- UNCOMMENT TO DELETE ORPHANED 2D RENDERS:
/*
DELETE FROM component_2d_renders
WHERE (component_id LIKE '%corner%' OR component_id LIKE '%l-shaped%')
  AND NOT EXISTS (
    SELECT 1
    FROM components c
    WHERE c.component_id = component_2d_renders.component_id
  );
*/

-- =============================================================================
-- 10. List all l-shaped and corner component_ids for manual review
-- =============================================================================

SELECT
  'components' as table_name,
  component_id,
  name,
  'EXISTS' as status
FROM components
WHERE component_id LIKE '%corner%' OR name LIKE '%corner%' OR component_id LIKE '%l-shaped%' OR name LIKE '%l-shaped%'
UNION ALL
SELECT
  'component_3d_models' as table_name,
  component_id,
  component_name as name,
  CASE
    WHEN EXISTS (SELECT 1 FROM components c WHERE c.component_id = component_3d_models.component_id)
    THEN 'LINKED'
    ELSE 'ORPHANED'
  END as status
FROM component_3d_models
WHERE component_id LIKE '%corner%' OR component_name LIKE '%corner%' OR component_id LIKE '%l-shaped%' OR component_name LIKE '%l-shaped%'
UNION ALL
SELECT
  'component_2d_renders' as table_name,
  component_id,
  component_id as name,
  CASE
    WHEN EXISTS (SELECT 1 FROM components c WHERE c.component_id = component_2d_renders.component_id)
    THEN 'LINKED'
    ELSE 'ORPHANED'
  END as status
FROM component_2d_renders
WHERE component_id LIKE '%corner%' OR component_id LIKE '%l-shaped%'
ORDER BY table_name, component_id;
