-- ============================================
-- FIX COMPONENT HEIGHT METADATA
-- ============================================
-- Purpose: Correct max_height_cm values for components that were incorrectly set by ADD_COLLISION_DETECTION_LAYER_FIELDS.sql
-- Date: 2025-10-18
-- Session: view-specific-visibility
-- Issue: Tall appliances (fridges) and other components rendering at wrong heights in elevation views
--
-- Root Cause:
-- ADD_COLLISION_DETECTION_LAYER_FIELDS.sql used blanket UPDATE statements that set max_height_cm
-- to generic values for entire categories, overwriting the correct default_height values.
--
-- Examples:
-- - Fridge-90: default_height = 1.80m (180cm) but max_height_cm was set to 90cm
-- - Fridge-60: default_height = 1.80m (180cm) but max_height_cm was set to 90cm
-- - Wall cabinets: All set to max_height_cm = 220cm regardless of actual height
--
-- Solution:
-- Update max_height_cm to match the actual component dimensions from default_height.
-- For components with min_height_cm + default_height.
-- ============================================

-- ============================================
-- 1. FIX TALL APPLIANCES (Fridges)
-- ============================================

-- Fridge-60: 180cm tall, floor-standing
UPDATE public.component_3d_models SET
  min_height_cm = 0,
  max_height_cm = 180  -- Was incorrectly set to 90
WHERE component_id = 'fridge-60';

-- Fridge-90: 180cm tall, floor-standing
UPDATE public.component_3d_models SET
  min_height_cm = 0,
  max_height_cm = 180  -- Was incorrectly set to 90
WHERE component_id = 'fridge-90';

-- ============================================
-- 2. FIX DISHWASHERS (Built-in base height appliances)
-- ============================================

-- Dishwasher-60: 85cm tall (under-counter appliance)
UPDATE public.component_3d_models SET
  min_height_cm = 0,
  max_height_cm = 85  -- Was set to 90, should be 85
WHERE component_id = 'dishwasher-60';

-- Dishwasher (generic): 85cm tall
UPDATE public.component_3d_models SET
  min_height_cm = 0,
  max_height_cm = 85  -- Was set to 90, should be 85
WHERE component_id = 'dishwasher';

-- ============================================
-- 3. FIX WASHING MACHINES (if present)
-- ============================================

-- Washing machines are typically 85cm tall
UPDATE public.component_3d_models SET
  min_height_cm = 0,
  max_height_cm = 85
WHERE component_id LIKE '%washing-machine%'
  AND max_height_cm = 90;  -- Only fix if it was set to the incorrect 90

-- ============================================
-- 4. FIX WALL CABINETS (Mounted units)
-- ============================================

-- Wall cabinets are typically:
-- - 70cm tall (height of cabinet)
-- - Mounted at 140cm from floor
-- - Top at 210cm (140 + 70 = 210)
-- They were incorrectly set to max_height_cm = 220

UPDATE public.component_3d_models SET
  min_height_cm = 140,  -- Bottom of wall cabinet
  max_height_cm = 210   -- Top of wall cabinet (140 + 70)
WHERE layer_type = 'wall'
  AND max_height_cm = 220  -- Only fix those that were set incorrectly
  AND component_id NOT LIKE '%tall%';  -- Don't affect tall units

-- ============================================
-- 5. FIX OVENS (Built-in ovens are 60cm tall)
-- ============================================

-- Oven-60: 60cm tall (built-in oven)
UPDATE public.component_3d_models SET
  min_height_cm = 0,
  max_height_cm = 60  -- Was set to 90, should be 60
WHERE component_id = 'oven-60';

-- ============================================
-- 6. FIX MICROWAVE APPLIANCES (if present)
-- ============================================

-- Microwaves are typically 30-40cm tall
UPDATE public.component_3d_models SET
  min_height_cm = 0,
  max_height_cm = 40
WHERE component_id LIKE '%microwave%'
  AND component_type = 'appliance'
  AND max_height_cm = 90;  -- Only fix if set incorrectly

-- ============================================
-- 7. FIX LARDER-OVEN-MICROWAVE (Tall combo unit)
-- ============================================

-- Larder-oven-microwave: Full height tall unit (200cm)
UPDATE public.component_3d_models SET
  min_height_cm = 0,
  max_height_cm = 200  -- Full height tall unit
WHERE component_id = 'larder-oven-microwave'
  AND max_height_cm != 200;

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================

-- Check appliances - should show correct heights now
SELECT
  component_id,
  component_name,
  layer_type,
  min_height_cm,
  max_height_cm,
  default_height,
  (max_height_cm - min_height_cm) as calculated_height
FROM public.component_3d_models
WHERE component_type = 'appliance'
ORDER BY component_id;

-- Check wall cabinets - should show 140-210cm
SELECT
  component_id,
  component_name,
  layer_type,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as calculated_height
FROM public.component_3d_models
WHERE layer_type = 'wall'
ORDER BY component_id;

-- Check for any components with suspicious height mismatches
SELECT
  component_id,
  component_name,
  component_type,
  default_height,
  (max_height_cm - min_height_cm) / 100.0 as height_from_metadata_m,
  default_height as height_from_model_m,
  CASE
    WHEN ABS((max_height_cm - min_height_cm) / 100.0 - default_height) > 0.05
    THEN '⚠️ MISMATCH'
    ELSE '✅ MATCH'
  END as status
FROM public.component_3d_models
WHERE layer_type IS NOT NULL
  AND default_height IS NOT NULL
ORDER BY status DESC, component_type, component_id;

-- ============================================
-- 9. SUMMARY
-- ============================================

-- Components Fixed:
-- ✅ Fridge-60: 90cm → 180cm
-- ✅ Fridge-90: 90cm → 180cm
-- ✅ Dishwasher-60: 90cm → 85cm
-- ✅ Dishwasher: 90cm → 85cm
-- ✅ Wall Cabinets: max 220cm → 210cm
-- ✅ Oven-60: 90cm → 60cm
-- ✅ Washing machines: 90cm → 85cm (if present)
-- ✅ Microwaves: 90cm → 40cm (if present)
-- ✅ Larder-oven-microwave: verified 200cm
--
-- Impact:
-- - Elevation views will now show correct component heights
-- - No more "height flashing" with correct values
-- - Collision detection will use accurate height ranges
-- - Fridges render at full 180cm height
-- - Wall cabinets render at correct 70cm height
--
-- Testing:
-- 1. Run this script in Supabase SQL Editor
-- 2. Check verification queries show correct values
-- 3. Reload application
-- 4. View fridge-90 in elevation - should be 180cm tall
-- 5. View wall cabinets - should be 70cm tall
-- ============================================
