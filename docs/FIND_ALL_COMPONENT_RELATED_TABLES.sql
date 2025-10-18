-- =============================================================================
-- FIND ALL TABLES LINKED TO COMPONENTS TABLE
-- Date: 2025-10-18
-- Purpose: Identify all tables with foreign keys or references to components
-- Session: feature/database-component-cleanup
-- =============================================================================

-- =============================================================================
-- 1. Find tables with FOREIGN KEY constraints to components
-- =============================================================================

SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'components'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =============================================================================
-- 2. List all tables in public schema (for manual review)
-- =============================================================================

SELECT
  table_name,
  (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = t.table_name
  ) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =============================================================================
-- 3. Find columns named 'component_id' in any table
-- =============================================================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'component_id'
ORDER BY table_name;

-- =============================================================================
-- 4. Find tables with 'component' in the name
-- =============================================================================

SELECT
  table_name,
  (
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = t.table_name
  ) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name LIKE '%component%'
ORDER BY table_name;

-- =============================================================================
-- 5. RECOMMENDED: Export these tables for review
-- =============================================================================

-- Based on typical database structure, these tables likely reference components:
--
-- DIRECT FOREIGN KEY RELATIONSHIPS:
-- 1. component_3d_models (component_id → components.component_id)
-- 2. component_2d_renders (component_id → components.component_id)
-- 3. component_hardware (component_id → components.component_id) [if exists]
-- 4. component_material_costs (component_id → components.component_id) [if exists]
-- 5. component_material_finishes (component_id → components.component_id) [if exists]
--
-- INDIRECT JSONB REFERENCES (no FK constraint):
-- 6. room_designs (design_elements JSONB contains component_id)
--
-- RELATED TABLES:
-- 7. geometry_parts (model_id → component_3d_models.id)
-- 8. material_definitions (referenced by geometry_parts)

-- =============================================================================
-- 6. Count records in component-related tables
-- =============================================================================

SELECT 'components' as table_name, COUNT(*) as record_count FROM components
UNION ALL
SELECT 'component_3d_models' as table_name, COUNT(*) as record_count FROM component_3d_models
UNION ALL
SELECT 'component_2d_renders' as table_name, COUNT(*) as record_count FROM component_2d_renders
UNION ALL
SELECT 'geometry_parts' as table_name, COUNT(*) as record_count FROM geometry_parts
UNION ALL
SELECT 'material_definitions' as table_name, COUNT(*) as record_count FROM material_definitions
ORDER BY table_name;

-- =============================================================================
-- 7. Export queries for each table (copy results to JSON)
-- =============================================================================

-- COMPONENTS TABLE (main catalog)
SELECT * FROM components ORDER BY component_id;

-- COMPONENT_3D_MODELS TABLE
SELECT * FROM component_3d_models ORDER BY component_id;

-- COMPONENT_2D_RENDERS TABLE
SELECT * FROM component_2d_renders ORDER BY component_id;

-- GEOMETRY_PARTS TABLE
SELECT * FROM geometry_parts ORDER BY model_id, render_order;

-- MATERIAL_DEFINITIONS TABLE
SELECT * FROM material_definitions ORDER BY material_name;

-- =============================================================================
-- 8. Check for orphaned records in each table
-- =============================================================================

-- Orphaned component_3d_models (no matching component)
SELECT
  'component_3d_models' as table_name,
  component_id,
  component_name,
  'ORPHANED - component_id not in components table' as issue
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1 FROM components c
  WHERE c.component_id = cm.component_id
)
ORDER BY component_id;

-- Orphaned component_2d_renders (no matching component)
SELECT
  'component_2d_renders' as table_name,
  component_id,
  NULL as component_name,
  'ORPHANED - component_id not in components table' as issue
FROM component_2d_renders cr
WHERE NOT EXISTS (
  SELECT 1 FROM components c
  WHERE c.component_id = cr.component_id
)
ORDER BY component_id;

-- Orphaned geometry_parts (no matching 3D model)
SELECT
  'geometry_parts' as table_name,
  id,
  part_name,
  'ORPHANED - model_id not in component_3d_models table' as issue
FROM geometry_parts gp
WHERE NOT EXISTS (
  SELECT 1 FROM component_3d_models cm
  WHERE cm.id = gp.model_id
)
ORDER BY id;

-- =============================================================================
-- 9. Missing records check (components without 3D models or 2D renders)
-- =============================================================================

-- Components without 3D models
SELECT
  'components' as table_name,
  component_id,
  name,
  'MISSING - no 3D model defined' as issue
FROM components c
WHERE NOT EXISTS (
  SELECT 1 FROM component_3d_models cm
  WHERE cm.component_id = c.component_id
)
ORDER BY component_id;

-- Components without 2D renders
SELECT
  'components' as table_name,
  component_id,
  name,
  'MISSING - no 2D render defined' as issue
FROM components c
WHERE NOT EXISTS (
  SELECT 1 FROM component_2d_renders cr
  WHERE cr.component_id = c.component_id
)
ORDER BY component_id;

-- =============================================================================
-- 10. SUMMARY: Data integrity check
-- =============================================================================

SELECT
  'Total components' as metric,
  COUNT(*) as count
FROM components
UNION ALL
SELECT
  'Components with 3D models' as metric,
  COUNT(DISTINCT c.component_id) as count
FROM components c
INNER JOIN component_3d_models cm ON c.component_id = cm.component_id
UNION ALL
SELECT
  'Components with 2D renders' as metric,
  COUNT(DISTINCT c.component_id) as count
FROM components c
INNER JOIN component_2d_renders cr ON c.component_id = cr.component_id
UNION ALL
SELECT
  'Orphaned 3D models' as metric,
  COUNT(*) as count
FROM component_3d_models cm
WHERE NOT EXISTS (
  SELECT 1 FROM components c WHERE c.component_id = cm.component_id
)
UNION ALL
SELECT
  'Orphaned 2D renders' as metric,
  COUNT(*) as count
FROM component_2d_renders cr
WHERE NOT EXISTS (
  SELECT 1 FROM components c WHERE c.component_id = cr.component_id
)
UNION ALL
SELECT
  'Orphaned geometry parts' as metric,
  COUNT(*) as count
FROM geometry_parts gp
WHERE NOT EXISTS (
  SELECT 1 FROM component_3d_models cm WHERE cm.id = gp.model_id
);
