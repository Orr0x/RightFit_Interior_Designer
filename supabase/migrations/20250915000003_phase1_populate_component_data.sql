-- =============================================================================
-- PHASE 1.4: POPULATE COMPONENT DATA
-- Migrate hardcoded COMPONENT_DATA and elevation heights to database
-- =============================================================================

-- Update component behavior properties based on hardcoded COMPONENT_DATA
UPDATE public.components SET
  mount_type = 'floor',
  has_direction = true,
  door_side = 'front',
  default_z_position = 0,
  elevation_height = 85
WHERE type = 'cabinet';

UPDATE public.components SET
  mount_type = 'floor',
  has_direction = true,
  door_side = 'front',
  default_z_position = 0,
  elevation_height = 85
WHERE type = 'base-cabinet';

UPDATE public.components SET
  mount_type = 'wall',
  has_direction = true,
  door_side = 'front',
  default_z_position = 140,
  elevation_height = 70
WHERE type = 'wall-cabinet';

UPDATE public.components SET
  mount_type = 'floor',
  has_direction = true,
  door_side = 'front',
  default_z_position = 0,
  elevation_height = 85
WHERE type = 'appliance';

-- Special case for refrigerators - taller elevation height
UPDATE public.components SET
  elevation_height = 180
WHERE type = 'appliance' AND (
  component_id ILIKE '%refrigerator%' OR 
  component_id ILIKE '%fridge%' OR
  name ILIKE '%refrigerator%' OR
  name ILIKE '%fridge%'
);

UPDATE public.components SET
  mount_type = 'floor',
  has_direction = false,
  door_side = 'front',
  default_z_position = 90,
  elevation_height = 4
WHERE type = 'counter-top';

UPDATE public.components SET
  mount_type = 'floor',
  has_direction = false,
  door_side = 'front',
  default_z_position = 0,
  elevation_height = NULL -- Use actual height
WHERE type = 'end-panel';

UPDATE public.components SET
  mount_type = 'wall',
  has_direction = false,
  door_side = 'front',
  default_z_position = 90,
  elevation_height = NULL -- Use actual height
WHERE type = 'window';

UPDATE public.components SET
  mount_type = 'floor',
  has_direction = true,
  door_side = 'front',
  default_z_position = 0,
  elevation_height = NULL -- Use actual height
WHERE type = 'door';

UPDATE public.components SET
  mount_type = 'floor',
  has_direction = false,
  door_side = 'front',
  default_z_position = 0,
  elevation_height = NULL -- Use actual height
WHERE type = 'flooring';

UPDATE public.components SET
  mount_type = 'floor',
  has_direction = false,
  door_side = 'front',
  default_z_position = 0,
  elevation_height = NULL -- Use actual height
WHERE type = 'toe-kick';

UPDATE public.components SET
  mount_type = 'wall',
  has_direction = false,
  door_side = 'front',
  default_z_position = 200,
  elevation_height = NULL -- Use actual height
WHERE type = 'cornice';

UPDATE public.components SET
  mount_type = 'wall',
  has_direction = false,
  door_side = 'front',
  default_z_position = 140,
  elevation_height = NULL -- Use actual height
WHERE type = 'pelmet';

UPDATE public.components SET
  mount_type = 'wall',
  has_direction = false,
  door_side = 'front',
  default_z_position = 200,
  elevation_height = NULL -- Use actual height
WHERE type = 'wall-unit-end-panel';

-- Special handling for corner components
UPDATE public.components SET
  corner_configuration = jsonb_build_object(
    'is_corner', true,
    'door_width', 30,
    'side_width', 60,
    'corner_type', 'L-shaped'
  )
WHERE component_id ILIKE '%corner%';

-- Special handling for larder/tall components - use actual height in elevation
UPDATE public.components SET
  elevation_height = NULL, -- Use actual height instead of hardcoded
  component_behavior = jsonb_build_object(
    'use_actual_height_in_elevation', true,
    'is_tall_unit', true
  )
WHERE component_id ILIKE '%larder%' OR component_id ILIKE '%tall%';

-- Log the migration results
DO $$ 
DECLARE
    component_count INTEGER;
    corner_count INTEGER;
    tall_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO component_count FROM public.components;
    SELECT COUNT(*) INTO corner_count FROM public.components WHERE corner_configuration != '{}';
    SELECT COUNT(*) INTO tall_count FROM public.components WHERE component_behavior->>'is_tall_unit' = 'true';
    
    RAISE NOTICE 'Phase 1.4 Complete: Updated % components with behavior data', component_count;
    RAISE NOTICE 'Corner components configured: %', corner_count;
    RAISE NOTICE 'Tall/larder components configured: %', tall_count;
END $$;
