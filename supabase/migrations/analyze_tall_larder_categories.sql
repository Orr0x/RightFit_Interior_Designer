-- ANALYZE TALL/LARDER CATEGORIES
-- Find out exactly what categories exist for tall units and larders

-- ==========================================
-- STEP 1: FIND ALL CATEGORIES WITH TALL/LARDER COMPONENTS
-- ==========================================

-- Show all categories that contain "tall" or "larder" in the name
SELECT 
    'CATEGORIES WITH TALL/LARDER' as analysis,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as component_ids
FROM public.components 
WHERE (category ILIKE '%tall%' OR category ILIKE '%larder%')
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Show all categories that might contain larder components (by component name)
SELECT 
    'CATEGORIES WITH LARDER COMPONENTS' as analysis,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as larder_component_ids
FROM public.components 
WHERE component_id ILIKE '%larder%'
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Show all categories that might contain tall components (by component name)
SELECT 
    'CATEGORIES WITH TALL COMPONENTS' as analysis,
    category,
    COUNT(*) as component_count,
    array_agg(component_id ORDER BY component_id) as tall_component_ids
FROM public.components 
WHERE (component_id ILIKE '%tall%' OR name ILIKE '%tall%')
    AND 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Show all kitchen categories to see the full picture
SELECT 
    'ALL KITCHEN CATEGORIES' as analysis,
    category,
    COUNT(*) as component_count
FROM public.components 
WHERE 'kitchen' = ANY(room_types)
GROUP BY category
ORDER BY category;

-- Show specific larder components and their categories
SELECT 
    'LARDER COMPONENTS DETAILS' as analysis,
    component_id,
    name,
    category,
    created_at::date as created_date,
    width || 'x' || depth || 'x' || height as dimensions
FROM public.components 
WHERE component_id ILIKE '%larder%'
    AND 'kitchen' = ANY(room_types)
ORDER BY category, component_id;

-- Show components that are likely tall units (height > 150cm)
SELECT 
    'TALL COMPONENTS BY HEIGHT' as analysis,
    component_id,
    name,
    category,
    height,
    created_at::date as created_date
FROM public.components 
WHERE height::numeric > 150
    AND 'kitchen' = ANY(room_types)
ORDER BY category, component_id;
