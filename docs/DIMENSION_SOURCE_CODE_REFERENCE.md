# Dimension Source Code Reference
**Date**: 2025-10-27
**Purpose**: Complete mapping of where component dimensions are defined, stored, and used across the codebase
**Status**: Living Document - Update when dimension architecture changes

---

## Executive Summary

This document maps every location where component dimensions (width, height, depth) are:
1. **Defined** (source of truth in database)
2. **Duplicated** (copied to element instances)
3. **Used** (rendering in 2D/3D views)
4. **Validated** (checks for correctness)

**Key Architectural Decision**: Dimensions are **copied from components table to design elements** at creation time for performance. This creates potential staleness but enables 60fps rendering without database lookups.

---

## Database Schema - Source of Truth

### Primary Table: `components`

**Location**: Supabase PostgreSQL database
**Purpose**: Component library catalog (154 components)

**Dimension Fields**:
```sql
CREATE TABLE public.components (
  component_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,

  -- 3D Dimensions (source of truth)
  width DECIMAL(10,2) NOT NULL,         -- cm (X-axis, left-to-right)
  height DECIMAL(10,2) NOT NULL,        -- cm (Z-axis, vertical SIZE)
  depth DECIMAL(10,2) NOT NULL,         -- cm (Y-axis, front-to-back)

  -- 2D Override (optional, PROBLEMATIC field)
  elevation_height DECIMAL(10,2),       -- cm (2D elevation rendering override)

  -- Positioning (NOT dimensions)
  default_z_position DECIMAL(10,2),     -- cm (height off floor, NOT size)

  -- Other fields...
);
```

**Migration that created/updated these fields**:
- `20250915000000_phase1_expand_components_table.sql` - Added `elevation_height`
- `20251019000003_update_base_cabinet_heights.sql` - Fixed base cabinet heights to 86cm
- `20250131000029_add_default_z_position_to_components.sql` - Added Z positioning

**Current Issue**:
- ❌ `elevation_height` was set to 85cm (should be 86cm)
- ❌ This field may not even be needed (causes sync issues)
- ⚠️ Fixed by SQL in [HEIGHT_FIX_IMPLEMENTATION.md](./HEIGHT_FIX_IMPLEMENTATION.md)

---

## JSONB Storage - Duplicated State

### Table: `room_designs.design_elements`

**Location**: `public.room_designs` table, `design_elements` JSONB column
**Purpose**: Stores element instances placed in user designs

**Dimension Fields** (DUPLICATED from `components` table):
```typescript
interface DesignElement {
  id: string;                     // Element instance ID
  component_id: string;           // Link back to components table

  // Position (WHERE component is)
  x: number;                      // cm from left wall
  y: number;                      // cm from front wall
  z?: number;                     // cm above floor (optional)

  // Dimensions (SIZE of component) - COPIED from components table
  width: number;                  // cm (X-axis)
  height: number;                 // cm (Z-axis vertical SIZE)
  depth: number;                  // cm (Y-axis)

  // Other fields...
  type: string;
  rotation: number;
  zIndex: number;
}
```

**Type Definition Location**: `src/types/project.ts:123-165`

**Important**: These dimensions are **snapshots** from the components table at the time the element was created. They do NOT automatically update if the component definition changes in the database.

---

## Code Locations - Where Dimensions Are Used

### 1. Element Creation (Dimension Duplication Point)

**File**: `src/components/designer/CompactComponentSidebar.tsx`
**Lines**: 226-240
**Function**: `handleMobileClickToAdd()` and drag event handlers

**Code**:
```typescript
const newElement: DesignElement = {
  id: `${component.component_id}-${Date.now()}`,
  component_id: component.component_id,
  type: component.type as any,
  x: 200, y: 150, z: 0,

  // ⚠️ DIMENSION DUPLICATION HAPPENS HERE
  width: component.width,       // Copied from components table
  height: component.height,     // Copied from components table
  depth: component.depth,       // Copied from components table

  rotation: 0,
  color: component.color || '#8B4513',
  name: component.name,
  zIndex: 0
};

onAddElement(newElement);  // Adds to design_elements array
```

**Why this matters**: Once created, the element has its own copy of dimensions. If the component definition is updated in the database (e.g., height changed from 90cm → 86cm), existing elements will NOT automatically update.

**Alternative Architectural Decision**: Could store only `component_id` and look up dimensions at render time, but this would:
- ❌ Require database lookup for every render frame (60fps impossible)
- ❌ Break user's ability to customize individual element dimensions
- ❌ Not work offline

---

### 2. 2D Plan View Rendering

**File**: `src/components/designer/DesignCanvas2D.tsx`
**Function**: Main render loop
**Lines**: 1173-1177 (approximate)

**Code**:
```typescript
// Plan view rendering
const pos = roomToCanvas(element.x, element.y);
const width = element.width * zoom;      // Uses element dimension
const depth = (element.depth || element.height) * zoom;  // Legacy fallback
const rotation = element.rotation || 0;

ctx.save();
ctx.translate(pos.x, pos.y);
ctx.rotate(rotation * Math.PI / 180);

// Draw rectangle using element dimensions
ctx.fillRect(0, 0, width, depth);
```

**Dimension Source**: `element.width`, `element.depth` (from JSONB storage)

**No Database Lookup**: Uses pre-copied dimensions for performance

---

### 3. 2D Elevation View Rendering

**File**: `src/components/designer/DesignCanvas2D.tsx`
**Function**: Elevation view rendering
**Lines**: 1389-1409 (approximate)

**Code**:
```typescript
// Determine height for elevation view
let elevationHeightCm: number;

if (element.type === 'cabinet' && element.id.includes('wall-cabinet')) {
  elevationHeightCm = 70;  // Hardcoded wall cabinet height
} else if (element.type === 'cabinet' && (element.id.includes('tall') || element.id.includes('larder'))) {
  elevationHeightCm = element.height;  // Use actual height for tall units
} else if (element.type === 'cabinet') {
  elevationHeightCm = element.height || 86;  // ⚠️ Fallback to 86cm
} else if (element.type === 'appliance') {
  elevationHeightCm = element.height;
} else {
  elevationHeightCm = element.height;  // Default to element height
}

const elementHeight = elevationHeightCm * zoom;

// Vertical position calculation (Z + height)
const zPosition = element.z || getDefaultZ(element);
const canvasY = calculateYFromZ(zPosition, elementHeight);

// Draw using element dimensions
ctx.fillRect(canvasX, canvasY, element.width * zoom, elementHeight);
```

**Dimension Source**: `element.height`, `element.width` (from JSONB storage)

**Issues**:
- ⚠️ Hardcoded type-based defaults (70cm for wall cabinets)
- ⚠️ Fallback to 86cm if `element.height` missing
- ⚠️ No database lookup to check for `elevation_height` override

**Related Service**:
**File**: `src/services/ComponentService.ts`
**Function**: `getElevationHeight()`
**Lines**: 224-280

**Code**:
```typescript
static async getElevationHeight(componentId: string, componentType: string): Promise<number> {
  // Check cache
  const cached = elevationCache.get(componentId);
  if (cached) {
    return cached.use_actual_height
      ? cached.height
      : (cached.elevation_height || cached.height);
  }

  // Fetch from database
  const { data, error } = await supabase
    .from('components')
    .select('height, elevation_height, component_behavior')
    .eq('component_id', componentId)
    .single();

  if (error) {
    const typeBehavior = await this.getComponentBehavior(componentType);
    return typeBehavior.elevation_height || 86;  // ⚠️ Fallback (was 85)
  }

  const elevationData = {
    height: Number(data.height),
    elevation_height: data.elevation_height ? Number(data.elevation_height) : undefined,
    use_actual_height: data.component_behavior?.use_actual_height_in_elevation || false,
    is_tall_unit: data.component_behavior?.is_tall_unit || false
  };

  // Determine which height to use
  if (elevationData.use_actual_height || elevationData.is_tall_unit) {
    return elevationData.height;
  } else if (elevationData.elevation_height) {
    return elevationData.elevation_height;  // ⚠️ Uses separate field
  } else {
    return elevationData.height;
  }
}
```

**Problem**: This function exists but is NOT called during 2D elevation rendering! The rendering code uses `element.height` directly with hardcoded fallbacks.

---

### 4. 3D View Rendering

**File**: `src/components/designer/EnhancedModels3D.tsx`
**Function**: 3D model loading and positioning
**Lines**: 114-116 (validation), ~200-250 (positioning)

**Code**:
```typescript
// Dimension validation
const validatedWidth = element.width || 0.6;   // meters (fallback)
const validatedDepth = element.depth || 0.6;
const validatedHeight = element.height || 0.9;

// Calculate 3D position (element dimensions → Three.js coordinates)
const roomWidthMeters = roomDimensions.width / 100;
const roomDepthMeters = roomDimensions.height / 100;  // Legacy mapping

// Position calculation
const x3d = (element.x / roomDimensions.width) * roomWidthMeters - (roomWidthMeters / 2);
const z3d = (element.y / roomDimensions.height) * roomDepthMeters - (roomDepthMeters / 2);
const y3d = ((element.z || 0) / 100) + ((element.height / 100) / 2);  // Center vertically

<mesh position={[x3d, y3d, z3d]}>
  <boxGeometry args={[
    validatedWidth / 100,   // Uses element.width
    validatedHeight / 100,  // Uses element.height
    validatedDepth / 100    // Uses element.depth
  ]} />
</mesh>
```

**Dimension Source**: `element.width`, `element.height`, `element.depth` (from JSONB storage)

**Important**: 3D view uses the SAME element dimensions as 2D views. There's no separate 3D dimension source.

**Related File**: `src/components/designer/AdaptiveView3D.tsx`
**Lines**: Component wrapper that passes elements to EnhancedModels3D

---

### 5. Component Service (Database Lookup)

**File**: `src/services/ComponentService.ts`
**Functions**: Multiple dimension-related functions

#### `getComponentBehavior()`

**Lines**: 157-223
**Purpose**: Load component metadata including dimensions

**Code**:
```typescript
static async getComponentBehavior(componentType: string): Promise<ComponentBehavior> {
  // Check cache
  const cached = behaviorCache.get(componentType);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('components')
    .select('mount_type, has_direction, door_side, default_z_position, elevation_height, corner_configuration, component_behavior')
    .eq('type', componentType)
    .limit(1)
    .single();

  if (error) {
    return {
      mount_type: 'floor',
      has_direction: true,
      door_side: 'front',
      default_z_position: 0,
      elevation_height: 86,  // ⚠️ Fallback (was 85, now 86)
      corner_configuration: {},
      component_behavior: {}
    };
  }

  return {
    mount_type: data.mount_type as 'floor' | 'wall',
    has_direction: data.has_direction,
    door_side: data.door_side as 'front' | 'back' | 'left' | 'right',
    default_z_position: Number(data.default_z_position),
    elevation_height: data.elevation_height ? Number(data.elevation_height) : undefined,
    corner_configuration: data.corner_configuration || {},
    component_behavior: data.component_behavior || {}
  };
}
```

**Issue**: This function loads `elevation_height` but the 2D rendering code doesn't call it!

---

### 6. Component Loading Hook

**File**: `src/hooks/useOptimizedComponents.ts`
**Purpose**: Load all components from database for sidebar

**Code**:
```typescript
export default function useOptimizedComponents() {
  const [components, setComponents] = useState<DatabaseComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadComponents() {
      const { data, error } = await supabase
        .from('components')
        .select('component_id, name, type, category, width, height, depth, ...')
        .order('name');

      if (error) {
        setError(error.message);
      } else {
        setComponents(data);  // Dimensions included
      }
      setLoading(false);
    }
    loadComponents();
  }, []);

  return { components, loading, error };
}
```

**Dimension Flow**:
1. Hook loads components from database (includes width, height, depth)
2. CompactComponentSidebar receives components
3. User drags component to canvas
4. `handleMobileClickToAdd()` creates new element with **copied dimensions**
5. Element stored in JSONB with duplicated dimensions

---

## Dimension Validation & Utilities

### 1. ComponentPositionValidator

**File**: `src/utils/ComponentPositionValidator.ts`
**Purpose**: Validate Z positions (height off floor), created in Story 1.7
**Lines**: 1-372

**Functions**:
- `validateZPosition()` - Check if Z is valid
- `getDefaultZ()` - Get default Z position by type
- `ensureValidZ()` - Fix missing Z values

**Important**: This validates **Z position** (where component sits), NOT **height** (how tall it is)

**Code**:
```typescript
static validateZPosition(element: DesignElement): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check if Z is undefined
  if (element.z === undefined || element.z === null) {
    warnings.push(`Element ${element.id} missing Z position. Will default to 0.`);
  }

  // Check if component extends beyond room height
  const topPosition = (element.z || 0) + element.height;  // Uses element.height
  const standardRoomHeight = 240;

  if (topPosition > standardRoomHeight) {
    warnings.push(`Element ${element.id} extends beyond ceiling (${topPosition}cm > 240cm)`);
  }

  return { valid: errors.length === 0, warnings, errors };
}
```

**Dimension Usage**: Reads `element.height` (from duplicated JSONB), does NOT look up database.

---

### 2. CoordinateTransformEngine

**File**: `src/utils/CoordinateTransformEngine.ts`
**Purpose**: Convert between plan view, elevation views, and 3D coordinates (Story 1.2)
**Lines**: Complete file

**Important Functions**:

#### `planToElevation()`
```typescript
static planToElevation(
  element: DesignElementPosition & DesignElementDimensions,
  view: 'front' | 'back' | 'left' | 'right',
  roomDimensions: RoomDimensions,
  canvasWidth: number,
  canvasHeight: number
): CanvasPosition {
  // Horizontal position depends on view
  let canvasX: number;
  if (view === 'front' || view === 'back') {
    canvasX = (element.x / roomDimensions.width) * canvasWidth;
  } else {
    canvasX = (element.y / roomDimensions.depth) * canvasWidth;
  }

  // Vertical position (Z coordinate)
  const heightRatio = (element.z + element.height) / roomDimensions.height;
  canvasY = canvasHeight - (heightRatio * canvasHeight);

  return {
    x: canvasX,
    y: canvasY,
    width: element.width,   // ⚠️ Passes through element dimensions
    height: element.height  // ⚠️ No database lookup
  };
}
```

**Dimension Usage**: Accepts element dimensions as parameters, does NOT look up from database.

---

### 3. PositionCalculation

**File**: `src/utils/PositionCalculation.ts`
**Purpose**: Calculate element positions for different views (Story 1.3)
**Lines**: Complete file

**Code**:
```typescript
public static calculateElementPosition(
  element: DesignElement,
  view: string,
  roomDimensions: { width: number; height: number },
  roomPosition: RoomPosition,
  zoom: number
): ElementPosition {
  // Uses element dimensions directly
  const width = element.width * zoom;
  const height = element.height * zoom;
  const depth = element.depth * zoom;

  // Position calculation...
  return { x, y, width, height };
}
```

**Dimension Usage**: Uses `element.width/height/depth` (from JSONB), no database lookup.

---

## Hardcoded Dimension Fallbacks

### Problem: Multiple Fallback Values Across Codebase

**Locations with hardcoded fallbacks**:

1. **ComponentService.ts** (5 locations):
   ```typescript
   elevation_height: 86,  // Was 85, now fixed
   ```

2. **DesignCanvas2D.tsx** (multiple locations):
   ```typescript
   const height = element.height || 86;  // Base cabinet default
   elevationHeightCm = 70;  // Wall cabinet hardcoded
   ```

3. **EnhancedModels3D.tsx**:
   ```typescript
   const validatedHeight = element.height || 0.9;  // meters (90cm)
   ```

4. **elevation-view-handlers.ts**:
   ```typescript
   const toeKickHeight = (data.toe_kick_height ?? 10) * zoom;
   ```

**Issue**: Inconsistent fallbacks can cause subtle bugs when element is missing dimension data.

---

## Data Flow Diagrams

### Creation Flow (Dimension Duplication)

```
┌─────────────────────────────────────────┐
│  components table (PostgreSQL)          │
│  ├─ width: 60.00                        │
│  ├─ height: 86.00  ← SOURCE OF TRUTH    │
│  ├─ depth: 60.00                        │
│  └─ elevation_height: 86.00 (optional)  │
└──────────────┬──────────────────────────┘
               │
               │ 1. User clicks component in sidebar
               │    (useOptimizedComponents hook)
               ↓
┌─────────────────────────────────────────┐
│  DatabaseComponent (in-memory)          │
│  ├─ width: 60.00  ← COPIED FROM DB      │
│  ├─ height: 86.00                       │
│  └─ depth: 60.00                        │
└──────────────┬──────────────────────────┘
               │
               │ 2. User drags to canvas
               │    (CompactComponentSidebar.tsx:226-240)
               ↓
┌─────────────────────────────────────────┐
│  DesignElement (newElement)             │
│  ├─ width: 60.00  ← DUPLICATED          │
│  ├─ height: 86.00                       │
│  └─ depth: 60.00                        │
└──────────────┬──────────────────────────┘
               │
               │ 3. Element saved to database
               │    (ProjectContext.updateCurrentRoomDesign)
               ↓
┌─────────────────────────────────────────┐
│  room_designs.design_elements (JSONB)   │
│  [{                                      │
│    component_id: "base-cabinet-60",     │
│    width: 60.00,  ← PERSISTED DUPLICATE │
│    height: 86.00,                       │
│    depth: 60.00                         │
│  }]                                     │
└─────────────────────────────────────────┘
```

**Key Point**: Dimensions are **copied** at step 2 and **never automatically updated** even if the component definition changes in the database.

---

### Rendering Flow (No Database Lookup)

```
┌─────────────────────────────────────────┐
│  room_designs.design_elements (JSONB)   │
│  [{                                      │
│    component_id: "base-cabinet-60",     │
│    width: 60.00,                        │
│    height: 86.00,  ← READS FROM HERE    │
│    depth: 60.00                         │
│  }]                                     │
└──────────────┬──────────────────────────┘
               │
               │ 1. ProjectContext loads design
               │
               ↓
┌─────────────────────────────────────────┐
│  state.currentRoomDesign.design_elements│
│  (in React state)                       │
└──────────────┬──────────────────────────┘
               │
               ├──────────────┬─────────────────┬────────────────┐
               │              │                 │                │
               ↓              ↓                 ↓                ↓
         ┌─────────┐    ┌─────────┐      ┌─────────┐     ┌─────────┐
         │ Plan    │    │ Elev    │      │ Elev    │     │ 3D      │
         │ View    │    │ Front   │      │ Left    │     │ View    │
         └─────────┘    └─────────┘      └─────────┘     └─────────┘
              │               │                │               │
              │               │                │               │
              ↓               ↓                ↓               ↓
      element.width   element.width    element.width   element.width
      element.depth   element.height   element.height  element.height
                                                        element.depth

      ⚠️ NO DATABASE LOOKUP - USES CACHED ELEMENT DIMENSIONS
```

**Performance Benefit**: 60fps rendering possible (no async database calls during render loop)

**Trade-off**: Elements can become stale if component definition updated in database

---

## Story Mapping to Dimension Architecture

### Completed Stories (1.1-1.8)

| Story | Related to Dimensions? | Notes |
|-------|----------------------|-------|
| **1.1** - TypeScript Types | ✅ Yes | Regenerated types including `height`, `elevation_height`, `default_z_position` fields |
| **1.2** - Coordinate Engine | ⚠️ Partial | Created CoordinateTransformEngine but passes dimensions through without validation |
| **1.3** - Position Calculation | ⚠️ Partial | Uses element dimensions directly, no database lookup or validation |
| **1.4** - EnhancedModels3D | ⚠️ Partial | 3D rendering uses element dimensions, has fallbacks but no sync check |
| **1.5** - DesignCanvas2D | ❌ No | Not dimension-related (2D rendering improvements) |
| **1.6** - Deep Equality State | ❌ No | State management, not dimensions |
| **1.7** - Position Validator | ⚠️ Partial | Validates Z position (height off floor), NOT dimensions (size) |
| **1.8** - Component Z Audit | ⚠️ Partial | Audited and fixed Z positions, NOT height/width/depth dimensions |

---

### Planned Stories from Fix Plan

| Fix # | Story Name | Addresses Dimensions? | Status |
|-------|-----------|---------------------|--------|
| **Fix #3** | Type/Schema Mismatch | ❌ No | ✅ Complete (Story 1.1) |
| **Fix #1** | Positioning Coordinate | ⚠️ Partial | ⏸️ In Progress |
| **Fix #2** | State Update Circle | ❌ No | 📝 Planned |
| **Fix #5** | Height Property Circle | ✅ **YES** | 📝 Planned |
| **Fix #4** | Corner Cabinet Logic | ❌ No | 📝 Planned |

**Key Finding**: **Fix #5 (Height Property Circle)** is the story that addresses dimension architecture!

---

### Fix #5 Details from Roadmap

**File**: `docs/circular-patterns-fix-plan.md:1144-1717`

**Problem Statement**:
> Multiple sources of truth for component height:
> 1. `element.height` (dimension)
> 2. `element.z` (position off floor)
> 3. `elevation_height` (database override)
> 4. `component_behavior.use_actual_height_in_elevation` (flag)
> 5. Type-based hardcoded defaults

**Impact**: Components positioned at different heights in elevation vs 3D view.

**Planned Phases**:
1. **Phase 1**: Clarify Height vs Z Semantics (2 hours)
2. **Phase 2**: Component Library Z Audit (4 hours)
3. **Phase 3**: Update Rendering Logic (2 hours)

**Total Time**: 8 hours

**Key Actions**:
- Deprecate `elevation_height` field (causes sync issues)
- Always use `element.height` for SIZE
- Use `element.z` for POSITION
- Remove hardcoded fallbacks in rendering code
- Create migration to populate default Z positions

---

## Gap Analysis: What's Missing

### Current Dimension Issues NOT Addressed by Fix #5

1. **Dimension Staleness Detection** ❌ Not covered
   - Elements don't track which version of component they were created from
   - No warning when component definition updated in database
   - No bulk update utility for existing elements

2. **`elevation_height` Field Removal** ⚠️ Partially covered
   - Fix #5 plans to "simplify elevation height logic"
   - But doesn't explicitly remove the field or migrate data

3. **Dimension Validation at Creation** ❌ Not covered
   - No check if dimensions are reasonable (e.g., width > 10000cm)
   - No bounds checking (e.g., element wider than room)

4. **User Dimension Customization Tracking** ❌ Not covered
   - If user manually edits element dimensions, this should be flagged
   - Prevents accidental overwrite during bulk updates

5. **Dimension Sync UI** ❌ Not covered
   - No UI to show "This element's dimensions are outdated"
   - No "Update to latest component version" button

---

## Recommendations for New Stories

### Story 1.9: Dimension Validation Layer (Priority: High)

**Purpose**: Add validation layer to detect and warn about dimension issues

**Tasks**:
1. Create `DimensionValidator` utility class
2. Add `validateDimensions()` to ComponentPositionValidator
3. Add warnings when:
   - Element dimensions don't match current component definition
   - Dimensions exceed room bounds
   - Dimensions are unrealistic (e.g., height > 300cm for base cabinet)
4. Add developer console warnings (not user-facing yet)

**Time Estimate**: 4 hours

**Acceptance Criteria**:
- ✅ Console warns when element has stale dimensions
- ✅ Console warns when dimensions exceed room bounds
- ✅ Validation runs on element creation and modification
- ✅ Unit tests for validation logic

---

### Story 1.10: Remove `elevation_height` Field (Priority: Medium)

**Purpose**: Eliminate the problematic `elevation_height` field

**Tasks**:
1. Audit all uses of `elevation_height` in codebase
2. Replace with `height` field
3. Create migration to remove field from database
4. Update TypeScript types
5. Remove from ComponentService logic
6. Test that 2D elevation rendering still works

**Time Estimate**: 3 hours

**Acceptance Criteria**:
- ✅ `elevation_height` field removed from database
- ✅ All code uses `height` instead
- ✅ No regressions in 2D elevation rendering
- ✅ TypeScript types updated

**Dependencies**: Must complete Fix #5 first (or incorporate into Fix #5)

---

### Story 1.11: Component Versioning System (Priority: Medium)

**Purpose**: Track which version of component each element was created from

**Tasks**:
1. Add `version` column to `components` table (defaults to 1)
2. Add `component_version` field to DesignElement interface
3. Increment version when component dimensions updated
4. Store version when element created
5. Add validation check to compare element version vs current component version
6. Add console warning when versions don't match

**Time Estimate**: 6 hours

**Acceptance Criteria**:
- ✅ Components have version tracking
- ✅ Elements store version they were created from
- ✅ Validation detects stale element versions
- ✅ Migration updates existing data

---

### Story 1.12: Dimension Sync UI (Priority: Low)

**Purpose**: Give users visibility and control over dimension staleness

**Tasks**:
1. Add warning icon in PropertiesPanel when element dimensions stale
2. Create "Update to Latest" button in PropertiesPanel
3. Add bulk update utility in Component Manager (/dev/components)
4. Show version diff modal (old dimensions vs new)
5. Allow user to keep custom dimensions vs update

**Time Estimate**: 8 hours

**Acceptance Criteria**:
- ✅ Users can see when element dimensions are outdated
- ✅ Users can update individual elements
- ✅ Admins can bulk update all elements using old component version
- ✅ User customizations preserved if desired

**Dependencies**: Requires Story 1.11 (versioning)

---

## Code Changes Required by Location

### Files That Need Updates (Fix #5 + New Stories)

#### High Priority Changes

1. **src/services/ComponentService.ts**
   - Remove `elevation_height` logic (6 locations)
   - Simplify `getElevationHeight()` to always return `element.height`
   - Add `getComponentVersion()` method (Story 1.11)

2. **src/components/designer/DesignCanvas2D.tsx**
   - Remove hardcoded height defaults (lines 1389-1409)
   - Call `ComponentService` for dimension validation
   - Add staleness warnings

3. **src/components/designer/EnhancedModels3D.tsx**
   - Standardize dimension fallbacks
   - Add validation check before rendering

4. **src/components/designer/CompactComponentSidebar.tsx**
   - Add version tracking when creating elements (line 227)
   - Add dimension validation before element creation

#### Medium Priority Changes

5. **src/utils/ComponentPositionValidator.ts**
   - Add `validateDimensions()` method (Story 1.9)
   - Add `checkDimensionStaleness()` (Story 1.11)

6. **src/components/designer/PropertiesPanel.tsx**
   - Add staleness warning UI (Story 1.12)
   - Add "Update to Latest" button

#### Low Priority Changes

7. **supabase/migrations/**
   - Create `add_component_versioning.sql` (Story 1.11)
   - Create `remove_elevation_height.sql` (Story 1.10)

---

## Testing Strategy

### Unit Tests Needed

1. **DimensionValidator.test.ts** (Story 1.9)
   - Test bounds validation
   - Test staleness detection
   - Test realistic dimension checking

2. **ComponentVersioning.test.ts** (Story 1.11)
   - Test version increment on component update
   - Test version storage on element creation
   - Test staleness detection

### Integration Tests Needed

1. **Dimension Duplication Flow**
   - Create element → Verify dimensions copied
   - Update component → Verify existing elements unchanged
   - Create new element → Verify uses new dimensions

2. **Cross-View Consistency**
   - Create element in plan view
   - Verify same dimensions in elevation views
   - Verify same dimensions in 3D view

### Manual Test Cases

1. **Staleness Detection**
   - Create element
   - Update component dimensions in database
   - Create new element (should use new dimensions)
   - Old element should show warning (when Story 1.12 complete)

2. **User Customization**
   - Create element
   - Manually edit dimensions in PropertiesPanel
   - Mark as "user customized"
   - Should not show staleness warning

---

## Migration Path

### Phase 1: Immediate Fixes (Stories 1.1-1.8 + Height Fix)

- ✅ **Complete**: TypeScript types, coordinate engine, position calc, Z audit
- ⏸️ **In Progress**: Kitchen component height fix (SQL ready to run)

### Phase 2: Fix #5 Implementation (2-3 days)

1. Document Height vs Z semantics ✅ Already done in this document
2. Run component Z audit ✅ Already done in Story 1.8
3. Update rendering logic to remove hardcoded defaults
4. Deprecate `elevation_height` usage

### Phase 3: New Stories (1-2 weeks)

1. **Story 1.9**: Dimension Validation Layer (4 hours)
2. **Story 1.10**: Remove `elevation_height` Field (3 hours)
3. **Story 1.11**: Component Versioning System (6 hours)
4. **Story 1.12**: Dimension Sync UI (8 hours)

**Total Additional Time**: 21 hours (3 working days)

---

## Quick Reference Tables

### Dimension Fields Cheat Sheet

| Field | Table | Type | Purpose | Status |
|-------|-------|------|---------|--------|
| `width` | components | DECIMAL(10,2) | Component width (cm, X-axis) | ✅ Good |
| `height` | components | DECIMAL(10,2) | Component height (cm, Z-axis SIZE) | ✅ Good |
| `depth` | components | DECIMAL(10,2) | Component depth (cm, Y-axis) | ✅ Good |
| `elevation_height` | components | DECIMAL(10,2) | 2D elevation override | ⚠️ Problematic |
| `default_z_position` | components | DECIMAL(10,2) | Height off floor (cm, POSITION not SIZE) | ✅ Good |
| `width` | design_elements JSONB | number | Element width (duplicated) | ✅ Good |
| `height` | design_elements JSONB | number | Element height (duplicated) | ✅ Good |
| `depth` | design_elements JSONB | number | Element depth (duplicated) | ✅ Good |
| `z` | design_elements JSONB | number? | Height off floor (POSITION) | ✅ Good |

---

### File Location Cheat Sheet

| Task | File | Lines | Function |
|------|------|-------|----------|
| Create element | CompactComponentSidebar.tsx | 226-240 | handleMobileClickToAdd() |
| Render 2D plan | DesignCanvas2D.tsx | ~1173-1177 | Main render loop |
| Render 2D elevation | DesignCanvas2D.tsx | ~1389-1409 | Elevation render |
| Render 3D | EnhancedModels3D.tsx | ~200-250 | convertTo3D() |
| Get elevation height | ComponentService.ts | 224-280 | getElevationHeight() |
| Validate Z position | ComponentPositionValidator.ts | 1-372 | validateZPosition() |
| Load components | useOptimizedComponents.ts | Complete | Hook |
| Transform coordinates | CoordinateTransformEngine.ts | Complete | Static methods |

---

## Summary

**Architectural Decision**: Dimension duplication is **correct for the use case** (performance, customization, offline support).

**Current Problem**: Missing validation layer to detect when duplicated dimensions become stale.

**Solution**: Implement Stories 1.9-1.12 to add versioning, validation, and user visibility.

**Time Investment**: 21 hours total for complete solution (3 working days).

**Recommendation**: Proceed with Fix #5 as planned, then add validation layer (Story 1.9) as quick win to catch future issues.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-27
**Author**: Claude (Architectural Analysis)
