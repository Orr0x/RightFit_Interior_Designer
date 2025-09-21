-- SAFE CLEANUP PLAN: Remove duplicates while preserving essential components
-- This script removes duplicate component_ids, keeping the most recent version

-- STEP 1: Analyze what we have (run this first to see the impact)
SELECT 
  'DUPLICATE ANALYSIS' as analysis_type,
  component_id,
  COUNT(*) as duplicate_count,
  array_agg(created_at::date ORDER BY created_at DESC) as creation_dates,
  array_agg(id ORDER BY created_at DESC) as record_ids
FROM public.components
GROUP BY component_id
HAVING COUNT(*) > 1
ORDER BY component_id;

-- STEP 2: Show what would be deleted (DRY RUN - doesn't actually delete)
SELECT 
  'COMPONENTS TO DELETE' as analysis_type,
  id,
  component_id,
  name,
  created_at::date as created_date,
  'DUPLICATE - OLDER VERSION' as reason
FROM public.components a
WHERE a.id NOT IN (
  SELECT DISTINCT ON (component_id) id
  FROM public.components
  ORDER BY component_id, created_at DESC NULLS LAST
)
ORDER BY component_id, created_at;

-- STEP 3: Show what would be kept
SELECT 
  'COMPONENTS TO KEEP' as analysis_type,
  id,
  component_id,
  name,
  created_at::date as created_date,
  'MOST RECENT VERSION' as reason
FROM public.components a
WHERE a.id IN (
  SELECT DISTINCT ON (component_id) id
  FROM public.components
  ORDER BY component_id, created_at DESC NULLS LAST
)
ORDER BY component_id;

-- STEP 4: Count components by creation date
SELECT 
  'COMPONENT COUNT BY DATE' as analysis_type,
  created_at::date as creation_date,
  COUNT(*) as component_count
FROM public.components
GROUP BY created_at::date
ORDER BY created_at::date DESC;

-- STEP 5: Verify your new L-shaped components are safe
SELECT 
  'NEW L-SHAPED COMPONENTS' as analysis_type,
  component_id,
  name,
  created_at,
  'THESE ARE UNIQUE - SAFE TO KEEP' as status
FROM public.components 
WHERE component_id IN ('l-shaped-test-cabinet', 'new-corner-wall-cabinet')
ORDER BY component_id;

-- UNCOMMENT THE LINES BELOW TO ACTUALLY PERFORM THE CLEANUP
-- WARNING: This will permanently delete duplicate components!

-- DELETE FROM public.components a
-- WHERE a.id NOT IN (
--   SELECT DISTINCT ON (component_id) id
--   FROM public.components
--   ORDER BY component_id, created_at DESC NULLS LAST
-- );

-- Final verification after cleanup
-- SELECT 
--   'FINAL COMPONENT COUNT' as analysis_type,
--   COUNT(*) as total_components,
--   COUNT(DISTINCT component_id) as unique_component_ids
-- FROM public.components;
