# Complete Component Placement Flow Analysis
**Date:** 2025-10-17
**Status:** 📋 ANALYSIS COMPLETE
**Critical Issues:** 8 major transformation/alignment problems identified

---

## 🎯 Executive Summary

This document traces the **complete end-to-end flow** from component selection to final rendering, identifying every coordinate transformation, scaling operation, and positioning calculation.

### Key Findings:
1. **5 Coordinate System Transitions** - Each with potential for error
2. **3 Scale Factors Applied** - 1.15x drag preview, canvas zoom, CSS scaling
3. **2 Snapping Systems** - `getEnhancedComponentPlacement()` + `getSnapPosition()` (duplicate logic!)
4. **Hardcoded "Magic Numbers"** - 1.15x scale, 60cm corner threshold, 40cm snap threshold
5. **Missing Drag Image Offset** - Center point calculation doesn't account for rotation
6. **Wall Rendering Interference** - 10cm thick rectangles overlap component boundaries

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Component Source (Database)                                 │
│ Location: Supabase `kitchen_components` table                       │
│ Coordinates: CENTIMETERS (cm)                                       │
│ Format: { width: 60, depth: 58, height: 82 }                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ useOptimizedComponents hook
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Component Sidebar                                           │
│ File: CompactComponentSidebar.tsx                                   │
│ Coordinates: Still CENTIMETERS                                      │
│ Action: User starts drag                                            │
│                                                                      │
│ ⚠️ TRANSFORMATION #1: Drag Preview Creation                         │
│    Line 277: const scaleFactor = 1.15                               │
│    Line 297: const previewWidth = component.width * scaleFactor     │
│    Line 298: const previewDepth = component.depth * scaleFactor     │
│                                                                      │
│    WHY 1.15x? Comment: "better match canvas components"             │
│    PROBLEM: This is a HACK - should match actual canvas scale!      │
│                                                                      │
│ Output: Drag preview at 1.15x component size                        │
│         Dimensions in PIXELS (cm → px via 1.15x scale)              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ User drags across screen
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Drag Image Positioning                                      │
│ File: CompactComponentSidebar.tsx:349-350                           │
│ Coordinates: PIXELS (drag preview)                                  │
│                                                                      │
│ ⚠️ TRANSFORMATION #2: Drag Image Center Point                       │
│    Line 349: const centerX = isCornerComponent ? ...                │
│    Line 350: e.dataTransfer.setDragImage(dragPreview, centerX...)   │
│                                                                      │
│    CALCULATION:                                                      │
│    - Corner: Math.min(width, depth) * 1.15 / 2                      │
│    - Regular: previewWidth / 2                                      │
│                                                                      │
│    PROBLEM: Doesn't account for rotation!                           │
│    PROBLEM: Uses 1.15x scaled dimensions, not actual canvas size!   │
│                                                                      │
│ Output: Drag image follows cursor with offset from center           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ User drops on canvas
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: Drop Event Handler                                          │
│ File: DesignCanvas2D.tsx:2648 (handleDrop)                          │
│ Coordinates: CANVAS PIXELS → ROOM CENTIMETERS                       │
│                                                                      │
│ ⚠️ TRANSFORMATION #3: Browser → Canvas Coordinates                  │
│    Line 2660: const rect = canvas.getBoundingClientRect()           │
│    Line 2662-2663: Scale factors for CSS-scaled canvas              │
│         const scaleX = CANVAS_WIDTH / rect.width                    │
│         const scaleY = CANVAS_HEIGHT / rect.height                  │
│    Line 2665-2666: Mouse position → Canvas coordinates              │
│         const x = (e.clientX - rect.left) * scaleX                  │
│         const y = (e.clientY - rect.top) * scaleY                   │
│                                                                      │
│    PROBLEM: This accounts for CSS scaling but not zoom!             │
│                                                                      │
│ ⚠️ TRANSFORMATION #4: Canvas Pixels → Room Centimeters              │
│    Line 2667: const roomPos = canvasToRoom(x, y)                    │
│                                                                      │
│    FUNCTION: canvasToRoom() defined earlier in file                 │
│    CALCULATION:                                                      │
│      - Accounts for pan (offset)                                    │
│      - Accounts for zoom                                            │
│      - Converts canvas pixels to room cm                            │
│                                                                      │
│    PROBLEM: Now in room coordinates, but position may not match     │
│              where user saw the drag preview!                       │
│                                                                      │
│ Output: dropX, dropY in ROOM CENTIMETERS                            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ Position calculated, now apply placement logic
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: Enhanced Component Placement                                │
│ File: canvasCoordinateIntegration.ts                                │
│ Function: getEnhancedComponentPlacement()                           │
│ Coordinates: ROOM CENTIMETERS                                       │
│                                                                      │
│ Input:                                                               │
│   - dropX, dropY (room cm)                                          │
│   - componentWidth, componentDepth (cm)                             │
│   - componentId, componentType                                      │
│   - roomDimensions                                                  │
│                                                                      │
│ ⚠️ TRANSFORMATION #5: Position Adjustment & Snapping                │
│                                                                      │
│ STEP 5A: Boundary Calculation                                       │
│    Line 70: const wallClearance = 5 // HARDCODED!                   │
│    Line 74-77: Calculate placement bounds                           │
│         minX = wallClearance                                        │
│         maxX = roomWidth - componentWidth - wallClearance           │
│         minY = wallClearance                                        │
│         maxY = roomHeight - componentDepth - wallClearance          │
│                                                                      │
│ STEP 5B: Corner Detection (if applicable)                           │
│    Line 131: const cornerThreshold = 60 // HARDCODED!               │
│    Line 146-171: Four corner zones with rotation                    │
│         top-left: 0°                                                │
│         top-right: -270°                                            │
│         bottom-right: -180°                                         │
│         bottom-left: -90°                                           │
│                                                                      │
│    PROBLEM: Hardcoded threshold and rotations!                      │
│    PROBLEM: Rotations are negative (clockwise) - inconsistent?      │
│                                                                      │
│ STEP 5C: Wall Snapping                                              │
│    Line 211: const snapThreshold = 40 // HARDCODED!                 │
│    Line 226-268: Calculate distance to each wall                    │
│    Snap to closest wall if within threshold                         │
│    Set rotation based on which wall (0°, 180°, etc.)                │
│                                                                      │
│    PROBLEM: Hardcoded threshold!                                    │
│    PROBLEM: Rotation logic duplicated from corner detection!        │
│                                                                      │
│ STEP 5D: Bounds Clamping                                            │
│    Line 98-99: Clamp position to placement bounds                   │
│         finalX = Math.max(minX, Math.min(maxX, position.x))         │
│         finalY = Math.max(minY, Math.min(maxY, position.y))         │
│                                                                      │
│    PROBLEM: May shift component from drop position!                 │
│                                                                      │
│ Output: ComponentPlacementResult                                    │
│   {                                                                  │
│     x: number,          // Final X position (cm)                    │
│     y: number,          // Final Y position (cm)                    │
│     rotation: number,   // Rotation angle (degrees)                 │
│     snappedToWall: boolean,                                         │
│     corner: string | null,                                          │
│     withinBounds: boolean                                           │
│   }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ Enhanced placement complete
                              ↓ BUT WAIT! There's MORE snapping...
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 6: DUPLICATE Snapping System                                   │
│ File: DesignCanvas2D.tsx:2746-2749                                  │
│ Function: getSnapPosition()                                         │
│ Coordinates: ROOM CENTIMETERS                                       │
│                                                                      │
│ ⚠️ TRANSFORMATION #6: SECOND Round of Snapping (!!)                 │
│    Line 2746: const snapped = getSnapPosition(newElement, x, y)     │
│    Line 2747-2749: Apply snapping AGAIN                             │
│         newElement.x = snapped.x                                    │
│         newElement.y = snapped.y                                    │
│         newElement.rotation = snapped.rotation                      │
│                                                                      │
│    PROBLEM: WHY ARE WE SNAPPING TWICE?!                             │
│    PROBLEM: May override enhanced placement results!                │
│    PROBLEM: Two different snap threshold sources?                   │
│                                                                      │
│ Output: Final position (potentially different from Step 5!)         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ Position finalized, create element
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 7: Design Element Creation                                     │
│ File: DesignCanvas2D.tsx:2727-2743                                  │
│ Coordinates: ROOM CENTIMETERS (final)                               │
│                                                                      │
│ Element Structure:                                                   │
│   {                                                                  │
│     id: string,                                                      │
│     component_id: string,  // Database lookup key                   │
│     type: string,                                                    │
│     x: number,             // Room CM (after double-snapping)       │
│     y: number,             // Room CM (after double-snapping)       │
│     z: number,             // Default Z based on component type     │
│     width: number,         // Component width (cm)                  │
│     depth: number,         // Component depth (cm)                  │
│     height: number,        // Component height (cm)                 │
│     rotation: number,      // Final rotation (after double-snap)    │
│     color: string,                                                   │
│     zIndex: number,                                                  │
│     isVisible: boolean                                               │
│   }                                                                  │
│                                                                      │
│ Action: onAddElement(newElement) - Adds to design state             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ Element added to state, trigger render
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 8: Canvas Rendering                                            │
│ File: DesignCanvas2D.tsx (render function)                          │
│ Coordinates: CANVAS PIXELS                                          │
│                                                                      │
│ RENDER SEQUENCE:                                                     │
│                                                                      │
│ 8A. Draw Room Background                                            │
│     - Inner room floor (white)                                      │
│     - Dimensions text overlay                                       │
│                                                                      │
│ 8B. Draw Walls (⚠️ PROBLEM AREA)                                    │
│     - Top wall (front): fillRect at (0, 0, width, thickness)        │
│     - Right wall: fillRect at (width-thickness, 0, thickness, h)    │
│     - Bottom wall (back): fillRect at (0, h-thickness, w, thick)    │
│     - Left wall: fillRect at (0, 0, thickness, height)              │
│                                                                      │
│     ⚠️ CRITICAL ISSUE: Walls drawn as RECTANGLES                    │
│        - 10cm thick filled rectangles                               │
│        - Overlap component boundaries                               │
│        - Obscure edge components                                    │
│        - Confuse placement feedback                                 │
│                                                                      │
│     SHOULD BE: Lines representing inner room boundary               │
│                                                                      │
│ 8C. Draw Grid                                                        │
│     - 20cm grid lines                                               │
│     - Helps with manual alignment                                   │
│                                                                      │
│ 8D. Draw Components                                                  │
│     For each element in design.elements:                            │
│                                                                      │
│     ⚠️ TRANSFORMATION #7: Room CM → Canvas Pixels                   │
│        const canvasPos = roomToCanvas(element.x, element.y)         │
│                                                                      │
│        FUNCTION: roomToCanvas()                                     │
│        CALCULATION:                                                  │
│          - Convert cm to pixels (* scale)                           │
│          - Apply zoom                                               │
│          - Apply pan offset                                         │
│                                                                      │
│     RENDERING:                                                       │
│     a) Save canvas state                                            │
│     b) Translate to component position                              │
│     c) Rotate by element.rotation                                   │
│        ⚠️ PROBLEM: Rotation center not explicit                     │
│        ⚠️ PROBLEM: May not be component's true center               │
│     d) Draw component shape (rectangle, corner, sink, etc.)         │
│     e) Draw component label (name + dimensions)                     │
│     f) Restore canvas state                                         │
│                                                                      │
│ 8E. Draw Selection/Hover States                                     │
│     If component selected or hovered:                               │
│     - Draw bounding box                                             │
│     - Draw rotation handles                                         │
│                                                                      │
│     ⚠️ PROBLEM: Bounding box calculation after rotation             │
│        May not match rotated component boundaries                   │
│                                                                      │
│ Output: Rendered canvas with components visible                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Transformation Analysis

### Transformation #1: Database → Drag Preview (1.15x Scale)

**Location:** `CompactComponentSidebar.tsx:277-298`

**Input:** Component from database in centimeters
```typescript
{
  width: 60,   // cm
  depth: 58,   // cm
  height: 82   // cm
}
```

**Transformation:**
```typescript
const scaleFactor = 1.15; // Line 277 - WHY?!
const previewWidth = component.width * scaleFactor;  // 60 * 1.15 = 69px
const previewDepth = component.depth * scaleFactor;  // 58 * 1.15 = 66.7px
```

**Output:** Drag preview DOM element
```typescript
dragPreview.style.width = `${previewWidth}px`;   // 69px
dragPreview.style.height = `${previewDepth}px`;  // 66.7px
```

**Problems:**
1. ❌ **Magic Number:** 1.15 has no explanation except "better match"
2. ❌ **Coordinate System Mismatch:** Treating cm as px (1:1) then scaling by 1.15x
3. ❌ **No Canvas Zoom Consideration:** Preview size fixed regardless of canvas zoom
4. ❌ **Visual Mismatch:** Preview may not match final component size on canvas

**Why 1.15x?**
- Comment says "better match canvas components"
- Likely attempting to compensate for canvas zoom or rendering scale
- BUT: This is a fixed scale, canvas zoom is dynamic!
- **Root Cause:** Trying to fix visual mismatch with a hack instead of proper calculation

**Proper Fix:**
```typescript
// Calculate preview size based on current canvas zoom
const canvasScale = getCurrentCanvasScale(); // Get from canvas context
const previewWidth = component.width * canvasScale;
const previewDepth = component.depth * canvasScale;
```

---

### Transformation #2: Drag Image Center Point

**Location:** `CompactComponentSidebar.tsx:349-350`

**Calculation:**
```typescript
// Line 349-350
const centerX = isCornerComponent
  ? Math.min(component.width, component.depth) * scaleFactor / 2
  : previewWidth / 2;
const centerY = isCornerComponent
  ? Math.min(component.width, component.depth) * scaleFactor / 2
  : previewDepth / 2;

e.dataTransfer.setDragImage(dragPreview, centerX, centerY);
```

**Problems:**
1. ❌ **Corner Component Special Case:** Uses min(width, depth) - assumes square
2. ❌ **No Rotation Consideration:** Center point doesn't account for rotation
3. ❌ **1.15x Scale Applied:** Uses scaled dimensions, not true component center

**Why This Matters:**
- Drag image offset affects where component appears when dropped
- If offset is wrong, component appears shifted from where user expects
- This is a MAJOR UX issue - what you see (drag preview) ≠ what you get (final position)

**Proper Fix:**
```typescript
// Use actual component dimensions (no 1.15x hack)
// Account for rotation if preview should show rotated component
const centerX = previewWidth / 2;
const centerY = previewDepth / 2;
// For rotated components, calculate rotated center point
if (rotation !== 0) {
  // Apply rotation matrix to center calculation
  // This is complex - may be better to not show rotation in preview
}
```

---

### Transformation #3: Browser → Canvas Coordinates

**Location:** `DesignCanvas2D.tsx:2660-2666`

**Input:** Mouse event clientX, clientY (browser viewport coordinates)

**Transformation:**
```typescript
const rect = canvas.getBoundingClientRect();

// Account for CSS scaling of canvas element
const scaleX = CANVAS_WIDTH / rect.width;   // Canvas logical px / CSS display px
const scaleY = CANVAS_HEIGHT / rect.height;

// Transform browser coords → canvas logical coords
const x = (e.clientX - rect.left) * scaleX;
const y = (e.clientY - rect.top) * scaleY;
```

**Example:**
```
Canvas logical size: 1600px × 1200px (CANVAS_WIDTH × CANVAS_HEIGHT)
Canvas CSS display size: 800px × 600px (rect.width × rect.height)
scaleX = 1600 / 800 = 2.0
scaleY = 1200 / 600 = 2.0

Mouse at viewport (100, 50) relative to canvas
Canvas logical position = (100 * 2.0, 50 * 2.0) = (200, 100)
```

**What This Does:**
- Accounts for canvas element being CSS-scaled (shrunk or enlarged)
- Converts browser viewport pixels → canvas logical pixels
- **Does NOT** account for canvas zoom or pan yet

**Problems:**
1. ✅ **This transformation is CORRECT** - needed for CSS-scaled canvas
2. ⚠️ **Zoom Not Applied Yet** - still need to apply zoom in next step

---

### Transformation #4: Canvas Pixels → Room Centimeters

**Location:** `DesignCanvas2D.tsx:2667` → `canvasToRoom()` function

**Input:** Canvas logical coordinates (x, y in pixels)

**Transformation:** (Implemented in canvasToRoom function)
```typescript
// Conceptual implementation (actual code may vary)
function canvasToRoom(canvasX: number, canvasY: number): { x: number, y: number } {
  // 1. Remove pan offset
  const adjustedX = (canvasX - panX) / zoom;
  const adjustedY = (canvasY - panY) / zoom;

  // 2. Convert pixels to centimeters
  // Assuming 1 canvas px = 1 cm at zoom 1.0
  const roomX = adjustedX;
  const roomY = adjustedY;

  // 3. Account for room offset (wall thickness, etc.)
  // May add/subtract wall thickness here

  return { x: roomX, y: roomY };
}
```

**Example:**
```
Canvas position: (400, 300) px
Pan offset: (50, 50) px
Zoom: 2.0x

Step 1: Remove pan
  adjustedX = (400 - 50) / 2.0 = 175
  adjustedY = (300 - 50) / 2.0 = 125

Step 2: Convert to cm (assuming 1:1 at zoom 1.0)
  roomX = 175 cm
  roomY = 125 cm
```

**What This Does:**
- Reverses pan transformation
- Reverses zoom transformation
- Converts canvas pixels → room centimeters

**Problems:**
1. ⚠️ **Coordinate System Assumption:** Assumes 1 canvas px = 1 cm at zoom 1.0
2. ⚠️ **Wall Offset:** May or may not account for wall thickness
3. ❌ **Mismatch with Drag Preview:** Preview was at 1.15x scale, this assumes different scale

**Critical Issue:**
The drag preview the user saw was sized at `component.width * 1.15 * something`, but the final position calculation uses a completely different coordinate system. This guarantees a visual mismatch!

---

### Transformation #5: Position Adjustment & Snapping

**Location:** `canvasCoordinateIntegration.ts:47-117`

**Input:** Room coordinates (cm) from Transformation #4

**Sub-Transformations:**

#### 5A: Boundary Calculation
```typescript
const wallClearance = 5; // HARDCODED LINE 70

const placementBounds = {
  minX: wallClearance,                              // 5 cm from left wall
  minY: wallClearance,                              // 5 cm from top wall
  maxX: roomWidth - componentWidth - wallClearance,  // Can't go past right wall
  maxY: roomHeight - componentDepth - wallClearance  // Can't go past bottom wall
};
```

**Purpose:** Ensure components don't overlap walls

**Problem:** Hardcoded 5cm clearance - should be from database config

#### 5B: Corner Detection
```typescript
const cornerThreshold = 60; // HARDCODED LINE 131

const corners = [
  {
    name: 'top-left',
    condition: dropX <= 60 && dropY <= 60,
    rotation: 0°
  },
  {
    name: 'top-right',
    condition: dropX >= (roomWidth - 60) && dropY <= 60,
    rotation: -270°  // Why negative? Clockwise rotation?
  },
  // ... other corners
];
```

**Purpose:** Snap corner components to room corners with proper rotation

**Problems:**
1. ❌ Hardcoded 60cm threshold
2. ❌ Rotation values inconsistent (negative degrees)
3. ❌ Assumes corner components want to be in corners (what if user doesn't?)

#### 5C: Wall Snapping
```typescript
const snapThreshold = 40; // HARDCODED LINE 211

// Calculate distance to each wall
const leftWallDistance = dropX;
const rightWallDistance = roomWidth - (dropX + width);
const topWallDistance = dropY;
const bottomWallDistance = roomHeight - (dropY + depth);

// Snap to closest wall within threshold
if (leftWallDistance <= 40 && leftWallDistance >= 0) {
  snappedX = bounds.minX; // Snap to left wall (with clearance)
  rotation = 0°;          // Face into room
}
// ... other walls
```

**Purpose:** Snap components to walls when dropped nearby

**Problems:**
1. ❌ Hardcoded 40cm threshold
2. ❌ Rotation logic duplicates corner logic
3. ⚠️ May override user's intended position

#### 5D: Bounds Clamping
```typescript
// Line 98-99
const finalX = Math.max(placementBounds.minX,
                        Math.min(placementBounds.maxX, position.x));
const finalY = Math.max(placementBounds.minY,
                        Math.min(placementBounds.maxY, position.y));
```

**Purpose:** Ensure component stays within room boundaries

**Problem:** May move component away from drop position!

**Example:**
```
User drops at x=595 cm (near right wall at 600cm)
Component width = 60cm
maxX = 600 - 60 - 5 = 535cm
finalX = min(535, 595) = 535cm
Component moved LEFT by 60cm from drop position!
```

**This is confusing for users** - they dropped it at one location, it appears elsewhere

---

### Transformation #6: DUPLICATE Snapping (!)

**Location:** `DesignCanvas2D.tsx:2746-2749`

**Code:**
```typescript
// Line 2746
const snapped = getSnapPosition(newElement, newElement.x, newElement.y);
newElement.x = snapped.x;
newElement.y = snapped.y;
newElement.rotation = snapped.rotation;
```

**Problem:** We ALREADY snapped in Transformation #5!

**Why Does This Exist?**
- Likely historical: `getSnapPosition()` existed first
- Then `getEnhancedComponentPlacement()` was added
- Nobody removed the old snapping

**Issues:**
1. ❌ **Duplicate Logic:** Two separate snapping systems
2. ❌ **May Conflict:** Second snap may override first snap
3. ❌ **Different Thresholds?:** If thresholds differ, unpredictable behavior
4. ❌ **Performance:** Calculating snapping twice

**What Could Go Wrong:**
```
Enhanced placement: Snaps to left wall at x=5cm, rotation=0°
getSnapPosition():  Snaps to top wall at y=5cm, rotation=90° (??)
Final result:       Position and rotation from SECOND snap
User expectation:   Based on FIRST snap
→ Confusion!
```

---

### Transformation #7: Room CM → Canvas Pixels (Rendering)

**Location:** DesignCanvas2D.tsx render function → `roomToCanvas()`

**Input:** Component position in room centimeters

**Transformation:**
```typescript
function roomToCanvas(roomX: number, roomY: number): { x: number, y: number } {
  // 1. Convert cm to pixels (assuming 1:1 at zoom 1.0)
  let canvasX = roomX;
  let canvasY = roomY;

  // 2. Apply zoom
  canvasX *= zoom;
  canvasY *= zoom;

  // 3. Apply pan offset
  canvasX += panX;
  canvasY += panY;

  return { x: canvasX, y: canvasY };
}
```

**Example:**
```
Component at room position: (100, 80) cm
Zoom: 2.0x
Pan: (50, 50) px

Step 1: CM to PX (1:1)
  canvasX = 100
  canvasY = 80

Step 2: Apply zoom
  canvasX = 100 * 2.0 = 200
  canvasY = 80 * 2.0 = 160

Step 3: Apply pan
  canvasX = 200 + 50 = 250
  canvasY = 160 + 50 = 210

Final canvas position: (250, 210) px
```

**What This Does:**
- Inverse of `canvasToRoom()` (Transformation #4)
- Converts room centimeters → canvas pixels for rendering
- Applies current zoom and pan state

**Rotation Rendering:**
```typescript
// In render loop for each component
ctx.save();
ctx.translate(canvasPos.x, canvasPos.y);  // Move to component position
ctx.rotate(element.rotation * Math.PI / 180);  // Rotate
// ⚠️ PROBLEM: Rotation center is now at (0, 0) = top-left corner!
// Should rotate around component CENTER, not corner!
ctx.fillRect(0, 0, width, height);  // Draw from (0,0)
ctx.restore();
```

**Critical Rotation Issue:**
- Canvas rotation happens around (0, 0)
- We translate to component's (x, y) which is top-left corner
- So rotation pivot is top-left corner, not center!

**Proper Fix:**
```typescript
ctx.save();
ctx.translate(canvasPos.x + width/2, canvasPos.y + height/2);  // Move to CENTER
ctx.rotate(element.rotation * Math.PI / 180);
ctx.fillRect(-width/2, -height/2, width, height);  // Draw centered on (0,0)
ctx.restore();
```

---

## 🚨 Critical Issues Summary

### Issue #1: 1.15x Scale Factor Hack 🔴 CRITICAL
**Location:** `CompactComponentSidebar.tsx:277`

**Problem:**
- Drag preview scaled by 1.15x to "better match canvas"
- This is a hack - proper solution is to match actual canvas zoom
- Causes visual mismatch between preview and final size

**Impact:** HIGH - Confusing UX, preview doesn't match result

**Fix:**
```typescript
// Remove hardcoded 1.15x
// Calculate preview size from actual canvas state
const canvasZoom = getCanvasZoom(); // Get from canvas context/props
const canvasScale = getCanvasScale(); // Pixels per cm
const previewWidth = component.width * canvasScale * canvasZoom;
const previewDepth = component.depth * canvasScale * canvasZoom;
```

---

### Issue #2: Duplicate Snapping Systems 🔴 CRITICAL
**Locations:**
- `canvasCoordinateIntegration.ts:196-277` (First snap)
- `DesignCanvas2D.tsx:2746-2749` (Second snap)

**Problem:**
- Two separate snapping calculations
- May produce conflicting results
- Second snap may override first snap
- User sees result of second snap, expects result of first snap

**Impact:** HIGH - Unpredictable positioning, user confusion

**Fix:**
```typescript
// Option A: Remove second snap entirely
// Line 2746-2749 DELETE

// Option B: Consolidate into single snapping function
// Use ONLY getEnhancedComponentPlacement, remove getSnapPosition
```

---

### Issue #3: Hardcoded Configuration Values 🟡 MEDIUM
**Locations:**
- `CompactComponentSidebar.tsx:277` - 1.15x scale
- `canvasCoordinateIntegration.ts:70` - 5cm wall clearance
- `canvasCoordinateIntegration.ts:131` - 60cm corner threshold
- `canvasCoordinateIntegration.ts:211` - 40cm snap threshold

**Problem:**
- Values scattered in code
- Can't be changed without code deployment
- No single source of truth
- ConfigurationService exists but not fully utilized

**Impact:** MEDIUM - Can't tune behavior without code changes

**Fix:**
```typescript
// Load from database via ConfigurationService
const wallClearance = await ConfigurationService.get('wall_clearance', 5);
const cornerThreshold = await ConfigurationService.get('corner_threshold', 60);
const snapThreshold = await ConfigurationService.get('snap_threshold', 40);

// Or preload on app init and use sync access
ConfigurationService.preload(); // On app start
const wallClearance = ConfigurationService.getSync('wall_clearance', 5);
```

---

### Issue #4: Rotation Center at Top-Left 🔴 CRITICAL
**Location:** DesignCanvas2D.tsx render loop (rotation logic)

**Problem:**
- Components rotate around top-left corner
- Should rotate around geometric center
- Causes bounding box misalignment
- Rotation handles in wrong position

**Impact:** HIGH - Broken rotation UX

**Fix:**
```typescript
// When rendering rotated components
ctx.save();
const centerX = element.width / 2;
const centerY = element.depth / 2;
ctx.translate(canvasPos.x + centerX, canvasPos.y + centerY);  // Move to center
ctx.rotate(element.rotation * Math.PI / 180);
ctx.fillRect(-centerX, -centerY, element.width, element.depth);  // Draw centered
ctx.restore();
```

---

### Issue #5: Wall Rectangle Overlap 🔴 CRITICAL
**Location:** DesignCanvas2D.tsx wall rendering

**Problem:**
- Walls drawn as 10cm thick filled rectangles
- Overlap component boundaries
- Obscure components near walls
- Confusing visual feedback

**Impact:** HIGH - Hard to see components near walls

**Fix:**
```typescript
// Replace fillRect with strokeRect or line drawing
// Draw walls as 1-2px lines representing inner boundary

// Example for top wall:
ctx.strokeStyle = '#000';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(roomWidth, 0);
ctx.stroke();

// Repeat for all 4 walls
// NO MORE FILLED RECTANGLES
```

---

### Issue #6: Coordinate System Mismatch 🔴 CRITICAL
**Problem:**
- Drag preview: cm * 1.15 → px
- Drop position: canvas px → room cm (via canvasToRoom)
- Different scaling factors at each step
- No consistent 1:1 mapping

**Impact:** HIGH - Position mismatch between preview and final

**Fix:**
- Establish single coordinate system pipeline
- Document each transformation clearly
- Ensure inverse transformations are exact
- Remove 1.15x hack

---

### Issue #7: Drag Image Center Doesn't Account for Rotation 🟡 MEDIUM
**Location:** `CompactComponentSidebar.tsx:349-350`

**Problem:**
- Drag image center calculated for non-rotated component
- If component should be rotated, center point is wrong
- Not accounting for this currently, but will be issue if rotation added to preview

**Impact:** MEDIUM - Only matters if we add rotation to drag preview

**Fix:**
- For now: Don't show rotation in preview (current behavior)
- Future: Calculate rotated center point if adding rotation to preview

---

### Issue #8: Bounds Clamping Shifts Position 🟡 MEDIUM
**Location:** `canvasCoordinateIntegration.ts:98-99`

**Problem:**
- Clamping can move component far from drop position
- User drops at X, component appears at X - offset
- Confusing UX

**Impact:** MEDIUM - User expects component where they dropped it

**Fix:**
```typescript
// Option A: Don't clamp - reject drop if out of bounds
if (!withinBounds) {
  showError('Component doesn't fit here');
  return null;
}

// Option B: Clamp but show visual feedback
if (clamped) {
  highlightAdjustedPosition();
}

// Option C: Clamp but use smaller components near edges
// (Complex - probably not worth it)
```

---

## 📋 Configuration Values Inventory

### Currently Hardcoded (Should be in Database)

| Value | Location | Current | Should Be |
|-------|----------|---------|-----------|
| Drag preview scale | CompactComponentSidebar:277 | `1.15` | Dynamic (match canvas) |
| Wall clearance | canvasCoordinateIntegration:70 | `5` cm | `wall_clearance` config |
| Corner threshold | canvasCoordinateIntegration:131 | `60` cm | `corner_threshold` config |
| Snap threshold | canvasCoordinateIntegration:211 | `40` cm | `snap_threshold` config |
| Grid size | DesignCanvas2D | `20` cm | Already in config? |
| Wall thickness | Multiple places | `10` cm | `wall_thickness` config |
| Min zoom | DesignCanvas2D | `0.5` | `min_zoom` config |
| Max zoom | DesignCanvas2D | `4.0` | `max_zoom` config |

### Already in Database (app_configuration)

| Config Key | Value | Usage |
|------------|-------|-------|
| `wall_thickness` | 10 cm | Wall rendering, coordinate calculations |
| `snap_threshold` | 40 cm | ⚠️ BUT: Not used in canvasCoordinateIntegration! |
| `wall_clearance` | 5 cm | ⚠️ BUT: Not used in canvasCoordinateIntegration! |

**Finding:** ConfigurationService exists and has correct values, but they're not being used!

---

## 🎯 Recommended Fix Order

### Phase 1: Remove Immediate Blockers (High Priority)
1. ✅ Remove 1.15x scale hack
2. ✅ Fix rotation center (top-left → true center)
3. ✅ Replace wall rectangles with lines
4. ✅ Remove duplicate snapping system

### Phase 2: Configuration Consolidation (High Priority)
5. ✅ Use ConfigurationService for all hardcoded values
6. ✅ Preload config on app init
7. ✅ Remove hardcoded fallbacks (use database or fail)

### Phase 3: Coordinate System Cleanup (Medium Priority)
8. ✅ Document coordinate pipeline clearly
9. ✅ Ensure drag preview matches final size
10. ✅ Fix bounds clamping UX

### Phase 4: Polish (Low Priority)
11. ✅ Add visual snap indicators
12. ✅ Smooth rotation animations
13. ✅ Better error messages for invalid drops

---

## 📊 Testing Checklist

### Drag & Drop Tests
- [ ] Drop component in room center → appears at cursor position
- [ ] Drop near left wall → snaps to wall correctly
- [ ] Drop near corner → snaps to corner with correct rotation
- [ ] Drop outside room → rejected with error message
- [ ] Drag preview size matches final component size
- [ ] Drag preview position matches final position

### Rotation Tests
- [ ] Rotate component 90° → rotates around true center
- [ ] Bounding box matches rotated component
- [ ] Rotation handles positioned at corners
- [ ] Rotation at different zoom levels works correctly

### Snapping Tests
- [ ] Wall snap threshold consistent (40cm from database)
- [ ] Corner snap threshold consistent (60cm from database)
- [ ] Wall clearance applied correctly (5cm from database)
- [ ] No double-snapping (position doesn't jump after drop)

### Configuration Tests
- [ ] All hardcoded values removed
- [ ] ConfigurationService preloaded on app init
- [ ] Configuration changes reflected without code reload
- [ ] Fallback values used if database unavailable

### Visual Tests
- [ ] Walls render as lines (not rectangles)
- [ ] Components visible near walls
- [ ] No visual overlap with wall boundaries
- [ ] Grid lines visible and helpful

---

## 🔗 Related Files

### Files to Modify
1. `src/components/designer/CompactComponentSidebar.tsx` - Remove 1.15x, fix drag preview
2. `src/components/designer/DesignCanvas2D.tsx` - Fix rotation, remove duplicate snap, fix walls
3. `src/utils/canvasCoordinateIntegration.ts` - Use config values, consolidate snapping
4. `src/services/ConfigurationService.ts` - Ensure preload works

### Files to Review
1. `src/services/CoordinateTransformEngine.ts` - Coordinate transformation logic
2. `src/utils/PositionCalculation.ts` - Position utilities
3. `supabase/migrations/20250129000005_create_app_configuration.sql` - Config schema

---

**Document Status:** ✅ COMPLETE
**Next Document:** `02-CONFIGURATION-AUDIT.md`
**Critical Issues Found:** 8
**Estimated Fix Time:** 15-20 hours (for high-priority issues)
