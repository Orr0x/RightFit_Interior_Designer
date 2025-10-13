-- Migration: Create orientation variants for non-square components
-- Purpose: Simplify rotation logic by having N/S and E/W oriented components
-- Only affects non-square components (width ≠ depth)

-- STRATEGY: Copy minimal essential fields including description (NOT NULL constraint)

-- Step 1: Create North/South variants
INSERT INTO components (
  component_id,
  name,
  description,
  type,
  category,
  width,
  depth,
  height,
  color,
  room_types,
  icon_name,
  default_z_position,
  plinth_height
)
SELECT
  component_id || '-ns' as component_id,
  name || ' (N/S)' as name,
  COALESCE(description, 'North/South orientation') as description,
  type,
  category,
  width,
  depth,
  height,
  color,
  room_types,
  icon_name,
  default_z_position,
  plinth_height
FROM components
WHERE width != depth
AND category IN ('base-cabinets', 'wall-cabinets', 'drawer-units', 'tall-units')
AND component_id NOT LIKE '%-ns'
AND component_id NOT LIKE '%-ew'
ON CONFLICT (component_id) DO NOTHING;

-- Step 2: Create East/West variants (swap width and depth)
INSERT INTO components (
  component_id,
  name,
  description,
  type,
  category,
  width,
  depth,
  height,
  color,
  room_types,
  icon_name,
  default_z_position,
  plinth_height
)
SELECT
  component_id || '-ew' as component_id,
  name || ' (E/W)' as name,
  COALESCE(description, 'East/West orientation') as description,
  type,
  category,
  depth as width,  -- SWAP
  width as depth,  -- SWAP
  height,
  color,
  room_types,
  icon_name,
  default_z_position,
  plinth_height
FROM components
WHERE width != depth
AND category IN ('base-cabinets', 'wall-cabinets', 'drawer-units', 'tall-units')
AND component_id NOT LIKE '%-ns'
AND component_id NOT LIKE '%-ew'
ON CONFLICT (component_id) DO NOTHING;

-- Step 3: Verify results
DO $$
DECLARE
  original_count INTEGER;
  ns_count INTEGER;
  ew_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO original_count
  FROM components
  WHERE width != depth
  AND category IN ('base-cabinets', 'wall-cabinets', 'drawer-units', 'tall-units')
  AND component_id NOT LIKE '%-ns'
  AND component_id NOT LIKE '%-ew';

  SELECT COUNT(*) INTO ns_count
  FROM components
  WHERE component_id LIKE '%-ns'
  AND category IN ('base-cabinets', 'wall-cabinets', 'drawer-units', 'tall-units');

  SELECT COUNT(*) INTO ew_count
  FROM components
  WHERE component_id LIKE '%-ew'
  AND category IN ('base-cabinets', 'wall-cabinets', 'drawer-units', 'tall-units');

  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Orientation Migration Complete';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Original non-square components: %', original_count;
  RAISE NOTICE 'North/South variants created: %', ns_count;
  RAISE NOTICE 'East/West variants created: %', ew_count;
  RAISE NOTICE 'Total new components: %', ns_count + ew_count;
  RAISE NOTICE '================================================================';
END $$;
