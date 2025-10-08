-- ================================================================
-- Verify and Populate Components Table
-- ================================================================
-- This script checks what's in the components table and provides
-- a safe way to populate it if needed
-- ================================================================

-- 1. Check current state
SELECT
  'Current state' as info,
  COUNT(*) as total_components,
  COUNT(DISTINCT category) as unique_categories,
  COUNT(*) FILTER (WHERE 'kitchen' = ANY(room_types)) as kitchen_components
FROM components
WHERE deprecated = false;

-- 2. List what we have
SELECT
  component_id,
  name,
  category,
  array_to_string(room_types, ', ') as room_types
FROM components
WHERE deprecated = false
ORDER BY category, component_id;

-- 3. Check if we need to populate
-- If you see very few components (< 50), you need to run migration files:
-- - 20250916000005_populate_components_catalog.sql
-- - 20250916000006_populate_components_catalog_rooms.sql

-- 4. Quick check for specific new components
SELECT
  'Missing components check' as info,
  CASE WHEN EXISTS (SELECT 1 FROM components WHERE component_id = 'larder-corner-unit-60')
    THEN 'Found' ELSE 'MISSING' END as larder_60,
  CASE WHEN EXISTS (SELECT 1 FROM components WHERE component_id = 'larder-corner-unit-90')
    THEN 'Found' ELSE 'MISSING' END as larder_90,
  CASE WHEN EXISTS (SELECT 1 FROM components WHERE component_id = 'base-cabinet-30')
    THEN 'Found' ELSE 'MISSING' END as base_30,
  CASE WHEN EXISTS (SELECT 1 FROM components WHERE component_id = 'wall-cabinet-60')
    THEN 'Found' ELSE 'MISSING' END as wall_60;
