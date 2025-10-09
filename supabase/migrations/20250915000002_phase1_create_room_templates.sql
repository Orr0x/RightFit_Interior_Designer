-- =============================================================================
-- PHASE 1.3: CREATE ROOM TYPE TEMPLATES TABLE
-- Move hardcoded ROOM_TYPE_CONFIGS to database
-- =============================================================================

-- Create room type templates table
CREATE TABLE IF NOT EXISTS public.room_type_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  description TEXT NOT NULL,
  default_width DECIMAL(10,2) NOT NULL,
  default_height DECIMAL(10,2) NOT NULL,
  default_wall_height DECIMAL(10,2) DEFAULT 240,
  default_ceiling_height DECIMAL(10,2) DEFAULT 250,
  default_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_dimensions CHECK (default_width > 0 AND default_height > 0),
  CONSTRAINT valid_heights CHECK (default_wall_height > 0 AND default_ceiling_height > 0),
  CONSTRAINT valid_room_type CHECK (room_type IN (
    'kitchen', 'bedroom', 'master-bedroom', 'guest-bedroom', 
    'bathroom', 'ensuite', 'living-room', 'dining-room', 
    'office', 'dressing-room', 'utility', 'under-stairs'
  ))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_room_templates_room_type ON public.room_type_templates(room_type);
CREATE INDEX IF NOT EXISTS idx_room_templates_settings ON public.room_type_templates USING GIN(default_settings);

-- Add RLS policies (inherit from existing patterns)
ALTER TABLE public.room_type_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read room type templates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'room_type_templates'
    AND policyname = 'Room type templates are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Room type templates are viewable by authenticated users"
      ON public.room_type_templates FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Only admins can modify room type templates (future feature)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'room_type_templates'
    AND policyname = 'Room type templates are editable by admins only'
  ) THEN
    CREATE POLICY "Room type templates are editable by admins only"
      ON public.room_type_templates FOR ALL
      TO authenticated
      USING (false); -- Will be updated when admin roles are implemented
  END IF;
END $$;

-- Insert room type templates with current hardcoded values
INSERT INTO public.room_type_templates (
  room_type, name, icon_name, description, 
  default_width, default_height, default_wall_height, default_ceiling_height,
  default_settings
) VALUES
  (
    'kitchen', 'Kitchen', 'ChefHat', 
    'Kitchen design with cabinets and appliances',
    600, 400, 240, 250,
    '{"default_wall_height": 250, "view_preferences": {"default_2d_view": "2d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  ),
  (
    'bedroom', 'Bedroom', 'Bed',
    'Bedroom design with furniture and storage',
    500, 400, 240, 250,
    '{"default_wall_height": 250, "view_preferences": {"default_2d_view": "2d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  ),
  (
    'master-bedroom', 'Master Bedroom', 'Bed',
    'Master bedroom with en-suite and walk-in closet space',
    600, 500, 240, 250,
    '{"default_wall_height": 250, "view_preferences": {"default_2d_view": "2d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  ),
  (
    'guest-bedroom', 'Guest Bedroom', 'Bed',
    'Guest bedroom design with essential furniture',
    450, 400, 240, 250,
    '{"default_wall_height": 250, "view_preferences": {"default_2d_view": "2d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  ),
  (
    'bathroom', 'Bathroom', 'Bath',
    'Bathroom design with fixtures and vanities',
    300, 250, 240, 250,
    '{"default_wall_height": 250, "view_preferences": {"default_2d_view": "2d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  ),
  (
    'ensuite', 'Ensuite', 'Bath',
    'Ensuite bathroom connected to master bedroom',
    250, 200, 240, 250,
    '{"default_wall_height": 250, "view_preferences": {"default_2d_view": "2d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  ),
  (
    'living-room', 'Living Room', 'Sofa',
    'Living room design with seating and entertainment',
    600, 500, 240, 250,
    '{"default_wall_height": 250, "view_preferences": {"default_2d_view": "3d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  ),
  (
    'dining-room', 'Dining Room', 'UtensilsCrossed',
    'Dining room design with table and storage',
    500, 400, 240, 250,
    '{"default_wall_height": 250, "view_preferences": {"default_2d_view": "2d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  ),
  (
    'office', 'Office', 'Briefcase',
    'Office design with desk and storage solutions',
    400, 350, 240, 250,
    '{"default_wall_height": 250, "view_preferences": {"default_2d_view": "2d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  ),
  (
    'dressing-room', 'Dressing Room', 'Shirt',
    'Walk-in closet with wardrobes and storage',
    350, 300, 240, 250,
    '{"default_wall_height": 250, "view_preferences": {"default_2d_view": "2d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  ),
  (
    'utility', 'Utility Room', 'Wrench',
    'Utility room with appliances and storage',
    300, 250, 240, 250,
    '{"default_wall_height": 250, "view_preferences": {"default_2d_view": "2d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  ),
  (
    'under-stairs', 'Under Stairs Storage', 'Package',
    'Under stairs storage and utility space',
    200, 150, 200, 220,
    '{"default_wall_height": 200, "view_preferences": {"default_2d_view": "2d", "default_2d_mode": "plan", "grid_enabled": true, "snap_to_grid": true}}'
  )
ON CONFLICT (room_type) DO UPDATE SET
  name = EXCLUDED.name,
  icon_name = EXCLUDED.icon_name,
  description = EXCLUDED.description,
  default_width = EXCLUDED.default_width,
  default_height = EXCLUDED.default_height,
  default_wall_height = EXCLUDED.default_wall_height,
  default_ceiling_height = EXCLUDED.default_ceiling_height,
  default_settings = EXCLUDED.default_settings,
  updated_at = now();

-- Add comments
COMMENT ON TABLE public.room_type_templates IS 'Templates for room types with default dimensions and settings';
COMMENT ON COLUMN public.room_type_templates.room_type IS 'Unique room type identifier';
COMMENT ON COLUMN public.room_type_templates.default_settings IS 'Default room settings including view preferences';

-- Log completion
DO $$ BEGIN
    RAISE NOTICE 'Phase 1.3 Complete: Room type templates table created with % templates', (SELECT COUNT(*) FROM public.room_type_templates);
END $$;
