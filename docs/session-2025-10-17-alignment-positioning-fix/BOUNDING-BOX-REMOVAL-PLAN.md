# Bounding Box Removal Plan

**Date:** 2025-10-17
**User Observation:** "rotation seems compundes it sort of rotating from midle and a corner looks like its orbating the center not rotating at center"
**Status:** 🔴 PROBLEM CONFIRMED - Bounding box fighting with anchor point fix
**Priority:** HIGH - Causing incorrect rotation behavior

---

## 🔍 Problem Analysis

### User's Observation

> "corners work ok. i still think its the bounding box causing problems, the rotation seems compundes it sort of rotating from midle and a corner looks like its orbating the center not rotating at center."

**Translation:** Components appear to "orbit" around their center when rotating, rather than rotating in place.

### Root Cause

The bounding box calculation **assumes CENTER-based positioning**, but we just changed 3D to use TOP-LEFT positioning!

**Evidence from DesignCanvas2D.tsx:**

**Line 1252 - 2D Rendering (CORRECT):**
```typescript
// Apply rotation - convert degrees to radians if needed
ctx.translate(pos.x + width / 2, pos.y + depth / 2);  // Move TO center
ctx.rotate(rotation * Math.PI / 180);
ctx.translate(-width / 2, -depth / 2);  // Move BACK to top-left
```

**Lines 140, 159 - Bounding Box (WRONG ASSUMPTION):**
```typescript
const centerX = element.x + width / 2;   // ← Assumes element.x is TOP-LEFT
const centerY = element.y + height / 2;  // ← This is CORRECT

// But then uses this center for rotation calculations:
const rotatedCorners = corners.map(corner => ({
  x: centerX + corner.x * cos - corner.y * sin,  // ← Rotates around calculated center
  y: centerY + corner.x * sin + corner.y * cos
}));
```

**The Conflict:**
- 2D rendering: Correctly rotates around center then renders from top-left
- Bounding box: Calculates rotation assuming element.x IS top-left, but then tries to compensate for rotation
- 3D: Now uses top-left (our fix), but bounding box still thinks it's center!

---

## 🎯 Why This Matters

### Current Behavior (BROKEN)

When user rotates a 60×60cm component at (100, 50) by 90°:

**2D Rendering (Works):**
```typescript
1. Start at top-left (100, 50)
2. Translate to center (130, 80)  // +30, +30
3. Rotate 90°
4. Translate back (-30, -30)
5. Render at rotated top-left position
```

**Bounding Box (BROKEN):**
```typescript
1. Calculate center as (130, 80)  // element.x + width/2
2. Rotate corners around (130, 80)
3. Find min/max of rotated corners
4. Selection handles drawn at rotated bounding box corners
```

**Result:** Selection handles appear in WRONG positions, creating visual "orbit" effect!

---

## 📋 Safe Removal Plan

### Step 1: Audit All Uses of getRotatedBoundingBox()

**Current uses found:**
1. `drawSelectionHandles()` - Line 1342
2. That's it! Only ONE use!

**Good News:** Only one place to fix!

### Step 2: Replace with Simple Bounding Box

Since rotation is handled by canvas transforms, we don't need complex rotated bounding box math!

**OLD (Complex, 95 lines):**
```typescript
const getRotatedBoundingBox = (element: DesignElement) => {
  // 95 lines of complex rotation math
  // Calculates rotated corners
  // Finds min/max to get axis-aligned bounding box
  // Returns expanded box that contains rotated component
};
```

**NEW (Simple, ~15 lines):**
```typescript
const getComponentBounds = (element: DesignElement) => {
  const width = element.width;
  const height = element.depth || element.height;

  // Simple TOP-LEFT based bounds
  return {
    minX: element.x,
    minY: element.y,
    maxX: element.x + width,
    maxY: element.y + height,
    centerX: element.x + width / 2,
    centerY: element.y + height / 2,
    width,
    height
  };
};
```

**Why This Works:**
- Selection handles should show the component's "footprint" (unrotated bounds)
- Canvas rotation handles the visual rotation
- User clicks on visual appearance (canvas handles that via `isPointInPath` or similar)

### Step 3: Update Selection Handle Drawing

**Current (Uses rotated bounds):**
```typescript
const drawSelectionHandles = (ctx: CanvasRenderingContext2D, element: DesignElement) => {
  const bbox = getRotatedBoundingBox(element);  // ← REMOVE THIS
  const canvasMin = roomToCanvas(bbox.minX, bbox.minY);
  const canvasMax = roomToCanvas(bbox.maxX, bbox.maxY);

  // Draw 4 handles at rotated bounding box corners
};
```

**NEW (Uses simple bounds, respects rotation):**
```typescript
const drawSelectionHandles = (ctx: CanvasRenderingContext2D, element: DesignElement) => {
  const width = element.width * zoom;
  const height = (element.depth || element.height) * zoom;
  const rotation = (element.rotation || 0) * Math.PI / 180;

  ctx.save();

  // Get position and apply same transform as rendering
  const pos = roomToCanvas(element.x, element.y);
  ctx.translate(pos.x + width / 2, pos.y + height / 2);
  ctx.rotate(rotation);

  // Draw handles at corners of UN-rotated rectangle
  const handleSize = 8;
  ctx.fillStyle = '#ff6b6b';

  const corners = [
    { x: -width / 2, y: -height / 2 },      // Top-left
    { x: width / 2, y: -height / 2 },       // Top-right
    { x: -width / 2, y: height / 2 },       // Bottom-left
    { x: width / 2, y: height / 2 }         // Bottom-right
  ];

  corners.forEach(corner => {
    ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
  });

  ctx.restore();
};
```

**Why This is Better:**
- Uses SAME rotation transform as rendering
- Handles appear at ACTUAL component corners
- No complex math to get out of sync
- Visual appearance matches reality!

---

## 🚨 Potential Issues & Solutions

### Issue 1: Hit Detection

**Current hit detection (Lines 2148-2153):**
```typescript
// Standard rectangular hit detection
return roomPos.x >= element.x && roomPos.x <= element.x + element.width &&
       roomPos.y >= element.y && roomPos.y <= element.y + (element.depth || element.height);
```

**Problem:** Doesn't account for rotation! Works for 0° but fails for 45°/90° etc.

**Solution A: Canvas isPointInPath (RECOMMENDED):**
```typescript
const isClickOnComponent = (ctx: CanvasRenderingContext2D, element: DesignElement, clickX: number, clickY: number): boolean => {
  const width = element.width * zoom;
  const height = (element.depth || element.height) * zoom;
  const rotation = (element.rotation || 0) * Math.PI / 180;

  const pos = roomToCanvas(element.x, element.y);

  ctx.save();
  ctx.beginPath();
  ctx.translate(pos.x + width / 2, pos.y + height / 2);
  ctx.rotate(rotation);
  ctx.rect(-width / 2, -height / 2, width, height);

  const hit = ctx.isPointInPath(clickX, clickY);
  ctx.restore();

  return hit;
};
```

**Solution B: Manual Transform (Fallback):**
```typescript
const isClickOnComponent = (element: DesignElement, clickX: number, clickY: number): boolean => {
  const width = element.width;
  const height = element.depth || element.height;
  const rotation = (element.rotation || 0) * Math.PI / 180;

  // Transform click point into component's local space
  const centerX = element.x + width / 2;
  const centerY = element.y + height / 2;

  // Translate click to component center
  const dx = clickX - centerX;
  const dy = clickY - centerY;

  // Rotate backwards (inverse rotation)
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  // Check if in un-rotated bounds
  return Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2;
};
```

### Issue 2: isPointInRotatedComponent Function

**Current (Line 215):**
```typescript
const isPointInRotatedComponent = (pointX: number, pointY: number, element: DesignElement) => {
  // Uses same complex logic as getRotatedBoundingBox
};
```

**Action:** Replace with Solution A or B above (same logic)

---

## 📝 Implementation Checklist

### Phase 1: Prepare Replacement Functions

- [ ] Create `getComponentBounds()` - simple TOP-LEFT based bounds
- [ ] Create new `drawSelectionHandles()` - rotation-aware
- [ ] Create `isClickOnComponent()` - rotation-aware hit detection

### Phase 2: Update All Call Sites

- [ ] Update `drawSelectionHandles()` call (Line 1342)
- [ ] Update hit detection in `handleCanvasClick()` (Lines 2148-2153)
- [ ] Update hit detection in `handleMouseMove()` if needed
- [ ] Search for any other uses of `isPointInRotatedComponent()`

### Phase 3: Remove Old Code

- [ ] Delete `getRotatedBoundingBox()` function (Lines 121-212)
- [ ] Delete old `isPointInRotatedComponent()` function (Line 215+)
- [ ] Remove unused variables/imports

### Phase 4: Testing

- [ ] Test selection handles on unrotated components
- [ ] Test selection handles on 90° rotated components
- [ ] Test selection handles on 45° rotated components
- [ ] Test click detection on rotated components
- [ ] Test hover detection on rotated components
- [ ] Test corner components (should still work)

---

## 🎯 Expected Results

**Before (Current - BROKEN):**
```
Component at (100, 50) rotated 90°:
- Renders correctly (canvas transform)
- Selection handles appear in WRONG positions
- Clicking "near" component selects it (oversized hit box)
- Visual "orbit" effect when rotating
```

**After (Fixed):**
```
Component at (100, 50) rotated 90°:
- Renders correctly (unchanged)
- Selection handles at ACTUAL component corners
- Clicking only selects if actually ON component
- Clean rotation around component center
```

---

## ⚠️ Risks & Mitigation

### Risk 1: Breaking Hit Detection

**Likelihood:** Medium
**Impact:** High - User can't select components

**Mitigation:**
- Test thoroughly before committing
- Use canvas `isPointInPath()` (battle-tested API)
- Fallback to manual transform if needed

### Risk 2: Performance

**Likelihood:** Low
**Impact:** Low

**Mitigation:**
- New code is SIMPLER (less math)
- Canvas `isPointInPath()` is native and fast
- Can cache rotation matrices if needed

### Risk 3: Corner Components

**Likelihood:** Low
**Impact:** Medium

**Mitigation:**
- Corner components don't rotate (or rotate in fixed increments)
- Simple bounds should work fine
- Test specifically with corner components

---

## 🚀 Alternative: Keep but Fix Bounding Box

If full removal is too risky, we can FIX the bounding box instead:

**Option B: Fix Center Calculation**
```typescript
const getRotatedBoundingBox = (element: DesignElement) => {
  const width = element.width;
  const height = element.depth || element.height;

  // NEW: Center is calculated from TOP-LEFT position
  const centerX = element.x + width / 2;  // ✅ CORRECT (unchanged)
  const centerY = element.y + height / 2;  // ✅ CORRECT (unchanged)

  // Rest of rotation logic stays the same
  // ...
};
```

**Wait...** This is already correct! The issue isn't the calculation, it's that we're using a rotated bounding box at all!

**The REAL issue:** Selection handles drawn at rotated bounding box min/max don't match where the component actually is after canvas rotation!

---

## 💡 Recommendation

**Remove the bounding box system entirely** for these reasons:

1. ✅ **Only one use** - just selection handles
2. ✅ **Canvas rotation handles it** - no need for manual rotation math
3. ✅ **Simpler code** - remove 95 lines of complex math
4. ✅ **Fewer bugs** - one source of truth (canvas transforms)
5. ✅ **Better UX** - handles appear where component actually is

**Implementation:** Use Option "Step 3" above - draw handles with same transform as rendering.

---

**Document Status:** ✅ ANALYSIS COMPLETE
**Recommendation:** REMOVE bounding box, use canvas transforms
**Estimated Time:** 1-2 hours
**Risk Level:** Low-Medium (thorough testing required)
**Ready to Implement:** YES
