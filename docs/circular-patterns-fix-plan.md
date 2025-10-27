# Circular Patterns Fix Plan

## Overview

This document provides **specific, step-by-step fix plans** for all 5 circular dependency patterns identified in the RightFit Interior Designer codebase.

**Purpose**: Break the circular patterns that cause AI agents to loop endlessly when attempting fixes.

**Timeline**: 2-3 weeks for all priority fixes (40-60 hours total)

**Priority Order**: Patterns are listed in order of impact (P1 fixes first)

---

## Fix Plan Summary

| Pattern | Priority | Estimated Time | Complexity | Dependencies |
|---------|----------|----------------|------------|--------------|
| **#3: Type/Schema Mismatch** | P1 | 30 min | Easy | None |
| **#1: Positioning Coordinate** | P1 | 16 hours | High | Fix #3 first |
| **#2: State Update Circle** | P1 | 2 hours | Medium | None |
| **#5: Height Property Circle** | P2 | 8 hours | Medium | Fix #1 first |
| **#4: Corner Cabinet Logic** | P2 | 4 hours | Medium | Fix #1 first |

**Total Time**: 30.5 hours (4 working days if uninterrupted)

---

# PRIORITY 1 FIXES (Must Do First)

## Fix #3: Type/Schema Mismatch Circle

### The Problem

TypeScript types missing 4 database fields added in October 2025:
- `layer_type`
- `min_height_cm`
- `max_height_cm`
- `can_overlap_layers`

**Impact**: AI agents see TypeScript errors, assume fields don't exist, create workarounds, create tech debt.

**Circular Loop**: Add field → TS error → Agent assumes wrong → Creates workaround → Another agent finds field → Circle repeats

---

### Fix Steps

**Step 1: Regenerate TypeScript Types** (5 minutes)

```bash
# Navigate to project root
cd i:\Curser_Git\CurserCode\plan-view-kitchen-3d

# Regenerate types from Supabase schema
npx supabase gen types typescript > src/types/supabase.ts
```

**Expected Output**:
```
Generating types...
✓ Generated types for project: [your-project-id]
```

**Step 2: Verify Fields Were Added** (5 minutes)

Open `src/types/supabase.ts` and search for `component_3d_models`:

```typescript
export interface component_3d_models {
  Row: {
    id: string
    component_id: string
    // ... other fields ...
    layer_type: string | null                // ← Should be present now
    min_height_cm: number | null             // ← Should be present now
    max_height_cm: number | null             // ← Should be present now
    can_overlap_layers: string[] | null      // ← Should be present now
  }
  Insert: {
    // ... same fields ...
  }
  Update: {
    // ... same fields ...
  }
}
```

**Step 3: Run TypeScript Type Check** (2 minutes)

```bash
npm run type-check
```

**Expected**: Should compile successfully (or show unrelated errors)

**If errors appear about collision detection**:
- These are now VALID errors that should be addressed
- Fields exist, code may need updating to match types

**Step 4: Test Database Query** (5 minutes)

Create a test file or use browser console:

```typescript
// Test querying collision detection fields
const { data, error } = await supabase
  .from('component_3d_models')
  .select('component_id, layer_type, min_height_cm, max_height_cm')
  .limit(5);

console.log('Collision fields:', data);
// Should return rows with layer_type, min/max height values
```

**Step 5: Document Type Generation Process** (10 minutes)

Add to your development workflow documentation:

```markdown
## After Database Migrations

ALWAYS regenerate TypeScript types:

1. Run migration: `npx supabase db push`
2. Regenerate types: `npx supabase gen types typescript > src/types/supabase.ts`
3. Type check: `npm run type-check`
4. Commit both migration and updated types together
```

---

### Testing

**Test Case**: Try to access new fields in code without errors

```typescript
// In ComponentService.ts or similar
const model = await supabase
  .from('component_3d_models')
  .select('*')
  .eq('component_id', 'base-cabinet-600')
  .single();

// TypeScript should now recognize these properties
const layerType: string | null = model.data?.layer_type;  // ✓ No error
const minHeight: number | null = model.data?.min_height_cm;  // ✓ No error
```

**Success Criteria**:
- ✅ TypeScript compilation succeeds
- ✅ No errors when accessing `layer_type`, `min_height_cm`, `max_height_cm`, `can_overlap_layers`
- ✅ IntelliSense shows field suggestions

---

### Verification Checklist

- [ ] `npx supabase gen types typescript` completed successfully
- [ ] `src/types/supabase.ts` contains 4 new fields
- [ ] `npm run type-check` passes
- [ ] Test query returns collision detection fields
- [ ] Added type generation to development workflow docs

**Status**: ✅ **COMPLETE** when all boxes checked

**Time Taken**: ~30 minutes

---

## Fix #1: Positioning Coordinate Circle

### The Problem

Three incompatible coordinate systems with no unified transformation layer:
1. Plan view: cm, origin top-left
2. Elevation view (Legacy): Asymmetric (left flipped, right direct)
3. Elevation view (New): Unified but feature flag uncertain
4. 3D view: meters, origin centered

**Impact**: Fixing position in one view breaks another view, creating infinite loop.

**Circular Loop**: Fix elevation left → Breaks right → Fix right → Breaks 3D → Fix 3D → Breaks left → Circle repeats

---

### Fix Steps

**PHASE 1: Verify and Lock New Positioning System** (2 hours)

**Step 1.1: Verify Feature Flag State** (15 minutes)

File: [src/utils/PositionCalculation.ts](../src/utils/PositionCalculation.ts)

```typescript
// Line 53 - Check current default
private static featureFlagEnabled: boolean = true;  // Should be TRUE

// Add logging to verify runtime state
public static isUsingNewSystem(): boolean {
  console.log('[PositionCalculation] Using new positioning system:', this.featureFlagEnabled);
  return this.featureFlagEnabled;
}
```

**Step 1.2: Add Feature Flag Test** (15 minutes)

Create test file: `src/utils/__tests__/PositionCalculation.test.ts`

```typescript
import { PositionCalculation } from '../PositionCalculation';

describe('PositionCalculation Feature Flag', () => {
  it('should use new positioning system by default', () => {
    expect(PositionCalculation.isUsingNewSystem()).toBe(true);
  });

  it('should calculate left and right walls consistently', () => {
    const element = {
      x: 100, y: 100, z: 0,
      width: 60, depth: 60, height: 86,
      component_id: 'test-cabinet',
      id: 'test-1',
      type: 'cabinet' as const,
      rotation: 0,
      zIndex: 2
    };

    const roomDimensions = { width: 400, height: 600 };

    const leftPos = PositionCalculation.calculateElementPosition(
      element,
      'left-default',
      roomDimensions,
      { innerX: 0, innerY: 0, innerWidth: 800, innerHeight: 600 },
      1.0
    );

    const rightPos = PositionCalculation.calculateElementPosition(
      element,
      'right-default',
      roomDimensions,
      { innerX: 0, innerY: 0, innerWidth: 800, innerHeight: 600 },
      1.0
    );

    // Left and right should use same base calculation (before mirroring)
    // They should be consistent relative to front wall
    expect(leftPos).toBeDefined();
    expect(rightPos).toBeDefined();

    // Add assertions based on expected behavior
  });
});
```

**Step 1.3: Remove Legacy Code** (30 minutes)

File: [src/utils/PositionCalculation.ts](../src/utils/PositionCalculation.ts)

Lines 145-197 contain legacy asymmetric code. **Delete this entire section**:

```typescript
// DELETE LINES 145-197 (Legacy asymmetric positioning)

// BEFORE:
if (!this.featureFlagEnabled) {
  // Legacy logic with asymmetry
  if (view.startsWith('left')) {
    const flippedY = roomDimensions.height - element.y - effectiveDepth;
    xPos = roomPosition.innerX + (flippedY / roomDimensions.height) * calcElevationDepth;
  } else if (view.startsWith('right')) {
    xPos = roomPosition.innerX + (element.y / roomDimensions.height) * calcElevationDepth;
  }
  // ... more legacy code
}

// AFTER:
// Removed - always use new unified positioning system
```

**Step 1.4: Make New System Mandatory** (15 minutes)

Remove feature flag entirely (no longer needed):

```typescript
// DELETE:
private static featureFlagEnabled: boolean = true;

// DELETE all references to featureFlagEnabled
// Keep ONLY the new positioning logic (lines 208-266)
```

**Step 1.5: Test Across All Views** (45 minutes)

Manual testing checklist:

```
Test Component: Base cabinet 60cm x 60cm x 86cm

Position 1: Top-left corner (x=0, y=0)
  - [ ] Plan view: Top-left corner ✓
  - [ ] Front elevation: Left edge ✓
  - [ ] Back elevation: Left edge ✓
  - [ ] Left elevation: Front edge ✓
  - [ ] Right elevation: Front edge ✓
  - [ ] 3D view: Position [-2.0, 0.43, -3.0] ✓

Position 2: Center (x=170, y=270) in 400x600 room
  - [ ] Plan view: Centered ✓
  - [ ] Front elevation: Centered ✓
  - [ ] Back elevation: Centered ✓
  - [ ] Left elevation: Centered ✓
  - [ ] Right elevation: Centered ✓
  - [ ] 3D view: Position [0, 0.43, 0] approximately ✓

Position 3: Right wall (x=340, y=100)
  - [ ] Plan view: Near right wall ✓
  - [ ] Front elevation: Right side ✓
  - [ ] Right elevation: 100cm from front ✓
  - [ ] Left elevation: 100cm from front (mirrored) ✓
  - [ ] 3D view: Position [1.4, 0.43, -2.2] ✓

Critical Test: Left vs Right Consistency
  - [ ] Component at y=100 appears 100cm from front on BOTH left and right elevations ✓
  - [ ] Mirroring applies to left wall only (visual flip, not position change) ✓
```

---

**PHASE 2: Create Unified Coordinate Transformation Engine** (8 hours)

**Step 2.1: Create CoordinateTransformEngine Class** (3 hours)

File: `src/utils/CoordinateTransformEngine.ts` (create new file)

```typescript
/**
 * Unified Coordinate Transformation Engine
 *
 * Single source of truth for transforming coordinates between:
 * - Plan view (2D canvas, cm, origin top-left)
 * - Elevation views (2D canvas, cm→px, origin canvas top-left)
 * - 3D view (Three.js, meters, origin room center)
 */

export interface DesignElementPosition {
  x: number;  // cm from left wall
  y: number;  // cm from front wall
  z: number;  // cm above floor
}

export interface DesignElementDimensions {
  width: number;   // cm (X-axis)
  depth: number;   // cm (Y-axis, front-to-back)
  height: number;  // cm (Z-axis, vertical)
}

export interface RoomDimensions {
  width: number;   // cm (X-axis)
  depth: number;   // cm (Y-axis, front-to-back) - RENAMED from 'height'
  height: number;  // cm (Z-axis, ceiling height)
}

export interface CanvasPosition {
  x: number;  // pixels
  y: number;  // pixels
  width: number;  // pixels
  height: number;  // pixels
}

export interface ThreeJSPosition {
  x: number;  // meters
  y: number;  // meters (up/down)
  z: number;  // meters (front/back)
}

export class CoordinateTransformEngine {

  /**
   * Transform plan view coordinates to canvas pixels
   */
  static planToCanvas(
    element: DesignElementPosition & DesignElementDimensions,
    zoom: number
  ): CanvasPosition {
    return {
      x: element.x * zoom,
      y: element.y * zoom,
      width: element.width * zoom,
      height: element.depth * zoom  // Use depth for plan view height
    };
  }

  /**
   * Transform canvas pixels to plan view coordinates
   */
  static canvasToPlan(
    canvasPos: { x: number; y: number },
    zoom: number
  ): DesignElementPosition {
    return {
      x: canvasPos.x / zoom,
      y: canvasPos.y / zoom,
      z: 0  // Default floor level
    };
  }

  /**
   * Transform plan coordinates to elevation view canvas position
   */
  static planToElevation(
    element: DesignElementPosition & DesignElementDimensions,
    view: 'front' | 'back' | 'left' | 'right',
    roomDimensions: RoomDimensions,
    canvasWidth: number,
    canvasHeight: number
  ): CanvasPosition {
    let canvasX: number;
    let canvasY: number;

    // Horizontal position depends on view
    if (view === 'front' || view === 'back') {
      // Use X coordinate (distance from left wall)
      canvasX = (element.x / roomDimensions.width) * canvasWidth;
    } else {
      // Use Y coordinate (distance from front wall)
      const normalizedY = element.y / roomDimensions.depth;
      canvasX = normalizedY * canvasWidth;

      // Apply mirroring for left wall (visual flip only)
      if (view === 'left') {
        canvasX = canvasWidth - canvasX - (element.width * canvasWidth / roomDimensions.width);
      }
    }

    // Vertical position (Z coordinate for all views)
    const heightRatio = (element.z + element.height) / roomDimensions.height;
    canvasY = canvasHeight - (heightRatio * canvasHeight);

    return {
      x: canvasX,
      y: canvasY,
      width: element.width,  // Will be scaled by caller
      height: element.height
    };
  }

  /**
   * Transform plan coordinates to 3D world position
   */
  static planTo3D(
    element: DesignElementPosition & DesignElementDimensions,
    roomDimensions: RoomDimensions
  ): ThreeJSPosition {
    // Convert to meters
    const roomWidthMeters = roomDimensions.width / 100;
    const roomDepthMeters = roomDimensions.depth / 100;

    // Calculate centered boundaries
    const leftBoundary = -roomWidthMeters / 2;
    const backBoundary = -roomDepthMeters / 2;

    // Map plan coordinates to 3D world
    const x = leftBoundary + (element.x / roomDimensions.width) * roomWidthMeters;
    const z = backBoundary + (element.y / roomDimensions.depth) * roomDepthMeters;

    // Y position: Z coord (floor to ceiling) in 3D becomes Y
    const baseHeight = element.z / 100;  // Convert to meters
    const componentHeight = element.height / 100;
    const y = baseHeight + (componentHeight / 2);  // Center of component

    return { x, y, z };
  }

  /**
   * Transform 3D world position back to plan coordinates
   */
  static threeJSToPlan(
    position: ThreeJSPosition,
    dimensions: { width: number; height: number; depth: number },  // meters
    roomDimensions: RoomDimensions
  ): DesignElementPosition & DesignElementDimensions {
    // Convert room to meters
    const roomWidthMeters = roomDimensions.width / 100;
    const roomDepthMeters = roomDimensions.depth / 100;

    // Calculate centered boundaries
    const leftBoundary = -roomWidthMeters / 2;
    const backBoundary = -roomDepthMeters / 2;

    // Reverse mapping
    const x = ((position.x - leftBoundary) / roomWidthMeters) * roomDimensions.width;
    const y = ((position.z - backBoundary) / roomDepthMeters) * roomDimensions.depth;

    // Y position in 3D is height off floor
    const z = (position.y - (dimensions.height / 2)) * 100;  // Convert to cm

    return {
      x,
      y,
      z,
      width: dimensions.width * 100,   // Convert to cm
      depth: dimensions.depth * 100,
      height: dimensions.height * 100
    };
  }

  /**
   * Validate coordinate consistency across views
   */
  static validateConsistency(
    element: DesignElementPosition & DesignElementDimensions,
    roomDimensions: RoomDimensions
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check bounds
    if (element.x < 0 || element.x + element.width > roomDimensions.width) {
      errors.push(`X position out of bounds: ${element.x} (room width: ${roomDimensions.width})`);
    }

    if (element.y < 0 || element.y + element.depth > roomDimensions.depth) {
      errors.push(`Y position out of bounds: ${element.y} (room depth: ${roomDimensions.depth})`);
    }

    if (element.z < 0 || element.z + element.height > roomDimensions.height) {
      errors.push(`Z position out of bounds: ${element.z} (room height: ${roomDimensions.height})`);
    }

    // Test transformation round-trip
    const pos3D = this.planTo3D(element, roomDimensions);
    const backToPlan = this.threeJSToPlan(
      pos3D,
      {
        width: element.width / 100,
        height: element.height / 100,
        depth: element.depth / 100
      },
      roomDimensions
    );

    const tolerance = 0.1;  // 0.1cm tolerance for floating point errors
    if (Math.abs(backToPlan.x - element.x) > tolerance) {
      errors.push(`X coordinate round-trip error: ${backToPlan.x} vs ${element.x}`);
    }

    if (Math.abs(backToPlan.y - element.y) > tolerance) {
      errors.push(`Y coordinate round-trip error: ${backToPlan.y} vs ${element.y}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

**Step 2.2: Update PositionCalculation.ts to Use Engine** (2 hours)

File: [src/utils/PositionCalculation.ts](../src/utils/PositionCalculation.ts)

Replace existing logic with engine calls:

```typescript
import { CoordinateTransformEngine } from './CoordinateTransformEngine';

export class PositionCalculation {

  public static calculateElementPosition(
    element: DesignElement,
    view: string,
    roomDimensions: { width: number; height: number },
    roomPosition: RoomPosition,
    zoom: number
  ): ElementPosition {

    // Extract view direction
    const direction = view.split('-')[0] as 'front' | 'back' | 'left' | 'right';

    // Use unified engine
    const roomDims = {
      width: roomDimensions.width,
      depth: roomDimensions.height,  // Legacy field mapping
      height: 240  // Default ceiling height
    };

    const canvasPos = CoordinateTransformEngine.planToElevation(
      {
        x: element.x,
        y: element.y,
        z: element.z || 0,
        width: element.width,
        depth: element.depth,
        height: element.height
      },
      direction,
      roomDims,
      roomPosition.innerWidth,
      roomPosition.innerHeight
    );

    return {
      x: canvasPos.x,
      y: canvasPos.y,
      width: canvasPos.width * zoom,
      height: canvasPos.height * zoom
    };
  }
}
```

**Step 2.3: Update EnhancedModels3D.tsx to Use Engine** (2 hours)

File: [src/components/designer/EnhancedModels3D.tsx](../src/components/designer/EnhancedModels3D.tsx)

Replace `convertTo3D` function:

```typescript
import { CoordinateTransformEngine } from '../../utils/CoordinateTransformEngine';

// REPLACE convertTo3D function (around lines 200-250)
const position3D = CoordinateTransformEngine.planTo3D(
  {
    x: element.x,
    y: element.y,
    z: element.z || 0,
    width: element.width,
    depth: element.depth,
    height: element.height
  },
  {
    width: roomDimensions.width,
    depth: roomDimensions.height,  // Legacy mapping
    height: 240
  }
);

// Use position3D.x, position3D.y, position3D.z
<group position={[position3D.x, position3D.y, position3D.z]}>
```

**Step 2.4: Update DesignCanvas2D.tsx to Use Engine** (1 hour)

File: [src/components/designer/DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx)

For plan view rendering (around lines 800-1200):

```typescript
import { CoordinateTransformEngine } from '../../utils/CoordinateTransformEngine';

// In render loop
const canvasPos = CoordinateTransformEngine.planToCanvas(
  {
    x: element.x,
    y: element.y,
    z: element.z || 0,
    width: element.width,
    depth: element.depth,
    height: element.height
  },
  zoom
);

// Use canvasPos.x, canvasPos.y, canvasPos.width, canvasPos.height for drawing
```

---

**PHASE 3: Integration Testing** (6 hours)

**Step 3.1: Create Automated Position Tests** (3 hours)

File: `src/utils/__tests__/CoordinateTransformEngine.test.ts`

```typescript
import { CoordinateTransformEngine } from '../CoordinateTransformEngine';

describe('CoordinateTransformEngine', () => {
  const testRoomDimensions = {
    width: 400,  // cm
    depth: 600,  // cm
    height: 240  // cm
  };

  const testElement = {
    x: 100,
    y: 80,
    z: 0,
    width: 60,
    depth: 60,
    height: 86
  };

  describe('Plan to 3D transformation', () => {
    it('should convert plan coordinates to centered 3D position', () => {
      const pos3D = CoordinateTransformEngine.planTo3D(testElement, testRoomDimensions);

      expect(pos3D.x).toBeCloseTo(-1.0, 2);  // (100/400)*4 - 2 = -1.0
      expect(pos3D.z).toBeCloseTo(-2.2, 2);  // (80/600)*6 - 3 = -2.2
      expect(pos3D.y).toBeCloseTo(0.43, 2);  // 0 + 0.86/2 = 0.43
    });

    it('should round-trip correctly (plan → 3D → plan)', () => {
      const pos3D = CoordinateTransformEngine.planTo3D(testElement, testRoomDimensions);
      const backToPlan = CoordinateTransformEngine.threeJSToPlan(
        pos3D,
        {
          width: testElement.width / 100,
          height: testElement.height / 100,
          depth: testElement.depth / 100
        },
        testRoomDimensions
      );

      expect(backToPlan.x).toBeCloseTo(testElement.x, 1);
      expect(backToPlan.y).toBeCloseTo(testElement.y, 1);
      expect(backToPlan.z).toBeCloseTo(testElement.z, 1);
    });
  });

  describe('Plan to Elevation transformation', () => {
    it('should position correctly on front elevation', () => {
      const canvasPos = CoordinateTransformEngine.planToElevation(
        testElement,
        'front',
        testRoomDimensions,
        800,  // canvas width
        600   // canvas height
      );

      // element.x = 100, roomWidth = 400
      // Expected: (100/400) * 800 = 200px
      expect(canvasPos.x).toBeCloseTo(200, 1);
    });

    it('should position consistently on left and right elevations', () => {
      const leftPos = CoordinateTransformEngine.planToElevation(
        testElement,
        'left',
        testRoomDimensions,
        800,
        600
      );

      const rightPos = CoordinateTransformEngine.planToElevation(
        testElement,
        'right',
        testRoomDimensions,
        800,
        600
      );

      // Both should use element.y = 80
      // Right: (80/600) * 800 = 106.67px
      expect(rightPos.x).toBeCloseTo(106.67, 1);

      // Left: mirrored, so 800 - 106.67 - (60/400)*800 = 800 - 106.67 - 120 = 573.33px
      expect(leftPos.x).toBeCloseTo(573.33, 1);

      // Key test: Both use SAME base calculation (element.y)
      const leftBase = 800 - leftPos.x - (testElement.width / testRoomDimensions.width * 800);
      const rightBase = rightPos.x;
      expect(leftBase).toBeCloseTo(rightBase, 1);
    });
  });

  describe('Coordinate validation', () => {
    it('should validate element within room bounds', () => {
      const result = CoordinateTransformEngine.validateConsistency(
        testElement,
        testRoomDimensions
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect out-of-bounds elements', () => {
      const outOfBounds = {
        ...testElement,
        x: 500  // Exceeds room width of 400
      };

      const result = CoordinateTransformEngine.validateConsistency(
        outOfBounds,
        testRoomDimensions
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('out of bounds');
    });
  });
});
```

**Step 3.2: Manual Cross-View Testing** (2 hours)

Testing script in browser console:

```typescript
// Place component in plan view
const testElement = {
  id: 'test-consistency',
  component_id: 'base-cabinet-600',
  x: 100,
  y: 100,
  z: 0,
  width: 60,
  depth: 60,
  height: 86,
  type: 'cabinet',
  rotation: 0,
  zIndex: 2
};

// Add to room
await updateCurrentRoomDesign({
  design_elements: [...currentRoomDesign.design_elements, testElement]
});

// Switch views and verify position
// 1. Plan view: Should be at (100, 100) ✓
// 2. Front elevation: Should be at X=100 ✓
// 3. Left elevation: Should use Y=100 ✓
// 4. Right elevation: Should use Y=100 ✓
// 5. 3D view: Should be visible at consistent position ✓

// Check coordinate engine validation
const validation = CoordinateTransformEngine.validateConsistency(
  testElement,
  currentRoomDesign.room_dimensions
);
console.log('Validation:', validation);
// Should show: { valid: true, errors: [] }
```

**Step 3.3: Regression Testing** (1 hour)

Test existing projects to ensure no breakage:

```
- [ ] Open existing project with components
- [ ] Verify all components visible in plan view
- [ ] Verify all components visible in elevation views
- [ ] Verify all components visible in 3D view
- [ ] Move component in plan view
- [ ] Verify position updates in all other views
- [ ] Save and reload project
- [ ] Verify positions persist correctly
```

---

### Testing

**Automated Tests**:
```bash
npm test -- PositionCalculation
npm test -- CoordinateTransformEngine
```

**Manual Test Matrix**:

| Test Case | Plan | Front | Back | Left | Right | 3D | Pass |
|-----------|------|-------|------|------|-------|----|------|
| Corner (0,0) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | [ ] |
| Center (170,270) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | [ ] |
| Right edge (340,100) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | [ ] |
| Left wall component | ✓ | N/A | N/A | ✓ | N/A | ✓ | [ ] |
| Back wall component | ✓ | N/A | ✓ | N/A | N/A | ✓ | [ ] |

**Success Criteria**:
- ✅ All automated tests pass
- ✅ All manual test cases pass
- ✅ Left and right elevations use consistent Y coordinate mapping
- ✅ Plan to 3D round-trip has <0.1cm error
- ✅ No position changes when switching views

---

### Verification Checklist

- [ ] Feature flag verified as `true`
- [ ] Legacy asymmetric code deleted
- [ ] CoordinateTransformEngine created
- [ ] PositionCalculation.ts updated to use engine
- [ ] EnhancedModels3D.tsx updated to use engine
- [ ] DesignCanvas2D.tsx updated to use engine
- [ ] Automated tests written and passing
- [ ] Manual test matrix completed
- [ ] Regression testing passed
- [ ] Documentation updated

**Status**: ✅ **COMPLETE** when all boxes checked

**Time Taken**: ~16 hours

---

## Fix #2: State Update Circle

### The Problem

Array reference changes trigger `hasUnsavedChanges` flag even when data hasn't actually changed.

**Impact**: Flag stuck true, unnecessary auto-saves, poor UX.

**Circular Loop**: Update element → New array ref → Flag set true → Save → DB returns new array → Flag set true again → Circle repeats

---

### Fix Steps

**Step 1: Install Deep Equality Library** (5 minutes)

```bash
npm install lodash.isequal
npm install --save-dev @types/lodash.isequal
```

**Step 2: Implement Deep Equality Check** (30 minutes)

File: [src/contexts/ProjectContext.tsx](../src/contexts/ProjectContext.tsx)

Replace lines 886-890:

```typescript
// BEFORE (Line 886-890):
useEffect(() => {
  if (state.currentRoomDesign) {
    dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
  }
}, [state.currentRoomDesign?.design_elements, state.currentRoomDesign?.room_dimensions]);

// AFTER:
import isEqual from 'lodash.isequal';

// Store previous values for comparison
const prevElementsRef = useRef<DesignElement[] | null>(null);
const prevDimensionsRef = useRef<RoomDimensions | null>(null);

useEffect(() => {
  if (state.currentRoomDesign) {
    const currentElements = state.currentRoomDesign.design_elements;
    const currentDimensions = state.currentRoomDesign.room_dimensions;

    // Deep equality check
    const elementsChanged = !isEqual(currentElements, prevElementsRef.current);
    const dimensionsChanged = !isEqual(currentDimensions, prevDimensionsRef.current);

    if (elementsChanged || dimensionsChanged) {
      console.log('[ProjectContext] Actual changes detected:', {
        elementsChanged,
        dimensionsChanged
      });
      dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });

      // Update refs for next comparison
      prevElementsRef.current = currentElements;
      prevDimensionsRef.current = currentDimensions;
    }
  }
}, [state.currentRoomDesign?.design_elements, state.currentRoomDesign?.room_dimensions]);
```

**Step 3: Fix Save Error Handling** (15 minutes)

File: [src/contexts/ProjectContext.tsx](../src/contexts/ProjectContext.tsx)

Lines 813-850, improve error handling:

```typescript
const saveCurrentDesign = useCallback(async (showNotification: boolean = true) => {
  try {
    if (!state.currentRoomDesign) {
      throw new Error('No room design to save');
    }

    // Optimistic update: Clear flag BEFORE save
    dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
    dispatch({ type: 'SET_LAST_AUTO_SAVE', payload: new Date() });

    await updateCurrentRoomDesign({
      updated_at: new Date().toISOString()
    }, showNotification);

    if (showNotification) {
      toast.success('Design saved successfully');
    }

  } catch (error) {
    console.error('Save failed:', error);

    // Restore flag on error
    dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });

    toast.error('Failed to save design');
  }
}, [state.currentRoomDesign, updateCurrentRoomDesign, dispatch, toast]);
```

**Step 4: Add Debouncing for Auto-Save** (30 minutes)

Prevent rapid saves:

```typescript
// Add after auto-save interval setup (line 892)
const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (autoSaveEnabled && state.currentRoomDesign?.id) {
    const interval = setInterval(() => {
      const currentState = stateRef.current;
      const currentSaveFunction = saveCurrentDesignRef.current;

      if (currentState.hasUnsavedChanges && currentState.currentRoomDesign && currentSaveFunction) {
        // Debounce: Clear previous timeout
        if (saveDebounceRef.current) {
          clearTimeout(saveDebounceRef.current);
        }

        // Set new timeout (1 second debounce)
        saveDebounceRef.current = setTimeout(async () => {
          console.log('[Auto-save] Saving changes...');
          await currentSaveFunction(false);
        }, 1000);
      }
    }, 30000);  // Check every 30 seconds

    setAutoSaveInterval(interval);

    return () => {
      clearInterval(interval);
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }
}, [state.currentRoomDesign?.id, autoSaveEnabled]);
```

**Step 5: Add Logging for Debugging** (15 minutes)

Add debug logging (can be removed later):

```typescript
// In the deep equality useEffect
console.log('[State Change Detection]', {
  elementsChanged,
  dimensionsChanged,
  previousElements: prevElementsRef.current?.length,
  currentElements: currentElements?.length,
  hasUnsavedChanges: state.hasUnsavedChanges
});
```

---

### Testing

**Test 1: Array Reference Without Changes**

```typescript
// Trigger a save that returns same data
await saveCurrentDesign(false);

// Wait 100ms
await new Promise(resolve => setTimeout(resolve, 100));

// Check flag
console.log('hasUnsavedChanges:', state.hasUnsavedChanges);
// Expected: false (not stuck as true)
```

**Test 2: Actual Element Update**

```typescript
// Update an element
const updatedElements = currentRoomDesign.design_elements.map(el =>
  el.id === 'test-1' ? { ...el, x: el.x + 10 } : el
);

await updateCurrentRoomDesign({ design_elements: updatedElements });

// Check flag
console.log('hasUnsavedChanges:', state.hasUnsavedChanges);
// Expected: true (real change detected)
```

**Test 3: Save Error Recovery**

```typescript
// Simulate save error (disconnect network or use invalid data)
await saveCurrentDesign(true);
// Should show error toast

// Check flag
console.log('hasUnsavedChanges:', state.hasUnsavedChanges);
// Expected: true (flag restored on error)
```

**Test 4: Debouncing**

```typescript
// Make 5 rapid changes
for (let i = 0; i < 5; i++) {
  await updateCurrentRoomDesign({
    design_elements: [...currentRoomDesign.design_elements]
  });
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Count number of auto-saves in next 30 seconds
// Expected: 1 save (debounced)
```

---

### Verification Checklist

- [ ] `lodash.isequal` installed
- [ ] Deep equality check implemented
- [ ] Previous values stored in refs
- [ ] Optimistic flag clearing in saveCurrentDesign
- [ ] Error recovery restores flag
- [ ] Debouncing implemented
- [ ] Debug logging added
- [ ] Test 1 passed (no false positives)
- [ ] Test 2 passed (real changes detected)
- [ ] Test 3 passed (error recovery)
- [ ] Test 4 passed (debouncing works)

**Status**: ✅ **COMPLETE** when all boxes checked

**Time Taken**: ~2 hours

---

# PRIORITY 2 FIXES (After P1 Complete)

## Fix #5: Height Property Circle

### The Problem

Multiple sources of truth for component height:
1. `element.height` (dimension)
2. `element.z` (position off floor)
3. `elevation_height` (database override)
4. `component_behavior.use_actual_height_in_elevation` (flag)
5. Type-based hardcoded defaults

**Impact**: Components positioned at different heights in elevation vs 3D view.

**Circular Loop**: Fix elevation height → 3D wrong → Fix 3D → Elevation wrong → Circle repeats

---

### Fix Steps

**PHASE 1: Clarify Height vs Z Semantics** (2 hours)

**Step 1.1: Document Property Meanings** (30 minutes)

Create documentation file: `docs/component-positioning-reference.md`

```markdown
# Component Positioning Reference

## Property Definitions

### Position Properties (WHERE component is located)

- **element.x**: Horizontal distance from LEFT wall (cm)
- **element.y**: Distance from FRONT wall (cm, depth)
- **element.z**: Height above FLOOR (cm, vertical position)

### Dimension Properties (SIZE of component)

- **element.width**: X-axis dimension (cm, left-to-right)
- **element.depth**: Y-axis dimension (cm, front-to-back)
- **element.height**: Z-axis dimension (cm, floor-to-ceiling, vertical size)

## CRITICAL: Don't Confuse Height (Size) with Z (Position)

BAD:
```typescript
// Using height as position
const yPos = element.height / 100;  // ❌ WRONG - this is SIZE not POSITION
```

GOOD:
```typescript
// Using z as position
const yPos = (element.z / 100) + (element.height / 200);  // ✓ Correct
```

## Default Z Positions by Component Type

| Type | Default Z (cm) | Reasoning |
|------|---------------|-----------|
| Base Cabinet | 0 | Sits on floor |
| Counter-top | 90 | Top of base cabinet (86cm) + tolerance |
| Wall Cabinet | 140 | Standard mounting height |
| Tall/Larder | 0 | Floor to ceiling |
| Pelmet | 210 | Above wall cabinets (140 + 70) |
| Cornice | 210 | Same as pelmet |
| Appliance (built-in) | 0 | Usually floor-mounted |
| Window | 86 | Above counter height |
```

**Step 1.2: Add TypeScript JSDoc Comments** (30 minutes)

File: [src/types/project.ts](../src/types/project.ts)

```typescript
export interface DesignElement {
  id: string;
  component_id: string;

  /**
   * X Position: Horizontal distance from LEFT wall (cm)
   * @minimum 0
   * @maximum Room width
   */
  x: number;

  /**
   * Y Position: Distance from FRONT wall (cm, depth dimension)
   * @minimum 0
   * @maximum Room depth
   */
  y: number;

  /**
   * Z Position: Height above FLOOR (cm, vertical position)
   *
   * DO NOT confuse with element.height (which is the component's SIZE)
   *
   * Common values:
   * - 0: Floor-level components (base cabinets, appliances)
   * - 90: Counter-top level
   * - 140: Wall cabinet mounting height
   *
   * @minimum 0
   * @maximum Room height
   */
  z?: number;

  /**
   * Width: X-axis dimension (cm, horizontal SIZE)
   * @minimum 1
   */
  width: number;

  /**
   * Depth: Y-axis dimension (cm, front-to-back SIZE)
   * @minimum 1
   */
  depth: number;

  /**
   * Height: Z-axis dimension (cm, vertical SIZE)
   *
   * This is how TALL the component is, NOT where it's positioned.
   * For position, use element.z
   *
   * @minimum 1
   */
  height: number;

  // ... other properties
}
```

**Step 1.3: Create Z Position Validator** (1 hour)

File: `src/utils/ComponentPositionValidator.ts` (create new)

```typescript
import type { DesignElement } from '../types/project';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export class ComponentPositionValidator {

  /**
   * Validate that Z position and height are used correctly
   */
  static validateZPosition(element: DesignElement): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check if Z is undefined (common error)
    if (element.z === undefined || element.z === null) {
      warnings.push(
        `Element ${element.id} missing Z position. Will default to 0 (floor level).`
      );
    }

    // Check if Z is negative
    if (element.z !== undefined && element.z < 0) {
      errors.push(`Element ${element.id} has negative Z position: ${element.z}`);
    }

    // Check if component extends beyond room height
    const topPosition = (element.z || 0) + element.height;
    const standardRoomHeight = 240; // cm

    if (topPosition > standardRoomHeight) {
      warnings.push(
        `Element ${element.id} extends beyond standard ceiling (${topPosition}cm > 240cm)`
      );
    }

    // Check for suspicious values (height used as position)
    if (element.z !== undefined && element.z === element.height) {
      warnings.push(
        `Element ${element.id} has Z position equal to height (${element.z}). ` +
        `This is suspicious - did you mean to use height as SIZE not POSITION?`
      );
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Get default Z position for component type
   */
  static getDefaultZ(componentType: string, componentId: string): number {
    // Wall cabinets
    if (componentType === 'wall-cabinet' || componentId.includes('wall-')) {
      return 140;
    }

    // Counter-tops
    if (componentType === 'counter-top' || componentId.includes('worktop')) {
      return 90;
    }

    // Pelmet and cornice
    if (componentId.includes('pelmet') || componentId.includes('cornice')) {
      return 210;
    }

    // Windows
    if (componentType === 'window') {
      return 86;
    }

    // Everything else: floor level
    return 0;
  }

  /**
   * Ensure element has valid Z position
   */
  static ensureValidZ(element: DesignElement): DesignElement {
    if (element.z === undefined || element.z === null) {
      const defaultZ = this.getDefaultZ(element.type, element.component_id);

      console.warn(
        `[ComponentPositionValidator] Element ${element.id} missing Z position. ` +
        `Setting default: ${defaultZ}cm based on type ${element.type}`
      );

      return {
        ...element,
        z: defaultZ
      };
    }

    return element;
  }
}
```

---

**PHASE 2: Component Library Z Audit** (4 hours)

**Step 2.1: Create Audit Script** (1 hour)

File: `scripts/audit-component-z-positions.ts` (create new)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

interface ComponentZAudit {
  component_id: string;
  name: string;
  type: string;
  height: number;
  elevation_height: number | null;
  default_z_position: number | null;
  recommended_z: number;
  needs_update: boolean;
}

async function auditComponentZPositions() {
  console.log('Fetching all components...');

  const { data: components, error } = await supabase
    .from('components')
    .select('component_id, name, type, height, elevation_height, default_z_position, mount_type');

  if (error) {
    console.error('Error fetching components:', error);
    return;
  }

  console.log(`Found ${components.length} components\n`);

  const audit: ComponentZAudit[] = components.map(comp => {
    // Determine recommended Z based on type
    let recommendedZ = 0;

    if (comp.mount_type === 'wall') {
      recommendedZ = 140;
    } else if (comp.type === 'counter-top') {
      recommendedZ = 90;
    } else if (comp.component_id.includes('pelmet') || comp.component_id.includes('cornice')) {
      recommendedZ = 210;
    } else if (comp.type === 'window') {
      recommendedZ = 86;
    }

    const needsUpdate = comp.default_z_position === null || comp.default_z_position !== recommendedZ;

    return {
      component_id: comp.component_id,
      name: comp.name,
      type: comp.type,
      height: comp.height,
      elevation_height: comp.elevation_height,
      default_z_position: comp.default_z_position,
      recommended_z: recommendedZ,
      needs_update: needsUpdate
    };
  });

  // Group by needs_update
  const needsUpdate = audit.filter(a => a.needs_update);
  const upToDate = audit.filter(a => !a.needs_update);

  console.log('=== AUDIT RESULTS ===\n');
  console.log(`✅ Up to date: ${upToDate.length}`);
  console.log(`⚠️  Needs update: ${needsUpdate.length}\n`);

  if (needsUpdate.length > 0) {
    console.log('Components that need Z position updates:\n');
    console.table(needsUpdate.map(a => ({
      ID: a.component_id,
      Name: a.name,
      Type: a.type,
      Current: a.default_z_position,
      Recommended: a.recommended_z,
      Height: a.height
    })));

    // Generate SQL update script
    console.log('\n=== SQL UPDATE SCRIPT ===\n');
    console.log('-- Update default_z_position for components');

    needsUpdate.forEach(a => {
      console.log(
        `UPDATE components SET default_z_position = ${a.recommended_z} ` +
        `WHERE component_id = '${a.component_id}';  -- ${a.name}`
      );
    });
  }
}

auditComponentZPositions();
```

**Step 2.2: Run Audit** (30 minutes)

```bash
npm install ts-node --save-dev

# Run audit
npx ts-node scripts/audit-component-z-positions.ts > z-audit-results.txt

# Review results
cat z-audit-results.txt
```

**Step 2.3: Create Migration for Z Positions** (1 hour)

File: `supabase/migrations/[timestamp]_set_default_z_positions.sql`

```sql
-- Set default Z positions based on component types
-- Generated from audit script

-- Wall cabinets at 140cm
UPDATE components
SET default_z_position = 140
WHERE mount_type = 'wall'
  AND default_z_position IS NULL;

-- Counter-tops at 90cm
UPDATE components
SET default_z_position = 90
WHERE type = 'counter-top'
  AND default_z_position IS NULL;

-- Pelmet and cornice at 210cm
UPDATE components
SET default_z_position = 210
WHERE (component_id LIKE '%pelmet%' OR component_id LIKE '%cornice%')
  AND default_z_position IS NULL;

-- Windows at 86cm
UPDATE components
SET default_z_position = 86
WHERE type = 'window'
  AND default_z_position IS NULL;

-- Everything else at floor level (0cm)
UPDATE components
SET default_z_position = 0
WHERE default_z_position IS NULL;

-- Verify no NULL values remain
SELECT COUNT(*) as null_count
FROM components
WHERE default_z_position IS NULL;
```

**Step 2.4: Push Migration** (30 minutes)

```bash
npx supabase db push

# Regenerate types (includes default_z_position field)
npx supabase gen types typescript > src/types/supabase.ts

# Verify
npm run type-check
```

---

**PHASE 3: Update Rendering Logic** (2 hours)

**Step 3.1: Update ComponentService** (1 hour)

File: [src/services/ComponentService.ts](../src/services/ComponentService.ts)

Simplify elevation height logic:

```typescript
/**
 * Get Z position for element (height off floor)
 */
static getZPosition(element: DesignElement, componentData: any): number {
  // Priority 1: Explicit Z set on element
  if (element.z !== undefined && element.z !== null) {
    return element.z;
  }

  // Priority 2: Default from component definition
  if (componentData?.default_z_position !== null) {
    return componentData.default_z_position;
  }

  // Priority 3: Fallback based on type
  return ComponentPositionValidator.getDefaultZ(element.type, element.component_id);
}

/**
 * Get elevation rendering height (SIZE of component in elevation view)
 */
static getElevationHeight(element: DesignElement, componentBehavior: any): number {
  // Always use element.height (the SIZE of the component)
  // Elevation overrides are deprecated
  return element.height;
}
```

**Step 3.2: Update EnhancedModels3D** (30 minutes)

File: [src/components/designer/EnhancedModels3D.tsx](../src/components/designer/EnhancedModels3D.tsx)

Use consistent Z position:

```typescript
// Get Z position using service
const zPosition = ComponentService.getZPosition(element, componentData);

// Calculate 3D Y position
const baseHeight = zPosition / 100;  // Convert to meters
const componentHeight = element.height / 100;
const yPosition = baseHeight + (componentHeight / 2);  // Center of component

<group position={[x3d, yPosition, z3d]}>
```

**Step 3.3: Update DesignCanvas2D** (30 minutes)

File: [src/components/designer/DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx)

Remove hardcoded defaults, use ComponentService:

```typescript
// BEFORE (lines 1354-1435): Hardcoded type-based defaults
if (element.type === 'cabinet') {
  elevationHeightCm = element.height || 86;
}
// ... many more hardcoded cases

// AFTER: Use service
const zPosition = ComponentService.getZPosition(element, componentData);
const elevationHeightCm = element.height;  // Always use height for SIZE

// Vertical position on canvas
const canvasY = calculateVerticalPosition(zPosition, elevationHeightCm, canvasHeight, roomHeight);
```

---

### Testing

**Test 1: Wall Cabinet Positioning**

```typescript
const wallCabinet = {
  component_id: 'wall-cabinet-600',
  type: 'wall-cabinet',
  x: 100, y: 100,
  width: 60, depth: 35, height: 70,
  z: undefined  // Should default to 140cm
};

// Check Z assignment
const zPos = ComponentService.getZPosition(wallCabinet, componentData);
console.log('Z position:', zPos);
// Expected: 140

// Check elevation view
// Should show at 140cm off floor

// Check 3D view
// Should show at Y = 1.4 + 0.35 = 1.75m
```

**Test 2: Base Cabinet Positioning**

```typescript
const baseCabinet = {
  component_id: 'base-cabinet-600',
  type: 'cabinet',
  x: 100, y: 100,
  width: 60, depth: 60, height: 86,
  z: 0  // Explicit floor level
};

// Both elevation and 3D should show on floor
// Elevation Y should be at bottom
// 3D Y should be 0 + 0.43 = 0.43m (half height)
```

**Test 3: Consistency Check**

```typescript
// Place component in plan
// Check Z in all views
const tests = [
  { view: 'plan', expectedZ: element.z },
  { view: 'front', expectedZ: element.z },
  { view: '3d', expectedY: (element.z / 100) + (element.height / 200) }
];

tests.forEach(test => {
  // Verify position matches
});
```

---

### Verification Checklist

- [ ] Property documentation created
- [ ] JSDoc comments added to project.ts
- [ ] ComponentPositionValidator created
- [ ] Z audit script created and run
- [ ] Z position migration created
- [ ] Migration pushed to database
- [ ] ComponentService.getZPosition() implemented
- [ ] EnhancedModels3D updated
- [ ] DesignCanvas2D hardcoded defaults removed
- [ ] Test 1 passed (wall cabinet)
- [ ] Test 2 passed (base cabinet)
- [ ] Test 3 passed (consistency)

**Status**: ✅ **COMPLETE** when all boxes checked

**Time Taken**: ~8 hours

---

## Fix #4: Corner Cabinet Logic Circle

### The Problem

16 different view-specific door side rules (4 views × 4 corner positions).

**Impact**: Fixing door direction in one view breaks another.

**Circular Loop**: Fix front → Breaks left → Fix left → Breaks back → Circle repeats

---

### Fix Steps

**PHASE 1: Create Door Orientation Matrix** (2 hours)

**Step 1.1: Define Door Side Matrix** (1 hour)

File: `src/utils/CornerCabinetDoorMatrix.ts` (create new)

```typescript
/**
 * Corner Cabinet Door Orientation Matrix
 *
 * Single source of truth for which side the door appears on
 * based on corner position in the room.
 */

export type CornerPosition = 'front-left' | 'front-right' | 'back-left' | 'back-right';
export type DoorSide = 'left' | 'right';

/**
 * Master door orientation matrix
 *
 * Key insight: Door always faces AWAY from walls
 * - Front-left corner: Doors face right (away from left wall)
 * - Front-right corner: Doors face left (away from right wall)
 * - Back-left corner: Doors face right (away from left wall)
 * - Back-right corner: Doors face left (away from right wall)
 */
const DOOR_ORIENTATION_MATRIX: Record<CornerPosition, DoorSide> = {
  'front-left': 'right',   // Door swings to the right (away from left wall)
  'front-right': 'left',   // Door swings to the left (away from right wall)
  'back-left': 'right',    // Door swings to the right (away from left wall)
  'back-right': 'left'     // Door swings to the left (away from right wall)
};

export class CornerCabinetDoorMatrix {

  /**
   * Detect corner position based on element coordinates
   */
  static detectCornerPosition(
    element: { x: number; y: number; width: number; depth: number },
    roomDimensions: { width: number; depth: number },
    tolerance: number = 30  // cm
  ): CornerPosition | null {

    const isLeftEdge = element.x < tolerance;
    const isRightEdge = element.x + element.width > roomDimensions.width - tolerance;
    const isFrontEdge = element.y < tolerance;
    const isBackEdge = element.y + element.depth > roomDimensions.depth - tolerance;

    if (isFrontEdge && isLeftEdge) return 'front-left';
    if (isFrontEdge && isRightEdge) return 'front-right';
    if (isBackEdge && isLeftEdge) return 'back-left';
    if (isBackEdge && isRightEdge) return 'back-right';

    return null;  // Not in a corner
  }

  /**
   * Get door side for corner position (single source of truth)
   */
  static getDoorSide(
    cornerPosition: CornerPosition,
    manualOverride?: DoorSide | 'auto'
  ): DoorSide {

    // Priority 1: Manual override
    if (manualOverride && manualOverride !== 'auto') {
      return manualOverride;
    }

    // Priority 2: Matrix lookup
    return DOOR_ORIENTATION_MATRIX[cornerPosition];
  }

  /**
   * Complete door side determination with all logic
   */
  static determineCornerDoorSide(
    element: {
      x: number;
      y: number;
      width: number;
      depth: number;
      cornerDoorSide?: DoorSide | 'auto';
    },
    roomDimensions: { width: number; depth: number }
  ): { doorSide: DoorSide; cornerPosition: CornerPosition | null } {

    // Detect corner position
    const cornerPosition = this.detectCornerPosition(element, roomDimensions);

    if (!cornerPosition) {
      // Not a corner - default to right
      return { doorSide: 'right', cornerPosition: null };
    }

    // Get door side from matrix
    const doorSide = this.getDoorSide(cornerPosition, element.cornerDoorSide);

    return { doorSide, cornerPosition };
  }
}
```

**Step 1.2: Create Tests for Matrix** (1 hour)

File: `src/utils/__tests__/CornerCabinetDoorMatrix.test.ts`

```typescript
import { CornerCabinetDoorMatrix } from '../CornerCabinetDoorMatrix';

describe('CornerCabinetDoorMatrix', () => {
  const roomDimensions = { width: 400, depth: 600 };

  describe('Corner position detection', () => {
    it('should detect front-left corner', () => {
      const element = { x: 0, y: 0, width: 90, depth: 90 };
      const position = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions);
      expect(position).toBe('front-left');
    });

    it('should detect front-right corner', () => {
      const element = { x: 310, y: 0, width: 90, depth: 90 };  // 310 + 90 = 400
      const position = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions);
      expect(position).toBe('front-right');
    });

    it('should detect back-left corner', () => {
      const element = { x: 0, y: 510, width: 90, depth: 90 };  // 510 + 90 = 600
      const position = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions);
      expect(position).toBe('back-left');
    });

    it('should detect back-right corner', () => {
      const element = { x: 310, y: 510, width: 90, depth: 90 };
      const position = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions);
      expect(position).toBe('back-right');
    });

    it('should return null for non-corner element', () => {
      const element = { x: 100, y: 100, width: 60, depth: 60 };
      const position = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions);
      expect(position).toBeNull();
    });
  });

  describe('Door side determination', () => {
    it('should return right for front-left corner', () => {
      const doorSide = CornerCabinetDoorMatrix.getDoorSide('front-left');
      expect(doorSide).toBe('right');
    });

    it('should return left for front-right corner', () => {
      const doorSide = CornerCabinetDoorMatrix.getDoorSide('front-right');
      expect(doorSide).toBe('left');
    });

    it('should respect manual override', () => {
      const doorSide = CornerCabinetDoorMatrix.getDoorSide('front-left', 'left');
      expect(doorSide).toBe('left');  // Overridden from default 'right'
    });

    it('should ignore auto override', () => {
      const doorSide = CornerCabinetDoorMatrix.getDoorSide('front-left', 'auto');
      expect(doorSide).toBe('right');  // Uses matrix, ignores 'auto'
    });
  });

  describe('Complete determination', () => {
    it('should determine door side for corner element', () => {
      const element = { x: 0, y: 0, width: 90, depth: 90 };
      const result = CornerCabinetDoorMatrix.determineCornerDoorSide(element, roomDimensions);

      expect(result.cornerPosition).toBe('front-left');
      expect(result.doorSide).toBe('right');
    });

    it('should handle manual override', () => {
      const element = {
        x: 0, y: 0, width: 90, depth: 90,
        cornerDoorSide: 'left' as const
      };
      const result = CornerCabinetDoorMatrix.determineCornerDoorSide(element, roomDimensions);

      expect(result.doorSide).toBe('left');  // Manual override
    });
  });
});
```

---

**PHASE 2: Replace View-Specific Logic** (2 hours)

**Step 2.1: Update elevation-view-handlers.ts** (1.5 hours)

File: [src/services/2d-renderers/elevation-view-handlers.ts](../src/services/2d-renderers/elevation-view-handlers.ts)

Replace lines 512-569:

```typescript
// BEFORE: 16 different view-specific rules
if (currentView === 'front') {
  doorSide = (cornerPosition === 'front-left') ? 'right' : 'left';
} else if (currentView === 'back') {
  // ... different logic
} else if (currentView === 'left') {
  // ... different logic (INVERTED)
} else if (currentView === 'right') {
  // ... different logic
}

// AFTER: Single unified logic
import { CornerCabinetDoorMatrix } from '../../utils/CornerCabinetDoorMatrix';

const roomDimensions = {
  width: roomDims.width,
  depth: roomDims.height  // Legacy mapping
};

const { doorSide, cornerPosition } = CornerCabinetDoorMatrix.determineCornerDoorSide(
  {
    x: element.x,
    y: element.y,
    width: element.width,
    depth: element.depth,
    cornerDoorSide: element.cornerDoorSide || data.corner_door_side
  },
  roomDimensions
);

// Use doorSide for rendering (same for ALL views)
const cabinetGeometry = renderCornerCabinet(element, doorSide);
```

**Step 2.2: Add Logging for Debugging** (30 minutes)

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[Corner Cabinet]', {
    element: element.id,
    view: currentView,
    cornerPosition,
    doorSide,
    manualOverride: element.cornerDoorSide
  });
}
```

---

### Testing

**Test Matrix**: All 4 corners × 4 views = 16 test cases

```typescript
const testCases = [
  { corner: 'front-left', expectedDoor: 'right' },
  { corner: 'front-right', expectedDoor: 'left' },
  { corner: 'back-left', expectedDoor: 'right' },
  { corner: 'back-right', expectedDoor: 'left' }
];

const views = ['front', 'back', 'left', 'right'];

testCases.forEach(({ corner, expectedDoor }) => {
  views.forEach(view => {
    it(`should show ${expectedDoor} door for ${corner} corner in ${view} view`, () => {
      // Place corner cabinet
      // Switch to view
      // Verify door side matches expected
    });
  });
});
```

**Manual Testing Checklist**:

```
Place corner cabinet at front-left (0, 0):
  - [ ] Front view: Door on right ✓
  - [ ] Left view: Door on right ✓
  - [ ] All views consistent ✓

Place corner cabinet at front-right (310, 0):
  - [ ] Front view: Door on left ✓
  - [ ] Right view: Door on left ✓
  - [ ] All views consistent ✓

Place corner cabinet at back-left (0, 510):
  - [ ] Back view: Door on right ✓
  - [ ] Left view: Door on right ✓
  - [ ] All views consistent ✓

Place corner cabinet at back-right (310, 510):
  - [ ] Back view: Door on left ✓
  - [ ] Right view: Door on left ✓
  - [ ] All views consistent ✓

Test manual override:
  - [ ] Set cornerDoorSide = 'left' on front-left cabinet
  - [ ] All views show left door ✓
  - [ ] Override persists after save/reload ✓
```

---

### Verification Checklist

- [ ] CornerCabinetDoorMatrix created
- [ ] Door orientation matrix defined
- [ ] Corner position detection implemented
- [ ] Manual override support added
- [ ] Unit tests written and passing
- [ ] elevation-view-handlers.ts updated
- [ ] View-specific logic removed
- [ ] Debug logging added
- [ ] All 16 test cases passed
- [ ] Manual testing checklist completed

**Status**: ✅ **COMPLETE** when all boxes checked

**Time Taken**: ~4 hours

---

# Summary

## Fix Priority Order

1. **Fix #3: Type/Schema Mismatch** (30 min) - PREREQUISITE
2. **Fix #1: Positioning Coordinate** (16 hours) - CRITICAL
3. **Fix #2: State Update Circle** (2 hours) - MEDIUM
4. **Fix #5: Height Property Circle** (8 hours) - AFTER #1
5. **Fix #4: Corner Cabinet Logic** (4 hours) - AFTER #1

## Total Time Estimate

- **Priority 1**: 18.5 hours (2-3 days)
- **Priority 2**: 12 hours (1.5 days)
- **Total**: 30.5 hours (4 days)

## Dependencies Graph

```
Fix #3 (Types) ──┬──> Fix #1 (Positioning) ──┬──> Fix #5 (Height)
                 │                            └──> Fix #4 (Corner)
                 └──> Fix #2 (State)
```

## Success Criteria

**When ALL fixes complete**:
- ✅ No TypeScript errors on collision detection fields
- ✅ Component positions consistent across all views
- ✅ Left/right elevation views use unified coordinate mapping
- ✅ `hasUnsavedChanges` flag clears after successful save
- ✅ All 154 components have explicit Z positions
- ✅ Elevation and 3D views show same component heights
- ✅ Corner cabinet doors consistent across all views
- ✅ No circular loops when AI agents attempt fixes

---

**Document Version**: 1.0
**Last Updated**: 2025-10-26
**Author**: Winston (AI Architect)
