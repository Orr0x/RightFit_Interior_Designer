-- Remove Duplicate Corner Cabinets
-- Keep the cleaner named versions, remove the redundant ones

-- Temporarily disable RLS for component deletion
ALTER TABLE public.components DISABLE ROW LEVEL SECURITY;

-- Remove duplicate corner base cabinet (keep db-corner-cabinet, remove db-corner-base-cabinet)
DELETE FROM public.components 
WHERE component_id = 'db-corner-base-cabinet';

-- Remove duplicate wall corner cabinet (keep db-corner-wall-cabinet, remove db-wall-corner-cabinet)  
DELETE FROM public.components 
WHERE component_id = 'db-wall-corner-cabinet';

-- Verify the cleanup - should show only one of each corner cabinet type
SELECT 
  component_id, 
  name, 
  category, 
  width, 
  depth, 
  height
FROM public.components 
WHERE 
  (name ILIKE '%corner%' AND category IN ('Base Units', 'Wall Units'))
ORDER BY category, name;

-- Show count of remaining corner kitchen components
SELECT 
  category,
  COUNT(*) as corner_count
FROM public.components 
WHERE 
  name ILIKE '%corner%' 
  AND category IN ('Base Units', 'Wall Units', 'Tall Units', 'Worktops', 'Finishing')
GROUP BY category
ORDER BY category;

-- Re-enable RLS
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
