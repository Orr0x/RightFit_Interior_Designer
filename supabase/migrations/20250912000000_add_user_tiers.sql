-- User Tier System Implementation
-- Add user tier support with enhanced tier structure

-- Add user_tier column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'free';

-- Update all existing users to GOD tier (grandfathered access)
UPDATE public.profiles 
SET user_tier = 'god' 
WHERE user_tier IS NULL OR user_tier = 'free';

-- Add constraint for valid user tiers
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS check_user_tier;

ALTER TABLE public.profiles 
ADD CONSTRAINT check_user_tier 
CHECK (user_tier IN (
  'guest',     -- Unlogged users - session only
  'free',      -- Basic registered users  
  'basic',     -- Limited premium features
  'standard',  -- More premium features
  'pro',       -- Full design suite
  'dev',       -- Git UI + dev tools
  'admin',     -- Full system access
  'god'        -- No restrictions whatsoever
));

-- Create index for performance on tier queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_tier ON public.profiles(user_tier);

-- Add tier-based RLS policies for future use
-- Note: Existing RLS policies will be updated in application code

-- Create a function to check user tier level
CREATE OR REPLACE FUNCTION public.get_tier_level(tier_name TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE tier_name
    WHEN 'guest' THEN RETURN 1;
    WHEN 'free' THEN RETURN 2;
    WHEN 'basic' THEN RETURN 3;
    WHEN 'standard' THEN RETURN 4;
    WHEN 'pro' THEN RETURN 5;
    WHEN 'dev' THEN RETURN 6;
    WHEN 'admin' THEN RETURN 7;
    WHEN 'god' THEN RETURN 8;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to check if user has required tier level
CREATE OR REPLACE FUNCTION public.user_has_tier_level(user_id UUID, required_tier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier_level INTEGER;
  required_tier_level INTEGER;
BEGIN
  -- Get user's tier level
  SELECT public.get_tier_level(user_tier) INTO user_tier_level
  FROM public.profiles 
  WHERE profiles.user_id = user_has_tier_level.user_id;
  
  -- Get required tier level
  SELECT public.get_tier_level(required_tier) INTO required_tier_level;
  
  -- Return true if user tier is >= required tier
  RETURN COALESCE(user_tier_level, 0) >= COALESCE(required_tier_level, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.user_tier IS 'User tier level: guest, free, basic, standard, pro, dev, admin, god';
COMMENT ON FUNCTION public.get_tier_level(TEXT) IS 'Returns numeric level for tier comparison';
COMMENT ON FUNCTION public.user_has_tier_level(UUID, TEXT) IS 'Checks if user meets minimum tier requirement';

-- Log the migration completion
DO $$
DECLARE
  god_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO god_user_count 
  FROM public.profiles 
  WHERE user_tier = 'god';
  
  RAISE NOTICE 'User tier migration completed successfully';
  RAISE NOTICE 'Existing users granted GOD tier: %', god_user_count;
END $$;
