-- Cleanup script for duplicate components and categories
-- Run this to see what's actually in the database and clean up any issues

-- First, let's see what we have
SELECT 
  'CATEGORY ANALYSIS' as analysis_type,
  category,
  COUNT(*) as component_count,
  array_agg(DISTINCT component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE deprecated = false 
  AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Check for potential duplicate component_ids
SELECT 
  'DUPLICATE COMPONENT_IDS' as analysis_type,
  component_id,
  COUNT(*) as duplicate_count,
  array_agg(id) as record_ids
FROM public.components
WHERE 'kitchen' = ANY(room_types)
GROUP BY component_id
HAVING COUNT(*) > 1;

-- Check for our specific new components
SELECT 
  'NEW COMPONENTS CHECK' as analysis_type,
  component_id,
  name,
  category,
  width,
  depth,
  height,
  color
FROM public.components 
WHERE component_id IN ('l-shaped-test-cabinet', 'new-corner-wall-cabinet')
ORDER BY component_id;

-- Clean up any actual duplicates (keep the most recent one based on created_at)
DELETE FROM public.components a
WHERE a.id NOT IN (
  SELECT DISTINCT ON (component_id) id
  FROM public.components
  ORDER BY component_id, created_at DESC NULLS LAST
);

-- Standardize category names to lowercase with hyphens
UPDATE public.components 
SET category = LOWER(REPLACE(category, ' ', '-'))
WHERE category != LOWER(REPLACE(category, ' ', '-'));

-- Final verification
SELECT 
  'FINAL VERIFICATION' as analysis_type,
  category,
  COUNT(*) as component_count
FROM public.components 
WHERE deprecated = false 
  AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;
