-- =============================================================================
-- QUERY GEOMETRY PARTS SCHEMA
-- Date: 2025-10-18
-- Purpose: Discover the actual schema of geometry_parts table
-- =============================================================================

-- Get column names and types for geometry_parts table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'geometry_parts'
ORDER BY ordinal_position;

-- Get a sample row to see actual data
SELECT *
FROM geometry_parts
LIMIT 1;

-- Count geometry parts by model
SELECT
  cm.component_id,
  cm.component_name,
  COUNT(gp.id) as parts_count
FROM component_3d_models cm
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
GROUP BY cm.component_id, cm.component_name
HAVING COUNT(gp.id) > 0
ORDER BY parts_count DESC
LIMIT 10;
