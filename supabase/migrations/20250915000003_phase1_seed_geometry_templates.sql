-- Phase 1: Seed data for room_geometry_templates table
-- Created: 2025-10-10
-- Purpose: Insert template geometries for rectangle, L-shaped, and U-shaped rooms
--
-- Templates:
-- 1. Simple Rectangle (600×400cm) - Default
-- 2. L-Shaped Kitchen (600×400cm + 400×300cm extension)
-- 3. U-Shaped Kitchen (600×500cm with two extensions)

-- =============================================================================
-- 1. Simple Rectangle Template (600×400cm)
-- =============================================================================

INSERT INTO room_geometry_templates (
  template_name,
  display_name,
  description,
  category,
  geometry_definition,
  is_active,
  sort_order,
  created_at,
  updated_at
) VALUES (
  'rectangle-600x400',
  'Simple Rectangle',
  'Standard rectangular room. Easy to work with and suitable for most layouts.',
  'standard',
  '{
    "shape_type": "rectangle",
    "bounding_box": {
      "min_x": 0,
      "min_y": 0,
      "max_x": 600,
      "max_y": 400
    },
    "floor": {
      "type": "polygon",
      "vertices": [
        [0, 0],
        [600, 0],
        [600, 400],
        [0, 400]
      ],
      "elevation": 0
    },
    "ceiling": {
      "type": "polygon",
      "vertices": [
        [0, 0],
        [600, 0],
        [600, 400],
        [0, 400]
      ],
      "height": 240,
      "elevation": 240
    },
    "walls": [
      {
        "id": "wall-1",
        "start": [0, 0],
        "end": [600, 0],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-2",
        "start": [600, 0],
        "end": [600, 400],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-3",
        "start": [600, 400],
        "end": [0, 400],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-4",
        "start": [0, 400],
        "end": [0, 0],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      }
    ],
    "bounding_box": {
      "min_x": 0,
      "min_y": 0,
      "max_x": 600,
      "max_y": 400
    },
    "metadata": {
      "total_floor_area": 240000,
      "total_wall_length": 2000,
      "suggested_uses": ["kitchen", "bedroom", "office"],
      "complexity": "simple"
    }
  }'::jsonb,
  true,
  0,
  NOW(),
  NOW()
);

-- =============================================================================
-- 2. L-Shaped Kitchen Template
-- =============================================================================

INSERT INTO room_geometry_templates (
  template_name,
  display_name,
  description,
  category,
  geometry_definition,
  is_active,
  sort_order,
  created_at,
  updated_at
) VALUES (
  'l-shape-kitchen',
  'L-Shaped Kitchen',
  'L-shaped layout with two perpendicular sections. Ideal for kitchens with multiple work zones.',
  'l-shape',
  '{
    "shape_type": "l-shape",
    "bounding_box": {
      "min_x": 0,
      "min_y": 0,
      "max_x": 600,
      "max_y": 400
    },
    "floor": {
      "type": "polygon",
      "vertices": [
        [0, 0],
        [600, 0],
        [600, 300],
        [300, 300],
        [300, 400],
        [0, 400]
      ],
      "elevation": 0
    },
    "ceiling": {
      "type": "polygon",
      "vertices": [
        [0, 0],
        [600, 0],
        [600, 300],
        [300, 300],
        [300, 400],
        [0, 400]
      ],
      "height": 240,
      "elevation": 240
    },
    "walls": [
      {
        "id": "wall-1",
        "start": [0, 0],
        "end": [600, 0],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-2",
        "start": [600, 0],
        "end": [600, 300],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-3",
        "start": [600, 300],
        "end": [300, 300],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-4",
        "start": [300, 300],
        "end": [300, 400],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-5",
        "start": [300, 400],
        "end": [0, 400],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-6",
        "start": [0, 400],
        "end": [0, 0],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      }
    ],
    "bounding_box": {
      "min_x": 0,
      "min_y": 0,
      "max_x": 600,
      "max_y": 400
    },
    "metadata": {
      "total_floor_area": 210000,
      "total_wall_length": 2200,
      "suggested_uses": ["kitchen", "living-room"],
      "complexity": "moderate"
    }
  }'::jsonb,
  true,
  1,
  NOW(),
  NOW()
);

-- =============================================================================
-- 3. U-Shaped Kitchen Template
-- =============================================================================

INSERT INTO room_geometry_templates (
  template_name,
  display_name,
  description,
  category,
  geometry_definition,
  is_active,
  sort_order,
  created_at,
  updated_at
) VALUES (
  'u-shape-kitchen',
  'U-Shaped Kitchen',
  'U-shaped layout with three connected sections. Maximum counter space and storage.',
  'u-shape',
  '{
    "shape_type": "u-shape",
    "bounding_box": {
      "min_x": 0,
      "min_y": 0,
      "max_x": 600,
      "max_y": 500
    },
    "floor": {
      "type": "polygon",
      "vertices": [
        [0, 0],
        [600, 0],
        [600, 150],
        [450, 150],
        [450, 350],
        [600, 350],
        [600, 500],
        [0, 500]
      ],
      "elevation": 0
    },
    "ceiling": {
      "type": "polygon",
      "vertices": [
        [0, 0],
        [600, 0],
        [600, 150],
        [450, 150],
        [450, 350],
        [600, 350],
        [600, 500],
        [0, 500]
      ],
      "height": 240,
      "elevation": 240
    },
    "walls": [
      {
        "id": "wall-1",
        "start": [0, 0],
        "end": [600, 0],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-2",
        "start": [600, 0],
        "end": [600, 150],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-3",
        "start": [600, 150],
        "end": [450, 150],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-4",
        "start": [450, 150],
        "end": [450, 350],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-5",
        "start": [450, 350],
        "end": [600, 350],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-6",
        "start": [600, 350],
        "end": [600, 500],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-7",
        "start": [600, 500],
        "end": [0, 500],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      },
      {
        "id": "wall-8",
        "start": [0, 500],
        "end": [0, 0],
        "height": 240,
        "thickness": 15,
        "material": "default",
        "has_door": false,
        "has_window": false
      }
    ],
    "bounding_box": {
      "min_x": 0,
      "min_y": 0,
      "max_x": 600,
      "max_y": 500
    },
    "metadata": {
      "total_floor_area": 270000,
      "total_wall_length": 2700,
      "suggested_uses": ["kitchen"],
      "complexity": "complex"
    }
  }'::jsonb,
  true,
  2,
  NOW(),
  NOW()
);

-- =============================================================================
-- Verification Query
-- =============================================================================

-- Uncomment to verify templates were inserted correctly:
-- SELECT
--   id,
--   template_name,
--   display_name,
--   category,
--   (geometry_definition->'metadata'->>'total_floor_area')::float / 10000 as floor_area_m2,
--   jsonb_array_length(geometry_definition->'walls') as wall_count,
--   is_active
-- FROM room_geometry_templates
-- ORDER BY sort_order;
