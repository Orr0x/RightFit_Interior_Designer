# RightFit Interior Designer - Brownfield Architecture Document

## Introduction

This document captures the **CURRENT STATE** of the RightFit Interior Designer codebase, including technical debt, circular dependencies, and real-world implementation patterns. It serves as a reference for AI development agents working on bug fixes, features, and refactoring.

**Project Evolution**: Started as a simple lead generator for a kitchen fitting business, evolved into a full multi-room interior design platform with complex 2D/3D rendering, component libraries, and planned CRM integration.

**Critical Context for AI Agents**: This codebase has experienced organic growth without initial architectural planning, leading to **positioning logic inconsistencies across views** and **circular dependency patterns** that cause AI coding loops. Understanding these patterns is essential before attempting fixes.

### Document Scope

Comprehensive documentation of the entire system with **emphasis on component positioning logic** and the five identified circular dependency patterns.

### Change Log

| Date       | Version | Description                           | Author         |
| ---------- | ------- | ------------------------------------- | -------------- |
| 2025-10-26 | 1.0     | Initial brownfield analysis           | Winston (AI)   |

---

## Quick Reference - Critical Files and Entry Points

### Core Application Files

- **Entry Point**: [src/main.tsx](../src/main.tsx) - Application initialization with Supabase, Auth, and routing
- **Root Component**: [src/App.tsx](../src/App.tsx) - Route configuration and layout
- **Main Designer Interface**: [src/pages/Designer.tsx](../src/pages/Designer.tsx) - 1000+ lines, orchestrates all design views
- **Project Dashboard**: [src/pages/UnifiedDashboard.tsx](../src/pages/UnifiedDashboard.tsx) - Project and room management UI

### Component Positioning Logic (CRITICAL - Sources of Circular Issues)

1. **[src/utils/PositionCalculation.ts](../src/utils/PositionCalculation.ts)** (394 lines)
   - **TWO IMPLEMENTATIONS**: Legacy (asymmetric left/right) and New (unified)
   - Feature flag controlled: `use_new_positioning_system`
   - **CIRCULAR ISSUE #1**: Left wall uses flipped Y, right wall uses direct Y in legacy mode

2. **[src/components/designer/DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx)** (2,958 lines)
   - Plan view rendering and element positioning
   - Elevation view vertical positioning (type-based defaults)
   - Wall snapping and corner detection logic
   - **CIRCULAR ISSUE #4**: Corner cabinet view-specific door logic

3. **[src/components/designer/EnhancedModels3D.tsx](../src/components/designer/EnhancedModels3D.tsx)** (999 lines)
   - 2D to 3D coordinate conversion (cm → meters, origin centering)
   - Z position defaults and validation
   - **CIRCULAR ISSUE #5**: 3D height defaults differ from elevation defaults

4. **[src/services/2d-renderers/elevation-view-handlers.ts](../src/services/2d-renderers/elevation-view-handlers.ts)** (699 lines)
   - Database-driven elevation rendering
   - Corner cabinet door side logic (3-tier priority system)
   - Lines 512-569: View-specific INVERTED logic

5. **[src/utils/canvasCoordinateIntegration.ts](../src/utils/canvasCoordinateIntegration.ts)** (355 lines)
   - Component placement validation
   - Wall clearance calculations (5cm standard)
   - Corner placement detection (30cm tolerance)

### State Management (Sources of Update Circles)

- **[src/contexts/ProjectContext.tsx](../src/contexts/ProjectContext.tsx)** (980+ lines)
  - **CIRCULAR ISSUE #2**: Array reference changes trigger unnecessary `hasUnsavedChanges`
  - Lines 886-890: Effect that sets unsaved flag on ANY array reference change
  - Lines 813-850: `saveCurrentDesign()` - flag stuck if save fails
  - Auto-save mechanism: Lines 892-933

- **[src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx)**
  - User authentication and profile management

### Database Schema & Services

- **[src/services/ComponentService.ts](../src/services/ComponentService.ts)**
  - Component behavior caching (10-min TTL)
  - Elevation height resolution with multiple fallbacks

- **[src/services/Render2DService.ts](../src/services/Render2DService.ts)**
  - Database-driven 2D rendering metadata
  - Directional variant fallback (-ns/-ew suffix stripping)

- **[src/types/supabase.ts](../src/types/supabase.ts)**
  - **CIRCULAR ISSUE #3**: Missing collision detection fields (layer_type, min_height_cm, max_height_cm)
  - Needs regeneration: `supabase gen types typescript`

### Type Definitions

- **[src/types/project.ts](../src/types/project.ts)** (389 lines)
  - Core interfaces: `DesignElement`, `RoomDesign`, `Project`
  - **COORDINATE SYSTEM PROPERTIES**:
    - `x, y, z`: Position (cm)
    - `width, depth, height`: Dimensions (cm)
    - `verticalHeight`: DEPRECATED (use `height` instead)
  - Z-index layering system (0.5-6.0)

---

## The Five Circular Dependency Patterns

### ⭕ CIRCULAR PATTERN #1: The Positioning Coordinate Circle

**Symptom**: Fixing element positioning in one view breaks another view

**The Circle**:
```
Fix elevation left wall positioning
    ↓
Breaks elevation right wall (asymmetric coordinate system)
    ↓
Fix right wall positioning
    ↓
Breaks 3D view (uses different coordinate origin)
    ↓
Fix 3D positioning
    ↓
Breaks plan view snapping
    ↓
Fix plan view
    ↓
Back to elevation left wall problem
```

**Root Cause**: **Three incompatible coordinate systems** with no unified transformation layer:

| View Type | Coordinate System | Origin | Units | Notes |
|-----------|------------------|--------|-------|-------|
| Plan View | Standard Cartesian | Top-left corner | Centimeters | Uses `x, y` directly |
| Elevation (Legacy) | **ASYMMETRIC** | Canvas top-left | Mixed (cm → px) | **Left wall FLIPPED**, right wall DIRECT |
| Elevation (New) | Unified | Canvas top-left | Mixed (cm → px) | Mirroring at render time |
| 3D View | Meters, centered | Room center (0,0,0) | Meters | All cm divided by 100 |

**Critical Code Locations**:

**Elevation Legacy Implementation** ([PositionCalculation.ts:145-197](../src/utils/PositionCalculation.ts#L145-L197)):
```typescript
// Front/Back views: Direct X mapping
xPos = roomPosition.innerX + (element.x / roomDimensions.width) * calcElevationWidth;

// Left wall: FLIPPED Y coordinate (ASYMMETRIC!)
const flippedY = roomDimensions.height - element.y - effectiveDepth;
xPos = roomPosition.innerX + (flippedY / roomDimensions.height) * calcElevationDepth;

// Right wall: DIRECT Y coordinate (ASYMMETRIC!)
xPos = roomPosition.innerX + (element.y / roomDimensions.height) * calcElevationDepth;
```

**Result**: A cabinet at Y=100 in a 400cm room appears at:
- Left wall: Position 240 (flipped)
- Right wall: Position 100 (direct)
- **Same cabinet, different positions!**

**Elevation New Implementation** ([PositionCalculation.ts:208-266](../src/utils/PositionCalculation.ts#L208-L266)):
```typescript
// Unified mapping for both walls
const normalizedPosition = element.y / roomDimensions.height;
xPos = roomPosition.innerX + normalizedPosition * calcElevationDepth;

// Mirroring applied at RENDERING time, not coordinate calculation
if (view.startsWith('left')) {
  const elevationCenter = roomPosition.innerX + calcElevationDepth / 2;
  const distanceFromCenter = xPos - elevationCenter;
  xPos = elevationCenter - distanceFromCenter - elementWidth;
}
```

**Feature Flag**: `use_new_positioning_system` (default: **true**)
- Location: [PositionCalculation.ts:53](../src/utils/PositionCalculation.ts#L53)
- BUT: May be overridden by runtime settings, creating **race conditions**

**How AI Agents Get Stuck**:
1. Agent sees position wrong in left elevation view
2. Adjusts left wall calculation
3. Test shows it works for left, but RIGHT wall is now broken
4. Agent adjusts right wall calculation
5. Left wall breaks again
6. Agent tries to "unify" the logic but doesn't realize 3D uses different origin
7. Agent fixes 3D, which breaks plan view snapping
8. **Infinite loop begins**

**Solution Path**:
- Use NEW positioning system exclusively (verify flag is true)
- Create single source of truth: `CoordinateTransformEngine` (exists but underutilized)
- All views must use transformation functions, not direct coordinate access

---

### ⭕ CIRCULAR PATTERN #2: The State Update Circle

**Symptom**: `hasUnsavedChanges` flag stuck true even after successful save

**The Circle**:
```
User updates element
    ↓
Designer calls updateCurrentRoomDesign({ design_elements: [...] })
    ↓
New array reference created (spread operator)
    ↓
Supabase returns updated room with NEW array reference
    ↓
useEffect at line 886 detects array reference change
    ↓
Dispatches SET_UNSAVED_CHANGES = true
    ↓
Auto-save triggers after 30 seconds
    ↓
saveCurrentDesign() saves successfully
    ↓
Dispatches SET_UNSAVED_CHANGES = false
    ↓
BUT: Database returns ANOTHER new array reference
    ↓
useEffect fires again, sets hasUnsavedChanges = true
    ↓
Circle continues
```

**Root Cause**: **No deep equality checking** for `design_elements` array

**Critical Code Location** ([ProjectContext.tsx:886-890](../src/contexts/ProjectContext.tsx#L886-L890)):
```typescript
useEffect(() => {
  if (state.currentRoomDesign) {
    dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
  }
}, [state.currentRoomDesign?.design_elements, state.currentRoomDesign?.room_dimensions]);
```

**Problem**: JavaScript array comparison is by **reference**, not value:
```javascript
[{id: '1', x: 100}] !== [{id: '1', x: 100}]  // Always false (different references)
```

**Contributing Factor** ([Designer.tsx:254, 280](../src/pages/Designer.tsx#L254)):
```typescript
// Every update creates NEW array reference
const updatedElements = [...(currentRoomDesign.design_elements || []), newElement];
const updatedElements = elements.map(el => el.id === id ? {...el, ...updates} : el);
```

**Secondary Issue**: Save failure recovery ([ProjectContext.tsx:813-850](../src/contexts/ProjectContext.tsx#L813-L850))
```typescript
const saveCurrentDesign = useCallback(async (showNotification: boolean = true) => {
  try {
    await updateCurrentRoomDesign({ updated_at: new Date().toISOString() });

    // Only executes if save succeeds
    dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
    dispatch({ type: 'SET_LAST_AUTO_SAVE', payload: new Date() });
  } catch (error) {
    // Flag NEVER cleared if save fails
    toast.error('Failed to save design');
  }
}, [/* deps */]);
```

**How AI Agents Get Stuck**:
1. Agent sees "hasUnsavedChanges stuck true" bug report
2. Adds logic to clear flag after save
3. Realizes flag gets set again by useEffect
4. Adds debouncing to useEffect
5. Breaks actual change detection
6. Removes debouncing, tries different approach
7. **Never identifies that array reference is the core issue**

**Solution Path**:
- Implement deep equality check (use `lodash.isEqual` or custom function)
- Clear flag BEFORE calling updateCurrentRoomDesign (optimistic update)
- Add recovery: reset flag on save failure after user confirmation

---

### ⭕ CIRCULAR PATTERN #3: The Type/Schema Mismatch Circle

**Symptom**: Runtime errors accessing database fields that "don't exist" in TypeScript

**The Circle**:
```
Developer adds layer_type field to component_3d_models table (Oct 17)
    ↓
Migration runs successfully in database
    ↓
AI agent tries to access model.layer_type in code
    ↓
TypeScript error: "Property 'layer_type' does not exist"
    ↓
AI checks src/types/supabase.ts - field not present
    ↓
AI assumes field doesn't exist in database
    ↓
AI creates workaround using metadata JSONB instead
    ↓
Now TWO sources of truth: layer_type column AND metadata.layer_type
    ↓
Another AI agent finds layer_type column in migration
    ↓
Tries to use it, gets TypeScript error again
    ↓
Circle continues
```

**Root Cause**: **TypeScript types not regenerated after schema changes**

**Critical Missing Fields** ([src/types/supabase.ts:408-505](../src/types/supabase.ts#L408-L505)):

Database has (added in [migration 20251017000001](../supabase/migrations/20251017000001_add_collision_detection_layer_fields.sql)):
```sql
ALTER TABLE component_3d_models ADD COLUMN layer_type VARCHAR(50);
ALTER TABLE component_3d_models ADD COLUMN min_height_cm DECIMAL(10,2);
ALTER TABLE component_3d_models ADD COLUMN max_height_cm DECIMAL(10,2);
ALTER TABLE component_3d_models ADD COLUMN can_overlap_layers TEXT[];
```

TypeScript types DON'T include:
```typescript
export interface component_3d_models {
  Row: {
    id: string;
    component_id: string;
    // ... other fields ...
    // MISSING: layer_type, min_height_cm, max_height_cm, can_overlap_layers
  }
}
```

**How AI Agents Get Stuck**:
1. Agent sees component collision detection code
2. Tries to read `model.layer_type`
3. TypeScript compilation error
4. Agent searches codebase, finds migration that adds layer_type
5. Assumes types are correct, migration is wrong
6. Removes layer_type from migration (breaking change!)
7. Another agent runs into collision detection not working
8. Adds layer_type back
9. **Infinite loop of adding/removing field**

**Solution Path**:
- **IMMEDIATE**: Run `npx supabase gen types typescript > src/types/supabase.ts`
- **PROCESS**: Add type generation to CI/CD after migrations
- **VALIDATION**: Add TypeScript build step that fails if types outdated

---

### ⭕ CIRCULAR PATTERN #4: The Corner Cabinet Logic Circle

**Symptom**: Corner cabinet doors face wrong direction in some views

**The Circle**:
```
User reports corner doors wrong in front view
    ↓
AI agent fixes front view logic (front-left = door right)
    ↓
LEFT view now broken (uses INVERTED logic)
    ↓
AI agent fixes left view
    ↓
BACK view broken (different corner position rules)
    ↓
AI agent fixes back view
    ↓
FRONT view broken again (conflicting rules)
    ↓
Circle continues
```

**Root Cause**: **View-specific door side logic with no unified rule system**

**Critical Code Location** ([elevation-view-handlers.ts:512-569](../src/services/2d-renderers/elevation-view-handlers.ts#L512-L569)):

Three-tier priority system:
1. **Manual Override**: `element.cornerDoorSide` or `data.corner_door_side`
2. **Auto-detect Corner Position**: Uses 30cm tolerance to detect front-left, front-right, back-left, back-right
3. **View-Specific Rules**: **DIFFERENT for each view**

```typescript
if (currentView === 'front') {
  // Front-left corner: door on RIGHT
  // Front-right corner: door on LEFT
  doorSide = (cornerPosition === 'front-left') ? 'right' : 'left';

} else if (currentView === 'back') {
  // Back-left corner: door on RIGHT
  // Back-right corner: door on LEFT
  doorSide = (cornerPosition === 'back-left') ? 'right' : 'left';

} else if (currentView === 'left') {
  // INVERTED LOGIC (comment in code)
  // Front-left corner: door on LEFT
  // Back-left corner: door on RIGHT
  doorSide = (cornerPosition === 'front-left') ? 'left' : 'right';

} else if (currentView === 'right') {
  // Front-right corner: door on RIGHT
  // Back-right corner: door on LEFT
  doorSide = (cornerPosition === 'front-right') ? 'right' : 'left';
}
```

**Complexity**: 4 views × 4 corner positions = **16 different door side rules**

**How AI Agents Get Stuck**:
1. Agent sees door facing wrong way in front view
2. Changes front-left rule from 'right' to 'left'
3. Tests front view - works!
4. User tests left view - broken
5. Agent changes left view front-left rule
6. Now back view is broken
7. Agent tries to find "unified rule"
8. Creates new rule that breaks ALL views
9. **Reverts back to original, trapped in analysis paralysis**

**Solution Path**:
- Create **single source of truth**: Door orientation matrix
- Use corner position (front-left, front-right, back-left, back-right) as primary key
- View-specific rendering uses transformation, not different logic
- Store door side as **component property**, not calculated per view

---

### ⭕ CIRCULAR PATTERN #5: The Height Property Circle

**Symptom**: Components positioned at different heights in elevation vs 3D view

**The Circle**:
```
User reports wall cabinet too low in elevation view
    ↓
AI agent increases element.height
    ↓
3D view now shows cabinet TOO HIGH (uses element.height directly)
    ↓
AI agent adds element.z = 140 for wall cabinets
    ↓
Elevation view IGNORES element.z, uses type-based default (140cm)
    ↓
AI agent sets elevation_height in database metadata
    ↓
ComponentService.getElevationHeight() has 4 fallback layers
    ↓
Unpredictable which height is actually used
    ↓
AI agent sets ALL height properties
    ↓
Now conflicts between properties
    ↓
Circle continues
```

**Root Cause**: **Multiple sources of truth for component height**

**Height Sources (in order of precedence)**:

**ComponentService.getElevationHeight()** ([ComponentService.ts](../src/services/ComponentService.ts)):
```typescript
// Priority 1: component_behavior.use_actual_height_in_elevation flag
if (behavior?.use_actual_height_in_elevation) {
  return element.height;
}

// Priority 2: is_tall_unit flag
if (behavior?.is_tall_unit) {
  return element.height;
}

// Priority 3: elevation_height column from components table
if (elevation_height) {
  return elevation_height;
}

// Priority 4: element.height (fallback)
return element.height;
```

**Elevation View Type Defaults** ([DesignCanvas2D.tsx:1354-1435](../src/components/designer/DesignCanvas2D.tsx#L1354-L1435)):
```typescript
// Hardcoded defaults if no metadata
if (element.type === 'cabinet') {
  elevationHeightCm = element.height || 86;  // Base cabinet default
}
if (element.type === 'wall-cabinet') {
  elevationHeightCm = element.height || 70;  // Wall cabinet default
}
// ... 10+ more type-specific defaults
```

**3D View Defaults** ([EnhancedModels3D.tsx](../src/components/designer/EnhancedModels3D.tsx)):
```typescript
// Wall cabinet Z position
if (isWallCabinet) {
  baseHeight = 2.0;  // 200cm above floor
} else {
  baseHeight = element.z ? element.z / 100 : 0;
}

const yPosition = baseHeight + (height / 2);  // Center of component
```

**Database Metadata** ([component_2d_renders table](../supabase/migrations/20251009000001_create_2d_renders_schema.sql)):
```sql
-- elevation_height column in components table
-- component_behavior JSONB with use_actual_height_in_elevation flag
-- component_3d_models with default_height column
```

**Result**: 4-6 different height values for the SAME component

**Example Wall Cabinet Confusion**:
```
element.height = 70cm         (dimension of cabinet body)
element.z = undefined         (not set)
elevation_height = NULL       (not in database)
Type default = 70cm           (hardcoded in DesignCanvas2D)
3D default Z = 200cm          (hardcoded in EnhancedModels3D)
Behavior flag = false         (not set)

Elevation view: Shows at 70cm tall, positioned at 140cm (type default)
3D view: Shows at 70cm tall, positioned at 200cm + 35cm (baseHeight + height/2) = 235cm
MISMATCH: 95cm difference!
```

**How AI Agents Get Stuck**:
1. Agent sees wall cabinet at wrong height in elevation
2. Sets `element.z = 140`
3. Elevation view ignores `z`, still uses type default
4. Agent sets `elevation_height` in database
5. 3D view doesn't check `elevation_height`, still uses `z`
6. Agent sets behavior flag `use_actual_height_in_elevation`
7. Now height is `element.height` which is cabinet DIMENSION, not POSITION
8. Agent confuses height (dimension) with z (position)
9. **Gets stuck trying to unify dimension and position properties**

**Solution Path**:
- **Separate concerns**: `height` = dimension, `z` = position (height off floor)
- **Single source for positioning**: Use `z` property for ALL views
- **Elevation metadata only for overrides**: Only use `elevation_height` for special cases
- **Remove type-based defaults**: Force explicit `z` values in component library
- **Component library audit**: Set `z` for all 154 components

---

## High-Level Architecture

### Technical Summary

**Project Type**: Multi-room interior design SaaS application
**Architecture Pattern**: Database-driven 3-tier (Frontend → Supabase Backend → PostgreSQL)
**Rendering Stack**: React + Canvas 2D + Three.js (React Three Fiber)
**State Management**: Context API with useReducer pattern
**Authentication**: Supabase Auth with Row Level Security (RLS)

### Actual Tech Stack

| Category | Technology | Version | Notes |
|----------|-----------|---------|-------|
| **Runtime** | Node.js | 18.0.0+ | Required for Vite dev server |
| **Framework** | React | 18.2.0 | Functional components, hooks pattern |
| **Build Tool** | Vite | 4.x | Fast HMR, ESBuild |
| **Language** | TypeScript | 5.x | Strict mode enabled |
| **Backend** | Supabase | Cloud | PostgreSQL + Auth + Storage |
| **Database** | PostgreSQL | 15.x | JSONB columns for flexible schema |
| **2D Rendering** | Canvas API | Native | Direct canvas manipulation |
| **3D Rendering** | Three.js | r150+ | Via @react-three/fiber |
| **3D Utilities** | @react-three/drei | Latest | Controls, loaders, helpers |
| **UI Library** | shadcn/ui | Custom | Radix UI + Tailwind |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Icons** | Lucide React | Latest | Icon components |
| **Routing** | React Router | 6.x | Client-side routing |
| **Forms** | React Hook Form | 7.x | Form state management |
| **Validation** | Zod | 3.x | Schema validation |
| **HTTP Client** | Supabase Client | 2.x | Built-in fetch wrapper |
| **State** | React Context | Native | No Redux/MobX |
| **Testing** | None | N/A | @playwright/test installed but not configured |

### Repository Structure Reality Check

- **Type**: Monorepo (single codebase, multiple domains)
- **Package Manager**: npm
- **Notable Decisions**:
  - JSONB columns for `design_elements`, `design_settings` (flexible but harder to query)
  - No formal state management library (Context + useReducer pattern)
  - Database-driven component library (154+ components in tables, not code)
  - Mixed coordinate system (no unified transformation layer until recently)

---

## Source Tree and Module Organization

### Project Structure (Actual)

```
plan-view-kitchen-3d/
├── src/
│   ├── components/
│   │   ├── designer/           # Main design interface components
│   │   │   ├── DesignCanvas2D.tsx       # 2,958 lines - MASSIVE, needs refactoring
│   │   │   ├── AdaptiveView3D.tsx       # 3D rendering orchestrator
│   │   │   ├── EnhancedModels3D.tsx     # 3D component rendering (999 lines)
│   │   │   ├── ViewSelector.tsx         # View switching with context menu
│   │   │   ├── PropertiesPanel.tsx      # Element property editor
│   │   │   ├── CompactComponentSidebar.tsx  # Component library browser
│   │   │   ├── DesignToolbar.tsx        # Tool controls
│   │   │   ├── ZoomController.tsx       # Zoom UI
│   │   │   ├── PerformanceMonitor.tsx   # FPS/memory tracking (dev mode)
│   │   │   └── RoomShapeSelector.tsx    # L/U-shaped room templates
│   │   ├── 3d/
│   │   │   ├── ComplexRoomGeometry.tsx  # Polygon floor/wall rendering
│   │   │   ├── PolygonFloor.tsx         # ShapeGeometry floor
│   │   │   ├── WallSegment.tsx          # Arbitrary angle walls
│   │   │   └── FlatCeiling.tsx          # Optional ceiling
│   │   ├── ui/                 # shadcn/ui components
│   │   └── layout/             # App layout components
│   ├── contexts/
│   │   ├── ProjectContext.tsx  # 980+ lines - Project/room state management
│   │   │                       # CIRCULAR ISSUE SOURCE: Lines 886-890, 813-850
│   │   └── AuthContext.tsx     # Authentication state
│   ├── pages/
│   │   ├── Designer.tsx        # 1000+ lines - Main designer orchestrator
│   │   ├── UnifiedDashboard.tsx # Project management UI
│   │   ├── Login.tsx           # Auth pages
│   │   └── Register.tsx
│   ├── services/
│   │   ├── ComponentService.ts      # Component data fetching, behavior caching
│   │   ├── Render2DService.ts       # 2D rendering metadata service
│   │   ├── RoomService.ts           # Room geometry templates
│   │   └── 2d-renderers/
│   │       ├── plan-view-handlers.ts      # Plan view shape rendering
│   │       └── elevation-view-handlers.ts # Elevation rendering + corner logic
│   ├── utils/
│   │   ├── PositionCalculation.ts          # CRITICAL: Elevation positioning logic
│   │   │                                   # CIRCULAR ISSUE #1 SOURCE
│   │   ├── canvasCoordinateIntegration.ts  # Placement validation
│   │   ├── elevationViewHelpers.ts         # View duplication CRUD
│   │   ├── GeometryBuilder.ts              # Room geometry generation
│   │   ├── GeometryValidator.ts            # Geometry validation (15 methods)
│   │   ├── ComponentIDMapper.ts            # Component ID to 3D model mapping
│   │   ├── FormulaEvaluator.ts             # Dynamic dimension formulas
│   │   └── migrateElements.ts              # Legacy element migration
│   ├── types/
│   │   ├── project.ts          # Core interfaces (DesignElement, RoomDesign, etc.)
│   │   ├── render2d.ts         # 2D rendering type definitions
│   │   └── supabase.ts         # CRITICAL ISSUE: Missing collision fields
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts       # Supabase client config
│   ├── App.tsx                 # Root component
│   └── main.tsx                # Entry point
├── supabase/
│   └── migrations/             # 50+ migration files
│       ├── 20250912300000_complete_component_system.sql
│       ├── 20251009000001_create_2d_renders_schema.sql
│       ├── 20250129000006_create_3d_models_schema.sql
│       ├── 20251017000001_add_collision_detection_layer_fields.sql  # MISSING IN TYPES
│       └── 20251018-20251019_*.sql  # Recent height fixes
├── docs/
│   ├── CLAUDE.md               # Project instructions for AI agents
│   ├── session-2025-01-09-3d-migration/     # 3D migration docs
│   ├── session-2025-10-09-2d-database-migration/  # 2D migration docs
│   ├── session-2025-10-10-complex-room-shapes/    # Complex rooms docs
│   └── session-2025-10-18-Component-fixes/        # Recent session work (conflicting?)
├── .bmad-core/                 # BMad agent framework
├── package.json
├── tsconfig.json               # TypeScript strict mode
├── vite.config.ts              # Vite configuration
└── tailwind.config.js          # Tailwind CSS config
```

### Key Modules and Their Purpose

**CRITICAL MODULES** (High risk, frequent changes):

1. **Component Positioning System** (Multiple files, no single source of truth)
   - `PositionCalculation.ts` - Elevation positioning (TWO implementations)
   - `DesignCanvas2D.tsx` - Plan + elevation rendering, wall snapping
   - `EnhancedModels3D.tsx` - 3D coordinate conversion
   - `canvasCoordinateIntegration.ts` - Placement validation
   - **ISSUE**: No unified coordinate transformation engine (exists but underutilized)

2. **State Management** (Context pattern)
   - `ProjectContext.tsx` - ALL project/room state (980 lines, too large)
   - **ISSUE**: Array reference change triggers false "unsaved changes" (lines 886-890)
   - **ISSUE**: Auto-save logic duplicated (enableAutoSave callback unused, direct interval used)

3. **2D Rendering System** (Database-driven as of Oct 2025)
   - `Render2DService.ts` - Metadata caching (singleton pattern)
   - `component_2d_renders` table - Render type metadata
   - `plan-view-handlers.ts` - Plan view shape rendering
   - `elevation-view-handlers.ts` - Elevation rendering + corner door logic
   - **ISSUE**: Legacy code still present (Phase 5 cleanup not completed)

4. **3D Rendering System** (Three.js via React Three Fiber)
   - `AdaptiveView3D.tsx` - Orchestrator, walk mode, wall controls
   - `EnhancedModels3D.tsx` - Component rendering (999 lines)
   - `ComplexRoomGeometry.tsx` - L/U-shaped room rendering
   - `component_3d_models` + `geometry_parts` tables
   - **ISSUE**: ComponentIDMapper uses 35+ regex patterns (fragile, no schema support)

5. **Component Library System** (Database-driven)
   - `ComponentService.ts` - Behavior caching (10-min TTL), elevation height resolution
   - `components` table - 154+ components across 8 room types
   - **ISSUE**: Inconsistent `elevation_height` population (some NULL)
   - **ISSUE**: Width-based component patterns (e.g., `-ns`, `-ew`) are app-level logic, not in database

---

## Data Models and APIs

### Core Data Models

**Instead of duplicating, reference actual files:**

**Primary Interfaces** - See [src/types/project.ts](../src/types/project.ts):
- `DesignElement` (Lines 103-184) - Individual component in room
- `RoomDesign` (Lines 185-210) - Complete room with elements and settings
- `Project` (Lines 211-230) - Top-level project container
- `RoomDimensions` (Lines 60-65) - **CONFUSING**: Uses `height` for depth (Y-axis)

**Database Tables** - See Supabase migrations:
- `projects` - Project metadata
- `room_designs` - Room-specific designs with JSONB `design_elements` and `design_settings`
- `components` - Master component library (154+ entries)
- `component_2d_renders` - 2D rendering metadata (plan + elevation types)
- `component_3d_models` - 3D model definitions + rotation rules
- `geometry_parts` - Individual 3D geometry parts (boxes, cylinders)
- `material_definitions` - 3D material properties (colors, roughness, metalness)
- `room_geometry_templates` - L/U-shaped room polygon definitions

**TypeScript-Database Mismatches**:
- ✅ `components` table matches TypeScript (mostly)
- ❌ `component_3d_models` missing 4 fields in TypeScript (CRITICAL)
- ⚠️ `component_behavior` JSONB has no strict type checking (extensible but unsafe)

### DesignElement Properties (THE SOURCE OF CONFUSION)

**Coordinate Properties**:
```typescript
x: number;          // X position in room (cm, origin top-left)
y: number;          // Y position in room (cm, front-to-back depth)
z?: number;         // Z position (height off floor in cm, optional)
```

**Dimension Properties**:
```typescript
width: number;      // X-axis dimension (cm)
depth: number;      // Y-axis dimension (cm, front-to-back)
height: number;     // Z-axis dimension (cm, vertical size of component)
```

**CONFUSION**: RoomDimensions uses `height` for room DEPTH:
```typescript
interface RoomDimensions {
  width: number;   // Room width (X-axis)
  height: number;  // Room DEPTH (Y-axis) - called "height" for legacy compatibility
}
```

**Result**: `element.height` means vertical dimension, `room.height` means depth. VERY CONFUSING.

**Legacy Properties** (DEPRECATED):
```typescript
verticalHeight?: number;  // Use element.height instead
```

**Behavioral Properties**:
```typescript
rotation: number;              // Degrees (0-360)
zIndex: number;                // Render order (0.5-6.0)
cornerDoorSide?: 'left' | 'right' | 'auto';  // Corner cabinet override
```

### API Specifications

**Backend**: Supabase PostgreSQL with Row Level Security (RLS)
- No REST API specification (uses Supabase client auto-generated queries)
- All queries through `supabase.from('table_name')` pattern
- RLS policies enforce user access control

**Authentication API**: Supabase Auth
- `supabase.auth.signUp()`, `signInWithPassword()`, `signOut()`
- Session managed automatically with refresh tokens

**Database API Patterns**:
```typescript
// Fetching components
const { data, error } = await supabase
  .from('components')
  .select('*')
  .eq('deprecated', false)
  .order('name');

// Updating room design
const { error } = await supabase
  .from('room_designs')
  .update({ design_elements: elementsJson })
  .eq('id', roomId);
```

---

## Technical Debt and Known Issues

### Critical Technical Debt

**Priority 1 (BLOCKS PROGRESS)**:

1. **Component Positioning Asymmetry** (CIRCULAR PATTERN #1)
   - **Location**: [PositionCalculation.ts:145-197](../src/utils/PositionCalculation.ts#L145-L197)
   - **Issue**: Left wall uses flipped Y, right wall uses direct Y
   - **Impact**: Fixing one elevation view breaks another
   - **Status**: NEW system exists (lines 208-266) but flag behavior uncertain
   - **Risk**: HIGH - Causes infinite AI coding loops

2. **TypeScript Types Missing Database Fields** (CIRCULAR PATTERN #3)
   - **Location**: [src/types/supabase.ts](../src/types/supabase.ts)
   - **Issue**: `layer_type`, `min_height_cm`, `max_height_cm`, `can_overlap_layers` missing
   - **Impact**: Runtime errors, AI agents create workarounds instead of using actual fields
   - **Fix**: Run `npx supabase gen types typescript > src/types/supabase.ts`
   - **Risk**: HIGH - Prevents collision detection implementation

3. **State Update Array Reference Loop** (CIRCULAR PATTERN #2)
   - **Location**: [ProjectContext.tsx:886-890](../src/contexts/ProjectContext.tsx#L886-L890)
   - **Issue**: No deep equality check on `design_elements` array
   - **Impact**: `hasUnsavedChanges` flag stuck, unnecessary auto-saves
   - **Fix**: Implement deep equality comparison
   - **Risk**: MEDIUM - User experience issue, not functional blocker

**Priority 2 (TECH DEBT)**:

4. **DesignCanvas2D.tsx is Too Large** (2,958 lines)
   - **Issue**: Monolithic component, hard to navigate and test
   - **Refactor Path**: Extract plan view, elevation view, and shared utilities
   - **Risk**: MEDIUM - Increases maintenance cost

5. **Legacy 2D Rendering Code Not Removed** (Phase 5 incomplete)
   - **Issue**: Hardcoded rendering logic coexists with database-driven system
   - **Impact**: Confusion about which system is authoritative
   - **Fix**: Complete Phase 5 cleanup from Oct 2025 migration
   - **Risk**: LOW - Works but confusing

6. **Component Height Sources Confusion** (CIRCULAR PATTERN #5)
   - **Location**: Multiple files (ComponentService, DesignCanvas2D, EnhancedModels3D)
   - **Issue**: 4-6 different height sources for same component
   - **Impact**: Different heights in elevation vs 3D view
   - **Fix**: Audit all 154 components, set explicit `z` values
   - **Risk**: MEDIUM - Visual inconsistency

7. **Corner Cabinet Door Logic Complexity** (CIRCULAR PATTERN #4)
   - **Location**: [elevation-view-handlers.ts:512-569](../src/services/2d-renderers/elevation-view-handlers.ts#L512-L569)
   - **Issue**: 16 different door side rules (4 views × 4 corners)
   - **Impact**: Fixing one view breaks another
   - **Fix**: Create door orientation matrix as single source of truth
   - **Risk**: MEDIUM - User-facing visual bug

8. **Width-Based Component Patterns** (No database schema support)
   - **Issue**: ComponentIDMapper uses 35+ regex patterns for `-ns/-ew` variants
   - **Impact**: Fragile, requires code changes for new patterns
   - **Fix**: Add `directional_variant` column to components table
   - **Risk**: LOW - Works but not scalable

### Workarounds and Gotchas

**Environment Variables**:
- ✅ Standard setup: `.env.local` with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- ⚠️ User account activation: 2-3 minute delay for RLS propagation (Supabase cloud limitation)

**Feature Flags**:
- `use_new_positioning_system` (default: true) - Use unified elevation positioning
- `use_dynamic_3d_models` - Use database-driven 3D models (default: true)
- ⚠️ **GOTCHA**: Flag defaults may be overridden at runtime, creating race conditions

**Database Connections**:
- ✅ Supabase handles connection pooling automatically
- ⚠️ RLS policies: New users may not see components immediately (cache issue)

**Component Library**:
- ⚠️ **GOTCHA**: Always fetch via `ComponentService.ts`, never query directly
- ⚠️ **GOTCHA**: Z-index layering must respect order (0.5 walls → 6.0 doors/windows)
- ⚠️ **GOTCHA**: Wall detection uses string matching on component_id (fragile)

**Coordinate System**:
- ⚠️ **GOTCHA**: `RoomDimensions.height` is actually DEPTH (Y-axis), not vertical height
- ⚠️ **GOTCHA**: `element.height` is vertical dimension (Z-axis)
- ⚠️ **CRITICAL**: Always use `currentViewInfo.direction`, not `active2DView` for calculations
- ⚠️ **CRITICAL**: Left/right elevation views use different coordinate logic in legacy mode

**3D Rendering**:
- ⚠️ **GOTCHA**: Walk mode has no collision detection (can walk through walls)
- ⚠️ **GOTCHA**: Room ceiling height control doesn't affect 3D view (needs implementation)
- ⚠️ **GOTCHA**: Component boundaries don't always match visual representation

---

## Integration Points and External Dependencies

### External Services

| Service | Purpose | Integration Type | Key Files |
|---------|---------|------------------|-----------|
| **Supabase** | Backend (Database + Auth + Storage) | TypeScript SDK | [src/integrations/supabase/client.ts](../src/integrations/supabase/client.ts) |
| **Supabase Auth** | User authentication | Built-in SDK | [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx) |
| **Supabase Storage** | File uploads (planned, not implemented) | Built-in SDK | N/A |

**Supabase Configuration**:
- Project URL: Stored in `VITE_SUPABASE_URL`
- Anonymous Key: Stored in `VITE_SUPABASE_ANON_KEY` (public, safe to expose)
- RLS policies enforce data access control

**Dependency Version Management**:
- All dependencies managed via `package.json`
- No lock-in to specific Supabase version (uses latest compatible)

### Internal Integration Points

**Frontend → Backend Communication**:
- Pattern: Supabase client auto-generated queries (no REST endpoints)
- Error handling: Try-catch with toast notifications
- Loading states: Context-managed `loading` flag

**2D Canvas → 3D View Synchronization**:
- Shared state via `ProjectContext`
- Element updates trigger re-render in both views
- **ISSUE**: No coordinate transformation layer, each view calculates independently

**Component Library → Rendering**:
```
ComponentService (fetch from DB)
    ↓
Render2DService (get 2D metadata)
    ↓
DesignCanvas2D (render to canvas)
    ↓
EnhancedModels3D (render to Three.js)
```

**Auto-Save Flow**:
```
Designer.tsx (user action)
    ↓
updateCurrentRoomDesign() (ProjectContext)
    ↓
dispatch(UPDATE_ROOM_DESIGN)
    ↓
hasUnsavedChanges = true (useEffect)
    ↓
30-second interval checks flag
    ↓
saveCurrentDesign() (if flag true)
    ↓
Supabase update
    ↓
hasUnsavedChanges = false (BUT new array reference sets it true again)
```

---

## Development and Deployment

### Local Development Setup

**Prerequisites**:
- Node.js 18.0.0+
- npm (comes with Node)
- Git
- Supabase account (free tier works)

**Setup Steps** (actual, not ideal):
```bash
# 1. Clone repository
git clone <repo-url>
cd plan-view-kitchen-3d

# 2. Install dependencies
npm install

# 3. Create .env.local (NOT tracked in git)
# Copy from .env.example or create manually:
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# 4. Link to Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# 5. Run migrations (if starting fresh)
npx supabase db push

# 6. Start dev server
npm run dev

# 7. Open browser to http://localhost:5173
```

**Known Setup Issues**:
- ⚠️ User accounts take 2-3 minutes to activate (RLS propagation delay)
- ⚠️ If components don't load, clear browser cache and refresh
- ⚠️ TypeScript errors on `layer_type` field? Run `npx supabase gen types typescript`

### Build and Deployment Process

**Build Commands**:
```bash
npm run build       # Production build (output to dist/)
npm run build:prod  # Same as above (alias)
npm run preview     # Preview production build locally
```

**Type Checking**:
```bash
npm run type-check  # Run TypeScript compiler (--noEmit)
```

**Linting**:
```bash
npm run lint        # ESLint check
```

**Deployment** (current process):
- Manual deployment (no CI/CD configured)
- Build locally: `npm run build`
- Deploy `dist/` folder to static hosting (Vercel, Netlify, etc.)
- Set environment variables in hosting platform dashboard

**Environments**:
- Development: Local (http://localhost:5173)
- Production: Supabase cloud + static hosting

**Database Migrations**:
- Manual push: `npx supabase db push`
- ⚠️ **CRITICAL**: Regenerate types after migrations: `npx supabase gen types typescript`

---

## Testing Reality

### Current Test Coverage

- **Unit Tests**: None
- **Integration Tests**: None
- **E2E Tests**: None
- **Manual Testing**: Primary QA method
- **Test Framework**: `@playwright/test` installed but **NOT CONFIGURED**

**Why No Tests?**:
- Rapid prototyping phase (features over tests)
- Complex canvas + Three.js rendering hard to test
- Organic growth without testing culture

### Testing Utilities

**Development Mode**:
- Performance Monitor: Real-time FPS/memory tracking (god mode only)
- Console Logger: Automated browser console log capture (saves to timestamped files)
- Coordinate System Tester: `testCurrentCoordinateSystem()` accessible via God Mode button

**God Mode** (Development utilities at `/dev`):
- Performance monitoring
- Component manager interface
- Coordinate system testing
- Database query tools
- ⚠️ Not exposed in production

### Manual Testing Process (Current Reality)

**Pre-Deployment Checklist** (informal):
1. Create new project
2. Add room (kitchen)
3. Place base cabinet, wall cabinet, appliance
4. Switch between plan/elevation/3D views
5. Check component positioning matches across views
6. Test save/load
7. Test auto-save (wait 30 seconds)

**Known Testing Gaps**:
- No regression testing (bugs can reappear)
- No cross-browser testing (Chrome only)
- No performance benchmarking
- No accessibility testing

---

## Planned Testing Strategy (Future)

1. **Unit Tests** (Priority: Medium)
   - Utility functions: `PositionCalculation.ts`, `canvasCoordinateIntegration.ts`
   - Service layer: `ComponentService.ts`, `Render2DService.ts`
   - State management: ProjectContext reducer

2. **Integration Tests** (Priority: High)
   - Component positioning across views (MOST CRITICAL)
   - Auto-save mechanism
   - Component library loading

3. **E2E Tests** (Priority: Low)
   - Complete user workflows (create project → design room → save)
   - Cross-browser compatibility

4. **Visual Regression Tests** (Priority: Medium)
   - 2D canvas rendering (screenshot comparison)
   - 3D view rendering (ThreeJS snapshot testing)

---

## Appendix A: Frequently Used Commands

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build
npm run build:prod    # Same as above

# Preview production build
npm run preview

# Type checking (IMPORTANT: Run before committing)
npm run type-check

# Linting
npm run lint

# Clean build artifacts
npm run clean
```

### Database Commands

```bash
# Link to Supabase project (first time setup)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to production
npx supabase db push

# Reset database (DEVELOPMENT ONLY - DESTRUCTIVE)
npx supabase db reset

# Dump database schema
npx supabase db dump

# CRITICAL: Regenerate TypeScript types after migrations
npx supabase gen types typescript > src/types/supabase.ts
```

### Git Workflow Commands

```bash
# Current branch structure
git branch -a

# Create feature branch
git checkout -b feature/your-feature-name

# Type checking before commit
npm run type-check

# Commit with conventional message
git commit -m "feat(scope): Description"
git commit -m "fix(scope): Description"
git commit -m "refactor(scope): Description"
```

---

## Appendix B: Debugging Common Issues

### Issue: "Property 'layer_type' does not exist"

**Symptom**: TypeScript compilation error when accessing `layer_type` on `component_3d_models`

**Root Cause**: TypeScript types not regenerated after database migration

**Fix**:
```bash
npx supabase gen types typescript > src/types/supabase.ts
```

**Verification**: Check `src/types/supabase.ts` for `layer_type` field in `component_3d_models.Row` interface

---

### Issue: "Component positioned differently in elevation vs 3D view"

**Symptom**: Component appears at correct height in elevation view but wrong height in 3D view (or vice versa)

**Root Cause**: Multiple height sources (CIRCULAR PATTERN #5)

**Diagnostic Steps**:
1. Check `element.height` (component dimension)
2. Check `element.z` (position off floor)
3. Check database `elevation_height` column
4. Check `component_behavior.use_actual_height_in_elevation` flag
5. Check hardcoded type defaults in DesignCanvas2D.tsx (lines 1354-1435)

**Fix Path**:
- Set explicit `element.z` value for positioning
- Use `element.height` only for component dimension
- Remove or document `elevation_height` overrides

---

### Issue: "hasUnsavedChanges stuck true after save"

**Symptom**: Orange indicator shows "unsaved changes" even after successful auto-save

**Root Cause**: Array reference change detection (CIRCULAR PATTERN #2)

**Diagnostic Steps**:
1. Open browser console
2. Watch for `SET_UNSAVED_CHANGES` dispatches
3. Note if dispatch happens AFTER successful save

**Fix Path** (for developers):
- Implement deep equality check in ProjectContext.tsx useEffect (line 886)
- OR: Clear flag BEFORE updateCurrentRoomDesign (optimistic update)

**Workaround** (for users):
- Manual save (File → Save) clears the flag
- Reload page if stuck

---

### Issue: "Left and right elevation views show different positioning"

**Symptom**: Same component appears at different horizontal positions on left vs right elevation views

**Root Cause**: Legacy asymmetric coordinate system (CIRCULAR PATTERN #1)

**Diagnostic Steps**:
1. Check feature flag: `use_new_positioning_system` (should be true)
2. Check PositionCalculation.ts - which implementation is being used?
3. Look for "LEGACY" vs "NEW" code paths

**Fix Path**:
- Ensure `use_new_positioning_system` flag is true
- Verify new positioning logic is being used (lines 208-266)
- If still broken, coordinate system needs audit

---

### Issue: "Corner cabinet door facing wrong direction"

**Symptom**: Corner cabinet door faces incorrect side in one or more elevation views

**Root Cause**: Complex view-specific door logic (CIRCULAR PATTERN #4)

**Diagnostic Steps**:
1. Check `element.cornerDoorSide` value (manual override?)
2. Check corner position detection (30cm tolerance from walls)
3. Review elevation-view-handlers.ts logic for specific view (lines 512-569)

**Fix Path**:
- Set manual override: `element.cornerDoorSide = 'left' | 'right'`
- Avoid relying on auto-detection (too complex)

---

### Issue: "New user can't see component library"

**Symptom**: Component sidebar is empty for newly registered user

**Root Cause**: RLS propagation delay (2-3 minutes)

**Diagnostic Steps**:
1. Wait 2-3 minutes after registration
2. Refresh page
3. Clear browser cache
4. Check Supabase dashboard for RLS policy errors

**Workaround**:
- Inform users of 2-3 minute activation delay in registration flow
- Add "Components loading..." state with spinner

---

## Appendix C: AI Agent Guidance

### How to Avoid Circular Coding Loops

**Before Making Position-Related Changes**:

1. **Identify the view context**:
   - Plan view? Use [DesignCanvas2D.tsx](../src/components/designer/DesignCanvas2D.tsx) plan rendering logic
   - Elevation view? Check [PositionCalculation.ts](../src/utils/PositionCalculation.ts) feature flag first
   - 3D view? Use [EnhancedModels3D.tsx](../src/components/designer/EnhancedModels3D.tsx) coordinate conversion

2. **Check feature flags**:
   - `use_new_positioning_system`: Should be **true** (unified elevation positioning)
   - Never toggle flags to "fix" a single view - this breaks others

3. **Understand coordinate systems**:
   - Plan: cm, origin top-left, uses x/y directly
   - Elevation: cm → px, origin canvas top-left, uses PositionCalculation
   - 3D: meters, origin room center, uses convertTo3D function

4. **Test across ALL views**:
   - If fixing elevation left, check right, front, back, AND 3D
   - If fixing 3D, check all four elevation views

**Before Making State-Related Changes**:

1. **Check if change affects `design_elements` array**:
   - If yes, understand this triggers `hasUnsavedChanges` flag
   - Don't try to "fix" flag behavior without understanding array reference issue

2. **Avoid duplicating auto-save logic**:
   - Only ONE auto-save interval should exist (lines 892-933 in ProjectContext)
   - Don't create additional intervals or timers

3. **Use callbacks correctly**:
   - All ProjectContext functions MUST be wrapped in `useCallback`
   - Include proper dependencies to avoid stale closures

**Before Making Database Schema Changes**:

1. **Create migration file** in `supabase/migrations/`
2. **Run migration**: `npx supabase db push`
3. **CRITICAL**: Regenerate types: `npx supabase gen types typescript > src/types/supabase.ts`
4. **Verify types** contain new fields before writing code

**Before Making Component Height Changes**:

1. **Identify the property**:
   - `element.height` = component dimension (vertical size)
   - `element.z` = position off floor
   - `elevation_height` = database override (use sparingly)

2. **Set both if needed**:
   - 3D view needs `element.z` for positioning
   - Elevation view may use `elevation_height` OR type defaults

3. **Test in BOTH elevation and 3D views**

**Red Flags** (Stop and rethink if you see these):

- 🚩 Fixing left wall breaks right wall → You're in CIRCULAR PATTERN #1
- 🚩 Fixing elevation breaks 3D → You're in CIRCULAR PATTERN #5
- 🚩 `hasUnsavedChanges` won't clear → You're in CIRCULAR PATTERN #2
- 🚩 TypeScript error on field that exists in migration → You're in CIRCULAR PATTERN #3
- 🚩 Corner door logic has view-specific if/else → You're in CIRCULAR PATTERN #4

**When Stuck**:

1. **Stop coding** - Don't make more changes
2. **Read this document** - Identify which circular pattern applies
3. **Follow the solution path** - Don't invent new approaches
4. **Test comprehensively** - All views, all scenarios
5. **Ask for clarification** - Don't assume understanding

---

## Appendix D: Next Recommended Improvements

### Priority 1 (Fix Circular Patterns)

1. **Regenerate TypeScript Types** (30 minutes)
   - Run `npx supabase gen types typescript`
   - Verify `layer_type`, `min_height_cm`, `max_height_cm` present
   - Test compilation

2. **Implement Deep Equality for design_elements** (2 hours)
   - Install `lodash` or write custom deep equality function
   - Replace useEffect at line 886 in ProjectContext.tsx
   - Test auto-save behavior

3. **Audit Component Z Positions** (8 hours)
   - Review all 154 components in database
   - Set explicit `z` values for all components
   - Remove reliance on type-based defaults
   - Test elevation + 3D positioning

4. **Consolidate Corner Cabinet Logic** (4 hours)
   - Create door orientation matrix (single source of truth)
   - Remove view-specific if/else chains
   - Use transformation functions for rendering
   - Test all 16 corner scenarios (4 views × 4 corners)

### Priority 2 (Reduce Technical Debt)

5. **Refactor DesignCanvas2D.tsx** (16 hours)
   - Extract plan view rendering to separate component
   - Extract elevation view rendering to separate component
   - Extract shared utilities to helper functions
   - Reduce file from 2,958 lines to <1,000 lines per component

6. **Complete Phase 5 of 2D Migration** (4 hours)
   - Remove legacy hardcoded rendering logic
   - Ensure all rendering uses Render2DService
   - Document any remaining hardcoded cases with justification

7. **Add Integration Tests** (16 hours)
   - Configure Playwright for canvas testing
   - Test component positioning across views
   - Test auto-save mechanism
   - Test state management edge cases

### Priority 3 (Improve Developer Experience)

8. **Add CI/CD Pipeline** (4 hours)
   - GitHub Actions for type checking on PR
   - Auto-regenerate types when migrations change
   - Run linter before merge

9. **Document Coordinate System** (2 hours)
   - Create visual diagram of coordinate systems
   - Add code comments at transformation boundaries
   - Update CLAUDE.md with diagram

10. **Create Component Height Audit Tool** (4 hours)
    - UI to list all components with height sources
    - Highlight conflicts (multiple sources with different values)
    - Batch update tool to standardize heights

---

## Document End

**Last Updated**: 2025-10-26
**Document Version**: 1.0
**Codebase Version**: v2.7
**Author**: Winston (AI Architect Agent)

**For questions or clarifications**, refer to:
- [CLAUDE.md](../CLAUDE.md) - Project instructions for AI agents
- [REQUIREMENTS.md](../REQUIREMENTS.md) - Detailed technical requirements (if exists)
- Recent session docs in `docs/session-*/` folders

**Remember**: This document reflects the **REAL state** of the codebase, including its flaws. Use it to understand the system before attempting changes, especially in the five identified circular dependency areas.
