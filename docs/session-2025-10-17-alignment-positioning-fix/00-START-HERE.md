# Component Alignment & Positioning Overhaul - START HERE
**Date:** 2025-10-17
**Branch:** `feature/alignment-positioning-fix` (to be created)
**Status:** 📋 PLANNING PHASE
**Priority:** 🔴 CRITICAL - Foundation for all future elevation view work

---

## 🎯 Session Overview

### The Problem
Component placement, rotation, and alignment system has multiple issues that must be fixed before proceeding with elevation view testing:

1. **Rotation Issues** - Components don't rotate on true center
2. **Drop Position Misalignment** - Drag image doesn't match final placement
3. **Wall Overlap** - Walls render as rectangles causing visual overlap
4. **Snapping Inconsistencies** - Wall snap logic has hardcoded conflicts
5. **Bounding Box Problems** - Selection/rotation boxes don't match visual components
6. **Configuration Chaos** - Settings scattered across database, hardcoded values, and multiple services

### The Goal
Create a **single, coherent positioning system** with:
- True-center rotation for all components
- Accurate drag previews matching final placement
- Wall rendering as lines (not rectangles) to prevent overlap
- Unified configuration source (database-driven)
- Consistent snapping behavior
- Accurate bounding boxes matching visual representation

### Why This Matters
This is **blocking work** for:
- Elevation view testing (can't validate if positions are wrong)
- Complex room shapes (needs accurate positioning)
- Multi-view coordination (positions must be consistent)
- User experience (current behavior is confusing and frustrating)

---

## 📁 Document Structure

### Read In This Order:

1. **00-START-HERE.md** ⭐ (This file)
   - Session overview and navigation

2. **01-FLOW-ANALYSIS.md** ⭐⭐⭐ (CRITICAL)
   - Complete trace: Component selector → Drag → Drop → Position → Render
   - Identifies every transformation point
   - Maps all coordinate conversions

3. **02-CONFIGURATION-AUDIT.md** ⭐⭐⭐ (CRITICAL)
   - Database vs hardcoded values
   - Single source of truth plan
   - Configuration consolidation strategy

4. **03-WALL-RENDERING-FIX.md** ⭐⭐
   - Wall-as-line implementation plan
   - Prevents overlap issues
   - Performance considerations

5. **04-TRUE-CENTER-ROTATION.md** ⭐⭐⭐ (CRITICAL)
   - Rotation pivot point analysis
   - Transform origin fixes
   - Component center calculation

6. **05-BOUNDING-BOX-FIX.md** ⭐⭐
   - Selection box alignment
   - Rotation handles positioning
   - Visual boundary corrections

7. **06-SNAPPING-SYSTEM.md** ⭐⭐
   - Wall snap consolidation
   - Threshold standardization
   - Corner detection fixes

8. **07-IMPLEMENTATION-PLAN-2D.md** ⭐⭐⭐ (CRITICAL)
   - 2D plan view fixes
   - Phase-by-phase breakdown
   - Testing checklist

8. **08-IMPLEMENTATION-PLAN-3D.md** ⭐⭐
   - 3D view alignment
   - Coordinate mapping
   - Integration with 2D

9. **09-TESTING-STRATEGY.md** ⭐
   - Validation approach
   - Test cases
   - Acceptance criteria

---

## 🔍 Key Issues Identified

### Issue #1: Multiple Coordinate Systems 🔴 CRITICAL
**Problem:** Transformations happen at multiple points with inconsistent logic

**Current Flow:**
```
Component DB (cm)
  → CompactComponentSidebar (drag preview px)
    → DesignCanvas2D (canvas coordinates px)
      → CanvasCoordinateIntegrator (room coordinates cm)
        → Final position (cm, but may be offset)
```

**What's Wrong:**
- Drag preview uses 1.15x scale factor (line 277 in CompactComponentSidebar.tsx)
- Canvas uses different scale (zoom-dependent)
- Final position calculation may shift from drop point
- No single source of truth for coordinate mapping

**Impact:**
- User drops component at X, it appears at X + offset
- Confusing user experience
- Debugging nightmares

---

### Issue #2: Wall Rendering as Rectangles 🔴 CRITICAL
**Location:** `DesignCanvas2D.tsx`

**Problem:** Walls drawn as filled rectangles (10cm thick) overlapping with components

**Why It's Wrong:**
- Visual clutter
- Hides component boundaries
- Makes precise placement difficult
- Not how real rooms work (walls are boundaries, not objects)

**Solution:** Render walls as lines (1-2px stroke) representing inner room boundaries

---

### Issue #3: Rotation Center Mismatch 🔴 CRITICAL
**Problem:** Components rotate around visual center, but bounding box uses different center

**Evidence:**
- Selection box doesn't match rotated component
- Rotation handles in wrong positions
- Corner components especially bad

**Root Cause:** Transform origin not set to component's geometric center

---

### Issue #4: Configuration Scattered 🟡 MEDIUM
**Problem:** Settings defined in multiple places:

1. **Database** (`app_configuration` table):
   - `wall_thickness`: 10cm
   - `snap_threshold`: 40cm
   - `wall_clearance`: 5cm

2. **Hardcoded** (various files):
   - Drag preview scale: 1.15x (CompactComponentSidebar.tsx:277)
   - Corner threshold: 60cm (canvasCoordinateIntegration.ts:131)
   - Snap threshold: 40cm (canvasCoordinateIntegration.ts:211)
   - Wall clearance: 5cm (canvasCoordinateIntegration.ts:70)

3. **ConfigurationService** (caching layer):
   - Loads from database when feature flag enabled
   - Falls back to hardcoded values

**Why It's Bad:**
- Changes require code deployment
- Inconsistencies between sources
- No single place to update values
- Difficult to debug issues

**Goal:** ONE source of truth (database) with ConfigurationService as ONLY accessor

---

### Issue #5: Drag Preview Mismatch 🟡 MEDIUM
**Problem:** Drag preview size doesn't match final component size

**Current Logic:**
```typescript
// CompactComponentSidebar.tsx:277
const scaleFactor = 1.15; // "Better match canvas components"
const previewWidth = component.width * scaleFactor;
```

**Why 1.15x?** Comment says "better match" but this is a hack, not a solution

**Real Issue:** Canvas components scale with zoom, but drag preview uses fixed scale

**Solution:** Calculate preview size matching current canvas zoom level

---

### Issue #6: Corner Component Special Cases 🟡 MEDIUM
**Problem:** Corner logic scattered across multiple files

**Locations:**
1. `CompactComponentSidebar.tsx:283` - Corner detection for drag preview
2. `canvasCoordinateIntegration.ts:282` - Corner detection for placement
3. `canvasCoordinateIntegration.ts:124` - Corner rotation logic
4. `DesignCanvas2D.tsx` - Corner rendering (assumed, need to verify)

**Issues:**
- Multiple "isCornerComponent" checks with different logic
- Hardcoded rotation angles per corner
- Square footprint assumption

**Solution:** Single corner component service with consistent logic

---

## 🎯 Success Criteria

### Must-Have (Blocking)
- [ ] Components rotate on true geometric center
- [ ] Drag preview size matches final component size
- [ ] Drop position matches where user releases mouse
- [ ] Walls render as lines (no rectangles)
- [ ] All configuration from database (no hardcoded values)
- [ ] Bounding boxes match visual component boundaries

### Should-Have (Important)
- [ ] Consistent snapping behavior across all walls
- [ ] Corner components handle rotation correctly
- [ ] Selection handles positioned accurately
- [ ] Zoom doesn't break positioning
- [ ] 3D view positions match 2D positions

### Nice-to-Have (Polish)
- [ ] Smooth rotation animations
- [ ] Visual snap indicators
- [ ] Drag preview shows rotation
- [ ] Performance optimized (no lag)

---

## 🚧 Implementation Strategy

### Phase 1: Analysis & Planning (2-3 hours) ✅ CURRENT
**Goal:** Understand complete flow and document all issues

**Tasks:**
- [x] Trace component placement flow
- [ ] Audit all configuration sources
- [ ] Document coordinate transformations
- [ ] Identify hardcoded values
- [ ] Map wall rendering logic
- [ ] Analyze rotation calculations

**Deliverables:**
- Flow analysis document
- Configuration audit spreadsheet
- Hardcoded values list
- Implementation plan

---

### Phase 2: Configuration Consolidation (4-6 hours)
**Goal:** Single source of truth for all settings

**Tasks:**
- [ ] Migrate all hardcoded values to database
- [ ] Update ConfigurationService to be synchronous (preload on init)
- [ ] Remove duplicate configuration logic
- [ ] Add validation and constraints
- [ ] Test configuration loading
- [ ] Document all config keys

**Deliverables:**
- Database migration script
- Updated ConfigurationService
- Configuration documentation
- Test suite for config loading

---

### Phase 3: Wall Rendering Fix (2-3 hours)
**Goal:** Walls as lines, not rectangles

**Tasks:**
- [ ] Replace wall rectangle rendering with line rendering
- [ ] Update wall position calculations (inner boundary)
- [ ] Add wall thickness as line stroke width (optional)
- [ ] Test with different room sizes
- [ ] Verify component placement near walls
- [ ] Update 3D view walls (if needed)

**Deliverables:**
- Updated `DesignCanvas2D.tsx` wall rendering
- Before/after screenshots
- Performance benchmarks

---

### Phase 4: True Center Rotation (6-8 hours) 🔴 CRITICAL
**Goal:** Components rotate around geometric center

**Tasks:**
- [ ] Calculate true center for each component type
- [ ] Update transform origin in CSS/Canvas
- [ ] Fix bounding box center calculation
- [ ] Update rotation handles positioning
- [ ] Test with all component types
- [ ] Special handling for corner components
- [ ] Test at different zoom levels

**Deliverables:**
- Updated rotation calculation logic
- Component center calculation service
- Rotation test suite
- Corner component rotation guide

---

### Phase 5: Drag & Drop Alignment (4-6 hours)
**Goal:** Preview matches final, drop position accurate

**Tasks:**
- [ ] Remove 1.15x scale factor hack
- [ ] Calculate preview size from canvas zoom
- [ ] Update drag image center point
- [ ] Fix drop position calculation
- [ ] Remove coordinate transformation bugs
- [ ] Test with zoom in/out
- [ ] Test with different component sizes

**Deliverables:**
- Updated `CompactComponentSidebar.tsx` drag logic
- Updated `DesignCanvas2D.tsx` drop handler
- Drag/drop test suite

---

### Phase 6: Snapping System Overhaul (3-4 hours)
**Goal:** Consistent, predictable snapping behavior

**Tasks:**
- [ ] Consolidate snap threshold (use database config)
- [ ] Unify wall snap logic (remove duplicates)
- [ ] Fix corner detection (consistent threshold)
- [ ] Add visual snap indicators
- [ ] Test edge cases (small rooms, large components)
- [ ] Document snapping algorithm

**Deliverables:**
- Unified snapping service
- Snap configuration in database
- Visual feedback system
- Snapping test suite

---

### Phase 7: Bounding Box Fixes (2-3 hours)
**Goal:** Selection boxes match visual boundaries

**Tasks:**
- [ ] Recalculate bounding boxes after rotation
- [ ] Update selection box rendering
- [ ] Fix rotation handles positioning
- [ ] Test with rotated components
- [ ] Test with corner components
- [ ] Update hover detection

**Deliverables:**
- Updated bounding box calculation
- Selection box rendering fix
- Handle positioning fix
- Visual regression tests

---

### Phase 8: 3D View Integration (4-5 hours)
**Goal:** 3D positions match 2D positions

**Tasks:**
- [ ] Verify 3D coordinate mapping
- [ ] Fix any 3D-specific positioning issues
- [ ] Test 2D → 3D consistency
- [ ] Update 3D component placement logic
- [ ] Test with complex room shapes

**Deliverables:**
- 3D positioning fixes
- 2D/3D coordinate mapping documentation
- Integration test suite

---

### Phase 9: Testing & Validation (6-8 hours)
**Goal:** Everything works correctly

**Tasks:**
- [ ] Test all component types
- [ ] Test all room sizes
- [ ] Test all zoom levels
- [ ] Test plan view + all elevations
- [ ] Test with complex room shapes
- [ ] Test corner components
- [ ] Performance testing
- [ ] User acceptance testing

**Deliverables:**
- Comprehensive test suite
- Test results documentation
- Performance benchmarks
- User testing feedback

---

## 📊 Estimated Timeline

### Optimistic: 30-35 hours (1.5 weeks)
- Assumes no major blockers
- Assumes good understanding of codebase
- Assumes tests pass first time

### Realistic: 40-50 hours (2-2.5 weeks)
- Accounts for unexpected issues
- Includes debugging time
- Includes iteration on solutions

### Conservative: 55-65 hours (3 weeks)
- Includes significant refactoring
- Accounts for multiple iterations
- Includes comprehensive testing

---

## 🔗 Related Documentation

### Previous Sessions
- `docs/session-2025-10-10-complex-room-shapes/` - Complex room geometry
- `docs/session-2025-10-09-2d-database-migration/` - Database-driven rendering
- `docs/session-2025-10-10-hardcoded-values-cleanup/` - Configuration cleanup attempt

### Key Files to Understand
- `src/components/designer/CompactComponentSidebar.tsx` - Drag preview
- `src/components/designer/DesignCanvas2D.tsx` - Main 2D canvas
- `src/utils/canvasCoordinateIntegration.ts` - Position calculations
- `src/services/ConfigurationService.ts` - Configuration loading
- `src/services/CoordinateTransformEngine.ts` - Coordinate system
- `src/utils/PositionCalculation.ts` - Position utilities

### Database Tables
- `app_configuration` - Configuration values
- `kitchen_components` (and similar) - Component definitions
- `room_designs` - Room data with design_elements

---

## ⚠️ Risks & Mitigations

### Risk 1: Breaking Existing Functionality 🔴 HIGH
**Problem:** Changes may break working features

**Mitigation:**
- Feature flag for each major change
- Comprehensive testing before and after
- Keep old code paths during transition
- Incremental deployment

---

### Risk 2: Performance Degradation 🟡 MEDIUM
**Problem:** More calculations may slow rendering

**Mitigation:**
- Memoize expensive calculations
- Profile before and after
- Use Web Workers if needed
- Optimize critical paths

---

### Risk 3: Configuration Migration Issues 🟡 MEDIUM
**Problem:** Database values may conflict with hardcoded fallbacks

**Mitigation:**
- Validate all config values
- Add min/max constraints
- Test with invalid values
- Provide clear error messages

---

### Risk 4: Coordinate System Changes 🔴 HIGH
**Problem:** Changes to coordinate math may break elevation views

**Mitigation:**
- Don't change coordinate system itself
- Only fix transformations and offsets
- Test in plan view first
- Validate elevation views last

---

## 💡 Key Insights

### Insight 1: Root Cause is Complexity
The positioning system has evolved organically with multiple patches and workarounds. This created a complex web of transformations that nobody fully understands.

**Solution:** Simplify by establishing clear boundaries:
- Component DB stores dimensions in cm
- Canvas works in pixels (with zoom)
- Single transformation point (not scattered)
- Clear ownership of each calculation

---

### Insight 2: Configuration Needs Preloading
Current async ConfigurationService causes race conditions and complexity.

**Solution:**
- Preload all config on app initialization
- Use synchronous getters after preload
- Cache indefinitely (only clear on explicit update)
- Fail fast if preload fails

---

### Insight 3: Walls Aren't Components
Treating walls as drawable objects (rectangles) causes confusion. Walls are room boundaries, not placeable items.

**Solution:**
- Render walls as boundaries (lines)
- Components positioned relative to inner boundaries
- Wall thickness affects room dimensions, not rendering

---

### Insight 4: Drag Preview is Critical UX
Users expect preview to match final result. Any mismatch breaks trust and feels broken.

**Solution:**
- Preview must be pixel-perfect match
- Account for canvas zoom
- Show rotation in preview (future)
- Visual feedback for snap zones (future)

---

## 🎯 Next Actions

### Immediate (Before Coding)
1. Read all documentation in order
2. Run application and test current behavior
3. Take screenshots of issues
4. Reproduce each bug consistently
5. Understand console log patterns

### Before Phase 2
1. Complete configuration audit
2. Create database migration script
3. Test configuration loading
4. Validate all config keys exist

### Before Phase 4 (Rotation)
1. Understand Canvas rotation API
2. Test rotation with simple shapes
3. Document rotation center calculation
4. Create rotation test cases

---

## 📞 Questions to Answer

### Configuration Questions
1. What is the complete list of hardcoded values?
2. Which values should be user-configurable vs system constants?
3. How should configuration updates be applied (immediate vs reload)?
4. Should configuration be cached per-session or per-page-load?

### Positioning Questions
1. What is the exact coordinate system for each view?
2. How does zoom affect positioning calculations?
3. Should components snap to pixel boundaries?
4. How should sub-pixel positioning be handled?

### Rotation Questions
1. What is the transform origin for each component type?
2. How should bounding boxes be calculated after rotation?
3. Should rotation be constrained to 90° increments?
4. How should rotation handles be positioned?

### Performance Questions
1. How many calculations per frame?
2. Can we memoize coordinate transformations?
3. Should we use canvas transforms or manual calculations?
4. What is acceptable render time per frame?

---

**Status:** 📋 PLANNING COMPLETE - Ready for Phase 1 Implementation
**Next Document:** Read `01-FLOW-ANALYSIS.md`
**Estimated Start Date:** 2025-10-17
**Estimated Completion:** 2025-11-07 (3 weeks)
