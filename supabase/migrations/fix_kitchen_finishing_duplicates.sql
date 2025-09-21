-- FIX KITCHEN FINISHING DUPLICATES
-- Delete "kitchen-toe-kick" and "kitchen-wall-unit-end-panels" categories (duplicates)

-- ==========================================
-- STEP 1: ANALYZE THE CURRENT SITUATION
-- ==========================================

-- Show what's in "kitchen-toe-kick" category (duplicates to delete)
SELECT 
    'KITCHEN-TOE-KICK CATEGORY (DUPLICATES)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '❌ TO BE DELETED' as action
FROM public.components 
WHERE category = 'kitchen-toe-kick'
ORDER BY component_id;

-- Show what's in "kitchen-wall-unit-end-panels" category (duplicates to delete)
SELECT 
    'KITCHEN-WALL-UNIT-END-PANELS CATEGORY (DUPLICATES)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '❌ TO BE DELETED' as action
FROM public.components 
WHERE category = 'kitchen-wall-unit-end-panels'
ORDER BY component_id;

-- Show what's in "finishing" category (likely originals to keep)
SELECT 
    'FINISHING CATEGORY (LIKELY ORIGINALS)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '✅ LIKELY TO BE KEPT' as action
FROM public.components 
WHERE category = 'finishing'
ORDER BY component_id;

-- Check for any other toe-kick or end-panel related categories
SELECT 
    'OTHER TOE-KICK/END-PANEL CATEGORIES' as analysis,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE (category ILIKE '%toe-kick%' OR category ILIKE '%end-panel%')
GROUP BY category
ORDER BY category;

-- ==========================================
-- STEP 2: DELETE THE DUPLICATE CATEGORIES
-- ==========================================

-- Show exactly what will be deleted from kitchen-toe-kick
SELECT 
    'KITCHEN-TOE-KICK TO DELETE' as status,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '❌ DUPLICATE TOE-KICK - WILL BE DELETED' as action
FROM public.components 
WHERE category = 'kitchen-toe-kick'
ORDER BY component_id;

-- Show exactly what will be deleted from kitchen-wall-unit-end-panels
SELECT 
    'KITCHEN-WALL-UNIT-END-PANELS TO DELETE' as status,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    '❌ DUPLICATE END-PANELS - WILL BE DELETED' as action
FROM public.components 
WHERE category = 'kitchen-wall-unit-end-panels'
ORDER BY component_id;

-- Delete all components in kitchen-toe-kick category
DELETE FROM public.components 
WHERE category = 'kitchen-toe-kick';

-- Get count of deleted toe-kick components
DO $$
DECLARE
    deleted_toekick_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_toekick_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % duplicate kitchen-toe-kick components', deleted_toekick_count;
END $$;

-- Delete all components in kitchen-wall-unit-end-panels category
DELETE FROM public.components 
WHERE category = 'kitchen-wall-unit-end-panels';

-- Get count of deleted end-panel components
DO $$
DECLARE
    deleted_endpanel_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_endpanel_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % duplicate kitchen-wall-unit-end-panels components', deleted_endpanel_count;
END $$;

-- ==========================================
-- STEP 3: VERIFICATION
-- ==========================================

-- Verify kitchen-toe-kick category is now empty
SELECT 
    'KITCHEN-TOE-KICK AFTER CLEANUP' as status,
    COALESCE(COUNT(*), 0) as remaining_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ CATEGORY CLEANED - ALL TOE-KICK DUPLICATES REMOVED'
        ELSE '❌ UNEXPECTED TOE-KICK COMPONENTS REMAIN'
    END as cleanup_status
FROM public.components 
WHERE category = 'kitchen-toe-kick';

-- Verify kitchen-wall-unit-end-panels category is now empty
SELECT 
    'KITCHEN-WALL-UNIT-END-PANELS AFTER CLEANUP' as status,
    COALESCE(COUNT(*), 0) as remaining_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ CATEGORY CLEANED - ALL END-PANEL DUPLICATES REMOVED'
        ELSE '❌ UNEXPECTED END-PANEL COMPONENTS REMAIN'
    END as cleanup_status
FROM public.components 
WHERE category = 'kitchen-wall-unit-end-panels';

-- Show what remains in finishing category (should be preserved)
SELECT 
    'FINISHING CATEGORY PRESERVED' as status,
    component_id,
    name,
    category,
    width || 'x' || depth || 'x' || height as dimensions,
    '✅ ORIGINAL FINISHING COMPONENTS PRESERVED' as component_status
FROM public.components 
WHERE category = 'finishing'
ORDER BY component_id;

-- Show all toe-kick related categories remaining
SELECT 
    'ALL TOE-KICK CATEGORIES REMAINING' as status,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE category ILIKE '%toe-kick%'
GROUP BY category
ORDER BY category;

-- Show all end-panel related categories remaining
SELECT 
    'ALL END-PANEL CATEGORIES REMAINING' as status,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE category ILIKE '%end-panel%'
GROUP BY category
ORDER BY category;

-- Final verification - show all finishing-related categories
SELECT 
    'FINISHING CATEGORIES FINAL CHECK' as status,
    category,
    COUNT(*) as component_count
FROM public.components 
WHERE (category ILIKE '%finishing%' OR category ILIKE '%toe-kick%' OR category ILIKE '%end-panel%')
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ KITCHEN FINISHING CLEANUP COMPLETED!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• Kitchen-toe-kick category deleted (duplicates removed)';
    RAISE NOTICE '• Kitchen-wall-unit-end-panels category deleted (duplicates removed)';
    RAISE NOTICE '• Original finishing categories preserved';
    RAISE NOTICE '• UI will now show clean finishing categories';
    RAISE NOTICE '==========================================';
END $$;
