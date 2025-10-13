# Cascading Rules & Configuration Analysis
**Date:** 2025-10-13
**Context:** Investigation of coordinate system cascading effects from component selector through to rendering

## Executive Summary

**Good News:** No CSS transforms or hidden coordinate manipulations found at the component selector level.

**Bad News:** Multiple **data transformation rules** that affect dimensions, positioning, and behavior throughout the system.

---

## 1. Component Selector Level Rules

### 1.1 Drag Preview Scale Factor
**Location:** [CompactComponentSidebar.tsx:290](src/components/designer/CompactComponentSidebar.tsx#L290)

```typescript
const scaleFactor = 1.15; // Increase by 15% to better match canvas components
const previewWidth = component.width * scaleFactor;
const previewDepth = component.depth * scaleFactor;
```

**Impact:**
- ❌ User sees 60cm cabinet as **69cm** during drag
- ❌ Cursor offset calculated from **scaled** dimensions
- ❌ Visual feedback doesn't match actual placement
- ❌ Creates expectation mismatch

**Why This Exists:** Comment says "to better match canvas size better" - suggests canvas might be rendering at wrong scale, or this is compensating for zoom

**Cascade Effect:**
```
Database: 60cm → Drag Preview: 69cm (1.15x) → Canvas: 60cm (actual)
         ↑                                           ↑
         Data says this                        Renders at this
```

---

### 1.2 Corner Component Special Handling
**Location:** [CompactComponentSidebar.tsx:294-342](src/components/designer/CompactComponentSidebar.tsx#L294-L342)

```typescript
const isCornerComponent = componentIdentifier.toLowerCase().includes('corner') ||
                         componentIdentifier.toLowerCase().includes('larder corner');

if (isCornerComponent) {
  dragPreview.style.backgroundColor = 'transparent';
  const squareSize = Math.min(component.width, component.depth) * scaleFactor;
  // Creates nested div with different structure
}
```

**Impact:**
- ❌ Corner components use `Math.min(width, depth)` - reduces to smallest dimension
- ❌ Different DOM structure (nested div vs. flat)
- ❌ Different center point calculation
- ❌ String matching for detection (fragile)

**Example:**
- 90×60 corner cabinet → Shows as 60×60 square preview
- But actual component is 90×60 L-shape

---

### 1.3 No Rotation in Drag Preview
**Location:** [CompactComponentSidebar.tsx:285-373](src/components/designer/CompactComponentSidebar.tsx#L285-L373)

```typescript
// Drag preview has NO rotation applied
dragPreview.style.width = `${previewWidth}px`;
dragPreview.style.height = `${previewDepth}px`;
// NO ctx.rotate(), NO transform: rotate(), nothing
```

**Impact:**
- ❌ User drags cabinet at 0° but it auto-rotates on drop (wall snap logic)
- ❌ No visual indication of final orientation
- ❌ Surprise rotation on placement

---

## 2. Database Schema Rules

### 2.1 Component Dimension Fields
**Location:** [Database Schema](supabase/migrations/)

```sql
components (
  width: integer,      -- X-axis dimension (cm)
  depth: integer,      -- Y-axis dimension (cm)
  height: integer,     -- Z-axis dimension (cm)
  default_z_position: integer,  -- Height off ground (cm)
  plinth_height: integer        -- Toe-kick height (cm)
)
```

**Rules:**
- ✅ All dimensions stored in **centimeters**
- ✅ Clear axis mapping: width=X, depth=Y, height=Z
- ⚠️ `default_z_position` can be NULL (requires fallback logic)
- ⚠️ `plinth_height` can be NULL (requires fallback logic)

---

### 2.2 Type-Based Z-Position Rules
**Location:** [componentZPositionHelper.ts:32-116](src/utils/componentZPositionHelper.ts#L32-L116)

```typescript
// Priority order:
// 1. Database default_z_position (if provided and non-zero)
// 2. Type-based rules (hardcoded fallback)

export function getDefaultZPosition(
  componentType: string,
  componentId: string,
  databaseZPosition?: number | null
): ZPositionCalculation {
  // Priority 1: Database
  if (databaseZPosition !== null && databaseZPosition !== undefined && databaseZPosition > 0) {
    return { z: databaseZPosition, source: 'database', reason: 'From components table' };
  }

  // Priority 2: Type rules
  if (componentType === 'cornice') return { z: 200, source: 'type-rule', reason: 'Above wall units' };
  if (componentType === 'pelmet') return { z: 140, source: 'type-rule', reason: 'Below wall units' };
  if (componentType === 'counter-top') return { z: 90, source: 'type-rule', reason: 'Standard height' };
  if (componentType === 'wall-unit-end-panel') return { z: 200, source: 'type-rule' };
  if (componentType === 'window') return { z: 90, source: 'type-rule', reason: 'Sill height' };

  // Special case: wall cabinets (detected by ID string matching)
  if (componentType === 'cabinet' && componentId.includes('wall-cabinet')) {
    return { z: 140, source: 'type-rule', reason: 'Wall cabinet standard height' };
  }

  // Default: floor level
  return { z: 0, source: 'default', reason: 'Floor level' };
}
```

**Impact:**
- ⚠️ String matching on `componentId` for wall cabinets (fragile)
- ⚠️ Hardcoded heights mixed with database values
- ⚠️ Two-tier fallback system adds complexity

**Cascade:**
```
Component added → Check database.default_z_position
                ↓ (if NULL)
              Check type string matching rules
                ↓ (if no match)
              Default to 0 (floor)
```

---

### 2.3 Type-Based Plinth Height Rules
**Location:** [componentPlinthHelper.ts:24-135](src/utils/componentPlinthHelper.ts#L24-L135)

```typescript
export function getPlinthHeight(
  componentType: string,
  componentId: string,
  databasePlinthHeight?: number | null,
  defaultZPosition?: number
): PlinthHeightCalculation {
  // Priority 1: Database
  if (databasePlinthHeight !== null && databasePlinthHeight !== undefined && databasePlinthHeight >= 0) {
    return { height: databasePlinthHeight, source: 'database' };
  }

  // Priority 2: Type rules
  if (componentType === 'cornice') return { height: 0, source: 'type-rule' };
  if (componentType === 'pelmet') return { height: 0, source: 'type-rule' };
  if (componentType === 'counter-top') return { height: 0, source: 'type-rule' };
  if (componentType === 'window') return { height: 0, source: 'type-rule' };

  // Wall cabinets: no plinth
  if (componentType === 'cabinet' && componentId.includes('wall-cabinet')) {
    return { height: 0, source: 'type-rule' };
  }

  // Base cabinets: 10cm plinth only if on floor
  if (componentType === 'cabinet' && (!defaultZPosition || defaultZPosition === 0)) {
    return { height: 10, source: 'type-rule' };
  }

  return { height: 0, source: 'default' };
}
```

**Impact:**
- ⚠️ Plinth height depends on `defaultZPosition` (coupling between rules)
- ⚠️ More string matching on `componentId`
- ⚠️ Hardcoded 10cm plinth for base cabinets

---

## 3. Data Structure Rules

### 3.1 DesignElement Interface
**Location:** [project.ts:102-125](src/types/project.ts#L102-L125)

```typescript
export interface DesignElement {
  id: string;
  component_id: string; // Database lookup key
  name?: string;
  type: 'wall' | 'cabinet' | 'appliance' | 'counter-top' | /* ... */;

  // Position (cm)
  x: number;  // X position in room
  y: number;  // Y position in room
  z?: number; // Z position (height off ground)

  // Dimensions (cm)
  width: number;  // X-axis (left-to-right)
  depth: number;  // Y-axis (front-to-back)
  height: number; // Z-axis (bottom-to-top)

  plinth_height?: number; // Toe-kick height

  // Legacy
  verticalHeight?: number; // DEPRECATED

  rotation: number; // Degrees (0-360)

  // Rendering
  zIndex: number;
  isVisible: boolean;

  // Visual
  color?: string;
  material?: string;

  // Corner units
  cornerDoorSide?: 'left' | 'right' | 'auto';
}
```

**Rules:**
- ✅ Clear dimension naming: width=X, depth=Y, height=Z
- ⚠️ `z` is optional (can be undefined)
- ⚠️ Legacy `verticalHeight` still present (technical debt)
- ⚠️ `rotation` is degrees (not radians)

---

### 3.2 Z-Index Layering System
**Location:** [project.ts:128-185](src/types/project.ts#L128-L185)

```typescript
export const getDefaultZIndex = (type: DesignElement['type'], id?: string): number => {
  const isWallCabinet = id && (
    id.includes('wall-cabinet') ||
    id.includes('corner-wall-cabinet') ||
    id.includes('new-corner-wall-cabinet')
  );

  const isTallUnit = id && (
    id.includes('tall') ||
    id.includes('larder') ||
    id.includes('corner-tall')
  );

  switch (type) {
    case 'flooring': return 1.0;
    case 'cabinet':
      if (isWallCabinet) return 4.0;
      if (isTallUnit) return 2.0;
      return 2.0; // Base cabinets
    case 'counter-top': return 3.0;
    case 'sink': return 3.5;
    case 'wall-unit-end-panel': return 4.0;
    case 'pelmet': return 4.5;
    case 'cornice': return 5.0;
    case 'window': return 6.0;
    case 'wall': return 0.5;
    default: return 2.0;
  }
};
```

**Impact:**
- ⚠️ String matching on `id` (again!)
- ⚠️ Z-index determines 2D rendering order (not 3D layering)
- ⚠️ Hardcoded layer values

---

## 4. RoomDimensions Type Rules

### 4.1 Confusing Field Names
**Location:** [project.ts:43-47](src/types/project.ts#L43-L47)

```typescript
export interface RoomDimensions {
  width: number;        // in cm - room width (X-axis) ✅ Makes sense
  height: number;       // in cm - room depth (Y-axis) ❌ CONFUSING!
  ceilingHeight?: number; // in cm - room ceiling height (Z-axis)
}
```

**Problem:**
- ❌ `height` is actually **Y-axis depth** (not Z-axis height!)
- ❌ `ceilingHeight` is the actual vertical height
- ❌ Comment says "called height for legacy compatibility"
- ❌ Creates confusion throughout codebase

**Impact on Coordinate Calculations:**
```typescript
// In PositionCalculation.ts:
const roomDepth = roomDimensions.height; // CONFUSING! height means depth here

// In elevation views:
const calcElevationDepth = roomDimensions.height * zoom; // Actually depth, not height
```

**This naming mismatch propagates through:**
1. Database queries
2. Component calculations
3. Elevation positioning
4. Wall snapping logic
5. Canvas rendering

---

## 5. Caching Rules

### 5.1 Component Cache System
**Location:** [useOptimizedComponents.ts:36-53](src/hooks/useOptimizedComponents.ts#L36-L53)

```typescript
const componentCache = cacheManager.getCache<DatabaseComponent[]>('components', {
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 10,
  enableBatching: false
});

const categoryCache = cacheManager.getCache<DatabaseComponent[]>('components-by-category', {
  ttl: 15 * 60 * 1000,
  maxSize: 100,
  enableBatching: false
});

const roomTypeCache = cacheManager.getCache<DatabaseComponent[]>('components-by-room-type', {
  ttl: 15 * 60 * 1000,
  maxSize: 50,
  enableBatching: false
});
```

**Rules:**
- ✅ 15-minute TTL for all component data
- ✅ Pre-warming of category/room type caches
- ⚠️ Cache invalidation on component update? (unclear)

**Impact:** If component dimensions change in database, UI won't see changes for up to 15 minutes

---

## 6. Summary of Cascading Effects

### Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        COMPONENT DATABASE                         │
│  width: 60cm, depth: 60cm, height: 90cm                          │
│  default_z_position: NULL, plinth_height: NULL                   │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                    COMPONENT SELECTOR CACHE                       │
│  TTL: 15 minutes, Pre-warmed by category/room type              │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                        DRAG PREVIEW                               │
│  width: 69cm (×1.15), depth: 69cm (×1.15) ← SCALE FACTOR        │
│  rotation: 0° (always) ← NO ROTATION PREVIEW                     │
│  Corner detection: String matching 'corner' in name              │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                        DROP EVENT                                 │
│  dataTransfer: {width: 60, depth: 60} ← ORIGINAL DATA           │
│  z: calculated via getDefaultZ() ← TYPE MATCHING RULES           │
│  plinth_height: calculated via getPlinthHeight() ← MORE RULES    │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                      DESIGN ELEMENT                               │
│  x, y: drop position                                             │
│  z: from type rules (0cm for base, 140cm for wall, etc.)        │
│  width: 60cm, depth: 60cm, height: 90cm                          │
│  rotation: from wall snap logic ← AUTO-CALCULATED                │
│  zIndex: from getDefaultZIndex() ← MORE TYPE MATCHING            │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                      2D CANVAS RENDERING                          │
│  Position: roomToCanvas(x, y) ← COORDINATE TRANSFORM             │
│  Dimensions: width × zoom, depth × zoom                           │
│  Rotation: ctx.rotate(rotation × π/180) ← DEGREES TO RADIANS     │
│  Bounding: getRotatedBoundingBox() ← ROTATION-AWARE               │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                      3D SCENE RENDERING                           │
│  Position: (x/100, z/100, y/100) ← CM TO METERS, Y↔Z SWAP       │
│  Dimensions: width/100, height/100, depth/100                     │
│  Rotation: (0, rotation × π/180, 0) ← Y-AXIS ROTATION            │
│  Pivot: positionOffset = {x: width/2, z: depth/2} ← CENTER       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Root Causes of Coordinate Problems

### 7.1 **Multiple Sources of Truth**
- Database has one set of dimensions
- Drag preview scales dimensions by 1.15x
- Type rules calculate Z-position independently
- Wall snap logic calculates rotation independently
- Canvas rendering has its own coordinate transform

### 7.2 **String-Based Logic Everywhere**
- Corner detection: `.includes('corner')`
- Wall cabinet detection: `.includes('wall-cabinet')`
- Tall unit detection: `.includes('tall')` || `.includes('larder')`
- Z-index calculation: Multiple string checks

**Problem:** Fragile, breaks if naming conventions change

### 7.3 **Confusing Field Names**
- `RoomDimensions.height` is actually Y-axis depth
- `DesignElement.height` is Z-axis height
- Different meanings in different contexts

### 7.4 **Cascading Fallback Rules**
```
Position Z = database.default_z_position
           ↓ (if NULL)
         Type-based rules
           ↓ (if no match)
         Default to 0

Plinth = database.plinth_height
       ↓ (if NULL)
     Type-based rules (depends on Z!)
       ↓ (if no match)
     Default to 0
```

**Problem:** Nested dependencies, hard to debug

---

## 8. Recommendations for Refactor

### 8.1 Remove All Scale Factors
```typescript
// ❌ REMOVE THIS
const scaleFactor = 1.15;

// ✅ USE THIS
const scaleFactor = 1.0; // 1:1 with actual dimensions
```

### 8.2 Unify Component Detection
```typescript
// ❌ CURRENT: String matching everywhere
if (id.includes('corner')) { ... }
if (id.includes('wall-cabinet')) { ... }

// ✅ PROPOSED: Database fields
components.is_corner_unit: boolean
components.is_wall_mounted: boolean
components.is_tall_unit: boolean
```

### 8.3 Rename Confusing Fields
```typescript
// ❌ CURRENT
interface RoomDimensions {
  width: number;  // X-axis
  height: number; // Y-axis (confusing!)
  ceilingHeight?: number; // Z-axis
}

// ✅ PROPOSED
interface RoomDimensions {
  width: number;  // X-axis
  depth: number;  // Y-axis (clear!)
  height: number; // Z-axis (clear!)
}
```

### 8.4 Remove Hardcoded Type Rules
```typescript
// ❌ CURRENT: Hardcoded in code
if (componentType === 'cornice') return { z: 200 };

// ✅ PROPOSED: All in database
SELECT default_z_position FROM components WHERE component_id = 'cornice-01';
```

### 8.5 Single Coordinate Transform Engine
```typescript
class TransformEngine {
  // Single source of truth for all coordinate conversions
  worldToCanvas2D(pos: WorldPosition): CanvasPosition;
  worldToThreeJS(pos: WorldPosition): Vector3;
  worldToElevation(pos: WorldPosition, wall: WallDirection): ElevationPosition;
}
```

---

## 9. Impact Assessment

### High Impact Issues (Must Fix)
1. ⚠️ **Drag preview scale factor (1.15x)** - User sees wrong size
2. ⚠️ **RoomDimensions.height naming** - Causes confusion everywhere
3. ⚠️ **String-based type detection** - Fragile, breaks easily

### Medium Impact Issues (Should Fix)
4. ⚠️ **Cascading fallback rules** - Hard to debug
5. ⚠️ **No rotation preview** - Surprise orientation on drop
6. ⚠️ **Hardcoded Z-positions** - Should be in database

### Low Impact Issues (Nice to Have)
7. ⚠️ **15-minute cache TTL** - Delays updates
8. ⚠️ **Legacy verticalHeight field** - Technical debt
9. ⚠️ **Corner special case rendering** - Different from standards

---

## 10. Next Steps

1. **Document all findings** ✅ (This document)
2. **Update refactor plan** to address cascading rules
3. **Create database migration** to add is_corner_unit, is_wall_mounted fields
4. **Remove scale factor** as first quick win
5. **Rename RoomDimensions.height** to .depth (breaking change, needs migration)
6. **Implement TransformEngine** as part of coordinate system refactor

---

**End of Analysis**
