-- ============================================
-- FIX FINAL 8 COMPONENTS (CORRECTED VERSION)
-- ============================================
-- Purpose: Fix the last 8 components with correct heights
-- Date: 2025-10-18
-- Session: view-specific-visibility
--
-- CORRECTION: All wall cabinets should be 60cm tall (not 70cm)
-- Source: supabase/migrations/20250130000011_populate_wall_cabinets.sql line 20
-- "All cabinets: Height = 60cm, Depth = 40cm, Width = variable"
--
-- Current mismatches:
-- - 3 corner cabinets (default_height in CM not meters)
-- - 5 standard wall cabinets (should all be 60cm tall)
-- ============================================

-- ============================================
-- FIX 1: L-SHAPED TEST CABINET
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
-- FIX 2: ALL WALL CABINETS (STANDARD + CORNER)
-- ============================================
-- All wall cabinets should be 60cm tall (not 70cm or 80cm)
-- Mounted at 140cm, top at 200cm (140 + 60 = 200)
-- This applies to BOTH standard and corner wall cabinets

-- Standard wall cabinets (5 components)
UPDATE public.component_3d_models
SET
  min_height_cm = 140,
  max_height_cm = 200,  -- 140 + 60 = 200cm
  default_height = 0.60  -- All wall cabinets are 60cm tall
WHERE component_id IN (
  'wall-cabinet-30',
  'wall-cabinet-40',
  'wall-cabinet-50',
  'wall-cabinet-60',
  'wall-cabinet-80'
);

-- Corner wall cabinets (2 components)
UPDATE public.component_3d_models
SET
  min_height_cm = 140,
  max_height_cm = 200,  -- 140 + 60 = 200cm
  default_height = 0.60  -- Convert from 70.0000 to 0.60 meters
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

-- Check ALL wall cabinets to ensure consistency
SELECT
  component_id,
  component_name,
  default_height,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as cabinet_height_cm,
  '✅ All should be 60cm tall (140-200cm range)' as expected
FROM public.component_3d_models
WHERE component_type = 'wall-cabinet'
ORDER BY component_id;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
--
-- All 8 components should now show ✅ MATCH
--
-- Wall cabinets (all 7):
-- - default_height: 0.60m
-- - min_height_cm: 140
-- - max_height_cm: 200
-- - component_height: 60cm
--
-- L-shaped test cabinet:
-- - default_height: 0.90m
-- - min_height_cm: 0
-- - max_height_cm: 90
-- - component_height: 90cm
--
-- Final counts:
-- ✅ MATCH: 184 components
-- ⚠️ NO LAYER TYPE: 22 components (expected)
-- ❌ MISMATCH: 0 components
--
-- ============================================
