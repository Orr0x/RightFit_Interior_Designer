-- ================================================================
-- Migration: Remove Old Fixed-Size Countertops
-- ================================================================
-- Date: 2025-10-18
-- Purpose: Remove legacy fixed-size countertop components
--
-- Background:
-- - Old system had counter-top-60, 80, 100, 120 (fixed sizes)
-- - New system uses counter-top-horizontal (300x60) and counter-top-vertical (60x300)
-- - Horizontal/vertical countertops are procedurally generated in EnhancedCounterTop3D
-- - Fixed-size countertops are redundant and confusing
--
-- Components to Remove:
-- - counter-top-60 (60x60x4cm)
-- - counter-top-80 (80x60x4cm)
-- - counter-top-100 (100x60x4cm)
-- - counter-top-120 (120x60x4cm)
--
-- Components to Keep:
-- - counter-top-horizontal (300x60x4cm) - for left-to-right counters
-- - counter-top-vertical (60x300x4cm) - for front-to-back counters
-- - (Future: counter-top-corner for L-shaped corners)
-- ================================================================

-- ================================================================
-- Show current countertop components
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'BEFORE: Current Countertop Components';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';
END $$;

SELECT
  component_id,
  name,
  width,
  depth,
  height,
  category,
  deprecated
FROM components
WHERE category = 'counter-tops'
ORDER BY component_id;

-- ================================================================
-- Delete old fixed-size countertop 3D models and geometry
-- ================================================================

DO $$
DECLARE
  v_deleted_geometry INT := 0;
  v_deleted_models INT := 0;
  v_deleted_components INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Removing Old Fixed-Size Countertops';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';

  -- Delete geometry parts for old countertops
  DELETE FROM geometry_parts gp
  USING component_3d_models cm
  WHERE gp.model_id = cm.id
    AND cm.component_id IN ('counter-top-60', 'counter-top-80', 'counter-top-100', 'counter-top-120');

  GET DIAGNOSTICS v_deleted_geometry = ROW_COUNT;
  RAISE NOTICE 'Deleted % geometry parts', v_deleted_geometry;

  -- Delete 3D models for old countertops
  DELETE FROM component_3d_models
  WHERE component_id IN ('counter-top-60', 'counter-top-80', 'counter-top-100', 'counter-top-120');

  GET DIAGNOSTICS v_deleted_models = ROW_COUNT;
  RAISE NOTICE 'Deleted % 3D models', v_deleted_models;

  -- Delete component entries
  DELETE FROM components
  WHERE component_id IN ('counter-top-60', 'counter-top-80', 'counter-top-100', 'counter-top-120');

  GET DIAGNOSTICS v_deleted_components = ROW_COUNT;
  RAISE NOTICE 'Deleted % component entries', v_deleted_components;

  RAISE NOTICE '';
  IF v_deleted_components = 4 THEN
    RAISE NOTICE '✅ Successfully removed 4 old countertop components';
  ELSE
    RAISE WARNING '⚠️  Expected to delete 4 components, deleted %', v_deleted_components;
  END IF;

  RAISE NOTICE '';
END $$;

-- ================================================================
-- Verification
-- ================================================================

DO $$
DECLARE
  v_remaining_count INT;
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'AFTER: Remaining Countertop Components';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO v_remaining_count
  FROM components
  WHERE category = 'counter-tops';

  RAISE NOTICE 'Remaining countertop components: %', v_remaining_count;
  RAISE NOTICE 'Expected: 2 (counter-top-horizontal, counter-top-vertical)';
  RAISE NOTICE '';
END $$;

SELECT
  component_id,
  name,
  width,
  depth,
  height,
  category
FROM components
WHERE category = 'counter-tops'
ORDER BY component_id;

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
  RAISE NOTICE 'Removed components:';
  RAISE NOTICE '  ❌ counter-top-60 (60x60x4cm)';
  RAISE NOTICE '  ❌ counter-top-80 (80x60x4cm)';
  RAISE NOTICE '  ❌ counter-top-100 (100x60x4cm)';
  RAISE NOTICE '  ❌ counter-top-120 (120x60x4cm)';
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining components:';
  RAISE NOTICE '  ✅ counter-top-horizontal (300x60x4cm) - for left-to-right';
  RAISE NOTICE '  ✅ counter-top-vertical (60x300x4cm) - for front-to-back';
  RAISE NOTICE '';
  RAISE NOTICE 'Future addition:';
  RAISE NOTICE '  📋 counter-top-corner - for L-shaped corners (not yet implemented)';
  RAISE NOTICE '';
  RAISE NOTICE 'The horizontal and vertical countertops are procedurally generated in';
  RAISE NOTICE 'EnhancedCounterTop3D component - no database 3D models needed.';
  RAISE NOTICE '=============================================================================';
END $$;
