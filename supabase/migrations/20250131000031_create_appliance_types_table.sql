-- =============================================================================
-- Create appliance_types reference table
-- =============================================================================
-- Purpose: Move hardcoded appliance colors from EnhancedModels3D.tsx to database
--
-- Current hardcoded values (in EnhancedModels3D.tsx lines 1366-1394):
-- - oven: #2c2c2c (dark grey)
-- - dishwasher: #e0e0e0 (light grey)
-- - fridge: #f0f0f0 (off-white)
-- - washing-machine: #e8e8e8 (light grey)
-- - tumble-dryer: #e8e8e8 (light grey)
-- - microwave: #3c3c3c (dark grey)
-- - hob: #1c1c1c (very dark grey/black)
-- - cooker-hood: #d0d0d0 (medium grey)
-- - wine-cooler: #2c2c2c (dark grey)
-- - coffee-machine: #3c3c3c (dark grey)
-- - freezer: #f0f0f0 (off-white)
-- - range-cooker: #2c2c2c (dark grey)
-- - default: #cccccc (fallback grey)
--
-- Benefits:
-- - Realistic brand-specific colors
-- - Support for multiple finishes (stainless steel, black, white)
-- - Admin control over appearance
-- - Easy to add new appliance types
-- =============================================================================

-- Create appliance_types table
CREATE TABLE IF NOT EXISTS public.appliance_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appliance_code TEXT NOT NULL UNIQUE,
  appliance_name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_color TEXT NOT NULL,
  default_finish TEXT,
  typical_width DECIMAL(10,2),
  typical_height DECIMAL(10,2),
  typical_depth DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_appliance_code CHECK (length(appliance_code) > 0),
  CONSTRAINT valid_color_hex CHECK (default_color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appliance_types_code ON public.appliance_types(appliance_code);
CREATE INDEX IF NOT EXISTS idx_appliance_types_category ON public.appliance_types(category);

-- Add RLS policies
ALTER TABLE public.appliance_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appliance types are viewable by authenticated users"
  ON public.appliance_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Appliance types are editable by admins only"
  ON public.appliance_types FOR ALL
  TO authenticated
  USING (false); -- Will be updated when admin roles are implemented

-- Insert appliance type data based on current hardcoded values
INSERT INTO public.appliance_types (
  appliance_code, appliance_name, category, default_color, default_finish,
  typical_width, typical_height, typical_depth, description
) VALUES
  ('oven', 'Built-in Oven', 'cooking', '#2c2c2c', 'stainless-steel', 60, 60, 55, 'Standard built-in single oven'),
  ('dishwasher', 'Dishwasher', 'cleaning', '#e0e0e0', 'stainless-steel', 60, 82, 55, 'Integrated dishwasher'),
  ('fridge', 'Refrigerator', 'cooling', '#f0f0f0', 'white', 60, 180, 60, 'Freestanding fridge'),
  ('washing-machine', 'Washing Machine', 'laundry', '#e8e8e8', 'white', 60, 85, 60, 'Front-loading washing machine'),
  ('tumble-dryer', 'Tumble Dryer', 'laundry', '#e8e8e8', 'white', 60, 85, 60, 'Vented or condenser dryer'),
  ('microwave', 'Microwave Oven', 'cooking', '#3c3c3c', 'stainless-steel', 45, 26, 35, 'Built-in or countertop microwave'),
  ('hob', 'Cooktop/Hob', 'cooking', '#1c1c1c', 'black-glass', 60, 5, 52, 'Induction or gas hob'),
  ('cooker-hood', 'Cooker Hood', 'ventilation', '#d0d0d0', 'stainless-steel', 60, 15, 50, 'Wall-mounted or chimney hood'),
  ('wine-cooler', 'Wine Cooler', 'cooling', '#2c2c2c', 'black-glass', 60, 82, 55, 'Built-in wine refrigerator'),
  ('coffee-machine', 'Coffee Machine', 'beverage', '#3c3c3c', 'stainless-steel', 30, 45, 45, 'Built-in coffee maker'),
  ('freezer', 'Freezer', 'cooling', '#f0f0f0', 'white', 60, 180, 60, 'Upright or chest freezer'),
  ('range-cooker', 'Range Cooker', 'cooking', '#2c2c2c', 'stainless-steel', 90, 90, 60, 'Professional-style range cooker')
ON CONFLICT (appliance_code) DO NOTHING;

-- Add comments
COMMENT ON TABLE public.appliance_types IS 'Reference table for appliance types with default colors and dimensions';
COMMENT ON COLUMN public.appliance_types.appliance_code IS 'Unique code matching component_id patterns (e.g., oven, dishwasher)';
COMMENT ON COLUMN public.appliance_types.default_color IS 'Hex color code for 3D rendering (#RRGGBB)';
COMMENT ON COLUMN public.appliance_types.default_finish IS 'Material finish (stainless-steel, white, black-glass, etc.)';

-- Log completion
DO $$ BEGIN
    RAISE NOTICE 'Migration complete: Created appliance_types reference table';
    RAISE NOTICE 'Inserted 12 standard appliance types with realistic colors';
END $$;
