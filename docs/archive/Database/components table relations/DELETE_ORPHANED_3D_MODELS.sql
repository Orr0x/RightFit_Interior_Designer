-- =============================================================================
-- DELETE ORPHANED component_3d_models RECORDS
-- Date: 2025-10-18
-- Purpose: Remove 9 orphaned 3D models that don't have matching components
-- Session: feature/database-component-cleanup
-- =============================================================================

-- Background:
-- Found 9 orphaned 3D models (non-kitchen items) in component_3d_models table:
--   1. bathtub-standard
--   2. bed-single
--   3. dining-chair
--   4. dining-table
--   5. shower-standard
--   6. sofa-3-seater
--   7. tumble-dryer
--   8. tv-55-inch
--   9. washing-machine
--
-- These components were removed from the components table but their 3D models
-- remain in component_3d_models, creating orphaned records.

-- =============================================================================
-- STEP 1: Verify count before deletion
-- =============================================================================

DO $$
DECLARE
  orphan_count INTEGER;
  current_3d_count INTEGER;
  current_component_count INTEGER;
BEGIN
  -- Count orphaned 3D models
  SELECT COUNT(*) INTO orphan_count
  FROM component_3d_models cm
  WHERE NOT EXISTS (
    SELECT 1
    FROM components c
    WHERE c.component_id = cm.component_id
  );

  -- Get total counts
  SELECT COUNT(*) INTO current_3d_count FROM component_3d_models;
  SELECT COUNT(*) INTO current_component_count FROM components;

  -- Report findings
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'PRE-DELETION STATUS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Total component_3d_models: %', current_3d_count;
  RAISE NOTICE 'Total components: %', current_component_count;
  RAISE NOTICE 'Orphaned 3D models: %', orphan_count;
  RAISE NOTICE 'Expected orphaned count: 9';

  -- Safety check
  IF orphan_count != 9 THEN
    RAISE WARNING 'UNEXPECTED: Found % orphaned records, expected 9!', orphan_count;
    RAISE NOTICE 'Review the orphaned records before proceeding:';
    RAISE NOTICE 'SELECT component_id, component_name FROM component_3d_models WHERE NOT EXISTS (SELECT 1 FROM components WHERE component_id = component_3d_models.component_id);';
  ELSE
    RAISE NOTICE '✅ Count matches expected (9 orphaned records)';
  END IF;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 2: List all orphaned records for verification
-- =============================================================================

SELECT
  cm.id,
  cm.component_id,
  cm.component_name,
  cm.geometry_type,
  '🗑️ TO BE DELETED' as action
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1
  FROM components c
  WHERE c.component_id = cm.component_id
)
ORDER BY cm.component_id;

-- =============================================================================
-- STEP 3: Check for dependent geometry_parts before deletion
-- =============================================================================

SELECT
  cm.component_id,
  cm.component_name,
  COUNT(gp.id) as geometry_parts_count,
  CASE
    WHEN COUNT(gp.id) > 0 THEN '⚠️ HAS_GEOMETRY_PARTS (will cascade delete)'
    ELSE '✅ NO_GEOMETRY_PARTS'
  END as cascade_impact
FROM component_3d_models cm
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
WHERE NOT EXISTS (
  SELECT 1
  FROM components c
  WHERE c.component_id = cm.component_id
)
GROUP BY cm.component_id, cm.component_name
ORDER BY cm.component_id;

-- =============================================================================
-- STEP 4: Delete orphaned 3D models by specific component_id (SAFEST)
-- =============================================================================

-- Delete by explicit component_id list (most precise approach)
DELETE FROM component_3d_models
WHERE component_id IN (
  'bathtub-standard',
  'bed-single',
  'dining-chair',
  'dining-table',
  'shower-standard',
  'sofa-3-seater',
  'tumble-dryer',
  'tv-55-inch',
  'washing-machine'
);

-- =============================================================================
-- STEP 5: Verify deletion results
-- =============================================================================

DO $$
DECLARE
  orphan_count_after INTEGER;
  deleted_count INTEGER;
  current_3d_count INTEGER;
  current_component_count INTEGER;
BEGIN
  -- Count remaining orphaned 3D models
  SELECT COUNT(*) INTO orphan_count_after
  FROM component_3d_models cm
  WHERE NOT EXISTS (
    SELECT 1
    FROM components c
    WHERE c.component_id = cm.component_id
  );

  -- Get total counts
  SELECT COUNT(*) INTO current_3d_count FROM component_3d_models;
  SELECT COUNT(*) INTO current_component_count FROM components;

  -- Calculate deleted
  deleted_count := 9; -- Expected deletion count

  -- Report results
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'POST-DELETION STATUS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Total component_3d_models: % (was: 195)', current_3d_count;
  RAISE NOTICE 'Total components: %', current_component_count;
  RAISE NOTICE 'Remaining orphaned 3D models: %', orphan_count_after;
  RAISE NOTICE 'Expected remaining orphans: 0';

  IF orphan_count_after = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All orphaned 3D models removed!';
    RAISE NOTICE '✅ New component_3d_models count: %', current_3d_count;

    IF current_3d_count = current_component_count THEN
      RAISE NOTICE '✅ PERFECT: component_3d_models now matches components count (%:%)!', current_3d_count, current_component_count;
    ELSE
      RAISE WARNING 'MISMATCH: component_3d_models (%) != components (%)', current_3d_count, current_component_count;
      RAISE NOTICE 'Difference: %', current_3d_count - current_component_count;
    END IF;
  ELSE
    RAISE WARNING 'INCOMPLETE: Still have % orphaned records remaining!', orphan_count_after;
  END IF;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 6: List any remaining orphaned records (should be empty)
-- =============================================================================

SELECT
  cm.component_id,
  cm.component_name,
  '❌ STILL ORPHANED' as status
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1
  FROM components c
  WHERE c.component_id = cm.component_id
)
ORDER BY cm.component_id;

-- =============================================================================
-- STEP 7: Final summary statistics
-- =============================================================================

SELECT
  'components' as table_name,
  COUNT(*) as record_count
FROM components
UNION ALL
SELECT
  'component_3d_models' as table_name,
  COUNT(*) as record_count
FROM component_3d_models
UNION ALL
SELECT
  'component_2d_renders' as table_name,
  COUNT(*) as record_count
FROM component_2d_renders
UNION ALL
SELECT
  'geometry_parts' as table_name,
  COUNT(*) as record_count
FROM geometry_parts
ORDER BY table_name;

-- =============================================================================
-- NOTES
-- =============================================================================

-- This script deletes 9 orphaned 3D models:
--   1. bathtub-standard - Standard Bathtub
--   2. bed-single - Single Bed
--   3. dining-chair - Dining Chair
--   4. dining-table - Dining Table
--   5. shower-standard - Standard Shower
--   6. sofa-3-seater - Sofa 3-Seater
--   7. tumble-dryer - Tumble Dryer
--   8. tv-55-inch - TV 55 Inch
--   9. washing-machine - Washing Machine
--
-- Expected before: 195 component_3d_models, 191 components (4 mismatch)
-- Expected after: 186 component_3d_models, 191 components (should match if no other issues)
--
-- CASCADE BEHAVIOR:
-- - Deleting from component_3d_models will also delete related geometry_parts
--   if foreign key constraints have ON DELETE CASCADE
-- - This is EXPECTED and DESIRED for orphaned records
--
-- VERIFICATION:
-- - Run QUERY_ORPHANED_3D_MODELS.sql after this script to verify cleanup
-- - Should show 0 orphaned records
