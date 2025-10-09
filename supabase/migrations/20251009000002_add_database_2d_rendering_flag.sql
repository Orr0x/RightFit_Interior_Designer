-- Migration: Add Feature Flag for Database-Driven 2D Rendering
-- Date: 2025-10-09
-- Purpose: Enable gradual rollout of database-driven 2D rendering system
-- Related: docs/session-2025-10-09-2d-database-migration/

-- =====================================================
-- Insert Feature Flag
-- =====================================================

INSERT INTO feature_flags (
  flag_key,
  flag_name,
  description,
  enabled,
  rollout_percentage,
  enabled_dev,
  enabled_staging,
  enabled_production,
  test_status,
  can_disable
) VALUES (
  'use_database_2d_rendering',
  'Database-Driven 2D Rendering',
  'Enable database-driven 2D rendering system with component_2d_renders table. Replaces hardcoded rendering logic in DesignCanvas2D.tsx for better maintainability and admin configurability.',
  true,                    -- Master enabled flag
  100,                     -- 100% rollout (all users)
  true,                    -- Enabled in development
  true,                    -- Enabled in staging
  false,                   -- DISABLED in production (for now)
  'testing',               -- Currently being tested
  true                     -- Can be disabled if issues found
)
ON CONFLICT (flag_key)
DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = now();

-- Log migration success
DO $$
BEGIN
  RAISE NOTICE '✅ Feature flag "use_database_2d_rendering" created';
  RAISE NOTICE '🔧 Status: enabled_dev=true, enabled_production=false';
  RAISE NOTICE '📊 Rollout: 100% (when enabled)';
  RAISE NOTICE '🔍 Next: Integrate with DesignCanvas2D.tsx';
END $$;
