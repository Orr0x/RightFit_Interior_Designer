# Coordinate System Refactor Plan
**Date:** 2025-10-13
**Type:** Complete System Rebuild
**Estimated Time:** 3-4 weeks
**Status:** 📋 **READY TO START**

---

## Context

After 2 weeks of micro-fixes going in circles, and completing all other cleanup tasks, this is the **final major refactor** needed to tie everything together properly.

**What's Already Done:**
- ✅ Removed wall thickness (Phase 1.1)
- ✅ Centralized corner detection (Phase 1.2)
- ✅ Removed double snapping (Phase 1.3)
- ✅ Consolidated snap thresholds (Phase 1.4)
- ✅ Fixed elevation positioning for left/right walls
- ✅ Fixed 2D/3D rotation consistency
- ✅ Fixed non-square cabinet wall snapping

**What Needs Refactoring:**
- The core coordinate transformation system
- The rotation abstraction layer
- The bounding box calculation system
- The component type system (special cases)

---

## Design Goals

### 1. Single Source of Truth for Coordinates

**Current Problem:** Three coordinate systems with manual conversions scattered everywhere

**Solution:** Universal coordinate space with transform engine

```typescript
// Universal world coordinates
interface WorldPosition {
  x: number;  // cm, origin at room center
  y: number;  // cm, vertical (up positive)
  z: number;  // cm, depth (origin at room center)
}

// Component always stores world position
interface Component {
  id: string;
  position: WorldPosition;  // World coordinates
  dimensions: Dimensions;   // Never changes with rotation
  rotation: number;         // Radians around Y axis
  type: ComponentType;
}
```

### 2. Transform Engine API

**Current Problem:** Conversion functions scattered, inconsistent

**Solution:** Single transform engine with clear API

```typescript
class TransformEngine {
  // Constructor takes room dimensions
  constructor(private room: RoomDimensions) {}

  // World → View transforms
  worldToCanvas2D(pos: WorldPosition, zoom: number, pan: Vector2): CanvasPosition;
  worldToThreeJS(pos: WorldPosition): Vector3;
  worldToElevation(pos: WorldPosition, wall: WallDirection): ElevationPosition;

  // View → World transforms
  canvas2DToWorld(pos: CanvasPosition, zoom: number, pan: Vector2): WorldPosition;

  // Bounding boxes (always in world coordinates)
  getDataBounds(component: Component): Bounds;
  getVisualBounds(component: Component): Bounds; // Axis-aligned, includes rotation
  getOrientedBounds(component: Component): OrientedBounds; // Rotated rectangle

  // Collision detection (uses oriented bounds)
  checkCollision(c1: Component, c2: Component): boolean;
  checkWallCollision(component: Component, wall: Wall): boolean;
}
```

### 3. Eliminate Special Cases

**Current Problem:** Corner cabinets, counter-tops, wall cabinets all have special logic

**Solution:** Polymorphic component system

```typescript
abstract class Component {
  abstract getFootprint(): Polygon;
  abstract render2D(ctx: Context2D, view: ViewType): void;
  abstract render3D(): THREE.Object3D;

  // All components follow same positioning rules
  getPosition(): WorldPosition;
  setPosition(pos: WorldPosition): void;
  getRotation(): number;
  setRotation(angle: number): void;
}

// Specific types implement their own rendering
class StandardCabinet extends Component {
  getFootprint() { return Rectangle(this.dimensions); }
}

class CornerCabinet extends Component {
  getFootprint() { return LShape(this.dimensions); }
}

class Countertop extends Component {
  getFootprint() { return Rectangle(this.dimensions); }
}
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### Day 1-2: Design & Setup
- [x] Create architecture assessment (done)
- [ ] Design `WorldPosition` type system
- [ ] Design `TransformEngine` API
- [ ] Design `Component` base class
- [ ] Write specification document
- [ ] Create new files:
  - `src/core/types/WorldPosition.ts`
  - `src/core/types/Bounds.ts`
  - `src/core/TransformEngine.ts`
  - `src/core/Component.ts`

#### Day 3-4: Implement Transform Engine
- [ ] Implement `WorldPosition` type
- [ ] Implement `TransformEngine` class:
  - `worldToCanvas2D()`
  - `canvas2DToWorld()`
  - `worldToThreeJS()`
  - `worldToElevation()`
- [ ] Write comprehensive tests:
  - Test world ↔ canvas conversions
  - Test world ↔ 3D conversions
  - Test elevation transformations
  - Test with different room sizes
  - Test with zoom/pan

#### Day 5: Implement Bounding Box System
- [ ] Implement `getDataBounds()`
- [ ] Implement `getVisualBounds()` (AABB with rotation)
- [ ] Implement `getOrientedBounds()` (OBB)
- [ ] Write tests:
  - Square components at all rotations
  - Non-square components at all rotations
  - Verify AABB contains OBB

**Milestone 1:** Transform engine complete with tests ✅

---

### Phase 2: Migration - 2D Canvas (Week 2)

#### Day 6-7: Migrate Plan View Rendering
- [ ] Convert `DesignCanvas2D` to use `TransformEngine`
- [ ] Replace all `roomPosition` calculations with `worldToCanvas2D()`
- [ ] Update element rendering to use world coordinates
- [ ] Test:
  - [ ] Plan view looks identical to before
  - [ ] Zoom works correctly
  - [ ] Pan works correctly
  - [ ] Components render at correct positions

#### Day 8-9: Migrate Elevation View Rendering
- [ ] Replace `PositionCalculation.ts` with `TransformEngine.worldToElevation()`
- [ ] Remove legacy vs. new system (single implementation)
- [ ] Update elevation rendering to use transform engine
- [ ] Test:
  - [ ] All 4 elevation views show correct positions
  - [ ] Positions match plan view
  - [ ] Non-square cabinets render correctly
  - [ ] No more left/right asymmetry

#### Day 10: Migrate Coordinate Conversions
- [ ] Replace `canvasToRoom()` with `canvas2DToWorld()`
- [ ] Update mouse event handlers
- [ ] Update drag & drop logic
- [ ] Test:
  - [ ] Click detection works
  - [ ] Drag preview shows correct position
  - [ ] Drop places at correct position

**Milestone 2:** All 2D views use transform engine ✅

---

### Phase 3: Migration - 3D & Collision (Week 3)

#### Day 11-12: Migrate 3D Rendering
- [ ] Update `EnhancedModels3D.tsx` to use `worldToThreeJS()`
- [ ] Remove `convertTo3D()` function
- [ ] Update `DynamicComponentRenderer.tsx`
- [ ] Test:
  - [ ] 3D components render at correct positions
  - [ ] Rotation works in 3D
  - [ ] Position matches 2D views

#### Day 13-14: Migrate Collision Detection
- [ ] Replace bounding box calculations with `TransformEngine` methods
- [ ] Update snap logic to use `getVisualBounds()`
- [ ] Update wall collision to use `checkWallCollision()`
- [ ] Test:
  - [ ] Wall snapping works for all component types
  - [ ] Auto-rotation to face walls works
  - [ ] Component-to-component snapping works
  - [ ] No overlaps allowed

#### Day 15: Migrate Click Detection
- [ ] Replace `isPointInRotatedComponent()` with OBB collision
- [ ] Update hover detection
- [ ] Update selection detection
- [ ] Test:
  - [ ] Clicking selects correct component
  - [ ] Hover highlights correct component
  - [ ] Works for rotated components

**Milestone 3:** All systems use transform engine ✅

---

### Phase 4: Cleanup & Polish (Week 4)

#### Day 16-17: Remove Legacy Code
- [ ] Delete `PositionCalculation.ts` (replaced by TransformEngine)
- [ ] Delete `convertTo3D()` function
- [ ] Delete `canvasToRoom()` / `roomToCanvas()` from DesignCanvas2D
- [ ] Delete `getRotatedBoundingBox()` function
- [ ] Delete feature flag `use_new_positioning_system`
- [ ] Remove all coordinate conversion scattered in code
- [ ] Verify nothing breaks

#### Day 18: Component Type System
- [ ] Create `Component` base class
- [ ] Refactor corner detection to use polymorphism
- [ ] Remove `isCorner`, `isCounterTop`, etc. checks
- [ ] Each type implements its own behavior
- [ ] Test all component types

#### Day 19: Documentation & Tests
- [ ] Document `TransformEngine` API
- [ ] Document coordinate system architecture
- [ ] Add integration tests:
  - [ ] Drop component, verify all views consistent
  - [ ] Rotate component, verify all views update
  - [ ] Move component, verify collision detection
- [ ] Add visual regression tests if possible

#### Day 20: Final Testing & Polish
- [ ] Full app testing:
  - [ ] All views work correctly
  - [ ] All component types work
  - [ ] Rotation works everywhere
  - [ ] Snap/collision works
  - [ ] Performance is acceptable
- [ ] Fix any remaining bugs
- [ ] Code review and cleanup
- [ ] Merge to main

**Milestone 4:** Refactor complete! ✅

---

## File Structure

### New Files to Create

```
src/core/
  ├── types/
  │   ├── WorldPosition.ts       // Universal coordinate type
  │   ├── Bounds.ts               // Bounding box types
  │   ├── Dimensions.ts           // Component dimensions
  │   └── ViewTypes.ts            // Plan, elevation, 3D view types
  ├── TransformEngine.ts          // Coordinate transformation engine
  ├── Component.ts                // Base component class
  └── __tests__/
      ├── TransformEngine.test.ts // Comprehensive tests
      └── Bounds.test.ts          // Bounding box tests

src/components/types/
  ├── StandardCabinet.ts          // Extends Component
  ├── CornerCabinet.ts            // Extends Component
  ├── Countertop.ts               // Extends Component
  └── WallCabinet.ts              // Extends Component
```

### Files to Modify

```
src/components/designer/
  ├── DesignCanvas2D.tsx          // Use TransformEngine throughout
  ├── EnhancedModels3D.tsx        // Use TransformEngine for 3D
  └── PropertiesPanel.tsx         // Minor updates

src/components/3d/
  └── DynamicComponentRenderer.tsx // Use TransformEngine

src/utils/
  ├── PositionCalculation.ts      // DELETE (replaced by TransformEngine)
  └── cornerDetection.ts          // Simplify or remove (use polymorphism)
```

---

## Testing Strategy

### Unit Tests (Per Component)

```typescript
describe('TransformEngine', () => {
  it('converts world to canvas correctly');
  it('converts canvas to world correctly');
  it('round-trip conversion preserves position');
  it('handles zoom correctly');
  it('handles pan correctly');
  it('elevation view positions match plan view');
});

describe('Bounds', () => {
  it('data bounds never change with rotation');
  it('visual bounds swap for 90°/270° rotation');
  it('oriented bounds match component rotation');
  it('AABB contains OBB');
});
```

### Integration Tests (Full Flow)

```typescript
describe('Component Placement', () => {
  it('drops component at correct world position');
  it('component visible in all views');
  it('component positions match across views');
  it('rotation updates all views');
});

describe('Collision Detection', () => {
  it('prevents overlapping components');
  it('snaps to walls correctly');
  it('auto-rotates to face walls');
  it('handles rotated components');
});
```

### Manual Testing Checklist

Plan View:
- [ ] Components render at correct positions
- [ ] Zoom works
- [ ] Pan works
- [ ] Selection works
- [ ] Drag & drop works
- [ ] Rotation works

Elevation Views (all 4):
- [ ] Components render at correct horizontal positions
- [ ] Heights are correct
- [ ] Switching walls shows different components
- [ ] Positions match plan view

3D View:
- [ ] Components at correct positions
- [ ] Rotation matches 2D views
- [ ] Vertical positioning correct (base vs. wall cabinets)

Interactions:
- [ ] Wall snapping works
- [ ] Auto-rotation works
- [ ] Component-to-component snapping works
- [ ] Click detection works
- [ ] No overlaps allowed

---

## Risk Mitigation

### Risk 1: Breaking Existing Functionality

**Mitigation:**
- Keep old code until new code proven working
- Feature flag to switch between systems
- Extensive testing before deletion
- Can rollback if needed

### Risk 2: Performance Regression

**Mitigation:**
- Profile transform engine performance
- Cache transformed coordinates when possible
- Only recalculate on change (position, rotation, zoom, pan)
- Test with 50+ components in room

### Risk 3: Edge Cases

**Mitigation:**
- Test with all component types
- Test with all rotations (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
- Test with extreme room sizes (very small, very large)
- Test with extreme zoom (0.1x, 10x)
- Test with components at room boundaries

### Risk 4: Scope Creep

**Mitigation:**
- Stick to the plan - no adding features during refactor
- Focus on replacing existing functionality
- Improvements come AFTER refactor complete
- Track deviations in a "Future Enhancements" list

---

## Success Criteria

### Must Have (MVP)

- [ ] All views show components at correct positions
- [ ] Rotation works consistently across all views
- [ ] Collision detection works for all component types
- [ ] No performance regression
- [ ] Zero errors in console
- [ ] All existing features still work
- [ ] Code is cleaner and more maintainable

### Nice To Have (Stretch)

- [ ] Component type system fully polymorphic
- [ ] Performance improvements
- [ ] Visual debugging overlay (show bounding boxes)
- [ ] Better error messages
- [ ] Comprehensive test coverage (>80%)

---

## Next Steps

### To Start This Refactor:

1. **Review this plan** - Make sure you agree with approach
2. **Create refactor branch** - `git checkout -b refactor/coordinate-system`
3. **Day 1 tasks** - Start with design and setup
4. **Daily commits** - Commit working code at end of each day
5. **Test continuously** - Don't wait until end to test

### First Coding Session (Day 1):

```bash
# Create branch
git checkout -b refactor/coordinate-system

# Create file structure
mkdir -p src/core/types src/core/__tests__ src/components/types

# Create files
touch src/core/types/WorldPosition.ts
touch src/core/types/Bounds.ts
touch src/core/TransformEngine.ts
touch src/core/__tests__/TransformEngine.test.ts

# Start with WorldPosition type
# Then TransformEngine skeleton
# Then write first test
```

---

## Questions Before Starting?

1. Does this approach make sense?
2. Is 3-4 weeks acceptable timeline?
3. Any concerns about the API design?
4. Want to adjust the plan?

**When ready, just say "let's start" and we'll begin with Day 1! 🚀**
