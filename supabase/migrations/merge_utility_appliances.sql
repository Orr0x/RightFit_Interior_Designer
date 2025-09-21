-- MERGE UTILITY APPLIANCES WITH APPLIANCES CATEGORY
-- Keep advanced utility-appliances models, remove duplicates from appliances category

-- ==========================================
-- STEP 1: ANALYZE BOTH CATEGORIES
-- ==========================================

-- Show what's in "utility-appliances" category (advanced models to keep)
SELECT 
    'UTILITY-APPLIANCES CATEGORY (ADVANCED MODELS)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    version,
    '✅ KEEP - ADVANCED MODEL' as action
FROM public.components 
WHERE category = 'utility-appliances'
ORDER BY component_id;

-- Show what's in "appliances" category (basic models, some may be duplicates)
SELECT 
    'APPLIANCES CATEGORY (BASIC MODELS)' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions,
    version,
    'REVIEW FOR DUPLICATES' as action
FROM public.components 
WHERE category = 'appliances'
ORDER BY component_id;

-- Identify potential duplicates (similar component_ids between categories)
SELECT 
    'POTENTIAL DUPLICATES ANALYSIS' as analysis,
    ua.component_id as utility_appliance_id,
    ua.name as utility_name,
    a.component_id as appliance_id,
    a.name as appliance_name,
    CASE 
        WHEN a.component_id IS NOT NULL THEN '❌ DUPLICATE - DELETE FROM APPLIANCES'
        ELSE '✅ UNIQUE - KEEP UTILITY VERSION'
    END as recommendation
FROM public.components ua
LEFT JOIN public.components a ON (
    -- Match similar appliances (remove prefixes like 'db-', 'utility-' for comparison)
    REPLACE(REPLACE(ua.component_id, 'db-', ''), 'utility-', '') = 
    REPLACE(REPLACE(a.component_id, 'db-', ''), 'utility-', '')
    AND a.category = 'appliances'
)
WHERE ua.category = 'utility-appliances'
ORDER BY ua.component_id;

-- ==========================================
-- STEP 2: UPDATE UTILITY APPLIANCES FOR KITCHEN + UTILITY USE
-- ==========================================

-- Show current room_types for utility appliances
SELECT 
    'UTILITY APPLIANCES CURRENT ROOM TYPES' as status,
    component_id,
    name,
    category,
    room_types,
    created_at::date as created_date,
    'CURRENT ROOM TYPES' as action
FROM public.components 
WHERE category = 'utility-appliances'
ORDER BY component_id;

-- Add 'kitchen' to room_types for utility appliances (keep utility too)
UPDATE public.components 
SET 
    room_types = CASE 
        WHEN 'kitchen' = ANY(room_types) THEN room_types  -- Already has kitchen
        ELSE array_append(room_types, 'kitchen')  -- Add kitchen to existing room_types
    END,
    updated_at = NOW()
WHERE category = 'utility-appliances'
    AND NOT ('kitchen' = ANY(room_types));  -- Only update if kitchen not already present

-- Move utility appliances to main appliances category for UI consistency
UPDATE public.components 
SET 
    category = 'appliances',
    updated_at = NOW()
WHERE category = 'utility-appliances';

-- Get count of updated components
DO $$
DECLARE
    moved_count INTEGER;
BEGIN
    GET DIAGNOSTICS moved_count = ROW_COUNT;
    RAISE NOTICE 'Updated % utility appliances to be available in kitchen and utility rooms', moved_count;
END $$;

-- ==========================================
-- STEP 3: IDENTIFY AND REMOVE DUPLICATES
-- ==========================================

-- Now identify duplicates within the appliances category after merge
WITH duplicate_analysis AS (
    SELECT 
        component_id,
        name,
        version,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY REPLACE(REPLACE(component_id, 'db-', ''), 'utility-', '')
            ORDER BY 
                CASE WHEN version = '2.0.0' THEN 1 ELSE 2 END, -- Prefer v2.0.0
                created_at DESC -- Then prefer newer
        ) as priority_rank
    FROM public.components 
    WHERE category = 'appliances'
)
SELECT 
    'DUPLICATES TO DELETE AFTER MERGE' as status,
    component_id,
    name,
    version,
    created_at::date as created_date,
    priority_rank,
    '❌ DUPLICATE - WILL BE DELETED' as action
FROM duplicate_analysis
WHERE priority_rank > 1
ORDER BY component_id;

-- Delete lower priority duplicates
WITH duplicate_analysis AS (
    SELECT 
        id,
        component_id,
        ROW_NUMBER() OVER (
            PARTITION BY REPLACE(REPLACE(component_id, 'db-', ''), 'utility-', '')
            ORDER BY 
                CASE WHEN version = '2.0.0' THEN 1 ELSE 2 END, -- Prefer v2.0.0
                created_at DESC -- Then prefer newer
        ) as priority_rank
    FROM public.components 
    WHERE category = 'appliances'
)
DELETE FROM public.components 
WHERE id IN (
    SELECT id FROM duplicate_analysis WHERE priority_rank > 1
);

-- Get count of deleted duplicates
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % duplicate appliances, keeping the most advanced versions', deleted_count;
END $$;

-- ==========================================
-- STEP 4: VERIFICATION
-- ==========================================

-- Verify utility-appliances category is now empty
SELECT 
    'UTILITY-APPLIANCES AFTER MERGE' as status,
    COALESCE(COUNT(*), 0) as remaining_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ CATEGORY EMPTY - ALL MOVED TO APPLIANCES'
        ELSE '❌ UNEXPECTED COMPONENTS REMAIN'
    END as merge_status
FROM public.components 
WHERE category = 'utility-appliances';

-- Show final appliances category (should contain the best versions)
SELECT 
    'FINAL APPLIANCES CATEGORY' as status,
    component_id,
    name,
    category,
    room_types,
    version,
    width || 'x' || depth || 'x' || height as dimensions,
    created_at::date as created_date,
    CASE 
        WHEN 'kitchen' = ANY(room_types) AND 'utility' = ANY(room_types) THEN '✅ AVAILABLE IN KITCHEN & UTILITY'
        WHEN 'kitchen' = ANY(room_types) THEN '✅ AVAILABLE IN KITCHEN'
        WHEN 'utility' = ANY(room_types) THEN '✅ AVAILABLE IN UTILITY'
        ELSE '⚠️ ROOM TYPES NEED REVIEW'
    END as availability_status
FROM public.components 
WHERE category = 'appliances'
ORDER BY component_id;

-- Count final appliances
SELECT 
    'APPLIANCES FINAL COUNT' as status,
    COUNT(*) as total_appliances,
    COUNT(CASE WHEN version = '2.0.0' THEN 1 END) as enhanced_appliances,
    COUNT(CASE WHEN version = '1.0.0' THEN 1 END) as basic_appliances,
    'Advanced utility models preserved' as note
FROM public.components 
WHERE category = 'appliances';

-- Check for any remaining utility categories
SELECT 
    'REMAINING UTILITY CATEGORIES' as status,
    category,
    COUNT(*) as component_count
FROM public.components 
WHERE category ILIKE '%utility%'
GROUP BY category
ORDER BY category;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ UTILITY APPLIANCES MERGE COMPLETED!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• Advanced utility-appliances moved to appliances category';
    RAISE NOTICE '• Kitchen room type added to utility appliances';
    RAISE NOTICE '• Appliances now available in both kitchen and utility rooms';
    RAISE NOTICE '• Duplicate basic appliances removed';
    RAISE NOTICE '• Best versions of each appliance preserved';
    RAISE NOTICE '• UI will show single clean appliances category';
    RAISE NOTICE '==========================================';
END $$;
