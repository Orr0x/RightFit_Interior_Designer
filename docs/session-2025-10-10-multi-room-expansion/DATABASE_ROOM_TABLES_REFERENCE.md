# Database Room Tables Reference

**Date:** 2025-10-10
**Purpose:** Quick reference for all room-related database tables

---

## Room-Related Tables in Database

There are **3 main tables** related to rooms:

---

## 1. `room_designs` - Individual Room Designs

**Purpose:** Stores individual room designs within projects (e.g., "Kitchen in Project A")

**Migration:** `20250908160000_create_multi_room_schema.sql`

**Schema:**
```sql
CREATE TABLE public.room_designs (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  room_type TEXT,              -- 'kitchen', 'bedroom', 'bathroom', etc.
  name TEXT,                    -- Optional custom name
  room_dimensions JSONB,        -- { "width": 600, "height": 400, "ceilingHeight": 250 }
  design_elements JSONB,        -- Array of furniture/components
  design_settings JSONB,        -- Room-specific settings
  wall_height DECIMAL(10,2),    -- Added in phase 1.2 (default: 240cm)
  ceiling_height DECIMAL(10,2), -- Added in phase 1.2 (default: 250cm)
  floor_thickness DECIMAL(10,2),-- Added in phase 1.2 (default: 10cm)
  room_style JSONB,             -- Added in phase 1.2 (styling preferences)
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(project_id, room_type) -- One room per type per project
);
```

**Key Columns:**
- `room_dimensions` - JSONB containing width, height (depth), optional ceilingHeight
- `design_elements` - JSONB array of placed components (furniture, cabinets, etc.)
- `design_settings` - JSONB for room-specific preferences
- `wall_height` - Height of walls for 2D elevation views (240cm default)
- `ceiling_height` - Height of ceiling for 3D rendering (250cm default)
- `room_style` - Additional styling/preferences

**Example Data:**
```json
{
  "id": "uuid-here",
  "project_id": "project-uuid",
  "room_type": "kitchen",
  "name": "Main Kitchen",
  "room_dimensions": {
    "width": 600,
    "height": 400,
    "ceilingHeight": 250
  },
  "design_elements": [
    {
      "id": "elem-1",
      "component_id": "base-cabinet-60",
      "x": 0,
      "y": 0,
      "width": 60,
      "depth": 60,
      "height": 90,
      "rotation": 0
    }
  ],
  "design_settings": {
    "default_wall_height": 240,
    "floor_material": "hardwood",
    "wall_color": "#ffffff"
  },
  "wall_height": 240,
  "ceiling_height": 250,
  "floor_thickness": 10,
  "room_style": {}
}
```

**Indexes:**
- `idx_room_designs_project_id` - Query rooms by project
- `idx_room_designs_room_type` - Filter by room type
- `idx_room_designs_project_room` - Composite index for project+room queries

---

## 2. `room_type_templates` - Room Type Templates

**Purpose:** Templates defining default dimensions and settings for each room type

**Migration:** `20250915000002_phase1_create_room_templates.sql`

**Schema:**
```sql
CREATE TABLE public.room_type_templates (
  id UUID PRIMARY KEY,
  room_type TEXT UNIQUE,           -- 'kitchen', 'bedroom', etc.
  name TEXT,                        -- Display name
  icon_name TEXT,                   -- Icon for UI (e.g., 'ChefHat')
  description TEXT,                 -- Description for users
  default_width DECIMAL(10,2),      -- Default room width (cm)
  default_height DECIMAL(10,2),     -- Default room depth (cm)
  default_wall_height DECIMAL(10,2),-- Default wall height (cm)
  default_ceiling_height DECIMAL(10,2), -- Default ceiling height (cm)
  default_settings JSONB,           -- Default settings for this room type
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Key Columns:**
- `room_type` - Unique identifier (kitchen, bedroom, bathroom, etc.)
- `default_width/height` - Default dimensions when creating new room
- `default_wall_height` - Default wall height for elevation views
- `default_ceiling_height` - Default ceiling height for 3D rendering
- `default_settings` - JSONB with view preferences, etc.

**Example Data:**
```json
{
  "id": "uuid-here",
  "room_type": "kitchen",
  "name": "Kitchen",
  "icon_name": "ChefHat",
  "description": "Kitchen design with cabinets and appliances",
  "default_width": 600,
  "default_height": 400,
  "default_wall_height": 240,
  "default_ceiling_height": 250,
  "default_settings": {
    "default_wall_height": 250,
    "view_preferences": {
      "default_2d_view": "2d",
      "default_2d_mode": "plan",
      "grid_enabled": true,
      "snap_to_grid": true
    }
  }
}
```

**Current Templates:**
1. `kitchen` - 600×400cm, ceiling 250cm
2. `bedroom` - 500×400cm, ceiling 250cm
3. `master-bedroom` - 600×500cm, ceiling 250cm
4. `guest-bedroom` - 450×400cm, ceiling 250cm
5. `bathroom` - 300×250cm, ceiling 250cm
6. `ensuite` - 250×200cm, ceiling 250cm
7. `living-room` - 600×500cm, ceiling 250cm
8. `dining-room` - 500×400cm, ceiling 250cm
9. `office` - 400×350cm, ceiling 250cm
10. `dressing-room` - 350×300cm, ceiling 250cm
11. `utility` - 300×250cm, ceiling 250cm
12. `under-stairs` - 200×150cm, ceiling 220cm (lower!)

**Indexes:**
- `idx_room_templates_room_type` - Query by room type
- `idx_room_templates_settings` - GIN index for JSONB settings queries

---

## 3. `component_room_types` - Component-Room Compatibility

**Purpose:** Junction table defining which components can be used in which room types

**Migration:** `20250912300000_complete_component_system.sql`

**Schema:**
```sql
CREATE TABLE public.component_room_types (
  component_id UUID REFERENCES components(id),
  room_type TEXT,
  PRIMARY KEY (component_id, room_type)
);
```

**Key Columns:**
- `component_id` - References `components.id`
- `room_type` - Room type where component can be used

**Example Data:**
```sql
-- Base cabinet can be used in kitchen and utility
INSERT INTO component_room_types VALUES
  ('uuid-of-base-cabinet-60', 'kitchen'),
  ('uuid-of-base-cabinet-60', 'utility');

-- Bed can be used in bedrooms
INSERT INTO component_room_types VALUES
  ('uuid-of-double-bed', 'bedroom'),
  ('uuid-of-double-bed', 'master-bedroom'),
  ('uuid-of-double-bed', 'guest-bedroom');
```

**Purpose:**
- Filters component catalog per room type
- Ensures users only see relevant components
- Prevents placing kitchen cabinets in bedrooms (unless explicitly allowed)

---

## Supporting Tables (Not Room-Specific, But Related)

### `projects`
**Purpose:** Top-level project container for multiple rooms

```sql
CREATE TABLE public.projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  description TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Relationship:** One project has many `room_designs`

---

### `components`
**Purpose:** Component library (cabinets, appliances, furniture)

```sql
CREATE TABLE public.components (
  id UUID PRIMARY KEY,
  component_id TEXT UNIQUE,
  name TEXT,
  type TEXT,
  width DECIMAL(10,2),
  depth DECIMAL(10,2),
  height DECIMAL(10,2),
  color TEXT,
  category TEXT,
  room_types TEXT[],  -- Array of allowed room types
  -- ... more columns
);
```

**Relationship:** Components can be placed in multiple room types via `component_room_types`

---

## Relationships Diagram

```
projects (1) ----< (many) room_designs
                              |
                              | room_type references
                              v
                    room_type_templates (1)

components (1) ----< (many) component_room_types >---- (many) room_types
```

---

## Common Queries

### Get all rooms in a project
```sql
SELECT * FROM room_designs
WHERE project_id = 'project-uuid'
ORDER BY room_type;
```

### Get template for room type
```sql
SELECT * FROM room_type_templates
WHERE room_type = 'kitchen';
```

### Get components allowed in room type
```sql
SELECT c.*
FROM components c
JOIN component_room_types crt ON c.id = crt.component_id
WHERE crt.room_type = 'kitchen'
ORDER BY c.category, c.name;
```

### Get room with dimensions
```sql
SELECT
  rd.*,
  rd.room_dimensions->>'width' as width_cm,
  rd.room_dimensions->>'height' as depth_cm,
  rd.room_dimensions->>'ceilingHeight' as ceiling_height_cm,
  rd.wall_height,
  rd.ceiling_height
FROM room_designs rd
WHERE id = 'room-uuid';
```

---

## Key Points

1. **room_designs** = Actual room instances (one per project per room type)
2. **room_type_templates** = Blueprints/templates for creating new rooms
3. **component_room_types** = Which components go in which rooms

4. **JSONB Columns:**
   - `room_dimensions` - Flexible dimensions (can add properties without migrations)
   - `design_elements` - Array of placed components
   - `design_settings` - Room preferences
   - `room_style` - Additional styling

5. **Dimension Columns:**
   - `wall_height` (DECIMAL) - For elevation views
   - `ceiling_height` (DECIMAL) - For 3D rendering
   - Both have cm precision and defaults

6. **Future Expansion:**
   - Can add `room_geometry` JSONB column to `room_designs` for complex shapes
   - Can add `room_geometry_templates` table for L-shapes, U-shapes, etc.

---

**Total Room-Related Tables:** 3 main tables
- `room_designs` (stores actual rooms)
- `room_type_templates` (room type defaults)
- `component_room_types` (component-room compatibility)

**Plus 2 supporting tables:**
- `projects` (container for rooms)
- `components` (component library)
