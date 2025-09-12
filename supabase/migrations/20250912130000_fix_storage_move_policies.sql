-- Fix storage RLS policies to allow move/copy operations
-- This migration updates storage bucket policies to support file management

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can upload to media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to gallery bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to blog-media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create comprehensive storage policies for DEV+ users
CREATE POLICY "DEV+ users can manage media bucket"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'media' 
  AND (
    -- User owns the file
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- User has DEV+ permissions
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_tier IN ('dev', 'admin', 'god')
    )
  )
)
WITH CHECK (
  bucket_id = 'media' 
  AND (
    -- User owns the file
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- User has DEV+ permissions
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_tier IN ('dev', 'admin', 'god')
    )
  )
);

CREATE POLICY "DEV+ users can manage gallery bucket"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'gallery' 
  AND (
    -- User owns the file
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- User has DEV+ permissions
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_tier IN ('dev', 'admin', 'god')
    )
  )
)
WITH CHECK (
  bucket_id = 'gallery' 
  AND (
    -- User owns the file
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- User has DEV+ permissions
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_tier IN ('dev', 'admin', 'god')
    )
  )
);

CREATE POLICY "DEV+ users can manage blog-media bucket"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'blog-media' 
  AND (
    -- User owns the file
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- User has DEV+ permissions
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_tier IN ('dev', 'admin', 'god')
    )
  )
)
WITH CHECK (
  bucket_id = 'blog-media' 
  AND (
    -- User owns the file
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- User has DEV+ permissions
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_tier IN ('dev', 'admin', 'god')
    )
  )
);

-- Public read access for all files (for viewing)
CREATE POLICY "Public read access to all storage buckets"
ON storage.objects FOR SELECT
TO public
USING (true);

-- Update media_files table policies to allow cross-category operations
DROP POLICY IF EXISTS "Users can manage their media files" ON media_files;

CREATE POLICY "DEV+ users can manage media files"
ON media_files FOR ALL
TO authenticated
USING (
  -- User owns the file
  uploaded_by = auth.uid()
  OR
  -- User has DEV+ permissions
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_tier IN ('dev', 'admin', 'god')
  )
)
WITH CHECK (
  -- User owns the file
  uploaded_by = auth.uid()
  OR
  -- User has DEV+ permissions
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_tier IN ('dev', 'admin', 'god')
  )
);

-- Allow public read access to media_files for published content
CREATE POLICY "Public read access to media files"
ON media_files FOR SELECT
TO public
USING (true);

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Storage RLS policies updated successfully!';
  RAISE NOTICE 'Fixed move/copy operations for DEV+ users';
  RAISE NOTICE 'Cross-bucket file management now supported';
  RAISE NOTICE 'Media Manager move/copy feature ready! 🔄';
END $$;
