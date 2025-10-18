-- ================================================================
-- Fix Bathroom Fixtures - Missing Components
-- ================================================================
-- Purpose: Add missing shower and bathtub, fix toilet geometry
-- Issue: Previous migration may have had errors or incomplete application
-- ================================================================

-- Check and fix toilet - should have 5 parts, currently has 2
DO $$
DECLARE
  v_model_id uuid;
  v_part_count integer;
BEGIN
  -- Get toilet model ID
  SELECT id INTO v_model_id FROM component_3d_models WHERE component_id = 'toilet-standard';

  IF v_model_id IS NOT NULL THEN
    -- Check current part count
    SELECT COUNT(*) INTO v_part_count FROM geometry_parts WHERE model_id = v_model_id;
    RAISE NOTICE 'Toilet currently has % parts', v_part_count;

    -- Delete existing parts to start fresh
    DELETE FROM geometry_parts WHERE model_id = v_model_id;
    RAISE NOTICE 'Deleted existing toilet parts';

    -- Re-insert all 5 parts correctly

    -- Part 1: Base/Pedestal
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Base', 'box', 1,
      '0', '-height / 2 + 0.15', '0',
      'width', '0.3', 'depth',
      'ceramic', '#FFFFFF'
    );

    -- Part 2: Bowl (main toilet bowl)
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Bowl', 'cylinder', 2,
      '0', '-height / 2 + 0.4', 'depth * 0.15',
      'width * 0.45', '0.5', 'width * 0.42',
      'ceramic', '#FFFFFF'
    );

    -- Part 3: Tank (water tank behind bowl)
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Tank', 'box', 3,
      '0', 'height * 0.1', '-depth / 2 + 0.15',
      'width - 0.05', 'height * 0.6', '0.25',
      'ceramic', '#FFFFFF'
    );

    -- Part 4: Seat (toilet seat on top of bowl)
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Seat', 'box', 4,
      '0', '-height / 2 + 0.65', 'depth * 0.15',
      'width * 0.5', '0.02', 'depth * 0.5',
      'handle', '#FFFFFF'
    );

    -- Part 5: Flush Handle
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Flush Handle', 'box', 5,
      '-width / 2 + 0.05', 'height * 0.15', '-depth / 2 + 0.15',
      '0.08', '0.04', '0.02',
      'chrome', '#c0c0c0'
    );

    RAISE NOTICE 'Toilet parts fixed - now has 5 parts';
  ELSE
    RAISE NOTICE 'Toilet model not found - will create new';
  END IF;
END $$;

-- ================================================================
-- Add SHOWER if missing
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Check if shower exists
  SELECT id INTO v_model_id FROM component_3d_models WHERE component_id = 'shower-standard';

  IF v_model_id IS NULL THEN
    RAISE NOTICE 'Shower not found - creating new';

    -- Create shower model
    INSERT INTO component_3d_models (
      component_id, component_name, component_type, category, geometry_type,
      is_corner_component, has_direction, auto_rotate_enabled,
      wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
      default_width, default_height, default_depth, description
    ) VALUES (
      'shower-standard', 'Standard Shower', 'shower', 'bathroom', 'standard',
      false, true, true, 90, 270, 0, 180, 0.90, 2.00, 0.90,
      'Standard shower enclosure with tray, glass walls, and fixtures'
    ) RETURNING id INTO v_model_id;

    -- Part 1: Shower Tray (base)
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Shower Tray', 'box', 1,
      '0', '-height / 2 + 0.05', '0',
      'width', '0.1', 'depth',
      'ceramic', '#F5F5F5'
    );

    -- Part 2: Left Glass Wall
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override, opacity
    ) VALUES (
      v_model_id, 'Left Wall', 'box', 2,
      '-width / 2 + 0.02', '0', '0',
      '0.01', 'height - 0.2', 'depth - 0.1',
      'shower_glass', '#E6F7FF', 0.3
    );

    -- Part 3: Right Glass Wall
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override, opacity
    ) VALUES (
      v_model_id, 'Right Wall', 'box', 3,
      'width / 2 - 0.02', '0', '0',
      '0.01', 'height - 0.2', 'depth - 0.1',
      'shower_glass', '#E6F7FF', 0.3
    );

    -- Part 4: Back Glass Wall
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override, opacity
    ) VALUES (
      v_model_id, 'Back Wall', 'box', 4,
      '0', '0', '-depth / 2 + 0.02',
      'width - 0.1', 'height - 0.2', '0.01',
      'shower_glass', '#E6F7FF', 0.3
    );

    -- Part 5: Shower Head
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Shower Head', 'cylinder', 5,
      '-width / 3', 'height / 2 - 0.3', '-depth / 2 + 0.15',
      '0.1', '0.02', '0.1',
      'chrome', '#c0c0c0'
    );

    RAISE NOTICE 'Shower created with ID: %', v_model_id;
  ELSE
    RAISE NOTICE 'Shower already exists with ID: %', v_model_id;
  END IF;
END $$;

-- ================================================================
-- Add BATHTUB if missing
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Check if bathtub exists
  SELECT id INTO v_model_id FROM component_3d_models WHERE component_id = 'bathtub-standard';

  IF v_model_id IS NULL THEN
    RAISE NOTICE 'Bathtub not found - creating new';

    -- Create bathtub model
    INSERT INTO component_3d_models (
      component_id, component_name, component_type, category, geometry_type,
      is_corner_component, has_direction, auto_rotate_enabled,
      wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
      default_width, default_height, default_depth, description
    ) VALUES (
      'bathtub-standard', 'Standard Bathtub', 'bathtub', 'bathroom', 'standard',
      false, true, true, 90, 270, 0, 180, 1.70, 0.60, 0.80,
      'Standard bathtub with tub body, rim, faucet, and drain'
    ) RETURNING id INTO v_model_id;

    -- Part 1: Tub Body (main bathtub)
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Tub Body', 'box', 1,
      '0', '-height / 2 + 0.25', '0',
      'width - 0.1', '0.5', 'depth - 0.1',
      'ceramic', '#FFFFFF'
    );

    -- Part 2: Tub Rim (surrounding edge)
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Rim', 'box', 2,
      '0', '0', '0',
      'width', '0.05', 'depth',
      'ceramic', '#F8F8F8'
    );

    -- Part 3: Tub Base/Feet
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Base', 'box', 3,
      '0', '-height / 2 + 0.05', '0',
      'width', '0.1', 'depth',
      'ceramic', '#FFFFFF'
    );

    -- Part 4: Faucet (spout)
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Faucet', 'cylinder', 4,
      '-width / 3', 'height / 2 - 0.15', '-depth / 2 + 0.1',
      '0.05', '0.15', '0.05',
      'chrome', '#c0c0c0'
    );

    -- Part 5: Drain (bottom of tub)
    INSERT INTO geometry_parts (
      model_id, part_name, part_type, render_order,
      position_x, position_y, position_z,
      dimension_width, dimension_height, dimension_depth,
      material_name, color_override
    ) VALUES (
      v_model_id, 'Drain', 'cylinder', 5,
      'width / 3', '-height / 2 + 0.25', 'depth / 4',
      '0.05', '0.02', '0.05',
      'chrome', '#808080'
    );

    RAISE NOTICE 'Bathtub created with ID: %', v_model_id;
  ELSE
    RAISE NOTICE 'Bathtub already exists with ID: %', v_model_id;
  END IF;
END $$;

-- ================================================================
-- VALIDATION & SUMMARY
-- ================================================================

DO $$
DECLARE
  v_model_count INTEGER;
  v_part_count INTEGER;
  v_toilet_parts INTEGER;
  v_shower_parts INTEGER;
  v_bathtub_parts INTEGER;
BEGIN
  -- Count all bathroom fixture models
  SELECT COUNT(*) INTO v_model_count
  FROM component_3d_models
  WHERE component_id IN ('toilet-standard', 'shower-standard', 'bathtub-standard');

  -- Count total parts
  SELECT COUNT(*) INTO v_part_count
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id IN ('toilet-standard', 'shower-standard', 'bathtub-standard');

  -- Count individual component parts
  SELECT COUNT(*) INTO v_toilet_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id = 'toilet-standard';

  SELECT COUNT(*) INTO v_shower_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id = 'shower-standard';

  SELECT COUNT(*) INTO v_bathtub_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id = 'bathtub-standard';

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Bathroom Fixtures - Fix Complete';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Models Present: %', v_model_count;
  RAISE NOTICE 'Total Geometry Parts: %', v_part_count;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Component Breakdown:';
  RAISE NOTICE '  - Toilet: % parts (expected 5)', v_toilet_parts;
  RAISE NOTICE '  - Shower: % parts (expected 5)', v_shower_parts;
  RAISE NOTICE '  - Bathtub: % parts (expected 5)', v_bathtub_parts;
  RAISE NOTICE '================================================';

  IF v_model_count != 3 THEN
    RAISE WARNING 'Expected 3 models, got %', v_model_count;
  END IF;

  IF v_part_count != 15 THEN
    RAISE WARNING 'Expected 15 geometry parts, got %', v_part_count;
  END IF;

  IF v_toilet_parts != 5 THEN
    RAISE WARNING 'Toilet should have 5 parts, got %', v_toilet_parts;
  END IF;

  IF v_shower_parts != 5 THEN
    RAISE WARNING 'Shower should have 5 parts, got %', v_shower_parts;
  END IF;

  IF v_bathtub_parts != 5 THEN
    RAISE WARNING 'Bathtub should have 5 parts, got %', v_bathtub_parts;
  END IF;
END $$;
