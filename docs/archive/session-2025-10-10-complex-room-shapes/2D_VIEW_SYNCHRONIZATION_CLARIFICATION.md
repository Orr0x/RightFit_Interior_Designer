# 2D View Synchronization - Clarification
## Date: 2025-10-10

## The Question

**User asks:** "Would the components move if changed in plan view or would it be whatever the last 3d view was?"

This is asking about **element synchronization** between views, not about room geometry being static.

---

## Two Different Concepts

### Concept A: Room Geometry (Static)
**What's Static:**
- Room shape (floor polygon, wall positions)
- Wall count (6 walls for L-shape, 8 for U-shape, etc.)
- Elevation profiles (one per wall, stored in database)
- Ceiling slopes (under-stairs angle)

**Example:**
```
L-shaped room template:
- 6 walls defined
- Each wall has elevation profile stored
- Profile includes: length, height, placement zones
- This data is STATIC (doesn't change during design session)
```

**Why Static:**
- Pre-calculated during room creation
- Stored in database
- User doesn't modify wall positions/count during design
- 2D canvas just renders from stored data

---

### Concept B: Element Positions (Dynamic & Synchronized)
**What's Dynamic:**
- Cabinet positions (x, y coordinates)
- Cabinet rotations
- Which wall each element is attached to
- Element visibility in different views

**The Key Question:** When you move a cabinet in plan view, does it update in elevation view?

---

## Three Possible Synchronization Models

### Model 1: Fully Synchronized (Recommended)
**How It Works:**
- Element positions stored in **room coordinates** (x, y, wall_id)
- Moving element in plan view → updates database → all views update
- Moving element in elevation view → updates database → all views update
- 3D view, plan view, and elevation views **all show same data**

**User Experience:**
```
User drags cabinet in plan view:
1. Plan view updates immediately (local state)
2. Position saved to database
3. Elevation view re-renders showing new position
4. 3D view re-renders showing new position
→ All views stay in sync
```

**Example:**
```typescript
// User moves cabinet in plan view
function onDragElement(elementId: string, newX: number, newY: number) {
  // Update local state (immediate visual feedback)
  setElements(prev => prev.map(el =>
    el.id === elementId ? { ...el, x: newX, y: newY } : el
  ));

  // Update database (persists change)
  await updateElementPosition(elementId, newX, newY);

  // Other views automatically re-render because they read from same data source
}
```

**Pros:**
- ✅ User can work in any view and see changes everywhere
- ✅ No confusion about "which view is correct"
- ✅ WYSIWYG (What You See Is What You Get)
- ✅ Standard behavior in most design tools

**Cons:**
- ⚠️ Requires real-time synchronization logic
- ⚠️ More complex state management

---

### Model 2: View-Locked (Isolated Views)
**How It Works:**
- Each view has **independent element positions**
- Plan view elements stored separately from elevation view elements
- 3D view combines data from both
- No automatic synchronization

**User Experience:**
```
User drags cabinet in plan view:
1. Plan view updates
2. Elevation view does NOT update
3. 3D view shows... ??? (conflict between views)
→ Views can become inconsistent
```

**Pros:**
- ✅ Simpler to implement initially
- ✅ No synchronization logic needed

**Cons:**
- ❌ Confusing for users (which view is "real"?)
- ❌ Data integrity issues (conflicting positions)
- ❌ Not how real design software works

**Verdict:** ❌ NOT RECOMMENDED

---

### Model 3: Plan View Master, Elevation View Derived
**How It Works:**
- Plan view stores "master" positions (x, y coordinates)
- Elevation view **calculates** where elements appear based on plan positions
- User can only move elements in plan view
- Elevation view is read-only (or moves are converted to plan coordinates)

**User Experience:**
```
User places cabinet at (100, 50) in plan view:
1. Plan view shows cabinet at (100, 50)
2. System calculates: "This is 100cm from left edge of Wall 3"
3. Elevation view (when Wall 3 selected) shows cabinet at x=100cm
→ Elevation view auto-updates when plan view changes
```

**Detailed Example:**
```typescript
// User drags cabinet in plan view
function onDragElement(elementId: string, planX: number, planY: number) {
  // Store position in plan coordinates
  const element = {
    id: elementId,
    x: planX,
    y: planY,
    wall_id: findNearestWall(planX, planY), // Auto-detect which wall
  };

  saveElement(element);

  // Elevation view automatically derives position:
  // "If element is on Wall 3, show it at position X along that wall"
}

// User tries to drag in elevation view
function onDragElementInElevation(elementId: string, elevX: number) {
  // Convert elevation X coordinate back to plan coordinates
  const element = getElement(elementId);
  const wall = getWall(element.wall_id);

  // Calculate new plan position based on wall geometry
  const newPlanCoords = calculatePlanPosition(wall, elevX);

  // Update in plan coordinates (elevation view will auto-update)
  onDragElement(elementId, newPlanCoords.x, newPlanCoords.y);
}
```

**Pros:**
- ✅ Single source of truth (plan coordinates)
- ✅ No conflicting data
- ✅ Elevation view always accurate
- ✅ Simpler data model

**Cons:**
- ⚠️ Requires coordinate conversion logic
- ⚠️ Elevation view editing is more complex to implement

---

## Recommended Approach: Hybrid Model

### Core Principle
**Plan coordinates are master, but elevation view can also edit**

### Data Structure
```typescript
interface DesignElement {
  id: string;

  // Master position (plan view coordinates)
  x: number; // cm from room origin
  y: number; // cm from room origin

  // Derived from position
  wall_id: string; // Which wall element is attached to
  wall_position: number; // Distance along wall (auto-calculated)

  // Element properties
  width: number;
  height: number;
  depth: number;
  rotation: number; // Degrees

  // 3D properties
  position_3d: { x: number; y: number; z: number }; // Auto-calculated from plan x,y
}
```

### How Views Work Together

#### Plan View (Master)
```typescript
// User drags cabinet in plan view
function handlePlanViewDrag(elementId: string, newX: number, newY: number) {
  // 1. Update plan position (master data)
  updateElement(elementId, { x: newX, y: newY });

  // 2. Auto-calculate derived properties
  const nearestWall = findNearestWall(newX, newY);
  const wallPosition = calculatePositionAlongWall(newX, newY, nearestWall);

  updateElement(elementId, {
    wall_id: nearestWall.id,
    wall_position: wallPosition
  });

  // 3. All other views re-render automatically (they read from same element data)
  // - Elevation view shows element at wallPosition on current wall
  // - 3D view shows element at calculated 3D position
}
```

#### Elevation View (Derived, but can edit)
```typescript
// User drags cabinet in elevation view
function handleElevationViewDrag(elementId: string, newWallX: number) {
  // 1. Get current element and wall
  const element = getElement(elementId);
  const wall = getWall(element.wall_id); // Element stays on same wall

  // 2. Convert elevation X coordinate back to plan coordinates
  const planCoords = calculatePlanCoordinatesFromWall(
    wall,
    newWallX, // New position along wall
    element.depth // Distance from wall (unchanged)
  );

  // 3. Update plan position (master data)
  handlePlanViewDrag(elementId, planCoords.x, planCoords.y);

  // Result: Plan view updates, 3D view updates, elevation view updates
}
```

#### 3D View (Read-only for positions, or can also edit)
```typescript
// User drags cabinet in 3D view
function handle3DViewDrag(elementId: string, new3DPos: { x, y, z }) {
  // 1. Convert 3D position to plan coordinates
  const planCoords = {
    x: new3DPos.x * 100, // Convert meters to cm
    z: new3DPos.z * 100
  };

  // 2. Update through plan view handler
  handlePlanViewDrag(elementId, planCoords.x, planCoords.z);

  // Result: All views update
}
```

---

## To Answer Your Question Directly

### "Would components move if changed in plan view?"
**Answer:** ✅ **YES** - Components would move in ALL views when changed in ANY view.

**How it works:**
1. User moves cabinet in **plan view** → position saved to database
2. **Elevation view** re-renders, shows cabinet at new position on its wall
3. **3D view** re-renders, shows cabinet at new 3D position
4. All views stay synchronized

### "Or would it be whatever the last 3D view was?"
**Answer:** ❌ **NO** - Views don't "freeze" based on last interaction.

**Why not:**
- Views all read from **same element data**
- Changes in any view update the **master data**
- Other views **automatically re-render** with updated data
- This is standard behavior in design software (Figma, AutoCAD, SketchUp, etc.)

---

## Example User Workflow

### Scenario: Placing a Wall Cabinet in L-Shaped Kitchen

**Step 1: User in Plan View**
```
User drags "Wall Cabinet 60cm" from component library
Drops it at position (150, 50) in plan view
System calculates: "Nearest wall is Wall 2 (East), 150cm from corner"

Element saved:
{
  x: 150,
  y: 50,
  wall_id: "wall-2",
  wall_position: 150
}
```

**Step 2: User Switches to Elevation View**
```
User selects "Wall 2" from dropdown
Elevation view renders Wall 2 (300cm long × 240cm tall)
Wall cabinet appears at x=150cm position on that wall
User sees cabinet in correct position
```

**Step 3: User Adjusts Position in Elevation View**
```
User drags cabinet horizontally in elevation view
New position: x=200cm (moved 50cm to the right)

System converts back to plan coordinates:
- Wall 2 runs from (0,0) to (300,0) in plan view
- Position 200cm along wall = plan coordinates (200, 0)

Element updated:
{
  x: 200,
  y: 0,
  wall_id: "wall-2", // Unchanged
  wall_position: 200  // Updated
}

Plan view automatically updates, shows cabinet at new position
3D view automatically updates, shows cabinet moved 50cm right
```

**Step 4: User Switches to 3D Walk Mode**
```
User enables Walk Mode
Walks up to Wall 2
Sees wall cabinet at correct position (200cm from corner)
Position matches what they placed in plan/elevation views
```

---

## What IS Static vs Dynamic

### Static (Room Geometry)
- ❌ Room shape cannot change during design session
- ❌ Wall count cannot change
- ❌ Wall positions cannot move
- ❌ Ceiling slope (under-stairs) cannot change
- ✅ User must create new room to change these

### Dynamic (Element Positions)
- ✅ Elements can be moved in any view
- ✅ Elements can be rotated
- ✅ Elements can be added/removed
- ✅ Changes sync across all views instantly

---

## Technical Implementation Notes

### State Management
```typescript
// Single source of truth
const [elements, setElements] = useState<DesignElement[]>([]);

// Plan view reads from elements
const planViewElements = elements.map(el => ({
  x: el.x,
  y: el.y,
  width: el.width,
  depth: el.depth,
  rotation: el.rotation
}));

// Elevation view reads from same elements, filters by wall
const elevationViewElements = elements
  .filter(el => el.wall_id === selectedWall)
  .map(el => ({
    x: el.wall_position, // Position along wall
    y: el.height_from_floor,
    width: el.width,
    height: el.height
  }));

// 3D view reads from same elements
const threeDViewElements = elements.map(el => ({
  position: [el.x / 100, el.height_from_floor / 100, el.y / 100], // cm to meters
  rotation: [0, el.rotation * Math.PI / 180, 0],
  // ... mesh properties
}));
```

### Synchronization Flow
```
User Action (any view)
    ↓
Update Master Data (x, y, z, rotation)
    ↓
Calculate Derived Properties (wall_id, wall_position)
    ↓
State Update (React setState / Context)
    ↓
All Views Re-render Automatically
```

---

## Summary

### Your Question Answered
**"Would components move if changed in plan view?"**
- ✅ YES, they move in ALL views (plan, elevation, 3D)

**"Or whatever the last 3D view was?"**
- ❌ NO, views don't freeze or become stale
- ✅ All views stay synchronized in real-time

### What "Static" Means
**Static = Room geometry** (walls, shape, dimensions)
- Pre-calculated during room creation
- Stored in database as elevation profiles
- User cannot modify during design session

**Dynamic = Element positions** (cabinets, appliances, etc.)
- User can move/rotate/add/remove anytime
- Changes sync across all views instantly
- Standard behavior in design software

### The Key Innovation
**Wall-count-driven elevation profiles** (your insight!)
- Solves the "how do we render elevation views" problem
- Doesn't affect element synchronization (elements still move freely)
- Just means we have N elevation views instead of 4 cardinal directions

---

**Does this clarify the difference between static room geometry and dynamic element positions?** 🎯
