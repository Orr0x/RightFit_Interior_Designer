# Phase 5 Implementation Checklist: True Center Rotation

**Status**: Ready to implement (after Phases 1-4 tested)
**Branch**: Will be implemented on `feature/true-center-rotation`
**Estimated Time**: 3-4 hours
**Risk Level**: High (affects rendering, hit detection, snapping)

---

## Overview

Components currently rotate around their **top-left corner (0, 0)** instead of their **geometric center**. This causes:
- Incorrect visual rotation
- Misaligned bounding boxes
- Broken hit detection for rotated components
- Confusing user experience

**The Fix**: Rotate around geometric center `(width/2, depth/2)`

---

## Pre-Implementation Checklist

- [ ] Phases 1-4 tested and working
- [ ] Create branch `feature/true-center-rotation` from `feature/elevation-simplified`
- [ ] Backup current working state
- [ ] Review rotation code in planning docs

---

## Implementation Steps

### 1. Update DesignCanvas2D.tsx - Component Rendering (2D Plan View)

**File**: `src/components/designer/DesignCanvas2D.tsx`
**Location**: Around line 1285 (component rendering loop)

#### Current Code (WRONG):
```typescript
// Rotates around top-left corner
ctx.translate(canvasPos.x, canvasPos.y);
ctx.rotate(element.rotation * Math.PI / 180);
ctx.fillRect(0, 0, width * zoom, depth * zoom);
```

#### Fixed Code:
```typescript
// Calculate geometric center
const centerX = canvasPos.x + (width * zoom) / 2;
const centerY = canvasPos.y + (depth * zoom) / 2;

// Rotate around center
ctx.save();
ctx.translate(centerX, centerY);
ctx.rotate(element.rotation * Math.PI / 180);

// Draw centered (offset by half dimensions)
ctx.fillRect(-width * zoom / 2, -depth * zoom / 2, width * zoom, depth * zoom);
ctx.restore();
```

#### Tasks:
- [ ] Find component rendering loop in DesignCanvas2D.tsx
- [ ] Locate rotation transformation code
- [ ] Replace top-left rotation with center rotation
- [ ] Add comments explaining geometric center calculation
- [ ] Ensure `ctx.save()` and `ctx.restore()` are used correctly

---

### 2. Update Bounding Box Calculations

**File**: `src/utils/RotationUtils.ts` (may need to create)
**Purpose**: Calculate correct bounding boxes for rotated components

#### Create RotationUtils:
```typescript
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function getRotatedBoundingBox(
  x: number,
  y: number,
  width: number,
  depth: number,
  rotation: number
): BoundingBox {
  // Convert rotation to radians
  const rad = (rotation * Math.PI) / 180;

  // Calculate center point
  const centerX = x + width / 2;
  const centerY = y + depth / 2;

  // Calculate all four corners after rotation
  const corners = [
    { x: x, y: y },                      // Top-left
    { x: x + width, y: y },              // Top-right
    { x: x + width, y: y + depth },      // Bottom-right
    { x: x, y: y + depth }               // Bottom-left
  ];

  // Rotate each corner around center
  const rotatedCorners = corners.map(corner => {
    const dx = corner.x - centerX;
    const dy = corner.y - centerY;
    return {
      x: centerX + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: centerY + dx * Math.sin(rad) + dy * Math.cos(rad)
    };
  });

  // Find bounding box
  const xs = rotatedCorners.map(c => c.x);
  const ys = rotatedCorners.map(c => c.y);

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}
```

#### Tasks:
- [ ] Create `src/utils/RotationUtils.ts`
- [ ] Implement `getRotatedBoundingBox()` function
- [ ] Add TypeScript interfaces for BoundingBox
- [ ] Add unit tests for rotation calculations
- [ ] Test with various rotation angles (0°, 45°, 90°, 180°, 270°)

---

### 3. Update Hit Detection for Rotated Components

**File**: `src/components/designer/DesignCanvas2D.tsx`
**Location**: Mouse click handler / element selection

#### Current Problem:
Hit detection uses simple rectangle check that doesn't account for rotation:
```typescript
// WRONG: Doesn't work for rotated components
if (mouseX >= x && mouseX <= x + width &&
    mouseY >= y && mouseY <= y + depth) {
  // Selected!
}
```

#### Fixed Code:
```typescript
import { getRotatedBoundingBox } from '@/utils/RotationUtils';

// Get rotated bounding box
const bbox = getRotatedBoundingBox(
  element.x,
  element.y,
  element.width,
  element.depth,
  element.rotation
);

// Check if point is inside rotated bounding box
// For precise hit detection, use point-in-rotated-rectangle algorithm
function isPointInRotatedRect(
  pointX: number,
  pointY: number,
  rectX: number,
  rectY: number,
  width: number,
  depth: number,
  rotation: number
): boolean {
  // Translate point to rectangle's local space
  const centerX = rectX + width / 2;
  const centerY = rectY + depth / 2;

  const dx = pointX - centerX;
  const dy = pointY - centerY;

  // Rotate point in opposite direction
  const rad = -(rotation * Math.PI / 180);
  const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
  const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

  // Check if point is inside unrotated rectangle
  return Math.abs(localX) <= width / 2 &&
         Math.abs(localY) <= depth / 2;
}
```

#### Tasks:
- [ ] Find element selection/hit detection code
- [ ] Replace simple rectangle check with rotated hit detection
- [ ] Add `isPointInRotatedRect()` function to RotationUtils
- [ ] Test clicking on rotated components (0°, 45°, 90°, etc.)
- [ ] Ensure selection highlights work correctly

---

### 4. Update Elevation View Rendering

**File**: `src/services/2d-renderers/elevationViewRenderer.ts` (or similar)
**Location**: Elevation view component rendering

#### Tasks:
- [ ] Check if elevation views use rotation
- [ ] Apply same center-rotation fix to elevation rendering
- [ ] Test rotation in all 4 elevation views (North, South, East, West)

---

### 5. Update Rotation Handles/Gizmos (If Implemented)

**File**: `src/components/designer/DesignCanvas2D.tsx`
**Location**: Rotation handle rendering

#### Tasks:
- [ ] Check if rotation handles/gizmos are implemented
- [ ] If yes, update handle position to component center
- [ ] Test rotation handle interaction
- [ ] Ensure visual feedback matches new rotation behavior

---

### 6. Update Snapping for Rotated Components

**File**: `src/utils/canvasCoordinateIntegration.ts`
**Location**: Wall/corner snapping calculations

#### Current Issue:
Snapping may use top-left corner position instead of center

#### Tasks:
- [ ] Review snapping logic for rotated components
- [ ] Ensure snap points use geometric center
- [ ] Test corner placement with various rotations
- [ ] Test wall snapping with rotated components

---

### 7. Update 3D Scene Rotation (If Needed)

**File**: `src/components/designer/DesignCanvas3D.tsx` or similar
**Location**: 3D model placement

#### Tasks:
- [ ] Check if 3D scene matches 2D rotation behavior
- [ ] Ensure 3D components rotate around center
- [ ] Verify 3D-to-2D coordinate mapping is consistent

---

## Testing Checklist

### Visual Testing:
- [ ] **0° Rotation**: Component renders normally
- [ ] **90° Rotation**: Component rotates correctly around center
- [ ] **180° Rotation**: Component flips correctly
- [ ] **270° Rotation**: Component rotates correctly
- [ ] **45° Rotation**: Diagonal rotation works
- [ ] **Multiple Rotations**: Rotate same component multiple times

### Interaction Testing:
- [ ] **Click Selection**: Can select rotated components
- [ ] **Drag Movement**: Can move rotated components
- [ ] **Rotation Handle**: Can rotate using UI controls
- [ ] **Snap Behavior**: Rotated components snap correctly to walls/corners
- [ ] **Overlap Detection**: Rotated components detect collisions properly

### Edge Cases:
- [ ] Very small components (< 10cm)
- [ ] Very large components (> 200cm)
- [ ] L-shaped corner components
- [ ] Components at room boundaries
- [ ] Rapid rotation changes

### Cross-Browser Testing:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

---

## Rollback Plan

If Phase 5 breaks something critical:

1. **Immediate Rollback**:
   ```bash
   git checkout feature/elevation-simplified
   git branch -D feature/true-center-rotation
   ```

2. **Partial Rollback**:
   - Keep Phase 5 branch
   - Cherry-pick specific commits
   - Fix issues incrementally

3. **Debug Strategy**:
   - Add console logs for rotation calculations
   - Visualize rotation center with debug dots
   - Compare old vs new bounding boxes

---

## Success Criteria

- [ ] All components rotate visually around their geometric center
- [ ] Click detection works for all rotation angles
- [ ] Bounding boxes are calculated correctly
- [ ] No visual artifacts or rendering glitches
- [ ] Performance is acceptable (no lag)
- [ ] All existing tests still pass
- [ ] User can intuitively rotate and place components

---

## Notes

- **High Risk**: This change affects core rendering logic
- **Test Thoroughly**: Rotation bugs are hard to spot
- **Document Changes**: Add comments explaining rotation math
- **Consider Performance**: Rotation calculations run on every frame
- **User Experience**: Rotation should feel natural and predictable

---

## After Implementation

- [ ] Update CLAUDE.md with rotation system documentation
- [ ] Add rotation examples to test suite
- [ ] Create user documentation for rotation feature
- [ ] Consider adding rotation angle snap (15° increments)
- [ ] Merge back to main branch after thorough testing
