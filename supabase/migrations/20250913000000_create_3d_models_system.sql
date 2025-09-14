-- 3D Models Database System
-- Extends the existing component system with 3D model definitions
-- Created: 2025-09-13
-- Purpose: Database-driven 3D model system for interior design application

-- =============================================================================
-- PART 1: 3D MODEL TYPES AND MATERIALS
-- =============================================================================

-- Create 3D model types enum
CREATE TYPE model_type AS ENUM (
  'cabinet',
  'appliance', 
  'counter-top',
  'end-panel',
  'window',
  'door',
  'flooring',
  'toe-kick',
  'cornice',
  'pelmet',
  'wall-unit-end-panel',
  'furniture'
);

-- Create material types enum  
CREATE TYPE material_type AS ENUM (
  'wood',
  'metal',
  'glass',
  'plastic',
  'fabric',
  'ceramic',
  'stone',
  'composite'
);

-- =============================================================================
-- PART 2: 3D MODELS TABLE
-- =============================================================================

-- Main 3D models table
CREATE TABLE IF NOT EXISTS public.model_3d (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Link to existing component (nullable for furniture models)
  component_id UUID REFERENCES public.components(id) ON DELETE CASCADE,
  
  -- 3D Model Definition
  model_type model_type NOT NULL,
  geometry_type TEXT NOT NULL CHECK (geometry_type IN ('box', 'cylinder', 'complex', 'composite')),
  
  -- Rendering Properties
  primary_material material_type NOT NULL DEFAULT 'wood',
  secondary_material material_type,
  primary_color TEXT NOT NULL DEFAULT '#8B4513',
  secondary_color TEXT,
  
  -- 3D Specific Properties
  has_doors BOOLEAN DEFAULT false,
  has_drawers BOOLEAN DEFAULT false,
  has_handles BOOLEAN DEFAULT true,
  has_legs BOOLEAN DEFAULT false,
  
  -- Positioning and Orientation
  default_y_position DECIMAL(10,2) DEFAULT 0, -- Floor level offset
  wall_mounted BOOLEAN DEFAULT false,
  
  -- Specialized Properties (JSONB for flexibility)
  special_features JSONB DEFAULT '{}',
  
  -- LOD (Level of Detail) support
  detail_level INTEGER DEFAULT 1 CHECK (detail_level BETWEEN 1 AND 3),
  
  -- Versioning
  version TEXT NOT NULL DEFAULT '1.0.0',
  deprecated BOOLEAN NOT NULL DEFAULT false
);

-- =============================================================================
-- PART 3: COMPONENT VARIANTS TABLE
-- =============================================================================

-- Handle component variants (e.g., corner cabinets, wall vs base cabinets)
CREATE TABLE IF NOT EXISTS public.model_3d_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_3d_id UUID NOT NULL REFERENCES public.model_3d(id) ON DELETE CASCADE,
  
  -- Variant identification
  variant_key TEXT NOT NULL, -- e.g., 'corner', 'wall-mounted', 'pan-drawer'
  variant_name TEXT NOT NULL,
  
  -- Override properties for this variant
  geometry_overrides JSONB DEFAULT '{}',
  material_overrides JSONB DEFAULT '{}',
  feature_overrides JSONB DEFAULT '{}',
  
  -- Pattern matching for automatic variant detection
  id_pattern TEXT[], -- Array of patterns to match element.id
  style_pattern TEXT[], -- Array of patterns to match element.style
  
  UNIQUE(model_3d_id, variant_key)
);

-- =============================================================================
-- PART 4: APPLIANCE TYPES TABLE
-- =============================================================================

-- Specialized table for appliance-specific properties
CREATE TABLE IF NOT EXISTS public.appliance_3d_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_3d_id UUID NOT NULL REFERENCES public.model_3d(id) ON DELETE CASCADE,
  
  -- Appliance classification
  appliance_category TEXT NOT NULL CHECK (appliance_category IN (
    'refrigerator', 'dishwasher', 'washing-machine', 'tumble-dryer', 
    'oven', 'toilet', 'shower', 'bathtub', 'bed', 'sofa', 'chair', 
    'table', 'tv', 'generic'
  )),
  
  -- Appliance-specific features
  has_display BOOLEAN DEFAULT false,
  has_controls BOOLEAN DEFAULT false,
  has_glass_door BOOLEAN DEFAULT false,
  energy_rating TEXT,
  
  -- Color scheme for appliance type
  default_colors JSONB DEFAULT '{}',
  
  UNIQUE(model_3d_id)
);

-- =============================================================================
-- PART 5: FURNITURE DEFINITIONS TABLE  
-- =============================================================================

-- Store the furniture models from createFurnitureModels()
CREATE TABLE IF NOT EXISTS public.furniture_3d_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Furniture definition (matches ComponentDefinition interface)
  furniture_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'appliance',
  width DECIMAL(10,2) NOT NULL,
  depth DECIMAL(10,2) NOT NULL,
  height DECIMAL(10,2) NOT NULL,
  color TEXT NOT NULL,
  category TEXT NOT NULL,
  room_types TEXT[] NOT NULL,
  icon_name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- 3D specific properties
  model_3d_id UUID REFERENCES public.model_3d(id),
  
  -- Versioning
  version TEXT NOT NULL DEFAULT '1.0.0',
  deprecated BOOLEAN NOT NULL DEFAULT false
);

-- =============================================================================
-- PART 6: INDEXES FOR PERFORMANCE
-- =============================================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_model_3d_component_id ON public.model_3d(component_id);
CREATE INDEX IF NOT EXISTS idx_model_3d_type ON public.model_3d(model_type);
CREATE INDEX IF NOT EXISTS idx_model_3d_variants_model_id ON public.model_3d_variants(model_3d_id);
CREATE INDEX IF NOT EXISTS idx_appliance_3d_types_model_id ON public.appliance_3d_types(model_3d_id);
CREATE INDEX IF NOT EXISTS idx_furniture_3d_models_furniture_id ON public.furniture_3d_models(furniture_id);

-- GIN index for JSONB fields
CREATE INDEX IF NOT EXISTS idx_model_3d_special_features ON public.model_3d USING GIN (special_features);
CREATE INDEX IF NOT EXISTS idx_model_3d_variants_overrides ON public.model_3d_variants USING GIN (geometry_overrides, material_overrides, feature_overrides);

-- =============================================================================
-- PART 7: ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.model_3d ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_3d_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appliance_3d_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture_3d_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow read access to all authenticated users
CREATE POLICY "Allow read access to 3D models" ON public.model_3d
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to 3D model variants" ON public.model_3d_variants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to appliance types" ON public.appliance_3d_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to furniture models" ON public.furniture_3d_models
  FOR SELECT TO authenticated USING (true);

-- Admin policies for DEV+ users (modify as needed based on your user tier system)
-- These would need to be adjusted based on your actual user tier implementation

-- =============================================================================
-- PART 8: UTILITY FUNCTIONS
-- =============================================================================

-- Function to get 3D model for a component
CREATE OR REPLACE FUNCTION get_3d_model_for_component(comp_id UUID)
RETURNS TABLE (
  model_id UUID,
  model_type model_type,
  geometry_type TEXT,
  primary_material material_type,
  primary_color TEXT,
  has_doors BOOLEAN,
  has_drawers BOOLEAN,
  special_features JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.model_type,
    m.geometry_type,
    m.primary_material,
    m.primary_color,
    m.has_doors,
    m.has_drawers,
    m.special_features
  FROM model_3d m
  WHERE m.component_id = comp_id
    AND m.deprecated = false
  ORDER BY m.version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get variant for specific element patterns
CREATE OR REPLACE FUNCTION get_3d_model_variant(comp_id UUID, element_id TEXT, element_style TEXT DEFAULT '')
RETURNS TABLE (
  variant_id UUID,
  variant_key TEXT,
  variant_name TEXT,
  geometry_overrides JSONB,
  material_overrides JSONB,
  feature_overrides JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.variant_key,
    v.variant_name,
    v.geometry_overrides,
    v.material_overrides,
    v.feature_overrides
  FROM model_3d m
  JOIN model_3d_variants v ON m.id = v.model_3d_id
  WHERE m.component_id = comp_id
    AND m.deprecated = false
    AND (
      element_id = ANY(v.id_pattern) OR
      element_style = ANY(v.style_pattern) OR
      element_id ~* ANY(v.id_pattern) OR
      element_style ~* ANY(v.style_pattern)
    )
  ORDER BY array_length(v.id_pattern, 1) DESC, array_length(v.style_pattern, 1) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Add helpful comment
COMMENT ON TABLE public.model_3d IS 'Stores 3D model definitions linked to components';
COMMENT ON TABLE public.model_3d_variants IS 'Handles specialized variants of 3D models (corner units, wall mounted, etc.)';
COMMENT ON TABLE public.appliance_3d_types IS 'Specialized properties for appliance 3D models';
COMMENT ON TABLE public.furniture_3d_models IS 'Furniture models from createFurnitureModels function';
