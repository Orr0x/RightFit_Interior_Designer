-- =============================================================================
-- EXPORT CORNER WALL CABINET GEOMETRY FOR ANALYSIS
-- Date: 2025-10-18
-- Purpose: Export complete geometry from new-corner-wall-cabinet-60/90 to create base version
-- =============================================================================

-- =============================================================================
-- 1. Export component_3d_models for both corner wall cabinets
-- =============================================================================

SELECT
  id,
  component_id,
  component_name,
  component_type,
  category,
  geometry_type,
  is_corner_component,
  leg_length,
  corner_depth_wall,
  corner_depth_base,
  rotation_center_x,
  rotation_center_y,
  rotation_center_z,
  has_direction,
  auto_rotate_enabled,
  wall_rotation_left,
  wall_rotation_right,
  wall_rotation_top,
  wall_rotation_bottom,
  corner_rotation_front_left,
  corner_rotation_front_right,
  corner_rotation_back_left,
  corner_rotation_back_right,
  default_width,
  default_height,
  default_depth,
  description,
  layer_type,
  min_height_cm,
  max_height_cm,
  can_overlap_layers
FROM component_3d_models
WHERE component_id IN ('new-corner-wall-cabinet-60', 'new-corner-wall-cabinet-90')
ORDER BY component_id;

-- =============================================================================
-- 2. Export ALL geometry_parts for new-corner-wall-cabinet-90
-- =============================================================================

SELECT
  gp.id,
  gp.model_id,
  gp.part_name,
  gp.part_type,
  gp.render_order,
  gp.position_x,
  gp.position_y,
  gp.position_z,
  gp.dimension_width,
  gp.dimension_height,
  gp.dimension_depth,
  gp.material_name,
  gp.color_override,
  gp.metalness,
  gp.roughness,
  gp.opacity,
  gp.render_condition,
  cm.component_id,
  cm.component_name
FROM geometry_parts gp
JOIN component_3d_models cm ON cm.id = gp.model_id
WHERE cm.component_id = 'new-corner-wall-cabinet-90'
ORDER BY gp.render_order;

-- =============================================================================
-- 3. Count parts by component
-- =============================================================================

SELECT
  cm.component_id,
  cm.component_name,
  COUNT(gp.id) as parts_count,
  STRING_AGG(gp.part_name, ', ' ORDER BY gp.render_order) as part_names
FROM component_3d_models cm
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
WHERE cm.component_id IN ('new-corner-wall-cabinet-60', 'new-corner-wall-cabinet-90')
GROUP BY cm.component_id, cm.component_name
ORDER BY cm.component_id;

-- =============================================================================
-- 4. Compare dimensions between 60cm and 90cm versions
-- =============================================================================

SELECT
  cm.component_id,
  cm.leg_length as leg_length,
  cm.corner_depth_wall,
  cm.corner_depth_base,
  cm.default_width,
  cm.default_height,
  cm.default_depth,
  cm.min_height_cm,
  cm.max_height_cm
FROM component_3d_models cm
WHERE cm.component_id IN ('new-corner-wall-cabinet-60', 'new-corner-wall-cabinet-90')
ORDER BY cm.component_id;

-- =============================================================================
-- NOTES FOR ANALYSIS
-- =============================================================================

-- Query 1: Component configuration (rotation, layer, mounting)
-- Query 2: ALL geometry parts with exact formulas for 90cm version
-- Query 3: Part count comparison (should be same for 60/90)
-- Query 4: Dimension comparison (only leg_length should differ)
--
-- Use this data to create corner-base-cabinet with:
--   - Same L-shaped geometry structure
--   - leg_length: 0.9000 (90cm)
--   - Positioned on ground (not wall-mounted)
--   - Add plinth part (base cabinets have plinths)
--   - Height: 90cm (not 70cm like wall)
--   - layer_type: 'base' (not 'wall')
--   - min_height_cm: 0 (floor level)
--   - max_height_cm: 90 (base cabinet height)
