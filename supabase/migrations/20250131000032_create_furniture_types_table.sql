-- =============================================================================
-- Create furniture_types reference table
-- =============================================================================
-- Purpose: Store default properties for furniture items (beds, sofas, tables, etc.)
--
-- Current state: Furniture component properties are partially hardcoded in component
-- definitions. This table provides a central reference for default properties.
--
-- Benefits:
-- - Centralized furniture specifications
-- - Easy to add new furniture types
-- - Support for multiple styles/finishes
-- - Admin control over defaults
-- - Realistic dimensions for different regions
-- =============================================================================

-- Create furniture_types table
CREATE TABLE IF NOT EXISTS public.furniture_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  furniture_code TEXT NOT NULL UNIQUE,
  furniture_name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_color TEXT,
  default_material TEXT,
  typical_width DECIMAL(10,2),
  typical_height DECIMAL(10,2),
  typical_depth DECIMAL(10,2),
  weight_capacity_kg DECIMAL(10,2),
  description TEXT,
  style_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_furniture_code CHECK (length(furniture_code) > 0),
  CONSTRAINT valid_dimensions CHECK (
    typical_width > 0 AND typical_height > 0 AND typical_depth > 0
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_furniture_types_code ON public.furniture_types(furniture_code);
CREATE INDEX IF NOT EXISTS idx_furniture_types_category ON public.furniture_types(category);
CREATE INDEX IF NOT EXISTS idx_furniture_types_style_tags ON public.furniture_types USING GIN(style_tags);

-- Add RLS policies
ALTER TABLE public.furniture_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Furniture types are viewable by authenticated users"
  ON public.furniture_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Furniture types are editable by admins only"
  ON public.furniture_types FOR ALL
  TO authenticated
  USING (false); -- Will be updated when admin roles are implemented

-- Insert common furniture type data
INSERT INTO public.furniture_types (
  furniture_code, furniture_name, category, default_color, default_material,
  typical_width, typical_height, typical_depth, weight_capacity_kg, description, style_tags
) VALUES
  -- Bedroom furniture
  ('single-bed', 'Single Bed', 'bed', '#8B7355', 'wood', 90, 50, 190, 150, 'Standard single bed frame', ARRAY['bedroom', 'modern']),
  ('double-bed', 'Double Bed', 'bed', '#8B7355', 'wood', 135, 50, 190, 200, 'Standard double bed frame', ARRAY['bedroom', 'modern']),
  ('king-bed', 'King Size Bed', 'bed', '#8B7355', 'wood', 150, 50, 200, 250, 'King size bed frame', ARRAY['bedroom', 'luxury']),
  ('wardrobe-2door', '2-Door Wardrobe', 'storage', '#D2B48C', 'wood', 100, 200, 60, 100, 'Two-door wardrobe', ARRAY['bedroom', 'classic']),
  ('wardrobe-3door', '3-Door Wardrobe', 'storage', '#D2B48C', 'wood', 150, 200, 60, 150, 'Three-door wardrobe', ARRAY['bedroom', 'classic']),
  ('chest-drawers', 'Chest of Drawers', 'storage', '#D2B48C', 'wood', 80, 110, 40, 80, '5-drawer chest', ARRAY['bedroom', 'classic']),
  ('bedside-table', 'Bedside Table', 'storage', '#D2B48C', 'wood', 45, 60, 40, 30, 'Small bedside table', ARRAY['bedroom', 'modern']),

  -- Living room furniture
  ('sofa-2seater', '2-Seater Sofa', 'seating', '#808080', 'fabric', 150, 85, 90, 200, 'Compact 2-seater sofa', ARRAY['living-room', 'modern']),
  ('sofa-3seater', '3-Seater Sofa', 'seating', '#808080', 'fabric', 200, 85, 90, 300, 'Standard 3-seater sofa', ARRAY['living-room', 'modern']),
  ('armchair', 'Armchair', 'seating', '#808080', 'fabric', 80, 85, 90, 120, 'Single armchair', ARRAY['living-room', 'modern']),
  ('coffee-table', 'Coffee Table', 'table', '#8B7355', 'wood', 120, 45, 60, 50, 'Living room coffee table', ARRAY['living-room', 'modern']),
  ('tv-unit', 'TV Unit', 'storage', '#8B7355', 'wood', 150, 50, 45, 100, 'Media console for TV', ARRAY['living-room', 'modern']),
  ('bookshelf', 'Bookshelf', 'storage', '#8B7355', 'wood', 80, 180, 30, 150, '5-shelf bookcase', ARRAY['living-room', 'office']),

  -- Dining room furniture
  ('dining-table-4', 'Dining Table (4-seat)', 'table', '#8B7355', 'wood', 120, 75, 80, 100, 'Rectangular table for 4', ARRAY['dining-room', 'modern']),
  ('dining-table-6', 'Dining Table (6-seat)', 'table', '#8B7355', 'wood', 160, 75, 90, 150, 'Rectangular table for 6', ARRAY['dining-room', 'modern']),
  ('dining-chair', 'Dining Chair', 'seating', '#8B7355', 'wood', 45, 90, 50, 120, 'Standard dining chair', ARRAY['dining-room', 'modern']),
  ('sideboard', 'Sideboard', 'storage', '#8B7355', 'wood', 150, 85, 45, 100, 'Dining room sideboard', ARRAY['dining-room', 'classic']),

  -- Office furniture
  ('desk-computer', 'Computer Desk', 'desk', '#8B7355', 'wood', 120, 75, 60, 80, 'Standard computer desk', ARRAY['office', 'modern']),
  ('desk-corner', 'Corner Desk', 'desk', '#8B7355', 'wood', 140, 75, 140, 100, 'L-shaped corner desk', ARRAY['office', 'modern']),
  ('office-chair', 'Office Chair', 'seating', '#000000', 'mesh', 65, 110, 65, 130, 'Ergonomic office chair', ARRAY['office', 'modern']),
  ('filing-cabinet', 'Filing Cabinet', 'storage', '#D3D3D3', 'metal', 45, 132, 62, 150, '4-drawer filing cabinet', ARRAY['office', 'modern'])
ON CONFLICT (furniture_code) DO NOTHING;

-- Add comments
COMMENT ON TABLE public.furniture_types IS 'Reference table for furniture types with default properties and dimensions';
COMMENT ON COLUMN public.furniture_types.furniture_code IS 'Unique code matching component_id patterns (e.g., single-bed, sofa-3seater)';
COMMENT ON COLUMN public.furniture_types.default_color IS 'Hex color code or color name for 3D rendering';
COMMENT ON COLUMN public.furniture_types.default_material IS 'Material type (wood, fabric, metal, leather, etc.)';
COMMENT ON COLUMN public.furniture_types.style_tags IS 'Array of style tags for filtering (modern, classic, luxury, etc.)';

-- Log completion
DO $$ BEGIN
    RAISE NOTICE 'Migration complete: Created furniture_types reference table';
    RAISE NOTICE 'Inserted 21 common furniture types across bedroom, living room, dining room, and office';
END $$;
