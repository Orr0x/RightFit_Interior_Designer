# Base Cabinet Rendering Issue - Analysis & Handover

**Date:** 2025-10-18
**Issue:** Base cabinets appear "stumpy" or sinking through the floor
**Status:** Analyzed - Ready for implementation
**Related:** Same bug as pan drawers and corner cabinets

---

## Executive Summary

Base cabinets (6 variants: 30cm, 40cm, 50cm, 60cm, 80cm, 100cm) are rendering with positioning issues - appearing to sink through the floor or looking "stumpy" with no visible plinth.

**Root Cause:** OLD positioning system (`-height / 2 + plinthHeight / 2`) incompatible with NEW `yPosition = 0` for base cabinets.

**Visual Evidence:** User screenshot shows base cabinets sitting too low, sinking into floor grid.

**Fix Required:** Create migration to update base cabinet geometry positioning (same fix as pan drawers)

**Estimated Effort:** 30-40 minutes

---

## Problem Details

### 1. User Report

**Quote:** "we also need to review the base cabinets as they seem to be through the floor, or stumpy with no plynth. see the image in 3d"

**Screenshot observation:**
- Base cabinets visible in 3D view
- Appear to sit too low on the floor
- Sinking below floor grid lines
- Plinth not properly visible

### 2. Database Status ✅

Base cabinets exist in migration `20250130000010_populate_base_cabinets.sql`:

**Components Created:**
- base-cabinet-30 (30×60×90cm)
- base-cabinet-40 (40×60×90cm)
- base-cabinet-50 (50×60×90cm)
- base-cabinet-60 (60×60×90cm) - **Template/Reference Model**
- base-cabinet-80 (80×60×90cm)
- base-cabinet-100 (100×60×90cm)

**Geometry Parts (4 per model):**
1. Plinth - Toe kick (15cm high)
2. Cabinet Body - Main cabinet structure
3. Door - Front panel
4. Handle - Door handle

### 3. The Positioning Bug ❌

**File:** `supabase/migrations/20250130000010_populate_base_cabinets.sql`

**Problematic Code (Line 90):**
```sql
-- Part 1: Plinth (Toe Kick)
INSERT INTO geometry_parts (
  model_id, part_name, part_type, render_order,
  position_x, position_y, position_z,
  dimension_width, dimension_height, dimension_depth,
  material_name, color_override, render_condition
) VALUES (
  v_model_id, 'Plinth', 'box', 1,
  '0',                              -- Centered on X
  '-height / 2 + plinthHeight / 2', -- ❌ OLD SYSTEM!
  '0',                              -- Centered on Z
  'width',                          -- Full width
  'plinthHeight',                   -- 15cm high
  'depth - 0.05',                   -- Slightly recessed (5cm)
  'plinth', 'plinthColor', '!isWallCabinet'
);
```

**Cabinet Body (Line 107):**
```sql
-- Part 2: Cabinet Body
INSERT INTO geometry_parts (
  model_id, part_name, part_type, render_order,
  position_x, position_y, position_z,
  dimension_width, dimension_height, dimension_depth,
  material_name, color_override
) VALUES (
  v_model_id, 'Cabinet Body', 'box', 2,
  '0',                              -- Centered on X
  'plinthHeight / 2',               -- ❌ OLD SYSTEM!
  '0',                              -- Centered on Z
  'width',                          -- Full width
  'cabinetHeight',                  -- 72cm high
  'depth',                          -- Full depth
  'cabinet_body', 'cabinetMaterial'
);
```

### 4. Variable Resolution

**Where `plinthHeight` comes from:**

[DynamicComponentRenderer.tsx:127](../src/components/3d/DynamicComponentRenderer.tsx#L127):
```typescript
plinthHeight: 15, // cm (default 15cm plinth)
```

[FormulaEvaluator.ts:318](../src/utils/FormulaEvaluator.ts#L318):
```typescript
plinthHeight: options?.plinthHeight ?? 0.15, // 15cm default
```

[GeometryBuilder.ts:307](../src/utils/GeometryBuilder.ts#L307):
```typescript
plinthHeight: context.plinthHeight ? context.plinthHeight / 100 : undefined, // Convert cm to meters
```

**Result:** `plinthHeight` = 0.15 meters (15cm)

### 5. Bug Calculation

**Formula:** `position_y = '-height / 2 + plinthHeight / 2'`

**For base-cabinet-60 (90cm tall):**
- height = 0.9m
- plinthHeight = 0.15m
- position_y = `-0.9 / 2 + 0.15 / 2`
- position_y = `-0.45 + 0.075`
- position_y = **-0.375m** (plinth center)

**Plinth bounds:**
- Center: Y = -0.375m
- Height: 0.15m
- Bottom: -0.375 - 0.075 = **-0.45m** (45cm below ground!)
- Top: -0.375 + 0.075 = **-0.3m** (30cm below ground!)

**With DynamicRenderer yPosition = 0:**
- Plinth bottom: 0 + (-0.45) = **-0.45m** ❌ Underground!
- Plinth top: 0 + (-0.3) = **-0.3m** ❌ Still underground!

**Cabinet Body:**
- Formula: `position_y = 'plinthHeight / 2'` = 0.075m
- cabinetHeight = 72cm = 0.72m (height - plinthHeight - 3cm countertop)
- Center: 0.075m
- Bottom: 0.075 - 0.36 = **-0.285m** ❌ Underground!
- Top: 0.075 + 0.36 = **0.435m** ✅ Above ground (but wrong base)

**This explains the "stumpy" appearance:**
- Plinth completely underground (invisible)
- Cabinet body starts underground
- Only top ~43cm visible above ground
- Cabinet appears short and "stumpy"

---

## Comparison: Base Cabinets vs Corner Cabinets

| Aspect | Corner Cabinets | Base Cabinets |
|--------|----------------|---------------|
| Migration | 20251018000008 (FIXED) | 20250130000010 (BROKEN) |
| Plinth position_y | `0.075` ✅ | `'-height / 2 + plinthHeight / 2'` ❌ |
| Cabinet position_y | `'height / 2 + 0.15'` ✅ | `'plinthHeight / 2'` ❌ |
| DynamicRenderer yPosition | `0` | `0` |
| Plinth bottom Y | 0m ✅ | -0.45m ❌ |
| **Result** | On ground ✅ | Underground ❌ |

---

## Solution: Update Base Cabinet Geometry ⭐

**Create migration:** `20251018000011_fix_base_cabinet_positioning.sql`

### Required Changes

**For all 6 base cabinets (30, 40, 50, 60, 80, 100cm):**

1. **Plinth position_y:** `0.075` (not `-height / 2 + plinthHeight / 2`)
2. **Cabinet Body position_y:** `height / 2 + 0.15` (sits on plinth)
3. **Door position_y:** `height / 2 + 0.15` (same as cabinet body)
4. **Handle position_y:** Adjust to new cabinet position

### Geometry Layout (90cm cabinet)

**Correct layout:**
```
Y = 0.90m  [Top of cabinet]
           ─────────────────
Y = 0.15m  │  Cabinet Body  │
           │     (75cm)     │
           │                │
           │     Door       │
           │                │
Y = 0.15m  ═════════════════  Plinth top
           ║   Plinth       ║
           ║   (15cm)       ║
Y = 0.00m  ═════════════════  Ground
```

**Position calculations:**
- Plinth:
  - position_y = `0.075` (center of 15cm plinth)
  - Bottom: 0.075 - 0.075 = 0m ✅
  - Top: 0.075 + 0.075 = 0.15m ✅

- Cabinet Body:
  - position_y = `height / 2 + 0.15`
  - For 90cm: 0.45 + 0.15 = 0.60m (center)
  - height = `height - 0.15` = 0.75m
  - Bottom: 0.60 - 0.375 = 0.225m (sits on plinth)
  - Top: 0.60 + 0.375 = 0.975m

Wait, that's wrong...

### Corrected Calculation

**Better approach - match corner cabinets:**

- **Plinth:**
  - dimension_height = `0.15` (15cm)
  - position_y = `0.075` (center at 7.5cm)
  - Bottom: 0.075 - 0.075 = **0m** ✅ Ground
  - Top: 0.075 + 0.075 = **0.15m** ✅ Plinth top

- **Cabinet Body:**
  - dimension_height = `height - 0.15` (75cm for 90cm cabinet)
  - position_y = `(height - 0.15) / 2 + 0.15`
  - For 90cm: `0.75 / 2 + 0.15` = `0.375 + 0.15` = **0.525m**
  - Bottom: 0.525 - 0.375 = **0.15m** ✅ Sits on plinth
  - Top: 0.525 + 0.375 = **0.9m** ✅ Top of cabinet

- **Door:**
  - dimension_height = `height - 0.17` (73cm - slightly shorter for clearance)
  - position_y = `(height - 0.17) / 2 + 0.15 + 0.01`
  - For 90cm: `0.73 / 2 + 0.16` = **0.525m** (centered on body)

Actually, let's use formula variables:

- **Cabinet Body:**
  - position_y = `height / 2 + plinthHeight / 2`
  - For 90cm: `0.9 / 2 + 0.15 / 2` = `0.45 + 0.075` = **0.525m** ✅

- **Door:**
  - position_y = `height / 2 + plinthHeight / 2`
  - Same as cabinet body: **0.525m** ✅

---

## Migration SQL

```sql
-- ================================================================
-- Migration: Fix Base Cabinet Positioning
-- ================================================================
-- Purpose: Fix base cabinet Y-positioning to use new 0-based system
-- Issue: Base cabinets use OLD system (-height/2) causing underground rendering
--
-- Changes:
-- 1. Plinth position_y: 0.075 (was: -height/2 + plinthHeight/2)
-- 2. Cabinet Body position_y: height/2 + plinthHeight/2 (was: plinthHeight/2)
-- 3. Door position_y: height/2 + plinthHeight/2 (was: plinthHeight/2)
-- 4. Handle position_y: height/2 + plinthHeight/2 + cabinetHeight/2 - 0.1
-- ================================================================

DO $$
DECLARE
  v_model_id uuid;
  v_component_id text;
BEGIN
  -- Process all 6 base cabinet variants
  FOR v_component_id IN
    SELECT UNNEST(ARRAY[
      'base-cabinet-30',
      'base-cabinet-40',
      'base-cabinet-50',
      'base-cabinet-60',
      'base-cabinet-80',
      'base-cabinet-100'
    ])
  LOOP
    RAISE NOTICE 'Fixing positioning for: %', v_component_id;

    -- Get model ID
    SELECT id INTO v_model_id
    FROM component_3d_models
    WHERE component_id = v_component_id;

    IF v_model_id IS NULL THEN
      RAISE NOTICE 'WARNING: Model not found: %', v_component_id;
      CONTINUE;
    END IF;

    -- Update Plinth position_y
    UPDATE geometry_parts
    SET position_y = '0.075'
    WHERE model_id = v_model_id
      AND part_name = 'Plinth';

    -- Update Cabinet Body position_y
    UPDATE geometry_parts
    SET position_y = 'height / 2 + plinthHeight / 2'
    WHERE model_id = v_model_id
      AND part_name = 'Cabinet Body';

    -- Update Door position_y
    UPDATE geometry_parts
    SET position_y = 'height / 2 + plinthHeight / 2'
    WHERE model_id = v_model_id
      AND part_name = 'Door';

    -- Update Handle position_y
    UPDATE geometry_parts
    SET position_y = 'height / 2 + plinthHeight / 2 + cabinetHeight / 2 - 0.1'
    WHERE model_id = v_model_id
      AND part_name = 'Handle';

  END LOOP;

  RAISE NOTICE 'Fixed positioning for 6 base cabinet variants';
END $$;

-- Verification
DO $$
DECLARE
  fixed_count INT;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM geometry_parts gp
  JOIN component_3d_models cm ON gp.model_id = cm.id
  WHERE cm.component_id LIKE 'base-cabinet%'
    AND gp.part_name = 'Plinth'
    AND gp.position_y = '0.075';

  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'VERIFICATION';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Base cabinets with fixed plinth positioning: % / 6', fixed_count;

  IF fixed_count = 6 THEN
    RAISE NOTICE '✅ All base cabinet plinths fixed!';
  ELSE
    RAISE WARNING '❌ Some base cabinets not fixed: % remaining', 6 - fixed_count;
  END IF;

  RAISE NOTICE '=============================================================================';
END $$;
```

---

## Testing Checklist

After running migration:

- [ ] Run `npx supabase db reset`
- [ ] Open 3D view
- [ ] Place base-cabinet-30 → Should sit on ground with visible plinth
- [ ] Place base-cabinet-60 → Should sit on ground with visible plinth
- [ ] Place base-cabinet-100 → Should sit on ground with visible plinth
- [ ] Verify plinth visible (15cm tall, darker color)
- [ ] Verify cabinet body sits directly on plinth (no gap)
- [ ] Verify door aligns with cabinet body
- [ ] Verify handle positioned on door
- [ ] Verify NO underground geometry
- [ ] Verify NO "stumpy" appearance
- [ ] Compare with corner-cabinet positioning (should match floor position)

---

## Files to Modify

1. ✅ **New:** `supabase/migrations/20251018000011_fix_base_cabinet_positioning.sql`
2. ⚠️ **Optional:** Add base-cabinet-60 to DynamicComponentRenderer preload list
3. ✅ **New:** `docs/session-2025-10-18-cabinet-positioning-fixes/BASE_CABINET_FIX.md`

---

## Related Issues

**Same bug pattern affects 3 component types:**

1. ✅ **Corner Cabinets** - FIXED in migration 20251018000008
   - Changed plinth: `0.075` (was: old offset system)
   - Changed cabinet: `height / 2 + 0.15`

2. ❌ **Pan Drawers** - IDENTIFIED, not yet fixed
   - Need migration 20251018000010
   - Same positioning fix required

3. ❌ **Base Cabinets** - IDENTIFIED, not yet fixed
   - Need migration 20251018000011
   - Same positioning fix required

**Root Cause:** All use OLD `-height / 2` offset system from early migrations.

**Solution Pattern:** Update position_y formulas to 0-based system (ground = Y:0).

---

## Implementation Order

**Recommended sequence:**

1. **Base Cabinets** (this issue) - Most common, highest priority
2. **Pan Drawers** - Common, same fix
3. **Code Review** - Check for other components with same pattern

**Combined fix option:**
- Create single migration fixing BOTH base cabinets AND pan drawers
- Migration: `20251018000011_fix_all_base_component_positioning.sql`
- Fixes base-cabinet-* (6 variants) + pan-drawers-* (6 variants)
- Total: 12 components, ~48 geometry parts updated

---

## Additional Notes

### Why didn't corner cabinet fix apply to base cabinets?

Corner cabinet fix (migration 20251018000008) was **component-specific**:
- Only updated `corner-cabinet`, `larder-corner-unit-90`, `larder-corner-unit-60`
- Did not touch base-cabinet-* or pan-drawers-*
- Each migration targets specific components

### cabinetHeight variable

**Value:** `height - plinthHeight - 0.03`
- For 90cm cabinet: `0.9 - 0.15 - 0.03` = **0.72m** (72cm)
- The 3cm is for countertop clearance

**Used in formulas:**
- `doorHeight` = Same as cabinetHeight (72cm)
- Handle positioning relative to cabinet height

### Render Condition

**Plinth has:** `render_condition = '!isWallCabinet'`

**Meaning:** Only render plinth if NOT a wall cabinet.
- Base cabinets: `isWallCabinet` = false → Plinth renders ✅
- Wall cabinets: `isWallCabinet` = true → Plinth hidden ✅

This is correct - wall cabinets mount on walls and don't need plinths.

---

## Handover Complete ✅

**Next agent should:**
1. Create migration `20251018000011_fix_base_cabinet_positioning.sql`
2. OR create combined migration for base cabinets + pan drawers
3. Test all 6 base cabinet variants in 3D view
4. Verify plinth visible at ground level
5. Verify no "stumpy" appearance
6. Document results

**Estimated total time:**
- Single migration (base cabinets only): 30 minutes
- Combined migration (base + pan drawers): 45 minutes

---

**Analysis completed:** 2025-10-18
**Analyzed by:** Claude (Session Continuation)
**Ready for implementation:** ✅ Yes
**User confirmation:** Screenshot evidence of underground rendering
