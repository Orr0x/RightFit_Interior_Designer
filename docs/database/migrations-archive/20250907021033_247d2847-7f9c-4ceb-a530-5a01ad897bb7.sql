-- Fix RLS policy for profiles table to restrict visibility to profile owner only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add optional public_profile field for users who want to make their profile visible
ALTER TABLE public.profiles 
ADD COLUMN public_profile boolean DEFAULT false;

-- Create policy for public profiles (optional - users can opt-in)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (public_profile = true);