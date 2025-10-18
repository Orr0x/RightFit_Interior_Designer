# Phase 4 Plan: 2D Rendering Support for Complex Room Shapes

**Date:** 2025-10-10
**Phase:** 4 of 6 - 2D Rendering Support
**Status:** 📋 **PLANNING**
**Estimated Duration:** 2 weeks (Weeks 8-9)
**Complexity:** 🟡 MEDIUM

---

## Executive Summary

Phase 4 extends the 2D plan view and elevation view systems to support complex room geometries (L-shaped, U-shaped, custom polygons). Currently, the 2D canvas assumes simple rectangular rooms. This phase updates:

1. **Plan View** - Draw polygon room outlines instead of rectangles
2. **Elevation View** - Handle multi-segment walls
3. **Element Positioning** - Point-in-polygon checks, nearest wall calculations
4. **Collision Detection** - Prevent elements from being placed outside complex room boundaries
5. **Snapping** - Snap elements to angled walls

---

## Prerequisites

### ✅ Phase 1 Complete
- Database schema with `room_geometry_templates` and `room_geometry` column
- 3 seed templates loaded (rectangle, L-shape, U-shape)

### ✅ Phase 2 Complete
- TypeScript interfaces (RoomGeometry, FloorGeometry, WallSegment)
- GeometryValidator utility
- RoomService methods for loading geometry
- React hooks (useRoomGeometry, useRoomGeometryTemplates)

### ✅ Phase 3 Complete (Pending Floor Fix)
- ComplexRoomGeometry component for 3D rendering
- Conditional rendering (complex vs simple)
- 3D visualization working

### 🔴 Blocking Issue
- **Floor positioning** in 3D view needs resolution
- Research prompt created: `FLOOR_POSITIONING_RESEARCH_PROMPT.md`
- Can proceed with Phase 4 planning in parallel

---

## Current 2D System Analysis

### DesignCanvas2D.tsx
**Current Behavior:**
- Renders rectangular room outline: `(0, 0)` to `(width, height)`
- Uses simple `strokeRect()` for room perimeter
- Element positioning assumes rectangular bounds
- Wall detection uses 4 fixed walls (top, right, bottom, left)

**Code Location:** `src/components/designer/DesignCanvas2D.tsx`

**Key Methods:**
```typescript
// Current room rendering (simplified)
ctx.strokeRect(0, 0, roomDimensions.width, roomDimensions.height);

// Element positioning
const isInsideRoom = (
  x >= 0 && x <= roomDimensions.width &&
  y >= 0 && y <= roomDimensions.height
);
```

---

### Elevation View Handlers
**Current Behavior:**
- Assumes 4 walls (north, east, south, west)
- Each wall is a simple line segment
- Wall height is uniform across entire wall

**Code Location:** `src/services/2d-renderers/elevation-view-handlers.ts`

**Key Methods:**
```typescript
// Current wall rendering
function renderWall(wall: 'north' | 'east' | 'south' | 'west') {
  const wallHeight = roomDimensions.ceilingHeight || 250;
  const wallWidth = wall === 'north' || wall === 'south'
    ? roomDimensions.width
    : roomDimensions.height;
  // ... render as rectangle
}
```

---

### Position Calculation
**Current Behavior:**
- Distance calculations assume rectangular room
- Nearest wall uses simple min/max comparisons
- No support for angled walls

**Code Location:** `src/utils/PositionCalculation.ts`

**Key Methods:**
```typescript
// Current nearest wall calculation
function getNearestWall(x: number, y: number): 'north' | 'east' | 'south' | 'west' {
  const distToTop = y;
  const distToRight = roomWidth - x;
  const distToBottom = roomHeight - y;
  const distToLeft = x;
  return getMinDistance([distToTop, distToRight, distToBottom, distToLeft]);
}
```

---

## Phase 4 Tasks Breakdown

### Task 1: Create GeometryUtils.ts (3-4 days)
**Goal:** Build utility library for 2D polygon operations

#### 1.1 Point-in-Polygon Algorithm
**Purpose:** Check if an element is inside complex room boundary

**Implementation:**
```typescript
/**
 * Ray casting algorithm to check if point is inside polygon
 * @param point - [x, y] coordinates in cm
 * @param vertices - Polygon vertices [[x1, y1], [x2, y2], ...]
 * @returns true if point is inside polygon
 */
export function isPointInPolygon(
  point: [number, number],
  vertices: [number, number][]
): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}
```

**Test Cases:**
- Point clearly inside L-shape
- Point in concave region (should be outside)
- Point on vertex
- Point on edge

---

#### 1.2 Point-to-Line-Segment Distance
**Purpose:** Calculate distance from element to nearest wall segment

**Implementation:**
```typescript
/**
 * Calculate perpendicular distance from point to line segment
 * @param point - [x, y] coordinates
 * @param lineStart - Start of line segment [x1, y1]
 * @param lineEnd - End of line segment [x2, y2]
 * @returns distance in cm
 */
export function pointToLineSegmentDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    // Line segment is a point
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Calculate projection parameter
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

  // Find closest point on segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}
```

**Test Cases:**
- Point perpendicular to segment
- Point beyond segment endpoints
- Point on segment

---

#### 1.3 Nearest Wall Calculation
**Purpose:** Find which wall segment an element should snap to

**Implementation:**
```typescript
/**
 * Find nearest wall segment to a point
 * @param point - [x, y] coordinates
 * @param walls - Array of wall segments with start/end points
 * @returns Wall segment ID and distance
 */
export function findNearestWall(
  point: [number, number],
  walls: WallSegment[]
): { wallId: string; distance: number; closestPoint: [number, number] } {
  let minDistance = Infinity;
  let nearestWall: string | null = null;
  let closestPoint: [number, number] = [0, 0];

  for (const wall of walls) {
    const distance = pointToLineSegmentDistance(point, wall.start, wall.end);

    if (distance < minDistance) {
      minDistance = distance;
      nearestWall = wall.id;
      // Calculate closest point for snapping
      closestPoint = calculateClosestPointOnSegment(point, wall.start, wall.end);
    }
  }

  return {
    wallId: nearestWall!,
    distance: minDistance,
    closestPoint
  };
}
```

---

#### 1.4 Polygon Area Calculation
**Purpose:** Calculate floor area for L-shapes, U-shapes (already in GeometryValidator, may extract)

**Implementation:**
```typescript
/**
 * Calculate polygon area using Shoelace formula
 * @param vertices - Polygon vertices [[x1, y1], [x2, y2], ...]
 * @returns area in cm²
 */
export function calculatePolygonArea(vertices: [number, number][]): number {
  let area = 0;

  for (let i = 0; i < vertices.length; i++) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[(i + 1) % vertices.length];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
}
```

---

#### 1.5 Bounding Box Calculation
**Purpose:** Quick bounds checking before expensive polygon tests

**Implementation:**
```typescript
/**
 * Calculate axis-aligned bounding box for polygon
 */
export function calculateBoundingBox(
  vertices: [number, number][]
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const [x, y] of vertices) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { minX, minY, maxX, maxY };
}
```

---

### Task 2: Update DesignCanvas2D.tsx (3-4 days)
**Goal:** Render polygon room outlines and handle complex geometries

#### 2.1 Load Room Geometry
**Add state and loading logic:**

```typescript
const [roomGeometry, setRoomGeometry] = useState<RoomGeometry | null>(null);

useEffect(() => {
  const loadGeometry = async () => {
    if (design?.id) {
      const geometry = await RoomService.getRoomGeometry(design.id);
      setRoomGeometry(geometry as RoomGeometry);
    }
  };
  loadGeometry();
}, [design?.id]);
```

---

#### 2.2 Render Polygon Room Outline
**Replace simple rectangle with polygon path:**

```typescript
function renderRoomOutline(ctx: CanvasRenderingContext2D) {
  if (roomGeometry) {
    // Complex polygon room
    const vertices = roomGeometry.floor.vertices;

    ctx.beginPath();
    ctx.moveTo(vertices[0][0], vertices[0][1]);

    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i][0], vertices[i][1]);
    }

    ctx.closePath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Optional: Fill with background color
    ctx.fillStyle = '#f5f5f5';
    ctx.fill();
  } else {
    // Simple rectangular room (legacy)
    ctx.strokeRect(0, 0, roomDimensions.width, roomDimensions.height);
  }
}
```

---

#### 2.3 Update Element Positioning
**Use point-in-polygon for bounds checking:**

```typescript
function isElementInsideRoom(element: DesignElement): boolean {
  if (roomGeometry) {
    // Complex room - use point-in-polygon
    return GeometryUtils.isPointInPolygon(
      [element.x, element.y],
      roomGeometry.floor.vertices
    );
  } else {
    // Simple room - rectangle bounds
    return (
      element.x >= 0 && element.x <= roomDimensions.width &&
      element.y >= 0 && element.y <= roomDimensions.height
    );
  }
}
```

---

#### 2.4 Update Wall Snapping
**Find nearest wall segment for snapping:**

```typescript
function snapToNearestWall(x: number, y: number): { x: number; y: number; wall: string } {
  if (roomGeometry) {
    const { wallId, closestPoint } = GeometryUtils.findNearestWall(
      [x, y],
      roomGeometry.walls
    );

    return { x: closestPoint[0], y: closestPoint[1], wall: wallId };
  } else {
    // Legacy rectangular snapping
    return snapToRectangularWall(x, y);
  }
}
```

---

#### 2.5 Render Wall Segments
**Show individual wall segments for clarity:**

```typescript
function renderWallSegments(ctx: CanvasRenderingContext2D) {
  if (roomGeometry) {
    roomGeometry.walls.forEach((wall) => {
      ctx.beginPath();
      ctx.moveTo(wall.start[0], wall.start[1]);
      ctx.lineTo(wall.end[0], wall.end[1]);

      // Different colors for different wall types
      ctx.strokeStyle = wall.type === 'standard' ? '#666' : '#999';
      ctx.lineWidth = wall.thickness || 10;
      ctx.stroke();
    });
  }
}
```

---

### Task 3: Update Elevation View (2 days)
**Goal:** Support multi-segment walls in elevation view

#### 3.1 Elevation View for Wall Segments
**Code Location:** `src/services/2d-renderers/elevation-view-handlers.ts`

**Implementation:**
```typescript
export function renderElevationView(
  ctx: CanvasRenderingContext2D,
  wall: WallSegment,
  roomGeometry?: RoomGeometry
) {
  const wallHeight = wall.height;
  const wallWidth = calculateWallLength(wall.start, wall.end);

  // Draw wall as rectangle
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, wallWidth, wallHeight);
  ctx.strokeStyle = '#333';
  ctx.strokeRect(0, 0, wallWidth, wallHeight);

  // Render elements on this wall segment
  renderElementsOnWall(ctx, wall.id);
}

function calculateWallLength(
  start: [number, number],
  end: [number, number]
): number {
  const [x1, y1] = start;
  const [x2, y2] = end;
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
```

---

#### 3.2 Wall Selection UI
**Allow user to select which wall segment to view:**

```typescript
function WallSelector({ walls }: { walls: WallSegment[] }) {
  const [selectedWall, setSelectedWall] = useState<string>(walls[0]?.id);

  return (
    <Select value={selectedWall} onValueChange={setSelectedWall}>
      <SelectTrigger>
        <SelectValue placeholder="Select wall" />
      </SelectTrigger>
      <SelectContent>
        {walls.map((wall, index) => (
          <SelectItem key={wall.id} value={wall.id}>
            Wall {index + 1} ({calculateWallLength(wall.start, wall.end).toFixed(0)}cm)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

### Task 4: Update PositionCalculation.ts (2 days)
**Goal:** Extend positioning utilities for complex rooms

#### 4.1 Refactor getNearestWall
**Support both simple and complex rooms:**

```typescript
export function getNearestWall(
  x: number,
  y: number,
  roomGeometry?: RoomGeometry
): string {
  if (roomGeometry) {
    // Complex room - find nearest wall segment
    const { wallId } = GeometryUtils.findNearestWall(
      [x, y],
      roomGeometry.walls
    );
    return wallId;
  } else {
    // Simple room - return cardinal direction
    const distToTop = y;
    const distToRight = roomWidth - x;
    const distToBottom = roomHeight - y;
    const distToLeft = x;

    const min = Math.min(distToTop, distToRight, distToBottom, distToLeft);

    if (min === distToTop) return 'north';
    if (min === distToRight) return 'east';
    if (min === distToBottom) return 'south';
    return 'west';
  }
}
```

---

#### 4.2 Add getWallAngle
**Calculate angle of wall segment for element rotation:**

```typescript
export function getWallAngle(wallId: string, roomGeometry: RoomGeometry): number {
  const wall = roomGeometry.walls.find(w => w.id === wallId);
  if (!wall) return 0;

  const [x1, y1] = wall.start;
  const [x2, y2] = wall.end;

  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}
```

---

### Task 5: Collision Detection (2 days)
**Goal:** Prevent elements from overlapping or going outside room

#### 5.1 Element Bounds Checking
**Use bounding box + polygon test:**

```typescript
export function canPlaceElement(
  element: DesignElement,
  roomGeometry?: RoomGeometry
): boolean {
  if (!roomGeometry) {
    // Simple rectangular bounds
    return (
      element.x >= 0 &&
      element.x + element.width <= roomDimensions.width &&
      element.y >= 0 &&
      element.y + element.height <= roomDimensions.height
    );
  }

  // Complex room - check all corners of element
  const corners = [
    [element.x, element.y],
    [element.x + element.width, element.y],
    [element.x + element.width, element.y + element.height],
    [element.x, element.y + element.height]
  ];

  // All corners must be inside polygon
  return corners.every(corner =>
    GeometryUtils.isPointInPolygon(corner as [number, number], roomGeometry.floor.vertices)
  );
}
```

---

#### 5.2 Element-to-Element Collision
**Already handled by existing system, no changes needed**

---

### Task 6: Testing & Validation (2 days)

#### 6.1 Visual Tests
- [ ] L-shaped room renders correctly in plan view
- [ ] U-shaped room renders correctly in plan view
- [ ] Wall segments visible with proper thickness
- [ ] Elements can be placed in valid regions
- [ ] Elements cannot be placed in concave regions (outside polygon)

#### 6.2 Positioning Tests
- [ ] Element snaps to angled walls
- [ ] Element snaps to perpendicular walls (90°)
- [ ] Nearest wall calculation works for all wall segments
- [ ] Point-in-polygon works for concave regions

#### 6.3 Performance Tests
- [ ] Plan view renders at 60fps with complex polygons
- [ ] Point-in-polygon calculation is fast (<1ms)
- [ ] No lag when dragging elements

---

## Files to Create/Modify

### New Files (1)
1. **`src/utils/GeometryUtils.ts`** (~400 lines)
   - Point-in-polygon algorithm
   - Point-to-line-segment distance
   - Nearest wall calculation
   - Bounding box calculation
   - Polygon area calculation

### Modified Files (3)
1. **`src/components/designer/DesignCanvas2D.tsx`**
   - Load room geometry from database
   - Render polygon room outlines
   - Update element positioning logic
   - Update wall snapping logic

2. **`src/services/2d-renderers/elevation-view-handlers.ts`**
   - Support multi-segment walls
   - Calculate wall segment lengths
   - Render elevation for specific wall segment

3. **`src/utils/PositionCalculation.ts`**
   - Refactor getNearestWall for complex rooms
   - Add getWallAngle utility
   - Update collision detection

---

## Architecture Decisions

### 1. GeometryUtils Location ✅
**Decision:** Create new `src/utils/GeometryUtils.ts`

**Rationale:**
- Reusable across 2D and 3D systems
- Pure functions (no side effects)
- Easy to unit test
- Can be used by other phases (Phase 5 UI, Phase 6 advanced features)

---

### 2. Backward Compatibility ✅
**Decision:** Conditional logic with fallback to simple rectangle

**Rationale:**
- Zero breaking changes
- All existing rooms continue to work
- Clear separation of concerns
- Easy to debug

**Implementation Pattern:**
```typescript
if (roomGeometry) {
  // Complex polygon logic
} else {
  // Simple rectangle logic (legacy)
}
```

---

### 3. Performance Optimization ✅
**Decision:** Bounding box pre-check before expensive polygon tests

**Rationale:**
- Point-in-polygon is O(n) where n = number of vertices
- Bounding box check is O(1)
- Most drag operations fail bounding box, avoiding polygon test
- 10-100x performance improvement for drag operations

**Implementation:**
```typescript
function canPlaceElement(element, roomGeometry) {
  // Fast bounding box check first
  const bbox = GeometryUtils.calculateBoundingBox(roomGeometry.floor.vertices);
  if (!isInsideBBox(element, bbox)) {
    return false; // Quick reject
  }

  // Expensive polygon check only if passes bbox
  return GeometryUtils.isPointInPolygon([element.x, element.y], vertices);
}
```

---

### 4. Wall Segment Rendering ✅
**Decision:** Render wall segments as separate strokes with thickness

**Rationale:**
- Visual clarity for users
- Shows wall types (standard, accent, glass, etc.)
- Helps debug positioning issues
- Better UX for complex shapes

---

## Success Criteria

### Minimum Viable Product (Phase 4)
- [ ] L-shaped room outline renders in plan view
- [ ] Elements can be placed inside L-shaped room
- [ ] Elements cannot be placed in concave region (outside polygon)
- [ ] Wall snapping works for angled walls
- [ ] Elevation view shows selected wall segment

### Full Feature Set
- [ ] All 3 templates (rectangle, L-shape, U-shape) work in 2D
- [ ] Point-in-polygon performance <1ms
- [ ] Element positioning is accurate and intuitive
- [ ] No visual glitches or rendering artifacts

---

## Risk Assessment

### Risk 1: Performance Degradation 🟡 MEDIUM
**Problem:** Point-in-polygon checks on every mouse move may be slow

**Mitigation:**
- Bounding box pre-check (90% rejection rate)
- Debounce mouse move events (30ms)
- Cache polygon vertices in useMemo
- Optimize algorithm (ray casting is O(n), very fast)

---

### Risk 2: Complex UI Interaction 🟡 MEDIUM
**Problem:** Users may not understand concave regions (where they can't place elements)

**Mitigation:**
- Visual feedback (red outline when invalid placement)
- Show valid placement zones with shading
- Tooltips explaining concave regions
- Progressive disclosure (start with simple shapes)

---

### Risk 3: Elevation View Confusion 🟢 LOW
**Problem:** Users may not understand which wall segment they're viewing

**Mitigation:**
- Clear wall segment selector dropdown
- Show wall number and length in selector
- Highlight selected wall in plan view
- Minimap showing current wall segment

---

## Timeline Estimate

### Week 8 (Days 1-5)
- **Day 1-2:** Create GeometryUtils.ts with all algorithms
- **Day 3-4:** Update DesignCanvas2D.tsx for polygon rendering
- **Day 5:** Update PositionCalculation.ts

### Week 9 (Days 6-10)
- **Day 6-7:** Update elevation view handlers
- **Day 8:** Collision detection and element placement
- **Day 9:** Testing and bug fixes
- **Day 10:** Documentation and Phase 4 completion report

**Total:** 10 days (2 weeks)

---

## Dependencies

### Required Before Starting
- [ ] Phase 3 floor positioning issue resolved
- [ ] Phase 3 fully tested and documented
- [ ] All 3 templates verified in 3D view

### Can Start In Parallel
- ✅ GeometryUtils.ts implementation (independent of floor fix)
- ✅ Test case writing
- ✅ Architecture documentation

---

## Testing Strategy

### Unit Tests
- [ ] Point-in-polygon algorithm (10+ test cases)
- [ ] Point-to-line-segment distance (edge cases)
- [ ] Nearest wall calculation (complex polygons)
- [ ] Bounding box calculation

### Integration Tests
- [ ] Room rendering with L-shape template
- [ ] Element placement in valid regions
- [ ] Element rejection in invalid regions
- [ ] Wall snapping with angled walls

### Visual Regression Tests
- [ ] Screenshot comparison of plan view (before/after)
- [ ] Verify no changes to simple rectangular rooms

---

## Documentation Deliverables

1. **PHASE_4_COMPLETE.md** - Completion report with:
   - All tasks completed
   - Code examples and usage
   - Architecture decisions
   - Performance benchmarks

2. **GEOMETRY_UTILS_API.md** - API documentation for GeometryUtils:
   - All function signatures
   - Parameter descriptions
   - Return values
   - Usage examples
   - Algorithm complexity notes

3. **2D_RENDERING_GUIDE.md** - Developer guide:
   - How 2D system works with complex geometry
   - How to add new room shapes
   - How to debug positioning issues

---

## Next Phase

**Phase 5: UI/UX for Shape Selection (Weeks 10-11)**
- Room shape selector component
- Template preview system
- Parameter configuration forms
- Integration with room creation flow

---

**Status:** 📋 **READY FOR IMPLEMENTATION**
**Prerequisites:** Resolve Phase 3 floor positioning issue first
**Estimated Start:** After Phase 3 completion + 1 day
**Estimated Completion:** +2 weeks from start
