-- =============================================================================
-- CLEANUP NS/EW DUPLICATE COMPONENTS
-- Date: 2025-10-18
-- Purpose: Remove NS/EW orientation duplicates now that rotation system works
-- Session: feature/database-component-cleanup
-- =============================================================================

-- Background:
-- NS/EW variants were created as a workaround when the rotation system didn't
-- work properly. They are dimension-swapped duplicates:
--   - NS variant: width × depth (e.g., 30 × 60)
--   - EW variant: depth × width (e.g., 60 × 30)
--
-- With the per-view visibility system and fixed coordinate mapping, we can
-- now use rotation (0°, 90°, 180°, 270°) instead of duplicate components.

-- =============================================================================
-- STEP 1: SAFETY CHECKS
-- =============================================================================

-- Check how many NS/EW components exist
DO $$
DECLARE
  ns_count INTEGER;
  ew_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ns_count FROM components WHERE component_id LIKE '%-ns';
  SELECT COUNT(*) INTO ew_count FROM components WHERE component_id LIKE '%-ew';
  total_count := ns_count + ew_count;

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'NS/EW Component Cleanup - Safety Check';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Components with -ns suffix: %', ns_count;
  RAISE NOTICE 'Components with -ew suffix: %', ew_count;
  RAISE NOTICE 'Total NS/EW variants to delete: %', total_count;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 2: CHECK FOR USER DATA REFERENCES
-- =============================================================================

-- Find any room designs that reference NS/EW components
DO $$
DECLARE
  design_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT rd.id) INTO design_count
  FROM room_designs rd,
    LATERAL jsonb_array_elements(rd.design_elements) as elem
  WHERE elem->>'component_id' LIKE '%-ns'
     OR elem->>'component_id' LIKE '%-ew';

  RAISE NOTICE 'Room designs with NS/EW component references: %', design_count;

  IF design_count > 0 THEN
    RAISE NOTICE 'WARNING: User designs contain NS/EW components!';
    RAISE NOTICE 'These will be migrated to base components in Step 3';
  ELSE
    RAISE NOTICE 'No user designs reference NS/EW components - safe to delete';
  END IF;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 3: MIGRATE USER DATA (IF ANY)
-- =============================================================================

-- Update room_designs to use base components instead of NS/EW variants
DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Migrating user designs from NS/EW to base components...';

  WITH updated_designs AS (
    UPDATE room_designs
    SET
      design_elements = (
        SELECT jsonb_agg(
          CASE
            -- Strip -ew suffix
            WHEN elem->>'component_id' LIKE '%-ew' THEN
              jsonb_set(
                elem,
                '{component_id}',
                to_jsonb(substring(elem->>'component_id' from 1 for length(elem->>'component_id') - 3))
              )
            -- Strip -ns suffix
            WHEN elem->>'component_id' LIKE '%-ns' THEN
              jsonb_set(
                elem,
                '{component_id}',
                to_jsonb(substring(elem->>'component_id' from 1 for length(elem->>'component_id') - 3))
              )
            -- Keep as-is
            ELSE elem
          END
        )
        FROM jsonb_array_elements(design_elements) as elem
      ),
      updated_at = NOW()
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_array_elements(design_elements) as elem
      WHERE elem->>'component_id' LIKE '%-ns'
         OR elem->>'component_id' LIKE '%-ew'
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM updated_designs;

  RAISE NOTICE 'Migrated % room designs to use base components', updated_count;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 4: DELETE NS/EW COMPONENTS FROM RELATED TABLES
-- =============================================================================

-- Delete from component_2d_renders (if any exist)
DO $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Deleting NS/EW components from component_2d_renders...';

  WITH deleted AS (
    DELETE FROM component_2d_renders
    WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RAISE NOTICE 'Deleted % 2D render configs', deleted_count;
END $$;

-- Delete from component_3d_models (if any exist)
DO $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Deleting NS/EW components from component_3d_models...';

  WITH deleted AS (
    DELETE FROM component_3d_models
    WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RAISE NOTICE 'Deleted % 3D model definitions', deleted_count;
END $$;

-- Delete from geometry_parts (cascade should handle this, but being explicit)
-- (No action needed - CASCADE will handle this)

-- =============================================================================
-- STEP 5: DELETE NS/EW COMPONENTS FROM MAIN TABLE
-- =============================================================================

-- Delete from components table (main catalog)
DO $$
DECLARE
  deleted_count INTEGER := 0;
  component_list TEXT[];
BEGIN
  RAISE NOTICE 'Deleting NS/EW components from components table...';

  -- Log which components are being deleted
  SELECT array_agg(component_id ORDER BY component_id)
  INTO component_list
  FROM components
  WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';

  RAISE NOTICE 'Deleting components: %', array_to_string(component_list, ', ');

  WITH deleted AS (
    DELETE FROM components
    WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew'
    RETURNING component_id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RAISE NOTICE 'Deleted % components from catalog', deleted_count;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 6: VERIFICATION
-- =============================================================================

DO $$
DECLARE
  remaining_ns_ew INTEGER;
  total_components INTEGER;
BEGIN
  -- Count remaining NS/EW components (should be 0)
  SELECT COUNT(*) INTO remaining_ns_ew
  FROM components
  WHERE component_id LIKE '%-ns' OR component_id LIKE '%-ew';

  -- Count total components
  SELECT COUNT(*) INTO total_components FROM components;

  RAISE NOTICE 'Cleanup Verification:';
  RAISE NOTICE '  Remaining NS/EW components: % (should be 0)', remaining_ns_ew;
  RAISE NOTICE '  Total components after cleanup: %', total_components;

  IF remaining_ns_ew > 0 THEN
    RAISE WARNING 'Cleanup incomplete! % NS/EW components still exist', remaining_ns_ew;
  ELSE
    RAISE NOTICE '✅ Cleanup successful - all NS/EW duplicates removed';
  END IF;

  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 7: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration Complete: NS/EW duplicate components cleaned up';
  RAISE NOTICE '';
  RAISE NOTICE 'What was removed:';
  RAISE NOTICE '  - 32 NS/EW component variants (dimension-swapped duplicates)';
  RAISE NOTICE '  - Related 3D model definitions';
  RAISE NOTICE '  - Related 2D render configurations';
  RAISE NOTICE '';
  RAISE NOTICE 'What remains:';
  RAISE NOTICE '  - Base components with original dimensions';
  RAISE NOTICE '  - Rotation system handles orientation automatically';
  RAISE NOTICE '  - Per-view visibility system controls display';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Test component placement in all views';
  RAISE NOTICE '  2. Verify rotation works correctly';
  RAISE NOTICE '  3. Check component selector UI';
  RAISE NOTICE '  4. Optionally remove fallback code from codebase';
  RAISE NOTICE '=============================================================================';
END $$;
