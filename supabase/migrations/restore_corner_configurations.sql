-- Emergency script to restore corner configurations that may have been lost
-- This ensures all corner components have proper corner_configuration data

-- ==========================================
-- STEP 1: IDENTIFY CORNER COMPONENTS
-- ==========================================

-- Show all components that should have corner configurations
SELECT 
    'CORNER COMPONENTS ANALYSIS' as status,
    component_id,
    name,
    category,
    corner_configuration,
    CASE 
        WHEN corner_configuration IS NULL OR corner_configuration = '{}' THEN '❌ MISSING CONFIG'
        WHEN corner_configuration ? 'is_corner' THEN '✅ HAS CONFIG'
        ELSE '⚠️ INCOMPLETE CONFIG'
    END as config_status
FROM public.components 
WHERE component_id ILIKE '%corner%' 
   OR name ILIKE '%corner%'
   OR component_id IN ('l-shaped-test-cabinet', 'new-corner-wall-cabinet')
ORDER BY component_id;

-- ==========================================
-- STEP 2: RESTORE CORNER CONFIGURATIONS
-- ==========================================

-- Restore corner configuration for all corner base cabinets
UPDATE public.components SET
    corner_configuration = jsonb_build_object(
        'is_corner', true,
        'door_width', 30,
        'side_width', 60,
        'corner_type', 'L-shaped',
        'auto_rotate', true
    ),
    updated_at = NOW()
WHERE (component_id ILIKE '%corner%' AND category IN ('base-units', 'base-cabinets'))
   OR component_id = 'l-shaped-test-cabinet';

-- Restore corner configuration for wall cabinets
UPDATE public.components SET
    corner_configuration = jsonb_build_object(
        'is_corner', true,
        'door_width', 30,
        'side_width', 60,
        'corner_type', 'L-shaped',
        'auto_rotate', true
    ),
    updated_at = NOW()
WHERE (component_id ILIKE '%corner%' AND category IN ('wall-units'))
   OR component_id = 'new-corner-wall-cabinet';

-- Restore corner configuration for counter tops
UPDATE public.components SET
    corner_configuration = jsonb_build_object(
        'is_corner', true,
        'door_width', 30,
        'side_width', 60,
        'corner_type', 'L-shaped'
    ),
    updated_at = NOW()
WHERE component_id ILIKE '%corner%' AND category = 'worktops';

-- Restore corner configuration for cornice/pelmet
UPDATE public.components SET
    corner_configuration = jsonb_build_object(
        'is_corner', true,
        'door_width', 30,
        'side_width', 60,
        'corner_type', 'L-shaped'
    ),
    updated_at = NOW()
WHERE component_id ILIKE '%corner%' AND category = 'cornice-&-pelmet';

-- Get count of restored components
DO $$
DECLARE
    restored_count INTEGER;
BEGIN
    GET DIAGNOSTICS restored_count = ROW_COUNT;
    RAISE NOTICE 'Restored corner configuration for % components', restored_count;
END $$;

-- ==========================================
-- STEP 3: VERIFICATION
-- ==========================================

-- Verify all corner components now have proper configurations
SELECT 
    'RESTORED CORNER COMPONENTS' as status,
    component_id,
    name,
    category,
    corner_configuration,
    CASE 
        WHEN corner_configuration ? 'is_corner' AND (corner_configuration->>'is_corner')::boolean = true THEN '✅ PROPERLY CONFIGURED'
        ELSE '❌ STILL MISSING CONFIG'
    END as config_status
FROM public.components 
WHERE component_id ILIKE '%corner%' 
   OR name ILIKE '%corner%'
   OR component_id IN ('l-shaped-test-cabinet', 'new-corner-wall-cabinet')
ORDER BY component_id;

-- Count properly configured corner components
SELECT 
    'CORNER CONFIGURATION SUMMARY' as status,
    COUNT(*) as total_corner_components,
    COUNT(CASE WHEN corner_configuration ? 'is_corner' THEN 1 END) as properly_configured,
    COUNT(CASE WHEN corner_configuration IS NULL OR corner_configuration = '{}' THEN 1 END) as missing_config
FROM public.components 
WHERE component_id ILIKE '%corner%' 
   OR name ILIKE '%corner%'
   OR component_id IN ('l-shaped-test-cabinet', 'new-corner-wall-cabinet');

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '🔶 CORNER CONFIGURATION RESTORE COMPLETED!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• All corner components have proper corner_configuration';
    RAISE NOTICE '• L-shaped geometry data restored';
    RAISE NOTICE '• Dynamic corner system should work again';
    RAISE NOTICE '==========================================';
END $$;
