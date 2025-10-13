# Logic Audit: Positioning, Rotation, Bounding, Snapping & Auto-Placement

**Date:** 2025-10-13
**Branch:** feature/coordinate-system-setup
**Purpose:** Comprehensive audit of all positioning, rotation, bounding box, snapping, and auto-placement logic to identify duplications, conflicts, and inconsistencies

---

## Executive Summary

### 🔴 **CRITICAL FINDINGS - SIGNIFICANT DUPLICATION**

**3 Separate Coordinate/Positioning Systems Found:**
1. **CoordinateTransformEngine** - Unified system (NEW, partially implemented)
2. **PositionCalculation** - Legacy vs New with feature flag (TRANSITION)
3. **DesignCanvas2D inline logic** - Original implementation (LEGACY, still primary)

**Multiple Snapping Implementations:**
- `getSnapPosition()` in DesignCanvas2D (primary, ~200 lines)
- `calculateWallSnapping()` in canvasCoordinateIntegration
- Different threshold values across systems

**Multiple Rotation Logic Locations:**
- Corner rotation in `getSnapPosition()` (DesignCanvas2D)
- Corner rotation in `calculateCornerPlacement()` (canvasCoordinateIntegration)
- **CONFLICT:** Different rotation angles used!

**Multiple Bounding Box Calculations:**
- `getRotatedBoundingBox()` in DesignCanvas2D
- Implicit calculations in snap logic
- Multiple corner component detections

---

## Part 1: Coordinate Transform Systems

### System 1: CoordinateTransformEngine ✨ (NEW - Unified System)

**File:** `src/services/CoordinateTransformEngine.ts` (267 lines)

**Status:** 🟡 Partially Implemented / Not Used Everywhere

**Purpose:** Unified coordinate transformation between 2D plan, 3D world, and elevation views

**Key Features:**
- **Origin:** (0,0) = inner room corner (usable space)
- **Room dimensions = inner space** (wall thickness separate)
- **Transformations:**
  - `planToWorld()` - 2D plan → 3D world (centers at 0,0,0)
  - `worldToPlan()` - 3D world → 2D plan
  - `planToElevation()` - 2D plan → elevation views (4 walls)
  - `elevationToPlan()` - Elevation → 2D plan
- **Validation:** `validatePlanCoordinates()` checks bounds
- **Singleton pattern** with global instance

**Coordinate Conventions:**
```typescript
// Plan View (2D)
PlanCoordinates: {
  x: 0 to roomWidth,   // Horizontal (left to right)
  y: 0 to roomHeight,  // Depth (front to back)
  z: 0 to ceilingHeight // Height (floor to ceiling)
}

// World View (3D)
WorldCoordinates: {
  x: centered at 0,  // Horizontal (±roomWidth/2)
  y: height,         // Vertical (0 to ceilingHeight)
  z: centered at 0   // Depth (±roomHeight/2)
}

// Elevation View (2D per wall)
ElevationCoordinates: {
  x: along wall,     // Horizontal position on wall
  y: height on wall  // Vertical position on wall
}
```

**Wall Type Mapping:**
- Front: `x: coords.x, y: coords.z`
- Back: `x: innerWidth - coords.x` (mirrored)
- Left: `x: innerHeight - coords.y` (mirrored)
- Right: `x: coords.y` (direct)

**Usage:**
- Initialized with `initializeCoordinateEngine(roomDimensions)`
- Global singleton via `getCoordinateEngine()`
- **⚠️ NOT consistently used** across codebase

---

### System 2: PositionCalculation 🔄 (TRANSITION - Feature Flag)

**File:** `src/utils/PositionCalculation.ts` (383 lines)

**Status:** 🟡 Feature-Flagged Transition (Legacy + New)

**Purpose:** Calculate element positions in elevation views with support for both legacy and new coordinate systems

**Feature Flag:** `use_new_positioning_system` (default: false/legacy)

**Critical Issue It Fixes:**
```typescript
// ❌ LEGACY PROBLEM:
// Left wall: flipped Y coordinate
xPos = innerX + ((roomHeight - element.y - depth) / roomHeight) * elevationDepth;

// Right wall: direct Y coordinate
xPos = innerX + (element.y / roomHeight) * elevationDepth;

// ⚠️ ASYMMETRY! Same element appears at different positions on left vs right walls
```

**Solution:**
```typescript
// ✅ NEW SYSTEM: Unified coordinate mapping for both walls
const normalizedPosition = element.y / roomHeight;
xPos = innerX + normalizedPosition * elevationDepth;

// Mirror rendering for left wall (at render time, not coordinate time)
if (view === 'left') {
  const center = innerX + elevationDepth / 2;
  const distanceFromCenter = xPos - center;
  xPos = center - distanceFromCenter - elementWidth;
}
```

**Two Implementations:**
1. **`calculateElevationPositionLegacy()`** - Exact copy from DesignCanvas2D lines 1377-1405
2. **`calculateElevationPositionNew()`** - Unified system

**Room Position Calculation:**
1. **`calculateRoomPositionLegacy()`** - Different logic for plan vs elevation
2. **`calculateRoomPositionNew()`** - Unified top-center alignment

**Current State:**
- Feature flag **disabled by default** (using legacy)
- New system implemented but not enabled
- **⚠️ Legacy code still primary**

---

### System 3: DesignCanvas2D Inline Logic 🔒 (LEGACY - Primary)

**File:** `src/components/designer/DesignCanvas2D.tsx` (2900+ lines)

**Status:** 🔴 Active / Primary System (Legacy)

**Positioning Logic Locations:**

#### A. **Element Elevation Positioning** (lines 1377-1405)
```typescript
// Front/back walls
xPos = roomPosition.innerX + (element.x / roomDimensions.width) * elevationWidth;

// Left wall (flipped)
const flippedY = roomDimensions.height - element.y - effectiveDepth;
xPos = roomPosition.innerX + (flippedY / roomDimensions.height) * elevationDepth;

// Right wall (direct)
xPos = roomPosition.innerX + (element.y / roomDimensions.height) * elevationDepth;
```

#### B. **Room Position Calculation** (lines 472-502)
```typescript
if (view === 'left' || view === 'right') {
  // Top-center based on room depth and wall height
  const wallHeight = getWallHeight();
  const roomDepth = roomDimensions.height;
  return {
    outerX: (canvasWidth / 2) - (roomDepth * zoom / 2) + panOffset.x,
    outerY: topMargin + panOffset.y,
    innerX: (canvasWidth / 2) - (roomDepth * zoom / 2) + panOffset.x,
    innerY: topMargin + panOffset.y
  };
} else {
  // Plan, Front, Back views: top-center alignment
  const innerX = (canvasWidth / 2) - (innerRoomBounds.width * zoom / 2) + panOffset.x;
  const innerY = topMargin + panOffset.y;
  return {
    outerX: innerX - wallThicknessPx,
    outerY: innerY - wallThicknessPx,
    innerX: innerX,
    innerY: innerY
  };
}
```

**This is EXACTLY what PositionCalculation.calculateElevationPositionLegacy() copied!**

---

## Part 2: Snapping Logic

### Implementation 1: DesignCanvas2D `getSnapPosition()` 🔴 (PRIMARY)

**File:** `src/components/designer/DesignCanvas2D.tsx` (lines 702-1002)
**Size:** ~300 lines of complex logic

**Responsibilities:**
1. Wall snapping (4 walls)
2. Component-to-component snapping
3. Corner detection
4. Rotation calculation
5. Snap guide generation

**Snap Thresholds:**
- Counter-tops: `configCache.snap_tolerance_countertop || 25` cm
- Other components: `configCache.snap_tolerance_default || 15` cm
- Wall snap distance: `configCache.wall_snap_distance || 40` cm

**Wall Snapping Logic:**
```typescript
const distToLeft = snappedX;
const distToRight = roomDimensions.width - (snappedX + elementWidth);
const distToTop = snappedY;
const distToBottom = roomDimensions.height - (snappedY + elementDepth);

const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

if (minDist <= wallSnapDistance) {
  if (distToLeft === minDist) {
    snappedX = 0;
    rotation = 0; // Face right (into room)
  }
  else if (distToRight === minDist) {
    snappedX = roomDimensions.width - elementWidth;
    rotation = 180; // Face left (into room)
  }
  // ... similar for top/bottom
}
```

**Corner Detection Logic:**
```typescript
const isNearTopLeft = x <= 60 && y <= 60;
const isNearTopRight = x >= (roomDimensions.width - 60) && y <= 60;
const isNearBottomLeft = x <= 60 && y >= (roomDimensions.height - 60);
const isNearBottomRight = x >= (roomDimensions.width - 60) && y >= (roomDimensions.height - 60);

// Different rotations for corner placement
if (isNearTopLeft) {
  snappedX = 0;
  snappedY = 0;
  rotation = 0; // Top-left corner
}
```

**Component Snapping:**
- Iterates through all elements
- Calculates distances to edges
- Snaps if within tolerance
- Generates snap guides (vertical/horizontal lines)

**Used By:**
- `handleMouseUp()` - drag end
- `handleTouchEnd()` - touch drag end
- `handleDrop()` - component drop from sidebar
- `drawDragPreview()` - real-time preview

**Status:** 🔴 Primary snapping system, actively used

---

### Implementation 2: canvasCoordinateIntegration `calculateWallSnapping()` 🟡 (SECONDARY)

**File:** `src/utils/canvasCoordinateIntegration.ts` (lines 199-276)
**Size:** ~80 lines

**Responsibilities:**
1. Wall snapping only (no component snapping)
2. Simpler logic
3. Wall clearance enforcement

**Snap Threshold:**
- Fixed: `40` cm (hardcoded)

**Wall Snapping Logic:**
```typescript
const leftWallDistance = dropX;
const rightWallDistance = roomBounds.width - (dropX + width);
const topWallDistance = dropY;
const bottomWallDistance = roomBounds.height - (dropY + depth);

if (leftWallDistance <= snapThreshold && leftWallDistance >= 0) {
  snappedX = bounds.minX;
  rotation = 0; // Face into room (right)
}
else if (rightWallDistance <= snapThreshold && rightWallDistance >= 0) {
  snappedX = bounds.maxX;
  rotation = 180; // Face into room (left)
}
// ... similar for top/bottom
```

**Used By:**
- `getEnhancedComponentPlacement()` - called during drop handling
- **⚠️ May conflict with getSnapPosition()!**

**Status:** 🟡 Secondary system, partially used

---

### CONFLICTS & DUPLICATIONS:

**1. Threshold Mismatch:**
- DesignCanvas2D: `40cm` (configurable via database)
- canvasCoordinateIntegration: `40cm` (hardcoded)
- **Issue:** Changes to config don't affect enhanced placement

**2. Different Snap Logic:**
- DesignCanvas2D: Finds closest wall using `Math.min()`
- canvasCoordinateIntegration: Checks each wall individually
- **Issue:** May snap differently in edge cases

**3. Rotation Values:**
- Both use: 0°, 90°, 180°, 270°
- **✅ Consistent** for non-corner components

**4. No Component-to-Component in Integration:**
- DesignCanvas2D: Has component snapping
- canvasCoordinateIntegration: Walls only
- **Issue:** Enhanced placement misses component alignment

---

## Part 3: Corner Rotation Logic

### Implementation 1: DesignCanvas2D `getSnapPosition()` 🔴 (PRIMARY)

**Location:** Lines 794-830

**Corner Detection:**
```typescript
const isNearTopLeft = x <= 60 && y <= 60;
const isNearTopRight = x >= (roomDimensions.width - 60) && y <= 60;
const isNearBottomLeft = x <= 60 && y >= (roomDimensions.height - 60);
const isNearBottomRight = x >= (roomDimensions.width - 60) && y >= (roomDimensions.height - 60);
```

**Corner Rotations:**
```typescript
if (isNearTopLeft) {
  rotation = 0;      // Top-left
}
else if (isNearTopRight) {
  rotation = -90;    // Top-right (90° clockwise)
}
else if (isNearBottomRight) {
  rotation = -180;   // Bottom-right (180° clockwise)
}
else if (isNearBottomLeft) {
  rotation = -270;   // Bottom-left (270° clockwise)
}
```

**Used For:** All corner component placement during drag/drop

---

### Implementation 2: canvasCoordinateIntegration `calculateCornerPlacement()` 🟡 (SECONDARY)

**Location:** Lines 123-193

**Corner Detection:**
```typescript
const cornerThreshold = 60;

const corners = [
  {
    name: 'top-left',
    condition: dropX <= cornerThreshold && dropY <= cornerThreshold,
    rotation: 0
  },
  {
    name: 'top-right',
    condition: dropX >= (roomBounds.width - cornerThreshold) && dropY <= cornerThreshold,
    rotation: -270  // ❌ DIFFERENT FROM IMPLEMENTATION 1!
  },
  {
    name: 'bottom-right',
    condition: dropX >= (roomBounds.width - cornerThreshold) && dropY >= (roomBounds.height - cornerThreshold),
    rotation: -180
  },
  {
    name: 'bottom-left',
    condition: dropX <= cornerThreshold && dropY >= (roomBounds.height - cornerThreshold),
    rotation: -90   // ❌ DIFFERENT FROM IMPLEMENTATION 1!
  }
];
```

**Used For:** Enhanced component placement via `getEnhancedComponentPlacement()`

---

### 🔴 **CRITICAL CONFLICT: Different Rotation Values!**

| Corner | DesignCanvas2D | canvasCoordinateIntegration | Conflict? |
|--------|----------------|---------------------------|-----------|
| Top-Left | 0° | 0° | ✅ Match |
| Top-Right | -90° | -270° | ❌ **CONFLICT!** |
| Bottom-Right | -180° | -180° | ✅ Match |
| Bottom-Left | -270° | -90° | ❌ **CONFLICT!** |

**Impact:**
- Corner cabinets may face different directions depending on which code path is used
- Drop from sidebar may differ from drag-and-drop
- **User-visible bug!**

**Root Cause:**
- Comments in canvasCoordinateIntegration suggest these were "SWAPPED" (line 156, 168)
- Looks like attempted fix that wasn't replicated to DesignCanvas2D

---

## Part 4: Bounding Box Calculations

### Implementation 1: `getRotatedBoundingBox()` in DesignCanvas2D 🔴 (PRIMARY)

**Location:** Lines 117-203

**Purpose:** Calculate axis-aligned bounding box for rotated components

**Logic:**
```typescript
const getRotatedBoundingBox = (element: DesignElement) => {
  const rotation = (element.rotation || 0) * Math.PI / 180; // Convert to radians

  // Detect corner components
  const isCornerComponent = isCornerCounterTop || isCornerWallCabinet ||
                           isCornerBaseCabinet || isCornerTallUnit;

  if (isCornerComponent) {
    // Use ACTUAL dimensions (no longer hardcoded 90x90)
    const width = element.width;
    const height = element.depth || element.height;
    const centerX = element.x + width / 2;
    const centerY = element.y + height / 2;

    // Calculate 4 corners of L-shape
    // Rotate each corner around center
    // Find min/max X and Y
    // ...complex math for L-shaped bounding box
  } else {
    // Standard rectangular bounding box
    const width = element.width;
    const height = element.depth || element.height;

    // Calculate rotated corners
    const corners = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height }
    ];

    // Rotate around center
    // Find min/max
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
};
```

**Used For:**
- Selection handles drawing
- Click detection (is mouse inside element?)
- Element overlap detection

**Corner Component Detection:**
```typescript
const isCornerCounterTop = element.type === 'counter-top' && element.id.includes('counter-top-corner');
const isCornerWallCabinet = element.type === 'cabinet' && (element.id.includes('corner-wall-cabinet') || element.id.includes('new-corner-wall-cabinet'));
const isCornerBaseCabinet = element.type === 'cabinet' && element.id.includes('corner-base-cabinet');
const isCornerTallUnit = element.type === 'cabinet' && (element.id.includes('corner-tall') || element.id.includes('corner-larder') || element.id.includes('larder-corner'));
```

**Status:** 🔴 Primary bounding box system

---

### Implementation 2: Implicit Calculations in Snap Logic

**Location:** Multiple places in `getSnapPosition()`

**Examples:**
```typescript
// Wall distance calculations (implicit bounding)
const distToLeft = snappedX;
const distToRight = roomDimensions.width - (snappedX + elementWidth);
const distToTop = snappedY;
const distToBottom = roomDimensions.height - (snappedY + elementDepth);

// Component distance calculations
const compRight = comp.x + comp.width;
const compBottom = comp.y + comp.depth;
const elementRight = x + elementWidth;
const elementBottom = y + elementDepth;

// Edge distances
const distToCompLeft = Math.abs(x - comp.x);
const distToCompRight = Math.abs(elementRight - compRight);
// ... etc
```

**Used For:**
- Snapping calculations
- Component alignment
- **⚠️ Doesn't account for rotation!**

**Status:** 🟡 Supplementary calculations

---

### DUPLICATIONS & ISSUES:

**1. Corner Component Detection Repeated:**
- In `getRotatedBoundingBox()`
- In `getSnapPosition()`
- In `canvasCoordinateIntegration.isCornerComponent()`
- **Solution:** Centralize to utility function

**2. Rotation Not Always Considered:**
- Bounding box accounts for rotation
- Snap distance calculations don't
- **Issue:** Rotated components may snap incorrectly

**3. L-Shape Complexity:**
- Complex math for L-shaped bounding boxes
- Repeated in multiple places
- **Risk:** Hard to maintain, easy to introduce bugs

---

## Part 5: Auto-Placement & Enhanced Placement

### Implementation 1: Enhanced Placement via `getEnhancedComponentPlacement()` 🟡

**File:** `src/utils/canvasCoordinateIntegration.ts` (lines 318-353)

**Purpose:** Wrapper function for drag-and-drop placement from sidebar

**Flow:**
```typescript
export const getEnhancedComponentPlacement = (
  dropX, dropY,
  componentWidth, componentDepth,
  componentId, componentType,
  roomDimensions
) => {
  try {
    // Initialize coordinate engine
    const coordinateEngine = getCoordinateEngine(roomDimensions);
    const integrator = new CanvasCoordinateIntegrator(coordinateEngine);

    // Calculate placement
    return integrator.calculateComponentPlacement({
      dropX, dropY,
      componentWidth, componentDepth,
      componentId, componentType
    });
  } catch (error) {
    // Fallback to basic placement
    return {
      x: Math.max(5, Math.min(roomDimensions.width - componentWidth - 5, dropX)),
      y: Math.max(5, Math.min(roomDimensions.height - componentDepth - 5, dropY)),
      rotation: 0,
      snappedToWall: false,
      corner: null,
      withinBounds: true
    };
  }
};
```

**Used By:**
- `DesignCanvas2D.handleDrop()` (line 2695)

**Integration:**
```typescript
// In handleDrop:
const placementResult = getEnhancedComponentPlacement(
  dropX, dropY,
  effectiveWidth, effectiveDepth,
  componentData.id,
  componentData.type,
  design.roomDimensions
);

// Then applies snapToGrid if not wall-snapped
x: placementResult.snappedToWall ? placementResult.x : snapToGrid(placementResult.x),
y: placementResult.snappedToWall ? placementResult.y : snapToGrid(placementResult.y),
```

**Status:** 🟡 Used for sidebar drops, but then `getSnapPosition()` is ALSO called (line 2742)!

---

### Implementation 2: Direct Snapping via `getSnapPosition()` 🔴

**Used By:**
- All drag-and-drop movements (line 2286, 2518)
- Component drops (line 2742)
- Real-time preview (line 1831)

**⚠️ DUPLICATION:**
```typescript
// Line 2742 in handleDrop (AFTER enhanced placement):
const snapped = getSnapPosition(newElement, newElement.x, newElement.y);
newElement.x = snapped.x;
newElement.y = snapped.y;
newElement.rotation = snapped.rotation;
```

**Issue:**
1. Enhanced placement calculates position
2. Then `getSnapPosition()` recalculates AGAIN
3. May override enhanced placement decisions
4. Double computation, possible conflicts

---

## Part 6: Grid Snapping

### Implementation: `snapToGrid()` in DesignCanvas2D 🔴

**Location:** Lines 678-681

**Logic:**
```typescript
const snapToGrid = useCallback((value: number) => {
  const gridSizeInRoom = GRID_SIZE / zoom;
  return Math.round(value / gridSizeInRoom) * gridSizeInRoom;
}, [zoom]);
```

**Grid Size:** `GRID_SIZE = 20` pixels (constant)

**When Applied:**
```typescript
// Only if NOT snapped to wall/component
const isWallSnapped = snapped.guides.vertical.length > 0 || snapped.guides.horizontal.length > 0;
if (!isWallSnapped) {
  finalX = snapToGrid(snapped.x);
  finalY = snapToGrid(snapped.y);
}
```

**Status:** ✅ Single implementation, consistent usage

---

## Part 7: Summary of Duplications

### 🔴 Critical Duplications

| Logic Type | Implementations | Primary | Conflicts? |
|------------|----------------|---------|------------|
| **Coordinate Transform** | 3 systems | CoordinateTransformEngine (intended) / DesignCanvas2D (actual) | ⚠️ Not unified |
| **Elevation Positioning** | 2 (legacy + new) | Legacy (feature-flagged) | ⚠️ Different results |
| **Wall Snapping** | 2 independent | DesignCanvas2D | ⚠️ Different thresholds |
| **Corner Rotation** | 2 implementations | DesignCanvas2D | ❌ **Different angles!** |
| **Corner Detection** | 3 locations | Multiple | ⚠️ Repeated logic |
| **Bounding Box** | 1 explicit + implicit | getRotatedBoundingBox() | ⚠️ Rotation not always considered |
| **Auto-Placement** | 2 sequential | Both used! | ⚠️ Double calculation |
| **Grid Snapping** | 1 implementation | snapToGrid() | ✅ Clean |

---

## Part 8: Detailed Issue List

### Issue 1: Three Coordinate Systems (HIGH PRIORITY)

**Problem:** Three different systems for coordinate transformation
- CoordinateTransformEngine - intended unified system
- PositionCalculation - transition with feature flag
- DesignCanvas2D inline - actual primary system

**Impact:**
- Maintenance nightmare
- Difficult to understand flow
- Changes must be replicated 3 times
- Feature flag not enabled means new system unused

**Recommendation:**
1. Enable `use_new_positioning_system` feature flag
2. Test new system thoroughly
3. Remove legacy implementations
4. Migrate all code to use CoordinateTransformEngine

**Estimated Effort:** 2-3 days

---

### Issue 2: Corner Rotation Conflict (CRITICAL BUG)

**Problem:** Top-right and bottom-left corners have different rotations in two systems

| Corner | DesignCanvas2D | canvasCoordinateIntegration |
|--------|----------------|---------------------------|
| Top-Right | -90° | -270° |
| Bottom-Left | -270° | -90° |

**Impact:**
- Corner cabinets face wrong direction depending on code path
- Sidebar drop vs drag may produce different results
- User-visible bug

**Recommendation:**
1. Determine correct rotation values (test which works)
2. Update both implementations to match
3. Consolidate corner logic to single function

**Estimated Effort:** 2-3 hours

---

### Issue 3: Double Snapping Calculation (PERFORMANCE)

**Problem:** Component drops calculate snap position twice
1. `getEnhancedComponentPlacement()` (line 2695)
2. `getSnapPosition()` (line 2742)

**Impact:**
- Wasted CPU cycles
- Possible conflicts if they disagree
- Confusing code flow

**Recommendation:**
1. Choose one snapping system
2. Remove redundant calculation
3. Or: Enhanced placement returns early if confident, else call getSnapPosition

**Estimated Effort:** 1 hour

---

### Issue 4: Snap Threshold Inconsistency (MINOR)

**Problem:** Wall snap thresholds differ
- DesignCanvas2D: `configCache.wall_snap_distance || 40`
- canvasCoordinateIntegration: `40` (hardcoded)

**Impact:**
- Database config changes don't affect enhanced placement
- Inconsistent snap behavior

**Recommendation:**
1. Load config value in enhanced placement
2. Or: Remove enhanced placement wall snapping (use only getSnapPosition)

**Estimated Effort:** 30 minutes

---

### Issue 5: Corner Detection Duplication (MINOR)

**Problem:** Corner component detection repeated in 3+ places

**Locations:**
- `getRotatedBoundingBox()` lines 121-130
- `getSnapPosition()` (implicit in corner checks)
- `canvasCoordinateIntegration.isCornerComponent()` lines 281-286

**Impact:**
- If logic changes, must update all locations
- Risk of inconsistency

**Recommendation:**
1. Create `isCornerComponent(element)` utility function
2. Use consistently across codebase

**Estimated Effort:** 30 minutes

---

### Issue 6: Rotation Not Considered in Snap (MODERATE)

**Problem:** Snap distance calculations don't account for rotation

**Example:**
```typescript
// This assumes rectangle, doesn't account for rotation
const distToLeft = snappedX;
const distToRight = roomDimensions.width - (snappedX + elementWidth);
```

**Impact:**
- Rotated components may snap incorrectly
- Bounding box mismatch

**Recommendation:**
1. Use `getRotatedBoundingBox()` before snap calculations
2. Or: Calculate effective footprint based on rotation

**Estimated Effort:** 2-3 hours

---

### Issue 7: Feature Flag Disabled (HIGH PRIORITY)

**Problem:** New positioning system exists but is disabled by default

**Feature Flag:** `use_new_positioning_system = false`

**Impact:**
- All development effort on new system is unused
- Legacy bugs remain
- Left/right wall asymmetry not fixed

**Recommendation:**
1. Enable feature flag
2. Test thoroughly (especially elevation views)
3. If stable, remove legacy code

**Estimated Effort:** 1 day testing + fixes

---

## Part 9: Recommendations

### Immediate Actions (High Priority)

1. **Fix Corner Rotation Conflict** (2-3 hours)
   - Determine correct rotation angles
   - Update both implementations
   - Test all 4 corners

2. **Enable New Positioning System** (1 day)
   - Set `use_new_positioning_system = true`
   - Test all elevation views
   - Fix any issues found

3. **Remove Double Snapping** (1 hour)
   - Choose primary snapping system
   - Remove redundant call
   - Verify drop behavior unchanged

### Short-Term Actions (1-2 weeks)

4. **Consolidate Coordinate Systems** (2-3 days)
   - Migrate all code to use CoordinateTransformEngine
   - Remove PositionCalculation once stable
   - Update DesignCanvas2D to use engine

5. **Centralize Corner Detection** (30 minutes)
   - Create utility function
   - Replace all instances
   - Add unit tests

6. **Fix Rotation in Snap Logic** (2-3 hours)
   - Use bounding box in snap calculations
   - Handle rotated components correctly
   - Test with various rotations

### Long-Term Actions (Backlog)

7. **Refactor DesignCanvas2D** (1-2 weeks)
   - Extract positioning logic to services
   - Extract snapping logic to utilities
   - Extract rendering logic to renderers
   - **Goal:** Reduce from 2900+ lines to <1000

8. **Performance Optimization** (3-5 days)
   - Profile snap calculations
   - Optimize bounding box math
   - Cache geometry calculations
   - Reduce redundant computations

9. **Comprehensive Testing** (1 week)
   - Unit tests for all positioning logic
   - Integration tests for snap behavior
   - E2E tests for drag-and-drop
   - Visual regression tests

---

## Part 10: Migration Path to Unified System

### Phase 1: Stabilize (1-2 days)
1. Fix corner rotation conflict
2. Enable new positioning feature flag
3. Test all views thoroughly
4. Keep legacy as fallback

### Phase 2: Consolidate Snapping (2-3 days)
1. Choose primary snapping system (recommend: keep DesignCanvas2D getSnapPosition for now)
2. Remove enhanced placement wall snapping (keep only corner detection)
3. Remove double snapping calculation
4. Update snap thresholds to be consistent

### Phase 3: Adopt Coordinate Engine (1 week)
1. Update DesignCanvas2D to use CoordinateTransformEngine for all transforms
2. Remove inline coordinate calculations
3. Keep PositionCalculation as adapter if needed
4. Extensive testing

### Phase 4: Extract to Services (1-2 weeks)
1. Create SnappingService
2. Create BoundingBoxService
3. Create PlacementService
4. Refactor DesignCanvas2D to use services
5. Reduce DesignCanvas2D size significantly

### Phase 5: Remove Legacy (3-5 days)
1. Remove feature flag (new system proven)
2. Remove PositionCalculation legacy methods
3. Remove inline calculations
4. Cleanup and documentation

---

## Part 11: Critical Paths to Test

Once changes are made, test these specific scenarios:

### Corner Placement Tests
- [ ] Drop corner cabinet in top-left → should face bottom-right
- [ ] Drop corner cabinet in top-right → should face bottom-left
- [ ] Drop corner cabinet in bottom-right → should face top-left
- [ ] Drop corner cabinet in bottom-left → should face top-right
- [ ] Verify L-shape opens toward room center in all 4 corners

### Wall Snapping Tests
- [ ] Drag cabinet close to left wall → snaps and faces right
- [ ] Drag cabinet close to right wall → snaps and faces left
- [ ] Drag cabinet close to front wall → snaps and faces back
- [ ] Drag cabinet close to back wall → snaps and faces front
- [ ] Verify 5cm clearance maintained

### Elevation View Tests
- [ ] Place cabinet on left wall in plan view → verify appears correctly in left elevation
- [ ] Place cabinet on right wall in plan view → verify appears correctly in right elevation
- [ ] Place cabinet on front wall in plan view → verify appears correctly in front elevation
- [ ] Place cabinet on back wall in plan view → verify appears correctly in back elevation
- [ ] Verify left/right wall elements appear at consistent positions

### Rotation Tests
- [ ] Rotate cabinet 0° → verify bounding box correct
- [ ] Rotate cabinet 90° → verify bounding box correct
- [ ] Rotate cabinet 180° → verify bounding box correct
- [ ] Rotate cabinet 270° → verify bounding box correct
- [ ] Verify rotated cabinets snap correctly to walls

### Component Snapping Tests
- [ ] Drag cabinet next to existing cabinet → snaps to align edges
- [ ] Drag counter-top next to existing counter → snaps to join
- [ ] Verify snap guides appear (green lines)
- [ ] Verify snap tolerance works (within 15cm)

---

## Appendix A: File Reference

### Coordinate & Positioning Files
- `src/services/CoordinateTransformEngine.ts` (267 lines) - Unified system
- `src/utils/PositionCalculation.ts` (383 lines) - Legacy vs New
- `src/utils/canvasCoordinateIntegration.ts` (353 lines) - Enhanced placement
- `src/utils/coordinateSystemDemo.ts` - Demo/testing

### Main Canvas File
- `src/components/designer/DesignCanvas2D.tsx` (2900+ lines) - Primary system

### Helper Files
- `src/utils/GeometryUtils.ts` - Geometry calculations
- `src/utils/GeometryBuilder.ts` - Room geometry building
- `src/utils/GeometryValidator.ts` - Validation logic
- `src/types/RoomGeometry.ts` - Type definitions

---

## Appendix B: Constants Used

### Snap Thresholds
- Wall snap: `40cm` (configurable in DesignCanvas2D, hardcoded in integration)
- Component snap (default): `15cm` (configurable)
- Component snap (counter-top): `25cm` (configurable)
- Corner detection: `60cm` (hardcoded both places)
- Wall clearance: `5cm` (hardcoded)

### Canvas Constants
- Canvas size: `1600 x 1200` pixels
- Grid size: `20` pixels
- Wall thickness: `10cm`
- Min zoom: `0.5x`
- Max zoom: `4.0x`

### Rotation Angles
- 0° - Face right (default)
- 90° or -270° - Face down
- 180° or -180° - Face left
- 270° or -90° - Face up
- **⚠️ Negative values used for clockwise rotation**

---

## Conclusion

**Overall Assessment:** 🔴 **Significant duplication and conflicts found**

**Critical Issues:**
1. Three coordinate systems (only one should exist)
2. Corner rotation conflict (user-visible bug)
3. Feature flag disabled (new system unused)
4. Double snapping calculation (performance + conflict risk)

**Estimated Total Cleanup Effort:** 2-4 weeks for full consolidation

**Recommended Priority:**
1. Fix corner rotation bug (2-3 hours) - **DO FIRST**
2. Enable new positioning system (1 day) - **DO SECOND**
3. Remove double snapping (1 hour) - **DO THIRD**
4. Then: Long-term consolidation plan

**Next Steps:**
1. User review and approval of recommendations
2. Fix corner rotation conflict
3. Enable and test new positioning system
4. Begin incremental consolidation

---

**Document Status:** Complete
**Last Updated:** 2025-10-13
**Related Documents:**
- SINGLE_SOURCE_OF_TRUTH_AUDIT.md - Database audit
- ROOM_DATA_AUDIT_AND_DIMENSION_IMPACT.md - Room data audit
- coordinate system documentation (to be created after fixes)
