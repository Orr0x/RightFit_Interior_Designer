-- ================================================================
-- Multi-Room Furniture 3D Models - Phase 1
-- ================================================================
-- Purpose: Populate living room and bedroom furniture 3D geometry
-- Feature Flag: use_dynamic_3d_models
-- Status: Phase 1 - Living Room & Bedroom Furniture
--
-- Components Being Added:
-- Living Room:
-- 1. Sofa (6 parts)
-- 2. Chair (6 parts)
-- 3. Table (5 parts)
-- 4. TV (4 parts)
--
-- Bedroom:
-- 5. Bed (5 parts)
--
-- Total: 5 furniture types, 26 geometry parts
-- ================================================================

-- First, ensure material definitions exist
DO $$
BEGIN
  -- Fabric material for upholstered furniture
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, description)
  VALUES ('fabric', 'standard', '#3A6EA5', 0.80, 0.00, 'Upholstered fabric for sofas and chairs')
  ON CONFLICT (material_name) DO NOTHING;

  -- Wood material for furniture frames
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, description)
  VALUES ('wood', 'standard', '#8B4513', 0.70, 0.10, 'Wood finish for furniture')
  ON CONFLICT (material_name) DO NOTHING;

  -- Metal legs for furniture
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, description)
  VALUES ('metal_leg', 'standard', '#2F4F4F', 0.40, 0.60, 'Metal legs for chairs and tables')
  ON CONFLICT (material_name) DO NOTHING;

  -- Screen material for TVs
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, description)
  VALUES ('screen', 'standard', '#000000', 0.20, 0.80, 'TV screen material')
  ON CONFLICT (material_name) DO NOTHING;

  -- Mattress material
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, description)
  VALUES ('mattress', 'standard', '#FFFFFF', 0.90, 0.00, 'Mattress material')
  ON CONFLICT (material_name) DO NOTHING;

  -- Cushion material
  INSERT INTO material_definitions (material_name, material_type, default_color, roughness, metalness, description)
  VALUES ('cushion', 'standard', '#4A6F8C', 0.90, 0.00, 'Cushion material')
  ON CONFLICT (material_name) DO NOTHING;
END $$;

-- ================================================================
-- 1. BED (5 parts)
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
    'bed-single', 'Single Bed', 'bed', 'bedroom', 'standard',
    false, true, true, 90, 270, 0, 180, 1.00, 0.50, 2.00,
    'Single bed with frame, mattress, headboard, and pillows'
  ) RETURNING id INTO v_model_id;

  -- Part 1: Bed Frame
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Bed Frame', 'box', 1,
    '0', '-height / 2 + 0.1', '0',  -- frameHeight = 0.2, so center at 0.1
    'width', '0.2', 'depth * 2',      -- bedDepth = depth * 2
    'wood', 'cabinetMaterial'
  );

  -- Part 2: Mattress
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Mattress', 'box', 2,
    '0', '-height / 2 + 0.2 + 0.15', '0',  -- frameHeight + mattressHeight/2
    'width - 0.1', '0.3', 'depth * 2 - 0.1',
    'mattress', '#FFFFFF'
  );

  -- Part 3: Headboard
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Headboard', 'box', 3,
    '0', '0', '-depth + 0.05',  -- bedDepth/2 + 0.05 = -depth + 0.05
    'width', 'height', '0.1',
    'wood', 'cabinetMaterial'
  );

  -- Part 4: Pillow 1 (Left)
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Pillow Left', 'box', 4,
    '-width / 4', '-height / 2 + 0.2 + 0.3 + 0.05', '-depth * 2 / 3',
    'width / 3', '0.1', 'depth / 2',
    'mattress', '#F5F5F5'
  );

  -- Part 5: Pillow 2 (Right)
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Pillow Right', 'box', 5,
    'width / 4', '-height / 2 + 0.2 + 0.3 + 0.05', '-depth * 2 / 3',
    'width / 3', '0.1', 'depth / 2',
    'mattress', '#F5F5F5'
  );

  RAISE NOTICE 'Bed created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 2. SOFA (6 parts)
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
    'sofa-3-seater', 'Sofa 3-Seater', 'sofa', 'living-room', 'standard',
    false, true, true, 90, 270, 0, 180, 2.00, 0.80, 0.90,
    '3-seater sofa with base, back, arms, and cushions'
  ) RETURNING id INTO v_model_id;

  -- Part 1: Sofa Base
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Sofa Base', 'box', 1,
    '0', '-height / 2 + 0.15', '0',  -- baseHeight = 0.3, center at 0.15
    'width', '0.3', 'depth * 1.5',    -- sofaDepth = depth * 1.5
    'fabric', 'cabinetMaterial'
  );

  -- Part 2: Sofa Back
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Sofa Back', 'box', 2,
    '0', '0', '-depth * 1.5 / 2 + 0.2',
    'width', 'height', '0.4',
    'fabric', 'cabinetMaterial'
  );

  -- Part 3: Left Arm
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Left Arm', 'box', 3,
    '-width / 2 + 0.2', '0', '0',
    '0.4', 'height', 'depth * 1.5 - 0.2',
    'fabric', 'cabinetMaterial'
  );

  -- Part 4: Right Arm
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Right Arm', 'box', 4,
    'width / 2 - 0.2', '0', '0',
    '0.4', 'height', 'depth * 1.5 - 0.2',
    'fabric', 'cabinetMaterial'
  );

  -- Part 5: Seat Cushions
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Seat Cushions', 'box', 5,
    '0', '-height / 4', 'depth * 1.5 / 6',
    'width - 1', '0.15', 'depth * 1.5 - 0.6',
    'cushion', '#4A6F8C'
  );

  -- Part 6: Back Cushions
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Back Cushions', 'box', 6,
    '0', '0.1', '-depth * 1.5 / 3',
    'width - 1', '0.4', '0.2',
    'cushion', '#4A6F8C'
  );

  RAISE NOTICE 'Sofa created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 3. CHAIR (6 parts)
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
    'dining-chair', 'Dining Chair', 'chair', 'dining-room', 'standard',
    false, true, true, 90, 270, 0, 180, 0.50, 0.90, 0.50,
    'Dining chair with seat, back, and 4 legs'
  ) RETURNING id INTO v_model_id;

  -- Part 1: Chair Seat
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Seat', 'box', 1,
    '0', '0', '0',
    'width', '0.1', 'depth',
    'fabric', 'cabinetMaterial'
  );

  -- Part 2: Chair Back
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Back', 'box', 2,
    '0', 'height / 3', '-depth / 2 + 0.05',
    'width', 'height * 0.8', '0.1',
    'fabric', 'cabinetMaterial'
  );

  -- Part 3: Front Left Leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Leg Front Left', 'box', 3,
    '-width / 2 + 0.05', '-height / 2 + 0.4', '-depth / 2 + 0.05',
    '0.05', '0.8', '0.05',
    'metal_leg', '#2F4F4F'
  );

  -- Part 4: Front Right Leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Leg Front Right', 'box', 4,
    'width / 2 - 0.05', '-height / 2 + 0.4', '-depth / 2 + 0.05',
    '0.05', '0.8', '0.05',
    'metal_leg', '#2F4F4F'
  );

  -- Part 5: Back Left Leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Leg Back Left', 'box', 5,
    '-width / 2 + 0.05', '-height / 2 + 0.4', 'depth / 2 - 0.05',
    '0.05', '0.8', '0.05',
    'metal_leg', '#2F4F4F'
  );

  -- Part 6: Back Right Leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Leg Back Right', 'box', 6,
    'width / 2 - 0.05', '-height / 2 + 0.4', 'depth / 2 - 0.05',
    '0.05', '0.8', '0.05',
    'metal_leg', '#2F4F4F'
  );

  RAISE NOTICE 'Chair created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 4. TABLE (5 parts)
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
    'dining-table', 'Dining Table', 'table', 'dining-room', 'standard',
    false, false, false, 0, 0, 0, 0, 1.60, 0.75, 0.90,
    'Dining table with top and 4 legs'
  ) RETURNING id INTO v_model_id;

  -- Part 1: Table Top
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Table Top', 'box', 1,
    '0', '0', '0',
    'width', '0.05', 'depth * 1.5',  -- tableDepth = depth * 1.5
    'wood', 'cabinetMaterial'
  );

  -- Part 2: Front Left Leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Leg Front Left', 'box', 2,
    '-width / 2 + 0.05', '-height / 2 + 0.35', '-depth * 1.5 / 2 + 0.05',
    '0.08', '0.7', '0.08',
    'wood', 'cabinetMaterial'
  );

  -- Part 3: Front Right Leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Leg Front Right', 'box', 3,
    'width / 2 - 0.05', '-height / 2 + 0.35', '-depth * 1.5 / 2 + 0.05',
    '0.08', '0.7', '0.08',
    'wood', 'cabinetMaterial'
  );

  -- Part 4: Back Left Leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Leg Back Left', 'box', 4,
    '-width / 2 + 0.05', '-height / 2 + 0.35', 'depth * 1.5 / 2 - 0.05',
    '0.08', '0.7', '0.08',
    'wood', 'cabinetMaterial'
  );

  -- Part 5: Back Right Leg
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Leg Back Right', 'box', 5,
    'width / 2 - 0.05', '-height / 2 + 0.35', 'depth * 1.5 / 2 - 0.05',
    '0.08', '0.7', '0.08',
    'wood', 'cabinetMaterial'
  );

  RAISE NOTICE 'Table created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 5. TV (4 parts)
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
    'tv-55-inch', 'TV 55 Inch', 'tv', 'living-room', 'standard',
    false, true, true, 90, 270, 0, 180, 1.20, 0.70, 0.10,
    '55 inch TV with screen, frame, and stand'
  ) RETURNING id INTO v_model_id;

  -- Part 1: TV Screen
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Screen', 'box', 1,
    '0', '0', '0',
    'width', 'height', '0.05',
    'screen', '#000000'
  );

  -- Part 2: TV Frame (Bezel) - slightly larger than screen
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Frame', 'box', 2,
    '0', '0', '-0.005',  -- Slightly behind screen
    'width * 1.05', 'height * 1.05', '0.05',
    'handle', '#333333'
  );

  -- Part 3: TV Stand Base
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Stand Base', 'box', 3,
    '0', '-height / 2 - 0.1', 'depth / 3',
    'width / 3', '0.2', 'depth / 2',
    'handle', '#2F4F4F'
  );

  -- Part 4: TV Stand Neck
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Stand Neck', 'box', 4,
    '0', '-height / 2', 'depth / 4',
    '0.05', '0.1', 'depth / 3',
    'handle', '#333333'
  );

  RAISE NOTICE 'TV created with ID: %', v_model_id;
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
  WHERE component_id IN ('bed-single', 'sofa-3-seater', 'dining-chair', 'dining-table', 'tv-55-inch');

  SELECT COUNT(*) INTO v_part_count
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id IN ('bed-single', 'sofa-3-seater', 'dining-chair', 'dining-table', 'tv-55-inch');

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Migration Complete: Furniture 3D Models';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Models Created: %', v_model_count;
  RAISE NOTICE 'Geometry Parts Created: %', v_part_count;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Components:';
  RAISE NOTICE '  - Bed (5 parts)';
  RAISE NOTICE '  - Sofa (6 parts)';
  RAISE NOTICE '  - Chair (6 parts)';
  RAISE NOTICE '  - Table (5 parts)';
  RAISE NOTICE '  - TV (4 parts)';
  RAISE NOTICE '================================================';

  IF v_model_count != 5 THEN
    RAISE WARNING 'Expected 5 models, got %', v_model_count;
  END IF;

  IF v_part_count != 26 THEN
    RAISE WARNING 'Expected 26 geometry parts, got %', v_part_count;
  END IF;
END $$;
