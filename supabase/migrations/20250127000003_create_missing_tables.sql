-- =============================================================================
-- CREATE MISSING EGGER TABLES
-- Fix the 406 errors by creating missing tables
-- =============================================================================

-- Create egger_interior_matches table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.egger_interior_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT UNIQUE NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    interior_style TEXT NOT NULL,
    room_types TEXT[] NOT NULL DEFAULT '{}',
    color_palette TEXT[] NOT NULL DEFAULT '{}',
    design_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create egger_no_combinations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.egger_no_combinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT UNIQUE NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('unique_color', 'limited_availability', 'specialty_finish', 'new_product')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.egger_interior_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egger_no_combinations ENABLE ROW LEVEL SECURITY;

-- Add policies for new tables
CREATE POLICY "Public read access for egger_interior_matches" ON public.egger_interior_matches FOR SELECT USING (true);
CREATE POLICY "Public read access for egger_no_combinations" ON public.egger_no_combinations FOR SELECT USING (true);

CREATE POLICY "Public insert access for egger_interior_matches" ON public.egger_interior_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access for egger_no_combinations" ON public.egger_no_combinations FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for egger_interior_matches" ON public.egger_interior_matches FOR UPDATE USING (true);
CREATE POLICY "Public update access for egger_no_combinations" ON public.egger_no_combinations FOR UPDATE USING (true);

CREATE POLICY "Public delete access for egger_interior_matches" ON public.egger_interior_matches FOR DELETE USING (true);
CREATE POLICY "Public delete access for egger_no_combinations" ON public.egger_no_combinations FOR DELETE USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_egger_interior_matches_decor_id ON public.egger_interior_matches(decor_id);
CREATE INDEX IF NOT EXISTS idx_egger_no_combinations_decor_id ON public.egger_no_combinations(decor_id);

-- Success message
SELECT 'Missing EGGER tables created successfully! 🔧' as message;
