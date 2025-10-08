# Configuration Values Analysis

**Purpose**: Document all hardcoded configuration values to be moved to database
**Target**: Week 5-8 implementation
**Feature Flag**: `use_database_configuration`

---

## 📊 Configuration Values Found

### **Category: Canvas Settings**

| Constant | File | Line | Value | Unit | Description |
|----------|------|------|-------|------|-------------|
| `CANVAS_WIDTH` | DesignCanvas2D.tsx | 93 | 1600 | px | Canvas workspace width |
| `CANVAS_HEIGHT` | DesignCanvas2D.tsx | 94 | 1200 | px | Canvas workspace height |
| `GRID_SIZE` | DesignCanvas2D.tsx | 95 | 20 | px | Grid spacing in pixels |

### **Category: Zoom Settings**

| Constant | File | Line | Value | Unit | Description |
|----------|------|------|-------|------|-------------|
| `MIN_ZOOM` | DesignCanvas2D.tsx | 96 | 0.5 | scale | Minimum zoom level |
| `MAX_ZOOM` | DesignCanvas2D.tsx | 97 | 4.0 | scale | Maximum zoom level |

### **Category: Wall Settings**

| Constant | File | Line | Value | Unit | Description |
|----------|------|------|-------|------|-------------|
| `WALL_THICKNESS` | DesignCanvas2D.tsx | 100 | 10 | cm | Wall thickness (matches 3D) |
| `WALL_THICKNESS_CM` | EnhancedModels3D.tsx | 25 | 10 | cm | Wall thickness in 3D view |
| `WALL_THICKNESS_METERS` | EnhancedModels3D.tsx | 26 | 0.1 | m | Wall thickness in meters |
| `WALL_THICKNESS_CM` | AdaptiveView3D.tsx | 54 | 10 | cm | Wall thickness in adaptive view |
| `WALL_CLEARANCE` | DesignCanvas2D.tsx | 101 | 5 | cm | Clearance from walls |
| `WALL_SNAP_THRESHOLD` | DesignCanvas2D.tsx | 102 | 40 | cm | Snap to wall threshold |

### **Category: Snap & Alignment**

| Constant | File | Line | Value | Unit | Description |
|----------|------|------|-------|------|-------------|
| `snapTolerance` (counter-top) | DesignCanvas2D.tsx | 582 | 25 | cm | Snap tolerance for counter tops |
| `snapTolerance` (default) | DesignCanvas2D.tsx | 582 | 15 | cm | Snap tolerance for components |
| `proximityThreshold` | DesignCanvas2D.tsx | 624 | 100 | cm | Component snap proximity |
| `wallSnapDistance` (counter-top) | DesignCanvas2D.tsx | 715 | 50 | cm | Wall snap for counter tops |
| `wallSnapDistance` (default) | DesignCanvas2D.tsx | 715 | 35 | cm | Wall snap for components |
| `cornerTolerance` | DesignCanvas2D.tsx | 716 | 30 | cm | Corner detection tolerance |
| `cornerTolerance` | DesignCanvas2D.tsx | 2322 | 30 | cm | Corner tolerance (duplicate) |

### **Category: Component Dimensions**

| Constant | File | Line | Value | Unit | Description |
|----------|------|------|-------|------|-------------|
| `elevationHeightCm` (cornice) | DesignCanvas2D.tsx | 1400 | 30 | cm | Cornice height |
| `elevationHeightCm` (pelmet) | DesignCanvas2D.tsx | 1402 | 20 | cm | Pelmet height |
| `elevationHeightCm` (counter-top) | DesignCanvas2D.tsx | 1404 | 4 | cm | Counter top thickness |
| `elevationHeightCm` (wall-cabinet) | DesignCanvas2D.tsx | 1406 | 70 | cm | Wall cabinet height |
| `elevationHeightCm` (base-cabinet) | DesignCanvas2D.tsx | 1410 | 90 | cm | Base cabinet height |
| `elevationHeightCm` (window) | DesignCanvas2D.tsx | 1414 | 100 | cm | Window height |
| `elevationHeightCm` (wall-end-panel) | DesignCanvas2D.tsx | 1416 | 70 | cm | Wall unit end panel |

### **Category: Vertical Positioning**

| Constant | File | Line | Value | Unit | Description |
|----------|------|------|-------|------|-------------|
| Wall cabinet Y offset | DesignCanvas2D.tsx | 1436 | 140 | cm | Wall cabinet from floor |
| Cornice Y offset | DesignCanvas2D.tsx | 1439 | 200 | cm | Cornice from floor |
| Pelmet Y offset | DesignCanvas2D.tsx | 1442 | 140 | cm | Pelmet from floor |
| Counter-top Y offset | DesignCanvas2D.tsx | 1445 | 90 | cm | Counter-top from floor |
| Butler sink Y offset | DesignCanvas2D.tsx | 1451 | 65 | cm | Butler sink from floor |
| Kitchen sink Y offset | DesignCanvas2D.tsx | 1454 | 75 | cm | Kitchen sink from floor |

### **Category: Component Details**

| Constant | File | Line | Value | Unit | Description |
|----------|------|------|-------|------|-------------|
| `toeKickHeight` | DesignCanvas2D.tsx | 1634 | 8 | cm | Toe kick height |
| Corner door width | DesignCanvas2D.tsx | 1652 | 0.33 | ratio | Corner door = 33% of width |
| Corner counter-top size | DesignCanvas2D.tsx | 595 | 90 | cm | Corner footprint |

### **Category: Interaction Settings**

| Constant | File | Line | Value | Unit | Description |
|----------|------|------|-------|------|-------------|
| `DRAG_THRESHOLD` (mouse) | DesignCanvas2D.tsx | 2940 | 5 | px | Mouse drag threshold |
| `DRAG_THRESHOLD` (touch) | DesignCanvas2D.tsx | 3170 | 10 | px | Touch drag threshold |

---

## 📈 Summary Statistics

- **Total Constants**: 35+ configuration values
- **Categories**: 9 categories
- **Files Affected**: 4 files
- **Most Values**: DesignCanvas2D.tsx (30+ constants)

---

## 🎯 Database Schema Design

### **Proposed Table: `app_configuration`**

```sql
CREATE TABLE public.app_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,

  -- Value and metadata
  value_numeric DECIMAL(10, 4),
  value_string TEXT,
  value_boolean BOOLEAN,
  value_json JSONB,
  unit VARCHAR(20), -- 'cm', 'px', 'm', 'scale', 'ratio'

  -- Documentation
  description TEXT,
  default_value TEXT,

  -- Validation
  min_value DECIMAL(10, 4),
  max_value DECIMAL(10, 4),
  valid_values JSONB, -- For enums

  -- Environment overrides
  dev_value DECIMAL(10, 4),
  staging_value DECIMAL(10, 4),
  production_value DECIMAL(10, 4),

  -- Change tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);
```

---

## 🚀 Next Steps

1. ✅ Complete this analysis
2. ⏭️ Create database migration
3. ⏭️ Build ConfigurationService.ts
4. ⏭️ Integrate into DesignCanvas2D.tsx
5. ⏭️ Test with feature flag
6. ⏭️ Gradual rollout

---

**Feature Flag**: `use_database_configuration` (currently disabled)
