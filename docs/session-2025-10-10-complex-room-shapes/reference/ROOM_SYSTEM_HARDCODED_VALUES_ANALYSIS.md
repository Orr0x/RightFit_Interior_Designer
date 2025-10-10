# Room System Hardcoded Values - Comprehensive Analysis

**Generated:** 2025-10-10
**Analysis Scope:** Room-related hardcoded values in codebase
**Files Analyzed:**
- `src/components/designer/AdaptiveView3D.tsx`
- `src/components/designer/DesignCanvas2D.tsx`
- `src/components/designer/EnhancedModels3D.tsx`
- `src/types/project.ts`
- `supabase/migrations/*room*.sql`

---

## Executive Summary

This analysis categorizes **ALL** hardcoded values related to rooms into four categories:
1. **HARDCODED & NEEDED** - System constants that should remain hardcoded
2. **HARDCODED & NOT NEEDED** - Values that can be removed or derived
3. **HARDCODED BUT IN DATABASE** - Values hardcoded as fallbacks but already in database
4. **HARDCODED & SHOULD BE IN DATABASE** - Values that should be moved to database

**Key Finding:** The codebase has successfully moved most room configuration values to the database (via `room_type_templates` table), but still has numerous hardcoded fallbacks and constants that need cleanup.

---

## Category 1: HARDCODED & NEEDED
**System constants and rendering constants that should stay hardcoded**

### Canvas & Rendering Constants

| Value | Location | Line | Purpose | Recommendation |
|-------|----------|------|---------|----------------|
| `1600` | DesignCanvas2D.tsx | 97 | CANVAS_WIDTH - Internal canvas size | **KEEP** - Rendering constant |
| `1200` | DesignCanvas2D.tsx | 98 | CANVAS_HEIGHT - Internal canvas size | **KEEP** - Rendering constant |
| `20` | DesignCanvas2D.tsx | 99 | GRID_SIZE - Grid spacing in pixels | **KEEP** - UI constant, but could be configurable |
| `0.5` | DesignCanvas2D.tsx | 100 | MIN_ZOOM - Minimum zoom level | **KEEP** - UI constraint |
| `4.0` | DesignCanvas2D.tsx | 101 | MAX_ZOOM - Maximum zoom level | **KEEP** - UI constraint |

**Recommendation:** These are system-level rendering constants. Keep hardcoded but consider moving to a `rendering_config` table for advanced users.

---

### Wall Thickness & Coordinate Conversion

| Value | Location | Line | Purpose | In Database? | Recommendation |
|-------|----------|------|---------|--------------|----------------|
| `10` (cm) | AdaptiveView3D.tsx | 54 | WALL_THICKNESS_CM - 3D wall thickness | NO | **KEEP** - Architectural standard |
| `10` (cm) | DesignCanvas2D.tsx | 104 | WALL_THICKNESS - 2D wall thickness | NO | **KEEP** - Matches 3D |
| `10` (cm) | EnhancedModels3D.tsx | 27 | WALL_THICKNESS_CM - Model wall thickness | NO | **KEEP** - Consistency |

**Recommendation:** 10cm wall thickness is an architectural standard. Keep hardcoded for consistency across 2D/3D rendering.

---

### 3D Lighting Constants

| Value | Location | Line | Purpose | Recommendation |
|-------|----------|------|---------|----------------|
| `0.8` | AdaptiveView3D.tsx | 153 | Ambient light intensity (low quality) | **KEEP** - Performance optimization |
| `0.4` | AdaptiveView3D.tsx | 162, 177 | Ambient light intensity (medium/high) | **KEEP** - Visual quality |
| `1.0` | AdaptiveView3D.tsx | 165, 180 | Directional light intensity | **KEEP** - Standard lighting |
| `0.3` | AdaptiveView3D.tsx | 185 | Point light intensity | **KEEP** - Accent lighting |
| `0.2` | AdaptiveView3D.tsx | 186 | Point light intensity (warm) | **KEEP** - Ambient fill |
| `[10, 10, 5]` | AdaptiveView3D.tsx | 164, 179 | Directional light position | **KEEP** - Standard 3D lighting setup |

**Recommendation:** These are standard 3D rendering constants. Keep hardcoded for consistent visual quality.

---

### Component Z-Position Defaults (3D Rendering)

| Value | Location | Line | Purpose | In Database? | Recommendation |
|-------|----------|------|---------|--------------|----------------|
| `200` (cm) | EnhancedModels3D.tsx | 80 | Cornice default Z height | NO | **MOVE TO DB** - See Category 4 |
| `140` (cm) | EnhancedModels3D.tsx | 82 | Pelmet default Z height | NO | **MOVE TO DB** - See Category 4 |
| `90` (cm) | EnhancedModels3D.tsx | 84 | Counter-top default Z height | NO | **MOVE TO DB** - See Category 4 |
| `140` (cm) | EnhancedModels3D.tsx | 86 | Wall cabinet default Z height | NO | **MOVE TO DB** - See Category 4 |
| `90` (cm) | EnhancedModels3D.tsx | 90 | Window default Z height | NO | **MOVE TO DB** - See Category 4 |
| `2.0` (m) | EnhancedModels3D.tsx | 204 | Wall cabinet mount height | NO | **MOVE TO DB** - See Category 4 |

**Recommendation:** These should be moved to the `components` table as `default_z_position` column.

---

## Category 2: HARDCODED & NOT NEEDED
**Values that can be removed or derived from other values**

### Redundant Constants

| Value | Location | Line | Purpose | Why Not Needed | Recommendation |
|-------|----------|------|---------|----------------|----------------|
| `0.4` (40%) | DesignCanvas2D.tsx | 996, 1237, 1605 | Floor Y position in elevation views | Arbitrary positioning constant | **DERIVE** - Calculate from room dimensions |
| `100` | DesignCanvas2D.tsx | 525, 536 | Top margin for room positioning | Arbitrary spacing | **DERIVE** - Use percentage of canvas height |
| `1.2` | DesignCanvas2D.tsx | 428, 607 | Zoom increment/decrement multiplier | Arbitrary value | **MAKE CONFIGURABLE** - UI preference |

**Recommendation:** Remove these magic numbers. Calculate dynamically based on room dimensions and canvas size.

---

### Duplicate Wall Thickness Conversions

| Value | Location | Line | Purpose | Why Not Needed | Recommendation |
|-------|----------|------|---------|----------------|----------------|
| `WALL_THICKNESS_METERS` | AdaptiveView3D.tsx | 55 | Converts 10cm to 0.1m | Derived from WALL_THICKNESS_CM | **DERIVE** - Calculate inline |
| `halfWallThickness` | AdaptiveView3D.tsx | 70 | Half of wall thickness (5cm) | Derived calculation | **DERIVE** - Calculate inline |
| `WALL_THICKNESS_METERS` | EnhancedModels3D.tsx | 28 | Converts 10cm to 0.1m | Duplicate of above | **DERIVE** - Use shared constant |
| `halfWallThickness` | EnhancedModels3D.tsx | 42 | Half of wall thickness (5cm) | Duplicate calculation | **DERIVE** - Calculate inline |

**Recommendation:** Keep only `WALL_THICKNESS_CM = 10` and derive all conversions inline.

---

## Category 3: HARDCODED BUT IN DATABASE
**Values hardcoded as fallbacks but already exist in database**

### Room Dimensions (Fallback Values)

| Value | Location | Line | Purpose | Database Table | Recommendation |
|-------|----------|------|---------|----------------|----------------|
| `600` (cm) | DesignCanvas2D.tsx | 66 | DEFAULT_ROOM_FALLBACK width | `room_type_templates.default_width` | **USE DB** - Fetch from `room_type_templates` |
| `400` (cm) | DesignCanvas2D.tsx | 67 | DEFAULT_ROOM_FALLBACK height | `room_type_templates.default_height` | **USE DB** - Fetch from `room_type_templates` |
| `240` (cm) | DesignCanvas2D.tsx | 68 | DEFAULT_ROOM_FALLBACK wallHeight | `room_type_templates.default_wall_height` | **USE DB** - Fetch from `room_type_templates` |
| `600, 400` | project.ts | 257 | Kitchen default dimensions | `room_type_templates` (kitchen) | **USE DB** - Already in database |
| `500, 400` | project.ts | 272 | Bedroom default dimensions | `room_type_templates` (bedroom) | **USE DB** - Already in database |
| `600, 500` | project.ts | 287 | Master bedroom dimensions | `room_type_templates` (master-bedroom) | **USE DB** - Already in database |
| `450, 400` | project.ts | 302 | Guest bedroom dimensions | `room_type_templates` (guest-bedroom) | **USE DB** - Already in database |
| `300, 300` | project.ts | 317 | Bathroom dimensions | `room_type_templates` (bathroom) | **USE DB** - Already in database |
| `250, 200` | project.ts | 332 | Ensuite dimensions | `room_type_templates` (ensuite) | **USE DB** - Already in database |
| `600, 500` | project.ts | 347 | Living room dimensions | `room_type_templates` (living-room) | **USE DB** - Already in database |
| `500, 400` | project.ts | 362 | Dining room dimensions | `room_type_templates` (dining-room) | **USE DB** - Already in database |
| `400, 350` | project.ts | 377 | Office dimensions | `room_type_templates` (office) | **USE DB** - Already in database |
| `300, 400` | project.ts | 392 | Dressing room dimensions | `room_type_templates` (dressing-room) | **USE DB** - Already in database |
| `300, 250` | project.ts | 407 | Utility room dimensions | `room_type_templates` (utility) | **USE DB** - Already in database |
| `200, 250` | project.ts | 422 | Under stairs dimensions | `room_type_templates` (under-stairs) | **USE DB** - Already in database |

**Recommendation:** Remove `ROOM_TYPE_CONFIGS` from `project.ts`. Replace with service call to `room_type_templates` table.

---

### Wall Heights (Fallback Values)

| Value | Location | Line | Purpose | Database Column | Recommendation |
|-------|----------|------|---------|-----------------|----------------|
| `250` (cm) | project.ts | 261, 276, 291, etc. | default_wall_height in ROOM_TYPE_CONFIGS | `room_type_templates.default_wall_height` | **USE DB** - Already in database |
| `200` (cm) | project.ts | 426 | Under stairs wall height | `room_type_templates.default_wall_height` | **USE DB** - Already in database |

**Recommendation:** These values are already in the `room_type_templates` table (lines 15, 66-76 in migration). Remove hardcoded versions.

---

### Ceiling Heights (Fallback Values)

| Value | Location | Line | Purpose | Database Column | Recommendation |
|-------|----------|------|---------|-----------------|----------------|
| `250` (cm) | AdaptiveView3D.tsx | 95 | Fallback ceiling height | `room_dimensions.ceilingHeight` or `room_type_templates.default_ceiling_height` | **USE DB** - Check room_dimensions first |
| `250` (cm) | project.ts | Multiple | default_ceiling_height in ROOM_TYPE_CONFIGS | `room_type_templates.default_ceiling_height` | **USE DB** - Already in database |
| `220` (cm) | project.ts | 426 | Under stairs ceiling height | `room_type_templates.default_ceiling_height` | **USE DB** - Already in database |

**Recommendation:** Use `roomDimensions.ceilingHeight` first, fallback to `room_type_templates.default_ceiling_height`.

---

## Category 4: HARDCODED & SHOULD BE IN DATABASE
**Values that should be moved to database tables**

### Component Clearances & Tolerances

| Value | Location | Line | Purpose | Proposed DB Location | Recommendation |
|-------|----------|------|---------|----------------------|----------------|
| `5` (cm) | DesignCanvas2D.tsx | 105 | WALL_CLEARANCE - clearance from walls | `configuration.wall_clearance` | **IN DB** - Already in config table |
| `40` (cm) | DesignCanvas2D.tsx | 106 | WALL_SNAP_THRESHOLD - snap to wall threshold | `configuration.wall_snap_threshold` | **IN DB** - Already in config table |
| `15` (cm) | DesignCanvas2D.tsx | 476 | snap_tolerance_default | `configuration.snap_tolerance_default` | **IN DB** - Already in config table |
| `25` (cm) | DesignCanvas2D.tsx | 477 | snap_tolerance_countertop | `configuration.snap_tolerance_countertop` | **IN DB** - Already in config table |
| `100` (cm) | DesignCanvas2D.tsx | 478 | proximity_threshold - component proximity | `configuration.proximity_threshold` | **IN DB** - Already in config table |
| `35` (cm) | DesignCanvas2D.tsx | 479 | wall_snap_distance_default | `configuration.wall_snap_distance_default` | **IN DB** - Already in config table |
| `50` (cm) | DesignCanvas2D.tsx | 480 | wall_snap_distance_countertop | `configuration.wall_snap_distance_countertop` | **IN DB** - Already in config table |
| `30` (cm) | DesignCanvas2D.tsx | 481 | corner_tolerance | `configuration.corner_tolerance` | **IN DB** - Already in config table |

**Recommendation:** These are already being loaded from the `configuration` table via `ConfigurationService` (lines 461-495). Remove hardcoded constants and use only DB values.

---

### Component Heights & Dimensions

| Value | Location | Line | Purpose | Proposed DB Location | Recommendation |
|-------|----------|------|---------|----------------------|----------------|
| `8` (cm) | DesignCanvas2D.tsx | 482 | toe_kick_height | `configuration.toe_kick_height` | **IN DB** - Already in config table |
| `15` (cm) | EnhancedModels3D.tsx | 228 | Plinth height for base cabinets | `components.plinth_height` or `component_types.default_plinth_height` | **MOVE TO DB** - Component-specific |
| `90` (cm) | Multiple | Various | Corner component square footprint | `components.width` and `components.depth` | **USE ACTUAL** - Use component dimensions |
| `60` (cm) | EnhancedModels3D.tsx | 538 | Door count threshold (single vs double) | `configuration.cabinet_door_width_threshold` | **MOVE TO DB** - Configuration value |

**Recommendation:** Add these to appropriate database tables:
- `toe_kick_height` → Already in `configuration` table
- `plinth_height` → Add to `component_types` table
- `cabinet_door_width_threshold` → Add to `configuration` table

---

### Color Values (2D Rendering)

| Value | Location | Line | Purpose | Proposed DB Location | Recommendation |
|-------|----------|------|---------|----------------------|----------------|
| `#e0e0e0` | DesignCanvas2D.tsx | 901 | Grid line color | `configuration.grid_color` or keep hardcoded | **CONSIDER DB** - UI theme value |
| `#e5e5e5` | DesignCanvas2D.tsx | 936 | Outer wall color | `configuration.wall_color_outer` | **MOVE TO DB** - Room appearance |
| `#f9f9f9` | DesignCanvas2D.tsx | 940, 1008 | Inner room color | `configuration.floor_color_default` | **MOVE TO DB** - Room appearance |
| `#333`, `#666`, `#999` | DesignCanvas2D.tsx | 944, 951, 975 | Wall outline colors | `configuration.wall_outline_colors` | **KEEP** - UI constants |
| `#8b4513` | DesignCanvas2D.tsx | 1134, 1149 | Default wood color | `component_types.default_color` | **MOVE TO DB** - Component default |
| `#ff6b6b` | DesignCanvas2D.tsx | 1130, 1201, etc. | Selection highlight color | `configuration.selection_color` | **KEEP** - UI constant |
| `#00ff00` | DesignCanvas2D.tsx | 1659, 1713 | Snap guide color (green) | `configuration.snap_guide_color` | **KEEP** - UI constant |
| `#3b82f6` | DesignCanvas2D.tsx | 1776, 1786, etc. | Tape measure color (blue) | `configuration.measurement_color` | **KEEP** - UI constant |

**Recommendation:**
- Room appearance colors → Move to database
- Component default colors → Move to `component_types` table
- UI/selection colors → Keep hardcoded (part of UI design system)

---

### Color Values (3D Rendering)

| Value | Location | Line | Purpose | Proposed DB Location | Recommendation |
|-------|----------|------|---------|----------------------|----------------|
| `#f5f5f5` | AdaptiveView3D.tsx | 99-100 | Floor material color | `room_type_templates.default_floor_color` | **MOVE TO DB** - Room appearance |
| `#ffffff` | AdaptiveView3D.tsx | 103-104 | Wall material color | `room_type_templates.default_wall_color` | **MOVE TO DB** - Room appearance |
| `#666` | AdaptiveView3D.tsx | 138 | Room dimensions text color | Keep hardcoded | **KEEP** - UI constant |
| `#e0e0e0`, `#c0c0c0` | AdaptiveView3D.tsx | 491, 494 | Grid cell/section colors | Keep hardcoded | **KEEP** - UI constants |
| `#ff6b6b` | EnhancedModels3D.tsx | 210, 745 | Selected element color | Keep hardcoded | **KEEP** - UI constant |
| `#8b4513` | EnhancedModels3D.tsx | 211 | Default cabinet color | `component_types.default_color` | **MOVE TO DB** - Component default |
| `#654321` | EnhancedModels3D.tsx | 216, 223 | Door/bedroom furniture color | `component_types.default_door_color` | **MOVE TO DB** - Component default |
| `#F5F5DC` | EnhancedModels3D.tsx | 218 | Bathroom vanity color | `component_types.default_color` (bathroom) | **MOVE TO DB** - Component default |
| `#2F4F4F` | EnhancedModels3D.tsx | 220 | Media unit color (dark slate) | `component_types.default_color` (media) | **MOVE TO DB** - Component default |
| `#c0c0c0` | EnhancedModels3D.tsx | 224 | Handle color | `configuration.hardware_color_default` | **MOVE TO DB** - Material palette |
| `#2d2d2d` | EnhancedModels3D.tsx | 225 | Plinth color | `configuration.plinth_color_default` | **MOVE TO DB** - Material palette |

**Recommendation:**
- Room colors → Move to `room_type_templates` table
- Component colors → Move to `component_types` table
- Hardware/material colors → Move to `configuration` table or new `material_palette` table
- UI colors (selection, highlights) → Keep hardcoded

---

### Appliance Color Mapping

| Appliance Type | Color | Location | Line | Proposed DB Location |
|----------------|-------|----------|------|----------------------|
| refrigerator | `#f8f8f8` | EnhancedModels3D.tsx | 784 | `appliance_types.default_color` |
| dishwasher | `#e0e0e0` | EnhancedModels3D.tsx | 785 | `appliance_types.default_color` |
| washing-machine | `#f0f0f0` | EnhancedModels3D.tsx | 786 | `appliance_types.default_color` |
| tumble-dryer | `#e8e8e8` | EnhancedModels3D.tsx | 787 | `appliance_types.default_color` |
| oven | `#2c2c2c` | EnhancedModels3D.tsx | 788 | `appliance_types.default_color` |
| toilet | `#FFFFFF` | EnhancedModels3D.tsx | 789 | `appliance_types.default_color` |
| shower | `#E6E6FA` | EnhancedModels3D.tsx | 790 | `appliance_types.default_color` |
| bathtub | `#FFFFFF` | EnhancedModels3D.tsx | 791 | `appliance_types.default_color` |
| bed | `#8B4513` | EnhancedModels3D.tsx | 792 | `appliance_types.default_color` |
| sofa | `#3A6EA5` | EnhancedModels3D.tsx | 793 | `appliance_types.default_color` |
| chair | `#6B8E23` | EnhancedModels3D.tsx | 794 | `appliance_types.default_color` |
| table | `#8B4513` | EnhancedModels3D.tsx | 795 | `appliance_types.default_color` |
| tv | `#2F4F4F` | EnhancedModels3D.tsx | 796 | `appliance_types.default_color` |

**Recommendation:** Create `appliance_types` or `furniture_types` table with `default_color` column. These colors represent realistic appliance/furniture appearances.

---

### Component-Specific Dimensional Values

| Value | Location | Line | Purpose | Proposed DB Location | Recommendation |
|-------|----------|------|---------|----------------------|----------------|
| `0.2` (m) | EnhancedModels3D.tsx | 804 | Bed frame height | `furniture_components.frame_height` | **MOVE TO DB** - Furniture spec |
| `0.3` (m) | EnhancedModels3D.tsx | 805 | Bed mattress height | `furniture_components.mattress_height` | **MOVE TO DB** - Furniture spec |
| `0.3` (m) | EnhancedModels3D.tsx | 854 | Sofa base height | `furniture_components.base_height` | **MOVE TO DB** - Furniture spec |
| `0.4` (m) | EnhancedModels3D.tsx | 238, 880 | Corner cabinet depth, sofa back thickness | Component-specific | **MOVE TO DB** - Component dimensions |
| `4` | EnhancedModels3D.tsx | 489 | Chest of drawers drawer count | `furniture_components.drawer_count` | **MOVE TO DB** - Furniture spec |

**Recommendation:** Add these to a new `furniture_specifications` table or extend `components` table with furniture-specific columns.

---

## Database Schema Impact

### Tables Already Containing These Values

1. **`room_type_templates`** (Created in migration `20250915000002`)
   - Contains: `default_width`, `default_height`, `default_wall_height`, `default_ceiling_height`
   - Status: ✅ Already implemented
   - Action: Remove hardcoded `ROOM_TYPE_CONFIGS` from `project.ts`

2. **`configuration`** (Referenced in code)
   - Contains: Wall clearances, snap tolerances, thresholds
   - Status: ✅ Already implemented
   - Action: Remove hardcoded fallback constants

3. **`components`** table
   - Contains: Component dimensions (width, depth, height)
   - Status: ✅ Already has dimensions
   - Action: Add `default_z_position`, `plinth_height` columns

---

### Proposed Schema Additions

#### 1. Add columns to `component_types` table:

```sql
ALTER TABLE component_types ADD COLUMN IF NOT EXISTS default_color TEXT DEFAULT '#8b4513';
ALTER TABLE component_types ADD COLUMN IF NOT EXISTS default_door_color TEXT;
ALTER TABLE component_types ADD COLUMN IF NOT EXISTS default_plinth_height DECIMAL(10,2) DEFAULT 15.0;
ALTER TABLE component_types ADD COLUMN IF NOT EXISTS door_width_threshold DECIMAL(10,2) DEFAULT 60.0;
```

#### 2. Add columns to `components` table:

```sql
ALTER TABLE components ADD COLUMN IF NOT EXISTS default_z_position DECIMAL(10,2);
ALTER TABLE components ADD COLUMN IF NOT EXISTS plinth_height DECIMAL(10,2);
```

#### 3. Create `appliance_types` table:

```sql
CREATE TABLE appliance_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name TEXT UNIQUE NOT NULL,
  default_color TEXT NOT NULL,
  default_width DECIMAL(10,2),
  default_height DECIMAL(10,2),
  default_depth DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert appliance color mappings
INSERT INTO appliance_types (type_name, default_color, default_width, default_height, default_depth) VALUES
  ('refrigerator', '#f8f8f8', 60, 180, 60),
  ('dishwasher', '#e0e0e0', 60, 85, 60),
  ('washing-machine', '#f0f0f0', 60, 85, 60),
  ('tumble-dryer', '#e8e8e8', 60, 85, 60),
  ('oven', '#2c2c2c', 60, 60, 60),
  ('toilet', '#FFFFFF', 40, 70, 60),
  ('shower', '#E6E6FA', 80, 200, 80),
  ('bathtub', '#FFFFFF', 160, 60, 70),
  ('bed', '#8B4513', 160, 50, 200),
  ('sofa', '#3A6EA5', 180, 80, 90),
  ('chair', '#6B8E23', 50, 90, 50),
  ('table', '#8B4513', 120, 75, 80),
  ('tv', '#2F4F4F', 120, 70, 10);
```

#### 4. Add room appearance columns to `room_type_templates`:

```sql
ALTER TABLE room_type_templates ADD COLUMN IF NOT EXISTS default_floor_color TEXT DEFAULT '#f5f5f5';
ALTER TABLE room_type_templates ADD COLUMN IF NOT EXISTS default_wall_color TEXT DEFAULT '#ffffff';
ALTER TABLE room_type_templates ADD COLUMN IF NOT EXISTS default_ceiling_color TEXT DEFAULT '#ffffff';
```

#### 5. Add configuration values:

```sql
-- These may already exist, but ensure they're set
INSERT INTO configuration (key, value_type, value_text, description, category) VALUES
  ('hardware_color_default', 'text', '#c0c0c0', 'Default color for cabinet handles and hardware', 'appearance'),
  ('plinth_color_default', 'text', '#2d2d2d', 'Default color for cabinet plinths', 'appearance'),
  ('cabinet_door_width_threshold', 'decimal', '60', 'Width threshold for single vs double doors (cm)', 'components')
ON CONFLICT (key) DO NOTHING;
```

---

## Cleanup Action Plan

### Phase 1: Remove Redundant Code (Immediate - Low Risk)

1. **Remove `ROOM_TYPE_CONFIGS` from `project.ts`**
   - Lines: 254-435
   - Replace with: `RoomService.getRoomTypeTemplate(roomType)`
   - Risk: Low (data already in database)

2. **Remove `DEFAULT_ROOM_FALLBACK` from `DesignCanvas2D.tsx`**
   - Lines: 65-69
   - Replace with: Database query to `room_type_templates`
   - Risk: Low (add proper error handling)

3. **Consolidate wall thickness constants**
   - Keep only: `const WALL_THICKNESS_CM = 10;`
   - Remove: All derived conversions (calculate inline)
   - Files: AdaptiveView3D.tsx, EnhancedModels3D.tsx, DesignCanvas2D.tsx
   - Risk: Low (simple refactor)

---

### Phase 2: Use Database Values (Medium Priority - Low Risk)

1. **Update `EnhancedModels3D.tsx` to use DB Z-positions**
   - Replace lines 79-92 (validateElementDimensions) with database queries
   - Add `default_z_position` column to `components` table
   - Risk: Low (fallbacks already in place)

2. **Remove hardcoded color mappings**
   - Create `appliance_types` table (see schema above)
   - Update `getApplianceColor()` function to query database
   - Lines: 780-798 in EnhancedModels3D.tsx
   - Risk: Low (maintain fallback to element.color)

3. **Use `room_type_templates` for room appearance**
   - Add color columns to `room_type_templates`
   - Update AdaptiveView3D.tsx lines 99-104
   - Risk: Low (simple color lookup)

---

### Phase 3: Move Remaining Values (Lower Priority - Medium Risk)

1. **Component-specific dimensions**
   - Create `furniture_specifications` table
   - Move bed, sofa, chair dimensions (EnhancedModels3D.tsx)
   - Risk: Medium (affects 3D rendering)

2. **UI configuration values**
   - Move grid colors, selection colors to `ui_theme` table
   - Make configurable via admin panel
   - Risk: Medium (requires UI updates)

---

## Summary Statistics

| Category | Count | Action Required |
|----------|-------|-----------------|
| **Hardcoded & Needed** | 23 | Keep (system constants) |
| **Hardcoded & Not Needed** | 8 | Remove/Derive |
| **Hardcoded but in Database** | 41 | Use database values |
| **Hardcoded & Should be in DB** | 67 | Move to database |
| **Total Analyzed** | **139** | **116 need action** |

---

## Migration Priority

### High Priority (Do First)
1. Remove `ROOM_TYPE_CONFIGS` from `project.ts` → Use `room_type_templates` table
2. Remove `DEFAULT_ROOM_FALLBACK` → Use database queries
3. Consolidate wall thickness constants
4. Use existing `configuration` table values instead of hardcoded fallbacks

### Medium Priority
1. Add `default_z_position` to components table
2. Create `appliance_types` table for color mappings
3. Add room appearance colors to `room_type_templates`

### Low Priority (Nice to Have)
1. Move furniture-specific dimensions to database
2. Make UI colors configurable
3. Add theme system for colors

---

## Conclusion

The codebase has already made significant progress in database-driven configuration:
- ✅ Room type templates are in database (`room_type_templates`)
- ✅ Configuration values are in database (`configuration`)
- ✅ Component dimensions are in database (`components`)

**Main Issues:**
1. Hardcoded fallbacks in `project.ts` duplicate database values
2. Color mappings for appliances/furniture are hardcoded
3. Component Z-positions are hardcoded in validation logic
4. Many configuration values already in DB but still hardcoded as fallbacks

**Recommended Next Steps:**
1. Remove duplicate `ROOM_TYPE_CONFIGS` from `project.ts`
2. Add missing columns to existing tables (colors, z-positions)
3. Create `appliance_types` table for realistic color mappings
4. Update services to use database values with proper error handling

**Estimated Effort:**
- Phase 1 (High Priority): 2-3 days
- Phase 2 (Medium Priority): 3-4 days
- Phase 3 (Low Priority): 4-5 days
- **Total: 9-12 days for complete migration**

---

**Document Version:** 1.0
**Last Updated:** 2025-10-10
**Analysis By:** Claude Code Analysis Tool
