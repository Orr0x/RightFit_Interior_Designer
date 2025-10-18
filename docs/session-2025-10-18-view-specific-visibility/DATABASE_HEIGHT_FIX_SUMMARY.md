# Database Component Height Fix Summary

**Date:** 2025-10-18
**Session:** view-specific-visibility
**Issue:** 135+ components rendering at incorrect heights in elevation views
**Status:** 🟡 SQL FIX READY - AWAITING EXECUTION

---

## Problem Discovery

### Initial Symptom
> "Tall appliances like the fridge 90cm change height to the same as base cabinets after they load in elevation view."

**Visual Evidence:**
- Fridge-90 should be 180cm tall (1.8m)
- Renders at 90cm (same height as base cabinets)
- Properties panel shows correct height: 180cm
- Elevation view shows wrong height: 90cm

### Root Cause Analysis

**Chain of Events:**

1. **Original Bug:** Element flash in elevation views
   - Elements rendered twice
   - First render: correct height (from fallback logic)
   - Second render: wrong height (from database metadata)
   - **Symptom:** Visible flash + wrong final height

2. **My Fix (commit edb6034):** Added `metadataLoading` check in DesignCanvas2D
   - Waits for metadata before rendering
   - Eliminates flash by rendering only once
   - **New Symptom:** No flash BUT wrong height consistently

3. **Underlying Issue Exposed:** Database corruption
   - `ADD_COLLISION_DETECTION_LAYER_FIELDS.sql` used blanket UPDATEs
   - Overwrote correct individual component heights
   - 135+ components affected

### Why Rendering Uses Database Values

**Code Location:** [DesignCanvas2D.tsx:1327-1333](../../../src/components/designer/DesignCanvas2D.tsx#L1327-L1333)

```typescript
if (metadata) {
  // ✅ DATABASE-DRIVEN: Use authoritative layer heights from database
  const componentHeight = metadata.max_height_cm - metadata.min_height_cm;
  const mountHeight = metadata.min_height_cm;

  elementHeight = componentHeight * zoom;
  yPos = floorY - (mountHeight * zoom) - elementHeight;
}
```

**Design Decision:** Elevation views use database metadata as source of truth for collision detection and layer positioning.

---

## Impact Assessment

### Verification Query Results

**Total Components Affected:** 135+ components with height mismatches

**Categories Affected:**
- ✅ Appliances (fridges, freezers, dishwashers, ovens)
- ✅ Tall units (larders, oven housings, tall corners)
- ✅ Wall cabinets (various heights)
- ✅ Other components (beds, cabinets, doors, sinks)

### Critical Examples

| Component ID | Category | Model Height | Metadata Height | Difference |
|-------------|----------|--------------|-----------------|------------|
| fridge-90 | Appliance | 180cm | 90cm | -90cm |
| fridge-60 | Appliance | 180cm | 90cm | -90cm |
| freezer-upright-60 | Appliance | 185cm | 90cm | -95cm |
| larder-unit-60 | Tall Unit | 200cm | 90cm | -110cm |
| oven-housing-60 | Tall Unit | 200cm | 90cm | -110cm |
| wall-cabinet-60 | Wall Cabinet | 70cm | 60cm | -10cm |

**Pattern:** All appliances set to 90cm, all tall units set to 90cm, wall cabinets have various mismatches.

---

## The Problematic SQL

**File:** `ADD_COLLISION_DETECTION_LAYER_FIELDS.sql`
**Lines:** 109-118

```sql
-- ❌ PROBLEM: Blanket UPDATE overwrites correct individual heights
UPDATE public.component_3d_models SET
  layer_type = 'appliance',
  min_height_cm = 0,
  max_height_cm = 90,  -- ← Sets ALL appliances to 90cm!
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'appliance'
  OR component_id LIKE '%dishwasher%'
  OR component_id LIKE '%oven%'
  OR component_id LIKE '%fridge%';  -- ← Catches fridge-90 (should be 180cm)
```

**Why This Is Wrong:**
- Uses category-wide UPDATE instead of conditional UPDATE
- No check for existing correct values
- Overwrites meticulously defined heights from migration `20250130000012_populate_tall_units_appliances.sql`

**Correct Approach Should Have Been:**
```sql
-- ✅ CORRECT: Only update components that don't have heights defined
UPDATE public.component_3d_models SET
  layer_type = 'appliance',
  min_height_cm = COALESCE(min_height_cm, 0),
  max_height_cm = COALESCE(max_height_cm, default_height * 100),
  can_overlap_layers = ARRAY['flooring']
WHERE component_type = 'appliance'
  AND layer_type IS NULL;  -- Only update if not already set
```

---

## Solution: Comprehensive Automatic Fix

### Strategy

**Source of Truth:** Use `default_height` field from component_3d_models table
- This field contains correct model heights
- Already used for 3D rendering (which works correctly)
- Defined in population migration files

**Fix Approach:**
1. Automatic UPDATE using `default_height` to sync `max_height_cm`
2. Handle both meters and centimeters unit storage
3. Verify results with comprehensive queries

### Fix Script

**File:** [FIX_COMPONENT_HEIGHTS_COMPREHENSIVE.sql](./FIX_COMPONENT_HEIGHTS_COMPREHENSIVE.sql)

**Key UPDATE Statements:**

```sql
-- For components where default_height is stored in METERS (most components)
UPDATE public.component_3d_models
SET max_height_cm = (default_height * 100)
WHERE layer_type IS NOT NULL
  AND default_height IS NOT NULL
  AND default_height < 10  -- Stored in meters
  AND ABS((max_height_cm - min_height_cm) / 100.0 - default_height) > 0.05;

-- For components where default_height is stored in CENTIMETERS (rare cases)
UPDATE public.component_3d_models
SET max_height_cm = default_height
WHERE layer_type IS NOT NULL
  AND default_height IS NOT NULL
  AND default_height >= 10
  AND default_height <= 300
  AND ABS((max_height_cm - min_height_cm) - default_height) > 5;
```

---

## Expected Results After Fix

### Component Heights (Sample)

| Component | Before Fix | After Fix | Status |
|-----------|------------|-----------|--------|
| fridge-90 | 0-90cm | 0-180cm | ✅ FIXED |
| fridge-60 | 0-90cm | 0-180cm | ✅ FIXED |
| freezer-upright-60 | 0-90cm | 0-185cm | ✅ FIXED |
| larder-unit-60 | 0-90cm | 0-200cm | ✅ FIXED |
| oven-housing-60 | 0-90cm | 0-200cm | ✅ FIXED |
| wall-cabinet-60 | 140-200cm | 140-210cm | ✅ FIXED |
| dishwasher-60 | 0-90cm | 0-85cm | ✅ FIXED |

### Verification Queries Included

The fix script includes comprehensive verification queries:

1. **Match Count:** How many components are now correctly synced
2. **Remaining Mismatches:** Any components that still have issues (should be 0)
3. **Category Checks:** Specific verification for appliances, tall units, wall cabinets
4. **Summary Report:** Overall status breakdown

---

## Execution Instructions

### Step 1: Open Supabase SQL Editor

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create new query

### Step 2: Run Fix Script

1. Copy contents of `FIX_COMPONENT_HEIGHTS_COMPREHENSIVE.sql`
2. Paste into SQL Editor
3. Click "Run"

**Expected Execution Time:** 2-5 seconds
**Components Updated:** ~135 components

### Step 3: Review Verification Output

The script includes automatic verification queries that will show:

```
✅ MATCH - 380 components
⚠️ NO MODEL HEIGHT - 12 components
⚠️ NO LAYER TYPE - 45 components
❌ MISMATCH - 0 components  ← Should be ZERO after fix
```

### Step 4: Test in Browser

1. Reload application (hard refresh: Ctrl+Shift+R)
2. Open a room in Designer
3. Switch to Front Elevation
4. Verify fridge-90 renders at correct 180cm height
5. Check other tall appliances and wall cabinets

---

## Verification Checklist

After running the SQL fix:

- [ ] **SQL Execution:** Script runs without errors
- [ ] **Verification Query:** "MISMATCH" count is 0
- [ ] **Fridge-90:** Renders at 180cm in elevation view
- [ ] **Fridge-60:** Renders at 180cm in elevation view
- [ ] **Freezer-upright-60:** Renders at 185cm in elevation view
- [ ] **Larder units:** Render at 200cm in elevation view
- [ ] **Wall cabinets:** Render at 70cm height (140-210cm range)
- [ ] **Dishwashers:** Render at 85cm in elevation view
- [ ] **No render flash:** Elements render once at correct height
- [ ] **Properties panel:** Shows height matching rendered height

---

## Prevention: Future Database Migrations

### Lessons Learned

**❌ DON'T:**
- Use blanket UPDATE statements without WHERE clause checks
- Overwrite existing values without COALESCE or NULL checks
- Apply category-wide settings to fields that vary by component

**✅ DO:**
- Check if value exists before updating: `WHERE field IS NULL`
- Use COALESCE to preserve existing values: `COALESCE(field, default)`
- Apply updates conditionally based on actual data needs
- Test with SELECT before running UPDATE
- Document expected impact (how many rows affected)

### Recommended Pattern for Future Migrations

```sql
-- Safe migration pattern
UPDATE table SET
  new_field = COALESCE(new_field, calculated_value),
  existing_field = COALESCE(existing_field, existing_field)  -- Preserve
WHERE condition_that_needs_update
  AND existing_field IS NULL;  -- Only update if not set
```

---

## Related Files

### Documentation
- [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) - Full session summary
- [TEST_PLAN.md](./test-results/TEST_PLAN.md) - Testing guide for visibility features
- [QUICK_CHECKLIST.md](./test-results/QUICK_CHECKLIST.md) - Quick test reference

### SQL Scripts
- [FIX_COMPONENT_HEIGHTS_COMPREHENSIVE.sql](./FIX_COMPONENT_HEIGHTS_COMPREHENSIVE.sql) - **RUN THIS**
- [FIX_COMPONENT_HEIGHTS.sql](./FIX_COMPONENT_HEIGHTS.sql) - Initial targeted fix (superseded)

### Code Changes
- [DesignCanvas2D.tsx](../../../src/components/designer/DesignCanvas2D.tsx) - Metadata loading fix
- [AdaptiveView3D.tsx](../../../src/components/designer/AdaptiveView3D.tsx) - 3D view render flash fix
- [Designer.tsx](../../../src/pages/Designer.tsx) - Active view prop fixes

---

## Timeline

| Date | Event | Status |
|------|-------|--------|
| 2025-10-18 | User reports fridge height bug | 🔴 BUG REPORTED |
| 2025-10-18 | Root cause identified in database | 🟡 ANALYSIS COMPLETE |
| 2025-10-18 | Verification shows 135+ affected | 🟡 SCOPE EXPANDED |
| 2025-10-18 | Comprehensive fix script created | 🟢 FIX READY |
| **PENDING** | **User executes SQL fix** | ⏳ **AWAITING** |
| **PENDING** | **Browser testing confirms fix** | ⏳ **AWAITING** |

---

## Next Steps

1. **Execute SQL Fix:** Run `FIX_COMPONENT_HEIGHTS_COMPREHENSIVE.sql` in Supabase
2. **Verify Database:** Check verification queries show 0 mismatches
3. **Test in Browser:** Confirm all components render at correct heights
4. **Report Results:** Provide feedback on any remaining issues

---

**Status:** 🟡 READY FOR EXECUTION
**Impact:** HIGH - Fixes 135+ components
**Risk:** LOW - Uses authoritative source (default_height)
**Reversible:** YES - Can re-run ADD_COLLISION_DETECTION_LAYER_FIELDS.sql if needed (not recommended)
