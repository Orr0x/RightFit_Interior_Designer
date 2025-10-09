-- Migration: Create 2D Renders Schema
-- Date: 2025-10-09
-- Purpose: Add database-driven 2D rendering support for component management
-- Related: docs/session-2025-10-09-2d-database-migration/

-- =====================================================
-- Table: component_2d_renders
-- Purpose: Store 2D rendering metadata for all components
-- =====================================================

CREATE TABLE IF NOT EXISTS component_2d_renders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id text NOT NULL REFERENCES components(component_id) ON DELETE CASCADE,

  -- Plan View Configuration (top-down view)
  plan_view_type text NOT NULL DEFAULT 'rectangle',
  plan_view_data jsonb DEFAULT '{}',
  plan_view_svg text, -- Optional SVG path for custom shapes

  -- Elevation View Configuration (front/back views)
  elevation_type text NOT NULL DEFAULT 'standard-cabinet',
  elevation_data jsonb DEFAULT '{}',
  elevation_svg_front text, -- Optional SVG for front view
  elevation_svg_back text,  -- Optional SVG for back view

  -- Side Elevation Configuration (left/right views)
  side_elevation_type text NOT NULL DEFAULT 'standard-cabinet',
  side_elevation_data jsonb DEFAULT '{}',
  elevation_svg_left text,  -- Optional SVG for left view
  elevation_svg_right text, -- Optional SVG for right view

  -- Visual Properties
  fill_color text DEFAULT '#8b4513',
  stroke_color text DEFAULT '#000000',
  stroke_width numeric DEFAULT 1,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(component_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_component_2d_renders_component_id
ON component_2d_renders(component_id);

CREATE INDEX IF NOT EXISTS idx_component_2d_renders_plan_view_type
ON component_2d_renders(plan_view_type);

CREATE INDEX IF NOT EXISTS idx_component_2d_renders_elevation_type
ON component_2d_renders(elevation_type);

-- =====================================================
-- Trigger: Update updated_at timestamp
-- =====================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_component_2d_renders_updated_at ON component_2d_renders;
CREATE TRIGGER update_component_2d_renders_updated_at
BEFORE UPDATE ON component_2d_renders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE component_2d_renders ENABLE ROW LEVEL SECURITY;

-- Public read access (all users can view 2D render definitions)
DROP POLICY IF EXISTS "component_2d_renders_select_policy" ON component_2d_renders;
CREATE POLICY "component_2d_renders_select_policy"
ON component_2d_renders FOR SELECT
USING (true);

-- Admin write access (service role can insert/update/delete)
DROP POLICY IF EXISTS "component_2d_renders_insert_policy" ON component_2d_renders;
CREATE POLICY "component_2d_renders_insert_policy"
ON component_2d_renders FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "component_2d_renders_update_policy" ON component_2d_renders;
CREATE POLICY "component_2d_renders_update_policy"
ON component_2d_renders FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "component_2d_renders_delete_policy" ON component_2d_renders;
CREATE POLICY "component_2d_renders_delete_policy"
ON component_2d_renders FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE component_2d_renders IS 'Database-driven 2D rendering definitions for components. Replaces hardcoded rendering logic in DesignCanvas2D.tsx';

COMMENT ON COLUMN component_2d_renders.plan_view_type IS 'Plan view render type: rectangle, corner-square, sink-single, sink-double, sink-corner, custom-svg';

COMMENT ON COLUMN component_2d_renders.plan_view_data IS 'JSONB data for plan view rendering (e.g., bowl_inset_ratio, bowl_style for sinks)';

COMMENT ON COLUMN component_2d_renders.elevation_type IS 'Elevation view render type: standard-cabinet, appliance, sink, open-shelf, custom-svg';

COMMENT ON COLUMN component_2d_renders.elevation_data IS 'JSONB data for elevation rendering (e.g., door_count, handle_style for cabinets)';

-- =====================================================
-- Validation Constraints
-- =====================================================

-- Validate plan_view_type
ALTER TABLE component_2d_renders
ADD CONSTRAINT check_plan_view_type
CHECK (plan_view_type IN (
  'rectangle',
  'corner-square',
  'sink-single',
  'sink-double',
  'sink-corner',
  'custom-svg'
));

-- Validate elevation_type
ALTER TABLE component_2d_renders
ADD CONSTRAINT check_elevation_type
CHECK (elevation_type IN (
  'standard-cabinet',
  'appliance',
  'sink',
  'open-shelf',
  'custom-svg'
));

-- Validate side_elevation_type
ALTER TABLE component_2d_renders
ADD CONSTRAINT check_side_elevation_type
CHECK (side_elevation_type IN (
  'standard-cabinet',
  'appliance',
  'sink',
  'open-shelf',
  'custom-svg'
));

-- Validate colors are hex format (optional but helpful)
ALTER TABLE component_2d_renders
ADD CONSTRAINT check_fill_color_format
CHECK (fill_color ~ '^#[0-9A-Fa-f]{6}$' OR fill_color IS NULL);

ALTER TABLE component_2d_renders
ADD CONSTRAINT check_stroke_color_format
CHECK (stroke_color ~ '^#[0-9A-Fa-f]{6}$' OR stroke_color IS NULL);

-- =====================================================
-- Example Data (for reference - commented out)
-- =====================================================

/*
-- Example: Standard rectangular cabinet
INSERT INTO component_2d_renders (component_id, plan_view_type, elevation_type, elevation_data)
VALUES (
  'base-cabinet-60',
  'rectangle',
  'standard-cabinet',
  '{"door_count": 2, "door_style": "flat", "handle_style": "bar", "handle_position": "center", "has_toe_kick": true, "toe_kick_height": 10}'::jsonb
);

-- Example: Corner cabinet
INSERT INTO component_2d_renders (component_id, plan_view_type, elevation_type, elevation_data)
VALUES (
  'corner-base-cabinet-90',
  'corner-square',
  'standard-cabinet',
  '{"door_count": 1, "door_style": "flat", "handle_style": "bar", "has_toe_kick": true}'::jsonb
);

-- Example: Single bowl sink
INSERT INTO component_2d_renders (component_id, plan_view_type, plan_view_data, elevation_type, elevation_data)
VALUES (
  'butler-sink-60',
  'sink-single',
  '{"bowl_inset_ratio": 0.15, "bowl_depth_ratio": 0.8, "bowl_style": "ceramic", "has_drain": true, "has_faucet_hole": true}'::jsonb,
  'sink',
  '{"has_front_panel": true, "panel_height": 10}'::jsonb
);

-- Example: Double bowl sink
INSERT INTO component_2d_renders (component_id, plan_view_type, plan_view_data, elevation_type)
VALUES (
  'double-bowl-sink-100',
  'sink-double',
  '{"bowl_inset_ratio": 0.1, "bowl_width_ratio": 0.4, "center_divider_width": 5, "bowl_style": "stainless"}'::jsonb,
  'sink'
);
*/

-- =====================================================
-- Migration Complete
-- =====================================================

-- Log migration success
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete: component_2d_renders table created';
  RAISE NOTICE '📊 Table ready for population script';
  RAISE NOTICE '🔍 Next step: Run scripts/populate-2d-renders.ts';
END $$;
