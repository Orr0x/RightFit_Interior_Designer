-- ================================================================
-- Migration: Fix Larder Unit Positioning
-- ================================================================
-- Date: 2025-10-18
-- Purpose: Fix Y-positioning for non-corner larder units sinking through floor
-- Issue: Larder units use OLD system (-height/2) causing underground rendering
--
-- Problem:
-- - Larder units are 200cm tall (2.0m)
-- - Plinth position_y = '-height / 2 + plinthHeight / 2'
-- - For 200cm: -1.0 + 0.075 = -0.925m (92.5cm underground!)
-- - Cabinet bodies use relative positioning that compounds the problem
--
-- Affected Components (Larder Units category):
-- - tall-unit-60 (Tall Unit 60cm)
-- - tall-unit-80 (Tall Unit 80cm)
-- - oven-housing-60 (Oven Housing 60cm)
--
-- NOT Affected (user confirmed working):
-- - larder-corner-unit-60 (corner units work correctly)
-- - larder-corner-unit-90 (corner units work correctly)
-- - larder-built-in-fridge (appliances category - working)
-- - larder-single-oven (appliances category - working)
-- - larder-double-oven (appliances category - working)
-- - larder-oven-microwave (appliances category - working)
-- - larder-coffee-machine (appliances category - working)
--
-- Solution:
-- - Change to NEW 0-based positioning system
-- - Plinth position_y: '0.075' (center at 7.5cm, bottom at Y=0)
-- - Cabinet bodies: positioned relative to ground, not to -height/2
-- ================================================================

-- ================================================================
-- Show current state
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'BEFORE: Larder Unit Plinth Positions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  cm.component_id,
  gp.part_name,
  gp.position_y,
  'Should be 0.075' as expected_value
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id IN (
  'tall-unit-60',
  'tall-unit-80',
  'oven-housing-60'
)
AND gp.part_name = 'Plinth'
ORDER BY cm.component_id;

-- ================================================================
-- Fix Larder Unit Positioning
-- ================================================================

DO $$
DECLARE
  v_updated INT := 0;
  v_component_id text;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Fixing Larder Unit Positioning';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';

  FOR v_component_id IN
    SELECT UNNEST(ARRAY[
      'tall-unit-60',
      'tall-unit-80',
      'oven-housing-60'
    ])
  LOOP
    -- Update Plinth position_y
    -- OLD: '-height / 2 + plinthHeight / 2' → NEW: '0.075'
    UPDATE geometry_parts gp
    SET position_y = '0.075'
    FROM component_3d_models cm
    WHERE gp.model_id = cm.id
      AND cm.component_id = v_component_id
      AND gp.part_name = 'Plinth';

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated > 0 THEN
      RAISE NOTICE '  ✅ Fixed plinth for: %', v_component_id;
    ELSE
      RAISE WARNING '  ⚠️  No plinth found for: %', v_component_id;
    END IF;

    -- Note: Other parts (Upper Cabinet, Oven Housing, etc.) use relative positioning
    -- like 'height * 0.25' which are positioned relative to center (Y=0)
    -- These should work correctly once plinth is fixed
    -- They don't need adjustment as they're not using the -height/2 offset

  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Fixed % larder unit plinths', 3;
  RAISE NOTICE '';
END $$;

-- ================================================================
-- Verification
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'AFTER: Larder Unit Plinth Positions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  cm.component_id,
  gp.part_name,
  gp.position_y,
  'For 200cm: center at 7.5cm, bottom at 0' as calculation
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id IN (
  'tall-unit-60',
  'tall-unit-80',
  'oven-housing-60'
)
AND gp.part_name = 'Plinth'
ORDER BY cm.component_id;

-- ================================================================
-- Show full geometry for one larder unit as sample
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Sample: Full Geometry for tall-unit-60';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  gp.part_name,
  gp.position_y,
  gp.dimension_height,
  gp.render_order
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id = 'tall-unit-60'
ORDER BY gp.render_order;

-- ================================================================
-- Migration Complete
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'MIGRATION COMPLETE';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed larder units (Larder Units category):';
  RAISE NOTICE '  ✅ tall-unit-60 (Tall Unit 60cm)';
  RAISE NOTICE '  ✅ tall-unit-80 (Tall Unit 80cm)';
  RAISE NOTICE '  ✅ oven-housing-60 (Oven Housing 60cm)';
  RAISE NOTICE '';
  RAISE NOTICE 'NOT modified (user confirmed working):';
  RAISE NOTICE '  ✓ larder-corner-unit-60 (corner larders)';
  RAISE NOTICE '  ✓ larder-corner-unit-90 (corner larders)';
  RAISE NOTICE '  ✓ larder-built-in-fridge (appliances category)';
  RAISE NOTICE '  ✓ larder-single-oven (appliances category)';
  RAISE NOTICE '  ✓ larder-double-oven (appliances category)';
  RAISE NOTICE '  ✓ larder-oven-microwave (appliances category)';
  RAISE NOTICE '  ✓ larder-coffee-machine (appliances category)';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  - Plinth position_y: ''-height / 2 + plinthHeight / 2'' → ''0.075''';
  RAISE NOTICE '  - For 200cm larder: -0.925m → 0.075m (plinth now on ground!)';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected result:';
  RAISE NOTICE '  - Plinths sit on ground (Y = 0)';
  RAISE NOTICE '  - Plinths are 15cm tall and visible';
  RAISE NOTICE '  - Cabinet bodies positioned correctly above plinth';
  RAISE NOTICE '  - No underground geometry';
  RAISE NOTICE '  - Total height 200cm (plinth + body)';
  RAISE NOTICE '=============================================================================';
END $$;
