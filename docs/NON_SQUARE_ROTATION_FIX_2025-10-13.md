# Non-Square Cabinet Rotation & Wall Snapping Fix
**Date:** 2025-10-13
**Issue:** Non-square cabinets snap to wrong position when auto-rotated for cardinal walls
**Status:** ✅ **FIXED**

---

## Problem Statement

When placing non-square cabinets (e.g., 30cm × 60cm) on different walls, the auto-rotation logic would set the correct rotation (0°, 90°, 180°, 270°), but the snap position didn't account for the changed visual bounding box dimensions.

### Example Scenario

**Cabinet: 30cm wide × 60cm deep**

#### Placement on Front Wall (Rotation 0°)
```
┌────┐
│    │ 60cm (sticks into room)
│    │
└────┘
30cm (along wall)

Position: (x, y=0)
Correct! ✅
```

#### Placement on Right Wall (Rotation 270°)
```
┌──────────┐
│          │ 30cm (sticks into room)
└──────────┘
   60cm (along wall)

OLD LOGIC:
Position: (x=570, y) where 570 = 600 - 30 (using width)
Cabinet spans: 570 to 600 = 30cm ❌
Should span: 540 to 600 = 60cm

NEW LOGIC:
Position: (x=540, y) where 540 = 600 - 60 (using rotated depth)
Cabinet spans: 540 to 600 = 60cm ✅
```

---

## Root Cause

The wall snapping code calculated element dimensions once at the beginning based on the **current rotation**, but when the wall-snap logic **changed the rotation** to face the correct direction, it didn't recalculate the dimensions.

### Original Buggy Code Flow

```typescript
// 1. Calculate dimensions based on CURRENT rotation
let elementWidth = element.width;
let elementDepth = element.depth;

// 2. Calculate distances and snap to walls
const distToRight = roomWidth - (x + elementWidth);

// 3. If close to right wall, auto-rotate and snap
if (distToRight <= 10) {
  rotation = 270; // NEW rotation set!
  snappedX = roomWidth - elementWidth; // ❌ Uses OLD dimensions!
}
```

The bug: `elementWidth` was calculated before rotation changed, so it used the wrong dimension.

---

## The Fix

### Part 1: Rotation-Aware Visual Dimensions

Added logic to calculate the **visual bounding box dimensions** based on rotation:

```typescript
// Get base dimensions from element data model
const baseWidth = element.width;
const baseDepth = element.depth;

// Calculate rotation-aware visual bounding box dimensions
// For 90° and 270° rotations, the visual bounding box swaps width/depth
const currentRotation = ((rotation % 360) + 360) % 360;
const isRotated90or270 = (currentRotation >= 45 && currentRotation < 135) ||
                          (currentRotation >= 225 && currentRotation < 315);

let elementWidth: number;
let elementDepth: number;

if (isRotated90or270) {
  // Visual bounding box has swapped dimensions
  elementWidth = baseDepth;  // Depth becomes visual width
  elementDepth = baseWidth;  // Width becomes visual depth
} else {
  // Visual bounding box matches data dimensions
  elementWidth = baseWidth;
  elementDepth = baseDepth;
}
```

### Part 2: Recalculate After Rotation Change

When auto-rotation sets a new rotation value, recalculate the snap position using the **new rotated dimensions**:

```typescript
} else if (distToRight <= 10) {
  rotation = 270; // Face left

  // After rotating 270°, dimensions swap (for non-square cabinets)
  const rotatedWidth = isCorner ? 90 : baseDepth; // Visual width after rotation
  snappedX = roomDimensions.width - rotatedWidth; // ✅ Use new dimensions!

  guides.vertical.push(roomDimensions.width);
}
```

---

## Key Principle: Visual Bounding Box

The **visual bounding box** is the axis-aligned rectangle that contains the rotated element:

### 0° and 180° Rotations
```
Visual bounding box = data bounding box
width_visual = element.width
depth_visual = element.depth
```

### 90° and 270° Rotations
```
Visual bounding box dimensions SWAP
width_visual = element.depth  ← swapped!
depth_visual = element.width  ← swapped!
```

### Example: 30×60 Cabinet

| Rotation | Visual Width | Visual Depth | Data Width | Data Depth |
|----------|-------------|--------------|------------|------------|
| 0°       | 30cm        | 60cm         | 30cm       | 60cm       |
| 90°      | 60cm        | 30cm         | 30cm       | 60cm       |
| 180°     | 30cm        | 60cm         | 30cm       | 60cm       |
| 270°     | 60cm        | 30cm         | 30cm       | 60cm       |

**Important:** Data dimensions NEVER change, only visual dimensions change!

---

## Changes Made

**File:** [DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx)

### Change 1: Calculate Visual Dimensions (Lines 641-672)
```typescript
// Get base dimensions from element
const baseWidth = element.width;
const baseDepth = element.depth;

// Calculate rotation-aware visual bounding box dimensions
const currentRotation = ((rotation % 360) + 360) % 360;
const isRotated90or270 = (currentRotation >= 45 && currentRotation < 135) ||
                          (currentRotation >= 225 && currentRotation < 315);

if (isRotated90or270) {
  elementWidth = baseDepth;
  elementDepth = baseWidth;
} else {
  elementWidth = baseWidth;
  elementDepth = baseDepth;
}
```

### Change 2: Use Rotated Dimensions for Wall Snap (Lines 890-906)
```typescript
} else if (distToRight <= 10) {
  rotation = 270;
  const rotatedWidth = isCorner ? 90 : baseDepth; // After 270° rotation
  snappedX = roomDimensions.width - rotatedWidth;
  guides.vertical.push(roomDimensions.width);
} else if (distToBottom <= 10) {
  rotation = 180;
  const rotatedDepth = isCorner ? 90 : baseDepth; // After 180° rotation
  snappedY = roomDimensions.height - rotatedDepth;
  guides.horizontal.push(roomDimensions.height);
}
```

---

## Relationship to Previous Fixes

This fix builds on the earlier rotation cleanup:

1. **Earlier Fix:** Established that data dimensions never change during rotation
2. **This Fix:** Uses visual bounding box dimensions for collision/snapping calculations

These two principles work together:
- **Data model:** `element.x, element.y, element.width, element.depth, element.rotation`
- **Visual rendering:** Canvas/Three.js applies rotation transform visually
- **Collision/Snapping:** Uses visual bounding box for calculations

---

## Testing Scenarios

### Test Case 1: Square Cabinet (60×60)
- ✅ Should behave identically on all walls
- ✅ Position should be consistent regardless of rotation
- ✅ No visual "jumping"

### Test Case 2: Rectangular Cabinet (30×60)
- ✅ Front wall (0°): 30cm along wall, 60cm into room
- ✅ Right wall (270°): 60cm along wall, 30cm into room
- ✅ Back wall (180°): 30cm along wall, 60cm into room
- ✅ Left wall (90°): 60cm along wall, 30cm into room

### Test Case 3: Wide Cabinet (120×60)
- ✅ Should snap correctly to all walls
- ✅ Visual width changes correctly: 120cm → 60cm → 120cm → 60cm
- ✅ Edge should align perfectly with wall

---

## Visual Explanation

### Before Fix
```
30×60 Cabinet on Right Wall:

Plan View (looking down):
│ Wall
│ ╔════╗ ← Cabinet spans 570-600 (30cm) ❌
│ ║    ║    Should span 540-600 (60cm)
│ ╚════╝
└──────────→ X-axis (600cm)
```

### After Fix
```
30×60 Cabinet on Right Wall:

Plan View (looking down):
│ Wall
│ ╔══════════╗ ← Cabinet spans 540-600 (60cm) ✅
│ ║          ║    Correctly uses depth after rotation
│ ╚══════════╝
└──────────────→ X-axis (600cm)
```

---

## Related Documentation

- [ROTATION_FIX_SUMMARY_2025-10-13.md](./ROTATION_FIX_SUMMARY_2025-10-13.md) - Main rotation system cleanup
- [CONSOLE_LOG_ANALYSIS_2025-10-13.md](./CONSOLE_LOG_ANALYSIS_2025-10-13.md) - Elevation positioning

---

**Fix Completed:** 2025-10-13
**Status:** ✅ Ready for testing
**Impact:** All non-square cabinets should now snap correctly to walls with auto-rotation
