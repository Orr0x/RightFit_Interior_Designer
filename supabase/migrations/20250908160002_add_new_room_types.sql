-- Add new room types to the room_designs table
-- This migration adds: master-bedroom, guest-bedroom, ensuite, office, dressing-room

-- Drop the existing CHECK constraint
ALTER TABLE public.room_designs 
DROP CONSTRAINT IF EXISTS room_designs_room_type_check;

-- Add the new CHECK constraint with all room types
ALTER TABLE public.room_designs 
ADD CONSTRAINT room_designs_room_type_check 
CHECK (room_type IN (
  'kitchen', 
  'bedroom', 
  'master-bedroom',
  'guest-bedroom',
  'bathroom', 
  'ensuite',
  'living-room', 
  'dining-room', 
  'office',
  'dressing-room',
  'utility', 
  'under-stairs'
));

-- Add comment for documentation
COMMENT ON CONSTRAINT room_designs_room_type_check ON public.room_designs 
IS 'Validates room_type against allowed values including new room types: master-bedroom, guest-bedroom, ensuite, office, dressing-room';
