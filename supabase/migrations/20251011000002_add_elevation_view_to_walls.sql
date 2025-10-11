-- Migration: Add elevation_view field to wall definitions
-- Date: 2025-10-11
-- Purpose: Make elevation views template-defined (database-driven)
-- Non-breaking: Old templates without elevation_view field continue to work

-- ============================================================================
-- RECTANGLE TEMPLATE (4 walls → 4 cardinal directions)
-- ============================================================================

-- Wall 1: North → Front
UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,0,elevation_view}',
  '"front"'::jsonb
)
WHERE template_name = 'rectangle-standard'
  AND geometry_definition->'walls'->0 IS NOT NULL;

-- Wall 2: East → Right
UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,1,elevation_view}',
  '"right"'::jsonb
)
WHERE template_name = 'rectangle-standard'
  AND geometry_definition->'walls'->1 IS NOT NULL;

-- Wall 3: South → Back
UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,2,elevation_view}',
  '"back"'::jsonb
)
WHERE template_name = 'rectangle-standard'
  AND geometry_definition->'walls'->2 IS NOT NULL;

-- Wall 4: West → Left
UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,3,elevation_view}',
  '"left"'::jsonb
)
WHERE template_name = 'rectangle-standard'
  AND geometry_definition->'walls'->3 IS NOT NULL;

-- ============================================================================
-- L-SHAPE TEMPLATE (6 walls → 5 perimeter + 1 interior)
-- ============================================================================

-- Perimeter walls (assign based on wall order in template)
UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,0,elevation_view}',
  '"front"'::jsonb
)
WHERE template_name = 'l-shape-standard'
  AND geometry_definition->'walls'->0 IS NOT NULL;

UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,1,elevation_view}',
  '"right"'::jsonb
)
WHERE template_name = 'l-shape-standard'
  AND geometry_definition->'walls'->1 IS NOT NULL;

UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,2,elevation_view}',
  '"right"'::jsonb
)
WHERE template_name = 'l-shape-standard'
  AND geometry_definition->'walls'->2 IS NOT NULL;

-- Interior return wall (wall 4)
UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,3,elevation_view}',
  '"interior-return"'::jsonb
)
WHERE template_name = 'l-shape-standard'
  AND geometry_definition->'walls'->3 IS NOT NULL;

UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,4,elevation_view}',
  '"back"'::jsonb
)
WHERE template_name = 'l-shape-standard'
  AND geometry_definition->'walls'->4 IS NOT NULL;

UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,5,elevation_view}',
  '"left"'::jsonb
)
WHERE template_name = 'l-shape-standard'
  AND geometry_definition->'walls'->5 IS NOT NULL;

-- ============================================================================
-- U-SHAPE TEMPLATE (8 walls → 4 perimeter + 3 interior)
-- ============================================================================

-- Outer perimeter walls
UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,0,elevation_view}',
  '"front"'::jsonb
)
WHERE template_name = 'u-shape-standard'
  AND geometry_definition->'walls'->0 IS NOT NULL;

UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,1,elevation_view}',
  '"right"'::jsonb
)
WHERE template_name = 'u-shape-standard'
  AND geometry_definition->'walls'->1 IS NOT NULL;

UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,2,elevation_view}',
  '"right"'::jsonb
)
WHERE template_name = 'u-shape-standard'
  AND geometry_definition->'walls'->2 IS NOT NULL;

-- Interior wall (right)
UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,3,elevation_view}',
  '"interior-right"'::jsonb
)
WHERE template_name = 'u-shape-standard'
  AND geometry_definition->'walls'->3 IS NOT NULL;

-- Interior wall (top)
UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,4,elevation_view}',
  '"interior-top"'::jsonb
)
WHERE template_name = 'u-shape-standard'
  AND geometry_definition->'walls'->4 IS NOT NULL;

-- Interior wall (left)
UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,5,elevation_view}',
  '"interior-left"'::jsonb
)
WHERE template_name = 'u-shape-standard'
  AND geometry_definition->'walls'->5 IS NOT NULL;

UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,6,elevation_view}',
  '"back"'::jsonb
)
WHERE template_name = 'u-shape-standard'
  AND geometry_definition->'walls'->6 IS NOT NULL;

UPDATE room_geometry_templates
SET geometry_definition = jsonb_set(
  geometry_definition,
  '{walls,7,elevation_view}',
  '"left"'::jsonb
)
WHERE template_name = 'u-shape-standard'
  AND geometry_definition->'walls'->7 IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify the migration:
-- SELECT
--   template_name,
--   jsonb_array_length(geometry_definition->'walls') as total_walls,
--   (
--     SELECT count(*)
--     FROM jsonb_array_elements(geometry_definition->'walls') as wall
--     WHERE wall ? 'elevation_view'
--   ) as walls_with_elevation_view,
--   (
--     SELECT jsonb_agg(DISTINCT wall->'elevation_view')
--     FROM jsonb_array_elements(geometry_definition->'walls') as wall
--     WHERE wall ? 'elevation_view'
--   ) as unique_views
-- FROM room_geometry_templates
-- WHERE is_active = true
-- ORDER BY template_name;
