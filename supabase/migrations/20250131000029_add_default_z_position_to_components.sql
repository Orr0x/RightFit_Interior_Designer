-- =============================================================================
-- Add default_z_position to components table
-- =============================================================================
-- Purpose: Move hardcoded Z-axis positions from EnhancedModels3D.tsx to database
--
-- Correct Z positions (updated 2025-10-26, Story 1.8):
-- - Tall larders: 210cm tall (Z=0, tops at 210cm)
-- - Wall cabinets: Z=140cm (70cm tall typical, tops at 210cm to match larders)
-- - Cornice: Z=210cm (above wall cabinets, at top)
-- - Pelmet: Z=140cm (below wall cabinets, at bottom)
-- - Counter tops: Z=86cm (4cm thick, sits on 86cm base units, top at 90cm)
-- - Windows: Z=100cm (above 90cm worktop)
-- - Sinks: Z=75cm kitchen (Z=65cm butler, integrated into countertop)
-- - Base cabinets: Z=0cm (86cm tall with kick plates)
-- - Appliances: Z=0cm (floor level)
-- - End panels: Z=0cm base, Z=140cm wall (match parent component)
--
-- Benefits:
-- - Admin control over component heights
-- - Per-component customization
-- - Easier A/B testing of ergonomic heights
-- - Support for different regional standards
-- =============================================================================

-- Add default_z_position column
ALTER TABLE public.components
ADD COLUMN IF NOT EXISTS default_z_position DECIMAL(10,2);

-- Add comment
COMMENT ON COLUMN public.components.default_z_position IS 'Default Z-axis position (height off ground) in cm. NULL means component determines its own position.';

-- Set default Z positions based on current hardcoded values
-- Base level components (floor-standing)
UPDATE public.components
SET default_z_position = 0
WHERE category IN ('base-cabinet', 'appliance', 'end-panel', 'toe-kick', 'tall-unit', 'larder')
  AND default_z_position IS NULL;

-- Countertop level (sits on 86cm base units, 4cm thick, top at 90cm)
UPDATE public.components
SET default_z_position = 86
WHERE category IN ('worktop', 'countertop', 'counter-top')
  AND default_z_position IS NULL;

-- Kitchen sink level (integrated into countertop)
UPDATE public.components
SET default_z_position = 75
WHERE category IN ('sink', 'undermount-sink')
  AND default_z_position IS NULL;

-- Butler sink level (lower than kitchen sinks)
UPDATE public.components
SET default_z_position = 65
WHERE category = 'butler-sink'
  AND default_z_position IS NULL;

-- Wall cabinet level (above countertop)
UPDATE public.components
SET default_z_position = 140
WHERE category IN ('wall-cabinet', 'wall-unit', 'pelmet')
  AND default_z_position IS NULL;

-- Wall unit end panels (match wall cabinet height)
UPDATE public.components
SET default_z_position = 140
WHERE category = 'wall-unit-end-panel'
  AND default_z_position IS NULL;

-- Window level (above 90cm worktop)
UPDATE public.components
SET default_z_position = 100
WHERE category IN ('window', 'windows')
  AND default_z_position IS NULL;

-- Cornice level (above wall cabinets, at top of 210cm larders)
UPDATE public.components
SET default_z_position = 210
WHERE category = 'cornice'
  AND default_z_position IS NULL;

-- Add index for queries
CREATE INDEX IF NOT EXISTS idx_components_z_position
ON public.components(default_z_position)
WHERE default_z_position IS NOT NULL;

-- Log completion
DO $$ BEGIN
    RAISE NOTICE 'Migration complete: Added default_z_position column to components table';
    RAISE NOTICE 'Components updated with Z positions based on category';
END $$;
