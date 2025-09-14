-- Fix Cornice & Pelmet Dimensions
-- Change from current dimensions to 4cm high × 8cm deep

-- Temporarily disable RLS for component updates
ALTER TABLE public.components DISABLE ROW LEVEL SECURITY;

-- Update ALL cornice components to correct dimensions (4cm high × 8cm deep)
UPDATE public.components 
SET height = 4, depth = 8
WHERE type = 'cornice';

-- Update ALL pelmet components to correct dimensions (4cm high × 8cm deep)  
UPDATE public.components 
SET height = 4, depth = 8
WHERE type = 'pelmet';

-- Verify the updates
SELECT 
  component_id, 
  name, 
  type,
  width, 
  depth, 
  height,
  category
FROM public.components 
WHERE type IN ('cornice', 'pelmet')
ORDER BY type, width;

-- Re-enable RLS
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
