-- Query to find all components for kitchen room type
-- Session: 2025-10-18 - Database Component Cleanup

-- =============================================================================
-- 1. Simple count of kitchen components
-- =============================================================================

SELECT
  COUNT(*) as total_kitchen_components
FROM components
WHERE 'kitchen' = ANY(room_types);

-- =============================================================================
-- 2. List all kitchen components with details
-- =============================================================================

SELECT
  component_id,
  name,
  type,
  width,
  depth,
  height,
  category,
  room_types,
  description
FROM components
WHERE 'kitchen' = ANY(room_types)
ORDER BY category, name;

-- =============================================================================
-- 3. Kitchen components grouped by category
-- =============================================================================

SELECT
  category,
  COUNT(*) as component_count,
  STRING_AGG(component_id, ', ' ORDER BY component_id) as component_ids
FROM components
WHERE 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- =============================================================================
-- 4. Kitchen components with NS/EW variants
-- =============================================================================

SELECT
  component_id,
  name,
  type,
  width,
  depth,
  height,
  category,
  CASE
    WHEN component_id LIKE '%-ns' THEN 'NS'
    WHEN component_id LIKE '%-ew' THEN 'EW'
    ELSE 'BASE'
  END as variant_type
FROM components
WHERE 'kitchen' = ANY(room_types)
  AND (
    component_id LIKE '%-ns'
    OR component_id LIKE '%-ew'
    OR EXISTS (
      SELECT 1 FROM components c2
      WHERE c2.component_id IN (component_id || '-ns', component_id || '-ew')
    )
  )
ORDER BY name, variant_type;

-- =============================================================================
-- 5. Kitchen components by type
-- =============================================================================

SELECT
  type,
  COUNT(*) as component_count,
  COUNT(*) FILTER (WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew') as ns_ew_count,
  COUNT(*) FILTER (WHERE component_id NOT LIKE '%-ns' AND component_id NOT LIKE '%-ew') as base_count
FROM components
WHERE 'kitchen' = ANY(room_types)
GROUP BY type
ORDER BY component_count DESC;

-- =============================================================================
-- 6. Kitchen components - base components only (no NS/EW)
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
WHERE 'kitchen' = ANY(room_types)
  AND component_id NOT LIKE '%-ns'
  AND component_id NOT LIKE '%-ew'
ORDER BY category, component_id;

-- =============================================================================
-- 7. Kitchen component statistics
-- =============================================================================

SELECT
  'Total kitchen components' as metric,
  COUNT(*) as count
FROM components
WHERE 'kitchen' = ANY(room_types)
UNION ALL
SELECT
  'Kitchen base components (no NS/EW)' as metric,
  COUNT(*) as count
FROM components
WHERE 'kitchen' = ANY(room_types)
  AND component_id NOT LIKE '%-ns'
  AND component_id NOT LIKE '%-ew'
UNION ALL
SELECT
  'Kitchen NS variants' as metric,
  COUNT(*) as count
FROM components
WHERE 'kitchen' = ANY(room_types)
  AND component_id LIKE '%-ns'
UNION ALL
SELECT
  'Kitchen EW variants' as metric,
  COUNT(*) as count
FROM components
WHERE 'kitchen' = ANY(room_types)
  AND component_id LIKE '%-ew';

-- =============================================================================
-- 8. Kitchen components with full details (export-ready)
-- =============================================================================

SELECT
  component_id,
  name,
  type,
  width,
  depth,
  height,
  color,
  category,
  room_types,
  icon_name,
  description,
  version,
  deprecated,
  metadata,
  tags
FROM components
WHERE 'kitchen' = ANY(room_types)
ORDER BY category, component_id;

-- =============================================================================
-- 9. Kitchen components - dimension comparison (NS vs EW vs Base)
-- =============================================================================

WITH base_components AS (
  SELECT
    component_id,
    name,
    width,
    depth,
    height,
    category
  FROM components
  WHERE 'kitchen' = ANY(room_types)
    AND component_id NOT LIKE '%-ns'
    AND component_id NOT LIKE '%-ew'
),
ns_components AS (
  SELECT
    SUBSTRING(component_id FROM 1 FOR LENGTH(component_id) - 3) as base_id,
    component_id,
    width as ns_width,
    depth as ns_depth
  FROM components
  WHERE 'kitchen' = ANY(room_types)
    AND component_id LIKE '%-ns'
),
ew_components AS (
  SELECT
    SUBSTRING(component_id FROM 1 FOR LENGTH(component_id) - 3) as base_id,
    component_id,
    width as ew_width,
    depth as ew_depth
  FROM components
  WHERE 'kitchen' = ANY(room_types)
    AND component_id LIKE '%-ew'
)
SELECT
  base.component_id as base_id,
  base.name,
  base.category,
  base.width as base_width,
  base.depth as base_depth,
  base.height,
  ns.component_id as ns_id,
  ns.ns_width,
  ns.ns_depth,
  ew.component_id as ew_id,
  ew.ew_width,
  ew.ew_depth,
  CASE
    WHEN ns.component_id IS NOT NULL OR ew.component_id IS NOT NULL THEN 'HAS VARIANTS'
    ELSE 'NO VARIANTS'
  END as variant_status
FROM base_components base
LEFT JOIN ns_components ns ON base.component_id = ns.base_id
LEFT JOIN ew_components ew ON base.component_id = ew.base_id
ORDER BY base.category, base.component_id;

-- =============================================================================
-- 10. Kitchen components by category with counts
-- =============================================================================

SELECT
  category,
  COUNT(DISTINCT component_id) as total_components,
  COUNT(DISTINCT CASE WHEN component_id NOT LIKE '%-ns' AND component_id NOT LIKE '%-ew' THEN component_id END) as base_components,
  COUNT(DISTINCT CASE WHEN component_id LIKE '%-ns' THEN component_id END) as ns_variants,
  COUNT(DISTINCT CASE WHEN component_id LIKE '%-ew' THEN component_id END) as ew_variants,
  STRING_AGG(DISTINCT type, ', ') as types
FROM components
WHERE 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY total_components DESC, category;
