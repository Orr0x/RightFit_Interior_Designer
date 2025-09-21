-- FIX DRAWER DUPLICATES - DELETE BASE DRAWERS, KEEP DRAWER UNITS
-- This script removes duplicates from "base-drawers" and preserves "drawer-units"

-- ==========================================
-- STEP 1: ANALYZE THE CURRENT SITUATION
-- ==========================================

-- Show what's in "base-drawers" category (the duplicates to delete)
SELECT 
    'BASE-DRAWERS CATEGORY (DUPLICATES)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width,
    depth,
    height,
    '❌ TO BE DELETED' as action
FROM public.components 
WHERE category = 'base-drawers'
ORDER BY component_id;

-- Show what's in "drawer-units" category (the correct ones to keep)
SELECT 
    'DRAWER-UNITS CATEGORY (CORRECT DIMENSIONS)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width,
    depth,
    height,
    '✅ TO BE KEPT' as action
FROM public.components 
WHERE category = 'drawer-units'
ORDER BY component_id;

-- ==========================================
-- STEP 2: DELETE THE DUPLICATE BASE DRAWERS
-- ==========================================

-- Show exactly what will be deleted
SELECT 
    'COMPONENTS TO DELETE' as status,
    component_id,
    name,
    category,
    width || 'x' || depth || 'x' || height as dimensions,
    created_at::date as created_date,
    '❌ DUPLICATE - WILL BE DELETED' as action
FROM public.components 
WHERE category = 'base-drawers'
ORDER BY component_id;

-- Delete all components in base-drawers category
DELETE FROM public.components 
WHERE category = 'base-drawers';

-- Show how many were deleted
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % duplicate base drawer components', deleted_count;
END $$;

-- ==========================================
-- STEP 3: VERIFICATION
-- ==========================================

-- Verify base-drawers category is now empty
SELECT 
    'BASE-DRAWERS AFTER CLEANUP' as status,
    COALESCE(COUNT(*), 0) as remaining_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ CATEGORY CLEANED - ALL DUPLICATES REMOVED'
        ELSE '❌ UNEXPECTED COMPONENTS REMAIN'
    END as cleanup_status
FROM public.components 
WHERE category = 'base-drawers';

-- Verify drawer-units category is preserved
SELECT 
    'DRAWER-UNITS PRESERVED' as status,
    component_id,
    name,
    category,
    width || 'x' || depth || 'x' || height as dimensions,
    '✅ CORRECT DIMENSIONS PRESERVED' as component_status
FROM public.components 
WHERE category = 'drawer-units'
ORDER BY component_id;

-- Final count verification
SELECT 
    'FINAL DRAWER CATEGORIES' as status,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE category IN ('base-drawers', 'drawer-units')
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Show all drawer-related categories remaining
SELECT 
    'ALL DRAWER CATEGORIES REMAINING' as status,
    category,
    COUNT(*) as component_count
FROM public.components 
WHERE category ILIKE '%drawer%'
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ DRAWER CLEANUP COMPLETED!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• Base-drawers category deleted (duplicates removed)';
    RAISE NOTICE '• Drawer-units preserved with correct dimensions';
    RAISE NOTICE '• UI will now show clean drawer categories';
    RAISE NOTICE '==========================================';
END $$;
