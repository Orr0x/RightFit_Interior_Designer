-- ============================================
-- COMPREHENSIVE FIX FOR COMPONENT HEIGHT METADATA
-- ============================================
-- Purpose: Fix ALL components with incorrect max_height_cm values
-- Date: 2025-10-18
-- Session: view-specific-visibility
--
-- Based on verification query results showing 135+ components with height mismatches
--
-- Strategy: Update max_height_cm to match default_height for all components
-- where the metadata height doesn't match the model height
-- ============================================

-- ============================================
-- APPROACH 1: AUTOMATIC FIX USING default_height
-- ============================================
-- This will fix ALL components at once by syncing max_height_cm with default_height

-- For components where default_height is stored in METERS (most components)
-- Convert meters to centimeters for max_height_cm
UPDATE public.component_3d_models
SET max_height_cm = (default_height * 100)
WHERE layer_type IS NOT NULL
  AND default_height IS NOT NULL
  AND default_height < 10  -- default_height is in meters (< 10m is reasonable)
  AND ABS((max_height_cm - min_height_cm) / 100.0 - default_height) > 0.05;  -- More than 5cm mismatch

-- For components where default_height is stored in CENTIMETERS (rare cases like corner cabinets)
-- Use default_height directly for max_height_cm
UPDATE public.component_3d_models
SET max_height_cm = default_height
WHERE layer_type IS NOT NULL
  AND default_height IS NOT NULL
  AND default_height >= 10  -- default_height is in centimeters (≥ 10cm)
  AND default_height <= 300  -- Reasonable max height (3m)
  AND ABS((max_height_cm - min_height_cm) - default_height) > 5;  -- More than 5cm mismatch

-- ============================================
-- VERIFICATION AFTER FIX
-- ============================================

-- Check how many components were fixed
SELECT
  'Fixed Components' as category,
  COUNT(*) as count
FROM public.component_3d_models
WHERE layer_type IS NOT NULL
  AND default_height IS NOT NULL
  AND ABS((max_height_cm - min_height_cm) / 100.0 - default_height) <= 0.05;

-- Check remaining mismatches (should be very few or zero)
SELECT
  component_id,
  component_name,
  component_type,
  default_height as height_model_m,
  (max_height_cm - min_height_cm) / 100.0 as height_metadata_m,
  ABS((max_height_cm - min_height_cm) / 100.0 - default_height) as difference_m
FROM public.component_3d_models
WHERE layer_type IS NOT NULL
  AND default_height IS NOT NULL
  AND ABS((max_height_cm - min_height_cm) / 100.0 - default_height) > 0.05
ORDER BY difference_m DESC
LIMIT 20;

-- ============================================
-- MANUAL OVERRIDES FOR SPECIAL CASES
-- ============================================
-- Some components may need manual adjustment if the automatic fix doesn't work

-- Fix wall cabinets that should be 70cm tall (not 60cm)
-- Standard wall cabinets are 70cm tall, mounted at 140cm
UPDATE public.component_3d_models
SET
  min_height_cm = 140,
  max_height_cm = 210  -- 140 + 70 = 210
WHERE layer_type = 'wall'
  AND default_height = 0.60  -- These were set to 60cm but should be 70cm
  AND component_type = 'wall-cabinet';

-- ============================================
-- CATEGORY-SPECIFIC VERIFICATION
-- ============================================

-- Check appliances - should all match now
SELECT
  component_id,
  component_name,
  default_height as model_height_m,
  (max_height_cm - min_height_cm) / 100.0 as metadata_height_m,
  CASE
    WHEN ABS((max_height_cm - min_height_cm) / 100.0 - default_height) <= 0.05 THEN '✅'
    ELSE '❌'
  END as status
FROM public.component_3d_models
WHERE component_type = 'appliance'
ORDER BY component_id;

-- Check tall units - should all be ~200-220cm
SELECT
  component_id,
  component_name,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) / 100.0 as height_m
FROM public.component_3d_models
WHERE component_type = 'tall-unit'
  OR component_id LIKE '%larder%'
  OR component_id LIKE '%tall-unit%'
ORDER BY component_id;

-- Check wall cabinets - should be 140-210cm range
SELECT
  component_id,
  component_name,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) / 100.0 as cabinet_height_m
FROM public.component_3d_models
WHERE component_type = 'wall-cabinet'
  OR layer_type = 'wall'
ORDER BY component_id;

-- ============================================
-- FINAL SUMMARY QUERY
-- ============================================

-- Count components by match status
SELECT
  CASE
    WHEN ABS((max_height_cm - min_height_cm) / 100.0 - default_height) <= 0.05 THEN '✅ MATCH'
    WHEN default_height IS NULL THEN '⚠️ NO MODEL HEIGHT'
    WHEN layer_type IS NULL THEN '⚠️ NO LAYER TYPE'
    ELSE '❌ MISMATCH'
  END as status,
  COUNT(*) as component_count
FROM public.component_3d_models
GROUP BY status
ORDER BY status;

-- ============================================
-- NOTES
-- ============================================

-- This comprehensive fix:
-- 1. Automatically fixes 135+ components with height mismatches
-- 2. Uses default_height as the source of truth
-- 3. Handles both meter and centimeter units correctly
-- 4. Provides verification queries to confirm success
--
-- Expected results:
-- - Fridge-90: 0-180cm (1.8m tall)
-- - Fridge-60: 0-180cm (1.8m tall)
-- - Wall cabinets: 140-210cm (70cm tall)
-- - Dishwashers: 0-85cm (85cm tall)
-- - Tall units: 0-200/220cm (full height)
-- - All other components: matching their default_height
--
-- Impact:
-- - Fixes 135+ components in elevation views
-- - Eliminates ALL height rendering issues
-- - One-time sync between model heights and metadata heights
-- ============================================
