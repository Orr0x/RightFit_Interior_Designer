-- Fix tall corner unit dimensions to 90x90cm (not 120x120cm)
-- This addresses the issue where tall corner units appear too wide in elevation view

-- Update the larder-corner-unit to correct dimensions
UPDATE public.components 
SET 
  width = 90,
  depth = 90,
  height = 200
WHERE component_id = 'larder-corner-unit';

-- Check if there are any other corner tall units with wrong dimensions
UPDATE public.components 
SET 
  width = 90,
  depth = 90
WHERE 
  component_id LIKE '%corner%' 
  AND component_id LIKE '%tall%' 
  AND width = 120;

UPDATE public.components 
SET 
  width = 90,
  depth = 90
WHERE 
  component_id LIKE '%corner%' 
  AND component_id LIKE '%larder%' 
  AND width = 120;

-- Verification query to check the fix
SELECT 
  component_id,
  name,
  width,
  depth,
  height,
  category
FROM public.components 
WHERE 
  (component_id LIKE '%corner%' AND (component_id LIKE '%tall%' OR component_id LIKE '%larder%'))
  OR component_id = 'larder-corner-unit'
ORDER BY component_id;
