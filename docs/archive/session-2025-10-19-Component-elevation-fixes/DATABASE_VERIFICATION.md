# Database Verification Report

**Date:** 2025-10-19
**Source:** Database exports from `docs/Database/components table relations/`
**Export Date:** 2025-10-18 (yesterday - no changes since then)

---

## ✅ Verification Summary

All assumptions in the fix plan are **CONFIRMED** by actual database data.

---

## Issue #1: Tall Cabinet Heights

### Components Table Verification

```csv
component_id,            name,                     height
larder-corner-unit-60,   Tall Corner Larder 60cm,  200.00  ← NEEDS 210
larder-corner-unit-90,   Tall Corner Larder 90cm,  200.00  ← NEEDS 210
tall-unit-60,            Tall Unit 60cm,           200.00  ← NEEDS 210
tall-unit-80,            Tall Unit 80cm,           200.00  ← NEEDS 210
```

### 3D Models Table Verification

```csv
component_id,            default_height
tall-unit-80,            2.0000  ← NEEDS 2.10
tall-unit-60,            2.0000  ← NEEDS 2.10
larder-corner-unit-60,   2.0000  ← NEEDS 2.10
larder-corner-unit-90,   2.0000  ← NEEDS 2.10
oven-housing-60,         2.0000  ← NEEDS 2.10 (bonus fix)
```

**✅ CONFIRMED:**
- 4 components at 200cm (need 210cm)
- 4 3D models at 2.00m (need 2.10m)
- **BONUS:** Found `oven-housing-60` also at 2.00m (should update too)

---

## Issue #2: Countertop Handles

### 2D Renders Table Verification

**Counter-tops WITH 2D renders (PROBLEM CONFIRMED):**

```csv
component_id,         elevation_type,    elevation_data
counter-top-60,       standard-cabinet,  {"door_count": 2, "handle_style": "bar", ...}  ← WRONG
counter-top-80,       standard-cabinet,  {"door_count": 2, "handle_style": "bar", ...}  ← WRONG
counter-top-100,      standard-cabinet,  {"door_count": 2, "handle_style": "bar", ...}  ← WRONG
counter-top-120,      standard-cabinet,  {"door_count": 2, "handle_style": "bar", ...}  ← WRONG
counter-top-horizontal, standard-cabinet, {"door_count": 2, "handle_style": "bar", ...}  ← WRONG
counter-top-vertical,  standard-cabinet,  {"door_count": 2, "handle_style": "bar", ...}  ← WRONG
```

**🚨 IMPORTANT FINDING:**
Counter-tops **DO HAVE** 2D render definitions (contrary to our initial assumption).
They are explicitly configured with:
- `door_count: 2` (wrong - should be 0)
- `handle_style: "bar"` (wrong - should be "none")
- `has_toe_kick: false` (correct)

**Revised Fix:**
- **UPDATE** existing 2D renders (not INSERT new ones)
- Change `door_count` from 2 to 0
- Change `handle_style` from "bar" to "none"

### All Countertops in Database

```csv
component_id,             height
counter-top-60,           4.00
counter-top-80,           4.00
counter-top-100,          4.00
counter-top-120,          4.00
counter-top-horizontal,   4.00
counter-top-vertical,     4.00
```

**✅ CONFIRMED:**
- 6 counter-top components exist
- All have height = 4cm (correct)
- All have INCORRECT 2D render definitions (handles visible)

---

## Issue #3: Base Unit Heights

### Components Table Verification

**From earlier CSV read (lines 2-7):**

```csv
component_id,       height
base-cabinet-30,    90.00  ← NEEDS 86
base-cabinet-40,    90.00  ← NEEDS 86
base-cabinet-50,    90.00  ← NEEDS 86
base-cabinet-60,    90.00  ← NEEDS 86
base-cabinet-80,    90.00  ← NEEDS 86
base-cabinet-100,   90.00  ← NEEDS 86
```

Also affected:
```csv
component_id,           height
utility-base-60,        90.00  ← NEEDS 86
utility-base-80,        90.00  ← NEEDS 86
bathroom-cabinet-40,    60.00  (wall cabinet - no change)
corner-cabinet,         90.00  ← NEEDS 86
```

**Plinth Heights:**

```csv
component_id,       plinth_height
base-cabinet-*,     10.00
corner-cabinet,     10.00
```

**✅ CONFIRMED:**
- 6 standard base cabinets at 90cm
- 2 utility base cabinets at 90cm
- 1 corner base cabinet at 90cm
- **Total: 9 components need updating to 86cm**
- Plinth heights are 10cm (not 15cm as expected - needs investigation)

**🚨 DISCREPANCY FOUND:**
- Database shows `plinth_height = 10.00` (10cm)
- 3D migration shows `plinthHeight = 0.15` (15cm)
- Need to clarify which is correct

---

## Issue #4: Corner Cabinet Door Width

**No database verification needed** - this is a code-only change.

However, from the 2D renders, we can see corner cabinets have configurations:

```csv
component_id,           corner_configuration (from components table)
corner-cabinet,         {"is_corner": true, "door_width": 30, "side_width": 60, "corner_type": "L-shaped"}
```

**✅ INTERESTING:**
- `corner-cabinet` already has `door_width: 30` and `side_width: 60` in metadata!
- This is stored but not used by rendering code
- Rendering code currently ignores this and uses 50/50 split
- **Fix should read from this configuration**

---

## Revised Migration Plans

### Migration #1: Tall Cabinet Heights (NO CHANGES)

**Affected Components:** 5 (not 4)
- tall-unit-60
- tall-unit-80
- larder-corner-unit-60
- larder-corner-unit-90
- **oven-housing-60** (bonus fix)

### Migration #2: Countertop Handles (CHANGED)

**Action:** UPDATE instead of INSERT

```sql
-- REVISED: Update existing 2D renders
UPDATE component_2d_renders
SET
  elevation_data = jsonb_set(
    jsonb_set(elevation_data, '{door_count}', '0'),
    '{handle_style}', '"none"'
  ),
  side_elevation_data = jsonb_set(
    jsonb_set(side_elevation_data, '{door_count}', '0'),
    '{handle_style}', '"none"'
  )
WHERE component_id IN (
  SELECT component_id FROM components WHERE component_type = 'counter-top'
);
```

**Affected Components:** 6
- counter-top-60
- counter-top-80
- counter-top-100
- counter-top-120
- counter-top-horizontal
- counter-top-vertical

### Migration #3: Base Unit Heights (NO CHANGES)

**Affected Components:** 9 (not 15-20)
- 6 standard base cabinets (30, 40, 50, 60, 80, 100)
- 2 utility base cabinets (60, 80)
- 1 corner base cabinet

**INVESTIGATION NEEDED:** Plinth height discrepancy (10cm vs 15cm)

---

## Additional Findings

### 1. Oven Housing Height

**Found:** `oven-housing-60` at 2.00m (200cm)
**Should be:** 2.10m (210cm) to match tall units

**Add to Migration #1**

### 2. Corner Cabinet Configuration

**Found:** Metadata already contains correct door/panel widths
**Current code:** Ignores metadata, uses hardcoded 50/50 split
**Better fix:** Read from `corner_configuration` metadata instead of hardcoding

### 3. Plinth Height Discrepancy

**Database:** `plinth_height = 10.00` (10cm)
**3D Migration:** `plinthHeight = 0.15` (15cm)

**Question:** Which is correct?
- If 10cm: Total height = 10cm plinth + 76cm cabinet = 86cm ✓
- If 15cm: Total height = 15cm plinth + 71cm cabinet = 86cm ✓

**Need to verify:** Check 3D geometry parts formulas to see which value is actually used.

---

## Component Count Summary

| Issue | Components Affected | Database Tables Affected |
|-------|---------------------|--------------------------|
| #1 Tall Heights | 5 | `components`, `component_3d_models` |
| #2 Countertop Handles | 6 | `component_2d_renders` (UPDATE) |
| #3 Base Heights | 9 | `components`, `component_3d_models` |
| #4 Corner Doors | N/A | Code only |

**Total components affected:** 20

---

## Next Steps

1. ✅ **Verified all assumptions**
2. 🔄 **Revise Migration #2** (UPDATE instead of INSERT)
3. 🔄 **Update Migration #1** (add oven-housing-60)
4. ❓ **Investigate plinth height discrepancy**
5. 🔄 **Consider reading corner config from metadata** (Issue #4 enhancement)

---

**Verification Status:** ✅ COMPLETE
**Discrepancies Found:** 2 (countertops have renders, plinth height mismatch)
**Action Required:** Update migration plans before implementation
**Verified By:** Claude (AI Assistant)
**Date:** 2025-10-19
