-- 3D Models System Migration
-- Purpose: Move 1,948 lines of hardcoded 3D models to database-driven system
-- Created: January 2025
-- Feature Flag: use_dynamic_3d_models

-- ============================================
-- 1. CREATE COMPONENT 3D MODELS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.component_3d_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Component identification
  component_id VARCHAR(100) UNIQUE NOT NULL,
  component_name VARCHAR(200) NOT NULL,
  component_type VARCHAR(50) NOT NULL, -- 'cabinet', 'appliance', 'sink', etc.
  category VARCHAR(50), -- 'base-units', 'wall-units', 'tall-units', etc.

  -- Geometry type
  geometry_type VARCHAR(50) NOT NULL DEFAULT 'standard', -- 'standard', 'l_shaped_corner', 'larder_corner', 'custom'

  -- Corner unit specific
  is_corner_component BOOLEAN DEFAULT FALSE,
  leg_length DECIMAL(10, 4), -- For L-shaped: 0.6 or 0.9 meters
  corner_depth_wall DECIMAL(10, 4), -- Wall cabinet corner depth (0.4m)
  corner_depth_base DECIMAL(10, 4), -- Base cabinet corner depth (0.6m)

  -- Rotation configuration
  rotation_center_x VARCHAR(100), -- Formula: 'legLength/2' or '0'
  rotation_center_y VARCHAR(100), -- Formula: '0'
  rotation_center_z VARCHAR(100), -- Formula: 'legLength/2' or '0'

  -- Auto-rotate rules
  has_direction BOOLEAN DEFAULT FALSE,
  auto_rotate_enabled BOOLEAN DEFAULT TRUE,
  wall_rotation_left INTEGER, -- 90
  wall_rotation_right INTEGER, -- 270
  wall_rotation_top INTEGER, -- 0
  wall_rotation_bottom INTEGER, -- 180
  corner_rotation_front_left INTEGER, -- 0 for corner, 90 for normal
  corner_rotation_front_right INTEGER, -- 270
  corner_rotation_back_left INTEGER, -- 90
  corner_rotation_back_right INTEGER, -- 180 for corner, 270 for normal

  -- Default dimensions (fallback if not in component table)
  default_width DECIMAL(10, 4),
  default_height DECIMAL(10, 4),
  default_depth DECIMAL(10, 4),

  -- Metadata
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- ============================================
-- 2. CREATE GEOMETRY PARTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.geometry_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to parent model
  model_id UUID NOT NULL REFERENCES public.component_3d_models(id) ON DELETE CASCADE,

  -- Part identification
  part_name VARCHAR(100) NOT NULL, -- 'cabinet_body', 'plinth', 'door', 'handle', etc.
  part_type VARCHAR(50) NOT NULL, -- 'box', 'cylinder', 'sphere', 'custom'
  render_order INTEGER DEFAULT 0, -- Lower renders first

  -- Position formulas (evaluated at runtime)
  position_x VARCHAR(200), -- e.g., '0', 'width/2', 'cornerDepth/2 - legLength/2'
  position_y VARCHAR(200), -- e.g., 'plinthHeight/2', '-height/2 + plinthHeight/2'
  position_z VARCHAR(200), -- e.g., 'depth/2 + 0.01', 'cornerDepth - legLength/2'

  -- Dimension formulas
  dimension_width VARCHAR(200), -- e.g., 'width', 'legLength - 0.05', '0.02'
  dimension_height VARCHAR(200), -- e.g., 'cabinetHeight', 'doorHeight', '0.15'
  dimension_depth VARCHAR(200), -- e.g., 'depth', 'cornerDepth', '0.02'

  -- Material and appearance
  material_name VARCHAR(50), -- 'cabinet_body', 'door', 'handle', 'plinth'
  color_override VARCHAR(50), -- 'selectedColor', 'cabinetMaterial', 'doorColor'
  metalness DECIMAL(3, 2), -- 0.0 to 1.0
  roughness DECIMAL(3, 2), -- 0.0 to 1.0
  opacity DECIMAL(3, 2) DEFAULT 1.0, -- 0.0 to 1.0

  -- Conditional rendering
  render_condition VARCHAR(200), -- e.g., '!isWallCabinet', 'isSelected', null (always render)

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CREATE MATERIAL DEFINITIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.material_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Material identification
  material_name VARCHAR(50) UNIQUE NOT NULL, -- 'cabinet_body', 'door', 'handle', etc.
  material_type VARCHAR(50) NOT NULL, -- 'standard', 'lambert', 'phong', 'physical'

  -- Default color
  default_color VARCHAR(50), -- '#8B7355', '#654321', '#C0C0C0'

  -- Material properties
  roughness DECIMAL(3, 2) DEFAULT 0.7,
  metalness DECIMAL(3, 2) DEFAULT 0.1,
  opacity DECIMAL(3, 2) DEFAULT 1.0,

  -- Description
  description TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_component_3d_models_component_id ON public.component_3d_models(component_id);
CREATE INDEX IF NOT EXISTS idx_component_3d_models_type ON public.component_3d_models(component_type);
CREATE INDEX IF NOT EXISTS idx_component_3d_models_corner ON public.component_3d_models(is_corner_component);

CREATE INDEX IF NOT EXISTS idx_geometry_parts_model_id ON public.geometry_parts(model_id);
CREATE INDEX IF NOT EXISTS idx_geometry_parts_render_order ON public.geometry_parts(model_id, render_order);

CREATE INDEX IF NOT EXISTS idx_material_definitions_name ON public.material_definitions(material_name);

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.component_3d_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geometry_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_definitions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES
-- ============================================

-- Anyone can view 3D models (needed for rendering)
DROP POLICY IF EXISTS "Anyone can view 3D models" ON public.component_3d_models;
CREATE POLICY "Anyone can view 3D models"
ON public.component_3d_models FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can view geometry parts" ON public.geometry_parts;
CREATE POLICY "Anyone can view geometry parts"
ON public.geometry_parts FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can view material definitions" ON public.material_definitions;
CREATE POLICY "Anyone can view material definitions"
ON public.material_definitions FOR SELECT
USING (true);

-- ============================================
-- 7. CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.update_3d_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_3d_models_timestamp ON public.component_3d_models;
CREATE TRIGGER update_3d_models_timestamp
BEFORE UPDATE ON public.component_3d_models
FOR EACH ROW
EXECUTE FUNCTION public.update_3d_models_updated_at();

-- ============================================
-- 8. INSERT MATERIAL DEFINITIONS
-- ============================================

INSERT INTO public.material_definitions (material_name, material_type, default_color, roughness, metalness, description) VALUES
  ('cabinet_body', 'standard', '#8B7355', 0.7, 0.1, 'Main cabinet body material'),
  ('door', 'standard', '#654321', 0.6, 0.1, 'Cabinet door material'),
  ('handle', 'standard', '#C0C0C0', 0.2, 0.8, 'Metallic handle material'),
  ('plinth', 'lambert', '#5a4a3a', 0.8, 0.0, 'Plinth/toe kick material'),
  ('worktop', 'standard', '#E8E8E8', 0.4, 0.3, 'Counter-top material'),
  ('appliance_steel', 'standard', '#D3D3D3', 0.3, 0.7, 'Stainless steel appliances'),
  ('sink', 'standard', '#F5F5F5', 0.3, 0.5, 'Sink basin material')
ON CONFLICT (material_name) DO NOTHING;

-- ============================================
-- 9. INSERT SAMPLE CORNER CABINET MODEL
-- ============================================

-- Example: Corner Base Cabinet 60cm
INSERT INTO public.component_3d_models (
  component_id,
  component_name,
  component_type,
  category,
  geometry_type,
  is_corner_component,
  leg_length,
  corner_depth_wall,
  corner_depth_base,
  rotation_center_x,
  rotation_center_y,
  rotation_center_z,
  has_direction,
  auto_rotate_enabled,
  wall_rotation_left,
  wall_rotation_right,
  wall_rotation_top,
  wall_rotation_bottom,
  corner_rotation_front_left,
  corner_rotation_front_right,
  corner_rotation_back_left,
  corner_rotation_back_right,
  default_width,
  default_height,
  default_depth,
  description
) VALUES (
  'corner-base-cabinet-60',
  'Corner Base Cabinet 60cm',
  'cabinet',
  'base-units',
  'l_shaped_corner',
  true,
  0.6, -- 60cm leg length
  0.4, -- Wall cabinet corner depth
  0.6, -- Base cabinet corner depth
  'legLength/2',
  '0',
  'legLength/2',
  true,
  true,
  90,   -- Left wall
  270,  -- Right wall
  0,    -- Top wall
  180,  -- Bottom wall
  0,    -- Front-left corner (L faces down-right)
  270,  -- Front-right corner (L faces down-left)
  90,   -- Back-left corner (L faces up-right)
  180,  -- Back-right corner (L faces up-left)
  0.6,
  0.9,
  0.6,
  'L-shaped corner base cabinet with 60cm legs'
) ON CONFLICT (component_id) DO NOTHING;

-- Get the model ID for geometry parts
DO $$
DECLARE
  corner_model_id UUID;
BEGIN
  SELECT id INTO corner_model_id FROM public.component_3d_models WHERE component_id = 'corner-base-cabinet-60';

  -- Insert geometry parts for corner cabinet
  INSERT INTO public.geometry_parts (model_id, part_name, part_type, render_order, position_x, position_y, position_z, dimension_width, dimension_height, dimension_depth, material_name, render_condition) VALUES
    (corner_model_id, 'plinth_x_leg', 'box', 1, '0', '-height/2 + plinthHeight/2', 'cornerDepth/2 - legLength/2 - 0.1', 'legLength', 'plinthHeight', 'cornerDepth - 0.2', 'plinth', '!isWallCabinet'),
    (corner_model_id, 'plinth_z_leg', 'box', 2, 'cornerDepth/2 - legLength/2 - 0.1', '-height/2 + plinthHeight/2', '0', 'cornerDepth - 0.2', 'plinthHeight', 'legLength', 'plinth', '!isWallCabinet'),
    (corner_model_id, 'cabinet_x_leg', 'box', 3, '0', 'plinthHeight/2', 'cornerDepth/2 - legLength/2', 'legLength', 'cabinetHeight', 'cornerDepth', 'cabinet_body', null),
    (corner_model_id, 'cabinet_z_leg', 'box', 4, 'cornerDepth/2 - legLength/2', 'plinthHeight/2', '0', 'cornerDepth', 'cabinetHeight', 'legLength', 'cabinet_body', null),
    (corner_model_id, 'door_front', 'box', 5, '0', 'plinthHeight/2', 'cornerDepth - legLength/2 + 0.01', 'legLength - 0.05', 'doorHeight', '0.02', 'door', null),
    (corner_model_id, 'door_side', 'box', 6, 'cornerDepth - legLength/2 + 0.01', 'plinthHeight/2', '0', '0.02', 'doorHeight', 'legLength - 0.05', 'door', null),
    (corner_model_id, 'handle_front', 'box', 7, 'legLength/2 - 0.05', 'plinthHeight/2', 'cornerDepth - legLength/2 + 0.03', '0.02', '0.15', '0.02', 'handle', null),
    (corner_model_id, 'handle_side', 'box', 8, 'cornerDepth - legLength/2 + 0.03', 'plinthHeight/2', '-0.25', '0.02', '0.15', '0.02', 'handle', null);
END $$;

-- ============================================
-- 10. ADD HELPFUL COMMENTS
-- ============================================

COMMENT ON TABLE public.component_3d_models IS '3D model definitions for kitchen components with geometry and auto-rotate rules';
COMMENT ON TABLE public.geometry_parts IS 'Individual geometry parts (boxes, cylinders) that make up 3D models';
COMMENT ON TABLE public.material_definitions IS 'Material definitions for 3D rendering (colors, roughness, metalness)';

COMMENT ON COLUMN public.component_3d_models.geometry_type IS 'Type of geometry: standard, l_shaped_corner, larder_corner, custom';
COMMENT ON COLUMN public.component_3d_models.is_corner_component IS 'True for L-shaped corner units';
COMMENT ON COLUMN public.geometry_parts.position_x IS 'Formula for X position, evaluated at runtime (e.g., "width/2", "cornerDepth/2 - legLength/2")';
COMMENT ON COLUMN public.geometry_parts.render_condition IS 'Conditional formula for when to render this part (e.g., "!isWallCabinet", null=always)';
