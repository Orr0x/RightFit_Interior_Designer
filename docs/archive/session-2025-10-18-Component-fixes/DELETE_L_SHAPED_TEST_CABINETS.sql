-- =============================================================================
-- DELETE L-SHAPED TEST CABINETS
-- Date: 2025-10-18
-- Purpose: Remove old test corner cabinets (l-shaped-test-cabinet-60/90)
-- Session: feature/database-component-cleanup
-- =============================================================================

-- Background:
-- These are old test/legacy corner cabinets that have been replaced by the
-- proper corner cabinet naming convention (new-corner-wall-cabinet-*, etc.)

-- =============================================================================
-- STEP 1: VERIFY WHICH COMPONENTS WILL BE DELETED
-- =============================================================================

-- Show components that will be deleted
SELECT
  component_id,
  name,
  type,
  width,
  depth,
  height,
  category
FROM components
WHERE component_id IN (
  'l-shaped-test-cabinet-60',
  'l-shaped-test-cabinet-90'
)
ORDER BY component_id;

-- =============================================================================
-- STEP 2: CHECK FOR USER DATA REFERENCES
-- =============================================================================

-- Find any room designs that reference these test cabinets
DO $$
DECLARE
  design_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT rd.id) INTO design_count
  FROM room_designs rd,
    LATERAL jsonb_array_elements(rd.design_elements) as elem
  WHERE elem->>'component_id' IN (
    'l-shaped-test-cabinet-60',
    'l-shaped-test-cabinet-90'
  );

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'L-Shaped Test Cabinet Cleanup - Safety Check';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Room designs using l-shaped-test-cabinet-60 or -90: %', design_count;

  IF design_count > 0 THEN
    RAISE WARNING 'User designs reference these test cabinets! Migration needed.';
  ELSE
    RAISE NOTICE 'No user designs reference these test cabinets - safe to delete';
  END IF;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 3: DELETE FROM RELATED TABLES
-- =============================================================================

-- Delete from component_2d_renders (if any exist)
DELETE FROM component_2d_renders
WHERE component_id IN (
  'l-shaped-test-cabinet-60',
  'l-shaped-test-cabinet-90'
);

-- Delete from component_3d_models (if any exist)
DELETE FROM component_3d_models
WHERE component_id IN (
  'l-shaped-test-cabinet-60',
  'l-shaped-test-cabinet-90'
);

-- Delete from geometry_parts (cascade should handle this)
-- (No action needed - CASCADE will handle this)

-- =============================================================================
-- STEP 4: DELETE FROM COMPONENTS TABLE
-- =============================================================================

DELETE FROM components
WHERE component_id IN (
  'l-shaped-test-cabinet-60',
  'l-shaped-test-cabinet-90'
);

-- =============================================================================
-- STEP 5: VERIFICATION
-- =============================================================================

DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM components
  WHERE component_id IN (
    'l-shaped-test-cabinet-60',
    'l-shaped-test-cabinet-90'
  );

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Cleanup Verification';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Remaining l-shaped-test-cabinet components: % (should be 0)', remaining_count;

  IF remaining_count > 0 THEN
    RAISE WARNING 'Cleanup incomplete! % components still exist', remaining_count;
  ELSE
    RAISE NOTICE '✅ Cleanup successful - l-shaped-test-cabinet components removed';
  END IF;
  RAISE NOTICE '=============================================================================';
END $$;
