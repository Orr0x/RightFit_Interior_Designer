# Rotation System Fix - Complete Summary
**Date:** 2025-10-13
**Issue:** Base cabinets rotate from corner/edge instead of center
**Status:** ✅ **FIXED**

---

## Problem Statement

Base cabinets were rotating inconsistently:
- **2D Plan View:** Rotated from center (correct)
- **3D View:** Rotated from mid-point on edge (back wall edge) instead of center
- **User Experience:** Component appeared to "jump" position when rotating between 2D and 3D views

---

## Root Causes Identified

### 1. Conflicting Rotation Logic in 2D Canvas
**File:** [DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx)

#### Issue A: `getRotatedBoundingBox` (Lines 127-209 → Now 129-148)
**Problem:**
- Was calculating complex axis-aligned bounding boxes for rotated elements
- Excluded corner components from rotation entirely
- Made selection handles appear in wrong positions
- Assumed bounding box changes when elements rotate

**Fix:**
```typescript
// BEFORE: Complex rotation-aware bounding box (82 lines)
const getRotatedBoundingBox = (element: DesignElement) => {
  // Special case for corners (no rotation)
  // Complex math for rotated rectangles
  // Calculated axis-aligned bounding box
  ...
}

// AFTER: Simple unrotated bounding box (19 lines)
const getRotatedBoundingBox = (element: DesignElement) => {
  const width = element.width;
  const height = element.depth || element.height;

  return {
    minX: element.x,
    minY: element.y,
    maxX: element.x + width,
    maxY: element.y + height,
    centerX: element.x + width / 2,
    centerY: element.y + height / 2,
    width,
    height,
    isCorner: isAnyCornerComponent(element)
  };
}
```

#### Issue B: `isPointInRotatedComponent` (Lines 212-248 → Now 151-175)
**Problem:**
- Had special case for corner components that ignored rotation
- Corner cabinets couldn't be properly clicked when rotated

**Fix:**
```typescript
// BEFORE: Special case for corners
if (isCorner) {
  // Simple rectangle check (no rotation)
  return pointX >= element.x && pointX <= element.x + squareSize ...
} else {
  // Rotation transform for standard cabinets
  ...
}

// AFTER: Unified rotation handling for ALL elements
const isPointInRotatedComponent = (pointX: number, pointY: number, element: DesignElement) => {
  const rotation = (element.rotation || 0) * Math.PI / 180;
  const width = element.width;
  const height = element.depth || element.height;
  const centerX = element.x + width / 2;
  const centerY = element.y + height / 2;

  if (rotation === 0) {
    // Simple check for unrotated
    return pointX >= element.x && pointX <= element.x + width ...
  } else {
    // Transform point into element's rotated coordinate space
    // Works for ALL elements including corners
    ...
  }
}
```

#### Issue C: `getEffectiveDimensions` (Lines 626-641 → REMOVED)
**Problem:**
- Assumed element dimensions SWAP when rotated 90°/270°
- This is FALSE - element data dimensions never change!
- Canvas handles rotation visually with `ctx.rotate()`
- Caused snapping and collision detection to use wrong dimensions

**Fix:**
```typescript
// BEFORE: Dimension swapping based on rotation
const getEffectiveDimensions = useCallback((element) => {
  const rotation = element.rotation || 0;
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  if (normalizedRotation >= 45 && normalizedRotation < 135) {
    return { width: element.depth, depth: element.width }; // WRONG!
  }
  ...
}, []);

// AFTER: REMOVED - always use actual element dimensions
// Component-to-component snapping now uses:
const otherElDepth = otherEl.depth || otherEl.height;
```

---

### 2. Incorrect 3D Rotation Pivot Point
**File:** [DynamicComponentRenderer.tsx](../src/components/3d/DynamicComponentRenderer.tsx)

#### Issue: `positionOffset` calculation (Lines 163-185 → Now 162-173)
**Problem:**
- Standard cabinets used rotation-dependent offset to align back edge to wall
- This made cabinets rotate around their back edge (wall side)
- Corner cabinets used center offset (correct)
- Inconsistent behavior between component types

**Old Logic:**
```typescript
const positionOffset = useMemo(() => {
  if (isCornerCabinet) {
    // Corner cabinets: offset to rotation center ✅
    const legLength = element.width / 100;
    return { x: legLength / 2, z: legLength / 2 };
  }

  // Standard cabinets: offset so back edge aligns to wall ❌
  const depth = (element.depth || 60) / 100;
  const halfDepth = depth / 2;
  const rotationRad = (element.rotation * Math.PI) / 180;

  return {
    x: Math.sin(rotationRad) * halfDepth,  // Changes with rotation!
    z: -Math.cos(rotationRad) * halfDepth, // Changes with rotation!
  };
}, [isCornerCabinet, element.width, element.depth, element.rotation]);
```

**New Logic:**
```typescript
const positionOffset = useMemo(() => {
  const width = element.width / 100;
  const depth = (element.depth || (isWallCabinet ? 40 : 60)) / 100;

  // ALL components rotate around their center (matching 2D behavior)
  return {
    x: width / 2,  // Always center
    z: depth / 2,  // Always center
  };
}, [element.width, element.depth, isWallCabinet]);
```

---

## Key Principle Established

### **Element Data Dimensions NEVER Change When Rotated**

This is the fundamental principle that was being violated:

| Property | Behavior |
|----------|----------|
| `element.x` | Top-left corner X (never changes during rotation) |
| `element.y` | Top-left corner Y (never changes during rotation) |
| `element.width` | Width in X-axis (never swaps) |
| `element.depth` | Depth in Y-axis (never swaps) |
| `element.rotation` | Rotation angle in degrees |

**Visual Rotation Handled By:**
- **2D Canvas:** `ctx.translate() → ctx.rotate() → ctx.translate()` (lines 1205-1207)
- **3D Three.js:** `rotation={[0, angle, 0]}` prop on `<group>`

---

## Changes Summary

### Files Modified

1. ✅ **DesignCanvas2D.tsx**
   - Simplified `getRotatedBoundingBox` (82 lines → 19 lines)
   - Unified `isPointInRotatedComponent` (37 lines → 24 lines)
   - Removed `getEffectiveDimensions` function entirely
   - Fixed component-to-component snapping to use actual dimensions

2. ✅ **DynamicComponentRenderer.tsx**
   - Fixed `positionOffset` to always center components
   - Removed rotation-dependent offset calculation
   - Made all components behave consistently

3. ✅ **PropertiesPanel.tsx**
   - Created `rotateElementAroundCenter` function
   - Updated rotation buttons to use new function
   - Just updates `rotation` value (canvas handles the rest)

---

## Testing Checklist

### 2D Plan View
- [ ] Base cabinets rotate around their center
- [ ] Corner cabinets rotate around their center
- [ ] Wall cabinets rotate around their center
- [ ] Selection handles stay at correct corners
- [ ] Click detection works on rotated elements
- [ ] Component-to-component snapping works with rotated elements
- [ ] Wall snapping works with rotated elements

### 3D View
- [ ] Base cabinets rotate around their center
- [ ] Corner cabinets rotate around their center
- [ ] Wall cabinets rotate around their center
- [ ] Position stays consistent when switching between 2D and 3D
- [ ] No "jumping" when rotating

### Consistency
- [ ] Rotating in 2D properties panel updates 3D view correctly
- [ ] Component center point stays in same location during rotation
- [ ] Both corner and standard cabinets behave the same way

---

## Before/After Comparison

### Before Fix
```
2D View: Cabinet rotates around center ✅
3D View: Cabinet rotates around back edge ❌
Result: Position "jumps" between views
```

### After Fix
```
2D View: Cabinet rotates around center ✅
3D View: Cabinet rotates around center ✅
Result: Consistent position in both views
```

---

## Technical Details

### 2D Canvas Rotation Transform
```typescript
// From DesignCanvas2D.tsx:1205-1207
ctx.translate(pos.x + width / 2, pos.y + depth / 2);  // Move origin to center
ctx.rotate(rotation * Math.PI / 180);                 // Rotate around center
ctx.translate(-width / 2, -depth / 2);                // Move back
```

This creates a rotation around the center point while keeping `element.x, element.y` as the top-left corner.

### 3D Three.js Positioning
```typescript
// From DynamicComponentRenderer.tsx:195
<group
  position={[x + positionOffset.x, yPosition, z + positionOffset.z]}
  rotation={[0, element.rotation * Math.PI / 180, 0]}
>
```

Where:
- `x = (element.x / 100) - roomWidth/2` (world coordinate)
- `z = (element.y / 100) - roomHeight/2` (world coordinate, Y→Z axis swap)
- `positionOffset.x = width / 2` (shift to center)
- `positionOffset.z = depth / 2` (shift to center)

---

## Related Documentation

- [Console Log Analysis](./CONSOLE_LOG_ANALYSIS_2025-10-13.md) - Elevation view positioning verification
- [HANDOVER-2025-01-13.md](./HANDOVER-2025-01-13.md) - Session handover with bug reports

---

**Fix Completed:** 2025-10-13
**Verified:** Pending user testing
**Status:** ✅ Ready for testing
