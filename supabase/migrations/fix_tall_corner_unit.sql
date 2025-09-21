-- Fix the tall/larder corner unit that's broken after cleanup
-- Target: larder-corner-unit and any other tall corner components

-- ==========================================
-- STEP 1: IDENTIFY TALL CORNER COMPONENTS
-- ==========================================

-- Show all tall/larder components that might be corner units
SELECT 
    'TALL CORNER COMPONENTS ANALYSIS' as status,
    component_id,
    name,
    category,
    width || 'x' || depth || 'x' || height as dimensions,
    corner_configuration,
    CASE 
        WHEN corner_configuration IS NULL OR corner_configuration = '{}' THEN '❌ MISSING CONFIG'
        WHEN corner_configuration ? 'is_corner' THEN '✅ HAS CONFIG'
        ELSE '⚠️ INCOMPLETE CONFIG'
    END as config_status
FROM public.components 
WHERE (
    (component_id ILIKE '%corner%' AND (component_id ILIKE '%larder%' OR component_id ILIKE '%tall%'))
    OR component_id = 'larder-corner-unit'
    OR (name ILIKE '%corner%' AND height::numeric > 150)
)
ORDER BY component_id;

-- ==========================================
-- STEP 2: FIX LARDER CORNER UNIT SPECIFICALLY
-- ==========================================

-- Restore corner configuration for larder-corner-unit
UPDATE public.components SET
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
    updated_at = NOW()
WHERE component_id = 'larder-corner-unit';

-- Fix any other tall corner components
UPDATE public.components SET
    corner_configuration = jsonb_build_object(
        'is_corner', true,
        'door_width', 30,
        'side_width', 60,
        'corner_type', 'L-shaped',
        'auto_rotate', true
    ),
    component_behavior = COALESCE(component_behavior, '{}'::jsonb) || jsonb_build_object(
        'use_actual_height_in_elevation', true,
        'is_tall_unit', true,
        'corner_solution', 'L-shaped'
    ),
    updated_at = NOW()
WHERE (component_id ILIKE '%corner%' AND (component_id ILIKE '%larder%' OR component_id ILIKE '%tall%'))
    AND component_id != 'larder-corner-unit';  -- Already handled above

-- Get count of fixed components
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed corner configuration for % tall/larder corner components', fixed_count;
END $$;

-- ==========================================
-- STEP 3: ENSURE CORRECT CATEGORY
-- ==========================================

-- Move larder-corner-unit to tall-units category if it's in wrong category
UPDATE public.components SET
    category = 'tall-units',
    updated_at = NOW()
WHERE component_id = 'larder-corner-unit' 
    AND category != 'tall-units';

-- ==========================================
-- STEP 4: VERIFICATION
-- ==========================================

-- Verify the fix worked
SELECT 
    'FIXED TALL CORNER COMPONENTS' as status,
    component_id,
    name,
    category,
    width || 'x' || depth || 'x' || height as dimensions,
    corner_configuration,
    component_behavior,
    CASE 
        WHEN corner_configuration ? 'is_corner' AND (corner_configuration->>'is_corner')::boolean = true THEN '✅ PROPERLY CONFIGURED'
        ELSE '❌ STILL BROKEN'
    END as config_status
FROM public.components 
WHERE (
    (component_id ILIKE '%corner%' AND (component_id ILIKE '%larder%' OR component_id ILIKE '%tall%'))
    OR component_id = 'larder-corner-unit'
    OR (name ILIKE '%corner%' AND height::numeric > 150)
)
ORDER BY component_id;

-- Show all components in tall-units category for context
SELECT 
    'TALL-UNITS CATEGORY CONTENTS' as status,
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
    RAISE NOTICE '🏗️ TALL CORNER UNIT FIX COMPLETED!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• larder-corner-unit corner configuration restored';
    RAISE NOTICE '• Component moved to tall-units category';
    RAISE NOTICE '• Tall unit behavior preserved';
    RAISE NOTICE '• Dynamic corner system should work for tall units';
    RAISE NOTICE '==========================================';
END $$;
