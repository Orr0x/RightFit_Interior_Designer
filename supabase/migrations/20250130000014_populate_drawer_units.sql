-- ================================================================
-- Week 24: Data Population (P2 - Drawer Units)
-- ================================================================
-- Purpose: Populate drawer units (pan drawers)
-- Feature Flag: use_dynamic_3d_models
-- Status: Week 24 - P2
--
-- Components Being Added:
-- 1. Pan Drawers 30cm
-- 2. Pan Drawers 40cm
-- 3. Pan Drawers 50cm
-- 4. Pan Drawers 60cm
-- 5. Pan Drawers 80cm
-- 6. Pan Drawers 100cm
--
-- All drawer units: Height = 90cm, Depth = 60cm, Width = variable
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- ============================================================
  -- PAN DRAWERS 30CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'pan-drawers-30', 'Pan Drawers 30cm', 'drawer-unit', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.30, 0.90, 0.60,
    'Narrow 30cm pan drawer unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 2, '0', '0.075', '0',
   'width', 'height - 0.15', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Drawer Front 1
  (v_model_id, 'Drawer 1', 'box', 3, '0', '-0.15', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 2
  (v_model_id, 'Drawer 2', 'box', 4, '0', '0.10', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 3
  (v_model_id, 'Drawer 3', 'box', 5, '0', '0.35', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null);

  -- ============================================================
  -- PAN DRAWERS 40CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'pan-drawers-40', 'Pan Drawers 40cm', 'drawer-unit', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.40, 0.90, 0.60,
    'Compact 40cm pan drawer unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 2, '0', '0.075', '0',
   'width', 'height - 0.15', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Drawer Front 1
  (v_model_id, 'Drawer 1', 'box', 3, '0', '-0.15', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 2
  (v_model_id, 'Drawer 2', 'box', 4, '0', '0.10', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 3
  (v_model_id, 'Drawer 3', 'box', 5, '0', '0.35', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null);

  -- ============================================================
  -- PAN DRAWERS 50CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'pan-drawers-50', 'Pan Drawers 50cm', 'drawer-unit', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.50, 0.90, 0.60,
    'Medium 50cm pan drawer unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 2, '0', '0.075', '0',
   'width', 'height - 0.15', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Drawer Front 1
  (v_model_id, 'Drawer 1', 'box', 3, '0', '-0.15', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 2
  (v_model_id, 'Drawer 2', 'box', 4, '0', '0.10', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 3
  (v_model_id, 'Drawer 3', 'box', 5, '0', '0.35', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null);

  -- ============================================================
  -- PAN DRAWERS 60CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'pan-drawers-60', 'Pan Drawers 60cm', 'drawer-unit', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.90, 0.60,
    'Standard 60cm pan drawer unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 2, '0', '0.075', '0',
   'width', 'height - 0.15', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Drawer Front 1
  (v_model_id, 'Drawer 1', 'box', 3, '0', '-0.15', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 2
  (v_model_id, 'Drawer 2', 'box', 4, '0', '0.10', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 3
  (v_model_id, 'Drawer 3', 'box', 5, '0', '0.35', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null);

  -- ============================================================
  -- PAN DRAWERS 80CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'pan-drawers-80', 'Pan Drawers 80cm', 'drawer-unit', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.90, 0.60,
    'Wide 80cm pan drawer unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 2, '0', '0.075', '0',
   'width', 'height - 0.15', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Drawer Front 1
  (v_model_id, 'Drawer 1', 'box', 3, '0', '-0.15', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 2
  (v_model_id, 'Drawer 2', 'box', 4, '0', '0.10', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 3
  (v_model_id, 'Drawer 3', 'box', 5, '0', '0.35', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null);

  -- ============================================================
  -- PAN DRAWERS 100CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'pan-drawers-100', 'Pan Drawers 100cm', 'drawer-unit', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 0.90, 0.60,
    'Extra wide 100cm pan drawer unit'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth
  (v_model_id, 'Plinth', 'box', 1, '0', '-height / 2 + 0.075', '0',
   'width', '0.15', 'depth - 0.05', 'plinth', 'plinthColor', null),
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 2, '0', '0.075', '0',
   'width', 'height - 0.15', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Drawer Front 1
  (v_model_id, 'Drawer 1', 'box', 3, '0', '-0.15', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 2
  (v_model_id, 'Drawer 2', 'box', 4, '0', '0.10', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null),
  -- Drawer Front 3
  (v_model_id, 'Drawer 3', 'box', 5, '0', '0.35', 'depth / 2 + 0.01',
   'width - 0.02', '0.20', '0.02', 'door', 'doorColor', null);

  RAISE NOTICE 'Successfully populated 6 drawer units';
END $$;
