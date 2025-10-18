-- ================================================================
-- Week 36: Data Population (Specialized Sink Variants)
-- ================================================================
-- Purpose: Populate all specialized sink variants from ComponentService.ts
-- Components Being Added (18 specialized sinks):
--
-- Kitchen Sinks (Worktop Mounted):
-- 1. Kitchen Sink Corner 90cm (L-shaped)
-- 2. Kitchen Sink Farmhouse 60cm (with apron front)
-- 3. Kitchen Sink Farmhouse 80cm
-- 4. Kitchen Sink Undermount 60cm
-- 5. Kitchen Sink Undermount 80cm
-- 6. Kitchen Sink Island 100cm
-- 7. Kitchen Sink Granite 80cm (black composite)
-- 8. Kitchen Sink Copper 60cm (hand-hammered)
-- 9. Kitchen Sink Quartz 80cm (white composite)
--
-- Butler Sinks (Base Unit Mounted):
-- 10. Butler Sink 60cm (white ceramic)
-- 11. Butler Sink 80cm
-- 12. Butler Sink Corner 90cm (L-shaped)
-- 13. Butler Sink Deep 60cm (extra deep)
-- 14. Butler Sink Shallow 60cm (prep work)
--
-- Sinks with Draining Boards:
-- 15. Kitchen Sink Draining Board 80cm
-- 16. Kitchen Sink Draining Board 100cm
-- 17. Butler Sink Draining Board 80cm
--
-- Note: Basic sinks (60, 80, 100cm) already exist in migration 20250130000013
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- ============================================================
  -- Kitchen Sink Corner 90cm (L-shaped)
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    corner_rotation_front_left, corner_rotation_front_right, corner_rotation_back_left, corner_rotation_back_right,
    leg_length, corner_depth_wall, corner_depth_base,
    rotation_center_x, rotation_center_y, rotation_center_z,
    default_width, default_height, default_depth, description
  ) VALUES (
    'kitchen-sink-corner-90', 'Kitchen Sink Corner 90cm', 'sink', 'sinks', 'l_shaped_corner',
    true, true, true, 90, 270, 0, 180, 0, 270, 90, 180,
    0.90, 0.50, 0.60, 'legLength/2', '0', 'legLength/2',
    0.90, 0.20, 0.50, 'L-shaped corner sink 90cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin Leg 1', 'box', 1, 'legLength/2', '0', '0',
   'legLength - 0.10', 'height', 'depth - 0.10', 'handle', '#c0c0c0', null),
  (v_model_id, 'Basin Leg 2', 'box', 2, '0', '0', 'legLength/2',
   'depth - 0.10', 'height', 'legLength - 0.10', 'handle', '#c0c0c0', null),
  (v_model_id, 'Tap', 'box', 3, 'legLength * 0.4', 'height + 0.10', '0',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Kitchen Sink Farmhouse 60cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'kitchen-sink-farmhouse-60', 'Kitchen Sink Farmhouse 60cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.25, 0.55,
    'Farmhouse sink with apron front 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '0', '0',
   'width - 0.10', 'height * 0.8', 'depth - 0.10', 'handle', '#FFFFFF', null),
  (v_model_id, 'Apron Front', 'box', 2, '0', '-height * 0.1', 'depth/2 + 0.01',
   'width', 'height', '0.03', 'door', '#FFFFFF', null),
  (v_model_id, 'Tap', 'box', 3, '0', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Kitchen Sink Farmhouse 80cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'kitchen-sink-farmhouse-80', 'Kitchen Sink Farmhouse 80cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.25, 0.55,
    'Farmhouse sink with apron front 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '0', '0',
   'width - 0.10', 'height * 0.8', 'depth - 0.10', 'handle', '#FFFFFF', null),
  (v_model_id, 'Apron Front', 'box', 2, '0', '-height * 0.1', 'depth/2 + 0.01',
   'width', 'height', '0.03', 'door', '#FFFFFF', null),
  (v_model_id, 'Tap', 'box', 3, '0', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Kitchen Sink Undermount 60cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'kitchen-sink-undermount-60', 'Kitchen Sink Undermount 60cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.18, 0.50,
    'Undermount sink 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '-height * 0.2', '0',
   'width - 0.10', 'height', 'depth - 0.10', 'handle', '#c0c0c0', null),
  (v_model_id, 'Tap', 'box', 2, '0', 'height + 0.05', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Kitchen Sink Undermount 80cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'kitchen-sink-undermount-80', 'Kitchen Sink Undermount 80cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.18, 0.50,
    'Undermount sink 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '-height * 0.2', '0',
   'width - 0.10', 'height', 'depth - 0.10', 'handle', '#c0c0c0', null),
  (v_model_id, 'Tap', 'box', 2, '0', 'height + 0.05', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Kitchen Sink Island 100cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'kitchen-sink-island-100', 'Kitchen Sink Island 100cm', 'sink', 'sinks', 'standard',
    false, false, false, 0, 0, 0, 0, 1.00, 0.20, 0.50,
    'Island sink for freestanding units 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '0', '0',
   'width - 0.10', 'height', 'depth - 0.10', 'handle', '#c0c0c0', null),
  (v_model_id, 'Tap', 'box', 2, '0', 'height + 0.10', '0',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Kitchen Sink Granite 80cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'kitchen-sink-granite-80', 'Kitchen Sink Granite 80cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.20, 0.50,
    'Black granite composite sink 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '0', '0',
   'width - 0.10', 'height', 'depth - 0.10', 'handle', '#2F4F4F', null),
  (v_model_id, 'Tap', 'box', 2, '0', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Kitchen Sink Copper 60cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'kitchen-sink-copper-60', 'Kitchen Sink Copper 60cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.20, 0.50,
    'Hand-hammered copper sink 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '0', '0',
   'width - 0.10', 'height', 'depth - 0.10', 'handle', '#B87333', null),
  (v_model_id, 'Tap', 'box', 2, '0', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#B87333', null);

  -- ============================================================
  -- Kitchen Sink Quartz 80cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'kitchen-sink-quartz-80', 'Kitchen Sink Quartz 80cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.20, 0.50,
    'White quartz composite sink 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '0', '0',
   'width - 0.10', 'height', 'depth - 0.10', 'handle', '#F8F8F8', null),
  (v_model_id, 'Tap', 'box', 2, '0', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Butler Sink 60cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'butler-sink-60', 'Butler Sink 60cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.25, 0.50,
    'White ceramic butler sink 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '0', '0',
   'width - 0.10', 'height', 'depth - 0.10', 'handle', '#FFFFFF', null),
  (v_model_id, 'Tap', 'box', 2, '0', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Butler Sink 80cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'butler-sink-80', 'Butler Sink 80cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.25, 0.50,
    'White ceramic butler sink 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '0', '0',
   'width - 0.10', 'height', 'depth - 0.10', 'handle', '#FFFFFF', null),
  (v_model_id, 'Tap', 'box', 2, '0', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Butler Sink Corner 90cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    corner_rotation_front_left, corner_rotation_front_right, corner_rotation_back_left, corner_rotation_back_right,
    leg_length, corner_depth_wall, corner_depth_base,
    rotation_center_x, rotation_center_y, rotation_center_z,
    default_width, default_height, default_depth, description
  ) VALUES (
    'butler-sink-corner-90', 'Butler Sink Corner 90cm', 'sink', 'sinks', 'l_shaped_corner',
    true, true, true, 90, 270, 0, 180, 0, 270, 90, 180,
    0.90, 0.50, 0.60, 'legLength/2', '0', 'legLength/2',
    0.90, 0.25, 0.50, 'L-shaped corner butler sink 90cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin Leg 1', 'box', 1, 'legLength/2', '0', '0',
   'legLength - 0.10', 'height', 'depth - 0.10', 'handle', '#FFFFFF', null),
  (v_model_id, 'Basin Leg 2', 'box', 2, '0', '0', 'legLength/2',
   'depth - 0.10', 'height', 'legLength - 0.10', 'handle', '#FFFFFF', null),
  (v_model_id, 'Tap', 'box', 3, 'legLength * 0.4', 'height + 0.10', '0',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Butler Sink Deep 60cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'butler-sink-deep-60', 'Butler Sink Deep 60cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.30, 0.50,
    'Extra deep butler sink for heavy duty 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '0', '0',
   'width - 0.10', 'height', 'depth - 0.10', 'handle', '#FFFFFF', null),
  (v_model_id, 'Tap', 'box', 2, '0', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Butler Sink Shallow 60cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'butler-sink-shallow-60', 'Butler Sink Shallow 60cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.18, 0.50,
    'Shallow butler sink for prep work 60cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '0', '0', '0',
   'width - 0.10', 'height', 'depth - 0.10', 'handle', '#FFFFFF', null),
  (v_model_id, 'Tap', 'box', 2, '0', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Kitchen Sink Draining Board 80cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'kitchen-sink-draining-board-80', 'Kitchen Sink Draining Board 80cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.20, 0.50,
    'Kitchen sink with draining board 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '-width/4', '0', '0',
   'width * 0.4', 'height', 'depth - 0.10', 'handle', '#c0c0c0', null),
  (v_model_id, 'Draining Board', 'box', 2, 'width/4', '-height * 0.3', '0',
   'width * 0.4', 'height * 0.5', 'depth - 0.10', 'counter', '#c0c0c0', null),
  (v_model_id, 'Tap', 'box', 3, '-width/4', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Kitchen Sink Draining Board 100cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'kitchen-sink-draining-board-100', 'Kitchen Sink Draining Board 100cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 0.20, 0.50,
    'Kitchen sink with draining board 100cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '-width/4', '0', '0',
   'width * 0.4', 'height', 'depth - 0.10', 'handle', '#c0c0c0', null),
  (v_model_id, 'Draining Board', 'box', 2, 'width/4', '-height * 0.3', '0',
   'width * 0.4', 'height * 0.5', 'depth - 0.10', 'counter', '#c0c0c0', null),
  (v_model_id, 'Tap', 'box', 3, '-width/4', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  -- ============================================================
  -- Butler Sink Draining Board 80cm
  -- ============================================================
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'butler-sink-draining-board-80', 'Butler Sink Draining Board 80cm', 'sink', 'sinks', 'standard',
    false, true, true, 90, 270, 0, 180, 0.80, 0.25, 0.50,
    'Butler sink with draining board 80cm'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  (v_model_id, 'Basin', 'box', 1, '-width/4', '0', '0',
   'width * 0.4', 'height', 'depth - 0.10', 'handle', '#FFFFFF', null),
  (v_model_id, 'Draining Board', 'box', 2, 'width/4', '-height * 0.3', '0',
   'width * 0.4', 'height * 0.5', 'depth - 0.10', 'counter', '#FFFFFF', null),
  (v_model_id, 'Tap', 'box', 3, '-width/4', 'height + 0.10', '-depth/4',
   '0.03', '0.15', '0.03', 'handle', '#808080', null);

  RAISE NOTICE 'Successfully populated 17 specialized sink variants';
END $$;
