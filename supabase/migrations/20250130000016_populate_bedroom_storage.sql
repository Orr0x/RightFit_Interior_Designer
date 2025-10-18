-- ================================================================
-- Week 26: Data Population (Bedroom Storage)
-- ================================================================
-- Purpose: Populate bedroom storage components
-- Components Being Added:
-- 1. Wardrobe 2-Door 100cm
-- 2. Wardrobe 3-Door 150cm
-- 3. Wardrobe 4-Door 200cm
-- 4. Wardrobe Sliding 180cm
-- 5. Chest of Drawers 80cm
-- 6. Chest of Drawers 100cm
-- 7. Tallboy 50cm (narrow 6-drawer)
-- 8. Bedside Table 40cm
-- 9. Bedside Table 50cm
-- 10. Dressing Table 120cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Wardrobe 2-Door 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'wardrobe-2door-100', 'Wardrobe 2-Door 100cm', 'wardrobe', 'bedroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 2.00, 0.60,
    'Two door wardrobe 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Left Door', 'box', 2, '-width / 4', '0', 'depth / 2 + 0.01',
   'width / 2 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Right Door', 'box', 3, 'width / 4', '0', 'depth / 2 + 0.01',
   'width / 2 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Wardrobe 3-Door 150cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'wardrobe-3door-150', 'Wardrobe 3-Door 150cm', 'wardrobe', 'bedroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.50, 2.00, 0.60,
    'Three door wardrobe 150cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Left Door', 'box', 2, '-width / 3', '0', 'depth / 2 + 0.01',
   'width / 3 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Center Door', 'box', 3, '0', '0', 'depth / 2 + 0.01',
   'width / 3 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Right Door', 'box', 4, 'width / 3', '0', 'depth / 2 + 0.01',
   'width / 3 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Wardrobe 4-Door 200cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'wardrobe-4door-200', 'Wardrobe 4-Door 200cm', 'wardrobe', 'bedroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 2.00, 2.00, 0.60,
    'Four door wardrobe 200cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Door 1', 'box', 2, '-width * 3/8', '0', 'depth / 2 + 0.01',
   'width / 4 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Door 2', 'box', 3, '-width / 8', '0', 'depth / 2 + 0.01',
   'width / 4 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Door 3', 'box', 4, 'width / 8', '0', 'depth / 2 + 0.01',
   'width / 4 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Door 4', 'box', 5, 'width * 3/8', '0', 'depth / 2 + 0.01',
   'width / 4 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Wardrobe Sliding 180cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'wardrobe-sliding-180', 'Wardrobe Sliding 180cm', 'wardrobe', 'bedroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.80, 2.00, 0.60,
    'Sliding door wardrobe 180cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Left Door', 'box', 2, '-width / 4', '0', 'depth / 2 + 0.01',
   'width / 2 + 0.05', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Right Door', 'box', 3, 'width / 4', '0', 'depth / 2 + 0.02',
   'width / 2 + 0.05', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Chest of Drawers 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'chest-drawers-80', 'Chest of Drawers 80cm', 'chest', 'bedroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 1.00, 0.50,
    'Four drawer chest 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Drawer 1', 'box', 2, '0', '-height/2 + 0.12', 'depth/2 + 0.01',
   'width - 0.02', '0.22', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 2', 'box', 3, '0', '-height/2 + 0.37', 'depth/2 + 0.01',
   'width - 0.02', '0.22', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 3', 'box', 4, '0', 'height/2 - 0.37', 'depth/2 + 0.01',
   'width - 0.02', '0.22', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 4', 'box', 5, '0', 'height/2 - 0.12', 'depth/2 + 0.01',
   'width - 0.02', '0.22', '0.02', 'door', 'doorColor', null);

  -- Chest of Drawers 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'chest-drawers-100', 'Chest of Drawers 100cm', 'chest', 'bedroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 1.00, 0.50,
    'Four drawer chest 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Drawer 1', 'box', 2, '0', '-height/2 + 0.12', 'depth/2 + 0.01',
   'width - 0.02', '0.22', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 2', 'box', 3, '0', '-height/2 + 0.37', 'depth/2 + 0.01',
   'width - 0.02', '0.22', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 3', 'box', 4, '0', 'height/2 - 0.37', 'depth/2 + 0.01',
   'width - 0.02', '0.22', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 4', 'box', 5, '0', 'height/2 - 0.12', 'depth/2 + 0.01',
   'width - 0.02', '0.22', '0.02', 'door', 'doorColor', null);

  -- Tallboy 50cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'tallboy-50', 'Tallboy 50cm', 'chest', 'bedroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.50, 1.20, 0.50,
    'Narrow 6-drawer tallboy'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Drawer 1', 'box', 2, '0', '-height/2 + 0.10', 'depth/2 + 0.01',
   'width - 0.02', '0.18', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 2', 'box', 3, '0', '-height/2 + 0.30', 'depth/2 + 0.01',
   'width - 0.02', '0.18', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 3', 'box', 4, '0', '-height/2 + 0.50', 'depth/2 + 0.01',
   'width - 0.02', '0.18', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 4', 'box', 5, '0', 'height/2 - 0.50', 'depth/2 + 0.01',
   'width - 0.02', '0.18', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 5', 'box', 6, '0', 'height/2 - 0.30', 'depth/2 + 0.01',
   'width - 0.02', '0.18', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 6', 'box', 7, '0', 'height/2 - 0.10', 'depth/2 + 0.01',
   'width - 0.02', '0.18', '0.02', 'door', 'doorColor', null);

  -- Bedside Table 40cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'bedside-table-40', 'Bedside Table 40cm', 'bedside', 'bedroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.40, 0.50, 0.40,
    'Compact bedside table'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Drawer', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height/2', '0.02', 'door', 'doorColor', null);

  -- Bedside Table 50cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'bedside-table-50', 'Bedside Table 50cm', 'bedside', 'bedroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.50, 0.50, 0.50,
    'Standard bedside table'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Drawer', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height/2', '0.02', 'door', 'doorColor', null);

  -- Dressing Table 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dressing-table-120', 'Dressing Table 120cm', 'dressing-table', 'bedroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.75, 0.50,
    'Dressing table with mirror'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Left Drawer', 'box', 2, '-width/3', '0', 'depth/2 + 0.01',
   'width/3 - 0.02', 'height/2', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Right Drawer', 'box', 3, 'width/3', '0', 'depth/2 + 0.01',
   'width/3 - 0.02', 'height/2', '0.02', 'door', 'doorColor', null);

  RAISE NOTICE 'Successfully populated 10 bedroom storage components';
END $$;
