# Handover Document: Ready for Finishes Category Work

## Quick Summary

**Current Status**: ✅ Component positioning fixes complete
**Next Task**: Review and fix Finishes category components
**Priority Issue**: 🚨 Toe kicks missing from component sidebar

---

## What Was Just Completed

### Pan Drawers - Fixed ✅
- **Issue**: Not rendering + cabinet body floating
- **Fix**: Added ComponentIDMapper rule + positioned cabinet body on plinth
- **Migrations**: 20251018000014
- **Result**: All 6 variants (30-100cm) render correctly

### Countertops - Cleaned ✅
- **Issue**: 4 redundant fixed-size variants cluttering sidebar
- **Fix**: Deleted counter-top-60, 80, 100, 120; kept horizontal/vertical only
- **Migrations**: 20251018000015
- **Result**: Cleaner sidebar with functional variants

### Larder Units - Fixed ✅
- **Issue**: Sinking 92.5cm underground, appearing 90cm tall instead of 200cm
- **Fix**: Fixed plinth positioning + cabinet body height
- **Migrations**: 20251018000016, 20251018000017
- **Affected**: tall-unit-60, tall-unit-80, oven-housing-60
- **Result**: Full 200cm height, properly positioned

---

## Next Session: Finishes Category

### Components to Review

#### 1. Cornice (Wall Top Trim)
- **Location**: Mounted at top of wall cabinets
- **Purpose**: Decorative trim finishing wall unit tops
- **Check**: Positioning, rendering, height alignment with wall units

#### 2. Pelmet (Wall Unit Bottom Trim)
- **Location**: Mounted at bottom of wall cabinets
- **Purpose**: Decorative trim hiding under-cabinet lighting
- **Check**: Positioning, rendering, alignment with wall unit bottoms

#### 3. End Panels
- **Location**: Side panels for cabinets
- **Purpose**: Finish exposed cabinet sides
- **Check**: Positioning, sizing, attachment to cabinets

#### 4. Toe Kicks ⚠️ **PRIORITY**
- **Location**: Bottom front of base cabinets
- **Purpose**: Recessed base allowing toe space under cabinets
- **Status**: 🚨 **MISSING FROM SIDEBAR**
- **Action Required**: Investigate why not visible

---

## Toe Kicks Investigation Guide

### Known Information

From migration `20250912230000_complete_kitchen_components.sql`:
```sql
('toe-kick-standard', 'Standard Toe Kick', 'toe-kick', 60, 10, 15, '#FFFFFF',
 'kitchen-toe-kick', ARRAY['kitchen'], 'PanelLeft',
 'Standard toe kick for base units - 60cm x 10cm x 15cm', '1.0.0', false, '{}', '{}'),

('toe-kick-corner', 'Corner Toe Kick', 'toe-kick', 90, 10, 15, '#FFFFFF',
 'kitchen-toe-kick', ARRAY['kitchen'], 'PanelLeft',
 'L-shaped toe kick for corner units - 90cm x 10cm x 15cm', '1.0.0', false, '{}', '{}'),
```

### Components Should Exist
- **toe-kick-standard** (60×10×15cm)
- **toe-kick-corner** (90×10×15cm)
- **Category**: `'kitchen-toe-kick'`
- **Type**: `'toe-kick'`

### Investigation Steps

1. **Check if components exist in database**:
   ```sql
   SELECT component_id, name, category, deprecated
   FROM components
   WHERE category = 'kitchen-toe-kick' OR component_id LIKE 'toe-kick%';
   ```

2. **Check if they have 3D models**:
   ```sql
   SELECT cm.component_id, cm.component_name, COUNT(gp.id) as geometry_count
   FROM component_3d_models cm
   LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
   WHERE cm.component_id LIKE 'toe-kick%'
   GROUP BY cm.component_id, cm.component_name;
   ```

3. **Check component sidebar category mapping**:
   - Look in `src/components/designer/CompactComponentSidebar.tsx`
   - Check if `'kitchen-toe-kick'` category is in category display map
   - Verify category is not filtered out for kitchen room type

4. **Check if deprecated**:
   - May have `deprecated: true` flag preventing display
   - Check `components.deprecated` field

5. **Possible Issues**:
   - ❌ Components deleted by accident in cleanup migration
   - ❌ Category `'kitchen-toe-kick'` not mapped in sidebar
   - ❌ Marked as deprecated preventing display
   - ❌ Room type filtering excluding them
   - ❌ Missing from database entirely

---

## Common Patterns from Previous Fixes

### Pattern 1: Underground Positioning Bug

**Symptom**: Component sinking through floor
**Cause**: Old positioning system `-height / 2 + offset`
**Fix**: Change to `'0.075'` for plinth or `'height / 2 + plinthHeight / 2'` for body

**Example**:
```sql
-- OLD (underground)
position_y = '-height / 2 + plinthHeight / 2'  -- For 90cm: -0.375m

-- NEW (ground level)
position_y = '0.075'  -- Plinth center at 7.5cm
position_y = 'height / 2 + plinthHeight / 2'  -- Body above plinth
```

### Pattern 2: Overlapping Geometry

**Symptom**: Components appear shorter than specified height
**Cause**: Multiple parts at same Y position overlapping
**Fix**: Position parts in vertical stack

**Example**:
```sql
-- Plinth: bottom at 0, top at 0.15m
position_y = '0.075'  -- Center at 7.5cm

-- Body: bottom at 0.15m (top of plinth), top at height
position_y = 'height / 2 + plinthHeight / 2'  -- Sits on plinth
```

### Pattern 3: Missing ComponentIDMapper

**Symptom**: Component exists in database but doesn't render
**Cause**: No mapping rule in ComponentIDMapper
**Fix**: Add pattern mapping

**Example**:
```typescript
{
  pattern: /toe-kick/i,
  mapper: (elementId, width) => `toe-kick-${width}`,
  description: 'Toe kick units',
  priority: 50,
}
```

---

## Finishes Category: Expected Positioning

### Cornice (Wall Top Trim)
- **Height**: ~10cm decorative trim
- **Position**: Top of wall cabinets (140cm height + top edge)
- **Y Position**: Should be around `140 / 2 + trim_height / 2` for wall cabinets
- **Mounting**: Attached to wall cabinet tops

### Pelmet (Wall Unit Bottom Trim)
- **Height**: ~10cm trim panel
- **Position**: Bottom of wall cabinets (hiding lighting)
- **Y Position**: Should be at bottom edge of wall cabinet
- **Mounting**: Attached to wall cabinet bottoms

### End Panels
- **Height**: Matches cabinet height (90cm for base, 140cm for wall, 200cm for tall)
- **Position**: Side of cabinet
- **Orientation**: Vertical panel flush with cabinet side
- **Mounting**: Attached to cabinet sides

### Toe Kicks
- **Height**: 15cm (0.15m) - same as plinth height
- **Depth**: 10cm recessed from cabinet front
- **Position**: Bottom of base cabinets, recessed
- **Y Position**: Should be `0.075` (center at 7.5cm, same as plinth)
- **X/Z Position**: Recessed 10cm back from cabinet front edge

---

## Files to Check for Finishes Work

### Component Sidebar
- `src/components/designer/CompactComponentSidebar.tsx`
  - Line 211: Category name mapping
  - Check if 'kitchen-toe-kick', 'kitchen-cornice', 'kitchen-pelmet', 'kitchen-wall-unit-end-panels' categories are mapped

### Component ID Mapper
- `src/utils/ComponentIDMapper.ts`
  - Check if patterns exist for toe-kick, cornice, pelmet, end-panel
  - May need to add mappings if missing

### Database Migrations
- `supabase/migrations/20250912230000_complete_kitchen_components.sql`
  - Contains original toe-kick component definitions
- `supabase/migrations/20250130000*.sql`
  - May contain 3D model definitions for finishes

### Possible 3D Model Files
Search for migrations containing:
- "toe-kick" or "toe kick"
- "cornice"
- "pelmet"
- "end-panel" or "end panel"

---

## Quick Start Commands

### Check Toe Kicks in Database
```sql
-- Check if components exist
SELECT component_id, name, category, width, height, depth, deprecated
FROM components
WHERE category = 'kitchen-toe-kick' OR component_id LIKE 'toe-kick%';

-- Check if they have 3D models
SELECT cm.component_id, cm.component_name, cm.geometry_type,
       COUNT(gp.id) as part_count
FROM component_3d_models cm
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
WHERE cm.component_id LIKE 'toe-kick%'
GROUP BY cm.component_id, cm.component_name, cm.geometry_type;

-- Check all finishes categories
SELECT category, COUNT(*) as component_count,
       STRING_AGG(component_id, ', ') as components
FROM components
WHERE category IN ('kitchen-toe-kick', 'kitchen-cornice', 'kitchen-pelmet',
                   'kitchen-wall-unit-end-panels')
GROUP BY category;
```

### Search Migrations for Finishes
```bash
# Search for toe kick migrations
grep -r "toe-kick\|toe kick" supabase/migrations/*.sql

# Search for cornice
grep -r "cornice" supabase/migrations/*.sql

# Search for pelmet
grep -r "pelmet" supabase/migrations/*.sql

# Search for end panels
grep -r "end-panel\|end panel" supabase/migrations/*.sql
```

### Check Component Sidebar Categories
```bash
# Find category mapping in sidebar
grep -A 20 "categoryLabels\|category.*mapping" src/components/designer/CompactComponentSidebar.tsx
```

---

## Expected Issues to Fix

Based on previous patterns, likely issues with finishes:

### 1. Positioning Issues
- ✅ **Likely**: Toe kicks using old `-height / 2` positioning → underground
- ✅ **Likely**: Cornice/pelmet not aligned with cabinet edges
- ⚠️ **Possible**: End panels not matching cabinet heights

### 2. Visibility Issues
- 🚨 **Confirmed**: Toe kicks missing from sidebar
- ⚠️ **Possible**: Other finishes may be missing too
- ⚠️ **Possible**: Category not mapped in sidebar

### 3. 3D Model Issues
- ⚠️ **Possible**: Missing 3D models entirely
- ⚠️ **Possible**: Incomplete geometry definitions
- ⚠️ **Possible**: Missing ComponentIDMapper rules

---

## Success Criteria for Finishes Category

### Toe Kicks
- [ ] Visible in component sidebar under "Finishing" or similar category
- [ ] Render in 3D view at ground level
- [ ] Positioned at cabinet bottom, recessed 10cm
- [ ] Height 15cm matching plinth
- [ ] Both standard (60cm) and corner (90cm) variants work

### Cornice
- [ ] Visible in component sidebar
- [ ] Render at top of wall cabinets
- [ ] Align with wall cabinet top edge
- [ ] Appropriate decorative profile

### Pelmet
- [ ] Visible in component sidebar
- [ ] Render at bottom of wall cabinets
- [ ] Align with wall cabinet bottom edge
- [ ] Cover under-cabinet area

### End Panels
- [ ] Visible in component sidebar
- [ ] Render on cabinet sides
- [ ] Match cabinet height (90cm/140cm/200cm variants)
- [ ] Flush with cabinet edges

---

## Migration Template for Finishes

If migrations are needed, follow this pattern:

```sql
-- ================================================================
-- Migration: Fix [Component Type] Positioning
-- ================================================================
-- Date: 2025-10-19
-- Purpose: Fix Y-positioning for [component type]
-- Issue: [Description of issue]
--
-- Affected Components:
-- - [component-id-1]
-- - [component-id-2]
--
-- Solution:
-- - Change to NEW 0-based positioning system
-- - Position_y: [formula]
-- ================================================================

DO $$
DECLARE
  v_component_id text;
BEGIN
  FOR v_component_id IN
    SELECT UNNEST(ARRAY[
      'component-id-1',
      'component-id-2'
    ])
  LOOP
    -- Update positioning
    UPDATE geometry_parts gp
    SET position_y = '[new formula]'
    FROM component_3d_models cm
    WHERE gp.model_id = cm.id
      AND cm.component_id = v_component_id
      AND gp.part_name = '[part name]';

    RAISE NOTICE '  ✅ Fixed: %', v_component_id;
  END LOOP;
END $$;
```

---

## Key Contacts / Resources

### Documentation
- Session docs: `docs/SESSION_2025-10-19_COMPONENT_POSITIONING_FIXES.md`
- Previous sessions: `docs/session-2025-10-18-*/*.md`

### Code References
- ComponentIDMapper: `src/utils/ComponentIDMapper.ts`
- Sidebar: `src/components/designer/CompactComponentSidebar.tsx`
- 3D Renderer: `src/components/designer/DynamicComponentRenderer.tsx`

### Database
- Components table: Core component catalog
- component_3d_models: 3D model metadata
- geometry_parts: Individual geometry pieces with positioning formulas

---

## Notes for Next Developer

1. **Start with toe kicks investigation** - they're definitely missing from sidebar
2. **Check all 4 finishes components** - may have similar issues
3. **Follow established patterns** - use 0-based positioning, ground at Y=0
4. **Test in 3D view** - visual confirmation is critical
5. **Update handover docs** - keep documentation current for next session

## Current Branch

**Branch**: `feature/database-component-cleanup`
**Status**: Ready to merge or continue with finishes work
**Commits**: 5 commits for component positioning fixes
**Next**: Finishes category investigation and fixes

---

**Prepared by**: Claude Code Agent
**Date**: October 19, 2025
**Ready for**: Finishes category work (cornice, pelmet, end panels, toe kicks)
