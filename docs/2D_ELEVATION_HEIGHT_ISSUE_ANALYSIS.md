# 2D Elevation Height Issue - Root Cause Analysis

**Date**: 2025-10-26
**Reported By**: User
**Status**: ⚠️ Root Cause Identified - Awaiting Fix Approval
**Severity**: Medium (Visual accuracy issue, does not break functionality)

---

## Executive Summary

The 2D elevation views are displaying base cabinets and drawer units at **incorrect heights** (90cm instead of the correct 86cm). This investigation reveals that the issue stems from **multiple conflicting database values and hardcoded fallbacks** across the codebase, NOT from the recent Story 1.8 work on Z positions.

**Root Cause**: Three separate issues creating height discrepancies:
1. ❌ `components.elevation_height` set to **85cm** (should be 86cm)
2. ❌ `ComponentService.ts` hardcoded fallbacks to **85cm** (should be 86cm)
3. ⚠️ Existing design elements may have `height: 90` stored from legacy data

---

## Issue Description

### User-Reported Symptoms

From screenshots and browser console logs:
- ✅ **3D View**: Base cabinets and corner units render correctly at 86cm
- ❌ **2D Elevation View (Front)**: Base cabinets showing as 90cm, corner unit correct at 86cm
- ❌ **2D Elevation View (Front)**: Drawer units (pan drawers) showing incorrect height
- ❌ **2D Elevation View**: Worktop positioned too high (should start at 86cm)

### Affected Components

- Base cabinets (category: `base-cabinets`)
- Drawer units / Pan drawers (containing "drawer" or "pan" in name)
- Potentially other components using `elevation_height` field

---

## Architecture Overview: How 2D Elevation Rendering Works

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT PLACEMENT                       │
│  (CompactComponentSidebar.tsx, lines 226-240)               │
│                                                              │
│  When user adds component to canvas:                        │
│  newElement.height = component.height  ← From components DB │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    DESIGN ELEMENT STORAGE                    │
│  (room_designs.design_elements JSONB field)                 │
│                                                              │
│  Stores element with height property from components table  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    2D CANVAS RENDERING                       │
│  (DesignCanvas2D.tsx, line 156 & 1394)                      │
│                                                              │
│  Uses: element.height || 86  ← Fallback to 86cm            │
└─────────────────────────────────────────────────────────────┘
```

### Database Tables Involved

**Two Separate Database Systems**:

1. **`components` table** - Main component library
   - Fields: `height`, `elevation_height`, `default_z_position`
   - Used when: Creating new design elements
   - Updated in: Story 1.8 (default_z_position only)

2. **`component_2d_renders` table** - 2D rendering definitions
   - Fields: `elevation_data` (JSONB), SVG paths
   - Used when: Render2DService loads rendering metadata
   - **NOT directly used for heights** - discovered through investigation

---

## Data Flow Analysis

### When User Adds Component (CompactComponentSidebar.tsx)

```typescript
// Line 226-234
const newElement: DesignElement = {
  id: `${component.component_id}-${Date.now()}`,
  component_id: component.component_id,
  type: component.type as any,
  x: 200,
  y: 150,
  z: 0,
  width: component.width,
  height: component.height,      // ← Gets value from components.height
  depth: component.depth,
  // ...
};
```

**Key Discovery**: Elements get their `height` from `components.height` in the database.

### When Canvas Renders Element (DesignCanvas2D.tsx)

```typescript
// Line 156 (and 1394, 2149)
const height = element.height || 86; // Use actual height, fallback 86cm
```

**Key Discovery**: Canvas uses `element.height` directly, with 86cm fallback.

### Height Lookup via ComponentService (ComponentService.ts)

```typescript
// Line 224-270: getElevationHeight() method
static async getElevationHeight(componentId: string, componentType: string): Promise<number> {
  // Check cache
  if (elevationCache.has(componentId)) {
    const cached = elevationCache.get(componentId)!;
    return cached.use_actual_height
      ? cached.height
      : (cached.elevation_height || cached.height);  // ← Uses elevation_height!
  }

  // Fetch from database
  const { data } = await supabase
    .from('components')
    .select('height, elevation_height, component_behavior')
    .eq('component_id', componentId)
    .single();

  // Determine which height to use
  if (elevationData.use_actual_height || elevationData.is_tall_unit) {
    return elevationData.height;
  } else if (elevationData.elevation_height) {
    return elevationData.elevation_height;  // ← Problem: Returns 85cm!
  } else {
    return elevationData.height;
  }
}

// HARDCODED FALLBACKS (Lines 107, 130, 183, 213)
elevation_height: 85,  // ← Should be 86!
```

**Key Discovery**: Multiple hardcoded fallbacks to **85cm** instead of **86cm**.

---

## Root Cause Identified

### Problem 1: Incorrect `elevation_height` in Database

**Migration File**: `20250915000003_phase1_populate_component_data.sql`

```sql
-- Line 12: Base cabinets
UPDATE public.components
SET elevation_height = 85  -- ❌ WRONG! Should be 86
WHERE category = 'base-cabinets';

-- Line 20: Base units
UPDATE public.components
SET elevation_height = 85  -- ❌ WRONG! Should be 86
WHERE category = 'base-units';
```

**Impact**: When `ComponentService.getElevationHeight()` is called, it returns 85cm.

### Problem 2: Hardcoded 85cm Fallbacks in ComponentService.ts

**File**: `src/services/ComponentService.ts`

**Lines with hardcoded 85cm**:
- Line 107: `elevation_height: 85,`
- Line 130: `elevation_height: 85,`
- Line 183: `elevation_height: 85,`
- Line 213: `elevation_height: 85,`
- Line 245: `return typeBehavior.elevation_height || 85;`

**Impact**: When database lookup fails, code falls back to 85cm instead of 86cm.

### Problem 3: Legacy Design Elements with height=90

**Issue**: Existing design elements may have been created before height corrections and have `height: 90` stored in `room_designs.design_elements` JSONB.

**Evidence**:
- Migration `20251019000003_update_base_cabinet_heights.sql` updated `components.height` to 86cm
- But this doesn't update existing design elements that were already placed

---

## Why 3D View Works Correctly

The 3D rendering system likely:
1. Uses `components.height` (corrected to 86cm in migration `20251019000003`)
2. OR calculates heights dynamically from model data
3. Does NOT use the problematic `elevation_height` field

This is why users see correct heights in 3D but wrong heights in 2D elevation views.

---

## Why Story 1.8 Didn't Fix This

**Story 1.8 Work**: Added `default_z_position` column to `components` table

**Migration**: `20250131000029_add_default_z_position_to_components.sql`

```sql
-- Story 1.8 only touched Z positions, NOT heights
ALTER TABLE public.components
ADD COLUMN IF NOT EXISTS default_z_position DECIMAL(10,2);

UPDATE public.components
SET default_z_position = 0
WHERE category IN ('base-cabinet', ...);

UPDATE public.components
SET default_z_position = 86  -- ← Countertop Z position, not cabinet height!
WHERE category IN ('worktop', 'countertop', 'counter-top');
```

**Key Point**: The migration corrected **Z positions** (vertical placement off ground), NOT **height** (vertical dimension of components).

Z position and height are separate concepts:
- **Z position (default_z_position)**: Where component sits (e.g., countertop at Z=86cm)
- **Height**: How tall component is (e.g., base cabinet is 86cm tall)

---

## Affected Database Fields

### `components` Table

| Field | Current Value | Should Be | Status |
|-------|--------------|-----------|---------|
| `height` | 86cm | 86cm | ✅ Correct (fixed in migration `20251019000003`) |
| `elevation_height` | 85cm | 86cm | ❌ Wrong (set in migration `20250915000003`) |
| `default_z_position` | 0cm | 0cm | ✅ Correct (Story 1.8) |

### `room_designs.design_elements` (JSONB)

| Field | Current Value | Should Be | Status |
|-------|--------------|-----------|---------|
| `height` | Varies (may be 90cm in legacy data) | 86cm | ⚠️ Needs migration |

---

## Proposed Solutions

### Option A: Update Database `elevation_height` Field ⭐ **RECOMMENDED**

**Action**: Update `elevation_height` from 85cm to 86cm for base cabinets and drawer units

**Migration SQL**:
```sql
-- Fix elevation_height for base cabinets
UPDATE public.components
SET elevation_height = 86
WHERE category IN ('base-cabinets', 'base-units')
  AND elevation_height = 85;

-- Fix elevation_height for drawer units
UPDATE public.components
SET elevation_height = 86
WHERE (name ILIKE '%drawer%' OR name ILIKE '%pan%')
  AND elevation_height = 85;
```

**Pros**:
- ✅ Fixes root cause in database
- ✅ Consistent with `components.height` (already 86cm)
- ✅ No code changes needed
- ✅ Future components will use correct value

**Cons**:
- ⚠️ Requires database migration deployment
- ⚠️ Need to clear ComponentService cache

**Impact**:
- Fixes new component placements immediately
- Does NOT fix existing design elements (see Option C)

---

### Option B: Update Hardcoded Fallbacks in ComponentService.ts

**Action**: Change all `elevation_height: 85` to `elevation_height: 86`

**Files to Edit**:
- `src/services/ComponentService.ts` (5 locations)

**Code Changes**:
```typescript
// Line 107, 130, 183, 213 - Change to:
elevation_height: 86,

// Line 245 - Change to:
return typeBehavior.elevation_height || 86;
```

**Pros**:
- ✅ Quick code fix, no database migration
- ✅ Fixes fallback behavior
- ✅ Can deploy immediately

**Cons**:
- ❌ Doesn't fix database values (still 85cm in DB)
- ❌ Inconsistent with database
- ❌ Only fixes cases where database lookup fails
- ❌ Still need Option A for proper fix

**Recommendation**: Do this ONLY in combination with Option A.

---

### Option C: Migrate Existing Design Elements (Optional)

**Action**: Update `height` in existing design elements stored in `room_designs.design_elements` JSONB

**Challenge**: JSONB array updates are complex in PostgreSQL

**Migration SQL** (complex):
```sql
-- Update height in design_elements JSONB array
UPDATE public.room_designs
SET design_elements = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'type' IN ('cabinet')
           AND (elem->>'height')::numeric IN (90, 85)
      THEN jsonb_set(elem, '{height}', '86'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(design_elements) AS elem
)
WHERE design_elements IS NOT NULL;
```

**Pros**:
- ✅ Fixes existing user designs
- ✅ Retroactive fix for legacy data

**Cons**:
- ⚠️ Complex JSONB manipulation
- ⚠️ Risk of data corruption if query is wrong
- ⚠️ Need comprehensive backup before running
- ⚠️ May affect thousands of design elements

**Recommendation**: Only if users report widespread issues with existing designs.

---

### Option D: Remove `elevation_height` Entirely (Refactor)

**Action**: Deprecate `elevation_height` field and always use `height`

**Rationale**: Having two separate height fields creates confusion and sync issues.

**Code Changes**:
- Modify `ComponentService.getElevationHeight()` to return `height` field only
- Ignore `elevation_height` field entirely
- Remove migration code that sets `elevation_height`

**Pros**:
- ✅ Simplifies architecture
- ✅ Prevents future sync issues
- ✅ Single source of truth for heights

**Cons**:
- ❌ Larger refactor (affects multiple files)
- ❌ May break if `elevation_height` was intended for different purpose
- ❌ Need to verify no components rely on different elevation vs 3D heights

**Recommendation**: Good long-term fix, but requires architectural review.

---

## Recommended Fix Strategy

### Phase 1: Database Fix (Immediate)

**Priority**: P0 (Blocking user workflow)

1. **Create migration**: Fix `elevation_height` from 85cm → 86cm
   - Update base cabinets
   - Update drawer units
   - Verify no other affected components

2. **Update ComponentService.ts**: Fix hardcoded 85cm fallbacks → 86cm
   - Lines 107, 130, 183, 213, 245

3. **Deploy both changes** together (database + code)

**Testing**:
- ✅ Create NEW base cabinet → Should show 86cm in elevation view
- ✅ Create NEW drawer unit → Should show 86cm in elevation view
- ✅ Verify 3D view still correct
- ✅ Verify no regressions in other component types

### Phase 2: Legacy Data Fix (Optional)

**Priority**: P2 (User reported issue)

1. **Identify affected designs**:
   - Query for design elements with height=90 or height=85
   - Estimate impact (how many users affected)

2. **IF significant impact**: Run JSONB migration (Option C)
   - Take full database backup first
   - Test on staging environment
   - Run migration during low-traffic window
   - Verify designs still render correctly

3. **IF minimal impact**:
   - Document that users can delete and re-add affected components
   - Provide clear instructions in UI

### Phase 3: Architecture Cleanup (Future)

**Priority**: P3 (Technical debt)

1. **Evaluate need for `elevation_height` field**:
   - Are there cases where elevation height should differ from actual height?
   - If no, deprecate and remove field (Option D)
   - If yes, document the use case clearly

2. **Add validation**:
   - Database constraint: `elevation_height` should match `height` for base units
   - OR: Clear documentation on when they should differ

3. **Prevent future issues**:
   - Add unit tests for height calculations
   - Add integration tests for component placement
   - Document height vs Z position clearly

---

## Files That Need Changes (Option A + B)

### Database Migration

**Create**: `supabase/migrations/20251026000001_fix_elevation_height.sql`

```sql
-- Fix elevation_height for base cabinets and drawer units
-- Issue: Hardcoded to 85cm, should be 86cm to match components.height

UPDATE public.components
SET elevation_height = 86
WHERE category IN ('base-cabinets', 'base-units')
  AND elevation_height = 85;

UPDATE public.components
SET elevation_height = 86
WHERE (name ILIKE '%drawer%' OR name ILIKE '%pan%')
  AND elevation_height = 85;

-- Verify results
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.components
  WHERE elevation_height = 86
    AND category IN ('base-cabinets', 'base-units');

  RAISE NOTICE 'Updated % components to elevation_height=86cm', updated_count;
END $$;
```

### Code Changes

**File**: `src/services/ComponentService.ts`

**Lines to change**:
- Line 107: `elevation_height: 85,` → `elevation_height: 86,`
- Line 130: `elevation_height: 85,` → `elevation_height: 86,`
- Line 183: `elevation_height: 85,` → `elevation_height: 86,`
- Line 213: `elevation_height: 85,` → `elevation_height: 86,`
- Line 245: `return typeBehavior.elevation_height || 85;` → `return typeBehavior.elevation_height || 86;`

---

## Testing Plan

### Manual Testing

1. **Create new base cabinet**:
   - Add to canvas
   - Switch to front elevation view
   - Measure height → Should be 86cm

2. **Create new drawer unit**:
   - Add to canvas
   - Switch to front elevation view
   - Measure height → Should be 86cm

3. **Create new corner cabinet**:
   - Add to canvas
   - Switch to front elevation view
   - Verify height matches base cabinets (86cm)

4. **Check countertop**:
   - Add to canvas
   - Verify sits at Z=86cm (bottom)
   - Verify top at Z=90cm (4cm thick)

5. **Verify 3D view**:
   - All components still render correctly
   - Heights match 2D elevation view

### Automated Testing (Future)

**Create**: `src/services/ComponentService.test.ts`

```typescript
describe('ComponentService.getElevationHeight', () => {
  it('should return 86cm for base cabinets', async () => {
    const height = await ComponentService.getElevationHeight(
      'base-cabinet-60x90',
      'cabinet'
    );
    expect(height).toBe(86);
  });

  it('should return 86cm for drawer units', async () => {
    const height = await ComponentService.getElevationHeight(
      'pan-drawer-60',
      'cabinet'
    );
    expect(height).toBe(86);
  });
});
```

---

## Impact Assessment

### User Impact

**Current State**:
- ❌ Users see incorrect heights in 2D elevation views
- ❌ Worktop appears too high
- ❌ Cabinet heights don't match physical reality
- ✅ 3D view is correct (confusion for users)

**After Fix**:
- ✅ New components show correct 86cm height
- ✅ 2D and 3D views consistent
- ⚠️ Existing designs may still show wrong heights (need Option C)

### Developer Impact

**Maintenance**:
- 🔧 One database migration to deploy
- 🔧 Five lines of code to change
- 📝 Update TypeScript types after migration
- 🧪 Add test coverage

**Technical Debt Reduction**:
- ✅ Fixes hardcoded magic numbers
- ✅ Aligns database with code
- ⚠️ Still have two height fields (future refactor)

---

## Questions for User

Before implementing fix:

1. **Migration timing**: Should we deploy database migration immediately, or wait for low-traffic window?

2. **Existing designs**: Should we migrate existing design elements (Option C), or is it acceptable to only fix new components?

3. **Architecture decision**: Should we keep `elevation_height` field separate, or refactor to use only `height` (Option D)?

4. **Testing coverage**: Do you want automated tests added as part of this fix?

5. **User notification**: Should affected users be notified that they need to re-add components?

---

## Related Documentation

- **Story 1.7**: [Component Position Validator](../stories/1.7-component-position-validator.md)
- **Story 1.8**: [Audit Component Library Z Positions](../session-2025-10-26-story-1.8-z-positions/)
- **Migration**: [Add default_z_position](../../supabase/migrations/20250131000029_add_default_z_position_to_components.sql)
- **Session Notes**: [Story 1.7 Session](../session-2025-10-26-story-1.7-position-validator/SESSION_NOTES.md)

---

## Conclusion

The 2D elevation height issue is caused by **three separate problems**:
1. Database `elevation_height` field set to 85cm instead of 86cm
2. Hardcoded fallbacks in `ComponentService.ts` using 85cm instead of 86cm
3. Legacy design elements potentially storing height=90cm

**Root cause is NOT related to Story 1.8 work** - that work only touched Z positions (vertical placement), not heights (vertical dimensions).

**Recommended fix**: Implement **Option A + Option B** together (database migration + code fix) to ensure consistency.

**Optional follow-up**: If users report issues with existing designs, implement **Option C** (migrate legacy data).

**Long-term**: Consider **Option D** (remove `elevation_height` field) to prevent future sync issues.

---

**Next Steps**: Await user approval on fix strategy before implementing changes.
