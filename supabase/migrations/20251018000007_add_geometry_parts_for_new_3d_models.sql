-- =============================================================================
-- ADD GEOMETRY PARTS FOR NEW 3D MODELS
-- Migration: 20251018000007
-- Date: 2025-10-18
-- Purpose: Add geometry_parts for corner-cabinet, dishwasher, refrigerator
-- Session: feature/database-component-cleanup
-- Depends on: 20251018000006_add_missing_3d_models.sql
-- =============================================================================

-- Background:
-- Migration 20251018000006 created component_3d_models records for:
--   1. corner-cabinet (L-shaped corner base cabinet)
--   2. dishwasher (standard appliance)
--   3. refrigerator (standard appliance)
--
-- But it didn't create the geometry_parts that define the 3D shapes.
-- Console error: [Model3DLoader] No geometry parts found for model: {uuid}
--
-- This migration adds geometry_parts by cloning from similar existing components.

-- =============================================================================
-- STEP 1: Verify 3D models exist
-- =============================================================================

DO $$
DECLARE
  corner_model_id UUID;
  dishwasher_model_id UUID;
  refrigerator_model_id UUID;
BEGIN
  -- Get model IDs
  SELECT id INTO corner_model_id FROM component_3d_models WHERE component_id = 'corner-cabinet';
  SELECT id INTO dishwasher_model_id FROM component_3d_models WHERE component_id = 'dishwasher';
  SELECT id INTO refrigerator_model_id FROM component_3d_models WHERE component_id = 'refrigerator';

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'PRE-MIGRATION STATUS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'corner-cabinet model exists: %', corner_model_id IS NOT NULL;
  RAISE NOTICE 'dishwasher model exists: %', dishwasher_model_id IS NOT NULL;
  RAISE NOTICE 'refrigerator model exists: %', refrigerator_model_id IS NOT NULL;
  RAISE NOTICE '=============================================================================';

  IF corner_model_id IS NULL OR dishwasher_model_id IS NULL OR refrigerator_model_id IS NULL THEN
    RAISE EXCEPTION 'Missing 3D models! Run migration 20251018000006 first.';
  END IF;
END $$;

-- =============================================================================
-- STEP 2: Add geometry parts for corner-cabinet (L-shaped corner base)
-- =============================================================================

-- Clone geometry parts from kitchen-sink-corner-90 (similar L-shaped corner component)
-- kitchen-sink-corner-90 has: leg1, leg2, corner_connector parts

INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  width_formula,
  height_formula,
  depth_formula,
  position_x_formula,
  position_y_formula,
  position_z_formula,
  material_id,
  is_structural,
  render_order
)
SELECT
  (SELECT id FROM component_3d_models WHERE component_id = 'corner-cabinet'),  -- New model_id
  part_name,
  part_type,
  width_formula,
  height_formula,
  depth_formula,
  position_x_formula,
  position_y_formula,
  position_z_formula,
  material_id,
  is_structural,
  render_order
FROM geometry_parts
WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'kitchen-sink-corner-90')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 3: Add geometry parts for dishwasher (standard appliance)
-- =============================================================================

-- Clone geometry parts from dishwasher-60 (same appliance, different dimensions)
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  width_formula,
  height_formula,
  depth_formula,
  position_x_formula,
  position_y_formula,
  position_z_formula,
  material_id,
  is_structural,
  render_order
)
SELECT
  (SELECT id FROM component_3d_models WHERE component_id = 'dishwasher'),  -- New model_id
  part_name,
  part_type,
  width_formula,
  height_formula,
  depth_formula,
  position_x_formula,
  position_y_formula,
  position_z_formula,
  material_id,
  is_structural,
  render_order
FROM geometry_parts
WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'dishwasher-60')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 4: Add geometry parts for refrigerator (standard appliance)
-- =============================================================================

-- Create simple box geometry for refrigerator (similar to other appliances)
-- If dishwasher-60 has geometry, clone it; otherwise create basic parts

DO $$
DECLARE
  refrigerator_model_id UUID;
  dishwasher_parts_count INT;
BEGIN
  SELECT id INTO refrigerator_model_id FROM component_3d_models WHERE component_id = 'refrigerator';

  -- Check if dishwasher-60 has geometry parts
  SELECT COUNT(*) INTO dishwasher_parts_count
  FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'dishwasher-60');

  IF dishwasher_parts_count > 0 THEN
    -- Clone from dishwasher-60
    INSERT INTO geometry_parts (
      model_id,
      part_name,
      part_type,
      width_formula,
      height_formula,
      depth_formula,
      position_x_formula,
      position_y_formula,
      position_z_formula,
      material_id,
      is_structural,
      render_order
    )
    SELECT
      refrigerator_model_id,  -- New model_id
      REPLACE(part_name, 'dishwasher', 'refrigerator'),  -- Update part names
      part_type,
      width_formula,
      'height',  -- Use refrigerator's height (180cm)
      depth_formula,
      position_x_formula,
      position_y_formula,
      position_z_formula,
      material_id,
      is_structural,
      render_order
    FROM geometry_parts
    WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'dishwasher-60')
    ON CONFLICT DO NOTHING;
  ELSE
    -- Create basic box geometry if no template exists
    INSERT INTO geometry_parts (
      model_id,
      part_name,
      part_type,
      width_formula,
      height_formula,
      depth_formula,
      position_x_formula,
      position_y_formula,
      position_z_formula,
      is_structural,
      render_order
    )
    VALUES (
      refrigerator_model_id,
      'main_body',
      'box',
      'width',
      'height',
      'depth',
      '0',
      '0',
      '0',
      true,
      1
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- =============================================================================
-- STEP 5: Verify geometry parts were created
-- =============================================================================

DO $$
DECLARE
  corner_parts_count INT;
  dishwasher_parts_count INT;
  refrigerator_parts_count INT;
BEGIN
  -- Count geometry parts for each model
  SELECT COUNT(*) INTO corner_parts_count
  FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'corner-cabinet');

  SELECT COUNT(*) INTO dishwasher_parts_count
  FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'dishwasher');

  SELECT COUNT(*) INTO refrigerator_parts_count
  FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'refrigerator');

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'POST-MIGRATION STATUS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'corner-cabinet geometry parts: % (expected: 3-6)', corner_parts_count;
  RAISE NOTICE 'dishwasher geometry parts: % (expected: 1-4)', dishwasher_parts_count;
  RAISE NOTICE 'refrigerator geometry parts: % (expected: 1-4)', refrigerator_parts_count;
  RAISE NOTICE '';

  IF corner_parts_count > 0 AND dishwasher_parts_count > 0 AND refrigerator_parts_count > 0 THEN
    RAISE NOTICE '✅ SUCCESS: All 3 components now have geometry parts!';
    RAISE NOTICE '✅ corner-cabinet should render in 3D view';
    RAISE NOTICE '✅ dishwasher should render in 3D view';
    RAISE NOTICE '✅ refrigerator should render in 3D view';
  ELSE
    RAISE WARNING 'INCOMPLETE: Some components missing geometry parts!';
    IF corner_parts_count = 0 THEN
      RAISE WARNING '❌ corner-cabinet has no geometry parts';
    END IF;
    IF dishwasher_parts_count = 0 THEN
      RAISE WARNING '❌ dishwasher has no geometry parts';
    END IF;
    IF refrigerator_parts_count = 0 THEN
      RAISE WARNING '❌ refrigerator has no geometry parts';
    END IF;
  END IF;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 6: List geometry parts for verification
-- =============================================================================

SELECT
  cm.component_id,
  cm.component_name,
  COUNT(gp.id) as parts_count,
  STRING_AGG(gp.part_name, ', ' ORDER BY gp.render_order) as part_names,
  '✅ READY' as status
FROM component_3d_models cm
JOIN geometry_parts gp ON gp.model_id = cm.id
WHERE cm.component_id IN ('corner-cabinet', 'dishwasher', 'refrigerator')
GROUP BY cm.component_id, cm.component_name
ORDER BY cm.component_id;

-- =============================================================================
-- NOTES
-- =============================================================================

-- This migration adds geometry_parts for 3 components:
--
-- 1. corner-cabinet: Cloned from kitchen-sink-corner-90 (L-shaped corner)
--    - Expected parts: leg1, leg2, corner_connector (3-6 parts)
--    - Geometry type: l_shaped_corner
--
-- 2. dishwasher: Cloned from dishwasher-60
--    - Expected parts: main_body, door, etc. (1-4 parts)
--    - Geometry type: standard
--
-- 3. refrigerator: Cloned from dishwasher-60 or basic box
--    - Expected parts: main_body, door, etc. (1-4 parts)
--    - Geometry type: standard
--
-- After running this migration:
--   - No more console warnings: "No geometry parts found for model"
--   - corner-cabinet should render in 3D view
--   - dishwasher should render in 3D view
--   - refrigerator should render in 3D view
--
-- Cloning Strategy:
--   - Use existing similar components as templates
--   - kitchen-sink-corner-90 → corner-cabinet (both L-shaped corner)
--   - dishwasher-60 → dishwasher (same appliance type)
--   - dishwasher-60 → refrigerator (similar appliance, adjust height)
