-- Migration: Create Room Geometry System for Complex Room Shapes
-- Purpose: Enable L-shaped, U-shaped, and custom polygon rooms
-- Phase: 1 of 6 - Database Schema
-- Date: 2025-10-11

-- ============================================================================
-- PART 1: Create room_geometry_templates table
-- ============================================================================

-- Table to store reusable room shape templates (L-shape, U-shape, custom)
CREATE TABLE IF NOT EXISTS public.room_geometry_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('standard', 'l-shape', 'u-shape', 't-shape', 'custom')),
  preview_image_url TEXT,
  geometry_definition JSONB NOT NULL,
  parameter_config JSONB,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for room_geometry_templates
CREATE INDEX IF NOT EXISTS idx_geometry_templates_category
  ON public.room_geometry_templates(category);

CREATE INDEX IF NOT EXISTS idx_geometry_templates_active
  ON public.room_geometry_templates(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_geometry_templates_sort
  ON public.room_geometry_templates(sort_order);

-- GIN index for JSONB queries on geometry_definition
CREATE INDEX IF NOT EXISTS idx_geometry_templates_definition
  ON public.room_geometry_templates USING GIN (geometry_definition);

-- GIN index for JSONB queries on parameter_config
CREATE INDEX IF NOT EXISTS idx_geometry_templates_params
  ON public.room_geometry_templates USING GIN (parameter_config);

-- ============================================================================
-- PART 2: Add room_geometry column to room_designs
-- ============================================================================

-- Add optional room_geometry column for complex room shapes
-- NULL = simple rectangular room (backward compatible)
-- JSONB = complex room shape (L-shape, U-shape, custom polygon)
ALTER TABLE public.room_designs
ADD COLUMN IF NOT EXISTS room_geometry JSONB;

-- GIN index for JSONB queries on room_geometry
CREATE INDEX IF NOT EXISTS idx_room_designs_geometry
  ON public.room_designs USING GIN (room_geometry);

-- Partial index for rooms with complex geometry (most queries will filter by this)
CREATE INDEX IF NOT EXISTS idx_room_designs_has_geometry
  ON public.room_designs(id)
  WHERE room_geometry IS NOT NULL;

-- ============================================================================
-- PART 3: Seed initial room geometry templates
-- ============================================================================

-- Template 1: Standard Rectangle (reference template, matches current behavior)
INSERT INTO public.room_geometry_templates (
  template_name,
  display_name,
  description,
  category,
  geometry_definition,
  parameter_config,
  sort_order
) VALUES (
  'rectangle-standard',
  'Standard Rectangle',
  'Traditional rectangular room shape. This is the default room type.',
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
      "vertices": [[0, 0], [600, 0], [600, 400], [0, 400]],
      "elevation": 0,
      "material": "hardwood"
    },
    "walls": [
      {
        "id": "wall_north",
        "start": [0, 0],
        "end": [600, 0],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_east",
        "start": [600, 0],
        "end": [600, 400],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_south",
        "start": [600, 400],
        "end": [0, 400],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_west",
        "start": [0, 400],
        "end": [0, 0],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      }
    ],
    "ceiling": {
      "type": "flat",
      "zones": [
        {
          "vertices": [[0, 0], [600, 0], [600, 400], [0, 400]],
          "height": 250,
          "style": "flat"
        }
      ]
    },
    "metadata": {
      "total_floor_area": 240000,
      "total_wall_area": 96000,
      "usable_floor_area": 240000
    }
  }'::jsonb,
  '{
    "configurable_params": [
      {
        "name": "width",
        "label": "Room Width",
        "type": "number",
        "min": 200,
        "max": 1500,
        "default": 600,
        "unit": "cm",
        "step": 10
      },
      {
        "name": "depth",
        "label": "Room Depth",
        "type": "number",
        "min": 200,
        "max": 1200,
        "default": 400,
        "unit": "cm",
        "step": 10
      },
      {
        "name": "ceiling_height",
        "label": "Ceiling Height",
        "type": "number",
        "min": 220,
        "max": 400,
        "default": 250,
        "unit": "cm",
        "step": 10
      }
    ]
  }'::jsonb,
  10
) ON CONFLICT (template_name) DO NOTHING;

-- Template 2: L-Shaped Room (Standard)
INSERT INTO public.room_geometry_templates (
  template_name,
  display_name,
  description,
  category,
  geometry_definition,
  parameter_config,
  sort_order
) VALUES (
  'l-shape-standard',
  'Standard L-Shape',
  'L-shaped room with main section and perpendicular extension. Perfect for open-plan kitchens or living areas.',
  'l-shape',
  '{
    "shape_type": "l-shape",
    "bounding_box": {
      "min_x": 0,
      "min_y": 0,
      "max_x": 600,
      "max_y": 600
    },
    "floor": {
      "type": "polygon",
      "vertices": [
        [0, 0],
        [600, 0],
        [600, 400],
        [300, 400],
        [300, 600],
        [0, 600]
      ],
      "elevation": 0,
      "material": "hardwood"
    },
    "walls": [
      {
        "id": "wall_1",
        "start": [0, 0],
        "end": [600, 0],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_2",
        "start": [600, 0],
        "end": [600, 400],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_3",
        "start": [600, 400],
        "end": [300, 400],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_4_internal",
        "start": [300, 400],
        "end": [300, 600],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_5",
        "start": [300, 600],
        "end": [0, 600],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_6",
        "start": [0, 600],
        "end": [0, 0],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      }
    ],
    "ceiling": {
      "type": "flat",
      "zones": [
        {
          "vertices": [
            [0, 0],
            [600, 0],
            [600, 400],
            [300, 400],
            [300, 600],
            [0, 600]
          ],
          "height": 250,
          "style": "flat"
        }
      ]
    },
    "sections": [
      {
        "id": "main_section",
        "name": "Main Section",
        "vertices": [[0, 0], [600, 0], [600, 400], [0, 400]],
        "type": "primary"
      },
      {
        "id": "extension",
        "name": "Extension",
        "vertices": [[0, 400], [300, 400], [300, 600], [0, 600]],
        "type": "secondary"
      }
    ],
    "metadata": {
      "total_floor_area": 300000,
      "total_wall_area": 144000,
      "usable_floor_area": 290000
    }
  }'::jsonb,
  '{
    "configurable_params": [
      {
        "name": "main_width",
        "label": "Main Section Width",
        "type": "number",
        "min": 300,
        "max": 1000,
        "default": 600,
        "unit": "cm",
        "step": 10
      },
      {
        "name": "main_depth",
        "label": "Main Section Depth",
        "type": "number",
        "min": 300,
        "max": 800,
        "default": 400,
        "unit": "cm",
        "step": 10
      },
      {
        "name": "extension_width",
        "label": "Extension Width",
        "type": "number",
        "min": 200,
        "max": 600,
        "default": 300,
        "unit": "cm",
        "step": 10
      },
      {
        "name": "extension_depth",
        "label": "Extension Depth",
        "type": "number",
        "min": 200,
        "max": 400,
        "default": 200,
        "unit": "cm",
        "step": 10
      },
      {
        "name": "ceiling_height",
        "label": "Ceiling Height",
        "type": "number",
        "min": 220,
        "max": 400,
        "default": 250,
        "unit": "cm",
        "step": 10
      }
    ]
  }'::jsonb,
  20
) ON CONFLICT (template_name) DO NOTHING;

-- Template 3: U-Shaped Room
INSERT INTO public.room_geometry_templates (
  template_name,
  display_name,
  description,
  category,
  geometry_definition,
  parameter_config,
  sort_order
) VALUES (
  'u-shape-standard',
  'Standard U-Shape',
  'U-shaped room with central courtyard or opening. Ideal for wrap-around kitchens or horseshoe layouts.',
  'u-shape',
  '{
    "shape_type": "u-shape",
    "bounding_box": {
      "min_x": 0,
      "min_y": 0,
      "max_x": 800,
      "max_y": 600
    },
    "floor": {
      "type": "polygon",
      "vertices": [
        [0, 0],
        [800, 0],
        [800, 600],
        [600, 600],
        [600, 200],
        [200, 200],
        [200, 600],
        [0, 600]
      ],
      "elevation": 0,
      "material": "hardwood"
    },
    "walls": [
      {
        "id": "wall_outer_north",
        "start": [0, 0],
        "end": [800, 0],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_outer_east",
        "start": [800, 0],
        "end": [800, 600],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_outer_south_right",
        "start": [800, 600],
        "end": [600, 600],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_inner_right",
        "start": [600, 600],
        "end": [600, 200],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_inner_top",
        "start": [600, 200],
        "end": [200, 200],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_inner_left",
        "start": [200, 200],
        "end": [200, 600],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_outer_south_left",
        "start": [200, 600],
        "end": [0, 600],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      },
      {
        "id": "wall_outer_west",
        "start": [0, 600],
        "end": [0, 0],
        "height": 240,
        "thickness": 10,
        "type": "solid",
        "material": "plaster"
      }
    ],
    "ceiling": {
      "type": "flat",
      "zones": [
        {
          "vertices": [
            [0, 0],
            [800, 0],
            [800, 600],
            [600, 600],
            [600, 200],
            [200, 200],
            [200, 600],
            [0, 600]
          ],
          "height": 250,
          "style": "flat"
        }
      ]
    },
    "sections": [
      {
        "id": "left_arm",
        "name": "Left Arm",
        "vertices": [[0, 0], [200, 0], [200, 600], [0, 600]],
        "type": "arm"
      },
      {
        "id": "top_section",
        "name": "Top Section",
        "vertices": [[200, 0], [600, 0], [600, 200], [200, 200]],
        "type": "primary"
      },
      {
        "id": "right_arm",
        "name": "Right Arm",
        "vertices": [[600, 0], [800, 0], [800, 600], [600, 600]],
        "type": "arm"
      }
    ],
    "metadata": {
      "total_floor_area": 400000,
      "total_wall_area": 192000,
      "usable_floor_area": 380000
    }
  }'::jsonb,
  '{
    "configurable_params": [
      {
        "name": "total_width",
        "label": "Total Width",
        "type": "number",
        "min": 400,
        "max": 1200,
        "default": 800,
        "unit": "cm",
        "step": 10
      },
      {
        "name": "total_depth",
        "label": "Total Depth",
        "type": "number",
        "min": 400,
        "max": 1000,
        "default": 600,
        "unit": "cm",
        "step": 10
      },
      {
        "name": "arm_width",
        "label": "Arm Width",
        "type": "number",
        "min": 150,
        "max": 400,
        "default": 200,
        "unit": "cm",
        "step": 10
      },
      {
        "name": "top_depth",
        "label": "Top Section Depth",
        "type": "number",
        "min": 150,
        "max": 400,
        "default": 200,
        "unit": "cm",
        "step": 10
      },
      {
        "name": "ceiling_height",
        "label": "Ceiling Height",
        "type": "number",
        "min": 220,
        "max": 400,
        "default": 250,
        "unit": "cm",
        "step": 10
      }
    ]
  }'::jsonb,
  30
) ON CONFLICT (template_name) DO NOTHING;

-- ============================================================================
-- PART 4: Add helpful comments and metadata
-- ============================================================================

COMMENT ON TABLE public.room_geometry_templates IS
  'Stores reusable room shape templates for complex geometries (L-shape, U-shape, custom polygons).
   Users select from this library when creating rooms with non-rectangular shapes.';

COMMENT ON COLUMN public.room_geometry_templates.template_name IS
  'Unique identifier for the template (e.g., l-shape-standard, u-shape-large). Used in code references.';

COMMENT ON COLUMN public.room_geometry_templates.geometry_definition IS
  'JSONB structure containing floor polygon vertices, wall segments, ceiling zones, and metadata.
   This is the core geometric data that defines the room shape.';

COMMENT ON COLUMN public.room_geometry_templates.parameter_config IS
  'JSONB structure defining which dimensions users can customize (e.g., main_width, extension_depth).
   Used to generate dynamic configuration forms in the UI.';

COMMENT ON COLUMN public.room_designs.room_geometry IS
  'Optional JSONB field for complex room shapes. If NULL, room uses simple rectangular dimensions.
   If populated, contains full geometry definition (can be copied from a template and customized).';

-- ============================================================================
-- PART 5: Enable Row Level Security (if not already enabled)
-- ============================================================================

-- Enable RLS on room_geometry_templates (public read, admin write)
ALTER TABLE public.room_geometry_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active templates
DROP POLICY IF EXISTS "Public read access to active templates" ON public.room_geometry_templates;
CREATE POLICY "Public read access to active templates"
  ON public.room_geometry_templates
  FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can read all templates (including inactive)
DROP POLICY IF EXISTS "Authenticated users can read all templates" ON public.room_geometry_templates;
CREATE POLICY "Authenticated users can read all templates"
  ON public.room_geometry_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: Admin insert/update/delete policies should be added separately based on your auth system

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification Query (run this to confirm migration success):
-- SELECT template_name, display_name, category FROM room_geometry_templates ORDER BY sort_order;
