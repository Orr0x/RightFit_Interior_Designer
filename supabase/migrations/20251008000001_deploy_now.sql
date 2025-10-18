-- ============================================
-- STEP 1: Deploy Feature Flags Table
-- ============================================
-- Copy and run this in Supabase Dashboard → SQL Editor
-- Time: 2 minutes

-- 1. CREATE FEATURE FLAGS TABLE
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(100) UNIQUE NOT NULL,
  flag_name VARCHAR(200) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  user_tier_override JSONB,
  enabled_dev BOOLEAN DEFAULT TRUE,
  enabled_staging BOOLEAN DEFAULT FALSE,
  enabled_production BOOLEAN DEFAULT FALSE,
  test_status VARCHAR(50) DEFAULT 'untested' CHECK (test_status IN ('untested', 'testing', 'passed', 'failed')),
  test_results JSONB,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  can_disable BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_test_status ON public.feature_flags(test_status);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES (simplified - anyone can read)
DROP POLICY IF EXISTS "Anyone can view feature flags" ON public.feature_flags;
CREATE POLICY "Anyone can view feature flags"
ON public.feature_flags FOR SELECT
USING (true);

-- 5. CREATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_feature_flags_timestamp ON public.feature_flags;
CREATE TRIGGER update_feature_flags_timestamp
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_feature_flags_updated_at();

-- 6. INSERT INITIAL FEATURE FLAGS
INSERT INTO public.feature_flags (flag_key, flag_name, description, enabled, rollout_percentage, enabled_dev, enabled_staging, enabled_production)
VALUES
  ('use_new_positioning_system', 'New Positioning System', 'Fixes left/right wall coordinate asymmetry', false, 0, true, false, false),
  ('use_database_configuration', 'Database Configuration System', 'Loads configuration from database', false, 0, true, false, false),
  ('use_cost_calculation_system', 'Cost Calculation System', 'Real-time cost calculation', false, 0, true, false, false),
  ('use_dynamic_3d_models', 'Dynamic 3D Models', 'Database-driven 3D models', false, 0, true, false, false)
ON CONFLICT (flag_key) DO NOTHING;

-- 7. ADD COMMENTS
COMMENT ON TABLE public.feature_flags IS 'Feature flag system for safe rollout';

-- ============================================
-- STEP 2: Deploy A/B Testing Table
-- ============================================

-- 1. CREATE AB TEST RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name VARCHAR(200) NOT NULL,
  user_id UUID,
  session_id UUID,
  variant VARCHAR(50) NOT NULL CHECK (variant IN ('legacy', 'new')),
  operation VARCHAR(100) NOT NULL,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  component_type VARCHAR(50),
  view_type VARCHAR(50),
  metadata JSONB,
  environment VARCHAR(20) DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_name ON public.ab_test_results(test_name);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant ON public.ab_test_results(test_name, variant);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_created_at ON public.ab_test_results(created_at);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_user_id ON public.ab_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_success ON public.ab_test_results(test_name, variant, success);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES
DROP POLICY IF EXISTS "Anyone can insert AB test results" ON public.ab_test_results;
CREATE POLICY "Anyone can insert AB test results"
ON public.ab_test_results FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own AB test results" ON public.ab_test_results;
CREATE POLICY "Users can view their own AB test results"
ON public.ab_test_results FOR SELECT
USING (auth.uid() = user_id);

-- 5. CREATE HELPER VIEW
CREATE OR REPLACE VIEW public.ab_test_summary AS
SELECT
  test_name,
  variant,
  COUNT(*) as total_operations,
  AVG(execution_time_ms) as avg_execution_time_ms,
  MIN(execution_time_ms) as min_execution_time_ms,
  MAX(execution_time_ms) as max_execution_time_ms,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as error_count,
  (SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT * 100) as success_rate,
  MIN(created_at) as first_test_at,
  MAX(created_at) as last_test_at
FROM public.ab_test_results
GROUP BY test_name, variant
ORDER BY test_name, variant;

-- 6. GRANT PERMISSIONS
GRANT SELECT ON public.ab_test_summary TO authenticated;

-- 7. ADD COMMENTS
COMMENT ON TABLE public.ab_test_results IS 'A/B testing results for performance comparison';
COMMENT ON VIEW public.ab_test_summary IS 'Aggregated A/B test summary';

-- ============================================
-- ✅ DEPLOYMENT COMPLETE
-- ============================================
-- Run this verification query to check everything is deployed:
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('feature_flags', 'ab_test_results');
--
-- SELECT flag_key, flag_name, enabled, enabled_dev FROM feature_flags;
