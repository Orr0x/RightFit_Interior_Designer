# Single Source of Truth Audit
**Date:** 2025-10-13
**Branch:** feature/coordinate-system-setup
**Purpose:** Comprehensive audit of data sources and configurations to ensure no ghost code, duplications, or conflicts

---

## Executive Summary

### ✅ CLEAN: Component Data Flow
- **Database:** `components` table (194 components)
- **Hook:** `useOptimizedComponents` (single source)
- **No hardcoded components** found in codebase
- **All creation paths use database:** CompactComponentSidebar, DesignCanvas2D drag-and-drop

### ✅ CLEAN: Component Properties (Height Fields)
- **height:** Physical Z-axis dimension (from database)
- **default_z_position:** Placement height off floor (from database, with helper fallback)
- **plinth_height:** Toe-kick height (from database, with helper fallback)
- **elevation_height:** Visual override for elevation views (from database, rarely used)
- **No conflicting hardcoded values** in component creation
- **Unified flow:** Database → Interface → Helper → DesignElement → Renderers

### ⚠️ MIXED: Room Data Sources
- **Primary:** Database (`room_designs.room_dimensions`, `room_type_templates`)
- **Issue:** Some fallback hardcoded dimensions in services
- **Details below**

### ⚠️ TO VERIFY: Coordinate System
- **Multiple transform engines** exist
- **Unclear single source** for coordinate calculations
- **Details below**

---

## 1. Component Data Flow ✅

### 1.1 Database Source
**Table:** `components`
- 194 active components (deprecated=false)
- Includes: width, height, depth, color, type, category, room_types
- Includes: default_z_position, plinth_height (recently migrated)
- Includes: metadata (JSONB) for future extensibility

### 1.2 Loading Hook
**File:** `src/hooks/useOptimizedComponents.ts`
- Single SQL query: `SELECT * FROM components WHERE deprecated = false`
- Includes plinth_height and default_z_position
- No hardcoded component arrays
- Returns DatabaseComponent[] directly

### 1.3 Component Creation Paths
All three paths use database values:

#### Path 1: CompactComponentSidebar - handleMobileClickToAdd
```typescript
// Lines 224-254
const defaultZ = getDefaultZ(type, id, database_z_position);
const plinthHeight = getPlinthHeightValue(type, id, database_plinth, defaultZ);
const newElement: DesignElement = {
  z: defaultZ,
  plinth_height: plinthHeight,
  // ... other props from database
};
```

#### Path 2: CompactComponentSidebar - handleComponentSelect
```typescript
// Lines 376-409
const defaultZ = getDefaultZ(type, id, database_z_position);
const plinthHeight = getPlinthHeightValue(type, id, database_plinth, defaultZ);
const element: DesignElement = {
  z: defaultZ,
  plinth_height: plinthHeight,
  // ... other props from database
};
```

#### Path 3: DesignCanvas2D - handleDrop
```typescript
// Lines 2692-2745
const defaultZ = getDefaultZ(type, id, dragData.default_z_position);
const plinthHeight = getPlinthHeightValue(type, id, dragData.plinth_height, defaultZ);
const newElement: DesignElement = {
  z: defaultZ,
  plinth_height: plinthHeight,
  // ... other props from dragData (from database)
};
```

### 1.4 Drag Data
**File:** `src/components/designer/CompactComponentSidebar.tsx:261-274`
```typescript
const dragData = {
  id: component.component_id,
  // ... all database fields
  default_z_position: component.default_z_position, // ✅ From database
  plinth_height: component.plinth_height            // ✅ From database
};
```

### 1.5 Helper Functions (Fallback Logic)
**File:** `src/utils/componentZPositionHelper.ts`
- Priority: Database → Type rules → Default (0cm)
- Type rules: Wall cabinets = 140cm, Base cabinets = 0cm

**File:** `src/utils/componentPlinthHelper.ts`
- Priority: Database → Type rules → Default (10cm)
- Type rules: Wall-mounted = 0cm, Base cabinets = 10cm

**Result:** Intelligent fallback, database value always wins

---

## 2. Component Rendering ✅

### 2.1 2D Elevation View
**File:** `src/services/2d-renderers/elevation-view-handlers.ts`

#### renderStandardCabinet (Lines 42-44)
```typescript
// ✅ CORRECT: Uses element.plinth_height with fallback
const plinthHeightCm = element.plinth_height ?? data.toe_kick_height ?? 10;
const toeKickHeight = plinthHeightCm * zoom;
```

#### renderSinkElevation (Lines 352-353)
```typescript
// ✅ CORRECT: Uses element.plinth_height with fallback
const plinthHeightCm = element.plinth_height ?? 10;
const toeKickHeight = plinthHeightCm * zoom;
```

### 2.2 3D Hardcoded Renderer
**File:** `src/components/designer/EnhancedModels3D.tsx:238-239`
```typescript
// ✅ CORRECT: Uses element.plinth_height from database
const plinthHeightCm = validElement.plinth_height ?? (isWallCabinet ? 0 : 10);
const plinthHeight = plinthHeightCm / 100; // Convert to meters
```

### 2.3 3D Dynamic Renderer (Feature-Flagged)
**File:** `src/components/3d/DynamicComponentRenderer.tsx`
- Uses database-driven 3D models from `component_3d_models` table
- Plinth height loaded from component_3d_models.geometry JSONB
- Feature flag: `use_dynamic_3d_models`

### 2.4 Formula Evaluator
**File:** `src/utils/FormulaEvaluator.ts:318`
```typescript
// ✅ UPDATED: Changed from 15cm to 10cm for consistency
plinthHeight: options?.plinthHeight ?? 0.10, // 10cm default
```

**Result:** All renderers use single source (element.plinth_height)

---

## 3. Room Data Sources ⚠️

### 3.1 Database Sources (Primary)
**Table 1:** `room_designs`
- Column: `room_dimensions` (JSONB)
- Contains: `{ width: number, height: number, ceilingHeight?: number }`

**Table 2:** `room_type_templates`
- Columns: `default_width`, `default_height`, `default_ceiling_height`
- One row per room type (kitchen, bedroom, etc.)

### 3.2 Services
**File:** `src/services/RoomService.ts`
- Method: `getRoomTypeTemplate(roomType)` → loads from database
- Method: `getRoomConfiguration(roomType, dimensions)` → merges template with overrides
- ✅ DATABASE-FIRST approach

### 3.3 Hook
**File:** `src/hooks/useRoomTemplate.ts`
- Wraps RoomService.getRoomTypeTemplate()
- Caches template data
- ✅ No hardcoded values

### 3.4 Fallback Dimensions (⚠️ POTENTIAL ISSUE)

#### DesignCanvas2D.tsx (Lines 84-102)
```typescript
const getRoomConfig = async (roomType: string, roomDimensions: any) => {
  if (roomConfigCache) return roomConfigCache;

  try {
    const config = await RoomService.getRoomConfiguration(roomType, roomDimensions);
    roomConfigCache = config;
    return config;
  } catch (err) {
    console.warn('Failed to load room config, using fallback:', err);
    // ⚠️ HARDCODED FALLBACK
    const fallback = {
      dimensions: roomDimensions || { width: 600, height: 400 },
      wall_height: 240,
      ceiling_height: 250
    };
    roomConfigCache = fallback;
    return fallback;
  }
};
```

**Issue:** Hardcoded fallback dimensions (600x400, 240 wall, 250 ceiling)
**Risk:** If database fails, uses hardcoded values
**Mitigation:** Should fail gracefully or show error, not silently fall back

#### CoordinateTransformEngine.ts
**File:** `src/services/CoordinateTransformEngine.ts`
- Has initialization with room dimensions
- May have fallback logic (needs verification)

#### canvasCoordinateIntegration.ts
**File:** `src/utils/canvasCoordinateIntegration.ts`
- Enhanced placement logic
- Takes room dimensions as parameter
- No hardcoded dimensions found (verified via grep)

### 3.5 Removed Hardcoded Configs ✅
**File:** `src/types/project.ts:260-289`
- **REMOVED:** ROOM_TYPE_CONFIGS object (deleted 2025-10-10)
- Migration guide included in comments
- All code now uses RoomService

---

## 4. Coordinate System 🔍

### 4.1 Multiple Transform Engines

#### CoordinateTransformEngine.ts
**File:** `src/services/CoordinateTransformEngine.ts`
- Purpose: Coordinate transformations
- Initialization: `initializeCoordinateEngine(roomDimensions)`
- Used by: Multiple components

#### PositionCalculation.ts
**File:** `src/utils/PositionCalculation.ts`
- Purpose: Element positioning logic
- Wall detection
- Snap-to-wall calculations

#### canvasCoordinateIntegration.ts
**File:** `src/utils/canvasCoordinateIntegration.ts`
- Purpose: Enhanced component placement
- Function: `getEnhancedComponentPlacement()`
- Wall clearance, rotation, corner detection

### 4.2 Concerns
1. **Multiple engines:** Three different files for coordinate logic
2. **Unclear hierarchy:** Which is the source of truth?
3. **Potential conflicts:** Do they use the same conventions?
4. **User concern:** "need to ensure the components are where they are supposed to be"

### 4.3 Needs Investigation
- [ ] Document coordinate system conventions (origin, axes, units)
- [ ] Verify consistency between three engines
- [ ] Check for conflicting transform logic
- [ ] Confirm wall detection accuracy
- [ ] Test element positioning in all views

---

## 5. Configuration Values

### 5.1 Canvas Constants (DesignCanvas2D.tsx)
```typescript
// Lines 106-115
const CANVAS_WIDTH = 1600;   // Larger workspace
const CANVAS_HEIGHT = 1200;  // Larger workspace
const GRID_SIZE = 20;        // Grid spacing in pixels
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.0;
const WALL_THICKNESS = 10;   // 10cm (matches 3D)
const WALL_CLEARANCE = 5;    // 5cm clearance
const WALL_SNAP_THRESHOLD = 40; // Snap if within 40cm
```

**Status:** Constants for UI behavior, not data
**Issue:** No database configuration table for these values
**Recommendation:** Consider moving to `configuration` table if user-configurable

### 5.2 Configuration Service
**File:** `src/services/ConfigurationService.ts`
- Loads config from `configuration` table
- Key-value pairs
- Currently used for some canvas settings

**Potential improvement:** Move canvas constants to ConfigurationService

---

## 6. Data Duplication Check

### 6.1 Component Properties ✅
**No duplication found:**
- ❌ No component arrays in code
- ❌ No hardcoded dimensions
- ❌ No conflicting property sources
- ✅ Single flow: Database → DesignElement → Renderers

### 6.2 Component 2D Render Data
**Table:** `component_2d_renders`
- Contains: door_count, door_style, handle_style, has_toe_kick, toe_kick_height, etc.
- Used by: 2D elevation renderers
- **Potential duplication:** toe_kick_height vs components.plinth_height

**Current behavior:**
```typescript
// elevation-view-handlers.ts:43
const plinthHeightCm = element.plinth_height ?? data.toe_kick_height ?? 10;
```

**Status:** Fallback chain handles it, but toe_kick_height in component_2d_renders is redundant
**Next migration:** Door/drawer config (already documented in DOOR_DRAWER_CONFIG_MIGRATION.md)

### 6.3 Room Geometry
**Table:** `room_geometry_templates`
- Contains: wall definitions, vertices, metadata
- Used by: Complex room shapes (L/U-shaped)
- **No duplication:** Only source for geometry data

---

## 7. Ghost Code Check

### 7.1 Deprecated Hooks
**File:** `src/hooks/useComponents.ts`
- **Status:** Still active, but superseded by useOptimizedComponents
- **Usage:** Check if anything still imports this
- **Recommendation:** Deprecate or remove if unused

### 7.2 Legacy Functions (project.ts)
**File:** `src/types/project.ts:301-389`
- `getRoomTypeConfig()` - Throws error with migration message ✅
- `getAllRoomTypes()` - Still used (type guard)
- `createDefaultRoomDesign()` - Throws error with migration message ✅

**Status:** Properly deprecated with helpful error messages

### 7.3 Hardcoded Component References
**Search results:** None found ✅
- No component arrays in UI code
- No hardcoded component configurations
- All components from database

---

## 8. Summary by Data Type

| Data Type | Single Source? | Location | Conflicts? |
|-----------|---------------|----------|----------|
| Component list | ✅ YES | `components` table | ❌ None |
| Component dimensions | ✅ YES | `components` table | ❌ None |
| Component Z-position | ✅ YES | `components.default_z_position` + helper | ❌ None |
| Component plinth height | ✅ YES | `components.plinth_height` + helper | ❌ None |
| Component 2D render config | ⚠️ PARTIAL | `component_2d_renders` table | ⚠️ toe_kick_height redundant |
| Component 3D models | ✅ YES | `component_3d_models` table | ❌ None |
| Room dimensions | ✅ YES | `room_designs.room_dimensions` | ⚠️ Fallback hardcoded |
| Room templates | ✅ YES | `room_type_templates` table | ❌ None |
| Room geometry | ✅ YES | `room_geometry_templates` table | ❌ None |
| Coordinate transforms | ❓ UNCLEAR | 3 different files | 🔍 Needs investigation |
| Canvas settings | ⚠️ PARTIAL | Hardcoded constants | ⚠️ Not in database |

---

## 9. Recommendations

### 9.1 Immediate (Before Coordinate Work)
- [x] ✅ Verify all component creation paths use database (DONE)
- [x] ✅ Confirm plinth_height migration complete (DONE)
- [ ] ⚠️ Remove hardcoded room dimension fallback in DesignCanvas2D.tsx
- [ ] ⚠️ Document coordinate system conventions

### 9.2 Short-Term (Next Migration)
- [ ] Complete door/drawer config migration (already documented)
- [ ] Deprecate or remove `useComponents.ts` if unused
- [ ] Move canvas constants to ConfigurationService
- [ ] Consolidate coordinate transform logic

### 9.3 Long-Term (Backlog)
- [ ] Audit component_2d_renders for other redundant fields
- [ ] Consider unified transform engine
- [ ] Add database config for all UI constants
- [ ] Performance optimization for database queries

---

## 10. Coordinate System Investigation Required

### Questions to Answer:
1. What is the origin point? (Top-left? Bottom-left? Center?)
2. What direction is positive X, Y, Z?
3. What units are used? (Centimeters confirmed, but are transforms consistent?)
4. How do 2D canvas coordinates map to 3D world coordinates?
5. Do all three transform engines use the same conventions?
6. Where is wall detection happening, and is it accurate?
7. How does room geometry affect coordinate system?

### Files to Investigate:
- `src/services/CoordinateTransformEngine.ts`
- `src/utils/PositionCalculation.ts`
- `src/utils/canvasCoordinateIntegration.ts`
- `src/components/designer/DesignCanvas2D.tsx` (transform logic)
- `src/components/designer/AdaptiveView3D.tsx` (3D positioning)

---

## Conclusion

### ✅ Component Data: CLEAN
- Single source of truth (database)
- No hardcoded components
- Unified creation flow
- All renderers use element properties
- Recent migrations (z-position, plinth) successful

### ⚠️ Room Data: MOSTLY CLEAN
- Database-first approach implemented
- One hardcoded fallback needs removal
- No conflicting sources

### 🔍 Coordinate System: NEEDS INVESTIGATION
- Three separate coordinate/transform files
- Unclear if conventions are unified
- This is the blocker for elevation view finalization

### Next Steps:
1. **User to test:** Plinth height migration
2. **Claude to investigate:** Coordinate system (3 engines)
3. **Then:** Complete elevation view work
4. **Later:** Door/drawer config migration

**Ready for coordinate system deep dive once user confirms testing.**
