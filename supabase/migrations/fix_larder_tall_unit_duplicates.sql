-- FIX LARDER/TALL UNIT DUPLICATES
-- Delete "larder-units" category, keep "tall-units" category

-- ==========================================
-- STEP 1: ANALYZE THE CURRENT SITUATION
-- ==========================================

-- Show what's in "kitchen-larder" category (duplicates to delete)
SELECT 
    'KITCHEN-LARDER CATEGORY (DUPLICATES)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '❌ TO BE DELETED' as action
FROM public.components 
WHERE category = 'kitchen-larder'
ORDER BY component_id;

-- Show what's in "tall-units" category (originals to keep)
SELECT 
    'TALL-UNITS CATEGORY (ORIGINALS)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '✅ TO BE KEPT' as action
FROM public.components 
WHERE category = 'tall-units'
ORDER BY component_id;

-- Check for any other larder-related categories
SELECT 
    'OTHER LARDER CATEGORIES' as analysis,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE category ILIKE '%larder%'
GROUP BY category
ORDER BY category;

-- ==========================================
-- STEP 2: DELETE THE DUPLICATE LARDER CATEGORY
-- ==========================================

-- Show exactly what will be deleted from kitchen-larder
SELECT 
    'KITCHEN-LARDER TO DELETE' as status,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '❌ DUPLICATE LARDER - WILL BE DELETED' as action
FROM public.components 
WHERE category = 'kitchen-larder'
ORDER BY component_id;

-- Delete all components in kitchen-larder category
DELETE FROM public.components 
WHERE category = 'kitchen-larder';

-- Get count of deleted larder components
DO $$
DECLARE
    deleted_larder_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_larder_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % duplicate kitchen-larder components', deleted_larder_count;
END $$;

-- ==========================================
-- STEP 3: VERIFICATION
-- ==========================================

-- Verify kitchen-larder category is now empty
SELECT 
    'KITCHEN-LARDER AFTER CLEANUP' as status,
    COALESCE(COUNT(*), 0) as remaining_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ CATEGORY CLEANED - ALL LARDER DUPLICATES REMOVED'
        ELSE '❌ UNEXPECTED LARDER COMPONENTS REMAIN'
    END as cleanup_status
FROM public.components 
WHERE category = 'kitchen-larder';

-- Verify tall-units category is preserved
SELECT 
    'TALL-UNITS PRESERVED' as status,
    component_id,
    name,
    category,
    width || 'x' || depth || 'x' || height as dimensions,
    '✅ ORIGINAL TALL UNITS PRESERVED' as component_status
FROM public.components 
WHERE category = 'tall-units'
ORDER BY component_id;

-- Show all tall/larder related categories remaining
SELECT 
    'ALL TALL/LARDER CATEGORIES REMAINING' as status,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE (category ILIKE '%tall%' OR category ILIKE '%larder%')
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Check if there are any other larder categories that might need attention
SELECT 
    'REMAINING LARDER CATEGORIES CHECK' as status,
    category,
    COUNT(*) as component_count
FROM public.components 
WHERE category ILIKE '%larder%'
GROUP BY category
ORDER BY category;

-- Final verification - show final tall-units count
SELECT 
    'FINAL TALL-UNITS SUMMARY' as status,
    category,
    COUNT(*) as component_count,
    'All larder duplicates removed, tall-units preserved' as note
FROM public.components 
WHERE category = 'tall-units'
GROUP BY category;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ KITCHEN-LARDER CLEANUP COMPLETED!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• Kitchen-larder category deleted (duplicates removed)';
    RAISE NOTICE '• Tall-units category preserved (originals kept)';
    RAISE NOTICE '• UI will now show single clean tall-units category';
    RAISE NOTICE '==========================================';
END $$;
