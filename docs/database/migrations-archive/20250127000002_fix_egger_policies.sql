-- =============================================================================
-- FIX EGGER POLICIES - Handle existing policies gracefully
-- =============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for egger_decors" ON public.egger_decors;
DROP POLICY IF EXISTS "Public read access for egger_combinations" ON public.egger_combinations;
DROP POLICY IF EXISTS "Public read access for egger_availability" ON public.egger_availability;
DROP POLICY IF EXISTS "Public read access for egger_interior_matches" ON public.egger_interior_matches;
DROP POLICY IF EXISTS "Public read access for egger_no_combinations" ON public.egger_no_combinations;
DROP POLICY IF EXISTS "Public read access for egger_images" ON public.egger_images;
DROP POLICY IF EXISTS "Public read access for egger_categories" ON public.egger_categories;
DROP POLICY IF EXISTS "Public read access for egger_textures" ON public.egger_textures;
DROP POLICY IF EXISTS "Public read access for egger_color_families" ON public.egger_color_families;

DROP POLICY IF EXISTS "Public insert access for egger_decors" ON public.egger_decors;
DROP POLICY IF EXISTS "Public insert access for egger_combinations" ON public.egger_combinations;
DROP POLICY IF EXISTS "Public insert access for egger_availability" ON public.egger_availability;
DROP POLICY IF EXISTS "Public insert access for egger_interior_matches" ON public.egger_interior_matches;
DROP POLICY IF EXISTS "Public insert access for egger_no_combinations" ON public.egger_no_combinations;
DROP POLICY IF EXISTS "Public insert access for egger_images" ON public.egger_images;
DROP POLICY IF EXISTS "Public insert access for egger_categories" ON public.egger_categories;
DROP POLICY IF EXISTS "Public insert access for egger_textures" ON public.egger_textures;
DROP POLICY IF EXISTS "Public insert access for egger_color_families" ON public.egger_color_families;

DROP POLICY IF EXISTS "Public update access for egger_decors" ON public.egger_decors;
DROP POLICY IF EXISTS "Public update access for egger_combinations" ON public.egger_combinations;
DROP POLICY IF EXISTS "Public update access for egger_availability" ON public.egger_availability;
DROP POLICY IF EXISTS "Public update access for egger_interior_matches" ON public.egger_interior_matches;
DROP POLICY IF EXISTS "Public update access for egger_no_combinations" ON public.egger_no_combinations;
DROP POLICY IF EXISTS "Public update access for egger_images" ON public.egger_images;
DROP POLICY IF EXISTS "Public update access for egger_categories" ON public.egger_categories;
DROP POLICY IF EXISTS "Public update access for egger_textures" ON public.egger_textures;
DROP POLICY IF EXISTS "Public update access for egger_color_families" ON public.egger_color_families;

DROP POLICY IF EXISTS "Public delete access for egger_decors" ON public.egger_decors;
DROP POLICY IF EXISTS "Public delete access for egger_combinations" ON public.egger_combinations;
DROP POLICY IF EXISTS "Public delete access for egger_availability" ON public.egger_availability;
DROP POLICY IF EXISTS "Public delete access for egger_interior_matches" ON public.egger_interior_matches;
DROP POLICY IF EXISTS "Public delete access for egger_no_combinations" ON public.egger_no_combinations;
DROP POLICY IF EXISTS "Public delete access for egger_images" ON public.egger_images;
DROP POLICY IF EXISTS "Public delete access for egger_categories" ON public.egger_categories;
DROP POLICY IF EXISTS "Public delete access for egger_textures" ON public.egger_textures;
DROP POLICY IF EXISTS "Public delete access for egger_color_families" ON public.egger_color_families;

-- Recreate all policies
CREATE POLICY "Public read access for egger_decors" ON public.egger_decors FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_combinations" ON public.egger_combinations FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_availability" ON public.egger_availability FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_interior_matches" ON public.egger_interior_matches FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_no_combinations" ON public.egger_no_combinations FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_images" ON public.egger_images FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_categories" ON public.egger_categories FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_textures" ON public.egger_textures FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_color_families" ON public.egger_color_families FOR SELECT USING (true);

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
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'EGGER Database Policies Fixed Successfully! 🔧';
    RAISE NOTICE 'All policies recreated without conflicts';
    RAISE NOTICE 'Ready for data import! 📊';
END $$;
