-- Migration: Rename corner cabinets to L-shaped test cabinet (production naming)
-- Date: 2025-01-29
-- Purpose:
--   1. Deprecate old corner-cabinet and corner-base-cabinet components
--   2. Rename l-shaped-test-cabinet to "Corner Base Cabinet" (official name)
--   3. Update 3D model component_ids to match l-shaped-test-cabinet pattern
--   4. Maintain backward compatibility with existing designs

-- =====================================================================
-- PART 1: Deprecate old corner cabinet components
-- =====================================================================

-- Hide old corner-base-cabinet and corner-cabinet from component sidebar
UPDATE components
SET
  active = false,
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{deprecated}',
    'true'::jsonb
  ),
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{deprecated_reason}',
    '"Replaced by L-Shaped Test Cabinet (now Corner Base Cabinet)"'::jsonb
  ),
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{replacement_component_id}',
    '"l-shaped-test-cabinet"'::jsonb
  )
WHERE component_id IN ('corner-cabinet', 'corner-base-cabinet')
  AND component_id != 'l-shaped-test-cabinet';

-- =====================================================================
-- PART 2: Rename l-shaped-test-cabinet to production name
-- =====================================================================

-- Update l-shaped-test-cabinet to be the official "Corner Base Cabinet"
UPDATE components
SET
  name = 'Corner Base Cabinet',
  description = 'L-shaped corner base cabinet with auto-rotation - 90cm x 90cm x 90cm',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{is_production}',
    'true'::jsonb
  ),
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{corner_type}',
    '"L-shaped"'::jsonb
  ),
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{auto_rotate}',
    'true'::jsonb
  )
WHERE component_id = 'l-shaped-test-cabinet';

-- =====================================================================
-- PART 3: Update 3D model component_ids to match l-shaped-test-cabinet
-- =====================================================================

-- Rename corner-base-cabinet-60 to l-shaped-test-cabinet-60
UPDATE component_3d_models
SET component_id = 'l-shaped-test-cabinet-60'
WHERE component_id = 'corner-base-cabinet-60';

-- Rename corner-base-cabinet-90 to l-shaped-test-cabinet-90
UPDATE component_3d_models
SET component_id = 'l-shaped-test-cabinet-90'
WHERE component_id = 'corner-base-cabinet-90';

-- =====================================================================
-- PART 4: Verify changes
-- =====================================================================

-- Check deprecated components
DO $$
DECLARE
  deprecated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO deprecated_count
  FROM components
  WHERE metadata->>'deprecated' = 'true';

  RAISE NOTICE 'Deprecated components count: %', deprecated_count;
END $$;

-- Check renamed l-shaped-test-cabinet
DO $$
DECLARE
  lshaped_name TEXT;
BEGIN
  SELECT name INTO lshaped_name
  FROM components
  WHERE component_id = 'l-shaped-test-cabinet';

  RAISE NOTICE 'L-shaped test cabinet new name: %', lshaped_name;
END $$;

-- Check updated 3D models
DO $$
DECLARE
  model_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO model_count
  FROM component_3d_models
  WHERE component_id LIKE 'l-shaped-test-cabinet%';

  RAISE NOTICE 'L-shaped 3D models count: %', model_count;
END $$;

-- =====================================================================
-- VERIFICATION QUERIES (run manually to check results)
-- =====================================================================

-- View deprecated components
-- SELECT component_id, name, active, metadata->>'deprecated' as deprecated,
--        metadata->>'deprecated_reason' as reason
-- FROM components
-- WHERE metadata->>'deprecated' = 'true';

-- View active corner cabinets
-- SELECT component_id, name, description, active
-- FROM components
-- WHERE (component_id LIKE '%corner%' OR name LIKE '%Corner%')
--   AND active = true
-- ORDER BY component_id;

-- View updated 3D models
-- SELECT component_id, component_name, is_corner_component, leg_length
-- FROM component_3d_models
-- WHERE component_id LIKE '%corner%' OR component_id LIKE '%l-shaped%'
-- ORDER BY component_id;
