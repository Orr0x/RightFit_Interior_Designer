-- =============================================================================
-- DELETE UNNEEDED CORNER UNITS
-- Migration: 20251018000009
-- Date: 2025-10-18
-- Purpose: Remove larder-corner-unit-60 and new-corner-wall-cabinet-90
-- Session: feature/database-component-cleanup
-- =============================================================================

-- Components to DELETE:
--   1. larder-corner-unit-60 (tall larder 60cm) - not needed
--   2. new-corner-wall-cabinet-90 (wall cabinet 90cm) - not needed
--
-- Components to KEEP:
--   1. corner-cabinet (base 90cm) ✅
--   2. larder-corner-unit-90 (tall larder 90cm) ✅
--   3. new-corner-wall-cabinet-60 (wall cabinet 60cm) ✅
--   4. kitchen-sink-corner-90 (corner sink) ✅
--   5. butler-sink-corner-90 (corner butler sink) ✅
--   6. desk-corner-120 (corner desk) ✅

-- =============================================================================
-- STEP 1: Check what will be deleted
-- =============================================================================

DO $$
DECLARE
  larder_60_model_id UUID;
  wall_90_model_id UUID;
  larder_60_geom_count INT;
  wall_90_geom_count INT;
  larder_60_2d_count INT;
  wall_90_2d_count INT;
BEGIN
  -- Get model IDs
  SELECT id INTO larder_60_model_id
  FROM component_3d_models
  WHERE component_id = 'larder-corner-unit-60';

  SELECT id INTO wall_90_model_id
  FROM component_3d_models
  WHERE component_id = 'new-corner-wall-cabinet-90';

  -- Count related records
  SELECT COUNT(*) INTO larder_60_geom_count
  FROM geometry_parts
  WHERE model_id = larder_60_model_id;

  SELECT COUNT(*) INTO wall_90_geom_count
  FROM geometry_parts
  WHERE model_id = wall_90_model_id;

  SELECT COUNT(*) INTO larder_60_2d_count
  FROM component_2d_renders
  WHERE component_id = 'larder-corner-unit-60';

  SELECT COUNT(*) INTO wall_90_2d_count
  FROM component_2d_renders
  WHERE component_id = 'new-corner-wall-cabinet-90';

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'PRE-DELETION STATUS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'larder-corner-unit-60:';
  RAISE NOTICE '  - geometry_parts: %', larder_60_geom_count;
  RAISE NOTICE '  - component_2d_renders: %', larder_60_2d_count;
  RAISE NOTICE '';
  RAISE NOTICE 'new-corner-wall-cabinet-90:';
  RAISE NOTICE '  - geometry_parts: %', wall_90_geom_count;
  RAISE NOTICE '  - component_2d_renders: %', wall_90_2d_count;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 2: Delete geometry_parts (cascade from 3D models)
-- =============================================================================

DO $$
DECLARE
  larder_60_geom_deleted INT := 0;
  wall_90_geom_deleted INT := 0;
BEGIN
  -- Delete geometry parts for larder-corner-unit-60
  DELETE FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-60');
  GET DIAGNOSTICS larder_60_geom_deleted = ROW_COUNT;

  -- Delete geometry parts for new-corner-wall-cabinet-90
  DELETE FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'new-corner-wall-cabinet-90');
  GET DIAGNOSTICS wall_90_geom_deleted = ROW_COUNT;

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'STEP 2: Delete geometry_parts';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Deleted % geometry parts from larder-corner-unit-60', larder_60_geom_deleted;
  RAISE NOTICE 'Deleted % geometry parts from new-corner-wall-cabinet-90', wall_90_geom_deleted;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 3: Delete component_3d_models
-- =============================================================================

DO $$
DECLARE
  larder_60_model_deleted INT := 0;
  wall_90_model_deleted INT := 0;
BEGIN
  -- Delete 3D model for larder-corner-unit-60
  DELETE FROM component_3d_models
  WHERE component_id = 'larder-corner-unit-60';
  GET DIAGNOSTICS larder_60_model_deleted = ROW_COUNT;

  -- Delete 3D model for new-corner-wall-cabinet-90
  DELETE FROM component_3d_models
  WHERE component_id = 'new-corner-wall-cabinet-90';
  GET DIAGNOSTICS wall_90_model_deleted = ROW_COUNT;

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'STEP 3: Delete component_3d_models';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Deleted % 3D model for larder-corner-unit-60', larder_60_model_deleted;
  RAISE NOTICE 'Deleted % 3D model for new-corner-wall-cabinet-90', wall_90_model_deleted;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 4: Delete component_2d_renders
-- =============================================================================

DO $$
DECLARE
  larder_60_2d_deleted INT := 0;
  wall_90_2d_deleted INT := 0;
BEGIN
  -- Delete 2D renders for larder-corner-unit-60
  DELETE FROM component_2d_renders
  WHERE component_id = 'larder-corner-unit-60';
  GET DIAGNOSTICS larder_60_2d_deleted = ROW_COUNT;

  -- Delete 2D renders for new-corner-wall-cabinet-90
  DELETE FROM component_2d_renders
  WHERE component_id = 'new-corner-wall-cabinet-90';
  GET DIAGNOSTICS wall_90_2d_deleted = ROW_COUNT;

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'STEP 4: Delete component_2d_renders';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Deleted % 2D renders for larder-corner-unit-60', larder_60_2d_deleted;
  RAISE NOTICE 'Deleted % 2D renders for new-corner-wall-cabinet-90', wall_90_2d_deleted;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 5: Delete components (main records)
-- =============================================================================

DO $$
DECLARE
  larder_60_deleted INT := 0;
  wall_90_deleted INT := 0;
BEGIN
  -- Delete larder-corner-unit-60 component
  DELETE FROM components
  WHERE component_id = 'larder-corner-unit-60';
  GET DIAGNOSTICS larder_60_deleted = ROW_COUNT;

  -- Delete new-corner-wall-cabinet-90 component
  DELETE FROM components
  WHERE component_id = 'new-corner-wall-cabinet-90';
  GET DIAGNOSTICS wall_90_deleted = ROW_COUNT;

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'STEP 5: Delete components';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Deleted % component for larder-corner-unit-60', larder_60_deleted;
  RAISE NOTICE 'Deleted % component for new-corner-wall-cabinet-90', wall_90_deleted;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 6: Verify deletion and show remaining corner components
-- =============================================================================

DO $$
DECLARE
  remaining_count INT;
BEGIN
  -- Count remaining corner components
  SELECT COUNT(*) INTO remaining_count
  FROM components
  WHERE component_id LIKE '%corner%';

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'POST-DELETION STATUS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Remaining corner components: %', remaining_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Expected remaining (4 corner components):';
  RAISE NOTICE '  ✅ corner-cabinet (base 90cm)';
  RAISE NOTICE '  ✅ larder-corner-unit-90 (tall 90cm)';
  RAISE NOTICE '  ✅ new-corner-wall-cabinet-60 (wall 60cm)';
  RAISE NOTICE '  ✅ kitchen-sink-corner-90 (sink)';
  RAISE NOTICE '  ✅ butler-sink-corner-90 (sink)';
  RAISE NOTICE '  ✅ desk-corner-120 (desk)';
  RAISE NOTICE '=============================================================================';
END $$;

-- Show remaining corner components
SELECT
  component_id,
  name,
  type,
  category,
  width || '×' || depth || '×' || height as dimensions
FROM components
WHERE component_id LIKE '%corner%'
ORDER BY
  CASE type
    WHEN 'cabinet' THEN 1
    WHEN 'sink' THEN 2
    WHEN 'desk' THEN 3
    ELSE 4
  END,
  component_id;

-- =============================================================================
-- NOTES
-- =============================================================================

-- This migration removes 2 unneeded corner units:
--
-- DELETED:
--   ❌ larder-corner-unit-60 (tall larder 60cm) - not needed by user
--   ❌ new-corner-wall-cabinet-90 (wall cabinet 90cm) - not needed by user
--
-- KEPT (6 total):
--   ✅ corner-cabinet (base 90cm) - primary base corner unit
--   ✅ larder-corner-unit-90 (tall 90cm) - primary tall corner unit
--   ✅ new-corner-wall-cabinet-60 (wall 60cm) - primary wall corner unit
--   ✅ kitchen-sink-corner-90 (corner sink) - user decision: keep for later
--   ✅ butler-sink-corner-90 (corner butler sink) - user decision: keep for later
--   ✅ desk-corner-120 (corner desk) - user decision: keep for later
--
-- All deleted components had L-shaped geometry that was added in migration
-- 20251018000008, but user confirmed they are not needed.
--
-- Deletion cascades through:
--   1. geometry_parts (8 parts for larder-60, 6 parts for wall-90)
--   2. component_3d_models (3D model definitions)
--   3. component_2d_renders (2D rendering data)
--   4. components (main component records)
