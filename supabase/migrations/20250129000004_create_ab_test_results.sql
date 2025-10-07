-- A/B Testing Results Table Migration
-- Purpose: Track and compare legacy vs new implementation performance
-- Created: January 2025

-- ============================================
-- 1. CREATE AB TEST RESULTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Test identification
  test_name VARCHAR(200) NOT NULL,
  user_id UUID,
  session_id UUID,
  variant VARCHAR(50) NOT NULL CHECK (variant IN ('legacy', 'new')),

  -- Performance metrics
  operation VARCHAR(100) NOT NULL,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Context information
  component_type VARCHAR(50),
  view_type VARCHAR(50),
  metadata JSONB,

  -- Environment
  environment VARCHAR(20) DEFAULT 'production',

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_name ON public.ab_test_results(test_name);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant ON public.ab_test_results(test_name, variant);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_created_at ON public.ab_test_results(created_at);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_user_id ON public.ab_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_success ON public.ab_test_results(test_name, variant, success);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Anyone can insert test results (for client-side logging)
CREATE POLICY "Anyone can insert AB test results"
ON public.ab_test_results FOR INSERT
WITH CHECK (true);

-- Only admins can view all test results
CREATE POLICY "Admins can view all AB test results"
ON public.ab_test_results FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE god_mode = true
  )
);

-- Users can view their own test results
CREATE POLICY "Users can view their own AB test results"
ON public.ab_test_results FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE HELPER VIEW FOR ANALYSIS
-- ============================================

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

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON public.ab_test_summary TO authenticated;

-- ============================================
-- 7. ADD HELPFUL COMMENTS
-- ============================================

COMMENT ON TABLE public.ab_test_results IS 'A/B testing results for comparing legacy vs new implementation performance';
COMMENT ON COLUMN public.ab_test_results.test_name IS 'Name of the A/B test (e.g., positioning_calculation)';
COMMENT ON COLUMN public.ab_test_results.variant IS 'Which variant was tested: legacy or new';
COMMENT ON COLUMN public.ab_test_results.operation IS 'Specific operation being tested (e.g., calculate_position, drop_component)';
COMMENT ON COLUMN public.ab_test_results.execution_time_ms IS 'Time taken to execute the operation in milliseconds';
COMMENT ON COLUMN public.ab_test_results.metadata IS 'Additional context about the test (room dimensions, component type, etc.)';

COMMENT ON VIEW public.ab_test_summary IS 'Aggregated A/B test results summary for analysis';
