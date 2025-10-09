-- ================================================================
-- Week 34: Data Population (Universal Components)
-- ================================================================
-- Purpose: Populate universal components (doors, windows)
-- Components Being Added:
-- Internal Doors:
-- 1. Single Door 70cm
-- 2. Single Door 80cm
-- 3. Single Door 90cm
-- 4. Double Door 120cm
-- 5. Double Door 140cm
-- 6. Sliding Door Single 80cm
-- 7. Sliding Door Double 160cm
-- 8. Bi-Fold Door 80cm
--
-- External Doors:
-- 9. Front Door 90cm
-- 10. French Doors 180cm
-- 11. Patio Door Single 90cm
-- 12. Patio Door Double 180cm
--
-- Windows:
-- 13. Window Single 60cm
-- 14. Window Single 80cm
-- 15. Window Single 100cm
-- 16. Window Double 120cm
-- 17. Window Double 150cm
-- 18. Window Bay 240cm
-- 19. Skylight 80x120cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Single Door 70cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-single-70', 'Single Door 70cm', 'door', 'doors-internal', 'standard',
    false, true, true, 90, 270, 0, 180, 0.70, 2.00, 0.05,
    'Internal single door 70cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Door Panel', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Handle', 'box', 2, 'width/2 - 0.05', '0', 'depth/2 + 0.03',
   '0.03', '0.15', '0.05', 'handle', '#C0C0C0', null);

  -- Single Door 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-single-80', 'Single Door 80cm', 'door', 'doors-internal', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 2.00, 0.05,
    'Internal single door 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Door Panel', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Handle', 'box', 2, 'width/2 - 0.05', '0', 'depth/2 + 0.03',
   '0.03', '0.15', '0.05', 'handle', '#C0C0C0', null);

  -- Single Door 90cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-single-90', 'Single Door 90cm', 'door', 'doors-internal', 'standard',
    false, true, true, 90, 270, 0, 180, 0.90, 2.00, 0.05,
    'Internal single door 90cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Door Panel', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Handle', 'box', 2, 'width/2 - 0.05', '0', 'depth/2 + 0.03',
   '0.03', '0.15', '0.05', 'handle', '#C0C0C0', null);

  -- Double Door 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-double-120', 'Double Door 120cm', 'door', 'doors-internal', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 2.00, 0.05,
    'Internal double door 120cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Left Panel', 'box', 1, '-width/4', '0', '0',
   'width/2 - 0.01', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Right Panel', 'box', 2, 'width/4', '0', '0',
   'width/2 - 0.01', 'height', 'depth', 'door', 'doorColor', null);

  -- Double Door 140cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-double-140', 'Double Door 140cm', 'door', 'doors-internal', 'standard',
    false, true, true, 90, 270, 0, 180, 1.40, 2.00, 0.05,
    'Internal double door 140cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Left Panel', 'box', 1, '-width/4', '0', '0',
   'width/2 - 0.01', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Right Panel', 'box', 2, 'width/4', '0', '0',
   'width/2 - 0.01', 'height', 'depth', 'door', 'doorColor', null);

  -- Sliding Door Single 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-sliding-single-80', 'Sliding Door Single 80cm', 'door', 'doors-internal', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 2.00, 0.05,
    'Single sliding door'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Door Panel', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Track', 'box', 2, '0', 'height/2 + 0.05', '0',
   'width', '0.03', 'depth + 0.05', 'handle', '#808080', null);

  -- Sliding Door Double 160cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-sliding-double-160', 'Sliding Door Double 160cm', 'door', 'doors-internal', 'standard',
    false, true, true, 90, 270, 0, 180, 1.60, 2.00, 0.05,
    'Double sliding door'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Left Panel', 'box', 1, '-width/4', '0', '0',
   'width/2 - 0.01', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Right Panel', 'box', 2, 'width/4', '0', '0',
   'width/2 - 0.01', 'height', 'depth', 'door', 'doorColor', null);

  -- Bi-Fold Door 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-bifold-80', 'Bi-Fold Door 80cm', 'door', 'doors-internal', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 2.00, 0.05,
    'Bi-fold door'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Left Panel', 'box', 1, '-width/4', '0', '0',
   'width/2 - 0.01', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Right Panel', 'box', 2, 'width/4', '0', '0',
   'width/2 - 0.01', 'height', 'depth', 'door', 'doorColor', null);

  -- Front Door 90cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-front-90', 'Front Door 90cm', 'door', 'doors-external', 'standard',
    false, true, true, 90, 270, 0, 180, 0.90, 2.10, 0.08,
    'External front door'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Door Panel', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Handle', 'box', 2, 'width/2 - 0.05', '0', 'depth/2 + 0.03',
   '0.03', '0.15', '0.05', 'handle', '#DAA520', null);

  -- French Doors 180cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-french-180', 'French Doors 180cm', 'door', 'doors-external', 'standard',
    false, true, true, 90, 270, 0, 180, 1.80, 2.10, 0.08,
    'French doors with glass'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Left Panel', 'box', 1, '-width/4', '0', '0',
   'width/2 - 0.01', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Right Panel', 'box', 2, 'width/4', '0', '0',
   'width/2 - 0.01', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Left Glass', 'box', 3, '-width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.10', 'height - 0.40', '0.01', 'handle', '#E6E6FA', null),
  (v_model_id, 'Right Glass', 'box', 4, 'width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.10', 'height - 0.40', '0.01', 'handle', '#E6E6FA', null);

  -- Patio Door Single 90cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-patio-single-90', 'Patio Door Single 90cm', 'door', 'doors-external', 'standard',
    false, true, true, 90, 270, 0, 180, 0.90, 2.10, 0.08,
    'Single patio sliding door'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Frame', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Glass', 'box', 2, '0', '0', 'depth/2 + 0.01',
   'width - 0.10', 'height - 0.10', '0.01', 'handle', '#E6E6FA', null);

  -- Patio Door Double 180cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'door-patio-double-180', 'Patio Door Double 180cm', 'door', 'doors-external', 'standard',
    false, true, true, 90, 270, 0, 180, 1.80, 2.10, 0.08,
    'Double patio sliding door'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Frame', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', 'doorColor', null),
  (v_model_id, 'Left Glass', 'box', 2, '-width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.10', 'height - 0.10', '0.01', 'handle', '#E6E6FA', null),
  (v_model_id, 'Right Glass', 'box', 3, 'width/4', '0', 'depth/2 + 0.01',
   'width/2 - 0.10', 'height - 0.10', '0.01', 'handle', '#E6E6FA', null);

  -- Window Single 60cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'window-single-60', 'Window Single 60cm', 'window', 'windows', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 1.20, 0.12,
    'Single pane window 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Frame', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#FFFFFF', null),
  (v_model_id, 'Glass', 'box', 2, '0', '0', '0',
   'width - 0.10', 'height - 0.10', 'depth * 0.5', 'handle', '#E6E6FA', null);

  -- Window Single 80cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'window-single-80', 'Window Single 80cm', 'window', 'windows', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 1.20, 0.12,
    'Single pane window 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Frame', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#FFFFFF', null),
  (v_model_id, 'Glass', 'box', 2, '0', '0', '0',
   'width - 0.10', 'height - 0.10', 'depth * 0.5', 'handle', '#E6E6FA', null);

  -- Window Single 100cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'window-single-100', 'Window Single 100cm', 'window', 'windows', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 1.20, 0.12,
    'Single pane window 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Frame', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#FFFFFF', null),
  (v_model_id, 'Glass', 'box', 2, '0', '0', '0',
   'width - 0.10', 'height - 0.10', 'depth * 0.5', 'handle', '#E6E6FA', null);

  -- Window Double 120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'window-double-120', 'Window Double 120cm', 'window', 'windows', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 1.20, 0.12,
    'Double pane window 120cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Frame', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#FFFFFF', null),
  (v_model_id, 'Left Glass', 'box', 2, '-width/4', '0', '0',
   'width/2 - 0.10', 'height - 0.10', 'depth * 0.5', 'handle', '#E6E6FA', null),
  (v_model_id, 'Right Glass', 'box', 3, 'width/4', '0', '0',
   'width/2 - 0.10', 'height - 0.10', 'depth * 0.5', 'handle', '#E6E6FA', null);

  -- Window Double 150cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'window-double-150', 'Window Double 150cm', 'window', 'windows', 'standard',
    false, true, true, 90, 270, 0, 180, 1.50, 1.40, 0.12,
    'Double pane window 150cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Frame', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#FFFFFF', null),
  (v_model_id, 'Left Glass', 'box', 2, '-width/4', '0', '0',
   'width/2 - 0.10', 'height - 0.10', 'depth * 0.5', 'handle', '#E6E6FA', null),
  (v_model_id, 'Right Glass', 'box', 3, 'width/4', '0', '0',
   'width/2 - 0.10', 'height - 0.10', 'depth * 0.5', 'handle', '#E6E6FA', null);

  -- Window Bay 240cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'window-bay-240', 'Window Bay 240cm', 'window', 'windows', 'standard',
    false, true, true, 90, 270, 0, 180, 2.40, 1.50, 0.60,
    'Bay window with angled sides'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Center Frame', 'box', 1, '0', '0', 'depth * 0.15',
   'width * 0.5', 'height', '0.12', 'door', '#FFFFFF', null),
  (v_model_id, 'Center Glass', 'box', 2, '0', '0', 'depth * 0.15',
   'width * 0.5 - 0.10', 'height - 0.10', '0.06', 'handle', '#E6E6FA', null);

  -- Skylight 80x120cm
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'skylight-80x120', 'Skylight 80x120cm', 'window', 'windows', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.10, 1.20,
    'Roof skylight window'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Frame', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#FFFFFF', null),
  (v_model_id, 'Glass', 'box', 2, '0', '0', '0',
   'width - 0.10', 'height * 0.5', 'depth - 0.10', 'handle', '#E6E6FA', null);

  RAISE NOTICE 'Successfully populated 19 universal components (doors and windows)';
END $$;
