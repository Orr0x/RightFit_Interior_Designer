-- Update room type constraint to include all new room types
-- This migration adds support for the new room types: living-room, dining-room, utility, under-stairs

-- Drop the existing constraint
ALTER TABLE public.designs 
DROP CONSTRAINT IF EXISTS check_room_type;

-- Add new constraint with all supported room types
ALTER TABLE public.designs 
ADD CONSTRAINT check_room_type 
CHECK (room_type IN (
  'kitchen', 
  'bedroom', 
  'bathroom', 
  'living-room', 
  'dining-room', 
  'utility', 
  'under-stairs'
));

-- Update any existing designs that might have old room type values
-- Map old values to new values for backward compatibility
UPDATE public.designs 
SET room_type = 'living-room' 
WHERE room_type = 'media-wall';

UPDATE public.designs 
SET room_type = 'dining-room' 
WHERE room_type = 'flooring';

-- Add comment to document the supported room types
COMMENT ON CONSTRAINT check_room_type ON public.designs IS 
'Ensures room_type is one of: kitchen, bedroom, bathroom, living-room, dining-room, utility, under-stairs';

-- Add index for better performance on room type queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_designs_room_type_updated ON public.designs(room_type, created_at DESC);

-- Verify the constraint works by testing invalid values (this will fail if constraint is working)
-- DO $$
-- BEGIN
--   INSERT INTO public.designs (user_id, name, room_type) 
--   VALUES ('00000000-0000-0000-0000-000000000000', 'test', 'invalid_room_type');
--   RAISE EXCEPTION 'Constraint check failed - invalid room type was allowed';
-- EXCEPTION
--   WHEN check_violation THEN
--     RAISE NOTICE 'Room type constraint is working correctly';
-- END;
-- $$;