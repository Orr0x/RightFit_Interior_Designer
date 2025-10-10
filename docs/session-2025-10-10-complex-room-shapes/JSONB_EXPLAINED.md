# JSONB Explained - PostgreSQL's Flexible Data Type

**Date:** 2025-10-10
**Context:** Complex Room Shapes Implementation
**Audience:** Developers new to JSONB

---

## What is JSONB?

**JSONB = JSON Binary**

JSONB is a **PostgreSQL column data type** that stores JSON data in an efficient binary format directly in the database. It is NOT a sync mechanism or file format - it's simply a way to store complex, flexible data structures in a single database column.

---

## Think of JSONB as a Column Type

Just like other PostgreSQL column types:

```sql
-- Traditional column types
name TEXT              -- Stores: "John"
age INTEGER            -- Stores: 25
is_active BOOLEAN      -- Stores: true

-- JSONB column type (what we're using)
room_geometry JSONB    -- Stores: {"shape_type": "l-shape", "floor": {...}, "walls": [...]}
```

**Key Point:** The data lives **entirely in the database**, just like any other column.

---

## Why We Chose JSONB for Room Geometry

### The Problem: Room Geometry is Complex and Variable

Different room shapes need different data structures:

**Rectangle (Simple):**
- 4 vertices: `[[0,0], [600,0], [600,400], [0,400]]`
- 4 walls
- 1 ceiling zone

**L-Shape (More Complex):**
- 6 vertices: `[[0,0], [600,0], [600,400], [300,400], [300,600], [0,600]]`
- 6 walls
- 2 sections (main + extension)

**U-Shape (Even More Complex):**
- 8 vertices
- 8 walls
- 3 sections (left arm + top + right arm)

**Custom Polygons (Future):**
- 10-100 vertices
- Variable walls
- Multiple sections
- Doors, windows, openings

### Traditional Relational Approach Would Require:

```sql
-- Would need 5+ tables with complex relationships
CREATE TABLE rooms (id UUID PRIMARY KEY);

CREATE TABLE floors (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  elevation DECIMAL
);

CREATE TABLE floor_vertices (
  id UUID PRIMARY KEY,
  floor_id UUID REFERENCES floors(id),
  x DECIMAL,
  y DECIMAL,
  vertex_order INTEGER  -- To maintain order
);

CREATE TABLE walls (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  start_x DECIMAL,
  start_y DECIMAL,
  end_x DECIMAL,
  end_y DECIMAL,
  height DECIMAL,
  wall_type TEXT
);

CREATE TABLE ceiling_zones (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  height DECIMAL,
  zone_order INTEGER
);

CREATE TABLE ceiling_zone_vertices (
  id UUID PRIMARY KEY,
  zone_id UUID REFERENCES ceiling_zones(id),
  x DECIMAL,
  y DECIMAL,
  vertex_order INTEGER
);

-- Querying would require complex JOINs:
SELECT
  r.id,
  f.elevation,
  array_agg(fv.x, fv.y ORDER BY fv.vertex_order) AS vertices,
  -- ... more JOINs ...
FROM rooms r
JOIN floors f ON f.room_id = r.id
JOIN floor_vertices fv ON fv.floor_id = f.id
GROUP BY r.id, f.elevation;
```

**Problems:**
- ❌ 5+ tables per room
- ❌ 20-50+ rows per room (for 6-8 vertices)
- ❌ Complex JOIN queries
- ❌ Need migration every time we add a feature
- ❌ Hard to add new properties (doors, windows, materials)
- ❌ Slow queries (many JOINs)

### JSONB Approach (What We Chose):

```sql
-- Single table, single column
CREATE TABLE room_designs (
  id UUID PRIMARY KEY,
  project_id UUID,
  room_type TEXT,
  room_geometry JSONB  -- ← All geometry data in ONE column
);

-- Insert an L-shaped room (single INSERT, one row)
INSERT INTO room_designs (id, room_geometry) VALUES (
  'room-123',
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
      "vertices": [[0,0], [600,0], [600,400], [300,400], [300,600], [0,600]],
      "elevation": 0
    },
    "walls": [
      {"id": "wall_1", "start": [0,0], "end": [600,0], "height": 240, "type": "solid"},
      {"id": "wall_2", "start": [600,0], "end": [600,400], "height": 240, "type": "solid"},
      {"id": "wall_3", "start": [600,400], "end": [300,400], "height": 240, "type": "solid"},
      {"id": "wall_4_internal", "start": [300,400], "end": [300,600], "height": 240, "type": "solid"},
      {"id": "wall_5", "start": [300,600], "end": [0,600], "height": 240, "type": "solid"},
      {"id": "wall_6", "start": [0,600], "end": [0,0], "height": 240, "type": "solid"}
    ],
    "ceiling": {
      "type": "flat",
      "zones": [
        {
          "vertices": [[0,0], [600,0], [600,400], [300,400], [300,600], [0,600]],
          "height": 250,
          "style": "flat"
        }
      ]
    },
    "sections": [
      {
        "id": "main_section",
        "name": "Main Section",
        "type": "primary",
        "vertices": [[0,0], [600,0], [600,400], [0,400]]
      },
      {
        "id": "extension",
        "name": "Extension",
        "type": "secondary",
        "vertices": [[0,400], [300,400], [300,600], [0,600]]
      }
    ],
    "metadata": {
      "total_floor_area": 300000,
      "total_wall_area": 144000,
      "usable_floor_area": 290000
    }
  }'::jsonb
);

-- Simple query (no JOINs!)
SELECT id, room_geometry FROM room_designs WHERE id = 'room-123';
```

**Benefits:**
- ✅ One table, one column
- ✅ One row per room
- ✅ Simple queries (no JOINs)
- ✅ No migrations to add properties
- ✅ Easy to add doors, windows, materials later
- ✅ Fast queries with GIN indexes

---

## How JSONB is Stored

### Storage Format

JSONB is stored in **binary format** for efficiency:

```
PostgreSQL Table: room_designs
Row ID: room-123
Column: room_geometry (JSONB type)

Storage (Binary-encoded JSON):
┌───────────────────────────────────────────────────┐
│ Compressed binary representation of:              │
│ {                                                 │
│   "shape_type": "l-shape",                       │
│   "floor": {                                     │
│     "type": "polygon",                           │
│     "vertices": [[0,0], [600,0], [600,400],     │
│                  [300,400], [300,600], [0,600]], │
│     "elevation": 0                               │
│   },                                             │
│   "walls": [6 wall objects...],                 │
│   "ceiling": {...},                              │
│   "sections": [...],                             │
│   "metadata": {...}                              │
│ }                                                 │
└───────────────────────────────────────────────────┘
       ↑
       Stored IN PostgreSQL database
       (Binary format, NOT a JSON file!)
```

**Key Points:**
- Stored as binary (more efficient than text)
- Parsed once on write, fast to read
- Can be indexed with GIN indexes
- Supports all JSON data types (objects, arrays, strings, numbers, booleans, null)

---

## Querying JSONB Data

PostgreSQL provides powerful operators for querying JSONB:

### Basic Operators

```sql
-- Extract value as text (->> operator)
SELECT room_geometry->>'shape_type' AS shape_type
FROM room_designs
WHERE id = 'room-123';
-- Result: "l-shape"

-- Extract value as JSONB (-> operator)
SELECT room_geometry->'floor'->'vertices' AS vertices
FROM room_designs
WHERE id = 'room-123';
-- Result: [[0,0], [600,0], [600,400], [300,400], [300,600], [0,600]]

-- Check if key exists (? operator)
SELECT * FROM room_designs
WHERE room_geometry ? 'sections';
-- Returns: Rooms that have 'sections' key

-- Contains check (@> operator) - USES INDEX!
SELECT * FROM room_designs
WHERE room_geometry @> '{"shape_type": "l-shape"}'::jsonb;
-- Returns: All L-shaped rooms (very fast with GIN index)

-- Array length
SELECT
  id,
  jsonb_array_length(room_geometry->'floor'->'vertices') AS vertex_count
FROM room_designs;
-- Result: Number of vertices per room
```

### Complex Queries

```sql
-- Get all rooms with more than 4 vertices
SELECT
  id,
  room_geometry->>'shape_type' AS shape,
  jsonb_array_length(room_geometry->'floor'->'vertices') AS vertices
FROM room_designs
WHERE jsonb_array_length(room_geometry->'floor'->'vertices') > 4;

-- Get rooms with ceiling height > 250cm
SELECT * FROM room_designs
WHERE (room_geometry->'ceiling'->'zones'->0->>'height')::numeric > 250;

-- Get rooms by multiple criteria
SELECT * FROM room_designs
WHERE room_geometry @> '{"shape_type": "l-shape"}'::jsonb
  AND (room_geometry->'metadata'->>'total_floor_area')::numeric > 250000;
```

---

## GIN Indexes for Fast Queries

We created GIN (Generalized Inverted Index) indexes on JSONB columns for fast searching:

```sql
-- Created in Phase 1 migration
CREATE INDEX idx_geometry_templates_definition
  ON room_geometry_templates
  USING GIN (geometry_definition);

CREATE INDEX idx_room_designs_geometry
  ON room_designs
  USING GIN (room_geometry);
```

**What GIN indexes do:**
- Make `@>` (contains) queries extremely fast
- Enable fast searches for specific keys/values
- Similar to full-text search indexes

**Performance:**
- Without index: O(n) - scan all rows
- With GIN index: O(log n) - use index tree

**Example:**
```sql
-- This query is FAST (uses GIN index)
SELECT * FROM room_designs
WHERE room_geometry @> '{"shape_type": "l-shape"}'::jsonb;

-- This query is also fast
SELECT * FROM room_geometry_templates
WHERE geometry_definition ? 'sections';
```

---

## TypeScript Type Safety

Even though JSONB is flexible in the database, we maintain strict typing in TypeScript:

### Database (Flexible JSONB):
```sql
-- Any valid JSON structure is accepted
room_geometry JSONB
```

### TypeScript (Strict Types):
```typescript
// We define exact structure in code
interface RoomGeometry {
  shape_type: RoomShapeType;
  bounding_box: BoundingBox;
  floor: FloorGeometry;
  walls: WallSegment[];
  ceiling: CeilingGeometry;
  sections?: RoomSection[];
  metadata: RoomMetadata;
}

interface FloorGeometry {
  type: 'polygon';
  vertices: [number, number][];
  elevation: number;
  material?: string;
}

interface WallSegment {
  id: string;
  start: [number, number];
  end: [number, number];
  height: number;
  thickness?: number;
  type: WallType;
  material?: string;
}

// etc...
```

**Benefits of TypeScript + JSONB:**
- ✅ Database flexibility (JSONB)
- ✅ Code type safety (TypeScript)
- ✅ IDE autocomplete
- ✅ Compile-time error checking
- ✅ Self-documenting code

### In Your Code:

```typescript
// Query database
const { data } = await supabase
  .from('room_designs')
  .select('room_geometry')
  .eq('id', roomId)
  .single();

// TypeScript knows the structure!
const geometry: RoomGeometry = data.room_geometry;

// Full autocomplete and type checking
console.log(geometry.shape_type);  // ✅ TypeScript knows this exists
console.log(geometry.floor.vertices);  // ✅ Knows it's an array of [number, number]
console.log(geometry.walls[0].start);  // ✅ Knows it's [number, number]

// TypeScript will catch errors at compile time
console.log(geometry.invalid_property);  // ❌ TypeScript error!
```

---

## Adding New Properties (No Migrations Needed!)

One of the biggest advantages of JSONB: You can add new properties without database migrations.

### Example: Adding Doors and Windows (Future Feature)

**No Migration Needed:**
```typescript
// Just update the TypeScript interface
interface RoomGeometry {
  shape_type: RoomShapeType;
  floor: FloorGeometry;
  walls: WallSegment[];
  ceiling: CeilingGeometry;
  // NEW: Just add to interface!
  doors?: Door[];
  windows?: Window[];
  materials?: MaterialMap;
}

interface Door {
  id: string;
  wall_id: string;
  position: [number, number];
  width: number;
  height: number;
  type: 'hinged' | 'sliding' | 'pocket';
  swing_direction?: 'left' | 'right';
}

interface Window {
  id: string;
  wall_id: string;
  position: [number, number];
  width: number;
  height: number;
  sill_height: number;
  type: 'casement' | 'sliding' | 'fixed';
}
```

**Insert new room with doors/windows:**
```sql
-- Old rooms without doors/windows still work
-- New rooms can have doors/windows
INSERT INTO room_designs (id, room_geometry) VALUES (
  'room-456',
  '{
    "shape_type": "rectangle",
    "floor": {...},
    "walls": [...],
    "ceiling": {...},
    "doors": [
      {
        "id": "door_1",
        "wall_id": "wall_south",
        "position": [300, 400],
        "width": 90,
        "height": 210,
        "type": "hinged",
        "swing_direction": "right"
      }
    ],
    "windows": [
      {
        "id": "window_1",
        "wall_id": "wall_north",
        "position": [200, 0],
        "width": 120,
        "height": 140,
        "sill_height": 90,
        "type": "casement"
      }
    ]
  }'::jsonb
);
```

**Backward Compatibility:**
- Old rooms without doors/windows: Still work perfectly
- New rooms with doors/windows: Work perfectly
- No migration needed!
- Optional properties in TypeScript (`doors?: Door[]`)

---

## JSONB vs JSON (Text) in PostgreSQL

PostgreSQL has two JSON types:

### JSON (Text Format)
```sql
column_name JSON
```
- Stores as text (slower)
- Preserves formatting and key order
- Slower queries (must parse on every read)
- No indexing support

### JSONB (Binary Format) - What We Use
```sql
column_name JSONB
```
- Stores as binary (faster)
- Does NOT preserve formatting or key order
- Fast queries (pre-parsed)
- Supports GIN indexing
- Supports rich operators (`@>`, `?`, `->`, `->>`)

**We use JSONB because:**
- ✅ Faster queries
- ✅ Indexing support (critical for performance)
- ✅ Rich query operators
- ❌ Don't care about formatting preservation

---

## Real-World Example from Our Database

### What's Actually in the Database

When you query Supabase, here's what happens:

```typescript
// Your code
const { data } = await supabase
  .from('room_geometry_templates')
  .select('template_name, geometry_definition')
  .eq('template_name', 'l-shape-standard')
  .single();

console.log(data);
```

**Result (automatically converted from JSONB to JavaScript object):**
```javascript
{
  template_name: 'l-shape-standard',
  geometry_definition: {
    shape_type: 'l-shape',
    bounding_box: {
      min_x: 0,
      min_y: 0,
      max_x: 600,
      max_y: 600
    },
    floor: {
      type: 'polygon',
      vertices: [
        [0, 0],
        [600, 0],
        [600, 400],
        [300, 400],
        [300, 600],
        [0, 600]
      ],
      elevation: 0,
      material: 'hardwood'
    },
    walls: [
      {
        id: 'wall_1',
        start: [0, 0],
        end: [600, 0],
        height: 240,
        material: 'plaster',
        thickness: 10,
        type: 'solid'
      },
      // ... 5 more walls
    ],
    ceiling: {
      type: 'flat',
      zones: [
        {
          vertices: [[0,0], [600,0], [600,400], [300,400], [300,600], [0,600]],
          height: 250,
          style: 'flat'
        }
      ]
    },
    sections: [
      {
        id: 'main_section',
        name: 'Main Section',
        type: 'primary',
        vertices: [[0,0], [600,0], [600,400], [0,400]]
      },
      {
        id: 'extension',
        name: 'Extension',
        type: 'secondary',
        vertices: [[0,400], [300,400], [300,600], [0,600]]
      }
    ],
    metadata: {
      total_wall_area: 144000,
      total_floor_area: 300000,
      usable_floor_area: 290000
    }
  }
}
```

**Behind the scenes:**
1. PostgreSQL stores this in efficient binary format (JSONB)
2. Supabase client automatically converts JSONB → JavaScript object
3. You work with native JavaScript objects (no parsing needed)
4. TypeScript ensures type safety

---

## Common Misconceptions

### ❌ Misconception 1: "JSONB syncs to JSON files"
**Reality:** JSONB is stored entirely in PostgreSQL. No files involved.

### ❌ Misconception 2: "JSONB means no structure"
**Reality:** We enforce structure with TypeScript interfaces and validation. Database is flexible, code is strict.

### ❌ Misconception 3: "JSONB is slow"
**Reality:** JSONB with GIN indexes is very fast. Often faster than multiple JOINs.

### ❌ Misconception 4: "Can't query inside JSONB"
**Reality:** PostgreSQL has rich JSONB operators. Can query any nested property.

### ❌ Misconception 5: "JSONB breaks normalization rules"
**Reality:** It's a design choice. For complex, flexible data (like geometry), JSONB is often better than over-normalized tables.

---

## When to Use JSONB vs Traditional Tables

### Use JSONB When:
- ✅ Data structure is complex and nested
- ✅ Data structure varies between rows
- ✅ Schema needs to evolve frequently
- ✅ Performance with JOINs is a concern
- ✅ Data is naturally hierarchical (like our room geometry)

### Use Traditional Tables When:
- ✅ Data structure is simple and flat
- ✅ Need referential integrity (foreign keys)
- ✅ Need transactional updates to specific fields
- ✅ Data is frequently updated (not just read)
- ✅ Need to enforce strict database-level constraints

### Our Use Case (Room Geometry):
- Complex nested structure ✅
- Varies by room shape ✅
- Needs to evolve (doors, windows, materials) ✅
- Read-heavy (rendering) ✅
- Naturally hierarchical ✅

**Verdict:** JSONB is the perfect choice! ✅

---

## Performance Considerations

### JSONB Performance Profile

**Fast Operations:**
- ✅ Reads (pre-parsed binary)
- ✅ Indexed searches (`@>` with GIN index)
- ✅ Extracting values (`->`, `->>`)
- ✅ Key existence checks (`?`)

**Slower Operations:**
- ⚠️ Writes (must re-encode entire JSON)
- ⚠️ Updates to nested values (must rewrite entire JSONB)
- ⚠️ Very large JSONB documents (>1MB)

**Our Use Case:**
- Room geometry is read far more than written ✅
- Updates are infrequent (user changes room shape) ✅
- JSONB documents are small (<10KB per room) ✅
- GIN indexes make searches fast ✅

**Result:** Excellent performance for our needs! 📈

---

## Validation Strategy

Even though JSONB is flexible in the database, we validate strictly:

### Database Level (Loose):
```sql
-- PostgreSQL only checks it's valid JSON
room_geometry JSONB  -- Accepts any valid JSON
```

### TypeScript Level (Strict):
```typescript
// Compile-time type checking
const geometry: RoomGeometry = data.room_geometry;
```

### Application Level (Strictest):
```typescript
// Runtime validation
import { GeometryValidator } from '@/utils/GeometryValidator';

const validation = GeometryValidator.validateRoomGeometry(geometry);
if (!validation.valid) {
  throw new Error(`Invalid geometry: ${validation.errors.join(', ')}`);
}
```

**Three-layer validation:**
1. **Database:** Valid JSON structure ✅
2. **TypeScript:** Correct types at compile-time ✅
3. **Validator:** Business logic at runtime (no self-intersections, valid ranges) ✅

---

## Summary

### Key Takeaways

1. **JSONB is a PostgreSQL column type** - Not a sync mechanism or file format
2. **Data is stored in the database** - In efficient binary format
3. **No migrations to add properties** - Just update TypeScript interfaces
4. **Fast queries with GIN indexes** - Special indexes for JSONB
5. **Type-safe in TypeScript** - Flexible in DB, strict in code
6. **Perfect for complex, flexible data** - Like room geometry
7. **Backward compatible** - Old data works with new schema

### Why This Matters for Room Geometry

- ✅ Supports any room shape (rectangle, L, U, T, custom)
- ✅ No migrations when adding doors, windows, materials
- ✅ Fast queries (GIN indexes)
- ✅ Simple to work with (JavaScript objects)
- ✅ Type-safe (TypeScript interfaces)
- ✅ Backward compatible (NULL = simple rectangle)
- ✅ Future-proof (add properties anytime)

### The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL Database (Supabase)                              │
│                                                             │
│  room_designs table:                                        │
│  ┌────────────────────────────────────────────────────┐   │
│  │ id            │ room_type │ room_geometry (JSONB) │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ room-1        │ kitchen   │ NULL                  │   │ ← Simple rectangle
│  │ room-2        │ bedroom   │ NULL                  │   │ ← Simple rectangle
│  │ room-3        │ kitchen   │ {L-shape geometry}    │   │ ← Complex L-shape
│  │ room-4        │ bedroom   │ {U-shape geometry}    │   │ ← Complex U-shape
│  └────────────────────────────────────────────────────┘   │
│                    ↓ Query via Supabase client             │
└────────────────────│───────────────────────────────────────┘
                     │
                     ↓ Automatic conversion (JSONB → JS Object)

┌────────────────────│───────────────────────────────────────┐
│ TypeScript Application                                     │
│                    ↓                                        │
│  const { data } = await supabase.from('room_designs')...  │
│                    ↓                                        │
│  const geometry: RoomGeometry = data.room_geometry;       │
│                    ↓                                        │
│  // Full type safety and autocomplete!                    │
│  geometry.floor.vertices  // [[0,0], [600,0], ...]       │
│  geometry.walls[0].start  // [0, 0]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Further Reading

**PostgreSQL JSONB Documentation:**
- https://www.postgresql.org/docs/current/datatype-json.html
- https://www.postgresql.org/docs/current/functions-json.html

**Supabase JSONB Guide:**
- https://supabase.com/docs/guides/database/json

**When to Use JSONB:**
- https://www.postgresql.org/docs/current/datatype-json.html#JSON-USAGE

---

## Other Areas in the Codebase That Could Benefit from JSONB

While reviewing the codebase, here are areas that could potentially benefit from JSONB columns:

### 1. Component Positioning System (Current Pain Point)

**Current Approach:**
```typescript
// components table has separate columns for positioning
interface Component {
  id: string;
  name: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
  // ... more positioning columns
}
```

**Issues:**
- Many columns for transformation data
- Hard to add new positioning properties (offset, pivot, etc.)
- Need migration to add constraints (min/max rotation)

**JSONB Approach:**
```typescript
interface Component {
  id: string;
  name: string;
  transform: JSONB  // ← Single column for all transformation data
}

// JSONB structure:
{
  "position": { "x": 100, "y": 200, "z": 0 },
  "rotation": { "x": 0, "y": 90, "z": 0 },
  "scale": { "x": 1, "y": 1, "z": 1 },
  "pivot": { "x": 0, "y": 0, "z": 0 },  // Easy to add!
  "offset": { "x": 0, "y": 5, "z": 0 }   // Easy to add!
}
```

**Benefits:**
- ✅ Fewer columns (1 instead of 9+)
- ✅ Easy to add pivot points, offsets, constraints
- ✅ Can add animation data later (keyframes, easing)
- ✅ Cleaner queries

**Migration Difficulty:** Medium (need to migrate existing position data)

---

### 2. Design Elements Storage (Partially Using JSONB)

**Current Approach:**
```typescript
// room_designs.design_elements is already JSONB! ✅
interface RoomDesign {
  id: string;
  design_elements: JSONB  // Array of placed components
}

// Current structure:
design_elements: [
  {
    id: "element-1",
    component_id: "cabinet-1",
    position: { x: 100, y: 200 },
    rotation: 0
  }
]
```

**Opportunity for Improvement:**
```typescript
// Could add more data without migration:
design_elements: [
  {
    id: "element-1",
    component_id: "cabinet-1",
    position: { x: 100, y: 200 },
    rotation: 0,
    // NEW: Add these without migration!
    customizations: {
      color: "#FF5733",
      material: "oak",
      finish: "matte"
    },
    metadata: {
      added_date: "2025-10-10",
      user_notes: "Corner cabinet for pots",
      price_override: 450.00
    }
  }
]
```

**Status:** Already using JSONB ✅ - Just needs TypeScript interfaces extended

---

### 3. Component Configurations/Options

**Current Approach (Not Visible - May Not Exist):**
```sql
-- Possibly separate table for component options?
CREATE TABLE component_options (
  id UUID,
  component_id UUID,
  option_name TEXT,
  option_value TEXT
);
```

**JSONB Approach:**
```typescript
interface Component {
  id: string;
  name: string;
  configuration: JSONB  // ← Store all options in one column
}

// Example: Kitchen cabinet with options
{
  "doors": {
    "count": 2,
    "style": "shaker",
    "hardware": "brushed-nickel",
    "soft_close": true
  },
  "drawers": {
    "count": 3,
    "depth": "full-extension",
    "dividers": true
  },
  "shelves": {
    "count": 2,
    "adjustable": true,
    "material": "melamine"
  },
  "finish": {
    "color": "white",
    "style": "painted",
    "manufacturer": "Farrow & Ball",
    "code": "2006"
  }
}
```

**Benefits:**
- ✅ No need for separate options table
- ✅ Easy to add new component types with different options
- ✅ Each component can have unique configuration schema

---

### 4. Material Library Metadata

**Potential Use Case:**
```sql
-- materials or finishes table
CREATE TABLE materials (
  id UUID,
  name TEXT,
  properties JSONB  -- ← Store all material properties
);
```

**JSONB Structure:**
```json
{
  "type": "paint",
  "manufacturer": "Farrow & Ball",
  "code": "2006",
  "color": {
    "hex": "#FFFFFF",
    "rgb": [255, 255, 255],
    "name": "White Tie"
  },
  "finish": "Estate Emulsion",
  "properties": {
    "coverage": "12 sqm per litre",
    "dry_time": "2-4 hours",
    "coats_required": 2,
    "voc_level": "minimal"
  },
  "pricing": {
    "retail": 45.00,
    "trade": 35.00,
    "currency": "GBP",
    "per_unit": "litre"
  },
  "application": {
    "suitable_for": ["walls", "ceiling"],
    "not_suitable_for": ["exterior", "high-moisture"]
  }
}
```

**Benefits:**
- ✅ Different material types (paint, wood, tile) have different properties
- ✅ Easy to add new properties without migration
- ✅ Structured yet flexible

---

### 5. User Preferences/Settings

**Potential Current Approach:**
```sql
-- Multiple columns for preferences
CREATE TABLE user_preferences (
  user_id UUID,
  theme TEXT,
  units TEXT,
  default_room_type TEXT,
  grid_size INTEGER,
  snap_to_grid BOOLEAN,
  -- ... 20+ preference columns
);
```

**JSONB Approach:**
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY,
  preferences JSONB  -- ← All preferences in one column
);
```

**JSONB Structure:**
```json
{
  "ui": {
    "theme": "dark",
    "sidebar_position": "left",
    "show_grid": true,
    "show_measurements": true
  },
  "defaults": {
    "room_type": "kitchen",
    "units": "metric",
    "currency": "GBP"
  },
  "grid": {
    "size": 10,
    "snap_enabled": true,
    "snap_tolerance": 5
  },
  "camera": {
    "fov": 75,
    "default_view": "perspective",
    "sensitivity": 1.0
  },
  "shortcuts": {
    "toggle_2d": "2",
    "toggle_3d": "3",
    "save": "Ctrl+S"
  }
}
```

**Benefits:**
- ✅ Easy to add new preference categories
- ✅ Users can have different preference structures
- ✅ No migrations when adding features with new settings

---

### 6. Project Metadata/Custom Fields

**Potential Use Case:**
```typescript
interface Project {
  id: string;
  name: string;
  user_id: string;
  metadata: JSONB  // ← Flexible project data
}

// JSONB structure:
{
  "client": {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+44 1234 567890"
  },
  "address": {
    "street": "123 High Street",
    "city": "London",
    "postcode": "SW1A 1AA",
    "country": "UK"
  },
  "budget": {
    "total": 15000,
    "spent": 8500,
    "currency": "GBP"
  },
  "timeline": {
    "start_date": "2025-11-01",
    "completion_date": "2025-12-15",
    "status": "in_progress"
  },
  "tags": ["kitchen", "modern", "budget"],
  "custom_fields": {
    "architect": "Jane Doe Architects",
    "planning_ref": "2025/1234/FUL",
    "building_regs": "BR/2025/5678"
  }
}
```

**Benefits:**
- ✅ Different projects can have different metadata
- ✅ Custom fields without schema changes
- ✅ Easy to add integrations (CRM, accounting software)

---

### 7. Component Constraints/Rules

**Use Case:**
```typescript
interface Component {
  id: string;
  name: string;
  constraints: JSONB  // ← Placement rules
}

// Example: Wall cabinet constraints
{
  "placement": {
    "must_be_on_wall": true,
    "wall_types": ["solid", "plasterboard"],
    "min_height_from_floor": 140,
    "max_height_from_floor": 220,
    "requires_support": true
  },
  "spacing": {
    "min_distance_from_ceiling": 5,
    "min_distance_from_adjacent": 2,
    "clearance_zones": [
      { "direction": "front", "distance": 60 }
    ]
  },
  "dimensions": {
    "width": { "min": 30, "max": 120, "default": 60 },
    "height": { "min": 30, "max": 90, "default": 72 },
    "depth": { "min": 30, "max": 60, "default": 35 }
  },
  "compatibility": {
    "can_stack_on": ["base-cabinet", "drawer-unit"],
    "cannot_be_near": ["sink", "hob"],
    "required_features": ["wall-mounting-bracket"]
  }
}
```

**Benefits:**
- ✅ Complex placement rules without many columns
- ✅ Different components have different constraints
- ✅ Easy to add new constraint types

---

## Summary: Where to Use JSONB

### ✅ Already Using JSONB Well:
1. **room_geometry** - Room shape data ✅
2. **design_elements** - Placed components ✅
3. **room_dimensions** - Room size data (partially) ✅

### 🟡 Could Benefit from JSONB:
1. **Component transformations** (position, rotation, scale) 🟡
2. **Component configurations** (options, settings) 🟡
3. **Material properties** (color, finish, manufacturer data) 🟡
4. **User preferences** (UI settings, defaults) 🟡
5. **Project metadata** (client info, budget, timeline) 🟡
6. **Component constraints** (placement rules, compatibility) 🟡

### Guidelines for When to Add JSONB:

**Consider JSONB When:**
- ✅ Data structure is complex and nested
- ✅ Different rows need different schemas
- ✅ Schema evolves frequently (new features)
- ✅ Data is naturally hierarchical
- ✅ You'd need 5+ related columns

**Stick with Regular Columns When:**
- ✅ Data is simple (single values)
- ✅ Need strict database constraints
- ✅ Frequently filter/sort on the field
- ✅ Need foreign key relationships
- ✅ All rows have same structure

---

## Action Items for Codebase Improvements

**Priority 1 (High Impact, Low Effort):**
1. Extend `design_elements` JSONB with customization data
2. Add TypeScript interfaces for existing JSONB columns

**Priority 2 (Medium Impact, Medium Effort):**
1. Convert component options to JSONB (if separate table exists)
2. Add `user_preferences` JSONB column
3. Add `metadata` JSONB to projects table

**Priority 3 (Lower Priority, Higher Effort):**
1. Refactor component positioning to use transform JSONB
2. Add constraints JSONB to components
3. Migrate material properties to JSONB

**Note:** These are suggestions for future improvements. The current system works well, and these would be optimizations, not critical fixes.

---

**Created:** 2025-10-10
**Updated:** 2025-10-10 (Added codebase opportunities section)
**Part of:** Complex Room Shapes Implementation (Phase 1 & 2)
**Related Docs:** PHASE_1_COMPLETE.md, PHASE_2_COMPLETE.md
