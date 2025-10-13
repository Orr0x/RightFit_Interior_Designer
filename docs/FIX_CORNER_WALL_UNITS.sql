-- Fix Corner Wall Units - They should be 60x60 squares (like corner base units)
-- Problem: Lost during earlier cleanup, showing as rectangles instead of squares

-- Step 1: Check current dimensions
SELECT
  component_id,
  name,
  width,
  depth,
  height,
  category,
  CASE
    WHEN width = depth THEN 'SQUARE ✅'
    ELSE 'RECTANGLE ❌ (needs fixing)'
  END as shape_status
FROM components
WHERE (name ILIKE '%corner%' AND category = 'wall-cabinets')
OR component_id ILIKE '%corner%wall%'
ORDER BY name;

-- Step 2: Fix corner wall units to be 60x60 squares
UPDATE components
SET
  width = 60,
  depth = 60,
  description = COALESCE(description, '') || ' Fixed to 60x60 square footprint.',
  updated_at = NOW()
WHERE (name ILIKE '%corner%' AND category = 'wall-cabinets')
OR component_id ILIKE '%corner%wall%'
RETURNING component_id, name, width, depth, height;

-- Step 3: Verify the fix
SELECT
  component_id,
  name,
  width,
  depth,
  height,
  category,
  CASE
    WHEN width = depth THEN 'SQUARE ✅'
    ELSE 'RECTANGLE ❌'
  END as shape_status
FROM components
WHERE (name ILIKE '%corner%' AND category = 'wall-cabinets')
OR component_id ILIKE '%corner%wall%'
ORDER BY name;

-- Expected result: All corner wall units should be 60x60 (SQUARE ✅)
-- This matches corner base units which are also 60x60
