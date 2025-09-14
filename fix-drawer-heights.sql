-- Fix Pan Drawer Heights to Match Base Cabinets (90cm)
-- Currently they are 60cm but should be 90cm like standard base units

UPDATE components 
SET height = 90
WHERE component_id LIKE '%pan-drawers%' 
  AND height = 60;

-- Verify the update
SELECT 
  name, 
  width, 
  depth, 
  height,
  'FIXED' as status
FROM components 
WHERE component_id LIKE '%pan-drawers%' 
ORDER BY name;
