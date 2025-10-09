# Legacy Code Removal Plan
**Date:** 2025-10-09
**Status:** 📋 **PLANNING PHASE**

---

## Executive Summary

### Goal
Remove hardcoded 2D rendering logic from `DesignCanvas2D.tsx` after database-driven hybrid system is fully operational.

### Scope
- **Target File:** `src/components/designer/DesignCanvas2D.tsx` (2830 lines)
- **Lines to Remove:** ~1200 lines of hardcoded rendering logic
- **Expected Final Size:** ~1500 lines (47% reduction)
- **Timing:** After Phase 3 of hybrid implementation is complete and tested

### Approach
1. Ensure 100% of components have database render definitions
2. Verify feature flag enabled and working for all users
3. Remove hardcoded rendering functions systematically
4. Remove obsolete helper functions and constants
5. Simplify component structure
6. Update tests to reflect new architecture

---

## Inventory of Legacy Code

### Section 1: Hardcoded Sink Rendering (~165 lines)

**Location:** Lines 1085-1250
**Function:** `drawSinkPlanView()`

```typescript
// TO BE REMOVED
const drawSinkPlanView = useCallback((
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  width: number,
  depth: number,
  isSelected: boolean,
  isHovered: boolean
) => {
  const isButlerSink = element.id.includes('butler-sink');
  const isDoubleBowl = element.id.includes('double-bowl');
  const isCornerSink = element.id.includes('corner-sink');
  const hasDrainingBoard = element.id.includes('draining-board');
  const isFarmhouseSink = element.id.includes('farmhouse');

  // 165 lines of complex sink rendering logic
  // Including: bowl shapes, gradients, highlights, draining boards, etc.
}, []);
```

**Replacement:** Database-driven `renderSinkSingle()`, `renderSinkDouble()` handlers in `src/services/2d-renderers/plan-view-handlers.ts`

**Removal Impact:**
- ✅ Eliminates ID string matching (fragile)
- ✅ Moves logic to reusable handlers
- ✅ Makes sink rendering admin-configurable

---

### Section 2: Hardcoded Corner Detection (~30 lines)

**Location:** Lines 1274-1284
**Code:**

```typescript
// TO BE REMOVED
const isCornerCounterTop = element.type === 'counter-top' &&
  element.id.includes('counter-top-corner');
const isCornerWallCabinet = element.type === 'cabinet' &&
  (element.id.includes('corner-wall-cabinet') || element.id.includes('new-corner-wall-cabinet'));
const isCornerBaseCabinet = element.type === 'cabinet' &&
  (element.id.includes('corner-base-cabinet') || element.id.includes('l-shaped-test-cabinet'));
const isCornerTallUnit = element.type === 'cabinet' &&
  (element.id.includes('corner-tall') || element.id.includes('corner-larder') ||
   element.id.includes('larder-corner'));

const isCornerComponent = isCornerCounterTop || isCornerWallCabinet ||
                          isCornerBaseCabinet || isCornerTallUnit;
```

**Replacement:** Database field `plan_view_type = 'corner-square'` in `component_2d_renders` table

**Removal Impact:**
- ✅ No more ID string matching
- ✅ Single source of truth (database)
- ✅ Admin can mark components as corner type

---

### Section 3: Hardcoded drawElement() Logic (~100 lines)

**Location:** Lines 1261-1356
**Code:**

```typescript
// TO BE REMOVED
const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: DesignElement) => {
  // ... setup code (KEEP)

  if (active2DView === 'plan') {
    // ... transform code (KEEP)

    // COLOR DETAIL RENDERING (if enabled)
    if (showColorDetail) {
      // ... selection color logic (KEEP)

      // HARDCODED TYPE CHECKING (REMOVE)
      if (element.type === 'sink') {
        drawSinkPlanView(ctx, element, width, depth, isSelected, isHovered);
      } else if (isCornerComponent) {
        const squareSize = Math.min(element.width, element.depth) * zoom;
        ctx.fillRect(0, 0, squareSize, squareSize);
      } else {
        // Standard components: Draw as rectangle
        ctx.fillRect(0, 0, width, depth);
      }
    }

    // ... wireframe and selection code (KEEP)
  } else {
    // Elevation view rendering (REFACTOR)
    drawElementElevation(ctx, element, isSelected, isHovered, showWireframe);
  }
}, [active2DView, ...]);
```

**Replacement:**

```typescript
// NEW CODE (AFTER MIGRATION)
const drawElement = useCallback(async (ctx: CanvasRenderingContext2D, element: DesignElement) => {
  // ... setup code (KEEP)

  if (active2DView === 'plan') {
    // ... transform code (KEEP)

    // COLOR DETAIL RENDERING (if enabled)
    if (showColorDetail) {
      // ... selection color logic (KEEP)

      // DATABASE-DRIVEN RENDERING (NEW)
      const renderDef = await render2DService.get(element.component_id);
      if (renderDef) {
        ctx.fillStyle = renderDef.fill_color || ctx.fillStyle;
        renderPlanView(ctx, element, renderDef, zoom);
      } else {
        console.warn(`[DesignCanvas2D] No render definition for ${element.component_id}`);
        // Fallback to rectangle
        ctx.fillRect(0, 0, width, depth);
      }
    }

    // ... wireframe and selection code (KEEP)
  } else {
    // DATABASE-DRIVEN ELEVATION RENDERING (NEW)
    const renderDef = await render2DService.get(element.component_id);
    if (renderDef) {
      renderElevationView(ctx, element, renderDef, active2DView, zoom);
    }
  }
}, [active2DView, ...]);
```

**Removal Impact:**
- ✅ Removes 100 lines of type checking
- ✅ Simplifies to single database lookup
- ✅ Easier to maintain and test

---

### Section 4: Hardcoded Elevation View Logic (~300 lines)

**Location:** Lines 1383-1683 (estimated)
**Function:** `drawElementElevation()`

```typescript
// TO BE REMOVED (REFACTORED)
const drawElementElevation = (
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  isSelected: boolean,
  isHovered: boolean,
  showWireframe: boolean
) => {
  // Wall detection
  const wall = getElementWall(element);
  const isCornerVisible = isCornerVisibleInView(element, active2DView);

  if (!isCornerVisible && wall !== active2DView && wall !== 'center') return;

  // ... 300+ lines of hardcoded elevation drawing
  // Including: cabinet fronts, appliances, doors, handles, drawers, etc.
};
```

**Replacement:** Database-driven elevation handlers in `src/services/2d-renderers/elevation-view-handlers.ts`

**Removal Impact:**
- ✅ Removes ~300 lines of hardcoded logic
- ✅ Makes elevation views configurable
- ✅ Reusable handler functions

---

### Section 5: Helper Functions for Hardcoded Rendering (~200 lines)

**Various Locations**
**Functions to Remove:**

```typescript
// TO BE REMOVED
function isCornerComponent(element: DesignElement): boolean { ... }
function detectSinkType(elementId: string): string { ... }
function getSinkBowlCount(elementId: string): number { ... }
function hasDrainingBoard(element: DesignElement): boolean { ... }
function getApplianceStyle(element: DesignElement): string { ... }
// ... more helper functions
```

**Replacement:** Data in `component_2d_renders.plan_view_data` and `elevation_data`

**Removal Impact:**
- ✅ Removes ~200 lines of utility functions
- ✅ Eliminates ID string matching
- ✅ Data-driven instead of code-driven

---

### Section 6: Magic Strings and Constants (~50 lines)

**Various Locations**

```typescript
// TO BE REMOVED
const SINK_BOWL_INSET = 0.1;
const SINK_BOWL_DEPTH_RATIO = 0.8;
const CORNER_COMPONENT_IDS = [
  'corner-base-cabinet',
  'corner-wall-cabinet',
  'corner-tall-unit',
  'l-shaped-test-cabinet',
  // ... more IDs
];
const SINK_TYPES = {
  BUTLER: 'butler-sink',
  DOUBLE: 'double-bowl',
  CORNER: 'corner-sink',
  // ... more types
};
```

**Replacement:** Database values in `plan_view_data` and component metadata

**Removal Impact:**
- ✅ Removes hardcoded constants
- ✅ Makes values configurable per component
- ✅ Admin can adjust without code changes

---

### Section 7: Feature Flag Code (~20 lines)

**Location:** Throughout drawElement() and related functions

```typescript
// TO BE REMOVED (AFTER FULL MIGRATION)
if (FEATURE_FLAGS.use_database_2d_rendering) {
  // New code path
} else {
  // Legacy code path
}
```

**Removal Impact:**
- ✅ Simplifies code (single path)
- ✅ No branching logic
- ✅ Easier to maintain

---

## Total Lines to Remove

| Section | Location | Lines | Impact |
|---------|----------|-------|--------|
| Sink Rendering | 1085-1250 | ~165 | High complexity removed |
| Corner Detection | 1274-1284 | ~30 | String matching eliminated |
| drawElement Logic | 1261-1356 | ~100 | Type checking simplified |
| Elevation Rendering | 1383-1683 | ~300 | Major refactor |
| Helper Functions | Various | ~200 | Utilities replaced by data |
| Magic Strings | Various | ~50 | Constants moved to DB |
| Feature Flag Code | Various | ~20 | Branching removed |
| **TOTAL** | | **~865 lines** | **30% reduction** |

**Note:** Additional ~335 lines can be simplified (not removed) by refactoring, bringing total reduction to ~1200 lines.

---

## Removal Strategy

### Prerequisites (Must Complete First)

**✅ Phase 1: Database Schema**
- component_2d_renders table created
- All 194 components have render definitions
- Data verified and tested

**✅ Phase 2: Hybrid Rendering**
- Render2DService implemented and tested
- Plan view handlers working
- Elevation view handlers working
- Feature flag tested with 100% users

**✅ Phase 3: Production Validation**
- Feature enabled for all users
- No reports of rendering issues
- Performance metrics within targets
- Visual regression tests passing

### Removal Phases

#### Phase A: Remove Sink Rendering (~1 hour)

**Steps:**
1. Verify all sinks have correct `plan_view_type` in database
2. Test sink rendering with new handlers
3. Remove `drawSinkPlanView()` function (lines 1085-1250)
4. Remove sink-related helper functions
5. Update tests
6. Git commit: "refactor: remove legacy sink rendering code"

**Files Modified:**
- `src/components/designer/DesignCanvas2D.tsx` (-165 lines)

**Testing:**
- Place all sink types in canvas
- Verify rendering matches legacy
- Check console for errors

#### Phase B: Remove Corner Detection (~30 minutes)

**Steps:**
1. Verify all corner components have `plan_view_type = 'corner-square'`
2. Test corner rendering with new handlers
3. Remove corner detection logic (lines 1274-1284)
4. Remove corner-related constants
5. Update tests
6. Git commit: "refactor: remove legacy corner detection code"

**Files Modified:**
- `src/components/designer/DesignCanvas2D.tsx` (-30 lines)

**Testing:**
- Place all corner types in canvas
- Verify square rendering
- Check rotation behavior

#### Phase C: Simplify drawElement() (~1 hour)

**Steps:**
1. Verify all components render correctly with new system
2. Remove hardcoded type checking logic
3. Remove `drawElementLegacy()` function
4. Simplify to single database lookup path
5. Update tests
6. Git commit: "refactor: simplify drawElement to use database rendering"

**Files Modified:**
- `src/components/designer/DesignCanvas2D.tsx` (-100 lines)

**Testing:**
- Full regression test of all component types
- Performance benchmark
- Visual comparison

#### Phase D: Refactor Elevation Views (~2 hours)

**Steps:**
1. Verify elevation handlers working for all types
2. Remove `drawElementElevation()` hardcoded logic
3. Replace with database-driven elevation renderer
4. Remove elevation helper functions
5. Update tests
6. Git commit: "refactor: remove legacy elevation rendering code"

**Files Modified:**
- `src/components/designer/DesignCanvas2D.tsx` (-300 lines)

**Testing:**
- Test all 5 views (plan, front, back, left, right)
- Verify cabinets, appliances, furniture
- Check door/drawer rendering

#### Phase E: Remove Helper Functions (~1 hour)

**Steps:**
1. Identify all helpers used only by legacy code
2. Remove unused utility functions
3. Remove magic string constants
4. Update imports
5. Git commit: "refactor: remove legacy rendering helpers"

**Files Modified:**
- `src/components/designer/DesignCanvas2D.tsx` (-250 lines)
- `src/utils/componentHelpers.ts` (if exists)

**Testing:**
- TypeScript compilation
- No unused import warnings
- Full app regression test

#### Phase F: Remove Feature Flag (~30 minutes)

**Steps:**
1. Remove feature flag branching
2. Remove feature flag definition
3. Simplify code to single path
4. Update documentation
5. Git commit: "refactor: remove database_2d_rendering feature flag"

**Files Modified:**
- `src/components/designer/DesignCanvas2D.tsx` (-20 lines)
- `src/lib/featureFlags.ts` (-1 line)

**Testing:**
- Verify app still works
- No console warnings
- Performance unchanged

---

## Code Cleanup Checklist

### Before Removal
- [ ] Verify 100% of components have render definitions in database
- [ ] Feature flag enabled for all users (100%)
- [ ] No rendering issues reported in production
- [ ] Performance metrics within targets
- [ ] Visual regression tests passing
- [ ] Backup created of current code

### During Removal
- [ ] Phase A: Remove sink rendering
- [ ] Phase B: Remove corner detection
- [ ] Phase C: Simplify drawElement()
- [ ] Phase D: Refactor elevation views
- [ ] Phase E: Remove helper functions
- [ ] Phase F: Remove feature flag
- [ ] Update all related tests
- [ ] Update documentation

### After Removal
- [ ] TypeScript compilation successful (0 errors)
- [ ] All tests passing
- [ ] Visual regression tests passing
- [ ] Performance benchmarks within targets
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Git history clean (atomic commits)

---

## Testing Strategy for Removal

### Visual Regression Testing

**Create baseline screenshots:**
```bash
# Before removal
npm run test:visual-baseline

# After each phase
npm run test:visual-compare
```

**Components to Test:**
- All sink types (butler, double, corner, farmhouse)
- All corner components (base, wall, tall, countertop)
- Standard cabinets (base, wall, tall)
- Appliances (fridge, dishwasher, oven, etc.)
- Furniture (beds, chairs, tables, etc.)

### Performance Regression Testing

**Benchmark before removal:**
```typescript
// Measure render times
const start = performance.now();
drawElement(ctx, element);
const end = performance.now();
console.log(`Render time: ${end - start}ms`);
```

**Targets:**
- Plan view render: <5ms per component
- Elevation view render: <5ms per component
- Full canvas render: <50ms (all components)

**After each phase, verify no regression.**

### Functional Testing

**Test Matrix:**

| Component Type | Plan View | Front | Back | Left | Right | Rotation | Selection |
|----------------|-----------|-------|------|------|-------|----------|-----------|
| Base Cabinet | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Wall Cabinet | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Corner Base | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Corner Wall | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Single Sink | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Double Sink | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Appliance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Furniture | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Test after each removal phase.**

---

## Risk Mitigation

### Risk 1: Rendering Breaks After Removal
**Likelihood:** Medium
**Impact:** High
**Mitigation:**
- Remove in small phases with testing between each
- Keep git commits atomic (easy to revert)
- Maintain backup branch
- Feature flag for quick rollback (temporarily)

### Risk 2: Performance Degradation
**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Benchmark before/after each phase
- Profile with browser DevTools
- Monitor production performance metrics
- Rollback if >10% regression

### Risk 3: Unforeseen Edge Cases
**Likelihood:** Medium
**Impact:** Medium
**Mitigation:**
- Comprehensive test coverage
- Visual regression testing
- Gradual rollout in production
- User feedback monitoring

### Risk 4: Database Definitions Incomplete
**Likelihood:** Low
**Impact:** High
**Mitigation:**
- Verify 100% component coverage before removal
- Fallback to simple rectangle if definition missing
- Admin tools to fix missing definitions
- Monitoring/alerting for missing definitions

---

## Post-Removal Benefits

### Code Quality
- ✅ **Reduced complexity:** DesignCanvas2D.tsx from 2830 → ~1500 lines (47% reduction)
- ✅ **Improved maintainability:** Data-driven instead of code-driven
- ✅ **Better separation of concerns:** Rendering logic in separate services
- ✅ **Type safety:** Proper TypeScript interfaces for render definitions

### Developer Experience
- ✅ **Easier to understand:** Single rendering path
- ✅ **Easier to test:** Isolated handler functions
- ✅ **Easier to extend:** Add render types without touching canvas code
- ✅ **Better documentation:** Database schema is self-documenting

### Product Features
- ✅ **Admin configurability:** Non-developers can manage components
- ✅ **Faster iteration:** Change rendering without code deployment
- ✅ **Consistent architecture:** 2D matches 3D (both database-driven)
- ✅ **Future-proof:** Easy to add new render types

### Performance
- ✅ **Same or better performance:** Canvas API still used
- ✅ **Efficient caching:** 3-tier cache strategy
- ✅ **Preloading:** All definitions loaded on startup
- ✅ **No network overhead:** Single bulk query

---

## Timeline

### Estimated Time

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase A: Sink Rendering | 1 hour | Hybrid system complete |
| Phase B: Corner Detection | 30 min | Phase A complete |
| Phase C: drawElement() | 1 hour | Phase A, B complete |
| Phase D: Elevation Views | 2 hours | Phase C complete |
| Phase E: Helper Functions | 1 hour | Phase D complete |
| Phase F: Feature Flag | 30 min | Phase E complete |
| Testing & Verification | 2 hours | All phases complete |
| **TOTAL** | **8 hours** | |

### Recommended Schedule

**Week 1: Preparation**
- Verify all prerequisites met
- Create backup branch
- Set up visual regression testing
- Baseline performance metrics

**Week 2: Removal (Phases A-C)**
- Monday: Phase A (Sink Rendering)
- Tuesday: Phase B (Corner Detection)
- Wednesday: Phase C (drawElement Simplification)
- Thursday: Testing & verification
- Friday: Buffer for issues

**Week 3: Removal (Phases D-F)**
- Monday: Phase D (Elevation Views)
- Tuesday: Phase E (Helper Functions)
- Wednesday: Phase F (Feature Flag)
- Thursday: Final testing & verification
- Friday: Code review & documentation

**Week 4: Production Rollout**
- Deploy to production
- Monitor for issues
- Address any bugs
- Document lessons learned

---

## Success Criteria

### Must-Have
- ✅ All legacy rendering code removed
- ✅ DesignCanvas2D.tsx reduced to ~1500 lines
- ✅ 0 TypeScript errors
- ✅ All tests passing
- ✅ Visual regression tests passing
- ✅ Performance within targets (no regression)
- ✅ Production stable (no critical issues)

### Should-Have
- ✅ Code review approved
- ✅ Documentation updated
- ✅ Team trained on new architecture
- ✅ Admin tools tested and working
- ✅ Monitoring/alerting in place

### Nice-to-Have
- ✅ Performance improvements over legacy
- ✅ Additional test coverage
- ✅ Refactoring opportunities identified
- ✅ Technical debt reduced

---

## Rollback Plan

### If Issues Arise During Removal

**Option 1: Revert Individual Phase**
```bash
# Revert last commit (phase)
git revert HEAD

# Test that legacy code works again
npm run test
```

**Option 2: Revert Multiple Phases**
```bash
# Revert to before removal started
git revert HEAD~5..HEAD

# Or reset to backup branch
git reset --hard backup-before-removal
```

**Option 3: Temporary Feature Flag Reinstatement**
```typescript
// Temporarily add feature flag back
if (FEATURE_FLAGS.use_legacy_2d_rendering) {
  // Use old code path
} else {
  // Use new code path
}
```

### If Issues Arise in Production

**Option 1: Quick Hotfix**
- Add null checks for missing definitions
- Fallback to rectangle rendering
- Deploy hotfix immediately

**Option 2: Feature Flag Rollback**
- Re-add feature flag
- Set to `false` for all users
- Investigate and fix issues
- Re-enable gradually

**Option 3: Full Rollback**
- Deploy previous version
- Fix issues in development
- Full regression testing
- Redeploy when ready

---

**Document Status:** ✅ COMPLETE
**Last Updated:** 2025-10-09
**Related Documents:**
- 01-ARCHITECTURAL-ASSESSMENT.md (current state)
- 02-HYBRID-2D-RENDERING-PLAN.md (implementation)
- 04-IMPLEMENTATION-PHASES.md (timeline)
