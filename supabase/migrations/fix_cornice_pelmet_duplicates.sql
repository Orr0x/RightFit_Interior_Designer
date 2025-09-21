-- FIX CORNICE & PELMET DUPLICATES
-- Delete "kitchen-pelmet" and "kitchen-cornice" categories, keep "cornice-&-pelmet"

-- ==========================================
-- STEP 1: ANALYZE THE CURRENT SITUATION
-- ==========================================

-- Show what's in "kitchen-pelmet" category (duplicates to delete)
SELECT 
    'KITCHEN-PELMET CATEGORY (DUPLICATES)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '❌ TO BE DELETED' as action
FROM public.components 
WHERE category = 'kitchen-pelmet'
ORDER BY component_id;

-- Show what's in "kitchen-cornice" category (duplicates to delete)
SELECT 
    'KITCHEN-CORNICE CATEGORY (DUPLICATES)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '❌ TO BE DELETED' as action
FROM public.components 
WHERE category = 'kitchen-cornice'
ORDER BY component_id;

-- Show what's in "cornice-&-pelmet" category (originals to keep)
SELECT 
    'CORNICE-&-PELMET CATEGORY (ORIGINALS)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '✅ TO BE KEPT' as action
FROM public.components 
WHERE category = 'cornice-&-pelmet'
ORDER BY component_id;

-- ==========================================
-- STEP 2: DELETE THE DUPLICATE CATEGORIES
-- ==========================================

-- Show exactly what will be deleted from kitchen-pelmet
SELECT 
    'KITCHEN-PELMET TO DELETE' as status,
    component_id,
    name,
    category,
    created_at::date as created_date,
    '❌ DUPLICATE PELMET - WILL BE DELETED' as action
FROM public.components 
WHERE category = 'kitchen-pelmet'
ORDER BY component_id;

-- Show exactly what will be deleted from kitchen-cornice
SELECT 
    'KITCHEN-CORNICE TO DELETE' as status,
    component_id,
    name,
    category,
    created_at::date as created_date,
    '❌ DUPLICATE CORNICE - WILL BE DELETED' as action
FROM public.components 
WHERE category = 'kitchen-cornice'
ORDER BY component_id;

-- Delete all components in kitchen-pelmet category
DELETE FROM public.components 
WHERE category = 'kitchen-pelmet';

-- Get count of deleted pelmet components
DO $$
DECLARE
    deleted_pelmet_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_pelmet_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % duplicate kitchen-pelmet components', deleted_pelmet_count;
END $$;

-- Delete all components in kitchen-cornice category
DELETE FROM public.components 
WHERE category = 'kitchen-cornice';

-- Get count of deleted cornice components
DO $$
DECLARE
    deleted_cornice_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_cornice_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % duplicate kitchen-cornice components', deleted_cornice_count;
END $$;

-- ==========================================
-- STEP 3: VERIFICATION
-- ==========================================

-- Verify kitchen-pelmet category is now empty
SELECT 
    'KITCHEN-PELMET AFTER CLEANUP' as status,
    COALESCE(COUNT(*), 0) as remaining_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ CATEGORY CLEANED - ALL PELMET DUPLICATES REMOVED'
        ELSE '❌ UNEXPECTED PELMET COMPONENTS REMAIN'
    END as cleanup_status
FROM public.components 
WHERE category = 'kitchen-pelmet';

-- Verify kitchen-cornice category is now empty
SELECT 
    'KITCHEN-CORNICE AFTER CLEANUP' as status,
    COALESCE(COUNT(*), 0) as remaining_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ CATEGORY CLEANED - ALL CORNICE DUPLICATES REMOVED'
        ELSE '❌ UNEXPECTED CORNICE COMPONENTS REMAIN'
    END as cleanup_status
FROM public.components 
WHERE category = 'kitchen-cornice';

-- Verify cornice-&-pelmet category is preserved
SELECT 
    'CORNICE-&-PELMET PRESERVED' as status,
    component_id,
    name,
    category,
    width || 'x' || depth || 'x' || height as dimensions,
    '✅ ORIGINAL COMPONENTS PRESERVED' as component_status
FROM public.components 
WHERE category = 'cornice-&-pelmet'
ORDER BY component_id;

-- Show all cornice/pelmet related categories remaining
SELECT 
    'ALL CORNICE/PELMET CATEGORIES REMAINING' as status,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE (category ILIKE '%cornice%' OR category ILIKE '%pelmet%')
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Final verification - should only show cornice-&-pelmet
SELECT 
    'FINAL CORNICE/PELMET SUMMARY' as status,
    category,
    COUNT(*) as component_count
FROM public.components 
WHERE (category ILIKE '%cornice%' OR category ILIKE '%pelmet%')
GROUP BY category
ORDER BY category;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ CORNICE & PELMET CLEANUP COMPLETED!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• Kitchen-pelmet category deleted (duplicates removed)';
    RAISE NOTICE '• Kitchen-cornice category deleted (duplicates removed)';
    RAISE NOTICE '• Cornice-&-pelmet preserved (originals kept)';
    RAISE NOTICE '• UI will now show single clean category';
    RAISE NOTICE '==========================================';
END $$;
