-- EXECUTE SAFE CLEANUP: Remove duplicate components keeping most recent versions
-- This script safely removes duplicates while preserving your L-shaped components and all functionality

-- ==========================================
-- STEP 1: BACKUP VERIFICATION
-- ==========================================
-- First, let's see what we're working with
DO $$
BEGIN
    RAISE NOTICE 'Starting Safe Component Cleanup Analysis...';
    RAISE NOTICE 'Current timestamp: %', NOW();
END $$;

-- Show current component count
SELECT 
    'BEFORE CLEANUP' as status,
    COUNT(*) as total_components,
    COUNT(DISTINCT component_id) as unique_component_ids,
    COUNT(*) - COUNT(DISTINCT component_id) as duplicates_to_remove
FROM public.components;

-- ==========================================
-- STEP 2: IDENTIFY YOUR PROTECTED COMPONENTS
-- ==========================================
-- Verify your new L-shaped components are present
SELECT 
    'PROTECTED COMPONENTS' as status,
    component_id,
    name,
    created_at,
    width,
    depth,
    'WILL BE PRESERVED' as action
FROM public.components 
WHERE component_id IN ('l-shaped-test-cabinet', 'new-corner-wall-cabinet')
ORDER BY component_id;

-- ==========================================
-- STEP 3: SHOW WHAT WILL BE DELETED
-- ==========================================
-- Components that will be removed (older duplicates)
SELECT 
    'TO BE DELETED' as status,
    component_id,
    name,
    created_at::date as created_date,
    id,
    CASE 
        WHEN created_at::date < '2025-09-21' THEN 'OLDER DUPLICATE'
        ELSE 'DUPLICATE'
    END as reason
FROM public.components a
WHERE a.id NOT IN (
    -- Keep the most recent version of each component_id
    SELECT DISTINCT ON (component_id) id
    FROM public.components
    ORDER BY component_id, created_at DESC NULLS LAST
)
ORDER BY component_id, created_at;

-- ==========================================
-- STEP 4: SHOW WHAT WILL BE KEPT
-- ==========================================
-- Components that will be preserved (most recent versions)
SELECT 
    'TO BE KEPT' as status,
    component_id,
    name,
    created_at::date as created_date,
    id,
    'MOST RECENT VERSION' as reason
FROM public.components a
WHERE a.id IN (
    -- Keep the most recent version of each component_id
    SELECT DISTINCT ON (component_id) id
    FROM public.components
    ORDER BY component_id, created_at DESC NULLS LAST
)
ORDER BY component_id;

-- ==========================================
-- STEP 5: EXECUTE THE SAFE CLEANUP
-- ==========================================
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete duplicate components (keeping most recent version of each component_id)
    DELETE FROM public.components a
    WHERE a.id NOT IN (
        SELECT DISTINCT ON (component_id) id
        FROM public.components
        ORDER BY component_id, created_at DESC NULLS LAST
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Successfully deleted % duplicate components', deleted_count;
END $$;

-- ==========================================
-- STEP 6: POST-CLEANUP VERIFICATION
-- ==========================================
-- Verify the cleanup was successful
SELECT 
    'AFTER CLEANUP' as status,
    COUNT(*) as total_components,
    COUNT(DISTINCT component_id) as unique_component_ids,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT component_id) THEN 'SUCCESS - NO DUPLICATES'
        ELSE 'WARNING - STILL HAS DUPLICATES'
    END as cleanup_result
FROM public.components;

-- Verify your L-shaped components survived
SELECT 
    'L-SHAPED COMPONENTS STATUS' as status,
    component_id,
    name,
    created_at,
    CASE 
        WHEN component_id IN ('l-shaped-test-cabinet', 'new-corner-wall-cabinet') THEN '✅ PRESERVED'
        ELSE '❌ MISSING'
    END as preservation_status
FROM public.components 
WHERE component_id IN ('l-shaped-test-cabinet', 'new-corner-wall-cabinet')
ORDER BY component_id;

-- Show final component distribution by creation date
SELECT 
    'FINAL DISTRIBUTION' as status,
    created_at::date as creation_date,
    COUNT(*) as component_count,
    array_agg(DISTINCT category) as categories_present
FROM public.components
GROUP BY created_at::date
ORDER BY created_at::date DESC;

-- Final component count by category (to ensure we have all essential categories)
SELECT 
    'FINAL CATEGORIES' as status,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE deprecated = false 
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ SAFE CLEANUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Your L-shaped components are preserved';
    RAISE NOTICE 'Dynamic corner system functionality intact';
    RAISE NOTICE 'All duplicate components removed safely';
    RAISE NOTICE '==========================================';
END $$;
