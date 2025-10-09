-- ================================================================
-- Week 32: Data Population (Dining Room Components)
-- ================================================================
-- Purpose: Populate dining room furniture
-- Components Being Added:
-- Tables:
-- 1. Dining Table 120x80cm
-- 2. Dining Table 160x90cm
-- 3. Dining Table 180x90cm
-- 4. Dining Table Round 110cm
-- 5. Dining Table Round 120cm
-- 6. Dining Table Extendable 160-200cm
--
-- Seating:
-- 7. Dining Chair Standard
-- 8. Dining Chair Upholstered
-- 9. Dining Bench 120cm
-- 10. Dining Bench 140cm
--
-- Storage:
-- 11. Sideboard 140cm
-- 12. Sideboard 160cm
-- 13. Display Cabinet 100cm
-- 14. China Cabinet 90cm
-- 15. Drinks Cabinet 80cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Dining Table 120x80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dining-table-120', 'Dining Table 120x80cm', 'table', 'dining-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.75, 0.80,
    'Rectangular dining table for 4'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 1', 'box', 2, '-width/2 + 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 2', 'box', 3, 'width/2 - 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 3', 'box', 4, '-width/2 + 0.05', '-height * 0.25', 'depth/2 - 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 4', 'box', 5, 'width/2 - 0.05', '-height * 0.25', 'depth/2 - 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null);

  -- Dining Table 160x90cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dining-table-160', 'Dining Table 160x90cm', 'table', 'dining-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.60, 0.75, 0.90,
    'Rectangular dining table for 6'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 1', 'box', 2, '-width/2 + 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 2', 'box', 3, 'width/2 - 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 3', 'box', 4, '-width/2 + 0.05', '-height * 0.25', 'depth/2 - 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 4', 'box', 5, 'width/2 - 0.05', '-height * 0.25', 'depth/2 - 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null);

  -- Dining Table 180x90cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dining-table-180', 'Dining Table 180x90cm', 'table', 'dining-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.80, 0.75, 0.90,
    'Large rectangular dining table for 6-8'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 1', 'box', 2, '-width/2 + 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 2', 'box', 3, 'width/2 - 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 3', 'box', 4, '-width/2 + 0.05', '-height * 0.25', 'depth/2 - 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 4', 'box', 5, 'width/2 - 0.05', '-height * 0.25', 'depth/2 - 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null);

  -- Dining Table Round 110cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dining-table-round-110', 'Dining Table Round 110cm', 'table', 'dining-room-furniture', 'standard',
    false, false, false, 0, 0, 0, 0, 1.10, 0.75, 1.10,
    'Round dining table for 4'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Pedestal', 'box', 2, '0', '0', '0',
   '0.20', 'height * 0.5', '0.20', 'cabinet_body', '#8B4513', null);

  -- Dining Table Round 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dining-table-round-120', 'Dining Table Round 120cm', 'table', 'dining-room-furniture', 'standard',
    false, false, false, 0, 0, 0, 0, 1.20, 0.75, 1.20,
    'Round dining table for 6'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Pedestal', 'box', 2, '0', '0', '0',
   '0.25', 'height * 0.5', '0.25', 'cabinet_body', '#8B4513', null);

  -- Dining Table Extendable 160-200cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dining-table-extendable-160', 'Dining Table Extendable 160-200cm', 'table', 'dining-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.60, 0.75, 0.90,
    'Extendable dining table 160-200cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Top', 'box', 1, '0', 'height/2 - 0.02', '0',
   'width', '0.04', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 1', 'box', 2, '-width/2 + 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Leg 2', 'box', 3, 'width/2 - 0.05', '-height * 0.25', '-depth/2 + 0.05',
   '0.08', 'height * 0.5', '0.08', 'cabinet_body', '#8B4513', null);

  -- Dining Chair Standard
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dining-chair-standard', 'Dining Chair Standard', 'seating', 'dining-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.45, 0.90, 0.50,
    'Standard dining chair'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '-height * 0.25', '0',
   'width', 'height * 0.1', 'depth * 0.8', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Back', 'box', 2, '0', 'height * 0.15', '-depth * 0.3',
   'width', 'height * 0.5', 'depth * 0.1', 'cabinet_body', '#8B4513', null);

  -- Dining Chair Upholstered
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dining-chair-upholstered', 'Dining Chair Upholstered', 'seating', 'dining-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.50, 0.95, 0.55,
    'Upholstered dining chair'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '-height * 0.2', '0',
   'width', 'height * 0.15', 'depth * 0.8', 'cabinet_body', '#4B4B4B', null),
  (v_model_id, 'Back', 'box', 2, '0', 'height * 0.2', '-depth * 0.3',
   'width', 'height * 0.6', 'depth * 0.15', 'cabinet_body', '#4B4B4B', null);

  -- Dining Bench 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dining-bench-120', 'Dining Bench 120cm', 'seating', 'dining-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.45, 0.40,
    'Dining bench 120cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#8B4513', null);

  -- Dining Bench 140cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'dining-bench-140', 'Dining Bench 140cm', 'seating', 'dining-room-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.40, 0.45, 0.40,
    'Dining bench 140cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#8B4513', null);

  -- Sideboard 140cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'sideboard-dining-140', 'Sideboard 140cm', 'sideboard', 'dining-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.40, 0.85, 0.45,
    'Dining room sideboard 140cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Door 1', 'box', 2, '-width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  (v_model_id, 'Door 2', 'box', 3, 'width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null);

  -- Sideboard 160cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'sideboard-dining-160', 'Sideboard 160cm', 'sideboard', 'dining-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.60, 0.85, 0.45,
    'Dining room sideboard 160cm'
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

  -- Display Cabinet 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'display-cabinet-dining-100', 'Display Cabinet 100cm', 'cabinet', 'dining-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 1.90, 0.45,
    'Tall glass-front display cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Glass Door Left', 'box', 2, '-width/4', 'height * 0.1', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height * 0.8', '0.01', 'handle', '#E6E6FA', null),
  (v_model_id, 'Glass Door Right', 'box', 3, 'width/4', 'height * 0.1', 'depth/2 + 0.01',
   'width/2 - 0.02', 'height * 0.8', '0.01', 'handle', '#E6E6FA', null);

  -- China Cabinet 90cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'china-cabinet-90', 'China Cabinet 90cm', 'cabinet', 'dining-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.90, 2.00, 0.45,
    'Traditional china display cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Lower Cabinet', 'box', 1, '0', '-height * 0.3', '0',
   'width', 'height * 0.4', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Upper Cabinet', 'box', 2, '0', 'height * 0.2', '0',
   'width', 'height * 0.6', 'depth * 0.8', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Glass Door', 'box', 3, '0', 'height * 0.2', 'depth * 0.4 + 0.01',
   'width - 0.02', 'height * 0.5', '0.01', 'handle', '#E6E6FA', null);

  -- Drinks Cabinet 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'drinks-cabinet-80', 'Drinks Cabinet 80cm', 'cabinet', 'dining-room-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 1.20, 0.45,
    'Bar/drinks storage cabinet'
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

  RAISE NOTICE 'Successfully populated 15 dining room components';
END $$;
