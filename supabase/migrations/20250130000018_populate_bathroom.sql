-- ================================================================
-- Week 28: Data Population (Bathroom Components)
-- ================================================================
-- Purpose: Populate bathroom vanities, fixtures, and storage
-- Components Being Added:
-- Vanities:
-- 1. Vanity 60cm
-- 2. Vanity 80cm
-- 3. Vanity 100cm
-- 4. Vanity Double 120cm
-- 5. Vanity Floating 80cm
--
-- Fixtures:
-- 6. Toilet Standard
-- 7. Bathtub 170cm
-- 8. Shower Tray 90cm
-- 9. Shower Enclosure 90cm
--
-- Storage:
-- 10. Bathroom Cabinet 40cm
-- 11. Linen Cupboard 60cm
-- 12. Mirror Cabinet 70cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Vanity 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'vanity-60', 'Vanity 60cm', 'vanity', 'bathroom-vanities', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.85, 0.50,
    'Bathroom vanity 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Basin', 'box', 2, '0', 'height/2 + 0.05', '0',
   'width - 0.10', '0.10', 'depth - 0.10', 'handle', '#FFFFFF', null);

  -- Vanity 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'vanity-80', 'Vanity 80cm', 'vanity', 'bathroom-vanities', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.85, 0.50,
    'Bathroom vanity 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Basin', 'box', 2, '0', 'height/2 + 0.05', '0',
   'width - 0.10', '0.10', 'depth - 0.10', 'handle', '#FFFFFF', null);

  -- Vanity 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'vanity-100', 'Vanity 100cm', 'vanity', 'bathroom-vanities', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 0.85, 0.50,
    'Bathroom vanity 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Basin', 'box', 2, '0', 'height/2 + 0.05', '0',
   'width - 0.10', '0.10', 'depth - 0.10', 'handle', '#FFFFFF', null);

  -- Vanity Double 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'vanity-double-120', 'Vanity Double 120cm', 'vanity', 'bathroom-vanities', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.85, 0.50,
    'Double basin vanity 120cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Left Basin', 'box', 2, '-width/4', 'height/2 + 0.05', '0',
   'width/2 - 0.10', '0.10', 'depth - 0.10', 'handle', '#FFFFFF', null),
  (v_model_id, 'Right Basin', 'box', 3, 'width/4', 'height/2 + 0.05', '0',
   'width/2 - 0.10', '0.10', 'depth - 0.10', 'handle', '#FFFFFF', null);

  -- Vanity Floating 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'vanity-floating-80', 'Vanity Floating 80cm', 'vanity', 'bathroom-vanities', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.50, 0.50,
    'Wall-mounted floating vanity'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Basin', 'box', 2, '0', 'height/2 + 0.05', '0',
   'width - 0.10', '0.10', 'depth - 0.10', 'handle', '#FFFFFF', null);

  -- Toilet Standard
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'toilet-standard', 'Toilet Standard', 'toilet', 'bathroom-fixtures', 'standard',
    false, true, true, 90, 270, 0, 180, 0.40, 0.75, 0.65,
    'Standard toilet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Bowl', 'box', 1, '0', '-height * 0.1', '0.05',
   'width', 'height * 0.6', 'depth * 0.7', 'handle', '#FFFFFF', null),
  (v_model_id, 'Tank', 'box', 2, '0', 'height * 0.15', '-depth * 0.25',
   'width * 0.8', 'height * 0.5', 'depth * 0.3', 'handle', '#FFFFFF', null);

  -- Bathtub 170cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'bathtub-170', 'Bathtub 170cm', 'bathtub', 'bathroom-fixtures', 'standard',
    false, true, true, 90, 270, 0, 180, 1.70, 0.55, 0.75,
    'Standard bathtub'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Tub', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'handle', '#FFFFFF', null);

  -- Shower Tray 90cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'shower-tray-90', 'Shower Tray 90cm', 'shower', 'bathroom-fixtures', 'standard',
    false, true, true, 90, 270, 0, 180, 0.90, 0.10, 0.90,
    'Square shower tray'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Tray', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'handle', '#FFFFFF', null);

  -- Shower Enclosure 90cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'shower-enclosure-90', 'Shower Enclosure 90cm', 'shower', 'bathroom-fixtures', 'standard',
    false, true, true, 90, 270, 0, 180, 0.90, 2.00, 0.90,
    'Glass shower enclosure'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Tray', 'box', 1, '0', '-height/2 + 0.05', '0',
   'width', '0.10', 'depth', 'handle', '#FFFFFF', null),
  (v_model_id, 'Glass', 'box', 2, '0', 'height * 0.05', 'depth/2',
   'width', 'height * 0.9', '0.01', 'handle', '#E6E6FA', null);

  -- Bathroom Cabinet 40cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'bathroom-cabinet-40', 'Bathroom Cabinet 40cm', 'cabinet', 'bathroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.40, 0.60, 0.30,
    'Wall-mounted bathroom cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', '#FFFFFF', null);

  -- Linen Cupboard 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'linen-cupboard-60', 'Linen Cupboard 60cm', 'cabinet', 'bathroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 1.80, 0.40,
    'Tall linen storage cupboard'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', '#FFFFFF', null);

  -- Mirror Cabinet 70cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'mirror-cabinet-70', 'Mirror Cabinet 70cm', 'cabinet', 'bathroom-storage', 'standard',
    false, true, true, 90, 270, 0, 180, 0.70, 0.80, 0.15,
    'Mirror-fronted bathroom cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cabinet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', '#F5F5DC', null),
  (v_model_id, 'Mirror', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.01', 'handle', '#C0C0C0', null);

  RAISE NOTICE 'Successfully populated 12 bathroom components';
END $$;
