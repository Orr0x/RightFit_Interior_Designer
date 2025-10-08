-- ================================================================
-- Week 39: Populate Components Catalog - All Rooms (UI Component Selector)
-- ================================================================
-- Purpose: Populate components table with bedroom, bathroom, living room,
--          office, dressing room, dining room, utility, and universal components
-- ================================================================

INSERT INTO public.components (
  component_id, name, type, width, depth, height, color, category, room_types, icon_name, description, version, deprecated, metadata, tags
) VALUES

-- ================================================================
-- BEDROOM COMPONENTS
-- ================================================================

-- Bedroom Storage
('wardrobe-2door-100', 'Wardrobe 2-Door 100cm', 'cabinet', 100, 60, 200, '#8B4513', 'bedroom-storage', ARRAY['bedroom'], 'Square', 'Two door wardrobe 100cm', '1.0.0', false, '{}', '{}'),
('wardrobe-3door-150', 'Wardrobe 3-Door 150cm', 'cabinet', 150, 60, 200, '#8B4513', 'bedroom-storage', ARRAY['bedroom'], 'Square', 'Three door wardrobe 150cm', '1.0.0', false, '{}', '{}'),
('wardrobe-4door-200', 'Wardrobe 4-Door 200cm', 'cabinet', 200, 60, 200, '#8B4513', 'bedroom-storage', ARRAY['bedroom'], 'Square', 'Four door wardrobe 200cm', '1.0.0', false, '{}', '{}'),
('wardrobe-sliding-180', 'Wardrobe Sliding 180cm', 'cabinet', 180, 60, 200, '#8B4513', 'bedroom-storage', ARRAY['bedroom'], 'Square', 'Sliding door wardrobe 180cm', '1.0.0', false, '{}', '{}'),
('chest-drawers-80', 'Chest of Drawers 80cm', 'cabinet', 80, 50, 100, '#8B4513', 'bedroom-storage', ARRAY['bedroom'], 'Square', 'Four drawer chest 80cm', '1.0.0', false, '{}', '{}'),
('chest-drawers-100', 'Chest of Drawers 100cm', 'cabinet', 100, 50, 100, '#8B4513', 'bedroom-storage', ARRAY['bedroom'], 'Square', 'Four drawer chest 100cm', '1.0.0', false, '{}', '{}'),
('tallboy-50', 'Tallboy 50cm', 'cabinet', 50, 50, 120, '#8B4513', 'bedroom-storage', ARRAY['bedroom'], 'Square', 'Narrow 6-drawer tallboy', '1.0.0', false, '{}', '{}'),
('bedside-table-40', 'Bedside Table 40cm', 'cabinet', 40, 40, 50, '#8B4513', 'bedroom-storage', ARRAY['bedroom'], 'Square', 'Compact bedside table', '1.0.0', false, '{}', '{}'),
('bedside-table-50', 'Bedside Table 50cm', 'cabinet', 50, 50, 50, '#8B4513', 'bedroom-storage', ARRAY['bedroom'], 'Square', 'Standard bedside table', '1.0.0', false, '{}', '{}'),
('dressing-table-120', 'Dressing Table 120cm', 'cabinet', 120, 50, 75, '#8B4513', 'bedroom-storage', ARRAY['bedroom'], 'Square', 'Dressing table with mirror', '1.0.0', false, '{}', '{}'),

-- Bedroom Furniture
('single-bed-90', 'Single Bed 90cm', 'bed', 90, 200, 50, '#8B4513', 'bedroom-furniture', ARRAY['bedroom'], 'Square', 'Single bed 90cm wide', '1.0.0', false, '{}', '{}'),
('double-bed-140', 'Double Bed 140cm', 'bed', 140, 200, 50, '#8B4513', 'bedroom-furniture', ARRAY['bedroom'], 'Square', 'Double bed 140cm wide', '1.0.0', false, '{}', '{}'),
('king-bed-150', 'King Bed 150cm', 'bed', 150, 200, 50, '#8B4513', 'bedroom-furniture', ARRAY['bedroom'], 'Square', 'King bed 150cm wide', '1.0.0', false, '{}', '{}'),
('superking-bed-180', 'Super King Bed 180cm', 'bed', 180, 200, 50, '#8B4513', 'bedroom-furniture', ARRAY['bedroom'], 'Square', 'Super king bed 180cm wide', '1.0.0', false, '{}', '{}'),
('ottoman-60', 'Ottoman 60cm', 'seating', 60, 60, 45, '#6B8E23', 'bedroom-furniture', ARRAY['bedroom'], 'Circle', 'Upholstered ottoman', '1.0.0', false, '{}', '{}'),
('ottoman-storage-80', 'Ottoman Storage 80cm', 'seating', 80, 60, 50, '#6B8E23', 'bedroom-furniture', ARRAY['bedroom'], 'Circle', 'Storage ottoman', '1.0.0', false, '{}', '{}'),
('reading-chair-70', 'Reading Chair 70cm', 'seating', 70, 70, 90, '#8B4513', 'bedroom-furniture', ARRAY['bedroom'], 'Circle', 'Comfortable reading chair', '1.0.0', false, '{}', '{}'),
('bedroom-bench-120', 'Bedroom Bench 120cm', 'seating', 120, 40, 45, '#6B8E23', 'bedroom-furniture', ARRAY['bedroom'], 'Square', 'End of bed bench', '1.0.0', false, '{}', '{}'),

-- ================================================================
-- BATHROOM COMPONENTS
-- ================================================================
('vanity-60', 'Vanity 60cm', 'cabinet', 60, 50, 85, '#F5F5DC', 'bathroom-vanities', ARRAY['bathroom'], 'Square', 'Bathroom vanity 60cm', '1.0.0', false, '{}', '{}'),
('vanity-80', 'Vanity 80cm', 'cabinet', 80, 50, 85, '#F5F5DC', 'bathroom-vanities', ARRAY['bathroom'], 'Square', 'Bathroom vanity 80cm', '1.0.0', false, '{}', '{}'),
('vanity-100', 'Vanity 100cm', 'cabinet', 100, 50, 85, '#F5F5DC', 'bathroom-vanities', ARRAY['bathroom'], 'Square', 'Bathroom vanity 100cm', '1.0.0', false, '{}', '{}'),
('vanity-double-120', 'Vanity Double 120cm', 'cabinet', 120, 50, 85, '#F5F5DC', 'bathroom-vanities', ARRAY['bathroom'], 'Square', 'Double basin vanity 120cm', '1.0.0', false, '{}', '{}'),
('vanity-floating-80', 'Vanity Floating 80cm', 'cabinet', 80, 50, 50, '#F5F5DC', 'bathroom-vanities', ARRAY['bathroom'], 'Square', 'Wall-mounted floating vanity', '1.0.0', false, '{}', '{}'),
('toilet-standard', 'Toilet Standard', 'toilet', 40, 65, 75, '#FFFFFF', 'bathroom-fixtures', ARRAY['bathroom'], 'Circle', 'Standard toilet', '1.0.0', false, '{}', '{}'),
('bathtub-170', 'Bathtub 170cm', 'bathtub', 170, 75, 55, '#FFFFFF', 'bathroom-fixtures', ARRAY['bathroom'], 'Square', 'Standard bathtub', '1.0.0', false, '{}', '{}'),
('shower-tray-90', 'Shower Tray 90cm', 'shower', 90, 90, 10, '#FFFFFF', 'bathroom-fixtures', ARRAY['bathroom'], 'Square', 'Square shower tray', '1.0.0', false, '{}', '{}'),
('shower-enclosure-90', 'Shower Enclosure 90cm', 'shower', 90, 90, 200, '#E6E6FA', 'bathroom-fixtures', ARRAY['bathroom'], 'Square', 'Glass shower enclosure', '1.0.0', false, '{}', '{}'),
('bathroom-cabinet-40', 'Bathroom Cabinet 40cm', 'cabinet', 40, 30, 60, '#F5F5DC', 'bathroom-storage', ARRAY['bathroom'], 'Square', 'Wall-mounted bathroom cabinet', '1.0.0', false, '{}', '{}'),
('linen-cupboard-60', 'Linen Cupboard 60cm', 'cabinet', 60, 40, 180, '#F5F5DC', 'bathroom-storage', ARRAY['bathroom'], 'Square', 'Tall linen storage cupboard', '1.0.0', false, '{}', '{}'),
('mirror-cabinet-70', 'Mirror Cabinet 70cm', 'cabinet', 70, 15, 80, '#C0C0C0', 'bathroom-storage', ARRAY['bathroom'], 'Square', 'Mirror-fronted bathroom cabinet', '1.0.0', false, '{}', '{}'),

-- ================================================================
-- LIVING ROOM COMPONENTS
-- ================================================================
('sofa-2seater-140', 'Sofa 2-Seater 140cm', 'sofa', 140, 90, 80, '#3A6EA5', 'living-room-furniture', ARRAY['living-room'], 'Square', 'Two-seater sofa', '1.0.0', false, '{}', '{}'),
('sofa-3seater-200', 'Sofa 3-Seater 200cm', 'sofa', 200, 90, 80, '#3A6EA5', 'living-room-furniture', ARRAY['living-room'], 'Square', 'Three-seater sofa', '1.0.0', false, '{}', '{}'),
('armchair-80', 'Armchair 80cm', 'seating', 80, 85, 90, '#3A6EA5', 'living-room-furniture', ARRAY['living-room'], 'Circle', 'Single armchair', '1.0.0', false, '{}', '{}'),
('loveseat-120', 'Loveseat 120cm', 'sofa', 120, 85, 80, '#3A6EA5', 'living-room-furniture', ARRAY['living-room'], 'Square', 'Compact loveseat', '1.0.0', false, '{}', '{}'),
('tv-unit-120', 'TV Unit 120cm', 'cabinet', 120, 45, 50, '#2F4F4F', 'living-room-storage', ARRAY['living-room'], 'Square', 'TV cabinet 120cm', '1.0.0', false, '{}', '{}'),
('tv-unit-160', 'TV Unit 160cm', 'cabinet', 160, 45, 50, '#2F4F4F', 'living-room-storage', ARRAY['living-room'], 'Square', 'TV cabinet 160cm', '1.0.0', false, '{}', '{}'),
('media-cabinet-80', 'Media Cabinet 80cm', 'cabinet', 80, 45, 80, '#2F4F4F', 'living-room-storage', ARRAY['living-room'], 'Square', 'Media storage cabinet', '1.0.0', false, '{}', '{}'),
('bookshelf-80', 'Bookshelf 80cm', 'cabinet', 80, 35, 180, '#8B4513', 'living-room-storage', ARRAY['living-room'], 'Square', 'Tall bookshelf 80cm', '1.0.0', false, '{}', '{}'),
('bookshelf-100', 'Bookshelf 100cm', 'cabinet', 100, 35, 200, '#8B4513', 'living-room-storage', ARRAY['living-room'], 'Square', 'Tall bookshelf 100cm', '1.0.0', false, '{}', '{}'),
('display-cabinet-90', 'Display Cabinet 90cm', 'cabinet', 90, 40, 180, '#8B4513', 'living-room-storage', ARRAY['living-room'], 'Square', 'Glass-front display cabinet', '1.0.0', false, '{}', '{}'),
('sideboard-180', 'Sideboard 180cm', 'cabinet', 180, 45, 80, '#8B4513', 'living-room-storage', ARRAY['living-room'], 'Square', 'Long sideboard cabinet', '1.0.0', false, '{}', '{}'),

-- ================================================================
-- OFFICE COMPONENTS
-- ================================================================
('desk-120', 'Desk 120cm', 'desk', 120, 70, 75, '#8B4513', 'office-furniture', ARRAY['office'], 'Square', 'Office desk 120cm', '1.0.0', false, '{}', '{}'),
('desk-140', 'Desk 140cm', 'desk', 140, 70, 75, '#8B4513', 'office-furniture', ARRAY['office'], 'Square', 'Office desk 140cm', '1.0.0', false, '{}', '{}'),
('desk-160', 'Desk 160cm', 'desk', 160, 70, 75, '#8B4513', 'office-furniture', ARRAY['office'], 'Square', 'Office desk 160cm', '1.0.0', false, '{}', '{}'),
('desk-lshaped-160', 'L-Shaped Desk 160x120cm', 'desk', 160, 120, 75, '#8B4513', 'office-furniture', ARRAY['office'], 'Square', 'L-shaped executive desk', '1.0.0', false, '{}', '{}'),
('desk-corner-120', 'Corner Desk 120cm', 'desk', 120, 120, 75, '#8B4513', 'office-furniture', ARRAY['office'], 'Square', 'Corner desk with angled front', '1.0.0', false, '{}', '{}'),
('office-chair-executive', 'Office Chair Executive', 'seating', 65, 65, 120, '#000000', 'office-furniture', ARRAY['office'], 'Circle', 'Executive office chair', '1.0.0', false, '{}', '{}'),
('office-chair-task', 'Office Chair Task', 'seating', 55, 55, 95, '#000000', 'office-furniture', ARRAY['office'], 'Circle', 'Task office chair', '1.0.0', false, '{}', '{}'),
('visitor-chair', 'Visitor Chair', 'seating', 55, 55, 85, '#4B4B4B', 'office-furniture', ARRAY['office'], 'Circle', 'Visitor/guest chair', '1.0.0', false, '{}', '{}'),
('filing-cabinet-2drawer', 'Filing Cabinet 2-Drawer', 'cabinet', 45, 60, 70, '#808080', 'office-storage', ARRAY['office'], 'Square', 'Two-drawer filing cabinet', '1.0.0', false, '{}', '{}'),
('filing-cabinet-3drawer', 'Filing Cabinet 3-Drawer', 'cabinet', 45, 60, 105, '#808080', 'office-storage', ARRAY['office'], 'Square', 'Three-drawer filing cabinet', '1.0.0', false, '{}', '{}'),
('pedestal-3drawer', 'Pedestal 3-Drawer', 'cabinet', 40, 50, 60, '#F5F5F5', 'office-storage', ARRAY['office'], 'Square', 'Under-desk pedestal with 3 drawers', '1.0.0', false, '{}', '{}'),
('bookshelf-office-80', 'Bookshelf Office 80cm', 'cabinet', 80, 35, 180, '#8B4513', 'office-storage', ARRAY['office'], 'Square', 'Office bookshelf 80cm', '1.0.0', false, '{}', '{}'),
('bookshelf-office-100', 'Bookshelf Office 100cm', 'cabinet', 100, 35, 200, '#8B4513', 'office-storage', ARRAY['office'], 'Square', 'Office bookshelf 100cm', '1.0.0', false, '{}', '{}'),
('storage-cabinet-80', 'Storage Cabinet 80cm', 'cabinet', 80, 45, 180, '#F5F5F5', 'office-storage', ARRAY['office'], 'Square', 'Tall office storage cabinet', '1.0.0', false, '{}', '{}'),

-- ================================================================
-- DRESSING ROOM COMPONENTS
-- ================================================================
('vanity-table-100', 'Vanity Table 100cm', 'cabinet', 100, 50, 75, '#F5F5DC', 'dressing-room-furniture', ARRAY['dressing-room'], 'Square', 'Dressing table with storage', '1.0.0', false, '{}', '{}'),
('vanity-table-120', 'Vanity Table 120cm', 'cabinet', 120, 50, 75, '#F5F5DC', 'dressing-room-furniture', ARRAY['dressing-room'], 'Square', 'Large dressing table', '1.0.0', false, '{}', '{}'),
('dressing-stool', 'Dressing Stool', 'seating', 40, 35, 45, '#8B7355', 'dressing-room-furniture', ARRAY['dressing-room'], 'Circle', 'Compact dressing stool', '1.0.0', false, '{}', '{}'),
('dressing-chair', 'Dressing Chair', 'seating', 50, 50, 85, '#8B7355', 'dressing-room-furniture', ARRAY['dressing-room'], 'Circle', 'Upholstered dressing chair', '1.0.0', false, '{}', '{}'),
('island-unit-80', 'Island Unit 80cm', 'cabinet', 80, 50, 90, '#F5F5DC', 'dressing-room-storage', ARRAY['dressing-room'], 'Square', 'Freestanding island storage unit', '1.0.0', false, '{}', '{}'),
('island-unit-100', 'Island Unit 100cm', 'cabinet', 100, 60, 90, '#F5F5DC', 'dressing-room-storage', ARRAY['dressing-room'], 'Square', 'Large freestanding island unit', '1.0.0', false, '{}', '{}'),
('island-unit-120', 'Island Unit 120cm', 'cabinet', 120, 60, 90, '#F5F5DC', 'dressing-room-storage', ARRAY['dressing-room'], 'Square', 'Extra large island unit', '1.0.0', false, '{}', '{}'),
('jewelry-armoire-50', 'Jewelry Armoire 50cm', 'cabinet', 50, 40, 140, '#DEB887', 'dressing-room-storage', ARRAY['dressing-room'], 'Square', 'Tall jewelry storage cabinet', '1.0.0', false, '{}', '{}'),
('tie-rack-30', 'Tie Rack Unit 30cm', 'cabinet', 30, 15, 100, '#F5F5DC', 'dressing-room-storage', ARRAY['dressing-room'], 'Square', 'Narrow tie and accessory rack', '1.0.0', false, '{}', '{}'),
('shoe-cabinet-80', 'Shoe Cabinet 80cm', 'cabinet', 80, 35, 100, '#F5F5DC', 'dressing-room-storage', ARRAY['dressing-room'], 'Square', 'Shoe storage cabinet', '1.0.0', false, '{}', '{}'),
('shoe-cabinet-100', 'Shoe Cabinet 100cm', 'cabinet', 100, 35, 100, '#F5F5DC', 'dressing-room-storage', ARRAY['dressing-room'], 'Square', 'Large shoe storage cabinet', '1.0.0', false, '{}', '{}'),
('mirror-full-60', 'Full-Length Mirror 60cm', 'mirror', 60, 5, 180, '#E8E8E8', 'dressing-room-furniture', ARRAY['dressing-room'], 'Square', 'Freestanding full-length mirror', '1.0.0', false, '{}', '{}'),
('mirror-trifold-80', 'Tri-Fold Mirror 80cm', 'mirror', 80, 5, 60, '#E8E8E8', 'dressing-room-furniture', ARRAY['dressing-room'], 'Square', 'Three-panel dressing table mirror', '1.0.0', false, '{}', '{}'),

-- ================================================================
-- DINING ROOM COMPONENTS
-- ================================================================
('dining-table-120', 'Dining Table 120x80cm', 'table', 120, 80, 75, '#8B4513', 'dining-room-furniture', ARRAY['dining-room'], 'Square', 'Rectangular dining table for 4', '1.0.0', false, '{}', '{}'),
('dining-table-160', 'Dining Table 160x90cm', 'table', 160, 90, 75, '#8B4513', 'dining-room-furniture', ARRAY['dining-room'], 'Square', 'Rectangular dining table for 6', '1.0.0', false, '{}', '{}'),
('dining-table-180', 'Dining Table 180x90cm', 'table', 180, 90, 75, '#8B4513', 'dining-room-furniture', ARRAY['dining-room'], 'Square', 'Large rectangular dining table for 6-8', '1.0.0', false, '{}', '{}'),
('dining-table-round-110', 'Dining Table Round 110cm', 'table', 110, 110, 75, '#8B4513', 'dining-room-furniture', ARRAY['dining-room'], 'Circle', 'Round dining table for 4', '1.0.0', false, '{}', '{}'),
('dining-table-round-120', 'Dining Table Round 120cm', 'table', 120, 120, 75, '#8B4513', 'dining-room-furniture', ARRAY['dining-room'], 'Circle', 'Round dining table for 6', '1.0.0', false, '{}', '{}'),
('dining-table-extendable-160', 'Dining Table Extendable 160cm', 'table', 160, 90, 75, '#8B4513', 'dining-room-furniture', ARRAY['dining-room'], 'Square', 'Extendable dining table 160-200cm', '1.0.0', false, '{}', '{}'),
('dining-chair-standard', 'Dining Chair Standard', 'seating', 45, 50, 90, '#8B4513', 'dining-room-furniture', ARRAY['dining-room'], 'Circle', 'Standard dining chair', '1.0.0', false, '{}', '{}'),
('dining-chair-upholstered', 'Dining Chair Upholstered', 'seating', 50, 55, 95, '#4B4B4B', 'dining-room-furniture', ARRAY['dining-room'], 'Circle', 'Upholstered dining chair', '1.0.0', false, '{}', '{}'),
('dining-bench-120', 'Dining Bench 120cm', 'seating', 120, 40, 45, '#8B4513', 'dining-room-furniture', ARRAY['dining-room'], 'Square', 'Dining bench 120cm', '1.0.0', false, '{}', '{}'),
('dining-bench-140', 'Dining Bench 140cm', 'seating', 140, 40, 45, '#8B4513', 'dining-room-furniture', ARRAY['dining-room'], 'Square', 'Dining bench 140cm', '1.0.0', false, '{}', '{}'),
('sideboard-dining-140', 'Sideboard 140cm', 'cabinet', 140, 45, 85, '#8B4513', 'dining-room-storage', ARRAY['dining-room'], 'Square', 'Dining room sideboard 140cm', '1.0.0', false, '{}', '{}'),
('sideboard-dining-160', 'Sideboard 160cm', 'cabinet', 160, 45, 85, '#8B4513', 'dining-room-storage', ARRAY['dining-room'], 'Square', 'Dining room sideboard 160cm', '1.0.0', false, '{}', '{}'),
('display-cabinet-dining-100', 'Display Cabinet 100cm', 'cabinet', 100, 45, 190, '#8B4513', 'dining-room-storage', ARRAY['dining-room'], 'Square', 'Tall glass-front display cabinet', '1.0.0', false, '{}', '{}'),
('china-cabinet-90', 'China Cabinet 90cm', 'cabinet', 90, 45, 200, '#8B4513', 'dining-room-storage', ARRAY['dining-room'], 'Square', 'Traditional china display cabinet', '1.0.0', false, '{}', '{}'),
('drinks-cabinet-80', 'Drinks Cabinet 80cm', 'cabinet', 80, 45, 120, '#2F4F4F', 'dining-room-storage', ARRAY['dining-room'], 'Square', 'Bar/drinks storage cabinet', '1.0.0', false, '{}', '{}'),

-- ================================================================
-- UTILITY ROOM COMPONENTS
-- ================================================================
('washing-machine-60', 'Washing Machine 60cm', 'appliance', 60, 60, 85, '#FFFFFF', 'utility-appliances', ARRAY['utility'], 'Square', 'Freestanding washing machine', '1.0.0', false, '{}', '{}'),
('washer-dryer-60', 'Washer-Dryer 60cm', 'appliance', 60, 60, 85, '#FFFFFF', 'utility-appliances', ARRAY['utility'], 'Square', 'Combo washer-dryer unit', '1.0.0', false, '{}', '{}'),
('tumble-dryer-60', 'Tumble Dryer 60cm', 'appliance', 60, 60, 85, '#FFFFFF', 'utility-appliances', ARRAY['utility'], 'Square', 'Freestanding tumble dryer', '1.0.0', false, '{}', '{}'),
('freezer-upright-60', 'Freezer Upright 60cm', 'appliance', 60, 60, 185, '#FFFFFF', 'utility-appliances', ARRAY['utility'], 'Square', 'Tall upright freezer', '1.0.0', false, '{}', '{}'),
('freezer-chest-90', 'Freezer Chest 90cm', 'appliance', 90, 60, 85, '#FFFFFF', 'utility-appliances', ARRAY['utility'], 'Square', 'Chest freezer', '1.0.0', false, '{}', '{}'),
('utility-sink-single-60', 'Utility Sink Single 60cm', 'sink', 60, 60, 90, '#D3D3D3', 'utility-fixtures', ARRAY['utility'], 'Circle', 'Single utility sink with cabinet', '1.0.0', false, '{}', '{}'),
('utility-sink-double-100', 'Utility Sink Double 100cm', 'sink', 100, 60, 90, '#D3D3D3', 'utility-fixtures', ARRAY['utility'], 'Circle', 'Double basin utility sink', '1.0.0', false, '{}', '{}'),
('utility-worktop-80', 'Worktop 80cm', 'counter-top', 80, 60, 90, '#8B7355', 'utility-fixtures', ARRAY['utility'], 'Square', 'Utility worktop with storage', '1.0.0', false, '{}', '{}'),
('utility-worktop-100', 'Worktop 100cm', 'counter-top', 100, 60, 90, '#8B7355', 'utility-fixtures', ARRAY['utility'], 'Square', 'Utility worktop 100cm', '1.0.0', false, '{}', '{}'),
('utility-worktop-120', 'Worktop 120cm', 'counter-top', 120, 60, 90, '#8B7355', 'utility-fixtures', ARRAY['utility'], 'Square', 'Utility worktop 120cm', '1.0.0', false, '{}', '{}'),
('broom-cupboard-60', 'Broom Cupboard 60cm', 'cabinet', 60, 40, 200, '#F5F5F5', 'utility-storage', ARRAY['utility'], 'Square', 'Tall broom storage cupboard', '1.0.0', false, '{}', '{}'),
('utility-tall-60', 'Tall Storage 60cm', 'cabinet', 60, 60, 200, '#F5F5F5', 'utility-storage', ARRAY['utility'], 'Square', 'Tall utility storage cabinet', '1.0.0', false, '{}', '{}'),
('utility-tall-80', 'Tall Storage 80cm', 'cabinet', 80, 60, 200, '#F5F5F5', 'utility-storage', ARRAY['utility'], 'Square', 'Tall utility storage cabinet', '1.0.0', false, '{}', '{}'),
('utility-wall-60', 'Wall Cabinet Utility 60cm', 'cabinet', 60, 40, 60, '#F5F5F5', 'utility-storage', ARRAY['utility'], 'Square', 'Utility wall cabinet 60cm', '1.0.0', false, '{}', '{}'),
('utility-wall-80', 'Wall Cabinet Utility 80cm', 'cabinet', 80, 40, 60, '#F5F5F5', 'utility-storage', ARRAY['utility'], 'Square', 'Utility wall cabinet 80cm', '1.0.0', false, '{}', '{}'),
('utility-base-60', 'Base Cabinet Utility 60cm', 'cabinet', 60, 60, 90, '#F5F5F5', 'utility-storage', ARRAY['utility'], 'Square', 'Utility base cabinet 60cm', '1.0.0', false, '{}', '{}'),
('utility-base-80', 'Base Cabinet Utility 80cm', 'cabinet', 80, 60, 90, '#F5F5F5', 'utility-storage', ARRAY['utility'], 'Square', 'Utility base cabinet 80cm', '1.0.0', false, '{}', '{}'),

-- ================================================================
-- UNIVERSAL COMPONENTS (Doors & Windows)
-- ================================================================
('door-single-70', 'Single Door 70cm', 'door', 70, 5, 200, '#FFFFFF', 'doors-internal', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Internal single door 70cm', '1.0.0', false, '{}', '{}'),
('door-single-80', 'Single Door 80cm', 'door', 80, 5, 200, '#FFFFFF', 'doors-internal', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Internal single door 80cm', '1.0.0', false, '{}', '{}'),
('door-single-90', 'Single Door 90cm', 'door', 90, 5, 200, '#FFFFFF', 'doors-internal', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Internal single door 90cm', '1.0.0', false, '{}', '{}'),
('door-double-120', 'Double Door 120cm', 'door', 120, 5, 200, '#FFFFFF', 'doors-internal', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Internal double door 120cm', '1.0.0', false, '{}', '{}'),
('door-double-140', 'Double Door 140cm', 'door', 140, 5, 200, '#FFFFFF', 'doors-internal', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Internal double door 140cm', '1.0.0', false, '{}', '{}'),
('door-sliding-single-80', 'Sliding Door Single 80cm', 'door', 80, 5, 200, '#FFFFFF', 'doors-internal', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Single sliding door', '1.0.0', false, '{}', '{}'),
('door-sliding-double-160', 'Sliding Door Double 160cm', 'door', 160, 5, 200, '#FFFFFF', 'doors-internal', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Double sliding door', '1.0.0', false, '{}', '{}'),
('door-bifold-80', 'Bi-Fold Door 80cm', 'door', 80, 5, 200, '#FFFFFF', 'doors-internal', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Bi-fold door', '1.0.0', false, '{}', '{}'),
('door-front-90', 'Front Door 90cm', 'door', 90, 8, 210, '#8B4513', 'doors-external', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'External front door', '1.0.0', false, '{}', '{}'),
('door-french-180', 'French Doors 180cm', 'door', 180, 8, 210, '#FFFFFF', 'doors-external', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'French doors with glass', '1.0.0', false, '{}', '{}'),
('door-patio-single-90', 'Patio Door Single 90cm', 'door', 90, 8, 210, '#E6E6FA', 'doors-external', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Single patio sliding door', '1.0.0', false, '{}', '{}'),
('door-patio-double-180', 'Patio Door Double 180cm', 'door', 180, 8, 210, '#E6E6FA', 'doors-external', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Double patio sliding door', '1.0.0', false, '{}', '{}'),
('window-single-60', 'Window Single 60cm', 'window', 60, 12, 120, '#E6E6FA', 'windows', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Single pane window 60cm', '1.0.0', false, '{}', '{}'),
('window-single-80', 'Window Single 80cm', 'window', 80, 12, 120, '#E6E6FA', 'windows', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Single pane window 80cm', '1.0.0', false, '{}', '{}'),
('window-single-100', 'Window Single 100cm', 'window', 100, 12, 120, '#E6E6FA', 'windows', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Single pane window 100cm', '1.0.0', false, '{}', '{}'),
('window-double-120', 'Window Double 120cm', 'window', 120, 12, 120, '#E6E6FA', 'windows', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Double pane window 120cm', '1.0.0', false, '{}', '{}'),
('window-double-150', 'Window Double 150cm', 'window', 150, 12, 140, '#E6E6FA', 'windows', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Double pane window 150cm', '1.0.0', false, '{}', '{}'),
('window-bay-240', 'Window Bay 240cm', 'window', 240, 60, 150, '#E6E6FA', 'windows', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Bay window with angled sides', '1.0.0', false, '{}', '{}'),
('skylight-80x120', 'Skylight 80x120cm', 'window', 80, 120, 10, '#E6E6FA', 'windows', ARRAY['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'office', 'utility'], 'Square', 'Roof skylight window', '1.0.0', false, '{}', '{}')

ON CONFLICT (component_id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  width = EXCLUDED.width,
  depth = EXCLUDED.depth,
  height = EXCLUDED.height,
  color = EXCLUDED.color,
  category = EXCLUDED.category,
  room_types = EXCLUDED.room_types,
  description = EXCLUDED.description,
  deprecated = EXCLUDED.deprecated;

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'Successfully populated 112 non-kitchen components in catalog (bedroom, bathroom, living room, office, dressing room, dining room, utility, doors, windows)';
END $$;
