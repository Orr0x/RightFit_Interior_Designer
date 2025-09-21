-- FIX UTILITY STORAGE DUPLICATES
-- Delete "utility-storage" category, keep components in "tall-units" category

-- ==========================================
-- STEP 1: ANALYZE THE CURRENT SITUATION
-- ==========================================

-- Show what's in "utility-storage" category (duplicates to delete)
SELECT 
    'UTILITY-STORAGE CATEGORY (DUPLICATES)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '❌ TO BE DELETED' as action
FROM public.components 
WHERE category = 'utility-storage'
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

-- Check for any other utility-related categories
SELECT 
    'OTHER UTILITY CATEGORIES' as analysis,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE category ILIKE '%utility%'
GROUP BY category
ORDER BY category;

-- ==========================================
-- STEP 2: DELETE THE DUPLICATE UTILITY STORAGE CATEGORY
-- ==========================================

-- Show exactly what will be deleted from utility-storage
SELECT 
    'UTILITY-STORAGE TO DELETE' as status,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '❌ DUPLICATE UTILITY STORAGE - WILL BE DELETED' as action
FROM public.components 
WHERE category = 'utility-storage'
ORDER BY component_id;

-- Delete all components in utility-storage category
DELETE FROM public.components 
WHERE category = 'utility-storage';

-- Get count of deleted utility storage components
DO $$
DECLARE
    deleted_utility_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_utility_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % duplicate utility-storage components', deleted_utility_count;
END $$;

-- ==========================================
-- STEP 3: VERIFICATION
-- ==========================================

-- Verify utility-storage category is now empty
SELECT 
    'UTILITY-STORAGE AFTER CLEANUP' as status,
    COALESCE(COUNT(*), 0) as remaining_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ CATEGORY CLEANED - ALL UTILITY STORAGE DUPLICATES REMOVED'
        ELSE '❌ UNEXPECTED UTILITY STORAGE COMPONENTS REMAIN'
    END as cleanup_status
FROM public.components 
WHERE category = 'utility-storage';

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

-- Show all utility-related categories remaining
SELECT 
    'ALL UTILITY CATEGORIES REMAINING' as status,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE category ILIKE '%utility%'
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Check if there are any other utility categories that might need attention
SELECT 
    'REMAINING UTILITY CATEGORIES CHECK' as status,
    category,
    COUNT(*) as component_count
FROM public.components 
WHERE category ILIKE '%utility%'
GROUP BY category
ORDER BY category;

-- Final verification - show final tall-units count
SELECT 
    'FINAL TALL-UNITS SUMMARY' as status,
    category,
    COUNT(*) as component_count,
    'All utility storage duplicates removed, tall-units preserved' as note
FROM public.components 
WHERE category = 'tall-units'
GROUP BY category;

-- Show all categories that might contain tall storage components
SELECT 
    'TALL STORAGE CATEGORIES FINAL CHECK' as status,
    category,
    COUNT(*) as component_count
FROM public.components 
WHERE (category ILIKE '%tall%' OR category ILIKE '%storage%' OR category ILIKE '%utility%')
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ UTILITY STORAGE CLEANUP COMPLETED!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• Utility-storage category deleted (duplicates removed)';
    RAISE NOTICE '• Tall-units category preserved (originals kept)';
    RAISE NOTICE '• UI will now show single clean tall-units category';
    RAISE NOTICE '==========================================';
END $$;
