# Advanced Room Dimensions - Proposal
## Date: 2025-10-10

## Executive Summary

**Proposal:** Extend complex room system to support T-shaped, H-shaped, and under-stairs storage rooms with a **wall-count-driven elevation system**.

**Key Insight:** Number of walls = Number of elevation views needed
- Square room: 4 walls → 4 elevation views
- L-shaped room: 6 walls → 6 elevation views
- U-shaped room: 8 walls → 8 elevation views
- T-shaped room: 8 walls → 8 elevation views
- H-shaped room: 10 walls → 10 elevation views
- Under-stairs: 4 walls → 4 elevation views (but with sloped ceiling profile)

---

## The Core Concept

### Traditional Room System (Current)
**Assumption:** All rooms have 4 cardinal walls (North, South, East, West)

**Problem:** Complex rooms don't fit this model
- L-shaped room has 6 walls, not 4
- Trying to map 6 walls to 4 elevation views = confusion
- Interior return walls don't have a "direction"

### Proposed Wall-Count System
**New Assumption:** Rooms have N walls, each wall gets its own elevation view

**How It Works:**

#### Step 1: Room Creation - Define Wall Count
```
User creates room:
1. Choose shape type (Rectangle, L, U, T, H, Custom, Under-stairs)
2. System calculates wall count automatically:
   - Rectangle: 4 walls
   - L-shape: 6 walls
   - U-shape: 8 walls
   - T-shape: 8 walls
   - H-shape: 10 walls
   - Under-stairs: 4 walls (with slope metadata)
3. Define dimensions for that shape type
4. System generates:
   - 3D geometry (floor vertices, wall segments, ceiling)
   - N elevation view profiles (one per wall)
   - Plan view representation
```

#### Step 2: Elevation View Generation
**For each wall segment:**
```typescript
interface ElevationViewProfile {
  wall_id: string;
  wall_number: number; // 1-10 depending on room
  wall_label: string; // "Wall 1", "Wall 2 (Interior Return)", etc.

  // Wall geometry
  wall_length: number; // Calculated from start/end points
  wall_start: [number, number]; // 2D coordinates
  wall_end: [number, number];

  // Height profile (for sloped ceilings)
  height_profile: 'uniform' | 'sloped' | 'stepped';
  min_height: number; // Minimum ceiling height (cm)
  max_height: number; // Maximum ceiling height (cm)

  // For sloped ceilings (under-stairs)
  slope_angle?: number; // Degrees
  slope_direction?: 'left-to-right' | 'right-to-left';

  // Placement constraints
  placement_zones: Array<{
    start_x: number; // Position along wall (cm from left)
    end_x: number;
    max_height: number; // Max element height allowed in this zone
  }>;

  // Visual rendering data for 2D canvas
  ceiling_line_points?: [number, number][]; // For drawing sloped ceiling line
}
```

#### Step 3: Room Data Structure
```typescript
interface RoomGeometry {
  id: string;
  template_name: string;
  shape_type: 'rectangular' | 'l_shaped' | 'u_shaped' | 't_shaped' | 'h_shaped' | 'under_stairs' | 'custom';

  // 3D geometry (existing)
  floor: { vertices: [number, number][]; elevation: number };
  walls: WallSegment[]; // Array length = wall_count
  ceiling: { /* ... */ };
  bounding_box: { /* ... */ };

  // NEW: Wall count and elevation profiles
  wall_count: number; // 4, 6, 8, 10, etc.
  elevation_profiles: ElevationViewProfile[]; // Array length = wall_count

  // NEW: Plan view representation
  plan_view: {
    outline_vertices: [number, number][]; // Simplified outline for 2D canvas
    placement_bounds: [number, number][]; // Valid element placement polygon
    grid_overlay?: GridDefinition; // Optional snap grid
  };

  metadata: {
    total_floor_area: number;
    perimeter_length: number;
    wall_count: number; // <-- KEY: Drives elevation view count
  };
}
```

---

## Example Breakdown: L-Shaped Room

### Wall Count = 6
```
Wall 1: North wall (main section)
Wall 2: East wall (main section)
Wall 3: South wall (short leg)
Wall 4: Interior return wall (inside corner, horizontal)
Wall 5: Interior return wall (inside corner, vertical)
Wall 6: West wall (full height)
```

### Elevation View UI
```
User sees dropdown:
[Select Wall to Edit]
├─ Wall 1 - North (400cm)
├─ Wall 2 - East (300cm)
├─ Wall 3 - South (200cm)
├─ Wall 4 - Interior Return Horizontal (150cm)
├─ Wall 5 - Interior Return Vertical (150cm)
└─ Wall 6 - West (450cm)

When user selects "Wall 4":
→ Elevation canvas renders 150cm wide × 240cm tall view
→ Shows elements placed on Wall 4 only
→ User can place wall cabinets, decorations, etc.
```

---

## Example Breakdown: Under-Stairs Storage Room

### Wall Count = 4 (but with slope!)
```
Wall 1: Front wall (full height 240cm)
Wall 2: Right wall (full height 240cm)
Wall 3: Back wall (short height 80cm)
Wall 4: Left wall (full height 240cm)

Ceiling: SLOPED from front (240cm) to back (80cm)
```

### Elevation Profile for Wall 1 (Front Wall)
```typescript
{
  wall_id: "wall-1",
  wall_number: 1,
  wall_label: "Wall 1 - Front (Full Height)",
  wall_length: 200, // cm
  height_profile: 'uniform',
  min_height: 240,
  max_height: 240,
  placement_zones: [
    { start_x: 0, end_x: 200, max_height: 240 } // Full height available
  ]
}
```

### Elevation Profile for Wall 2 (Right Side Wall)
```typescript
{
  wall_id: "wall-2",
  wall_number: 2,
  wall_label: "Wall 2 - Right Side (Sloped Ceiling)",
  wall_length: 150, // cm (depth of room)
  height_profile: 'sloped',
  min_height: 80,  // Back of room
  max_height: 240, // Front of room
  slope_angle: 45, // degrees (example)
  slope_direction: 'left-to-right', // Front to back

  // KEY: Placement zones with varying height limits
  placement_zones: [
    { start_x: 0,   end_x: 50,  max_height: 240 }, // Front third (full height)
    { start_x: 50,  end_x: 100, max_height: 160 }, // Middle third (medium)
    { start_x: 100, end_x: 150, max_height: 80 },  // Back third (low)
  ],

  // For drawing sloped ceiling line on elevation canvas
  ceiling_line_points: [
    [0, 240],   // Front corner (x=0, y=240cm)
    [150, 80]   // Back corner (x=150, y=80cm)
  ]
}
```

### Visual Rendering in Elevation View
```
User selects "Wall 2 - Right Side":

Elevation canvas shows:

240cm ┌─────────────────╲
      │                  ╲  ← Sloped ceiling line
      │ [Wall Cabinet]    ╲
160cm │                    ╲
      │                     ╲
      │  [Base Cabinet]      ╲
 80cm └──────────────────────╲
      0cm                  150cm

Key:
- Sloped ceiling line drawn using ceiling_line_points
- Placement zones prevent tall elements in low-clearance area
- User can only place 80cm tall cabinets near back wall
```

---

## How This Solves 2D Rendering Challenges

### Problem 1: "How do I render an L-shaped room in plan view?"
**Solution:** Pre-calculated plan_view.outline_vertices
- Stored in database during room creation
- 2D canvas just renders the stored polygon
- No runtime geometry calculations needed

### Problem 2: "How do I know which wall to show in elevation view?"
**Solution:** Wall count drives elevation view count
- User selects from dropdown: "Wall 1", "Wall 2", ..., "Wall N"
- Each wall has its own ElevationViewProfile
- Elevation canvas renders based on selected wall's profile

### Problem 3: "How do I handle sloped ceilings in elevation view?"
**Solution:** height_profile + ceiling_line_points
- Profile defines slope characteristics
- ceiling_line_points provides exact coordinates for drawing
- placement_zones prevent invalid element placement

### Problem 4: "How do I prevent placing tall cabinets under low ceilings?"
**Solution:** placement_zones with max_height constraints
- Each zone along the wall has a height limit
- Element placement checks if element.height <= zone.max_height
- User gets immediate feedback if placement is invalid

---

## Advanced Room Types: Detailed Specs

### T-Shaped Room
```
Floor plan (top view):
        ┌────┐
        │ T1 │ Top section
    ┌───┴────┴───┐
    │     T2     │ Main section
    └────────────┘

Wall count: 8
Walls:
1. Top section - North wall
2. Top section - East wall (short)
3. Top section - West wall (short)
4. Top section - South wall → Interior return left
5. Top section - South wall → Interior return right
6. Main section - East wall
7. Main section - South wall
8. Main section - West wall
```

### H-Shaped Room
```
Floor plan (top view):
    ┌───┐     ┌───┐
    │ H1│     │ H3│ Left & right sections
    │   ├─────┤   │
    │   │ H2  │   │ Center connector
    │   ├─────┤   │
    └───┘     └───┘

Wall count: 10
Walls:
1. Left section - North wall
2. Left section - East wall (top segment)
3. Left section - East wall (bottom segment)
4. Left section - South wall
5. Center connector - North wall (interior)
6. Center connector - South wall (interior)
7. Right section - West wall (top segment)
8. Right section - West wall (bottom segment)
9. Right section - North wall
10. Right section - South wall
```

### Under-Stairs Storage
```
Side view (elevation):
        ╱────────────────
       ╱ Stairs above
      ╱
     ╱  ┌─────────────┐
    ╱   │   Storage   │
   ╱    │    Room     │
  ╱─────┴─────────────┘

Wall count: 4 (but ceiling is sloped)
Special properties:
- ceiling_type: 'sloped'
- slope_angle: Adjustable (30-60 degrees typical)
- min_clearance: 80cm (building code minimum)
- max_height: 240cm (at entrance)
```

---

## Database Schema Updates

### New Columns in room_geometry_templates
```sql
ALTER TABLE room_geometry_templates ADD COLUMN IF NOT EXISTS
  wall_count INTEGER NOT NULL DEFAULT 4,
  elevation_profiles JSONB,
  plan_view JSONB;

-- Example data for L-shaped room
UPDATE room_geometry_templates
SET
  wall_count = 6,
  elevation_profiles = '[
    {
      "wall_id": "wall-1",
      "wall_number": 1,
      "wall_label": "Wall 1 - North",
      "wall_length": 400,
      "height_profile": "uniform",
      "min_height": 240,
      "max_height": 240,
      "placement_zones": [{"start_x": 0, "end_x": 400, "max_height": 240}]
    },
    // ... 5 more walls
  ]'::jsonb,
  plan_view = '{
    "outline_vertices": [[0,0], [400,0], [400,150], [250,150], [250,300], [0,300]],
    "placement_bounds": [[10,10], [390,10], [390,140], [260,140], [260,290], [10,290]]
  }'::jsonb
WHERE template_name = 'l_shaped_standard';
```

---

## UI/UX Flow: Creating an Under-Stairs Room

### Step 1: Shape Selection
```
[Room Shape Selector]
┌─────────────────────────────────┐
│ Choose Room Shape:              │
│                                 │
│ ○ Rectangle    ○ L-Shape        │
│ ○ U-Shape      ○ T-Shape        │
│ ○ H-Shape      ● Under-Stairs   │ ← User selects
│                                 │
│         [Next: Dimensions]      │
└─────────────────────────────────┘
```

### Step 2: Dimension Input (Under-Stairs Specific)
```
[Under-Stairs Storage - Dimensions]
┌─────────────────────────────────────────┐
│ Front Width:    [200] cm                │
│ Depth:          [150] cm                │
│                                         │
│ Height at Front (Max):  [240] cm        │
│ Height at Back (Min):   [80] cm         │
│                                         │
│ Ceiling Slope Angle:    [45]° ────○     │
│                         (30°-60°)       │
│                                         │
│ Preview:                                │
│     ╱──────────── 240cm                 │
│    ╱   ┌──────┐                         │
│   ╱    │      │ 150cm                   │
│  ╱─────┴──────┘                         │
│      200cm      80cm                    │
│                                         │
│    [Cancel]           [Create Room]     │
└─────────────────────────────────────────┘
```

### Step 3: Room Created - System Generates
```typescript
{
  shape_type: 'under_stairs',
  wall_count: 4,
  floor: {
    vertices: [[0,0], [200,0], [200,150], [0,150]]
  },
  walls: [
    { id: 'wall-1', start: [0,0], end: [200,0], height: 240 }, // Front
    { id: 'wall-2', start: [200,0], end: [200,150], height: 240 }, // Right (sloped ceiling)
    { id: 'wall-3', start: [200,150], end: [0,150], height: 80 }, // Back (short)
    { id: 'wall-4', start: [0,150], end: [0,0], height: 240 } // Left (sloped ceiling)
  ],
  ceiling: {
    type: 'sloped',
    slope_angle: 45,
    front_height: 240,
    back_height: 80
  },
  elevation_profiles: [
    // ... Generated automatically based on slope angle
  ]
}
```

---

## Benefits of Wall-Count-Driven System

### 1. **Scalability**
- ✅ Easy to add new room shapes (just define wall count + profiles)
- ✅ No hardcoded assumptions about 4 cardinal directions
- ✅ Supports any polygon shape (limited only by wall count)

### 2. **Clarity**
- ✅ User understands "Wall 1, Wall 2, ..." instead of "North, South, East, West"
- ✅ Interior return walls have explicit identities
- ✅ No confusion about which wall is being edited

### 3. **Flexibility**
- ✅ Each wall can have different height profiles
- ✅ Sloped ceilings handled explicitly
- ✅ Custom placement zones per wall

### 4. **Performance**
- ✅ Pre-calculated elevation profiles (no runtime geometry math)
- ✅ 2D canvas just renders stored data
- ✅ Element placement validation is simple zone checks

### 5. **User Control**
- ✅ Users can manually adjust profiles if auto-generation isn't perfect
- ✅ Can customize placement zones for specific use cases
- ✅ Can override ceiling slopes if needed

---

## Implementation Complexity

### Phase 6A: T-Shaped and H-Shaped Rooms
**Complexity:** 🟡 MEDIUM
**Estimate:** 1-2 weeks
**Work:**
- Add T/H shape types to database
- Calculate wall count automatically (8 for T, 10 for H)
- Generate elevation profiles for each wall
- Update 3D renderer to support these shapes
- Update wall visibility controls (more walls = more buttons?)

### Phase 6B: Under-Stairs Storage
**Complexity:** 🔴 HIGH
**Estimate:** 2-3 weeks
**Work:**
- Add sloped ceiling support to 3D renderer
- Generate elevation profiles with height_profile: 'sloped'
- Calculate placement_zones based on slope angle
- Update elevation view renderer to draw sloped ceiling line
- Add validation: prevent tall elements in low-clearance zones
- Add UI for slope angle adjustment

### Phase 6C: Wall-Count-Driven Elevation System
**Complexity:** 🟡 MEDIUM
**Estimate:** 1-2 weeks
**Work:**
- Refactor elevation view to use wall_number instead of cardinal directions
- Add wall selector dropdown (dynamic based on wall_count)
- Update element placement to check wall_id + placement_zones
- Update 2D canvas to render from plan_view.outline_vertices

---

## Questions & Considerations

### Q1: How do we label walls for users?
**Option A:** Simple numbers
- "Wall 1", "Wall 2", "Wall 3", etc.
- Pro: Simple, unambiguous
- Con: Doesn't convey location

**Option B:** Numbers + descriptions
- "Wall 1 (North)", "Wall 4 (Interior Return)", etc.
- Pro: More context for user
- Con: Requires auto-generation logic

**Recommendation:** Option B with fallback to numbers

---

### Q2: How do we handle wall visibility controls with 10+ walls?
**Current System:** 4 buttons (N/S/E/W)
**Problem:** 10 buttons would be cluttered

**Solution Ideas:**
- **Grouped toggles:** "Perimeter Walls" vs "Interior Walls"
- **Dropdown checklist:** Multi-select dropdown
- **Visual selection:** Click walls directly in 3D view to toggle
- **Smart presets:** "Front View" (hides back walls), "Interior View" (hides all exterior), etc.

**Recommendation:** Grouped toggles + visual selection

---

### Q3: How do we visualize sloped ceilings in 3D?
**Current System:** Flat ceiling using ShapeGeometry
**Problem:** Sloped ceiling needs different geometry

**Solution:**
- Use BufferGeometry with custom vertices for sloped surface
- Or use PlaneGeometry with rotation + positioning
- Or use multiple triangular segments

**Recommendation:** BufferGeometry with custom vertices (most flexible)

---

## Summary

### Your Key Insight (Restated)
> "Number of walls determines number of elevation views needed. If we know wall count upfront, we can generate the correct elevation profiles for each wall."

**This is brilliant because:**
1. ✅ It decouples 2D rendering from complex 3D geometry calculations
2. ✅ It scales to any room shape (T, H, custom, etc.)
3. ✅ It handles edge cases (sloped ceilings, stepped heights, etc.)
4. ✅ It gives users clear, numbered walls instead of confusing cardinal directions
5. ✅ It enables pre-calculation (performance) while maintaining flexibility (customization)

### Next Steps (If We Proceed)
1. **Phase 4:** 2D rendering for L/U shapes (current plan)
2. **Phase 6A:** T/H-shaped rooms with wall-count system
3. **Phase 6B:** Under-stairs storage with sloped ceilings
4. **Phase 6C:** Refactor elevation system to be wall-count-driven

---

**Does this capture your vision?** 🚀
