-- Migration: Add corner cabinet configuration flags to existing corner components
-- Date: 2025-10-10
-- Related: docs/session-2025-10-09-2d-database-migration/CORNER-UNIT-DOOR-LOGIC-PRESERVATION.md
-- Implementation: Option C (Hybrid) - Database flags + code algorithm

-- =====================================================
-- Step 1: Add corner configuration to all corner cabinets
-- =====================================================

-- Update base corner cabinets (corner-base-cabinet-*)
UPDATE component_2d_renders
SET elevation_data = jsonb_set(
  jsonb_set(
    elevation_data,
    '{is_corner}',
    'true'::jsonb
  ),
  '{corner_door_side}',
  '"auto"'::jsonb
)
WHERE component_id LIKE '%corner-base-cabinet%'
  OR component_id LIKE '%base-cabinet-corner%';

-- Update corner wall cabinets (corner-wall-cabinet-*, new-corner-wall-cabinet-*)
UPDATE component_2d_renders
SET elevation_data = jsonb_set(
  jsonb_set(
    elevation_data,
    '{is_corner}',
    'true'::jsonb
  ),
  '{corner_door_side}',
  '"auto"'::jsonb
)
WHERE component_id LIKE '%corner-wall-cabinet%'
  OR component_id LIKE '%wall-cabinet-corner%'
  OR component_id LIKE '%new-corner-wall-cabinet%';

-- Update corner tall units (corner-tall-*, corner-larder-*)
UPDATE component_2d_renders
SET elevation_data = jsonb_set(
  jsonb_set(
    elevation_data,
    '{is_corner}',
    'true'::jsonb
  ),
  '{corner_door_side}',
  '"auto"'::jsonb
)
WHERE component_id LIKE '%corner-tall%'
  OR component_id LIKE '%tall-corner%'
  OR component_id LIKE '%corner-larder%'
  OR component_id LIKE '%larder-corner%';

-- =====================================================
-- Step 2: Verification Query (for manual testing)
-- =====================================================

-- Uncomment to verify corner flags were added:
-- SELECT
--   component_id,
--   elevation_data->>'is_corner' as is_corner,
--   elevation_data->>'corner_door_side' as corner_door_side,
--   elevation_data->>'door_count' as door_count
-- FROM component_2d_renders
-- WHERE component_id LIKE '%corner%'
-- ORDER BY component_id;

-- =====================================================
-- Step 3: Add comment explaining the corner logic
-- =====================================================

COMMENT ON COLUMN component_2d_renders.elevation_data IS
'JSONB configuration for elevation rendering. For corner cabinets, includes:
- is_corner (boolean): true for corner cabinets
- corner_door_side (string): "left" | "right" | "auto" (auto uses centerline algorithm)
- corner_panel_style (string): "standard" | "glass" | "open" (optional)
See: docs/session-2025-10-09-2d-database-migration/CORNER-UNIT-DOOR-LOGIC-PRESERVATION.md';
