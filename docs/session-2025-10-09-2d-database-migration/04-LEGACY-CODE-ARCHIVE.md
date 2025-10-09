# Legacy 2D Rendering Code Archive
**Date:** 2025-10-09
**Source File:** `src/components/designer/DesignCanvas2D.tsx`
**Status:** 📦 **ARCHIVED FOR REFERENCE**

---

## Purpose of This Document

This document archives the legacy hardcoded 2D rendering code that will be removed during the database-driven migration. It serves as:

1. **Historical Reference** - Understand how rendering worked before migration
2. **Implementation Guide** - Port logic to new database-driven handlers
3. **Fallback Resource** - Restore functionality if needed
4. **Documentation** - Preserve knowledge of rendering algorithms

**⚠️ WARNING:** This code will be removed after successful migration. Do not use as active implementation reference.

---

## Table of Contents

1. [Sink Rendering (Lines 1085-1258)](#1-sink-rendering)
2. [Corner Component Detection (Multiple Locations)](#2-corner-component-detection)
3. [Main Plan View Drawing Logic (Lines 1261-1356)](#3-main-plan-view-drawing-logic)
4. [Elevation View Rendering (Lines 1383+)](#4-elevation-view-rendering)
5. [Helper Functions](#5-helper-functions)
6. [Magic Constants](#6-magic-constants)

---

## 1. Sink Rendering

### Location
**File:** `src/components/designer/DesignCanvas2D.tsx`
**Lines:** 1085-1258
**Function:** `drawSinkPlanView()`
**Lines of Code:** 173

### Purpose
Renders detailed sink shapes in plan view including:
- Single bowl sinks (ceramic and stainless steel)
- Double bowl sinks with center divider
- Corner L-shaped sinks
- Butler sinks with ceramic appearance
- Farmhouse sinks
- Draining boards with grooves
- Drain holes and faucet mounting holes

### Code

```typescript
const drawSinkPlanView = useCallback((
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  width: number,
  depth: number,
  isSelected: boolean,
  isHovered: boolean
) => {
  // Type detection via ID string matching
  const isButlerSink = element.id.includes('butler-sink') ||
                       element.id.includes('butler') ||
                       element.id.includes('base-unit-sink');
  const isDoubleBowl = element.id.includes('double-bowl') ||
                       element.id.includes('double');
  const isCornerSink = element.id.includes('corner-sink');
  const hasDrainingBoard = element.id.includes('draining-board') ||
                           element.metadata?.has_draining_board;
  const isFarmhouseSink = element.id.includes('farmhouse');

  // Sink colors based on material
  const sinkColor = isButlerSink ? '#FFFFFF' : '#C0C0C0';
  // White ceramic for butler, stainless steel for kitchen
  const rimColor = isButlerSink ? '#F8F8F8' : '#B0B0B0';

  // Draw sink rim (outer edge) with gradient effect
  ctx.fillStyle = rimColor;
  ctx.fillRect(0, 0, width, depth);

  // Add subtle rim highlight (top and left edges)
  ctx.fillStyle = isButlerSink ? '#FFFFFF' : '#E0E0E0';
  ctx.fillRect(0, 0, width, depth * 0.1); // Top edge highlight
  ctx.fillRect(0, 0, width * 0.1, depth); // Left edge highlight

  // Draw sink bowl(s) with improved shapes
  ctx.fillStyle = sinkColor;

  if (isDoubleBowl) {
    // ===== DOUBLE BOWL SINK =====
    const bowlWidth = width * 0.4;
    const bowlDepth = depth * 0.8;
    const leftBowlX = width * 0.1;
    const rightBowlX = width * 0.5;
    const bowlY = depth * 0.1;

    // Left bowl with ellipse shape
    ctx.beginPath();
    const leftBowlRadiusX = bowlWidth/2 * 0.9;
    const leftBowlRadiusY = bowlDepth/2 * 0.95;
    ctx.ellipse(
      leftBowlX + bowlWidth/2,
      bowlY + bowlDepth/2,
      leftBowlRadiusX,
      leftBowlRadiusY,
      0, 0, 2 * Math.PI
    );
    ctx.fill();

    // Left bowl inner shadow/highlight
    ctx.fillStyle = isButlerSink ? '#F0F0F0' : '#D0D0D0';
    ctx.beginPath();
    ctx.ellipse(
      leftBowlX + bowlWidth/2,
      bowlY + bowlDepth/2 - bowlDepth * 0.1,
      leftBowlRadiusX * 0.7,
      leftBowlRadiusY * 0.3,
      0, 0, 2 * Math.PI
    );
    ctx.fill();

    // Right bowl with ellipse shape
    ctx.fillStyle = sinkColor;
    ctx.beginPath();
    const rightBowlRadiusX = bowlWidth/2 * 0.9;
    const rightBowlRadiusY = bowlDepth/2 * 0.95;
    ctx.ellipse(
      rightBowlX + bowlWidth/2,
      bowlY + bowlDepth/2,
      rightBowlRadiusX,
      rightBowlRadiusY,
      0, 0, 2 * Math.PI
    );
    ctx.fill();

    // Right bowl inner shadow/highlight
    ctx.fillStyle = isButlerSink ? '#F0F0F0' : '#D0D0D0';
    ctx.beginPath();
    ctx.ellipse(
      rightBowlX + bowlWidth/2,
      bowlY + bowlDepth/2 - bowlDepth * 0.1,
      rightBowlRadiusX * 0.7,
      rightBowlRadiusY * 0.3,
      0, 0, 2 * Math.PI
    );
    ctx.fill();

    // Center divider between bowls
    ctx.fillStyle = rimColor;
    ctx.fillRect(width * 0.45, bowlY, width * 0.1, bowlDepth);

  } else if (isCornerSink) {
    // ===== CORNER SINK (L-SHAPED) =====
    const mainBowlWidth = width * 0.6;
    const mainBowlDepth = depth * 0.6;
    const mainBowlX = width * 0.2;
    const mainBowlY = depth * 0.2;

    // Main bowl with ellipse shape
    ctx.beginPath();
    const mainBowlRadiusX = mainBowlWidth/2 * 0.9;
    const mainBowlRadiusY = mainBowlDepth/2 * 0.95;
    ctx.ellipse(
      mainBowlX + mainBowlWidth/2,
      mainBowlY + mainBowlDepth/2,
      mainBowlRadiusX,
      mainBowlRadiusY,
      0, 0, 2 * Math.PI
    );
    ctx.fill();

    // Main bowl inner shadow/highlight
    ctx.fillStyle = isButlerSink ? '#F0F0F0' : '#D0D0D0';
    ctx.beginPath();
    ctx.ellipse(
      mainBowlX + mainBowlWidth/2,
      mainBowlY + mainBowlDepth/2 - mainBowlDepth * 0.1,
      mainBowlRadiusX * 0.7,
      mainBowlRadiusY * 0.3,
      0, 0, 2 * Math.PI
    );
    ctx.fill();

    // Corner extension (L-shape part)
    const cornerWidth = width * 0.3;
    const cornerDepth = depth * 0.3;
    ctx.fillStyle = sinkColor;
    ctx.fillRect(
      mainBowlX + mainBowlWidth * 0.7,
      mainBowlY + mainBowlDepth * 0.7,
      cornerWidth,
      cornerDepth
    );

    // Corner extension highlight
    ctx.fillStyle = isButlerSink ? '#F0F0F0' : '#D0D0D0';
    ctx.fillRect(
      mainBowlX + mainBowlWidth * 0.7,
      mainBowlY + mainBowlDepth * 0.7,
      cornerWidth * 0.8,
      cornerDepth * 0.8
    );

  } else {
    // ===== SINGLE BOWL SINK =====
    const bowlWidth = width * 0.7;
    const bowlDepth = depth * 0.8;
    const bowlX = width * 0.15;
    const bowlY = depth * 0.1;

    // Main bowl with ellipse shape
    ctx.beginPath();
    const bowlRadiusX = bowlWidth/2 * 0.9;
    const bowlRadiusY = bowlDepth/2 * 0.95;
    ctx.ellipse(
      bowlX + bowlWidth/2,
      bowlY + bowlDepth/2,
      bowlRadiusX,
      bowlRadiusY,
      0, 0, 2 * Math.PI
    );
    ctx.fill();

    // Bowl inner shadow/highlight
    ctx.fillStyle = isButlerSink ? '#F0F0F0' : '#D0D0D0';
    ctx.beginPath();
    ctx.ellipse(
      bowlX + bowlWidth/2,
      bowlY + bowlDepth/2 - bowlDepth * 0.1,
      bowlRadiusX * 0.7,
      bowlRadiusY * 0.3,
      0, 0, 2 * Math.PI
    );
    ctx.fill();
  }

  // ===== DRAIN HOLE =====
  ctx.fillStyle = '#2F2F2F';
  const drainSize = Math.min(width, depth) * 0.1;
  const drainX = width/2 - drainSize/2;
  const drainY = depth/2 - drainSize/2;
  ctx.beginPath();
  ctx.arc(drainX + drainSize/2, drainY + drainSize/2, drainSize/2, 0, 2 * Math.PI);
  ctx.fill();

  // ===== FAUCET MOUNTING HOLES =====
  ctx.fillStyle = '#2F2F2F';
  const holeSize = Math.min(width, depth) * 0.03;
  const holeY = depth * 0.2;

  if (isDoubleBowl) {
    // Two holes for double bowl (one above each bowl)
    ctx.beginPath();
    ctx.arc(width * 0.25, holeY, holeSize/2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.75, holeY, holeSize/2, 0, 2 * Math.PI);
    ctx.fill();
  } else {
    // Single hole for single bowl (centered)
    ctx.beginPath();
    ctx.arc(width * 0.5, holeY, holeSize/2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // ===== DRAINING BOARD (if present) =====
  if (hasDrainingBoard) {
    // Main draining board surface
    ctx.fillStyle = rimColor;
    ctx.fillRect(width * 0.05, depth * 0.65, width * 0.9, depth * 0.3);

    // Draining board highlight (top edge)
    ctx.fillStyle = isButlerSink ? '#FFFFFF' : '#E8E8E8';
    ctx.fillRect(width * 0.05, depth * 0.65, width * 0.9, depth * 0.05);

    // Draw draining board grooves (10 vertical lines)
    ctx.strokeStyle = isButlerSink ? '#E0E0E0' : '#D0D0D0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const x = width * 0.05 + (i + 0.5) * (width * 0.9) / 10;
      ctx.beginPath();
      ctx.moveTo(x, depth * 0.65);
      ctx.lineTo(x, depth * 0.95);
      ctx.stroke();

      // Add subtle shadow to grooves (offset by 0.5px)
      ctx.strokeStyle = isButlerSink ? '#D0D0D0' : '#C0C0C0';
      ctx.beginPath();
      ctx.moveTo(x + 0.5, depth * 0.65);
      ctx.lineTo(x + 0.5, depth * 0.95);
      ctx.stroke();
    }

    // Reset stroke style
    ctx.strokeStyle = '#000000';
  }
}, []);
```

### Conversion Notes for Database-Driven Handler

**Database Definition:**
```json
{
  "component_id": "butler-sink-60",
  "plan_view_type": "sink-single",
  "plan_view_data": {
    "bowl_inset_ratio": 0.15,
    "bowl_depth_ratio": 0.8,
    "bowl_style": "ceramic",
    "has_drain": true,
    "has_faucet_hole": true,
    "faucet_hole_position": 0.2,
    "has_draining_board": false
  }
}
```

**Key Algorithms to Port:**
- Bowl shape: Ellipse with 90% width ratio, 95% depth ratio
- Inner highlight: Smaller ellipse offset upward by 10%
- Rim inset: 10-15% from edges
- Drain: 10% of min(width, depth), centered
- Faucet holes: 3% of min(width, depth), at 20% depth position

---

## 2. Corner Component Detection

### Location
**File:** `src/components/designer/DesignCanvas2D.tsx`
**Multiple Locations:** Lines 113-122, 207-210, 635, 765-771, 1088, 1275-1284, and many more
**Pattern:** Repeated 40+ times throughout the file

### Purpose
Detects if a component is a corner type by checking `element.type` and `element.id` patterns.

### Code Pattern

```typescript
// Pattern used throughout the file (with variations)
const isCornerCounterTop = element.type === 'counter-top' &&
                          element.id.includes('counter-top-corner');

const isCornerWallCabinet = element.type === 'cabinet' &&
                           (element.id.includes('corner-wall-cabinet') ||
                            element.id.includes('new-corner-wall-cabinet'));

const isCornerBaseCabinet = element.type === 'cabinet' &&
                           (element.id.includes('corner-base-cabinet') ||
                            element.id.includes('l-shaped-test-cabinet'));

const isCornerTallUnit = element.type === 'cabinet' &&
                        (element.id.includes('corner-tall') ||
                         element.id.includes('corner-larder') ||
                         element.id.includes('larder-corner'));

const isCornerComponent = isCornerCounterTop ||
                         isCornerWallCabinet ||
                         isCornerBaseCabinet ||
                         isCornerTallUnit;
```

### Usage Locations

1. **Line 113-122:** Bounding box calculation
2. **Line 207-210:** Rotation center calculation
3. **Line 635:** Plan view dimensions override
4. **Line 765-774:** Wall snapping detection
5. **Line 1088:** Sink corner type detection
6. **Line 1275-1284:** Plan view rendering
7. **Line 2597-2606:** Drag preview rendering
8. **Line 2887:** Click detection
9. **Line 3040-3057:** Drag snapping
10. **Line 3138:** Touch/click detection
11. **Line 3265-3282:** Mouse drag handling
12. **Line 3409-3411:** Component library drag

### Conversion Notes for Database-Driven Handler

**Database Definition:**
```json
{
  "component_id": "corner-base-cabinet-90",
  "plan_view_type": "corner-square",
  "plan_view_data": {}
}
```

**Replacement:**
```typescript
// Instead of ID string matching:
if (element.id.includes('corner-base-cabinet')) { ... }

// Use database metadata:
const renderDef = await render2DService.get(element.component_id);
if (renderDef.plan_view_type === 'corner-square') { ... }
```

### Impact of Removal

**Lines Affected:** ~300-400 lines across the file
**Repeated Pattern:** 40+ occurrences
**Brittleness:** High (relies on ID string patterns)
**Benefits of Removal:**
- Single source of truth (database)
- Admin can mark components as corner type
- No code changes needed for new corner components
- Eliminates fragile string matching

---

## 3. Main Plan View Drawing Logic

### Location
**File:** `src/components/designer/DesignCanvas2D.tsx`
**Lines:** 1261-1356
**Function:** `drawElement()` (plan view section)

### Purpose
Main rendering function that checks component type and calls appropriate drawing logic.

### Code

```typescript
const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: DesignElement) => {
  const isSelected = selectedElement?.id === element.id;
  const isHovered = hoveredElement?.id === element.id;

  if (active2DView === 'plan') {
    // Plan view rendering - Support both color detail and wireframe overlays
    const pos = roomToCanvas(element.x, element.y);
    const width = element.width * zoom;
    const depth = (element.depth || element.height) * zoom; // Use depth for Y-axis in plan view
    const rotation = element.rotation || 0;

    ctx.save();

    // ===== CORNER COMPONENT DETECTION (TO BE REMOVED) =====
    const isCornerCounterTop = element.type === 'counter-top' &&
                              element.id.includes('counter-top-corner');
    const isCornerWallCabinet = element.type === 'cabinet' &&
                               (element.id.includes('corner-wall-cabinet') ||
                                element.id.includes('new-corner-wall-cabinet'));
    const isCornerBaseCabinet = element.type === 'cabinet' &&
                               (element.id.includes('corner-base-cabinet') ||
                                element.id.includes('l-shaped-test-cabinet'));
    const isCornerTallUnit = element.type === 'cabinet' &&
                            (element.id.includes('corner-tall') ||
                             element.id.includes('corner-larder') ||
                             element.id.includes('larder-corner'));

    const isCornerComponent = isCornerCounterTop ||
                             isCornerWallCabinet ||
                             isCornerBaseCabinet ||
                             isCornerTallUnit;

    // Apply rotation - convert degrees to radians if needed
    ctx.translate(pos.x + width / 2, pos.y + depth / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-width / 2, -depth / 2);

    // ===== COLOR DETAIL RENDERING (if enabled) =====
    if (showColorDetail) {
      // Element fill color
      if (isSelected) {
        ctx.fillStyle = '#ff6b6b';
      } else if (isHovered) {
        ctx.fillStyle = '#b0b0b0';
      } else {
        ctx.fillStyle = element.color || '#8b4513';
      }

      // ===== TYPE-SPECIFIC RENDERING (TO BE REPLACED) =====
      if (element.type === 'sink') {
        // Call sink rendering function
        drawSinkPlanView(ctx, element, width, depth, isSelected, isHovered);
      } else if (isCornerComponent) {
        // Corner components: Draw as square
        const squareSize = Math.min(element.width, element.depth) * zoom;
        ctx.fillRect(0, 0, squareSize, squareSize);
      } else {
        // Standard components: Draw as rectangle
        ctx.fillRect(0, 0, width, depth);
      }
    }

    // ===== WIREFRAME OVERLAY (if enabled) =====
    if (showWireframe) {
      ctx.strokeStyle = '#000000'; // Black wireframe outlines
      ctx.lineWidth = 0.5; // Ultra-thin lines
      ctx.setLineDash([]);

      if (isCornerComponent) {
        // Corner components: Draw as square wireframe
        const squareSize = Math.min(element.width, element.depth) * zoom;
        ctx.strokeRect(0, 0, squareSize, squareSize);
      } else {
        // Standard components: Draw as rectangular wireframe
        ctx.strokeRect(0, 0, width, depth);
      }
    }

    // ===== SELECTION OVERLAY =====
    // Red outline when selected (drawn on top of everything)
    if (isSelected) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      if (isCornerComponent) {
        const squareSize = Math.min(element.width, element.depth) * zoom;
        ctx.strokeRect(0, 0, squareSize, squareSize);
      } else {
        ctx.strokeRect(0, 0, width, depth);
      }
    }

    ctx.restore();

    // Selection handles (drawn after restore)
    if (isSelected) {
      drawSelectionHandles(ctx, element);
    }

  } else {
    // Elevation view rendering
    drawElementElevation(ctx, element, isSelected, isHovered, showWireframe);
  }
}, [active2DView, roomToCanvas, selectedElement, hoveredElement, zoom, showWireframe, showColorDetail]);
```

### Conversion Notes for Database-Driven Handler

**After Migration:**
```typescript
const drawElement = useCallback(async (ctx: CanvasRenderingContext2D, element: DesignElement) => {
  const isSelected = selectedElement?.id === element.id;
  const isHovered = hoveredElement?.id === element.id;

  if (active2DView === 'plan') {
    const pos = roomToCanvas(element.x, element.y);
    const width = element.width * zoom;
    const depth = (element.depth || element.height) * zoom;
    const rotation = element.rotation || 0;

    ctx.save();
    ctx.translate(pos.x + width / 2, pos.y + depth / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-width / 2, -depth / 2);

    if (showColorDetail) {
      // Set fill color
      if (isSelected) {
        ctx.fillStyle = '#ff6b6b';
      } else if (isHovered) {
        ctx.fillStyle = '#b0b0b0';
      } else {
        ctx.fillStyle = element.color || '#8b4513';
      }

      // DATABASE-DRIVEN RENDERING (NEW)
      const renderDef = await render2DService.get(element.component_id);
      if (renderDef) {
        ctx.fillStyle = renderDef.fill_color || ctx.fillStyle;
        renderPlanView(ctx, element, renderDef, zoom);
      } else {
        // Fallback to rectangle
        ctx.fillRect(0, 0, width, depth);
      }
    }

    // Wireframe and selection rendering (keep unchanged)
    if (showWireframe) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, 0, width, depth);
    }

    if (isSelected) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, depth);
    }

    ctx.restore();

    if (isSelected) {
      drawSelectionHandles(ctx, element);
    }

  } else {
    // Elevation view (similarly refactored)
    const renderDef = await render2DService.get(element.component_id);
    if (renderDef) {
      renderElevationView(ctx, element, renderDef, active2DView, zoom);
    }
  }
}, [active2DView, roomToCanvas, selectedElement, hoveredElement, zoom, showWireframe, showColorDetail]);
```

**Benefits:**
- ~100 lines removed
- Single database lookup replaces complex type checking
- Admin configurable via database
- Extensible without code changes

---

## 4. Elevation View Rendering

### Location
**File:** `src/components/designer/DesignCanvas2D.tsx`
**Lines:** 1383+ (extends for ~300 lines)
**Function:** `drawElementElevation()`

### Purpose
Renders component elevation views (front, back, left, right) with cabinet fronts, doors, drawers, handles, and appliance panels.

### Code Excerpt (Representative Sample)

```typescript
const drawElementElevation = (
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  isSelected: boolean,
  isHovered: boolean,
  showWireframe: boolean
) => {
  // Check if element should be visible in current elevation view
  const wall = getElementWall(element);
  const isCornerVisible = isCornerVisibleInView(element, active2DView);

  if (!isCornerVisible && wall !== active2DView && wall !== 'center') return;

  // Async preload behavior if not cached
  if (!componentBehaviorCache.has(element.type)) {
    getComponentBehavior(element.type).catch(console.warn);
  }

  // Calculate dimensions and positioning
  const elevationWidth = roomDimensions.width * zoom;
  const elevationDepth = roomDimensions.height * zoom;
  const floorY = roomPosition.innerY + (CANVAS_HEIGHT * 0.4);

  // Calculate rotation-aware dimensions
  const rotation = (element.rotation || 0) * Math.PI / 180;
  const isRotated = Math.abs(Math.sin(rotation)) > 0.1; // 90° or 270°

  let effectiveWidth: number;
  let effectiveDepth: number;

  if (isRotated) {
    effectiveWidth = element.depth || element.height;
    effectiveDepth = element.width;
  } else {
    effectiveWidth = element.width;
    effectiveDepth = element.depth || element.height;
  }

  // Position calculation based on view
  let x: number;
  if (active2DView === 'front' || active2DView === 'back') {
    x = roomPosition.innerX + (element.x * zoom);
  } else {
    x = roomPosition.innerX + (element.y * zoom);
  }

  const width = effectiveWidth * zoom;
  const height = (element.height || 90) * zoom;

  // Y position based on component type
  const behavior = componentBehaviorCache.get(element.type) || {};
  const y = behavior.wall_mounted
    ? floorY - height - (behavior.mounting_height || 60) * zoom
    : floorY - height;

  ctx.save();

  // ===== TYPE-SPECIFIC RENDERING =====

  if (element.type === 'wall-cabinet' || behavior.wall_mounted) {
    // WALL CABINET - typically 2 doors, NO toe kick
    const cornerInfo = isCornerUnit(element);
    const isCorner = cornerInfo.isCorner;
    const doorCount = isCorner ? 1 : (effectiveWidth > 60 ? 2 : 1);
    const doorWidth = isCorner ? width * 0.33 : ((width - doorInset * 2) / doorCount);

    // Cabinet body
    ctx.fillStyle = cabinetColor;
    ctx.fillRect(x, y, width, height);

    // Doors
    for (let i = 0; i < doorCount; i++) {
      const doorX = x + doorInset + (i * (doorWidth + doorGap));
      const doorY = y + doorInset;
      const doorH = height - doorInset * 2;

      // Door panel
      ctx.fillStyle = isSelected ? '#ff6b6b' : doorColor;
      ctx.fillRect(doorX, doorY, doorWidth, doorH);

      // Door handle
      const handleY = doorY + doorH / 2;
      const handleX = i === 0
        ? doorX + doorWidth - handleWidth - 2
        : doorX + 2;
      ctx.fillStyle = '#808080';
      ctx.fillRect(handleX, handleY - handleHeight/2, handleWidth, handleHeight);
    }

  } else if (element.type === 'base-cabinet' || element.type === 'cabinet') {
    // BASE CABINET - doors and possibly drawers with toe kick
    const hasDoors = true;
    const cornerInfo = isCornerUnit(element);
    const isCorner = cornerInfo.isCorner;
    const doorCount = isCorner ? 1 : (effectiveWidth > 60 ? 2 : 1);

    // Cabinet body
    ctx.fillStyle = cabinetColor;
    ctx.fillRect(x, y, width, height);

    // Toe kick
    const toeKickHeight = 10 * zoom;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, floorY - toeKickHeight, width, toeKickHeight);

    // Doors (rest of cabinet height minus toe kick)
    const doorableHeight = height - toeKickHeight;
    for (let i = 0; i < doorCount; i++) {
      const doorX = x + doorInset + (i * (doorWidth + doorGap));
      const doorY = y + doorInset;
      const doorH = doorableHeight - doorInset * 2;

      // Door panel
      ctx.fillStyle = isSelected ? '#ff6b6b' : doorColor;
      ctx.fillRect(doorX, doorY, doorWidth, doorH);

      // Handle
      const handleY = doorY + doorH / 2;
      const handleX = i === 0
        ? doorX + doorWidth - handleWidth - 2
        : doorX + 2;
      ctx.fillStyle = '#808080';
      ctx.fillRect(handleX, handleY - handleHeight/2, handleWidth, handleHeight);
    }

  } else if (element.type === 'appliance') {
    // APPLIANCE - simple panel
    ctx.fillStyle = isSelected ? '#ff6b6b' : '#808080';
    ctx.fillRect(x, y, width, height);

    // Appliance handle
    const handleY = y + height * 0.3;
    ctx.fillStyle = '#404040';
    ctx.fillRect(x + width - 4, handleY, 2, height * 0.4);

  } else if (element.type === 'sink') {
    // SINK - front panel
    drawSinkElevationDetails(ctx, x, y, width, height, element);

  } else {
    // DEFAULT - simple rectangle
    ctx.fillStyle = isSelected ? '#ff6b6b' : element.color || '#8b4513';
    ctx.fillRect(x, y, width, height);
  }

  // Wireframe overlay
  if (showWireframe) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, width, height);
  }

  // Selection outline
  if (isSelected) {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
  }

  ctx.restore();
};
```

### Conversion Notes for Database-Driven Handler

**Database Definition:**
```json
{
  "component_id": "base-cabinet-60",
  "elevation_type": "standard-cabinet",
  "elevation_data": {
    "door_count": 2,
    "door_style": "flat",
    "handle_style": "bar",
    "handle_position": "center",
    "has_toe_kick": true,
    "toe_kick_height": 10
  }
}
```

**New Handler Structure:**
```typescript
// src/services/2d-renderers/elevation-view-handlers.ts
export function renderStandardCabinet(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: StandardCabinetData,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number
): void {
  // Cabinet body
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(x, y, width, height);

  // Toe kick (if applicable)
  if (data.has_toe_kick) {
    const toeKickHeight = (data.toe_kick_height || 10) * zoom;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y + height - toeKickHeight, width, toeKickHeight);
  }

  // Doors
  const doorCount = data.door_count || 2;
  const doorInset = 2 * zoom;
  const doorGap = 2 * zoom;
  const doorWidth = (width - doorInset * 2 - doorGap * (doorCount - 1)) / doorCount;

  for (let i = 0; i < doorCount; i++) {
    const doorX = x + doorInset + i * (doorWidth + doorGap);
    const doorY = y + doorInset;
    const doorH = height - doorInset * 2;

    // Door panel
    ctx.fillStyle = '#d2b48c';
    ctx.fillRect(doorX, doorY, doorWidth, doorH);

    // Handle
    if (data.handle_style !== 'none') {
      const handleWidth = 2 * zoom;
      const handleHeight = 10 * zoom;
      const handleY = doorY + doorH / 2 - handleHeight / 2;
      const handleX = i === 0
        ? doorX + doorWidth - handleWidth - 2
        : doorX + 2;
      ctx.fillStyle = '#808080';
      ctx.fillRect(handleX, handleY, handleWidth, handleHeight);
    }
  }
}
```

---

## 5. Helper Functions

### isCornerUnit()

**Location:** Line 2365
**Purpose:** Detects if element is positioned in a room corner

```typescript
const isCornerUnit = (element: DesignElement): {
  isCorner: boolean;
  corner?: 'front-left' | 'front-right' | 'back-left' | 'back-right'
} => {
  const tolerance = 30; // cm tolerance for corner detection

  // Check each corner position
  const isFrontLeft = element.x <= tolerance && element.y <= tolerance;
  const isFrontRight = element.x >= roomDimensions.width - element.width - tolerance &&
                       element.y <= tolerance;
  const isBackLeft = element.x <= tolerance &&
                     element.y >= roomDimensions.height - (element.depth || element.height) - tolerance;
  const isBackRight = element.x >= roomDimensions.width - element.width - tolerance &&
                      element.y >= roomDimensions.height - (element.depth || element.height) - tolerance;

  if (isFrontLeft) return { isCorner: true, corner: 'front-left' };
  if (isFrontRight) return { isCorner: true, corner: 'front-right' };
  if (isBackLeft) return { isCorner: true, corner: 'back-left' };
  if (isBackRight) return { isCorner: true, corner: 'back-right' };

  return { isCorner: false };
};
```

### isCornerVisibleInView()

**Location:** Line 2413
**Purpose:** Determines if corner unit should be visible in current elevation view

```typescript
const isCornerVisibleInView = (element: DesignElement, view: string): boolean => {
  const cornerInfo = isCornerUnit(element);
  if (!cornerInfo.isCorner) return false;

  // Corner units are visible in two adjacent views
  switch (cornerInfo.corner) {
    case 'front-left':
      return view === 'front' || view === 'left';
    case 'front-right':
      return view === 'front' || view === 'right';
    case 'back-left':
      return view === 'back' || view === 'left';
    case 'back-right':
      return view === 'back' || view === 'right';
    default:
      return false;
  }
};
```

### drawSinkElevationDetails()

**Location:** Line 2213
**Purpose:** Renders sink front elevation details

```typescript
const drawSinkElevationDetails = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  element: DesignElement
) => {
  const isButlerSink = element.id.includes('butler-sink') || element.id.includes('butler');
  const isDoubleBowl = element.id.includes('double-bowl');
  const isCornerSink = element.id.includes('corner-sink');
  const isFarmhouseSink = element.id.includes('farmhouse');

  // Sink colors
  const sinkColor = isButlerSink ? '#FFFFFF' : '#C0C0C0';

  if (isFarmhouseSink) {
    // Farmhouse sink - exposed front
    const exposedHeight = height * 0.4;
    ctx.fillStyle = sinkColor;
    ctx.fillRect(x, y + height - exposedHeight, width, exposedHeight);

    // Front panel texture
    ctx.strokeStyle = isButlerSink ? '#E0E0E0' : '#B0B0B0';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const lineY = y + height - exposedHeight + (exposedHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x + width, lineY);
      ctx.stroke();
    }
  } else {
    // Under-mount sink - only visible as a panel
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x, y, width, height);
  }
};
```

---

## 6. Magic Constants

### Rendering Constants

```typescript
// Door and drawer dimensions
const doorInset = 2 * zoom;           // Space around doors
const doorGap = 2 * zoom;             // Gap between doors
const handleWidth = 2 * zoom;         // Handle width
const handleHeight = 10 * zoom;       // Handle height

// Toe kick
const toeKickHeight = 10 * zoom;      // Base cabinet toe kick height

// Colors
const cabinetColor = '#8b4513';       // Cabinet body color (saddle brown)
const doorColor = '#d2b48c';          // Door color (tan)
const handleColor = '#808080';        // Handle color (gray)
const toeKickColor = '#1a1a1a';       // Toe kick color (near black)

// Sink colors
const sinkColorStainless = '#C0C0C0'; // Stainless steel
const sinkColorCeramic = '#FFFFFF';   // Ceramic white
const rimColorStainless = '#B0B0B0';  // Stainless rim
const rimColorCeramic = '#F8F8F8';    // Ceramic rim
const drainColor = '#2F2F2F';         // Drain hole

// Sink dimensions (ratios)
const SINK_BOWL_INSET = 0.1;          // 10% inset from edge
const SINK_BOWL_DEPTH = 0.8;          // 80% of total depth
const SINK_BOWL_WIDTH = 0.7;          // 70% of total width (single)
const SINK_BOWL_WIDTH_DOUBLE = 0.4;   // 40% each (double)
const SINK_DRAIN_SIZE = 0.1;          // 10% of min(width, depth)
const SINK_HOLE_SIZE = 0.03;          // 3% of min(width, depth)

// Corner detection
const CORNER_TOLERANCE = 30;          // cm tolerance for corner position
const CORNER_SQUARE_SIZE = 90;        // Standard corner unit size (cm)

// Wall mounting
const WALL_CABINET_HEIGHT = 60;       // Default mounting height (cm)
const WALL_SNAP_TOLERANCE = 15;       // Wall snapping tolerance (cm)
```

### Conversion to Database

These constants should become default values in database definitions:

```json
{
  "component_id": "base-cabinet-60",
  "elevation_data": {
    "door_inset": 2,
    "door_gap": 2,
    "handle_width": 2,
    "handle_height": 10,
    "toe_kick_height": 10,
    "cabinet_color": "#8b4513",
    "door_color": "#d2b48c",
    "handle_color": "#808080"
  }
}
```

---

## Summary of Legacy Code to Remove

### Total Lines by Category

| Category | Lines | Files |
|----------|-------|-------|
| Sink Rendering | 173 | DesignCanvas2D.tsx:1085-1258 |
| Corner Detection | ~300 | DesignCanvas2D.tsx (40+ locations) |
| Main Drawing Logic | ~100 | DesignCanvas2D.tsx:1261-1356 |
| Elevation Rendering | ~300 | DesignCanvas2D.tsx:1383+ |
| Helper Functions | ~200 | DesignCanvas2D.tsx (various) |
| Magic Constants | ~50 | DesignCanvas2D.tsx (various) |
| **TOTAL** | **~1123** | |

### Replacement Components

**New Services:**
- `src/services/Render2DService.ts` - Caching and database access (~150 lines)
- `src/services/2d-renderers/plan-view-handlers.ts` - Plan view handlers (~300 lines)
- `src/services/2d-renderers/elevation-view-handlers.ts` - Elevation handlers (~300 lines)
- `src/services/2d-renderers/index.ts` - Main render dispatcher (~50 lines)

**Total New Code:** ~800 lines (reusable, testable, maintainable)

**Net Reduction:** ~323 lines (29% reduction)
**Complexity Reduction:** Massive (data-driven vs. code-driven)

---

## Usage Guidelines

### When to Reference This Document

1. **During Implementation** - Port rendering algorithms to new handlers
2. **During Testing** - Ensure new handlers match legacy behavior
3. **During Debugging** - Compare old vs. new rendering logic
4. **For Historical Context** - Understand evolution of the system

### When NOT to Use This Code

1. **New Features** - Always use database-driven handlers
2. **Bug Fixes** - Fix in new system, not legacy code
3. **Active Development** - This code is frozen and will be removed

---

**Document Status:** ✅ COMPLETE
**Last Updated:** 2025-10-09
**Archive Purpose:** Reference and historical record
**Removal Timeline:** After Phase 5 of migration (Week 4-5)

**⚠️ IMPORTANT:** This code is archived for reference only. Do not modify or use for active development. All new 2D rendering should use the database-driven hybrid system.
