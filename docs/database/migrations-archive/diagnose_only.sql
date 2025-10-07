-- DIAGNOSTIC ONLY - No changes made to database
-- Run this to see what's actually in your database

-- 1. Show all categories and their component counts
SELECT 
  'CATEGORY ANALYSIS' as analysis_type,
  category,
  COUNT(*) as component_count,
  string_agg(component_id, ', ' ORDER BY component_id) as component_ids
FROM public.components 
WHERE deprecated = false 
  AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- 2. Check for duplicate component_ids
SELECT 
  'DUPLICATE CHECK' as analysis_type,
  component_id,
  COUNT(*) as duplicate_count,
  string_agg(id::text, ', ') as record_ids,
  string_agg(name, ' | ') as names
FROM public.components
WHERE 'kitchen' = ANY(room_types)
GROUP BY component_id
HAVING COUNT(*) > 1
ORDER BY component_id;

-- 3. Look specifically for our new components
SELECT 
  'NEW COMPONENTS' as analysis_type,
  component_id,
  name,
  category,
  width || 'x' || depth || 'x' || height as dimensions,
  color,
  created_at
FROM public.components 
WHERE component_id IN ('l-shaped-test-cabinet', 'new-corner-wall-cabinet')
ORDER BY component_id;

-- 4. Check for category name variations (case sensitivity issues)
SELECT 
  'CATEGORY VARIATIONS' as analysis_type,
  category,
  COUNT(*) as count,
  'Potential issue: ' || category as note
FROM public.components 
WHERE deprecated = false 
  AND 'kitchen' = ANY(room_types)
  AND (category != LOWER(category) OR category LIKE '% %')
GROUP BY category
ORDER BY category;

-- 5. Total component count
SELECT 
  'TOTAL COUNT' as analysis_type,
  COUNT(*) as total_kitchen_components,
  COUNT(DISTINCT component_id) as unique_component_ids,
  COUNT(*) - COUNT(DISTINCT component_id) as potential_duplicates
FROM public.components 
WHERE deprecated = false 
  AND 'kitchen' = ANY(room_types);
