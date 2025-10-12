# Plinth Height (Toe-Kick) Analysis

## Executive Summary

**Finding:** The `plinth_height` column in the `components` table is **NOT currently used** by the application. Instead, plinth/toe-kick heights are hardcoded in multiple places with different values.

## Current State

### Database Column: `plinth_height`
- **Location:** `components` table
- **Status:** ⚠️ Exists but UNUSED
- **CSV Export:** Shows as "empty" for all 194 components
- **Actual DB:** User states column shows as populated, but values likely 0 or null

### Where Plinth/Toe-Kick IS Actually Used:

| Location | Value | Purpose |
|----------|-------|---------|
| **2D Elevation Rendering** | 10cm (default) | `component_2d_renders.elevation_data.toe_kick_height` |
| **3D DynamicComponentRenderer** | 15cm (hardcoded) | Base cabinet 3D models |
| **3D EnhancedModels3D** | 15cm (hardcoded) | Base cabinet 3D rendering |
| **3D FormulaEvaluator** | 15cm (default) | Formula calculations for 3D geometry |
| **ComponentService** | 10cm (hardcoded) | Default toe-kick component |

## Detailed Code Analysis

### 1. 2D Elevation Rendering (10cm default)

**Source:** `src/services/2d-renderers/elevation-view-handlers.ts`

```typescript
// Line 41 - Default to 10cm if not specified
const toeKickHeight = (data.toe_kick_height ?? 10) * zoom;

// data.toe_kick_height comes from:
// component_2d_renders table -> elevation_data JSON field
```

**Storage:** `component_2d_renders` table, `elevation_data` JSON column
```json
{
  "has_toe_kick": true,
  "toe_kick_height": 10
}
```

**Script that populates:** `scripts/populate-2d-renders.ts`
```typescript
// Line 151
toe_kick_height: isBaseCabinet ? 10 : 0,
```

### 2. 3D Rendering (15cm hardcoded)

**Source:** `src/components/3d/DynamicComponentRenderer.tsx`

```typescript
// Line 128-130 - Hardcoded 15cm
plinthHeight: 15, // cm (default 15cm plinth)
cabinetHeight: element.height - 15, // cm (height minus plinth)
doorHeight: element.height - 17, // cm (height minus plinth and gap)
```

**Source:** `src/components/designer/EnhancedModels3D.tsx`

```typescript
// Line 238 - Wall cabinets = 0, Base cabinets = 15cm
const plinthHeight = isWallCabinet ? 0 : 0.15; // 15cm plinth for base cabinets
```

**Source:** `src/utils/FormulaEvaluator.ts`

```typescript
// Line 318 - Default 15cm for formula calculations
plinthHeight: options?.plinthHeight ?? 0.15, // 15cm default
```

### 3. ComponentService (10cm for toe-kick type)

**Source:** `src/services/ComponentService.ts`

```typescript
// Line 725 - Default height for toe-kick component type
'toe-kick': 10,
```

## The Problem: Inconsistency

**2D vs 3D Mismatch:**
- 2D elevation views: 10cm toe-kick
- 3D rendering: 15cm plinth
- **Result:** Visual inconsistency between 2D and 3D views

**No Central Configuration:**
- Values are hardcoded in 5+ different locations
- Different terminology used (plinth vs toe-kick)
- Difficult to adjust per-component or per-region

## Database Structure Comparison

### Current: `components` table has `plinth_height`
```sql
-- NOT USED by application
-- Values: Empty/null/0
plinth_height DECIMAL
```

### Current: `component_2d_renders` table
```sql
-- USED by 2D elevation rendering
-- Stored in JSON field
elevation_data JSONB  -- Contains: { toe_kick_height: 10, has_toe_kick: true }
```

### No 3D Storage:
- 3D plinth height is hardcoded in renderer components
- No database column or configuration

## Why `plinth_height` Column Isn't Used

**Historical context (hypothesis):**
1. Column was created during initial database design
2. 2D rendering system was built using separate `component_2d_renders` table
3. 3D rendering used hardcoded values for simplicity
4. `plinth_height` column was never integrated into either system
5. Column exists but orphaned

## Recommendations

### Option 1: Keep Current System (Minimal Changes)

**Recommended if:** Current system works well, only need to fix inconsistency

**Changes:**
1. ✅ Keep `component_2d_renders.elevation_data.toe_kick_height` for 2D (used)
2. ✅ Keep 3D hardcoded values but standardize to **one value**
3. ✅ Drop unused `plinth_height` column from `components` table
4. ✅ Update hardcoded values to match (pick 10cm or 15cm)

**SQL:**
```sql
ALTER TABLE components DROP COLUMN plinth_height;
```

**Code changes:**
```typescript
// Standardize all 3D renderers to 10cm (to match 2D)
const STANDARD_PLINTH_HEIGHT = 10; // cm (matches 2D elevation default)

// OR standardize to 15cm and update 2D populate script
```

### Option 2: Centralize to `components` Table (Database-First)

**Recommended if:** Want per-component customization, unified data model

**Changes:**
1. ✅ Populate `components.plinth_height` with correct values
2. ✅ Update 2D render system to read from `components` table
3. ✅ Update 3D renderers to read from component data
4. ✅ Remove hardcoded values
5. ✅ Remove `toe_kick_height` from `component_2d_renders` (migrate to components table)

**Benefits:**
- Single source of truth
- Per-component customization
- Consistent 2D/3D rendering
- Easier to update (one place)

**Complexity:**
- Need to update multiple renderer files
- Need data migration from `component_2d_renders` to `components`
- Need to pass plinth_height through component creation flow

### Option 3: Leave As-Is (No Changes)

**Recommended if:** Inconsistency is not noticeable, low priority

**Status quo:**
- 2D uses 10cm from `component_2d_renders`
- 3D uses 15cm hardcoded
- `plinth_height` column unused

**Risk:**
- Continued visual inconsistency between 2D and 3D
- Multiple sources of truth
- Confusing for future developers

## Terminology Clarification

**Plinth vs Toe-Kick:**
- **Same thing!** Just different names for the recessed base of a cabinet
- **US:** Usually called "toe-kick"
- **UK/Europe:** Usually called "plinth"
- Application uses both terms interchangeably

**Purpose:**
- Creates recessed space under cabinet for feet
- Typical height: 10-15cm (4-6 inches)
- Only on base cabinets (floor-mounted)
- Wall cabinets have plinthHeight = 0

## Migration Path (If Choosing Option 2)

### Step 1: Populate `components.plinth_height`

```sql
-- Base cabinets: 10cm plinth (standardized)
UPDATE components
SET plinth_height = 10
WHERE type = 'cabinet'
  AND (default_z_position = 0 OR component_id NOT LIKE '%wall-cabinet%');

-- Wall cabinets: 0cm plinth
UPDATE components
SET plinth_height = 0
WHERE type = 'cabinet'
  AND (default_z_position > 0 OR component_id LIKE '%wall-cabinet%');

-- All other floor-mounted: 0cm (no plinth)
UPDATE components
SET plinth_height = 0
WHERE type NOT IN ('cabinet');
```

### Step 2: Update Component Interfaces

```typescript
// Add to DatabaseComponent
interface DatabaseComponent {
  // ... existing fields
  plinth_height?: number; // Height of plinth/toe-kick in cm
}

// Pass through drag-drop
const dragData = {
  // ... existing fields
  plinth_height: component.plinth_height
};
```

### Step 3: Update 3D Renderers

```typescript
// DynamicComponentRenderer.tsx (line 128)
plinthHeight: element.plinth_height ?? 10, // Use from DB, fallback to 10cm

// EnhancedModels3D.tsx (line 238)
const plinthHeight = element.plinth_height ?? (isWallCabinet ? 0 : 0.10); // meters

// FormulaEvaluator.ts (line 318)
plinthHeight: options?.plinthHeight ?? (componentData.plinth_height || 10) / 100, // convert cm to meters
```

### Step 4: Update 2D Renderer Fallback

```typescript
// elevation-view-handlers.ts (line 41)
const toeKickHeight = (data.toe_kick_height ?? element.plinth_height ?? 10) * zoom;
```

### Step 5: Eventual Cleanup (Phase 2)

Once stable:
- Remove `toe_kick_height` from `component_2d_renders.elevation_data`
- Use only `components.plinth_height`
- Single source of truth achieved

## Recommendation Summary

**Short-term (Immediate):**
✅ **Option 1** - Keep current system but standardize values
- Quick fix
- Low risk
- Resolves 2D/3D inconsistency
- Drop unused `plinth_height` column

**Long-term (Future Enhancement):**
✅ **Option 2** - Migrate to database-driven approach
- Consistent with `default_z_position` migration
- Enables per-component customization
- More maintainable
- Aligns with database-first strategy

**Immediate Action:**
```sql
-- Drop unused column to avoid confusion
ALTER TABLE components DROP COLUMN IF EXISTS plinth_height;
```

**Code fix (all 3D renderers):**
```typescript
// Standardize to 10cm to match 2D
const PLINTH_HEIGHT_CM = 10; // Standard toe-kick height
```

---

**Document Status:** Analysis Complete
**Affected Systems:** 2D Rendering, 3D Rendering, Component Database
**Risk Level:** Low (cosmetic inconsistency only)
**Priority:** Medium (visual quality improvement)
