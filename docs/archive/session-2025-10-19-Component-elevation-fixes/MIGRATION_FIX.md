# Migration Fix - Column Name Correction

**Date:** 2025-10-19
**Issue:** Migration #2 failed with column name error

---

## Error Encountered

```
ERROR: 42703: column "component_type" does not exist
LINE 34: SELECT component_id FROM components WHERE component_type = 'counter-top'
```

## Root Cause

The `components` table uses the column name `type` (not `component_type`).

This was an error in the migration SQL - I incorrectly assumed the column was named `component_type` based on other tables like `component_3d_models` which use `component_type`.

## Fix Applied

**File:** `supabase/migrations/20251019000002_update_countertop_2d_renders.sql`

**Changed:** All instances of `component_type` → `type`

**Lines affected:**
- Line 34: WHERE clause in UPDATE statement
- Line 47: Verification query
- Line 52: Verification query
- Line 62: Sample config query

## Corrected SQL

```sql
-- Before (WRONG)
WHERE component_id IN (
  SELECT component_id FROM components WHERE component_type = 'counter-top'
);

-- After (CORRECT)
WHERE component_id IN (
  SELECT component_id FROM components WHERE type = 'counter-top'
);
```

## Verification

Migration #2 should now run successfully. The schema for the `components` table is:

```
components table columns:
- component_id (text, PK)
- type (text) ← CORRECT column name
- name (text)
- width, depth, height (numeric)
- etc.
```

---

**Status:** ✅ FIXED
**Date Fixed:** 2025-10-19
