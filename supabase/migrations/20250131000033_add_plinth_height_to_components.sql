-- =============================================================================
-- Add plinth_height to components table
-- =============================================================================
-- Purpose: Move hardcoded plinth/toe-kick heights from code to database
--
-- Current hardcoded values:
-- - Standard plinth height: 10cm (in various files)
-- - Configuration table has toe_kick_height: 8cm
-- - Components may need different plinth heights
--
-- Benefits:
-- - Per-component plinth customization
-- - Support for different plinth styles (recessed, flush, etc.)
-- - Admin control over heights
-- - Regional standard support (EU vs US)
-- =============================================================================

-- Add plinth_height column
ALTER TABLE public.components
ADD COLUMN IF NOT EXISTS plinth_height DECIMAL(10,2);

-- Add comment
COMMENT ON COLUMN public.components.plinth_height IS 'Height of plinth/toe-kick in cm. NULL means use default from configuration (8-10cm).';

-- Set plinth heights for base cabinets (standard 10cm)
UPDATE public.components
SET plinth_height = 10
WHERE category IN ('base-cabinet', 'corner-base-cabinet', 'appliance')
  AND plinth_height IS NULL;

-- Tall units typically have taller plinths (15cm for stability)
UPDATE public.components
SET plinth_height = 15
WHERE category IN ('tall-unit', 'larder', 'corner-tall-unit')
  AND plinth_height IS NULL;

-- Explicit toe-kick components use configuration default (8cm)
UPDATE public.components
SET plinth_height = 8
WHERE category = 'toe-kick'
  AND plinth_height IS NULL;

-- Worktops sit on cabinets, no plinth
UPDATE public.components
SET plinth_height = 0
WHERE category IN ('worktop', 'countertop', 'counter-top')
  AND plinth_height IS NULL;

-- Wall cabinets have no plinth (they hang)
UPDATE public.components
SET plinth_height = 0
WHERE category IN ('wall-cabinet', 'corner-wall-cabinet', 'pelmet', 'cornice')
  AND plinth_height IS NULL;

-- Add index for queries
CREATE INDEX IF NOT EXISTS idx_components_plinth_height
ON public.components(plinth_height)
WHERE plinth_height IS NOT NULL;

-- Log completion
DO $$ BEGIN
    RAISE NOTICE 'Migration complete: Added plinth_height column to components table';
    RAISE NOTICE 'Components updated with plinth heights based on category';
    RAISE NOTICE 'Base cabinets: 10cm, Tall units: 15cm, Toe-kick: 8cm, Wall units: 0cm';
END $$;
