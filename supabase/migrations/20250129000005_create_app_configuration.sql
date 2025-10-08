-- App Configuration System Migration
-- Purpose: Move hardcoded configuration values to database for dynamic updates
-- Created: January 2025
-- Feature Flag: use_database_configuration

-- ============================================
-- 1. CREATE APP_CONFIGURATION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'canvas', 'zoom', 'wall', 'snap', 'component',
    'positioning', 'interaction', 'rendering', 'other'
  )),

  -- Value storage (use appropriate column based on data type)
  value_numeric DECIMAL(10, 4), -- For numbers (most common)
  value_string TEXT,             -- For text values
  value_boolean BOOLEAN,         -- For true/false
  value_json JSONB,              -- For complex objects/arrays

  -- Metadata
  unit VARCHAR(20),              -- 'cm', 'px', 'm', 'scale', 'ratio', etc.
  description TEXT,
  default_value TEXT,            -- String representation of default

  -- Validation constraints
  min_value DECIMAL(10, 4),
  max_value DECIMAL(10, 4),
  valid_values JSONB,            -- For enum-like values

  -- Environment-specific overrides (NULL = use value_numeric)
  dev_value DECIMAL(10, 4),
  staging_value DECIMAL(10, 4),
  production_value DECIMAL(10, 4),

  -- Change tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_app_config_key ON public.app_configuration(config_key);
CREATE INDEX IF NOT EXISTS idx_app_config_category ON public.app_configuration(category);
CREATE INDEX IF NOT EXISTS idx_app_config_updated ON public.app_configuration(updated_at);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.app_configuration ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Everyone can read configuration (needed for client-side)
DROP POLICY IF EXISTS "Anyone can view app configuration" ON public.app_configuration;
CREATE POLICY "Anyone can view app configuration"
ON public.app_configuration FOR SELECT
USING (true);

-- ============================================
-- 5. CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_app_config_timestamp ON public.app_configuration;
CREATE TRIGGER update_app_config_timestamp
BEFORE UPDATE ON public.app_configuration
FOR EACH ROW
EXECUTE FUNCTION public.update_app_config_updated_at();

-- ============================================
-- 6. INSERT INITIAL CONFIGURATION VALUES
-- ============================================

-- CANVAS SETTINGS
INSERT INTO public.app_configuration (config_key, config_name, category, value_numeric, unit, description, min_value, max_value) VALUES
  ('canvas_width', 'Canvas Width', 'canvas', 1600, 'px', 'Canvas workspace width', 800, 3200),
  ('canvas_height', 'Canvas Height', 'canvas', 1200, 'px', 'Canvas workspace height', 600, 2400),
  ('grid_size', 'Grid Size', 'canvas', 20, 'px', 'Grid spacing in pixels', 5, 50)
ON CONFLICT (config_key) DO NOTHING;

-- ZOOM SETTINGS
INSERT INTO public.app_configuration (config_key, config_name, category, value_numeric, unit, description, min_value, max_value) VALUES
  ('min_zoom', 'Minimum Zoom', 'zoom', 0.5, 'scale', 'Minimum zoom level', 0.1, 1.0),
  ('max_zoom', 'Maximum Zoom', 'zoom', 4.0, 'scale', 'Maximum zoom level', 2.0, 10.0)
ON CONFLICT (config_key) DO NOTHING;

-- WALL SETTINGS
INSERT INTO public.app_configuration (config_key, config_name, category, value_numeric, unit, description, min_value, max_value) VALUES
  ('wall_thickness', 'Wall Thickness', 'wall', 10, 'cm', 'Wall thickness (matches 3D view)', 5, 30),
  ('wall_clearance', 'Wall Clearance', 'wall', 5, 'cm', 'Clearance from walls for components', 0, 20),
  ('wall_snap_threshold', 'Wall Snap Threshold', 'wall', 40, 'cm', 'Snap to wall if within this distance', 10, 100)
ON CONFLICT (config_key) DO NOTHING;

-- SNAP & ALIGNMENT SETTINGS
INSERT INTO public.app_configuration (config_key, config_name, category, value_numeric, unit, description, min_value, max_value) VALUES
  ('snap_tolerance_default', 'Snap Tolerance (Default)', 'snap', 15, 'cm', 'Component snap tolerance', 5, 50),
  ('snap_tolerance_countertop', 'Snap Tolerance (Counter-top)', 'snap', 25, 'cm', 'Counter-top snap tolerance (more generous)', 10, 50),
  ('proximity_threshold', 'Proximity Threshold', 'snap', 100, 'cm', 'Component-to-component snap range', 50, 300),
  ('wall_snap_distance_default', 'Wall Snap Distance (Default)', 'snap', 35, 'cm', 'Wall snap distance for components', 10, 100),
  ('wall_snap_distance_countertop', 'Wall Snap Distance (Counter-top)', 'snap', 50, 'cm', 'Wall snap distance for counter-tops', 10, 100),
  ('corner_tolerance', 'Corner Tolerance', 'snap', 30, 'cm', 'Corner detection tolerance', 10, 100)
ON CONFLICT (config_key) DO NOTHING;

-- COMPONENT DIMENSIONS
INSERT INTO public.app_configuration (config_key, config_name, category, value_numeric, unit, description, min_value, max_value) VALUES
  ('cornice_height', 'Cornice Height', 'component', 30, 'cm', 'Standard cornice height', 10, 100),
  ('pelmet_height', 'Pelmet Height', 'component', 20, 'cm', 'Standard pelmet height', 10, 50),
  ('countertop_thickness', 'Counter-top Thickness', 'component', 4, 'cm', 'Counter-top thickness', 2, 10),
  ('wall_cabinet_height', 'Wall Cabinet Height', 'component', 70, 'cm', 'Standard wall cabinet height', 50, 100),
  ('base_cabinet_height', 'Base Cabinet Height', 'component', 90, 'cm', 'Standard base cabinet height', 70, 110),
  ('window_height', 'Window Height', 'component', 100, 'cm', 'Standard window height', 50, 200),
  ('wall_end_panel_height', 'Wall End Panel Height', 'component', 70, 'cm', 'Wall unit end panel height', 50, 100),
  ('toe_kick_height', 'Toe Kick Height', 'component', 8, 'cm', 'Toe kick height for base cabinets', 5, 15),
  ('corner_countertop_size', 'Corner Counter-top Size', 'component', 90, 'cm', 'Corner counter-top footprint (square)', 60, 120)
ON CONFLICT (config_key) DO NOTHING;

-- VERTICAL POSITIONING (Y offsets from floor in elevation views)
INSERT INTO public.app_configuration (config_key, config_name, category, value_numeric, unit, description, min_value, max_value) VALUES
  ('wall_cabinet_y_offset', 'Wall Cabinet Y Offset', 'positioning', 140, 'cm', 'Wall cabinet distance from floor', 100, 200),
  ('cornice_y_offset', 'Cornice Y Offset', 'positioning', 200, 'cm', 'Cornice distance from floor', 150, 300),
  ('pelmet_y_offset', 'Pelmet Y Offset', 'positioning', 140, 'cm', 'Pelmet distance from floor', 100, 200),
  ('countertop_y_offset', 'Counter-top Y Offset', 'positioning', 90, 'cm', 'Counter-top distance from floor', 70, 110),
  ('butler_sink_y_offset', 'Butler Sink Y Offset', 'positioning', 65, 'cm', 'Butler sink distance from floor', 50, 90),
  ('kitchen_sink_y_offset', 'Kitchen Sink Y Offset', 'positioning', 75, 'cm', 'Kitchen sink distance from floor', 60, 100)
ON CONFLICT (config_key) DO NOTHING;

-- INTERACTION SETTINGS
INSERT INTO public.app_configuration (config_key, config_name, category, value_numeric, unit, description, min_value, max_value) VALUES
  ('drag_threshold_mouse', 'Drag Threshold (Mouse)', 'interaction', 5, 'px', 'Mouse drag threshold', 1, 20),
  ('drag_threshold_touch', 'Drag Threshold (Touch)', 'interaction', 10, 'px', 'Touch drag threshold (more forgiving)', 5, 30)
ON CONFLICT (config_key) DO NOTHING;

-- COMPONENT DETAILS (ratios and proportions)
INSERT INTO public.app_configuration (config_key, config_name, category, value_numeric, unit, description, min_value, max_value) VALUES
  ('corner_door_width_ratio', 'Corner Door Width Ratio', 'component', 0.33, 'ratio', 'Corner door width as ratio of total (0.33 = 33%)', 0.2, 0.5)
ON CONFLICT (config_key) DO NOTHING;

-- ============================================
-- 7. CREATE HELPER VIEW FOR ACTIVE VALUES
-- ============================================

-- View to get current effective value based on environment
CREATE OR REPLACE VIEW public.app_config_effective AS
SELECT
  config_key,
  config_name,
  category,
  COALESCE(
    CASE current_setting('app.environment', true)
      WHEN 'development' THEN dev_value
      WHEN 'staging' THEN staging_value
      WHEN 'production' THEN production_value
      ELSE NULL
    END,
    value_numeric
  ) as effective_value,
  value_numeric as default_value,
  unit,
  description,
  min_value,
  max_value
FROM public.app_configuration
WHERE value_numeric IS NOT NULL;

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON public.app_config_effective TO authenticated;
GRANT SELECT ON public.app_config_effective TO anon;

-- ============================================
-- 9. ADD HELPFUL COMMENTS
-- ============================================

COMMENT ON TABLE public.app_configuration IS 'Application configuration values moved from hardcoded constants to database';
COMMENT ON COLUMN public.app_configuration.config_key IS 'Unique identifier (e.g., wall_thickness, canvas_width)';
COMMENT ON COLUMN public.app_configuration.category IS 'Grouping: canvas, zoom, wall, snap, component, positioning, interaction';
COMMENT ON COLUMN public.app_configuration.value_numeric IS 'Numeric value (most common type)';
COMMENT ON COLUMN public.app_configuration.unit IS 'Unit of measurement: cm, px, m, scale, ratio';
COMMENT ON COLUMN public.app_configuration.dev_value IS 'Override value for development environment';
COMMENT ON VIEW public.app_config_effective IS 'Effective configuration values based on current environment';
