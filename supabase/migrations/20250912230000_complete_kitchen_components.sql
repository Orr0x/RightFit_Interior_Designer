-- Complete Kitchen Component Library
-- Generated from extracted components

-- Temporarily disable RLS
ALTER TABLE public.components DISABLE ROW LEVEL SECURITY;

-- Insert all kitchen components
INSERT INTO public.components (
  component_id, name, type, width, depth, height, color, category, room_types, icon_name, description, version, deprecated, metadata, tags
) VALUES 
('base-cabinet-30', 'Base Cabinet 30cm', 'cabinet', 30, 60, 90, '#8b4513', 'base-cabinets', ARRAY['kitchen'], 'Archive', 'Narrow 30cm base cabinet', '1.0.0', false, '{}', '{}'),
('base-cabinet-40', 'Base Cabinet 40cm', 'cabinet', 40, 60, 90, '#8b4513', 'base-cabinets', ARRAY['kitchen'], 'Archive', 'Compact 40cm base cabinet', '1.0.0', false, '{}', '{}'),
('base-cabinet-50', 'Base Cabinet 50cm', 'cabinet', 50, 60, 90, '#8b4513', 'base-cabinets', ARRAY['kitchen'], 'Archive', 'Medium 50cm base cabinet', '1.0.0', false, '{}', '{}'),
('base-cabinet-60', 'Base Cabinet 60cm', 'cabinet', 60, 60, 90, '#8b4513', 'base-cabinets', ARRAY['kitchen'], 'Archive', 'Standard 60cm base cabinet', '1.0.0', false, '{}', '{}'),
('corner-cabinet', 'Corner Base Cabinet', 'cabinet', 90, 90, 90, '#8b4513', 'base-cabinets', ARRAY['kitchen'], 'Square', 'L-shaped corner base cabinet', '1.0.0', false, '{}', '{}'),
('l-shaped-test-cabinet', 'L-Shaped Test Cabinet', 'cabinet', 90, 90, 90, '#FF6B35', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Test component with proper L-shaped geometry (2 x 90cm legs)', '1.0.0', false, '{}', '{}'),
('pan-drawers-50', 'Pan Drawers 50cm', 'cabinet', 50, 60, 60, '#8b4513', 'base-drawers', ARRAY['kitchen'], 'RectangleHorizontal', 'Medium 50cm pan drawer unit', '1.0.0', false, '{}', '{}'),
('pan-drawers-60', 'Pan Drawers 60cm', 'cabinet', 60, 60, 60, '#8b4513', 'base-drawers', ARRAY['kitchen'], 'RectangleHorizontal', 'Standard 60cm pan drawer unit', '1.0.0', false, '{}', '{}'),
('pan-drawers-80', 'Pan Drawers 80cm', 'cabinet', 80, 60, 60, '#8b4513', 'base-drawers', ARRAY['kitchen'], 'RectangleHorizontal', 'Wide 80cm pan drawer unit', '1.0.0', false, '{}', '{}'),
('wall-cabinet-30', 'Wall Cabinet 30cm', 'cabinet', 30, 35, 60, '#a0522d', 'wall-units', ARRAY['kitchen'], 'Box', 'Narrow 30cm wall cabinet', '1.0.0', false, '{}', '{}'),
('wall-cabinet-40', 'Wall Cabinet 40cm', 'cabinet', 40, 35, 60, '#a0522d', 'wall-units', ARRAY['kitchen'], 'Box', 'Compact 40cm wall cabinet', '1.0.0', false, '{}', '{}'),
('wall-cabinet-50', 'Wall Cabinet 50cm', 'cabinet', 50, 35, 60, '#a0522d', 'wall-units', ARRAY['kitchen'], 'Box', 'Medium 50cm wall cabinet', '1.0.0', false, '{}', '{}'),
('wall-cabinet-60', 'Wall Cabinet 60cm', 'cabinet', 60, 35, 60, '#a0522d', 'wall-units', ARRAY['kitchen'], 'Box', 'Standard 60cm wall cabinet', '1.0.0', false, '{}', '{}'),
('corner-wall-cabinet', 'Corner Wall Cabinet', 'cabinet', 90, 35, 60, '#a0522d', 'wall-units', ARRAY['kitchen'], 'Square', 'L-shaped corner wall cabinet', '1.0.0', false, '{}', '{}'),
('new-corner-wall-cabinet', 'New Corner Wall Cabinet', 'cabinet', 60, 60, 60, '#FF6B35', 'wall-units', ARRAY['kitchen'], 'Square', 'Corner wall cabinet with proper 60x60x60 dimensions (60x60 square works like base cabinet)', '1.0.0', false, '{}', '{}'),
('refrigerator', 'Refrigerator', 'appliance', 60, 60, 180, '#c0c0c0', 'appliances', ARRAY['kitchen'], 'Refrigerator', 'Standard refrigerator', '1.0.0', false, '{}', '{}'),
('dishwasher', 'Dishwasher', 'appliance', 60, 60, 85, '#d3d3d3', 'appliances', ARRAY['kitchen'], 'Waves', 'Built-in dishwasher', '1.0.0', false, '{}', '{}'),
('oven', 'Built-in Oven', 'appliance', 60, 60, 60, '#2c2c2c', 'appliances', ARRAY['kitchen'], 'Microwave', 'Built-in electric oven', '1.0.0', false, '{}', '{}'),
('washing-machine', 'Washing Machine', 'appliance', 60, 60, 85, '#f0f0f0', 'appliances', ARRAY['kitchen'], 'Zap', 'Front-loading washing machine', '1.0.0', false, '{}', '{}'),
('tumble-dryer', 'Tumble Dryer', 'appliance', 60, 60, 85, '#e8e8e8', 'appliances', ARRAY['kitchen'], 'Wind', 'Tumble dryer with round door', '1.0.0', false, '{}', '{}'),
('larder-full-height', 'Full Height Larder Unit', 'cabinet', 60, 60, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Archive', 'Full-height pantry larder with adjustable shelving', '1.0.0', false, '{}', '{}'),
('larder-built-in-fridge', 'Built-in Fridge Larder', 'cabinet', 60, 60, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Refrigerator', 'Integrated refrigerator disguised as larder unit', '1.0.0', false, '{}', '{}'),
('larder-single-oven', 'Single Built-in Oven Larder', 'cabinet', 60, 60, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Microwave', 'Single built-in oven with storage above and below', '1.0.0', false, '{}', '{}'),
('larder-double-oven', 'Double Built-in Oven Larder', 'cabinet', 60, 60, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Microwave', 'Double built-in oven stack with storage compartments', '1.0.0', false, '{}', '{}'),
('larder-oven-microwave', 'Oven + Microwave Larder', 'cabinet', 60, 60, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Microwave', 'Combined oven and microwave in single larder unit', '1.0.0', false, '{}', '{}'),
('larder-coffee-machine', 'Coffee Machine Larder', 'cabinet', 60, 60, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Zap', 'Integrated coffee machine with storage above and below', '1.0.0', false, '{}', '{}'),
('larder-corner-unit', 'Corner Larder Unit', 'cabinet', 90, 90, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Square', 'L-shaped corner larder unit maximizing space efficiency', '1.0.0', false, '{}', '{}'),
('toe-kick-standard', 'Standard Toe Kick', 'toe-kick', 60, 10, 15, '#FFFFFF', 'kitchen-toe-kick', ARRAY['kitchen'], 'PanelLeft', 'Standard toe kick for base units - 60cm x 10cm x 15cm', '1.0.0', false, '{}', '{}'),
('toe-kick-corner', 'Corner Toe Kick', 'toe-kick', 90, 10, 15, '#FFFFFF', 'kitchen-toe-kick', ARRAY['kitchen'], 'PanelLeft', 'L-shaped toe kick for corner units - 90cm x 10cm x 15cm', '1.0.0', false, '{}', '{}'),
('toe-kick-long', 'Long Toe Kick', 'toe-kick', 120, 10, 15, '#FFFFFF', 'kitchen-toe-kick', ARRAY['kitchen'], 'PanelLeft', 'Long toe kick for multiple base units - 120cm x 10cm x 15cm', '1.0.0', false, '{}', '{}'),
('cornice-standard', 'Standard Cornice', 'cornice', 60, 5, 15, '#FFFFFF', 'kitchen-cornice', ARRAY['kitchen'], 'Crown', 'Standard cornice for wall units - 60cm x 5cm x 15cm', '1.0.0', false, '{}', '{}'),
('cornice-corner', 'Corner Cornice', 'cornice', 90, 5, 15, '#FFFFFF', 'kitchen-cornice', ARRAY['kitchen'], 'Crown', 'L-shaped cornice for corner wall units - 90cm x 5cm x 15cm', '1.0.0', false, '{}', '{}'),
('cornice-long', 'Long Cornice', 'cornice', 120, 5, 15, '#FFFFFF', 'kitchen-cornice', ARRAY['kitchen'], 'Crown', 'Long cornice for multiple wall units - 120cm x 5cm x 15cm', '1.0.0', false, '{}', '{}'),
('pelmet-standard', 'Standard Pelmet', 'pelmet', 60, 8, 15, '#FFFFFF', 'kitchen-pelmet', ARRAY['kitchen'], 'PanelRight', 'Standard pelmet for wall units - 60cm x 8cm x 15cm', '1.0.0', false, '{}', '{}'),
('pelmet-corner', 'Corner Pelmet', 'pelmet', 90, 8, 15, '#FFFFFF', 'kitchen-pelmet', ARRAY['kitchen'], 'PanelRight', 'L-shaped pelmet for corner wall units - 90cm x 8cm x 15cm', '1.0.0', false, '{}', '{}'),
('pelmet-long', 'Long Pelmet', 'pelmet', 120, 8, 15, '#FFFFFF', 'kitchen-pelmet', ARRAY['kitchen'], 'PanelRight', 'Long pelmet for multiple wall units - 120cm x 8cm x 15cm', '1.0.0', false, '{}', '{}'),
('wall-unit-end-panel', 'Wall Unit End Panel', 'wall-unit-end-panel', 1.8, 60, 200, '#8B4513', 'kitchen-wall-unit-end-panels', ARRAY['kitchen'], 'PanelLeft', 'Wall unit end panel - 1.8cm x 60cm x 200cm', '1.0.0', false, '{}', '{}'),
('wall-unit-end-panel-corner', 'Corner Wall Unit End Panel', 'wall-unit-end-panel', 1.8, 90, 200, '#8B4513', 'kitchen-wall-unit-end-panels', ARRAY['kitchen'], 'PanelLeft', 'L-shaped wall unit end panel - 1.8cm x 90cm x 200cm', '1.0.0', false, '{}', '{}'),
('utility-storage-cabinet', 'Utility Storage', 'cabinet', 80, 60, 200, '#8b4513', 'utility-storage', ARRAY['kitchen'], 'Archive', 'Tall utility storage cabinet', '1.0.0', false, '{}', '{}')

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
  version = EXCLUDED.version;

-- Re-enable RLS
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Complete kitchen component library installed! 🍳';
  RAISE NOTICE 'Added 39 kitchen components';
  RAISE NOTICE 'Categories: base-cabinets, base-drawers, wall-units, appliances, kitchen-larder, kitchen-toe-kick, kitchen-cornice, kitchen-pelmet, kitchen-wall-unit-end-panels, utility-storage';
  RAISE NOTICE 'Kitchen design is now fully equipped! 🚀';
END $$;