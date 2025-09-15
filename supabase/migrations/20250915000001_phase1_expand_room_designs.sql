-- =============================================================================
-- PHASE 1.2: EXPAND ROOM_DESIGNS TABLE  
-- Add missing room properties to eliminate hardcoded DEFAULT_ROOM
-- =============================================================================

-- Add missing room properties
ALTER TABLE public.room_designs ADD COLUMN IF NOT EXISTS
  wall_height DECIMAL(10,2) DEFAULT 240;

ALTER TABLE public.room_designs ADD COLUMN IF NOT EXISTS
  ceiling_height DECIMAL(10,2) DEFAULT 250;

ALTER TABLE public.room_designs ADD COLUMN IF NOT EXISTS
  floor_thickness DECIMAL(10,2) DEFAULT 10;

ALTER TABLE public.room_designs ADD COLUMN IF NOT EXISTS
  room_style JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_designs_wall_height ON public.room_designs(wall_height);
CREATE INDEX IF NOT EXISTS idx_room_designs_room_style ON public.room_designs USING GIN(room_style);

-- Add comments for documentation
COMMENT ON COLUMN public.room_designs.wall_height IS 'Height of walls in cm (used in elevation views)';
COMMENT ON COLUMN public.room_designs.ceiling_height IS 'Height of ceiling in cm (for 3D rendering)';
COMMENT ON COLUMN public.room_designs.floor_thickness IS 'Thickness of floor in cm (for detailed views)';
COMMENT ON COLUMN public.room_designs.room_style IS 'Room-specific styling and preferences';

-- Update existing room designs with default wall height if not set
-- This ensures backward compatibility
UPDATE public.room_designs 
SET wall_height = 240 
WHERE wall_height IS NULL;

-- Log completion
DO $$ BEGIN
    RAISE NOTICE 'Phase 1.2 Complete: Room designs table expanded with room properties';
END $$;
