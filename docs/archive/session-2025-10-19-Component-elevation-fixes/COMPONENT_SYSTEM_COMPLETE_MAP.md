# Complete Component System Architecture Map

**Date:** 2025-10-19
**Purpose:** Comprehensive documentation of ALL touchpoints for component positioning, rotation, dimensions, and geometry across 3D, 2D plan, and elevation views
**Status:** Living Document

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Architecture](#database-architecture)
3. [Component Data Storage](#component-data-storage)
4. [3D Rendering Pipeline](#3d-rendering-pipeline)
5. [2D Plan View Rendering](#2d-plan-view-rendering)
6. [2D Elevation View Rendering](#2d-elevation-view-rendering)
7. [Coordinate Systems](#coordinate-systems)
8. [Component Positioning Logic](#component-positioning-logic)
9. [Component Rotation Logic](#component-rotation-logic)
10. [Component Dimensions & Geometry](#component-dimensions--geometry)
11. [State Management & Data Flow](#state-management--data-flow)
12. [All Touchpoint Files Reference](#all-touchpoint-files-reference)

---

## System Overview

### Architecture Principle
**Database-Driven Everything**: Components are defined in the database with metadata for 2D/3D rendering. Code interprets metadata rather than hardcoding logic.

### Three Rendering Modes
1. **3D View** - Three.js world space (meters, center origin)
2. **2D Plan View** - Top-down canvas (centimeters, top-left origin)
3. **2D Elevation Views** - Side views (front/back/left/right)

### Data Flow
```
Database (PostgreSQL via Supabase)
  ↓
Services (ComponentService, Render2DService, RoomService)
  ↓
State Management (ProjectContext)
  ↓
Rendering Components (DesignCanvas2D, AdaptiveView3D)
  ↓
User's Screen (Canvas 2D API, Three.js WebGL)
```

---

## Database Architecture

### Core Tables

#### 1. `components` Table
**Purpose:** Master catalog of all components (194 components across 8 room types)

**Schema:**
```sql
CREATE TABLE components (
  id UUID PRIMARY KEY,
  component_id TEXT UNIQUE NOT NULL,  -- Stable ID: "base-cabinet-60"
  name TEXT NOT NULL,                  -- Display name
  type TEXT NOT NULL,                  -- Element type (cabinet, appliance, etc.)
  width DECIMAL(10,2) NOT NULL,        -- X-axis dimension (cm)
  depth DECIMAL(10,2) NOT NULL,        -- Y-axis dimension (cm)
  height DECIMAL(10,2) NOT NULL,       -- Z-axis dimension (cm)
  color TEXT NOT NULL,                 -- Default color
  category TEXT NOT NULL,              -- base-cabinets, wall-units, etc.
  room_types TEXT[] NOT NULL,          -- Which rooms can use this
  icon_name TEXT NOT NULL,             -- Icon for sidebar
  description TEXT NOT NULL,
  version TEXT DEFAULT '1.0.0',
  deprecated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}'
);
```

**Location:** `supabase/migrations/20250912300000_complete_component_system.sql`

**Key Constraints:**
- `component_id` is UNIQUE and stable (never changes even if name changes)
- Dimensions must be > 0
- Room types array allows multi-room components

---

#### 2. `component_3d_models` Table
**Purpose:** 3D geometry definitions and auto-rotation rules

**Schema:**
```sql
CREATE TABLE component_3d_models (
  id UUID PRIMARY KEY,
  component_id VARCHAR(100) UNIQUE NOT NULL,
  component_name VARCHAR(200) NOT NULL,
  component_type VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  geometry_type VARCHAR(50) DEFAULT 'standard',  -- standard, l_shaped_corner, larder_corner

  -- Corner unit specific
  is_corner_component BOOLEAN DEFAULT FALSE,
  leg_length DECIMAL(10, 4),           -- For L-shaped corners
  corner_depth_wall DECIMAL(10, 4),    -- Wall cabinet depth
  corner_depth_base DECIMAL(10, 4),    -- Base cabinet depth

  -- Rotation configuration (formula strings)
  rotation_center_x VARCHAR(100),      -- e.g., 'legLength/2'
  rotation_center_y VARCHAR(100),
  rotation_center_z VARCHAR(100),

  -- Auto-rotate rules (degrees for each wall)
  has_direction BOOLEAN DEFAULT FALSE,
  auto_rotate_enabled BOOLEAN DEFAULT TRUE,
  wall_rotation_left INTEGER,          -- 90
  wall_rotation_right INTEGER,         -- 270
  wall_rotation_top INTEGER,           -- 0
  wall_rotation_bottom INTEGER,        -- 180
  corner_rotation_front_left INTEGER,
  corner_rotation_front_right INTEGER,
  corner_rotation_back_left INTEGER,
  corner_rotation_back_right INTEGER,

  -- Default dimensions
  default_width DECIMAL(10, 4),
  default_height DECIMAL(10, 4),
  default_depth DECIMAL(10, 4),

  description TEXT
);
```

**Location:** `supabase/migrations/20250129000006_create_3d_models_schema.sql`

**Total Records:** 198 3D models (97% coverage of components)

---

#### 3. `geometry_parts` Table
**Purpose:** Individual 3D geometry pieces (plinth, cabinet body, doors, handles, etc.)

**Schema:**
```sql
CREATE TABLE geometry_parts (
  id UUID PRIMARY KEY,
  model_id UUID REFERENCES component_3d_models(id) ON DELETE CASCADE,

  part_name VARCHAR(100) NOT NULL,     -- 'plinth', 'cabinet_body', 'door', 'handle'
  part_type VARCHAR(50) NOT NULL,      -- 'box', 'cylinder', 'sphere'
  render_order INTEGER DEFAULT 0,      -- Drawing order

  -- Position formulas (evaluated at runtime)
  position_x VARCHAR(200),             -- e.g., '0', 'width/2', 'cornerDepth/2 - legLength/2'
  position_y VARCHAR(200),             -- e.g., '0.075', 'height/2 + 0.15'
  position_z VARCHAR(200),             -- e.g., 'depth/2 + 0.01'

  -- Dimension formulas
  dimension_width VARCHAR(200),        -- e.g., 'width', 'legLength - 0.05'
  dimension_height VARCHAR(200),       -- e.g., 'cabinetHeight', '0.15'
  dimension_depth VARCHAR(200),        -- e.g., 'depth', 'cornerDepth'

  -- Material and appearance
  material_name VARCHAR(50),           -- 'cabinet_body', 'door', 'handle', 'plinth'
  color_override VARCHAR(50),
  metalness DECIMAL(3, 2),
  roughness DECIMAL(3, 2),
  opacity DECIMAL(3, 2) DEFAULT 1.0,

  -- Conditional rendering
  render_condition VARCHAR(200)        -- e.g., '!isWallCabinet', 'isSelected'
);
```

**Location:** `supabase/migrations/20250129000006_create_3d_models_schema.sql`

**Total Records:** 591 geometry parts

**Formula Evaluation:** See `FormulaEvaluator.ts`

---

#### 4. `component_2d_renders` Table
**Purpose:** 2D rendering metadata for plan and elevation views

**Schema:**
```sql
CREATE TABLE component_2d_renders (
  id UUID PRIMARY KEY,
  component_id TEXT REFERENCES components(component_id) ON DELETE CASCADE,

  -- Plan view (top-down)
  plan_view_type TEXT DEFAULT 'rectangle',
  plan_view_data JSONB DEFAULT '{}',
  plan_view_svg TEXT,

  -- Elevation views (front/back)
  elevation_type TEXT DEFAULT 'standard-cabinet',
  elevation_data JSONB DEFAULT '{}',
  elevation_svg_front TEXT,
  elevation_svg_back TEXT,

  -- Side elevations (left/right)
  side_elevation_type TEXT DEFAULT 'standard-cabinet',
  side_elevation_data JSONB DEFAULT '{}',
  elevation_svg_left TEXT,
  elevation_svg_right TEXT,

  -- Visual properties
  fill_color TEXT DEFAULT '#8b4513',
  stroke_color TEXT DEFAULT '#000000',
  stroke_width NUMERIC DEFAULT 1
);
```

**Location:** `supabase/migrations/20251009000001_create_2d_renders_schema.sql`

**Plan View Types:**
- `rectangle` - Standard rectangular shape
- `corner-square` - L-shaped corner units
- `sink-single` - Single bowl sink with custom shape
- `sink-double` - Double bowl sink
- `sink-corner` - Corner sink
- `custom-svg` - Custom SVG path

**Elevation Types:**
- `standard-cabinet` - Cabinet with doors/handles
- `appliance` - Appliance front panel
- `sink` - Sink elevation view
- `open-shelf` - Open shelving
- `custom-svg` - Custom SVG path

---

#### 5. `material_definitions` Table
**Purpose:** Material properties for 3D rendering

**Schema:**
```sql
CREATE TABLE material_definitions (
  id UUID PRIMARY KEY,
  material_name VARCHAR(50) UNIQUE NOT NULL,
  material_type VARCHAR(50) NOT NULL,
  default_color VARCHAR(50),
  roughness DECIMAL(3, 2) DEFAULT 0.7,
  metalness DECIMAL(3, 2) DEFAULT 0.1,
  opacity DECIMAL(3, 2) DEFAULT 1.0,
  description TEXT
);
```

**Pre-defined Materials:**
- `cabinet_body` - Main cabinet material
- `door` - Cabinet doors
- `handle` - Metallic handles
- `plinth` - Toe kick/plinth
- `worktop` - Counter-tops
- `appliance_steel` - Stainless steel appliances
- `sink` - Sink basin material

---

### Database Indexes

**Performance Optimizations:**
```sql
-- Components
idx_components_component_id (component_id)
idx_components_category (category)
idx_components_type (type)
idx_components_tags (tags) -- GIN index

-- 3D Models
idx_component_3d_models_component_id (component_id)
idx_component_3d_models_type (component_type)
idx_component_3d_models_corner (is_corner_component)

-- Geometry Parts
idx_geometry_parts_model_id (model_id)
idx_geometry_parts_render_order (model_id, render_order)

-- 2D Renders
idx_component_2d_renders_component_id (component_id)
idx_component_2d_renders_plan_view_type (plan_view_type)
idx_component_2d_renders_elevation_type (elevation_type)
```

---

## Component Data Storage

### DesignElement Interface
**Location:** `src/types/project.ts` (lines 103-124)

```typescript
export interface DesignElement {
  id: string;                    // Unique instance ID (UUID)
  component_id: string;          // References components.component_id
  name?: string;                 // Display name
  type: 'wall' | 'cabinet' | 'appliance' | 'counter-top' | 'end-panel' |
        'window' | 'door' | 'flooring' | 'toe-kick' | 'cornice' | 'pelmet' |
        'wall-unit-end-panel' | 'sink';

  // Position (in centimeters, relative to inner room space)
  x: number;                     // X position (left-to-right)
  y: number;                     // Y position (front-to-back, called "height" for legacy reasons)
  z?: number;                    // Z position (height off ground, optional)

  // Dimensions (in centimeters)
  width: number;                 // X-axis dimension
  depth: number;                 // Y-axis dimension
  height: number;                // Z-axis dimension

  // Legacy (deprecated)
  verticalHeight?: number;       // DEPRECATED: Use height instead

  // Rotation (in degrees, 0-360)
  rotation: number;

  // Visual properties
  style?: string;
  color?: string;
  material?: string;

  // Rendering
  zIndex: number;                // 2D rendering layer order (0.5-6.0)

  // Corner unit specific
  cornerDoorSide?: 'left' | 'right' | 'auto';
}
```

**Key Points:**
- `x, y` are stored in **inner room coordinates** (after wall thickness subtracted)
- `rotation` is in **degrees** (0° = facing front/down)
- `zIndex` determines 2D rendering order (see `getDefaultZIndex()` function)

---

### RoomDesign Interface
**Location:** `src/types/project.ts` (lines 31-41)

```typescript
export interface RoomDesign {
  id: string;
  project_id: string;
  room_type: RoomType;
  name?: string;
  room_dimensions: RoomDimensions;
  design_elements: DesignElement[];     // Array of placed components
  design_settings: RoomDesignSettings;  // View preferences, elevation views
  created_at: string;
  updated_at: string;
}
```

**Stored in Database:**
- `design_elements` → JSONB column (array of DesignElement objects)
- `design_settings` → JSONB column (settings object)

---

### RoomDimensions Interface
**Location:** `src/types/project.ts` (lines 43-47)

```typescript
export interface RoomDimensions {
  width: number;           // Room width in cm (X-axis, OUTER dimension)
  height: number;          // Room depth in cm (Y-axis, OUTER dimension, legacy name)
  ceilingHeight?: number;  // Room ceiling height in cm (Z-axis)
}
```

**CRITICAL:** These are **OUTER room dimensions** (including wall thickness)
- Inner room = Outer room - (2 × wall_thickness)
- Default wall_thickness = 10cm (from `configuration` table)

---

## 3D Rendering Pipeline

### Entry Point: AdaptiveView3D.tsx
**Location:** `src/components/designer/AdaptiveView3D.tsx`

**Responsibility:** Route elements to appropriate 3D renderers based on type

```typescript
// Type routing (lines 625-653)
switch (element.type) {
  // Kitchen components
  case 'cabinet':
  case 'appliance':
  case 'sink':
    return <EnhancedCabinet3D ... />;

  // Multi-room furniture
  case 'bed':
  case 'seating':
  case 'desk':
  case 'table':
  case 'chair':
    return <EnhancedCabinet3D ... />;

  // Universal
  case 'door':
  case 'window':
    return <EnhancedCabinet3D ... />;

  default:
    // Try to render with generic renderer
    return <EnhancedCabinet3D ... />;
}
```

**Features:**
- First-person walk mode (WASD controls)
- Manual wall visibility toggles (N/S/E/W)
- Complex room geometry support (L/U-shaped)
- Performance monitoring (god mode)

---

### Component Rendering: EnhancedModels3D.tsx
**Location:** `src/components/designer/EnhancedModels3D.tsx`

**Key Function: convertTo3D()**
**Lines:** 20-59

```typescript
const convertTo3D = (x: number, y: number, roomWidth: number, roomHeight: number) => {
  const WALL_THICKNESS_CM = 10;
  const WALL_THICKNESS_METERS = WALL_THICKNESS_CM / 100; // 0.1m

  const roomWidthMeters = roomWidth / 100;   // Convert cm → m
  const roomHeightMeters = roomHeight / 100;  // Convert cm → m

  // Calculate inner 3D boundaries
  const halfWallThickness = WALL_THICKNESS_METERS / 2; // 0.05m (5cm)

  const innerLeftBoundary = -roomWidthMeters / 2 + halfWallThickness;
  const innerRightBoundary = roomWidthMeters / 2 - halfWallThickness;
  const innerBackBoundary = -roomHeightMeters / 2 + halfWallThickness;
  const innerFrontBoundary = roomHeightMeters / 2 - halfWallThickness;

  // Map 2D coordinates to 3D inner space
  const xRange = innerRightBoundary - innerLeftBoundary;
  const zRange = innerFrontBoundary - innerBackBoundary;

  return {
    x: innerLeftBoundary + (x / roomWidth) * xRange,
    z: innerBackBoundary + (y / roomHeight) * zRange
  };
};
```

**⚠️ KNOWN ISSUE:** This function has a coordinate mismatch bug (documented in [session-2025-10-17-alignment-positioning-fix/2D-3D-COORDINATE-MISMATCH-ANALYSIS.md](session-2025-10-17-alignment-positioning-fix/2D-3D-COORDINATE-MISMATCH-ANALYSIS.md))

**Problem:** 2D coordinates are in INNER room space, but conversion treats them as OUTER room coordinates

---

### Dynamic 3D Model Builder: DynamicComponentRenderer.tsx
**Location:** `src/components/3d/DynamicComponentRenderer.tsx`

**Responsibility:** Build 3D geometry from database definitions

**Key Functions:**

1. **buildGeometry()** - Constructs Three.js meshes from geometry_parts
2. **evaluateFormula()** - Evaluates formula strings (via FormulaEvaluator.ts)
3. **applyAutoRotation()** - Applies wall-based rotation rules
4. **handleCornerRotation()** - Special rotation for corner units

**Process:**
```
Load component_3d_models from database
  ↓
Load geometry_parts for this model
  ↓
For each geometry part:
  - Evaluate position formulas (position_x, position_y, position_z)
  - Evaluate dimension formulas (dimension_width, dimension_height, dimension_depth)
  - Create Three.js geometry (BoxGeometry, CylinderGeometry, etc.)
  - Apply material from material_definitions
  - Check render_condition (skip if false)
  ↓
Group all parts together
  ↓
Apply auto-rotation based on wall position
  ↓
Return complete 3D model
```

---

### Formula Evaluation: FormulaEvaluator.ts
**Location:** `src/utils/FormulaEvaluator.ts`

**Purpose:** Safely evaluate formula strings from database

**Available Variables:**
```typescript
const context = {
  // From DesignElement
  width: element.width / 100,              // Convert cm → m
  depth: element.depth / 100,
  height: element.height / 100,

  // From component_3d_models
  legLength: model.leg_length,
  cornerDepth: model.corner_depth_base || model.corner_depth_wall,

  // Calculated
  cabinetHeight: (element.height - plinthHeight) / 100,
  plinthHeight: 0.15,                      // 15cm standard
  doorHeight: (element.height - plinthHeight - 0.05) / 100,

  // Wall detection
  isWallCabinet: element.type === 'wall-unit',
  isSelected: isSelected
};
```

**Example Formulas:**
```typescript
"0"                              → 0
"width/2"                        → 0.30 (for 60cm cabinet)
"height/2 + 0.15"                → 0.525 (for 90cm cabinet)
"cornerDepth/2 - legLength/2"    → 0.15 (for 60cm corner)
"!isWallCabinet"                 → true (boolean condition)
```

**Safety:** Uses sandboxed Function() constructor with allowed variables only

---

### Geometry Builder: GeometryBuilder.ts
**Location:** `src/utils/GeometryBuilder.ts`

**Purpose:** Helper functions for building Three.js geometry

**Functions:**
- `createBoxGeometry()` - Create rectangular solid
- `createCylinderGeometry()` - Create cylindrical shape
- `createSphereGeometry()` - Create spherical shape
- `createCustomGeometry()` - Create custom geometry from vertices

---

### Component ID Mapping: ComponentIDMapper.ts
**Location:** `src/utils/ComponentIDMapper.ts`

**Purpose:** Map element IDs to component_3d_models.component_id

**Pattern Matching:**
```typescript
// Width-based patterns (kitchen)
{
  pattern: /^base-cabinet-|base-cabinet$/i,
  mapper: (elementId, width) => {
    if (width >= 100) return 'base-cabinet-100';
    if (width >= 80) return 'base-cabinet-80';
    if (width >= 60) return 'base-cabinet-60';
    // ... etc
  },
  priority: 10
}

// Exact match patterns (multi-room)
{
  pattern: /^bed-|bed$/i,
  mapper: (elementId, width) => {
    if (width >= 180) return 'superking-bed-180';
    if (width >= 150) return 'king-bed-150';
    if (width >= 140) return 'double-bed-140';
    if (width >= 90) return 'single-bed-90';
    return 'bed-single';
  },
  priority: 28
}
```

**Total Patterns:** 35+ patterns covering 161/166 components (97%)

---

### Complex Room Geometry: ComplexRoomGeometry.tsx
**Location:** `src/components/3d/ComplexRoomGeometry.tsx`

**Purpose:** Render L-shaped and U-shaped rooms using polygon geometry

**Key Features:**
- Uses ShapeGeometry for efficient polygon rendering (2-20 triangles vs 100+)
- Renders individual wall segments with arbitrary angles
- Detects perimeter vs interior walls (5cm tolerance)
- Centers room at origin (0,0,0) for proper camera positioning

**Components:**
- `PolygonFloor` - Floor mesh from vertices
- `WallSegment` - Individual wall rendering
- `FlatCeiling` - Optional ceiling with same polygon

---

## 2D Plan View Rendering

### Main Renderer: DesignCanvas2D.tsx
**Location:** `src/components/designer/DesignCanvas2D.tsx`
**Size:** 2,830 lines (will be reduced to ~1,500 after Phase 5 legacy cleanup)

**Rendering Modes:**
1. **Plan View** - Top-down view (x, y coordinates)
2. **Elevation Views** - Side views (filtered by wall)

**Coordinate System:**
- Origin: Top-left corner of canvas
- Units: Centimeters (scaled by zoom level)
- Inner room coordinates (wall thickness already subtracted)

---

### Current Rendering Logic (Hybrid System)

**Database-Driven (New):**
```typescript
// Load 2D render metadata
const renderDef = await Render2DService.get(element.component_id);

// Get appropriate handler
const handler = RENDER_HANDLERS[renderDef.plan_view_type];

// Render using metadata
handler(ctx, element, renderDef.plan_view_data);
```

**Legacy Hardcoded (Old - To Be Removed):**
```typescript
// Hardcoded type checking
if (element.type === 'sink') {
  drawSinkPlanView(ctx, element);  // ~165 lines of hardcoded logic
} else if (isCornerComponent(element.id)) {
  drawCornerSquare(ctx, element);  // Hardcoded corner logic
} else {
  drawRectangle(ctx, element);     // Default rectangle
}
```

**Phase 5 Goal:** Remove all legacy code, use database-driven rendering only

---

### 2D Rendering Service: Render2DService.ts
**Location:** `src/services/Render2DService.ts`

**Purpose:** Load and cache 2D render metadata from database

**Key Functions:**

```typescript
class Render2DService {
  // Preload all definitions on app start (memory cache)
  static async preloadAll(roomType: RoomType): Promise<void>

  // Get definition for a component (cached)
  static async get(componentId: string): Promise<Component2DRenderDef>

  // Clear cache (when admin updates definitions)
  static clearCache(): void
}
```

**Caching Strategy:**
- Tier 1: Memory cache (Map) - 0ms lookup
- Tier 2: IndexedDB - <1ms lookup (future)
- Tier 3: Supabase - ~100ms for all components (first load only)

---

### Plan View Handlers
**Location:** `src/components/designer/DesignCanvas2D.tsx` (lines ~1900-2200)

**Handler Functions:**

```typescript
// Rectangle (most common)
function drawRectangle(ctx, element, data) {
  ctx.fillStyle = data.fill_color || '#8b4513';
  ctx.strokeStyle = data.stroke_color || '#000000';
  ctx.fillRect(x, y, width, depth);
  ctx.strokeRect(x, y, width, depth);
}

// Corner square (L-shaped units)
function drawCornerSquare(ctx, element, data) {
  const legLength = element.width; // Assumes square corner
  // Draw L-shape with two rectangles
  ctx.fillRect(x, y, legLength, depth);           // Horizontal leg
  ctx.fillRect(x, y, width, legLength);           // Vertical leg
}

// Single bowl sink
function drawSinkSingle(ctx, element, data) {
  const bowlInset = data.bowl_inset_ratio || 0.15;
  const bowlDepth = data.bowl_depth_ratio || 0.8;
  // Draw cabinet outline
  ctx.strokeRect(x, y, width, depth);
  // Draw bowl (rounded rectangle inset)
  const bowlX = x + width * bowlInset;
  const bowlY = y + depth * bowlInset;
  const bowlW = width * (1 - 2 * bowlInset);
  const bowlD = depth * bowlDepth;
  drawRoundedRect(ctx, bowlX, bowlY, bowlW, bowlD, 5);
}

// Double bowl sink
function drawSinkDouble(ctx, element, data) {
  const bowlInset = data.bowl_inset_ratio || 0.1;
  const bowlWidthRatio = data.bowl_width_ratio || 0.4;
  const dividerWidth = data.center_divider_width || 5;
  // Draw two bowls side by side with center divider
  // ... (similar to single bowl but two rectangles)
}

// Custom SVG path
function drawCustomSVG(ctx, element, data) {
  const svgPath = data.svg_path;
  const path = new Path2D(svgPath);
  ctx.fill(path);
  ctx.stroke(path);
}
```

---

### Z-Index Layering System
**Location:** `src/types/project.ts` (lines 127-184)

**Purpose:** Define rendering order in 2D plan view (back-to-front)

```typescript
export const getDefaultZIndex = (type, id) => {
  const isWallCabinet = id.includes('wall-cabinet');
  const isTallUnit = id.includes('tall') || id.includes('larder');
  const isButlerSink = id.includes('butler-sink');

  switch (type) {
    case 'wall':          return 0.5;  // Background
    case 'flooring':      return 1.0;  // Floor layer
    case 'cabinet':
      if (isWallCabinet)  return 4.0;  // Wall cabinets - above counters
      if (isTallUnit)     return 2.0;  // Tall units - floor level
      else                return 2.0;  // Base cabinets
    case 'appliance':     return 2.0;  // Floor-standing
    case 'end-panel':     return 2.0;  // Base level
    case 'toe-kick':      return 2.0;  // Base level trim
    case 'counter-top':   return 3.0;  // Work surface - above base
    case 'sink':          return 3.5;  // Above worktops
    case 'wall-unit-end-panel': return 4.0;  // Wall level
    case 'pelmet':        return 4.5;  // Below cornice
    case 'cornice':       return 5.0;  // Top trim
    case 'window':
    case 'door':          return 6.0;  // Openings
    default:              return 2.0;  // Default to base
  }
};
```

**Visual Layers (back to front):**
```
0.5 - Walls (background)
1.0 - Flooring
2.0 - Base cabinets, appliances, tall units, end panels, toe kicks
3.0 - Counter-tops
3.5 - Sinks
4.0 - Wall cabinets, wall unit end panels
4.5 - Pelmet
5.0 - Cornice
6.0 - Windows, doors (foreground)
```

---

## 2D Elevation View Rendering

### View Configuration System
**Location:** `src/types/project.ts` (lines 84-91)

```typescript
export interface ElevationViewConfig {
  id: string;                    // "front-default", "back-dup1", "plan", "3d"
  direction: 'front' | 'back' | 'left' | 'right' | 'plan' | '3d';
  label: string;                 // User-friendly name
  hidden_elements: string[];     // Element IDs to hide in this view
  is_default: boolean;           // True for standard views
  sort_order: number;            // Display order in ViewSelector
}
```

**Stored in:** `room_designs.design_settings.elevation_views[]`

---

### View Duplication System
**Purpose:** Support complex rooms (H-shaped) with multiple wall segments per direction

**Constraints:**
- Max 3 views per direction (original + 2 duplicates)
- View IDs: `{direction}-default`, `{direction}-dup1`, `{direction}-dup2`
- Total max: 12 elevation views + plan view + 3D view = 15 views

**Management:** `src/utils/elevationViewHelpers.ts` (285 lines)

---

### Two-Stage Element Filtering

**Stage 1: Cardinal Direction Filtering**
**Location:** `DesignCanvas2D.tsx` (lines ~1800-1900)

```typescript
// Filter by wall assignment
const getElementWall = (element, roomDimensions) => {
  const { x, y, width, depth, rotation } = element;
  const innerWidth = roomDimensions.width - 2 * wallThickness;
  const innerHeight = roomDimensions.height - 2 * wallThickness;

  const threshold = 10; // 10cm threshold for wall snapping

  // Check which wall element is closest to
  if (y <= threshold) return 'front';
  if (y + depth >= innerHeight - threshold) return 'back';
  if (x <= threshold) return 'left';
  if (x + width >= innerWidth - threshold) return 'right';

  // Not against a wall
  return null;
};

// Filter elements by active elevation view
if (active2DView === 'front') {
  elementsToRender = elementsToRender.filter(el => {
    const wall = getElementWall(el, roomDimensions);
    return wall === 'front' || isCornerVisibleOnWall(el, 'front');
  });
}
```

**Stage 2: Per-View Hidden Elements**
**Location:** `DesignCanvas2D.tsx` (lines ~1950-1970)

```typescript
// Get current view config
const currentViewInfo = design_settings.elevation_views.find(v => v.id === active2DView);

// Filter out hidden elements for this specific view
if (currentViewInfo && currentViewInfo.hidden_elements) {
  elementsToRender = elementsToRender.filter(el =>
    !currentViewInfo.hidden_elements.includes(el.id)
  );
}
```

---

### Corner Unit Visibility Logic
**Location:** `DesignCanvas2D.tsx` (lines ~1750-1800)

**Purpose:** Determine if corner units are visible in specific elevation views

```typescript
function isCornerVisibleOnWall(element, wall) {
  if (!element.component_id.includes('corner')) return false;

  const wall = getElementWall(element);

  // Corner units span two walls - check if visible on requested wall
  // Front-left corner: visible on 'front' and 'left'
  // Back-right corner: visible on 'back' and 'right'

  if (wall === 'front') {
    // Check if corner extends to left or right
    return element.x <= threshold ||
           element.x + element.width >= innerWidth - threshold;
  }

  // ... similar logic for other walls
}
```

**Corner Door Positioning:**
- `cornerDoorSide: 'left'` - Door on left leg
- `cornerDoorSide: 'right'` - Door on right leg
- `cornerDoorSide: 'auto'` - Use centerline logic

---

### Elevation View Rendering
**Location:** `DesignCanvas2D.tsx` (lines ~2200-2500)

**Elevation Render Functions:**

```typescript
// Standard cabinet elevation
function drawCabinetElevation(ctx, element, data) {
  const doorCount = data.door_count || 2;
  const handleStyle = data.handle_style || 'bar';

  // Draw cabinet body
  ctx.fillRect(x, y, width, height);

  // Draw doors (divide width by door count)
  const doorWidth = width / doorCount;
  for (let i = 0; i < doorCount; i++) {
    const doorX = x + i * doorWidth;
    ctx.strokeRect(doorX, y, doorWidth, height);

    // Draw handle
    if (handleStyle === 'bar') {
      const handleX = doorX + doorWidth * 0.9;
      const handleY = y + height / 2;
      ctx.fillRect(handleX, handleY - 10, 2, 20);
    }
  }

  // Draw toe kick (if base cabinet)
  if (data.has_toe_kick) {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x, y + height - 10, width, 10);
  }
}

// Appliance elevation
function drawApplianceElevation(ctx, element, data) {
  // Draw appliance body (simple rectangle with panel style)
  ctx.fillStyle = '#d3d3d3'; // Stainless steel color
  ctx.fillRect(x, y, width, height);

  // Draw panel details (door outline, buttons, etc.)
  if (data.has_door) {
    ctx.strokeRect(x + 5, y + 5, width - 10, height - 10);
  }
}

// Sink elevation
function drawSinkElevation(ctx, element, data) {
  // Draw sink body
  ctx.fillRect(x, y, width, height);

  // Draw front panel (if butler sink)
  if (data.has_front_panel) {
    ctx.fillStyle = '#654321';
    ctx.fillRect(x, y + height - data.panel_height, width, data.panel_height);
  }
}
```

---

## Coordinate Systems

### Three Different Coordinate Systems

**1. Database Storage (Centimeters, Inner Room)**
- Origin: Top-left corner of inner room (after wall thickness)
- Units: Centimeters
- X-axis: 0 to (roomWidth - 2 × wallThickness)
- Y-axis: 0 to (roomHeight - 2 × wallThickness)

**2. 2D Canvas (Centimeters, Scaled)**
- Origin: Top-left corner of canvas
- Units: Centimeters (scaled by zoom)
- Rendering: `ctx.scale(zoom, zoom)`
- Same as database storage (inner room coordinates)

**3. 3D World (Meters, Centered)**
- Origin: Center of room (0, 0, 0)
- Units: Meters
- X-axis: -roomWidth/2 to +roomWidth/2 (in meters)
- Y-axis: Height off ground (0 = floor)
- Z-axis: -roomDepth/2 to +roomDepth/2 (in meters)

---

### Coordinate Conversion

**2D → 3D Conversion**
**Location:** `EnhancedModels3D.tsx` (lines 20-59)

```typescript
// INPUT: 2D coordinates in centimeters (inner room space)
// OUTPUT: 3D coordinates in meters (centered)

const convertTo3D = (x: number, y: number, roomWidth: number, roomHeight: number) => {
  // 1. Convert outer room dimensions cm → m
  const roomWidthMeters = roomWidth / 100;
  const roomHeightMeters = roomHeight / 100;

  // 2. Calculate 3D inner boundaries (centered on origin)
  const wallThicknessMeters = 0.1;  // 10cm
  const halfWall = wallThicknessMeters / 2;

  const innerLeft = -roomWidthMeters / 2 + halfWall;
  const innerRight = roomWidthMeters / 2 - halfWall;
  const innerBack = -roomHeightMeters / 2 + halfWall;
  const innerFront = roomHeightMeters / 2 - halfWall;

  // 3. Map 2D position (as fraction of outer room) to 3D
  const xRange = innerRight - innerLeft;
  const zRange = innerFront - innerBack;

  return {
    x: innerLeft + (x / roomWidth) * xRange,
    z: innerBack + (y / roomHeight) * zRange
  };
};

// USAGE:
const { x: x3D, z: z3D } = convertTo3D(element.x, element.y, roomWidth, roomDepth);
const y3D = (element.z || 0) / 100;  // Height off ground (cm → m)
```

**⚠️ CRITICAL BUG:** This conversion has a mismatch issue!
- 2D coordinates are **inner room** coordinates (0 to innerWidth)
- Conversion divides by `roomWidth` (outer dimension)
- Should divide by `innerRoomWidth` instead

**See:** `docs/session-2025-10-17-alignment-positioning-fix/2D-3D-COORDINATE-MISMATCH-ANALYSIS.md`

---

## Component Positioning Logic

### Positioning Storage
**Stored in:** `DesignElement.x`, `DesignElement.y`, `DesignElement.z`

**Units:** Centimeters
**Coordinate System:** Inner room space (wall thickness already subtracted)

---

### Wall Detection
**Location:** `DesignCanvas2D.tsx` (lines ~1650-1750)

```typescript
function getElementWall(element, roomDimensions) {
  const wallThickness = 10; // cm
  const innerWidth = roomDimensions.width - 2 * wallThickness;
  const innerHeight = roomDimensions.height - 2 * wallThickness;
  const threshold = 10; // 10cm snap threshold

  const { x, y, width, depth } = element;

  // Front wall (y near 0)
  if (y <= threshold) return 'front';

  // Back wall (y + depth near inner height)
  if (y + depth >= innerHeight - threshold) return 'back';

  // Left wall (x near 0)
  if (x <= threshold) return 'left';

  // Right wall (x + width near inner width)
  if (x + width >= innerWidth - threshold) return 'right';

  // Not against a wall (freestanding)
  return null;
}
```

---

### Position Calculation Utilities
**Location:** `src/utils/PositionCalculation.ts`

**Functions:**

```typescript
// Snap element to nearest wall
function snapToWall(element, roomDimensions, threshold = 10) {
  const wall = getElementWall(element, roomDimensions);

  if (wall === 'front') {
    element.y = 0;
  } else if (wall === 'back') {
    element.y = innerHeight - element.depth;
  } else if (wall === 'left') {
    element.x = 0;
  } else if (wall === 'right') {
    element.x = innerWidth - element.width;
  }

  return element;
}

// Calculate center position
function getCenterPosition(element, roomDimensions) {
  const innerWidth = roomDimensions.width - 2 * wallThickness;
  const innerHeight = roomDimensions.height - 2 * wallThickness;

  return {
    x: (innerWidth - element.width) / 2,
    y: (innerHeight - element.depth) / 2
  };
}

// Check if element is at corner
function isAtCorner(element, roomDimensions, threshold = 10) {
  const wall = getElementWall(element, roomDimensions);
  if (!wall) return false;

  const { x, width } = element;
  const innerWidth = roomDimensions.width - 2 * wallThickness;

  const atLeft = x <= threshold;
  const atRight = x + width >= innerWidth - threshold;

  return (wall === 'front' || wall === 'back') && (atLeft || atRight);
}
```

---

### Collision Detection
**Location:** Database table `component_2d_collision_shapes`

**Purpose:** Bounding box collision detection for element overlap

**Migration:** `supabase/migrations/20251017000003_create_collision_detection_schema.sql`

**Schema:**
```sql
CREATE TABLE component_2d_collision_shapes (
  id UUID PRIMARY KEY,
  component_id TEXT REFERENCES components(component_id),

  -- Collision shape type
  collision_type TEXT DEFAULT 'bounding-box',

  -- Bounding box (relative to component origin)
  bbox_x_offset NUMERIC DEFAULT 0,
  bbox_y_offset NUMERIC DEFAULT 0,
  bbox_width NUMERIC,
  bbox_height NUMERIC,

  -- Custom polygon (for complex shapes)
  polygon_vertices JSONB
);
```

**Collision Detection Function:**
```typescript
function checkCollision(el1, el2) {
  // Bounding box collision (AABB)
  return !(
    el1.x + el1.width < el2.x ||
    el1.x > el2.x + el2.width ||
    el1.y + el1.depth < el2.y ||
    el1.y > el2.y + el2.depth
  );
}
```

---

## Component Rotation Logic

### Rotation Storage
**Stored in:** `DesignElement.rotation` (degrees, 0-360)

**Convention:**
- 0° = Facing front/down (original orientation)
- 90° = Facing left
- 180° = Facing back/up
- 270° = Facing right

---

### 2D Rotation Rendering
**Location:** `DesignCanvas2D.tsx` (lines ~2600-2700)

```typescript
function drawRotatedElement(ctx, element) {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.depth / 2;

  ctx.save();

  // Translate to center
  ctx.translate(centerX, centerY);

  // Rotate (degrees → radians)
  ctx.rotate(element.rotation * Math.PI / 180);

  // Translate back
  ctx.translate(-centerX, -centerY);

  // Draw element at original position
  drawElement(ctx, element);

  ctx.restore();
}
```

**⚠️ KNOWN ISSUE:** Rotation center may not match visual component center for complex shapes

---

### 3D Rotation Rendering
**Location:** `DynamicComponentRenderer.tsx` (lines ~300-400)

**Auto-Rotation Rules:**
```typescript
function applyAutoRotation(element, model) {
  if (!model.auto_rotate_enabled) {
    return element.rotation; // Manual rotation only
  }

  const wall = getElementWall(element);
  const corner = isAtCorner(element);

  if (corner) {
    // Use corner rotation rules
    if (wall === 'front' && element.x <= threshold) {
      return model.corner_rotation_front_left; // e.g., 0° for L-shape
    } else if (wall === 'front' && element.x + element.width >= innerWidth) {
      return model.corner_rotation_front_right; // e.g., 270°
    }
    // ... etc for other corners
  } else {
    // Use wall rotation rules
    if (wall === 'front') return model.wall_rotation_top;       // 0°
    if (wall === 'back') return model.wall_rotation_bottom;     // 180°
    if (wall === 'left') return model.wall_rotation_left;       // 90°
    if (wall === 'right') return model.wall_rotation_right;     // 270°
  }

  return element.rotation; // Fallback to manual rotation
}
```

**Rotation Center:**
- Stored in `component_3d_models` as formulas: `rotation_center_x`, `rotation_center_y`, `rotation_center_z`
- Example: `"legLength/2"` for corner units (rotates around corner point)

---

### Manual Rotation (User Control)
**Location:** `PropertiesPanel.tsx` (lines ~150-200)

```typescript
function RotationControl({ element, onChange }) {
  const [rotation, setRotation] = useState(element.rotation);

  const handleRotate = (delta) => {
    const newRotation = (rotation + delta) % 360;
    setRotation(newRotation);
    onChange({ ...element, rotation: newRotation });
  };

  return (
    <>
      <label>Rotation: {rotation}°</label>
      <button onClick={() => handleRotate(90)}>Rotate 90° CW</button>
      <button onClick={() => handleRotate(-90)}>Rotate 90° CCW</button>
      <input
        type="range"
        min="0"
        max="360"
        value={rotation}
        onChange={(e) => {
          setRotation(parseInt(e.target.value));
          onChange({ ...element, rotation: parseInt(e.target.value) });
        }}
      />
    </>
  );
}
```

---

## Component Dimensions & Geometry

### Dimension Storage
**Location:** `DesignElement` interface

```typescript
interface DesignElement {
  width: number;   // X-axis dimension (cm)
  depth: number;   // Y-axis dimension (cm)
  height: number;  // Z-axis dimension (cm)

  // Legacy (deprecated)
  verticalHeight?: number;  // Use height instead
}
```

**Default Dimensions:** Inherited from `components` table when element is created

---

### Dynamic Dimension Formulas
**Location:** `geometry_parts` table (for 3D), `component_2d_renders` table (for 2D)

**3D Example:**
```sql
-- Geometry part: Cabinet body
dimension_width = 'width'                    -- Uses element.width
dimension_height = 'cabinetHeight'           -- Calculated: height - plinthHeight
dimension_depth = 'depth'                    -- Uses element.depth

-- Geometry part: Plinth
dimension_width = 'width'
dimension_height = 'plinthHeight'            -- Fixed: 0.15m (15cm)
dimension_depth = 'depth'

-- Geometry part: Door
dimension_width = 'width - 0.05'             -- 5cm inset
dimension_height = 'doorHeight'              -- height - plinthHeight - 0.05
dimension_depth = '0.02'                     -- 2cm thick
```

**Formula Variables:** See [FormulaEvaluator.ts](#formula-evaluation-formulaevaluatorts)

---

### Geometry Validation
**Location:** `src/utils/GeometryValidator.ts`

**Functions:**

```typescript
// Validate room geometry
function validateRoomGeometry(vertices) {
  // Check minimum vertices (3 for triangle)
  if (vertices.length < 3) return false;

  // Check for self-intersecting polygons
  if (hasSelfIntersections(vertices)) return false;

  // Check for clockwise winding order
  if (!isClockwise(vertices)) return false;

  return true;
}

// Validate component dimensions
function validateDimensions(element) {
  if (element.width <= 0) return false;
  if (element.depth <= 0) return false;
  if (element.height <= 0) return false;

  // Check reasonable bounds (max 500cm)
  if (element.width > 500) return false;
  if (element.depth > 500) return false;
  if (element.height > 500) return false;

  return true;
}

// Validate element fits in room
function validateFitsInRoom(element, roomDimensions) {
  const innerWidth = roomDimensions.width - 2 * 10; // Wall thickness
  const innerHeight = roomDimensions.height - 2 * 10;

  if (element.x + element.width > innerWidth) return false;
  if (element.y + element.depth > innerHeight) return false;

  return true;
}
```

---

## State Management & Data Flow

### Application State Architecture

**Top Level:**
- `AuthContext` - User authentication (Supabase Auth)
- `ProjectContext` - Project and room state

**Component Level:**
- Local state (`useState`) for UI interactions
- Derived state for calculated values

---

### ProjectContext
**Location:** `src/contexts/ProjectContext.tsx` (980+ lines)

**Key State:**
```typescript
interface ProjectContextState {
  // Current project
  currentProject: Project | null;

  // Current room
  currentRoom: RoomDesign | null;
  roomType: RoomType | null;

  // Design elements (current room)
  elements: DesignElement[];
  roomDimensions: RoomDimensions;
  designSettings: RoomDesignSettings;

  // Unsaved changes tracking
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;

  // Loading states
  loading: boolean;
  saving: boolean;
}
```

**Key Functions (all memoized with useCallback):**
```typescript
// Project management
loadProject(projectId: string): Promise<void>
createProject(name: string, description?: string): Promise<Project>
updateProject(projectId: string, updates: UpdateProjectRequest): Promise<void>
deleteProject(projectId: string): Promise<void>

// Room management
createRoomDesign(projectId: string, roomType: RoomType): Promise<RoomDesign>
switchToRoom(roomId: string): Promise<void>
updateCurrentRoomDesign(updates: Partial<RoomDesign>): Promise<void>
deleteRoomDesign(roomId: string): Promise<void>

// Element management
addElement(element: DesignElement): void
updateElement(elementId: string, updates: Partial<DesignElement>): void
deleteElement(elementId: string): void

// Save handling
saveCurrentDesign(): Promise<void>
```

**Auto-Save Mechanism:**
```typescript
// Auto-save every 30 seconds if changes detected
useEffect(() => {
  const interval = setInterval(() => {
    if (hasUnsavedChanges) {
      saveCurrentDesign();
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [hasUnsavedChanges]);
```

**Critical Implementation Detail:**
- All functions wrapped in `useCallback` to prevent infinite render loops
- Uses refs (`stateRef`, `saveCurrentDesignRef`) to avoid stale closures
- Marks design as unsaved whenever elements change

---

### Service Layer

#### ComponentService
**Location:** `src/services/ComponentService.ts`

**Purpose:** Load component catalog from database

```typescript
class ComponentService {
  // Load all components for a room type
  static async getComponentsByRoomType(roomType: RoomType): Promise<Component[]>

  // Load single component by ID
  static async getComponentById(componentId: string): Promise<Component>

  // Preload common components (performance optimization)
  static async preloadCommonBehaviors(): Promise<void>

  // Clear cache
  static clearCache(): void
}
```

---

#### Render2DService
**Location:** `src/services/Render2DService.ts`

**Purpose:** Load 2D render metadata

```typescript
class Render2DService {
  // Preload all 2D render definitions
  static async preloadAll(roomType: RoomType): Promise<void>

  // Get render definition for component
  static async get(componentId: string): Promise<Component2DRenderDef>

  // Clear cache
  static clearCache(): void
}
```

---

#### RoomService
**Location:** `src/services/RoomService.ts`

**Purpose:** Room template and geometry management

```typescript
class RoomService {
  // Get room type template
  static async getRoomTypeTemplate(roomType: RoomType): Promise<RoomTypeTemplate>

  // Get room geometry template (for complex shapes)
  static async getRoomGeometryTemplate(templateId: string): Promise<RoomGeometryTemplate>

  // Get all available room types
  static async getAllRoomTypes(): Promise<RoomType[]>

  // Create new room design
  static async createRoomDesign(
    projectId: string,
    roomType: RoomType,
    customName?: string
  ): Promise<RoomDesign>
}
```

---

### Data Flow Diagram

```
USER ACTION (e.g., drag component)
  ↓
COMPONENT EVENT HANDLER (DesignCanvas2D.tsx)
  ↓
CONTEXT FUNCTION (updateElement)
  ↓
STATE UPDATE (useReducer)
  ↓
MARK UNSAVED (hasUnsavedChanges = true)
  ↓
RE-RENDER (all subscribed components)
  ↓
[After 30s] AUTO-SAVE TRIGGER
  ↓
SAVE TO DATABASE (Supabase)
  ↓
UPDATE LAST SAVED TIMESTAMP
```

---

## All Touchpoint Files Reference

### Core Type Definitions
| File | Lines | Purpose |
|------|-------|---------|
| `src/types/project.ts` | 389 | All TypeScript interfaces (DesignElement, RoomDesign, etc.) |

### Database Migrations
| File | Purpose |
|------|---------|
| `20250912300000_complete_component_system.sql` | Components table schema |
| `20250129000006_create_3d_models_schema.sql` | 3D models and geometry parts |
| `20251009000001_create_2d_renders_schema.sql` | 2D render metadata |
| `20251017000003_create_collision_detection_schema.sql` | Collision shapes |

### 3D Rendering
| File | Lines | Purpose |
|------|-------|---------|
| `src/components/designer/AdaptiveView3D.tsx` | 800+ | Main 3D view component, type routing |
| `src/components/designer/EnhancedModels3D.tsx` | 600+ | 3D model rendering, coordinate conversion |
| `src/components/3d/DynamicComponentRenderer.tsx` | 800+ | Database-driven 3D model builder |
| `src/components/3d/ComplexRoomGeometry.tsx` | 321 | L/U-shaped room rendering |
| `src/utils/GeometryBuilder.ts` | 250+ | Three.js geometry helpers |
| `src/utils/FormulaEvaluator.ts` | 200+ | Formula string evaluation |
| `src/utils/ComponentIDMapper.ts` | 777 | Component ID pattern matching |

### 2D Rendering
| File | Lines | Purpose |
|------|-------|---------|
| `src/components/designer/DesignCanvas2D.tsx` | 2830 | Main 2D canvas (plan + elevation) |
| `src/services/Render2DService.ts` | 200+ | 2D render metadata loader |
| `src/utils/elevationViewHelpers.ts` | 285 | Elevation view CRUD operations |

### State Management
| File | Lines | Purpose |
|------|-------|---------|
| `src/contexts/ProjectContext.tsx` | 980+ | Project and room state management |
| `src/contexts/AuthContext.tsx` | 200+ | User authentication |

### Services
| File | Lines | Purpose |
|------|-------|---------|
| `src/services/ComponentService.ts` | 300+ | Component catalog loader |
| `src/services/Render2DService.ts` | 200+ | 2D render metadata |
| `src/services/RoomService.ts` | 400+ | Room templates and geometry |

### Utilities
| File | Lines | Purpose |
|------|-------|---------|
| `src/utils/PositionCalculation.ts` | 200+ | Position and wall detection |
| `src/utils/GeometryValidator.ts` | 300+ | Geometry validation (15 methods) |
| `src/utils/canvasCoordinateIntegration.ts` | 150+ | Coordinate system utilities |

### UI Components
| File | Lines | Purpose |
|------|-------|---------|
| `src/components/designer/PropertiesPanel.tsx` | 400+ | Element properties editor |
| `src/components/designer/ViewSelector.tsx` | 250+ | View switching with context menu |
| `src/components/designer/CompactComponentSidebar.tsx` | 500+ | Component library sidebar |
| `src/components/designer/DesignToolbar.tsx` | 200+ | Toolbar controls |
| `src/components/designer/ZoomController.tsx` | 100+ | Zoom controls |

### Main Application
| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/Designer.tsx` | 1000+ | Main designer interface |
| `src/App.tsx` | 200+ | Root component with routing |

---

## Quick Reference: Key Concepts

### Coordinate System Summary
- **Database Storage:** Centimeters, inner room space
- **2D Canvas:** Centimeters, scaled by zoom
- **3D World:** Meters, centered on origin

### Dimension Naming
- **width** = X-axis (left-to-right)
- **depth** = Y-axis (front-to-back)
- **height** = Z-axis (floor-to-ceiling)

### Rotation Convention
- **0°** = Front/down
- **90°** = Left
- **180°** = Back/up
- **270°** = Right

### Wall Detection Threshold
- **10cm** - Distance from wall edge to snap

### Wall Thickness
- **10cm** - Default (stored in database `configuration` table)

### Z-Index Layers (2D)
- **0.5** - Walls
- **1.0** - Flooring
- **2.0** - Base level
- **3.0** - Counter-tops
- **4.0** - Wall units
- **5.0** - Cornice
- **6.0** - Windows/doors

---

**Document Status:** ✅ Complete - Ready for component positioning/rotation work
**Last Updated:** 2025-10-19
**Total Pages:** 50+
**Total Code Files Referenced:** 30+
