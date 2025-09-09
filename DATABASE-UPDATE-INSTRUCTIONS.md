# Database Update Instructions

## Adding New Room Types

This document provides step-by-step instructions for updating your Supabase database to include the new room types.

### New Room Types Added
- **master-bedroom** - Master bedroom with en-suite and walk-in closet space
- **guest-bedroom** - Guest bedroom design with essential furniture  
- **ensuite** - Ensuite bathroom connected to master bedroom
- **office** - Home office design with desk and storage
- **dressing-room** - Dressing room with wardrobe and storage solutions

### Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Database credentials (already configured in your project)
- Access to your Supabase project

### Step 1: Check Current Database Status
```bash
# Check if migrations are up to date
supabase status

# List current migrations
supabase migration list
```

### Step 2: Apply the New Migration
```bash
# Apply the new room types migration
supabase db push

# Or if you prefer to run migrations manually:
supabase migration up
```

### Step 3: Verify the Update
```bash
# Connect to your database and verify the constraint
supabase db reset --linked

# Or check the constraint directly:
psql "postgresql://postgres:[YOUR_PASSWORD]@db.akfdezesupzuvukqiggn.supabase.co:5432/postgres" -c "\d+ room_designs"
```

### Step 4: Test the New Room Types
1. Start your development server: `npm run dev`
2. Navigate to the Designer page
3. Create a new project
4. Try adding each new room type:
   - Master Bedroom
   - Guest Bedroom
   - Ensuite
   - Office
   - Dressing Room

### Database Schema Changes
The migration updates the `room_designs` table's CHECK constraint to include the new room types:

```sql
-- Before
CHECK (room_type IN (
  'kitchen', 'bedroom', 'bathroom', 'living-room', 
  'dining-room', 'utility', 'under-stairs'
))

-- After  
CHECK (room_type IN (
  'kitchen', 'bedroom', 'master-bedroom', 'guest-bedroom',
  'bathroom', 'ensuite', 'living-room', 'dining-room', 
  'office', 'dressing-room', 'utility', 'under-stairs'
))
```

### Troubleshooting

#### If Migration Fails
```bash
# Check migration status
supabase migration list

# Reset and reapply
supabase db reset --linked
supabase db push
```

#### If Room Types Don't Appear
1. Check browser console for errors
2. Verify the migration was applied successfully
3. Clear browser cache and reload
4. Check that the TypeScript types are properly imported

#### If Database Connection Issues
1. Verify your Supabase credentials in `src/integrations/supabase/client.ts`
2. Check your internet connection
3. Verify your Supabase project is active

### Rollback Instructions (if needed)
```bash
# To rollback the migration
supabase migration down

# Or restore from backup
supabase db reset --linked
```

### Verification Commands
```sql
-- Check the constraint exists
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'room_designs_room_type_check';

-- Test inserting a new room type
INSERT INTO room_designs (project_id, room_type, room_dimensions) 
VALUES ('00000000-0000-0000-0000-000000000000', 'office', '{"width": 400, "height": 350}');
```
