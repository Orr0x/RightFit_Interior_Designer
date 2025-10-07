-- =============================================================================
-- ADD MISSING COLUMNS FOR REAL SPREADSHEET DATA
-- Based on analysis of the actual spreadsheet structure
-- =============================================================================

-- Add colour_character_text column to egger_decors
ALTER TABLE public.egger_decors
ADD COLUMN IF NOT EXISTS colour_character_text TEXT;

-- Add colour_character_title column to egger_decors
ALTER TABLE public.egger_decors
ADD COLUMN IF NOT EXISTS colour_character_title TEXT;

-- Add combination_details column to egger_combinations for storing full details
ALTER TABLE public.egger_combinations
ADD COLUMN IF NOT EXISTS combination_details JSONB;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_egger_decors_colour_character_text
ON public.egger_decors(colour_character_text);

CREATE INDEX IF NOT EXISTS idx_egger_decors_colour_character_title
ON public.egger_decors(colour_character_title);

-- Success message
SELECT 'Added missing columns for real spreadsheet data! 🔧' as message;
