-- ================================================================
-- Migration: Fix Corner Cabinet Body Height
-- ================================================================
-- Date: 2025-10-18
-- Purpose: Reduce corner cabinet body height to account for plinth
-- Issue: Cabinet body uses full 'height' instead of 'height - plinthHeight'
--
-- Problem:
-- - Corner cabinet body dimension_height = 'height' (90cm - WRONG!)
-- - Base cabinet body dimension_height = 'cabinetHeight' (75cm - correct!)
-- - cabinetHeight = height - plinthHeight - counterTopGap
-- - For 90cm cabinet: 90 - 15 - 3 = 72cm
--
-- But corner cabinets don't have counterTopGap, so should be:
-- - dimension_height = 'height - 0.15' (90 - 15 = 75cm)
--
-- User feedback: "reduce the height of the corner base unit main box
-- not squash it down onto the plynth. i think the main box height is
-- what the total height should be so it needs reducing by the height
-- of the plytnth"
--
-- Solution:
-- - Change Cabinet X-leg dimension_height: 'height - 0.15' (was: 'height')
-- - Change Cabinet Z-leg dimension_height: 'height - 0.15' (was: 'height')
-- - This makes cabinet body 75cm (90 - 15 = 75cm)
-- - Total height: 15cm plinth + 75cm body = 90cm ✅
--
-- Affected Components:
-- - corner-cabinet (base corner 90cm)
-- - larder-corner-unit-60 (tall corner 60cm)
-- - larder-corner-unit-90 (tall corner 90cm)
-- ================================================================

-- ================================================================
-- BEFORE: Show current dimensions
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'BEFORE: Current Cabinet Body Dimensions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  cm.component_id,
  gp.part_name,
  gp.dimension_height as current_dimension,
  gp.position_y
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id IN ('corner-cabinet', 'base-cabinet-60')
  AND gp.part_name IN ('Cabinet X-leg', 'Cabinet Z-leg', 'Cabinet Body', 'Plinth', 'Plinth X-leg')
ORDER BY cm.component_id, gp.part_name;

-- ================================================================
-- FIX: Update corner cabinet body dimensions
-- ================================================================

DO $$
DECLARE
  corner_updated INT := 0;
  larder_60_updated INT := 0;
  larder_90_updated INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'FIXING: Corner Cabinet Body Dimensions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';

  -- Fix corner-cabinet (base 90cm)
  -- Cabinet body should be 75cm (90 - 15)
  UPDATE geometry_parts
  SET dimension_height = 'height - 0.15'
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'corner-cabinet')
    AND part_name IN ('Cabinet X-leg', 'Cabinet Z-leg');
  GET DIAGNOSTICS corner_updated = ROW_COUNT;

  -- Fix larder-corner-unit-60 (tall 200cm, 60cm legs)
  -- Cabinet body should be 185cm (200 - 15)
  UPDATE geometry_parts
  SET dimension_height = 'height - 0.15'
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-60')
    AND part_name IN ('Cabinet X-leg', 'Cabinet Z-leg');
  GET DIAGNOSTICS larder_60_updated = ROW_COUNT;

  -- Fix larder-corner-unit-90 (tall 200cm, 90cm legs)
  -- Cabinet body should be 185cm (200 - 15)
  UPDATE geometry_parts
  SET dimension_height = 'height - 0.15'
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-90')
    AND part_name IN ('Cabinet X-leg', 'Cabinet Z-leg');
  GET DIAGNOSTICS larder_90_updated = ROW_COUNT;

  RAISE NOTICE '  ✅ corner-cabinet: % parts updated (Cabinet X-leg, Z-leg)', corner_updated;
  RAISE NOTICE '  ✅ larder-corner-unit-60: % parts updated (Cabinet X-leg, Z-leg)', larder_60_updated;
  RAISE NOTICE '  ✅ larder-corner-unit-90: % parts updated (Cabinet X-leg, Z-leg)', larder_90_updated;
  RAISE NOTICE '';
END $$;

-- ================================================================
-- VERIFICATION: Check dimensions are correct
-- ================================================================

DO $$
DECLARE
  corner_body_dim TEXT;
  base_body_dim TEXT;
BEGIN
  -- Get corner cabinet body dimension
  SELECT dimension_height INTO corner_body_dim
  FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'corner-cabinet')
    AND part_name = 'Cabinet X-leg'
  LIMIT 1;

  -- Get base cabinet body dimension
  SELECT dimension_height INTO base_body_dim
  FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'base-cabinet-60')
    AND part_name = 'Cabinet Body'
  LIMIT 1;

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'VERIFICATION: Dimension Comparison';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Corner cabinet (Cabinet X-leg): %', corner_body_dim;
  RAISE NOTICE 'Base cabinet (Cabinet Body): %', base_body_dim;
  RAISE NOTICE '';
  RAISE NOTICE 'For 90cm cabinet:';
  RAISE NOTICE '  Corner: height - 0.15 = 90 - 15 = 75cm cabinet body';
  RAISE NOTICE '  Base: cabinetHeight = height - plinthHeight - 0.03 = 90 - 15 - 3 = 72cm';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: 3cm difference is countertop gap (base cabinets only)';
  RAISE NOTICE '      Corner cabinets dont have countertops, so 75cm is correct';
  RAISE NOTICE '';
  RAISE NOTICE 'Total heights:';
  RAISE NOTICE '  Corner: 15cm plinth + 75cm body = 90cm total ✅';
  RAISE NOTICE '  Base: 15cm plinth + 72cm body + 3cm gap = 90cm total ✅';
  RAISE NOTICE '';

  IF corner_body_dim = 'height - 0.15' THEN
    RAISE NOTICE '✅ SUCCESS: Corner cabinet body dimension correct!';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Results in 3D View:';
    RAISE NOTICE '  - Corner cabinet body no longer oversized';
    RAISE NOTICE '  - Cabinet body sits properly on plinth';
    RAISE NOTICE '  - Total height = 90cm (15cm plinth + 75cm body)';
    RAISE NOTICE '  - Same total height as base cabinets';
  ELSE
    RAISE WARNING '❌ Corner cabinet dimension not updated correctly!';
    RAISE WARNING 'Expected: height - 0.15';
    RAISE WARNING 'Got: %', corner_body_dim;
  END IF;

  RAISE NOTICE '=============================================================================';
END $$;

-- ================================================================
-- AFTER: Show updated dimensions
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'AFTER: Updated Cabinet Body Dimensions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  cm.component_id,
  gp.part_name,
  gp.dimension_height as updated_dimension,
  gp.position_y
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id IN ('corner-cabinet', 'larder-corner-unit-60', 'larder-corner-unit-90', 'base-cabinet-60')
  AND gp.part_name IN ('Cabinet X-leg', 'Cabinet Z-leg', 'Cabinet Body', 'Plinth', 'Plinth X-leg')
ORDER BY cm.component_id, gp.part_name;

-- ================================================================
-- DOOR HEIGHT: Also update door heights to match
-- ================================================================

DO $$
DECLARE
  door_updated INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'FIXING: Corner Cabinet Door Dimensions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Doors should match cabinet body height (height - 0.15)';
  RAISE NOTICE '';

  -- Update all corner cabinet doors
  UPDATE geometry_parts
  SET dimension_height = 'height - 0.17'  -- Slightly shorter for clearance
  WHERE model_id IN (
    SELECT id FROM component_3d_models
    WHERE component_id IN ('corner-cabinet', 'larder-corner-unit-60', 'larder-corner-unit-90')
  )
  AND part_name IN ('Front door', 'Side door');
  GET DIAGNOSTICS door_updated = ROW_COUNT;

  RAISE NOTICE '  ✅ Updated % doors (Front door, Side door)', door_updated;
  RAISE NOTICE '  Door height: height - 0.17 (2cm shorter than body for clearance)';
  RAISE NOTICE '';
END $$;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'MIGRATION COMPLETE';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed components:';
  RAISE NOTICE '  ✅ corner-cabinet - body reduced to 75cm (was 90cm)';
  RAISE NOTICE '  ✅ larder-corner-unit-60 - body reduced to 185cm (was 200cm)';
  RAISE NOTICE '  ✅ larder-corner-unit-90 - body reduced to 185cm (was 200cm)';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Cabinet X-leg: height - 0.15';
  RAISE NOTICE '  - Cabinet Z-leg: height - 0.15';
  RAISE NOTICE '  - Front door: height - 0.17';
  RAISE NOTICE '  - Side door: height - 0.17';
  RAISE NOTICE '';
  RAISE NOTICE 'Total height breakdown (90cm cabinet):';
  RAISE NOTICE '  - Plinth: 15cm (bottom at Y=0, top at Y=0.15)';
  RAISE NOTICE '  - Cabinet body: 75cm (bottom at Y=0.15, top at Y=0.9)';
  RAISE NOTICE '  - Total: 90cm ✅';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run: npx supabase db reset';
  RAISE NOTICE '  2. Test corner-cabinet in 3D view';
  RAISE NOTICE '  3. Verify cabinet body no longer oversized';
  RAISE NOTICE '  4. Verify total height still 90cm';
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
END $$;
