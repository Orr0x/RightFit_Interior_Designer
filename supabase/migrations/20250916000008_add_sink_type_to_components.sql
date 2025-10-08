-- ================================================================
-- Add 'sink' to allowed component types
-- ================================================================
-- Problem: The components table type constraint doesn't include 'sink'
-- Solution: Drop the old constraint and add a new one with 'sink' included
-- ================================================================

-- Drop the existing constraint
ALTER TABLE public.components
DROP CONSTRAINT IF EXISTS components_type_check;

-- Add new constraint with all component types used in migrations 005 and 006
ALTER TABLE public.components
ADD CONSTRAINT components_type_check
CHECK (type IN (
  'appliance',
  'bathtub',
  'bed',
  'cabinet',
  'cornice',
  'counter-top',
  'desk',
  'door',
  'end-panel',
  'flooring',
  'mirror',
  'pelmet',
  'seating',
  'shower',
  'sink',
  'sofa',
  'table',
  'toe-kick',
  'toilet',
  'wall-unit-end-panel',
  'window'
));

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'Successfully added sink and other types to components type constraint';
END $$;
