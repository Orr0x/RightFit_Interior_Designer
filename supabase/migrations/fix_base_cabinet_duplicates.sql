-- FIX BASE CABINET DUPLICATES AND MOVE L-SHAPED TEST CABINET
-- This script addresses the specific duplicate issue visible in the UI

-- ==========================================
-- STEP 1: ANALYZE THE CURRENT SITUATION
-- ==========================================

-- Show what's in "base-cabinets" category (the duplicates)
SELECT 
    'BASE-CABINETS CATEGORY (DUPLICATES)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width,
    depth,
    height,
    'TO BE PROCESSED' as action
FROM public.components 
WHERE category = 'base-cabinets'
ORDER BY component_id;

-- Show what's in "base-units" category (the originals to keep)
SELECT 
    'BASE-UNITS CATEGORY (ORIGINALS)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width,
    depth,
    height,
    'TO BE KEPT' as action
FROM public.components 
WHERE category = 'base-units'
ORDER BY component_id;

-- ==========================================
-- STEP 2: MOVE L-SHAPED TEST CABINET TO BASE-UNITS
-- ==========================================

-- Move L-Shaped Test Cabinet to the correct category
UPDATE public.components 
SET 
    category = 'base-units',
    updated_at = NOW()
WHERE component_id = 'l-shaped-test-cabinet'
    AND category = 'base-cabinets';

-- Verify the move
SELECT 
    'L-SHAPED CABINET MOVED' as status,
    component_id,
    name,
    category,
    updated_at,
    '✅ MOVED TO BASE-UNITS' as result
FROM public.components 
WHERE component_id = 'l-shaped-test-cabinet';

-- ==========================================
-- STEP 3: DELETE THE DUPLICATE BASE CABINETS
-- ==========================================

-- Show what will be deleted (all remaining base-cabinets after moving L-shaped)
SELECT 
    'COMPONENTS TO DELETE' as status,
    component_id,
    name,
    category,
    created_at::date as created_date,
    '❌ DUPLICATE - WILL BE DELETED' as action
FROM public.components 
WHERE category = 'base-cabinets'
    AND component_id != 'l-shaped-test-cabinet'
ORDER BY component_id;

-- Delete the duplicate base cabinets (but NOT the L-shaped test cabinet)
DELETE FROM public.components 
WHERE category = 'base-cabinets'
    AND component_id != 'l-shaped-test-cabinet';

-- Show how many were deleted
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % duplicate base cabinet components', deleted_count;
END $$;

-- ==========================================
-- STEP 4: VERIFICATION
-- ==========================================

-- Verify base-cabinets category is now clean (should only show L-shaped if any)
SELECT 
    'BASE-CABINETS AFTER CLEANUP' as status,
    COALESCE(COUNT(*), 0) as remaining_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ CATEGORY CLEANED - NO DUPLICATES'
        WHEN COUNT(*) = 1 THEN '⚠️ ONE COMPONENT REMAINS - CHECK MANUALLY'
        ELSE '❌ UNEXPECTED COMPONENTS REMAIN'
    END as cleanup_status
FROM public.components 
WHERE category = 'base-cabinets';

-- Verify base-units category has L-shaped test cabinet
SELECT 
    'BASE-UNITS FINAL STATUS' as status,
    component_id,
    name,
    category,
    CASE 
        WHEN component_id = 'l-shaped-test-cabinet' THEN '✅ L-SHAPED CABINET HERE'
        ELSE '✅ ORIGINAL COMPONENT'
    END as component_status
FROM public.components 
WHERE category = 'base-units'
ORDER BY 
    CASE WHEN component_id = 'l-shaped-test-cabinet' THEN 0 ELSE 1 END,
    component_id;

-- Final count verification
SELECT 
    'FINAL CATEGORY COUNTS' as status,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE category IN ('base-cabinets', 'base-units')
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ BASE CABINET CLEANUP COMPLETED!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• L-Shaped Test Cabinet moved to base-units';
    RAISE NOTICE '• Duplicate base-cabinets deleted';
    RAISE NOTICE '• Original base-units preserved';
    RAISE NOTICE '==========================================';
END $$;
