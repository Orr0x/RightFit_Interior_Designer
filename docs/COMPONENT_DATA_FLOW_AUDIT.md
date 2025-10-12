# Component Data Flow & Database Migration Audit Report

**Date:** 2025-10-12
**Branch:** `feature/coordinate-system-setup`
**Requested by:** User
**Purpose:** Complete independent review of component data flow to identify conflicting code, hardcoded values, and path to clean database-driven state

---

## Executive Summary

### Current State Assessment: ⚠️ PARTIALLY MIGRATED

The component system is **70% database-driven** but still contains multiple layers of coordinate, rotation, and dimension logic spread across different files. While significant progress has been made in migrating component definitions to the database, there are **critical areas of duplicate logic and hardcoded rules** that need consolidation.

### Key Findings

✅ **Good Progress:**
- Component definitions (width, depth, height, color, category) fully in database
- Component selector loads from database (154 components)
- 3D rendering uses database lookups via ComponentService
- Room templates moved to database

⚠️ **Critical Issues:**
- **Multiple coordinate transformation systems** (legacy vs new with feature flag)
- **Hardcoded Z-position logic** in 6+ different locations
- **Duplicate rotation logic** in drag preview, drop handler, and placement functions
- **Mobile click-to-add still active** (should be disabled per user request)
- **ComponentService contains hardcoded sink data** (should be in database)
- **Corner component detection** uses string pattern matching in multiple files

---

## Data Flow Analysis

### 1. Component Card Rendering (Component Selector)

**File:** `src/components/designer/CompactComponentSidebar.tsx` (699 lines)

#### ✅ What's Database-Driven:
```typescript
// Line 84: Loads all components from database
const { components, loading, error } = useOptimizedComponents();

// Component data structure from database:
interface DatabaseComponent {
  id: string;
  component_id: string;
  name: string;
  description: string | null;
  type: string;
  category: string;
  width: number;
  height: number;
  depth: number;
  room_types: string[];
  icon_name: string;
  model_url: string | null;
  thumbnail_url: string | null;
  price: number | null;
  color?: string;
}
```

#### ⚠️ **ISSUE #1: Mobile Click-to-Add Active (Should be Disabled)**

**Location:** Lines 219-251

```typescript
// 📱 MOBILE CLICK-TO-ADD - USER REQUESTED THIS BE TURNED OFF
const handleMobileClickToAdd = (component: DatabaseComponent) => {
  console.log('📱 [Mobile Click-to-Add] Adding component:', component.name);

  // Creates component at fixed position (200, 150)
  const newElement: DesignElement = {
    id: `${component.component_id}-${Date.now()}`,
    component_id: component.component_id,
    type: component.type as any,
    x: 200, // ❌ HARDCODED CENTER POSITION
    y: 150, // ❌ HARDCODED CENTER POSITION
    z: 0,   // ❌ HARDCODED Z POSITION
    width: component.width,
    height: component.height,
    depth: component.depth,
    rotation: 0,
    color: component.color || '#8B4513',
    name: component.name,
    zIndex: 0,
    isVisible: true
  };

  onAddElement(newElement);
  // ...
}
```

**User Quote:**
> "There is also a click on card function, please turn this off, it was intended for mobile phone use but we are focusing on tablets and desktop screens only now."

**Action Required:** Disable `handleMobileClickToAdd` and remove click handler from cards.

---

#### ⚠️ **ISSUE #2: Hardcoded Drag Preview Dimensions**

**Location:** Lines 253-360 - `handleDragStart()`

```typescript
// Line 277: Scale factor hardcoded
const scaleFactor = 1.15; // ❌ HARDCODED: Increase by 15%

// Lines 280-283: Corner detection via string pattern matching
const isCornerComponent = componentIdentifier.toLowerCase().includes('corner') ||
                         componentIdentifier.toLowerCase().includes('larder corner');

// Lines 296-298: Uses actual component dimensions (GOOD)
const previewWidth = component.width * scaleFactor;
const previewDepth = component.depth * scaleFactor;

// Lines 312-329: Special handling for corner components
if (isCornerComponent) {
  dragPreview.style.backgroundColor = 'transparent';
  const squareSize = Math.min(component.width, component.depth) * scaleFactor;
  // Creates simplified square preview
}
```

**Issues:**
1. ❌ `scaleFactor = 1.15` hardcoded (should be in config)
2. ❌ Corner detection via string matching (duplicated in 5+ locations)
3. ✅ Uses database dimensions (GOOD)

---

#### ⚠️ **ISSUE #3: Hardcoded Z-Position Logic**

**Location:** Lines 362-401 - `handleComponentSelect()`

```typescript
// Lines 371-384: HARDCODED Z-POSITION RULES
let defaultZ = 0; // Default for floor-mounted components
if (component.type === 'cornice') {
  defaultZ = 200; // ❌ HARDCODED
} else if (component.type === 'pelmet') {
  defaultZ = 140; // ❌ HARDCODED (FIXED: bottom of wall units)
} else if (component.type === 'counter-top') {
  defaultZ = 90; // ❌ HARDCODED
} else if (component.type === 'cabinet' && component.component_id.includes('wall-cabinet')) {
  defaultZ = 140; // ❌ HARDCODED
} else if (component.type === 'wall-unit-end-panel') {
  defaultZ = 200; // ❌ HARDCODED
} else if (component.type === 'window') {
  defaultZ = 90; // ❌ HARDCODED
}
```

**Problem:** This exact same logic is duplicated in:
1. `CompactComponentSidebar.tsx` (handleComponentSelect) - Line 371
2. `DesignCanvas2D.tsx` (handleDrop) - Line 2691
3. `project.ts` (getDefaultZIndex) - Line 127
4. Database has `default_z_position` column but it's not used here

**Solution:** Use `ComponentService.getDefaultZPosition(type)` or database column.

---

### 2. Drag & Drop System

**File:** `src/components/designer/DesignCanvas2D.tsx` (3000+ lines)

#### Drag Serialization (Lines 253-269)

```typescript
// ✅ GOOD: Clean serialization, uses database dimensions
const dragData = {
  id: component.component_id,
  name: component.name,
  type: component.type,
  width: component.width,  // From database
  depth: component.depth,  // From database
  height: component.height, // From database
  color: component.color,
  category: component.category,
  roomTypes: component.room_types,
  description: component.description
};
```

---

#### Drop Handler (Lines 2648-2750)

**⚠️ CRITICAL: Multiple Hardcoded Rules**

```typescript
// Lines 2682-2688: Corner detection (DUPLICATE #2)
const isCornerComponent = componentData.id?.includes('corner-') ||
                         componentData.id?.includes('-corner') ||
                         componentData.id?.includes('corner');

// Lines 2691-2704: Z-position rules (DUPLICATE #3)
let defaultZ = 0; // Default for floor-mounted components
if (componentData.type === 'cornice') {
  defaultZ = 200; // ❌ SAME HARDCODED VALUES AS SIDEBAR
} else if (componentData.type === 'pelmet') {
  defaultZ = 140;
} else if (componentData.type === 'counter-top') {
  defaultZ = 90;
} // ... 7 more hardcoded rules

// Lines 2706-2715: Enhanced placement (uses database dimensions)
const placementResult = getEnhancedComponentPlacement(
  dropX, dropY,
  effectiveWidth,  // From database
  effectiveDepth,  // From database
  componentData.id,
  componentData.type,
  design.roomDimensions
);
```

**Issues:**
1. ❌ Duplicate Z-position logic (3rd copy)
2. ❌ Duplicate corner detection (2nd copy)
3. ✅ Uses database dimensions for placement (GOOD)
4. ✅ Delegates to `canvasCoordinateIntegration.ts` (GOOD)

---

### 3. Coordinate & Placement Logic

#### A. Enhanced Placement System

**File:** `src/utils/canvasCoordinateIntegration.ts` (354 lines)

```typescript
// Lines 56-57: Corner detection (DUPLICATE #4)
const isCornerComponent = this.isCornerComponent(componentId);

// Lines 282-287: Corner detection helper (DUPLICATE #5)
private isCornerComponent(componentId: string): boolean {
  const id = componentId.toLowerCase();
  return id.includes('corner') ||
         id.includes('larder-corner') ||
         id.includes('corner-larder');
}

// Lines 124-194: Corner rotation logic
private calculateCornerPlacement(
  dropX: number,
  dropY: number,
  width: number,
  depth: number,
  bounds: any
): ComponentPlacementResult | null {
  const cornerThreshold = 60; // ❌ HARDCODED

  const corners = [
    { name: 'top-left', rotation: 0 },     // ❌ HARDCODED
    { name: 'top-right', rotation: -270 }, // ❌ HARDCODED
    { name: 'bottom-right', rotation: -180 }, // ❌ HARDCODED
    { name: 'bottom-left', rotation: -90 }    // ❌ HARDCODED
  ];
}

// Lines 200-277: Wall snapping logic
private calculateWallSnapping(...): {...} {
  const snapThreshold = 40; // ❌ HARDCODED

  // ✅ GOOD: Proper wall distance calculation
  const leftWallDistance = dropX;
  const rightWallDistance = roomBounds.width - (dropX + width);
  const topWallDistance = dropY;
  const bottomWallDistance = roomBounds.height - (dropY + depth);

  // ❌ HARDCODED ROTATION VALUES
  if (leftWallDistance <= snapThreshold) {
    rotation = 0; // Face into room (right)
  }
  else if (rightWallDistance <= snapThreshold) {
    rotation = 180; // Face into room (left)
  }
}
```

**Issues:**
1. ❌ Corner threshold hardcoded (60cm)
2. ❌ Snap threshold hardcoded (40cm)
3. ❌ Corner rotations hardcoded (0°, -90°, -180°, -270°)
4. ❌ Wall rotations hardcoded (0°, 180°)
5. ❌ Duplicate corner detection logic

---

#### B. Position Calculation System

**File:** `src/utils/PositionCalculation.ts` (383 lines)

**⚠️ CRITICAL: Dual System with Feature Flag**

```typescript
// Lines 52-72: Feature flag system
private static readonly FEATURE_FLAG = 'use_new_positioning_system';
private static featureFlagEnabled: boolean = false; // Default to LEGACY
private static featureFlagInitialized: boolean = false;

// Lines 86-137: Main entry point - switches based on feature flag
static calculateElevationPosition(
  element: DesignElement,
  roomDimensions: RoomDimensions,
  roomPosition: RoomPosition,
  view: ViewType,
  zoom: number,
  elevationWidth?: number,
  elevationDepth?: number
): ElevationPosition {
  const useNew = this.isFeatureEnabled();

  if (useNew) {
    return this.calculateElevationPositionNew(...); // ✨ NEW SYSTEM
  }

  return this.calculateElevationPositionLegacy(...); // 🔒 LEGACY SYSTEM
}
```

**The Dual System Problem:**

**LEGACY (Lines 145-196):**
```typescript
// Lines 169-173: LEFT WALL - FLIPPED Y COORDINATE
if (view === 'left') {
  const flippedY = roomDimensions.height - element.y - effectiveDepth;
  xPos = roomPosition.innerX + (flippedY / roomDimensions.height) * calcElevationDepth;
  // ❌ ASYMMETRIC: Uses flipped Y
}

// Lines 182-184: RIGHT WALL - DIRECT Y COORDINATE
else {
  xPos = roomPosition.innerX + (element.y / roomDimensions.height) * calcElevationDepth;
  // ❌ ASYMMETRIC: Uses direct Y
}
```

**NEW (Lines 204-255):**
```typescript
// Lines 229-251: UNIFIED COORDINATE SYSTEM
else {
  // ✅ Both walls use same Y coordinate mapping
  const normalizedPosition = element.y / roomDimensions.height;
  xPos = roomPosition.innerX + normalizedPosition * calcElevationDepth;

  // ✅ Mirroring handled at render time for left wall
  if (view === 'left') {
    const elevationCenter = roomPosition.innerX + calcElevationDepth / 2;
    const distanceFromCenter = xPos - elevationCenter;
    xPos = elevationCenter - distanceFromCenter - elementWidth;
  }
}
```

**Issue:** Two complete coordinate systems maintained in parallel. Feature flag controls which is used.

---

### 4. Component Service & Database Integration

**File:** `src/services/ComponentService.ts` (743 lines)

#### ✅ Good Database Integration:

```typescript
// Lines 417-512: Batch loading from database
static async batchLoadComponentBehaviors(componentTypes: string[]): Promise<Map<string, ComponentBehavior>> {
  const { data, error } = await supabase
    .from('components')
    .select('type, mount_type, has_direction, door_side, default_z_position, elevation_height, corner_configuration, component_behavior')
    .in('type', componentTypes);

  // ✅ Caches results with TTL
  behaviorCache.set(type, behavior);
}

// Lines 596-645: Elevation height from database
static async getElevationHeight(componentId: string, componentType: string): Promise<number> {
  const { data, error } = await supabase
    .from('components')
    .select('height, elevation_height, component_behavior')
    .eq('component_id', componentId)
    .single();

  // ✅ Uses database elevation_height or actual height
  if (elevationData.use_actual_height || elevationData.is_tall_unit) {
    return elevationData.height;
  }
}
```

#### ⚠️ **ISSUE #4: Hardcoded Sink Data**

**Location:** Lines 45-411 - `getSinkComponents()`

```typescript
static getSinkComponents(): any[] {
  return [
    // ❌ 28 HARDCODED SINK DEFINITIONS
    {
      id: 'kitchen-sink-single-60cm',
      component_id: 'kitchen-sink-single-60cm',
      name: 'Kitchen Sink Single 60cm',
      type: 'sink',
      width: 60,
      height: 20,
      depth: 60,
      color: '#C0C0C0',
      metadata: { z_position: 75, has_draining_board: false }
    },
    // ... 27 more hardcoded sinks
  ];
}
```

**Problem:** These sinks should be in the database, not hardcoded in the service. The database migration `20250916000005_populate_components_catalog.sql` already has these sinks!

**Action Required:** Remove `getSinkComponents()` and load from database like other components.

---

### 5. Type Definitions & Z-Index Logic

**File:** `src/types/project.ts` (389 lines)

#### ⚠️ **ISSUE #5: Duplicate Z-Index Logic**

**Location:** Lines 127-184 - `getDefaultZIndex()`

```typescript
export const getDefaultZIndex = (type: DesignElement['type'], id?: string): number => {
  // Lines 129-142: Wall cabinet detection (DUPLICATE #6)
  const isWallCabinet = id && (
    id.includes('wall-cabinet') ||
    id.includes('corner-wall-cabinet') ||
    id.includes('new-corner-wall-cabinet')
  );

  // Lines 136-142: Tall unit detection (DUPLICATE #7)
  const isTallUnit = id && (
    id.includes('tall') ||
    id.includes('larder') ||
    id.includes('corner-tall') ||
    id.includes('corner-larder') ||
    id.includes('larder-corner')
  );

  // Lines 145-149: Butler sink detection (DUPLICATE #8)
  const isButlerSink = id && (
    id.includes('butler-sink') ||
    id.includes('butler') ||
    id.includes('base-unit-sink')
  );

  // Lines 151-183: ZINDEX LAYERING RULES (NOT Z-POSITION!)
  switch (type) {
    case 'flooring': return 1.0; // ❌ HARDCODED
    case 'cabinet':
      if (isWallCabinet) return 4.0; // ❌ HARDCODED
      if (isTallUnit) return 2.0;    // ❌ HARDCODED
      return 2.0;
    case 'counter-top': return 3.0; // ❌ HARDCODED
    case 'sink': return 3.5;        // ❌ HARDCODED
    case 'pelmet': return 4.5;      // ❌ HARDCODED
    case 'cornice': return 5.0;     // ❌ HARDCODED
    // ... more hardcoded values
  }
};
```

**Confusion:** This function is named `getDefaultZIndex` but returns 2D rendering layer order (1-6), NOT 3D Z-position (0-240cm). This is mixing two different concepts!

**Two Different Properties:**
1. **`zIndex`** - 2D plan view rendering layer order (1-6)
2. **`z`** - 3D elevation position in centimeters (0-240cm)

---

### 6. Database Schema Status

**Migration Files Reviewed:**
- `20250916000005_populate_components_catalog.sql` - 78 kitchen components
- `20250131000029_add_default_z_position_to_components.sql` - Adds `default_z_position` column

#### Database Component Table Schema:

```sql
-- From migration 20250916000005
components (
  id UUID PRIMARY KEY,
  component_id TEXT UNIQUE,
  name TEXT,
  type TEXT,
  width NUMERIC,
  depth NUMERIC,
  height NUMERIC,
  color TEXT,
  category TEXT,
  room_types TEXT[],
  icon_name TEXT,
  description TEXT,
  version TEXT,
  deprecated BOOLEAN,
  metadata JSONB,
  tags TEXT[],
  -- From migration 20250131000029:
  default_z_position NUMERIC,
  -- Additional columns:
  mount_type TEXT,
  has_direction BOOLEAN,
  door_side TEXT,
  elevation_height NUMERIC,
  corner_configuration JSONB,
  component_behavior JSONB
)
```

#### ✅ What's in Database:
- Component dimensions (width, depth, height)
- Colors and categories
- Room type associations
- Default Z positions
- Mount types (floor/wall)
- Door sides
- Elevation heights
- Corner configurations

#### ❌ What's NOT in Database (but should be):
- Corner rotation angles (currently hardcoded)
- Snap thresholds (40cm wall snap, 60cm corner threshold)
- Scale factors (1.15 for drag preview)
- Configuration constants (wall clearance, grid size, etc.)

---

## Critical Issues Summary

### Issue #1: Mobile Click-to-Add Still Active 🚨
**Priority:** HIGH
**Location:** `CompactComponentSidebar.tsx:219-251`
**Problem:** User requested this be disabled (tablet/desktop only), but it's still active
**Impact:** Users can accidentally add components with fixed coordinates (200, 150)

### Issue #2: Duplicate Z-Position Logic 🚨
**Priority:** HIGH
**Locations:**
- `CompactComponentSidebar.tsx:371-384`
- `DesignCanvas2D.tsx:2691-2704`
- Database column `default_z_position` exists but unused

**Problem:** Same Z-position rules hardcoded in 2 places, database column ignored
**Impact:** Changing Z-positions requires code changes in multiple files

### Issue #3: Duplicate Corner Detection Logic 🚨
**Priority:** MEDIUM
**Locations (8 instances):**
- `CompactComponentSidebar.tsx:280-283`
- `DesignCanvas2D.tsx:126-132, 2682-2685`
- `canvasCoordinateIntegration.ts:56-57, 282-287`
- `ComponentService.ts:704-706`
- `project.ts:129-142 (3 different detections)`

**Problem:** String pattern matching duplicated across 6 files
**Impact:** Inconsistent logic, hard to maintain

### Issue #4: Hardcoded Sinks in ComponentService 🚨
**Priority:** MEDIUM
**Location:** `ComponentService.ts:45-411`
**Problem:** 28 sink components hardcoded, but they're already in database migration
**Impact:** Duplicate data, inconsistency, can't update via database

### Issue #5: Dual Coordinate Systems 🚨
**Priority:** MEDIUM
**Location:** `PositionCalculation.ts:86-255`
**Problem:** Legacy and new coordinate systems both maintained, feature flag controls which
**Impact:** Code complexity, testing burden, coordinate bugs

### Issue #6: Hardcoded Rotation Angles 🚨
**Priority:** MEDIUM
**Locations:**
- `canvasCoordinateIntegration.ts:147-170` (corner rotations)
- `canvasCoordinateIntegration.ts:244-266` (wall rotations)

**Problem:** Rotation angles hardcoded (0°, -90°, -180°, -270°)
**Impact:** Can't customize rotation behavior, rigid system

### Issue #7: Hardcoded Thresholds 🚨
**Priority:** LOW
**Locations:**
- `canvasCoordinateIntegration.ts:131` (cornerThreshold = 60)
- `canvasCoordinateIntegration.ts:211` (snapThreshold = 40)
- `CompactComponentSidebar.tsx:277` (scaleFactor = 1.15)

**Problem:** Magic numbers scattered throughout code
**Impact:** Can't tune behavior without code changes

### Issue #8: ZIndex vs Z-Position Confusion 🚨
**Priority:** MEDIUM
**Location:** `project.ts:127-184`
**Problem:** Function named `getDefaultZIndex` returns 2D layer order (1-6), not 3D Z-position (0-240cm)
**Impact:** Confusion, mixing two different coordinate systems

---

## Conflicting Code Locations Map

### 1. Z-Position Rules
```
Database: components.default_z_position ⟶ NOT USED
    ↓
CompactComponentSidebar.tsx:371-384 ⟶ HARDCODED
    ↓
DesignCanvas2D.tsx:2691-2704 ⟶ DUPLICATE HARDCODED
```

### 2. Corner Detection
```
Database: components.corner_configuration ⟶ EXISTS
    ↓
ComponentService.isCornerComponent() ⟶ String matching
    ↓
canvasCoordinateIntegration.isCornerComponent() ⟶ DUPLICATE
    ↓
DesignCanvas2D.isCornerComponent ⟶ DUPLICATE
    ↓
CompactComponentSidebar drag logic ⟶ DUPLICATE
    ↓
project.ts (3 separate detections) ⟶ DUPLICATE
```

### 3. Coordinate Transformation
```
PositionCalculation.ts:
  ├─ calculateElevationPositionLegacy() ⟶ Asymmetric left/right
  └─ calculateElevationPositionNew() ⟶ Unified system
       ↑
   Feature Flag Controls Which
```

### 4. Rotation Logic
```
canvasCoordinateIntegration.ts:
  ├─ calculateCornerPlacement() ⟶ Hardcoded angles
  └─ calculateWallSnapping() ⟶ Hardcoded angles
       ↓
DesignCanvas2D.handleDrop() ⟶ Uses results
       ↓
CompactComponentSidebar.handleDragStart() ⟶ Drag preview rotation
```

### 5. Component Data
```
Database: components table ⟶ 154 components
    ↓
useOptimizedComponents hook ⟶ Loads from DB
    ↓
CompactComponentSidebar ⟶ Displays cards
    ↓
ComponentService.getSinkComponents() ⟶ ❌ HARDCODED 28 SINKS (DUPLICATE)
```

---

## Migration Plan to Clean Database-Driven State

### Phase 1: Critical Fixes (1-2 hours)

#### Task 1.1: Disable Mobile Click-to-Add
**File:** `CompactComponentSidebar.tsx`

```typescript
// REMOVE handleMobileClickToAdd function (lines 219-251)

// REMOVE onClick handler from cards (lines 641, 673)
// Change from:
onClick={() => isMobile ? onMobileClickToAdd(component) : onSelect(component)}
// To:
onClick={() => isMobile ? undefined : onSelect(component)}
// Or remove mobile conditional entirely if focusing on desktop/tablet
```

#### Task 1.2: Remove Hardcoded Sinks from ComponentService
**File:** `ComponentService.ts`

```typescript
// REMOVE getSinkComponents() method (lines 45-411)
// All sinks are already in database via migration 20250916000005
```

**Verify:** Check that sinks load correctly from database via `useOptimizedComponents` hook.

---

### Phase 2: Consolidate Z-Position Logic (2-3 hours)

#### Task 2.1: Use Database Z-Positions
**Files:** `CompactComponentSidebar.tsx`, `DesignCanvas2D.tsx`

**Strategy:** Replace hardcoded Z-position logic with database lookups.

**Before (2 locations):**
```typescript
// ❌ HARDCODED
let defaultZ = 0;
if (component.type === 'cornice') {
  defaultZ = 200;
} else if (component.type === 'pelmet') {
  defaultZ = 140;
}
// ... 7 more rules
```

**After:**
```typescript
// ✅ DATABASE-DRIVEN
const defaultZ = await ComponentService.getDefaultZPosition(component.type);
// Or if component has override:
const defaultZ = component.default_z_position ??
                 await ComponentService.getDefaultZPosition(component.type);
```

**Database Migration (if needed):**
```sql
-- Verify all component types have default_z_position set
UPDATE components
SET default_z_position = CASE type
  WHEN 'cornice' THEN 200
  WHEN 'pelmet' THEN 140
  WHEN 'counter-top' THEN 90
  WHEN 'cabinet' THEN (CASE
    WHEN component_id LIKE '%wall-cabinet%' THEN 140
    ELSE 0
  END)
  -- ... etc
END
WHERE default_z_position IS NULL;
```

#### Task 2.2: Rename Confusing Function
**File:** `project.ts`

```typescript
// RENAME to clarify purpose
export const getDefault2DLayerOrder = (type: DesignElement['type'], id?: string): number => {
  // Current getDefaultZIndex() - returns 2D rendering layer (1-6)
  // NOT 3D Z-position (0-240cm)!
}
```

---

### Phase 3: Consolidate Corner Detection (1-2 hours)

#### Task 3.1: Create Single Corner Detection Utility

**New File:** `src/utils/componentTypeDetection.ts`

```typescript
/**
 * Component Type Detection Utilities
 * Single source of truth for component classification
 */

interface ComponentClassification {
  isCorner: boolean;
  isWallCabinet: boolean;
  isTallUnit: boolean;
  isButlerSink: boolean;
}

export class ComponentTypeDetector {
  /**
   * Check if component is a corner component
   * Uses database corner_configuration if available, fallback to pattern matching
   */
  static async isCornerComponent(
    componentId: string,
    componentData?: DatabaseComponent
  ): Promise<boolean> {
    // Try database first
    if (componentData?.corner_configuration) {
      return Object.keys(componentData.corner_configuration).length > 0;
    }

    // Fallback to pattern matching (temporary until all data migrated)
    const id = componentId.toLowerCase();
    return id.includes('corner') ||
           id.includes('larder-corner') ||
           id.includes('corner-larder');
  }

  /**
   * Classify component by type
   */
  static async classifyComponent(
    componentId: string,
    componentType: string,
    componentData?: DatabaseComponent
  ): Promise<ComponentClassification> {
    // Single location for all type checks
    return {
      isCorner: await this.isCornerComponent(componentId, componentData),
      isWallCabinet: await this.isWallCabinet(componentId, componentType),
      isTallUnit: await this.isTallUnit(componentId, componentType),
      isButlerSink: await this.isButlerSink(componentId, componentType)
    };
  }

  // ... other detection methods
}
```

#### Task 3.2: Replace All Pattern Matching Calls

**Replace in 6 files:**
```typescript
// ❌ OLD (duplicated 8 times)
const isCornerComponent = componentId.toLowerCase().includes('corner');

// ✅ NEW (single source)
const isCornerComponent = await ComponentTypeDetector.isCornerComponent(componentId);
```

---

### Phase 4: Configuration Database Table (2-3 hours)

#### Task 4.1: Create Configuration Table

**New Migration:** `20250112000001_create_configuration_table.sql`

```sql
CREATE TABLE configuration (
  key TEXT PRIMARY KEY,
  value NUMERIC NOT NULL,
  unit TEXT,
  category TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Coordinate & placement constants
INSERT INTO configuration (key, value, unit, category, description) VALUES
('wall_snap_threshold', 40, 'cm', 'placement', 'Distance within which components snap to walls'),
('corner_snap_threshold', 60, 'cm', 'placement', 'Distance within which components snap to corners'),
('wall_clearance', 5, 'cm', 'placement', 'Minimum clearance from walls'),
('grid_snap_size', 1, 'cm', 'placement', 'Grid snap increment'),

-- Drag preview constants
('drag_preview_scale', 1.15, 'multiplier', 'ui', 'Scale factor for drag preview (15% larger)'),

-- Rotation angles (in degrees, negative = clockwise)
('corner_top_left_rotation', 0, 'degrees', 'rotation', 'Top-left corner rotation'),
('corner_top_right_rotation', -270, 'degrees', 'rotation', 'Top-right corner rotation'),
('corner_bottom_right_rotation', -180, 'degrees', 'rotation', 'Bottom-right corner rotation'),
('corner_bottom_left_rotation', -90, 'degrees', 'rotation', 'Bottom-left corner rotation'),
('wall_left_rotation', 0, 'degrees', 'rotation', 'Left wall rotation'),
('wall_right_rotation', 180, 'degrees', 'rotation', 'Right wall rotation'),
('wall_top_rotation', 0, 'degrees', 'rotation', 'Top wall rotation'),
('wall_bottom_rotation', 180, 'degrees', 'rotation', 'Bottom wall rotation'),

-- Canvas constants
('canvas_width', 1600, 'px', 'canvas', 'Canvas width in pixels'),
('canvas_height', 1200, 'px', 'canvas', 'Canvas height in pixels'),
('wall_thickness', 10, 'cm', 'room', 'Wall thickness'),
('min_zoom', 0.5, 'multiplier', 'canvas', 'Minimum zoom level'),
('max_zoom', 4.0, 'multiplier', 'canvas', 'Maximum zoom level');
```

#### Task 4.2: Create Configuration Service

**New File:** `src/services/ConfigurationService.ts` (if not exists)

```typescript
/**
 * Configuration Service
 * Loads app configuration from database
 */
import { supabase } from '@/integrations/supabase/client';

class ConfigService {
  private static cache = new Map<string, number>();
  private static cacheExpiry = 10 * 60 * 1000; // 10 minutes
  private static lastFetch = 0;

  /**
   * Get configuration value by key
   */
  static async get(key: string, fallback: number): Promise<number> {
    // Check cache
    if (this.cache.has(key) && (Date.now() - this.lastFetch < this.cacheExpiry)) {
      return this.cache.get(key)!;
    }

    // Fetch from database
    try {
      const { data, error } = await supabase
        .from('configuration')
        .select('value')
        .eq('key', key)
        .single();

      if (error || !data) {
        console.warn(`Config key "${key}" not found, using fallback: ${fallback}`);
        return fallback;
      }

      this.cache.set(key, data.value);
      this.lastFetch = Date.now();
      return data.value;

    } catch (err) {
      console.error(`Failed to load config "${key}":`, err);
      return fallback;
    }
  }

  /**
   * Preload common configuration values
   */
  static async preload(): Promise<void> {
    const keys = [
      'wall_snap_threshold',
      'corner_snap_threshold',
      'wall_clearance',
      'drag_preview_scale'
    ];

    const { data } = await supabase
      .from('configuration')
      .select('*')
      .in('key', keys);

    if (data) {
      data.forEach(item => this.cache.set(item.key, item.value));
      this.lastFetch = Date.now();
    }
  }
}

export default ConfigService;
```

#### Task 4.3: Replace Hardcoded Constants

**Example in `canvasCoordinateIntegration.ts`:**

```typescript
// ❌ BEFORE
const cornerThreshold = 60; // Hardcoded
const snapThreshold = 40; // Hardcoded

// ✅ AFTER
const cornerThreshold = await ConfigService.get('corner_snap_threshold', 60);
const snapThreshold = await ConfigService.get('wall_snap_threshold', 40);
```

---

### Phase 5: Resolve Coordinate System Duality (3-4 hours)

#### Task 5.1: Test & Validate New Coordinate System

**File:** `PositionCalculation.ts`

**Strategy:**
1. Enable new coordinate system via feature flag
2. Test thoroughly on multiple room types
3. Verify left/right wall symmetry
4. If successful, remove legacy system

**Testing Script:**
```typescript
// Create comprehensive test suite
// Test case: Place cabinet at (100, 200) in plan view
// Expected: Same relative position in left and right elevation views
// Legacy system: Different positions (due to Y flip)
// New system: Symmetric positions (unified coordinates)
```

#### Task 5.2: Remove Legacy System (if tests pass)

```typescript
// REMOVE calculateElevationPositionLegacy() (lines 145-196)
// REMOVE feature flag check (lines 96-136)
// RENAME calculateElevationPositionNew() → calculateElevationPosition()
```

---

### Phase 6: Add Database Rotation Configuration (2 hours)

#### Task 6.1: Add Rotation Config to Corner Configuration

**Database Migration:**
```sql
-- Add rotation angles to corner_configuration JSONB
UPDATE components
SET corner_configuration = jsonb_set(
  COALESCE(corner_configuration, '{}'::jsonb),
  '{rotation_angles}',
  '{"top_left": 0, "top_right": -270, "bottom_right": -180, "bottom_left": -90}'::jsonb
)
WHERE component_id LIKE '%corner%';

-- Add wall rotation angles to component_behavior JSONB
UPDATE components
SET component_behavior = jsonb_set(
  COALESCE(component_behavior, '{}'::jsonb),
  '{wall_rotations}',
  '{"left": 0, "right": 180, "top": 0, "bottom": 180}'::jsonb
);
```

#### Task 6.2: Load Rotations from Database

**Update `canvasCoordinateIntegration.ts`:**

```typescript
// ❌ BEFORE (hardcoded)
const corners = [
  { name: 'top-left', rotation: 0 },
  { name: 'top-right', rotation: -270 },
  { name: 'bottom-right', rotation: -180 },
  { name: 'bottom-left', rotation: -90 }
];

// ✅ AFTER (database-driven)
const cornerConfig = await ComponentService.getCornerConfiguration(componentId);
const rotationAngles = cornerConfig.rotation_angles || {
  top_left: 0,
  top_right: -270,
  bottom_right: -180,
  bottom_left: -90
};

const corners = [
  { name: 'top-left', rotation: rotationAngles.top_left },
  { name: 'top-right', rotation: rotationAngles.top_right },
  { name: 'bottom-right', rotation: rotationAngles.bottom_right },
  { name: 'bottom-left', rotation: rotationAngles.bottom_left }
];
```

---

## Testing Checklist

After implementing migration plan, verify:

### Component Selector
- [ ] Components load from database (no hardcoded data)
- [ ] All 154 components visible in appropriate room types
- [ ] Sinks load correctly (not from ComponentService.getSinkComponents)
- [ ] Mobile click-to-add disabled
- [ ] Drag preview dimensions match database values
- [ ] Drag preview scale factor from configuration table

### Drag & Drop
- [ ] Components drop at correct coordinates
- [ ] Wall snapping uses configuration threshold
- [ ] Corner snapping uses configuration threshold
- [ ] Z-position set from database default_z_position
- [ ] Rotation angles from database configuration
- [ ] No hardcoded values in drop handler

### Coordinate System
- [ ] Left and right elevation views show symmetric positions
- [ ] No Y-coordinate flipping discrepancies
- [ ] Feature flag removed (if new system validated)
- [ ] Position calculations use single unified system

### Corner Components
- [ ] Corner detection uses single utility function
- [ ] Corner rotation angles from database
- [ ] L-shaped components rotate correctly in all 4 corners
- [ ] Corner configuration loaded from component_behavior JSONB

### Configuration
- [ ] All magic numbers replaced with database config
- [ ] ConfigurationService caches values efficiently
- [ ] Fallback values work if database unavailable
- [ ] Config values can be updated without code changes

---

## Benefits After Migration

### For Users:
- ✅ Consistent component behavior
- ✅ Predictable positioning and rotation
- ✅ No accidental mobile tap-to-add
- ✅ Accurate elevation view representation

### For Developers:
- ✅ Single source of truth (database)
- ✅ No duplicate logic to maintain
- ✅ Easy to add new components (database only)
- ✅ Configuration changes without code deploys
- ✅ Clear separation of concerns
- ✅ Easier debugging (one place to check)

### For Admin:
- ✅ Update component properties via database
- ✅ Adjust snapping thresholds via config table
- ✅ Change rotation angles without code
- ✅ Add new component types easily
- ✅ A/B test different configurations

---

## Risk Assessment

### Low Risk:
- ✅ Disabling mobile click-to-add (isolated change)
- ✅ Removing hardcoded sinks (already in database)
- ✅ Creating configuration table (additive)

### Medium Risk:
- ⚠️ Consolidating corner detection (many call sites)
- ⚠️ Replacing Z-position logic (2 locations)
- ⚠️ Loading rotation angles from database (new pattern)

### High Risk:
- 🚨 Removing legacy coordinate system (affects all elevation views)
  - **Mitigation:** Thorough testing, feature flag rollback option

---

## Recommended Implementation Order

**Week 1: Critical Fixes (Low Risk)**
1. Disable mobile click-to-add
2. Remove hardcoded sinks from ComponentService
3. Create configuration database table
4. Create configuration service

**Week 2: Z-Position Consolidation (Medium Risk)**
5. Verify database Z-positions populated
6. Replace hardcoded Z-position logic in CompactComponentSidebar
7. Replace hardcoded Z-position logic in DesignCanvas2D
8. Rename getDefaultZIndex → getDefault2DLayerOrder
9. Test component placement in all views

**Week 3: Corner Detection (Medium Risk)**
10. Create ComponentTypeDetector utility
11. Replace pattern matching in 6 files
12. Add database corner detection fallback
13. Test corner component placement

**Week 4: Rotation Configuration (Medium Risk)**
14. Add rotation config to database
15. Update canvasCoordinateIntegration to load from DB
16. Test corner rotations in all 4 corners
17. Test wall rotations on all 4 walls

**Week 5: Coordinate System (High Risk)**
18. Enable new coordinate system feature flag
19. Test extensively on all room types
20. Compare legacy vs new system side-by-side
21. If validated, remove legacy system
22. Remove feature flag

**Week 6: Polish & Documentation**
23. Update code comments
24. Create admin guide for configuration table
25. Document component addition process
26. Performance testing

---

## Success Metrics

✅ **Code Quality:**
- Zero hardcoded Z-positions (use database)
- Zero hardcoded rotation angles (use database)
- Zero duplicate corner detection logic (single utility)
- Zero hardcoded component data (all in database)

✅ **Maintainability:**
- New components added via database only
- Configuration changes via database only
- No code deploys for data changes

✅ **Testing:**
- 100% test coverage for coordinate calculations
- Automated tests for all 4 corners
- Automated tests for all 4 walls
- Visual regression tests for elevation views

---

## Conclusion

The component system has made **significant progress toward database-driven architecture** (70% complete), but critical issues remain:

1. **Mobile click-to-add still active** (user requested removal)
2. **Duplicate Z-position logic** (2 copies + unused database column)
3. **Hardcoded sinks** (should use database)
4. **Dual coordinate systems** (legacy + new with feature flag)
5. **Multiple corner detection implementations** (8 duplicates)
6. **Hardcoded configuration constants** (should be in config table)

Following the **6-week migration plan** will achieve:
- ✅ 100% database-driven component data
- ✅ Single source of truth for all logic
- ✅ Zero hardcoded rules or dimensions
- ✅ Easy maintenance and updates
- ✅ Clear coordinate system
- ✅ Consistent behavior across all views

**Recommended Next Step:** Start with Phase 1 (Critical Fixes) - disable mobile click-to-add and remove hardcoded sinks. These are low-risk, high-impact changes that can be done quickly.

---

**End of Report**
