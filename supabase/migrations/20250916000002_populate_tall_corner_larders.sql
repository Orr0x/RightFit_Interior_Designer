-- ================================================================
-- Week 35: Data Population (Tall Corner Larder Units)
-- ================================================================
-- Purpose: Populate missing tall corner larder units
-- Components Being Added:
-- 1. Tall Corner Larder 60cm
-- 2. Tall Corner Larder 90cm
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Tall Corner Larder 60cm
  -- Check if component already exists
  SELECT id INTO v_model_id FROM component_3d_models WHERE component_id = 'larder-corner-unit-60';

  IF v_model_id IS NULL THEN
    INSERT INTO component_3d_models (
      component_id, component_name, component_type, category, geometry_type,
      is_corner_component, has_direction, auto_rotate_enabled,
      wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
      corner_rotation_front_left, corner_rotation_front_right, corner_rotation_back_left, corner_rotation_back_right,
      leg_length, corner_depth_wall, corner_depth_base,
      rotation_center_x, rotation_center_y, rotation_center_z,
      default_width, default_height, default_depth, description
    ) VALUES (
      'larder-corner-unit-60', 'Tall Corner Larder 60cm', 'tall-unit', 'cabinets', 'l_shaped_corner',
      true, true, true, 90, 270, 0, 180, 0, 270, 90, 180,
      0.60, 0.60, 0.60, 'legLength/2', '0', 'legLength/2',
      0.60, 2.00, 0.60, 'L-shaped tall corner larder unit with 60cm legs'
    ) RETURNING id INTO v_model_id;

    INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth - Leg 1 (horizontal)
  (v_model_id, 'Plinth Leg 1', 'box', 1, 'legLength/2', '-height / 2 + plinthHeight / 2', '0.05',
   'legLength', 'plinthHeight', 'depth - 0.10', 'plinth', 'plinthColor', '!isWallCabinet'),

  -- Plinth - Leg 2 (vertical)
  (v_model_id, 'Plinth Leg 2', 'box', 2, '0.05', '-height / 2 + plinthHeight / 2', 'legLength/2',
   'depth - 0.10', 'plinthHeight', 'legLength', 'plinth', 'plinthColor', '!isWallCabinet'),

  -- Cabinet Body - Leg 1 (horizontal)
  (v_model_id, 'Cabinet Body Leg 1', 'box', 3, 'legLength/2', 'plinthHeight / 2', '0',
   'legLength', 'height - plinthHeight', 'depth', 'cabinet_body', 'cabinetColor', null),

  -- Cabinet Body - Leg 2 (vertical)
  (v_model_id, 'Cabinet Body Leg 2', 'box', 4, '0', 'plinthHeight / 2', 'legLength/2',
   'depth', 'height - plinthHeight', 'legLength', 'cabinet_body', 'cabinetColor', null),

  -- Door - Leg 1 (horizontal)
  (v_model_id, 'Door Leg 1', 'box', 5, 'legLength/2', 'plinthHeight / 2', 'depth/2 + 0.01',
   'legLength - 0.02', 'height - plinthHeight - 0.02', '0.02', 'door', 'doorColor', null),

  -- Door - Leg 2 (vertical)
  (v_model_id, 'Door Leg 2', 'box', 6, 'depth/2 + 0.01', 'plinthHeight / 2', 'legLength/2',
   '0.02', 'height - plinthHeight - 0.02', 'legLength - 0.02', 'door', 'doorColor', null),

  -- Handle - Leg 1 (horizontal)
  (v_model_id, 'Handle Leg 1', 'box', 7, 'legLength * 0.75', '0', 'depth/2 + 0.03',
   '0.02', '0.15', '0.03', 'handle', 'handleColor', null),

  -- Handle - Leg 2 (vertical)
    (v_model_id, 'Handle Leg 2', 'box', 8, 'depth/2 + 0.03', '0', 'legLength * 0.75',
     '0.03', '0.15', '0.02', 'handle', 'handleColor', null);
  END IF;

  -- Tall Corner Larder 90cm
  -- Check if component already exists
  SELECT id INTO v_model_id FROM component_3d_models WHERE component_id = 'larder-corner-unit-90';

  IF v_model_id IS NULL THEN
    INSERT INTO component_3d_models (
      component_id, component_name, component_type, category, geometry_type,
      is_corner_component, has_direction, auto_rotate_enabled,
      wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
      corner_rotation_front_left, corner_rotation_front_right, corner_rotation_back_left, corner_rotation_back_right,
      leg_length, corner_depth_wall, corner_depth_base,
      rotation_center_x, rotation_center_y, rotation_center_z,
      default_width, default_height, default_depth, description
    ) VALUES (
      'larder-corner-unit-90', 'Tall Corner Larder 90cm', 'tall-unit', 'cabinets', 'l_shaped_corner',
      true, true, true, 90, 270, 0, 180, 0, 270, 90, 180,
      0.90, 0.60, 0.60, 'legLength/2', '0', 'legLength/2',
      0.90, 2.00, 0.60, 'L-shaped tall corner larder unit with 90cm legs'
    ) RETURNING id INTO v_model_id;

    INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
  -- Plinth - Leg 1 (horizontal)
  (v_model_id, 'Plinth Leg 1', 'box', 1, 'legLength/2', '-height / 2 + plinthHeight / 2', '0.05',
   'legLength', 'plinthHeight', 'depth - 0.10', 'plinth', 'plinthColor', '!isWallCabinet'),

  -- Plinth - Leg 2 (vertical)
  (v_model_id, 'Plinth Leg 2', 'box', 2, '0.05', '-height / 2 + plinthHeight / 2', 'legLength/2',
   'depth - 0.10', 'plinthHeight', 'legLength', 'plinth', 'plinthColor', '!isWallCabinet'),

  -- Cabinet Body - Leg 1 (horizontal)
  (v_model_id, 'Cabinet Body Leg 1', 'box', 3, 'legLength/2', 'plinthHeight / 2', '0',
   'legLength', 'height - plinthHeight', 'depth', 'cabinet_body', 'cabinetColor', null),

  -- Cabinet Body - Leg 2 (vertical)
  (v_model_id, 'Cabinet Body Leg 2', 'box', 4, '0', 'plinthHeight / 2', 'legLength/2',
   'depth', 'height - plinthHeight', 'legLength', 'cabinet_body', 'cabinetColor', null),

  -- Door - Leg 1 (horizontal)
  (v_model_id, 'Door Leg 1', 'box', 5, 'legLength/2', 'plinthHeight / 2', 'depth/2 + 0.01',
   'legLength - 0.02', 'height - plinthHeight - 0.02', '0.02', 'door', 'doorColor', null),

  -- Door - Leg 2 (vertical)
  (v_model_id, 'Door Leg 2', 'box', 6, 'depth/2 + 0.01', 'plinthHeight / 2', 'legLength/2',
   '0.02', 'height - plinthHeight - 0.02', 'legLength - 0.02', 'door', 'doorColor', null),

  -- Handle - Leg 1 (horizontal)
  (v_model_id, 'Handle Leg 1', 'box', 7, 'legLength * 0.75', '0', 'depth/2 + 0.03',
   '0.02', '0.15', '0.03', 'handle', 'handleColor', null),

  -- Handle - Leg 2 (vertical)
    (v_model_id, 'Handle Leg 2', 'box', 8, 'depth/2 + 0.03', '0', 'legLength * 0.75',
     '0.03', '0.15', '0.02', 'handle', 'handleColor', null);
  END IF;

  RAISE NOTICE 'Successfully populated 2 tall corner larder units';
END $$;
