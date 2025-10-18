-- ================================================================
-- Week 27: Data Population (Bedroom Furniture)
-- ================================================================
-- Purpose: Populate bedroom furniture (beds, seating)
-- Components Being Added:
-- 1. Single Bed 90cm
-- 2. Double Bed 140cm
-- 3. King Bed 150cm
-- 4. Super King Bed 180cm
-- 5. Ottoman 60cm
-- 6. Ottoman Storage 80cm
-- 7. Reading Chair 70cm
-- 8. Bedroom Bench 120cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Single Bed 90cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'single-bed-90', 'Single Bed 90cm', 'bed', 'bedroom-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.90, 0.50, 2.00,
    'Single bed 90cm wide'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Base', 'box', 1, '0', '-height/2', '0',
   'width', 'height * 0.3', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Mattress', 'box', 2, '0', 'height * 0.15', '0',
   'width', 'height * 0.4', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Headboard', 'box', 3, '0', 'height * 0.5', '-depth/2 + 0.05',
   'width', 'height', '0.10', 'door', '#8B4513', null);

  -- Double Bed 140cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'double-bed-140', 'Double Bed 140cm', 'bed', 'bedroom-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.40, 0.50, 2.00,
    'Double bed 140cm wide'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Base', 'box', 1, '0', '-height/2', '0',
   'width', 'height * 0.3', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Mattress', 'box', 2, '0', 'height * 0.15', '0',
   'width', 'height * 0.4', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Headboard', 'box', 3, '0', 'height * 0.5', '-depth/2 + 0.05',
   'width', 'height', '0.10', 'door', '#8B4513', null);

  -- King Bed 150cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'king-bed-150', 'King Bed 150cm', 'bed', 'bedroom-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.50, 0.50, 2.00,
    'King bed 150cm wide'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Base', 'box', 1, '0', '-height/2', '0',
   'width', 'height * 0.3', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Mattress', 'box', 2, '0', 'height * 0.15', '0',
   'width', 'height * 0.4', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Headboard', 'box', 3, '0', 'height * 0.5', '-depth/2 + 0.05',
   'width', 'height', '0.10', 'door', '#8B4513', null);

  -- Super King Bed 180cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'superking-bed-180', 'Super King Bed 180cm', 'bed', 'bedroom-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.80, 0.50, 2.00,
    'Super king bed 180cm wide'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Base', 'box', 1, '0', '-height/2', '0',
   'width', 'height * 0.3', 'depth', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Mattress', 'box', 2, '0', 'height * 0.15', '0',
   'width', 'height * 0.4', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Headboard', 'box', 3, '0', 'height * 0.5', '-depth/2 + 0.05',
   'width', 'height', '0.10', 'door', '#8B4513', null);

  -- Ottoman 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'ottoman-60', 'Ottoman 60cm', 'seating', 'bedroom-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.45, 0.60,
    'Upholstered ottoman'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cushion', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#6B8E23', null);

  -- Ottoman Storage 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'ottoman-storage-80', 'Ottoman Storage 80cm', 'seating', 'bedroom-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.50, 0.60,
    'Storage ottoman'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Base', 'box', 1, '0', '-height * 0.1', '0',
   'width', 'height * 0.8', 'depth', 'cabinet_body', 'cabinetColor', null),
  (v_model_id, 'Cushion', 'box', 2, '0', 'height * 0.4', '0',
   'width', 'height * 0.2', 'depth', 'cabinet_body', '#6B8E23', null);

  -- Reading Chair 70cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'reading-chair-70', 'Reading Chair 70cm', 'seating', 'bedroom-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 0.70, 0.90, 0.70,
    'Comfortable reading chair'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Seat', 'box', 1, '0', '-height * 0.25', '0.05',
   'width', 'height * 0.25', 'depth * 0.7', 'cabinet_body', '#8B4513', null),
  (v_model_id, 'Back', 'box', 2, '0', 'height * 0.15', '-depth * 0.25',
   'width', 'height * 0.6', 'depth * 0.2', 'cabinet_body', '#8B4513', null);

  -- Bedroom Bench 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'bedroom-bench-120', 'Bedroom Bench 120cm', 'seating', 'bedroom-furniture', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.45, 0.40,
    'End of bed bench'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cushion', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#6B8E23', null);

  RAISE NOTICE 'Successfully populated 8 bedroom furniture components';
END $$;
