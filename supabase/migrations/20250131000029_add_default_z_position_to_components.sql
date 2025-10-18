-- =============================================================================
-- Add default_z_position to components table
-- =============================================================================
-- Purpose: Move hardcoded Z-axis positions from EnhancedModels3D.tsx to database
--
-- Current hardcoded values (in EnhancedModels3D.tsx):
-- - cornice: 200cm (above wall cabinets)
-- - pelmet: 140cm (bottom of wall cabinets)
-- - countertop: 90cm (work surface height)
-- - sink: 90cm (mounted in countertop)
-- - toekick: 0cm (floor level)
-- - wall cabinet: 140cm (above countertop)
-- - end panel (wall): 140cm (matches wall cabinet)
-- - base cabinet: 0cm (floor level)
-- - appliance: 0cm (floor level)
-- - end panel (base): 0cm (floor level)
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

-- Countertop level (work surface)
UPDATE public.components
SET default_z_position = 90
WHERE category IN ('worktop', 'countertop', 'counter-top')
  AND default_z_position IS NULL;

-- Sink level (mounted in countertop)
UPDATE public.components
SET default_z_position = 90
WHERE category IN ('sink', 'butler-sink', 'undermount-sink')
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

-- Cornice level (above wall cabinets)
UPDATE public.components
SET default_z_position = 200
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
