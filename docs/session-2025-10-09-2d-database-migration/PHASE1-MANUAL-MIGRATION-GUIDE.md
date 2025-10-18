# Phase 1: Manual Migration Guide
**Date:** 2025-10-09
**Status:** 📋 **ACTION REQUIRED**

---

## Overview

Since the remote Supabase database has some conflicting migrations, we need to apply the `20251009000001_create_2d_renders_schema.sql` migration manually through the Supabase SQL Editor.

---

## Steps to Apply Migration

### 1. Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **akfdezesupzuvukqiggn**
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New query**

### 2. Copy Migration SQL

Open the migration file:
```
supabase/migrations/20251009000001_create_2d_renders_schema.sql
```

Copy the entire contents (221 lines).

### 3. Paste and Execute

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** button (or press Ctrl+Enter)
3. Wait for execution to complete

### 4. Verify Success

You should see output messages:
```
✅ Migration complete: component_2d_renders table created
📊 Table ready for population script
🔍 Next step: Run scripts/populate-2d-renders.ts
```

### 5. Verify Table Exists

Run this query to confirm:
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'component_2d_renders'
ORDER BY ordinal_position;
```

Expected output: 16 columns including:
- id (uuid)
- component_id (text)
- plan_view_type (text)
- plan_view_data (jsonb)
- elevation_type (text)
- elevation_data (jsonb)
- fill_color (text)
- stroke_color (text)
- etc.

---

## Next Steps

Once migration is applied successfully:

1. ✅ Mark migration as complete
2. ➡️ Run population script: `npx ts-node scripts/populate-2d-renders.ts`
3. ✅ Verify data integrity

---

## Troubleshooting

### Error: "relation already exists"

If you get this error, the table already exists. Check if it's from a previous run:

```sql
SELECT COUNT(*) FROM component_2d_renders;
```

If it exists and is empty, you can proceed to the population script.

If it exists and has data, check if the schema matches:

```sql
SELECT * FROM component_2d_renders LIMIT 5;
```

### Error: "foreign key constraint"

Make sure the `components` table exists:

```sql
SELECT COUNT(*) FROM components;
```

If not, you need to apply earlier migrations first.

### Error: "policy already exists"

The migration uses `DROP POLICY IF EXISTS`, so this shouldn't happen. If it does, drop the policies manually:

```sql
DROP POLICY IF EXISTS "component_2d_renders_select_policy" ON component_2d_renders;
DROP POLICY IF EXISTS "component_2d_renders_insert_policy" ON component_2d_renders;
DROP POLICY IF EXISTS "component_2d_renders_update_policy" ON component_2d_renders;
DROP POLICY IF EXISTS "component_2d_renders_delete_policy" ON component_2d_renders;
```

Then re-run the migration.

---

## Alternative: Local Database

If you prefer to test locally first:

1. Start Docker Desktop
2. Run `npx supabase start`
3. Run `npx supabase db reset`
4. This will apply all migrations including the new one
5. Test locally before applying to remote

---

## Status Checklist

- [ ] Accessed Supabase SQL Editor
- [ ] Copied migration SQL from file
- [ ] Executed migration successfully
- [ ] Verified table exists (16 columns)
- [ ] No errors in execution
- [ ] Ready for population script

---

**Document Status:** ✅ COMPLETE
**Last Updated:** 2025-10-09
**Next Document:** Run `scripts/populate-2d-renders.ts` after migration is applied
