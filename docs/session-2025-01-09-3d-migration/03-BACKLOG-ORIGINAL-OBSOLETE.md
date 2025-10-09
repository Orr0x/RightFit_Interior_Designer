# Backlog - 3D Component Migration
**Date:** 2025-01-09
**Session:** Component Database Migration & 3D Rendering Completion

This backlog contains all planned work for completing the 3D component migration. Items will be moved to `04-COMPLETED.md` as they are finished.

---

## Priority Legend
- 🔥 **P0 - CRITICAL** - Must complete this session
- 📝 **P1 - HIGH** - Should complete this session if time permits
- 📌 **P2 - MEDIUM** - Future session
- 🌟 **P3 - LOW** - Nice to have

## Status Legend
- ⏳ **TODO** - Not started
- 🔄 **IN PROGRESS** - Currently working on
- ✅ **COMPLETE** - Finished and tested
- ❌ **BLOCKED** - Waiting on dependency
- ⚠️ **ISSUE** - Has problems, needs attention

---

## Phase 1: Audit & Assessment 🔥 P0

### 1.1 Database Query - Component Coverage
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 15 minutes

**Description:**
Query database to find all components that don't have 3D models yet.

**SQL Query:**
```sql
-- Find kitchen components without 3D models
SELECT c.component_id, c.name, c.category, c.width, c.depth, c.height
FROM components c
LEFT JOIN component_3d_models m ON c.component_id = m.component_id
WHERE m.id IS NULL
AND 'kitchen' = ANY(c.room_types)
ORDER BY c.category, c.name;

-- Count by category
SELECT c.category, COUNT(*) as missing_count
FROM components c
LEFT JOIN component_3d_models m ON c.component_id = m.component_id
WHERE m.id IS NULL
AND 'kitchen' = ANY(c.room_types)
GROUP BY c.category
ORDER BY missing_count DESC;
```

**Deliverable:**
- List of all missing kitchen components
- Count by category
- Prioritized list for implementation

---

### 1.2 Test Confirmed Working Components
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 15 minutes

**Description:**
Test the components user confirmed are working to verify current state.

**Test Checklist:**
- [ ] Corner Base Cabinet 60cm - l-shaped-test-cabinet-60
- [ ] Corner Base Cabinet 90cm - l-shaped-test-cabinet-90
- [ ] Corner Wall Cabinet 60cm - new-corner-wall-cabinet-60
- [ ] Corner Wall Cabinet 90cm - new-corner-wall-cabinet-90

**Test Steps:**
1. Open app in browser
2. Create new kitchen design
3. Drag component from library
4. Drop on 2D canvas
5. Switch to 3D view
6. Verify component visible
7. Test rotation (0°, 90°, 180°, 270°)
8. Test wall snapping
9. Document results

**Deliverable:**
- Pass/fail for each component
- Screenshots of 3D renders
- Notes on any issues

---

### 1.3 Test Possibly Working Components
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 30 minutes

**Description:**
Test components user mentioned might be working but uncertain.

**Test Checklist:**
- [ ] base-cabinet-60
- [ ] base-cabinet-80
- [ ] wall-cabinet-60
- [ ] wall-cabinet-80
- [ ] Any other base/wall cabinets found in database

**Deliverable:**
- List of confirmed working components
- List of broken/missing components
- Gap analysis for implementation

---

### 1.4 Create Component Coverage Matrix
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 15 minutes

**Description:**
Create comprehensive matrix of all kitchen components showing:
- Component ID
- Name and dimensions
- Category
- Has 3D model? (Y/N)
- Tested? (Y/N)
- Working? (Y/N)
- Priority for implementation

**Deliverable:**
- Markdown table or spreadsheet
- Visual dashboard of coverage %
- Prioritized implementation list

---

## Phase 2: Standard Base Cabinets 🔥 P0

### 2.1 Verify Existing Base Cabinets
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 30 minutes

**Description:**
Check if base-cabinet-60 and base-cabinet-80 already have 3D models in database.

**Tasks:**
```sql
-- Check for existing models
SELECT * FROM component_3d_models
WHERE component_id IN ('base-cabinet-60', 'base-cabinet-80');

-- Check for geometry parts
SELECT gp.* FROM geometry_parts gp
JOIN component_3d_models m ON gp.model_id = m.id
WHERE m.component_id IN ('base-cabinet-60', 'base-cabinet-80')
ORDER BY m.component_id, gp.render_order;
```

**Deliverable:**
- Confirmation of existing models
- Identification of which sizes need to be created
- Updated implementation list

---

### 2.2 Create Migration: Standard Base Cabinets
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 2-3 hours

**File:** `supabase/migrations/20250132000029_populate_standard_base_cabinets_3d.sql`

**Components to Add:**
- [ ] base-cabinet-30 (30cm × 58cm × 72cm)
- [ ] base-cabinet-40 (40cm × 58cm × 72cm)
- [ ] base-cabinet-50 (50cm × 58cm × 72cm)
- [ ] base-cabinet-60 (60cm × 58cm × 72cm) - if not exists
- [ ] base-cabinet-80 (80cm × 58cm × 72cm) - if not exists
- [ ] base-cabinet-100 (100cm × 58cm × 72cm)

**Geometry Parts (5 per cabinet):**
1. Plinth (toe kick, 15cm height)
2. Cabinet body (main box)
3. Door (front face)
4. Handle (cylindrical pull)
5. Shelf (internal, optional)

**Tasks:**
- [ ] Create migration file
- [ ] Add material definitions (if needed)
- [ ] Define component_3d_models entries (6 sizes)
- [ ] Define geometry_parts (30 parts total, 5 per size)
- [ ] Add helpful comments
- [ ] Test SQL syntax locally

**Deliverable:**
- Complete migration file
- Tested SQL (no syntax errors)
- Documentation of formula usage

---

### 2.3 Test Base Cabinets in 3D View
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 30 minutes
**Depends on:** 2.2

**Test Checklist:**
- [ ] base-cabinet-30 - Place, rotate, verify dimensions
- [ ] base-cabinet-40 - Place, rotate, verify dimensions
- [ ] base-cabinet-50 - Place, rotate, verify dimensions
- [ ] base-cabinet-60 - Place, rotate, verify dimensions
- [ ] base-cabinet-80 - Place, rotate, verify dimensions
- [ ] base-cabinet-100 - Place, rotate, verify dimensions

**Test Steps per Component:**
1. Open app, create kitchen design
2. Drag component from library
3. Place on 2D canvas
4. Switch to 3D view
5. Verify component renders (not pink box)
6. Check dimensions match expected (width × depth × height)
7. Rotate in 2D (0°, 90°, 180°, 270°)
8. Verify 3D rotation follows
9. Place near wall, verify auto-rotation
10. Check materials (wood, door, handle colors)
11. Test selection (gold highlight)
12. Screenshot for documentation

**Deliverable:**
- Test results (pass/fail) for each size
- Screenshots of working components
- Notes on any issues or bugs

---

### 2.4 Update ComponentIDMapper for Base Cabinets
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 15 minutes
**Depends on:** 2.2

**Description:**
Verify ComponentIDMapper has correct pattern for base cabinets.

**Current Pattern:**
```typescript
{
  pattern: /base-cabinet/i,
  mapper: (elementId, width) => `base-cabinet-${width}`,
  description: 'Standard base cabinets (30, 40, 50, 60, 80, 100cm)',
  priority: 50,
}
```

**Tasks:**
- [ ] Verify pattern matches all base cabinet IDs
- [ ] Test mapping with console logs
- [ ] Update description with all sizes
- [ ] Add test cases for new sizes

**Deliverable:**
- Verified ComponentIDMapper pattern
- Test cases passing
- Documentation updated

---

## Phase 3: Standard Wall Cabinets 🔥 P0

### 3.1 Verify Existing Wall Cabinets
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 15 minutes

**Description:**
Check if wall-cabinet-60 and wall-cabinet-80 already exist in database.

**Tasks:**
```sql
SELECT * FROM component_3d_models
WHERE component_id LIKE 'wall-cabinet-%'
AND component_id NOT LIKE '%corner%';
```

**Deliverable:**
- List of existing wall cabinet models
- List of sizes needing creation

---

### 3.2 Create Migration: Standard Wall Cabinets
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 2-3 hours

**File:** `supabase/migrations/20250132000030_populate_standard_wall_cabinets_3d.sql`

**Components to Add:**
- [ ] wall-cabinet-30 (30cm × 32cm × 72cm)
- [ ] wall-cabinet-40 (40cm × 32cm × 72cm)
- [ ] wall-cabinet-50 (50cm × 32cm × 72cm)
- [ ] wall-cabinet-60 (60cm × 32cm × 72cm) - if not exists
- [ ] wall-cabinet-80 (80cm × 32cm × 72cm) - if not exists

**Geometry Parts (4 per cabinet):**
1. Cabinet body (shallower: 32cm depth vs 58cm)
2. Door (front face)
3. Handle (smaller than base cabinets)
4. Glass panel (optional, for glass-front variants)

**Key Differences from Base:**
- NO plinth (wall-mounted)
- Shallower depth (32cm vs 58cm)
- Different default Z position (140cm)
- Smaller handles

**Tasks:**
- [ ] Create migration file
- [ ] Add glass material definition (if needed)
- [ ] Define component_3d_models entries (5 sizes)
- [ ] Define geometry_parts (20 parts total, 4 per size)
- [ ] Test SQL syntax

**Deliverable:**
- Complete migration file
- Tested SQL
- Documentation

---

### 3.3 Test Wall Cabinets in 3D View
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 30 minutes
**Depends on:** 3.2

**Test Checklist:**
- [ ] wall-cabinet-30 - Place, verify wall-mount height
- [ ] wall-cabinet-40 - Place, verify wall-mount height
- [ ] wall-cabinet-50 - Place, verify wall-mount height
- [ ] wall-cabinet-60 - Place, verify wall-mount height
- [ ] wall-cabinet-80 - Place, verify wall-mount height

**Special Tests:**
- Verify Z position is 140cm (default wall cabinet height)
- Check depth is 32cm (not 58cm)
- Verify no plinth renders
- Test wall alignment

**Deliverable:**
- Test results for each size
- Screenshots
- Issue notes

---

### 3.4 Update ComponentIDMapper for Wall Cabinets
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 15 minutes
**Depends on:** 3.2

**Current Pattern:**
```typescript
{
  pattern: /wall-cabinet/i,
  mapper: (elementId, width) => `wall-cabinet-${width}`,
  description: 'Standard wall cabinets (30, 40, 50, 60, 80cm)',
  priority: 50,
}
```

**Tasks:**
- [ ] Verify pattern works
- [ ] Test mapping
- [ ] Update description
- [ ] Add test cases

**Deliverable:**
- Verified mapper
- Passing tests

---

## Phase 4: Kitchen Appliances 🔥 P0

### 4.1 Create Material: Stainless Steel
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 15 minutes

**Description:**
Add stainless steel material for appliances.

**SQL:**
```sql
INSERT INTO material_definitions (
  material_name, material_type, default_color, roughness, metalness, description
) VALUES (
  'stainless_steel', 'standard', '#E0E0E0', 0.3, 0.7,
  'Stainless steel finish for appliances'
) ON CONFLICT (material_name) DO NOTHING;
```

**Deliverable:**
- Material added to database
- Verified in material_definitions table

---

### 4.2 Create Migration: Kitchen Appliances
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 2-3 hours

**File:** `supabase/migrations/20250132000031_populate_kitchen_appliances_3d.sql`

**Components to Add:**
- [ ] oven-60 (60cm × 60cm × 60cm)
- [ ] dishwasher-60 (60cm × 58cm × 82cm)
- [ ] fridge-60 (60cm × 60cm × 180cm)
- [ ] fridge-90 (90cm × 60cm × 180cm)

**Oven Geometry (6 parts):**
1. Oven body (black box)
2. Door (stainless steel)
3. Window (glass, upper half)
4. Handle (horizontal bar)
5. Control panel (top strip)
6. Heating element (orange glow, optional)

**Dishwasher Geometry (4 parts):**
1. Body (stainless steel box)
2. Door (front)
3. Handle (horizontal bar)
4. Control panel (top edge)

**Fridge Geometry (5 parts):**
1. Body (tall box)
2. Top door (freezer, 1/3 height)
3. Bottom door (fridge, 2/3 height)
4. Handles (2 vertical bars)
5. Logo/branding (optional)

**Tasks:**
- [ ] Create migration file
- [ ] Add stainless_steel material
- [ ] Define oven model + geometry (6 parts)
- [ ] Define dishwasher model + geometry (4 parts)
- [ ] Define fridge-60 model + geometry (5 parts)
- [ ] Define fridge-90 model + geometry (5 parts)
- [ ] Test SQL syntax

**Deliverable:**
- Complete migration
- 4 appliance models
- 20 geometry parts total

---

### 4.3 Test Appliances in 3D View
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 30 minutes
**Depends on:** 4.2

**Test Checklist:**
- [ ] oven-60 - Verify size (60×60×60), test door, window
- [ ] dishwasher-60 - Verify height (82cm), test door
- [ ] fridge-60 - Verify height (180cm), test 2 doors
- [ ] fridge-90 - Verify width (90cm), test 2 doors

**Special Tests:**
- Check stainless steel material renders correctly
- Verify handles are visible
- Test door positioning
- Verify appliances are floor-mounted (not floating)

**Deliverable:**
- Test results
- Screenshots
- Issue notes

---

### 4.4 Update ComponentIDMapper for Appliances
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 15 minutes
**Depends on:** 4.2

**Patterns to Add/Verify:**
```typescript
{
  pattern: /oven/i,
  mapper: (elementId, width) => `oven-${width}`,
  description: 'Ovens (60cm)',
  priority: 30,
},
{
  pattern: /dishwasher/i,
  mapper: (elementId, width) => `dishwasher-${width}`,
  description: 'Dishwashers (60cm)',
  priority: 30,
},
{
  pattern: /fridge|refrigerator/i,
  mapper: (elementId, width) => `fridge-${width}`,
  description: 'Fridges (60cm, 90cm)',
  priority: 30,
}
```

**Tasks:**
- [ ] Add/verify oven pattern
- [ ] Add/verify dishwasher pattern
- [ ] Add/verify fridge pattern
- [ ] Test mappings
- [ ] Add test cases

**Deliverable:**
- Updated ComponentIDMapper
- Passing tests

---

## Phase 5: Verification & Testing 🔥 P0

### 5.1 Comprehensive Component Testing
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 1-2 hours
**Depends on:** 2.3, 3.3, 4.3

**Description:**
Complete testing of all new components with comprehensive test matrix.

**Full Test Checklist:**

**Base Cabinets (6):**
- [ ] base-cabinet-30: Place, rotate, wall-snap, dimensions, materials
- [ ] base-cabinet-40: Place, rotate, wall-snap, dimensions, materials
- [ ] base-cabinet-50: Place, rotate, wall-snap, dimensions, materials
- [ ] base-cabinet-60: Place, rotate, wall-snap, dimensions, materials
- [ ] base-cabinet-80: Place, rotate, wall-snap, dimensions, materials
- [ ] base-cabinet-100: Place, rotate, wall-snap, dimensions, materials

**Wall Cabinets (5):**
- [ ] wall-cabinet-30: Place, wall-mount, rotate, height (140cm), depth (32cm)
- [ ] wall-cabinet-40: Place, wall-mount, rotate, height (140cm), depth (32cm)
- [ ] wall-cabinet-50: Place, wall-mount, rotate, height (140cm), depth (32cm)
- [ ] wall-cabinet-60: Place, wall-mount, rotate, height (140cm), depth (32cm)
- [ ] wall-cabinet-80: Place, wall-mount, rotate, height (140cm), depth (32cm)

**Appliances (4):**
- [ ] oven-60: Place, dimensions (60×60×60), materials (steel), door/window
- [ ] dishwasher-60: Place, dimensions (60×58×82), materials, handle
- [ ] fridge-60: Place, dimensions (60×60×180), 2 doors, handles
- [ ] fridge-90: Place, dimensions (90×60×180), 2 doors, handles

**Test Types:**
1. **Placement Test** - Component appears on canvas
2. **3D Render Test** - Component visible in 3D view
3. **Dimension Test** - Size matches expected W×D×H
4. **Rotation Test** - 0°, 90°, 180°, 270° work correctly
5. **Material Test** - Colors, textures, metalness correct
6. **Selection Test** - Highlights gold when selected
7. **Performance Test** - No lag, smooth rotation

**Deliverable:**
- Complete test matrix (pass/fail for each component)
- Screenshots of all components
- Performance notes (FPS, memory usage)
- List of any bugs or issues

---

### 5.2 Console Monitoring & Error Check
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 30 minutes
**Depends on:** 5.1

**Description:**
Monitor browser console for errors, warnings, and mapping issues.

**Checks:**
- [ ] No JavaScript errors
- [ ] No formula evaluation errors
- [ ] ComponentIDMapper warnings logged correctly
- [ ] Model3DLoaderService cache hits after first load
- [ ] No "Model not found" errors for new components
- [ ] FeatureFlagService confirms dynamic models enabled

**Console Commands:**
```javascript
// Check cache status
Model3DLoaderService.clearCache();

// Test mapping
mapComponentIdToModelId('base-cabinet-12345', 60);
// Should return: 'base-cabinet-60'

// Check feature flag
await FeatureFlagService.isEnabled('use_dynamic_3d_models');
// Should return: true
```

**Deliverable:**
- Console log export (no critical errors)
- List of warnings (if any)
- Cache performance metrics

---

### 5.3 Performance Testing
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 30 minutes
**Depends on:** 5.1

**Description:**
Test performance with multiple components in scene.

**Test Scenarios:**
1. **Small Scene** (5 components)
   - Place 5 different base cabinets
   - Measure FPS in 3D view
   - Check memory usage

2. **Medium Scene** (15 components)
   - Place 10 base cabinets, 3 wall cabinets, 2 appliances
   - Measure FPS
   - Check memory usage
   - Test rotation performance

3. **Large Scene** (30+ components)
   - Fill kitchen with components
   - Measure FPS (should be >30 FPS)
   - Check memory (should be <500MB)
   - Test navigation smoothness

**Performance Metrics:**
- FPS target: >30 (acceptable), >60 (ideal)
- Memory target: <500MB
- Load time target: <2 seconds for first component

**Deliverable:**
- Performance report with FPS/memory metrics
- Comparison to hardcoded geometry performance
- Recommendations for optimization (if needed)

---

### 5.4 Create Test Documentation
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 30 minutes
**Depends on:** 5.1, 5.2, 5.3

**Description:**
Document all test results for future reference and regression testing.

**Document Contents:**
1. Test Matrix (all components, pass/fail)
2. Screenshots of working components
3. Console log analysis
4. Performance metrics
5. Known issues list
6. Regression test checklist for future

**Deliverable:**
- Test documentation file
- Screenshot folder
- Regression test checklist

---

## Phase 6: Sinks & Worktops 📝 P1 (Optional)

### 6.1 Analyze Hardcoded Sink Definitions
**Status:** ⏳ TODO
**Priority:** 📝 P1
**Estimate:** 30 minutes

**Description:**
Review ComponentService.ts lines 45-411 to understand hardcoded sink structure.

**Tasks:**
- [ ] Read getSinkComponents() method
- [ ] List all 25 sink variants
- [ ] Identify common properties
- [ ] Identify unique properties
- [ ] Design database schema mapping

**Deliverable:**
- List of all 25 sinks with dimensions
- Mapping plan (hardcoded → database)
- Notes on geometry requirements

---

### 6.2 Create Migration: Sinks & Worktops
**Status:** ⏳ TODO
**Priority:** 📝 P1
**Estimate:** 2-3 hours

**File:** `supabase/migrations/20250132000032_populate_sinks_worktops_3d.sql`

**Components to Add (Priority 4):**
- [ ] kitchen-sink-single-60 (60cm × 60cm × 20cm)
- [ ] kitchen-sink-single-80 (80cm × 60cm × 20cm)
- [ ] kitchen-sink-double-80 (80cm × 60cm × 20cm)
- [ ] kitchen-sink-double-100 (100cm × 60cm × 20cm)

**Sink Geometry (4-5 parts):**
1. Basin (cylindrical bowl)
2. Rim (box around basin)
3. Tap hole (optional)
4. Draining board (optional)
5. Overflow (optional detail)

**Tasks:**
- [ ] Create migration file
- [ ] Define 4 sink models
- [ ] Create geometry parts (16-20 parts total)
- [ ] Test SQL syntax

**Deliverable:**
- Migration file
- 4 sink 3D models

---

### 6.3 Update ComponentIDMapper for Sinks
**Status:** ⏳ TODO
**Priority:** 📝 P1
**Estimate:** 15 minutes
**Depends on:** 6.2

**Pattern:**
```typescript
{
  pattern: /sink/i,
  mapper: (elementId, width) => `kitchen-sink-single-${width}`,
  description: 'Kitchen sinks (various sizes)',
  priority: 20,
}
```

**Tasks:**
- [ ] Add sink pattern to ComponentIDMapper
- [ ] Handle single vs double bowl
- [ ] Test mapping

**Deliverable:**
- Updated mapper
- Test cases

---

### 6.4 Remove Hardcoded Sinks from ComponentService
**Status:** ⏳ TODO
**Priority:** 📝 P1
**Estimate:** 30 minutes
**Depends on:** 6.2, 6.3

**Description:**
Delete getSinkComponents() method after verifying database loads work.

**Tasks:**
- [ ] Verify sinks load from database
- [ ] Delete getSinkComponents() method (lines 45-411)
- [ ] Remove any references to hardcoded sinks
- [ ] Test app still works

**Deliverable:**
- ComponentService.ts cleaned up
- No hardcoded sink data
- Verified database-driven sinks work

---

### 6.5 Test Sinks in 3D View
**Status:** ⏳ TODO
**Priority:** 📝 P1
**Estimate:** 30 minutes
**Depends on:** 6.2

**Test Checklist:**
- [ ] kitchen-sink-single-60 - Place on counter, verify bowl depth
- [ ] kitchen-sink-single-80 - Place on counter, verify dimensions
- [ ] kitchen-sink-double-80 - Place on counter, verify 2 bowls
- [ ] kitchen-sink-double-100 - Place on counter, verify size

**Special Tests:**
- Verify Z position is 90cm (counter-top height)
- Check sink depth is 20cm
- Test material (stainless steel)
- Verify basin geometry

**Deliverable:**
- Test results
- Screenshots
- Notes

---

## Phase 7: Tall Units 📝 P1 (Optional)

### 7.1 Create Migration: Tall Units
**Status:** ⏳ TODO
**Priority:** 📝 P1
**Estimate:** 2-3 hours

**File:** `supabase/migrations/20250132000033_populate_tall_units_3d.sql`

**Components to Add:**
- [ ] tall-unit-60 (60cm × 58cm × 200cm)
- [ ] tall-unit-80 (80cm × 58cm × 200cm)
- [ ] larder-corner-unit-90 (90cm × 90cm × 200cm)
- [ ] oven-housing-60 (60cm × 58cm × 200cm)
- [ ] microwave-housing-60 (60cm × 58cm × 180cm)
- [ ] tall-pull-out-larder-40 (40cm × 58cm × 200cm)
- [ ] tall-pull-out-larder-50 (50cm × 58cm × 200cm)

**Tall Unit Geometry (8-10 parts):**
1. Plinth (15cm)
2. Cabinet body (185cm tall)
3. Top door (60cm section)
4. Middle door (60cm section)
5. Bottom door (60cm section)
6. Handles (3x for 3 doors)
7. Internal shelves (6-8x, thin boxes)

**Tasks:**
- [ ] Create migration file
- [ ] Define 7 tall unit models
- [ ] Create geometry parts (56-70 parts total, 8-10 per unit)
- [ ] Test SQL syntax

**Deliverable:**
- Migration file
- 7 tall unit 3D models

---

### 7.2 Test Tall Units in 3D View
**Status:** ⏳ TODO
**Priority:** 📝 P1
**Estimate:** 45 minutes
**Depends on:** 7.1

**Test Checklist:**
- [ ] tall-unit-60 - Verify 200cm height, 3 doors
- [ ] tall-unit-80 - Verify width (80cm), 3 doors
- [ ] larder-corner-unit-90 - Verify corner behavior, 200cm height
- [ ] oven-housing-60 - Verify open section for oven
- [ ] microwave-housing-60 - Verify 180cm height (shorter)
- [ ] tall-pull-out-larder-40 - Verify narrow (40cm), pull-out drawers
- [ ] tall-pull-out-larder-50 - Verify narrow (50cm), pull-out drawers

**Special Tests:**
- Verify floor-standing (Z=0)
- Check 200cm ceiling reach
- Test 3-door layout
- Verify handle positions
- Test internal shelves visible (optional)

**Deliverable:**
- Test results
- Screenshots
- Notes on multi-door behavior

---

### 7.3 Update ComponentIDMapper for Tall Units
**Status:** ⏳ TODO
**Priority:** 📝 P1
**Estimate:** 15 minutes
**Depends on:** 7.1

**Patterns:**
```typescript
{
  pattern: /tall-unit|larder/i,
  mapper: (elementId, width) => `tall-unit-${width}`,
  description: 'Tall units and larders (60cm, 80cm)',
  priority: 40,
},
{
  pattern: /oven-housing/i,
  mapper: (elementId, width) => `oven-housing-${width}`,
  description: 'Oven housing units (60cm)',
  priority: 40,
}
```

**Tasks:**
- [ ] Verify tall unit pattern
- [ ] Add oven housing pattern
- [ ] Test mappings

**Deliverable:**
- Updated mapper
- Tests passing

---

## Phase 8: Documentation 🔥 P0

### 8.1 Update 04-COMPLETED.md
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 30 minutes
**Depends on:** All completed phases

**Description:**
Move all finished items from backlog to completed file with details.

**Tasks:**
- [ ] List all completed migrations
- [ ] Document test results
- [ ] Note any issues encountered
- [ ] Update coverage metrics

**Deliverable:**
- Updated 04-COMPLETED.md with full session results

---

### 8.2 Update README.md (Optional)
**Status:** ⏳ TODO
**Priority:** 📝 P1
**Estimate:** 30 minutes

**Description:**
Update main README with accurate component counts and 3D status.

**Updates Needed:**
- Kitchen component count (verify 100% 3D coverage)
- Overall component count
- 3D rendering status
- Known issues section
- Architecture diagram (if changed)

**Deliverable:**
- Updated README.md

---

### 8.3 Create Test Report
**Status:** ⏳ TODO
**Priority:** 🔥 P0
**Estimate:** 30 minutes
**Depends on:** 5.4

**Description:**
Create comprehensive test report for session.

**Report Contents:**
1. Executive summary
2. Components tested (count)
3. Pass/fail matrix
4. Performance metrics
5. Known issues
6. Recommendations

**Deliverable:**
- Test report file
- Screenshots folder

---

## Phase 9: Multi-Room Components 📌 P2 (Future Session)

### 9.1 Test Existing Furniture 3D Models
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 1 hour

**Components to Test:**
- [ ] bed-single (bedroom)
- [ ] sofa-3-seater (living room)
- [ ] dining-chair (dining room)
- [ ] dining-table (dining room)
- [ ] tv-55-inch (living room)

**Deliverable:**
- Test results
- Notes on functionality

---

### 9.2 Test Existing Appliances 3D Models
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 30 minutes

**Components to Test:**
- [ ] washing-machine (utility)
- [ ] tumble-dryer (utility)

**Deliverable:**
- Test results

---

### 9.3 Test Existing Fixtures 3D Models
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 30 minutes

**Components to Test:**
- [ ] toilet-standard (bathroom)
- [ ] shower-standard (bathroom)
- [ ] bathtub-standard (bathroom)

**Deliverable:**
- Test results

---

### 9.4 Bedroom Components
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 8-12 hours

**Components Needed (46 total):**
- Wardrobe variants (14 components)
- Dresser variants (10 components)
- Nightstands (4 components)
- Other bedroom furniture (18 components)

**Future Work:** Separate session

---

### 9.5 Bathroom Components
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 6-8 hours

**Components Needed (21 total):**
- Vanity units (6 components)
- Bathroom storage (4 components)
- Bathroom props (3 components)
- Other fixtures (8 components)

**Future Work:** Separate session

---

### 9.6 Living Room Components
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 6-8 hours

**Components Needed (20 total):**
- Media furniture (2 components)
- Built-in storage (6 components)
- Living room props (2 components)
- Other furniture (10 components)

**Future Work:** Separate session

---

### 9.7 Office, Dining, Utility, Dressing Components
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 8-12 hours

**Components Needed (~26 total):**
- Office: 12 components
- Dining: 3 components (minus chair/table)
- Utility: 1-2 components (minus appliances)
- Dressing: 8 components

**Future Work:** Separate session

---

## Phase 10: Cleanup & Optimization 📌 P2 (Future Session)

### 10.1 Refactor EnhancedModels3D.tsx
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 4-8 hours

**Description:**
Once all components have 3D models, refactor EnhancedModels3D.tsx.

**Tasks:**
- [ ] Extract fallback logic to separate file
- [ ] Remove hardcoded geometry (1,900+ lines)
- [ ] Simplify to thin wrapper
- [ ] Keep only error boundary logic

**Deliverable:**
- Refactored EnhancedModels3D.tsx (<200 lines)
- Separated fallback component

---

### 10.2 Remove Feature Flag
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 1-2 hours
**Depends on:** 10.1

**Description:**
Remove use_dynamic_3d_models feature flag once all models complete.

**Tasks:**
- [ ] Remove feature flag check in EnhancedModels3D.tsx
- [ ] Remove FeatureFlagService import
- [ ] Simplify rendering path (no branching)
- [ ] Update documentation

**Deliverable:**
- Simplified rendering code
- No feature flag

---

### 10.3 Formula Validation System
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 4-6 hours

**Description:**
Add validation for geometry formulas to catch errors at migration time.

**Tasks:**
- [ ] Create formula validator function
- [ ] Test all formulas in database
- [ ] Add better error messages
- [ ] Consider formula schema versioning

**Deliverable:**
- Formula validation utility
- Updated migrations with validation

---

### 10.4 Performance Optimization
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 4-6 hours

**Description:**
Optimize 3D rendering performance for large scenes.

**Tasks:**
- [ ] Implement batch loading for visible components
- [ ] Add request coalescing
- [ ] Optimize database queries with JOINs
- [ ] Add level of detail (LOD) system

**Deliverable:**
- Performance improvements
- Benchmark comparison

---

## Phase 11: Testing & Documentation 📌 P2 (Future Session)

### 11.1 Integration Tests
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 8-12 hours

**Description:**
Create comprehensive integration tests for 3D rendering system.

**Test Suites:**
1. Component selection → ID mapping → 3D render flow
2. Formula evaluation edge cases
3. Feature flag switching (if keeping)
4. Database query error handling
5. Cache behavior
6. Performance benchmarks

**Deliverable:**
- Integration test suite
- CI/CD integration

---

### 11.2 E2E Tests (Playwright)
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 6-8 hours

**Description:**
Create E2E tests using existing Playwright setup.

**Test Scenarios:**
1. User places component in 2D → appears in 3D
2. Rotate component → 3D follows
3. Multiple components in scene
4. Performance benchmarks

**Deliverable:**
- E2E test suite
- Performance baselines

---

### 11.3 Developer Documentation
**Status:** ⏳ TODO
**Priority:** 📌 P2
**Estimate:** 4-6 hours

**Description:**
Create comprehensive developer guide for 3D system.

**Documentation Needed:**
1. 3D model schema reference
2. Formula syntax guide
3. How to add new 3D components (tutorial)
4. Debugging guide for 3D rendering
5. ComponentIDMapper pattern reference
6. Architecture diagrams

**Deliverable:**
- Developer guide
- Migration examples
- Troubleshooting guide

---

## Summary

### Total Backlog Items: 70+
- 🔥 **P0 (Critical):** 25 items - This session
- 📝 **P1 (High):** 10 items - This session if time
- 📌 **P2 (Medium):** 20 items - Future sessions
- 🌟 **P3 (Low):** 5 items - Nice to have

### Estimated Time:
- **This Session (P0 only):** 16-24 hours
- **This Session (P0 + P1):** 24-36 hours
- **Total Project:** 80-120 hours

### Coverage Goals:
- **Before Session:** ~10-15% (15-20 components)
- **After Session (P0):** ~30-35% (45-50 components)
- **After Session (P0+P1):** ~40-45% (60-70 components)
- **Complete Project:** 100% (154+ components)

---

**Document Status:** ✅ Complete
**Related Documents:**
- 01-CODE-REVIEW.md
- 02-SESSION-PLAN.md
- 04-COMPLETED.md

**Last Updated:** 2025-01-09
