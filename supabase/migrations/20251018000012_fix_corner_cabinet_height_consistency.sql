-- ================================================================
-- Migration: Fix Corner Cabinet Height Consistency
-- ================================================================
-- Date: 2025-10-18
-- Purpose: Fix height inconsistency between corner cabinets and base cabinets
-- Issue: Corner cabinets use 'height / 2 + 0.15' but base cabinets use 'height / 2 + plinthHeight / 2'
--
-- Problem:
-- - Corner cabinets: position_y = 'height / 2 + 0.15' = 0.45 + 0.15 = 0.6m
-- - Base cabinets: position_y = 'height / 2 + plinthHeight / 2' = 0.45 + 0.075 = 0.525m
-- - Difference: 7.5cm (corner cabinets appear taller)
--
-- Solution:
-- - Change corner cabinets to use 'height / 2 + plinthHeight / 2' (same as base cabinets)
-- - This makes plinthHeight / 2 = 0.075 (half of 15cm plinth)
-- - Cabinet body bottom will be at Y = 0.15 (top of plinth)
-- - Consistent with base cabinets
--
-- Affected Components:
-- - corner-cabinet (base corner 90cm)
-- - larder-corner-unit-60 (tall corner 60cm)
-- - larder-corner-unit-90 (tall corner 90cm)
--
-- Changes:
-- - Cabinet X-leg: 'height / 2 + plinthHeight / 2' (was: 'height / 2 + 0.15')
-- - Cabinet Z-leg: 'height / 2 + plinthHeight / 2' (was: 'height / 2 + 0.15')
-- - Front door: 'height / 2 + plinthHeight / 2' (was: 'height / 2 + 0.15')
-- - Side door: 'height / 2 + plinthHeight / 2' (was: 'height / 2 + 0.15')
-- - Front handle: (relative to door position)
-- - Side handle: (relative to door position)
-- ================================================================

-- ================================================================
-- BEFORE: Show current positions
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'BEFORE: Current Cabinet Body Positions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  cm.component_id,
  cm.component_type,
  gp.part_name,
  gp.position_y as current_position_y
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id IN ('corner-cabinet', 'base-cabinet-60')
  AND gp.part_name IN ('Cabinet X-leg', 'Cabinet Body')
ORDER BY cm.component_id, gp.part_name;

-- ================================================================
-- FIX: Update corner cabinet positions
-- ================================================================

DO $$
DECLARE
  corner_cabinet_updated INT := 0;
  larder_60_updated INT := 0;
  larder_90_updated INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'FIXING: Corner Cabinet Positions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';

  -- Fix corner-cabinet (base 90cm)
  UPDATE geometry_parts
  SET position_y = 'height / 2 + plinthHeight / 2'
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'corner-cabinet')
    AND part_name IN ('Cabinet X-leg', 'Cabinet Z-leg', 'Front door', 'Side door', 'Front handle', 'Side handle');
  GET DIAGNOSTICS corner_cabinet_updated = ROW_COUNT;

  -- Fix larder-corner-unit-60 (tall 60cm legs)
  UPDATE geometry_parts
  SET position_y = 'height / 2 + plinthHeight / 2'
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-60')
    AND part_name IN ('Cabinet X-leg', 'Cabinet Z-leg', 'Front door', 'Side door', 'Front handle', 'Side handle');
  GET DIAGNOSTICS larder_60_updated = ROW_COUNT;

  -- Fix larder-corner-unit-90 (tall 90cm legs)
  UPDATE geometry_parts
  SET position_y = 'height / 2 + plinthHeight / 2'
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-90')
    AND part_name IN ('Cabinet X-leg', 'Cabinet Z-leg', 'Front door', 'Side door', 'Front handle', 'Side handle');
  GET DIAGNOSTICS larder_90_updated = ROW_COUNT;

  RAISE NOTICE '  ✅ corner-cabinet: % parts updated', corner_cabinet_updated;
  RAISE NOTICE '  ✅ larder-corner-unit-60: % parts updated', larder_60_updated;
  RAISE NOTICE '  ✅ larder-corner-unit-90: % parts updated', larder_90_updated;
  RAISE NOTICE '';
END $$;

-- ================================================================
-- VERIFICATION: Check positions match
-- ================================================================

DO $$
DECLARE
  corner_body_position TEXT;
  base_body_position TEXT;
BEGIN
  -- Get corner cabinet body position
  SELECT position_y INTO corner_body_position
  FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'corner-cabinet')
    AND part_name = 'Cabinet X-leg'
  LIMIT 1;

  -- Get base cabinet body position
  SELECT position_y INTO base_body_position
  FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'base-cabinet-60')
    AND part_name = 'Cabinet Body'
  LIMIT 1;

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'VERIFICATION: Position Comparison';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Corner cabinet (Cabinet X-leg): %', corner_body_position;
  RAISE NOTICE 'Base cabinet (Cabinet Body): %', base_body_position;
  RAISE NOTICE '';

  IF corner_body_position = base_body_position THEN
    RAISE NOTICE '✅ SUCCESS: Positions match!';
    RAISE NOTICE '';
    RAISE NOTICE 'Both use formula: height / 2 + plinthHeight / 2';
    RAISE NOTICE 'For 90cm cabinet: 0.45 + 0.075 = 0.525m (center)';
    RAISE NOTICE 'Cabinet bottom: 0.525 - 0.375 = 0.15m (sits on plinth top)';
    RAISE NOTICE 'Cabinet top: 0.525 + 0.375 = 0.9m';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Results in 3D View:';
    RAISE NOTICE '  - Corner cabinets and base cabinets same height';
    RAISE NOTICE '  - Both plinths at same level (Y=0)';
    RAISE NOTICE '  - Both cabinet bodies start at Y=0.15';
    RAISE NOTICE '  - Both reach Y=0.9m (90cm total)';
  ELSE
    RAISE WARNING '❌ POSITIONS DO NOT MATCH!';
    RAISE WARNING 'Corner cabinet: %', corner_body_position;
    RAISE WARNING 'Base cabinet: %', base_body_position;
  END IF;

  RAISE NOTICE '=============================================================================';
END $$;

-- ================================================================
-- AFTER: Show updated positions
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'AFTER: Updated Cabinet Body Positions';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  cm.component_id,
  cm.component_type,
  gp.part_name,
  gp.position_y as updated_position_y
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id IN ('corner-cabinet', 'larder-corner-unit-60', 'larder-corner-unit-90', 'base-cabinet-60')
  AND gp.part_name IN ('Cabinet X-leg', 'Cabinet Body')
ORDER BY cm.component_id, gp.part_name;

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
  RAISE NOTICE '  ✅ corner-cabinet (6 parts)';
  RAISE NOTICE '  ✅ larder-corner-unit-60 (6 parts)';
  RAISE NOTICE '  ✅ larder-corner-unit-90 (6 parts)';
  RAISE NOTICE '';
  RAISE NOTICE 'Now consistent with base cabinets and pan drawers!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run: npx supabase db reset';
  RAISE NOTICE '  2. Test corner-cabinet next to base-cabinet-60';
  RAISE NOTICE '  3. Verify same height (90cm)';
  RAISE NOTICE '  4. Verify both plinths at same level';
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
END $$;
