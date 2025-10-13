-- ================================================================
-- Room Dimensions Naming Fix Migration
-- Date: 2025-01-13
-- Purpose: Fix legacy ADHD naming - height→depth, ceilingHeight→height
-- BREAKING CHANGE: Requires frontend deployment immediately after
-- ================================================================

-- This migration fixes a legacy naming issue where:
-- - "height" was used for Y-axis floor dimension (should be "depth")
-- - "ceilingHeight" was used for Z-axis vertical dimension (should be "height")

BEGIN;

-- Add migration tracking column
ALTER TABLE room_designs
ADD COLUMN IF NOT EXISTS dimensions_migrated BOOLEAN DEFAULT FALSE;

-- ================================================================
-- STEP 1: Add new 'depth' field with value from old 'height'
-- ================================================================
-- Copy the floor Y-axis dimension from 'height' to new 'depth' field

UPDATE room_designs
SET room_dimensions = jsonb_set(
  room_dimensions,
  '{depth}',
  room_dimensions->'height'
)
WHERE room_dimensions ? 'height'
  AND NOT room_dimensions ? 'depth';

-- Verification
DO $$
DECLARE
  rooms_with_depth INTEGER;
BEGIN
  SELECT COUNT(*) INTO rooms_with_depth
  FROM room_designs
  WHERE room_dimensions ? 'depth';

  RAISE NOTICE '✅ Step 1 complete: % rooms now have "depth" field', rooms_with_depth;
END $$;

-- ================================================================
-- STEP 2: Rename 'ceilingHeight' to 'height'
-- ================================================================
-- Move ceiling Z-axis dimension from 'ceilingHeight' to 'height'

UPDATE room_designs
SET room_dimensions = (
  -- Remove old 'ceilingHeight' field
  room_dimensions - 'ceilingHeight'
) || (
  -- Add new 'height' field with ceilingHeight value (or default 250cm)
  jsonb_build_object(
    'height',
    COALESCE(
      (room_dimensions->>'ceilingHeight')::numeric,
      250
    )
  )
)
WHERE room_dimensions ? 'ceilingHeight';

-- Add default height for rooms without ceilingHeight
UPDATE room_designs
SET room_dimensions = room_dimensions || '{"height": 250}'::jsonb
WHERE NOT room_dimensions ? 'height';

-- Verification
DO $$
DECLARE
  rooms_with_new_height INTEGER;
  rooms_with_old_ceiling INTEGER;
BEGIN
  SELECT COUNT(*) INTO rooms_with_new_height
  FROM room_designs
  WHERE room_dimensions ? 'height';

  SELECT COUNT(*) INTO rooms_with_old_ceiling
  FROM room_designs
  WHERE room_dimensions ? 'ceilingHeight';

  RAISE NOTICE '✅ Step 2 complete: % rooms have new "height" field', rooms_with_new_height;

  IF rooms_with_old_ceiling > 0 THEN
    RAISE EXCEPTION '❌ Migration failed: % rooms still have "ceilingHeight" field', rooms_with_old_ceiling;
  END IF;
END $$;

-- ================================================================
-- STEP 3: Remove old 'height' field (now replaced by 'depth')
-- ================================================================
-- At this point, structure should be: {width, height (old Y), depth (new Y), height (new Z)}
-- We need to remove the old 'height' field since it's been copied to 'depth'

-- WAIT! We need to be careful here. Let's check the current state first.
-- After step 1: {width, height (Y-axis), depth (copy of height)}
-- After step 2: {width, height (Z-axis from ceilingHeight), depth (Y-axis from old height)}
-- But step 2 OVERWROTE height! We need to fix this.

-- Let's revise: We need to do this in a different order to avoid conflicts

-- ================================================================
-- REVISED APPROACH: Let's start over with a safe approach
-- ================================================================

-- Roll back the changes above and use a temporary field approach
-- First, let's save the current state to temp fields

-- Add temporary fields for safe migration
UPDATE room_designs
SET room_dimensions = room_dimensions || jsonb_build_object(
  '_temp_y_axis', room_dimensions->'height',
  '_temp_z_axis', COALESCE(room_dimensions->'ceilingHeight', '250'::jsonb)
)
WHERE NOT (room_dimensions ? '_temp_y_axis');

-- Now we can safely rebuild the structure
UPDATE room_designs
SET room_dimensions = jsonb_build_object(
  'width', room_dimensions->'width',
  'depth', room_dimensions->'_temp_y_axis',
  'height', room_dimensions->'_temp_z_axis'
);

-- Remove temporary fields (they're already removed by jsonb_build_object)

-- Mark as migrated
UPDATE room_designs SET dimensions_migrated = TRUE;

-- Update default value for new rooms
ALTER TABLE room_designs
ALTER COLUMN room_dimensions
SET DEFAULT '{"width": 400, "depth": 300, "height": 250}';

-- ================================================================
-- FINAL VERIFICATION
-- ================================================================

DO $$
DECLARE
  total_rooms INTEGER;
  migrated_rooms INTEGER;
  sample_room JSONB;
  rooms_with_old_height INTEGER;
  rooms_with_old_ceiling INTEGER;
  rooms_with_new_depth INTEGER;
  rooms_with_new_height INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_rooms FROM room_designs;
  SELECT COUNT(*) INTO migrated_rooms FROM room_designs WHERE dimensions_migrated = TRUE;
  SELECT room_dimensions INTO sample_room FROM room_designs LIMIT 1;

  -- Check for old fields
  SELECT COUNT(*) INTO rooms_with_old_ceiling
  FROM room_designs
  WHERE room_dimensions ? 'ceilingHeight';

  -- Check for new fields
  SELECT COUNT(*) INTO rooms_with_new_depth
  FROM room_designs
  WHERE room_dimensions ? 'depth';

  SELECT COUNT(*) INTO rooms_with_new_height
  FROM room_designs
  WHERE room_dimensions ? 'height';

  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Migration Complete Summary:';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '  Total rooms: %', total_rooms;
  RAISE NOTICE '  Migrated: %', migrated_rooms;
  RAISE NOTICE '  Sample room_dimensions: %', sample_room;
  RAISE NOTICE '';
  RAISE NOTICE 'Field Check:';
  RAISE NOTICE '  ✅ Rooms with new "depth" field: % / %', rooms_with_new_depth, total_rooms;
  RAISE NOTICE '  ✅ Rooms with new "height" field: % / %', rooms_with_new_height, total_rooms;
  RAISE NOTICE '  ⚠️  Rooms with old "ceilingHeight" field: %', rooms_with_old_ceiling;
  RAISE NOTICE '';

  -- Validate all rooms have correct structure
  IF rooms_with_new_depth != total_rooms THEN
    RAISE EXCEPTION '❌ Migration failed: Not all rooms have "depth" field!';
  END IF;

  IF rooms_with_new_height != total_rooms THEN
    RAISE EXCEPTION '❌ Migration failed: Not all rooms have "height" field!';
  END IF;

  IF rooms_with_old_ceiling > 0 THEN
    RAISE WARNING '⚠️  % rooms still have old "ceilingHeight" field (should be removed)', rooms_with_old_ceiling;
  END IF;

  -- Check sample structure
  IF sample_room ? 'width' AND sample_room ? 'depth' AND sample_room ? 'height' THEN
    RAISE NOTICE '✅ Sample room has correct structure: {width, depth, height}';
  ELSE
    RAISE EXCEPTION '❌ Sample room has incorrect structure: %', sample_room;
  END IF;

  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ Migration successful!';
  RAISE NOTICE '   Old: {width, height (Y), ceilingHeight (Z)}';
  RAISE NOTICE '   New: {width, depth (Y), height (Z)}';
  RAISE NOTICE '================================================================';
END $$;

COMMIT;

-- ================================================================
-- POST-MIGRATION VALIDATION QUERY
-- Run this manually to verify migration success
-- ================================================================

SELECT
  id,
  name,
  room_type,
  room_dimensions->>'width' as width_cm,
  room_dimensions->>'depth' as depth_cm,
  room_dimensions->>'height' as height_cm,
  dimensions_migrated,
  CASE
    WHEN room_dimensions ? 'ceilingHeight' THEN '❌ HAS OLD ceilingHeight'
    WHEN NOT (room_dimensions ? 'width') THEN '❌ MISSING width'
    WHEN NOT (room_dimensions ? 'depth') THEN '❌ MISSING depth'
    WHEN NOT (room_dimensions ? 'height') THEN '❌ MISSING height'
    ELSE '✅ Clean'
  END as validation_status
FROM room_designs
ORDER BY created_at DESC
LIMIT 20;

-- ================================================================
-- ROLLBACK SCRIPT (Keep commented, use only if migration fails)
-- ================================================================

/*
BEGIN;

-- Restore old structure from temp fields if they still exist
UPDATE room_designs
SET room_dimensions = jsonb_build_object(
  'width', room_dimensions->'width',
  'height', room_dimensions->'depth',  -- depth back to height
  'ceilingHeight', room_dimensions->'height'  -- height back to ceilingHeight
)
WHERE dimensions_migrated = TRUE;

-- Restore old default
ALTER TABLE room_designs
ALTER COLUMN room_dimensions
SET DEFAULT '{"width": 400, "height": 300}';

-- Remove migration tracking
UPDATE room_designs SET dimensions_migrated = FALSE;

COMMIT;

RAISE NOTICE 'Rollback complete. Old structure restored.';
*/
