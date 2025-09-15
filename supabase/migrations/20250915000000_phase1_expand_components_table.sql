-- =============================================================================
-- PHASE 1.1: EXPAND COMPONENTS TABLE
-- Add missing component properties to eliminate hardcoded COMPONENT_DATA
-- =============================================================================

-- Add missing component behavior properties
ALTER TABLE public.components ADD COLUMN IF NOT EXISTS
  mount_type TEXT CHECK (mount_type IN ('floor', 'wall')) DEFAULT 'floor';

ALTER TABLE public.components ADD COLUMN IF NOT EXISTS
  has_direction BOOLEAN DEFAULT true;

ALTER TABLE public.components ADD COLUMN IF NOT EXISTS
  door_side TEXT CHECK (door_side IN ('front', 'back', 'left', 'right')) DEFAULT 'front';

ALTER TABLE public.components ADD COLUMN IF NOT EXISTS
  default_z_position DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.components ADD COLUMN IF NOT EXISTS
  elevation_height DECIMAL(10,2);

ALTER TABLE public.components ADD COLUMN IF NOT EXISTS
  corner_configuration JSONB DEFAULT '{}';

ALTER TABLE public.components ADD COLUMN IF NOT EXISTS
  component_behavior JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_components_mount_type ON public.components(mount_type);
CREATE INDEX IF NOT EXISTS idx_components_has_direction ON public.components(has_direction);
CREATE INDEX IF NOT EXISTS idx_components_door_side ON public.components(door_side);
CREATE INDEX IF NOT EXISTS idx_components_behavior ON public.components USING GIN(component_behavior);
CREATE INDEX IF NOT EXISTS idx_components_corner_config ON public.components USING GIN(corner_configuration);

-- Add comment for documentation
COMMENT ON COLUMN public.components.mount_type IS 'Where component mounts: floor or wall';
COMMENT ON COLUMN public.components.has_direction IS 'Whether component has directional orientation (doors, etc)';
COMMENT ON COLUMN public.components.door_side IS 'Which side doors/openings face';
COMMENT ON COLUMN public.components.default_z_position IS 'Default height off floor in cm';
COMMENT ON COLUMN public.components.elevation_height IS 'Height in elevation view (if different from 3D height)';
COMMENT ON COLUMN public.components.corner_configuration IS 'Corner-specific configuration for L-shaped components';
COMMENT ON COLUMN public.components.component_behavior IS 'Extensible behavior properties';

-- Log completion
DO $$ BEGIN
    RAISE NOTICE 'Phase 1.1 Complete: Components table expanded with behavior properties';
END $$;
