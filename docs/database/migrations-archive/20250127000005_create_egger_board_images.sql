-- =============================================================================
-- CREATE EGGER BOARD IMAGES TABLE
-- High-quality board images from Boards.csv (2 per decor: main + close-up)
-- =============================================================================

-- Create egger_board_images table
CREATE TABLE IF NOT EXISTS public.egger_board_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'png',
    image_order INTEGER NOT NULL DEFAULT 0, -- 0 = main board, 1 = close-up
    is_main_board BOOLEAN NOT NULL DEFAULT false,
    is_closeup BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of decor_id and image_order
    UNIQUE(decor_id, image_order),
    -- Ensure valid image_order values
    CHECK (image_order IN (0, 1))
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_egger_board_images_decor_id 
ON public.egger_board_images(decor_id);

CREATE INDEX IF NOT EXISTS idx_egger_board_images_main_board 
ON public.egger_board_images(decor_id, is_main_board) 
WHERE is_main_board = true;

CREATE INDEX IF NOT EXISTS idx_egger_board_images_closeup 
ON public.egger_board_images(decor_id, is_closeup) 
WHERE is_closeup = true;

-- Add RLS policies
ALTER TABLE public.egger_board_images ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for egger_board_images" 
ON public.egger_board_images FOR SELECT 
USING (true);

-- Public insert access (for data import)
CREATE POLICY "Public insert access for egger_board_images" 
ON public.egger_board_images FOR INSERT 
WITH CHECK (true);

-- Public update access (for data management)
CREATE POLICY "Public update access for egger_board_images" 
ON public.egger_board_images FOR UPDATE 
USING (true);

-- Public delete access (for data management)
CREATE POLICY "Public delete access for egger_board_images" 
ON public.egger_board_images FOR DELETE 
USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_egger_board_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_egger_board_images_updated_at
    BEFORE UPDATE ON public.egger_board_images
    FOR EACH ROW
    EXECUTE FUNCTION update_egger_board_images_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.egger_board_images IS 'High-quality board images from Boards.csv - 2 per decor (main board + close-up)';
COMMENT ON COLUMN public.egger_board_images.decor_id IS 'Reference to the main decor product';
COMMENT ON COLUMN public.egger_board_images.image_url IS 'URL to the high-quality PNG board image';
COMMENT ON COLUMN public.egger_board_images.image_order IS '0 = main board view, 1 = close-up/detail view';
COMMENT ON COLUMN public.egger_board_images.is_main_board IS 'True if this is the main product board image';
COMMENT ON COLUMN public.egger_board_images.is_closeup IS 'True if this is the close-up/detail image';

-- Success message
SELECT 'Created egger_board_images table for high-quality board images! 🖼️' as message;
