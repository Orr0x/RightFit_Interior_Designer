-- ================================================================
-- Week 31: Data Population (Dressing Room Components)
-- ================================================================
-- Purpose: Populate dressing room furniture and storage
-- Components Being Added:
-- Vanity & Seating:
-- 1. Vanity Table 100cm
-- 2. Vanity Table 120cm
-- 3. Dressing Stool
-- 4. Dressing Chair Upholstered
--
-- Island Units:
-- 5. Island Unit 80cm
-- 6. Island Unit 100cm
-- 7. Island Unit 120cm
--
-- Specialized Storage:
-- 8. Jewelry Armoire 50cm
-- 9. Tie Rack Unit 30cm
-- 10. Shoe Cabinet 80cm
-- 11. Shoe Cabinet 100cm
--
-- Mirrors:
-- 12. Full-Length Mirror 60cm
-- 13. Tri-Fold Mirror 80cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Vanity Table 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'vanity-table-100', 'Vanity Table 100cm', 'vanity', 'dressing-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 0.75, 0.50,
    'Dressing table with storage'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Left Drawer', 'box', 2, '-width/3', '0', 'depth/2 + 0.01',
   'width/3 - 0.05', 'height * 0.6', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Right Drawer', 'box', 3, 'width/3', '0', 'depth/2 + 0.01',
   'width/3 - 0.05', 'height * 0.6', '0.02', 'door', 'doorColor', null);

  -- Vanity Table 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'vanity-table-120', 'Vanity Table 120cm', 'vanity', 'dressing-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.75, 0.50,
    'Large dressing table with storage'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Left Drawer', 'box', 2, '-width/3', '0', 'depth/2 + 0.01',
   'width/3 - 0.05', 'height * 0.6', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Right Drawer', 'box', 3, 'width/3', '0', 'depth/2 + 0.01',
   'width/3 - 0.05', 'height * 0.6', '0.02', 'door', 'doorColor', null);

  -- Dressing Stool
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dressing-stool', 'Dressing Stool', 'seating', 'dressing-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.40, 0.45, 0.35,
    'Compact dressing stool'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cushion', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#8B7355', null);

  -- Dressing Chair Upholstered
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dressing-chair', 'Dressing Chair Upholstered', 'seating', 'dressing-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.50, 0.85, 0.50,
    'Upholstered dressing chair'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '-height * 0.25', '0',
   'width', 'height * 0.2', 'depth', 'cabinet_body', '#8B7355', null),
  (v_model_id, 'Back', 'box', 2, '0', 'height * 0.15', '-depth * 0.25',
   'width', 'height * 0.5', 'depth * 0.2', 'cabinet_body', '#8B7355', null);

  -- Island Unit 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'island-unit-80', 'Island Unit 80cm', 'cabinet', 'dressing-room-storage', 'standard',
    false, false, false, 0, 0, 0, 0, 0.80, 0.90, 0.50,
    'Freestanding island storage unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Top Drawer', 'box', 2, '0', 'height * 0.3', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.2', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Bottom Drawer', 'box', 3, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.6', '0.02', 'door', 'doorColor', null);

  -- Island Unit 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'island-unit-100', 'Island Unit 100cm', 'cabinet', 'dressing-room-storage', 'standard',
    false, false, false, 0, 0, 0, 0, 1.00, 0.90, 0.60,
    'Large freestanding island unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Drawer 1', 'box', 2, '-width/4', 'height * 0.3', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height * 0.2', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 2', 'box', 3, 'width/4', 'height * 0.3', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height * 0.2', '0.02', 'door', 'doorColor', null);

  -- Island Unit 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'island-unit-120', 'Island Unit 120cm', 'cabinet', 'dressing-room-storage', 'standard',
    false, false, false, 0, 0, 0, 0, 1.20, 0.90, 0.60,
    'Extra large island unit with multiple drawers'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Drawer 1', 'box', 2, '-width/3', 'height * 0.3', 'depth/2 + 0.01',
   'width/3 - 0.02', 'height * 0.2', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 2', 'box', 3, '0', 'height * 0.3', 'depth/2 + 0.01',
   'width/3 - 0.02', 'height * 0.2', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Drawer 3', 'box', 4, 'width/3', 'height * 0.3', 'depth/2 + 0.01',
   'width/3 - 0.02', 'height * 0.2', '0.02', 'door', 'doorColor', null);

  -- Jewelry Armoire 50cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'jewelry-armoire-50', 'Jewelry Armoire 50cm', 'cabinet', 'dressing-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.50, 1.40, 0.40,
    'Tall jewelry storage cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#DEB887', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', '#F5DEB3', null);

  -- Tie Rack Unit 30cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'tie-rack-30', 'Tie Rack Unit 30cm', 'cabinet', 'dressing-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.30, 1.00, 0.15,
    'Narrow tie and accessory rack'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null);

  -- Shoe Cabinet 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'shoe-cabinet-80', 'Shoe Cabinet 80cm', 'cabinet', 'dressing-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 1.00, 0.35,
    'Shoe storage cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Door Top', 'box', 2, '0', 'height * 0.25', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.45', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Door Bottom', 'box', 3, '0', '-height * 0.25', 'depth/2 + 0.01',
   'width - 0.02', 'height * 0.45', '0.02', 'door', 'doorColor', null);

  -- Shoe Cabinet 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'shoe-cabinet-100', 'Shoe Cabinet 100cm', 'cabinet', 'dressing-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 1.00, 0.35,
    'Large shoe storage cabinet'
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

  -- Full-Length Mirror 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'mirror-full-60', 'Full-Length Mirror 60cm', 'mirror', 'dressing-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 1.80, 0.05,
    'Freestanding full-length mirror'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Frame', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#8B7355', null),
  (v_model_id, 'Mirror', 'box', 2, '0', '0', '0.01',
   'width - 0.10', 'height - 0.10', '0.01', 'handle', '#E8E8E8', null);

  -- Tri-Fold Mirror 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'mirror-trifold-80', 'Tri-Fold Mirror 80cm', 'mirror', 'dressing-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.60, 0.05,
    'Three-panel dressing table mirror'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Center Panel', 'box', 1, '0', '0', '0',
   'width * 0.4', 'height', 'depth', 'handle', '#E8E8E8', null),
  (v_model_id, 'Left Panel', 'box', 2, '-width * 0.3', '0', '-0.02',
   'width * 0.3', 'height', 'depth', 'handle', '#E8E8E8', null),
  (v_model_id, 'Right Panel', 'box', 3, 'width * 0.3', '0', '-0.02',
   'width * 0.3', 'height', 'depth', 'handle', '#E8E8E8', null);

  RAISE NOTICE 'Successfully populated 13 dressing room components';
END $$;
