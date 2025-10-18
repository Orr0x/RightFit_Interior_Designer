# Quick Guide: Execute Database Height Fix

**Time Required:** 5 minutes
**Risk Level:** LOW
**Impact:** Fixes 135+ components with incorrect heights

---

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor (1 min)

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New query** button

### 2. Copy and Paste Fix Script (1 min)

1. Open file: `FIX_COMPONENT_HEIGHTS_COMPREHENSIVE.sql`
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into Supabase SQL Editor (Ctrl+V)

### 3. Execute Script (1 min)

1. Click **Run** button (or press Ctrl+Enter)
2. Wait 2-5 seconds for execution
3. Check for success message

**Expected Output:**
```
Success. Rows affected: ~135
```

### 4. Review Verification Results (1 min)

Scroll down in results panel to see verification queries output.

**Look for this summary:**

| Status | Component Count |
|--------|----------------|
| ✅ MATCH | ~380 |
| ⚠️ NO MODEL HEIGHT | ~12 |
| ⚠️ NO LAYER TYPE | ~45 |
| ❌ MISMATCH | **0** ← Must be ZERO |

**If MISMATCH count is NOT 0:**
- Scroll up to see which components still have issues
- Report results for further investigation

### 5. Test in Browser (1 min)

1. Open application in browser
2. **Hard refresh:** Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Open Designer with test room
4. Switch to **Front Elevation** view
5. Look for fridge-90 - should be tall (180cm)

**Visual Check:**
- Fridge-90: Should be 2x taller than base cabinets
- Wall cabinets: Should be visible above countertop
- Tall units: Should extend to ceiling

---

## Quick Verification Commands

If you want to manually verify specific components after the fix:

### Check Fridge-90 Height

```sql
SELECT
  component_id,
  default_height as model_height_m,
  min_height_cm,
  max_height_cm,
  (max_height_cm - min_height_cm) as component_height_cm
FROM public.component_3d_models
WHERE component_id = 'fridge-90';
```

**Expected Result:**
```
component_id: fridge-90
model_height_m: 1.80
min_height_cm: 0
max_height_cm: 180
component_height_cm: 180
```

### Check All Appliances

```sql
SELECT
  component_id,
  component_name,
  default_height as model_height_m,
  (max_height_cm - min_height_cm) as metadata_height_cm,
  CASE
    WHEN ABS((max_height_cm - min_height_cm) / 100.0 - default_height) <= 0.05 THEN '✅'
    ELSE '❌'
  END as status
FROM public.component_3d_models
WHERE component_type = 'appliance'
ORDER BY component_id;
```

**Expected Result:**
All rows should show ✅ in status column.

---

## Troubleshooting

### Issue: Script fails with permission error

**Solution:**
- Ensure you're logged in as project admin
- Check you have write access to `component_3d_models` table

### Issue: MISMATCH count is not 0 after fix

**Solution:**
1. Run the detailed mismatch query (included in fix script)
2. Check which components still have issues
3. Report component IDs for manual investigation

### Issue: Browser still shows wrong heights

**Solution:**
1. **Hard refresh:** Ctrl+Shift+R (clears cache)
2. Check browser console for errors
3. Verify SQL fix actually executed (check database directly)
4. Check metadata loading logs in browser console

### Issue: Some components look correct, others don't

**Solution:**
- This is expected if components weren't in the original 135 affected
- Run category-specific verification queries from fix script
- Report specific component IDs that still render incorrectly

---

## What the Fix Does

### Before Fix
```sql
-- Example: Fridge-90
min_height_cm: 0
max_height_cm: 90      ← WRONG (set by blanket UPDATE)
default_height: 1.80   ← CORRECT (from population migration)
```

### After Fix
```sql
-- Example: Fridge-90
min_height_cm: 0
max_height_cm: 180     ← FIXED (synced from default_height * 100)
default_height: 1.80   ← Unchanged (source of truth)
```

### The Math
```
max_height_cm = default_height * 100
              = 1.80 * 100
              = 180 cm
```

---

## Success Criteria

✅ **SQL Execution:**
- Script runs without errors
- Shows ~135 rows affected

✅ **Database Verification:**
- MISMATCH count = 0
- Fridge-90 has max_height_cm = 180
- All appliances show ✅ status

✅ **Browser Visual Test:**
- Fridge-90 renders tall (180cm)
- No element size flash on load
- Properties panel matches visual height

✅ **No Regressions:**
- Plan view still works
- 3D view still works
- Visibility toggles still work

---

## After Successful Fix

### Report Results

Message format:
```
✅ Database fix executed successfully
- SQL executed: 135 rows updated
- Verification: 0 mismatches remaining
- Browser test: Fridge-90 renders at correct 180cm height
- No visual flashing observed
```

### Optional Cleanup Tasks

These can be done later (NOT urgent):

1. **Remove debug logging:**
   - Search for `🔍` and `🎨` emoji markers in code
   - Remove console.log statements used for debugging

2. **Delete commented code:**
   - Remove commented `isVisible` references
   - Clean up old code blocks in Designer.tsx

3. **Archive documentation:**
   - Move session docs to archive folder
   - Keep only essential reference docs

---

## Quick Reference: File Locations

```
Main Fix Script:
📄 docs/session-2025-10-18-view-specific-visibility/FIX_COMPONENT_HEIGHTS_COMPREHENSIVE.sql

Documentation:
📄 docs/session-2025-10-18-view-specific-visibility/DATABASE_HEIGHT_FIX_SUMMARY.md
📄 docs/session-2025-10-18-view-specific-visibility/SESSION_SUMMARY.md

Code Changes (already committed):
📄 src/components/designer/DesignCanvas2D.tsx (lines 387, 2900-2907)
📄 src/components/designer/AdaptiveView3D.tsx (lines 413, 428-485, 523, 581)
📄 src/pages/Designer.tsx (lines 1032, 1054)
```

---

## Timeline Estimate

| Task | Time | Total |
|------|------|-------|
| Open Supabase + navigate to SQL Editor | 1 min | 1 min |
| Copy/paste fix script | 1 min | 2 min |
| Execute script + wait | 1 min | 3 min |
| Review verification results | 1 min | 4 min |
| Test in browser | 1 min | **5 min** |

**Total Time:** ~5 minutes

---

**Ready to execute?** Open Supabase SQL Editor and copy the contents of `FIX_COMPONENT_HEIGHTS_COMPREHENSIVE.sql`.
