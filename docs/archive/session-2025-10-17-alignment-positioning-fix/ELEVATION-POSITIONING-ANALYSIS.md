# Elevation View Positioning Analysis

**Date:** 2025-10-18
**Session:** alignment-positioning-fix (continued)
**Goal:** Analyze why elevation views show incorrect positions compared to working plan/3D views

---

## Executive Summary

**Problem:** Elevation views show cabinets in incorrect positions while plan view and 3D view are correctly aligned.

**Root Causes Identified:**

1. **Legacy vs New positioning systems conflict** - Feature flag controls dual implementations with different logic
2. **Left wall Y-coordinate flipping asymmetry** - Legacy system mirrors Y coordinates only for left wall
3. **Hardcoded vertical positioning** - Not using database layer metadata (min_height_cm, max_height_cm)
4. **Type-based height detection** - String matching instead of database fields
5. **Missing rotation-aware dimension handling** - Effective width/depth calculations inconsistent

**Status:** ⚠️ ANALYSIS COMPLETE - Complex legacy logic requires careful untangling

---

## How Plan View Works (CORRECTLY ✅)

### Coordinate System

**File:** [DesignCanvas2D.tsx:529-542](src/components/designer/DesignCanvas2D.tsx#L529-L542)

```typescript
// Convert room coordinates to canvas coordinates (uses inner room for component placement)
const roomToCanvas = useCallback((roomX: number, roomY: number) => {
  return {
    x: roomPosition.innerX + (roomX * zoom),
    y: roomPosition.innerY + (roomY * zoom)
  };
}, [roomPosition, zoom, active2DView]);

// Convert canvas coordinates to room coordinates (uses inner room for component placement)
const canvasToRoom = useCallback((canvasX: number, canvasY: number) => {
  return {
    x: (canvasX - roomPosition.innerX) / zoom,
    y: (canvasY - roomPosition.innerY) / zoom
  };
}, [roomPosition, zoom, active2DView]);
```

### Component Positioning

**File:** [DesignCanvas2D.tsx:1136-1138](src/components/designer/DesignCanvas2D.tsx#L1136-L1138)

```typescript
const pos = roomToCanvas(element.x, element.y);
const width = element.width * zoom;
const depth = (element.depth || element.height) * zoom; // Use depth for Y-axis in plan view
```

### Key Characteristics

✅ **Direct coordinate mapping:**
- `element.x` (cm from room origin) → canvas X via simple transform
- `element.y` (cm from room origin) → canvas Y via simple transform
- Linear scaling: `position = origin + (element_position * zoom)`

✅ **Uses inner room boundaries:**
- `roomPosition.innerX` - excludes wall thickness
- `roomPosition.innerY` - excludes wall thickness
- Components positioned within usable room space

✅ **Rotation handled via canvas transform:**
- Translate to component center
- Rotate around center
- All rotation math done by canvas API

---

## How 3D View Works (CORRECTLY ✅)

### Coordinate System

**File:** [DynamicComponentRenderer.tsx:42-50](src/components/3d/DynamicComponentRenderer.tsx#L42-L50)

```typescript
const convertTo3D = (x: number, y: number, roomWidth: number, roomHeight: number) => {
  const roomWidthMeters = roomWidth / 100;
  const roomHeightMeters = roomHeight / 100;

  return {
    x: (x / 100) - roomWidthMeters / 2,
    z: (y / 100) - roomHeightMeters / 2
  };
};
```

### Component Positioning

**File:** [DynamicComponentRenderer.tsx:156-160](src/components/3d/DynamicComponentRenderer.tsx#L156-L160)

```typescript
// Calculate position and rotation
const { x, z } = convertTo3D(element.x, element.y, roomDimensions.width, roomDimensions.height);

// Y position depends on cabinet type
const height = element.height / 100; // meters
const yPosition = isWallCabinet ? 2.0 - height / 2 : height / 2;
```

### Key Characteristics

✅ **Center-based coordinate system:**
- Room origin at center: `x - roomWidth / 2`
- Z-axis uses plan view Y: `y - roomHeight / 2`
- Converts cm to meters: `/100`

✅ **Type-based vertical positioning:**
- Base cabinets: `yPosition = height / 2` (e.g., 0.45m for 90cm)
- Wall cabinets: `yPosition = 2.0 - height / 2` (e.g., 1.6m for 80cm)
- **Note:** Uses string matching `isWallCabinet = element.id.includes('wall-cabinet')`

✅ **Rotation handled by Three.js:**
```typescript
<group rotation={[0, element.rotation * Math.PI / 180, 0]}>
```

---

## How Elevation View Works (BROKEN ❌)

### Coordinate System

**Two competing implementations controlled by feature flag:**

#### Legacy Implementation (Currently Active)

**File:** [PositionCalculation.ts:145-196](src/utils/PositionCalculation.ts#L145-L196)

```typescript
private static calculateElevationPositionLegacy(
  element: DesignElement,
  roomDimensions: RoomDimensions,
  roomPosition: RoomPosition,
  view: ViewType,
  zoom: number,
  elevationWidth?: number,
  elevationDepth?: number
): ElevationPosition {
  // ... rotation-aware dimension calculations ...

  if (view === 'front' || view === 'back') {
    // Front/back walls: use X coordinate from plan view
    xPos = roomPosition.innerX + (element.x / roomDimensions.width) * calcElevationWidth;
    elementWidth = (effectiveWidth / roomDimensions.width) * calcElevationWidth;
  } else if (view === 'left') {
    // ❌ ASYMMETRY: Left wall view - flip horizontally (mirror Y coordinate)
    const flippedY = roomDimensions.height - element.y - effectiveDepth;
    xPos = roomPosition.innerX + (flippedY / roomDimensions.height) * calcElevationDepth;
    elementWidth = (effectiveDepth / roomDimensions.height) * calcElevationDepth;
  } else {
    // Right wall view - use Y coordinate from plan view
    xPos = roomPosition.innerX + (element.y / roomDimensions.height) * calcElevationDepth;
    elementWidth = (effectiveDepth / roomDimensions.height) * calcElevationDepth;
  }

  return { xPos, elementWidth };
}
```

#### New Implementation (Feature Flag Disabled)

**File:** [PositionCalculation.ts:204-255](src/utils/PositionCalculation.ts#L204-L255)

```typescript
private static calculateElevationPositionNew(/* ... */): ElevationPosition {
  if (view === 'front' || view === 'back') {
    // Same calculation as legacy
    xPos = roomPosition.innerX + (element.x / roomDimensions.width) * calcElevationWidth;
    elementWidth = (effectiveWidth / roomDimensions.width) * calcElevationWidth;
  } else {
    // ✅ UNIFIED: Both left AND right walls use same coordinate system
    const normalizedPosition = element.y / roomDimensions.height;
    xPos = roomPosition.innerX + normalizedPosition * calcElevationDepth;
    elementWidth = (effectiveDepth / roomDimensions.height) * calcElevationDepth;

    if (view === 'left') {
      // ✅ BETTER: Mirror position at rendering time, not coordinate calculation
      const elevationCenter = roomPosition.innerX + calcElevationDepth / 2;
      const distanceFromCenter = xPos - elevationCenter;
      xPos = elevationCenter - distanceFromCenter - elementWidth;
    }
  }

  return { xPos, elementWidth };
}
```

### Vertical Positioning (Hardcoded Heights)

**File:** [DesignCanvas2D.tsx:1319-1389](src/components/designer/DesignCanvas2D.tsx#L1319-L1389)

```typescript
// ❌ HARDCODED: Elevation heights based on type string matching
let elevationHeightCm: number;

if (element.type === 'cornice') {
  elevationHeightCm = 30;
} else if (element.type === 'pelmet') {
  elevationHeightCm = 20;
} else if (element.type === 'counter-top') {
  elevationHeightCm = 4;
} else if (element.type === 'cabinet' && element.id.includes('wall-cabinet')) {
  elevationHeightCm = 70;
} else if (element.type === 'cabinet' && (element.id.includes('tall') || element.id.includes('larder'))) {
  elevationHeightCm = element.height;
} else if (element.type === 'cabinet') {
  elevationHeightCm = 90; // Base cabinet height
} else if (element.type === 'appliance') {
  elevationHeightCm = element.height;
}
// ... more type checks ...

elementHeight = elevationHeightCm * zoom;

// ❌ HARDCODED: Y position based on component Z position and type
if (element.z && element.z > 0) {
  const mountHeight = element.z * zoom;
  yPos = floorY - mountHeight - elementHeight;
} else {
  // Default positioning based on type
  if (element.type === 'cabinet' && element.id.includes('wall-cabinet')) {
    yPos = floorY - (140 * zoom) - elementHeight; // Wall cabinets at 140cm
  } else if (element.type === 'cornice') {
    yPos = floorY - (200 * zoom) - elementHeight;
  }
  // ... more type-based positioning ...
}
```

### Key Problems

❌ **Asymmetric coordinate flipping:**
- Left wall: `flippedY = roomHeight - element.y - effectiveDepth`
- Right wall: Direct mapping `element.y`
- This creates inconsistent behavior

❌ **NOT using database layer metadata:**
- Has access to `min_height_cm` and `max_height_cm` from collision detection system
- Instead uses hardcoded type-based heights
- Duplicates height logic instead of reusing database values

❌ **Type-based string matching:**
- `element.id.includes('wall-cabinet')` - fragile pattern matching
- Should use `component_3d_models.layer_type` field

❌ **Rotation-aware dimension handling:**
- Calculates `effectiveWidth` and `effectiveDepth` based on rotation
- Plan view uses same rotation logic (via canvas transform)
- 3D view doesn't need this (Three.js handles rotation)
- **Mismatch:** Elevation calculates effective dimensions, plan view uses actual dimensions + canvas rotation

---

## Key Discrepancies: Elevation vs Plan/3D

### 1. Horizontal Positioning Formula Difference

**Plan View (Simple & Correct):**
```typescript
x_canvas = roomPosition.innerX + (element.x * zoom)
```

**3D View (Center-Based & Correct):**
```typescript
x_3d = (element.x / 100) - (roomWidth / 200)
```

**Elevation View Front/Back (Normalized & Potentially Wrong):**
```typescript
x_elevation = roomPosition.innerX + (element.x / roomDimensions.width) * elevationWidth
```

**Difference:**
- Plan: Direct linear scaling `element.x * zoom`
- Elevation: Normalized position `(element.x / roomWidth) * elevationWidth`
- **Potential Issue:** If `elevationWidth ≠ roomDimensions.width * zoom`, positions won't match

### 2. Left Wall Y-Coordinate Flipping

**Plan View:** No flipping - direct Y mapping

**3D View:** No flipping - direct Z mapping (Y from plan becomes Z in 3D)

**Elevation View (Legacy):**
```typescript
flippedY = roomDimensions.height - element.y - effectiveDepth
```

**Analysis:**
- Plan/3D use consistent Y coordinates
- Elevation legacy flips for left wall only
- **Likely Issue:** Elements appear in wrong positions on left wall

### 3. Vertical Positioning Data Source

**Plan View:** Not applicable (2D top-down)

**3D View:**
```typescript
yPosition = isWallCabinet ? 2.0 - height / 2 : height / 2
// Uses type detection + element.height
```

**Elevation View:**
```typescript
// Hardcoded heights per type + Z position if present
elevationHeightCm = 70 (wall) or 90 (base) or element.height (tall/appliance)
yPos = floorY - mountHeight - elementHeight
```

**Database Available (NOT USED):**
```sql
-- From component_3d_models table (populated in Phase 1)
layer_type: 'base' | 'wall' | 'tall' | 'worktop' | 'pelmet' | 'cornice'
min_height_cm: 0, 90, 140, etc.
max_height_cm: 90, 220, 240, etc.
```

**Issue:**
- 3D view calculates Y from type + element height (consistent with element data)
- Elevation hardcodes heights and uses Z position fallback
- Database has authoritative layer heights but not used
- **Mismatch:** Components may appear at wrong heights

### 4. Rotation Handling

**Plan View:**
```typescript
ctx.translate(pos.x + width / 2, pos.y + depth / 2);
ctx.rotate(rotation * Math.PI / 180);
// Rotation handled by canvas transform
```

**3D View:**
```typescript
<group rotation={[0, element.rotation * Math.PI / 180, 0]}>
// Rotation handled by Three.js
```

**Elevation View:**
```typescript
// Pre-calculates effective dimensions based on rotation
const isRotated = Math.abs(Math.sin(rotation)) > 0.1; // 90° or 270°
if (isRotated) {
  effectiveWidth = element.depth;
  effectiveDepth = element.width;
} else {
  effectiveWidth = element.width;
  effectiveDepth = element.depth;
}
```

**Issue:**
- Plan/3D delegate rotation to rendering APIs
- Elevation pre-calculates rotated dimensions
- **Potential Mismatch:** If rotation affects width/depth for positioning in elevation but not plan, positions won't align

---

## Comparison Table

| Aspect | Plan View (✅) | 3D View (✅) | Elevation View (❌) |
|--------|---------------|-------------|---------------------|
| **Coordinate Origin** | Inner room top-left | Room center | Inner room top-left |
| **Horizontal Formula** | `innerX + (x * zoom)` | `(x/100) - roomWidth/200` | `innerX + (x/roomWidth) * elevWidth` |
| **Left Wall Y-Flip** | No | No | Yes (legacy) or rendering-time (new) |
| **Vertical Data Source** | N/A (2D) | Type + element.height | Hardcoded type heights + Z |
| **Uses Database Heights** | N/A | No | No (should!) |
| **Rotation Handling** | Canvas transform | Three.js group | Pre-calculated dimensions |
| **Effective Dimensions** | Actual (rotation via transform) | Actual (rotation via group) | Swapped if rotated |

---

## Root Cause Analysis

### Primary Issue: Coordinate System Mismatch

**Plan View Storage:**
```
element.x = 100cm (from left wall)
element.y = 200cm (from front wall)
```

**Elevation Front Wall Display:**
```
horizontal_position = (element.x / roomWidth) * elevationWidth
// If elevationWidth ≠ roomWidth * zoom → WRONG POSITION
```

**Expected:**
```
horizontal_position = element.x * zoom
// Same linear scaling as plan view
```

### Secondary Issue: Left Wall Asymmetry

**Legacy System:**
- Left wall: `flippedY = roomHeight - y - depth`
- Right wall: `y`
- **Result:** Left wall positions mirror-inverted compared to right wall

**New System (Disabled):**
- Both walls use same coordinate: `y`
- Left wall mirrors at rendering time
- **Better but still disabled by feature flag**

### Tertiary Issue: Height Data Duplication

**Current State:**
- Collision detection uses database: `min_height_cm`, `max_height_cm`, `layer_type`
- 3D view uses type detection: `isWallCabinet ? 2.0 - h/2 : h/2`
- Elevation uses hardcoded type heights: `90cm`, `70cm`, `140cm`

**Problem:**
- Three separate sources of truth for component heights
- Database is authoritative (populated in Phase 1)
- But neither 3D nor elevation use it

---

## Recommended Fix Strategy

### Phase 1: Enable New Positioning System (Low Risk)

**Change feature flag:**
```typescript
// In PositionCalculation.ts
private static readonly FEATURE_FLAG = 'use_new_positioning_system';
// Set to true in feature flag service
```

**Benefit:**
- Fixes left wall Y-coordinate flipping asymmetry
- Unified coordinate system for left/right walls
- Already implemented, just needs testing

**Risk:**
- May reveal other positioning bugs that legacy system was compensating for
- Requires thorough testing across all component types

### Phase 2: Align Horizontal Positioning with Plan View (Medium Risk)

**Current (Elevation):**
```typescript
xPos = roomPosition.innerX + (element.x / roomDimensions.width) * elevationWidth;
```

**Proposed (Match Plan View):**
```typescript
xPos = roomPosition.innerX + (element.x * zoom);
```

**Benefit:**
- Direct 1:1 coordinate mapping like plan view
- No normalization step that could introduce errors
- Simpler logic, easier to understand

**Implementation:**
```typescript
// In PositionCalculation.ts - both legacy and new
if (view === 'front' || view === 'back') {
  // Use X coordinate directly (same as plan view)
  xPos = roomPosition.innerX + (element.x * zoom);
  elementWidth = effectiveWidth * zoom;
} else {
  // Use Y coordinate directly (same as plan view)
  xPos = roomPosition.innerX + (element.y * zoom);
  elementWidth = effectiveDepth * zoom;

  if (view === 'left') {
    // Mirror at rendering time (new system approach)
    const elevationCenter = roomPosition.innerX + (roomDimensions.height * zoom) / 2;
    const distanceFromCenter = xPos - elevationCenter;
    xPos = elevationCenter - distanceFromCenter - elementWidth;
  }
}
```

### Phase 3: Use Database Layer Heights (Medium Risk)

**Current (Hardcoded):**
```typescript
if (element.type === 'cabinet' && element.id.includes('wall-cabinet')) {
  elevationHeightCm = 70;
  yPos = floorY - (140 * zoom) - elementHeight;
}
```

**Proposed (Database-Driven):**
```typescript
// In drawElementElevation
const { getComponentMetadata } = useComponentMetadata();
const metadata = getComponentMetadata(element.component_id || element.id);

if (metadata) {
  // Use database layer heights (authoritative source)
  const componentHeight = metadata.max_height_cm - metadata.min_height_cm;
  const mountHeight = metadata.min_height_cm;

  elementHeight = componentHeight * zoom;
  yPos = floorY - (mountHeight * zoom) - elementHeight;
} else {
  // Fallback to current hardcoded logic
  // (for components not yet in database)
}
```

**Benefit:**
- Single source of truth for component heights
- Reuses collision detection database work (Phase 1)
- Consistent with layer system (base, wall, tall, etc.)
- No more type-based string matching

### Phase 4: Simplify Rotation Handling (Optional)

**Current:**
Pre-calculates effective dimensions:
```typescript
if (isRotated) {
  effectiveWidth = element.depth;
  effectiveDepth = element.width;
}
```

**Alternative:**
Use rotation in positioning formula:
```typescript
// Calculate position using actual dimensions
xPos = roomPosition.innerX + (element.x * zoom);
elementWidth = element.width * zoom;

// Apply rotation offset if needed
if (isRotated && (view === 'left' || view === 'right')) {
  // Adjust position for rotated component
  // (depth becomes horizontal dimension)
  elementWidth = element.depth * zoom;
}
```

**Benefit:**
- More consistent with how plan view and 3D view handle rotation
- Less dimension swapping logic

**Risk:**
- May need careful testing for corner cases
- Rotation logic is already working in some scenarios

---

## Testing Strategy

### Test Cases Required

1. **Base cabinet on front wall**
   - Plan view position: X=100cm, Y=50cm
   - Elevation front: Should appear at X=100cm
   - Elevation back: Should appear at X=100cm
   - Elevation left: Should NOT appear (wall=front)
   - Elevation right: Should NOT appear (wall=front)

2. **Wall cabinet on left wall**
   - Plan view position: X=50cm, Y=100cm
   - Elevation front: Should NOT appear (wall=left)
   - Elevation back: Should NOT appear (wall=left)
   - Elevation left: Should appear at horizontal=100cm, vertical=140-220cm
   - Elevation right: Should NOT appear (wall=left)

3. **Corner cabinet**
   - Plan view: Positioned at corner (X=0, Y=0)
   - Elevation front: Should appear at left edge
   - Elevation left: Should appear at front edge
   - Both should be visible (corner logic)

4. **Rotated component (90°)**
   - Plan view: Rotated cabinet against back wall
   - Elevation back: Width and position should match plan view projection

5. **Tall unit (floor to ceiling)**
   - Plan view: Any position
   - Elevation: Should span from floor (0cm) to ceiling (~220cm)
   - Height should use database min_height_cm=0, max_height_cm=220

### Validation Criteria

✅ **Horizontal alignment:**
- Element at X=100cm in plan view appears at 100cm in front/back elevation
- Element at Y=100cm in plan view appears at 100cm in left/right elevation

✅ **Vertical alignment:**
- Base cabinet bottom at floor level (0cm)
- Wall cabinet bottom at ~140cm from floor
- Tall unit spans full height (0-220cm)

✅ **Wall assignment:**
- Element near front wall (Y<50cm) only visible in front elevation
- Element near left wall (X<50cm) only visible in left elevation

✅ **Left wall mirroring:**
- Components maintain logical left-to-right order
- No position inversions or gaps

---

## Migration Plan

### Step 1: Enable New Positioning (Non-Breaking)
- Set `use_new_positioning_system` feature flag to true
- Test all elevation views for coordinate consistency
- Validate left wall no longer has asymmetric behavior

### Step 2: Simplify Horizontal Formula (Breaking)
- Change elevation positioning to match plan view formula
- Replace `(x / roomWidth) * elevWidth` with `x * zoom`
- Test alignment between plan and elevation views

### Step 3: Database Height Integration (Breaking)
- Import `useComponentMetadata` in DesignCanvas2D
- Replace hardcoded heights with database `min_height_cm`/`max_height_cm`
- Keep fallback for components not in database
- Test vertical positioning for all component types

### Step 4: Validate & Deploy
- Run full test suite (base, wall, tall, corner, rotated)
- Compare plan/elevation/3D side-by-side screenshots
- Verify all components appear at correct positions
- Document any remaining edge cases

### Step 5: Cleanup (Optional)
- Remove legacy positioning system if new system works
- Remove hardcoded height logic if database system works
- Update documentation with final positioning approach

---

## Estimated Effort

| Phase | Task | Effort | Risk | Priority |
|-------|------|--------|------|----------|
| 1 | Enable new positioning flag | 30min | LOW | HIGH |
| 2 | Align horizontal formula | 2-3 hours | MEDIUM | HIGH |
| 3 | Database height integration | 2-3 hours | MEDIUM | MEDIUM |
| 4 | Rotation simplification | 2-3 hours | MEDIUM | LOW |
| Testing | All test cases | 3-4 hours | - | HIGH |

**Total:** 10-14 hours (including thorough testing)

---

## Files That Need Changes

### Primary Files

1. **[PositionCalculation.ts](src/utils/PositionCalculation.ts)**
   - Enable new positioning system (feature flag)
   - Simplify horizontal positioning formula
   - Align with plan view linear scaling

2. **[DesignCanvas2D.tsx](src/components/designer/DesignCanvas2D.tsx#L1264-L1459)**
   - `drawElementElevation` function
   - Import `useComponentMetadata` hook
   - Replace hardcoded heights with database metadata
   - Use `min_height_cm` for mount height, `max_height_cm - min_height_cm` for element height

3. **[FeatureFlagService.ts](src/services/FeatureFlagService.ts)** (likely location)
   - Set `use_new_positioning_system` to true (or make configurable)

### Secondary Files (May Need Updates)

4. **[2d-renderers/index.ts](src/services/2d-renderers/index.ts#L124-L166)**
   - `renderElevationView` function
   - May need adjustments if position calculation changes

5. **[DynamicComponentRenderer.tsx](src/components/3d/DynamicComponentRenderer.tsx#L156-L160)** (Future)
   - Consider using database heights for 3D positioning too
   - `yPosition = metadata.min_height_cm / 100 + (height / 2)` (more accurate)

---

## Risk Assessment

### High Risk Areas

1. **Left wall coordinate flipping** - Changing this affects ALL components on left wall
2. **Rotation dimension handling** - May have edge cases with corner components
3. **Feature flag interaction** - Legacy vs new system may have subtle differences

### Medium Risk Areas

4. **Database height integration** - Components not in database need fallback
5. **Horizontal formula change** - Could affect all elevation views simultaneously

### Low Risk Areas

6. **Enabling new positioning flag** - Already implemented, just needs activation
7. **Documentation updates** - No code risk

---

## Next Steps

1. ⏳ **Review & Approve Strategy** - Get user confirmation on fix approach
2. ⏳ **Enable New Positioning System** - Flip feature flag, test left wall
3. ⏳ **Implement Horizontal Formula Fix** - Align with plan view positioning
4. ⏳ **Integrate Database Heights** - Use collision detection metadata
5. ⏳ **Test Thoroughly** - All component types, all wall views
6. ⏳ **Compare Screenshots** - Plan vs Elevation alignment validation

---

**Status:** 📋 ANALYSIS COMPLETE - Ready for implementation with user approval

**User Note:** "There may be complex and conflicting logic to untangle" - CONFIRMED ✅
- Legacy vs new positioning systems
- Multiple height data sources (type detection, hardcoded, database)
- Asymmetric left wall behavior
- Normalization vs direct coordinate mapping
