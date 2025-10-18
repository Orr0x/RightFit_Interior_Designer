-- ============================================
-- FIX ALL CABINET HEIGHTS - FINAL COMPREHENSIVE FIX
-- ============================================
-- Purpose: Ensure ALL cabinets have correct consistent heights
-- Date: 2025-10-18
-- Session: view-specific-visibility
--
-- UK STANDARDS (from app_configuration):
-- - Base cabinets: 90cm tall (0-90cm)
-- - Wall cabinets: 70cm tall (140-210cm)
--
-- This fix ensures:
-- 1. All base cabinets (standard + corner) = 90cm tall
-- 2. All wall cabinets (standard + corner) = 70cm tall
-- 3. All default_height values in meters (not cm)
-- 4. All metadata synced with model heights
-- ============================================

-- ============================================
-- PART 1: FIX ALL BASE CABINETS = 90CM
-- ============================================

-- Standard base cabinets
UPDATE public.component_3d_models
SET
  min_height_cm = 0,
  max_height_cm = 90,
  default_height = 0.90
WHERE component_type = 'base-cabinet'
  AND component_id LIKE 'base-cabinet-%';

-- Corner base cabinets (if any exist)
UPDATE public.component_3d_models
SET
  min_height_cm = 0,
  max_height_cm = 90,
  default_height = 0.90
WHERE component_type = 'base-cabinet'
  AND (component_id LIKE '%corner-base%' OR component_id LIKE 'corner-base-%');

-- L-shaped test cabinet (base cabinet variant)
UPDATE public.component_3d_models
SET
  min_height_cm = 0,
  max_height_cm = 90,
  default_height = 0.90
WHERE component_id = 'l-shaped-test-cabinet-90';

-- Utility base cabinets
UPDATE public.component_3d_models
SET
  min_height_cm = 0,
  max_height_cm = 90,
  default_height = 0.90
WHERE component_type = 'base-cabinet'
  AND component_id LIKE 'utility-base-%';

-- ============================================
-- PART 2: FIX ALL WALL CABINETS = 70CM
-- ============================================

-- Standard wall cabinets (30, 40, 50, 60, 80)
UPDATE public.component_3d_models
SET
  min_height_cm = 140,
  max_height_cm = 210,  -- 140 + 70 = 210cm
  default_height = 0.70
WHERE component_type = 'wall-cabinet'
  AND component_id LIKE 'wall-cabinet-%';

-- Corner wall cabinets
UPDATE public.component_3d_models
SET
  min_height_cm = 140,
  max_height_cm = 210,  -- 140 + 70 = 210cm
  default_height = 0.70
WHERE component_type = 'wall-cabinet'
  AND (component_id LIKE '%corner-wall%' OR component_id LIKE 'new-corner-wall-%');

-- ============================================
-- VERIFICATION AFTER FIX
-- ============================================

RAISE NOTICE '========================================';
RAISE NOTICE 'BASE CABINETS VERIFICATION';
RAISE NOTICE '========================================';

-- Verify all base cabinets are 90cm
SELECT
  component_id,
  component_name,
  default_height,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as height_cm,
  CASE
    WHEN (max_height_cm - min_height_cm) = 90 THEN '✅ CORRECT'
    ELSE '❌ WRONG'
  END as status
FROM public.component_3d_models
WHERE component_type = 'base-cabinet'
ORDER BY component_id;

RAISE NOTICE '========================================';
RAISE NOTICE 'WALL CABINETS VERIFICATION';
RAISE NOTICE '========================================';

-- Verify all wall cabinets are 70cm
SELECT
  component_id,
  component_name,
  default_height,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as height_cm,
  CASE
    WHEN (max_height_cm - min_height_cm) = 70 THEN '✅ CORRECT'
    ELSE '❌ WRONG'
  END as status
FROM public.component_3d_models
WHERE component_type = 'wall-cabinet'
ORDER BY component_id;

-- ============================================
-- OVERALL SUMMARY
-- ============================================

RAISE NOTICE '========================================';
RAISE NOTICE 'OVERALL MISMATCH CHECK';
RAISE NOTICE '========================================';

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

-- Show any remaining mismatches (should be 0 for cabinets)
SELECT
  component_id,
  component_name,
  component_type,
  default_height,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as metadata_height_cm,
  (default_height * 100) as model_height_cm
FROM public.component_3d_models
WHERE (component_type = 'base-cabinet' OR component_type = 'wall-cabinet')
  AND ABS((max_height_cm - min_height_cm) / 100.0 - default_height) > 0.05
ORDER BY component_type, component_id;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
--
-- BASE CABINETS:
-- - All show 0-90cm (90cm tall) ✅
-- - All default_height = 0.90m ✅
--
-- WALL CABINETS:
-- - All show 140-210cm (70cm tall) ✅
-- - All default_height = 0.70m ✅
--
-- OVERALL:
-- - ✅ MATCH: 184+ components
-- - ❌ MISMATCH: 0 components (for cabinets)
--
-- ============================================
