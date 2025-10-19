# Session 2025-10-19: Component Positioning Fixes

## Session Overview

**Date**: October 19, 2025
**Duration**: Continuation from previous session
**Focus**: Fix component rendering issues - pan drawers, countertops, and larder units
**Branch**: `feature/database-component-cleanup`

## Initial Context

This session continued from a previous session that had fixed corner cabinets. The user reported that pan drawers were not rendering in 3D view, and base cabinets appeared "stumpy" or sinking through the floor.

## Issues Identified and Fixed

### 1. Pan Drawers Not Rendering

**Problem**: Pan drawers existed in database with geometry but didn't appear in 3D view.

**Root Causes**:
1. Missing ComponentIDMapper rule for pan drawer pattern
2. Cabinet body positioned too high (floating above plinth)

**Migrations Created**:
- None for ComponentIDMapper (code change only)
- `20251018000014_fix_pan_drawer_cabinet_body_position.sql`

**Changes Made**:

*Code Change - src/utils/ComponentIDMapper.ts (lines 97-102):*
```typescript
{
  pattern: /pan-drawer/i,
  mapper: (elementId, width) => `pan-drawers-${width}`,
  description: 'Pan drawer units (30, 40, 50, 60, 80, 100cm)',
  priority: 50,
}
```

*Database Change:*
- Cabinet Body position_y: `'height / 2 + 0.15'` → `'height / 2 + plinthHeight / 2'`
- For 90cm cabinet: 0.6m → 0.525m center
- Eliminates 7.5cm gap between plinth and cabinet body

**Result**: All 6 pan drawer variants now render correctly with cabinet body sitting directly on plinth.

---

### 2. Old Fixed-Size Countertops Cleanup

**Problem**: Sidebar cluttered with legacy fixed-size countertops (60, 80, 100, 120cm) that are redundant.

**Migration Created**: `20251018000015_remove_old_fixed_size_countertops.sql`

**Components Removed**:
- counter-top-60 (60x60x4cm)
- counter-top-80 (80x60x4cm)
- counter-top-100 (100x60x4cm)
- counter-top-120 (120x60x4cm)

**Components Kept**:
- counter-top-horizontal (300x60x4cm) - for left-to-right
- counter-top-vertical (60x300x4cm) - for front-to-back

**Rationale**: Horizontal and vertical countertops are procedurally generated in `EnhancedCounterTop3D` component. Fixed-size variants were legacy components from old system.

**Result**: Cleaner component sidebar with only functional countertop options.

---

### 3. Larder Units Sinking Through Floor

**Problem**: 3 larder units in "Larder Units" category were sinking 92.5cm underground.

**Affected Components**:
- tall-unit-60 (Tall Unit 60cm)
- tall-unit-80 (Tall Unit 80cm)
- oven-housing-60 (Oven Housing 60cm)

**Migration Created**: `20251018000016_fix_larder_unit_positioning.sql`

**Root Cause**:
- Plinth position_y = `'-height / 2 + 0.075'`
- For 200cm unit: -1.0 + 0.075 = **-0.925m (92.5cm underground!)**

**Fix Applied**:
- Plinth position_y: `'-height / 2 + 0.075'` → `'0.075'`
- Changed from OLD positioning system to NEW 0-based system
- Plinth now at ground level with center at 7.5cm

**Note**: Corner larders and appliances category larders were NOT modified as user confirmed they were working correctly.

**Result**: Larder unit plinths now sit on ground instead of underground.

---

### 4. Larder Cabinet Body Overlapping Plinth

**Problem**: After fixing plinth positioning, cabinet body was at same Y position as plinth (both at 0.075m), making 200cm units look only 90cm tall.

**Migration Created**: `20251018000017_fix_larder_cabinet_body_height.sql`

**Root Cause**:
- Original design had plinth underground at `'-height / 2 + 0.075'`
- Cabinet body hardcoded at `'0.075'` worked with OLD plinth position
- When plinth moved to ground level, cabinet body didn't adjust → OVERLAP

**Fix Applied**:

| Part | Old Position | New Position | Result (200cm unit) |
|------|-------------|--------------|---------------------|
| Plinth | `'-height / 2 + 0.075'` | `'0.075'` | 0.075m center ✅ |
| Cabinet Body | `'0.075'` | `'height / 2 + plinthHeight / 2'` | 1.075m center ✅ |
| Door | `'0.075'` | `'height / 2 + plinthHeight / 2'` | 1.075m center ✅ |
| Oven Door | `'-0.20'` | `'height / 2 + plinthHeight / 2 - 0.60'` | 0.475m center ✅ |

**Calculation for 200cm unit**:
- Plinth: 0-15cm (center at 7.5cm)
- Cabinet Body: 15cm-200cm (center at 107.5cm)
- Total: 200cm full height

**Result**: Larder units now display at full 200cm height with cabinet body properly positioned above plinth.

---

## Technical Patterns Identified

### Positioning System Evolution

**OLD System (causing bugs)**:
```sql
position_y = '-height / 2 + plinthHeight / 2'
```
- Positioned relative to component center at Y=0
- When DynamicComponentRenderer sets yPosition=0, geometry goes underground
- For 90cm cabinet: -0.45 + 0.075 = -0.375m (37.5cm underground)
- For 200cm larder: -1.0 + 0.075 = -0.925m (92.5cm underground)

**NEW System (correct)**:
```sql
-- Plinth
position_y = '0.075'  -- Center at 7.5cm, bottom at Y=0 (ground)

-- Cabinet Body
position_y = 'height / 2 + plinthHeight / 2'  -- Sits on top of plinth
```

**For 90cm base cabinet**:
- Plinth center: 0.075m (bottom: 0m, top: 0.15m)
- Cabinet body center: 0.525m (bottom: 0.15m, top: 0.9m)

**For 200cm larder unit**:
- Plinth center: 0.075m (bottom: 0m, top: 0.15m)
- Cabinet body center: 1.075m (bottom: 0.15m, top: 2.0m)

### Common Bug Pattern

All positioning bugs followed same pattern:
1. Component created with OLD positioning system (`-height / 2 + offset`)
2. DynamicComponentRenderer uses yPosition=0 (NEW system)
3. Geometry renders underground by half the component height
4. Fix: Change to 0-based positioning with ground at Y=0

---

## Files Modified

### Code Changes

**src/utils/ComponentIDMapper.ts**
- Added pan drawer mapping rule (lines 97-102)
- Enables DynamicComponentRenderer to find pan drawer components in database

### Database Migrations

1. **20251018000014_fix_pan_drawer_cabinet_body_position.sql** (153 lines)
   - Fixed cabinet body floating above plinth
   - Updated 6 pan drawer variants

2. **20251018000015_remove_old_fixed_size_countertops.sql** (159 lines)
   - Deleted 4 legacy countertop components
   - Cleaned up geometry_parts and component_3d_models tables

3. **20251018000016_fix_larder_unit_positioning.sql** (199 lines)
   - Fixed plinth positioning for 3 larder units
   - Changed from underground to ground level

4. **20251018000017_fix_larder_cabinet_body_height.sql** (188 lines)
   - Fixed cabinet body overlapping plinth
   - Positioned cabinet body above plinth

---

## Components Fixed Summary

### Pan Drawers (6 variants)
- pan-drawers-30, 40, 50, 60, 80, 100
- Status: ✅ Rendering correctly, cabinet body on plinth

### Countertops (cleaned up)
- Removed: counter-top-60, 80, 100, 120
- Kept: counter-top-horizontal, counter-top-vertical
- Status: ✅ Sidebar cleaned, functional variants only

### Larder Units (3 variants)
- tall-unit-60, tall-unit-80, oven-housing-60
- Status: ✅ Full 200cm height, plinth on ground, body above plinth

### Not Modified (user confirmed working)
- larder-corner-unit-60, larder-corner-unit-90 (corner larders)
- larder-built-in-fridge, larder-single-oven, larder-double-oven, larder-oven-microwave, larder-coffee-machine (appliances category)

---

## Testing Performed

### Manual Testing
1. ✅ Pan drawers render in 3D view
2. ✅ Pan drawer cabinet bodies sit on plinth (no gap)
3. ✅ Countertop sidebar shows only 2 variants (horizontal, vertical)
4. ✅ Larder units display at full 200cm height
5. ✅ Larder unit plinths visible at ground level
6. ✅ Larder unit cabinet bodies positioned above plinths

### Database Verification
- Verified geometry_parts updated correctly
- Confirmed position_y formulas use new 0-based system
- Checked all affected components have correct positioning

---

## Git Commits

**Commit 1**: `736291a - fix(renderer): Add ComponentIDMapper rule for pan drawers`
- Added mapping for /pan-drawer/i pattern
- Enables rendering of 6 pan drawer variants

**Commit 2**: `04864c9 - fix(database): Correct pan drawer cabinet body position to eliminate floating`
- Migration 20251018000014
- Fixed cabinet body height for 6 pan drawer variants

**Commit 3**: `4f25707 - fix(database): Remove old countertops and fix larder unit positioning`
- Migration 20251018000015 (remove countertops)
- Migration 20251018000016 (fix larder plinth)

**Commit 4**: `a30a0c4 - fix(database): Remove old countertops and fix larder unit positioning` (amended)
- Corrected migration 20251018000016 to fix correct larder units
- Changed from appliances to larder units category

**Commit 5**: `4c8da93 - fix(database): Fix larder unit cabinet body overlapping with plinth`
- Migration 20251018000017
- Fixed cabinet body positioning for 3 larder units

---

## Next Steps (From User)

### Finishes Category Review
User wants to review the "Finishes" category components:
1. **Cornice** - Wall top trim
2. **Pelmet** - Wall unit bottom trim
3. **End Panels** - Cabinet side panels
4. **Toe Kicks** - ⚠️ **MISSING from sidebar** - investigate!

### Investigation Required
- **Toe kicks not visible in component sidebar**
- May have been lost during database migrations
- Need to check if they exist in database but missing category mapping
- Or if they were accidentally deleted

---

## Lessons Learned

### 1. Positioning System Consistency Critical
- Mixed OLD/NEW systems cause geometry to render underground
- Always use 0-based positioning with ground at Y=0
- Formula pattern: `height / 2 + plinthHeight / 2` for bodies on plinths

### 2. ComponentIDMapper Required for Rendering
- Database components won't render without mapper rule
- Even if geometry exists in database, DynamicComponentRenderer can't find it
- Always add mapper when creating new component types

### 3. Migration Testing Important
- User feedback caught that wrong components were targeted (appliances vs larder units)
- Category confusion between "kitchen-larder" (database) and sidebar display names
- Always verify affected components match user's visual observation

### 4. Hardcoded Values Create Coupling
- Cabinet body at hardcoded `'0.075'` broke when plinth moved
- Should have been relative: `'height / 2 + plinthHeight / 2'` from start
- Use formulas instead of hardcoded positions for flexibility

---

## Database Schema Notes

### Key Tables
- **components** - Component catalog (name, dimensions, category)
- **component_3d_models** - 3D model metadata (geometry_type, rotations)
- **geometry_parts** - Individual geometry pieces (position formulas, dimensions)

### Important Fields
- **position_y** - Y-axis center position (can use formulas like 'height / 2')
- **dimension_height** - Height of geometry part (can use formulas like 'height - 0.15')
- **part_name** - Identifier for geometry piece (Plinth, Cabinet Body, Door, etc.)

### Formula Variables Available
- `height` - Component height from components.height
- `width` - Component width from components.width
- `depth` - Component depth from components.depth
- `plinthHeight` - Plinth height (0.15m for floor-mounted cabinets)
- `cabinetHeight` - Cabinet body height (derived)

---

## Session Completion Status

✅ All identified issues fixed
✅ Code changes committed
✅ Database migrations created and tested
✅ Documentation updated
✅ Handover notes prepared for next session

**Ready for next session**: Finishes category review (cornice, pelmet, end panels, toe kicks)
