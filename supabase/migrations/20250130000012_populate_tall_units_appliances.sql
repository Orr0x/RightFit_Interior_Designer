-- ================================================================
-- Week 22: Data Population (P2 - Tall Units & Appliances)
-- ================================================================
-- Purpose: Populate tall units, larders, and major appliances
-- Feature Flag: use_dynamic_3d_models
-- Status: Week 22 - P2 (Priority 2)
--
-- Components Being Added:
-- Tall Units:
-- 1. Tall Unit 60cm (full height larder)
-- 2. Tall Unit 80cm (full height larder)
-- 3. Oven Housing 60cm
--
-- Appliances:
-- 4. Oven 60cm
-- 5. Dishwasher 60cm
-- 6. Fridge 60cm
-- 7. Fridge 90cm
--
-- All tall units: Height = 200cm, Depth = 60cm, Width = variable
-- All appliances: Height = 85cm, Depth = 60cm, Width = variable
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- ============================================================
  -- TALL UNIT 60CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'tall-unit-60', 'Tall Unit 60cm', 'tall-unit', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 2.00, 0.60,
    'Full height 60cm larder unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 2, '0', '0.075', '0',
   'width', 'height - 0.15', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Door
  (v_model_id, 'Door', 'box', 3, '0', '0.075', 'depth / 2 + 0.01',
   'width - 0.02', 'height - 0.17', '0.02', 'door', 'doorColor', null),
  -- Handle
  (v_model_id, 'Handle', 'box', 4, 'width / 2 - 0.09', 'height / 2 - 0.15', 'depth / 2 + 0.03',
   '0.14', '0.03', '0.04', 'handle', 'handleColor', null);

  -- ============================================================
  -- TALL UNIT 80CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'tall-unit-80', 'Tall Unit 80cm', 'tall-unit', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 2.00, 0.60,
    'Full height 80cm larder unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 2, '0', '0.075', '0',
   'width', 'height - 0.15', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Door
  (v_model_id, 'Door', 'box', 3, '0', '0.075', 'depth / 2 + 0.01',
   'width - 0.02', 'height - 0.17', '0.02', 'door', 'doorColor', null),
  -- Handle
  (v_model_id, 'Handle', 'box', 4, 'width / 2 - 0.11', 'height / 2 - 0.15', 'depth / 2 + 0.03',
   '0.18', '0.03', '0.04', 'handle', 'handleColor', null);

  -- ============================================================
  -- OVEN HOUSING 60CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'oven-housing-60', 'Oven Housing 60cm', 'tall-unit', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 2.00, 0.60,
    'Tall oven housing unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 2, '0', '0.075', '0',
   'width', 'height - 0.15', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Oven Cutout (just a door for now)
  (v_model_id, 'Oven Door', 'box', 3, '0', '-0.20', 'depth / 2 + 0.01',
   'width - 0.02', '0.60', '0.02', 'door', 'applianceColor', null);

  -- ============================================================
  -- OVEN 60CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'oven-60', 'Oven 60cm', 'appliance', 'appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.60, 0.60,
    'Built-in oven 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Oven Body
  (v_model_id, 'Oven Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'applianceColor', null),
  -- Door
  (v_model_id, 'Oven Door', 'box', 2, '0', '0', 'depth / 2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', '#2c2c2c', null),
  -- Window
  (v_model_id, 'Window', 'box', 3, '0', '0.05', 'depth / 2 + 0.02',
   'width - 0.10', 'height - 0.15', '0.01', 'handle', '#1a1a1a', null);

  -- ============================================================
  -- DISHWASHER 60CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dishwasher-60', 'Dishwasher 60cm', 'appliance', 'appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.85, 0.60,
    'Integrated dishwasher 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Appliance Body
  (v_model_id, 'Appliance Body', 'box', 2, '0', '0.075', '0',
   'width', 'height - 0.15', 'depth', 'cabinet_body', 'applianceColor', null),
  -- Door
  (v_model_id, 'Door', 'box', 3, '0', '0.075', 'depth / 2 + 0.01',
   'width - 0.02', 'height - 0.17', '0.02', 'door', 'doorColor', null),
  -- Handle
  (v_model_id, 'Handle', 'box', 4, 'width / 2 - 0.09', '-height / 2 + 0.25', 'depth / 2 + 0.03',
   '0.14', '0.03', '0.04', 'handle', 'handleColor', null);

  -- ============================================================
  -- FRIDGE 60CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'fridge-60', 'Fridge 60cm', 'appliance', 'appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 1.80, 0.60,
    'Freestanding fridge 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Fridge Body
  (v_model_id, 'Fridge Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#e0e0e0', null),
  -- Door
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth / 2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', '#c0c0c0', null),
  -- Handle
  (v_model_id, 'Handle', 'box', 3, 'width / 2 - 0.02', '0', 'depth / 2 + 0.03',
   '0.03', 'height - 0.10', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- FRIDGE 90CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'fridge-90', 'Fridge 90cm', 'appliance', 'appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.90, 1.80, 0.60,
    'American style fridge 90cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Fridge Body
  (v_model_id, 'Fridge Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#e0e0e0', null),
  -- Left Door
  (v_model_id, 'Left Door', 'box', 2, '-width / 4', '0', 'depth / 2 + 0.01',
   'width / 2 - 0.02', 'height - 0.02', '0.02', 'door', '#c0c0c0', null),
  -- Right Door
  (v_model_id, 'Right Door', 'box', 3, 'width / 4', '0', 'depth / 2 + 0.01',
   'width / 2 - 0.02', 'height - 0.02', '0.02', 'door', '#c0c0c0', null),
  -- Left Handle
  (v_model_id, 'Left Handle', 'box', 4, '-width / 4 + width / 4 - 0.02', '0', 'depth / 2 + 0.03',
   '0.03', 'height - 0.10', '0.03', 'handle', '#808080', null),
  -- Right Handle
  (v_model_id, 'Right Handle', 'box', 5, 'width / 4 - width / 4 + 0.02', '0', 'depth / 2 + 0.03',
   '0.03', 'height - 0.10', '0.03', 'handle', '#808080', null);

  RAISE NOTICE 'Successfully populated 7 tall units and appliances';
END $$;
