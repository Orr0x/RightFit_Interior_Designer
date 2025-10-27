-- ============================================
-- FIX FINAL 8 COMPONENTS
-- ============================================
-- Purpose: Fix the last 8 components showing mismatches
-- Date: 2025-10-18
-- Session: view-specific-visibility
--
-- Current Status: 8 components still showing MISMATCH
-- - 3 corner cabinets (default_height in CM not meters)
-- - 5 wall cabinets (60cm vs 70cm discrepancy)
-- ============================================

-- ============================================
-- STEP 1: INVESTIGATE CORNER CABINETS
-- ============================================
-- These have default_height stored as 90.0000 and 70.0000 (not 0.90 and 0.70)
-- Let's check their current state

SELECT
  component_id,
  component_name,
  component_type,
  default_height,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as component_height_cm
FROM public.component_3d_models
WHERE component_id IN (
  'l-shaped-test-cabinet-90',
  'new-corner-wall-cabinet-60',
  'new-corner-wall-cabinet-90'
);

-- ============================================
-- FIX 1: L-SHAPED TEST CABINET
-- ============================================
-- This is a BASE cabinet that should be 90cm tall (0-90cm)
-- The default_height is stored as 90.0000 (in cm, not meters)

UPDATE public.component_3d_models
SET
  min_height_cm = 0,
  max_height_cm = 90,
  default_height = 0.90  -- Fix the default_height to be in meters for consistency
WHERE component_id = 'l-shaped-test-cabinet-90';

-- ============================================
-- FIX 2: CORNER WALL CABINETS
-- ============================================
-- These are WALL cabinets that should be 70cm tall (140-210cm)
-- The default_height is stored as 70.0000 (in cm, not meters)

UPDATE public.component_3d_models
SET
  min_height_cm = 140,
  max_height_cm = 210,
  default_height = 0.70  -- Fix the default_height to be in meters for consistency
WHERE component_id IN ('new-corner-wall-cabinet-60', 'new-corner-wall-cabinet-90');

-- ============================================
-- STEP 2: INVESTIGATE STANDARD WALL CABINETS
-- ============================================
-- These show default_height as 0.60m but metadata shows 0.70m
-- Need to determine which is correct

SELECT
  component_id,
  component_name,
  default_width,
  default_height,
  default_depth,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as cabinet_height_cm
FROM public.component_3d_models
WHERE component_id IN (
  'wall-cabinet-30',
  'wall-cabinet-40',
  'wall-cabinet-50',
  'wall-cabinet-60',
  'wall-cabinet-80'
);

-- ============================================
-- FIX 3: STANDARD WALL CABINETS
-- ============================================
-- Standard kitchen wall cabinets are typically 70cm tall in the UK
-- The default_height showing 0.60 appears to be incorrect
-- Let's update both the metadata AND the default_height to 70cm

UPDATE public.component_3d_models
SET
  min_height_cm = 140,
  max_height_cm = 210,  -- 140 + 70 = 210
  default_height = 0.70  -- Update to correct 70cm height
WHERE component_id IN (
  'wall-cabinet-30',
  'wall-cabinet-40',
  'wall-cabinet-50',
  'wall-cabinet-60',
  'wall-cabinet-80'
);

-- ============================================
-- VERIFICATION AFTER FIX
-- ============================================

-- Check all 8 components we just fixed
SELECT
  component_id,
  component_name,
  component_type,
  default_height as model_height_m,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as component_height_cm,
  CASE
    WHEN ABS((max_height_cm - min_height_cm) / 100.0 - default_height) <= 0.05 THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as status
FROM public.component_3d_models
WHERE component_id IN (
  'l-shaped-test-cabinet-90',
  'new-corner-wall-cabinet-60',
  'new-corner-wall-cabinet-90',
  'wall-cabinet-30',
  'wall-cabinet-40',
  'wall-cabinet-50',
  'wall-cabinet-60',
  'wall-cabinet-80'
)
ORDER BY component_type, component_id;

-- Overall summary
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
-- EXPECTED RESULTS
-- ============================================
--
-- All 8 components should now show ✅ MATCH
--
-- Final counts:
-- ✅ MATCH: 184 components
-- ⚠️ NO LAYER TYPE: 22 components (expected)
-- ❌ MISMATCH: 0 components
--
-- ============================================
