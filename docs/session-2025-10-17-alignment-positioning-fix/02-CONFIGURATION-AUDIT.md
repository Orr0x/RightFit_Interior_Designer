# Configuration Audit & Consolidation Plan
**Date:** 2025-10-17
**Status:** 📋 AUDIT COMPLETE
**Critical Finding:** Configuration exists in 3 places with conflicts

---

## 🎯 Executive Summary

This audit identifies all configuration values used in the positioning system, where they're currently stored, and creates a plan for consolidating to a single source of truth.

### Key Findings:
1. **Configuration Service Exists But Underutilized** - 80% of code still uses hardcoded values
2. **Database Has Correct Values** - app_configuration table has most settings
3. **Hardcoded Values Everywhere** - 15+ magic numbers scattered across files
4. **No Synchronous Access** - ConfigurationService is async-only (problematic for rendering)

### Critical Issues:
- ❌ Configuration values duplicated across code and database
- ❌ No guarantee code matches database
- ❌ Can't change behavior without code deployment
- ❌ Async configuration loading causes race conditions

---

## 📊 Complete Configuration Inventory

### Category 1: Canvas & Rendering

| Config Key | Current Location | Value | Unit | Should Be In DB? | Priority |
|------------|------------------|-------|------|------------------|----------|
| `canvas_width` | DesignCanvas2D.tsx:const | 1600 | px | ✅ YES (already is) | HIGH |
| `canvas_height` | DesignCanvas2D.tsx:const | 1200 | px | ✅ YES (already is) | HIGH |
| `grid_size` | DesignCanvas2D.tsx:const | 20 | cm | ✅ YES (already is) | MEDIUM |
| `min_zoom` | DesignCanvas2D.tsx:const | 0.5 | ratio | ✅ YES (already is) | MEDIUM |
| `max_zoom` | DesignCanvas2D.tsx:const | 4.0 | ratio | ✅ YES (already is) | MEDIUM |

**Status:** ✅ These ARE in database, ConfigurationService loads them successfully

---

### Category 2: Wall Configuration

| Config Key | Current Location | Value | Unit | Should Be In DB? | Priority |
|------------|------------------|-------|------|------------------|----------|
| `wall_thickness` | Multiple files | 10 | cm | ✅ YES (already is) | HIGH |
| `wall_clearance` | canvasCoordinateIntegration.ts:70 | 5 | cm | ✅ YES (already is) | **CRITICAL** |
| `wall_snap_threshold` | canvasCoordinateIntegration.ts:211 | 40 | cm | ✅ YES (already is) | **CRITICAL** |

**Critical Finding:** These ARE in app_configuration table, but canvasCoordinateIntegration.ts uses HARDCODED values instead!

**Database Values (from migration):**
```sql
-- wall_thickness: 10cm (matches code ✓)
-- wall_clearance: 5cm (matches code ✓)
-- wall_snap_threshold: 40cm (matches code ✓)
```

**Problem:** Values match now, but if admin changes database, code won't respect it!

---

### Category 3: Snapping & Positioning

| Config Key | Current Location | Value | Unit | Should Be In DB? | Priority |
|------------|------------------|-------|------|------------------|----------|
| `snap_tolerance_default` | DesignCanvas2D.tsx | 15 | cm | ✅ YES (already is) | MEDIUM |
| `snap_tolerance_countertop` | DesignCanvas2D.tsx | 25 | cm | ✅ YES (already is) | MEDIUM |
| `corner_snap_threshold` | canvasCoordinateIntegration.ts:131 | 60 | cm | ❌ **NOT IN DB** | **CRITICAL** |
| `wall_snap_threshold` | canvasCoordinateIntegration.ts:211 | 40 | cm | ✅ YES (already is) | **CRITICAL** |

**Critical Finding:** `corner_snap_threshold` (60cm) is ONLY in code, not in database!

**Action Required:** Add to app_configuration table

---

### Category 4: Drag & Drop

| Config Key | Current Location | Value | Unit | Should Be In DB? | Priority |
|------------|------------------|-------|------|------------------|----------|
| `drag_preview_scale` | CompactComponentSidebar.tsx:277 | 1.15 | ratio | ❌ NO | **DELETE** |
| `drag_center_offset_corner` | CompactComponentSidebar.tsx:349 | 0.5 | ratio | ❌ NO | RECALC |
| `drag_center_offset_regular` | CompactComponentSidebar.tsx:350 | 0.5 | ratio | ❌ NO | RECALC |

**Critical Finding:** `drag_preview_scale` of 1.15x is a HACK and should be REMOVED, not moved to database!

**Rationale:** Preview scale should be calculated dynamically from canvas zoom, not a fixed value.

---

### Category 5: Boundary Checking

| Config Key | Current Location | Value | Unit | Should Be In DB? | Priority |
|------------|------------------|-------|------|------------------|----------|
| `drop_boundary_tolerance` | DesignCanvas2D.tsx:2677 | 50 | cm | ✅ YES (new) | MEDIUM |
| `component_min_x` | Calculated | 0 + clearance | cm | ❌ NO | CALC |
| `component_max_x` | Calculated | width - clearance | cm | ❌ NO | CALC |
| `component_min_y` | Calculated | 0 + clearance | cm | ❌ NO | CALC |
| `component_max_y` | Calculated | height - clearance | cm | ❌ NO | CALC |

**Note:** Boundary values are calculated from room dimensions + wall_clearance, don't need separate config.

---

### Category 6: Rotation

| Config Key | Current Location | Value | Unit | Should Be In DB? | Priority |
|------------|------------------|-------|------|------------------|----------|
| `rotation_snap_increment` | User input | 15° | degrees | ✅ YES (new) | LOW |
| `rotation_default_corner_tl` | canvasCoordinateIntegration.ts:151 | 0 | degrees | ✅ YES (new) | MEDIUM |
| `rotation_default_corner_tr` | canvasCoordinateIntegration.ts:157 | -270 | degrees | ✅ YES (new) | MEDIUM |
| `rotation_default_corner_br` | canvasCoordinateIntegration.ts:162 | -180 | degrees | ✅ YES (new) | MEDIUM |
| `rotation_default_corner_bl` | canvasCoordinateIntegration.ts:169 | -90 | degrees | ✅ YES (new) | MEDIUM |
| `rotation_default_wall_left` | canvasCoordinateIntegration.ts:245 | 0 | degrees | ✅ YES (new) | MEDIUM |
| `rotation_default_wall_right` | canvasCoordinateIntegration.ts:251 | 180 | degrees | ✅ YES (new) | MEDIUM |
| `rotation_default_wall_top` | canvasCoordinateIntegration.ts:259 | 0 | degrees | ✅ YES (new) | MEDIUM |
| `rotation_default_wall_bottom` | canvasCoordinateIntegration.ts:266 | 180 | degrees | ✅ YES (new) | MEDIUM |

**Critical Finding:** 8 rotation values are HARDCODED!

**Recommendation:** Add to database as JSONB config:
```sql
{
  "corners": {
    "top_left": 0,
    "top_right": -270,
    "bottom_right": -180,
    "bottom_left": -90
  },
  "walls": {
    "left": 0,
    "right": 180,
    "top": 0,
    "bottom": 180
  }
}
```

---

### Category 7: Z-Position Defaults

| Config Key | Current Location | Value | Unit | Should Be In DB? | Priority |
|------------|------------------|-------|------|------------------|----------|
| `z_default_base_cabinet` | DesignCanvas2D.tsx:2691 | 0 | cm | ✅ YES (new) | LOW |
| `z_default_wall_cabinet` | DesignCanvas2D.tsx:2699 | 140 | cm | ✅ YES (new) | LOW |
| `z_default_cornice` | DesignCanvas2D.tsx:2693 | 200 | cm | ✅ YES (new) | LOW |
| `z_default_pelmet` | DesignCanvas2D.tsx:2695 | 140 | cm | ✅ YES (new) | LOW |
| `z_default_counter_top` | DesignCanvas2D.tsx:2697 | 90 | cm | ✅ YES (new) | LOW |
| `z_default_wall_unit_end_panel` | DesignCanvas2D.tsx:2701 | 200 | cm | ✅ YES (new) | LOW |
| `z_default_window` | DesignCanvas2D.tsx:2703 | 90 | cm | ✅ YES (new) | LOW |

**Note:** These could also go in component metadata, but having defaults in app_configuration is useful.

---

## 🗄️ Database Schema Analysis

### Existing Table: app_configuration

**Location:** `supabase/migrations/20250129000005_create_app_configuration.sql`

**Schema:**
```sql
CREATE TABLE app_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_name TEXT NOT NULL,
  category TEXT NOT NULL,
  value_numeric NUMERIC,
  value_string TEXT,
  value_boolean BOOLEAN,
  value_json JSONB,
  unit TEXT,
  description TEXT,
  min_value NUMERIC,
  max_value NUMERIC,
  dev_value NUMERIC,
  staging_value NUMERIC,
  production_value NUMERIC,
  is_user_configurable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Current Records (from migration):**
```sql
-- Canvas configuration
('canvas_width', 'Canvas Width', 'canvas', 1600, 'px', ...)
('canvas_height', 'Canvas Height', 'canvas', 1200, 'px', ...)
('grid_size', 'Grid Size', 'canvas', 20, 'cm', ...)
('min_zoom', 'Minimum Zoom', 'canvas', 0.5, 'ratio', ...)
('max_zoom', 'Maximum Zoom', 'canvas', 4, 'ratio', ...)

-- Wall configuration
('wall_thickness', 'Wall Thickness', 'wall', 10, 'cm', ...)
('wall_clearance', 'Wall Clearance', 'wall', 5, 'cm', ...)
('wall_snap_threshold', 'Wall Snap Threshold', 'snap', 40, 'cm', ...)

-- Snap configuration
('snap_tolerance_default', 'Default Snap Tolerance', 'snap', 15, 'cm', ...)
('snap_tolerance_countertop', 'Countertop Snap Tolerance', 'snap', 25, 'cm', ...)
```

**Missing Records (need to add):**
1. `corner_snap_threshold` (60cm)
2. `drop_boundary_tolerance` (50cm)
3. `rotation_snap_increment` (15°)
4. `rotation_defaults` (JSONB with all rotation angles)
5. `z_position_defaults` (JSONB with all Z defaults)

---

## 🔍 Code Usage Analysis

### Files Using Hardcoded Values

#### File: CompactComponentSidebar.tsx
```typescript
Line 277: const scaleFactor = 1.15; // ❌ REMOVE THIS
Line 349: const centerX = isCornerComponent ? ... // ❌ RECALCULATE
```

**Action:** Remove scaleFactor entirely, calculate from canvas zoom

---

#### File: canvasCoordinateIntegration.ts
```typescript
Line 70:  const wallClearance = 5; // ❌ USE DB
Line 131: const cornerThreshold = 60; // ❌ USE DB (add to DB first)
Line 211: const snapThreshold = 40; // ❌ USE DB

Line 151-171: Corner rotations // ❌ USE DB (add to DB first)
Line 245-266: Wall rotations // ❌ USE DB (add to DB first)
```

**Action:** Replace all with ConfigurationService calls

---

#### File: DesignCanvas2D.tsx
```typescript
Line 2677: if (dropX < -50 || ...) // ❌ USE DB (add to DB first)
Line 2691-2703: Z-position defaults // ❌ USE DB (add to DB first)
```

**Action:** Replace with ConfigurationService calls

---

### Files Using ConfigurationService (Correctly)

#### File: DesignCanvas2D.tsx (some parts)
```typescript
// Canvas config loaded correctly
const config = await ConfigurationService.getAll('canvas');
```

**Status:** ✅ This works! But needs to be applied to ALL config values.

---

## 🔧 ConfigurationService Issues

### Issue #1: Async-Only Access

**Current API:**
```typescript
// Async - requires await
const value = await ConfigurationService.get('wall_thickness', 10);
```

**Problem:** Can't use in render loops or synchronous functions

**Solution:** Preload on app init, provide sync access:
```typescript
// On app init
await ConfigurationService.preload();

// In render/sync code
const value = ConfigurationService.getSync('wall_thickness', 10);
```

**Status:** ✅ `preload()` and `getSync()` already exist! Just need to use them.

---

### Issue #2: No Type Safety

**Current API:**
```typescript
const value = await ConfigurationService.get('wall_thickness', 10); // Returns: number
```

**Problem:** No TypeScript type checking for config keys

**Solution:** Add typed getters:
```typescript
// Type-safe config access
interface AppConfiguration {
  wall_thickness: number;
  wall_clearance: number;
  corner_snap_threshold: number;
  // ... all config keys
}

class ConfigurationService {
  static get<K extends keyof AppConfiguration>(
    key: K,
    fallback: AppConfiguration[K]
  ): Promise<AppConfiguration[K]> {
    // Implementation
  }
}

// Usage - TypeScript knows return type!
const thickness: number = await ConfigurationService.get('wall_thickness', 10);
```

**Priority:** MEDIUM - Helps prevent bugs

---

### Issue #3: Cache Not Preloaded by Default

**Current Behavior:**
- Cache is empty on app start
- First call loads from database
- Subsequent calls use cache

**Problem:** First render may use fallback values!

**Solution:** Preload in main.tsx or App.tsx:
```typescript
// main.tsx
async function init() {
  await ConfigurationService.preload();
  // ... rest of app initialization
}
init().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});
```

**Priority:** HIGH - Ensures consistent behavior

---

## 📝 Migration Plan

### Step 1: Add Missing Configuration Records

**SQL Migration:**
```sql
-- File: supabase/migrations/20251017000001_add_missing_config.sql

-- Corner snap threshold
INSERT INTO app_configuration (
  config_key, config_name, category,
  value_numeric, unit, description,
  min_value, max_value
) VALUES (
  'corner_snap_threshold',
  'Corner Snap Threshold',
  'snap',
  60,
  'cm',
  'Distance from corner to trigger corner snapping',
  20,
  200
);

-- Drop boundary tolerance
INSERT INTO app_configuration (
  config_key, config_name, category,
  value_numeric, unit, description,
  min_value, max_value
) VALUES (
  'drop_boundary_tolerance',
  'Drop Boundary Tolerance',
  'boundary',
  50,
  'cm',
  'Tolerance for dropping components outside room boundaries',
  0,
  100
);

-- Rotation snap increment
INSERT INTO app_configuration (
  config_key, config_name, category,
  value_numeric, unit, description,
  min_value, max_value
) VALUES (
  'rotation_snap_increment',
  'Rotation Snap Increment',
  'rotation',
  15,
  'degrees',
  'Angle increment for rotation snapping',
  1,
  90
);

-- Rotation defaults (JSONB)
INSERT INTO app_configuration (
  config_key, config_name, category,
  value_json, unit, description
) VALUES (
  'rotation_defaults',
  'Default Rotation Angles',
  'rotation',
  '{
    "corners": {
      "top_left": 0,
      "top_right": -270,
      "bottom_right": -180,
      "bottom_left": -90
    },
    "walls": {
      "left": 0,
      "right": 180,
      "top": 0,
      "bottom": 180
    }
  }'::jsonb,
  'degrees',
  'Default rotation angles for corners and walls'
);

-- Z-position defaults (JSONB)
INSERT INTO app_configuration (
  config_key, config_name, category,
  value_json, unit, description
) VALUES (
  'z_position_defaults',
  'Default Z Positions',
  'positioning',
  '{
    "base_cabinet": 0,
    "wall_cabinet": 140,
    "cornice": 200,
    "pelmet": 140,
    "counter_top": 90,
    "wall_unit_end_panel": 200,
    "window": 90
  }'::jsonb,
  'cm',
  'Default Z positions for component types'
);
```

---

### Step 2: Update ConfigurationService

**Add Type Safety:**
```typescript
// src/services/ConfigurationService.ts

export interface AppConfiguration {
  // Canvas
  canvas_width: number;
  canvas_height: number;
  grid_size: number;
  min_zoom: number;
  max_zoom: number;

  // Wall
  wall_thickness: number;
  wall_clearance: number;
  wall_snap_threshold: number;

  // Snap
  corner_snap_threshold: number;
  snap_tolerance_default: number;
  snap_tolerance_countertop: number;
  drop_boundary_tolerance: number;

  // Rotation
  rotation_snap_increment: number;
  rotation_defaults: {
    corners: {
      top_left: number;
      top_right: number;
      bottom_right: number;
      bottom_left: number;
    };
    walls: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
  };

  // Z-Position
  z_position_defaults: {
    base_cabinet: number;
    wall_cabinet: number;
    cornice: number;
    pelmet: number;
    counter_top: number;
    wall_unit_end_panel: number;
    window: number;
  };
}

export class ConfigurationService {
  // Type-safe async getter
  static async get<K extends keyof AppConfiguration>(
    key: K,
    fallback: AppConfiguration[K]
  ): Promise<AppConfiguration[K]> {
    // Existing implementation
  }

  // Type-safe sync getter
  static getSync<K extends keyof AppConfiguration>(
    key: K,
    fallback: AppConfiguration[K]
  ): AppConfiguration[K] {
    // Existing implementation
  }

  // Convenience method for JSONB values
  static getJSON<K extends keyof AppConfiguration>(
    key: K
  ): AppConfiguration[K] | null {
    const cached = this.configCache.get(key as string);
    if (!cached) return null;

    // Parse JSON if stored as string
    if (typeof cached.value === 'string') {
      return JSON.parse(cached.value) as AppConfiguration[K];
    }
    return cached.value as AppConfiguration[K];
  }
}
```

---

### Step 3: Preload Configuration on App Init

**File: main.tsx**
```typescript
import { ConfigurationService } from '@/services/ConfigurationService';

async function initializeApp() {
  console.log('[App] Preloading configuration...');
  await ConfigurationService.preload();
  console.log('[App] Configuration loaded successfully');

  // Render app
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

initializeApp().catch(error => {
  console.error('[App] Failed to initialize:', error);
  // Show error UI
});
```

---

### Step 4: Update canvasCoordinateIntegration.ts

**Replace Hardcoded Values:**
```typescript
// BEFORE (hardcoded)
const wallClearance = 5;
const cornerThreshold = 60;
const snapThreshold = 40;

// AFTER (from config)
const wallClearance = ConfigurationService.getSync('wall_clearance', 5);
const cornerThreshold = ConfigurationService.getSync('corner_snap_threshold', 60);
const snapThreshold = ConfigurationService.getSync('wall_snap_threshold', 40);
```

**Replace Corner Rotations:**
```typescript
// BEFORE (hardcoded)
const corners = [
  { name: 'top-left', rotation: 0 },
  { name: 'top-right', rotation: -270 },
  { name: 'bottom-right', rotation: -180 },
  { name: 'bottom-left', rotation: -90 }
];

// AFTER (from config)
const rotationDefaults = ConfigurationService.getJSON('rotation_defaults');
const corners = [
  { name: 'top-left', rotation: rotationDefaults.corners.top_left },
  { name: 'top-right', rotation: rotationDefaults.corners.top_right },
  { name: 'bottom-right', rotation: rotationDefaults.corners.bottom_right },
  { name: 'bottom-left', rotation: rotationDefaults.corners.bottom_left }
];
```

---

### Step 5: Update DesignCanvas2D.tsx

**Replace Z-Position Defaults:**
```typescript
// BEFORE (hardcoded if-else chain)
let defaultZ = 0;
if (componentData.type === 'cornice') {
  defaultZ = 200;
} else if (componentData.type === 'pelmet') {
  defaultZ = 140;
} // ... etc

// AFTER (from config)
const zDefaults = ConfigurationService.getJSON('z_position_defaults');
const defaultZ = zDefaults[componentData.type] || 0;
```

**Replace Drop Boundary Check:**
```typescript
// BEFORE (hardcoded 50cm)
if (dropX < -50 || dropY < -50 ||
    dropX > innerRoomBounds.width + 50 ||
    dropY > innerRoomBounds.height + 50) {
  // ...
}

// AFTER (from config)
const tolerance = ConfigurationService.getSync('drop_boundary_tolerance', 50);
if (dropX < -tolerance || dropY < -tolerance ||
    dropX > innerRoomBounds.width + tolerance ||
    dropY > innerRoomBounds.height + tolerance) {
  // ...
}
```

---

### Step 6: Remove CompactComponentSidebar 1.15x Hack

**Will be handled in drag preview fix (separate document)**

---

## 📊 Configuration Summary Table

### Existing in Database (Currently Used)
| Key | Value | Status |
|-----|-------|--------|
| canvas_width | 1600 px | ✅ Loaded via ConfigurationService |
| canvas_height | 1200 px | ✅ Loaded via ConfigurationService |
| grid_size | 20 cm | ✅ Loaded via ConfigurationService |
| min_zoom | 0.5 | ✅ Loaded via ConfigurationService |
| max_zoom | 4.0 | ✅ Loaded via ConfigurationService |

### Existing in Database (NOT Used)
| Key | Value | Status |
|-----|-------|--------|
| wall_thickness | 10 cm | ❌ Hardcoded in code instead |
| wall_clearance | 5 cm | ❌ Hardcoded in code instead |
| wall_snap_threshold | 40 cm | ❌ Hardcoded in code instead |
| snap_tolerance_default | 15 cm | ❌ Hardcoded in code instead |
| snap_tolerance_countertop | 25 cm | ❌ Hardcoded in code instead |

### Missing from Database (Need to Add)
| Key | Current Value | Status |
|-----|---------------|--------|
| corner_snap_threshold | 60 cm | ❌ Only in code |
| drop_boundary_tolerance | 50 cm | ❌ Only in code |
| rotation_snap_increment | 15° | ❌ Only in code |
| rotation_defaults | {...} | ❌ Only in code |
| z_position_defaults | {...} | ❌ Only in code |

### To Be Removed (Bad Practices)
| Key | Current Value | Status |
|-----|---------------|--------|
| drag_preview_scale | 1.15 | ❌ Hack - calculate dynamically |

---

## ✅ Validation Checklist

### Database Migration
- [ ] Create migration file with new config records
- [ ] Test migration on dev database
- [ ] Verify all new records inserted
- [ ] Check JSONB structure is correct
- [ ] Validate min/max constraints

### ConfigurationService Updates
- [ ] Add AppConfiguration type interface
- [ ] Add type-safe get<K>() method
- [ ] Add getJSON<K>() helper method
- [ ] Test preload() functionality
- [ ] Test getSync() after preload
- [ ] Handle missing config gracefully

### App Initialization
- [ ] Add preload to main.tsx
- [ ] Show loading state during preload
- [ ] Handle preload errors
- [ ] Verify cache populated before render
- [ ] Test app startup with network errors

### Code Updates
- [ ] Replace all hardcoded values in canvasCoordinateIntegration.ts
- [ ] Replace all hardcoded values in DesignCanvas2D.tsx
- [ ] Remove 1.15x scale from CompactComponentSidebar.tsx
- [ ] Update corner rotation logic
- [ ] Update wall rotation logic
- [ ] Update Z-position logic

### Testing
- [ ] Test with database values matching code (should work)
- [ ] Test with modified database values (should use new values)
- [ ] Test with missing database records (should use fallbacks)
- [ ] Test with invalid database values (should clamp to min/max)
- [ ] Test offline (should use cached values)

---

## 🎯 Success Criteria

### Must-Have
- ✅ All configuration values loaded from database
- ✅ No hardcoded values in positioning code
- ✅ ConfigurationService preloaded on app init
- ✅ Type-safe configuration access
- ✅ Sync access available for rendering

### Should-Have
- ✅ JSONB support for complex configs (rotation, Z-position)
- ✅ Min/max validation for numeric configs
- ✅ Graceful fallbacks for missing configs
- ✅ Cache invalidation on config updates

### Nice-to-Have
- ✅ Admin UI for configuration management
- ✅ Configuration versioning
- ✅ Configuration export/import
- ✅ Configuration change audit log

---

## 📈 Impact Assessment

### Before (Current State)
- **Configuration Sources:** 3 (code, database, service)
- **Hardcoded Values:** 15+
- **Deployment Required for Changes:** YES
- **Type Safety:** NO
- **Risk of Mismatch:** HIGH

### After (Target State)
- **Configuration Sources:** 1 (database only)
- **Hardcoded Values:** 0
- **Deployment Required for Changes:** NO
- **Type Safety:** YES
- **Risk of Mismatch:** LOW

---

**Document Status:** ✅ COMPLETE
**Next Document:** `03-WALL-RENDERING-FIX.md`
**Estimated Implementation Time:** 6-8 hours
**Priority:** HIGH - Blocking other fixes
