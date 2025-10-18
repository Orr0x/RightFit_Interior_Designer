-- =============================================================================
-- ADD MISSING 3D MODELS FOR 3 COMPONENTS
-- Migration: 20251018000006
-- Date: 2025-10-18
-- Purpose: Add 3D models for corner-cabinet, dishwasher, and refrigerator
-- Session: feature/database-component-cleanup
-- =============================================================================

-- Background:
-- After orphaned 3D model cleanup, found 5 components missing 3D models:
--   1. corner-cabinet - CRITICAL (broken after l-shaped-test-cabinet deletion)
--   2. counter-top-horizontal - SKIP (procedurally generated in EnhancedCounterTop3D)
--   3. counter-top-vertical - SKIP (procedurally generated in EnhancedCounterTop3D)
--   4. dishwasher - FIX (clone dishwasher-60 model)
--   5. refrigerator - FIX (create standard model)

-- =============================================================================
-- STEP 1: Verify current state
-- =============================================================================

DO $$
DECLARE
  missing_count INTEGER;
  corner_exists BOOLEAN;
  dishwasher_exists BOOLEAN;
  refrigerator_exists BOOLEAN;
BEGIN
  -- Count components missing 3D models
  SELECT COUNT(*) INTO missing_count
  FROM components c
  WHERE NOT EXISTS (
    SELECT 1 FROM component_3d_models cm WHERE cm.component_id = c.component_id
  );

  -- Check specific components
  SELECT EXISTS (SELECT 1 FROM component_3d_models WHERE component_id = 'corner-cabinet') INTO corner_exists;
  SELECT EXISTS (SELECT 1 FROM component_3d_models WHERE component_id = 'dishwasher') INTO dishwasher_exists;
  SELECT EXISTS (SELECT 1 FROM component_3d_models WHERE component_id = 'refrigerator') INTO refrigerator_exists;

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'PRE-MIGRATION STATUS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Components missing 3D models: %', missing_count;
  RAISE NOTICE 'corner-cabinet has 3D model: %', corner_exists;
  RAISE NOTICE 'dishwasher has 3D model: %', dishwasher_exists;
  RAISE NOTICE 'refrigerator has 3D model: %', refrigerator_exists;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 2: Create 3D model for corner-cabinet (L-shaped corner base cabinet)
-- =============================================================================

-- Insert L-shaped corner base cabinet 3D model
-- Based on existing corner patterns: kitchen-sink-corner-90, new-corner-wall-cabinet-90
INSERT INTO component_3d_models (
  component_id,
  component_name,
  component_type,
  category,
  geometry_type,
  is_corner_component,
  leg_length,
  corner_depth_wall,
  corner_depth_base,
  rotation_center_x,
  rotation_center_y,
  rotation_center_z,
  has_direction,
  auto_rotate_enabled,
  wall_rotation_left,
  wall_rotation_right,
  wall_rotation_top,
  wall_rotation_bottom,
  corner_rotation_front_left,
  corner_rotation_front_right,
  corner_rotation_back_left,
  corner_rotation_back_right,
  default_width,
  default_height,
  default_depth,
  description,
  layer_type,
  min_height_cm,
  max_height_cm,
  can_overlap_layers
)
VALUES (
  'corner-cabinet',
  'Corner Base Cabinet',
  'cabinet',
  'base-cabinets',
  'l_shaped_corner',  -- L-shaped corner geometry
  true,  -- is_corner_component
  0.9000,  -- leg_length: 90cm legs
  0.6000,  -- corner_depth_wall: 60cm wall depth
  0.6000,  -- corner_depth_base: 60cm base depth
  'legLength/2',  -- rotation_center_x: center of L-shape
  0,  -- rotation_center_y: ground level
  'legLength/2',  -- rotation_center_z: center of L-shape
  true,  -- has_direction: front vs back matters
  true,  -- auto_rotate_enabled: auto-rotate when placed
  90,  -- wall_rotation_left: rotate 90° for left wall
  270,  -- wall_rotation_right: rotate 270° for right wall
  0,  -- wall_rotation_top: rotate 0° for top wall
  180,  -- wall_rotation_bottom: rotate 180° for bottom wall
  0,  -- corner_rotation_front_left: 0° for front-left corner
  270,  -- corner_rotation_front_right: 270° for front-right corner
  90,  -- corner_rotation_back_left: 90° for back-left corner
  180,  -- corner_rotation_back_right: 180° for back-right corner
  0.9000,  -- default_width: 90cm
  0.9000,  -- default_height: 90cm (base cabinet height)
  0.9000,  -- default_depth: 90cm
  'L-shaped corner base cabinet with lazy susan - 90cm legs',
  'base',  -- layer_type: base layer
  0.00,  -- min_height_cm: sits on floor
  85.00,  -- max_height_cm: 85cm max (base cabinet)
  ARRAY['flooring']::text[]  -- can_overlap_layers: only flooring
)
ON CONFLICT (component_id) DO NOTHING;

-- =============================================================================
-- STEP 3: Create 3D model for dishwasher (clone dishwasher-60)
-- =============================================================================

-- Clone dishwasher-60 3D model with dishwasher dimensions
INSERT INTO component_3d_models (
  component_id,
  component_name,
  component_type,
  category,
  geometry_type,
  is_corner_component,
  has_direction,
  auto_rotate_enabled,
  wall_rotation_left,
  wall_rotation_right,
  wall_rotation_top,
  wall_rotation_bottom,
  default_width,
  default_height,
  default_depth,
  description,
  layer_type,
  min_height_cm,
  max_height_cm,
  can_overlap_layers
)
SELECT
  'dishwasher',  -- new component_id
  'Dishwasher',  -- new component_name
  component_type,
  category,
  geometry_type,
  is_corner_component,
  has_direction,
  auto_rotate_enabled,
  wall_rotation_left,
  wall_rotation_right,
  wall_rotation_top,
  wall_rotation_bottom,
  0.6000,  -- dishwasher dimensions: 60cm width
  0.8200,  -- 82cm height
  0.5800,  -- 58cm depth
  'Built-in dishwasher (standard)',
  layer_type,
  min_height_cm,
  max_height_cm,
  can_overlap_layers
FROM component_3d_models
WHERE component_id = 'dishwasher-60'
ON CONFLICT (component_id) DO NOTHING;

-- =============================================================================
-- STEP 4: Create 3D model for refrigerator (standard appliance)
-- =============================================================================

-- Create standard refrigerator 3D model
INSERT INTO component_3d_models (
  component_id,
  component_name,
  component_type,
  category,
  geometry_type,
  is_corner_component,
  has_direction,
  auto_rotate_enabled,
  wall_rotation_left,
  wall_rotation_right,
  wall_rotation_top,
  wall_rotation_bottom,
  default_width,
  default_height,
  default_depth,
  description,
  layer_type,
  min_height_cm,
  max_height_cm,
  can_overlap_layers
)
VALUES (
  'refrigerator',
  'Refrigerator',
  'appliance',
  'appliances',
  'standard',  -- standard box geometry
  false,  -- not a corner component
  true,  -- has_direction: front panel different
  true,  -- auto_rotate_enabled: auto-rotate when placed
  90,  -- wall_rotation_left: rotate 90° for left wall
  270,  -- wall_rotation_right: rotate 270° for right wall
  0,  -- wall_rotation_top: rotate 0° for top wall
  180,  -- wall_rotation_bottom: rotate 180° for bottom wall
  0.6000,  -- default_width: 60cm
  1.8000,  -- default_height: 180cm (full height fridge)
  0.6000,  -- default_depth: 60cm
  'Standard refrigerator - 60cm wide, 180cm tall',
  'appliance',  -- layer_type: appliance layer
  0.00,  -- min_height_cm: sits on floor
  180.00,  -- max_height_cm: 180cm max height
  ARRAY['flooring']::text[]  -- can_overlap_layers: only flooring
)
ON CONFLICT (component_id) DO NOTHING;

-- =============================================================================
-- STEP 5: Verify migration results
-- =============================================================================

DO $$
DECLARE
  missing_count_after INTEGER;
  corner_exists_after BOOLEAN;
  dishwasher_exists_after BOOLEAN;
  refrigerator_exists_after BOOLEAN;
  components_count INTEGER;
  models_count INTEGER;
BEGIN
  -- Count components missing 3D models after migration
  SELECT COUNT(*) INTO missing_count_after
  FROM components c
  WHERE NOT EXISTS (
    SELECT 1 FROM component_3d_models cm WHERE cm.component_id = c.component_id
  );

  -- Check specific components
  SELECT EXISTS (SELECT 1 FROM component_3d_models WHERE component_id = 'corner-cabinet') INTO corner_exists_after;
  SELECT EXISTS (SELECT 1 FROM component_3d_models WHERE component_id = 'dishwasher') INTO dishwasher_exists_after;
  SELECT EXISTS (SELECT 1 FROM component_3d_models WHERE component_id = 'refrigerator') INTO refrigerator_exists_after;

  -- Get total counts
  SELECT COUNT(*) INTO components_count FROM components;
  SELECT COUNT(*) INTO models_count FROM component_3d_models;

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'POST-MIGRATION STATUS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Total components: %', components_count;
  RAISE NOTICE 'Total component_3d_models: %', models_count;
  RAISE NOTICE 'Components missing 3D models: % (should be 2 for countertops)', missing_count_after;
  RAISE NOTICE '';
  RAISE NOTICE 'corner-cabinet has 3D model: % (should be TRUE)', corner_exists_after;
  RAISE NOTICE 'dishwasher has 3D model: % (should be TRUE)', dishwasher_exists_after;
  RAISE NOTICE 'refrigerator has 3D model: % (should be TRUE)', refrigerator_exists_after;
  RAISE NOTICE '';

  IF corner_exists_after AND dishwasher_exists_after AND refrigerator_exists_after THEN
    RAISE NOTICE '✅ SUCCESS: All 3 critical components now have 3D models!';

    IF missing_count_after = 2 THEN
      RAISE NOTICE '✅ EXPECTED: 2 components still missing 3D models (counter-top-horizontal, counter-top-vertical)';
      RAISE NOTICE '   These are procedurally generated in EnhancedCounterTop3D component.';
    ELSE
      RAISE WARNING 'UNEXPECTED: % components missing 3D models (expected 2)', missing_count_after;
    END IF;

    IF models_count = components_count - 2 THEN
      RAISE NOTICE '✅ PERFECT: component_3d_models (%:%) matches expected ratio!', models_count, components_count;
    END IF;
  ELSE
    RAISE WARNING 'INCOMPLETE: Not all components have 3D models!';
  END IF;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 6: List remaining components without 3D models (should only be countertops)
-- =============================================================================

SELECT
  c.component_id,
  c.name,
  c.type,
  CASE
    WHEN c.type = 'counter-top' THEN '✅ EXPECTED (Procedural)'
    ELSE '❌ UNEXPECTED'
  END as status,
  CASE
    WHEN c.type = 'counter-top' THEN 'Procedurally generated in EnhancedCounterTop3D'
    ELSE 'Should have 3D model!'
  END as note
FROM components c
WHERE NOT EXISTS (
  SELECT 1
  FROM component_3d_models cm
  WHERE cm.component_id = c.component_id
)
ORDER BY status, c.component_id;

-- =============================================================================
-- NOTES
-- =============================================================================

-- This migration adds 3D models for:
--   1. corner-cabinet - L-shaped corner base cabinet (CRITICAL)
--   2. dishwasher - Standard dishwasher (cloned from dishwasher-60)
--   3. refrigerator - Standard refrigerator
--
-- Countertops are intentionally left without 3D models:
--   - counter-top-horizontal (300×60×4cm)
--   - counter-top-vertical (60×300×4cm)
--   - These are procedurally generated as simple boxes in:
--     src/components/designer/EnhancedModels3D.tsx (lines 1619-1642)
--     using <boxGeometry args={[width, height, depth]} />
--
-- Expected state after migration:
--   - components: 192
--   - component_3d_models: 190 (192 - 2 procedural countertops)
--   - Missing 3D models: 2 (both countertops - expected)
--
-- Corner cabinet geometry_type: 'l_shaped_corner'
--   - Renders as L-shaped corner unit
--   - leg_length: 90cm (size of each leg)
--   - corner_depth_wall: 60cm (depth against wall)
--   - corner_depth_base: 60cm (depth of base)
--   - rotation_center at center of L-shape
--   - Supports all 4 corner rotations
