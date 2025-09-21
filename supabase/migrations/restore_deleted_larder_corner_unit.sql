-- RESTORE THE DELETED LARDER-CORNER-UNIT
-- This component was accidentally deleted by the larder cleanup script

-- ==========================================
-- STEP 1: CHECK IF COMPONENT EXISTS
-- ==========================================

-- Check if larder-corner-unit still exists
SELECT 
    'LARDER CORNER UNIT CHECK' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.components WHERE component_id = 'larder-corner-unit') 
        THEN '✅ COMPONENT EXISTS'
        ELSE '❌ COMPONENT MISSING - NEEDS RESTORATION'
    END as component_status;

-- ==========================================
-- STEP 2: RESTORE THE DELETED COMPONENT
-- ==========================================

-- Insert the larder-corner-unit back into the database
INSERT INTO public.components (
    component_id, 
    name, 
    type, 
    width, 
    depth, 
    height, 
    color, 
    category, 
    room_types, 
    icon_name, 
    description, 
    version, 
    deprecated, 
    metadata, 
    tags,
    mount_type,
    has_direction,
    door_side,
    default_z_position,
    elevation_height,
    corner_configuration,
    component_behavior,
    created_at,
    updated_at
) VALUES (
    'larder-corner-unit',
    'Corner Larder Unit',
    'cabinet',
    90,
    90,
    200,
    '#F5F5F5',
    'tall-units',  -- Put it in the correct category from the start
    ARRAY['kitchen'],
    'Square',
    'L-shaped corner larder unit maximizing space efficiency',
    '1.0.0',
    false,
    '{}',
    ARRAY['larder', 'corner', 'tall'],
    'floor',
    true,
    'front',
    0,
    NULL,  -- Use actual height
    jsonb_build_object(
        'is_corner', true,
        'door_width', 30,
        'side_width', 60,
        'corner_type', 'L-shaped',
        'auto_rotate', true
    ),
    jsonb_build_object(
        'use_actual_height_in_elevation', true,
        'is_tall_unit', true,
        'door_count', 2,
        'has_lazy_susan', false,
        'corner_solution', 'L-shaped'
    ),
    NOW(),
    NOW()
)
ON CONFLICT (component_id) DO UPDATE SET
    category = 'tall-units',
    corner_configuration = jsonb_build_object(
        'is_corner', true,
        'door_width', 30,
        'side_width', 60,
        'corner_type', 'L-shaped',
        'auto_rotate', true
    ),
    component_behavior = jsonb_build_object(
        'use_actual_height_in_elevation', true,
        'is_tall_unit', true,
        'door_count', 2,
        'has_lazy_susan', false,
        'corner_solution', 'L-shaped'
    ),
    updated_at = NOW();

-- ==========================================
-- STEP 3: VERIFICATION
-- ==========================================

-- Verify the component is restored
SELECT 
    'RESTORED LARDER CORNER UNIT' as status,
    component_id,
    name,
    category,
    width || 'x' || depth || 'x' || height as dimensions,
    corner_configuration,
    component_behavior,
    '✅ RESTORED WITH PROPER CORNER CONFIG' as restoration_status
FROM public.components 
WHERE component_id = 'larder-corner-unit';

-- Show all tall-units to confirm it's in the right place
SELECT 
    'TALL-UNITS CATEGORY FINAL' as status,
    component_id,
    name,
    width || 'x' || depth || 'x' || height as dimensions,
    CASE 
        WHEN corner_configuration ? 'is_corner' THEN '🔶 CORNER UNIT'
        ELSE '📦 REGULAR UNIT'
    END as unit_type
FROM public.components 
WHERE category = 'tall-units'
ORDER BY component_id;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '🔶 LARDER CORNER UNIT RESTORED!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• larder-corner-unit recreated in tall-units category';
    RAISE NOTICE '• Proper corner configuration applied';
    RAISE NOTICE '• L-shaped geometry restored (90x90x200cm)';
    RAISE NOTICE '• Dynamic corner system should work again';
    RAISE NOTICE '==========================================';
END $$;
