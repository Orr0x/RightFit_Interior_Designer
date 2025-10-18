-- ================================================================
-- Week 20: Data Population (P1 - Standard Base Cabinets)
-- ================================================================
-- Purpose: Populate 6 standard base cabinet models
-- Feature Flag: use_dynamic_3d_models
-- Status: Week 20 - P1 (Priority 1 - Standard Components)
--
-- Base Cabinets Being Added:
-- 1. Base Cabinet 30cm
-- 2. Base Cabinet 40cm
-- 3. Base Cabinet 50cm
-- 4. Base Cabinet 60cm (template/reference model)
-- 5. Base Cabinet 80cm
-- 6. Base Cabinet 100cm
--
-- Standard Base Cabinet Structure (4 parts):
-- - Plinth (toe kick): 15cm high at bottom
-- - Cabinet body: 72cm high main body
-- - Door: Front panel with handle
-- - Shelf: Internal shelf (optional)
--
-- All cabinets: Height = 90cm, Depth = 60cm, Width = variable
-- ================================================================

-- ================================================================
-- 1. BASE CABINET 60CM (Template/Reference Model)
-- ================================================================
-- This is the standard template - other sizes scale from this

DO $$
DECLARE
  v_model_id uuid;
  v_plinth_material_id uuid;
  v_cabinet_material_id uuid;
  v_door_material_id uuid;
  v_handle_material_id uuid;
BEGIN
  -- Get material IDs
  SELECT id INTO v_plinth_material_id FROM material_definitions WHERE material_name = 'plinth';
  SELECT id INTO v_cabinet_material_id FROM material_definitions WHERE material_name = 'cabinet_body';
  SELECT id INTO v_door_material_id FROM material_definitions WHERE material_name = 'door';
  SELECT id INTO v_handle_material_id FROM material_definitions WHERE material_name = 'handle';

  -- Insert model metadata
  INSERT INTO component_3d_models (
    component_id,
    component_name,
    component_type,
    category,
    geometry_type,
    is_corner_component,
    has_direction,
    auto_rotate_enabled,
    wall_rotation_left,
    wall_rotation_right,
    wall_rotation_top,
    wall_rotation_bottom,
    default_width,
    default_height,
    default_depth,
    description
  ) VALUES (
    'base-cabinet-60',
    'Base Cabinet 60cm',
    'base-cabinet',
    'cabinets',
    'standard',
    false,
    true,
    true,
    90,   -- Face right when on left wall
    270,  -- Face left when on right wall
    0,    -- Face down when on top wall
    180,  -- Face up when on bottom wall
    0.60,
    0.90,
    0.60,
    'Standard 60cm base cabinet with plinth, body, door, and shelf'
  ) RETURNING id INTO v_model_id;

  -- Part 1: Plinth (Toe Kick)
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES (
    v_model_id, 'Plinth', 'box', 1,
    '0',                              -- Centered on X
    '-height / 2 + plinthHeight / 2', -- At bottom, centered on plinth
    '0',                              -- Centered on Z
    'width',                          -- Full width
    'plinthHeight',                   -- 15cm high
    'depth - 0.05',                   -- Slightly recessed (5cm)
    'plinth', 'plinthColor', '!isWallCabinet'
  );

  -- Part 2: Cabinet Body
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Cabinet Body', 'box', 2,
    '0',                              -- Centered on X
    'plinthHeight / 2',               -- Above plinth
    '0',                              -- Centered on Z
    'width',                          -- Full width
    'cabinetHeight',                  -- 72cm high (90cm - 15cm plinth - 3cm counter-top)
    'depth',                          -- Full depth
    'cabinet_body', 'cabinetMaterial'
  );

  -- Part 3: Door
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Door', 'box', 3,
    '0',                              -- Centered on X
    'plinthHeight / 2',               -- Above plinth, same as body
    'depth / 2 + 0.01',               -- Front face, slightly forward
    'width - 0.02',                   -- Slightly smaller than width (1cm gap each side)
    'doorHeight',                     -- 72cm high (same as cabinet body)
    '0.02',                           -- 2cm thick door
    'door', 'doorMaterial'
  );

  -- Part 4: Handle
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Handle', 'box', 4,
    'width / 2 - 0.15',               -- Right side of door
    'plinthHeight / 2 + cabinetHeight / 2 - 0.1', -- Upper-middle of door
    'depth / 2 + 0.03',               -- Front of door
    '0.12',                           -- 12cm wide handle
    '0.02',                           -- 2cm tall
    '0.03',                           -- 3cm deep
    'handle', 'handleMaterial'
  );

  RAISE NOTICE 'Base Cabinet 60cm created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 2. BASE CABINET 30CM
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  INSERT INTO component_3d_models (
    component_id,
    component_name,
    component_type,
    category,
    geometry_type,
    is_corner_component,
    has_direction,
    auto_rotate_enabled,
    wall_rotation_left,
    wall_rotation_right,
    wall_rotation_top,
    wall_rotation_bottom,
    default_width,
    default_height,
    default_depth,
    description
  ) VALUES (
    'base-cabinet-30',
    'Base Cabinet 30cm',
    'base-cabinet',
    'cabinets',
    'standard',
    false,
    true,
    true,
    90, 270, 0, 180,
    0.30, 0.90, 0.60,
    'Narrow 30cm base cabinet - ideal for tight spaces'
  ) RETURNING id INTO v_model_id;

  -- Same 4 parts as 60cm, formulas scale automatically

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES (
    v_model_id, 'Plinth', 'box', 1,
    '0', '-height / 2 + plinthHeight / 2', '0',
    'width', 'plinthHeight', 'depth - 0.05',
    'plinth', 'plinthColor', '!isWallCabinet'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Cabinet Body', 'box', 2,
    '0', 'plinthHeight / 2', '0',
    'width', 'cabinetHeight', 'depth',
    'cabinet_body', 'cabinetMaterial'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Door', 'box', 3,
    '0', 'plinthHeight / 2', 'depth / 2 + 0.01',
    'width - 0.02', 'doorHeight', '0.02',
    'door', 'doorMaterial'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Handle', 'box', 4,
    'width / 2 - 0.08', 'plinthHeight / 2 + cabinetHeight / 2 - 0.1', 'depth / 2 + 0.03',
    '0.08', '0.02', '0.03',
    'handle', 'handleMaterial'
  );

  RAISE NOTICE 'Base Cabinet 30cm created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 3. BASE CABINET 40CM
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  INSERT INTO component_3d_models (
    component_id,
    component_name,
    component_type,
    category,
    geometry_type,
    is_corner_component,
    has_direction,
    auto_rotate_enabled,
    wall_rotation_left,
    wall_rotation_right,
    wall_rotation_top,
    wall_rotation_bottom,
    default_width,
    default_height,
    default_depth,
    description
  ) VALUES (
    'base-cabinet-40',
    'Base Cabinet 40cm',
    'base-cabinet',
    'cabinets',
    'standard',
    false,
    true,
    true,
    90, 270, 0, 180,
    0.40, 0.90, 0.60,
    'Compact 40cm base cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES (
    v_model_id, 'Plinth', 'box', 1,
    '0', '-height / 2 + plinthHeight / 2', '0',
    'width', 'plinthHeight', 'depth - 0.05',
    'plinth', 'plinthColor', '!isWallCabinet'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Cabinet Body', 'box', 2,
    '0', 'plinthHeight / 2', '0',
    'width', 'cabinetHeight', 'depth',
    'cabinet_body', 'cabinetMaterial'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Door', 'box', 3,
    '0', 'plinthHeight / 2', 'depth / 2 + 0.01',
    'width - 0.02', 'doorHeight', '0.02',
    'door', 'doorMaterial'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Handle', 'box', 4,
    'width / 2 - 0.10', 'plinthHeight / 2 + cabinetHeight / 2 - 0.1', 'depth / 2 + 0.03',
    '0.10', '0.02', '0.03',
    'handle', 'handleMaterial'
  );

  RAISE NOTICE 'Base Cabinet 40cm created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 4. BASE CABINET 50CM
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  INSERT INTO component_3d_models (
    component_id,
    component_name,
    component_type,
    category,
    geometry_type,
    is_corner_component,
    has_direction,
    auto_rotate_enabled,
    wall_rotation_left,
    wall_rotation_right,
    wall_rotation_top,
    wall_rotation_bottom,
    default_width,
    default_height,
    default_depth,
    description
  ) VALUES (
    'base-cabinet-50',
    'Base Cabinet 50cm',
    'base-cabinet',
    'cabinets',
    'standard',
    false,
    true,
    true,
    90, 270, 0, 180,
    0.50, 0.90, 0.60,
    'Medium 50cm base cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES (
    v_model_id, 'Plinth', 'box', 1,
    '0', '-height / 2 + plinthHeight / 2', '0',
    'width', 'plinthHeight', 'depth - 0.05',
    'plinth', 'plinthColor', '!isWallCabinet'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Cabinet Body', 'box', 2,
    '0', 'plinthHeight / 2', '0',
    'width', 'cabinetHeight', 'depth',
    'cabinet_body', 'cabinetMaterial'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Door', 'box', 3,
    '0', 'plinthHeight / 2', 'depth / 2 + 0.01',
    'width - 0.02', 'doorHeight', '0.02',
    'door', 'doorMaterial'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Handle', 'box', 4,
    'width / 2 - 0.12', 'plinthHeight / 2 + cabinetHeight / 2 - 0.1', 'depth / 2 + 0.03',
    '0.12', '0.02', '0.03',
    'handle', 'handleMaterial'
  );

  RAISE NOTICE 'Base Cabinet 50cm created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 5. BASE CABINET 80CM
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  INSERT INTO component_3d_models (
    component_id,
    component_name,
    component_type,
    category,
    geometry_type,
    is_corner_component,
    has_direction,
    auto_rotate_enabled,
    wall_rotation_left,
    wall_rotation_right,
    wall_rotation_top,
    wall_rotation_bottom,
    default_width,
    default_height,
    default_depth,
    description
  ) VALUES (
    'base-cabinet-80',
    'Base Cabinet 80cm',
    'base-cabinet',
    'cabinets',
    'standard',
    false,
    true,
    true,
    90, 270, 0, 180,
    0.80, 0.90, 0.60,
    'Wide 80cm base cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES (
    v_model_id, 'Plinth', 'box', 1,
    '0', '-height / 2 + plinthHeight / 2', '0',
    'width', 'plinthHeight', 'depth - 0.05',
    'plinth', 'plinthColor', '!isWallCabinet'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Cabinet Body', 'box', 2,
    '0', 'plinthHeight / 2', '0',
    'width', 'cabinetHeight', 'depth',
    'cabinet_body', 'cabinetMaterial'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Door', 'box', 3,
    '0', 'plinthHeight / 2', 'depth / 2 + 0.01',
    'width - 0.02', 'doorHeight', '0.02',
    'door', 'doorMaterial'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Handle', 'box', 4,
    'width / 2 - 0.15', 'plinthHeight / 2 + cabinetHeight / 2 - 0.1', 'depth / 2 + 0.03',
    '0.15', '0.02', '0.03',
    'handle', 'handleMaterial'
  );

  RAISE NOTICE 'Base Cabinet 80cm created with ID: %', v_model_id;
END $$;

-- ================================================================
-- 6. BASE CABINET 100CM
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
BEGIN
  INSERT INTO component_3d_models (
    component_id,
    component_name,
    component_type,
    category,
    geometry_type,
    is_corner_component,
    has_direction,
    auto_rotate_enabled,
    wall_rotation_left,
    wall_rotation_right,
    wall_rotation_top,
    wall_rotation_bottom,
    default_width,
    default_height,
    default_depth,
    description
  ) VALUES (
    'base-cabinet-100',
    'Base Cabinet 100cm',
    'base-cabinet',
    'cabinets',
    'standard',
    false,
    true,
    true,
    90, 270, 0, 180,
    1.00, 0.90, 0.60,
    'Extra wide 100cm base cabinet'
  ) RETURNING id INTO v_model_id;

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES (
    v_model_id, 'Plinth', 'box', 1,
    '0', '-height / 2 + plinthHeight / 2', '0',
    'width', 'plinthHeight', 'depth - 0.05',
    'plinth', 'plinthColor', '!isWallCabinet'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Cabinet Body', 'box', 2,
    '0', 'plinthHeight / 2', '0',
    'width', 'cabinetHeight', 'depth',
    'cabinet_body', 'cabinetMaterial'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Door', 'box', 3,
    '0', 'plinthHeight / 2', 'depth / 2 + 0.01',
    'width - 0.02', 'doorHeight', '0.02',
    'door', 'doorMaterial'
  );

  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override
  ) VALUES (
    v_model_id, 'Handle', 'box', 4,
    'width / 2 - 0.18', 'plinthHeight / 2 + cabinetHeight / 2 - 0.1', 'depth / 2 + 0.03',
    '0.18', '0.02', '0.03',
    'handle', 'handleMaterial'
  );

  RAISE NOTICE 'Base Cabinet 100cm created with ID: %', v_model_id;
END $$;

-- ================================================================
-- VERIFICATION
-- ================================================================

DO $$
DECLARE
  model_count INTEGER;
  part_count INTEGER;
BEGIN
  -- Count models created
  SELECT COUNT(*) INTO model_count
  FROM component_3d_models
  WHERE component_id IN (
    'base-cabinet-30', 'base-cabinet-40', 'base-cabinet-50',
    'base-cabinet-60', 'base-cabinet-80', 'base-cabinet-100'
  );

  -- Count parts created
  SELECT COUNT(*) INTO part_count
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id IN (
    'base-cabinet-30', 'base-cabinet-40', 'base-cabinet-50',
    'base-cabinet-60', 'base-cabinet-80', 'base-cabinet-100'
  );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Week 20: Standard Base Cabinets Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Models created: % / 6', model_count;
  RAISE NOTICE 'Geometry parts created: % / 24 (4 per model)', part_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Base Cabinet Sizes:';
  RAISE NOTICE '  - 30cm (narrow)';
  RAISE NOTICE '  - 40cm (compact)';
  RAISE NOTICE '  - 50cm (medium)';
  RAISE NOTICE '  - 60cm (standard)';
  RAISE NOTICE '  - 80cm (wide)';
  RAISE NOTICE '  - 100cm (extra wide)';
  RAISE NOTICE '';
  RAISE NOTICE 'Each cabinet has:';
  RAISE NOTICE '  - Plinth (toe kick)';
  RAISE NOTICE '  - Cabinet body';
  RAISE NOTICE '  - Door with handle';
  RAISE NOTICE '  - Auto-rotate enabled';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for testing in 3D! 🚀';
  RAISE NOTICE '========================================';
END $$;
