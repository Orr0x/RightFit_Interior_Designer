-- ================================================================
-- Week 37: Data Population (Specialty Larder Appliances)
-- ================================================================
-- Purpose: Populate specialty larder built-in appliances
-- Components Being Added:
-- 1. Larder Built-in Fridge
-- 2. Larder Single Oven
-- 3. Larder Double Oven
-- 4. Larder Oven + Microwave Combo
-- 5. Larder Coffee Machine
--
-- Note: These are specialized tall larder units with integrated appliances
-- Height: 2.0m (full height), Width: 60cm standard
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- ============================================================
  -- Larder Built-in Fridge
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'larder-built-in-fridge', 'Larder Built-in Fridge', 'appliance', 'appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 2.00, 0.60,
    'Tall larder unit with integrated fridge'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + plinthHeight / 2', '0',
   'width', 'plinthHeight', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 2, '0', 'plinthHeight / 2', '0',
   'width', 'height - plinthHeight', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Fridge Door
  (v_model_id, 'Fridge Door', 'box', 3, '0', 'plinthHeight / 2', 'depth/2 + 0.01',
   'width - 0.02', 'height - plinthHeight - 0.02', '0.02', 'door', '#E0E0E0', null),
  -- Handle
  (v_model_id, 'Handle', 'box', 4, 'width/2 - 0.05', '0', 'depth/2 + 0.03',
   '0.10', '0.03', '0.05', 'handle', '#C0C0C0', null);

  -- ============================================================
  -- Larder Single Oven
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'larder-single-oven', 'Larder Single Oven', 'appliance', 'appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 2.00, 0.60,
    'Tall larder unit with integrated single oven'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + plinthHeight / 2', '0',
   'width', 'plinthHeight', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Upper Cabinet
  (v_model_id, 'Upper Cabinet', 'box', 2, '0', 'height * 0.25', '0',
   'width', 'height * 0.5', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Oven Housing
  (v_model_id, 'Oven Housing', 'box', 3, '0', '-height * 0.15', '0',
   'width', 'height * 0.35', 'depth', 'cabinet_body', '#2c2c2c', null),
  -- Oven Door
  (v_model_id, 'Oven Door', 'box', 4, '0', '-height * 0.15', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.3', '0.02', 'door', '#000000', null),
  -- Upper Door
  (v_model_id, 'Upper Door', 'box', 5, '0', 'height * 0.25', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.4', '0.02', 'door', 'doorColor', null);

  -- ============================================================
  -- Larder Double Oven
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'larder-double-oven', 'Larder Double Oven', 'appliance', 'appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 2.00, 0.60,
    'Tall larder unit with integrated double oven'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + plinthHeight / 2', '0',
   'width', 'plinthHeight', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Upper Cabinet
  (v_model_id, 'Upper Cabinet', 'box', 2, '0', 'height * 0.3', '0',
   'width', 'height * 0.4', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Upper Oven Housing
  (v_model_id, 'Upper Oven Housing', 'box', 3, '0', 'height * 0.05', '0',
   'width', 'height * 0.28', 'depth', 'cabinet_body', '#2c2c2c', null),
  -- Lower Oven Housing
  (v_model_id, 'Lower Oven Housing', 'box', 4, '0', '-height * 0.25', '0',
   'width', 'height * 0.28', 'depth', 'cabinet_body', '#2c2c2c', null),
  -- Upper Oven Door
  (v_model_id, 'Upper Oven Door', 'box', 5, '0', 'height * 0.05', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.25', '0.02', 'door', '#000000', null),
  -- Lower Oven Door
  (v_model_id, 'Lower Oven Door', 'box', 6, '0', '-height * 0.25', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.25', '0.02', 'door', '#000000', null),
  -- Upper Cabinet Door
  (v_model_id, 'Upper Cabinet Door', 'box', 7, '0', 'height * 0.3', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.35', '0.02', 'door', 'doorColor', null);

  -- ============================================================
  -- Larder Oven + Microwave Combo
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'larder-oven-microwave', 'Larder Oven + Microwave', 'appliance', 'appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 2.00, 0.60,
    'Tall larder unit with oven and microwave'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + plinthHeight / 2', '0',
   'width', 'plinthHeight', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Upper Cabinet
  (v_model_id, 'Upper Cabinet', 'box', 2, '0', 'height * 0.3', '0',
   'width', 'height * 0.4', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Microwave Housing
  (v_model_id, 'Microwave Housing', 'box', 3, '0', 'height * 0.05', '0',
   'width', 'height * 0.22', 'depth', 'cabinet_body', '#2c2c2c', null),
  -- Oven Housing
  (v_model_id, 'Oven Housing', 'box', 4, '0', '-height * 0.25', '0',
   'width', 'height * 0.3', 'depth', 'cabinet_body', '#2c2c2c', null),
  -- Microwave Door
  (v_model_id, 'Microwave Door', 'box', 5, '0', 'height * 0.05', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.18', '0.02', 'door', '#000000', null),
  -- Oven Door
  (v_model_id, 'Oven Door', 'box', 6, '0', '-height * 0.25', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.25', '0.02', 'door', '#000000', null),
  -- Upper Cabinet Door
  (v_model_id, 'Upper Cabinet Door', 'box', 7, '0', 'height * 0.3', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.35', '0.02', 'door', 'doorColor', null);

  -- ============================================================
  -- Larder Coffee Machine
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'larder-coffee-machine', 'Larder Coffee Machine', 'appliance', 'appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 2.00, 0.60,
    'Tall larder unit with built-in coffee machine'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + plinthHeight / 2', '0',
   'width', 'plinthHeight', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Upper Cabinet
  (v_model_id, 'Upper Cabinet', 'box', 2, '0', 'height * 0.25', '0',
   'width', 'height * 0.5', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Coffee Machine Housing
  (v_model_id, 'Coffee Machine Housing', 'box', 3, '0', '-height * 0.05', '0',
   'width', 'height * 0.25', 'depth', 'cabinet_body', '#2c2c2c', null),
  -- Lower Cabinet
  (v_model_id, 'Lower Cabinet', 'box', 4, '0', '-height * 0.35', '0',
   'width', 'height * 0.25', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Coffee Machine Front
  (v_model_id, 'Coffee Machine Front', 'box', 5, '0', '-height * 0.05', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.2', '0.02', 'door', '#2c2c2c', null),
  -- Upper Door
  (v_model_id, 'Upper Door', 'box', 6, '0', 'height * 0.25', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.45', '0.02', 'door', 'doorColor', null),
  -- Lower Door
  (v_model_id, 'Lower Door', 'box', 7, '0', '-height * 0.35', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.2', '0.02', 'door', 'doorColor', null);

  RAISE NOTICE 'Successfully populated 5 specialty larder appliances';
END $$;
