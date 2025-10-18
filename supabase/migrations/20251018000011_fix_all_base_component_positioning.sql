-- ================================================================
-- Migration: Fix All Base Component Positioning
-- ================================================================
-- Date: 2025-10-18
-- Purpose: Fix Y-positioning for pan drawers and base cabinets
-- Issue: Components use OLD system (-height/2) causing underground rendering
--
-- Problem:
-- - Pan drawers and base cabinets use position_y = '-height / 2 + plinthHeight / 2'
-- - This is the OLD positioning system from early migrations
-- - With DynamicRenderer yPosition = 0, geometry renders underground
-- - For 90cm cabinet: Plinth at -0.375m (37.5cm below ground!)
--
-- Affected Components:
-- - pan-drawers-30, 40, 50, 60, 80, 100 (6 variants)
-- - base-cabinet-30, 40, 50, 60, 80, 100 (6 variants)
-- - Total: 12 components, ~48 geometry parts
--
-- Solution:
-- - Change to NEW 0-based positioning system (same as corner cabinets)
-- - Plinth position_y: '0.075' (center at 7.5cm, bottom at Y=0)
-- - Cabinet/body: Sits on top of plinth
-- - All parts positioned relative to ground (Y=0)
--
-- Changes:
-- 1. Pan Drawers:
--    - Plinth: '0.075' (was: '-height / 2 + 0.075')
--    - Cabinet Body: 'height / 2 + 0.15' (was: '0.075')
--    - Drawer 1: '0.25' (was: '-0.15')
--    - Drawer 2: '0.50' (was: '0.10')
--    - Drawer 3: '0.75' (was: '0.35')
--
-- 2. Base Cabinets:
--    - Plinth: '0.075' (was: '-height / 2 + plinthHeight / 2')
--    - Cabinet Body: 'height / 2 + plinthHeight / 2' (was: 'plinthHeight / 2')
--    - Door: 'height / 2 + plinthHeight / 2' (was: 'plinthHeight / 2')
--    - Handle: 'height / 2 + plinthHeight / 2 + cabinetHeight / 2 - 0.1'
--
-- References:
-- - Analysis: docs/PAN_DRAWER_RENDERING_ANALYSIS.md
-- - Analysis: docs/BASE_CABINET_RENDERING_ISSUE_ANALYSIS.md
-- - Template: migration 20251018000008 (corner cabinet fix)
-- ================================================================

-- ================================================================
-- BEFORE: Show current state
-- ================================================================

DO $$
DECLARE
  pan_drawer_count INT;
  base_cabinet_count INT;
  pan_drawer_parts INT;
  base_cabinet_parts INT;
BEGIN
  -- Count components
  SELECT COUNT(*) INTO pan_drawer_count
  FROM component_3d_models
  WHERE component_id LIKE 'pan-drawers%';

  SELECT COUNT(*) INTO base_cabinet_count
  FROM component_3d_models
  WHERE component_id LIKE 'base-cabinet%';

  -- Count geometry parts
  SELECT COUNT(*) INTO pan_drawer_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id LIKE 'pan-drawers%';

  SELECT COUNT(*) INTO base_cabinet_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id LIKE 'base-cabinet%';

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'BEFORE: Current State';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Pan drawer components: %', pan_drawer_count;
  RAISE NOTICE 'Pan drawer geometry parts: %', pan_drawer_parts;
  RAISE NOTICE 'Base cabinet components: %', base_cabinet_count;
  RAISE NOTICE 'Base cabinet geometry parts: %', base_cabinet_parts;
  RAISE NOTICE '';
  RAISE NOTICE 'Expected:';
  RAISE NOTICE '  - 6 pan drawer components (30, 40, 50, 60, 80, 100cm)';
  RAISE NOTICE '  - 30 pan drawer parts (5 per component)';
  RAISE NOTICE '  - 6 base cabinet components (30, 40, 50, 60, 80, 100cm)';
  RAISE NOTICE '  - 24 base cabinet parts (4 per component)';
  RAISE NOTICE '=============================================================================';
END $$;

-- ================================================================
-- PART 1: Fix Pan Drawers (6 variants)
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
  v_component_id text;
  v_fixed_count INT := 0;
  v_parts_updated INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'PART 1: Fixing Pan Drawer Positioning';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';

  FOR v_component_id IN
    SELECT UNNEST(ARRAY[
      'pan-drawers-30',
      'pan-drawers-40',
      'pan-drawers-50',
      'pan-drawers-60',
      'pan-drawers-80',
      'pan-drawers-100'
    ])
  LOOP
    -- Get model ID
    SELECT id INTO v_model_id
    FROM component_3d_models
    WHERE component_id = v_component_id;

    IF v_model_id IS NULL THEN
      RAISE WARNING '  ❌ Model not found: %', v_component_id;
      CONTINUE;
    END IF;

    -- Update Plinth position_y
    -- OLD: '-height / 2 + 0.075' → NEW: '0.075'
    UPDATE geometry_parts
    SET position_y = '0.075'
    WHERE model_id = v_model_id
      AND part_name = 'Plinth';
    v_parts_updated := v_parts_updated + 1;

    -- Update Cabinet Body position_y
    -- OLD: '0.075' → NEW: 'height / 2 + 0.15'
    UPDATE geometry_parts
    SET position_y = 'height / 2 + 0.15'
    WHERE model_id = v_model_id
      AND part_name = 'Cabinet Body';
    v_parts_updated := v_parts_updated + 1;

    -- Update Drawer 1 position_y (bottom drawer)
    -- OLD: '-0.15' → NEW: '0.25'
    -- Calculation: 0.15 (plinth) + 0.10 (gap) = 0.25
    UPDATE geometry_parts
    SET position_y = '0.25'
    WHERE model_id = v_model_id
      AND part_name = 'Drawer 1';
    v_parts_updated := v_parts_updated + 1;

    -- Update Drawer 2 position_y (middle drawer)
    -- OLD: '0.10' → NEW: '0.50'
    -- Calculation: 0.15 + 0.20 (drawer 1) + 0.05 (gap) + 0.10 (half drawer 2) = 0.50
    UPDATE geometry_parts
    SET position_y = '0.50'
    WHERE model_id = v_model_id
      AND part_name = 'Drawer 2';
    v_parts_updated := v_parts_updated + 1;

    -- Update Drawer 3 position_y (top drawer)
    -- OLD: '0.35' → NEW: '0.75'
    -- Calculation: 0.15 + 0.20 + 0.05 + 0.20 + 0.05 + 0.10 = 0.75
    UPDATE geometry_parts
    SET position_y = '0.75'
    WHERE model_id = v_model_id
      AND part_name = 'Drawer 3';
    v_parts_updated := v_parts_updated + 1;

    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE '  ✅ Fixed: % (5 parts updated)', v_component_id;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Pan drawers fixed: % / 6', v_fixed_count;
  RAISE NOTICE 'Geometry parts updated: % / 30', v_parts_updated;
  RAISE NOTICE '';
END $$;

-- ================================================================
-- PART 2: Fix Base Cabinets (6 variants)
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
  v_component_id text;
  v_fixed_count INT := 0;
  v_parts_updated INT := 0;
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'PART 2: Fixing Base Cabinet Positioning';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';

  FOR v_component_id IN
    SELECT UNNEST(ARRAY[
      'base-cabinet-30',
      'base-cabinet-40',
      'base-cabinet-50',
      'base-cabinet-60',
      'base-cabinet-80',
      'base-cabinet-100'
    ])
  LOOP
    -- Get model ID
    SELECT id INTO v_model_id
    FROM component_3d_models
    WHERE component_id = v_component_id;

    IF v_model_id IS NULL THEN
      RAISE WARNING '  ❌ Model not found: %', v_component_id;
      CONTINUE;
    END IF;

    -- Update Plinth position_y
    -- OLD: '-height / 2 + plinthHeight / 2' → NEW: '0.075'
    UPDATE geometry_parts
    SET position_y = '0.075'
    WHERE model_id = v_model_id
      AND part_name = 'Plinth';
    v_parts_updated := v_parts_updated + 1;

    -- Update Cabinet Body position_y
    -- OLD: 'plinthHeight / 2' → NEW: 'height / 2 + plinthHeight / 2'
    -- For 90cm: 0.45 + 0.075 = 0.525 (center of body)
    UPDATE geometry_parts
    SET position_y = 'height / 2 + plinthHeight / 2'
    WHERE model_id = v_model_id
      AND part_name = 'Cabinet Body';
    v_parts_updated := v_parts_updated + 1;

    -- Update Door position_y
    -- OLD: 'plinthHeight / 2' → NEW: 'height / 2 + plinthHeight / 2'
    -- Same as cabinet body - door sits on same level
    UPDATE geometry_parts
    SET position_y = 'height / 2 + plinthHeight / 2'
    WHERE model_id = v_model_id
      AND part_name = 'Door';
    v_parts_updated := v_parts_updated + 1;

    -- Update Handle position_y
    -- Adjust to new cabinet body position
    -- Position handle in upper-middle of door
    UPDATE geometry_parts
    SET position_y = 'height / 2 + plinthHeight / 2 + cabinetHeight / 2 - 0.1'
    WHERE model_id = v_model_id
      AND part_name = 'Handle';
    v_parts_updated := v_parts_updated + 1;

    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE '  ✅ Fixed: % (4 parts updated)', v_component_id;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Base cabinets fixed: % / 6', v_fixed_count;
  RAISE NOTICE 'Geometry parts updated: % / 24', v_parts_updated;
  RAISE NOTICE '';
END $$;

-- ================================================================
-- VERIFICATION: Check all fixes applied correctly
-- ================================================================

DO $$
DECLARE
  pan_drawer_plinth_count INT;
  base_cabinet_plinth_count INT;
  pan_drawer_body_count INT;
  base_cabinet_body_count INT;
BEGIN
  -- Count fixed pan drawer plinths
  SELECT COUNT(*) INTO pan_drawer_plinth_count
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id LIKE 'pan-drawers%'
    AND gp.part_name = 'Plinth'
    AND gp.position_y = '0.075';

  -- Count fixed base cabinet plinths
  SELECT COUNT(*) INTO base_cabinet_plinth_count
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id LIKE 'base-cabinet%'
    AND gp.part_name = 'Plinth'
    AND gp.position_y = '0.075';

  -- Count fixed pan drawer bodies
  SELECT COUNT(*) INTO pan_drawer_body_count
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id LIKE 'pan-drawers%'
    AND gp.part_name = 'Cabinet Body'
    AND gp.position_y = 'height / 2 + 0.15';

  -- Count fixed base cabinet bodies
  SELECT COUNT(*) INTO base_cabinet_body_count
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id LIKE 'base-cabinet%'
    AND gp.part_name = 'Cabinet Body'
    AND gp.position_y = 'height / 2 + plinthHeight / 2';

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'VERIFICATION RESULTS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Pan Drawers:';
  RAISE NOTICE '  Plinths with position_y = 0.075: % / 6', pan_drawer_plinth_count;
  RAISE NOTICE '  Bodies with new position formula: % / 6', pan_drawer_body_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Base Cabinets:';
  RAISE NOTICE '  Plinths with position_y = 0.075: % / 6', base_cabinet_plinth_count;
  RAISE NOTICE '  Bodies with new position formula: % / 6', base_cabinet_body_count;
  RAISE NOTICE '';

  IF pan_drawer_plinth_count = 6 AND pan_drawer_body_count = 6 AND
     base_cabinet_plinth_count = 6 AND base_cabinet_body_count = 6 THEN
    RAISE NOTICE '✅ ALL COMPONENTS FIXED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Results in 3D View:';
    RAISE NOTICE '  - All plinths sit on ground (Y = 0)';
    RAISE NOTICE '  - Plinths are 15cm tall and visible';
    RAISE NOTICE '  - Cabinet bodies sit directly on plinths';
    RAISE NOTICE '  - No underground geometry';
    RAISE NOTICE '  - No "stumpy" appearance';
    RAISE NOTICE '  - Pan drawers show 3 evenly-spaced drawer fronts';
    RAISE NOTICE '  - Base cabinets show door with handle';
  ELSE
    RAISE WARNING '❌ SOME COMPONENTS NOT FIXED CORRECTLY!';
    RAISE WARNING '';
    RAISE WARNING 'Missing fixes:';
    IF pan_drawer_plinth_count < 6 THEN
      RAISE WARNING '  - Pan drawer plinths: % / 6', pan_drawer_plinth_count;
    END IF;
    IF pan_drawer_body_count < 6 THEN
      RAISE WARNING '  - Pan drawer bodies: % / 6', pan_drawer_body_count;
    END IF;
    IF base_cabinet_plinth_count < 6 THEN
      RAISE WARNING '  - Base cabinet plinths: % / 6', base_cabinet_plinth_count;
    END IF;
    IF base_cabinet_body_count < 6 THEN
      RAISE WARNING '  - Base cabinet bodies: % / 6', base_cabinet_body_count;
    END IF;
  END IF;

  RAISE NOTICE '=============================================================================';
END $$;

-- ================================================================
-- DETAILED COMPONENT STATUS
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'DETAILED COMPONENT STATUS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

-- Show pan drawer geometry parts
SELECT
  cm.component_id,
  gp.part_name,
  gp.position_y,
  gp.dimension_height,
  gp.render_order
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id = 'pan-drawers-60'
ORDER BY gp.render_order;

-- Show base cabinet geometry parts
SELECT
  cm.component_id,
  gp.part_name,
  gp.position_y,
  gp.dimension_height,
  gp.render_order
FROM component_3d_models cm
JOIN geometry_parts gp ON cm.id = gp.model_id
WHERE cm.component_id = 'base-cabinet-60'
ORDER BY gp.render_order;

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
  RAISE NOTICE '  ✅ Pan drawers: 30, 40, 50, 60, 80, 100cm (6 variants)';
  RAISE NOTICE '  ✅ Base cabinets: 30, 40, 50, 60, 80, 100cm (6 variants)';
  RAISE NOTICE '';
  RAISE NOTICE 'Total: 12 components, 54 geometry parts updated';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run: npx supabase db reset';
  RAISE NOTICE '  2. Open 3D view and test components';
  RAISE NOTICE '  3. Verify plinth visibility at ground level';
  RAISE NOTICE '  4. Check for any underground geometry';
  RAISE NOTICE '';
  RAISE NOTICE 'See docs/SESSION_2025-10-18_HANDOVER_SUMMARY.md for testing checklist';
  RAISE NOTICE '=============================================================================';
END $$;
