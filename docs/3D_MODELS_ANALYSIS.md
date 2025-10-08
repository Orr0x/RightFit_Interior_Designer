# 3D Models Migration - Comprehensive Analysis

**Purpose**: Analyze 1,948 lines of hardcoded 3D models for database migration
**Focus Areas**: Corner unit geometry, auto-rotate system
**Target**: Week 13-26 implementation

---

## 📊 Current State Analysis

### **File Structure**
- **Main File**: `src/components/designer/EnhancedModels3D.tsx` (1,948 lines)
- **Supporting Files**:
  - `src/components/designer/AdaptiveView3D.tsx`
  - `src/components/designer/Lazy3DView.tsx`

### **Component Types with Hardcoded Geometry**
1. Corner Cabinets (L-shaped)
2. Larder Corner Units
3. Base Cabinets
4. Wall Cabinets
5. Tall Units/Larders
6. Appliances
7. Sinks
8. Counter-tops
9. Doors & Windows
10. Cornice & Pelmet
11. End Panels
12. Flooring

---

## 🔍 Critical System: Corner Unit Geometry

### **Current Implementation (Lines 195-276)**

**Corner Cabinet L-Shape Design:**

```typescript
const isCornerCabinet = element.id.includes('corner-cabinet') ||
                       element.id.includes('corner-base-cabinet') ||
                       element.id.includes('new-corner-wall-cabinet') ||
                       element.id.includes('l-shaped-test-cabinet');

if (isCornerCabinet) {
  // L-shaped corner cabinet with detailed features (ORIGINAL GEOMETRY - DO NOT CHANGE)
  const cornerDepth = isWallCabinet ? 0.4 : 0.6;  // Wall: 40cm, Base: 60cm
  const legLength = width; // Use actual width for L-shape legs (0.6m or 0.9m)
  const centerX = legLength / 2;
  const centerZ = legLength / 2;

  // TWO PERPENDICULAR BOXES forming L-shape:

  // X-leg (horizontal leg)
  position: [0, plinthHeight/2, cornerDepth / 2 - legLength / 2]
  dimensions: [legLength, cabinetHeight, cornerDepth]

  // Z-leg (vertical leg)
  position: [cornerDepth / 2 - legLength / 2, plinthHeight/2, 0]
  dimensions: [cornerDepth, cabinetHeight, legLength]

  // TWO DOORS:

  // Front door (on X-leg)
  position: [0, plinthHeight/2, cornerDepth - legLength / 2 + 0.01]
  dimensions: [legLength - 0.05, doorHeight, 0.02]

  // Side door (on Z-leg)
  position: [cornerDepth - legLength / 2 + 0.01, plinthHeight/2, 0]
  dimensions: [0.02, doorHeight, legLength - 0.05]

  // TWO HANDLES:

  // Front handle
  position: [legLength / 2 - 0.05, plinthHeight/2, cornerDepth - legLength / 2 + 0.03]

  // Side handle
  position: [cornerDepth - legLength / 2 + 0.03, plinthHeight/2, -0.25]
}
```

### **Corner Unit Geometry Breakdown**

**L-Shape Formation:**
```
┌─────────────┐  ← Z-leg (depth: cornerDepth, length: legLength)
│             │
│    CORNER   │
│             │
│             └──────────────────┐
│                                │ ← X-leg (depth: cornerDepth, length: legLength)
│                                │
└────────────────────────────────┘
```

**Key Dimensions:**
- `legLength`: 0.6m (60cm) or 0.9m (90cm) - actual cabinet width
- `cornerDepth`:
  - Wall cabinets: 0.4m (40cm)
  - Base cabinets: 0.6m (60cm)
- `centerX`, `centerZ`: Both `legLength / 2` (rotation center)

**Special Features:**
1. **Two plinths** (base cabinets only) - one per leg
2. **Two cabinet bodies** - forming L-shape
3. **Two doors** - one per leg face
4. **Two handles** - metallic finish

---

## 🔄 Critical System: Auto-Rotate Logic

### **System Overview (Lines 755-885)**

The auto-rotate system automatically orients components based on:
1. **Wall proximity** - snap and face into room
2. **Corner detection** - special L-shape orientations
3. **Component type** - only components with `hasDirection: true`

### **Auto-Rotate Triggers**

**1. Corner Detection (Lines 762-834)**

**Four Corner Positions:**
```
(0,0) Front-Left          (W,0) Front-Right
  ┌─────────────────────────┐
  │  rotation: 0°           │  rotation: 270°
  │  L faces: ↓→            │  L faces: ↓←
  │                         │
  │                         │
  │  rotation: 90°          │  rotation: 180°
  │  L faces: ↑→            │  L faces: ↑←
  └─────────────────────────┘
(0,H) Back-Left          (W,H) Back-Right
```

**Corner Unit Rotations:**
- **Front-Left (0,0)**: rotation = 0° - L-shape faces down-right
- **Front-Right (W,0)**: rotation = 270° - L-shape faces down-left
- **Back-Left (0,H)**: rotation = 90° - L-shape faces up-right
- **Back-Right (W,H)**: rotation = 180° - L-shape faces up-left

**Non-Corner Components at Corners:**
- Front-Left: rotation = 90° (door faces right into room)
- Front-Right: rotation = 270° (door faces left into room)
- Back-Left: rotation = 90° (door faces right into room)
- Back-Right: rotation = 270° (door faces left into room)

**2. Wall Snap Detection (Lines 836-883)**

**Wall-Based Auto-Rotate:**
```
        rotation: 0° (door faces down/into room)
        ═════════════════════════════
        ║                           ║
        ║  rotation: 90°            ║  rotation: 270°
        ║  (door faces right)       ║  (door faces left)
        ║                           ║
        ═════════════════════════════
        rotation: 180° (door faces up/into room)
```

**Logic:**
1. Calculate distance to all 4 walls
2. Find closest wall (minimum distance)
3. If distance ≤ `wallSnapDistance` (35cm default, 50cm counter-tops):
   - Left wall → rotation = 90° (face right)
   - Right wall → rotation = 270° (face left)
   - Top wall (front) → rotation = 0° (face down)
   - Bottom wall (back) → rotation = 180° (face up)
4. Snap position to wall
5. Add visual guide line

**3. Close-to-Wall Auto-Snap (Lines 866-883)**

If within 10cm of wall but not within snap distance:
- Auto-snap to wall
- Auto-orient to face into room
- Same rotation rules as wall snap

### **Corner Tolerance System**

**Detection Parameters:**
- `cornerTolerance`: 30cm (database-driven via `configCache.corner_tolerance`)
- Special detection for corner components:
  - `detectionWidth`: 90cm (corner) or `elementWidth` (normal)
  - `detectionDepth`: 90cm (corner) or `elementDepth` (normal)

**Corner Component Detection:**
```typescript
const isCornerCounterTop = element.type === 'counter-top' &&
                          element.id.includes('counter-top-corner');
const isCornerWallCabinet = element.type === 'cabinet' &&
                           element.id.includes('corner-wall-cabinet');
const isCornerBaseCabinet = element.type === 'cabinet' &&
                           (element.id.includes('corner-base-cabinet') ||
                            element.id.includes('l-shaped-test-cabinet'));
const isCornerTallUnit = element.type === 'cabinet' &&
                        (element.id.includes('corner-tall') ||
                         element.id.includes('corner-larder') ||
                         element.id.includes('larder-corner'));
```

---

## 🎯 Database Schema Requirements

### **Essential Data to Capture**

**1. Corner Unit Geometry**
```json
{
  "component_id": "corner-base-cabinet-60",
  "geometry_type": "l_shaped_corner",
  "leg_length": 0.6,
  "corner_depth": {
    "wall_cabinet": 0.4,
    "base_cabinet": 0.6
  },
  "parts": [
    {
      "part_name": "x_leg",
      "type": "box",
      "position": [0, "plinthHeight/2", "cornerDepth/2 - legLength/2"],
      "dimensions": ["legLength", "cabinetHeight", "cornerDepth"],
      "material": "cabinet_body"
    },
    {
      "part_name": "z_leg",
      "type": "box",
      "position": ["cornerDepth/2 - legLength/2", "plinthHeight/2", 0],
      "dimensions": ["cornerDepth", "cabinetHeight", "legLength"],
      "material": "cabinet_body"
    },
    {
      "part_name": "front_door",
      "type": "box",
      "position": [0, "plinthHeight/2", "cornerDepth - legLength/2 + 0.01"],
      "dimensions": ["legLength - 0.05", "doorHeight", 0.02],
      "material": "door"
    }
  ],
  "rotation_center": ["legLength/2", 0, "legLength/2"]
}
```

**2. Auto-Rotate Configuration**
```json
{
  "component_id": "base-cabinet-60",
  "has_direction": true,
  "auto_rotate_enabled": true,
  "wall_orientations": {
    "left": 90,
    "right": 270,
    "top": 0,
    "bottom": 180
  },
  "corner_orientations": {
    "front_left": 0,
    "front_right": 270,
    "back_left": 90,
    "back_right": 180
  },
  "is_corner_component": false
}
```

**3. Component Geometry Parts**
```json
{
  "geometry_parts": [
    {
      "name": "cabinet_body",
      "type": "box",
      "position_formula": "[0, plinthHeight/2, 0]",
      "dimensions_formula": "[width, cabinetHeight, depth]",
      "material": "cabinet",
      "color_override": null
    },
    {
      "name": "plinth",
      "type": "box",
      "position_formula": "[0, -height/2 + plinthHeight/2, 0]",
      "dimensions_formula": "[width, plinthHeight, depth]",
      "material": "plinth",
      "conditional": "!isWallCabinet"
    },
    {
      "name": "door",
      "type": "box",
      "position_formula": "[0, plinthHeight/2, depth/2 + 0.01]",
      "dimensions_formula": "[width - 0.05, doorHeight, 0.02]",
      "material": "door"
    },
    {
      "name": "handle",
      "type": "box",
      "position_formula": "[width/2 - 0.05, plinthHeight/2, depth/2 + 0.03]",
      "dimensions_formula": "[0.02, 0.15, 0.02]",
      "material": "handle",
      "metalness": 0.8,
      "roughness": 0.2
    }
  ]
}
```

---

## 📋 Component Catalog

### **Current Hardcoded Components**

**Base Cabinets:**
- Standard base cabinets (40cm, 50cm, 60cm, 80cm, 100cm)
- Corner base cabinets (60cm, 90cm L-shaped)
- Sink base cabinets

**Wall Cabinets:**
- Standard wall cabinets (30cm, 40cm, 50cm, 60cm, 80cm)
- Corner wall cabinets (60cm, 90cm L-shaped)
- Glass-front wall cabinets

**Tall Units:**
- Larder units (60cm, 90cm)
- Larder corner units (90cm L-shaped)
- Pantry units
- Built-in oven housings

**Appliances:**
- Ovens
- Microwaves
- Dishwashers
- Refrigerators
- Range hoods

**Counter-tops:**
- Straight counter-tops
- Corner counter-tops (L-shaped)

**Sinks:**
- Kitchen sinks (single, double)
- Butler sinks

**Finishing:**
- Cornice (decorative top trim)
- Pelmet (light rail under wall cabinets)
- End panels
- Toe kicks/Plinths

---

## 🚀 Migration Strategy

### **Phase 1: Schema Design (Week 13-14)**
1. Design `component_3d_models` table
2. Design `geometry_parts` table
3. Design `material_definitions` table
4. Design `auto_rotate_rules` table

### **Phase 2: Data Extraction (Week 15-16)**
1. Parse EnhancedModels3D.tsx
2. Extract all component geometries
3. Document all formulas and calculations
4. Create JSON representations

### **Phase 3: Database Population (Week 17-18)**
1. Create migration scripts
2. Populate component data
3. Validate all geometries
4. Test data integrity

### **Phase 4: Service Layer (Week 19-20)**
1. Build `Model3DLoaderService.ts`
2. Implement geometry parser
3. Implement material system
4. Cache 3D model data

### **Phase 5: Renderer Refactor (Week 21-24)**
1. Build generic 3D renderer
2. Replace hardcoded components
3. Test all component types
4. Feature flag: `use_dynamic_3d_models`

### **Phase 6: Testing & Rollout (Week 25-26)**
1. Visual regression testing
2. Performance testing
3. Gradual rollout (1% → 100%)
4. Lock in and cleanup

---

## 💡 Key Insights

### **Corner Units are Special**
- L-shaped geometry (two perpendicular boxes)
- Rotation center at leg intersection
- Two doors, two handles
- Different plinths for each leg
- Must maintain EXACT geometry ratios

### **Auto-Rotate is Complex**
- Corner detection has 30cm tolerance
- Wall snap has variable distance (35-50cm)
- Different rules for corner vs non-corner components
- Rotation values are specific (0°, 90°, 180°, 270°)
- Must preserve "door faces into room" logic

### **Geometry is Formula-Based**
- Most dimensions use formulas: `width`, `height`, `depth`
- Offsets use calculations: `plinthHeight/2`, `cornerDepth/2 - legLength/2`
- Materials have properties: `metalness`, `roughness`
- Colors can be overridden: `isSelected ? selectedColor : defaultColor`

---

## ⚠️ Migration Risks

1. **Corner Unit Geometry** - Critical to get exact ratios
2. **Auto-Rotate Logic** - Must preserve all rotation rules
3. **Material Properties** - Metalness/roughness affect appearance
4. **Performance** - Loading models from DB could be slow
5. **Formula Evaluation** - Need safe eval or pre-computed values

---

**Next Steps:**
1. Design database schema for 3D models
2. Create migration strategy document
3. Build proof-of-concept with one component type
4. Test and iterate

---

**This analysis provides the foundation for migrating 1,948 lines of 3D models to a database-driven system while preserving exact geometry and auto-rotate behavior.**
