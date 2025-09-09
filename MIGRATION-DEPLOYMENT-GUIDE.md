# Phase 1 Database Migration Deployment Guide

## Overview
This guide provides step-by-step instructions for manually deploying the Phase 1 database migrations through the Supabase dashboard.

## Prerequisites
- Access to Supabase dashboard: https://supabase.com/dashboard
- Project ID: `akfdezesupzuvukqiggn`
- Admin access to the database

## Migration Files to Deploy

### 1. Create Multi-Room Schema
**File:** `supabase/migrations/20250908160000_create_multi_room_schema.sql`
**Purpose:** Creates the new `projects` and `room_designs` tables with proper relationships

### 2. Migrate Existing Data
**File:** `supabase/migrations/20250908160001_migrate_existing_designs.sql`
**Purpose:** Migrates existing design data to the new multi-room structure

## Deployment Steps

### Step 1: Access Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `akfdezesupzuvukqiggn`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Deploy Schema Migration
1. Open the file: `supabase/migrations/20250908160000_create_multi_room_schema.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **Run** to execute
5. Verify no errors occurred

### Step 3: Deploy Data Migration
1. Open the file: `supabase/migrations/20250908160001_migrate_existing_designs.sql`
2. Copy the entire contents
3. Paste into the SQL Editor (new query)
4. Click **Run** to execute
5. Verify no errors occurred

### Step 4: Verification Queries
Run these queries to verify successful deployment:

```sql
-- Check projects table
SELECT COUNT(*) as project_count FROM projects;

-- Check room_designs table
SELECT COUNT(*) as room_design_count FROM room_designs;

-- Check data migration
SELECT 
  p.name as project_name,
  rd.room_type,
  rd.design_data->>'components' as components_count
FROM projects p
JOIN room_designs rd ON p.id = rd.project_id
LIMIT 5;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('projects', 'room_designs');
```

## Expected Results

### After Schema Migration:
- ✅ `projects` table created with proper structure
- ✅ `room_designs` table created with foreign key to projects
- ✅ RLS policies enabled on both tables
- ✅ Proper indexes created for performance

### After Data Migration:
- ✅ Existing designs converted to projects with single room designs
- ✅ All design data preserved in new structure
- ✅ User associations maintained
- ✅ Timestamps preserved

## Troubleshooting

### Common Issues:

1. **Permission Denied**
   - Ensure you're logged in as the project owner
   - Check that you're in the correct project

2. **Table Already Exists**
   - If tables exist, check if they have the correct structure
   - May need to drop and recreate if structure differs

3. **Foreign Key Violations**
   - Ensure schema migration completes before data migration
   - Check that user_id references exist in auth.users

4. **RLS Policy Errors**
   - Verify RLS is enabled on both tables
   - Check policy definitions match the migration

## Verification Checklist

After deployment, verify:

- [ ] `projects` table exists and is accessible
- [ ] `room_designs` table exists and is accessible
- [ ] RLS policies are active
- [ ] Existing data has been migrated
- [ ] No data loss occurred
- [ ] Application can connect to new tables

## Next Steps

Once migration is complete:
1. Update application to use new schema
2. Test multi-room functionality
3. Begin Phase 2 implementation

## Support

If issues occur during deployment:
1. Check Supabase logs in the dashboard
2. Verify SQL syntax in migration files
3. Ensure proper permissions and access
4. Contact support if persistent issues

---

**Status:** Ready for deployment
**Estimated Time:** 10-15 minutes
**Risk Level:** Low (backward compatible with rollback capability)