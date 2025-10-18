-- =============================================================================
-- ADD L-SHAPED GEOMETRY TO ALL CORNER UNITS
-- Migration: 20251018000008
-- Date: 2025-10-18
-- Purpose: Add proper L-shaped geometry to all corner units (base, wall, tall)
-- Session: feature/database-component-cleanup
-- Supersedes: Part of 20251018000007
-- =============================================================================

-- Background:
-- Migration 20251018000007 incorrectly cloned corner-cabinet geometry from
-- kitchen-sink-corner-90 (a SINK), not a cabinet.
--
-- Problem: Some corner units missing geometry or have wrong geometry
-- Solution: Clone L-shaped geometry from new-corner-wall-cabinet-90 to ALL corner units
--
-- Corner Units in Database (5 total):
--   1. corner-cabinet (base) - 90cm legs, needs geometry + plinth
--   2. new-corner-wall-cabinet-60 (wall) - 60cm legs, already has geometry ✅
--   3. new-corner-wall-cabinet-90 (wall) - 90cm legs, already has geometry ✅
--   4. larder-corner-unit-60 (tall) - 60cm legs, needs geometry check
--   5. larder-corner-unit-90 (tall) - 90cm legs, needs geometry check
--
-- Strategy: Clone from new-corner-wall-cabinet-90 (perfect L-shape template)
-- Adjustments per cabinet type:
--   - Base: Add plinth (7th part), use cornerDepth=0.6, height=0.9
--   - Wall: Already correct (cornerDepth=0.4, height=0.7)
--   - Tall: Use cornerDepth=0.6, height=2.0

-- =============================================================================
-- STEP 1: Check current geometry status for all corner units
-- =============================================================================

DO $$
DECLARE
  corner_base_parts INT;
  larder_60_parts INT;
  larder_90_parts INT;
BEGIN
  -- Count existing geometry parts
  SELECT COUNT(*) INTO corner_base_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id = 'corner-cabinet';

  SELECT COUNT(*) INTO larder_60_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id = 'larder-corner-unit-60';

  SELECT COUNT(*) INTO larder_90_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id = 'larder-corner-unit-90';

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'PRE-MIGRATION GEOMETRY STATUS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'corner-cabinet (base): % parts', corner_base_parts;
  RAISE NOTICE 'larder-corner-unit-60 (tall): % parts', larder_60_parts;
  RAISE NOTICE 'larder-corner-unit-90 (tall): % parts', larder_90_parts;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 2: Delete incorrect/incomplete geometry for corner units
-- =============================================================================

DO $$
DECLARE
  corner_deleted INT := 0;
  larder_60_deleted INT := 0;
  larder_90_deleted INT := 0;
BEGIN
  -- Delete corner-cabinet geometry (was incorrectly cloned from sink)
  DELETE FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'corner-cabinet');
  GET DIAGNOSTICS corner_deleted = ROW_COUNT;

  -- Delete larder-corner-unit-60 geometry (may be incomplete)
  DELETE FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-60');
  GET DIAGNOSTICS larder_60_deleted = ROW_COUNT;

  -- Delete larder-corner-unit-90 geometry (may be incomplete)
  DELETE FROM geometry_parts
  WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-90');
  GET DIAGNOSTICS larder_90_deleted = ROW_COUNT;

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'STEP 2: Delete old geometry';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Deleted % parts from corner-cabinet', corner_deleted;
  RAISE NOTICE 'Deleted % parts from larder-corner-unit-60', larder_60_deleted;
  RAISE NOTICE 'Deleted % parts from larder-corner-unit-90', larder_90_deleted;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 3: Add L-shaped geometry to corner-cabinet (BASE cabinet)
-- =============================================================================

-- Clone 6 parts from new-corner-wall-cabinet-90 (L-shaped template)
-- Parts: Cabinet X-leg, Cabinet Z-leg, Front door, Side door, Front handle, Side handle

INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  metalness,
  roughness,
  opacity,
  render_order
)
SELECT
  (SELECT id FROM component_3d_models WHERE component_id = 'corner-cabinet'),  -- Target: corner-cabinet
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  metalness,
  roughness,
  opacity,
  render_order
FROM geometry_parts
WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'new-corner-wall-cabinet-90')
ON CONFLICT DO NOTHING;

-- Add L-shaped plinth (2 parts: X-leg plinth + Z-leg plinth)
-- Recessed 10cm to create toe-kick space

-- Plinth X-leg (horizontal leg of L)
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  render_order
)
VALUES (
  (SELECT id FROM component_3d_models WHERE component_id = 'corner-cabinet'),
  'Plinth X-leg',
  'box',
  'legLength - 0.1',  -- 10cm narrower (recessed)
  '0.15',  -- 15cm plinth height
  'cornerDepth - 0.1',  -- 10cm shallower (recessed)
  '0',
  '0.075',  -- Center of 15cm plinth (0.15/2 = 0.075)
  'cornerDepth / 2 - legLength / 2 + 0.05',  -- Match cabinet position but recessed
  'plinth',
  'plinthColor',
  0  -- Render first
)
ON CONFLICT DO NOTHING;

-- Plinth Z-leg (vertical leg of L)
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  render_order
)
VALUES (
  (SELECT id FROM component_3d_models WHERE component_id = 'corner-cabinet'),
  'Plinth Z-leg',
  'box',
  'cornerDepth - 0.1',  -- 10cm narrower (recessed)
  '0.15',  -- 15cm plinth height
  'legLength - 0.1',  -- 10cm shallower (recessed)
  'cornerDepth / 2 - legLength / 2 + 0.05',  -- Match cabinet position but recessed
  '0.075',  -- Center of 15cm plinth (0.15/2 = 0.075)
  '0',
  'plinth',
  'plinthColor',
  0  -- Render first
)
ON CONFLICT DO NOTHING;

-- Raise cabinet body to sit on top of plinth (15cm above ground)
-- Cabinet parts use position_y = 0 (centered), so we raise to position_y = height/2 + 0.15
UPDATE geometry_parts
SET position_y = 'height / 2 + 0.15'
WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'corner-cabinet')
  AND part_name IN ('Cabinet X-leg', 'Cabinet Z-leg', 'Front door', 'Side door', 'Front handle', 'Side handle');

-- =============================================================================
-- STEP 4: Add L-shaped geometry to larder-corner-unit-60 (TALL cabinet, 60cm legs)
-- =============================================================================

-- Clone from new-corner-wall-cabinet-60 (same leg size)
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  metalness,
  roughness,
  opacity,
  render_order
)
SELECT
  (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-60'),  -- Target: larder 60cm
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  metalness,
  roughness,
  opacity,
  render_order
FROM geometry_parts
WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'new-corner-wall-cabinet-60')
ON CONFLICT DO NOTHING;

-- Add L-shaped plinth (2 parts matching L-shaped footprint)

-- Plinth X-leg
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  render_order
)
VALUES (
  (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-60'),
  'Plinth X-leg',
  'box',
  'legLength - 0.1',
  '0.15',
  'cornerDepth - 0.1',
  '0',
  '0.075',
  'cornerDepth / 2 - legLength / 2 + 0.05',
  'plinth',
  'plinthColor',
  0
)
ON CONFLICT DO NOTHING;

-- Plinth Z-leg
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  render_order
)
VALUES (
  (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-60'),
  'Plinth Z-leg',
  'box',
  'cornerDepth - 0.1',
  '0.15',
  'legLength - 0.1',
  'cornerDepth / 2 - legLength / 2 + 0.05',
  '0.075',
  '0',
  'plinth',
  'plinthColor',
  0
)
ON CONFLICT DO NOTHING;

-- Raise cabinet body to sit on top of plinth
UPDATE geometry_parts
SET position_y = 'height / 2 + 0.15'
WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-60')
  AND part_name IN ('Cabinet X-leg', 'Cabinet Z-leg', 'Front door', 'Side door', 'Front handle', 'Side handle');

-- =============================================================================
-- STEP 5: Add L-shaped geometry to larder-corner-unit-90 (TALL cabinet, 90cm legs)
-- =============================================================================

-- Clone from new-corner-wall-cabinet-90 (same leg size)
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  metalness,
  roughness,
  opacity,
  render_order
)
SELECT
  (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-90'),  -- Target: larder 90cm
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  metalness,
  roughness,
  opacity,
  render_order
FROM geometry_parts
WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'new-corner-wall-cabinet-90')
ON CONFLICT DO NOTHING;

-- Add L-shaped plinth (2 parts matching L-shaped footprint)

-- Plinth X-leg
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  render_order
)
VALUES (
  (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-90'),
  'Plinth X-leg',
  'box',
  'legLength - 0.1',
  '0.15',
  'cornerDepth - 0.1',
  '0',
  '0.075',
  'cornerDepth / 2 - legLength / 2 + 0.05',
  'plinth',
  'plinthColor',
  0
)
ON CONFLICT DO NOTHING;

-- Plinth Z-leg
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  dimension_width,
  dimension_height,
  dimension_depth,
  position_x,
  position_y,
  position_z,
  material_name,
  color_override,
  render_order
)
VALUES (
  (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-90'),
  'Plinth Z-leg',
  'box',
  'cornerDepth - 0.1',
  '0.15',
  'legLength - 0.1',
  'cornerDepth / 2 - legLength / 2 + 0.05',
  '0.075',
  '0',
  'plinth',
  'plinthColor',
  0
)
ON CONFLICT DO NOTHING;

-- Raise cabinet body to sit on top of plinth
UPDATE geometry_parts
SET position_y = 'height / 2 + 0.15'
WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = 'larder-corner-unit-90')
  AND part_name IN ('Cabinet X-leg', 'Cabinet Z-leg', 'Front door', 'Side door', 'Front handle', 'Side handle');

-- =============================================================================
-- STEP 6: Verify all corner units have geometry
-- =============================================================================

DO $$
DECLARE
  corner_base_parts INT;
  larder_60_parts INT;
  larder_90_parts INT;
  wall_60_parts INT;
  wall_90_parts INT;
BEGIN
  -- Count geometry parts for all corner units
  SELECT COUNT(*) INTO corner_base_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id = 'corner-cabinet';

  SELECT COUNT(*) INTO larder_60_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id = 'larder-corner-unit-60';

  SELECT COUNT(*) INTO larder_90_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id = 'larder-corner-unit-90';

  SELECT COUNT(*) INTO wall_60_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id = 'new-corner-wall-cabinet-60';

  SELECT COUNT(*) INTO wall_90_parts
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id = 'new-corner-wall-cabinet-90';

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'POST-MIGRATION GEOMETRY STATUS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'corner-cabinet (base 90cm): % parts (expected: 8)', corner_base_parts;
  RAISE NOTICE 'larder-corner-unit-60 (tall 60cm): % parts (expected: 8)', larder_60_parts;
  RAISE NOTICE 'larder-corner-unit-90 (tall 90cm): % parts (expected: 8)', larder_90_parts;
  RAISE NOTICE 'new-corner-wall-cabinet-60 (wall 60cm): % parts (expected: 6)', wall_60_parts;
  RAISE NOTICE 'new-corner-wall-cabinet-90 (wall 90cm): % parts (expected: 6)', wall_90_parts;
  RAISE NOTICE '';

  IF corner_base_parts = 8 AND larder_60_parts = 8 AND larder_90_parts = 8 THEN
    RAISE NOTICE '✅ SUCCESS: All corner units have proper L-shaped geometry!';
    RAISE NOTICE '✅ Base cabinet: 6 L-shape parts + 2 L-plinth parts = 8 parts';
    RAISE NOTICE '✅ Tall cabinets: 6 L-shape parts + 2 L-plinth parts = 8 parts each';
    RAISE NOTICE '✅ Wall cabinets: 6 L-shape parts (no plinth needed)';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected rendering:';
    RAISE NOTICE '  - L-shaped corner with 2 legs (X and Z)';
    RAISE NOTICE '  - Doors on both faces';
    RAISE NOTICE '  - Handles on both doors';
    RAISE NOTICE '  - L-shaped plinth at bottom (base/tall units only)';
    RAISE NOTICE '  - Cabinet body sits on plinth (everything on floor)';
  ELSE
    RAISE WARNING 'INCOMPLETE: Some corner units missing geometry!';
    IF corner_base_parts <> 8 THEN
      RAISE WARNING '❌ corner-cabinet: % parts (expected 8)', corner_base_parts;
    END IF;
    IF larder_60_parts <> 8 THEN
      RAISE WARNING '❌ larder-corner-unit-60: % parts (expected 8)', larder_60_parts;
    END IF;
    IF larder_90_parts <> 8 THEN
      RAISE WARNING '❌ larder-corner-unit-90: % parts (expected 8)', larder_90_parts;
    END IF;
  END IF;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 7: Show geometry parts for all corner units (verification)
-- =============================================================================

SELECT
  cm.component_id,
  cm.component_type,
  cm.component_name,
  COUNT(gp.id) as parts_count,
  STRING_AGG(gp.part_name, ', ' ORDER BY gp.render_order) as part_names
FROM component_3d_models cm
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
WHERE cm.component_id IN (
  'corner-cabinet',
  'larder-corner-unit-60',
  'larder-corner-unit-90',
  'new-corner-wall-cabinet-60',
  'new-corner-wall-cabinet-90'
)
GROUP BY cm.component_id, cm.component_type, cm.component_name
ORDER BY
  CASE cm.component_type
    WHEN 'base-cabinet' THEN 1
    WHEN 'tall-unit' THEN 2
    WHEN 'wall-cabinet' THEN 3
  END,
  cm.component_id;

-- =============================================================================
-- NOTES
-- =============================================================================

-- This migration adds proper L-shaped geometry to ALL corner units:
--
-- BEFORE (from migration 20251018000007):
--   - corner-cabinet cloned from kitchen-sink-corner-90 (SINK) ❌
--   - larder corner units may have had incomplete geometry
--   - Only wall cabinets had correct L-shaped geometry
--
-- AFTER (this migration):
--   ✅ corner-cabinet (base): 6 L-shape parts + 2 L-plinth parts = 8 parts
--   ✅ larder-corner-unit-60 (tall): 6 L-shape parts + 2 L-plinth parts = 8 parts
--   ✅ larder-corner-unit-90 (tall): 6 L-shape parts + 2 L-plinth parts = 8 parts
--   ✅ new-corner-wall-cabinet-60 (wall): 6 L-shape parts (unchanged)
--   ✅ new-corner-wall-cabinet-90 (wall): 6 L-shape parts (unchanged)
--
-- L-Shaped Cabinet Geometry (6 parts):
--   1. Cabinet X-leg (horizontal leg of L)
--   2. Cabinet Z-leg (vertical leg of L)
--   3. Front door (on X-leg face)
--   4. Side door (on Z-leg face)
--   5. Front handle (on front door)
--   6. Side handle (on side door)
--
-- Plus for Base/Tall Units (2 L-shaped plinth parts):
--   7. Plinth X-leg (15cm toe-kick, recessed 10cm)
--   8. Plinth Z-leg (15cm toe-kick, recessed 10cm)
--
-- Formula Variables (auto-adjust per cabinet type):
--   - Wall cabinets: cornerDepth=0.4m, height=0.7m
--   - Base cabinets: cornerDepth=0.6m, height=0.9m
--   - Tall cabinets: cornerDepth=0.6m, height=2.0m
--   - legLength: 0.6m or 0.9m (depends on variant)
--
-- Expected Rendering:
--   - Beautiful L-shaped corners in 3D view
--   - Two legs forming 90° angle
--   - Doors and handles on both faces
--   - Plinth at bottom (base/tall only)
--   - Correct rotation for all 4 corner positions
--
-- All formulas from wall cabinet work perfectly for base/tall because:
--   - FormulaEvaluator.ts already handles cornerDepth (0.4 wall, 0.6 base/tall)
--   - EnhancedModels3D.tsx already handles isWallCabinet check
--   - Variables automatically resolve to correct values per cabinet type
