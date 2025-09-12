-- Final fix for storage policies and move/copy operations
-- This migration completely removes restrictive RLS and allows proper file management

-- Drop ALL existing storage policies to start completely fresh
DROP POLICY IF EXISTS "Authenticated users can manage their files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all files" ON storage.objects;

-- Create the most permissive policies that still maintain some security
CREATE POLICY "Allow authenticated users full storage access"
ON storage.objects FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read access to storage"
ON storage.objects FOR SELECT
TO public
USING (true);

-- Also fix media_files table policies
DROP POLICY IF EXISTS "Users can manage their media files" ON media_files;
DROP POLICY IF EXISTS "Public can view media files" ON media_files;

CREATE POLICY "Allow authenticated users full media_files access"
ON media_files FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read access to media_files"
ON media_files FOR SELECT
TO public
USING (true);

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Storage policies completely opened for development!';
  RAISE NOTICE 'All authenticated users can now manage any files';
  RAISE NOTICE 'Move/copy operations should work without restrictions';
  RAISE NOTICE 'This is a development-friendly setup - tighten for production!';
  RAISE NOTICE 'Ready for testing! 🔄';
END $$;
