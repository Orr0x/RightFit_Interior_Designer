-- =============================================================================
-- FIND COMPONENTS MISSING 3D MODELS
-- Date: 2025-10-18
-- Purpose: Identify which 5 components don't have corresponding 3D models
-- Session: feature/database-component-cleanup
-- =============================================================================

-- Current State:
-- - components: 192
-- - component_3d_models: 187
-- - Difference: 5 components missing 3D models

-- =============================================================================
-- 1. Find all components that don't have 3D models
-- =============================================================================

SELECT
  c.component_id,
  c.name,
  c.type,
  c.category,
  c.width,
  c.depth,
  c.height,
  '❌ MISSING_3D_MODEL' as status,
  CASE
    WHEN c.component_id LIKE '%corner%' OR c.name LIKE '%corner%' THEN 'CORNER_CABINET'
    WHEN c.component_id LIKE '%l-shaped%' OR c.name LIKE '%l-shaped%' THEN 'L_SHAPED'
    WHEN c.type = 'appliance' THEN 'APPLIANCE'
    WHEN c.type = 'cabinet' THEN 'CABINET'
    ELSE 'OTHER'
  END as category_type
FROM components c
WHERE NOT EXISTS (
  SELECT 1
  FROM component_3d_models cm
  WHERE cm.component_id = c.component_id
)
ORDER BY category_type, c.component_id;

-- =============================================================================
-- 2. Count missing 3D models by category
-- =============================================================================

SELECT
  CASE
    WHEN c.component_id LIKE '%corner%' OR c.name LIKE '%corner%' THEN 'Corner Cabinets'
    WHEN c.component_id LIKE '%l-shaped%' OR c.name LIKE '%l-shaped%' THEN 'L-Shaped Cabinets'
    WHEN c.type = 'appliance' THEN 'Appliances'
    WHEN c.type = 'cabinet' THEN 'Regular Cabinets'
    ELSE 'Other'
  END as category,
  COUNT(*) as missing_count,
  STRING_AGG(c.component_id, ', ' ORDER BY c.component_id) as component_ids
FROM components c
WHERE NOT EXISTS (
  SELECT 1
  FROM component_3d_models cm
  WHERE cm.component_id = c.component_id
)
GROUP BY category
ORDER BY missing_count DESC;

-- =============================================================================
-- 3. Check if missing components have 2D renders (should all have them)
-- =============================================================================

SELECT
  c.component_id,
  c.name,
  CASE WHEN cr.component_id IS NOT NULL THEN '✅ HAS_2D' ELSE '❌ MISSING_2D' END as render_2d_status,
  CASE WHEN cm.component_id IS NOT NULL THEN '✅ HAS_3D' ELSE '❌ MISSING_3D' END as model_3d_status
FROM components c
LEFT JOIN component_2d_renders cr ON cr.component_id = c.component_id
LEFT JOIN component_3d_models cm ON cm.component_id = c.component_id
WHERE cm.component_id IS NULL
ORDER BY c.component_id;

-- =============================================================================
-- 4. Compare with components that DO have 3D models
-- =============================================================================

SELECT
  'Components with 3D models' as metric,
  COUNT(*) as count
FROM components c
INNER JOIN component_3d_models cm ON cm.component_id = c.component_id
UNION ALL
SELECT
  'Components WITHOUT 3D models' as metric,
  COUNT(*) as count
FROM components c
WHERE NOT EXISTS (
  SELECT 1 FROM component_3d_models cm WHERE cm.component_id = c.component_id
)
UNION ALL
SELECT
  'Total components' as metric,
  COUNT(*) as count
FROM components;

-- =============================================================================
-- 5. Check if there are any remaining orphaned 3D models
-- =============================================================================

SELECT
  cm.component_id,
  cm.component_name,
  cm.geometry_type,
  '⚠️ ORPHANED_3D_MODEL' as status
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1
  FROM components c
  WHERE c.component_id = cm.component_id
)
ORDER BY cm.component_id;

-- =============================================================================
-- 6. Full link status matrix
-- =============================================================================

SELECT
  c.component_id,
  c.name,
  c.type,
  CASE WHEN cm.component_id IS NOT NULL THEN '✅' ELSE '❌' END as has_3d,
  CASE WHEN cr.component_id IS NOT NULL THEN '✅' ELSE '❌' END as has_2d,
  CASE
    WHEN cm.component_id IS NOT NULL AND cr.component_id IS NOT NULL THEN 'FULLY_LINKED'
    WHEN cm.component_id IS NULL AND cr.component_id IS NULL THEN 'COMPLETELY_BROKEN'
    WHEN cm.component_id IS NULL THEN 'MISSING_3D_ONLY'
    WHEN cr.component_id IS NULL THEN 'MISSING_2D_ONLY'
  END as link_status
FROM components c
LEFT JOIN component_3d_models cm ON cm.component_id = c.component_id
LEFT JOIN component_2d_renders cr ON cr.component_id = c.component_id
WHERE cm.component_id IS NULL OR cr.component_id IS NULL
ORDER BY link_status, c.component_id;

-- =============================================================================
-- 7. Summary statistics
-- =============================================================================

SELECT
  'Total components' as metric,
  COUNT(*) as count,
  '192 expected' as note
FROM components
UNION ALL
SELECT
  'Components with 3D models' as metric,
  COUNT(*) as count,
  '187 actual' as note
FROM components c
WHERE EXISTS (SELECT 1 FROM component_3d_models cm WHERE cm.component_id = c.component_id)
UNION ALL
SELECT
  'Components with 2D renders' as metric,
  COUNT(*) as count,
  '192 expected' as note
FROM components c
WHERE EXISTS (SELECT 1 FROM component_2d_renders cr WHERE cr.component_id = c.component_id)
UNION ALL
SELECT
  'Missing 3D models' as metric,
  COUNT(*) as count,
  'Need to fix' as note
FROM components c
WHERE NOT EXISTS (SELECT 1 FROM component_3d_models cm WHERE cm.component_id = c.component_id)
UNION ALL
SELECT
  'Orphaned 3D models' as metric,
  COUNT(*) as count,
  'Should be 0' as note
FROM component_3d_models cm
WHERE NOT EXISTS (SELECT 1 FROM components c WHERE c.component_id = cm.component_id);

-- =============================================================================
-- EXPECTED RESULTS
-- =============================================================================

-- Based on current counts:
-- - 192 components
-- - 187 component_3d_models
-- - 5 components missing 3D models
--
-- Likely candidates for missing 3D models:
-- 1. Corner cabinets (broken links from manual deletion)
-- 2. L-shaped cabinets (if any remain)
-- 3. Newly added components (added to components but no 3D model created)
--
-- Action Plan:
-- 1. Run this query to identify the 5 specific components
-- 2. Determine if they SHOULD have 3D models
-- 3. Either:
--    - Create 3D models for them
--    - Mark them as 2D-only components (if that's a valid category)
--    - Remove them if they're incomplete
