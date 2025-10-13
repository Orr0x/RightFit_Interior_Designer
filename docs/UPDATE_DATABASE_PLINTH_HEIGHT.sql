-- ════════════════════════════════════════════════════════════════════════════
-- Update plinth_height for Components
-- ════════════════════════════════════════════════════════════════════════════
--
-- IMPORTANT: Consolidates plinth/toe-kick height to single source of truth
-- Fixes 2D (10cm) vs 3D (15cm) inconsistency by standardizing to 10cm
--
-- Current State:
--   ⚠️ components.plinth_height: empty/null (unused)
--   ✅ component_2d_renders.toe_kick_height: 10cm (2D uses this)
--   ❌ 3D renderers: 15cm (hardcoded)
--   🔴 Visual mismatch between 2D and 3D!
--
-- Target State:
--   ✅ components.plinth_height: populated (single source)
--   🔄 Renderers: read from database (with fallback)
--   ✅ 2D and 3D consistent
--
-- Run this in: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Verify current state
-- ════════════════════════════════════════════════════════════════════════════

-- Check current plinth_height values (should be mostly empty/0)
SELECT
  type,
  plinth_height,
  COUNT(*) as count
FROM components
WHERE plinth_height IS NOT NULL AND plinth_height != 0
GROUP BY type, plinth_height
ORDER BY type;

-- Expected: Very few or no rows

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2: Populate plinth_height values
-- ════════════════════════════════════════════════════════════════════════════

-- Base cabinets: 10cm standard plinth (matches 2D default)
UPDATE components
SET plinth_height = 10
WHERE type = 'cabinet'
  AND (default_z_position = 0 OR default_z_position IS NULL)
  AND component_id NOT LIKE '%wall-cabinet%';

-- Wall cabinets: 0cm (no plinth - wall-mounted)
UPDATE components
SET plinth_height = 0
WHERE type = 'cabinet'
  AND (default_z_position > 0 OR component_id LIKE '%wall-cabinet%');

-- All wall-mounted components: 0cm
UPDATE components
SET plinth_height = 0
WHERE type IN ('cornice', 'pelmet', 'window', 'end-panel', 'wall-unit-end-panel')
   OR default_z_position > 0;

-- Counter-tops: 0cm (sit on cabinets, no own plinth)
UPDATE components
SET plinth_height = 0
WHERE type = 'counter-top';

-- Sinks: 0cm (integrated into cabinets)
UPDATE components
SET plinth_height = 0
WHERE type = 'sink';

-- Appliances: 0cm (freestanding or integrated)
UPDATE components
SET plinth_height = 0
WHERE type = 'appliance';

-- All other types: 0cm (floor furniture has no plinth)
UPDATE components
SET plinth_height = 0
WHERE plinth_height IS NULL
  AND type IN ('seating', 'table', 'desk', 'bed', 'sofa', 'door', 'shower', 'mirror', 'toilet', 'bathtub');

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3: Verify updates
-- ════════════════════════════════════════════════════════════════════════════

-- Show plinth_height distribution by type
SELECT
  type,
  plinth_height,
  COUNT(*) as count
FROM components
GROUP BY type, plinth_height
ORDER BY type, plinth_height;

-- Expected results:
-- cabinet (base): 10cm (~72 components)
-- cabinet (wall): 0cm (~7 components)
-- All others: 0cm (~115 components)

-- Show components with plinth (should be base cabinets only)
SELECT
  component_id,
  name,
  type,
  plinth_height,
  default_z_position,
  width,
  height
FROM components
WHERE plinth_height > 0
ORDER BY plinth_height DESC, component_id;

-- Verify wall-mounted have no plinth
SELECT
  component_id,
  type,
  plinth_height,
  default_z_position
FROM components
WHERE default_z_position > 0
  AND plinth_height != 0;

-- Expected: No rows (wall-mounted should have plinth_height = 0)

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run after commit)
-- ════════════════════════════════════════════════════════════════════════════

-- Summary by type and plinth
SELECT
  type,
  CASE
    WHEN plinth_height = 0 THEN '0cm (no plinth)'
    WHEN plinth_height = 10 THEN '10cm (standard)'
    WHEN plinth_height > 10 THEN '>10cm (custom)'
    ELSE 'NULL (needs update)'
  END as plinth_category,
  COUNT(*) as count
FROM components
GROUP BY type, plinth_height
ORDER BY type, plinth_height;

-- Check for any NULL values (should be none)
SELECT COUNT(*) as null_count
FROM components
WHERE plinth_height IS NULL;

-- Expected: 0

-- ════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (if needed)
-- ════════════════════════════════════════════════════════════════════════════

-- If you need to undo:
-- UPDATE components SET plinth_height = NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- NOTES
-- ════════════════════════════════════════════════════════════════════════════
--
-- Standard plinth height: 10cm (4 inches)
-- - Chosen to match existing 2D render default
-- - Industry standard for base cabinets
-- - Provides toe space for standing at cabinets
--
-- Wall cabinets: 0cm
-- - Mounted on wall, no floor contact
-- - No plinth needed
--
-- Consistency:
-- - 2D elevation views will now match 3D
-- - Both read from same database source
-- - Code has fallback to 10cm if database empty
--
-- ════════════════════════════════════════════════════════════════════════════
