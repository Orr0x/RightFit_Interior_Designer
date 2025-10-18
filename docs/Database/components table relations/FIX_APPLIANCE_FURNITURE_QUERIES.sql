-- =============================================================================
-- FIX APPLIANCE AND FURNITURE TABLE QUERIES
-- Date: 2025-10-18
-- Purpose: Get correct column names for appliance_3d_types and furniture_3d_models
-- =============================================================================

-- First, find the actual columns in these tables

-- Get columns for appliance_3d_types
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'appliance_3d_types'
ORDER BY ordinal_position;

-- Get columns for furniture_3d_models
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'furniture_3d_models'
ORDER BY ordinal_position;

-- =============================================================================
-- CORRECTED EXPORT QUERIES (use after seeing column names above)
-- =============================================================================

-- APPLIANCE_3D_TYPES - Use the actual primary key or first column
SELECT * FROM appliance_3d_types ORDER BY id;

-- FURNITURE_3D_MODELS - Use the actual primary key or first column
SELECT * FROM furniture_3d_models ORDER BY id;
