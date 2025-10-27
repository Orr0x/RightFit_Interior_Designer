-- Query to find all components with NS/EW variants
-- Session: 2025-10-18 - Database Component Cleanup

-- =====================================================
-- 1. Count components with NS/EW in name
-- =====================================================

SELECT
  COUNT(*) as total_ns_ew_components
FROM components
WHERE name LIKE '%(E/W)%' OR name LIKE '%(N/S)%';

-- =====================================================
-- 2. List all NS/EW components with their details
-- =====================================================

SELECT
  component_id,
  name,
  type,
  width,
  depth,
  height,
  category,
  CASE
    WHEN name LIKE '%(E/W)%' THEN 'EW'
    WHEN name LIKE '%(N/S)%' THEN 'NS'
  END as orientation
FROM components
WHERE name LIKE '%(E/W)%' OR name LIKE '%(N/S)%'
ORDER BY name;

-- =====================================================
-- 3. Group by base component name (without orientation)
-- =====================================================

SELECT
  REPLACE(REPLACE(name, ' (E/W)', ''), ' (N/S)', '') as base_name,
  COUNT(*) as variant_count,
  STRING_AGG(component_id, ', ' ORDER BY component_id) as component_ids
FROM components
WHERE name LIKE '%(E/W)%' OR name LIKE '%(N/S)%'
GROUP BY REPLACE(REPLACE(name, ' (E/W)', ''), ' (N/S)', '')
ORDER BY base_name;

-- =====================================================
-- 4. Find components with -ns or -ew suffix in ID
-- =====================================================

SELECT
  component_id,
  name,
  type,
  category,
  CASE
    WHEN component_id LIKE '%-ew' THEN 'EW'
    WHEN component_id LIKE '%-ns' THEN 'NS'
  END as orientation_suffix
FROM components
WHERE component_id LIKE '%-ew' OR component_id LIKE '%-ns'
ORDER BY component_id;

-- =====================================================
-- 5. Find base components that have NS/EW variants
-- =====================================================

WITH ns_ew_components AS (
  SELECT
    CASE
      WHEN component_id LIKE '%-ew' THEN SUBSTRING(component_id FROM 1 FOR LENGTH(component_id) - 3)
      WHEN component_id LIKE '%-ns' THEN SUBSTRING(component_id FROM 1 FOR LENGTH(component_id) - 3)
      ELSE NULL
    END as base_component_id,
    component_id as variant_id,
    name
  FROM components
  WHERE component_id LIKE '%-ew' OR component_id LIKE '%-ns'
)
SELECT
  base.component_id as base_id,
  base.name as base_name,
  base.width,
  base.depth,
  base.height,
  COUNT(variants.variant_id) as num_variants,
  STRING_AGG(variants.variant_id, ', ' ORDER BY variants.variant_id) as variant_ids
FROM components base
LEFT JOIN ns_ew_components variants ON base.component_id = variants.base_component_id
WHERE variants.base_component_id IS NOT NULL
GROUP BY base.component_id, base.name, base.width, base.depth, base.height
ORDER BY base.component_id;

-- =====================================================
-- 6. Check for orphaned variants (variant exists but no base)
-- =====================================================

WITH ns_ew_components AS (
  SELECT
    CASE
      WHEN component_id LIKE '%-ew' THEN SUBSTRING(component_id FROM 1 FOR LENGTH(component_id) - 3)
      WHEN component_id LIKE '%-ns' THEN SUBSTRING(component_id FROM 1 FOR LENGTH(component_id) - 3)
    END as base_component_id,
    component_id as variant_id,
    name
  FROM components
  WHERE component_id LIKE '%-ew' OR component_id LIKE '%-ns'
)
SELECT
  variants.variant_id,
  variants.name,
  variants.base_component_id,
  CASE WHEN base.component_id IS NULL THEN 'ORPHANED - NO BASE' ELSE 'OK' END as status
FROM ns_ew_components variants
LEFT JOIN components base ON base.component_id = variants.base_component_id
WHERE base.component_id IS NULL;

-- =====================================================
-- 7. Summary statistics
-- =====================================================

SELECT
  'Total Components' as metric,
  COUNT(*) as count
FROM components
UNION ALL
SELECT
  'Components with NS/EW in name' as metric,
  COUNT(*) as count
FROM components
WHERE name LIKE '%(E/W)%' OR name LIKE '%(N/S)%'
UNION ALL
SELECT
  'Components with -ns suffix' as metric,
  COUNT(*) as count
FROM components
WHERE component_id LIKE '%-ns'
UNION ALL
SELECT
  'Components with -ew suffix' as metric,
  COUNT(*) as count
FROM components
WHERE component_id LIKE '%-ew'
UNION ALL
SELECT
  'Total NS/EW variants' as metric,
  COUNT(*) as count
FROM components
WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';

-- =====================================================
-- 8. Check component_3d_models for NS/EW duplicates
-- =====================================================

SELECT
  component_id,
  component_name,
  geometry_type,
  has_direction,
  auto_rotate_enabled
FROM component_3d_models
WHERE component_id LIKE '%-ew' OR component_id LIKE '%-ns'
ORDER BY component_id;

-- =====================================================
-- 9. Check component_2d_renders for NS/EW duplicates
-- =====================================================

SELECT
  component_id,
  plan_view_type,
  elevation_type,
  side_elevation_type
FROM component_2d_renders
WHERE component_id LIKE '%-ew' OR component_id LIKE '%-ns'
ORDER BY component_id;

-- =====================================================
-- 10. Sample comparison: Base vs NS vs EW
-- =====================================================

SELECT
  component_id,
  name,
  type,
  width,
  depth,
  height,
  category
FROM components
WHERE component_id IN ('base-cabinet-60', 'base-cabinet-60-ns', 'base-cabinet-60-ew')
ORDER BY component_id;
