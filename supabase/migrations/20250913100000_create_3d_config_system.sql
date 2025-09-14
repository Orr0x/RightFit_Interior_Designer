-- 3D Model Configuration System
-- ENHANCES existing hardcoded logic, doesn't replace it
-- Preserves ALL existing geometry and specialized cabinet logic
-- Created: 2025-09-13

-- =============================================================================
-- PART 1: 3D MODEL CONFIGURATION TABLE
-- =============================================================================

-- Configuration for visual enhancements and material properties
CREATE TABLE IF NOT EXISTS public.model_3d_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Optional link to components table (null for default configs)
  component_id UUID REFERENCES public.components(id) ON DELETE CASCADE,
  
  -- Material Configuration (enhances existing hardcoded materials)
  primary_material TEXT NOT NULL DEFAULT 'wood' CHECK (primary_material IN ('wood', 'metal', 'glass', 'plastic', 'fabric', 'ceramic', 'stone', 'composite')),
  primary_color TEXT NOT NULL DEFAULT '#8B4513',
  secondary_color TEXT,
  wood_finish TEXT CHECK (wood_finish IN ('oak', 'pine', 'walnut', 'cherry', 'maple')),
  metal_finish TEXT CHECK (metal_finish IN ('brushed', 'polished', 'matte', 'antique')),
  
  -- Visual Enhancement Properties
  roughness DECIMAL(3,2) NOT NULL DEFAULT 0.7,
  metalness DECIMAL(3,2) NOT NULL DEFAULT 0.1,
  transparency DECIMAL(3,2),
  
  -- Feature Flags (enable/disable existing features)
  enable_detailed_handles BOOLEAN NOT NULL DEFAULT true,
  enable_wood_grain_texture BOOLEAN NOT NULL DEFAULT true,
  enable_realistic_lighting BOOLEAN NOT NULL DEFAULT true,
  enable_door_detail BOOLEAN NOT NULL DEFAULT true,
  
  -- Customizable Parameters (within existing logic bounds)
  plinth_height DECIMAL(4,3) DEFAULT 0.15, -- Default matches existing hardcoded value
  door_gap DECIMAL(4,3) DEFAULT 0.05, -- Default matches existing hardcoded value
  handle_style TEXT DEFAULT 'modern' CHECK (handle_style IN ('modern', 'traditional', 'minimalist', 'industrial')),
  
  -- Corner Unit Visual Overrides (ONLY non-geometric properties)
  corner_door_style TEXT CHECK (corner_door_style IN ('standard', 'bi-fold', 'lazy-susan')),
  corner_interior_shelving BOOLEAN DEFAULT false,
  
  -- Performance Settings
  detail_level INTEGER NOT NULL DEFAULT 2 CHECK (detail_level BETWEEN 1 AND 3),
  use_lod BOOLEAN NOT NULL DEFAULT false,
  
  -- Versioning
  version TEXT NOT NULL DEFAULT '1.0.0',
  deprecated BOOLEAN NOT NULL DEFAULT false
);

-- =============================================================================
-- PART 2: ELEMENT PATTERN MATCHING TABLE
-- =============================================================================

-- Patterns for detecting element types (mirrors existing hardcoded logic)
CREATE TABLE IF NOT EXISTS public.model_3d_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Pattern matching rules
  name TEXT NOT NULL,
  description TEXT,
  
  -- Element matching criteria (mirrors existing if/else logic)
  element_type TEXT, -- 'cabinet', 'appliance', etc.
  id_includes TEXT[], -- Array of strings to match in element.id
  style_includes TEXT[], -- Array of strings to match in element.style
  
  -- Configuration overrides to apply when pattern matches
  config_overrides JSONB NOT NULL DEFAULT '{}',
  
  -- Priority (higher number = higher priority)
  priority INTEGER NOT NULL DEFAULT 1,
  
  -- Active flag
  active BOOLEAN NOT NULL DEFAULT true
);

-- =============================================================================
-- PART 3: INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_model_3d_config_component_id ON public.model_3d_config(component_id);
CREATE INDEX IF NOT EXISTS idx_model_3d_config_material ON public.model_3d_config(primary_material);
CREATE INDEX IF NOT EXISTS idx_model_3d_patterns_element_type ON public.model_3d_patterns(element_type);
CREATE INDEX IF NOT EXISTS idx_model_3d_patterns_priority ON public.model_3d_patterns(priority DESC);

-- GIN index for JSONB config overrides
CREATE INDEX IF NOT EXISTS idx_model_3d_patterns_overrides ON public.model_3d_patterns USING GIN (config_overrides);

-- =============================================================================
-- PART 4: ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.model_3d_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_3d_patterns ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to 3D model configs" ON public.model_3d_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to 3D model patterns" ON public.model_3d_patterns
  FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- PART 5: DEFAULT CONFIGURATIONS
-- =============================================================================

-- Insert default configurations that mirror existing hardcoded values
INSERT INTO public.model_3d_config (
  component_id, 
  primary_material, 
  primary_color, 
  roughness, 
  metalness,
  enable_detailed_handles,
  enable_wood_grain_texture,
  enable_realistic_lighting,
  enable_door_detail,
  plinth_height,
  door_gap,
  handle_style,
  detail_level
) VALUES 
-- Default cabinet configuration (mirrors existing cabinetMaterial)
(NULL, 'wood', '#8B4513', 0.7, 0.1, true, true, true, true, 0.15, 0.05, 'modern', 2),

-- Default appliance configuration (mirrors existing appliance colors)
(NULL, 'metal', '#C0C0C0', 0.2, 0.8, true, false, true, false, 0.0, 0.0, 'modern', 2),

-- Default counter-top configuration
(NULL, 'stone', '#D2B48C', 0.1, 0.0, false, false, true, false, 0.0, 0.0, 'minimalist', 2),

-- Default end-panel configuration
(NULL, 'wood', '#8B4513', 0.7, 0.1, false, true, true, false, 0.0, 0.0, 'modern', 2);

-- =============================================================================
-- PART 6: PATTERN MATCHING RULES
-- =============================================================================

-- Insert pattern matching rules that mirror existing hardcoded detection logic
INSERT INTO public.model_3d_patterns (name, description, element_type, id_includes, style_includes, config_overrides, priority) VALUES 

-- Cabinet type patterns (mirrors existing isWallCabinet, isCornerCabinet, etc.)
('Wall Cabinets', 'Detects wall-mounted cabinets', 'cabinet', 
 ARRAY['wall-cabinet'], ARRAY['wall'], 
 '{"plinth_height": 0.0, "primary_color": "#A0522D"}', 10),

('Corner Cabinets', 'Detects corner cabinet units', 'cabinet', 
 ARRAY['corner-cabinet'], ARRAY['corner'], 
 '{"corner_door_style": "bi-fold", "corner_interior_shelving": true}', 20),

('Pan Drawer Units', 'Detects pan drawer cabinet units', 'cabinet', 
 ARRAY['pan-drawers'], ARRAY['pan drawer'], 
 '{"enable_door_detail": false, "handle_style": "minimalist"}', 15),

('Larder Units - Fridge', 'Detects larder built-in fridge units', 'cabinet', 
 ARRAY['larder-built-in-fridge'], NULL, 
 '{"primary_color": "#FFFFFF", "detail_level": 3}', 25),

('Larder Units - Oven', 'Detects larder oven units', 'cabinet', 
 ARRAY['larder-single-oven', 'larder-double-oven'], NULL, 
 '{"primary_color": "#2F2F2F", "detail_level": 3}', 25),

('Bedroom Storage', 'Detects bedroom storage units', 'cabinet', 
 ARRAY['wardrobe', 'chest', 'bedside'], NULL, 
 '{"wood_finish": "oak", "handle_style": "traditional"}', 15),

('Bathroom Vanities', 'Detects bathroom vanity units', 'cabinet', 
 ARRAY['vanity'], NULL, 
 '{"primary_material": "composite", "primary_color": "#F5F5DC"}', 15),

('Media Units', 'Detects TV and media units', 'cabinet', 
 ARRAY['tv-unit', 'media'], NULL, 
 '{"primary_color": "#654321", "enable_detailed_handles": false}', 15),

-- Appliance patterns
('Refrigerators', 'Detects refrigerator appliances', 'appliance', 
 ARRAY['refrigerator'], NULL, 
 '{"primary_color": "#FFFFFF", "metalness": 0.3}', 10),

('Dishwashers', 'Detects dishwasher appliances', 'appliance', 
 ARRAY['dishwasher'], NULL, 
 '{"primary_color": "#C0C0C0", "metalness": 0.8}', 10);

-- =============================================================================
-- PART 7: UTILITY FUNCTIONS
-- =============================================================================

-- Function to get configuration for an element
CREATE OR REPLACE FUNCTION get_3d_config_for_element(element_type TEXT, element_id TEXT, element_style TEXT DEFAULT '')
RETURNS TABLE (
  config_id UUID,
  primary_material TEXT,
  primary_color TEXT,
  roughness DECIMAL,
  metalness DECIMAL,
  enable_detailed_handles BOOLEAN,
  plinth_height DECIMAL,
  door_gap DECIMAL,
  handle_style TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH matched_pattern AS (
    SELECT p.config_overrides, p.priority
    FROM model_3d_patterns p
    WHERE p.active = true
      AND (p.element_type IS NULL OR p.element_type = $1)
      AND (
        (p.id_includes IS NOT NULL AND element_id = ANY(p.id_includes)) OR
        (p.style_includes IS NOT NULL AND element_style = ANY(p.style_includes)) OR
        (p.id_includes IS NULL AND p.style_includes IS NULL)
      )
    ORDER BY p.priority DESC
    LIMIT 1
  ),
  base_config AS (
    SELECT c.*
    FROM model_3d_config c
    WHERE c.component_id IS NULL 
      AND c.deprecated = false
      AND c.primary_material = CASE 
        WHEN $1 = 'appliance' THEN 'metal'
        WHEN $1 = 'counter-top' THEN 'stone'
        ELSE 'wood'
      END
    LIMIT 1
  )
  SELECT 
    bc.id,
    bc.primary_material,
    COALESCE((mp.config_overrides->>'primary_color')::TEXT, bc.primary_color),
    COALESCE((mp.config_overrides->>'roughness')::DECIMAL, bc.roughness),
    COALESCE((mp.config_overrides->>'metalness')::DECIMAL, bc.metalness),
    COALESCE((mp.config_overrides->>'enable_detailed_handles')::BOOLEAN, bc.enable_detailed_handles),
    COALESCE((mp.config_overrides->>'plinth_height')::DECIMAL, bc.plinth_height),
    COALESCE((mp.config_overrides->>'door_gap')::DECIMAL, bc.door_gap),
    COALESCE((mp.config_overrides->>'handle_style')::TEXT, bc.handle_style)
  FROM base_config bc
  LEFT JOIN matched_pattern mp ON true;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

COMMENT ON TABLE public.model_3d_config IS 'Configuration for 3D model visual enhancements - preserves existing geometry logic';
COMMENT ON TABLE public.model_3d_patterns IS 'Pattern matching rules for element detection - mirrors existing hardcoded logic';
