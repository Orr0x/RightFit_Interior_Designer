# AI Agent Guardrails - Architectural Guidelines

**Version**: 1.0
**Date**: 2025-10-27
**Status**: ✅ Active
**Epic**: Epic 1 - Eliminate Circular Dependency Patterns

---

## Purpose

This document provides **critical architectural guardrails** for AI agents (and human developers) working on the RightFit Interior Designer codebase. These guardrails prevent circular dependency patterns that caused AI agents to enter infinite loops during bug fixes.

**⚠️ READ THIS BEFORE MAKING CHANGES TO:**
- Coordinate transformation logic
- Position calculation code
- Rendering systems (2D/3D)
- Component placement logic
- Z-position/height calculations

---

## Table of Contents

1. [Quick Reference: Red Flags](#quick-reference-red-flags)
2. [The NEW UNIFIED SYSTEM](#the-new-unified-system)
3. [Circular Patterns That Were Fixed](#circular-patterns-that-were-fixed)
4. [Validation Steps Before Changes](#validation-steps-before-changes)
5. [Testing Checklist](#testing-checklist)
6. [Coordinate System Rules](#coordinate-system-rules)
7. [Feature Flag Rules](#feature-flag-rules)
8. [Examples: Correct vs Incorrect Approaches](#examples-correct-vs-incorrect-approaches)
9. [When to Ask for Help](#when-to-ask-for-help)

---

## Quick Reference: Red Flags

**🚩 STOP immediately if you find yourself:**

1. **Adding asymmetric left/right calculations**
   - ❌ Different formulas for left vs right elevation views
   - ❌ Mirror logic that only applies to one side
   - ✅ Use `CoordinateTransformEngine` for ALL views

2. **Hardcoding Z positions**
   - ❌ `const zPos = element.type === 'base-cabinet' ? 0 : 80;`
   - ✅ Use `ComponentService.getZPosition(element)`

3. **Bypassing the transform engine**
   - ❌ Direct coordinate calculations in rendering code
   - ✅ Always use `engine.planToElevation()` or `engine.planTo3D()`

4. **Creating new position calculation functions**
   - ❌ Writing new `calculateLeftWallPosition()` helper
   - ✅ Use existing `PositionCalculation.ts` methods

5. **Ignoring database Z positions**
   - ❌ Using hardcoded defaults instead of `default_z_position`
   - ✅ Database is single source of truth

6. **Making changes without tests**
   - ❌ "I'll add tests later"
   - ✅ Write tests BEFORE changing position logic

7. **Trusting database door_count field**
   - ❌ Using `component_2d_renders.door_count` directly
   - ✅ Use width-based logic (see Story 1.9)

8. **Creating circular function dependencies**
   - ❌ Function A calls B, B calls C, C calls A
   - ✅ One-way dependencies only

---

## The NEW UNIFIED SYSTEM

**Epic 1 established a UNIFIED coordinate transformation system. ALL position-related code must use it.**

### Core Principle

**Before (ASYMMETRIC - ❌ DO NOT DO THIS):**
```typescript
// Different logic for each view
if (view === 'front') {
  xPos = element.x;
} else if (view === 'back') {
  xPos = roomWidth - element.x - element.width;
} else if (view === 'left') {
  xPos = roomY + offsetY; // ❌ Different formula
} else if (view === 'right') {
  xPos = roomHeight - roomY + offsetY; // ❌ Different formula
}
```

**After (SYMMETRIC - ✅ DO THIS):**
```typescript
// Same engine for ALL views
const engine = getCoordinateEngine(roomDimensions);
const result = engine.planToElevation(element.x, element.y, view);
const xPos = result.x;
```

### Key Components

1. **CoordinateTransformEngine** (`src/services/CoordinateTransformEngine.ts`)
   - Single source of truth for coordinate transformations
   - Eliminates asymmetric left/right calculations
   - 98.68% test coverage, 34 tests
   - **Must initialize before use:** `initializeCoordinateEngine(roomDimensions)`

2. **ComponentService.getZPosition()** (`src/services/ComponentService.ts`)
   - Single source of truth for Z position (height off ground)
   - Priority: `element.z` > `default_z_position` > type-based fallback
   - **Never hardcode Z positions in rendering code**

3. **PositionCalculation.ts** (`src/utils/PositionCalculation.ts`)
   - Wrapper for elevation view calculations
   - Uses CoordinateTransformEngine internally
   - 100% test coverage, 15 tests

4. **CornerCabinetDoorMatrix** (`src/utils/CornerCabinetDoorMatrix.ts`)
   - Door orientation logic: "Door faces away from walls"
   - 100% test coverage, 46 tests
   - **Never override this logic in rendering code**

---

## Circular Patterns That Were Fixed

### Circular Pattern #1: Asymmetric Left/Right Calculations

**Problem:**
- Left and right elevation views had different coordinate formulas
- Changes to left view broke right view and vice versa
- AI agents got stuck trying to fix one without breaking the other

**Solution (Story 1.2):**
- Created CoordinateTransformEngine with symmetric formulas
- ALL views use same engine with different parameters

**Reference:** `docs/stories/sessions/1.2-coordinate-transform-engine/`

### Circular Pattern #2: Height Property Confusion

**Problem:**
- Multiple properties for height: `height`, `verticalHeight`, `z`
- No single source of truth
- Changes to one property didn't sync with others

**Solution (Story 1.9):**
- `ComponentService.getZPosition()` is authoritative
- Database `default_z_position` is ground truth
- Element `z` property can override

**Reference:** `docs/stories/sessions/1.9-height-property-simplification/`

### Circular Pattern #3: Type/Schema Mismatch

**Problem:**
- TypeScript types didn't match Supabase schema
- Fields existed in database but not in types (or vice versa)
- AI agents added fields that broke type checking

**Solution (Story 1.1):**
- Regenerated types from Supabase schema
- Made database schema the single source of truth

**Reference:** `docs/stories/sessions/1.1-typescript-types/`

### Circular Pattern #4: Door Count/Width Logic

**Problem:**
- Database `door_count` field had incorrect data
- Rendering code trusted database blindly
- No consistent door count calculation

**Solution (Story 1.9):**
- **IGNORE database door_count**
- Use width-based logic: `width <= 60 ? 1 : 2`
- Documented in code comments

### Circular Pattern #5: Corner Door Orientation

**Problem:**
- Corner cabinets showed wrong door in left/right views
- Multiple inconsistent door orientation rules
- No clear principle

**Solution (Story 1.10-1.11):**
- CornerCabinetDoorMatrix established principle: "Door faces away from walls"
- Matrix lookup for all corner positions × views
- Replaces ad-hoc orientation logic

**Reference:** `docs/stories/sessions/1.10-corner-door-matrix/`

---

## Validation Steps Before Changes

### REQUIRED Steps Before Modifying Position Logic

**1. Read existing code first**
```bash
# Understand current implementation
cat src/services/CoordinateTransformEngine.ts
cat src/utils/PositionCalculation.ts
cat src/services/ComponentService.ts
```

**2. Check test coverage**
```bash
# Ensure tests exist and pass
npm run test:run -- CoordinateTransformEngine.test.ts
npm run test:run -- PositionCalculation.test.ts
```

**3. Verify in all views**
- Plan view (top-down)
- Front elevation
- Back elevation
- Left elevation
- Right elevation
- 3D view

**4. Write tests for your change**
```typescript
// Test in PositionCalculation.test.ts or ComponentPositionValidator.test.ts
it('should handle new case correctly', () => {
  // Arrange
  const element = { x: 100, y: 200, width: 60 };
  const roomDimensions = { width: 400, depth: 300, height: 250 };

  // Act
  const result = calculatePosition(element, roomDimensions, 'left');

  // Assert
  expect(result.x).toBe(expectedValue);
});
```

**5. Run full test suite**
```bash
npm run test:run        # All unit tests
npm run type-check      # TypeScript errors
```

**6. Manual testing in browser**
- Create test room
- Add component to each wall
- Switch between all views
- Verify positions match

---

## Testing Checklist

**Before committing position-related changes:**

### Unit Tests
- [ ] CoordinateTransformEngine tests pass (34 tests)
- [ ] PositionCalculation tests pass (15 tests)
- [ ] ComponentPositionValidator tests pass (34 tests)
- [ ] CornerCabinetDoorMatrix tests pass (46 tests)
- [ ] New tests added for your changes
- [ ] All existing tests still pass (264+ tests)
- [ ] `npm run type-check` passes with zero errors

### Integration Tests
- [ ] Plan view renders correctly
- [ ] Front elevation renders correctly
- [ ] Back elevation renders correctly
- [ ] Left elevation renders correctly
- [ ] Right elevation renders correctly
- [ ] 3D view renders correctly

### Specific Element Tests
- [ ] Base cabinet on front wall: Position correct in all views
- [ ] Wall cabinet on back wall: Position correct in all views
- [ ] Corner cabinet front-left: Shows correct door in left/right views
- [ ] Corner cabinet back-right: Shows correct door in left/right views
- [ ] Tall unit: Height correct in elevation + 3D
- [ ] Dragging element: Updates correctly in all views

### Edge Cases
- [ ] Room with minimum dimensions (100×100×200cm)
- [ ] Room with maximum dimensions (2000×2000×400cm)
- [ ] Element at (0, 0) position
- [ ] Element at far corner
- [ ] Element rotation (0°, 90°, 180°, 270°)

---

## Coordinate System Rules

### Axis Definitions

**CRITICAL: These are FINAL and must not change:**

- **X-axis**: Width (left-to-right) | 0 = left wall, max = right wall
- **Y-axis**: Depth (front-to-back) | 0 = front wall, max = back wall
- **Z-axis**: Height (floor-to-ceiling) | 0 = floor, max = ceiling

### Room Dimensions

```typescript
interface RoomDimensions {
  width: number;   // X-axis (cm)
  depth: number;   // Y-axis (cm) - legacy called "height"
  height: number;  // Z-axis (cm) - actual room height
}
```

**⚠️ Legacy Note:** Room depth used to be called `height` in old code. This is deprecated. Use `depth` for Y-axis, `height` for Z-axis.

### Element Position

```typescript
interface ElementPosition {
  x: number;        // Position on X-axis (0 to roomWidth)
  y: number;        // Position on Y-axis (0 to roomDepth)
  z?: number;       // Height off floor (0 to roomHeight) - optional
  rotation: number; // Rotation in degrees (0-360)
}
```

### Coordinate Transformation Flow

```
Plan View (X, Y)
      ↓
CoordinateTransformEngine
      ↓
Elevation View (X, Z) or 3D View (X, Y, Z)
```

**❌ NEVER transform directly in rendering code**
**✅ ALWAYS use CoordinateTransformEngine**

---

## Feature Flag Rules

**Feature flags in this codebase are for development testing only, not production toggles.**

### DO NOT:
- ❌ Use feature flags to hide incomplete implementations
- ❌ Ship code with feature flags in production
- ❌ Create permanent feature flags

### DO:
- ✅ Use feature flags during development to test new coordinate logic
- ✅ Remove feature flag code before merging to main
- ✅ Document why flag exists in code comments

### Example (Acceptable):
```typescript
// TEMPORARY: Testing new corner door logic (remove before merge)
const useNewCornerLogic = import.meta.env.DEV && false;

if (useNewCornerLogic) {
  // New experimental logic
} else {
  // Current stable logic (use CornerCabinetDoorMatrix)
}
```

---

## Examples: Correct vs Incorrect Approaches

### Example 1: Adding a New Elevation View Calculation

**❌ INCORRECT (Asymmetric):**
```typescript
function calculateNewWallPosition(element: Element, view: string) {
  // WRONG: Different formula for each view
  if (view === 'left') {
    return { x: element.y, y: element.z };
  } else if (view === 'right') {
    return { x: roomDepth - element.y, y: element.z }; // Asymmetric!
  }
}
```

**✅ CORRECT (Using Engine):**
```typescript
function calculateNewWallPosition(element: Element, view: string) {
  // RIGHT: Use CoordinateTransformEngine
  const engine = getCoordinateEngine(roomDimensions);
  return engine.planToElevation(element.x, element.y, view);
}
```

### Example 2: Getting Element Height

**❌ INCORRECT (Hardcoded):**
```typescript
function renderElement(element: Element) {
  // WRONG: Hardcoded Z positions
  const z = element.type === 'base-cabinet' ? 0 :
            element.type === 'wall-cabinet' ? 150 :
            element.type === 'tall-unit' ? 0 : 0;
}
```

**✅ CORRECT (Single Source):**
```typescript
function renderElement(element: Element) {
  // RIGHT: Use ComponentService
  const z = ComponentService.getZPosition(element);
}
```

### Example 3: Door Count Logic

**❌ INCORRECT (Trusting Database):**
```typescript
function renderDoors(component: Component) {
  // WRONG: Database door_count is incorrect
  const doorCount = component.door_count;
}
```

**✅ CORRECT (Width-Based):**
```typescript
function renderDoors(component: Component) {
  // RIGHT: Industry standard width-based logic
  const doorCount = component.width <= 60 ? 1 : 2;
  // Note: Ignoring component.door_count (database has bad data)
}
```

### Example 4: Corner Door Orientation

**❌ INCORRECT (Ad-hoc Logic):**
```typescript
function getCornerDoorSide(position: string, view: string) {
  // WRONG: Arbitrary rules
  if (position === 'front-left' && view === 'left') {
    return 'right'; // Why? No clear principle
  }
  // ... more arbitrary rules
}
```

**✅ CORRECT (Using Matrix):**
```typescript
function getCornerDoorSide(position: string, view: string) {
  // RIGHT: Use established matrix
  return CornerCabinetDoorMatrix.getDoorSide(position, view);
  // Principle: "Door faces away from walls"
}
```

---

## When to Ask for Help

**STOP and ask the user if:**

1. **You need to modify CoordinateTransformEngine**
   - This is core infrastructure
   - Changes affect all views
   - Requires extensive testing

2. **Tests are failing after your changes**
   - Don't disable tests
   - Don't change tests to pass without understanding why
   - Failing tests indicate your change breaks existing behavior

3. **You discover new circular patterns**
   - Document the pattern
   - Propose solution
   - Get user approval before implementing

4. **You need to add new coordinate transformation logic**
   - Should it use the engine?
   - Is there an existing method?
   - Do we need a new method?

5. **Database schema changes are needed**
   - Schema changes affect all environments
   - Requires migration script
   - Needs user approval

6. **You're unsure if your approach is correct**
   - Better to ask than to create new circular patterns
   - User can reference Winston's architecture docs
   - Prevents wasted effort

---

## Quick Decision Tree

```
Need to change position/coordinate logic?
│
├─ YES → Does CoordinateTransformEngine handle this?
│        │
│        ├─ YES → Use the engine ✅
│        │
│        └─ NO → Does PositionCalculation have a method?
│                │
│                ├─ YES → Use that method ✅
│                │
│                └─ NO → STOP. Ask user if new method needed ⚠️
│
└─ NO → Need to get element height/Z position?
         │
         ├─ YES → Use ComponentService.getZPosition() ✅
         │
         └─ NO → Proceed with caution, review guardrails ⚠️
```

---

## Critical Files - DO NOT MODIFY WITHOUT TESTS

These files are core infrastructure. Changes require:
1. Understanding the current implementation
2. Writing tests first
3. Running full test suite
4. Manual testing in all views

**Core Infrastructure:**
- `src/services/CoordinateTransformEngine.ts` (98.68% coverage, 34 tests)
- `src/utils/PositionCalculation.ts` (100% coverage, 15 tests)
- `src/services/ComponentService.ts` (key methods tested)
- `src/utils/CornerCabinetDoorMatrix.ts` (100% coverage, 46 tests)
- `src/utils/ComponentPositionValidator.ts` (98.75% coverage, 34 tests)

**Rendering Systems:**
- `src/components/designer/DesignCanvas2D.tsx` (117K+ characters - needs refactor)
- `src/components/designer/EnhancedModels3D.tsx` (3D rendering)
- `src/services/2d-renderers/elevation-view-handlers.ts` (elevation rendering)

**Database Interaction:**
- `src/contexts/ProjectContext.tsx` (state management)
- `src/services/RoomService.ts` (room data)
- `src/integrations/supabase/types.ts` (generated types - do not edit manually)

---

## Success Metrics

**You're on the right track if:**

- ✅ All 264+ tests passing
- ✅ Zero TypeScript errors
- ✅ Element positions correct in all 6 views (plan + 4 elevations + 3D)
- ✅ Code uses CoordinateTransformEngine for transformations
- ✅ Code uses ComponentService.getZPosition() for heights
- ✅ No hardcoded position calculations in rendering code
- ✅ Changes have unit tests
- ✅ Manual testing confirms correct behavior

**You're going wrong if:**

- ❌ Tests failing after your changes
- ❌ TypeScript errors appearing
- ❌ Element positions wrong in some views
- ❌ Adding new asymmetric left/right logic
- ❌ Hardcoding Z positions
- ❌ Bypassing CoordinateTransformEngine
- ❌ No tests for your changes
- ❌ Creating circular function dependencies

---

## Additional Resources

**Architecture Documentation:**
- [brownfield-architecture.md](./brownfield-architecture.md) - System architecture
- [CODE_REVIEW_COMPREHENSIVE.md](./CODE_REVIEW_COMPREHENSIVE.md) - Critical issues
- [circular-patterns-fix-plan.md](./circular-patterns-fix-plan.md) - Fix instructions
- [coordinate-system-visual-guide.md](./coordinate-system-visual-guide.md) - Visual guide

**Story Documentation:**
- [docs/stories/README.md](./stories/README.md) - Epic 1 progress
- [docs/stories/sessions/](./stories/sessions/) - Session summaries for each story

**Testing Documentation:**
- [HANDOVER.md](../HANDOVER.md) - Complete context for Epic 1

**Development Guidelines:**
- [CLAUDE.md](../CLAUDE.md) - Project instructions
- [STRUCTURED-LOGGING-GUIDE.md](./STRUCTURED-LOGGING-GUIDE.md) - Logging guidelines
- [INPUT-VALIDATION-GUIDE.md](./INPUT-VALIDATION-GUIDE.md) - Validation guidelines

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-27 | Initial version - Epic 1 completion |

---

**Last Updated:** 2025-10-27
**Maintained By:** Development Team
**Review Cycle:** After each architectural change

---

**Remember:** When in doubt, ask the user. It's better to clarify than to create new circular patterns that will trap the next AI agent.
