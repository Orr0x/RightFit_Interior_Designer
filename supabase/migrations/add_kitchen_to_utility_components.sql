-- This script adds 'kitchen' to the room_types array for specific utility components
-- that need to be available in both kitchen and utility rooms.
--
-- Target components:
-- - db-utility-sink (Utility Sink)
-- - db-utility-washing-machine (Utility Washing Machine)  
-- - db-utility-tumble-dryer (Utility Tumble Dryer)
--
-- ==========================================
-- STEP 1: ANALYZE CURRENT ROOM TYPES
-- ==========================================

-- Show current room_types for the target utility components
SELECT 
    'CURRENT UTILITY COMPONENTS' as status,
    component_id,
    name,
    category,
    room_types,
    created_at::date as created_date,
    CASE 
        WHEN 'kitchen' = ANY(room_types) THEN '✅ ALREADY HAS KITCHEN'
        ELSE '❌ NEEDS KITCHEN ADDED'
    END as kitchen_status
FROM public.components 
WHERE component_id IN (
    'db-utility-sink',
    'db-utility-washing-machine', 
    'db-utility-tumble-dryer'
)
ORDER BY component_id;

-- ==========================================
-- STEP 2: ADD KITCHEN TO ROOM TYPES
-- ==========================================

-- Add 'kitchen' to room_types for utility components that don't already have it
UPDATE public.components 
SET 
    room_types = array_append(room_types, 'kitchen'),
    updated_at = NOW()
WHERE component_id IN (
    'db-utility-sink',
    'db-utility-washing-machine', 
    'db-utility-tumble-dryer'
)
AND NOT ('kitchen' = ANY(room_types));  -- Only update if kitchen not already present

-- Get count of updated components
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Added kitchen room type to % utility components', updated_count;
END $$;

-- ==========================================
-- STEP 3: VERIFICATION
-- ==========================================

-- Show updated room_types for the target utility components
SELECT 
    'UPDATED UTILITY COMPONENTS' as status,
    component_id,
    name,
    category,
    room_types,
    updated_at::timestamp(0) as last_updated,
    CASE 
        WHEN 'kitchen' = ANY(room_types) AND 'utility' = ANY(room_types) THEN '✅ AVAILABLE IN KITCHEN & UTILITY'
        WHEN 'kitchen' = ANY(room_types) THEN '✅ AVAILABLE IN KITCHEN ONLY'
        WHEN 'utility' = ANY(room_types) THEN '❌ UTILITY ONLY (UPDATE FAILED)'
        ELSE '❌ NO ROOM TYPES (ERROR)'
    END as availability_status
FROM public.components 
WHERE component_id IN (
    'db-utility-sink',
    'db-utility-washing-machine', 
    'db-utility-tumble-dryer'
)
ORDER BY component_id;

-- Show all components that have both kitchen and utility room types
SELECT 
    'KITCHEN & UTILITY COMPONENTS' as status,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE 'kitchen' = ANY(room_types) 
    AND 'utility' = ANY(room_types);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ UTILITY COMPONENTS UPDATE COMPLETED!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• Added kitchen room type to utility components';
    RAISE NOTICE '• Components now available in both kitchen and utility';
    RAISE NOTICE '• UI will show these in kitchen component sidebar';
    RAISE NOTICE '==========================================';
END $$;
