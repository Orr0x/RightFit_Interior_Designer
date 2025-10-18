-- ================================================================
-- Week 23: Data Population (P3 - Sinks & Counter-tops)
-- ================================================================
-- Purpose: Populate sinks and counter-tops/worktops
-- Feature Flag: use_dynamic_3d_models
-- Status: Week 23 - P3 (Priority 3)
--
-- Components Being Added:
-- 1. Sink 60cm (single bowl)
-- 2. Sink 80cm (double bowl)
-- 3. Sink 100cm (large double bowl)
-- 4. Counter-top 60cm (standard)
-- 5. Counter-top 80cm
-- 6. Counter-top 100cm
-- 7. Counter-top 120cm
--
-- Sinks: Height = 20cm (depth), Width = variable
-- Counter-tops: Height = 4cm (thickness), Width = variable, Depth = 60cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- ============================================================
  -- SINK 60CM (Single Bowl)
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'sink-60', 'Sink 60cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.20, 0.50,
    'Single bowl sink 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Sink Basin
  (v_model_id, 'Sink Basin', 'box', 1, '0', '-0.05', '0',
   'width - 0.10', 'height', 'depth - 0.10', 'handle', '#c0c0c0', null),
  -- Tap
  (v_model_id, 'Tap', 'box', 2, '0', '0.15', '-depth / 4',
   '0.05', '0.20', '0.05', 'handle', '#808080', null);

  -- ============================================================
  -- SINK 80CM (Double Bowl)
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'sink-80', 'Sink 80cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.20, 0.50,
    'Double bowl sink 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Left Bowl
  (v_model_id, 'Left Bowl', 'box', 1, '-width / 4', '-0.05', '0',
   'width / 2 - 0.10', 'height', 'depth - 0.10', 'handle', '#c0c0c0', null),
  -- Right Bowl
  (v_model_id, 'Right Bowl', 'box', 2, 'width / 4', '-0.05', '0',
   'width / 2 - 0.10', 'height', 'depth - 0.10', 'handle', '#c0c0c0', null),
  -- Tap
  (v_model_id, 'Tap', 'box', 3, '0', '0.15', '-depth / 4',
   '0.05', '0.20', '0.05', 'handle', '#808080', null);

  -- ============================================================
  -- SINK 100CM (Large Double Bowl)
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'sink-100', 'Sink 100cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 0.20, 0.50,
    'Large double bowl sink 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Left Bowl
  (v_model_id, 'Left Bowl', 'box', 1, '-width / 4', '-0.05', '0',
   'width / 2 - 0.10', 'height', 'depth - 0.10', 'handle', '#c0c0c0', null),
  -- Right Bowl
  (v_model_id, 'Right Bowl', 'box', 2, 'width / 4', '-0.05', '0',
   'width / 2 - 0.10', 'height', 'depth - 0.10', 'handle', '#c0c0c0', null),
  -- Tap
  (v_model_id, 'Tap', 'box', 3, '0', '0.15', '-depth / 4',
   '0.05', '0.20', '0.05', 'handle', '#808080', null);

  -- ============================================================
  -- COUNTER-TOP 60CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'counter-top-60', 'Counter-top 60cm', 'counter-top', 'worktops', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.04, 0.60,
    'Standard counter-top 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Worktop', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'worktopColor', null);

  -- ============================================================
  -- COUNTER-TOP 80CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'counter-top-80', 'Counter-top 80cm', 'counter-top', 'worktops', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.04, 0.60,
    'Counter-top 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Worktop', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'worktopColor', null);

  -- ============================================================
  -- COUNTER-TOP 100CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'counter-top-100', 'Counter-top 100cm', 'counter-top', 'worktops', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 0.04, 0.60,
    'Counter-top 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Worktop', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'worktopColor', null);

  -- ============================================================
  -- COUNTER-TOP 120CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'counter-top-120', 'Counter-top 120cm', 'counter-top', 'worktops', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.04, 0.60,
    'Counter-top 120cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Worktop', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'worktopColor', null);

  RAISE NOTICE 'Successfully populated 7 sinks and counter-tops';
END $$;
