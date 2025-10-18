-- Feature Flags System Migration
-- Purpose: Enable safe, gradual rollout of new features with instant rollback capability
-- Created: January 2025

-- ============================================
-- 1. CREATE FEATURE FLAGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(100) UNIQUE NOT NULL,
  flag_name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Master control
  enabled BOOLEAN DEFAULT FALSE,

  -- Gradual rollout (0-100 percentage)
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

  -- User tier override (JSON: {"free": false, "pro": true, "enterprise": true})
  user_tier_override JSONB,

  -- Environment-specific flags
  enabled_dev BOOLEAN DEFAULT TRUE,
  enabled_staging BOOLEAN DEFAULT FALSE,
  enabled_production BOOLEAN DEFAULT FALSE,

  -- Testing metadata
  test_status VARCHAR(50) DEFAULT 'untested' CHECK (test_status IN ('untested', 'testing', 'passed', 'failed')),
  test_results JSONB,
  last_tested_at TIMESTAMP WITH TIME ZONE,

  -- Safety controls
  can_disable BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_test_status ON public.feature_flags(test_status);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Everyone can view feature flags (needed for client-side feature checking)
CREATE POLICY "Anyone can view feature flags"
ON public.feature_flags FOR SELECT
USING (true);

-- Only authenticated users with specific role can modify
CREATE POLICY "Only admins can insert feature flags"
ON public.feature_flags FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE god_mode = true
  )
);

CREATE POLICY "Only admins can update feature flags"
ON public.feature_flags FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE god_mode = true
  )
);

CREATE POLICY "Only admins can delete feature flags"
ON public.feature_flags FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE god_mode = true
  )
);

-- ============================================
-- 5. CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_flags_timestamp
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_feature_flags_updated_at();

-- ============================================
-- 6. INSERT INITIAL FEATURE FLAGS
-- ============================================

-- Positioning system flag
INSERT INTO public.feature_flags (flag_key, flag_name, description, enabled, rollout_percentage, enabled_dev, enabled_staging, enabled_production)
VALUES (
  'use_new_positioning_system',
  'New Positioning System',
  'Fixes left/right wall coordinate asymmetry and unifies room positioning logic across all views',
  false,
  0,
  true,
  false,
  false
) ON CONFLICT (flag_key) DO NOTHING;

-- Database configuration flag
INSERT INTO public.feature_flags (flag_key, flag_name, description, enabled, rollout_percentage, enabled_dev, enabled_staging, enabled_production)
VALUES (
  'use_database_configuration',
  'Database Configuration System',
  'Loads configuration values from database instead of hardcoded constants',
  false,
  0,
  true,
  false,
  false
) ON CONFLICT (flag_key) DO NOTHING;

-- Cost calculation flag
INSERT INTO public.feature_flags (flag_key, flag_name, description, enabled, rollout_percentage, enabled_dev, enabled_staging, enabled_production)
VALUES (
  'use_cost_calculation_system',
  'Cost Calculation System',
  'Enables real-time cost calculation using material and hardware cost data',
  false,
  0,
  true,
  false,
  false
) ON CONFLICT (flag_key) DO NOTHING;

-- Dynamic 3D models flag
INSERT INTO public.feature_flags (flag_key, flag_name, description, enabled, rollout_percentage, enabled_dev, enabled_staging, enabled_production)
VALUES (
  'use_dynamic_3d_models',
  'Dynamic 3D Models',
  'Loads 3D models from database instead of hardcoded React components',
  false,
  0,
  true,
  false,
  false
) ON CONFLICT (flag_key) DO NOTHING;

-- ============================================
-- 7. ADD HELPFUL COMMENTS
-- ============================================

COMMENT ON TABLE public.feature_flags IS 'Feature flag system for safe, gradual rollout of new features with instant rollback capability';
COMMENT ON COLUMN public.feature_flags.flag_key IS 'Unique identifier for the feature flag (e.g., use_new_positioning_system)';
COMMENT ON COLUMN public.feature_flags.rollout_percentage IS 'Percentage of users to enable feature for (0-100)';
COMMENT ON COLUMN public.feature_flags.user_tier_override IS 'JSON object to override flag for specific user tiers';
COMMENT ON COLUMN public.feature_flags.test_status IS 'Current testing status: untested, testing, passed, failed';
COMMENT ON COLUMN public.feature_flags.can_disable IS 'Whether this flag can be disabled (false for permanent migrations)';
