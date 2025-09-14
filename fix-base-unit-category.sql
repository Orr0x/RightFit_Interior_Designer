-- Fix Custom Base Unit Categories - Move to "Base Units" category
-- The UI expects "Base Units" but we used "base-cabinets"

-- Temporarily disable RLS for component updates
ALTER TABLE public.components DISABLE ROW LEVEL SECURITY;

-- Update ALL base cabinets to use correct category name
UPDATE public.components 
SET category = 'Base Units'
WHERE category = 'base-cabinets' OR component_id IN ('base-cabinet-80x41-90h', 'base-cabinet-80x41-72h');

-- Verify the update - show all base units now
SELECT component_id, name, category, width, depth, height 
FROM public.components 
WHERE category = 'Base Units'
ORDER BY width, height DESC;

-- Also check what other base units use for category consistency
SELECT DISTINCT category, COUNT(*) as component_count
FROM public.components 
WHERE name LIKE '%Base%' OR name LIKE '%base%'
GROUP BY category
ORDER BY component_count DESC;

-- Re-enable RLS
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
