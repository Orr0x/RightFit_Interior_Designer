-- ============================================
-- FIX FINAL 8 COMPONENTS - ALL WALL CABINETS 70CM
-- ============================================
-- Purpose: Fix the last 8 components with CORRECT 70cm wall cabinet height
-- Date: 2025-10-18
-- Session: view-specific-visibility
--
-- CONFIRMED: All wall cabinets should be 70cm tall (UK standard)
-- Sources:
-- - app_configuration table: wall_cabinet_height = 70cm
-- - components_catalog: corner wall cabinets height = 70cm
-- - UK kitchen standard: 70cm wall cabinets
--
-- Current mismatches:
-- - 3 corner cabinets (default_height in CM not meters)
-- - 5 standard wall cabinets (need update from 60cm to 70cm)
-- ============================================

-- ============================================
-- FIX 1: L-SHAPED TEST CABINET (BASE CABINET)
-- ============================================
-- This is a BASE cabinet that should be 90cm tall (0-90cm)
-- The default_height is stored as 90.0000 (in cm, not meters)

UPDATE public.component_3d_models
SET
  min_height_cm = 0,
  max_height_cm = 90,
  default_height = 0.90  -- Convert to meters for consistency
WHERE component_id = 'l-shaped-test-cabinet-90';

-- ============================================
-- FIX 2: ALL WALL CABINETS = 70CM TALL
-- ============================================
-- UK Standard: All wall cabinets are 70cm tall
-- Mounted at: 140cm from floor
-- Top at: 210cm (140 + 70 = 210)
-- This applies to ALL wall cabinets (standard + corner)

-- Standard wall cabinets (5 components)
-- UPDATE from incorrect 60cm to correct 70cm
UPDATE public.component_3d_models
SET
  min_height_cm = 140,
  max_height_cm = 210,  -- 140 + 70 = 210cm
  default_height = 0.70  -- UK standard wall cabinet height
WHERE component_id IN (
  'wall-cabinet-30',
  'wall-cabinet-40',
  'wall-cabinet-50',
  'wall-cabinet-60',
  'wall-cabinet-80'
);

-- Corner wall cabinets (2 components)
-- UPDATE from 70.0000 (cm) to 0.70 (meters) and set correct range
UPDATE public.component_3d_models
SET
  min_height_cm = 140,
  max_height_cm = 210,  -- 140 + 70 = 210cm
  default_height = 0.70  -- Convert from 70.0000 to 0.70 meters
WHERE component_id IN (
  'new-corner-wall-cabinet-60',
  'new-corner-wall-cabinet-90'
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

-- Verify ALL wall cabinets are now consistent at 70cm
SELECT
  component_id,
  component_name,
  default_height,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as cabinet_height_cm,
  CASE
    WHEN (max_height_cm - min_height_cm) = 70 THEN '✅ CORRECT 70cm'
    ELSE '❌ WRONG HEIGHT'
  END as validation
FROM public.component_3d_models
WHERE component_type = 'wall-cabinet'
ORDER BY component_id;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
--
-- All 8 components should now show ✅ MATCH
--
-- Wall cabinets (all 7 - standard + corner):
-- - default_height: 0.70m (70cm) ✅
-- - min_height_cm: 140
-- - max_height_cm: 210
-- - component_height: 70cm ✅
--
-- L-shaped test cabinet:
-- - default_height: 0.90m
-- - min_height_cm: 0
-- - max_height_cm: 90
-- - component_height: 90cm ✅
--
-- Final counts:
-- ✅ MATCH: 184 components
-- ⚠️ NO LAYER TYPE: 22 components (expected)
-- ❌ MISMATCH: 0 components ✅
--
-- ============================================
-- NOTE: Migration file 20250130000011_populate_wall_cabinets.sql
-- is INCORRECT when it says "Height = 60cm" on line 20.
-- The actual UK standard and app configuration is 70cm.
-- This discrepancy should be noted for future migration updates.
-- ============================================
