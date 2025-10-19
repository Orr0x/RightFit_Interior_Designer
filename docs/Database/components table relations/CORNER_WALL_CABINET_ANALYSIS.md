# Corner Wall Cabinet Analysis - To Create Corner Base Cabinet

**Date**: 2025-10-18
**Source**: new-corner-wall-cabinet-90 (UUID: a8b66209-ccef-4e44-a761-df5f37ac640b)
**Target**: corner-cabinet (corner base cabinet)

---

## Component 3D Model Configuration

### new-corner-wall-cabinet-90 Settings

```
component_id: new-corner-wall-cabinet-90
component_name: New Corner Wall Cabinet 90cm
component_type: wall-cabinet
category: cabinets
geometry_type: l_shaped_corner
is_corner_component: true

# L-Shape Dimensions
leg_length: 0.9000 (90cm - size of each leg of the L)
corner_depth_wall: 0.4000 (40cm - depth against wall for wall cabinet)
corner_depth_base: 0.6000 (60cm - depth of base)

# Rotation Center (center of L-shape)
rotation_center_x: legLength/2
rotation_center_y: 0
rotation_center_z: legLength/2

# Rotation Settings
has_direction: true
auto_rotate_enabled: true
wall_rotation_left: 90
wall_rotation_right: 270
wall_rotation_top: 0
wall_rotation_bottom: 180

# Corner-specific rotations
corner_rotation_front_left: 0
corner_rotation_front_right: 270
corner_rotation_back_left: 90
corner_rotation_back_right: 180

# Dimensions
default_width: 90.0000
default_height: 0.7000 (70cm - wall cabinet height)
default_depth: 40.0000

# Mounting Position
layer_type: wall
min_height_cm: 140.00 (mounted 140cm above floor)
max_height_cm: 210.00
can_overlap_layers: ["flooring", "base", "worktop"]
```

---

## Geometry Parts (6 parts)

### Part 1: Cabinet X-leg (render_order: 1)
```
part_name: Cabinet X-leg
part_type: box
position_x: 0
position_y: 0
position_z: cornerDepth / 2 - legLength / 2
dimension_width: legLength
dimension_height: height
dimension_depth: cornerDepth
material_name: cabinet
color_override: cabinetMaterial
```
**Purpose**: One leg of the L-shape (horizontal leg along X-axis)

### Part 2: Cabinet Z-leg (render_order: 2)
```
part_name: Cabinet Z-leg
part_type: box
position_x: cornerDepth / 2 - legLength / 2
position_y: 0
position_z: 0
dimension_width: cornerDepth
dimension_height: height
dimension_depth: legLength
material_name: cabinet
color_override: cabinetMaterial
```
**Purpose**: Other leg of the L-shape (vertical leg along Z-axis)

### Part 3: Front door (render_order: 3)
```
part_name: Front door
part_type: box
position_x: 0
position_y: 0
position_z: cornerDepth - legLength / 2 + 0.01
dimension_width: legLength - 0.05
dimension_height: height - 0.05
dimension_depth: 0.02 (2cm door thickness)
material_name: door
color_override: doorColor
```
**Purpose**: Door on the front face (X-leg)

### Part 4: Side door (render_order: 4)
```
part_name: Side door
part_type: box
position_x: cornerDepth - legLength / 2 + 0.01
position_y: 0
position_z: 0
dimension_width: 0.02 (2cm door thickness)
dimension_height: height - 0.05
dimension_depth: legLength - 0.05
material_name: door
color_override: doorColor
```
**Purpose**: Door on the side face (Z-leg)

### Part 5: Front handle (render_order: 5)
```
part_name: Front handle
part_type: box
position_x: legLength / 2 - 0.05
position_y: 0
position_z: cornerDepth - legLength / 2 + 0.03
dimension_width: 0.02
dimension_height: 0.15 (15cm handle)
dimension_depth: 0.02
material_name: handle
color_override: handleColor
metalness: 0.80
roughness: 0.20
```
**Purpose**: Handle on front door

### Part 6: Side handle (render_order: 6)
```
part_name: Side handle
part_type: box
position_x: cornerDepth - legLength / 2 + 0.03
position_y: 0
position_z: -0.25
dimension_width: 0.02
dimension_height: 0.15 (15cm handle)
dimension_depth: 0.02
material_name: handle
color_override: handleColor
metalness: 0.80
roughness: 0.20
```
**Purpose**: Handle on side door

---

## Key Variables Used in Formulas

```javascript
legLength = 0.9000     // 90cm (each leg of the L)
height = 0.7000        // 70cm (wall cabinet height)
cornerDepth = 0.4000   // 40cm (wall cabinet depth)
```

### For Base Cabinet (corner-cabinet):
```javascript
legLength = 0.9000     // 90cm (same)
height = 0.9000        // 90cm (BASE cabinet height - CHANGED)
cornerDepth = 0.6000   // 60cm (base cabinet depth - CHANGED)
```

---

## Required Changes for Corner Base Cabinet

### 1. Component 3D Model Changes
```diff
- component_id: new-corner-wall-cabinet-90
+ component_id: corner-cabinet

- component_name: New Corner Wall Cabinet 90cm
+ component_name: Corner Base Cabinet

- component_type: wall-cabinet
+ component_type: base-cabinet

- corner_depth_wall: 0.4000
+ corner_depth_wall: 0.6000  // Base cabinets deeper than wall

- default_height: 0.7000
+ default_height: 0.9000  // Base cabinets 90cm high

- default_depth: 40.0000
+ default_depth: 60.0000

- layer_type: wall
+ layer_type: base

- min_height_cm: 140.00
+ min_height_cm: 0.00  // Sits on floor

- max_height_cm: 210.00
+ max_height_cm: 90.00  // Base cabinet max height

- can_overlap_layers: ["flooring", "base", "worktop"]
+ can_overlap_layers: ["flooring"]  // Only sits on floor
```

### 2. Geometry Parts Changes

**Keep all 6 parts exactly the same**, but **ADD Part 7: Plinth**

### Part 7: Plinth (NEW - base cabinets only)
```
part_name: Plinth
part_type: box
position_x: 0
position_y: -0.15  // 15cm below cabinet body
position_z: 0
dimension_width: legLength
dimension_height: 0.15  // 15cm plinth height
dimension_depth: legLength
material_name: plinth
color_override: plinthColor
render_order: 0  // Render first (bottom)
```

**Purpose**: Plinth/toe-kick at base of cabinet (standard on all base cabinets)

---

## Formula Variable Adjustments

When formulas use `cornerDepth`, it will automatically use:
- Wall cabinet: `0.4` (40cm)
- Base cabinet: `0.6` (60cm)

When formulas use `height`, it will automatically use:
- Wall cabinet: `0.7` (70cm)
- Base cabinet: `0.9` (90cm)

**All existing formulas work perfectly** - just the variable values change!

---

## Code References Found

### ComponentIDMapper.ts
```typescript
{
  pattern: /corner-wall-cabinet|new-corner-wall-cabinet/i,
  mapper: (elementId, width) => `new-corner-wall-cabinet-${width}`,
  description: 'Corner wall cabinets (60cm, 90cm)',
  priority: 100,
},
```

### FormulaEvaluator.ts
```typescript
cornerDepth: options?.cornerDepth ?? (options?.isWallCabinet ? 0.4 : 0.6),
```
**Perfect!** This already handles wall (0.4) vs base (0.6) depth automatically.

### EnhancedModels3D.tsx
```typescript
const cornerDepth = isWallCabinet ? 0.4 : 0.6;
```
**Perfect!** This also handles it correctly.

---

## Migration Strategy

1. **Delete incorrect geometry** from corner-cabinet (currently has sink geometry)
2. **Clone all 6 parts** from new-corner-wall-cabinet-90
3. **Add 7th part** (Plinth) for base cabinet
4. **No formula changes needed** - cornerDepth/height variables handle it

---

## Expected Result

### Visual Appearance
- ✅ L-shaped corner base cabinet (90cm × 90cm × 90cm)
- ✅ Two legs forming 90° corner
- ✅ Doors on both faces (matching wall cabinet style)
- ✅ Handles on both doors
- ✅ Plinth at bottom (15cm toe-kick)
- ✅ Sits on floor (not wall-mounted)
- ✅ Same beautiful L-shape as wall cabinet, just positioned lower and deeper

### Placement
- ✅ Ground level (min_height_cm: 0)
- ✅ Deeper profile (60cm vs 40cm)
- ✅ Taller body (90cm vs 70cm)
- ✅ Perfect for corner base cabinet position

---

*Analysis complete - ready to create migration*
