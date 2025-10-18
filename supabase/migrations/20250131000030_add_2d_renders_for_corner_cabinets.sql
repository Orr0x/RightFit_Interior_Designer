-- Migration: Add 2D render definitions for corner cabinets (L-shaped and wall corner)
-- Date: 2025-10-10
-- Purpose: Add missing 2D render data with corner flags

-- =====================================================
-- L-Shaped Test Cabinet (Base Cabinet - Corner)
-- =====================================================

-- l-shaped-test-cabinet-60 (60cm base corner cabinet)
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
  'l-shaped-test-cabinet-60',
  'corner-square',
  '{}'::jsonb,
  'standard-cabinet',
  '{
    "door_count": 1,
    "door_style": "flat",
    "handle_style": "bar",
    "handle_position": "center",
    "has_toe_kick": true,
    "toe_kick_height": 10,
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
    "has_toe_kick": true,
    "toe_kick_height": 10,
    "is_corner": true,
    "corner_door_side": "auto"
  }'::jsonb,
  '#8b4513',
  '#6b3513',
  1
) ON CONFLICT (component_id) DO UPDATE SET
  elevation_data = EXCLUDED.elevation_data,
  side_elevation_data = EXCLUDED.side_elevation_data;

-- l-shaped-test-cabinet-90 (90cm base corner cabinet)
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
  'l-shaped-test-cabinet-90',
  'corner-square',
  '{}'::jsonb,
  'standard-cabinet',
  '{
    "door_count": 1,
    "door_style": "flat",
    "handle_style": "bar",
    "handle_position": "center",
    "has_toe_kick": true,
    "toe_kick_height": 10,
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
    "has_toe_kick": true,
    "toe_kick_height": 10,
    "is_corner": true,
    "corner_door_side": "auto"
  }'::jsonb,
  '#8b4513',
  '#6b3513',
  1
) ON CONFLICT (component_id) DO UPDATE SET
  elevation_data = EXCLUDED.elevation_data,
  side_elevation_data = EXCLUDED.side_elevation_data;

-- =====================================================
-- Fix Wall Corner Cabinet (Should NOT have toe kick)
-- =====================================================

-- new-corner-wall-cabinet-60 (60cm wall corner cabinet)
UPDATE component_2d_renders
SET
  elevation_data = jsonb_set(
    jsonb_set(
      elevation_data,
      '{has_toe_kick}',
      'false'::jsonb
    ),
    '{is_corner}',
    'true'::jsonb
  ),
  side_elevation_data = jsonb_set(
    jsonb_set(
      side_elevation_data,
      '{has_toe_kick}',
      'false'::jsonb
    ),
    '{is_corner}',
    'true'::jsonb
  )
WHERE component_id = 'new-corner-wall-cabinet-60';

-- =====================================================
-- Verification Query (uncomment to check)
-- =====================================================

-- SELECT
--   component_id,
--   elevation_data->>'is_corner' as is_corner,
--   elevation_data->>'corner_door_side' as corner_door_side,
--   elevation_data->>'has_toe_kick' as has_toe_kick,
--   elevation_data->>'door_count' as door_count
-- FROM component_2d_renders
-- WHERE component_id IN (
--   'l-shaped-test-cabinet-60',
--   'l-shaped-test-cabinet-90',
--   'new-corner-wall-cabinet-60'
-- )
-- ORDER BY component_id;
