-- ================================================================
-- Week 21: Data Population (P1 - Standard Wall Cabinets)
-- ================================================================
-- Purpose: Populate 5 standard wall cabinet models
-- Feature Flag: use_dynamic_3d_models
-- Status: Week 21 - P1 (Priority 1 - Standard Components)
--
-- Wall Cabinets Being Added:
-- 1. Wall Cabinet 30cm
-- 2. Wall Cabinet 40cm
-- 3. Wall Cabinet 50cm
-- 4. Wall Cabinet 60cm
-- 5. Wall Cabinet 80cm
--
-- Standard Wall Cabinet Structure (3 parts):
-- - Cabinet body: Main body
-- - Door: Front panel with handle
-- - Handle: Door handle
--
-- All cabinets: Height = 60cm, Depth = 40cm, Width = variable
-- No plinth for wall cabinets
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- ============================================================
  -- WALL CABINET 30CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'wall-cabinet-30', 'Wall Cabinet 30cm', 'wall-cabinet', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.30, 0.60, 0.40,
    'Narrow 30cm wall cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Door
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth / 2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  -- Handle
  (v_model_id, 'Handle', 'box', 3, 'width / 2 - 0.06', 'height / 2 - 0.10', 'depth / 2 + 0.03',
   '0.08', '0.03', '0.04', 'handle', 'handleColor', null);

  -- ============================================================
  -- WALL CABINET 40CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'wall-cabinet-40', 'Wall Cabinet 40cm', 'wall-cabinet', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.40, 0.60, 0.40,
    'Compact 40cm wall cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Door
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth / 2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  -- Handle
  (v_model_id, 'Handle', 'box', 3, 'width / 2 - 0.07', 'height / 2 - 0.10', 'depth / 2 + 0.03',
   '0.10', '0.03', '0.04', 'handle', 'handleColor', null);

  -- ============================================================
  -- WALL CABINET 50CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'wall-cabinet-50', 'Wall Cabinet 50cm', 'wall-cabinet', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.50, 0.60, 0.40,
    'Medium 50cm wall cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Door
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth / 2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  -- Handle
  (v_model_id, 'Handle', 'box', 3, 'width / 2 - 0.08', 'height / 2 - 0.10', 'depth / 2 + 0.03',
   '0.12', '0.03', '0.04', 'handle', 'handleColor', null);

  -- ============================================================
  -- WALL CABINET 60CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'wall-cabinet-60', 'Wall Cabinet 60cm', 'wall-cabinet', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.60, 0.40,
    'Standard 60cm wall cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Door
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth / 2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  -- Handle
  (v_model_id, 'Handle', 'box', 3, 'width / 2 - 0.09', 'height / 2 - 0.10', 'depth / 2 + 0.03',
   '0.14', '0.03', '0.04', 'handle', 'handleColor', null);

  -- ============================================================
  -- WALL CABINET 80CM
  -- ============================================================

  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'wall-cabinet-80', 'Wall Cabinet 80cm', 'wall-cabinet', 'cabinets', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.60, 0.40,
    'Wide 80cm wall cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Cabinet Body
  (v_model_id, 'Cabinet Body', 'box', 1, '0', '0', '0',
   'width', 'height', 'depth', 'cabinet_body', 'cabinetColor', null),
  -- Door
  (v_model_id, 'Door', 'box', 2, '0', '0', 'depth / 2 + 0.01',
   'width - 0.02', 'height - 0.02', '0.02', 'door', 'doorColor', null),
  -- Handle
  (v_model_id, 'Handle', 'box', 3, 'width / 2 - 0.11', 'height / 2 - 0.10', 'depth / 2 + 0.03',
   '0.18', '0.03', '0.04', 'handle', 'handleColor', null);

  RAISE NOTICE 'Successfully populated 5 wall cabinet models';
END $$;
