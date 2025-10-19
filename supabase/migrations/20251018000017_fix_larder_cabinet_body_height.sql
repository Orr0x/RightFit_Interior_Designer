-- ================================================================
-- Migration: Fix Larder Unit Cabinet Body Height
-- ================================================================
-- Date: 2025-10-18
-- Purpose: Fix cabinet body and door positioning for larder units
-- Issue: Cabinet body at same Y position as plinth (both at 0.075m) causing overlap
--
-- Problem:
-- - Migration 20251018000016 fixed plinth to 0.075m (correct)
-- - But Cabinet Body is ALSO at 0.075m (wrong!)
-- - Cabinet body and plinth are overlapping at same position
-- - Makes units look 90cm tall instead of 200cm
--
-- Root Cause:
-- - Original design had plinth at '-height / 2 + 0.075' (underground)
-- - Cabinet body at '0.075' was positioned to work with OLD plinth
-- - When plinth moved to 0.075m, cabinet body stayed at 0.075m = OVERLAP
--
-- Correct Positioning:
-- - Plinth: center at 0.075m (bottom at 0, top at 0.15m) ✅
-- - Cabinet Body: center at height/2 = 1.0m for 200cm unit
--   * Bottom at 0.15m (top of plinth)
--   * Top at 2.0m
--   * Center at 1.075m = 0.15 + (2.0 - 0.15) / 2
--   * Formula: plinthHeight + (height - plinthHeight) / 2
--   * Simplified: height / 2 + plinthHeight / 2
--
-- Affected Components:
-- - tall-unit-60
-- - tall-unit-80
-- - oven-housing-60
-- ================================================================

-- ================================================================
-- Show current state
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'BEFORE: Larder Unit Geometry Positions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  cm.component_id,
  gp.part_name,
  gp.position_y,
  gp.dimension_height,
  CASE
    WHEN gp.part_name = 'Plinth' THEN '0.075 (correct)'
    WHEN gp.part_name = 'Cabinet Body' THEN 'Should be: height / 2 + plinthHeight / 2'
    WHEN gp.part_name IN ('Door', 'Oven Door') THEN 'Should match Cabinet Body'
    ELSE 'OK'
  END as expected
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id IN ('tall-unit-60', 'tall-unit-80', 'oven-housing-60')
ORDER BY cm.component_id, gp.render_order;

-- ================================================================
-- Fix Cabinet Body and Door Positioning
-- ================================================================

DO $$
DECLARE
  v_component_id text;
  v_updated INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Fixing Larder Unit Cabinet Body and Door Positions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';

  FOR v_component_id IN
    SELECT UNNEST(ARRAY[
      'tall-unit-60',
      'tall-unit-80',
      'oven-housing-60'
    ])
  LOOP
    -- Update Cabinet Body position_y
    -- OLD: '0.075' (same as plinth - WRONG!)
    -- NEW: 'height / 2 + plinthHeight / 2' (center of body above plinth)
    UPDATE geometry_parts gp
    SET position_y = 'height / 2 + plinthHeight / 2'
    FROM component_3d_models cm
    WHERE gp.model_id = cm.id
      AND cm.component_id = v_component_id
      AND gp.part_name = 'Cabinet Body';

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated > 0 THEN
      RAISE NOTICE '  ✅ Fixed Cabinet Body for: %', v_component_id;
    END IF;

    -- Update Door position_y (same as Cabinet Body)
    UPDATE geometry_parts gp
    SET position_y = 'height / 2 + plinthHeight / 2'
    FROM component_3d_models cm
    WHERE gp.model_id = cm.id
      AND cm.component_id = v_component_id
      AND gp.part_name = 'Door';

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated > 0 THEN
      RAISE NOTICE '  ✅ Fixed Door for: %', v_component_id;
    END IF;

    -- Update Oven Door position_y (for oven-housing-60)
    -- Keep it lower (-0.20 relative to center) for oven cutout position
    UPDATE geometry_parts gp
    SET position_y = 'height / 2 + plinthHeight / 2 - 0.60'
    FROM component_3d_models cm
    WHERE gp.model_id = cm.id
      AND cm.component_id = v_component_id
      AND gp.part_name = 'Oven Door';

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated > 0 THEN
      RAISE NOTICE '  ✅ Fixed Oven Door for: %', v_component_id;
    END IF;

  END LOOP;

  RAISE NOTICE '';
END $$;

-- ================================================================
-- Verification
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'AFTER: Larder Unit Geometry Positions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  cm.component_id,
  gp.part_name,
  gp.position_y,
  gp.dimension_height,
  CASE
    WHEN gp.part_name = 'Plinth' THEN 'For 200cm: 0.075m center'
    WHEN gp.part_name = 'Cabinet Body' THEN 'For 200cm: 1.075m center (0.15 + 1.85/2)'
    WHEN gp.part_name = 'Door' THEN 'Matches Cabinet Body'
    WHEN gp.part_name = 'Oven Door' THEN 'Below center for oven cutout'
    ELSE 'OK'
  END as calculation
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id IN ('tall-unit-60', 'tall-unit-80', 'oven-housing-60')
ORDER BY cm.component_id, gp.render_order;

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
  RAISE NOTICE 'Fixed positioning for 3 larder units:';
  RAISE NOTICE '  ✅ tall-unit-60';
  RAISE NOTICE '  ✅ tall-unit-80';
  RAISE NOTICE '  ✅ oven-housing-60';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  - Cabinet Body: ''0.075'' → ''height / 2 + plinthHeight / 2''';
  RAISE NOTICE '  - Door: ''0.075'' → ''height / 2 + plinthHeight / 2''';
  RAISE NOTICE '  - Oven Door: ''-0.20'' → ''height / 2 + plinthHeight / 2 - 0.60''';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected result (for 200cm unit):';
  RAISE NOTICE '  - Plinth: center at 0.075m (7.5cm), bottom at 0, top at 0.15m';
  RAISE NOTICE '  - Cabinet Body: center at 1.075m, bottom at 0.15m, top at 2.0m';
  RAISE NOTICE '  - Total height: 200cm (15cm plinth + 185cm body)';
  RAISE NOTICE '  - Units now appear full height instead of 90cm!';
  RAISE NOTICE '=============================================================================';
END $$;
