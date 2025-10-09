-- =============================================================================
-- Fix new-corner-wall-cabinet-90 - Remove Toe Kick (Wall Cabinet)
-- =============================================================================
-- Date: 2025-10-10
-- Issue: Wall cabinet has_toe_kick: true (should be false)
-- =============================================================================

-- Check current state
SELECT
  component_id,
  elevation_data->>'is_corner' as is_corner,
  elevation_data->>'corner_door_side' as door_side,
  elevation_data->>'has_toe_kick' as has_toe_kick,
  elevation_data->>'door_count' as door_count
FROM component_2d_renders
WHERE component_id = 'new-corner-wall-cabinet-90';

-- Fix: Remove toe kick from wall cabinet
UPDATE component_2d_renders
SET
  elevation_data = jsonb_set(
    elevation_data,
    '{has_toe_kick}',
    'false'::jsonb
  ),
  side_elevation_data = jsonb_set(
    side_elevation_data,
    '{has_toe_kick}',
    'false'::jsonb
  )
WHERE component_id = 'new-corner-wall-cabinet-90';

-- If the record doesn't exist, insert it
INSERT INTO component_2d_renders (
  component_id,
  plan_view_type,
  plan_view_data,
  elevation_type,
  elevation_data,
  side_elevation_type,
  side_elevation_data,
  fill_color,
  stroke_color,
  stroke_width
) VALUES (
  'new-corner-wall-cabinet-90',
  'corner-square',
  '{}'::jsonb,
  'standard-cabinet',
  '{
    "door_count": 1,
    "door_style": "flat",
    "handle_style": "bar",
    "handle_position": "center",
    "has_toe_kick": false,
    "drawer_count": 0,
    "is_corner": true,
    "corner_door_side": "auto"
  }'::jsonb,
  'standard-cabinet',
  '{
    "door_count": 1,
    "door_style": "flat",
    "handle_style": "bar",
    "handle_position": "center",
    "has_toe_kick": false,
    "is_corner": true,
    "corner_door_side": "auto"
  }'::jsonb,
  '#8b4513',
  '#6b3513',
  1
) ON CONFLICT (component_id) DO UPDATE SET
  elevation_data = jsonb_set(
    EXCLUDED.elevation_data,
    '{has_toe_kick}',
    'false'::jsonb
  ),
  side_elevation_data = jsonb_set(
    EXCLUDED.side_elevation_data,
    '{has_toe_kick}',
    'false'::jsonb
  );

-- Verify the fix
SELECT
  component_id,
  elevation_data->>'is_corner' as is_corner,
  elevation_data->>'corner_door_side' as door_side,
  elevation_data->>'has_toe_kick' as has_toe_kick,
  elevation_data->>'door_count' as door_count
FROM component_2d_renders
WHERE component_id = 'new-corner-wall-cabinet-90';

-- =============================================================================
-- EXPECTED OUTPUT:
-- =============================================================================
-- component_id                | is_corner | door_side | has_toe_kick | door_count
-- ----------------------------|-----------|-----------|--------------|------------
-- new-corner-wall-cabinet-90  | true      | auto      | false        | 1
-- =============================================================================
