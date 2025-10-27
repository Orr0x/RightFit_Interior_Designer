-- ================================================================
-- Update Tall Cabinet Heights from 200cm to 210cm
-- ================================================================
-- Date: 2025-10-19
-- Purpose: Align tall cabinet heights with wall unit tops
-- Affects: 4 components (tall-unit-60, tall-unit-80, larder-corner-90, oven-housing-60)
-- NOTE: larder-corner-unit-60 was deleted and excluded from this migration
-- Issue: Component Elevation View Fixes - Issue #1
-- Session: docs/session-2025-10-19-Component-elevation-fixes/
-- ================================================================

-- Update components table
UPDATE components
SET height = 210
WHERE component_id IN (
  'tall-unit-60',
  'tall-unit-80',
  'larder-corner-unit-90',
  'oven-housing-60'
);

-- Update 3D model default heights
UPDATE component_3d_models
SET default_height = 2.10
WHERE component_id IN (
  'tall-unit-60',
  'tall-unit-80',
  'larder-corner-unit-90',
  'oven-housing-60'
);

-- Verification query
DO $$
DECLARE
  component_count INTEGER;
  model_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO component_count
  FROM components
  WHERE component_id IN ('tall-unit-60', 'tall-unit-80', 'larder-corner-unit-90', 'oven-housing-60')
    AND height = 210;

  SELECT COUNT(*) INTO model_count
  FROM component_3d_models
  WHERE component_id IN ('tall-unit-60', 'tall-unit-80', 'larder-corner-unit-90', 'oven-housing-60')
    AND default_height = 2.10;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Tall Cabinet Height Update Complete';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Components updated: % / 4', component_count;
  RAISE NOTICE 'Models updated: % / 4', model_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Updated components:';
  RAISE NOTICE '  - tall-unit-60';
  RAISE NOTICE '  - tall-unit-80';
  RAISE NOTICE '  - larder-corner-unit-90';
  RAISE NOTICE '  - oven-housing-60 (bonus fix)';
  RAISE NOTICE '';
  RAISE NOTICE 'NOTE: larder-corner-unit-60 excluded (deleted)';
  RAISE NOTICE '';
  RAISE NOTICE 'New height: 210cm (2.10m)';
  RAISE NOTICE 'Previous height: 200cm (2.00m)';
  RAISE NOTICE '====================================';

  IF component_count <> 4 OR model_count <> 4 THEN
    RAISE EXCEPTION 'Update failed - expected 4 components and 4 models, got % components and % models', component_count, model_count;
  END IF;
END $$;
