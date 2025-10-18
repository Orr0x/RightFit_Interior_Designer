-- ============================================
-- VERIFY ALL BASE CABINET HEIGHTS
-- ============================================
-- Purpose: Ensure ALL base cabinets (standard + corner) are 90cm tall
-- Date: 2025-10-18
-- Session: view-specific-visibility
--
-- UK Standard: All base cabinets = 90cm tall
-- Source: app_configuration - base_cabinet_height = 90cm
-- ============================================

-- Check ALL base cabinets
SELECT
  component_id,
  component_name,
  component_type,
  default_height as model_height_m,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as component_height_cm,
  CASE
    WHEN (max_height_cm - min_height_cm) = 90 THEN '✅ CORRECT 90cm'
    WHEN (max_height_cm - min_height_cm) != 90 THEN '❌ WRONG HEIGHT'
    ELSE '⚠️ UNCLEAR'
  END as height_check,
  CASE
    WHEN ABS((max_height_cm - min_height_cm) / 100.0 - default_height) <= 0.05 THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as sync_status
FROM public.component_3d_models
WHERE component_type = 'base-cabinet'
   OR component_id LIKE '%base-cabinet%'
   OR component_id LIKE '%corner-base%'
   OR (category = 'cabinets' AND component_id LIKE '%base%')
ORDER BY
  CASE
    WHEN component_id LIKE '%corner%' THEN 1
    ELSE 2
  END,
  component_id;

-- Summary by height
SELECT
  (max_height_cm - min_height_cm) as cabinet_height_cm,
  COUNT(*) as count,
  CASE
    WHEN (max_height_cm - min_height_cm) = 90 THEN '✅ CORRECT'
    ELSE '❌ NEEDS FIX'
  END as status
FROM public.component_3d_models
WHERE component_type = 'base-cabinet'
   OR component_id LIKE '%base-cabinet%'
GROUP BY cabinet_height_cm
ORDER BY cabinet_height_cm;

-- Show any base cabinets that are NOT 90cm tall
SELECT
  component_id,
  component_name,
  default_height,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as cabinet_height_cm,
  '❌ Should be 90cm tall' as issue
FROM public.component_3d_models
WHERE (component_type = 'base-cabinet' OR component_id LIKE '%base-cabinet%')
  AND (max_height_cm - min_height_cm) != 90
ORDER BY component_id;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
-- All base cabinets should show:
-- - component_height_cm: 90
-- - height_check: ✅ CORRECT 90cm
-- - sync_status: ✅ MATCH
--
-- If any show ❌, they need to be fixed
-- ============================================
