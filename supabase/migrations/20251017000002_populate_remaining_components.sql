-- ============================================
-- POPULATE REMAINING COMPONENTS
-- ============================================
-- Purpose: Populate layer info for components that weren't caught by initial patterns
-- Date: 2025-10-17
-- Run this AFTER the main collision detection migration
-- ============================================

-- ============================================
-- UTILITY STORAGE (Base level - 0-90cm)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'base',
  min_height_cm = 0,
  max_height_cm = 90,
  can_overlap_layers = ARRAY['flooring']
WHERE category IN ('utility-storage', 'utility-fixtures')
  AND component_type = 'base-cabinet'
  AND layer_type IS NULL;

-- ============================================
-- UTILITY TALL UNITS (Full height - 0-220cm)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'tall',
  min_height_cm = 0,
  max_height_cm = 220,
  can_overlap_layers = ARRAY['flooring']
WHERE category IN ('utility-storage', 'utility-fixtures')
  AND component_type = 'cabinet'
  AND (component_id LIKE '%tall%' OR component_name LIKE '%Tall%')
  AND layer_type IS NULL;

-- ============================================
-- BATHROOM FIXTURES (Floor level - 0-60cm)
-- ============================================

-- Bathtubs
UPDATE public.component_3d_models SET
  layer_type = 'fixture',
  min_height_cm = 0,
  max_height_cm = 60,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'bathtub'
  AND layer_type IS NULL;

-- Showers
UPDATE public.component_3d_models SET
  layer_type = 'fixture',
  min_height_cm = 0,
  max_height_cm = 220,  -- Shower enclosures go to ceiling
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'shower'
  AND layer_type IS NULL;

-- Bathroom storage (wall-mounted)
UPDATE public.component_3d_models SET
  layer_type = 'wall',
  min_height_cm = 100,
  max_height_cm = 180,
  can_overlap_layers = ARRAY['flooring', 'base', 'fixture']
WHERE category IN ('bathroom-storage')
  AND (component_id LIKE '%mirror%' OR component_id LIKE '%wall%')
  AND layer_type IS NULL;

-- Bathroom storage (floor-standing)
UPDATE public.component_3d_models SET
  layer_type = 'base',
  min_height_cm = 0,
  max_height_cm = 90,
  can_overlap_layers = ARRAY['flooring']
WHERE category IN ('bathroom-storage')
  AND component_type = 'cabinet'
  AND layer_type IS NULL;

-- ============================================
-- BEDROOM FURNITURE (Floor level - various heights)
-- ============================================

-- Beds (floor to mattress height)
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 60,  -- Typical bed height with mattress
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'bed'
  AND layer_type IS NULL;

-- Bedside tables
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 60,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'bedside'
  AND layer_type IS NULL;

-- Wardrobes (full height)
UPDATE public.component_3d_models SET
  layer_type = 'tall',
  min_height_cm = 0,
  max_height_cm = 220,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'wardrobe'
  AND layer_type IS NULL;

-- Dressing tables
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 80,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'dressing-table'
  AND layer_type IS NULL;

-- Chests of drawers
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 120,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'chest'
  AND layer_type IS NULL;

-- ============================================
-- OFFICE FURNITURE (Floor level)
-- ============================================

-- Desks
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 75,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'desk'
  AND layer_type IS NULL;

-- Office storage (cabinets, filing, bookshelves)
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 200,
  can_overlap_layers = ARRAY['flooring']
WHERE category IN ('office-storage', 'office-furniture')
  AND component_type IN ('cabinet', 'bookshelf')
  AND layer_type IS NULL;

-- Small office items (pedestals)
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 60,
  can_overlap_layers = ARRAY['flooring', 'furniture']  -- Can go under desks
WHERE category = 'office-storage'
  AND component_id LIKE '%pedestal%'
  AND layer_type IS NULL;

-- ============================================
-- LIVING ROOM FURNITURE
-- ============================================

-- Sofas, armchairs
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 90,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type IN ('sofa', 'armchair', 'chair')
  AND category LIKE '%living-room%'
  AND layer_type IS NULL;

-- Coffee tables, side tables
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 50,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type IN ('table', 'coffee-table')
  AND category LIKE '%living-room%'
  AND layer_type IS NULL;

-- TV units, media cabinets
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 60,
  can_overlap_layers = ARRAY['flooring']
WHERE (component_id LIKE '%tv%' OR component_id LIKE '%media%')
  AND layer_type IS NULL;

-- Display cabinets, bookshelves (tall)
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 200,
  can_overlap_layers = ARRAY['flooring']
WHERE category LIKE '%living-room%'
  AND component_type IN ('bookshelf', 'cabinet')
  AND layer_type IS NULL;

-- ============================================
-- DINING ROOM FURNITURE
-- ============================================

-- Dining tables
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 75,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'table'
  AND category LIKE '%dining%'
  AND layer_type IS NULL;

-- Dining chairs, benches
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 90,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type IN ('chair', 'seating')
  AND category LIKE '%dining%'
  AND layer_type IS NULL;

-- Dining room storage (sideboards, china cabinets)
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 200,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'cabinet'
  AND category LIKE '%dining%'
  AND layer_type IS NULL;

-- ============================================
-- DRESSING ROOM STORAGE
-- ============================================

-- Island units (like kitchen islands)
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 90,
  can_overlap_layers = ARRAY['flooring']
WHERE component_id LIKE '%island%'
  AND layer_type IS NULL;

-- Shoe cabinets, jewelry armoires (various heights)
UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 150,
  can_overlap_layers = ARRAY['flooring']
WHERE category = 'dressing-room-storage'
  AND layer_type IS NULL;

-- ============================================
-- DOORS & WINDOWS (Wall-mounted)
-- ============================================

-- Doors (full height)
UPDATE public.component_3d_models SET
  layer_type = 'architectural',
  min_height_cm = 0,
  max_height_cm = 220,
  can_overlap_layers = ARRAY['flooring', 'base', 'furniture', 'worktop']
WHERE component_type = 'door'
  AND layer_type IS NULL;

-- Windows (wall-mounted, mid-height)
UPDATE public.component_3d_models SET
  layer_type = 'architectural',
  min_height_cm = 90,
  max_height_cm = 210,
  can_overlap_layers = ARRAY['flooring', 'base', 'furniture', 'worktop', 'wall']
WHERE component_type = 'window'
  AND layer_type IS NULL;

-- ============================================
-- BEDROOM SEATING (Ottomans, benches)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'furniture',
  min_height_cm = 0,
  max_height_cm = 50,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'seating'
  AND category LIKE '%bedroom%'
  AND layer_type IS NULL;

-- ============================================
-- DRAWER UNITS (Base level - like base cabinets)
-- ============================================

UPDATE public.component_3d_models SET
  layer_type = 'base',
  min_height_cm = 0,
  max_height_cm = 90,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'drawer-unit'
  AND category = 'cabinets'
  AND layer_type IS NULL;

-- ============================================
-- CATCH-ALL FOR REMAINING CABINETS
-- ============================================

-- Any remaining cabinets without category - default to base
UPDATE public.component_3d_models SET
  layer_type = 'base',
  min_height_cm = 0,
  max_height_cm = 90,
  can_overlap_layers = ARRAY['flooring']
WHERE component_type IN ('cabinet', 'base-cabinet')
  AND layer_type IS NULL;

-- ============================================
-- VERIFICATION - Check remaining NULL
-- ============================================

SELECT
  component_id,
  component_name,
  component_type,
  category,
  layer_type
FROM public.component_3d_models
WHERE layer_type IS NULL
ORDER BY component_type, component_id
LIMIT 50;

-- ============================================
-- SUMMARY BY LAYER TYPE
-- ============================================

SELECT
  layer_type,
  COUNT(*) as count,
  string_agg(DISTINCT component_type, ', ') as component_types
FROM public.component_3d_models
WHERE layer_type IS NOT NULL
GROUP BY layer_type
ORDER BY
  CASE layer_type
    WHEN 'flooring' THEN 1
    WHEN 'base' THEN 2
    WHEN 'fixture' THEN 3
    WHEN 'furniture' THEN 4
    WHEN 'appliance' THEN 5
    WHEN 'sink' THEN 6
    WHEN 'worktop' THEN 7
    WHEN 'pelmet' THEN 8
    WHEN 'wall' THEN 9
    WHEN 'cornice' THEN 10
    WHEN 'tall' THEN 11
    WHEN 'architectural' THEN 12
    WHEN 'finishing' THEN 13
    ELSE 99
  END;
