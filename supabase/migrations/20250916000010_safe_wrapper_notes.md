# Safe Migration Application Notes

## Problem
Migrations 003 and 004 may fail if components already exist because they use:
```sql
INSERT ... RETURNING id INTO v_model_id;
```

When a component already exists, this pattern fails.

## Solution Options

### Option 1: Skip if already applied
Check if the components already exist in your database:
- Run: `SELECT component_id FROM component_3d_models WHERE component_id LIKE '%sink%' OR component_id LIKE '%larder%';`
- If you see specialized sinks or larder appliances, these migrations were already partially applied
- You can skip them

### Option 2: Apply manually with error handling
When running migrations 003 and 004 in Supabase SQL editor:
1. Wrap each section in a transaction
2. If you get an error about duplicate component_id, that's expected - the component already exists
3. Continue to the next section

### Option 3: Use the fixed migration 002
Migration 002 (tall corner larders) has been fixed with IF NOT EXISTS checks and should run safely.

## Summary of NEW Migrations Status

- ✅ **20250916000002** - Fixed with IF NOT EXISTS
- ⚠️ **20250916000003** - Needs manual handling (specialized sinks)
- ⚠️ **20250916000004** - Needs manual handling (specialty larder appliances)
- ✅ **20250916000005** - Has ON CONFLICT clause, safe to run
- ✅ **20250916000006** - Has ON CONFLICT clause, safe to run

## Recommended Approach

1. Run migration 002 (tall corner larders) - This is now fixed
2. For migrations 003-004: Check which components are missing using this query:

```sql
-- Check missing specialized sinks
SELECT * FROM (VALUES
  ('kitchen-sink-corner-90'),
  ('kitchen-sink-farmhouse-60'),
  ('kitchen-sink-farmhouse-80'),
  ('kitchen-sink-undermount-60'),
  ('kitchen-sink-undermount-80'),
  ('kitchen-sink-island-100'),
  ('kitchen-sink-granite-80'),
  ('kitchen-sink-copper-60'),
  ('kitchen-sink-quartz-80'),
  ('butler-sink-60'),
  ('butler-sink-80'),
  ('butler-sink-corner-90'),
  ('butler-sink-deep-60'),
  ('butler-sink-shallow-60'),
  ('kitchen-sink-draining-board-80'),
  ('kitchen-sink-draining-board-100'),
  ('butler-sink-draining-board-80')
) AS t(component_id)
WHERE NOT EXISTS (
  SELECT 1 FROM component_3d_models WHERE component_id = t.component_id
);

-- Check missing specialty larder appliances
SELECT * FROM (VALUES
  ('larder-built-in-fridge'),
  ('larder-single-oven'),
  ('larder-double-oven'),
  ('larder-oven-microwave'),
  ('larder-coffee-machine')
) AS t(component_id)
WHERE NOT EXISTS (
  SELECT 1 FROM component_3d_models WHERE component_id = t.component_id
);
```

3. If any components are missing, run migrations 003-004 and ignore duplicate key errors
4. Run migrations 005-006 to populate the UI catalog
