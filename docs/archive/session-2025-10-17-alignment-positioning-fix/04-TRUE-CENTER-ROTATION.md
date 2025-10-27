# True Center Rotation Fix
**Date:** 2025-10-17
**Status:** 📋 DESIGN COMPLETE
**Priority:** 🔴 CRITICAL - Core functionality broken

---

## 🎯 Problem Statement

**Current Behavior:**
Components rotate around their **top-left corner** instead of their **geometric center**.

**Result:**
- Bounding boxes misalign after rotation
- Rotation handles appear in wrong positions
- Component appears to "jump" during rotation
- Selection box doesn't match rotated component

**Root Cause:**
Canvas `rotate()` rotates around (0, 0), and we translate to component's top-left corner before rotating.

---

## 📐 Understanding Canvas Rotation

### Current Implementation (WRONG)

```typescript
// Line ~1285 in DesignCanvas2D.tsx
ctx.save();
ctx.translate(canvasPos.x, canvasPos.y); // Move to TOP-LEFT corner
ctx.rotate(element.rotation * Math.PI / 180);
ctx.fillRect(0, 0, width, height); // Draw from (0,0)
ctx.restore();
```

**What Happens:**
```
Before rotation:           After 90° rotation:
┌─────┐                    │
│     │                    │
│  C  │                    ├─────┐
│     │                    │     │
└─────┘                    C     │
^                          │     │
Top-left corner            └─────┘
(rotation pivot)           ^
                           Top-left (moved!)
```

Component "swings" around top-left corner!

---

### Correct Implementation

```typescript
ctx.save();
// Move to component's TRUE CENTER
ctx.translate(canvasPos.x + width/2, canvasPos.y + height/2);
ctx.rotate(element.rotation * Math.PI / 180);
// Draw centered on (0,0)
ctx.fillRect(-width/2, -height/2, width, height);
ctx.restore();
```

**What Happens:**
```
Before rotation:           After 90° rotation:
┌─────┐                    ┌─────┐
│     │                    │     │
│  C  │        →           │  C  │
│     │                    │     │
└─────┘                    └─────┘
   ^                          ^
 Center                     Center
(rotation pivot)         (stays in place!)
```

Component rotates in place around its center!

---

## 🔍 Issues Caused by Wrong Rotation Center

### Issue #1: Bounding Box Misalignment

**Current Calculation:**
```typescript
// Assumes top-left at (x, y)
const bounds = {
  minX: element.x,
  maxX: element.x + element.width,
  minY: element.y,
  maxY: element.y + element.depth
};
```

**Problem:** After rotation, top-left corner moves!

**Example:**
```
Component: 60cm × 40cm at (100, 100)
Rotation: 90°

Current bounds:
  minX = 100, maxX = 160  ← WRONG! These don't match rotated component
  minY = 100, maxY = 140

Actual rotated bounds:
  Should be recalculated based on all 4 corners after rotation
```

---

### Issue #2: Rotation Handles Wrong Position

**Current Calculation:**
```typescript
// Places handles at corners of non-rotated bounds
const handles = [
  { x: bounds.minX, y: bounds.minY }, // Top-left
  { x: bounds.maxX, y: bounds.minY }, // Top-right
  { x: bounds.maxX, y: bounds.maxY }, // Bottom-right
  { x: bounds.minX, y: bounds.maxY }  // Bottom-left
];
```

**Problem:** These are not the corners of the ROTATED component!

---

### Issue #3: Mouse Hit Detection Wrong

**Current Check:**
```typescript
// Checks if mouse is within non-rotated bounds
if (mouseX >= element.x && mouseX <= element.x + element.width &&
    mouseY >= element.y && mouseY <= element.y + element.depth) {
  // Component clicked
}
```

**Problem:** Doesn't account for rotation! Click detection wrong for rotated components.

---

## ✅ Complete Solution

### Part 1: Fix Rendering Rotation Center

**File:** `DesignCanvas2D.tsx` (render loop, ~line 1285)

**Replace:**
```typescript
// OLD (WRONG)
ctx.save();
ctx.translate(canvasPos.x, canvasPos.y);
ctx.rotate(element.rotation * Math.PI / 180);
ctx.fillRect(0, 0, width, height);
ctx.restore();
```

**With:**
```typescript
// NEW (CORRECT)
ctx.save();
// Calculate component center in canvas coordinates
const centerX = canvasPos.x + (width * zoom) / 2;
const centerY = canvasPos.y + (depth * zoom) / 2;

// Translate to center
ctx.translate(centerX, centerY);

// Rotate around center
ctx.rotate(element.rotation * Math.PI / 180);

// Draw component centered on (0, 0)
const halfWidth = (width * zoom) / 2;
const halfDepth = (depth * zoom) / 2;
ctx.fillRect(-halfWidth, -halfDepth, width * zoom, depth * zoom);

ctx.restore();
```

---

### Part 2: Calculate Rotated Bounding Box

**Create New Utility Function:**

```typescript
// File: src/utils/RotationUtils.ts

/**
 * Calculate bounding box for rotated rectangle
 * @param x Center X position (room cm)
 * @param y Center Y position (room cm)
 * @param width Component width (room cm)
 * @param depth Component depth (room cm)
 * @param rotation Rotation angle (degrees)
 * @returns Axis-aligned bounding box
 */
export function getRotatedBounds(
  x: number,
  y: number,
  width: number,
  depth: number,
  rotation: number
): { minX: number; maxX: number; minY: number; maxY: number } {
  // Convert rotation to radians
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Calculate 4 corners of rotated rectangle
  // (relative to center, then offset by position)
  const halfW = width / 2;
  const halfD = depth / 2;

  const corners = [
    // Top-left corner
    {
      x: x + (-halfW * cos - -halfD * sin),
      y: y + (-halfW * sin + -halfD * cos)
    },
    // Top-right corner
    {
      x: x + (halfW * cos - -halfD * sin),
      y: y + (halfW * sin + -halfD * cos)
    },
    // Bottom-right corner
    {
      x: x + (halfW * cos - halfD * sin),
      y: y + (halfW * sin + halfD * cos)
    },
    // Bottom-left corner
    {
      x: x + (-halfW * cos - halfD * sin),
      y: y + (-halfW * sin + halfD * cos)
    }
  ];

  // Find axis-aligned bounding box
  const xs = corners.map(c => c.x);
  const ys = corners.map(c => c.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

/**
 * Get rotated corners for precise rendering
 */
export function getRotatedCorners(
  x: number,
  y: number,
  width: number,
  depth: number,
  rotation: number
): Array<{ x: number; y: number }> {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const halfW = width / 2;
  const halfD = depth / 2;

  return [
    { x: x + (-halfW * cos - -halfD * sin), y: y + (-halfW * sin + -halfD * cos) },
    { x: x + (halfW * cos - -halfD * sin), y: y + (halfW * sin + -halfD * cos) },
    { x: x + (halfW * cos - halfD * sin), y: y + (halfW * sin + halfD * cos) },
    { x: x + (-halfW * cos - halfD * sin), y: y + (-halfW * sin + halfD * cos) }
  ];
}
```

---

### Part 3: Update Element Position Storage

**CRITICAL DECISION:** Should we store top-left or center?

**Option A: Store Center (RECOMMENDED)**
```typescript
// element.x, element.y = CENTER of component
// Rotation happens around this point naturally
```

**Pros:**
- ✅ Rotation calculations simple
- ✅ Position stable during rotation
- ✅ Matches rotation behavior

**Cons:**
- ❌ Need to migrate existing data
- ❌ Need to convert when rendering

**Option B: Store Top-Left (Current)**
```typescript
// element.x, element.y = TOP-LEFT of component
// Calculate center when needed
```

**Pros:**
- ✅ No data migration needed
- ✅ Simpler for non-rotated components

**Cons:**
- ❌ More complex rotation calculations
- ❌ Position changes during rotation

**RECOMMENDATION:** Keep storing top-left (Option B) to avoid migration, but ALWAYS calculate center for rotation.

---

### Part 4: Update Mouse Hit Detection

**File:** `DesignCanvas2D.tsx` (handleMouseDown)

**Replace Simple Rect Check:**
```typescript
// OLD (only works for non-rotated)
if (mouseX >= element.x && mouseX <= element.x + element.width &&
    mouseY >= element.y && mouseY <= element.y + element.depth) {
  // Hit
}
```

**With Rotated Point-in-Polygon:**
```typescript
import { isPointInRotatedRect } from '@/utils/RotationUtils';

// NEW (works for rotated components)
const centerX = element.x + element.width / 2;
const centerY = element.y + element.depth / 2;

if (isPointInRotatedRect(
  mouseX, mouseY,
  centerX, centerY,
  element.width, element.depth,
  element.rotation
)) {
  // Hit!
}
```

**Utility Function:**
```typescript
// File: src/utils/RotationUtils.ts

/**
 * Check if point is inside rotated rectangle
 * Uses inverse rotation to transform point into rectangle's local space
 */
export function isPointInRotatedRect(
  px: number, py: number, // Point to test
  cx: number, cy: number, // Rectangle center
  width: number, depth: number, // Rectangle size
  rotation: number // Rotation angle (degrees)
): boolean {
  // Transform point into rectangle's local coordinate system
  const rad = (-rotation * Math.PI) / 180; // Inverse rotation
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Translate point relative to center
  const dx = px - cx;
  const dy = py - cy;

  // Rotate point by inverse rotation
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  // Check if point is within rectangle bounds (centered at origin)
  const halfW = width / 2;
  const halfD = depth / 2;

  return localX >= -halfW && localX <= halfW &&
         localY >= -halfD && localY <= halfD;
}
```

---

### Part 5: Update Rotation Handles

**File:** `DesignCanvas2D.tsx` (drawRotationHandles)

**Use Rotated Corners:**
```typescript
function drawRotationHandles(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  zoom: number
) {
  // Get rotated corners
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.depth / 2;

  const corners = getRotatedCorners(
    centerX, centerY,
    element.width, element.depth,
    element.rotation
  );

  // Transform to canvas coordinates
  const canvasCorners = corners.map(c => roomToCanvas(c.x, c.y));

  // Draw handles at actual corners
  canvasCorners.forEach(corner => {
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(corner.x - 4, corner.y - 4, 8, 8);
  });

  // Draw center handle (rotation pivot)
  const canvasCenter = roomToCanvas(centerX, centerY);
  ctx.fillStyle = '#FF6B6B';
  ctx.beginPath();
  ctx.arc(canvasCenter.x, canvasCenter.y, 6, 0, Math.PI * 2);
  ctx.fill();
}
```

---

## 📊 Implementation Checklist

### Phase 1: Rendering Fix
- [ ] Update component rendering to rotate around center
- [ ] Test rotation at 0°, 90°, 180°, 270°
- [ ] Test rotation at arbitrary angles (45°, 135°, etc.)
- [ ] Verify components don't jump during rotation
- [ ] Test with different zoom levels

### Phase 2: Bounding Box Calculation
- [ ] Create RotationUtils.ts file
- [ ] Implement getRotatedBounds()
- [ ] Implement getRotatedCorners()
- [ ] Unit test all rotation calculations
- [ ] Update bounding box usage throughout codebase

### Phase 3: Mouse Hit Detection
- [ ] Implement isPointInRotatedRect()
- [ ] Update handleMouseDown
- [ ] Test selection of rotated components
- [ ] Test hover detection
- [ ] Test drag start detection

### Phase 4: Rotation Handles
- [ ] Update handle positioning logic
- [ ] Draw handles at rotated corners
- [ ] Add center rotation pivot indicator
- [ ] Test handle interaction
- [ ] Visual feedback for rotation

### Phase 5: Selection Box
- [ ] Draw selection box using rotated corners
- [ ] Or: Draw axis-aligned box around rotated bounds
- [ ] Choose visual style (rotated vs AA box)
- [ ] Implement and test

---

## 🎨 Visual Design Decisions

### Decision 1: Selection Box Style

**Option A: Rotated Selection Box**
```
  ╱────╲
 ╱      ╲  ← Box rotates with component
╱  60×40  ╲
╲        ╱
 ╲──────╱
```

**Pros:** Shows exact component bounds
**Cons:** More complex to draw

**Option B: Axis-Aligned Bounding Box**
```
┌──────────┐
│  ╱────╲  │ ← Box stays horizontal
│ ╱      ╲ │
│╱  60×40 ╲│
│╲        ╱│
│ ╲──────╱ │
└──────────┘
```

**Pros:** Simpler to draw and understand
**Cons:** Larger box for rotated components

**RECOMMENDATION:** Use Option A (rotated box) for precise visual feedback

---

### Decision 2: Rotation Handle Style

**Option A: Corner Handles Only**
```
●────────●
│        │
│   C    │ ← C = center pivot (visual only)
│        │
●────────●
```

**Option B: Corner + Edge Handles**
```
●────●────●
│         │
●    C    ● ← C = rotation pivot
│         │
●────●────●
```

**Option C: Center Handle Only**
```
┌────────┐
│        │
│   ●    │ ← Drag to rotate
│        │
└────────┘
```

**RECOMMENDATION:** Option A - Corner handles for resize, center indicator for rotation pivot

---

## 🧪 Test Cases

### Rotation Tests
```typescript
describe('True Center Rotation', () => {
  test('Component rotates around center', () => {
    const element = { x: 100, y: 100, width: 60, depth: 40, rotation: 0 };
    const centerBefore = { x: 130, y: 120 }; // 100+30, 100+20

    rotateElement(element, 90);

    const centerAfter = { x: 130, y: 120 };
    expect(centerAfter).toEqual(centerBefore); // Center unchanged!
  });

  test('Bounding box expands for 45° rotation', () => {
    const element = { x: 100, y: 100, width: 60, depth: 40, rotation: 0 };

    const bounds0 = getRotatedBounds(130, 120, 60, 40, 0);
    expect(bounds0.maxX - bounds0.minX).toBe(60); // Width = 60

    const bounds45 = getRotatedBounds(130, 120, 60, 40, 45);
    expect(bounds45.maxX - bounds45.minX).toBeCloseTo(70.71); // √(60²+40²)/√2 ≈ 70.71
  });

  test('Mouse hit detection works for rotated rect', () => {
    // 60×40 rect centered at (100, 100), rotated 45°
    expect(isPointInRotatedRect(100, 100, 100, 100, 60, 40, 45)).toBe(true); // Center hit
    expect(isPointInRotatedRect(150, 150, 100, 100, 60, 40, 45)).toBe(false); // Outside
  });
});
```

---

## ⚠️ Breaking Changes

### None (If Done Correctly)

**Why No Breaking Changes:**
- We're NOT changing how positions are stored (still top-left)
- We're only changing rendering and calculation
- Existing data works without migration
- All changes are internal to rendering logic

### Migration Not Required

**BUT: If we wanted to optimize further...**

We COULD migrate to center-based storage in future:
```sql
-- Future optimization (not required now)
UPDATE design_elements
SET
  x = x + (width / 2),
  y = y + (depth / 2),
  position_mode = 'center'
WHERE position_mode IS NULL OR position_mode = 'top_left';
```

**Recommendation:** Don't do this now. Keep top-left storage, calculate center as needed.

---

## 🎯 Success Criteria

### Must-Have
- ✅ Components rotate around geometric center
- ✅ Position stable during rotation
- ✅ Bounding boxes accurate for rotated components
- ✅ Mouse hit detection works for rotated components
- ✅ No position jumping during rotation

### Should-Have
- ✅ Rotation handles at correct positions
- ✅ Selection box matches rotated component
- ✅ Visual rotation pivot indicator
- ✅ Works at all zoom levels

### Nice-to-Have
- ✅ Smooth rotation animation
- ✅ Snap to 15° increments (configurable)
- ✅ Show rotation angle during drag
- ✅ Preview rotation before applying

---

**Document Status:** ✅ COMPLETE
**Next Document:** `05-BOUNDING-BOX-FIX.md`
**Estimated Time:** 6-8 hours
**Complexity:** MEDIUM-HIGH
**Priority:** CRITICAL
