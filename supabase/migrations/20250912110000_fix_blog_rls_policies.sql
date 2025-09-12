-- Fix RLS policies for blog_posts to allow proper access

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can see their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "DEV+ tiers can see all posts" ON public.blog_posts;
DROP POLICY IF EXISTS "DEV+ tiers can create posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can update their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "DEV+ tiers can update any post" ON public.blog_posts;
DROP POLICY IF EXISTS "DEV+ tiers can delete posts" ON public.blog_posts;

-- Create simplified RLS policies

-- Allow everyone to read published posts
CREATE POLICY "Public can read published posts" ON public.blog_posts
    FOR SELECT USING (status = 'published');

-- Allow authenticated users to see their own posts (any status)
CREATE POLICY "Users can see own posts" ON public.blog_posts
    FOR SELECT USING (auth.uid() = author_id);

-- Allow authenticated users to create posts (they become the author)
CREATE POLICY "Authenticated users can create posts" ON public.blog_posts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid() = author_id
    );

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts" ON public.blog_posts
    FOR UPDATE USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete own posts" ON public.blog_posts
    FOR DELETE USING (auth.uid() = author_id);

-- Additional policies for GOD tier users (full access)
CREATE POLICY "GOD tier can see all posts" ON public.blog_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier = 'god'
        )
    );

CREATE POLICY "GOD tier can create any post" ON public.blog_posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier = 'god'
        )
    );

CREATE POLICY "GOD tier can update any post" ON public.blog_posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier = 'god'
        )
    );

CREATE POLICY "GOD tier can delete any post" ON public.blog_posts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier = 'god'
        )
    );

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Blog RLS policies updated successfully!';
    RAISE NOTICE 'Fixed authentication and tier-based access';
    RAISE NOTICE 'Users can now create, edit, and delete their own blog posts';
    RAISE NOTICE 'GOD tier users have full access to all posts';
END $$;
