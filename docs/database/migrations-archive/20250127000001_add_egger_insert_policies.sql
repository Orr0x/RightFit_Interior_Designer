-- =============================================================================
-- EGGER DATABASE INSERT POLICIES
-- Add INSERT policies to allow data insertion for EGGER tables
-- =============================================================================

-- Add INSERT policies for all EGGER tables
CREATE POLICY "Public insert access for egger_decors" ON public.egger_decors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_combinations" ON public.egger_combinations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_availability" ON public.egger_availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_interior_matches" ON public.egger_interior_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_no_combinations" ON public.egger_no_combinations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_images" ON public.egger_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_categories" ON public.egger_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_textures" ON public.egger_textures FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_color_families" ON public.egger_color_families FOR INSERT WITH CHECK (true);

-- Add UPDATE policies for all EGGER tables
CREATE POLICY "Public update access for egger_decors" ON public.egger_decors FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_combinations" ON public.egger_combinations FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_availability" ON public.egger_availability FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_interior_matches" ON public.egger_interior_matches FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_no_combinations" ON public.egger_no_combinations FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_images" ON public.egger_images FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_categories" ON public.egger_categories FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_textures" ON public.egger_textures FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_color_families" ON public.egger_color_families FOR UPDATE USING (true);

-- Add DELETE policies for all EGGER tables
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
    RAISE NOTICE 'EGGER Database INSERT/UPDATE/DELETE Policies Added Successfully! 🔓';
    RAISE NOTICE 'All EGGER tables now support full CRUD operations';
    RAISE NOTICE 'Ready for data import! 📊';
END $$;
