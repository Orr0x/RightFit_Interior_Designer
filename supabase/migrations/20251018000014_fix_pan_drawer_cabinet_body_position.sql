-- ================================================================
-- Migration: Fix Pan Drawer Cabinet Body Position
-- ================================================================
-- Date: 2025-10-18
-- Purpose: Fix floating cabinet body in pan drawers
-- Issue: Cabinet body using 'height / 2 + 0.15' causing it to float above plinth
--
-- Problem:
-- - Cabinet Body position_y = 'height / 2 + 0.15' = 0.6m (for 90cm cabinet)
-- - Should be: 'height / 2 + plinthHeight / 2' = 0.525m
-- - This matches base cabinet formula and puts body at correct height
-- - Drawers at 0.25, 0.50, 0.75 look wrong because body is too high
--
-- Visual Issue:
-- - Cabinet body floating above plinth (gap visible)
-- - Drawer fronts attached to cabinet body, so they look correct
-- - But cabinet body itself is elevated incorrectly
--
-- Solution:
-- - Change Cabinet Body position_y to match base cabinets
-- - From: 'height / 2 + 0.15'
-- - To: 'height / 2 + plinthHeight / 2'
-- ================================================================

-- ================================================================
-- Show current state
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'BEFORE: Pan Drawer Cabinet Body Positions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  cm.component_id,
  gp.part_name,
  gp.position_y,
  'height / 2 + plinthHeight / 2 expected' as expected_formula
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id LIKE 'pan-drawers%'
  AND gp.part_name = 'Cabinet Body'
ORDER BY cm.component_id;

-- ================================================================
-- Fix Cabinet Body Position
-- ================================================================

DO $$
DECLARE
  v_updated INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Fixing Pan Drawer Cabinet Body Positions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';

  -- Update all pan drawer cabinet bodies
  UPDATE geometry_parts gp
  SET position_y = 'height / 2 + plinthHeight / 2'
  FROM component_3d_models cm
  WHERE gp.model_id = cm.id
    AND cm.component_id LIKE 'pan-drawers%'
    AND gp.part_name = 'Cabinet Body';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RAISE NOTICE 'Updated % cabinet bodies', v_updated;
  RAISE NOTICE 'Expected: 6 (one per pan drawer variant)';
  RAISE NOTICE '';

  IF v_updated = 6 THEN
    RAISE NOTICE '✅ All pan drawer cabinet bodies fixed!';
  ELSE
    RAISE WARNING '❌ Expected 6 updates, got %', v_updated;
  END IF;

  RAISE NOTICE '';
END $$;

-- ================================================================
-- Verification
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'AFTER: Pan Drawer Cabinet Body Positions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  cm.component_id,
  gp.part_name,
  gp.position_y,
  'For 90cm: 0.45 + 0.075 = 0.525m center' as calculation
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id LIKE 'pan-drawers%'
  AND gp.part_name = 'Cabinet Body'
ORDER BY cm.component_id;

-- ================================================================
-- Show full pan drawer geometry for verification
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Full Pan Drawer Geometry (pan-drawers-60)';
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
WHERE cm.component_id = 'pan-drawers-60'
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
  RAISE NOTICE 'Fixed: Pan drawer cabinet body position';
  RAISE NOTICE '  Old formula: height / 2 + 0.15 (0.6m for 90cm cabinet)';
  RAISE NOTICE '  New formula: height / 2 + plinthHeight / 2 (0.525m for 90cm cabinet)';
  RAISE NOTICE '';
  RAISE NOTICE 'This matches base cabinet positioning and eliminates floating cabinet body.';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected result:';
  RAISE NOTICE '  - Cabinet body sits directly on plinth (no gap)';
  RAISE NOTICE '  - Drawer fronts at correct positions (0.25, 0.50, 0.75)';
  RAISE NOTICE '  - Overall height 90cm (15cm plinth + 75cm cabinet)';
  RAISE NOTICE '=============================================================================';
END $$;
