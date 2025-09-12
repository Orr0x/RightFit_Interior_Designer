-- Create blog_posts table for the Blog Manager
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
    publish_date TIMESTAMPTZ,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    featured_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger for blog_posts
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_posts_updated_at();

-- Enable RLS on blog_posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts

-- Allow authenticated users to read published posts
CREATE POLICY "Anyone can read published blog posts" ON public.blog_posts
    FOR SELECT USING (status = 'published');

-- Allow authors to see their own posts (any status)
CREATE POLICY "Authors can see their own posts" ON public.blog_posts
    FOR SELECT USING (auth.uid() = author_id);

-- Allow DEV+ tiers to see all posts (for management)
CREATE POLICY "DEV+ tiers can see all posts" ON public.blog_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier IN ('dev', 'admin', 'god')
        )
    );

-- Allow DEV+ tiers to insert posts
CREATE POLICY "DEV+ tiers can create posts" ON public.blog_posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier IN ('dev', 'admin', 'god')
        )
    );

-- Allow authors to update their own posts
CREATE POLICY "Authors can update their own posts" ON public.blog_posts
    FOR UPDATE USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- Allow DEV+ tiers to update any post
CREATE POLICY "DEV+ tiers can update any post" ON public.blog_posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier IN ('dev', 'admin', 'god')
        )
    );

-- Allow DEV+ tiers to delete posts
CREATE POLICY "DEV+ tiers can delete posts" ON public.blog_posts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier IN ('dev', 'admin', 'god')
        )
    );

-- Create indexes for performance
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_publish_date ON public.blog_posts(publish_date);
CREATE INDEX idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_tags ON public.blog_posts USING GIN(tags);

-- Create blog_categories table for organization
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on blog_categories
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read categories
CREATE POLICY "Anyone can read blog categories" ON public.blog_categories
    FOR SELECT USING (true);

-- Allow DEV+ tiers to manage categories
CREATE POLICY "DEV+ tiers can manage categories" ON public.blog_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier IN ('dev', 'admin', 'god')
        )
    );

-- Junction table for blog post categories (many-to-many)
CREATE TABLE IF NOT EXISTS public.blog_post_categories (
    blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.blog_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_post_id, category_id)
);

-- Enable RLS on blog_post_categories
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;

-- Allow reading category associations for published posts
CREATE POLICY "Anyone can read published post categories" ON public.blog_post_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.blog_posts
            WHERE blog_posts.id = blog_post_id
            AND blog_posts.status = 'published'
        )
    );

-- Allow DEV+ tiers to manage post categories
CREATE POLICY "DEV+ tiers can manage post categories" ON public.blog_post_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_tier IN ('dev', 'admin', 'god')
        )
    );

-- Insert some default categories
INSERT INTO public.blog_categories (name, slug, description, color) VALUES
('Kitchen Design', 'kitchen-design', 'Tips and trends for kitchen renovations', '#10B981'),
('Bathroom Renovation', 'bathroom-renovation', 'Bathroom design and renovation guides', '#3B82F6'),
('Home Improvement', 'home-improvement', 'General home improvement advice', '#8B5CF6'),
('Design Trends', 'design-trends', 'Latest trends in interior design', '#F59E0B'),
('DIY Projects', 'diy-projects', 'Do-it-yourself project guides', '#EF4444')
ON CONFLICT (slug) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Blog system created successfully!';
    RAISE NOTICE 'Tables created: blog_posts, blog_categories, blog_post_categories';
    RAISE NOTICE 'RLS policies configured for tier-based access';
    RAISE NOTICE 'Default categories inserted';
    RAISE NOTICE 'Ready for Blog Manager integration!';
END $$;
