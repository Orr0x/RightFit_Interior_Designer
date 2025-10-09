-- ================================================================
-- Consolidated New Components Migration
-- ================================================================
-- Purpose: Add ONLY the new components that don't already exist
-- This migration is idempotent and safe to run multiple times
-- ================================================================

-- NOTE: The detailed migrations (002-006) contain the full component definitions
-- This migration serves as a summary/alternative that only adds truly NEW components
--
-- Components to add:
-- 1. larder-corner-unit-60 (if not exists)
-- 2. larder-corner-unit-90 (if not exists)
-- 3. 17 specialized sinks (if not exists)
-- 4. 5 specialty larder appliances (if not exists)
-- 5. Populate components table for UI catalog
--
-- ================================================================

-- For the detailed implementations, refer to:
-- - 20250916000002_populate_tall_corner_larders.sql
-- - 20250916000003_populate_specialized_sinks.sql
-- - 20250916000004_populate_specialty_larder_appliances.sql
-- - 20250916000005_populate_components_catalog.sql
-- - 20250916000006_populate_components_catalog_rooms.sql

RAISE NOTICE 'This migration is a placeholder. Run the individual migrations 002-006 manually.';
