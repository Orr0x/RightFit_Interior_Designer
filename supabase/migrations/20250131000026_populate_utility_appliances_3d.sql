-- ================================================================
-- Utility Appliances 3D Models - Phase 2
-- ================================================================
-- Purpose: Populate washing machine and tumble dryer 3D geometry
-- Feature Flag: use_dynamic_3d_models
-- Status: Phase 2 - Utility/Laundry Appliances
--
-- Components Being Added:
-- 1. Washing Machine (10 parts)
-- 2. Tumble Dryer (11 parts)
--
-- Total: 2 appliance types, 21 geometry parts
--
-- Special Features:
-- - Cylindrical door geometry
-- - Transparent glass windows
-- - Emissive LCD displays
-- - Drum interior (visible through window)
-- - Control panels with buttons
-- ================================================================

-- First, ensure material definitions exist
DO $$
BEGIN
  -- Plastic/appliance panel material
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, description)
  VALUES ('appliance_panel', 'standard', '#f0f0f0', 0.60, 0.30, 'White/light grey appliance panel')
  ON CONFLICT (material_name) DO NOTHING;

  -- Glass material for appliance doors
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, opacity, description)
  VALUES ('appliance_glass', 'standard', '#1a3b57', 0.10, 0.90, 0.70, 'Tinted glass for appliance doors')
  ON CONFLICT (material_name) DO NOTHING;

  -- Metal/drum material
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, description)
  VALUES ('drum_metal', 'standard', '#888888', 0.60, 0.70, 'Metal drum interior')
  ON CONFLICT (material_name) DO NOTHING;

  -- Control panel material
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, description)
  VALUES ('control_panel', 'standard', '#222222', 0.30, 0.60, 'Dark control panel')
  ON CONFLICT (material_name) DO NOTHING;
END $$;

-- ================================================================
-- 1. WASHING MACHINE (10 parts)
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'washing-machine', 'Washing Machine', 'washing-machine', 'utility', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.85, 0.60,
    'Front-load washing machine with round door, drum, and LCD display'
  ) RETURNING id INTO v_model_id;

  -- Part 1: Main Body
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Main Body', 'box', 1,
    '0', '0', '0',
    'width', 'height', 'depth',
    'appliance_panel', '#f0f0f0'
  );

  -- Part 2: Front Panel
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Front Panel', 'box', 2,
    '0', '0', 'depth / 2 + 0.005',
    'width - 0.02', 'height - 0.02', '0.01',
    'appliance_panel', '#f0f0f0'
  );

  -- Part 3: Round Door (cylinder geometry)
  -- Note: Using box for now, will need custom cylinder rendering
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, metalness, roughness
  ) VALUES (
    v_model_id, 'Round Door', 'cylinder', 3,
    '0', '-height * 0.1', 'depth / 2 + 0.01',
    '0.25', '0.02', '0.25',  -- radius_top, height (thickness), radius_bottom
    'handle', '#e0e0e0', 0.6, 0.4
  );

  -- Part 4: Door Window (blue tinted glass)
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, metalness, roughness, opacity
  ) VALUES (
    v_model_id, 'Door Window', 'cylinder', 4,
    '0', '-height * 0.1', 'depth / 2 + 0.015',
    '0.2', '0.01', '0.2',  -- radius_top, height (thickness), radius_bottom
    'appliance_glass', '#1a3b57', 0.9, 0.1, 0.7
  );

  -- Part 5: Drum Interior (visible through glass)
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES (
    v_model_id, 'Drum', 'cylinder', 5,
    '0', '-height * 0.1', 'depth / 2 - 0.05',
    '0.18', '0.2', '0.18',  -- radius_top, depth, radius_bottom
    'drum_metal', '#888888', 'isSelected'  -- Only show when selected
  );

  -- Part 6: Control Panel
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Control Panel', 'box', 6,
    '0', 'height * 0.3', 'depth / 2 + 0.01',
    'width * 0.7', '0.15', '0.005',
    'control_panel', '#222222'
  );

  -- Part 7: LCD Display (emissive blue)
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, metalness, roughness
  ) VALUES (
    v_model_id, 'LCD Display', 'box', 7,
    'width * 0.2', 'height * 0.3', 'depth / 2 + 0.015',
    '0.15', '0.08', '0.001',
    'screen', '#001b2e', 0.9, 0.1
  );

  -- Part 8: Program Dial
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Program Dial', 'cylinder', 8,
    '-width * 0.2', 'height * 0.3', 'depth / 2 + 0.02',
    '0.05', '0.03', '0.05',  -- radius_top, height, radius_bottom
    'handle', '#dddddd'
  );

  -- Part 9: Button 1
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Button 1', 'box', 9,
    '-width * 0.1', 'height * 0.22', 'depth / 2 + 0.015',
    '0.06', '0.02', '0.005',
    'handle', '#444444'
  );

  -- Part 10: Button 2
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Button 2', 'box', 10,
    '0', 'height * 0.22', 'depth / 2 + 0.015',
    '0.06', '0.02', '0.005',
    'handle', '#444444'
  );

  RAISE NOTICE 'Washing Machine created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 2. TUMBLE DRYER (11 parts)
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category, geometry_type,
    is_corner_component, has_direction, auto_rotate_enabled,
    wall_rotation_left, wall_rotation_right, wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'tumble-dryer', 'Tumble Dryer', 'tumble-dryer', 'utility', 'standard',
    false, true, true, 90, 270, 0, 180, 0.60, 0.85, 0.60,
    'Front-load tumble dryer with round door, drum fins, and LCD display'
  ) RETURNING id INTO v_model_id;

  -- Part 1: Main Body
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Main Body', 'box', 1,
    '0', '0', '0',
    'width', 'height', 'depth',
    'appliance_panel', '#e8e8e8'
  );

  -- Part 2: Front Panel
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Front Panel', 'box', 2,
    '0', '0', 'depth / 2 + 0.005',
    'width - 0.02', 'height - 0.02', '0.01',
    'appliance_panel', '#f0f0f0'
  );

  -- Part 3: Round Door
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Round Door', 'cylinder', 3,
    '0', '-height * 0.1', 'depth / 2 + 0.01',
    '0.25', '0.02', '0.25',
    'handle', '#dddddd'
  );

  -- Part 4: Door Window (darker tint than washing machine)
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, metalness, roughness, opacity
  ) VALUES (
    v_model_id, 'Door Window', 'cylinder', 4,
    '0', '-height * 0.1', 'depth / 2 + 0.015',
    '0.2', '0.01', '0.2',
    'screen', '#222222', 0.7, 0.2, 0.8
  );

  -- Part 5: Drum Interior (visible when selected)
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES (
    v_model_id, 'Drum', 'cylinder', 5,
    '0', '-height * 0.1', 'depth / 2 - 0.1',
    '0.18', '0.2', '0.18',
    'drum_metal', '#888888', 'isSelected'
  );

  -- Part 6: Control Panel
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Control Panel', 'box', 6,
    '0', 'height * 0.3', 'depth / 2 + 0.01',
    'width * 0.7', '0.15', '0.005',
    'control_panel', '#222222'
  );

  -- Part 7: Display Screen (emissive green)
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, metalness, roughness
  ) VALUES (
    v_model_id, 'Display Screen', 'box', 7,
    'width * 0.2', 'height * 0.3', 'depth / 2 + 0.015',
    '0.15', '0.08', '0.001',
    'screen', '#001400', 0.9, 0.1
  );

  -- Part 8: Program Selector
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Program Selector', 'cylinder', 8,
    '-width * 0.2', 'height * 0.3', 'depth / 2 + 0.02',
    '0.05', '0.03', '0.05',
    'handle', '#dddddd'
  );

  -- Part 9: Button 1
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Button 1', 'box', 9,
    '-width * 0.1', 'height * 0.22', 'depth / 2 + 0.015',
    '0.06', '0.02', '0.005',
    'handle', '#444444'
  );

  -- Part 10: Button 2
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Button 2', 'box', 10,
    '0', 'height * 0.22', 'depth / 2 + 0.015',
    '0.06', '0.02', '0.005',
    'handle', '#444444'
  );

  -- Part 11: Lint Filter Indicator
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, opacity
  ) VALUES (
    v_model_id, 'Lint Filter', 'box', 11,
    '0', 'height * 0.15', 'depth / 2 + 0.012',
    '0.12', '0.04', '0.002',
    'door', '#ff6b3d', 0.9
  );

  RAISE NOTICE 'Tumble Dryer created with ID: %', v_model_id;
END $$;

-- ================================================================
-- VALIDATION & SUMMARY
-- ================================================================

DO $$
DECLARE
  v_model_count INTEGER;
  v_part_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_model_count
  FROM component_3d_models
  WHERE component_id IN ('washing-machine', 'tumble-dryer');

  SELECT COUNT(*) INTO v_part_count
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id IN ('washing-machine', 'tumble-dryer');

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Migration Complete: Utility Appliances 3D Models';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Models Created: %', v_model_count;
  RAISE NOTICE 'Geometry Parts Created: %', v_part_count;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Components:';
  RAISE NOTICE '  - Washing Machine (10 parts)';
  RAISE NOTICE '  - Tumble Dryer (11 parts)';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Special Features:';
  RAISE NOTICE '  - Cylindrical door geometry';
  RAISE NOTICE '  - Transparent glass windows';
  RAISE NOTICE '  - Emissive LCD displays';
  RAISE NOTICE '  - Drum interior (visible when selected)';
  RAISE NOTICE '  - Control panels with buttons';
  RAISE NOTICE '================================================';

  IF v_model_count != 2 THEN
    RAISE WARNING 'Expected 2 models, got %', v_model_count;
  END IF;

  IF v_part_count != 21 THEN
    RAISE WARNING 'Expected 21 geometry parts, got %', v_part_count;
  END IF;
END $$;
