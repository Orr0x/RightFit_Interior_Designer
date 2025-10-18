# Session Plan - 3D Component Migration
**Date:** 2025-01-09
**Session Duration:** 4-8 hours (estimated)
**Primary Goal:** Complete 3D models for all kitchen components

---

## Session Objectives

### Primary Goals (Must Complete) 🔥
1. ✅ Audit current 3D component coverage
2. ✅ Identify which components are actually working
3. ✅ Complete standard base cabinets 3D models (6 sizes)
4. ✅ Complete standard wall cabinets 3D models (5 sizes)
5. ✅ Complete kitchen appliances 3D models (4 types)
6. ✅ Verify all new models work in 3D view

### Secondary Goals (If Time Permits) 📝
7. Complete sinks & worktops 3D models (4+ types)
8. Complete tall units 3D models (7 types)
9. Test existing furniture 3D models (bed, sofa, etc.)
10. Move hardcoded sinks to database

### Stretch Goals (Nice to Have) 🌟
11. Complete finishing & trim 3D models (21 pieces)
12. Begin multi-room component 3D models
13. Add formula validation
14. Update ComponentIDMapper patterns

---

## Phase Breakdown

### Phase 1: Audit & Assessment (30-60 minutes)
**Goal:** Understand current state accurately

#### Tasks:
1. **Database Query - Find Missing 3D Models**
   ```sql
   SELECT c.component_id, c.name, c.category, c.room_types
   FROM components c
   LEFT JOIN component_3d_models m ON c.component_id = m.component_id
   WHERE m.id IS NULL
   AND 'kitchen' = ANY(c.room_types)
   ORDER BY c.category, c.name;
   ```

2. **Test Confirmed Working Components**
   - Open app in browser
   - Enable 3D view
   - Place corner base cabinet → Verify works ✅
   - Place corner wall cabinet → Verify works ✅
   - Document what works

3. **Test Possibly Working Components**
   - Test base-cabinet-60
   - Test base-cabinet-80
   - Test wall-cabinet-60
   - Test wall-cabinet-80
   - Document results

4. **Create Component Coverage Matrix**
   - List all kitchen components
   - Mark which have 3D models
   - Mark which are tested/working
   - Prioritize gaps

**Deliverable:** Coverage matrix showing exact status

---

### Phase 2: Standard Base Cabinets (2-3 hours)
**Goal:** Complete 6 base cabinet sizes

#### Migration File: `20250132000029_populate_standard_base_cabinets_3d.sql`

#### Components to Add:
```
- base-cabinet-30  (30cm × 58cm × 72cm)  NEW
- base-cabinet-40  (40cm × 58cm × 72cm)  NEW
- base-cabinet-50  (50cm × 58cm × 72cm)  NEW
- base-cabinet-60  (60cm × 58cm × 72cm)  VERIFY/ADD
- base-cabinet-80  (80cm × 58cm × 72cm)  VERIFY/ADD
- base-cabinet-100 (100cm × 58cm × 72cm) NEW
```

#### Geometry Template (5 parts per cabinet):
1. **Plinth** (toe kick)
   - Height: 15cm
   - Material: plinth
   - Position: Bottom, conditional (!isWallCabinet)

2. **Cabinet Body** (main box)
   - Height: 57cm (72cm total - 15cm plinth)
   - Material: cabinet_body
   - Position: Above plinth

3. **Door** (front face)
   - Height: 55cm (cabinet height - gap)
   - Width: width - 5cm (margin)
   - Material: door
   - Position: Front face + 1cm

4. **Handle** (cylindrical pull)
   - Diameter: 2cm
   - Height: 15cm
   - Material: handle
   - Position: Right side, middle height

5. **Shelf** (optional interior)
   - Height: 2cm
   - Material: cabinet_body
   - Position: Middle of cabinet
   - Condition: Always render

#### Process:
1. Copy corner cabinet structure as template
2. Adapt formulas for standard (non-corner) geometry
3. Remove corner-specific parts
4. Test with width = 60cm first
5. Verify dimensions match hardcoded version
6. Replicate for all 6 sizes

**Testing:** Place each size in 2D, verify in 3D, test rotation

---

### Phase 3: Standard Wall Cabinets (2-3 hours)
**Goal:** Complete 5 wall cabinet sizes

#### Migration File: `20250132000030_populate_standard_wall_cabinets_3d.sql`

#### Components to Add:
```
- wall-cabinet-30  (30cm × 32cm × 72cm)  NEW
- wall-cabinet-40  (40cm × 32cm × 72cm)  NEW
- wall-cabinet-50  (50cm × 32cm × 72cm)  NEW
- wall-cabinet-60  (60cm × 32cm × 72cm)  VERIFY/ADD
- wall-cabinet-80  (80cm × 32cm × 72cm)  VERIFY/ADD
```

#### Key Differences from Base Cabinets:
- **No plinth** (wall-mounted)
- **Shallower depth** (32cm vs 58cm)
- **Different mounting height** (140cm default Z position)
- **Smaller handles** (proportional to depth)

#### Geometry Template (4 parts per cabinet):
1. **Cabinet Body** (main box)
   - Depth: 32cm (not 58cm)
   - Material: cabinet_body
   - Position: Wall-mounted (no plinth offset)

2. **Door** (front face)
   - Similar to base cabinet
   - Material: door
   - Position: Front face + 1cm

3. **Handle** (smaller pull)
   - Diameter: 1.5cm (smaller than base)
   - Height: 12cm
   - Material: handle

4. **Glass Panel** (optional)
   - Material: glass (new material needed?)
   - Opacity: 0.3
   - Condition: variant == 'glass'

#### Process:
1. Copy base cabinet structure
2. Remove plinth
3. Adjust depth to 32cm
4. Adjust handle size
5. Add glass panel (optional)
6. Test wall mounting behavior

**Testing:** Place each size, verify wall-mount height (140cm), test rotation

---

### Phase 4: Kitchen Appliances (2-3 hours)
**Goal:** Complete 4 appliance types

#### Migration File: `20250132000031_populate_kitchen_appliances_3d.sql`

#### Components to Add:
```
- oven-60          (60cm × 60cm × 60cm)   NEW
- dishwasher-60    (60cm × 58cm × 82cm)   NEW
- fridge-60        (60cm × 60cm × 180cm)  NEW
- fridge-90        (90cm × 60cm × 180cm)  NEW
```

#### New Material Needed:
```sql
INSERT INTO material_definitions (
  material_name, material_type, default_color, roughness, metalness
) VALUES (
  'stainless_steel', 'standard', '#E0E0E0', 0.3, 0.7
);
```

#### Oven Geometry (6 parts):
1. **Oven Body** (main box, black)
2. **Door** (front, stainless steel)
3. **Window** (glass, upper half of door)
4. **Handle** (horizontal bar)
5. **Control Panel** (top strip)
6. **Heating Element** (visible through window, orange glow)

#### Dishwasher Geometry (4 parts):
1. **Dishwasher Body** (main box)
2. **Door** (front, stainless steel)
3. **Handle** (horizontal bar)
4. **Control Panel** (top edge)

#### Fridge Geometry (5 parts):
1. **Fridge Body** (main box, tall)
2. **Top Door** (freezer section, 1/3 height)
3. **Bottom Door** (fridge section, 2/3 height)
4. **Handles** (2 vertical bars)
5. **Logo** (optional branding)

#### Process:
1. Create stainless_steel material
2. Build oven geometry first
3. Test oven in 3D view
4. Adapt for dishwasher (similar structure)
5. Build fridge geometry (taller, 2 doors)
6. Create 90cm fridge variant

**Testing:** Place each appliance, verify size, test door positions

---

### Phase 5: Verification & Testing (1-2 hours)
**Goal:** Ensure all new components work correctly

#### Testing Checklist:
1. **Placement Test**
   - Drag each component from library
   - Drop onto 2D canvas
   - Verify component appears

2. **3D Rendering Test**
   - Switch to 3D view
   - Verify component visible
   - Check dimensions match expected

3. **Rotation Test**
   - Rotate component in 2D (0°, 90°, 180°, 270°)
   - Verify 3D orientation updates
   - Check rotation center is correct

4. **Wall Snapping Test** (base cabinets)
   - Place near wall
   - Verify auto-rotation works
   - Check back edge aligns to wall

5. **Wall Mounting Test** (wall cabinets)
   - Place on wall
   - Verify height is 140cm (default)
   - Check depth positioning

6. **Material Test**
   - Check colors match expected
   - Verify metalness/roughness
   - Test selection highlighting (gold tint)

#### Test Each Component:
```
Base Cabinets:
  □ base-cabinet-30
  □ base-cabinet-40
  □ base-cabinet-50
  □ base-cabinet-60
  □ base-cabinet-80
  □ base-cabinet-100

Wall Cabinets:
  □ wall-cabinet-30
  □ wall-cabinet-40
  □ wall-cabinet-50
  □ wall-cabinet-60
  □ wall-cabinet-80

Appliances:
  □ oven-60
  □ dishwasher-60
  □ fridge-60
  □ fridge-90
```

#### Console Monitoring:
- Watch for errors in browser console
- Check for mapping warnings
- Verify cache hits after first load
- Monitor performance (FPS, memory)

**Deliverable:** Completed test checklist with pass/fail for each component

---

### Phase 6: Sinks & Worktops (2-3 hours) [OPTIONAL]
**Goal:** Add sink 3D models and move from hardcoded

#### Migration File: `20250132000032_populate_sinks_worktops_3d.sql`

#### Components to Add:
```
- kitchen-sink-single-60    (60cm × 60cm × 20cm)
- kitchen-sink-single-80    (80cm × 60cm × 20cm)
- kitchen-sink-double-80    (80cm × 60cm × 20cm)
- kitchen-sink-double-100   (100cm × 60cm × 20cm)
```

#### Sink Geometry (4 parts):
1. **Sink Basin** (main bowl, cylindrical)
2. **Rim** (edge around basin, box)
3. **Tap Hole** (small cylinder, optional)
4. **Draining Board** (grooved surface, optional)

#### Process:
1. Review ComponentService.ts lines 45-411
2. Extract sink definitions
3. Convert to SQL INSERT statements
4. Create 3D geometry for each sink
5. Update ComponentIDMapper with sink patterns
6. Delete getSinkComponents() method

**Testing:** Place sinks on counter-tops, verify positioning

---

### Phase 7: Tall Units (2-3 hours) [OPTIONAL]
**Goal:** Add tall unit 3D models

#### Migration File: `20250132000033_populate_tall_units_3d.sql`

#### Components to Add:
```
- tall-unit-60              (60cm × 58cm × 200cm)
- tall-unit-80              (80cm × 58cm × 200cm)
- larder-corner-unit-90     (90cm × 90cm × 200cm)
- oven-housing-60           (60cm × 58cm × 200cm)
```

#### Tall Unit Geometry (8 parts):
1. **Plinth** (15cm)
2. **Cabinet Body** (185cm)
3. **Top Door** (60cm height)
4. **Middle Door** (60cm height)
5. **Bottom Door** (60cm height)
6. **Handles** (3x)
7. **Internal Shelves** (6x, 2cm each)

**Testing:** Place tall units, verify height (200cm), test multi-door behavior

---

### Phase 8: Documentation Update (30 minutes)
**Goal:** Document progress and update session files

#### Tasks:
1. Update `04-COMPLETED.md` with all finished items
2. Move incomplete items back to `03-BACKLOG.md`
3. Update README.md if time permits
4. Create test results summary
5. Document any issues or blockers

---

## Success Metrics

### Minimum Success (End of Session):
- ✅ 6 base cabinets have 3D models
- ✅ 5 wall cabinets have 3D models
- ✅ 4 appliances have 3D models
- ✅ All new models tested and working
- ✅ Kitchen essentials 100% covered

**Coverage Improvement:**
```
Before:  ~10-15% (15-20 components)
After:   ~30-35% (45-50 components)
Kitchen: 100% base/wall/appliances
```

### Ideal Success (If Extra Time):
- ✅ All above +
- ✅ 4 sinks have 3D models
- ✅ 7 tall units have 3D models
- ✅ Hardcoded sinks removed
- ✅ All furniture tested

**Coverage Improvement:**
```
Before:  ~10-15%
After:   ~40-45%
Kitchen: 100% coverage
```

---

## Tools & Resources

### Required Access:
- ✅ Supabase dashboard
- ✅ Local dev environment
- ✅ Browser with dev tools
- ✅ Database query tool (Supabase SQL editor)

### Migration Template:
```sql
-- Template for new 3D model migration
DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Insert model definition
  INSERT INTO component_3d_models (
    component_id, component_name, component_type, category,
    geometry_type, is_corner_component, has_direction,
    auto_rotate_enabled, wall_rotation_left, wall_rotation_right,
    wall_rotation_top, wall_rotation_bottom,
    default_width, default_height, default_depth, description
  ) VALUES (
    'base-cabinet-60', 'Base Cabinet 60cm', 'cabinet', 'base-units',
    'standard', false, true,
    true, 90, 270, 0, 180,
    0.60, 0.72, 0.58, 'Standard 60cm base cabinet'
  ) RETURNING id INTO v_model_id;

  -- Insert geometry parts
  INSERT INTO geometry_parts (
    model_id, part_name, part_type, render_order,
    position_x, position_y, position_z,
    dimension_width, dimension_height, dimension_depth,
    material_name, color_override, render_condition
  ) VALUES
    -- Part 1: Plinth
    (v_model_id, 'plinth', 'box', 1,
     '0', '-height/2 + plinthHeight/2', '0',
     'width', 'plinthHeight', 'depth',
     'plinth', 'plinthColor', '!isWallCabinet'),
    -- Part 2: Cabinet body
    (v_model_id, 'cabinet_body', 'box', 2,
     '0', 'plinthHeight/2', '0',
     'width', 'cabinetHeight', 'depth',
     'cabinet_body', 'cabinetMaterial', null);
    -- ... more parts
END $$;
```

### ComponentIDMapper Pattern:
```typescript
{
  pattern: /base-cabinet/i,
  mapper: (elementId, width) => `base-cabinet-${width}`,
  description: 'Standard base cabinets (30-100cm)',
  priority: 50
}
```

---

## Risk Mitigation

### Potential Issues:
1. **Formula Errors**
   - Risk: Syntax errors in position/dimension formulas
   - Mitigation: Test formulas in SQL before committing
   - Fallback: Use hardcoded values temporarily

2. **ID Mapping Failures**
   - Risk: ComponentIDMapper doesn't match new IDs
   - Mitigation: Test mapping with console logs
   - Fallback: Add explicit patterns to mapper

3. **Performance Issues**
   - Risk: Too many geometry parts slow rendering
   - Mitigation: Keep parts minimal (5-8 per component)
   - Fallback: Simplify geometry if needed

4. **Database Conflicts**
   - Risk: Duplicate component_id entries
   - Mitigation: Check for existing entries first
   - Fallback: Use ON CONFLICT DO NOTHING

---

## Session Flow

### Timeline (4-hour minimum):
```
00:00 - 00:30  Phase 1: Audit & Assessment
00:30 - 02:30  Phase 2: Base Cabinets (6 sizes)
02:30 - 04:30  Phase 3: Wall Cabinets (5 sizes)
04:30 - 05:30  Phase 4: Appliances (4 types)
05:30 - 06:30  Phase 5: Verification & Testing
06:30 - 07:00  Phase 8: Documentation
```

### Timeline (8-hour ideal):
```
00:00 - 00:30  Phase 1: Audit & Assessment
00:30 - 02:30  Phase 2: Base Cabinets
02:30 - 04:30  Phase 3: Wall Cabinets
04:30 - 06:00  Phase 4: Appliances
06:00 - 07:00  BREAK
07:00 - 08:30  Phase 6: Sinks & Worktops (optional)
08:30 - 10:00  Phase 7: Tall Units (optional)
10:00 - 10:30  Phase 5: Final Verification
10:30 - 11:00  Phase 8: Documentation
```

---

## Communication Protocol

### Progress Updates:
- Update `04-COMPLETED.md` after each phase
- Mark items in `03-BACKLOG.md` as in-progress
- Note any blockers or issues immediately

### Git Commits:
```bash
# After each phase
git add supabase/migrations/20250132*.sql
git commit -m "feat: add 3D models for [component type]"

# After testing
git add docs/session-2025-01-09-3d-migration/
git commit -m "docs: update session progress"

# End of session
git push origin feature/3d-component-migration
```

---

## Next Steps After Session

1. **Review & Merge**
   - Review all new migrations
   - Test on staging environment
   - Merge to main branch

2. **Deploy**
   - Push migrations to production
   - Verify feature flag enabled
   - Monitor for errors

3. **Continue Migration**
   - Multi-room components (bedroom, bathroom, etc.)
   - Finishing & trim pieces
   - Test furniture/fixtures

4. **Cleanup**
   - Refactor EnhancedModels3D.tsx
   - Remove hardcoded sinks
   - Delete feature flag

---

**Document Status:** ✅ Complete
**Related Documents:**
- 01-CODE-REVIEW.md (Initial review)
- 03-BACKLOG.md (All planned work)
- 04-COMPLETED.md (Finished items)

**Last Updated:** 2025-01-09
