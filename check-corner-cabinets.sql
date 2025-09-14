-- Check for corner cabinets in the database
-- Look for duplicates and identify sources

-- Find all corner-related components
SELECT 
  component_id, 
  name, 
  category, 
  width, 
  depth, 
  height, 
  type,
  description
FROM public.components 
WHERE 
  name ILIKE '%corner%' 
  OR component_id LIKE '%corner%'
  OR description ILIKE '%corner%'
ORDER BY category, width;
