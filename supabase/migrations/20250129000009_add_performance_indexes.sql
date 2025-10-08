-- Migration: Add Performance Indexes for 3D Models
-- Date: 2025-01-29
-- Purpose: Optimize query performance for dynamic 3D model loading
--
-- Context: With 4 models in Week 19, performance is good. However, as we scale
-- to 82+ models in Weeks 20-26, we need indexes to maintain performance.
--
-- Expected Impact:
-- - Faster model lookups by component_id (primary use case)
-- - Faster geometry part queries by model_id (secondary use case)
-- - Faster material lookups by name (tertiary use case)
-- - Negligible impact on INSERT performance (we insert rarely, read frequently)

-- =====================================================================
-- Index 1: component_3d_models by component_id
-- =====================================================================
-- Use Case: Primary lookup pattern in Model3DLoaderService
-- Query: SELECT * FROM component_3d_models WHERE component_id = 'l-shaped-test-cabinet-90'
-- Frequency: Every component render (high)
-- Impact: HIGH

CREATE INDEX IF NOT EXISTS idx_component_3d_models_component_id
ON component_3d_models(component_id);

COMMENT ON INDEX idx_component_3d_models_component_id IS
'Optimizes lookups by component_id in Model3DLoaderService. Primary query pattern for dynamic 3D model loading.';

-- =====================================================================
-- Index 2: geometry_parts by model_id
-- =====================================================================
-- Use Case: Secondary lookup for geometry parts after model loaded
-- Query: SELECT * FROM geometry_parts WHERE model_id = '<uuid>'
-- Frequency: Every component render (high)
-- Impact: MEDIUM-HIGH

CREATE INDEX IF NOT EXISTS idx_geometry_parts_model_id
ON geometry_parts(model_id);

COMMENT ON INDEX idx_geometry_parts_model_id IS
'Optimizes loading of geometry parts for a specific model. Used after model metadata is loaded.';

-- =====================================================================
-- Index 3: geometry_parts by material_name
-- =====================================================================
-- Use Case: Material reference lookups (less frequent, but useful for validation)
-- Query: SELECT * FROM geometry_parts WHERE material_name = 'cabinet_wood'
-- Frequency: Low (mainly for admin/debugging)
-- Impact: LOW

CREATE INDEX IF NOT EXISTS idx_geometry_parts_material_name
ON geometry_parts(material_name);

COMMENT ON INDEX idx_geometry_parts_material_name IS
'Optimizes queries that filter by material name. Useful for admin panel and debugging.';

-- =====================================================================
-- Index 4: component_3d_models by is_corner_component
-- =====================================================================
-- Use Case: Admin queries to list all corner components
-- Query: SELECT * FROM component_3d_models WHERE is_corner_component = true
-- Frequency: Very low (admin only)
-- Impact: LOW

CREATE INDEX IF NOT EXISTS idx_component_3d_models_is_corner
ON component_3d_models(is_corner_component)
WHERE is_corner_component = true; -- Partial index (only TRUE values)

COMMENT ON INDEX idx_component_3d_models_is_corner IS
'Partial index for corner components. Useful for admin queries. Only indexes TRUE values to save space.';

-- =====================================================================
-- Verification: Check Index Creation
-- =====================================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  -- Count indexes created by this migration
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('component_3d_models', 'geometry_parts')
    AND indexname LIKE 'idx_%';

  RAISE NOTICE 'Performance indexes created: % indexes', index_count;

  -- List created indexes
  RAISE NOTICE 'Indexes:';
  FOR index_count IN
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('component_3d_models', 'geometry_parts')
      AND indexname LIKE 'idx_%'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '  - %', index_count;
  END LOOP;
END $$;

-- =====================================================================
-- Performance Analysis Queries (run manually to check performance)
-- =====================================================================

-- Check index usage statistics
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as times_used,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('component_3d_models', 'geometry_parts')
-- ORDER BY times_used DESC;

-- Explain query plans to verify index usage
-- EXPLAIN ANALYZE
-- SELECT * FROM component_3d_models WHERE component_id = 'l-shaped-test-cabinet-90';

-- EXPLAIN ANALYZE
-- SELECT * FROM geometry_parts WHERE model_id = (
--   SELECT id FROM component_3d_models WHERE component_id = 'l-shaped-test-cabinet-90'
-- );

-- Check index sizes
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('component_3d_models', 'geometry_parts')
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- =====================================================================
-- Rollback Instructions (if needed)
-- =====================================================================

-- To remove these indexes (should rarely be needed):
-- DROP INDEX IF EXISTS idx_component_3d_models_component_id;
-- DROP INDEX IF EXISTS idx_geometry_parts_model_id;
-- DROP INDEX IF EXISTS idx_geometry_parts_material_name;
-- DROP INDEX IF EXISTS idx_component_3d_models_is_corner;

-- =====================================================================
-- Performance Expectations
-- =====================================================================
--
-- Before Indexes (Week 19, 4 models):
-- - Query time: ~5-10ms (acceptable with few models)
--
-- After Indexes (Week 26, 82 models):
-- - Query time: ~1-2ms (expected with indexes)
-- - 5-10x improvement at scale
--
-- Index Overhead:
-- - Storage: ~10-50KB per index (negligible)
-- - INSERT time: +1-2ms (acceptable, we insert rarely)
-- - Maintenance: Automatic (PostgreSQL handles it)
