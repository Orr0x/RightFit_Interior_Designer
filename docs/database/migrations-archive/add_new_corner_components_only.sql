-- Add ONLY the new corner components (no duplicates)
-- This script adds only the 2 new test components we created

-- Temporarily disable RLS
ALTER TABLE public.components DISABLE ROW LEVEL SECURITY;

-- Insert ONLY the new corner components
INSERT INTO public.components (
  component_id, name, type, width, depth, height, color, category, room_types, icon_name, description, version, deprecated, metadata, tags
) VALUES 
-- New L-Shaped Test Cabinet for base-cabinets
('l-shaped-test-cabinet', 'L-Shaped Test Cabinet', 'cabinet', 90, 90, 90, '#FF6B35', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Test component with proper L-shaped geometry (2 x 90cm legs)', '1.0.0', false, '{"isLShaped": true, "legLength": 90, "legDepth": 60, "geometry": {"type": "L-shaped", "legs": [{"x": 0, "y": 0, "width": 90, "depth": 60}, {"x": 0, "y": 0, "width": 60, "depth": 90}]}}', '["test", "l-shaped", "corner"]'),

-- New Corner Wall Cabinet for wall-units  
('new-corner-wall-cabinet', 'New Corner Wall Cabinet', 'cabinet', 60, 60, 60, '#FF6B35', 'wall-units', ARRAY['kitchen'], 'Square', 'Corner wall cabinet with proper 60x60x60 dimensions (60x60 square works like base cabinet)', '1.0.0', false, '{"isCorner": true, "mountType": "wall"}', '["test", "corner", "wall"]')

-- Handle conflicts by updating if component already exists
ON CONFLICT (component_id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  width = EXCLUDED.width,
  depth = EXCLUDED.depth,
  height = EXCLUDED.height,
  color = EXCLUDED.color,
  category = EXCLUDED.category,
  room_types = EXCLUDED.room_types,
  icon_name = EXCLUDED.icon_name,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  metadata = EXCLUDED.metadata,
  tags = EXCLUDED.tags;

-- Re-enable RLS
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Added 2 new corner test components! 🔶';
  RAISE NOTICE '1. L-Shaped Test Cabinet (90x90x90) in base-cabinets';
  RAISE NOTICE '2. New Corner Wall Cabinet (60x60x60) in wall-units';
  RAISE NOTICE 'Both components use dynamic corner system! 🚀';
END $$;
