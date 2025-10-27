-- =============================================================================
-- FIX CORNER CABINET LINKS
-- Date: 2025-10-18
-- Purpose: Repair broken links after l-shaped-test-cabinet deletion
-- Session: feature/database-component-cleanup
-- =============================================================================

-- Problem:
-- After deleting l-shaped-test-cabinet-60 and l-shaped-test-cabinet-90 from
-- the components table, their 3D models and 2D renders are now orphaned.
-- The component_id references in component_3d_models and component_2d_renders
-- no longer match any component in the components table.

-- =============================================================================
-- OPTION 1: DELETE ORPHANED 3D MODELS
-- =============================================================================
-- Use this if you want to remove all orphaned 3D model references

-- Delete orphaned 3D models for l-shaped-test-cabinet
DELETE FROM component_3d_models
WHERE component_id IN (
  'l-shaped-test-cabinet-60',
  'l-shaped-test-cabinet-90'
)
AND NOT EXISTS (
  SELECT 1 FROM components c
  WHERE c.component_id = component_3d_models.component_id
);

-- Delete orphaned 2D renders for l-shaped-test-cabinet
DELETE FROM component_2d_renders
WHERE component_id IN (
  'l-shaped-test-cabinet-60',
  'l-shaped-test-cabinet-90'
)
AND NOT EXISTS (
  SELECT 1 FROM components c
  WHERE c.component_id = component_2d_renders.component_id
);

-- =============================================================================
-- OPTION 2: RESTORE DELETED COMPONENTS
-- =============================================================================
-- Use this if you want to restore the deleted components

-- Restore l-shaped-test-cabinet-60
INSERT INTO components (
  component_id,
  name,
  type,
  width,
  depth,
  height,
  color,
  category,
  room_types,
  icon_name,
  description,
  version,
  deprecated
) VALUES (
  'l-shaped-test-cabinet-60',
  'Corner Base Cabinet 60cm',
  'cabinet',
  60,
  60,
  90,  -- CORRECTED HEIGHT (was wrong before)
  '#F5F5F5',
  'base-cabinets',
  ARRAY['kitchen'],
  'Square',
  'L-shaped corner base cabinet with 60cm legs',
  '1.0.0',
  false
)
ON CONFLICT (component_id) DO UPDATE SET
  height = 90,  -- Update height if component exists
  updated_at = NOW();

-- Restore l-shaped-test-cabinet-90
INSERT INTO components (
  component_id,
  name,
  type,
  width,
  depth,
  height,
  color,
  category,
  room_types,
  icon_name,
  description,
  version,
  deprecated
) VALUES (
  'l-shaped-test-cabinet-90',
  'Corner Base Cabinet 90cm',
  'cabinet',
  90,
  90,
  90,  -- CORRECTED HEIGHT (was wrong before)
  '#F5F5F5',
  'base-cabinets',
  ARRAY['kitchen'],
  'Square',
  'L-shaped corner base cabinet with 90cm legs',
  '1.0.0',
  false
)
ON CONFLICT (component_id) DO UPDATE SET
  height = 90,  -- Update height if component exists
  updated_at = NOW();

-- =============================================================================
-- OPTION 3: MIGRATE 3D MODELS TO NEW CORNER CABINET IDs
-- =============================================================================
-- Use this if you want to point old 3D models to new component IDs

-- Map l-shaped-test-cabinet-60 → new-corner-base-cabinet-60 (if exists)
-- Map l-shaped-test-cabinet-90 → new-corner-base-cabinet-90 (if exists)

-- First, check if target components exist
DO $$
BEGIN
  -- Update 3D model for 60cm if new component exists
  IF EXISTS (SELECT 1 FROM components WHERE component_id = 'new-corner-base-cabinet-60') THEN
    UPDATE component_3d_models
    SET component_id = 'new-corner-base-cabinet-60'
    WHERE component_id = 'l-shaped-test-cabinet-60';

    RAISE NOTICE 'Migrated 3D model: l-shaped-test-cabinet-60 → new-corner-base-cabinet-60';
  ELSE
    RAISE NOTICE 'Target component new-corner-base-cabinet-60 does not exist';
  END IF;

  -- Update 3D model for 90cm if new component exists
  IF EXISTS (SELECT 1 FROM components WHERE component_id = 'new-corner-base-cabinet-90') THEN
    UPDATE component_3d_models
    SET component_id = 'new-corner-base-cabinet-90'
    WHERE component_id = 'l-shaped-test-cabinet-90';

    RAISE NOTICE 'Migrated 3D model: l-shaped-test-cabinet-90 → new-corner-base-cabinet-90';
  ELSE
    RAISE NOTICE 'Target component new-corner-base-cabinet-90 does not exist';
  END IF;

  -- Do the same for 2D renders
  IF EXISTS (SELECT 1 FROM components WHERE component_id = 'new-corner-base-cabinet-60') THEN
    UPDATE component_2d_renders
    SET component_id = 'new-corner-base-cabinet-60'
    WHERE component_id = 'l-shaped-test-cabinet-60';
  END IF;

  IF EXISTS (SELECT 1 FROM components WHERE component_id = 'new-corner-base-cabinet-90') THEN
    UPDATE component_2d_renders
    SET component_id = 'new-corner-base-cabinet-90'
    WHERE component_id = 'l-shaped-test-cabinet-90';
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION: Check for remaining orphaned records
-- =============================================================================

DO $$
DECLARE
  orphaned_3d INTEGER;
  orphaned_2d INTEGER;
BEGIN
  -- Count orphaned 3D models
  SELECT COUNT(*) INTO orphaned_3d
  FROM component_3d_models cm
  WHERE NOT EXISTS (
    SELECT 1 FROM components c
    WHERE c.component_id = cm.component_id
  );

  -- Count orphaned 2D renders
  SELECT COUNT(*) INTO orphaned_2d
  FROM component_2d_renders cr
  WHERE NOT EXISTS (
    SELECT 1 FROM components c
    WHERE c.component_id = cr.component_id
  );

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Orphaned Records Check';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Orphaned 3D models: %', orphaned_3d;
  RAISE NOTICE 'Orphaned 2D renders: %', orphaned_2d;

  IF orphaned_3d > 0 OR orphaned_2d > 0 THEN
    RAISE WARNING 'Orphaned records still exist! Run investigation query to identify.';
  ELSE
    RAISE NOTICE '✅ No orphaned records - all links valid';
  END IF;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- RECOMMENDED APPROACH
-- =============================================================================

-- Run this query to see which option makes sense:
SELECT
  cm.component_id,
  cm.component_name,
  cm.geometry_type,
  CASE
    WHEN c.component_id IS NULL THEN '❌ ORPHANED'
    ELSE '✅ LINKED'
  END as status,
  c.name as component_catalog_name,
  c.height as component_height
FROM component_3d_models cm
LEFT JOIN components c ON c.component_id = cm.component_id
WHERE cm.component_id LIKE '%l-shaped%'
   OR cm.component_id LIKE '%corner%'
   OR cm.is_corner_component = true
ORDER BY cm.component_id;
