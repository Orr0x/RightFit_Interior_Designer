-- Enable New Positioning System Feature Flag
-- Phase 1.5 Step 1: Enable the new unified coordinate system
-- This migration enables the use_new_positioning_system feature flag

UPDATE public.feature_flags
SET
  enabled = true,
  rollout_percentage = 100,
  test_status = 'testing',
  updated_at = NOW()
WHERE flag_key = 'use_new_positioning_system';

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'Feature flag "use_new_positioning_system" has been enabled';
  RAISE NOTICE 'This enables the unified coordinate system for all views';
  RAISE NOTICE 'Rollout: 100%% of users';
END $$;
