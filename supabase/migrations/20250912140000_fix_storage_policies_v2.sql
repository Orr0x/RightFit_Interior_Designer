-- Fix storage policies with a simpler approach
-- This migration simplifies the RLS policies to work with move/copy operations

-- Drop all existing storage policies to start fresh
DROP POLICY IF EXISTS "DEV+ users can manage media bucket" ON storage.objects;
DROP POLICY IF EXISTS "DEV+ users can manage gallery bucket" ON storage.objects;
DROP POLICY IF EXISTS "DEV+ users can manage blog-media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to all storage buckets" ON storage.objects;

-- Create simplified policies that work with Supabase storage operations
CREATE POLICY "Authenticated users can manage their files"
ON storage.objects FOR ALL
TO authenticated
USING (
  -- Allow if user owns the file (path starts with their user ID)
  (storage.foldername(name))[1] = auth.uid()::text
  OR
  -- Allow DEV+ users to manage any file
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_tier IN ('dev', 'admin', 'god')
  )
)
WITH CHECK (
  -- Allow if user owns the file (path starts with their user ID)
  (storage.foldername(name))[1] = auth.uid()::text
  OR
  -- Allow DEV+ users to manage any file
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_tier IN ('dev', 'admin', 'god')
  )
);

-- Public read access for all files
CREATE POLICY "Public can view all files"
ON storage.objects FOR SELECT
TO public
USING (true);

-- Also ensure the media_files table has the right policies
DROP POLICY IF EXISTS "DEV+ users can manage media files" ON media_files;
DROP POLICY IF EXISTS "Public read access to media files" ON media_files;

CREATE POLICY "Users can manage their media files"
ON media_files FOR ALL
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_tier IN ('dev', 'admin', 'god')
  )
)
WITH CHECK (
  uploaded_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_tier IN ('dev', 'admin', 'god')
  )
);

CREATE POLICY "Public can view media files"
ON media_files FOR SELECT
TO public
USING (true);

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Storage policies simplified and fixed!';
  RAISE NOTICE 'Move/copy operations should now work properly';
  RAISE NOTICE 'All authenticated users can manage their own files';
  RAISE NOTICE 'DEV+ users have full access to all files';
  RAISE NOTICE 'Ready for testing! 🔄';
END $$;
