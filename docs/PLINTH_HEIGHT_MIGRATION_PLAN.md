# Plinth Height Migration to Database-First Architecture

## Executive Summary

**Goal:** Centralize plinth/toe-kick height in `components.plinth_height` database column, eliminating hardcoded values and ensuring 2D/3D consistency.

**Current State:** Hardcoded in 5+ locations (10cm vs 15cm inconsistency)
**Target State:** Database-first with intelligent fallback (same pattern as `default_z_position`)
**Risk Level:** Low (fallback ensures nothing breaks)
**Estimated Effort:** 2-3 hours

## Architecture Decision: Option A (Recommended)

**Pattern:** Database → Component Load → Creation → Render

Same approach as `default_z_position` migration (just completed):
1. Load from database with component query
2. Pass through drag-drop data
3. Store in `DesignElement`
4. Renderers read from element

**Benefits:**
- ✅ Consistent with existing pattern
- ✅ Single source of truth
- ✅ 2D/3D will always match
- ✅ Per-component customization possible
- ✅ Cached in element (no repeated queries)
- ✅ Fallback safety built-in

## Migration Steps

### Step 1: Populate Database (SQL)

Run in Supabase Dashboard → SQL Editor:

```sql
BEGIN;

-- Base cabinets: 10cm standard plinth
UPDATE components
SET plinth_height = 10
WHERE type = 'cabinet'
  AND (default_z_position = 0 OR default_z_position IS NULL)
  AND component_id NOT LIKE '%wall-cabinet%';

-- Wall cabinets: 0cm (no plinth)
UPDATE components
SET plinth_height = 0
WHERE type = 'cabinet'
  AND (default_z_position > 0 OR component_id LIKE '%wall-cabinet%');

-- All wall-mounted components: 0cm
UPDATE components
SET plinth_height = 0
WHERE type IN ('cornice', 'pelmet', 'window', 'end-panel', 'wall-unit-end-panel')
   OR default_z_position > 0;

-- Counter-tops: 0cm (sit on cabinets)
UPDATE components
SET plinth_height = 0
WHERE type = 'counter-top';

-- Sinks: 0cm (integrated)
UPDATE components
SET plinth_height = 0
WHERE type = 'sink';

-- Appliances: 0cm (freestanding or integrated)
UPDATE components
SET plinth_height = 0
WHERE type = 'appliance';

-- All other floor-mounted: 0cm by default
UPDATE components
SET plinth_height = 0
WHERE plinth_height IS NULL
  AND (default_z_position = 0 OR default_z_position IS NULL);

-- Verification query
SELECT
  type,
  plinth_height,
  COUNT(*) as count
FROM components
GROUP BY type, plinth_height
ORDER BY type, plinth_height;

COMMIT;
```

**Expected results:**
- Base cabinets: 10cm (~72 components)
- Wall cabinets: 0cm (~7 components)
- All others: 0cm (~115 components)

### Step 2: Create Helper Function ✅

**File:** `src/utils/componentPlinthHelper.ts`

**Status:** ✅ Already created with:
- `getPlinthHeight()` - Full calculation with metadata
- `getPlinthHeightValue()` - Simple version (just the number)
- `plinthHeightToMeters()` - Convert for 3D (cm → meters)
- `shouldHavePlinth()` - Boolean check

**Features:**
- Database value priority
- Type-based fallback rules
- Same pattern as `componentZPositionHelper.ts`

### Step 3: Update TypeScript Interfaces

#### 3.1: DatabaseComponent (Already Has It!)

**Files:**
- `src/hooks/useOptimizedComponents.ts` (line 32)
- `src/components/designer/CompactComponentSidebar.tsx` (line 35)

```typescript
interface DatabaseComponent {
  // ... existing fields
  plinth_height?: number | null; // ✅ Already defined!
}
```

**Action:** ✅ No changes needed - field exists but never queried/used

#### 3.2: Ensure Database Query Includes Field

**File:** `src/hooks/useOptimizedComponents.ts` (line 80)

```typescript
// Current query - uses SELECT *
const { data, error } = await supabase
  .from('components')
  .select('*'); // ✅ Already includes plinth_height
```

**Action:** ✅ No changes needed - SELECT * includes all columns

#### 3.3: Add to Drag Data

**File:** `src/components/designer/CompactComponentSidebar.tsx` (line 261-273)

```typescript
// Current code:
const dragData = {
  id: component.component_id,
  name: component.name,
  type: component.type,
  width: component.width,
  depth: component.depth,
  height: component.height,
  color: component.color,
  category: component.category,
  roomTypes: component.room_types,
  description: component.description,
  default_z_position: component.default_z_position
};

// ADD:
  plinth_height: component.plinth_height // NEW!
```

#### 3.4: Add to DesignElement Interface

**File:** `src/types/project.ts` (around line 20)

```typescript
export interface DesignElement {
  // ... existing fields
  height: number; // Z-axis dimension (bottom-to-top)
  plinth_height?: number; // NEW: Plinth/toe-kick height in cm
  // ... rest of fields
}
```

### Step 4: Update Component Creation Functions

#### 4.1: Mobile Click-to-Add

**File:** `src/components/designer/CompactComponentSidebar.tsx` (line 222-256)

```typescript
// Import helper at top
import { getPlinthHeightValue } from '@/utils/componentPlinthHelper';

// In handleMobileClickToAdd function:
const defaultZ = getDefaultZ(component.type, component.component_id, component.default_z_position);
const plinthHeight = getPlinthHeightValue( // NEW!
  component.type,
  component.component_id,
  component.plinth_height,
  defaultZ
);

const newElement: DesignElement = {
  // ... existing fields
  z: defaultZ,
  plinth_height: plinthHeight, // NEW!
  // ... rest of fields
};
```

#### 4.2: Desktop Click-to-Select

**File:** `src/components/designer/CompactComponentSidebar.tsx` (line 368-402)

```typescript
// Same pattern as mobile
const defaultZ = getDefaultZ(component.type, component.component_id, component.default_z_position);
const plinthHeight = getPlinthHeightValue( // NEW!
  component.type,
  component.component_id,
  component.plinth_height,
  defaultZ
);

const element: DesignElement = {
  // ... existing fields
  plinth_height: plinthHeight, // NEW!
  // ... rest
};
```

#### 4.3: Drag-and-Drop

**File:** `src/components/designer/DesignCanvas2D.tsx` (around line 2660-2750)

```typescript
// Import helper at top
import { getPlinthHeightValue } from '@/utils/componentPlinthHelper';

// In handleDrop function (after getting defaultZ):
const defaultZ = getDefaultZ(
  componentData.type,
  componentData.id || componentData.component_id || '',
  componentData.default_z_position
);

const plinthHeight = getPlinthHeightValue( // NEW!
  componentData.type,
  componentData.id || componentData.component_id || '',
  componentData.plinth_height,
  defaultZ
);

// Add to newElement:
const newElement: DesignElement = {
  // ... existing fields
  z: defaultZ,
  plinth_height: plinthHeight, // NEW!
  // ... rest
};
```

### Step 5: Update Renderers

#### 5.1: 2D Elevation Renderer

**File:** `src/services/2d-renderers/elevation-view-handlers.ts`

```typescript
// Line 41 - Update fallback chain
// OLD:
const toeKickHeight = (data.toe_kick_height ?? 10) * zoom;

// NEW:
const toeKickHeight = (element.plinth_height ?? data.toe_kick_height ?? 10) * zoom;
// Priority: element → render definition → fallback
```

**Why keep `data.toe_kick_height`?**
- Allows per-component visual override if needed
- Second-level fallback for safety
- Eventual migration: remove once all use element.plinth_height

#### 5.2: 3D Dynamic Component Renderer

**File:** `src/components/3d/DynamicComponentRenderer.tsx`

```typescript
// Import helper at top
import { getPlinthHeightValue } from '@/utils/componentPlinthHelper';

// Line 128-130 - Replace hardcoded value
// OLD:
plinthHeight: 15, // cm (default 15cm plinth)
cabinetHeight: element.height - 15,
doorHeight: element.height - 17,

// NEW:
const plinthCm = element.plinth_height ?? getPlinthHeightValue(
  element.type,
  element.component_id,
  undefined,
  element.z
);

plinthHeight: plinthCm, // cm (from database or calculated)
cabinetHeight: element.height - plinthCm,
doorHeight: element.height - (plinthCm + 2), // 2cm gap
```

#### 5.3: 3D Enhanced Models

**File:** `src/components/designer/EnhancedModels3D.tsx`

```typescript
// Import helper at top
import { plinthHeightToMeters } from '@/utils/componentPlinthHelper';

// Line 238 - Replace hardcoded value
// OLD:
const plinthHeight = isWallCabinet ? 0 : 0.15; // 15cm plinth for base cabinets

// NEW:
const plinthHeight = element.plinth_height
  ? plinthHeightToMeters(element.plinth_height) // cm to meters
  : (isWallCabinet ? 0 : 0.10); // fallback: 0 or 10cm
```

#### 5.4: 3D Formula Evaluator

**File:** `src/utils/FormulaEvaluator.ts`

```typescript
// Line 318 - Update default value
// OLD:
plinthHeight: options?.plinthHeight ?? 0.15, // 15cm default

// NEW:
plinthHeight: options?.plinthHeight ??
  (componentData?.plinth_height ? componentData.plinth_height / 100 : 0.10), // cm to meters, 10cm default
```

### Step 6: Testing Checklist

After implementation, test:

**Component Creation:**
- [ ] Drag base cabinet → Check plinth_height set correctly
- [ ] Drag wall cabinet → Check plinth_height = 0
- [ ] Mobile click-to-add → Check plinth value
- [ ] Desktop click-to-select → Check plinth value

**2D Rendering:**
- [ ] Elevation view shows toe-kick for base cabinets
- [ ] Wall cabinets have no toe-kick
- [ ] Toe-kick height matches database (10cm)

**3D Rendering:**
- [ ] Base cabinets show plinth in 3D
- [ ] Wall cabinets have no plinth
- [ ] Cabinet height accounts for plinth correctly
- [ ] Door height accounts for plinth + gap

**Console Logs:**
- [ ] Check logs show source: 'database' for components with plinth_height set
- [ ] Check fallback works when database value missing

### Step 7: Cleanup (Phase 2 - Optional)

Once stable and tested:

**Remove hardcoded values:**
```typescript
// elevation-view-handlers.ts - Remove fallback
const toeKickHeight = element.plinth_height * zoom; // Database only

// Remove 10cm default constant from ComponentService.ts
// Line 725 - 'toe-kick': 10 can be removed
```

**Remove from component_2d_renders:**
- Eventually migrate away from `toe_kick_height` in render definitions
- Use only `components.plinth_height`
- Reduces duplicate storage

## Rollback Plan

If issues arise:

**Quick revert:**
```typescript
// Revert renderers to hardcoded values
const plinthHeight = element.plinth_height ?? 10; // Keep fallback active
```

**Git revert:**
```bash
git revert <commit-hash>
```

**Database rollback:**
```sql
-- Reset all to NULL if needed
UPDATE components SET plinth_height = NULL;
```

Fallback system ensures nothing breaks even if database empty.

## Benefits After Migration

**Consistency:**
- ✅ 2D and 3D always match
- ✅ Single source of truth

**Flexibility:**
- ✅ Per-component customization possible
- ✅ Regional variations (US vs UK standards)

**Maintainability:**
- ✅ Change in one place (database)
- ✅ No scattered hardcoded values
- ✅ Clear fallback logic

**Database-First:**
- ✅ Aligns with default_z_position pattern
- ✅ Consistent architecture
- ✅ Easier to reason about

## Timeline Estimate

- Step 1 (Database): 15 minutes
- Step 2 (Helper): ✅ Done
- Step 3 (Interfaces): 15 minutes
- Step 4 (Creation): 30 minutes
- Step 5 (Renderers): 45 minutes
- Step 6 (Testing): 30 minutes
- **Total: ~2.5 hours**

## Next Steps

1. Review this plan
2. Run Step 1 SQL in Supabase
3. Implement Steps 3-5 in order
4. Test thoroughly (Step 6)
5. Commit with rollback points between steps

---

**Document Status:** Ready for Implementation
**Pattern:** Same as default_z_position (proven approach)
**Risk:** Low (fallback ensures compatibility)
**Priority:** Medium (quality improvement)
