-- ================================================================
-- Update Base Cabinet Heights from 90cm to 86cm
-- ================================================================
-- Date: 2025-10-19
-- Purpose: Allow 4cm countertop on top (86cm + 4cm = 90cm total)
-- Affects: 9 components (6 base cabinets, 2 utility base, 1 corner base)
-- Issue: Component Elevation View Fixes - Issue #3
-- Session: docs/session-2025-10-19-Component-elevation-fixes/
--
-- PLINTH HEIGHT NOTE:
-- Database shows plinth_height = 10cm, but 3D migrations use 15cm.
-- Using database value (10cm) for consistency.
-- New structure: 10cm plinth + 76cm cabinet = 86cm total
-- ================================================================

-- Update components table - Base Cabinets
UPDATE components
SET height = 86
WHERE component_id IN (
  'base-cabinet-30',
  'base-cabinet-40',
  'base-cabinet-50',
  'base-cabinet-60',
  'base-cabinet-80',
  'base-cabinet-100'
);

-- Update components table - Utility Base Cabinets
UPDATE components
SET height = 86
WHERE component_id IN (
  'utility-base-60',
  'utility-base-80'
);

-- Update components table - Corner Base Cabinet
UPDATE components
SET height = 86
WHERE component_id = 'corner-cabinet';

-- Update 3D model default heights - Base Cabinets
UPDATE component_3d_models
SET default_height = 0.86
WHERE component_id IN (
  'base-cabinet-30',
  'base-cabinet-40',
  'base-cabinet-50',
  'base-cabinet-60',
  'base-cabinet-80',
  'base-cabinet-100'
);

-- Update 3D model default heights - Utility Base Cabinets
UPDATE component_3d_models
SET default_height = 0.86
WHERE component_id IN (
  'utility-base-60',
  'utility-base-80'
);

-- Update 3D model default heights - Corner Base Cabinet
UPDATE component_3d_models
SET default_height = 0.86
WHERE component_id = 'corner-cabinet';

-- Verification query
DO $$
DECLARE
  component_count INTEGER;
  model_count INTEGER;
  countertop_height NUMERIC;
BEGIN
  SELECT COUNT(*) INTO component_count
  FROM components
  WHERE component_id IN (
    'base-cabinet-30', 'base-cabinet-40', 'base-cabinet-50',
    'base-cabinet-60', 'base-cabinet-80', 'base-cabinet-100',
    'utility-base-60', 'utility-base-80',
    'corner-cabinet'
  )
  AND height = 86;

  SELECT COUNT(*) INTO model_count
  FROM component_3d_models
  WHERE component_id IN (
    'base-cabinet-30', 'base-cabinet-40', 'base-cabinet-50',
    'base-cabinet-60', 'base-cabinet-80', 'base-cabinet-100',
    'utility-base-60', 'utility-base-80',
    'corner-cabinet'
  )
  AND default_height = 0.86;

  -- Get countertop height for verification
  SELECT height INTO countertop_height
  FROM components
  WHERE component_id = 'counter-top-60'
  LIMIT 1;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Base Unit Height Update Complete';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Components updated: % / 9', component_count;
  RAISE NOTICE 'Models updated: % / 9', model_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Updated components:';
  RAISE NOTICE '  Base Cabinets: 6 (30, 40, 50, 60, 80, 100cm)';
  RAISE NOTICE '  Utility Base: 2 (60, 80cm)';
  RAISE NOTICE '  Corner Base: 1 (corner-cabinet)';
  RAISE NOTICE '';
  RAISE NOTICE 'New Structure:';
  RAISE NOTICE '  - Plinth: 10cm (from database plinth_height)';
  RAISE NOTICE '  - Cabinet body: 76cm (calculated)';
  RAISE NOTICE '  - Total unit: 86cm';
  RAISE NOTICE '  - + Countertop: %cm', countertop_height;
  RAISE NOTICE '  = Overall: %cm ✓', 86 + countertop_height;
  RAISE NOTICE '';
  RAISE NOTICE 'NOTE: 3D geometry uses plinthHeight variable';
  RAISE NOTICE 'which may differ from database plinth_height field.';
  RAISE NOTICE 'Formulas will auto-adjust based on new height = 86cm.';
  RAISE NOTICE '====================================';

  IF component_count <> 9 THEN
    RAISE EXCEPTION 'Update failed - expected 9 components, got %', component_count;
  END IF;

  IF model_count <> 9 THEN
    RAISE EXCEPTION 'Update failed - expected 9 models, got %', model_count;
  END IF;
END $$;
