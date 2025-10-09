-- ================================================================
-- Week 30: Data Population (Office Components)
-- ================================================================
-- Purpose: Populate office furniture and storage
-- Components Being Added:
-- Desks:
-- 1. Desk 120cm
-- 2. Desk 140cm
-- 3. Desk 160cm
-- 4. L-Shaped Desk 160x120cm
-- 5. Corner Desk 120cm
--
-- Seating:
-- 6. Office Chair Executive
-- 7. Office Chair Task
-- 8. Visitor Chair
--
-- Storage:
-- 9. Filing Cabinet 2-Drawer
-- 10. Filing Cabinet 3-Drawer
-- 11. Pedestal 3-Drawer
-- 12. Bookshelf Office 80cm
-- 13. Bookshelf Office 100cm
-- 14. Storage Cabinet 80cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Desk 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'desk-120', 'Desk 120cm', 'desk', 'office-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.75, 0.70,
    'Office desk 120cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Left Leg', 'box', 2, '-width/2 + 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.10', 'height * 0.5', '0.10', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Right Leg', 'box', 3, 'width/2 - 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.10', 'height * 0.5', '0.10', 'cabinet_body', '#8B4513', null);

  -- Desk 140cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'desk-140', 'Desk 140cm', 'desk', 'office-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.40, 0.75, 0.70,
    'Office desk 140cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Left Leg', 'box', 2, '-width/2 + 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.10', 'height * 0.5', '0.10', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Right Leg', 'box', 3, 'width/2 - 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.10', 'height * 0.5', '0.10', 'cabinet_body', '#8B4513', null);

  -- Desk 160cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'desk-160', 'Desk 160cm', 'desk', 'office-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.60, 0.75, 0.70,
    'Office desk 160cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Left Leg', 'box', 2, '-width/2 + 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.10', 'height * 0.5', '0.10', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Right Leg', 'box', 3, 'width/2 - 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.10', 'height * 0.5', '0.10', 'cabinet_body', '#8B4513', null);

  -- L-Shaped Desk 160x120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'desk-lshaped-160', 'L-Shaped Desk 160x120cm', 'desk', 'office-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.60, 0.75, 1.20,
    'L-shaped executive desk'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Main Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', '0.70', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Return Top', 'box', 2, '-width/2 + 0.35', 'height/2 - 0.02', 'depth/2 - 0.35',
   '0.70', '0.04', 'depth - 0.70', 'cabinet_body', '#8B4513', null);

  -- Corner Desk 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'desk-corner-120', 'Corner Desk 120cm', 'desk', 'office-furniture', 'standard',
    true, true, true, 90, 270, 0, 180, 1.20, 0.75, 1.20,
    'Corner desk with angled front'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#8B4513', null);

  -- Office Chair Executive
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'office-chair-executive', 'Office Chair Executive', 'seating', 'office-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.65, 1.20, 0.65,
    'Executive office chair'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '-height * 0.15', '0',
   'width', 'height * 0.15', 'depth', 'cabinet_body', '#000000', null),
  (v_model_id, 'Back', 'box', 2, '0', 'height * 0.25', '-depth * 0.2',
   'width', 'height * 0.6', 'depth * 0.2', 'cabinet_body', '#000000', null);

  -- Office Chair Task
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'office-chair-task', 'Office Chair Task', 'seating', 'office-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.55, 0.95, 0.55,
    'Task office chair'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '-height * 0.15', '0',
   'width', 'height * 0.15', 'depth', 'cabinet_body', '#000000', null),
  (v_model_id, 'Back', 'box', 2, '0', 'height * 0.2', '-depth * 0.2',
   'width', 'height * 0.5', 'depth * 0.2', 'cabinet_body', '#000000', null);

  -- Visitor Chair
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'visitor-chair', 'Visitor Chair', 'seating', 'office-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.55, 0.85, 0.55,
    'Visitor/guest chair'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '-height * 0.2', '0',
   'width', 'height * 0.15', 'depth', 'cabinet_body', '#4B4B4B', null),
  (v_model_id, 'Back', 'box', 2, '0', 'height * 0.15', '-depth * 0.2',
   'width', 'height * 0.5', 'depth * 0.15', 'cabinet_body', '#4B4B4B', null);

  -- Filing Cabinet 2-Drawer
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'filing-cabinet-2drawer', 'Filing Cabinet 2-Drawer', 'cabinet', 'office-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.45, 0.70, 0.60,
    'Two-drawer filing cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#808080', null),
  (v_model_id, 'Drawer 1', 'box', 2, '0', 'height * 0.2', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.4', '0.02', 'door', '#A9A9A9', null),
  (v_model_id, 'Drawer 2', 'box', 3, '0', '-height * 0.2', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.4', '0.02', 'door', '#A9A9A9', null);

  -- Filing Cabinet 3-Drawer
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'filing-cabinet-3drawer', 'Filing Cabinet 3-Drawer', 'cabinet', 'office-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.45, 1.05, 0.60,
    'Three-drawer filing cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#808080', null),
  (v_model_id, 'Drawer 1', 'box', 2, '0', 'height * 0.3', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.3', '0.02', 'door', '#A9A9A9', null),
  (v_model_id, 'Drawer 2', 'box', 3, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.3', '0.02', 'door', '#A9A9A9', null),
  (v_model_id, 'Drawer 3', 'box', 4, '0', '-height * 0.3', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.3', '0.02', 'door', '#A9A9A9', null);

  -- Pedestal 3-Drawer
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'pedestal-3drawer', 'Pedestal 3-Drawer', 'cabinet', 'office-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.40, 0.60, 0.50,
    'Under-desk pedestal with 3 drawers'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Drawer 1', 'box', 2, '0', 'height * 0.25', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.25', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 2', 'box', 3, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.25', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 3', 'box', 4, '0', '-height * 0.25', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.25', '0.02', 'door', 'doorColor', null);

  -- Bookshelf Office 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'bookshelf-office-80', 'Bookshelf Office 80cm', 'bookshelf', 'office-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 1.80, 0.35,
    'Office bookshelf 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#8B4513', null);

  -- Bookshelf Office 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'bookshelf-office-100', 'Bookshelf Office 100cm', 'bookshelf', 'office-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 2.00, 0.35,
    'Office bookshelf 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#8B4513', null);

  -- Storage Cabinet 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'storage-cabinet-80', 'Storage Cabinet 80cm', 'cabinet', 'office-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 1.80, 0.45,
    'Tall office storage cabinet'
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

  RAISE NOTICE 'Successfully populated 14 office components';
END $$;
