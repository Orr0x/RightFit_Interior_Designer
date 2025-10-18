-- ================================================================
-- Week 38: Populate Components Catalog (UI Component Selector)
-- ================================================================
-- Purpose: Populate the components table to make all database components
--          available in the UI component selector
--
-- This migration adds entries to the `components` table for all
-- components that exist in `component_3d_models` table.
--
-- Note: The components table controls what appears in the UI selector,
--       while component_3d_models controls 3D rendering geometry.
-- ================================================================

-- ================================================================
-- KITCHEN COMPONENTS
-- ================================================================

INSERT INTO public.components (
  component_id, name, type, width, depth, height, color, category, room_types, icon_name, description, version, deprecated, metadata, tags
) VALUES
-- Corner Cabinets (Already exists, but ensuring completeness)
('l-shaped-test-cabinet-60', 'Corner Base Cabinet 60cm', 'cabinet', 60, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'L-shaped corner base cabinet with 60cm legs', '1.0.0', false, '{}', '{}'),
('l-shaped-test-cabinet-90', 'Corner Base Cabinet 90cm', 'cabinet', 90, 90, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'L-shaped corner base cabinet with 90cm legs', '1.0.0', false, '{}', '{}'),
('new-corner-wall-cabinet-60', 'Corner Wall Cabinet 60cm', 'cabinet', 60, 40, 70, '#F5F5F5', 'wall-cabinets', ARRAY['kitchen'], 'Square', 'L-shaped corner wall cabinet with 60cm legs', '1.0.0', false, '{}', '{}'),
('new-corner-wall-cabinet-90', 'Corner Wall Cabinet 90cm', 'cabinet', 90, 40, 70, '#F5F5F5', 'wall-cabinets', ARRAY['kitchen'], 'Square', 'L-shaped corner wall cabinet with 90cm legs', '1.0.0', false, '{}', '{}'),

-- Tall Corner Larders (NEW)
('larder-corner-unit-60', 'Tall Corner Larder 60cm', 'cabinet', 60, 60, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Square', 'L-shaped tall corner larder unit with 60cm legs', '1.0.0', false, '{}', '{}'),
('larder-corner-unit-90', 'Tall Corner Larder 90cm', 'cabinet', 90, 90, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Square', 'L-shaped tall corner larder unit with 90cm legs', '1.0.0', false, '{}', '{}'),

-- Base Cabinets
('base-cabinet-30', 'Base Cabinet 30cm', 'cabinet', 30, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Narrow 30cm base cabinet', '1.0.0', false, '{}', '{}'),
('base-cabinet-40', 'Base Cabinet 40cm', 'cabinet', 40, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Compact 40cm base cabinet', '1.0.0', false, '{}', '{}'),
('base-cabinet-50', 'Base Cabinet 50cm', 'cabinet', 50, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Medium 50cm base cabinet', '1.0.0', false, '{}', '{}'),
('base-cabinet-60', 'Base Cabinet 60cm', 'cabinet', 60, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Standard 60cm base cabinet', '1.0.0', false, '{}', '{}'),
('base-cabinet-80', 'Base Cabinet 80cm', 'cabinet', 80, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Wide 80cm base cabinet', '1.0.0', false, '{}', '{}'),
('base-cabinet-100', 'Base Cabinet 100cm', 'cabinet', 100, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Extra wide 100cm base cabinet', '1.0.0', false, '{}', '{}'),

-- Wall Cabinets
('wall-cabinet-30', 'Wall Cabinet 30cm', 'cabinet', 30, 40, 60, '#F5F5F5', 'wall-cabinets', ARRAY['kitchen'], 'Square', 'Narrow 30cm wall cabinet', '1.0.0', false, '{}', '{}'),
('wall-cabinet-40', 'Wall Cabinet 40cm', 'cabinet', 40, 40, 60, '#F5F5F5', 'wall-cabinets', ARRAY['kitchen'], 'Square', 'Compact 40cm wall cabinet', '1.0.0', false, '{}', '{}'),
('wall-cabinet-50', 'Wall Cabinet 50cm', 'cabinet', 50, 40, 60, '#F5F5F5', 'wall-cabinets', ARRAY['kitchen'], 'Square', 'Medium 50cm wall cabinet', '1.0.0', false, '{}', '{}'),
('wall-cabinet-60', 'Wall Cabinet 60cm', 'cabinet', 60, 40, 60, '#F5F5F5', 'wall-cabinets', ARRAY['kitchen'], 'Square', 'Standard 60cm wall cabinet', '1.0.0', false, '{}', '{}'),
('wall-cabinet-80', 'Wall Cabinet 80cm', 'cabinet', 80, 40, 60, '#F5F5F5', 'wall-cabinets', ARRAY['kitchen'], 'Square', 'Wide 80cm wall cabinet', '1.0.0', false, '{}', '{}'),

-- Tall Units & Larders
('tall-unit-60', 'Tall Unit 60cm', 'cabinet', 60, 60, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Square', 'Full height 60cm larder unit', '1.0.0', false, '{}', '{}'),
('tall-unit-80', 'Tall Unit 80cm', 'cabinet', 80, 60, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Square', 'Full height 80cm larder unit', '1.0.0', false, '{}', '{}'),
('oven-housing-60', 'Oven Housing 60cm', 'cabinet', 60, 60, 200, '#F5F5F5', 'kitchen-larder', ARRAY['kitchen'], 'Square', 'Tall oven housing unit', '1.0.0', false, '{}', '{}'),

-- Specialty Larder Appliances (NEW)
('larder-built-in-fridge', 'Larder Built-in Fridge', 'appliance', 60, 60, 200, '#FFFFFF', 'appliances', ARRAY['kitchen'], 'Square', 'Tall larder with integrated fridge', '1.0.0', false, '{}', '{}'),
('larder-single-oven', 'Larder Single Oven', 'appliance', 60, 60, 200, '#2c2c2c', 'appliances', ARRAY['kitchen'], 'Square', 'Tall larder with single oven', '1.0.0', false, '{}', '{}'),
('larder-double-oven', 'Larder Double Oven', 'appliance', 60, 60, 200, '#2c2c2c', 'appliances', ARRAY['kitchen'], 'Square', 'Tall larder with double oven', '1.0.0', false, '{}', '{}'),
('larder-oven-microwave', 'Larder Oven + Microwave', 'appliance', 60, 60, 200, '#2c2c2c', 'appliances', ARRAY['kitchen'], 'Square', 'Tall larder with oven and microwave', '1.0.0', false, '{}', '{}'),
('larder-coffee-machine', 'Larder Coffee Machine', 'appliance', 60, 60, 200, '#2c2c2c', 'appliances', ARRAY['kitchen'], 'Square', 'Tall larder with built-in coffee machine', '1.0.0', false, '{}', '{}'),

-- Appliances
('oven-60', 'Oven 60cm', 'appliance', 60, 60, 60, '#2c2c2c', 'appliances', ARRAY['kitchen'], 'Square', 'Built-in oven 60cm', '1.0.0', false, '{}', '{}'),
('dishwasher-60', 'Dishwasher 60cm', 'appliance', 60, 60, 85, '#E0E0E0', 'appliances', ARRAY['kitchen'], 'Square', 'Integrated dishwasher 60cm', '1.0.0', false, '{}', '{}'),
('fridge-60', 'Fridge 60cm', 'appliance', 60, 60, 180, '#FFFFFF', 'appliances', ARRAY['kitchen'], 'Square', 'Freestanding fridge 60cm', '1.0.0', false, '{}', '{}'),
('fridge-90', 'Fridge 90cm', 'appliance', 90, 60, 180, '#FFFFFF', 'appliances', ARRAY['kitchen'], 'Square', 'American style fridge 90cm', '1.0.0', false, '{}', '{}'),

-- Basic Sinks & Counter-tops
('sink-60', 'Sink 60cm', 'sink', 60, 50, 20, '#C0C0C0', 'sinks', ARRAY['kitchen'], 'Circle', 'Single bowl sink 60cm', '1.0.0', false, '{}', '{}'),
('sink-80', 'Sink 80cm', 'sink', 80, 50, 20, '#C0C0C0', 'sinks', ARRAY['kitchen'], 'Circle', 'Double bowl sink 80cm', '1.0.0', false, '{}', '{}'),
('sink-100', 'Sink 100cm', 'sink', 100, 50, 20, '#C0C0C0', 'sinks', ARRAY['kitchen'], 'Circle', 'Large double bowl sink 100cm', '1.0.0', false, '{}', '{}'),

-- Specialized Sinks (NEW)
('kitchen-sink-corner-90', 'Kitchen Sink Corner 90cm', 'sink', 90, 50, 20, '#C0C0C0', 'sinks', ARRAY['kitchen'], 'Square', 'L-shaped corner sink 90cm', '1.0.0', false, '{}', '{}'),
('kitchen-sink-farmhouse-60', 'Kitchen Sink Farmhouse 60cm', 'sink', 60, 55, 25, '#FFFFFF', 'sinks', ARRAY['kitchen'], 'Circle', 'Farmhouse sink with apron front 60cm', '1.0.0', false, '{}', '{}'),
('kitchen-sink-farmhouse-80', 'Kitchen Sink Farmhouse 80cm', 'sink', 80, 55, 25, '#FFFFFF', 'sinks', ARRAY['kitchen'], 'Circle', 'Farmhouse sink with apron front 80cm', '1.0.0', false, '{}', '{}'),
('kitchen-sink-undermount-60', 'Kitchen Sink Undermount 60cm', 'sink', 60, 50, 18, '#C0C0C0', 'sinks', ARRAY['kitchen'], 'Circle', 'Undermount sink 60cm', '1.0.0', false, '{}', '{}'),
('kitchen-sink-undermount-80', 'Kitchen Sink Undermount 80cm', 'sink', 80, 50, 18, '#C0C0C0', 'sinks', ARRAY['kitchen'], 'Circle', 'Undermount sink 80cm', '1.0.0', false, '{}', '{}'),
('kitchen-sink-island-100', 'Kitchen Sink Island 100cm', 'sink', 100, 50, 20, '#C0C0C0', 'sinks', ARRAY['kitchen'], 'Circle', 'Island sink 100cm', '1.0.0', false, '{}', '{}'),
('kitchen-sink-granite-80', 'Kitchen Sink Granite 80cm', 'sink', 80, 50, 20, '#2F4F4F', 'sinks', ARRAY['kitchen'], 'Circle', 'Black granite composite sink 80cm', '1.0.0', false, '{}', '{}'),
('kitchen-sink-copper-60', 'Kitchen Sink Copper 60cm', 'sink', 60, 50, 20, '#B87333', 'sinks', ARRAY['kitchen'], 'Circle', 'Hand-hammered copper sink 60cm', '1.0.0', false, '{}', '{}'),
('kitchen-sink-quartz-80', 'Kitchen Sink Quartz 80cm', 'sink', 80, 50, 20, '#F8F8F8', 'sinks', ARRAY['kitchen'], 'Circle', 'White quartz composite sink 80cm', '1.0.0', false, '{}', '{}'),
('butler-sink-60', 'Butler Sink 60cm', 'sink', 60, 50, 25, '#FFFFFF', 'sinks', ARRAY['kitchen'], 'Circle', 'White ceramic butler sink 60cm', '1.0.0', false, '{}', '{}'),
('butler-sink-80', 'Butler Sink 80cm', 'sink', 80, 50, 25, '#FFFFFF', 'sinks', ARRAY['kitchen'], 'Circle', 'White ceramic butler sink 80cm', '1.0.0', false, '{}', '{}'),
('butler-sink-corner-90', 'Butler Sink Corner 90cm', 'sink', 90, 50, 25, '#FFFFFF', 'sinks', ARRAY['kitchen'], 'Square', 'L-shaped corner butler sink 90cm', '1.0.0', false, '{}', '{}'),
('butler-sink-deep-60', 'Butler Sink Deep 60cm', 'sink', 60, 50, 30, '#FFFFFF', 'sinks', ARRAY['kitchen'], 'Circle', 'Extra deep butler sink 60cm', '1.0.0', false, '{}', '{}'),
('butler-sink-shallow-60', 'Butler Sink Shallow 60cm', 'sink', 60, 50, 18, '#FFFFFF', 'sinks', ARRAY['kitchen'], 'Circle', 'Shallow butler sink for prep work 60cm', '1.0.0', false, '{}', '{}'),
('kitchen-sink-draining-board-80', 'Kitchen Sink + Draining Board 80cm', 'sink', 80, 50, 20, '#C0C0C0', 'sinks', ARRAY['kitchen'], 'Circle', 'Kitchen sink with draining board 80cm', '1.0.0', false, '{}', '{}'),
('kitchen-sink-draining-board-100', 'Kitchen Sink + Draining Board 100cm', 'sink', 100, 50, 20, '#C0C0C0', 'sinks', ARRAY['kitchen'], 'Circle', 'Kitchen sink with draining board 100cm', '1.0.0', false, '{}', '{}'),
('butler-sink-draining-board-80', 'Butler Sink + Draining Board 80cm', 'sink', 80, 50, 25, '#FFFFFF', 'sinks', ARRAY['kitchen'], 'Circle', 'Butler sink with draining board 80cm', '1.0.0', false, '{}', '{}'),

-- Counter-tops
('counter-top-60', 'Counter-top 60cm', 'counter-top', 60, 60, 4, '#8B7355', 'counter-tops', ARRAY['kitchen'], 'Square', 'Standard counter-top 60cm', '1.0.0', false, '{}', '{}'),
('counter-top-80', 'Counter-top 80cm', 'counter-top', 80, 60, 4, '#8B7355', 'counter-tops', ARRAY['kitchen'], 'Square', 'Counter-top 80cm', '1.0.0', false, '{}', '{}'),
('counter-top-100', 'Counter-top 100cm', 'counter-top', 100, 60, 4, '#8B7355', 'counter-tops', ARRAY['kitchen'], 'Square', 'Counter-top 100cm', '1.0.0', false, '{}', '{}'),
('counter-top-120', 'Counter-top 120cm', 'counter-top', 120, 60, 4, '#8B7355', 'counter-tops', ARRAY['kitchen'], 'Square', 'Counter-top 120cm', '1.0.0', false, '{}', '{}'),

-- Pan Drawers
('pan-drawers-30', 'Pan Drawers 30cm', 'cabinet', 30, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Narrow 30cm pan drawer unit', '1.0.0', false, '{}', '{}'),
('pan-drawers-40', 'Pan Drawers 40cm', 'cabinet', 40, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Compact 40cm pan drawer unit', '1.0.0', false, '{}', '{}'),
('pan-drawers-50', 'Pan Drawers 50cm', 'cabinet', 50, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Medium 50cm pan drawer unit', '1.0.0', false, '{}', '{}'),
('pan-drawers-60', 'Pan Drawers 60cm', 'cabinet', 60, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Standard 60cm pan drawer unit', '1.0.0', false, '{}', '{}'),
('pan-drawers-80', 'Pan Drawers 80cm', 'cabinet', 80, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Wide 80cm pan drawer unit', '1.0.0', false, '{}', '{}'),
('pan-drawers-100', 'Pan Drawers 100cm', 'cabinet', 100, 60, 90, '#F5F5F5', 'base-cabinets', ARRAY['kitchen'], 'Square', 'Extra wide 100cm pan drawer unit', '1.0.0', false, '{}', '{}'),

-- Finishing
('cornice-60', 'Cornice 60cm', 'cornice', 60, 10, 10, '#FFFFFF', 'finishing', ARRAY['kitchen'], 'Square', 'Decorative cornice 60cm', '1.0.0', false, '{}', '{}'),
('cornice-80', 'Cornice 80cm', 'cornice', 80, 10, 10, '#FFFFFF', 'finishing', ARRAY['kitchen'], 'Square', 'Decorative cornice 80cm', '1.0.0', false, '{}', '{}'),
('cornice-100', 'Cornice 100cm', 'cornice', 100, 10, 10, '#FFFFFF', 'finishing', ARRAY['kitchen'], 'Square', 'Decorative cornice 100cm', '1.0.0', false, '{}', '{}'),
('cornice-120', 'Cornice 120cm', 'cornice', 120, 10, 10, '#FFFFFF', 'finishing', ARRAY['kitchen'], 'Square', 'Decorative cornice 120cm', '1.0.0', false, '{}', '{}'),
('pelmet-60', 'Pelmet 60cm', 'pelmet', 60, 10, 10, '#FFFFFF', 'finishing', ARRAY['kitchen'], 'Square', 'Decorative pelmet 60cm', '1.0.0', false, '{}', '{}'),
('pelmet-80', 'Pelmet 80cm', 'pelmet', 80, 10, 10, '#FFFFFF', 'finishing', ARRAY['kitchen'], 'Square', 'Decorative pelmet 80cm', '1.0.0', false, '{}', '{}'),
('pelmet-100', 'Pelmet 100cm', 'pelmet', 100, 10, 10, '#FFFFFF', 'finishing', ARRAY['kitchen'], 'Square', 'Decorative pelmet 100cm', '1.0.0', false, '{}', '{}'),
('pelmet-120', 'Pelmet 120cm', 'pelmet', 120, 10, 10, '#FFFFFF', 'finishing', ARRAY['kitchen'], 'Square', 'Decorative pelmet 120cm', '1.0.0', false, '{}', '{}'),
('end-panel-base', 'End Panel Base', 'end-panel', 60, 2, 90, '#F5F5F5', 'finishing', ARRAY['kitchen'], 'Square', 'End panel for base units', '1.0.0', false, '{}', '{}'),
('end-panel-wall', 'End Panel Wall', 'end-panel', 40, 2, 60, '#F5F5F5', 'finishing', ARRAY['kitchen'], 'Square', 'End panel for wall units', '1.0.0', false, '{}', '{}'),
('end-panel-tall', 'End Panel Tall', 'end-panel', 60, 2, 200, '#F5F5F5', 'finishing', ARRAY['kitchen'], 'Square', 'End panel for tall units', '1.0.0', false, '{}', '{}')

ON CONFLICT (component_id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  width = EXCLUDED.width,
  depth = EXCLUDED.depth,
  height = EXCLUDED.height,
  color = EXCLUDED.color,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  deprecated = EXCLUDED.deprecated;

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'Successfully populated 78 kitchen components in catalog';
END $$;
