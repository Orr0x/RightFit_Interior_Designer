-- =============================================================================
-- PHASE 1.5: VALIDATION & TESTING
-- Validate the new schema and data migration
-- =============================================================================

-- Test 1: Verify all components have behavior data
DO $$ 
DECLARE
    missing_behavior INTEGER;
    missing_mount_type INTEGER;
    missing_z_position INTEGER;
BEGIN
    -- Check for missing mount_type
    SELECT COUNT(*) INTO missing_mount_type 
    FROM public.components 
    WHERE mount_type IS NULL;
    
    -- Check for missing default_z_position  
    SELECT COUNT(*) INTO missing_z_position
    FROM public.components 
    WHERE default_z_position IS NULL;
    
    IF missing_mount_type > 0 THEN
        RAISE WARNING 'Found % components with missing mount_type', missing_mount_type;
    END IF;
    
    IF missing_z_position > 0 THEN
        RAISE WARNING 'Found % components with missing default_z_position', missing_z_position;
    END IF;
    
    IF missing_mount_type = 0 AND missing_z_position = 0 THEN
        RAISE NOTICE '✅ All components have complete behavior data';
    END IF;
END $$;

-- Test 2: Verify room type templates
DO $$ 
DECLARE
    template_count INTEGER;
    expected_count INTEGER := 12;
BEGIN
    SELECT COUNT(*) INTO template_count FROM public.room_type_templates;
    
    IF template_count = expected_count THEN
        RAISE NOTICE '✅ All % room type templates created successfully', template_count;
    ELSE
        RAISE WARNING '❌ Expected % room templates, found %', expected_count, template_count;
    END IF;
END $$;

-- Test 3: Verify room_designs table expansion
DO $$ 
DECLARE
    rooms_with_wall_height INTEGER;
    total_rooms INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_rooms FROM public.room_designs;
    SELECT COUNT(*) INTO rooms_with_wall_height 
    FROM public.room_designs 
    WHERE wall_height IS NOT NULL;
    
    IF total_rooms = rooms_with_wall_height THEN
        RAISE NOTICE '✅ All % room designs have wall_height set', total_rooms;
    ELSE
        RAISE WARNING '❌ Only % of % room designs have wall_height', rooms_with_wall_height, total_rooms;
    END IF;
END $$;

-- Test 4: Sample queries to verify data accessibility
-- Test component behavior lookup (replaces COMPONENT_DATA)
SELECT 
    type,
    mount_type,
    has_direction,
    door_side,
    default_z_position,
    elevation_height,
    COUNT(*) as component_count
FROM public.components
GROUP BY type, mount_type, has_direction, door_side, default_z_position, elevation_height
ORDER BY type;

-- Test room type template lookup (replaces ROOM_TYPE_CONFIGS)  
SELECT 
    room_type,
    name,
    default_width,
    default_height,
    default_wall_height
FROM public.room_type_templates
ORDER BY room_type;

-- Test corner component configuration
SELECT 
    component_id,
    name,
    type,
    corner_configuration
FROM public.components
WHERE corner_configuration != '{}'
LIMIT 5;

-- Test tall/larder component configuration
SELECT 
    component_id,
    name,
    type,
    height,
    elevation_height,
    component_behavior
FROM public.components
WHERE component_behavior->>'is_tall_unit' = 'true'
LIMIT 5;

-- Final validation summary
DO $$ 
DECLARE
    components_total INTEGER;
    components_with_behavior INTEGER;
    room_templates INTEGER;
    room_designs_updated INTEGER;
BEGIN
    SELECT COUNT(*) INTO components_total FROM public.components;
    SELECT COUNT(*) INTO components_with_behavior 
    FROM public.components 
    WHERE mount_type IS NOT NULL AND default_z_position IS NOT NULL;
    
    SELECT COUNT(*) INTO room_templates FROM public.room_type_templates;
    SELECT COUNT(*) INTO room_designs_updated 
    FROM public.room_designs 
    WHERE wall_height IS NOT NULL;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE '🎯 PHASE 1 MIGRATION SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '📊 Components: % total, % with behavior data', components_total, components_with_behavior;
    RAISE NOTICE '🏠 Room templates: % created', room_templates;
    RAISE NOTICE '🏗️ Room designs: % updated with wall heights', room_designs_updated;
    
    IF components_with_behavior = components_total AND room_templates = 12 THEN
        RAISE NOTICE '✅ PHASE 1 MIGRATION SUCCESSFUL!';
        RAISE NOTICE '🚀 Ready to proceed to Phase 2: Code Refactoring';
    ELSE
        RAISE WARNING '❌ PHASE 1 MIGRATION INCOMPLETE - Please review warnings above';
    END IF;
    RAISE NOTICE '==========================================';
END $$;
