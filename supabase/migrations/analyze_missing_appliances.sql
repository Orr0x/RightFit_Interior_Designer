-- ANALYZE MISSING APPLIANCES
-- Check what appliance models we currently have and identify what might be missing

-- ==========================================
-- STEP 1: CURRENT APPLIANCES ANALYSIS
-- ==========================================

-- Show all current appliances by category
SELECT 
    'CURRENT APPLIANCES BY CATEGORY' as analysis,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as appliance_ids
FROM public.components 
WHERE type = 'appliance'
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Show all current kitchen appliances in detail
SELECT 
    'ALL CURRENT KITCHEN APPLIANCES' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    version,
    deprecated
FROM public.components 
WHERE type = 'appliance'
    AND 'kitchen' = ANY(room_types)
ORDER BY category, component_id;

-- Check for any appliances that might be in wrong categories
SELECT 
    'APPLIANCES IN NON-APPLIANCE CATEGORIES' as analysis,
    category,
    COUNT(*) as appliance_count,
    array_agg(component_id ORDER BY component_id) as appliance_ids
FROM public.components 
WHERE (component_id ILIKE '%oven%' 
    OR component_id ILIKE '%fridge%' 
    OR component_id ILIKE '%dishwasher%'
    OR component_id ILIKE '%microwave%'
    OR component_id ILIKE '%cooktop%'
    OR component_id ILIKE '%washing%'
    OR component_id ILIKE '%tumble%'
    OR component_id ILIKE '%dryer%')
    AND type != 'appliance'
GROUP BY category
ORDER BY category;

-- ==========================================
-- STEP 2: IDENTIFY POTENTIALLY MISSING APPLIANCES
-- ==========================================

-- Common kitchen appliances we should have
WITH expected_appliances AS (
    SELECT unnest(ARRAY[
        'cooktop',
        'oven', 
        'microwave',
        'dishwasher',
        'refrigerator',
        'washing-machine',
        'tumble-dryer',
        'range-hood',
        'built-in-fridge',
        'built-in-oven',
        'built-in-microwave',
        'built-in-dishwasher'
    ]) as expected_id
)
SELECT 
    'POTENTIALLY MISSING APPLIANCES' as analysis,
    ea.expected_id,
    CASE 
        WHEN c.component_id IS NOT NULL THEN '✅ FOUND'
        ELSE '❌ MISSING'
    END as status,
    COALESCE(c.name, 'NOT FOUND') as current_name,
    COALESCE(c.category, 'N/A') as current_category
FROM expected_appliances ea
LEFT JOIN public.components c ON c.component_id = ea.expected_id
ORDER BY ea.expected_id;

-- ==========================================
-- STEP 3: CHECK FOR DATABASE-DRIVEN VERSIONS
-- ==========================================

-- Check if we have db- prefixed versions of appliances
SELECT 
    'DATABASE-DRIVEN APPLIANCES CHECK' as analysis,
    component_id,
    name,
    category,
    version,
    created_at::date as created_date,
    'DB-ENHANCED VERSION' as note
FROM public.components 
WHERE component_id LIKE 'db-%'
    AND type = 'appliance'
    AND 'kitchen' = ANY(room_types)
ORDER BY component_id;

-- ==========================================
-- STEP 4: CHECK RECENT DELETIONS IMPACT
-- ==========================================

-- Show appliances created on different dates to see if we lost recent ones
SELECT 
    'APPLIANCES BY CREATION DATE' as analysis,
    created_at::date as creation_date,
    COUNT(*) as appliance_count,
    array_agg(component_id ORDER BY component_id) as appliance_ids
FROM public.components 
WHERE type = 'appliance'
    AND 'kitchen' = ANY(room_types)
GROUP BY created_at::date
ORDER BY created_at::date DESC;

-- ==========================================
-- STEP 5: DETAILED APPLIANCE INVENTORY
-- ==========================================

-- Complete inventory of what we currently have
SELECT 
    'COMPLETE APPLIANCE INVENTORY' as analysis,
    component_id,
    name,
    category,
    type,
    width,
    depth, 
    height,
    version,
    created_at::date as created_date,
    deprecated,
    CASE 
        WHEN component_id LIKE 'db-%' THEN 'DATABASE-DRIVEN'
        ELSE 'ORIGINAL'
    END as appliance_type
FROM public.components 
WHERE (type = 'appliance' OR component_id ILIKE '%oven%' OR component_id ILIKE '%fridge%' OR component_id ILIKE '%dishwasher%')
    AND 'kitchen' = ANY(room_types)
ORDER BY category, component_id;

-- Summary message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '🔍 APPLIANCE ANALYSIS COMPLETED';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Check the results above to identify:';
    RAISE NOTICE '• What appliances we currently have';
    RAISE NOTICE '• What might be missing';
    RAISE NOTICE '• If any are in wrong categories';
    RAISE NOTICE '• Database-driven vs original versions';
    RAISE NOTICE '==========================================';
END $$;
