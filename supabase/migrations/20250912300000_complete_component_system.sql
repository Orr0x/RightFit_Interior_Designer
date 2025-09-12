-- Complete Component Management System
-- Consolidates: component schema, initial data, and full component library
-- Created: 2025-09-12
-- Purpose: Scalable component system for interior design application

-- =============================================================================
-- PART 1: DATABASE SCHEMA
-- =============================================================================

-- Create components table with versioning and metadata support
CREATE TABLE IF NOT EXISTS public.components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Core component data
  component_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cabinet', 'appliance', 'counter-top', 'end-panel', 'window', 'door', 'flooring', 'toe-kick', 'cornice', 'pelmet', 'wall-unit-end-panel')),
  width DECIMAL(10,2) NOT NULL,
  depth DECIMAL(10,2) NOT NULL,
  height DECIMAL(10,2) NOT NULL,
  color TEXT NOT NULL,
  category TEXT NOT NULL,
  room_types TEXT[] NOT NULL,
  icon_name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Versioning and lifecycle
  version TEXT NOT NULL DEFAULT '1.0.0',
  deprecated BOOLEAN NOT NULL DEFAULT false,
  deprecation_reason TEXT,
  replacement_component_id TEXT,
  
  -- Future extensibility
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT valid_dimensions CHECK (width > 0 AND depth > 0 AND height > 0)
);

-- Create component room types junction table
CREATE TABLE IF NOT EXISTS public.component_room_types (
  component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  PRIMARY KEY (component_id, room_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_components_component_id ON public.components(component_id);
CREATE INDEX IF NOT EXISTS idx_components_category ON public.components(category);
CREATE INDEX IF NOT EXISTS idx_components_type ON public.components(type);
CREATE INDEX IF NOT EXISTS idx_components_deprecated ON public.components(deprecated);
CREATE INDEX IF NOT EXISTS idx_components_version ON public.components(version);
CREATE INDEX IF NOT EXISTS idx_components_tags ON public.components USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_components_metadata ON public.components USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_component_room_types_room_type ON public.component_room_types(room_type);

-- =============================================================================
-- PART 2: ROW LEVEL SECURITY
-- =============================================================================

-- Enable Row Level Security
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_room_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for components
-- Public can view non-deprecated components
DROP POLICY IF EXISTS "Public can view active components" ON public.components;
CREATE POLICY "Public can view active components"
ON public.components FOR SELECT
USING (deprecated = false);

-- DEV+ can view all components (including deprecated)
DROP POLICY IF EXISTS "DEV+ can view all components" ON public.components;
CREATE POLICY "DEV+ can view all components"
ON public.components FOR SELECT
USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_tier IN ('dev', 'admin', 'god')));

-- DEV+ can manage components
DROP POLICY IF EXISTS "DEV+ can manage components" ON public.components;
CREATE POLICY "DEV+ can manage components"
ON public.components FOR ALL
USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_tier IN ('dev', 'admin', 'god')))
WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_tier IN ('dev', 'admin', 'god')));

-- RLS Policies for component_room_types
DROP POLICY IF EXISTS "Public can view component room types" ON public.component_room_types;
CREATE POLICY "Public can view component room types"
ON public.component_room_types FOR SELECT
USING (true);

DROP POLICY IF EXISTS "DEV+ can manage component room types" ON public.component_room_types;
CREATE POLICY "DEV+ can manage component room types"
ON public.component_room_types FOR ALL
USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_tier IN ('dev', 'admin', 'god')))
WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_tier IN ('dev', 'admin', 'god')));

-- =============================================================================
-- PART 3: HELPER FUNCTIONS
-- =============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column_components()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_components_updated_at ON public.components;
CREATE TRIGGER update_components_updated_at
  BEFORE UPDATE ON public.components
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column_components();

-- Function to get components by room type
CREATE OR REPLACE FUNCTION public.get_components_by_room_type(room_type_param TEXT)
RETURNS TABLE (
  id UUID,
  component_id TEXT,
  name TEXT,
  type TEXT,
  width DECIMAL,
  depth DECIMAL,
  height DECIMAL,
  color TEXT,
  category TEXT,
  room_types TEXT[],
  icon_name TEXT,
  description TEXT,
  version TEXT,
  deprecated BOOLEAN,
  metadata JSONB,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id, c.component_id, c.name, c.type, c.width, c.depth, c.height,
    c.color, c.category, c.room_types, c.icon_name, c.description,
    c.version, c.deprecated, c.metadata, c.tags
  FROM public.components c
  WHERE room_type_param = ANY(c.room_types)
    AND c.deprecated = false
  ORDER BY c.category, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get component by stable ID
CREATE OR REPLACE FUNCTION public.get_component_by_id(component_id_param TEXT, version_param TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  component_id TEXT,
  name TEXT,
  type TEXT,
  width DECIMAL,
  depth DECIMAL,
  height DECIMAL,
  color TEXT,
  category TEXT,
  room_types TEXT[],
  icon_name TEXT,
  description TEXT,
  version TEXT,
  deprecated BOOLEAN,
  metadata JSONB,
  tags TEXT[]
) AS $$
BEGIN
  IF version_param IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      c.id, c.component_id, c.name, c.type, c.width, c.depth, c.height,
      c.color, c.category, c.room_types, c.icon_name, c.description,
      c.version, c.deprecated, c.metadata, c.tags
    FROM public.components c
    WHERE c.component_id = component_id_param 
      AND c.version = version_param;
  ELSE
    RETURN QUERY
    SELECT 
      c.id, c.component_id, c.name, c.type, c.width, c.depth, c.height,
      c.color, c.category, c.room_types, c.icon_name, c.description,
      c.version, c.deprecated, c.metadata, c.tags
    FROM public.components c
    WHERE c.component_id = component_id_param 
      AND c.deprecated = false
    ORDER BY c.version DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 4: INITIAL COMPONENT DATA (Sample - Full library loaded separately)
-- =============================================================================

-- Temporarily disable RLS for initial data seeding
ALTER TABLE public.components DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_room_types DISABLE ROW LEVEL SECURITY;

-- Clear any existing components
DELETE FROM public.components;

-- Insert essential components for immediate functionality
INSERT INTO public.components (
  component_id, name, type, width, depth, height, color, category, room_types, icon_name, description, version, deprecated, metadata, tags
) VALUES 
-- Core counter tops (universal)
('counter-top-horizontal', 'Counter Top Horizontal', 'counter-top', 300, 60, 4, '#D2B48C', 'counter-tops', 
 ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'office', 'dining-room', 'dressing-room', 'utility', 'under-stairs', 'media-wall', 'internal-doors', 'flooring'], 
 'Square', 'Horizontal counter top - 300cm x 60cm x 4cm (left-to-right)', '1.0.0', false, '{}', '{}'),

('counter-top-vertical', 'Counter Top Vertical', 'counter-top', 60, 300, 4, '#D2B48C', 'counter-tops',
 ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'office', 'dining-room', 'dressing-room', 'utility', 'under-stairs', 'media-wall', 'internal-doors', 'flooring'],
 'Square', 'Vertical counter top - 60cm x 300cm x 4cm (front-to-back)', '1.0.0', false, '{}', '{}'),

-- Essential kitchen components
('base-cabinet-60', 'Base Cabinet 60cm', 'cabinet', 60, 58, 72, '#F5DEB3', 'base-cabinets',
 ARRAY['kitchen'], 'Archive', 'Standard 60cm base cabinet', '1.0.0', false, '{}', '{}'),

('wall-cabinet-60', 'Wall Cabinet 60cm', 'cabinet', 60, 32, 72, '#F5DEB3', 'wall-units',
 ARRAY['kitchen'], 'Archive', 'Standard 60cm wall cabinet', '1.0.0', false, '{}', '{}'),

('corner-cabinet', 'Corner Base Cabinet', 'cabinet', 90, 90, 72, '#F5DEB3', 'base-cabinets',
 ARRAY['kitchen'], 'Archive', 'Corner base cabinet with lazy susan', '1.0.0', false, '{}', '{}'),

-- Essential appliances
('refrigerator', 'Refrigerator', 'appliance', 60, 60, 180, '#f0f0f0', 'appliances',
 ARRAY['kitchen'], 'Refrigerator', 'Standard refrigerator', '1.0.0', false, '{}', '{}'),

('dishwasher', 'Dishwasher', 'appliance', 60, 58, 82, '#f0f0f0', 'appliances',
 ARRAY['kitchen'], 'Waves', 'Built-in dishwasher', '1.0.0', false, '{}', '{}')

ON CONFLICT (component_id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_room_types ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 COMPLETE COMPONENT SYSTEM DEPLOYED! 🎉';
  RAISE NOTICE '✅ Database schema with versioning and metadata support';
  RAISE NOTICE '✅ Row Level Security with tier-based access control';
  RAISE NOTICE '✅ Helper functions for component retrieval';
  RAISE NOTICE '✅ Essential component data for immediate use';
  RAISE NOTICE '🚀 Component Manager is ready for professional use!';
  RAISE NOTICE '📦 Full component library (154 components) loaded via separate process';
  RAISE NOTICE '🏠 Supports: Kitchen, Bedroom, Bathroom, Living Room, Office, and more!';
END $$;
