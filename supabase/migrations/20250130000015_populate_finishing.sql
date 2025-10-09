-- ================================================================
-- Week 25: Data Population (P4 - Finishing)
-- ================================================================
-- Purpose: Populate finishing components (cornice, pelmet, end panels)
-- Feature Flag: use_dynamic_3d_models
-- Status: Week 25 - P4 (Priority 4)
--
-- Components Being Added:
-- Cornice:
-- 1. Cornice 60cm
-- 2. Cornice 80cm
-- 3. Cornice 100cm
-- 4. Cornice 120cm
--
-- Pelmet:
-- 5. Pelmet 60cm
-- 6. Pelmet 80cm
-- 7. Pelmet 100cm
-- 8. Pelmet 120cm
--
-- End Panels:
-- 9. End Panel Base (90cm high)
-- 10. End Panel Wall (60cm high)
-- 11. End Panel Tall (200cm high)
--
-- Cornice/Pelmet: Height = 10cm, Depth = 10cm, Width = variable
-- End Panels: Height = variable, Depth = 2cm (thickness), Width = 60cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- ============================================================
  -- CORNICE 60CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'cornice-60', 'Cornice 60cm', 'cornice', 'finishing', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.10, 0.10,
    'Decorative cornice 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cornice', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#ffffff', null);

  -- ============================================================
  -- CORNICE 80CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'cornice-80', 'Cornice 80cm', 'cornice', 'finishing', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.10, 0.10,
    'Decorative cornice 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cornice', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#ffffff', null);

  -- ============================================================
  -- CORNICE 100CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'cornice-100', 'Cornice 100cm', 'cornice', 'finishing', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 0.10, 0.10,
    'Decorative cornice 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cornice', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#ffffff', null);

  -- ============================================================
  -- CORNICE 120CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'cornice-120', 'Cornice 120cm', 'cornice', 'finishing', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.10, 0.10,
    'Decorative cornice 120cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Cornice', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#ffffff', null);

  -- ============================================================
  -- PELMET 60CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'pelmet-60', 'Pelmet 60cm', 'pelmet', 'finishing', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.10, 0.10,
    'Decorative pelmet 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Pelmet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#ffffff', null);

  -- ============================================================
  -- PELMET 80CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'pelmet-80', 'Pelmet 80cm', 'pelmet', 'finishing', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.10, 0.10,
    'Decorative pelmet 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Pelmet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#ffffff', null);

  -- ============================================================
  -- PELMET 100CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'pelmet-100', 'Pelmet 100cm', 'pelmet', 'finishing', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 0.10, 0.10,
    'Decorative pelmet 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Pelmet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#ffffff', null);

  -- ============================================================
  -- PELMET 120CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'pelmet-120', 'Pelmet 120cm', 'pelmet', 'finishing', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.10, 0.10,
    'Decorative pelmet 120cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Pelmet', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', '#ffffff', null);

  -- ============================================================
  -- END PANEL BASE (90cm high)
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'end-panel-base', 'End Panel Base', 'end-panel', 'finishing', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.90, 0.02,
    'End panel for base units'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Panel', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', 'cabinetColor', null);

  -- ============================================================
  -- END PANEL WALL (60cm high)
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'end-panel-wall', 'End Panel Wall', 'end-panel', 'finishing', 'standard',
    false, true, true, 90, 270, 0, 180, 0.40, 0.60, 0.02,
    'End panel for wall units'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Panel', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', 'cabinetColor', null);

  -- ============================================================
  -- END PANEL TALL (200cm high)
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'end-panel-tall', 'End Panel Tall', 'end-panel', 'finishing', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 2.00, 0.02,
    'End panel for tall units'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Panel', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'door', 'cabinetColor', null);

  RAISE NOTICE 'Successfully populated 11 finishing components';
END $$;
