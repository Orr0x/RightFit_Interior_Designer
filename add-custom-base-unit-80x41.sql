-- Add Custom 80cm Wide × 41cm Deep Base Unit for Plumbing Clearance
-- This unit will align perfectly with existing cabinets while providing space for plumbing

-- Temporarily disable RLS for component insertion
ALTER TABLE public.components DISABLE ROW LEVEL SECURITY;

-- Insert the custom base units (both heights with unique IDs)
INSERT INTO public.components (
  component_id, name, type, width, depth, height, color, category, room_types, icon_name, description, version, deprecated, metadata, tags
) VALUES 
('base-cabinet-80x41-90h', 'Base Cabinet 80cm × 41cm (90cm Height)', 'cabinet', 80, 41, 90, '#8b4513', 'base-cabinets', ARRAY['kitchen'], 'Archive', 'Custom 80cm wide × 41cm deep × 90cm height base cabinet for plumbing clearance - standard base cabinet height', '1.0.0', false, '{}', '{}'),
('base-cabinet-80x41-72h', 'Base Cabinet 80cm × 41cm (72cm Height)', 'cabinet', 80, 41, 72, '#8b4513', 'base-cabinets', ARRAY['kitchen'], 'Archive', 'Custom 80cm wide × 41cm deep × 72cm height base cabinet - matches original 80cm cabinet height for perfect alignment', '1.0.0', false, '{}', '{}');

-- Re-enable RLS
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;

-- Verify the insertion
SELECT component_id, name, width, depth, height, category 
FROM public.components 
WHERE component_id IN ('base-cabinet-80x41-90h', 'base-cabinet-80x41-72h')
ORDER BY height DESC;
