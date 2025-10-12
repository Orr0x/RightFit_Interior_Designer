-- ════════════════════════════════════════════════════════════════════════════
-- Update default_z_position for Components
-- ════════════════════════════════════════════════════════════════════════════
--
-- IMPORTANT: Analysis shows 34 components already have CORRECT values!
-- This script ONLY updates components that currently have default_z_position = 0
--
-- Current State:
--   ✅ 4 cornice already at 200cm
--   ✅ 4 pelmet already at 140cm
--   ✅ 9 counter-top already at 90cm
--   ✅ 7 window already at 90cm
--   ✅ 3 end-panel already at 200cm
--   ✅ 7 wall-cabinets already at 140cm
--   ❌ 160 components still at 0cm (need checking)
--
-- Run this in: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Verify current state before making changes
-- ════════════════════════════════════════════════════════════════════════════

-- Show components that already have correct values (should not be modified)
SELECT
  type,
  default_z_position,
  COUNT(*) as count
FROM components
WHERE default_z_position != 0
GROUP BY type, default_z_position
ORDER BY type;

-- This should show:
--   cabinet: 140 (7 components)
--   cornice: 200 (4 components)
--   counter-top: 90 (9 components)
--   end-panel: 200 (3 components)
--   pelmet: 140 (4 components)
--   window: 90 (7 components)

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2: Update ONLY components that are currently at 0
-- ════════════════════════════════════════════════════════════════════════════

-- Update cornice components (top of wall units) - ONLY if currently 0
UPDATE components
SET default_z_position = 200
WHERE type = 'cornice'
  AND default_z_position = 0;

-- Update pelmet components (bottom of wall units) - ONLY if currently 0
UPDATE components
SET default_z_position = 140
WHERE type = 'pelmet'
  AND default_z_position = 0;

-- Update counter-top components (standard counter height) - ONLY if currently 0
UPDATE components
SET default_z_position = 90
WHERE type = 'counter-top'
  AND default_z_position = 0;

-- Update window components (typical sill height) - ONLY if currently 0
UPDATE components
SET default_z_position = 90
WHERE type = 'window'
  AND default_z_position = 0;

-- Update end-panel components (wall unit end panels) - ONLY if currently 0
UPDATE components
SET default_z_position = 200
WHERE type = 'end-panel'
  AND default_z_position = 0;

-- Update wall cabinets (component_id pattern) - ONLY if currently 0
-- Note: Some wall-cabinets already have 140, this catches any that don't
UPDATE components
SET default_z_position = 140
WHERE component_id LIKE '%wall-cabinet%'
  AND default_z_position = 0;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3: Verify the updates
-- ════════════════════════════════════════════════════════════════════════════

-- Show updated counts by type
SELECT
  type,
  default_z_position,
  COUNT(*) as count
FROM components
GROUP BY type, default_z_position
ORDER BY type, default_z_position;

-- Show components still at 0 (should mostly be floor-mounted like base cabinets, appliances, etc.)
SELECT
  type,
  COUNT(*) as count
FROM components
WHERE default_z_position = 0
GROUP BY type
ORDER BY count DESC;

-- Expected components still at 0:
--   - Base cabinets (floor-mounted)
--   - Appliances (most are floor-mounted)
--   - Sinks (integrated into counter-tops at counter height)
--   - Seating, tables, desks, beds (all floor furniture)
--   - Doors (floor to ceiling)

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- NOTES ON OTHER FIELDS
-- ════════════════════════════════════════════════════════════════════════════
--
-- elevation_height:
--   - Represents the component's OWN height (how tall it is)
--   - NOT the same as z-position (which is where it starts vertically)
--   - Example: Base cabinet at z=0 with elevation_height=85 means:
--     * Sits on floor (z=0)
--     * Is 85cm tall
--     * Top edge is at 85cm
--
-- plinth_height:
--   - All components show as populated in DB (though CSV export shows null)
--   - Represents height of plinth/toe-kick under component
--   - Typically 10-15cm for base cabinets
--   - Should be 0 for wall-mounted components
--
-- ════════════════════════════════════════════════════════════════════════════
