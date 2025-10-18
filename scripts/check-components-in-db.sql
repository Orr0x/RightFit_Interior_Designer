-- Check components in database
-- Run this in Supabase SQL Editor to see what's actually in the database

-- 1. Total count
SELECT COUNT(*) as total_components FROM components WHERE deprecated = false;

-- 2. Count by room type
SELECT
  unnest(room_types) as room_type,
  COUNT(*) as count
FROM components
WHERE deprecated = false
GROUP BY room_type
ORDER BY count DESC;

-- 3. Count by category for kitchen
SELECT
  category,
  COUNT(*) as count
FROM components
WHERE deprecated = false
  AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- 4. Check specific new components (tall corner larders, specialized sinks, etc.)
SELECT
  component_id,
  name,
  category,
  room_types
FROM components
WHERE component_id IN (
  'larder-corner-unit-60',
  'larder-corner-unit-90',
  'kitchen-sink-corner-90',
  'kitchen-sink-farmhouse-60',
  'larder-built-in-fridge',
  'larder-single-oven'
)
ORDER BY component_id;

-- 5. List all kitchen components
SELECT
  component_id,
  name,
  category,
  width,
  height,
  depth
FROM components
WHERE deprecated = false
  AND 'kitchen' = ANY(room_types)
ORDER BY category, name;
