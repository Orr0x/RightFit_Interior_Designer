-- Add thumb_url and hover_url columns to farrow_ball_finishes table
-- This will allow the system to be fully database-driven

-- Skip if table doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'farrow_ball_finishes') THEN
    ALTER TABLE farrow_ball_finishes
    ADD COLUMN IF NOT EXISTS thumb_url TEXT,
    ADD COLUMN IF NOT EXISTS hover_url TEXT;

    -- Add indexes for performance
    CREATE INDEX IF NOT EXISTS idx_farrow_ball_finishes_thumb_url ON farrow_ball_finishes(thumb_url);
    CREATE INDEX IF NOT EXISTS idx_farrow_ball_finishes_hover_url ON farrow_ball_finishes(hover_url);

    -- Add comments for documentation
    COMMENT ON COLUMN farrow_ball_finishes.thumb_url IS 'URL for the thumbnail image of the color swatch';
    COMMENT ON COLUMN farrow_ball_finishes.hover_url IS 'URL for the hover image of the color swatch';

    RAISE NOTICE 'Added thumb_url and hover_url columns to farrow_ball_finishes';
  ELSE
    RAISE NOTICE 'Table farrow_ball_finishes does not exist, skipping migration';
  END IF;
END $$;




