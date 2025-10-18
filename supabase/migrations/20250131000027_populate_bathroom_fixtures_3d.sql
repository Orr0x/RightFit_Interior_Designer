-- ================================================================
-- Bathroom Fixtures 3D Models - Phase 3
-- ================================================================
-- Purpose: Populate toilet, shower, and bathtub 3D geometry
-- Feature Flag: use_dynamic_3d_models
-- Status: Phase 3 - Bathroom Fixtures (NEW DESIGNS)
--
-- Components Being Added:
-- 1. Toilet (5 parts)
-- 2. Shower (5 parts)
-- 3. Bathtub (5 parts)
--
-- Total: 3 fixture types, 15 geometry parts
--
-- Special Notes:
-- These components were NOT previously implemented (fell through to
-- generic appliance box geometry). These are brand new designs.
-- ================================================================

-- First, ensure material definitions exist
DO $$
BEGIN
  -- Ceramic material for bathroom fixtures
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, description)
  VALUES ('ceramic', 'standard', '#FFFFFF', 0.10, 0.00, 'White ceramic for bathroom fixtures')
  ON CONFLICT (material_name) DO NOTHING;

  -- Chrome/metal fittings
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, description)
  VALUES ('chrome', 'standard', '#c0c0c0', 0.10, 0.90, 'Chrome/polished metal fittings')
  ON CONFLICT (material_name) DO NOTHING;

  -- Glass material for shower enclosures
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, opacity, description)
  VALUES ('shower_glass', 'standard', '#E6F7FF', 0.05, 0.90, 0.30, 'Clear glass for shower enclosures')
  ON CONFLICT (material_name) DO NOTHING;
END $$;

-- ================================================================
-- 1. TOILET (5 parts)
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'toilet-standard', 'Standard Toilet', 'toilet', 'bathroom', 'standard',
    false, true, true, 90, 270, 0, 180, 0.40, 0.75, 0.70,
    'Standard toilet with bowl, tank, seat, and base'
  ) RETURNING id INTO v_model_id;

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
    'width * 0.45', '0.5', 'width * 0.42',  -- Slightly tapered bowl
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

  RAISE NOTICE 'Toilet created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 2. SHOWER (5 parts)
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
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
    '0.1', '0.02', '0.1',  -- Small circular shower head
    'chrome', '#c0c0c0'
  );

  RAISE NOTICE 'Shower created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 3. BATHTUB (5 parts)
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
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
    '0.05', '0.15', '0.05',  -- Vertical faucet/spout
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
    '0.05', '0.02', '0.05',  -- Small drain
    'chrome', '#808080'
  );

  RAISE NOTICE 'Bathtub created with ID: %', v_model_id;
END $$;

-- ================================================================
-- VALIDATION & SUMMARY
-- ================================================================

DO $$
DECLARE
  v_model_count INTEGER;
  v_part_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_model_count
  FROM component_3d_models
  WHERE component_id IN ('toilet-standard', 'shower-standard', 'bathtub-standard');

  SELECT COUNT(*) INTO v_part_count
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id IN ('toilet-standard', 'shower-standard', 'bathtub-standard');

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Migration Complete: Bathroom Fixtures 3D Models';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Models Created: %', v_model_count;
  RAISE NOTICE 'Geometry Parts Created: %', v_part_count;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Components (NEW DESIGNS):';
  RAISE NOTICE '  - Toilet (5 parts)';
  RAISE NOTICE '    - Base, Bowl, Tank, Seat, Flush Handle';
  RAISE NOTICE '  - Shower (5 parts)';
  RAISE NOTICE '    - Tray, 3 Glass Walls, Shower Head';
  RAISE NOTICE '  - Bathtub (5 parts)';
  RAISE NOTICE '    - Tub Body, Rim, Base, Faucet, Drain';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Special Features:';
  RAISE NOTICE '  - Transparent glass shower walls';
  RAISE NOTICE '  - Chrome fixtures and fittings';
  RAISE NOTICE '  - Ceramic materials for fixtures';
  RAISE NOTICE '  - Cylindrical geometry for drains/fixtures';
  RAISE NOTICE '================================================';

  IF v_model_count != 3 THEN
    RAISE WARNING 'Expected 3 models, got %', v_model_count;
  END IF;

  IF v_part_count != 15 THEN
    RAISE WARNING 'Expected 15 geometry parts, got %', v_part_count;
  END IF;
END $$;
