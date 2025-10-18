-- ================================================================
-- Week 29: Data Population (Living Room Components)
-- ================================================================
-- Purpose: Populate living room furniture and storage
-- Components Being Added:
-- Seating:
-- 1. Sofa 2-Seater 140cm
-- 2. Sofa 3-Seater 200cm
-- 3. Armchair 80cm
-- 4. Loveseat 120cm
--
-- Storage & Media:
-- 5. TV Unit 120cm
-- 6. TV Unit 160cm
-- 7. Media Cabinet 80cm
-- 8. Bookshelf 80cm
-- 9. Bookshelf 100cm
-- 10. Display Cabinet 90cm
-- 11. Sideboard 180cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Sofa 2-Seater 140cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'sofa-2seater-140', 'Sofa 2-Seater 140cm', 'sofa', 'living-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.40, 0.80, 0.90,
    'Two-seater sofa'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '-height * 0.2', '0.05',
   'width', 'height * 0.3', 'depth * 0.7', 'cabinet_body', '#3A6EA5', null),
  (v_model_id, 'Back', 'box', 2, '0', 'height * 0.15', '-depth * 0.25',
   'width', 'height * 0.6', 'depth * 0.2', 'cabinet_body', '#3A6EA5', null);

  -- Sofa 3-Seater 200cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'sofa-3seater-200', 'Sofa 3-Seater 200cm', 'sofa', 'living-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 2.00, 0.80, 0.90,
    'Three-seater sofa'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '-height * 0.2', '0.05',
   'width', 'height * 0.3', 'depth * 0.7', 'cabinet_body', '#3A6EA5', null),
  (v_model_id, 'Back', 'box', 2, '0', 'height * 0.15', '-depth * 0.25',
   'width', 'height * 0.6', 'depth * 0.2', 'cabinet_body', '#3A6EA5', null);

  -- Armchair 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'armchair-80', 'Armchair 80cm', 'seating', 'living-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.90, 0.85,
    'Single armchair'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '-height * 0.2', '0.05',
   'width', 'height * 0.3', 'depth * 0.7', 'cabinet_body', '#3A6EA5', null),
  (v_model_id, 'Back', 'box', 2, '0', 'height * 0.15', '-depth * 0.25',
   'width', 'height * 0.6', 'depth * 0.2', 'cabinet_body', '#3A6EA5', null);

  -- Loveseat 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'loveseat-120', 'Loveseat 120cm', 'sofa', 'living-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.80, 0.85,
    'Compact loveseat'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '-height * 0.2', '0.05',
   'width', 'height * 0.3', 'depth * 0.7', 'cabinet_body', '#3A6EA5', null),
  (v_model_id, 'Back', 'box', 2, '0', 'height * 0.15', '-depth * 0.25',
   'width', 'height * 0.6', 'depth * 0.2', 'cabinet_body', '#3A6EA5', null);

  -- TV Unit 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'tv-unit-120', 'TV Unit 120cm', 'tv-unit', 'living-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.50, 0.45,
    'TV cabinet 120cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#2F4F4F', null),
  (v_model_id, 'Door Left', 'box', 2, '-width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Door Right', 'box', 3, 'width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- TV Unit 160cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'tv-unit-160', 'TV Unit 160cm', 'tv-unit', 'living-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.60, 0.50, 0.45,
    'TV cabinet 160cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#2F4F4F', null),
  (v_model_id, 'Door Left', 'box', 2, '-width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Door Right', 'box', 3, 'width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Media Cabinet 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'media-cabinet-80', 'Media Cabinet 80cm', 'cabinet', 'living-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.80, 0.45,
    'Media storage cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#2F4F4F', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Bookshelf 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'bookshelf-80', 'Bookshelf 80cm', 'bookshelf', 'living-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 1.80, 0.35,
    'Tall bookshelf 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#8B4513', null);

  -- Bookshelf 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'bookshelf-100', 'Bookshelf 100cm', 'bookshelf', 'living-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 2.00, 0.35,
    'Tall bookshelf 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#8B4513', null);

  -- Display Cabinet 90cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'display-cabinet-90', 'Display Cabinet 90cm', 'cabinet', 'living-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.90, 1.80, 0.40,
    'Glass-front display cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Glass Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.01', 'handle', '#E6E6FA', null);

  -- Sideboard 180cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'sideboard-180', 'Sideboard 180cm', 'sideboard', 'living-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.80, 0.80, 0.45,
    'Long sideboard cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Door 1', 'box', 2, '-width/3', '0', 'depth/2 + 0.01',
   'width/3 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Door 2', 'box', 3, '0', '0', 'depth/2 + 0.01',
   'width/3 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Door 3', 'box', 4, 'width/3', '0', 'depth/2 + 0.01',
   'width/3 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  RAISE NOTICE 'Successfully populated 11 living room components';
END $$;
