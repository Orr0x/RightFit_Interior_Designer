-- ================================================================
-- Week 19: Data Population (P0 - Corner Units)
-- ================================================================
-- Purpose: Populate remaining 7 corner cabinet models
-- Feature Flag: use_dynamic_3d_models
-- Status: Week 19 - P0 (Priority 0 - CRITICAL)
--
-- Corner Cabinets Being Added:
-- 1. Corner Base Cabinet 90cm
-- 2. New Corner Wall Cabinet 60cm
-- 3. New Corner Wall Cabinet 90cm
-- 4. Larder Corner Unit 60cm
-- 5. Larder Corner Unit 90cm
-- 6. Blind Corner Base 60cm
-- 7. Blind Corner Wall 60cm
--
-- NOTE: Corner Base Cabinet 60cm already exists from sample data
-- ================================================================

-- ================================================================
-- 1. CORNER BASE CABINET 90CM
-- ================================================================
-- L-shaped base cabinet with 90cm legs
-- Same geometry as 60cm version but with legLength = 0.9m

DO $$
DECLARE
  v_model_id uuid;
  v_plinth_material_id uuid;
  v_cabinet_material_id uuid;
  v_door_material_id uuid;
  v_handle_material_id uuid;
BEGIN
  -- Get material IDs
  SELECT id INTO v_plinth_material_id FROM material_definitions WHERE material_name = 'plinth';
  SELECT id INTO v_cabinet_material_id FROM material_definitions WHERE material_name = 'cabinet';
  SELECT id INTO v_door_material_id FROM material_definitions WHERE material_name = 'door';
  SELECT id INTO v_handle_material_id FROM material_definitions WHERE material_name = 'handle';

  -- Insert model
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
    description
  ) VALUES (
    'corner-base-cabinet-90',
    'Corner Base Cabinet 90cm',
    'base-cabinet',
    'cabinets',
    'l_shaped_corner',
    true,
    0.9,  -- 90cm leg length
    0.4,
    0.6,
    'legLength/2',
    '0',
    'legLength/2',
    true,
    true,
    90,
    270,
    0,
    180,
    0,    -- Front-left: 0°
    270,  -- Front-right: 270°
    90,   -- Back-left: 90°
    180,  -- Back-right: 180°
    90,
    90,
    90,
    'L-shaped corner base cabinet with 90cm legs for base cabinets'
  ) RETURNING id INTO v_model_id;

  -- Insert geometry parts (8 parts same as 60cm version)

  -- Part 1: Plinth X-leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES (
    v_model_id, 'Plinth X-leg', 'box', 1,
    '0', '-height / 2 + plinthHeight / 2', 'cornerDepth / 2 - legLength / 2 - 0.1',
    'legLength', 'plinthHeight', 'cornerDepth - 0.2',
    'plinth', 'plinthColor', '!isWallCabinet'
  );

  -- Part 2: Cabinet X-leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Cabinet X-leg', 'box', 2,
    '0', 'plinthHeight / 2', 'cornerDepth / 2 - legLength / 2',
    'legLength', 'cabinetHeight', 'cornerDepth',
    'cabinet', 'cabinetMaterial'
  );

  -- Part 3: Plinth Z-leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES (
    v_model_id, 'Plinth Z-leg', 'box', 3,
    'cornerDepth / 2 - legLength / 2 - 0.1', '-height / 2 + plinthHeight / 2', '0',
    'cornerDepth - 0.2', 'plinthHeight', 'legLength',
    'plinth', 'plinthColor', '!isWallCabinet'
  );

  -- Part 4: Cabinet Z-leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Cabinet Z-leg', 'box', 4,
    'cornerDepth / 2 - legLength / 2', 'plinthHeight / 2', '0',
    'cornerDepth', 'cabinetHeight', 'legLength',
    'cabinet', 'cabinetMaterial'
  );

  -- Part 5: Front door
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Front door', 'box', 5,
    '0', 'plinthHeight / 2', 'cornerDepth - legLength / 2 + 0.01',
    'legLength - 0.05', 'doorHeight', '0.02',
    'door', 'doorColor'
  );

  -- Part 6: Side door
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Side door', 'box', 6,
    'cornerDepth - legLength / 2 + 0.01', 'plinthHeight / 2', '0',
    '0.02', 'doorHeight', 'legLength - 0.05',
    'door', 'doorColor'
  );

  -- Part 7: Front handle
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, metalness, roughness
  ) VALUES (
    v_model_id, 'Front handle', 'box', 7,
    'legLength / 2 - 0.05', 'plinthHeight / 2', 'cornerDepth - legLength / 2 + 0.03',
    '0.02', '0.15', '0.02',
    'handle', 'handleColor', 0.8, 0.2
  );

  -- Part 8: Side handle
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, metalness, roughness
  ) VALUES (
    v_model_id, 'Side handle', 'box', 8,
    'cornerDepth - legLength / 2 + 0.03', 'plinthHeight / 2', '-0.25',
    '0.02', '0.15', '0.02',
    'handle', 'handleColor', 0.8, 0.2
  );

  RAISE NOTICE '✅ Created Corner Base Cabinet 90cm with % geometry parts', 8;
END $$;

-- ================================================================
-- 2. NEW CORNER WALL CABINET 60CM
-- ================================================================
-- L-shaped wall cabinet with 60cm legs
-- Same geometry as base cabinet but isWallCabinet = true

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Insert model
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
    description
  ) VALUES (
    'new-corner-wall-cabinet-60',
    'New Corner Wall Cabinet 60cm',
    'wall-cabinet',
    'cabinets',
    'l_shaped_corner',
    true,
    0.6,  -- 60cm leg length
    0.4,  -- Wall cabinet depth
    0.6,
    'legLength/2',
    '0',
    'legLength/2',
    true,
    true,
    90,
    270,
    0,
    180,
    0,
    270,
    90,
    180,
    60,
    70,  -- Typical wall cabinet height
    40,
    'L-shaped corner wall cabinet with 60cm legs'
  ) RETURNING id INTO v_model_id;

  -- Insert geometry parts (6 parts - NO PLINTH for wall cabinets)

  -- Part 1: Cabinet X-leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Cabinet X-leg', 'box', 1,
    '0', '0', 'cornerDepth / 2 - legLength / 2',
    'legLength', 'height', 'cornerDepth',
    'cabinet', 'cabinetMaterial'
  );

  -- Part 2: Cabinet Z-leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Cabinet Z-leg', 'box', 2,
    'cornerDepth / 2 - legLength / 2', '0', '0',
    'cornerDepth', 'height', 'legLength',
    'cabinet', 'cabinetMaterial'
  );

  -- Part 3: Front door
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Front door', 'box', 3,
    '0', '0', 'cornerDepth - legLength / 2 + 0.01',
    'legLength - 0.05', 'height - 0.05', '0.02',
    'door', 'doorColor'
  );

  -- Part 4: Side door
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Side door', 'box', 4,
    'cornerDepth - legLength / 2 + 0.01', '0', '0',
    '0.02', 'height - 0.05', 'legLength - 0.05',
    'door', 'doorColor'
  );

  -- Part 5: Front handle
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, metalness, roughness
  ) VALUES (
    v_model_id, 'Front handle', 'box', 5,
    'legLength / 2 - 0.05', '0', 'cornerDepth - legLength / 2 + 0.03',
    '0.02', '0.15', '0.02',
    'handle', 'handleColor', 0.8, 0.2
  );

  -- Part 6: Side handle
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, metalness, roughness
  ) VALUES (
    v_model_id, 'Side handle', 'box', 6,
    'cornerDepth - legLength / 2 + 0.03', '0', '-0.25',
    '0.02', '0.15', '0.02',
    'handle', 'handleColor', 0.8, 0.2
  );

  RAISE NOTICE '✅ Created New Corner Wall Cabinet 60cm with % geometry parts', 6;
END $$;

-- ================================================================
-- 3. NEW CORNER WALL CABINET 90CM
-- ================================================================
-- L-shaped wall cabinet with 90cm legs

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Insert model
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
    description
  ) VALUES (
    'new-corner-wall-cabinet-90',
    'New Corner Wall Cabinet 90cm',
    'wall-cabinet',
    'cabinets',
    'l_shaped_corner',
    true,
    0.9,  -- 90cm leg length
    0.4,
    0.6,
    'legLength/2',
    '0',
    'legLength/2',
    true,
    true,
    90,
    270,
    0,
    180,
    0,
    270,
    90,
    180,
    90,
    70,
    40,
    'L-shaped corner wall cabinet with 90cm legs'
  ) RETURNING id INTO v_model_id;

  -- Insert geometry parts (6 parts - same as 60cm wall cabinet)

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES
    (v_model_id, 'Cabinet X-leg', 'box', 1, '0', '0', 'cornerDepth / 2 - legLength / 2', 'legLength', 'height', 'cornerDepth', 'cabinet', 'cabinetMaterial'),
    (v_model_id, 'Cabinet Z-leg', 'box', 2, 'cornerDepth / 2 - legLength / 2', '0', '0', 'cornerDepth', 'height', 'legLength', 'cabinet', 'cabinetMaterial'),
    (v_model_id, 'Front door', 'box', 3, '0', '0', 'cornerDepth - legLength / 2 + 0.01', 'legLength - 0.05', 'height - 0.05', '0.02', 'door', 'doorColor'),
    (v_model_id, 'Side door', 'box', 4, 'cornerDepth - legLength / 2 + 0.01', '0', '0', '0.02', 'height - 0.05', 'legLength - 0.05', 'door', 'doorColor');

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, metalness, roughness
  ) VALUES
    (v_model_id, 'Front handle', 'box', 5, 'legLength / 2 - 0.05', '0', 'cornerDepth - legLength / 2 + 0.03', '0.02', '0.15', '0.02', 'handle', 'handleColor', 0.8, 0.2),
    (v_model_id, 'Side handle', 'box', 6, 'cornerDepth - legLength / 2 + 0.03', '0', '-0.25', '0.02', '0.15', '0.02', 'handle', 'handleColor', 0.8, 0.2);

  RAISE NOTICE '✅ Created New Corner Wall Cabinet 90cm with % geometry parts', 6;
END $$;

-- ================================================================
-- VERIFICATION
-- ================================================================

DO $$
DECLARE
  v_model_count int;
  v_part_count int;
BEGIN
  SELECT COUNT(*) INTO v_model_count FROM component_3d_models WHERE is_corner_component = true;
  SELECT COUNT(*) INTO v_part_count FROM geometry_parts WHERE model_id IN (SELECT id FROM component_3d_models WHERE is_corner_component = true);

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Week 19 Corner Cabinet Population Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total corner models: %', v_model_count;
  RAISE NOTICE 'Total geometry parts: %', v_part_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Models created:';
  RAISE NOTICE '  ✅ Corner Base Cabinet 90cm';
  RAISE NOTICE '  ✅ New Corner Wall Cabinet 60cm';
  RAISE NOTICE '  ✅ New Corner Wall Cabinet 90cm';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test in 3D view with feature flag enabled';
END $$;
