# Investigation Notes - Component Elevation View Issues

**Date:** 2025-10-19
**Branch:** `feature/component-elevation-fixes`
**Status:** ✅ **INVESTIGATION COMPLETE**

---

## Overview

This document captures the investigation process and findings for 4 component rendering issues identified by the user through visual inspection of 3D view, plan view, and front elevation view screenshots.

---

## Investigation Process

### Step 1: Understand the Problem

**User Report (with screenshots):**
1. Tall cabinets appear at 200cm but need to be 210cm to align with wall units
2. Countertops show handles in elevation view (shouldn't have handles)
3. Base units are 90cm total but should be 86cm (allowing 4cm countertop)
4. Corner cabinet doors are too wide (should be 30cm door + 60cm panel)

### Step 2: Map the Component System

**Reviewed:**
- `docs/COMPONENT_SYSTEM_COMPLETE_MAP.md` - Full architecture documentation
- Database schema for components, 3D models, 2D renders
- Rendering pipeline (3D and 2D)
- Code files for elevation view rendering

**Key Architecture Understanding:**
- **Hybrid system**: Configuration in database, rendering logic in code
- **2D Rendering**: Uses handlers dispatched by `elevation_type`
- **3D Rendering**: Uses formulas evaluated at runtime from `geometry_parts`
- **Database-driven**: Heights, dimensions stored in `components` table

### Step 3: Investigate Each Issue

---

## Issue #1: Tall Cabinet Heights

### Investigation Steps

1. **Searched database migrations** for tall unit definitions
2. **Found in:** `20250916000005_populate_components_catalog.sql`
3. **Found in:** `20250130000012_populate_tall_units_appliances.sql` (3D models)

### Findings

**Database (`components` table):**
```sql
-- Line 47: tall-unit-60
('tall-unit-60', 'Tall Unit 60cm', 'cabinet', 60, 60, 200, ...)

-- Line 48: tall-unit-80
('tall-unit-80', 'Tall Unit 80cm', 'cabinet', 80, 60, 200, ...)

-- Lines 28-29: Corner larders
('larder-corner-unit-60', ..., 200, ...)
('larder-corner-unit-90', ..., 200, ...)
```

**3D Models (`component_3d_models`):**
```sql
-- Line 38: tall-unit-60
default_width, default_height, default_depth, description
0.60, 2.00, 0.60,

-- Line 72: tall-unit-80
0.80, 2.00, 0.60,
```

**Geometry Parts (`geometry_parts`):**
- Uses formula-based positioning: `position_y = 'height / 2 + 0.075'`
- Cabinet body height: `'height - 0.15'` (height minus plinth)
- Door height: `'height - 0.17'` (height minus plinth minus gap)

**Affected Components:**
- `tall-unit-60`
- `tall-unit-80`
- `larder-corner-unit-60`
- `larder-corner-unit-90`
- Possibly: `oven-housing-60` (line 107: `default_height = 2.00`)

**Root Cause:**
- Components defined at 200cm in initial population migration
- No subsequent migration to update to 210cm

**Fix Required:**
- Update `components.height` from 200 to 210 (4 components)
- Update `component_3d_models.default_height` from 2.00 to 2.10 (4 models)
- Geometry formulas will auto-adjust

---

## Issue #2: Countertop Handles

### Investigation Steps

1. **Searched for counter-top 2D render definitions**
2. **Searched for counter-top elevation rendering logic**
3. **Reviewed elevation view handler registration**

### Findings

**Database (`component_2d_renders` table):**
- **NO 2D render definitions found** for counter-tops
- Query: `SELECT * FROM component_2d_renders WHERE component_id LIKE 'counter-top%'`
- Result: 0 rows

**Code (`src/services/2d-renderers/index.ts`):**
```typescript
// Line 144-153: Elevation view handler lookup
const handler = ELEVATION_VIEW_HANDLERS[elevationType];

if (!handler) {
  console.warn(...);
  // Fallback to standard cabinet
  renderStandardCabinet(ctx, element, {}, x, y, width, height, zoom, roomDimensions, view);
  return;
}
```

**Rendering Pipeline:**
1. Component has no 2D render definition → handler lookup fails
2. Falls back to `renderStandardCabinet` with empty data `{}`
3. `renderStandardCabinet` uses defaults:
   - `doorCount = data.door_count ?? 2` → 2 doors
   - `handleStyle = data.handle_style ?? 'bar'` → bar handles
   - `handlePosition = data.handle_position ?? 'center'` → center position

**Standard Cabinet Handler (`elevation-view-handlers.ts` lines 148-178):**
```typescript
// Line 149: Handles are drawn when handleStyle !== 'none'
if (handleStyle !== 'none') {
  ctx.fillStyle = handleColor;
  // ... draw handle
}
```

**Root Cause:**
- Counter-tops have NO 2D render definition
- Fall back to standard cabinet renderer
- Standard cabinet renderer draws handles by default
- No mechanism to skip handles for counter-tops

**Fix Required:**
- Add 2D render definitions for all counter-tops
- Set `elevation_data.handle_style = 'none'`
- Set `elevation_data.door_count = 0`
- Existing handler code already supports this configuration

---

## Issue #3: Base Unit Heights

### Investigation Steps

1. **Searched for base cabinet height definitions**
2. **Reviewed 3D geometry formulas for plinths and cabinet bodies**
3. **Calculated required height adjustments**

### Findings

**Database (`components` table):**
```sql
-- Lines 32-37: Base cabinets all at 90cm
('base-cabinet-30', 'Base Cabinet 30cm', 'cabinet', 30, 60, 90, ...)
('base-cabinet-40', 'Base Cabinet 40cm', 'cabinet', 40, 60, 90, ...)
('base-cabinet-50', 'Base Cabinet 50cm', 'cabinet', 50, 60, 90, ...)
('base-cabinet-60', 'Base Cabinet 60cm', 'cabinet', 60, 60, 90, ...)
('base-cabinet-80', 'Base Cabinet 80cm', 'cabinet', 80, 60, 90, ...)
('base-cabinet-100', 'Base Cabinet 100cm', 'cabinet', 100, 60, 90, ...)
```

**3D Models:**
```sql
-- All base cabinets: default_height = 0.90
```

**Geometry Parts (from `20250130000010_populate_base_cabinets.sql`):**
```sql
-- Plinth (line 87-95)
position_y: '-height / 2 + plinthHeight / 2'
dimension_height: 'plinthHeight' (15cm = 0.15m)

-- Cabinet Body (line 98-112)
position_y: 'plinthHeight / 2'
dimension_height: 'cabinetHeight' (72cm = 0.72m)
-- Comment line 109: "72cm high (90cm - 15cm plinth - 3cm counter-top)"
```

**Current Structure:**
- Plinth: 15cm
- Cabinet body: 72cm
- Counter-top: 3cm (mentioned in comment)
- **Total: 90cm** ✓ matches database

**Problem:**
- User specifies countertop should be 4cm (not 3cm)
- User wants overall height to remain 90cm
- Therefore base unit must be: 90cm - 4cm = 86cm

**Required Structure:**
- Plinth: 15cm (unchanged)
- Cabinet body: 71cm (reduced by 1cm)
- **Base unit total: 86cm** (new)
- Counter-top: 4cm (separate component)
- **Overall total: 90cm** ✓

**Affected Components:**
- All base cabinets (6 variants: 30, 40, 50, 60, 80, 100cm)
- Pan drawers (6 variants)
- Corner base cabinets
- Sink units (if base-height)

**Root Cause:**
- Original design assumed 3cm countertop
- Actual countertops are 4cm (line 50-53 in catalog: `height = 4`)
- Base units need 1cm reduction to accommodate

**Fix Required:**
- Update `components.height` from 90 to 86 (12+ components)
- Update `component_3d_models.default_height` from 0.90 to 0.86
- Geometry formulas will auto-adjust (using `height - plinthHeight`)

---

## Issue #4: Corner Cabinet Door Width

### Investigation Steps

1. **Located corner cabinet rendering function**
2. **Analyzed door width calculation logic**
3. **Identified hardcoded 50/50 split**

### Findings

**Code (`src/services/2d-renderers/elevation-view-handlers.ts`):**

**Lines 468-656: `renderCornerCabinetDoors()` function**

**Lines 571-573: Door width calculation**
```typescript
// Calculate door and panel widths (50% each)
const doorWidth = (width - doorInset * 2 - doorGap) / 2;
const panelWidth = (width - doorInset * 2 - doorGap) / 2;
```

**Problem:**
- Door and panel split equally (50/50)
- For 90cm corner cabinet: 45cm door + 45cm panel
- User wants: 30cm door + 60cm panel

**Rendering Logic:**
- Lines 576-603: Door on left, panel on right
- Lines 604-631: Door on right, panel on left
- Panel has NO handle (line 601, 610: no handle code)
- Door HAS handle (lines 585-598, 617-630)

**Corner Detection:**
- Lines 512-569: 3-tier priority system for door side
  1. Manual override from database
  2. Auto-detect from corner position
  3. Fallback to 'left'

**Database Configuration:**
- `elevation_data.corner_door_side` - manual override
- `elevation_data.is_corner` - corner flag
- NO `corner_door_width_cm` field currently

**Root Cause:**
- Hardcoded 50/50 split in calculation
- No database configuration for door width
- Legacy design assumption

**Fix Required:**
- Change calculation to fixed 30cm door width
- Panel width = remaining width
- Add fallback for narrow cabinets (< 60cm total)
- Consider adding database field for customization (future)

---

## Key Insights

### 1. Database-Driven Architecture Works Well

**Strengths:**
- Height changes only require database updates
- Geometry formulas auto-adjust
- No code changes for dimensional modifications

**Limitations:**
- Some logic still hardcoded (door width split)
- Fallback behavior when missing 2D render definitions

### 2. Migration History is Critical

**Finding:** Original population migrations (2025-09-16) set initial values that now need updating.

**Lesson:** Track original assumptions in migration comments:
- Base units assumed 3cm countertop (actually 4cm)
- Tall units set to 200cm (now need 210cm)

### 3. Fallback Behavior Can Hide Issues

**Counter-top Issue:**
- No error thrown when 2D render missing
- Silent fallback to standard-cabinet handler
- Renders incorrectly but looks "reasonable"

**Recommendation:** Add logging/warnings for missing 2D renders

### 4. Formula-Based Positioning is Powerful

**3D Geometry:**
- Uses variables: `height`, `width`, `depth`, `plinthHeight`, `cabinetHeight`
- Formulas like: `position_y = 'height / 2 + plinthHeight / 2'`
- Single height update propagates to all geometry parts

**Example (Base Cabinet):**
- Change `default_height` from 0.90 to 0.86
- Plinth position auto-adjusts: `-0.86/2 + 0.075 = -0.355` (was `-0.375`)
- Cabinet body auto-adjusts: `0.86 - 0.15 = 0.71` (was `0.72`)
- Door height auto-adjusts: same formula

---

## Files Investigated

### Database Migrations (Read)
1. `supabase/migrations/20250916000005_populate_components_catalog.sql`
2. `supabase/migrations/20250130000010_populate_base_cabinets.sql`
3. `supabase/migrations/20250130000012_populate_tall_units_appliances.sql`
4. `supabase/migrations/20250916000002_populate_tall_corner_larders.sql`
5. `supabase/migrations/20251009000001_create_2d_renders_schema.sql`
6. `supabase/migrations/20250131000030_add_2d_renders_for_corner_cabinets.sql`

### Code Files (Read)
1. `src/services/2d-renderers/index.ts` (292 lines)
2. `src/services/2d-renderers/elevation-view-handlers.ts` (688 lines)
3. `src/components/designer/DesignCanvas2D.tsx` (referenced but not fully read)

### Documentation (Referenced)
1. `docs/COMPONENT_SYSTEM_COMPLETE_MAP.md` (created in this session)
2. `docs/session-2025-10-18-Component-fixes/IMPLEMENTATION_COMPLETE.md` (read)
3. `docs/session-2025-10-09-2d-database-migration/README.md` (read)
4. `docs/session-2025-10-17-alignment-positioning-fix/2D-3D-COORDINATE-MISMATCH-ANALYSIS.md` (read)

---

## Component Count Summary

### Affected by Issue #1 (Tall Cabinets)
- **4 components:** tall-unit-60, tall-unit-80, larder-corner-unit-60, larder-corner-unit-90
- **4 models:** Same 4 components in `component_3d_models`

### Affected by Issue #2 (Counter-tops)
- **10+ components:** All counter-top variants (60, 80, 100, 120, etc.)
- **0 2D renders:** None currently exist in database

### Affected by Issue #3 (Base Units)
- **6 base cabinets:** base-cabinet-30, 40, 50, 60, 80, 100
- **6 pan drawers:** pan-drawers-30, 40, 50, 60, 80, 100
- **2+ corner units:** corner-base-cabinet-90, corner-cabinet-90
- **Unknown sinks:** Depends on sink base height (90cm or custom)
- **Total: 15-20 components**

### Affected by Issue #4 (Corner Doors)
- **Code change only:** Affects all corner cabinets dynamically
- **No database changes** (unless adding customization field)

---

## Testing Strategy

### Unit Testing
- Test formula evaluation with new heights
- Test handler dispatch with missing 2D renders
- Test corner door width calculation with edge cases

### Integration Testing
- Run migrations in sequence
- Verify database integrity after each
- Check foreign key relationships

### Visual Regression Testing
- Capture before/after screenshots
- Compare elevation views side-by-side
- Verify 3D rendering matches expectations

### Edge Cases to Test
1. Corner cabinets < 60cm width (fallback to 50/50 split)
2. Counter-tops without 2D renders (should now have them)
3. Tall units in various room configurations
4. Base units with different plinth heights (if customizable)

---

## Recommendations for Future

### 1. Add Validation to Migrations
```sql
-- Example: Ensure base units + countertops = 90cm
SELECT component_id, height
FROM components
WHERE component_type IN ('cabinet', 'counter-top')
  AND height NOT IN (86, 4);
-- Should return 0 rows
```

### 2. Add Logging for Missing 2D Renders
```typescript
if (!renderDef) {
  console.warn(`[Render2D] Missing definition for ${element.component_id} - using fallback`);
  // Track in analytics
}
```

### 3. Document Assumptions in Code Comments
```typescript
// ASSUMPTION: Base units are 86cm to allow 4cm countertop (total 90cm)
const BASE_UNIT_HEIGHT = 0.86;
const COUNTERTOP_HEIGHT = 0.04;
```

### 4. Create Component Height Constants
```typescript
export const COMPONENT_HEIGHTS = {
  BASE_UNIT: 86,         // cm
  COUNTERTOP: 4,          // cm
  TALL_UNIT: 210,         // cm
  WALL_UNIT: 72,          // cm
  PLINTH: 15,             // cm
} as const;
```

---

## Session Timeline

**Start:** 2025-10-19 (investigation phase)

**Investigation Steps:**
1. ✅ Created session folder
2. ✅ Switched to feature branch (`feature/component-elevation-fixes`)
3. ✅ Searched database migrations for component definitions
4. ✅ Analyzed 3D model geometry formulas
5. ✅ Reviewed 2D rendering code and handlers
6. ✅ Identified root causes for all 4 issues
7. ✅ Created comprehensive fix plan
8. ✅ Documented investigation notes (this file)

**Next Steps:**
- [ ] Review plan with user
- [ ] Get approval to proceed
- [ ] Execute Phase 1 (database migrations)
- [ ] Execute Phase 2 (code changes)
- [ ] Execute Phase 3 (testing and verification)

---

**Investigation Status:** ✅ COMPLETE
**Created:** 2025-10-19
**Last Updated:** 2025-10-19
**Investigator:** Claude (AI Assistant)
