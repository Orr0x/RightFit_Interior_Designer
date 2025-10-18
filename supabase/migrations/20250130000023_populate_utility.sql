-- ================================================================
-- Week 33: Data Population (Utility Room Components)
-- ================================================================
-- Purpose: Populate utility room appliances and storage
-- Components Being Added:
-- Appliances:
-- 1. Washing Machine 60cm
-- 2. Washer-Dryer 60cm
-- 3. Tumble Dryer 60cm
-- 4. Freezer Upright 60cm
-- 5. Freezer Chest 90cm
--
-- Sinks & Work:
-- 6. Utility Sink Single 60cm
-- 7. Utility Sink Double 100cm
-- 8. Worktop 80cm
-- 9. Worktop 100cm
-- 10. Worktop 120cm
--
-- Storage:
-- 11. Broom Cupboard 60cm
-- 12. Tall Storage 60cm
-- 13. Tall Storage 80cm
-- 14. Wall Cabinet Utility 60cm
-- 15. Wall Cabinet Utility 80cm
-- 16. Base Cabinet Utility 60cm
-- 17. Base Cabinet Utility 80cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Washing Machine 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'washing-machine-60', 'Washing Machine 60cm', 'appliance', 'utility-appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.85, 0.60,
    'Freestanding washing machine'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#FFFFFF', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width * 0.7', 'height * 0.7', '0.02', 'handle', '#E0E0E0', null);

  -- Washer-Dryer 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'washer-dryer-60', 'Washer-Dryer 60cm', 'appliance', 'utility-appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.85, 0.60,
    'Combo washer-dryer unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#FFFFFF', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width * 0.7', 'height * 0.7', '0.02', 'handle', '#E0E0E0', null);

  -- Tumble Dryer 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'tumble-dryer-60', 'Tumble Dryer 60cm', 'appliance', 'utility-appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.85, 0.60,
    'Freestanding tumble dryer'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#FFFFFF', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width * 0.7', 'height * 0.7', '0.02', 'handle', '#E0E0E0', null);

  -- Freezer Upright 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'freezer-upright-60', 'Freezer Upright 60cm', 'appliance', 'utility-appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 1.85, 0.60,
    'Tall upright freezer'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#FFFFFF', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', '#E0E0E0', null);

  -- Freezer Chest 90cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'freezer-chest-90', 'Freezer Chest 90cm', 'appliance', 'utility-appliances', 'standard',
    false, true, true, 90, 270, 0, 180, 0.90, 0.85, 0.60,
    'Chest freezer'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#FFFFFF', null),
  (v_model_id, 'Lid', 'box', 2, '0', 'height/2 + 0.02', '0',
   'width - 0.05', '0.04', 'depth - 0.05', 'door', '#E0E0E0', null);

  -- Utility Sink Single 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'utility-sink-single-60', 'Utility Sink Single 60cm', 'sink', 'utility-fixtures', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.90, 0.60,
    'Single utility sink with cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '-height * 0.2', '0',
   'width', 'height * 0.6', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Sink Basin', 'box', 2, '0', 'height * 0.25', '0',
   'width * 0.8', 'height * 0.15', 'depth * 0.7', 'handle', '#D3D3D3', null),
  (v_model_id, 'Tap', 'box', 3, '-width * 0.2', 'height * 0.4', '-depth * 0.15',
   '0.03', 'height * 0.15', '0.03', 'handle', '#C0C0C0', null);

  -- Utility Sink Double 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'utility-sink-double-100', 'Utility Sink Double 100cm', 'sink', 'utility-fixtures', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 0.90, 0.60,
    'Double basin utility sink'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '-height * 0.2', '0',
   'width', 'height * 0.6', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Left Basin', 'box', 2, '-width * 0.25', 'height * 0.25', '0',
   'width * 0.4', 'height * 0.15', 'depth * 0.7', 'handle', '#D3D3D3', null),
  (v_model_id, 'Right Basin', 'box', 3, 'width * 0.25', 'height * 0.25', '0',
   'width * 0.4', 'height * 0.15', 'depth * 0.7', 'handle', '#D3D3D3', null);

  -- Worktop 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'utility-worktop-80', 'Worktop 80cm', 'counter-top', 'utility-fixtures', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.90, 0.60,
    'Utility worktop with storage'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '-height * 0.2', '0',
   'width', 'height * 0.6', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Counter', 'box', 2, '0', 'height * 0.32', '0',
   'width', 'height * 0.05', 'depth', 'counter', 'counterColor', null);

  -- Worktop 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'utility-worktop-100', 'Worktop 100cm', 'counter-top', 'utility-fixtures', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 0.90, 0.60,
    'Utility worktop 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '-height * 0.2', '0',
   'width', 'height * 0.6', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Counter', 'box', 2, '0', 'height * 0.32', '0',
   'width', 'height * 0.05', 'depth', 'counter', 'counterColor', null);

  -- Worktop 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'utility-worktop-120', 'Worktop 120cm', 'counter-top', 'utility-fixtures', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.90, 0.60,
    'Utility worktop 120cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '-height * 0.2', '0',
   'width', 'height * 0.6', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Counter', 'box', 2, '0', 'height * 0.32', '0',
   'width', 'height * 0.05', 'depth', 'counter', 'counterColor', null);

  -- Broom Cupboard 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'broom-cupboard-60', 'Broom Cupboard 60cm', 'cabinet', 'utility-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 2.00, 0.40,
    'Tall broom storage cupboard'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Tall Storage 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'utility-tall-60', 'Tall Storage 60cm', 'cabinet', 'utility-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 2.00, 0.60,
    'Tall utility storage cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Tall Storage 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'utility-tall-80', 'Tall Storage 80cm', 'cabinet', 'utility-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 2.00, 0.60,
    'Tall utility storage cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Door Left', 'box', 2, '-width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Door Right', 'box', 3, 'width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Wall Cabinet Utility 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'utility-wall-60', 'Wall Cabinet Utility 60cm', 'wall-cabinet', 'utility-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.60, 0.40,
    'Utility wall cabinet 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Wall Cabinet Utility 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'utility-wall-80', 'Wall Cabinet Utility 80cm', 'wall-cabinet', 'utility-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.60, 0.40,
    'Utility wall cabinet 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Base Cabinet Utility 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'utility-base-60', 'Base Cabinet Utility 60cm', 'base-cabinet', 'utility-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.90, 0.60,
    'Utility base cabinet 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  (v_model_id, 'Body', 'box', 2, '0', 'height * 0.08', '0',
   'width', 'height * 0.75', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Door', 'box', 3, '0', 'height * 0.08', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.75', '0.02', 'door', 'doorColor', null);

  -- Base Cabinet Utility 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'utility-base-80', 'Base Cabinet Utility 80cm', 'base-cabinet', 'utility-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.90, 0.60,
    'Utility base cabinet 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  (v_model_id, 'Body', 'box', 2, '0', 'height * 0.08', '0',
   'width', 'height * 0.75', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Door Left', 'box', 3, '-width/4', 'height * 0.08', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height * 0.75', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Door Right', 'box', 4, 'width/4', 'height * 0.08', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height * 0.75', '0.02', 'door', 'doorColor', null);

  RAISE NOTICE 'Successfully populated 17 utility room components';
END $$;
