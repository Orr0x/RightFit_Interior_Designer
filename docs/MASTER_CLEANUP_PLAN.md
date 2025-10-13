# Master Cleanup & Consolidation Plan

**Date:** 2025-10-13
**Purpose:** Comprehensive plan to clean, unify, and fix all logic before tackling coordinate/position/rotation issues
**Approach:** Clean code first, fix logic second, then tackle coordinates/positioning

---

## Strategy Overview

### Phase 1: Code Cleanup & Unification (3-4 days)
**Goal:** Remove duplications, consolidate systems, simplify codebase
**Result:** Single source of truth for all logic

### Phase 2: Logic Fixes (2-3 days)
**Goal:** Fix bugs and conflicts found during audit
**Result:** All logic working correctly and consistently

### Phase 3: Coordinate System Finalization (3-5 days)
**Goal:** Implement unified coordinate system properly
**Result:** Consistent positioning/rotation across all views

**Total Estimated Time:** 8-12 days for complete cleanup and fixes

---

## Current State Summary

### ✅ Already Clean (Database & Data)
- Component data: Single source (database)
- Room data: Single source (database)
- Component properties: Unified (height, z-position, plinth)
- Room dimensions: Database-driven

### 🔴 Needs Cleanup (Logic & Code)
- **3 coordinate systems** (should be 1)
- **2 snapping implementations** (should be 1)
- **2 corner rotation logics** with conflicts
- **3 corner detection locations** (duplicated)
- **Double snapping calculation** (performance issue)
- **Thick walls in 2D plan view** (visual confusion)
- **Feature flag disabled** (new system unused)

---

## Phase 1: Code Cleanup & Unification (3-4 days)

### 1.1 Remove Wall Thickness from 2D Plan View (2 hours) ⭐ START HERE

**Why First:**
- Quick win
- User-requested
- Simplifies coordinate system work later
- Visual improvement

**Tasks:**
- [ ] Remove `outerRoomBounds` calculation
- [ ] Remove `outerX`/`outerY` from room positioning
- [ ] Replace thick wall rectangles with simple `strokeRect()` lines
- [ ] Update complex geometry walls to draw as lines, not polygons
- [ ] Remove wall thickness labels
- [ ] Simplify dimension labels
- [ ] Test: Plan view, complex shapes (L/U-shape)
- [ ] Verify: 3D view unchanged, elevation views unchanged

**Files:**
- `src/components/designer/DesignCanvas2D.tsx` (lines 589-592, 613-624, 1068-1126)

**Estimated:** 2 hours
**Risk:** Low (visual only)

---

### 1.2 Centralize Corner Component Detection (30 minutes)

**Why:**
- Duplicated in 3 places
- Easy fix
- Reduces future bugs

**Tasks:**
- [ ] Create `src/utils/componentTypeHelpers.ts`
- [ ] Add `isCornerComponent(element)` utility function
- [ ] Add `isCornerComponentById(componentId)` utility function
- [ ] Replace all instances:
  - `getRotatedBoundingBox()` in DesignCanvas2D
  - `isCornerComponent()` in canvasCoordinateIntegration
  - Implicit checks in `getSnapPosition()`
- [ ] Test: Corner detection still works

**New File:**
```typescript
// src/utils/componentTypeHelpers.ts
export function isCornerComponent(element: DesignElement): boolean {
  return isCornerComponentById(element.id || element.component_id);
}

export function isCornerComponentById(componentId: string): boolean {
  const id = componentId.toLowerCase();
  return id.includes('corner-cabinet') ||
         id.includes('corner-wall-cabinet') ||
         id.includes('new-corner-wall-cabinet') ||
         id.includes('corner-base-cabinet') ||
         id.includes('l-shaped-test-cabinet') ||
         id.includes('larder-corner') ||
         id.includes('corner-larder') ||
         id.includes('corner-tall') ||
         id.includes('corner-counter-top') ||
         id.includes('counter-top-corner');
}
```

**Files:**
- NEW: `src/utils/componentTypeHelpers.ts`
- UPDATE: `src/components/designer/DesignCanvas2D.tsx`
- UPDATE: `src/utils/canvasCoordinateIntegration.ts`

**Estimated:** 30 minutes
**Risk:** Very Low

---

### 1.3 Remove Double Snapping Calculation (1 hour)

**Why:**
- Wasted CPU
- Possible conflicts
- Confusing code flow

**Current Flow:**
```typescript
// Line 2695: Enhanced placement calculates snap
const placementResult = getEnhancedComponentPlacement(...);

// Lines 2727-2728: Apply result
x: placementResult.snappedToWall ? placementResult.x : snapToGrid(placementResult.x),
y: placementResult.snappedToWall ? placementResult.y : snapToGrid(placementResult.y),

// Line 2742: THEN snap AGAIN! (duplicate calculation)
const snapped = getSnapPosition(newElement, newElement.x, newElement.y);
newElement.x = snapped.x;
newElement.y = snapped.y;
newElement.rotation = snapped.rotation;
```

**Solution: Choose One System**

**Option A: Keep Only `getSnapPosition()` (RECOMMENDED)**
- Remove `getEnhancedComponentPlacement()` call
- Use `getSnapPosition()` only (proven, comprehensive)
- Handles walls + components + corners

**Option B: Keep Enhanced Placement, Remove Second Snap**
- Enhanced placement does corner detection
- Remove line 2742 snap calculation
- Risk: Loses component-to-component snapping

**Recommendation: Option A**

**Tasks:**
- [ ] Remove `getEnhancedComponentPlacement()` call (line 2695)
- [ ] Simplify to use `getSnapPosition()` only
- [ ] Keep grid snapping logic (if not wall-snapped)
- [ ] Test: Drop from sidebar still snaps correctly
- [ ] Test: Corner detection still works
- [ ] Verify: Component snapping still works

**Files:**
- `src/components/designer/DesignCanvas2D.tsx` (lines 2695-2746)

**Estimated:** 1 hour
**Risk:** Low (just removing redundant call)

---

### 1.4 Consolidate Snap Threshold Values (30 minutes)

**Why:**
- Database config doesn't affect enhanced placement
- Inconsistency

**Current:**
- DesignCanvas2D: `configCache.wall_snap_distance || 40` (database-driven)
- canvasCoordinateIntegration: `40` (hardcoded)

**Solution:**
Since we're removing enhanced placement in 1.3, this is mostly resolved. Just ensure all snap logic uses `configCache` values.

**Tasks:**
- [ ] Verify all snap logic uses `configCache` values
- [ ] Document snap threshold values
- [ ] Remove hardcoded `40` from any remaining locations

**Files:**
- `src/components/designer/DesignCanvas2D.tsx`
- `src/utils/canvasCoordinateIntegration.ts` (if kept)

**Estimated:** 30 minutes
**Risk:** Very Low

---

### 1.5 Consolidate to Single Coordinate System (1 day) 🎯 MAJOR

**Why:**
- Three systems doing the same job
- Main source of confusion
- Needed before coordinate fixes

**Current Systems:**
1. **CoordinateTransformEngine** (intended unified, unused)
2. **PositionCalculation** (transition with feature flag, disabled)
3. **DesignCanvas2D inline** (actual primary, legacy)

**Strategy: Gradual Migration**

**Step 1: Enable New Positioning System (2 hours)**
- [ ] Set `use_new_positioning_system = true` in feature flags
- [ ] Test all elevation views thoroughly
- [ ] Check for regressions
- [ ] Fix any issues found
- [ ] Document any breaking changes

**Step 2: Update DesignCanvas2D to Use CoordinateTransformEngine (4 hours)**
- [ ] Import and initialize CoordinateTransformEngine
- [ ] Replace inline elevation positioning with `coordinateEngine.planToElevation()`
- [ ] Replace inline room positioning with engine methods
- [ ] Keep fallbacks temporarily
- [ ] Test thoroughly
- [ ] Verify: No visual changes (same output, different code)

**Step 3: Remove Legacy Code (2 hours)**
- [ ] Remove `use_new_positioning_system` feature flag (always use new)
- [ ] Remove `calculateElevationPositionLegacy()` from PositionCalculation
- [ ] Remove `calculateRoomPositionLegacy()` from PositionCalculation
- [ ] Remove inline coordinate calculations from DesignCanvas2D
- [ ] Clean up comments and documentation

**Files:**
- `src/services/CoordinateTransformEngine.ts` (ensure complete)
- `src/utils/PositionCalculation.ts` (migration, then removal)
- `src/components/designer/DesignCanvas2D.tsx` (update to use engine)

**Testing Checklist:**
- [ ] Plan view: Components positioned correctly
- [ ] Front elevation: Components appear correctly
- [ ] Back elevation: Components appear correctly
- [ ] Left elevation: Components appear correctly (was buggy)
- [ ] Right elevation: Components appear correctly
- [ ] Corner components: Render in all views
- [ ] Rotated components: Render correctly

**Estimated:** 1 day (8 hours)
**Risk:** Medium (core positioning logic)

---

## Phase 1 Summary

**Total Time:** 3-4 days
**Risk Level:** Low to Medium
**Outcome:**
- ✅ Single coordinate system (CoordinateTransformEngine)
- ✅ Single snapping implementation (getSnapPosition)
- ✅ Single corner detection (componentTypeHelpers)
- ✅ Simple 2D plan view walls (lines, not thick)
- ✅ No redundant calculations

---

## Phase 2: Logic Fixes (2-3 days)

### 2.1 Fix Corner Rotation Conflict (2-3 hours) 🔴 CRITICAL BUG

**Why:**
- User-visible bug
- Corner cabinets face wrong direction
- Two implementations with different angles

**Current Conflict:**

| Corner | DesignCanvas2D | canvasCoordinateIntegration |
|--------|----------------|---------------------------|
| Top-Left | 0° | 0° |
| Top-Right | **-90°** | **-270°** |
| Bottom-Right | -180° | -180° |
| Bottom-Left | **-270°** | **-90°** |

**Investigation Steps:**
1. [ ] Test current behavior: Drop corner cabinet in all 4 corners
2. [ ] Determine which rotation is correct (L opens toward center?)
3. [ ] Document expected behavior per corner
4. [ ] Update both implementations to match
5. [ ] Test thoroughly in all 4 corners

**Expected Correct Behavior:**
```
Top-Left (0°):        Top-Right (-90° or -270°?):
┌─────────┐           ┌─────────┐
│ ┌───┐   │           │   ┌───┐ │
│ │   └───┤           ├───┘   │ │
│ │       │    OR     │       │ │
│ └───────┘           └───────┘ │

L opens toward       L opens toward
bottom-right         bottom-left
(INTO room)          (INTO room)
```

**Tasks:**
- [ ] Create test document with diagrams
- [ ] Test all 4 corners manually
- [ ] Determine correct rotation per corner
- [ ] Update `getSnapPosition()` corner rotation logic
- [ ] Update `calculateCornerPlacement()` if still used
- [ ] Add visual test documentation
- [ ] Test: All 4 corners, verify L opens toward center

**Files:**
- `src/components/designer/DesignCanvas2D.tsx` (lines 794-830)
- `src/utils/canvasCoordinateIntegration.ts` (lines 145-170)

**Estimated:** 2-3 hours
**Risk:** Low (once correct angles determined)

---

### 2.2 Fix Rotation Not Considered in Snap Logic (3 hours)

**Why:**
- Bounding box uses rotation
- Snap distance calculations don't
- Rotated components may snap incorrectly

**Current Issue:**
```typescript
// getSnapPosition() assumes rectangular footprint:
const distToLeft = snappedX;
const distToRight = roomDimensions.width - (snappedX + elementWidth);

// But if component is rotated 90°, effective footprint is different!
// width and depth are swapped
```

**Solution:**
Use `getRotatedBoundingBox()` before snap calculations

**Tasks:**
- [ ] Calculate bounding box at start of `getSnapPosition()`
- [ ] Use bounding box dimensions for distance calculations
- [ ] Update wall distance calculations
- [ ] Update component distance calculations
- [ ] Test with rotated components (0°, 90°, 180°, 270°)
- [ ] Verify: Rotated components snap to nearest wall correctly

**Files:**
- `src/components/designer/DesignCanvas2D.tsx` (lines 702-1002, getSnapPosition)

**Estimated:** 3 hours
**Risk:** Medium (changes snap behavior)

---

### 2.3 Optimize Bounding Box Calculations (2 hours)

**Why:**
- Complex math for L-shaped components
- Calculated multiple times per frame
- Performance improvement opportunity

**Current:**
- `getRotatedBoundingBox()` called every render
- Complex calculations for corner components
- No caching

**Solution:**
- Cache bounding box on element
- Recalculate only when position/rotation changes
- Add `element._boundingBoxCache` property (transient)

**Tasks:**
- [ ] Add bounding box cache to element (optional property)
- [ ] Check cache before calculating
- [ ] Invalidate cache on position/rotation change
- [ ] Measure performance improvement
- [ ] Test: No visual changes, just faster

**Files:**
- `src/components/designer/DesignCanvas2D.tsx` (lines 117-203)
- `src/types/project.ts` (add optional cache property)

**Estimated:** 2 hours
**Risk:** Low (optimization only)

---

### 2.4 Extract Services from DesignCanvas2D (1 day) 🎯 REFACTOR

**Why:**
- DesignCanvas2D is 2900+ lines
- Mixing rendering, logic, and event handling
- Hard to maintain and test

**Goal:** Reduce to <1000 lines by extracting services

**New Services to Create:**

#### A. SnappingService
```typescript
// src/services/SnappingService.ts
export class SnappingService {
  constructor(private config: SnappingConfig) {}

  snapToWalls(element, position, roomBounds): SnapResult
  snapToComponents(element, position, elements): SnapResult
  snapToGrid(value, gridSize): number
  getSnapGuides(element, position): SnapGuides
}
```

**Extract:**
- `getSnapPosition()` → `snapToWalls()` + `snapToComponents()`
- `snapToGrid()` → `snapToGrid()`
- Snap guide generation

#### B. BoundingBoxService
```typescript
// src/services/BoundingBoxService.ts
export class BoundingBoxService {
  calculateBoundingBox(element): BoundingBox
  isPointInside(point, element): boolean
  getEffectiveDimensions(element): Dimensions
}
```

**Extract:**
- `getRotatedBoundingBox()` → `calculateBoundingBox()`
- Point-in-element checks

#### C. ElementRenderingService
```typescript
// src/services/ElementRenderingService.ts
export class ElementRenderingService {
  renderPlanView(ctx, element, selected, hovered): void
  renderElevationView(ctx, element, view, selected): void
  renderSelectionHandles(ctx, element): void
  renderDragPreview(ctx, element, position): void
}
```

**Extract:**
- `drawElement()` → `renderPlanView()`
- `drawElementElevation()` → `renderElevationView()`
- `drawSelectionHandles()` → `renderSelectionHandles()`
- `drawDragPreview()` → `renderDragPreview()`

**Tasks:**
- [ ] Create SnappingService and extract snap logic
- [ ] Create BoundingBoxService and extract bbox logic
- [ ] Create ElementRenderingService and extract rendering
- [ ] Update DesignCanvas2D to use services
- [ ] Add unit tests for services
- [ ] Verify: No behavioral changes
- [ ] Measure: Lines of code reduction

**Files:**
- NEW: `src/services/SnappingService.ts`
- NEW: `src/services/BoundingBoxService.ts`
- NEW: `src/services/ElementRenderingService.ts`
- UPDATE: `src/components/designer/DesignCanvas2D.tsx` (massive reduction)

**Estimated:** 1 day (8 hours)
**Risk:** Medium (large refactor)

---

## Phase 2 Summary

**Total Time:** 2-3 days
**Risk Level:** Medium
**Outcome:**
- ✅ Corner rotation conflict fixed
- ✅ Rotation considered in snap logic
- ✅ Optimized bounding box calculations
- ✅ Services extracted from DesignCanvas2D
- ✅ Much cleaner, maintainable codebase

---

## Phase 3: Coordinate System Finalization (3-5 days)

**Note:** Only start this phase AFTER Phases 1 & 2 are complete and tested!

### 3.1 Document Coordinate System Conventions (1 day)

**Why:**
- Need clear reference
- Prevent future confusion
- Enable team collaboration

**Tasks:**
- [ ] Document origin point (where is 0,0,0?)
- [ ] Document axis directions (X=?, Y=?, Z=?)
- [ ] Document unit system (centimeters confirmed)
- [ ] Document coordinate spaces:
  - Plan view coordinates
  - World (3D) coordinates
  - Elevation view coordinates
  - Canvas pixel coordinates
- [ ] Document transformations between spaces
- [ ] Create visual diagrams
- [ ] Add examples
- [ ] Review with user

**Deliverable:** `docs/COORDINATE_SYSTEM_SPECIFICATION.md`

**Estimated:** 1 day
**Risk:** Low (documentation)

---

### 3.2 Verify Coordinate Consistency (2 days)

**Why:**
- Ensure all views use same conventions
- Verify transformations are correct
- Catch any remaining issues

**Areas to Verify:**

#### A. 2D Plan View
- [ ] (0,0) is where? (inner room top-left?)
- [ ] X-axis direction (left to right)
- [ ] Y-axis direction (front to back or top to bottom?)
- [ ] Components positioned consistently
- [ ] Rotation angles work correctly

#### B. 3D World View
- [ ] (0,0,0) is where? (room center?)
- [ ] X-axis direction
- [ ] Y-axis direction (vertical?)
- [ ] Z-axis direction
- [ ] Plan→World transformation correct
- [ ] Components appear where expected

#### C. Elevation Views (4 walls)
- [ ] Front wall: X maps to plan X, Y is height
- [ ] Back wall: X is mirrored?
- [ ] Left wall: X maps to plan Y, Y is height
- [ ] Right wall: X maps to plan Y, Y is height
- [ ] Plan→Elevation transformation correct
- [ ] Left/right symmetry verified

#### D. Canvas Coordinates
- [ ] Zoom applies consistently
- [ ] Pan offset applies correctly
- [ ] Mouse→Room coordinate conversion
- [ ] Room→Canvas coordinate conversion

**Testing Method:**
1. Place component at known position in plan view
2. Verify appears at correct position in 3D
3. Verify appears at correct position in all 4 elevations
4. Rotate component, verify positions remain consistent
5. Repeat for all 4 corners and room center

**Tasks:**
- [ ] Create coordinate verification test suite
- [ ] Test all transformations
- [ ] Document any issues found
- [ ] Fix coordinate inconsistencies
- [ ] Verify wall detection accuracy
- [ ] Verify snap points align across views

**Estimated:** 2 days
**Risk:** High (may find issues requiring fixes)

---

### 3.3 Fix Position/Rotation Issues Found (1-2 days)

**Why:**
- Address issues from verification
- Final polish

**Likely Issues:**
- Elements misaligned between views
- Rotation angles incorrect
- Wall detection off by offset
- Snap points misaligned

**Tasks:**
- [ ] Fix each issue found during verification
- [ ] Test thoroughly
- [ ] Document fixes
- [ ] Update coordinate system docs

**Estimated:** 1-2 days
**Risk:** Medium (depends on issues found)

---

## Phase 3 Summary

**Total Time:** 3-5 days
**Risk Level:** Medium to High
**Outcome:**
- ✅ Coordinate system fully documented
- ✅ All transformations verified correct
- ✅ Consistent positioning across all views
- ✅ Rotation working correctly everywhere

---

## Overall Timeline

### Week 1: Code Cleanup
- **Days 1-2:** Phase 1.1-1.4 (Quick wins)
- **Days 3-4:** Phase 1.5 (Coordinate system consolidation)
- **Day 5:** Testing and fixes

### Week 2: Logic Fixes
- **Days 1-2:** Phase 2.1-2.3 (Bug fixes)
- **Days 3-4:** Phase 2.4 (Service extraction)
- **Day 5:** Testing and documentation

### Week 3: Coordinate Finalization
- **Days 1-2:** Phase 3.1-3.2 (Document and verify)
- **Days 3-4:** Phase 3.3 (Fix issues)
- **Day 5:** Final testing and polish

**Total:** 15 days (3 weeks) for complete cleanup and coordinate system finalization

---

## Quick Wins to Do First (Can Be Done Today)

### Priority 1: Wall Thickness Removal (2 hours)
- User-requested
- Visual improvement
- Simplifies later work

### Priority 2: Corner Detection Centralization (30 min)
- Easy fix
- Reduces duplication
- No risk

### Priority 3: Remove Double Snapping (1 hour)
- Performance improvement
- Simplifies code
- Low risk

**Total for quick wins: 3.5 hours**

These can be done today to show immediate progress!

---

## Testing Strategy

### After Each Phase:

**Phase 1 Tests:**
- [ ] Plan view renders correctly
- [ ] All views still work
- [ ] Component placement unchanged
- [ ] Drag and drop works
- [ ] No visual regressions

**Phase 2 Tests:**
- [ ] Corner rotation correct in all 4 corners
- [ ] Rotated components snap correctly
- [ ] Performance improved
- [ ] Code is cleaner
- [ ] All features still work

**Phase 3 Tests:**
- [ ] Component positions consistent across views
- [ ] Rotations work in all views
- [ ] Wall detection accurate
- [ ] No coordinate drift
- [ ] Comprehensive E2E tests pass

---

## Risk Mitigation

### High Risk Items:
1. **Coordinate system consolidation (Phase 1.5)** - May break positioning
2. **Service extraction (Phase 2.4)** - Large refactor
3. **Coordinate verification (Phase 3.2)** - May find issues

### Mitigation Strategies:
- Feature flags for major changes (can rollback)
- Incremental commits (can revert)
- Extensive testing after each step
- Keep legacy code temporarily as fallback
- Document all changes thoroughly

---

## Success Criteria

### Phase 1 Success:
- ✅ Single coordinate system used everywhere
- ✅ No duplicate snapping logic
- ✅ Simple 2D plan view walls
- ✅ Code is simpler and cleaner

### Phase 2 Success:
- ✅ All bugs fixed
- ✅ Corner rotation works correctly
- ✅ DesignCanvas2D under 1000 lines
- ✅ Services are testable

### Phase 3 Success:
- ✅ Coordinate system fully documented
- ✅ All views use consistent positioning
- ✅ Rotation works correctly everywhere
- ✅ No coordinate-related bugs

---

## Next Steps

1. **User Review & Approval** of this plan
2. **Start with Quick Wins** (3.5 hours)
   - Wall thickness removal
   - Corner detection centralization
   - Remove double snapping
3. **Continue with Phase 1** (coordinate consolidation)
4. **Proceed systematically** through phases

---

## Related Documents

- [LOGIC_AUDIT_POSITIONING_ROTATION_SNAPPING.md](LOGIC_AUDIT_POSITIONING_ROTATION_SNAPPING.md) - Full audit
- [WALL_RENDERING_ANALYSIS_2D_PLAN_VIEW.md](WALL_RENDERING_ANALYSIS_2D_PLAN_VIEW.md) - Wall thickness analysis
- [SINGLE_SOURCE_OF_TRUTH_AUDIT.md](SINGLE_SOURCE_OF_TRUTH_AUDIT.md) - Database audit
- [ROOM_DATA_AUDIT_AND_DIMENSION_IMPACT.md](ROOM_DATA_AUDIT_AND_DIMENSION_IMPACT.md) - Room data audit

---

**Last Updated:** 2025-10-13
**Status:** Ready for user review and approval
**Estimated Total Effort:** 8-12 days (can be compressed with focused work)
