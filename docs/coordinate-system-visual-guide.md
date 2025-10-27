# Coordinate System Transformation Visual Guide

## Overview

This document provides visual diagrams of how coordinates transform between different view types in the RightFit Interior Designer application.

**Purpose**: Help developers and AI agents understand the coordinate system inconsistencies that cause Circular Pattern #1.

---

## The Three Coordinate Systems

### System Comparison Table

| View Type | Origin | Coordinate Space | Units | X-Axis | Y-Axis | Z-Axis |
|-----------|--------|------------------|-------|--------|--------|--------|
| **Plan View** | Top-Left Corner | 2D Cartesian | cm | Width (left→right) | Depth (front→back) | N/A |
| **Elevation (Legacy)** | Canvas Top-Left | 2D Canvas | cm→px | Wall position | N/A | Height (floor→ceiling) |
| **Elevation (New)** | Canvas Top-Left | 2D Canvas | cm→px | Wall position | N/A | Height (floor→ceiling) |
| **3D View** | Room Center | 3D Cartesian | meters | Width (left→right) | Height (floor→ceiling) | Depth (front→back) |

**CRITICAL DIFFERENCES**:
- Plan view uses **cm**, 3D view uses **meters**
- Plan view Y-axis is **depth**, 3D view Y-axis is **height**
- Elevation legacy has **asymmetric** left/right mapping
- 3D view origin is **centered**, plan view origin is **top-left**

---

## Visual Diagram 1: Plan View Coordinate System

```
PLAN VIEW (Top-Down Camera Looking Down at Floor)
================================================

Room Origin (0,0) = Top-Left Corner (FRONT-LEFT)

        0cm                    Width (X-axis)                   400cm
         ├──────────────────────────────────────────────────────┤
    0cm  ┌────────────────────────────────────────────────────┐  ┬ FRONT WALL (y=0)
         │                                                      │  │
         │         Component at (100, 80)                      │  │
         │              ┌────┐                                 │  │
         │              │    │ width=60cm                      │  │
         │         x=100│    │                                 │  │
    80cm │        ─────►├────┤                                 │  │
         │         y=80 │    │ depth=60cm                      │  │ Depth
         │              │    │                                 │  │ (Y-axis)
         │              └────┘                                 │  │ front → back
         │                                                      │  │
         │                                                      │  │
         │                                                      │  │
         │                                                      │  │
  600cm  └────────────────────────────────────────────────────┘  ┴ BACK WALL (y=600)

Coordinate Properties:
- element.x = 100cm (horizontal distance from left wall)
- element.y = 80cm (distance from front wall)
- element.width = 60cm (X-axis dimension)
- element.depth = 60cm (Y-axis dimension)

Canvas Rendering:
canvasX = element.x * zoom
canvasY = element.y * zoom
canvasWidth = element.width * zoom
canvasHeight = element.depth * zoom  // Note: depth, not height!
```

---

## Visual Diagram 2: Elevation Views (All Four Walls)

```
ELEVATION VIEWS (Side Camera Looking at Walls)
===============================================

Room Layout (Plan View Reference):
                   FRONT WALL (Y=0)
         ┌──────────────────────────────┐
         │                              │
  LEFT   │                              │  RIGHT
  WALL   │          ROOM                │  WALL
  (X=0)  │                              │  (X=400)
         │                              │
         └──────────────────────────────┘
                   BACK WALL (Y=600)

---

FRONT ELEVATION VIEW (Looking at Front Wall from Inside Room)
==============================================================

Canvas Origin (0,0) = Top-Left of Canvas

         Left Side                                Right Side
         ├────────────────────────────────────────────┤
    0px  ┌──────────────────────────────────────────┐  ─┬─ 0cm (ceiling)
         │                                            │   │
         │                                            │   │
         │         Wall Cabinet (element.x = 100)    │   │
  140cm  │              ┌────┐                       │   │
         │              │    │ h=70cm                │   │ Height
         │              └────┘                       │   │ (Z-axis)
         │                                            │   │
   90cm  │══════════════════════════════════════════│   │ Counter-top
         │                                            │   │
         │         Base Cabinet (element.x = 100)    │   │
         │              ┌────┐                       │   │
         │              │    │ h=86cm                │   │
    0cm  └──────────────┴────┴───────────────────────┘  ─┴─ Floor

Horizontal Position Calculation (FRONT/BACK walls):
canvasX = (element.x / roomWidth) * canvasWidth

Element Visibility Rule:
- Show if element.wall === 'front' OR corner visible in front

---

LEFT ELEVATION VIEW (Looking at Left Wall from Inside Room)
============================================================

Canvas Origin (0,0) = Top-Left of Canvas

         Front Side                              Back Side
         ├────────────────────────────────────────────┤
    0px  ┌──────────────────────────────────────────┐  ─┬─ 0cm (ceiling)
         │                                            │   │
         │                                            │   │
         │                                            │   │
         │         Wall Cabinet (element.y = 100)    │   │
  140cm  │              ┌────┐                       │   │
         │              │    │ h=70cm                │   │ Height
         │              └────┘                       │   │ (Z-axis)
         │                                            │   │
   90cm  │══════════════════════════════════════════│   │ Counter-top
         │                                            │   │
         │         Base Cabinet (element.y = 100)    │   │
         │              ┌────┐                       │   │
         │              │    │ h=86cm                │   │
    0cm  └──────────────┴────┴───────────────────────┘  ─┴─ Floor

Horizontal Position Calculation:

LEGACY (ASYMMETRIC - WRONG):
  flippedY = roomDepth - element.y - element.depth
  canvasX = (flippedY / roomDepth) * canvasWidth

  Example: element.y = 100, depth = 60, roomDepth = 600
  flippedY = 600 - 100 - 60 = 440
  Result: Component appears at position 440 on left wall

NEW (UNIFIED - CORRECT):
  normalizedY = element.y / roomDepth
  canvasX = normalizedY * canvasWidth
  // THEN apply mirroring at render time:
  if (view === 'left') {
    canvasX = canvasWidth - canvasX - elementWidth
  }

  Example: element.y = 100, depth = 60, roomDepth = 600
  normalizedY = 100 / 600 = 0.167
  canvasX = 0.167 * canvasWidth = 100px (before mirroring)
  After mirroring: canvasWidth - 100 - 60 = canvasWidth - 160
  Result: Component consistently positioned relative to front

Element Visibility Rule:
- Show if element.wall === 'left' OR corner visible in left

---

RIGHT ELEVATION VIEW (Looking at Right Wall from Inside Room)
==============================================================

Canvas Origin (0,0) = Top-Left of Canvas

         Front Side                              Back Side
         ├────────────────────────────────────────────┤
    0px  ┌──────────────────────────────────────────┐  ─┬─ 0cm (ceiling)
         │                                            │   │
         │                                            │   │
         │         Wall Cabinet (element.y = 100)    │   │
  140cm  │              ┌────┐                       │   │
         │              │    │ h=70cm                │   │ Height
         │              └────┘                       │   │ (Z-axis)
         │                                            │   │
   90cm  │══════════════════════════════════════════│   │ Counter-top
         │                                            │   │
         │         Base Cabinet (element.y = 100)    │   │
         │              ┌────┐                       │   │
         │              │    │ h=86cm                │   │
    0cm  └──────────────┴────┴───────────────────────┘  ─┴─ Floor

Horizontal Position Calculation:

LEGACY (ASYMMETRIC - INCONSISTENT WITH LEFT):
  canvasX = (element.y / roomDepth) * canvasWidth

  Example: element.y = 100, roomDepth = 600
  canvasX = (100 / 600) * canvasWidth = 100px
  Result: Component at position 100 on right wall

  PROBLEM: Same component appears at 440px on LEFT wall, 100px on RIGHT wall!

NEW (UNIFIED - CONSISTENT):
  normalizedY = element.y / roomDepth
  canvasX = normalizedY * canvasWidth
  // NO mirroring for right wall

  Example: element.y = 100, roomDepth = 600
  canvasX = (100 / 600) * canvasWidth = 100px
  Result: Component at consistent position on both walls

Element Visibility Rule:
- Show if element.wall === 'right' OR corner visible in right

---

BACK ELEVATION VIEW (Looking at Back Wall from Inside Room)
============================================================

Canvas Origin (0,0) = Top-Left of Canvas

         Left Side                                Right Side
         ├────────────────────────────────────────────┤
    0px  ┌──────────────────────────────────────────┐  ─┬─ 0cm (ceiling)
         │                                            │   │
         │                                            │   │
         │         Wall Cabinet (element.x = 100)    │   │
  140cm  │              ┌────┐                       │   │
         │              │    │ h=70cm                │   │ Height
         │              └────┘                       │   │ (Z-axis)
         │                                            │   │
   90cm  │══════════════════════════════════════════│   │ Counter-top
         │                                            │   │
         │         Base Cabinet (element.x = 100)    │   │
         │              ┌────┐                       │   │
         │              │    │ h=86cm                │   │
    0cm  └──────────────┴────┴───────────────────────┘  ─┴─ Floor

Horizontal Position Calculation (same as FRONT):
canvasX = (element.x / roomWidth) * canvasWidth

Element Visibility Rule:
- Show if element.wall === 'back' OR corner visible in back
```

---

## Visual Diagram 3: 3D View Coordinate System

```
3D VIEW (Perspective Camera)
============================

Room Origin (0, 0, 0) = CENTER of room at floor level

         Y-axis (Height)
              ▲
              │ 2.4m (ceiling)
              │
              │     ┌─────────────┐
              │    ╱│            ╱│
              │   ╱ │           ╱ │
              │  ╱  │          ╱  │
              │ ╱   │         ╱   │
              │┌─────────────┐    │
              ││    │        │    │
              ││    │        │    │
   1.7m ──────││────┼────────│────│────── Walk mode eye level
              ││    │        │    │
              ││    │        │    │
              ││    └────────│────┘
              ││   ╱         │   ╱
              ││  ╱          │  ╱
              ││ ╱           │ ╱
              ││╱            │╱
    0m ───────┼┴─────────────┘───────────────────► X-axis (Width)
             ╱ │                                  (Left -2m → Right +2m)
            ╱  │
           ╱   │
          ╱    │
         ▼
    Z-axis (Depth)
    (Front -3m → Back +3m)

Component Position Transformation:

PLAN VIEW → 3D VIEW CONVERSION:

Input (Plan View):
- element.x = 100cm (from left wall)
- element.y = 80cm (from front wall)
- element.z = 0cm (base cabinet on floor)
- element.width = 60cm
- element.depth = 60cm
- element.height = 86cm
- roomWidth = 400cm
- roomDepth = 600cm

Step 1: Convert to meters
- x_cm = 100
- y_cm = 80
- z_cm = 0
- roomWidth_m = 4.0
- roomDepth_m = 6.0

Step 2: Calculate 3D centered coordinates
- innerLeftBoundary = -roomWidth_m / 2 = -2.0m
- innerBackBoundary = -roomDepth_m / 2 = -3.0m

Step 3: Map plan coordinates to 3D world
- x3d = innerLeftBoundary + (x_cm / roomWidth_cm) * roomWidth_m
- x3d = -2.0 + (100 / 400) * 4.0
- x3d = -2.0 + 1.0 = -1.0m

- z3d = innerBackBoundary + (y_cm / roomDepth_cm) * roomDepth_m
- z3d = -3.0 + (80 / 600) * 6.0
- z3d = -3.0 + 0.8 = -2.2m

Step 4: Calculate Y position (height)
- baseHeight = element.z / 100 = 0 / 100 = 0m (floor level)
- componentHeight = element.height / 100 = 86 / 100 = 0.86m
- yPosition = baseHeight + (componentHeight / 2)  // Center of component
- yPosition = 0 + 0.43 = 0.43m

Final 3D Position:
- position = [-1.0, 0.43, -2.2]  // In meters
- dimensions = [0.6, 0.86, 0.6]  // width, height, depth in meters

Three.js Code:
<group position={[-1.0, 0.43, -2.2]}>
  <BoxGeometry args={[0.6, 0.86, 0.6]} />
</group>
```

---

## Visual Diagram 4: The Asymmetry Problem (Legacy System)

```
THE ASYMMETRY PROBLEM - Why Left and Right Walls Don't Match
=============================================================

Given: Component at element.y = 100cm in a 600cm deep room

LEGACY LEFT WALL CALCULATION:
─────────────────────────────

Step 1: Flip the Y coordinate
  flippedY = roomDepth - element.y - element.depth
  flippedY = 600 - 100 - 60 = 440

Step 2: Normalize and convert to canvas
  canvasX = (440 / 600) * canvasWidth
  canvasX = 0.733 * canvasWidth

Result: Component appears at 73% across the canvas


LEGACY RIGHT WALL CALCULATION:
──────────────────────────────

Step 1: Use Y coordinate directly
  canvasX = (element.y / roomDepth) * canvasWidth
  canvasX = (100 / 600) * canvasWidth
  canvasX = 0.167 * canvasWidth

Result: Component appears at 17% across the canvas


THE PROBLEM VISUALIZED:
───────────────────────

LEFT WALL VIEW:                    RIGHT WALL VIEW:
Canvas                             Canvas
├─────────────────────────┤        ├─────────────────────────┤
│                     ┌───┐        │  ┌───┐                 │
│                     │   │        │  │   │                 │
│                     └───┘        │  └───┘                 │
│                     73%          │  17%                    │
└───────────────────────────       └───────────────────────────

SAME COMPONENT at element.y = 100cm appears at DIFFERENT positions!

This breaks the user's mental model:
- User places component 100cm from front wall
- Expects it to appear at same relative position on both side walls
- Instead sees completely different positioning
- Leads to confusion: "Did I place two different components?"


NEW UNIFIED SYSTEM FIX:
──────────────────────

Both walls use same calculation:
  normalizedY = element.y / roomDepth
  canvasX = normalizedY * canvasWidth

LEFT WALL: Apply mirroring at RENDER time
  canvasX = canvasWidth - canvasX - elementWidth

RIGHT WALL: No mirroring

Result: Consistent positioning before mirroring is applied
```

---

## Visual Diagram 5: Complete Transformation Flow

```
COMPLETE COORDINATE TRANSFORMATION PIPELINE
============================================

User Action: Places component in Plan View
│
│ Input: Click at canvas position (canvasX, canvasY)
│
▼
┌─────────────────────────────────────────────────────────────┐
│ PLAN VIEW COORDINATE CALCULATION                            │
│                                                              │
│ element.x = canvasX / zoom                                  │
│ element.y = canvasY / zoom                                  │
│ element.z = 0 (default for base cabinets)                   │
│                                                              │
│ Stored in database as: {x: 100, y: 80, z: 0} (in cm)       │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Element saved to database
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE (ROOM_DESIGNS.DESIGN_ELEMENTS)                     │
│                                                              │
│ {                                                            │
│   id: "elem-123",                                           │
│   component_id: "base-cabinet-600",                         │
│   x: 100,        // cm from left wall                       │
│   y: 80,         // cm from front wall                      │
│   z: 0,          // cm above floor                          │
│   width: 60,     // cm X-dimension                          │
│   depth: 60,     // cm Y-dimension                          │
│   height: 86,    // cm Z-dimension                          │
│   rotation: 0    // degrees                                 │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Element loaded by views
                          │
        ┌─────────────────┼─────────────────┬─────────────────┐
        │                 │                 │                 │
        ▼                 ▼                 ▼                 ▼
    ┌───────┐       ┌─────────┐      ┌─────────┐      ┌─────────┐
    │ PLAN  │       │ ELEV    │      │ ELEV    │      │   3D    │
    │ VIEW  │       │ FRONT   │      │  LEFT   │      │  VIEW   │
    └───────┘       └─────────┘      └─────────┘      └─────────┘
        │                 │                 │                 │
        ▼                 ▼                 ▼                 ▼
  Direct         Use X coord      Use Y coord       Convert to
  rendering      for horizontal   for horizontal    meters and
  x*zoom,        position:        position:         center:
  y*zoom
                 canvasX =        NEW SYSTEM:       x3d = -2.0 +
                 (x/roomW)        canvasX =           (100/400)*4.0
                 * canvasW        (y/roomD)         = -1.0m
                                  * canvasW
                                                    z3d = -3.0 +
                                  THEN mirror:        (80/600)*6.0
                                  canvasX =         = -2.2m
                                  canvasW -
                                  canvasX -         y3d = 0 +
                                  elemW               (86/100)/2
                                                    = 0.43m
        │                 │                 │                 │
        ▼                 ▼                 ▼                 ▼
   Rendered        Rendered           Rendered         Rendered
   at exact        at                 at               at
   x,y from        x-based            y-based          [-1.0,
   database        position           position         0.43,
                                      (mirrored)       -2.2]


CRITICAL OBSERVATION:
═════════════════════

Each view transforms the SAME database coordinates (x, y, z) differently:
- Plan: Direct pixel mapping (x*zoom, y*zoom)
- Elevation Front/Back: Uses X coordinate for horizontal
- Elevation Left/Right: Uses Y coordinate for horizontal (with/without flip)
- 3D: Converts to meters and centers at origin

This is why fixing position in ONE view can break ANOTHER view:
The transformation logic is DIFFERENT for each view type!

SOLUTION:
═════════
Create a UNIFIED CoordinateTransformEngine that:
1. Stores canonical coordinates in database (x, y, z in cm)
2. Provides transformation functions for each view type
3. Ensures mathematical consistency across all transforms
4. Makes it impossible to have asymmetric calculations
```

---

## Code Reference Map

### Where Transformations Happen

| Transformation | File | Lines | Function |
|----------------|------|-------|----------|
| **Plan View Rendering** | DesignCanvas2D.tsx | ~800-1200 | Direct canvas drawing |
| **Elevation Positioning (Legacy)** | PositionCalculation.ts | 145-197 | `calculateElementPosition()` |
| **Elevation Positioning (New)** | PositionCalculation.ts | 208-266 | `calculateElementPosition()` |
| **3D Coordinate Conversion** | EnhancedModels3D.tsx | ~200-250 | `convertTo3D()` |
| **Wall Detection** | canvasCoordinateIntegration.ts | Various | `getElementWall()` |

### Feature Flags

| Flag | Default | Location | Purpose |
|------|---------|----------|---------|
| `use_new_positioning_system` | `true` | PositionCalculation.ts:53 | Enable unified elevation positioning |

---

## Quick Reference: Common Transformations

### Plan View → Elevation Front/Back
```typescript
// Input: element.x (cm from left wall)
// Output: Canvas X position (pixels)

const canvasX = (element.x / roomDimensions.width) * canvasWidth;
const canvasY = calculateCanvasY(element.z, element.height);  // Z-based
```

### Plan View → Elevation Left (NEW System)
```typescript
// Input: element.y (cm from front wall)
// Output: Canvas X position (pixels)

const normalizedY = element.y / roomDimensions.height;  // Note: height = depth
const canvasX = normalizedY * elevationWidth;

// Apply mirroring for left wall
const mirroredX = elevationWidth - canvasX - elementWidth;
```

### Plan View → 3D View
```typescript
// Input: element.x, element.y, element.z (all in cm)
// Output: Three.js position [x, y, z] (all in meters)

const convertTo3D = (x, y, innerRoomWidth, innerRoomHeight) => {
  const innerWidthMeters = innerRoomWidth / 100;
  const innerHeightMeters = innerRoomHeight / 100;

  const innerLeftBoundary = -innerWidthMeters / 2;
  const innerBackBoundary = -innerHeightMeters / 2;

  return {
    x: innerLeftBoundary + (x / innerRoomWidth) * innerWidthMeters,
    z: innerBackBoundary + (y / innerRoomHeight) * innerHeightMeters
  };
};

const { x: x3d, z: z3d } = convertTo3D(element.x, element.y, roomWidth, roomHeight);
const y3d = (element.z / 100) + (element.height / 100) / 2;

position = [x3d, y3d, z3d];
```

---

## Testing Coordinate Transformations

### Manual Test Cases

**Test Case 1: Corner Component**
```
Given:
- Room: 400cm wide × 600cm deep
- Component: Corner base cabinet at (0, 0)
- Dimensions: 90cm × 90cm × 86cm

Expected Results:
- Plan View: Top-left corner ✓
- Front Elevation: Left edge ✓
- Left Elevation: Front edge ✓
- 3D View: Position [-2.0, 0.43, -3.0] ✓

If ANY view shows different position → Coordinate system bug
```

**Test Case 2: Center Component**
```
Given:
- Room: 400cm wide × 600cm deep
- Component: Base cabinet at (170, 270)  // Near center
- Dimensions: 60cm × 60cm × 86cm

Expected Results:
- Plan View: Centered ✓
- Front Elevation: Centered horizontally ✓
- Left Elevation: Centered horizontally ✓
- 3D View: Position [0.0, 0.43, 0.0] (approximately) ✓

If component appears off-center in any view → Coordinate bug
```

**Test Case 3: Left vs Right Elevation Consistency**
```
Given:
- Room: 400cm wide × 600cm deep
- Component: Base cabinet at (200, 100)
- Dimensions: 60cm × 60cm × 86cm

Expected Results:
- Left Elevation: Component 100cm from front edge ✓
- Right Elevation: Component 100cm from front edge ✓
- Positions should MIRROR each other, not be at different distances

If left and right show different distances from front → Asymmetry bug (Legacy system)
```

---

## Debugging Coordinate Issues

### Step-by-Step Diagnostic

**Step 1**: Identify which view shows the problem
- Plan view? → Check zoom calculations
- Elevation view? → Check PositionCalculation.ts feature flag
- 3D view? → Check convertTo3D function
- Multiple views? → Likely coordinate system inconsistency

**Step 2**: Check feature flags
```typescript
// In PositionCalculation.ts
console.log('Feature flag:', this.featureFlagEnabled);
// Should be: true (use NEW system)
```

**Step 3**: Log transformation inputs/outputs
```typescript
// In your rendering code
console.log('Element:', {
  x: element.x,
  y: element.y,
  z: element.z,
  width: element.width,
  depth: element.depth,
  height: element.height
});

console.log('Canvas position:', {
  canvasX,
  canvasY,
  canvasWidth,
  canvasHeight
});
```

**Step 4**: Compare across views
- Place component in plan view
- Check position in all 4 elevation views + 3D
- Document discrepancies
- Use this guide to identify which transformation is wrong

---

## Next Steps

**For Developers**:
1. Review this guide before making position-related changes
2. Always test across ALL views (plan + 4 elevations + 3D)
3. Use the NEW positioning system (verify flag = true)
4. Reference transformation formulas from this document

**For AI Agents**:
1. Read this guide when encountering position bugs
2. Identify which coordinate system is involved
3. Check for asymmetry issues (legacy system indicators)
4. Never "fix" one view in isolation - fix the transformation logic

**Related Documents**:
- [brownfield-architecture.md](./brownfield-architecture.md) - Full architectural analysis
- [PositionCalculation.ts](../src/utils/PositionCalculation.ts) - Elevation positioning code
- [EnhancedModels3D.tsx](../src/components/designer/EnhancedModels3D.tsx) - 3D conversion code

---

**Document Version**: 1.0
**Last Updated**: 2025-10-26
**Author**: Winston (AI Architect)
