-- ============================================
-- COLLISION DETECTION LAYER SYSTEM
-- ============================================
-- Purpose: Add height-aware collision detection for kitchen components
-- Date: 2025-10-17
-- Session: alignment-positioning-fix
-- Related: docs/session-2025-10-17-alignment-positioning-fix/CLASH-DETECTION-ANALYSIS.md
--
-- IMPORTANT: Run this in Supabase SQL Editor
--
-- This migration adds:
-- - Layer type classification (flooring, base, worktop, wall, etc.)
-- - Height range fields (min/max height in cm)
-- - Collision rules (which layers can overlap)
-- ============================================

-- ============================================
-- 1. ADD COLLISION DETECTION FIELDS
-- ============================================

-- Add layer_type field
ALTER TABLE public.component_3d_models
ADD COLUMN IF NOT EXISTS layer_type VARCHAR(50);

-- Add height range fields
ALTER TABLE public.component_3d_models
ADD COLUMN IF NOT EXISTS min_height_cm DECIMAL(10, 2);

ALTER TABLE public.component_3d_models
ADD COLUMN IF NOT EXISTS max_height_cm DECIMAL(10, 2);

-- Add collision rules (array of layer types that this component can overlap)
ALTER TABLE public.component_3d_models
ADD COLUMN IF NOT EXISTS can_overlap_layers TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN public.component_3d_models.layer_type IS 'Component layer: flooring, base, worktop, wall, pelmet, cornice, tall, appliance, finishing';
COMMENT ON COLUMN public.component_3d_models.min_height_cm IS 'Minimum height in cm from floor (for collision detection)';
COMMENT ON COLUMN public.component_3d_models.max_height_cm IS 'Maximum height in cm from floor (for collision detection)';
COMMENT ON COLUMN public.component_3d_models.can_overlap_layers IS 'Array of layer_type values this component can overlap (e.g., {flooring, base})';

-- ============================================
-- 2. CREATE INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_component_3d_models_layer_type
ON public.component_3d_models(layer_type);

-- ============================================
-- 3. POPULATE BASE UNITS (0-90cm height)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'base',
  min_height_cm = 0,
  max_height_cm = 90,
  can_overlap_layers = ARRAY['flooring']
WHERE category = 'base-units'
  OR component_id LIKE '%base-cabinet%'
  OR component_id LIKE '%base-unit%'
  OR component_id LIKE '%corner-base%';

-- ============================================
-- 4. POPULATE WALL UNITS (140-220cm height)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'wall',
  min_height_cm = 140,
  max_height_cm = 220,
  can_overlap_layers = ARRAY['flooring', 'base', 'worktop']
WHERE category = 'wall-units'
  OR component_id LIKE '%wall-cabinet%'
  OR component_id LIKE '%wall-unit%'
  OR component_id LIKE '%corner-wall%';

-- ============================================
-- 5. POPULATE TALL UNITS (0-220cm height)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'tall',
  min_height_cm = 0,
  max_height_cm = 220,
  can_overlap_layers = ARRAY['flooring']
WHERE category = 'tall-units'
  OR component_id LIKE '%tall-unit%'
  OR component_id LIKE '%larder%'
  OR component_id LIKE '%pantry%';

-- ============================================
-- 6. POPULATE WORKTOPS (90cm height - sits on base units)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'worktop',
  min_height_cm = 90,
  max_height_cm = 92,  -- 2cm thick typical worktop
  can_overlap_layers = ARRAY['flooring', 'base']
WHERE component_type = 'counter-top'
  OR component_id LIKE '%worktop%'
  OR component_id LIKE '%countertop%'
  OR component_id LIKE '%counter-top%';

-- ============================================
-- 7. POPULATE APPLIANCES (0-90cm height - same as base)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'appliance',
  min_height_cm = 0,
  max_height_cm = 90,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'appliance'
  OR component_id LIKE '%dishwasher%'
  OR component_id LIKE '%oven%'
  OR component_id LIKE '%fridge%'
  OR component_id LIKE '%washing-machine%';

-- ============================================
-- 8. POPULATE SINKS (0-90cm height - integrated with base/worktop)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'sink',
  min_height_cm = 85,  -- Slightly below worktop
  max_height_cm = 92,  -- Up to worktop level
  can_overlap_layers = ARRAY['flooring', 'base', 'worktop']
WHERE component_type = 'sink'
  OR component_id LIKE '%sink%';

-- ============================================
-- 9. POPULATE PELMETS (135-140cm - below wall units)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'pelmet',
  min_height_cm = 135,
  max_height_cm = 140,
  can_overlap_layers = ARRAY['flooring', 'base', 'worktop', 'wall']
WHERE component_id LIKE '%pelmet%'
  OR component_name LIKE '%pelmet%';

-- ============================================
-- 10. POPULATE CORNICES (220-240cm - above wall units)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'cornice',
  min_height_cm = 220,
  max_height_cm = 240,
  can_overlap_layers = ARRAY['flooring', 'base', 'worktop', 'wall']
WHERE component_id LIKE '%cornice%'
  OR component_name LIKE '%cornice%';

-- ============================================
-- 11. POPULATE FINISHING (generic - use safe defaults)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'finishing',
  min_height_cm = 0,
  max_height_cm = 240,
  can_overlap_layers = ARRAY['flooring', 'base', 'worktop', 'wall', 'pelmet', 'cornice']
WHERE category = 'finishing'
  AND layer_type IS NULL;  -- Only update if not already set

-- ============================================
-- 12. POPULATE FLOORING (0cm - base layer)
-- ============================================

-- Note: Flooring components may not exist yet in database
-- This is a placeholder for when they're added
UPDATE public.component_3d_models SET
  layer_type = 'flooring',
  min_height_cm = 0,
  max_height_cm = 0,
  can_overlap_layers = ARRAY[]::TEXT[]  -- Nothing can overlap flooring (it's the base)
WHERE component_id LIKE '%floor%'
  OR component_id LIKE '%flooring%'
  OR component_name LIKE '%floor%';

-- ============================================
-- 13. VERIFICATION QUERY
-- ============================================

-- Run this to verify the migration worked correctly:
SELECT
  layer_type,
  COUNT(*) as component_count,
  MIN(min_height_cm) as min_height,
  MAX(max_height_cm) as max_height,
  can_overlap_layers[1] as example_overlap
FROM public.component_3d_models
WHERE layer_type IS NOT NULL
GROUP BY layer_type, can_overlap_layers
ORDER BY MIN(min_height_cm);

-- ============================================
-- 14. CHECK FOR UNPOPULATED COMPONENTS
-- ============================================

-- Run this to find components that didn't get layer info:
SELECT
  component_id,
  component_name,
  component_type,
  category,
  layer_type  -- Should show which are NULL
FROM public.component_3d_models
WHERE layer_type IS NULL
ORDER BY component_type, component_id
LIMIT 50;

-- ============================================
-- 15. SAMPLE COLLISION DETECTION QUERY
-- ============================================

-- Example: Check if component X can be placed at same XY position as component Y
-- This query demonstrates the collision logic:

-- COMMENT OUT THE EXAMPLE BELOW - JUST FOR REFERENCE
/*
WITH component_a AS (
  SELECT
    component_id,
    layer_type,
    min_height_cm,
    max_height_cm,
    can_overlap_layers
  FROM public.component_3d_models
  WHERE component_id = 'base-cabinet-60'  -- Example: base cabinet
),
component_b AS (
  SELECT
    component_id,
    layer_type,
    min_height_cm,
    max_height_cm,
    can_overlap_layers
  FROM public.component_3d_models
  WHERE component_id = 'wall-cabinet-60'  -- Example: wall cabinet
)
SELECT
  a.component_id as component_a,
  b.component_id as component_b,
  a.layer_type as layer_a,
  b.layer_type as layer_b,
  -- Check if heights overlap
  (a.min_height_cm < b.max_height_cm AND a.max_height_cm > b.min_height_cm) as heights_overlap,
  -- Check if A can overlap B's layer
  (b.layer_type = ANY(a.can_overlap_layers)) as a_can_overlap_b,
  -- Check if B can overlap A's layer
  (a.layer_type = ANY(b.can_overlap_layers)) as b_can_overlap_a,
  -- Final collision result
  CASE
    WHEN NOT (a.min_height_cm < b.max_height_cm AND a.max_height_cm > b.min_height_cm) THEN 'NO COLLISION - Different heights'
    WHEN (b.layer_type = ANY(a.can_overlap_layers)) OR (a.layer_type = ANY(b.can_overlap_layers)) THEN 'NO COLLISION - Overlap allowed'
    ELSE 'COLLISION DETECTED'
  END as collision_result
FROM component_a a, component_b b;
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary:
-- - Added 4 new columns to component_3d_models table
-- - Populated layer info for base units, wall units, tall units
-- - Populated layer info for worktops, appliances, sinks
-- - Populated layer info for pelmets, cornices, finishing
-- - Created index for performance
-- - Added verification queries
--
-- Next Steps:
-- 1. Run verification queries above
-- 2. Manually populate any components that show NULL layer_type
-- 3. Implement collision detection in useCollisionDetection hook
-- 4. Add real-time visual feedback in DesignCanvas2D
-- ============================================
