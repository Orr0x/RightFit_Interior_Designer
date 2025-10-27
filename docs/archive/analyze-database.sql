-- Database Analysis Script
-- Run this to understand current database state before Story 1.1
-- Generated: 2025-10-26

-- ============================================
-- PART 1: Count rows in all tables
-- ============================================

SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = schemaname AND table_name = tablename) as table_exists
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Get actual row counts for all tables
DO $$
DECLARE
    row_count INTEGER;
    table_record RECORD;
BEGIN
    RAISE NOTICE 'TABLE ROW COUNTS:';
    RAISE NOTICE '==================';

    FOR table_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        EXECUTE 'SELECT count(*) FROM public.' || table_record.tablename INTO row_count;
        RAISE NOTICE '% : % rows', RPAD(table_record.tablename, 50), row_count;
    END LOOP;
END $$;

-- ============================================
-- PART 2: Identify empty tables (never used)
-- ============================================

SELECT
    'Empty Table: ' || tablename as analysis,
    tablename
FROM pg_tables t
WHERE schemaname = 'public'
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    AND c.table_name = t.tablename
    LIMIT 1
)
ORDER BY tablename;

-- ============================================
-- PART 3: Sample data from key component tables
-- ============================================

-- Kitchen components sample (first 5)
SELECT 'kitchen_components' as table_name, id, component_name, category, default_width, default_depth, default_height
FROM kitchen_components
LIMIT 5;

-- Component 3D models sample (check for collision fields!)
SELECT 'component_3d_models' as table_name,
       id,
       component_id,
       layer_type,
       min_height_cm,
       max_height_cm,
       can_overlap_layers
FROM component_3d_models
LIMIT 5;

-- Component 2D renders sample
SELECT 'component_2d_renders' as table_name, id, component_id, render_type, category
FROM component_2d_renders
LIMIT 5;

-- Room designs sample
SELECT 'room_designs' as table_name, id, room_type, room_name, created_at
FROM room_designs
ORDER BY created_at DESC
LIMIT 5;

-- Projects sample
SELECT 'projects' as table_name, id, project_name, created_at, user_id
FROM projects
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- PART 4: Check for type/schema mismatches
-- ============================================

-- List all tables that might be missing from TypeScript types
SELECT
    table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- PART 5: Identify tables added for future features
-- ============================================

-- Tables with zero rows (potential future feature tables)
SELECT tablename, 'Potentially unused/future feature' as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
    SELECT DISTINCT tablename
    FROM pg_stat_user_tables
    WHERE n_tup_ins > 0 OR n_tup_upd > 0 OR n_tup_del > 0
);
