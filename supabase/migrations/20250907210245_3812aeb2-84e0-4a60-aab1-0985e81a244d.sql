-- Add room_type column to designs table for better filtering and organization
ALTER TABLE public.designs 
ADD COLUMN room_type TEXT DEFAULT 'kitchen' NOT NULL;

-- Add index for better query performance when filtering by room type
CREATE INDEX idx_designs_room_type ON public.designs(room_type);

-- Add index for user_id + room_type combination for efficient user-specific room filtering
CREATE INDEX idx_designs_user_room_type ON public.designs(user_id, room_type);

-- Update existing designs to have kitchen as room type (backward compatibility)
UPDATE public.designs 
SET room_type = 'kitchen' 
WHERE room_type IS NULL OR room_type = '';

-- Add constraint to ensure only valid room types are stored
ALTER TABLE public.designs 
ADD CONSTRAINT check_room_type 
CHECK (room_type IN ('kitchen', 'bedroom', 'bathroom', 'media-wall', 'flooring'));