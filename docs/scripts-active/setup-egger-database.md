# EGGER Database Setup Instructions

## 🚀 Quick Setup

### Step 1: Run Database Migration
Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- =============================================================================
-- EGGER DATABASE SCHEMA
-- Create comprehensive EGGER materials database from Excel data
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. MAIN EGGER DECORS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.egger_decors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT UNIQUE NOT NULL,
    decor_name TEXT NOT NULL,
    decor TEXT NOT NULL,
    texture TEXT NOT NULL,
    product_page_url TEXT,
    description TEXT,
    category TEXT,
    color_family TEXT,
    finish_type TEXT,
    supplier_notes TEXT,
    cost_per_sqm DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. EGGER COMBINATIONS TABLE (One-to-Many with decors)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.egger_combinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    recommended_decor_id TEXT NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    match_type TEXT NOT NULL CHECK (match_type IN ('color', 'texture', 'style', 'complementary')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. EGGER AVAILABILITY TABLE (One-to-Many with decors)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.egger_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    product_type TEXT NOT NULL,
    availability_status TEXT NOT NULL CHECK (availability_status IN ('in_stock', 'limited', 'out_of_stock', 'discontinued')),
    lead_time_days INTEGER NOT NULL DEFAULT 0,
    minimum_order_quantity INTEGER,
    region TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 4. EGGER INTERIOR MATCHES TABLE (One-to-One with decors)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.egger_interior_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT UNIQUE NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    interior_style TEXT NOT NULL,
    room_types TEXT[] NOT NULL DEFAULT '{}',
    color_palette TEXT[] NOT NULL DEFAULT '{}',
    design_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 5. EGGER NO COMBINATIONS TABLE (Decors without combination data)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.egger_no_combinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT UNIQUE NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('unique_color', 'limited_availability', 'specialty_finish', 'new_product')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 6. EGGER IMAGES TABLE (One-to-Many with decors)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.egger_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT CHECK (image_type IN ('webp', 'png', 'jpg', 'jpeg')),
    width INTEGER,
    height INTEGER,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 7. EGGER CATEGORIES TABLE (Lookup table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.egger_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color_hex TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 8. EGGER TEXTURES TABLE (Lookup table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.egger_textures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 9. EGGER COLOR FAMILIES TABLE (Lookup table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.egger_color_families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    color_hex TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Main decor indexes
CREATE INDEX IF NOT EXISTS idx_egger_decors_decor_id ON public.egger_decors(decor_id);
CREATE INDEX IF NOT EXISTS idx_egger_decors_category ON public.egger_decors(category);
CREATE INDEX IF NOT EXISTS idx_egger_decors_texture ON public.egger_decors(texture);
CREATE INDEX IF NOT EXISTS idx_egger_decors_color_family ON public.egger_decors(color_family);
CREATE INDEX IF NOT EXISTS idx_egger_decors_finish_type ON public.egger_decors(finish_type);

-- Combination indexes
CREATE INDEX IF NOT EXISTS idx_egger_combinations_decor_id ON public.egger_combinations(decor_id);
CREATE INDEX IF NOT EXISTS idx_egger_combinations_recommended ON public.egger_combinations(recommended_decor_id);
CREATE INDEX IF NOT EXISTS idx_egger_combinations_match_type ON public.egger_combinations(match_type);

-- Availability indexes
CREATE INDEX IF NOT EXISTS idx_egger_availability_decor_id ON public.egger_availability(decor_id);
CREATE INDEX IF NOT EXISTS idx_egger_availability_status ON public.egger_availability(availability_status);
CREATE INDEX IF NOT EXISTS idx_egger_availability_product_type ON public.egger_availability(product_type);

-- Image indexes
CREATE INDEX IF NOT EXISTS idx_egger_images_decor_id ON public.egger_images(decor_id);
CREATE INDEX IF NOT EXISTS idx_egger_images_primary ON public.egger_images(decor_id, is_primary);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.egger_decors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egger_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egger_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egger_interior_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egger_no_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egger_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egger_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egger_textures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egger_color_families ENABLE ROW LEVEL SECURITY;

-- Public read access for all EGGER data
CREATE POLICY "Public read access for egger_decors" ON public.egger_decors FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_combinations" ON public.egger_combinations FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_availability" ON public.egger_availability FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_interior_matches" ON public.egger_interior_matches FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_no_combinations" ON public.egger_no_combinations FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_images" ON public.egger_images FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_categories" ON public.egger_categories FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_textures" ON public.egger_textures FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_color_families" ON public.egger_color_families FOR SELECT USING (true);

-- Public insert/update/delete access for all EGGER data
CREATE POLICY "Public insert access for egger_decors" ON public.egger_decors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_combinations" ON public.egger_combinations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_availability" ON public.egger_availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_interior_matches" ON public.egger_interior_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_no_combinations" ON public.egger_no_combinations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_images" ON public.egger_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_categories" ON public.egger_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_textures" ON public.egger_textures FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_color_families" ON public.egger_color_families FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for egger_decors" ON public.egger_decors FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_combinations" ON public.egger_combinations FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_availability" ON public.egger_availability FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_interior_matches" ON public.egger_interior_matches FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_no_combinations" ON public.egger_no_combinations FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_images" ON public.egger_images FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_categories" ON public.egger_categories FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_textures" ON public.egger_textures FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_color_families" ON public.egger_color_families FOR UPDATE USING (true);

CREATE POLICY "Public delete access for egger_decors" ON public.egger_decors FOR DELETE USING (true);
CREATE POLICY "Public delete access for egger_combinations" ON public.egger_combinations FOR DELETE USING (true);
CREATE POLICY "Public delete access for egger_availability" ON public.egger_availability FOR DELETE USING (true);
CREATE POLICY "Public delete access for egger_interior_matches" ON public.egger_interior_matches FOR DELETE USING (true);
CREATE POLICY "Public delete access for egger_no_combinations" ON public.egger_no_combinations FOR DELETE USING (true);
CREATE POLICY "Public delete access for egger_images" ON public.egger_images FOR DELETE USING (true);
CREATE POLICY "Public delete access for egger_categories" ON public.egger_categories FOR DELETE USING (true);
CREATE POLICY "Public delete access for egger_textures" ON public.egger_textures FOR DELETE USING (true);
CREATE POLICY "Public delete access for egger_color_families" ON public.egger_color_families FOR DELETE USING (true);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to main tables
CREATE TRIGGER update_egger_decors_updated_at 
    BEFORE UPDATE ON public.egger_decors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.egger_decors IS 'Main EGGER decor products with all basic information';
COMMENT ON TABLE public.egger_combinations IS 'Recommended color/material combinations between decors';
COMMENT ON TABLE public.egger_availability IS 'Product availability information by decor and product type';
COMMENT ON TABLE public.egger_interior_matches IS 'Interior design matching data for each decor';
COMMENT ON TABLE public.egger_no_combinations IS 'Decors that have no recommended combinations';
COMMENT ON TABLE public.egger_images IS 'Product images for each decor';
COMMENT ON TABLE public.egger_categories IS 'Lookup table for decor categories';
COMMENT ON TABLE public.egger_textures IS 'Lookup table for texture types';
COMMENT ON TABLE public.egger_color_families IS 'Lookup table for color families';

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'EGGER Database Schema Created Successfully! 🎨';
    RAISE NOTICE 'Tables: egger_decors, egger_combinations, egger_availability, egger_interior_matches, egger_no_combinations, egger_images, egger_categories, egger_textures, egger_color_families';
    RAISE NOTICE 'Ready for Excel data import! 📊';
END $$;
```

### Step 2: Add Sample Data
After running the migration, run this command:

```bash
node scripts/add-sample-data.js
```

### Step 3: Test the Database
Verify everything is working:

```bash
node scripts/test-egger-database.js
```

### Step 4: Test the Enhanced Gallery
Visit `/egger-boards` in your browser to see the enhanced EGGER gallery with database integration!

## 🎯 What You'll Get

- **9 Database Tables** with proper relationships
- **Enhanced Product Cards** showing combinations, availability, and pricing
- **Real-time Data** from Supabase instead of static CSV files
- **Advanced Search & Filtering** capabilities
- **Professional UI** with data source indicators
- **Fallback Support** to CSV files if database is unavailable

## 🔧 Troubleshooting

If you encounter any issues:

1. **RLS Policy Errors**: Make sure you ran the complete migration SQL above
2. **Connection Issues**: Check your `.env` file has correct Supabase credentials
3. **Empty Database**: Run the sample data script after the migration
4. **TypeScript Errors**: The service is fully typed and should work out of the box

## 📊 Next Steps

Once the database is set up, you can:

1. **Import your Excel data** using the import script
2. **Customize the UI** in the enhanced gallery components
3. **Add more features** like advanced filtering and sorting
4. **Scale to production** with proper authentication and user management
