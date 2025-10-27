-- ================================================================
-- Update 2D Render Definitions for Counter-tops (Remove Handles)
-- ================================================================
-- Date: 2025-10-19
-- Purpose: Remove handles from counter-tops in elevation view
-- Solution: Update existing 2D renders to set handle_style = 'none' and door_count = 0
-- Affects: 5 components (counter-top-horizontal, counter-top-vertical, utility-worktop-80, utility-worktop-100, utility-worktop-120)
-- Issue: Component Elevation View Fixes - Issue #2
-- Session: docs/session-2025-10-19-Component-elevation-fixes/
--
-- IMPORTANT: Database verification revealed countertops DO HAVE 2D render definitions
-- but with WRONG config (door_count: 2, handle_style: "bar"). This migration UPDATES
-- existing records rather than inserting new ones.
-- ================================================================

-- Update elevation_data for all counter-tops
UPDATE component_2d_renders
SET
  elevation_data = jsonb_set(
    jsonb_set(
      jsonb_set(elevation_data, '{door_count}', '0'),
      '{handle_style}', '"none"'
    ),
    '{has_toe_kick}', 'false'
  ),
  side_elevation_data = jsonb_set(
    jsonb_set(
      jsonb_set(side_elevation_data, '{door_count}', '0'),
      '{handle_style}', '"none"'
    ),
    '{has_toe_kick}', 'false'
  )
WHERE component_id IN (
  SELECT component_id FROM components WHERE type = 'counter-top'
);

-- Verification
DO $$
DECLARE
  updated_count INTEGER;
  correct_config_count INTEGER;
  sample_config JSONB;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM component_2d_renders cr
  JOIN components c ON cr.component_id = c.component_id
  WHERE c.type = 'counter-top';

  SELECT COUNT(*) INTO correct_config_count
  FROM component_2d_renders cr
  JOIN components c ON cr.component_id = c.component_id
  WHERE c.type = 'counter-top'
    AND (cr.elevation_data->>'handle_style')::text = 'none'
    AND (cr.elevation_data->>'door_count')::int = 0
    AND (cr.side_elevation_data->>'handle_style')::text = 'none'
    AND (cr.side_elevation_data->>'door_count')::int = 0;

  -- Get a sample configuration to display
  SELECT elevation_data INTO sample_config
  FROM component_2d_renders cr
  JOIN components c ON cr.component_id = c.component_id
  WHERE c.type = 'counter-top'
  LIMIT 1;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Counter-top 2D Renders Updated';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total counter-top renders: %', updated_count;
  RAISE NOTICE 'Correctly configured: %', correct_config_count;
  RAISE NOTICE '';
  RAISE NOTICE 'New Configuration:';
  RAISE NOTICE '  - door_count: 0 (no doors)';
  RAISE NOTICE '  - handle_style: none (no handles)';
  RAISE NOTICE '  - has_toe_kick: false';
  RAISE NOTICE '';
  RAISE NOTICE 'Sample elevation_data: %', sample_config::text;
  RAISE NOTICE '====================================';

  IF correct_config_count <> updated_count THEN
    RAISE EXCEPTION 'Update failed - expected % correctly configured, got %', updated_count, correct_config_count;
  END IF;

  IF updated_count <> 5 THEN
    RAISE EXCEPTION 'Update failed - expected 5 counter-tops, got %', updated_count;
  END IF;
END $$;
