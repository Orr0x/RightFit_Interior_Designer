# Admin Panel: 3D Models Guide

**Audience**: Administrators adding new 3D models to the database
**Purpose**: Step-by-step guide for adding and managing dynamic 3D models
**Last Updated**: January 29, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Adding a New 3D Model](#adding-a-new-3d-model)
4. [Formula Syntax Reference](#formula-syntax-reference)
5. [Material Properties](#material-properties)
6. [Geometry Part Types](#geometry-part-types)
7. [Testing Your Model](#testing-your-model)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)
10. [Examples](#examples)

---

## Overview

The dynamic 3D model system allows you to add new kitchen components via the database without writing code. Each model consists of:

1. **Model Metadata** - Basic info (name, dimensions, type)
2. **Geometry Parts** - Individual 3D shapes (boxes, cylinders)
3. **Material Definitions** - Colors, textures, properties

**Tables:**
- `component_3d_models` - Model metadata
- `geometry_parts` - Individual geometry pieces
- `material_definitions` - Material properties

---

## Prerequisites

### **Required Access**
- Supabase dashboard access
- SQL Editor permissions
- Knowledge of component dimensions

### **Required Information**
Before adding a model, gather:
- Component name (e.g., "Base Cabinet 60cm")
- Dimensions (width, height, depth in cm)
- Component type (cabinet, appliance, etc.)
- Is it a corner component? (L-shaped or standard)
- Desired visual appearance (colors, materials)

### **Helpful Tools**
- Three.js documentation (for geometry types)
- Existing model examples (in database)
- Calculator for formula conversions (cm → meters: divide by 100)

---

## Adding a New 3D Model

### **Step 1: Create Model Metadata**

```sql
-- Insert model metadata into component_3d_models table
INSERT INTO component_3d_models (
  component_id,
  component_name,
  component_type,
  geometry_type,
  is_corner_component,
  default_width,
  default_height,
  default_depth,
  leg_length,          -- For corner components only
  corner_depth_base,   -- For corner base cabinets
  corner_depth_wall,   -- For corner wall cabinets
  auto_rotate_enabled
) VALUES (
  'base-cabinet-60',                -- Unique ID for this model
  'Base Cabinet 60cm',              -- Display name
  'cabinet',                        -- Type: cabinet, appliance, etc.
  'composite',                      -- Geometry type (usually 'composite')
  false,                            -- Is this a corner (L-shaped) component?
  0.60,                             -- Default width in meters (60cm)
  0.90,                             -- Default height in meters (90cm)
  0.60,                             -- Default depth in meters (60cm)
  NULL,                             -- leg_length (corner components only)
  NULL,                             -- corner_depth_base (corner components only)
  NULL,                             -- corner_depth_wall (corner components only)
  false                             -- auto_rotate_enabled (corner components only)
) RETURNING id;
```

**Important:**
- Save the returned `id` (UUID) - you'll need it for geometry parts
- Always use meters for dimensions (cm / 100)
- Set corner-specific fields only for L-shaped components

---

### **Step 2: Add Material Definitions**

Materials define visual appearance. Common materials are already in the database,
but you can add custom ones if needed.

```sql
-- Check existing materials
SELECT material_name, default_color, material_type
FROM material_definitions
ORDER BY material_name;

-- Add a new material (if needed)
INSERT INTO material_definitions (
  material_name,
  default_color,
  material_type,
  roughness,
  metalness,
  opacity
) VALUES (
  'custom_wood',     -- Unique material name
  '#8B7355',         -- Hex color code
  'standard',        -- Material type: standard, lambert, phong
  0.7,               -- Roughness (0 = smooth, 1 = rough)
  0.1,               -- Metalness (0 = non-metal, 1 = metal)
  1.0                -- Opacity (0 = transparent, 1 = opaque)
);
```

**Pre-existing Materials:**
- `cabinet_wood` - Brown wood (#8B7355)
- `door_wood` - Dark brown (#654321)
- `handle_metal` - Silver (#C0C0C0)
- `plinth_wood` - Dark brown (#5a4a3a)
- `worktop_stone` - Light gray (#E8E8E8)
- `glass` - Transparent (#FFFFFF, opacity: 0.3)
- `metal_chrome` - Chrome (#C0C0C0, metalness: 0.9)

---

### **Step 3: Add Geometry Parts**

Geometry parts are the individual 3D shapes that make up your model.
Each part is a box, cylinder, or sphere with position and dimensions.

#### **Example: Simple Base Cabinet**

```sql
-- Assume model_id is the UUID from Step 1
-- Replace '<model-id>' with actual UUID

-- Part 1: Cabinet Body (main box)
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  sort_order,
  -- Position formulas (center of the part in 3D space)
  position_x,
  position_y,
  position_z,
  -- Dimension formulas (size of the part)
  dimension_width,
  dimension_height,
  dimension_depth,
  -- Material and color
  material_name,
  color_override,
  -- Optional properties
  roughness,
  metalness,
  opacity,
  render_condition
) VALUES (
  '<model-id>',
  'Cabinet Body',
  'box',                    -- Geometry type: box, cylinder, sphere
  1,                        -- Sort order (lower = rendered first)

  -- Position (center of geometry)
  '0',                      -- X: centered on origin
  '0',                      -- Y: centered on origin
  '0',                      -- Z: centered on origin

  -- Dimensions
  'width',                  -- Width: use element width (formula evaluation)
  'height - plinthHeight',  -- Height: element height minus plinth
  'depth',                  -- Depth: use element depth

  -- Material
  'cabinet_wood',           -- Material from material_definitions
  NULL,                     -- Color override (NULL = use material default)
  NULL,                     -- Roughness (NULL = use material default)
  NULL,                     -- Metalness (NULL = use material default)
  NULL,                     -- Opacity (NULL = use material default)
  NULL                      -- Render condition (NULL = always render)
);

-- Part 2: Plinth (base)
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  sort_order,
  position_x,
  position_y,
  position_z,
  dimension_width,
  dimension_height,
  dimension_depth,
  material_name,
  color_override
) VALUES (
  '<model-id>',
  'Plinth',
  'box',
  2,

  -- Position: at bottom of cabinet
  '0',
  '-height / 2 + plinthHeight / 2',  -- Bottom of cabinet
  '0',

  -- Dimensions: full width, small height
  'width',
  'plinthHeight',              -- plinthHeight variable (0.15m = 15cm)
  'depth',

  'plinth_wood',
  NULL
);

-- Part 3: Door (front face)
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  sort_order,
  position_x,
  position_y,
  position_z,
  dimension_width,
  dimension_height,
  dimension_depth,
  material_name,
  color_override
) VALUES (
  '<model-id>',
  'Door',
  'box',
  3,

  -- Position: front face
  '0',
  '0',
  'depth / 2 + 0.01',        -- Slightly in front (0.01m = 1cm)

  -- Dimensions: slightly smaller than cabinet
  'width - 0.04',            -- 4cm narrower (2cm gap each side)
  'doorHeight',              -- doorHeight variable
  '0.02',                    -- 2cm thick

  'door_wood',
  NULL
);

-- Part 4: Handle
INSERT INTO geometry_parts (
  model_id,
  part_name,
  part_type,
  sort_order,
  position_x,
  position_y,
  position_z,
  dimension_width,
  dimension_height,
  dimension_depth,
  material_name,
  metalness
) VALUES (
  '<model-id>',
  'Handle',
  'box',
  4,

  -- Position: center-right of door
  'width / 4',
  '0',
  'depth / 2 + 0.03',        -- In front of door

  -- Dimensions: small bar handle
  '0.02',                    -- 2cm wide
  '0.10',                    -- 10cm tall
  '0.02',                    -- 2cm deep

  'handle_metal',
  0.9                        -- Very metallic
);
```

**Key Points:**
- All positions are relative to the model's center (0, 0, 0)
- Positions and dimensions use formula strings (evaluated at runtime)
- Use variables: `width`, `height`, `depth`, `plinthHeight`, `cabinetHeight`, `doorHeight`
- Units are always **meters** (divide cm by 100)
- Sort order determines rendering order (lower first, useful for transparency)

---

## Formula Syntax Reference

Formulas are evaluated safely without `eval()`. Supported operators and variables:

### **Variables**

| Variable | Description | Unit | Example Value |
|----------|-------------|------|---------------|
| `width` | Element width | meters | 0.60 (60cm) |
| `height` | Element height | meters | 0.90 (90cm) |
| `depth` | Element depth | meters | 0.60 (60cm) |
| `plinthHeight` | Plinth height | meters | 0.15 (15cm) |
| `cabinetHeight` | Height - plinth | meters | 0.75 (75cm) |
| `doorHeight` | Height - plinth - gap | meters | 0.73 (73cm) |
| `legLength` | Corner leg length | meters | 0.60-0.90 |
| `cornerDepth` | Corner depth | meters | 0.40-0.60 |
| `isWallCabinet` | Is wall cabinet? | 0 or 1 | 1 = true, 0 = false |
| `isSelected` | Is selected? | 0 or 1 | 1 = true, 0 = false |

### **Operators**

| Operator | Description | Example | Result |
|----------|-------------|---------|--------|
| `+` | Addition | `width + 0.10` | width + 10cm |
| `-` | Subtraction | `height - plinthHeight` | height minus plinth |
| `*` | Multiplication | `width * 0.5` | half width |
| `/` | Division | `depth / 2` | half depth |
| `()` | Grouping | `(width + depth) / 2` | average |

### **Math Functions** (Coming Soon)

Planned for future updates:
- `min(a, b)` - Minimum of two values
- `max(a, b)` - Maximum of two values
- `abs(x)` - Absolute value
- `sqrt(x)` - Square root

### **Formula Examples**

```javascript
// Positioning
'0'                           // Center
'width / 2'                   // Right edge
'-width / 2'                  // Left edge
'height / 2 + 0.01'           // Top + 1cm
'-height / 2 + plinthHeight / 2'  // Plinth position

// Dimensions
'width'                       // Full width
'width - 0.04'                // Width minus 4cm (2cm each side)
'height - plinthHeight'       // Height minus plinth
'doorHeight'                  // Pre-calculated door height
'depth / 2'                   // Half depth

// Conditional values (using render_condition instead)
// See "Conditional Rendering" section below
```

### **Common Mistakes**

❌ **WRONG:**
```sql
position_x = 'width / 2cm'          -- Don't include units
dimension_width = '60'              -- Use variables, not hardcoded values
position_y = 'height / 2 - plinth'  -- Variable name is 'plinthHeight', not 'plinth'
```

✅ **CORRECT:**
```sql
position_x = 'width / 2'            -- Units are always meters
dimension_width = 'width'           -- Use variable
position_y = 'height / 2 - plinthHeight / 2'  -- Correct variable name
```

---

## Material Properties

### **Material Types**

| Type | Description | Use Case |
|------|-------------|----------|
| `standard` | PBR material | Most components (wood, stone) |
| `lambert` | Non-shiny | Matte finishes |
| `phong` | Shiny | Glossy surfaces |

### **Property Ranges**

| Property | Range | Description |
|----------|-------|-------------|
| `roughness` | 0.0 - 1.0 | 0 = mirror, 1 = rough matte |
| `metalness` | 0.0 - 1.0 | 0 = non-metal, 1 = pure metal |
| `opacity` | 0.0 - 1.0 | 0 = invisible, 1 = solid |

### **Color Overrides**

You can override material colors per part using `color_override`:

```sql
-- Use material default color
color_override = NULL

-- Override with specific color
color_override = '#FF0000'  -- Red

-- Use special override names (resolved by GeometryBuilder)
color_override = 'selectedColor'   -- Gold if selected, default otherwise
color_override = 'cabinetMaterial' -- Brown
color_override = 'doorColor'       -- Dark brown
color_override = 'handleColor'     -- Silver
color_override = 'plinthColor'     -- Dark brown
color_override = 'worktopColor'    -- Light gray
```

---

## Geometry Part Types

### **Box** (Most Common)

Used for: Cabinets, doors, plinths, panels

```sql
part_type = 'box'

-- Dimensions:
dimension_width  = 'width'   -- X-axis size
dimension_height = 'height'  -- Y-axis size
dimension_depth  = 'depth'   -- Z-axis size
```

**Position**: Center of the box

### **Cylinder**

Used for: Handles, knobs, pipes

```sql
part_type = 'cylinder'

-- Dimensions:
dimension_width  = '0.02'    -- Radius (2cm)
dimension_height = '0.10'    -- Height (10cm)
dimension_depth  = '8'       -- Segments (8-32 for smooth curves)
```

**Position**: Center of cylinder axis (Y-axis is height)

### **Sphere**

Used for: Knobs, decorative elements

```sql
part_type = 'sphere'

-- Dimensions:
dimension_width  = '0.03'    -- Radius (3cm)
dimension_height = '16'      -- Width segments (8-32)
dimension_depth  = '16'      -- Height segments (8-32)
```

**Position**: Center of sphere

---

## Conditional Rendering

Use `render_condition` to show/hide parts based on component state:

```sql
-- Always render (default)
render_condition = NULL

-- Render only for wall cabinets
render_condition = 'isWallCabinet == 1'

-- Render only for base cabinets (not wall)
render_condition = 'isWallCabinet == 0'

-- Render only when selected
render_condition = 'isSelected == 1'

-- Complex conditions (future feature)
render_condition = 'width > 0.60 && isWallCabinet == 1'
```

**Supported Operators:**
- `==` - Equals
- `!=` - Not equals
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal
- `&&` - AND (future)
- `||` - OR (future)

---

## Testing Your Model

### **Step 1: Verify Data in Database**

```sql
-- Check model was created
SELECT component_id, component_name, default_width, default_height
FROM component_3d_models
WHERE component_id = 'base-cabinet-60';

-- Check geometry parts count
SELECT m.component_id, COUNT(gp.id) as part_count
FROM component_3d_models m
LEFT JOIN geometry_parts gp ON gp.model_id = m.id
WHERE m.component_id = 'base-cabinet-60'
GROUP BY m.component_id;

-- Check all geometry parts
SELECT part_name, part_type, sort_order, material_name
FROM geometry_parts
WHERE model_id = (
  SELECT id FROM component_3d_models WHERE component_id = 'base-cabinet-60'
)
ORDER BY sort_order;
```

### **Step 2: Enable Feature Flag**

```sql
-- Enable dynamic 3D models
UPDATE feature_flags
SET enabled_dev = TRUE
WHERE flag_key = 'use_dynamic_3d_models';
```

### **Step 3: Test in Designer**

1. **Clear browser cache** (Hard reload: Ctrl+Shift+R)
2. **Open designer** and create new design
3. **Drop component** onto canvas
4. **Check console** for loading messages:
   ```
   [Model3DLoader] Loaded model from database: base-cabinet-60
   [DynamicRenderer] Built component: base-cabinet-60 (4 parts)
   ```
5. **Switch to 3D view** and verify visual appearance
6. **Test interactions:**
   - Rotation
   - Selection (should highlight)
   - Different sizes (if applicable)

### **Step 4: Debug Issues**

If model doesn't appear or looks wrong:

```javascript
// In browser console, run:
testComponentIdMapping('base-cabinet-1234567', 60)
// Shows which mapping rule was used

// Check for errors:
// Look for [GeometryBuilder] Error or [DynamicRenderer] Error messages
```

Common issues:
- **Model not loading**: Check `component_id` matches ComponentIDMapper pattern
- **Missing parts**: Check `model_id` in geometry_parts matches model UUID
- **Wrong position/size**: Check formulas use meters, not cm
- **Formula errors**: Check variable names are correct (e.g., `plinthHeight` not `plinth`)

---

## Common Patterns

### **Pattern 1: Standard Cabinet**

4 parts: Body, plinth, door, handle

```sql
-- See "Step 3: Add Geometry Parts" example above
```

### **Pattern 2: Corner Cabinet (L-shaped)**

8 parts for base, 6 for wall (no plinths on wall)

```sql
-- X-Leg (along X-axis)
INSERT INTO geometry_parts (...) VALUES (
  ...,
  'Cabinet X-leg',
  'box',
  1,
  'legLength / 2',              -- Positioned at legLength/2 on X
  '0',
  '0',
  'legLength',                  -- Length of the leg
  'height - plinthHeight',      -- Height
  'cornerDepth',                -- Depth
  ...
);

-- Z-Leg (along Z-axis)
INSERT INTO geometry_parts (...) VALUES (
  ...,
  'Cabinet Z-leg',
  'box',
  2,
  '0',
  '0',
  'legLength / 2',              -- Positioned at legLength/2 on Z
  'cornerDepth',                -- Width
  'height - plinthHeight',      -- Height
  'legLength',                  -- Depth
  ...
);

-- Similar pattern for plinths, doors, handles
```

### **Pattern 3: Appliance (Oven)**

2-3 parts: Body, door, optional handle

```sql
-- Body (main oven cavity)
position_x = '0'
position_y = '0'
position_z = '0'
dimension_width = 'width - 0.02'
dimension_height = 'height - 0.02'
dimension_depth = 'depth'

-- Door (front face)
position_z = 'depth / 2 + 0.01'
dimension_depth = '0.02'  -- Thin door

-- Handle (horizontal bar)
position_y = 'height / 3'  -- Upper third
dimension_height = '0.02'  -- Thin bar
```

### **Pattern 4: Counter-top**

1-2 parts: Top surface, optional edge

```sql
-- Top surface
position_y = 'height / 2'     -- Top of cabinet
dimension_height = '0.04'     -- 4cm thick
```

---

## Troubleshooting

### **Model Not Loading**

**Symptom**: Console shows `[DynamicRenderer] Model not found: <id>`

**Causes:**
1. Component ID doesn't match ComponentIDMapper pattern
2. Model doesn't exist in database
3. Feature flag disabled

**Solutions:**
```sql
-- Check if model exists
SELECT component_id FROM component_3d_models WHERE component_id = '<id>';

-- Check ComponentIDMapper pattern in browser console
testComponentIdMapping('<element-id>', <width>)

-- Enable feature flag
UPDATE feature_flags SET enabled_dev = TRUE WHERE flag_key = 'use_dynamic_3d_models';
```

---

### **Formula Evaluation Error**

**Symptom**: Console shows `[FormulaEvaluator] Failed to evaluate formula`

**Causes:**
1. Invalid formula syntax
2. Unknown variable name
3. Unary minus not supported (use `0 - value` instead of `-value`)

**Solutions:**
```sql
-- Check formula in database
SELECT part_name, position_y, dimension_height
FROM geometry_parts
WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = '<id>');

-- Fix formula
UPDATE geometry_parts
SET position_y = '0 - height / 2'  -- Instead of '-height / 2'
WHERE part_name = '<part-name>';
```

---

### **Wrong Visual Appearance**

**Symptom**: Model renders but looks wrong (size, position, color)

**Causes:**
1. Formula uses wrong units (cm instead of meters)
2. Position relative to wrong origin
3. Material/color not applied

**Solutions:**
```sql
-- Check dimensions (should be meters)
SELECT part_name, dimension_width, dimension_height, dimension_depth
FROM geometry_parts
WHERE model_id = (SELECT id FROM component_3d_models WHERE component_id = '<id>');

-- Fix units (divide by 100 if using cm)
UPDATE geometry_parts
SET dimension_width = 'width'  -- Not 'width * 100'
WHERE model_id = '<model-id>';

-- Check material
SELECT part_name, material_name, color_override
FROM geometry_parts
WHERE model_id = '<model-id>';
```

---

## Examples

### **Example 1: Simple Drawer Unit**

```sql
-- Model metadata
INSERT INTO component_3d_models (
  component_id, component_name, component_type, geometry_type,
  is_corner_component, default_width, default_height, default_depth
) VALUES (
  'drawer-unit-60', 'Drawer Unit 60cm', 'cabinet', 'composite',
  false, 0.60, 0.90, 0.60
) RETURNING id;

-- Body
INSERT INTO geometry_parts (model_id, part_name, part_type, sort_order,
  position_x, position_y, position_z,
  dimension_width, dimension_height, dimension_depth,
  material_name
) VALUES (
  '<model-id>', 'Body', 'box', 1,
  '0', '0', '0',
  'width', 'height', 'depth',
  'cabinet_wood'
);

-- Drawer 1 (top)
INSERT INTO geometry_parts (model_id, part_name, part_type, sort_order,
  position_x, position_y, position_z,
  dimension_width, dimension_height, dimension_depth,
  material_name
) VALUES (
  '<model-id>', 'Drawer 1', 'box', 2,
  '0', 'height / 3', 'depth / 2 + 0.01',
  'width - 0.04', 'height / 3 - 0.04', '0.02',
  'door_wood'
);

-- Drawer 2 (middle)
INSERT INTO geometry_parts (model_id, part_name, part_type, sort_order,
  position_x, position_y, position_z,
  dimension_width, dimension_height, dimension_depth,
  material_name
) VALUES (
  '<model-id>', 'Drawer 2', 'box', 3,
  '0', '0', 'depth / 2 + 0.01',
  'width - 0.04', 'height / 3 - 0.04', '0.02',
  'door_wood'
);

-- Drawer 3 (bottom)
INSERT INTO geometry_parts (model_id, part_name, part_type, sort_order,
  position_x, position_y, position_z,
  dimension_width, dimension_height, dimension_depth,
  material_name
) VALUES (
  '<model-id>', 'Drawer 3', 'box', 4,
  '0', '0 - height / 3', 'depth / 2 + 0.01',
  'width - 0.04', 'height / 3 - 0.04', '0.02',
  'door_wood'
);
```

---

### **Example 2: Tall Larder Unit**

```sql
-- Model metadata
INSERT INTO component_3d_models (
  component_id, component_name, component_type, geometry_type,
  is_corner_component, default_width, default_height, default_depth
) VALUES (
  'tall-unit-60', 'Tall Larder Unit 60cm', 'cabinet', 'composite',
  false, 0.60, 2.00, 0.60  -- 200cm tall
) RETURNING id;

-- Body
INSERT INTO geometry_parts (model_id, part_name, part_type, sort_order,
  position_x, position_y, position_z,
  dimension_width, dimension_height, dimension_depth,
  material_name
) VALUES (
  '<model-id>', 'Body', 'box', 1,
  '0', '0', '0',
  'width', 'height', 'depth',
  'cabinet_wood'
);

-- Left door
INSERT INTO geometry_parts (model_id, part_name, part_type, sort_order,
  position_x, position_y, position_z,
  dimension_width, dimension_height, dimension_depth,
  material_name
) VALUES (
  '<model-id>', 'Left Door', 'box', 2,
  '0 - width / 4', '0', 'depth / 2 + 0.01',
  'width / 2 - 0.02', 'height - 0.04', '0.02',
  'door_wood'
);

-- Right door
INSERT INTO geometry_parts (model_id, part_name, part_type, sort_order,
  position_x, position_y, position_z,
  dimension_width, dimension_height, dimension_depth,
  material_name
) VALUES (
  '<model-id>', 'Right Door', 'box', 3,
  'width / 4', '0', 'depth / 2 + 0.01',
  'width / 2 - 0.02', 'height - 0.04', '0.02',
  'door_wood'
);
```

---

## Best Practices

### **1. Start Simple**
- Begin with a basic box (cabinet body)
- Add one part at a time
- Test after each addition

### **2. Use Existing Models as Templates**
- Copy SQL from similar models
- Modify dimensions and formulas
- Maintain same part structure

### **3. Follow Naming Conventions**
- component_id: lowercase with dashes (e.g., `base-cabinet-60`)
- part_name: Descriptive (e.g., "Cabinet Body", "Left Door")
- material_name: lowercase with underscore (e.g., `cabinet_wood`)

### **4. Document Your Models**
- Add comments in SQL scripts
- Note any special formulas or logic
- Include dimension reasoning

### **5. Test Thoroughly**
- Test all sizes (if parametric)
- Test in different positions
- Test selection highlighting
- Test in 2D and 3D views

---

## Support

### **Need Help?**

1. **Check Examples** - Look at existing models in database
2. **Review Troubleshooting** - Common issues and solutions
3. **Check Console** - Browser console shows detailed errors
4. **Ask Team** - Post in #3d-models Slack channel

### **Report Issues**

If you find bugs in the dynamic model system:
1. Note the component_id
2. Copy console error messages
3. Screenshot the visual issue
4. Post in #3d-models-bugs

---

## Quick Reference Card

```
UNITS:        Always use meters (cm / 100)
VARIABLES:    width, height, depth, plinthHeight, cabinetHeight, doorHeight
OPERATORS:    +, -, *, /, ()
PART TYPES:   box, cylinder, sphere
MATERIALS:    cabinet_wood, door_wood, handle_metal, plinth_wood
POSITION:     Center of geometry part (0,0,0 = model center)
SORT ORDER:   Lower = rendered first (useful for transparency)
CONDITIONS:   isWallCabinet == 1, isSelected == 1

COMMON FORMULAS:
  Position Y:  '-height / 2 + plinthHeight / 2'  (plinth at bottom)
  Position Z:  'depth / 2 + 0.01'                 (front face)
  Dimension:   'width - 0.04'                     (4cm narrower)
```

---

**Last Updated**: January 29, 2025
**Version**: 1.0
**Maintained By**: 3D Models Team
