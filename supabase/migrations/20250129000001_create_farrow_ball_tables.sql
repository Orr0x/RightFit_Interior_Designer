-- =============================================================================
-- CREATE FARROW & BALL FINISHES DATABASE SCHEMA
-- Professional paint colors with comprehensive data from scraped Farrow & Ball
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. FARROW & BALL FINISHES TABLE (Main table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.farrow_ball_finishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finish_id TEXT UNIQUE NOT NULL, -- e.g., 'acid-drop-9908'
    color_name TEXT NOT NULL, -- 'Acid Drop'
    color_number TEXT NOT NULL, -- '9908'
    product_url TEXT,
    title TEXT,
    description TEXT,
    main_color_rgb TEXT, -- 'rgb(193, 195, 101)'
    main_color_hex TEXT, -- '#C1C365'
    recommended_primer TEXT,
    complementary_color TEXT,
    key_features JSONB, -- Array of features
    available_finishes JSONB, -- Array of finish types
    room_categories JSONB, -- Array of room types
    price_info TEXT,
    availability TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. FARROW & BALL COLOR SCHEMES TABLE (One-to-Many with finishes)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.farrow_ball_color_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finish_id TEXT NOT NULL REFERENCES public.farrow_ball_finishes(finish_id) ON DELETE CASCADE,
    rgb TEXT NOT NULL,
    hex TEXT NOT NULL,
    color_type TEXT NOT NULL, -- 'base', 'accent', 'trim'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. FARROW & BALL IMAGES TABLE (One-to-Many with finishes)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.farrow_ball_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finish_id TEXT NOT NULL REFERENCES public.farrow_ball_finishes(finish_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT DEFAULT 'product', -- 'product', 'swatch', 'room'
    image_order INTEGER DEFAULT 0,
    is_main_image BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 4. FARROW & BALL CATEGORIES TABLE (Lookup table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.farrow_ball_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 5. FARROW & BALL COLOR FAMILIES TABLE (Lookup table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.farrow_ball_color_families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Main finishes table indexes
CREATE INDEX IF NOT EXISTS idx_farrow_ball_finishes_finish_id 
ON public.farrow_ball_finishes(finish_id);

CREATE INDEX IF NOT EXISTS idx_farrow_ball_finishes_color_name 
ON public.farrow_ball_finishes(color_name);

CREATE INDEX IF NOT EXISTS idx_farrow_ball_finishes_color_number 
ON public.farrow_ball_finishes(color_number);

CREATE INDEX IF NOT EXISTS idx_farrow_ball_finishes_main_color_hex 
ON public.farrow_ball_finishes(main_color_hex);

-- Color schemes table indexes
CREATE INDEX IF NOT EXISTS idx_farrow_ball_color_schemes_finish_id 
ON public.farrow_ball_color_schemes(finish_id);

CREATE INDEX IF NOT EXISTS idx_farrow_ball_color_schemes_color_type 
ON public.farrow_ball_color_schemes(color_type);

-- Images table indexes
CREATE INDEX IF NOT EXISTS idx_farrow_ball_images_finish_id 
ON public.farrow_ball_images(finish_id);

CREATE INDEX IF NOT EXISTS idx_farrow_ball_images_main_image 
ON public.farrow_ball_images(finish_id, is_main_image) 
WHERE is_main_image = true;

-- Categories and families indexes
CREATE INDEX IF NOT EXISTS idx_farrow_ball_categories_name 
ON public.farrow_ball_categories(category_name);

CREATE INDEX IF NOT EXISTS idx_farrow_ball_color_families_name 
ON public.farrow_ball_color_families(family_name);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.farrow_ball_finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farrow_ball_color_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farrow_ball_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farrow_ball_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farrow_ball_color_families ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read access for farrow_ball_finishes" 
ON public.farrow_ball_finishes FOR SELECT 
USING (true);

CREATE POLICY "Public read access for farrow_ball_color_schemes" 
ON public.farrow_ball_color_schemes FOR SELECT 
USING (true);

CREATE POLICY "Public read access for farrow_ball_images" 
ON public.farrow_ball_images FOR SELECT 
USING (true);

CREATE POLICY "Public read access for farrow_ball_categories" 
ON public.farrow_ball_categories FOR SELECT 
USING (true);

CREATE POLICY "Public read access for farrow_ball_color_families" 
ON public.farrow_ball_color_families FOR SELECT 
USING (true);

-- Public insert access (for data import)
CREATE POLICY "Public insert access for farrow_ball_finishes" 
ON public.farrow_ball_finishes FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public insert access for farrow_ball_color_schemes" 
ON public.farrow_ball_color_schemes FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public insert access for farrow_ball_images" 
ON public.farrow_ball_images FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public insert access for farrow_ball_categories" 
ON public.farrow_ball_categories FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public insert access for farrow_ball_color_families" 
ON public.farrow_ball_color_families FOR INSERT 
WITH CHECK (true);

-- Public update access (for data management)
CREATE POLICY "Public update access for farrow_ball_finishes" 
ON public.farrow_ball_finishes FOR UPDATE 
USING (true);

CREATE POLICY "Public update access for farrow_ball_color_schemes" 
ON public.farrow_ball_color_schemes FOR UPDATE 
USING (true);

CREATE POLICY "Public update access for farrow_ball_images" 
ON public.farrow_ball_images FOR UPDATE 
USING (true);

CREATE POLICY "Public update access for farrow_ball_categories" 
ON public.farrow_ball_categories FOR UPDATE 
USING (true);

CREATE POLICY "Public update access for farrow_ball_color_families" 
ON public.farrow_ball_color_families FOR UPDATE 
USING (true);

-- Public delete access (for data management)
CREATE POLICY "Public delete access for farrow_ball_finishes" 
ON public.farrow_ball_finishes FOR DELETE 
USING (true);

CREATE POLICY "Public delete access for farrow_ball_color_schemes" 
ON public.farrow_ball_color_schemes FOR DELETE 
USING (true);

CREATE POLICY "Public delete access for farrow_ball_images" 
ON public.farrow_ball_images FOR DELETE 
USING (true);

CREATE POLICY "Public delete access for farrow_ball_categories" 
ON public.farrow_ball_categories FOR DELETE 
USING (true);

CREATE POLICY "Public delete access for farrow_ball_color_families" 
ON public.farrow_ball_color_families FOR DELETE 
USING (true);

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_farrow_ball_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_update_farrow_ball_finishes_updated_at
    BEFORE UPDATE ON public.farrow_ball_finishes
    FOR EACH ROW
    EXECUTE FUNCTION update_farrow_ball_updated_at();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.farrow_ball_finishes IS 'Main Farrow & Ball finishes table with comprehensive color data';
COMMENT ON COLUMN public.farrow_ball_finishes.finish_id IS 'Unique identifier for the finish (e.g., acid-drop-9908)';
COMMENT ON COLUMN public.farrow_ball_finishes.color_name IS 'Display name of the color (e.g., Acid Drop)';
COMMENT ON COLUMN public.farrow_ball_finishes.color_number IS 'Farrow & Ball color number (e.g., 9908)';
COMMENT ON COLUMN public.farrow_ball_finishes.main_color_hex IS 'Primary color in hex format (e.g., #C1C365)';
COMMENT ON COLUMN public.farrow_ball_finishes.key_features IS 'Array of key features as JSONB';
COMMENT ON COLUMN public.farrow_ball_finishes.available_finishes IS 'Array of available finish types as JSONB';

COMMENT ON TABLE public.farrow_ball_color_schemes IS 'Color schemes and palette colors for each finish';
COMMENT ON COLUMN public.farrow_ball_color_schemes.color_type IS 'Type of color: base, accent, or trim';

COMMENT ON TABLE public.farrow_ball_images IS 'Product images for each finish';
COMMENT ON COLUMN public.farrow_ball_images.is_main_image IS 'True if this is the main product image';

COMMENT ON TABLE public.farrow_ball_categories IS 'Lookup table for color categories';
COMMENT ON TABLE public.farrow_ball_color_families IS 'Lookup table for color families';

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Farrow & Ball Database Schema Created Successfully! 🎨';
    RAISE NOTICE 'Tables: farrow_ball_finishes, farrow_ball_color_schemes, farrow_ball_images, farrow_ball_categories, farrow_ball_color_families';
    RAISE NOTICE 'Ready for data import! 📊';
END $$;
