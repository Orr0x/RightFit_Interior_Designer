-- Create storage buckets for Media Manager
-- This sets up organized file storage with proper security policies

-- Create the main media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    52428800, -- 50MB limit per file
    ARRAY[
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'video/mp4',
        'video/mov',
        'video/avi',
        'video/webm',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ]
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create gallery-specific bucket for project showcases
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'gallery',
    'gallery',
    true,
    52428800, -- 50MB limit per file
    ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ]
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create blog-specific bucket for blog media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'blog-media',
    'blog-media', 
    true,
    52428800, -- 50MB limit per file
    ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm'
    ]
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for 'media' bucket

-- Allow public viewing of all files in media bucket
CREATE POLICY "Public can view media files" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated users to upload to media bucket
CREATE POLICY "Authenticated users can upload media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'media' 
        AND auth.uid() IS NOT NULL
    );

-- Allow users to update their own files (based on user_id in file path)
CREATE POLICY "Users can update own media files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow DEV+ tiers to manage any media files
CREATE POLICY "DEV+ tiers can manage all media" ON storage.objects
    FOR ALL USING (
        bucket_id = 'media' 
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier IN ('dev', 'admin', 'god')
        )
    );

-- Storage policies for 'gallery' bucket

-- Allow public viewing of gallery files
CREATE POLICY "Public can view gallery files" ON storage.objects
    FOR SELECT USING (bucket_id = 'gallery');

-- Allow DEV+ tiers to manage gallery files
CREATE POLICY "DEV+ tiers can manage gallery files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'gallery' 
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier IN ('dev', 'admin', 'god')
        )
    );

-- Storage policies for 'blog-media' bucket

-- Allow public viewing of blog media files
CREATE POLICY "Public can view blog media files" ON storage.objects
    FOR SELECT USING (bucket_id = 'blog-media');

-- Allow DEV+ tiers to manage blog media files
CREATE POLICY "DEV+ tiers can manage blog media files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'blog-media' 
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier IN ('dev', 'admin', 'god')
        )
    );

-- Create a table to track media file metadata
CREATE TABLE IF NOT EXISTS public.media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    bucket_id TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'gallery', 'blog', 'assets')),
    alt_text TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on media_files table
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- Allow public reading of media file metadata
CREATE POLICY "Public can read media file metadata" ON public.media_files
    FOR SELECT USING (true);

-- Allow authenticated users to insert media file records
CREATE POLICY "Authenticated users can create media records" ON public.media_files
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own media file records
CREATE POLICY "Users can update own media records" ON public.media_files
    FOR UPDATE USING (auth.uid() = uploaded_by);

-- Allow DEV+ tiers to manage all media file records
CREATE POLICY "DEV+ tiers can manage all media records" ON public.media_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier IN ('dev', 'admin', 'god')
        )
    );

-- Create indexes for performance
CREATE INDEX idx_media_files_bucket_category ON public.media_files(bucket_id, category);
CREATE INDEX idx_media_files_uploaded_by ON public.media_files(uploaded_by);
CREATE INDEX idx_media_files_created_at ON public.media_files(created_at DESC);

-- Create updated_at trigger for media_files
CREATE OR REPLACE FUNCTION update_media_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_files_updated_at
    BEFORE UPDATE ON public.media_files
    FOR EACH ROW
    EXECUTE FUNCTION update_media_files_updated_at();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Storage buckets created successfully!';
    RAISE NOTICE 'Buckets: media (50MB), gallery (50MB), blog-media (50MB)';
    RAISE NOTICE 'File types: Images, Videos, Documents supported';
    RAISE NOTICE 'Security: Tier-based upload permissions configured';
    RAISE NOTICE 'Metadata: media_files table created for file tracking';
    RAISE NOTICE 'Ready for Media Manager integration! 📸';
END $$;
