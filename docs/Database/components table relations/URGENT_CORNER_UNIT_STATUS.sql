-- =============================================================================
-- URGENT: CHECK CORNER UNIT STATUS
-- Date: 2025-10-18
-- Purpose: Identify which corner unit was working and verify current state
-- =============================================================================

-- Find ALL corner-related components and their geometry status
SELECT
  cm.component_id,
  cm.component_name,
  cm.component_type,
  cm.category,
  cm.geometry_type,
  cm.is_corner_component,
  COUNT(gp.id) as geometry_parts_count,
  STRING_AGG(gp.part_name, ', ' ORDER BY gp.render_order) as part_names,
  CASE
    WHEN COUNT(gp.id) = 0 THEN '❌ NO_GEOMETRY'
    ELSE '✅ HAS_GEOMETRY'
  END as status
FROM component_3d_models cm
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
WHERE cm.component_id LIKE '%corner%'
   OR cm.is_corner_component = true
   OR cm.geometry_type = 'l_shaped_corner'
GROUP BY cm.component_id, cm.component_name, cm.component_type, cm.category, cm.geometry_type, cm.is_corner_component
ORDER BY cm.category, cm.component_id;

-- Show which corner units existed in CSV export (before migrations)
-- This helps identify what was "working" before
