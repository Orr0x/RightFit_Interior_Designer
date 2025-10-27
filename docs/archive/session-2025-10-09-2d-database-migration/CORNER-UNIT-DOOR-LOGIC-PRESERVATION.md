# Corner Unit Door Positioning Logic - Critical Preservation Document

**Date:** 2025-10-09
**Status:** ⚠️ CRITICAL - Must be preserved before further cleanup
**User Quote:** *"the elevation corner unit door logic is gone, they just show 2 doors, this can be fixed later but i just dont want to losse the code that made it work, it was a pain to get right."*

---

## Purpose

This document preserves the corner cabinet door positioning logic that was removed during the database migration cleanup. This logic was **difficult to implement correctly** and must not be lost.

---

## Current Problem

After cleanup, corner cabinets in elevation view show **2 doors instead of the proper corner configuration** (1 door + 1 side panel). The database-driven `renderStandardCabinet()` handler doesn't have corner unit awareness.

**Before (Legacy Code):** Corner units showed proper door positioning based on:
- Which corner they're in (front-left, front-right, back-left, back-right)
- Which elevation view is active (front, back, left, right)
- Manual override via `cornerDoorSide` property

**After (Database-Driven):** Corner units render as standard 2-door cabinets with no corner awareness.

---

## Legacy Corner Unit Door Logic (ARCHIVED)

### 1. Corner Detection Functions

#### `isCornerUnit()` - Lines 2442-2461
**Purpose:** Detect if a cabinet is positioned in a room corner

```typescript
const isCornerUnit = (element: DesignElement): {
  isCorner: boolean;
  corner?: 'front-left' | 'front-right' | 'back-left' | 'back-right'
} => {
  const tolerance = 30; // cm tolerance for corner detection

  // Check each corner position
  if (element.x <= tolerance && element.y <= tolerance) {
    return { isCorner: true, corner: 'front-left' };
  }
  if (element.x >= roomDimensions.width - element.width - tolerance && element.y <= tolerance) {
    return { isCorner: true, corner: 'front-right' };
  }
  if (element.x <= tolerance && element.y >= roomDimensions.height - element.height - tolerance) {
    return { isCorner: true, corner: 'back-left' };
  }
  if (element.x >= roomDimensions.width - element.width - tolerance &&
      element.y >= roomDimensions.height - element.height - tolerance) {
    return { isCorner: true, corner: 'back-right' };
  }

  return { isCorner: false };
};
```

**Key Logic:**
- Uses 30cm tolerance for corner detection
- Maps X,Y position to corner quadrant
- Returns corner type for visibility logic

---

#### `isCornerVisibleInView()` - Lines 2489-2506
**Purpose:** Determine if corner unit should be visible in current elevation view

```typescript
const isCornerVisibleInView = (element: DesignElement, view: string): boolean => {
  const cornerInfo = isCornerUnit(element);
  if (!cornerInfo.isCorner) return false;

  switch (cornerInfo.corner) {
    case 'front-left':
      return view === 'front' || view === 'left';
    case 'front-right':
      return view === 'front' || view === 'right';
    case 'back-left':
      return view === 'back' || view === 'left';
    case 'back-right':
      return view === 'back' || view === 'right';
    default:
      return false;
  }
};
```

**Key Logic:**
- Front-left corner: visible in front & left views
- Front-right corner: visible in front & right views
- Back-left corner: visible in back & left views
- Back-right corner: visible in back & right views

---

#### `shouldShowCornerDoorFace()` - Lines 2508-2516
**Purpose:** Always show door face (never back panels)

```typescript
const shouldShowCornerDoorFace = (element: DesignElement, _view: string): boolean => {
  const cornerInfo = isCornerUnit(element);
  if (!cornerInfo.isCorner) return true; // Non-corner units always show door face

  // CRITICAL FIX: Corner units ALWAYS show door + panel in ALL elevation views
  // Never show back panels - always show the door face with proper positioning
  return true;
};
```

**Key Decision:** **Always show door face** - user preference to never show cabinet backs in elevation views.

---

### 2. Corner Door Positioning in `drawCabinetElevationDetails()`

**Location:** Lines 1643-1875 (233 lines)
**Relevant Section:** Lines 1720-1800 (corner-specific logic)

```typescript
// Corner cabinet special handling
const isCornerCabinet = element.id.includes('corner');

if (isCornerCabinet) {
  const cornerInfo = isCornerUnit(element);

  // Determine door side based on:
  // 1. Manual override (element.cornerDoorSide)
  // 2. Room position (centerline detection)
  // 3. Default to 'auto'

  let doorSide: 'left' | 'right' = 'left';

  if (element.cornerDoorSide && element.cornerDoorSide !== 'auto') {
    // User manually specified door side
    doorSide = element.cornerDoorSide;
  } else {
    // Auto-detect based on position
    const roomCenterX = roomDimensions.width / 2;
    const roomCenterY = roomDimensions.height / 2;

    // Corner is on left side of room if X < centerX
    const isLeftSide = element.x < roomCenterX;
    // Corner is on front side of room if Y < centerY
    const isFrontSide = element.y < roomCenterY;

    // Door placement rules:
    // - Front-left corner: door on left
    // - Front-right corner: door on right
    // - Back-left corner: door on left
    // - Back-right corner: door on right

    if (cornerInfo.corner === 'front-left' || cornerInfo.corner === 'back-left') {
      doorSide = 'left';
    } else {
      doorSide = 'right';
    }
  }

  // Calculate door and panel positions
  const doorWidth = elementWidth * 0.5; // Door takes half the space
  const panelWidth = elementWidth * 0.5; // Panel takes other half

  if (doorSide === 'left') {
    // Draw door on left half
    ctx.fillStyle = doorColor;
    ctx.fillRect(xPos + doorInset, doorStartY, doorWidth - doorInset, doorAreaHeight);

    // Draw handle on right edge of door
    ctx.fillStyle = handleColor;
    const handleX = xPos + doorWidth - handleWidth - 2;
    const handleY = doorStartY + doorAreaHeight / 2 - handleHeight / 2;
    ctx.fillRect(handleX, handleY, handleWidth, handleHeight);

    // Draw side panel on right half (lighter color, no handle)
    ctx.fillStyle = '#c9b896'; // Lighter tan for side panel
    ctx.fillRect(xPos + doorWidth + doorGap, doorStartY, panelWidth - doorInset - doorGap, doorAreaHeight);
  } else {
    // Draw side panel on left half (lighter color, no handle)
    ctx.fillStyle = '#c9b896'; // Lighter tan for side panel
    ctx.fillRect(xPos + doorInset, doorStartY, panelWidth - doorInset, doorAreaHeight);

    // Draw door on right half
    ctx.fillStyle = doorColor;
    ctx.fillRect(xPos + panelWidth + doorGap, doorStartY, doorWidth - doorInset - doorGap, doorAreaHeight);

    // Draw handle on left edge of door
    ctx.fillStyle = handleColor;
    const handleX = xPos + panelWidth + doorGap + 2;
    const handleY = doorStartY + doorAreaHeight / 2 - handleHeight / 2;
    ctx.fillRect(handleX, handleY, handleWidth, handleHeight);
  }

  return; // Skip standard door rendering
}

// Standard cabinet rendering continues below...
```

---

## Key Algorithms

### 1. Centerline Detection Algorithm
```typescript
const roomCenterX = roomDimensions.width / 2;
const roomCenterY = roomDimensions.height / 2;
const isLeftSide = element.x < roomCenterX;
const isFrontSide = element.y < roomCenterY;
```

**Purpose:** Automatically determine which side the door should be on based on room position.

### 2. Door Side Priority (3-tier system)
1. **Manual Override:** `element.cornerDoorSide` ('left' | 'right' | 'auto')
2. **Auto-Detection:** Based on corner position (front-left, front-right, etc.)
3. **Default:** 'left' if no other information available

### 3. Visual Rendering Rules
- **Door:** Normal door color (#d2b48c), has handle, takes 50% width
- **Side Panel:** Lighter color (#c9b896), NO handle, takes 50% width
- **Handle Position:**
  - Left door: handle on **right edge** of door
  - Right door: handle on **left edge** of door

---

## Database Migration Strategy

### Option A: Add Corner Configuration to Database

**Pros:**
- Fully database-driven
- Can be configured per component
- Consistent with rest of system

**Cons:**
- Requires database migration
- Adds complexity to component_2d_renders table

**Implementation:**
```typescript
// Add to StandardCabinetData interface in src/types/render2d.ts
interface StandardCabinetData {
  door_count?: number;
  door_style?: 'shaker' | 'flat' | 'glass';
  handle_style?: 'bar' | 'knob' | 'none';
  handle_position?: 'top' | 'center' | 'bottom';
  has_toe_kick?: boolean;
  toe_kick_height?: number;
  drawer_count?: number;
  drawer_heights?: number[];

  // NEW: Corner cabinet configuration
  is_corner?: boolean;
  corner_door_side?: 'left' | 'right' | 'auto';
  corner_panel_style?: 'standard' | 'glass' | 'open';
}
```

**Database Update:**
```sql
-- Add corner configuration to existing corner cabinet records
UPDATE component_2d_renders
SET elevation_data = jsonb_set(
  elevation_data,
  '{is_corner}',
  'true'::jsonb
)
WHERE component_id LIKE '%corner%';

-- Set door side based on component ID
UPDATE component_2d_renders
SET elevation_data = jsonb_set(
  elevation_data,
  '{corner_door_side}',
  '"auto"'::jsonb
)
WHERE component_id LIKE '%corner%';
```

---

### Option B: Keep Corner Logic in Handler Function

**Pros:**
- No database changes required
- Logic stays in code where it's easier to debug
- Can still use database flags if needed later

**Cons:**
- Partially breaks "database-driven" philosophy
- Need to access roomDimensions in handler

**Implementation:**
```typescript
// Modify renderStandardCabinet() in elevation-view-handlers.ts

export function renderStandardCabinet(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: StandardCabinetData,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  roomDimensions?: RoomDimensions, // ADD THIS
  currentView?: string // ADD THIS
): void {
  // Existing configuration...
  const isCorner = data.is_corner ?? element.component_id?.includes('corner');

  if (isCorner && roomDimensions) {
    // Apply corner unit door logic here
    renderCornerCabinetDoors(ctx, element, data, x, y, width, height, zoom, roomDimensions, currentView);
    return;
  }

  // Standard cabinet rendering continues...
}

function renderCornerCabinetDoors(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: StandardCabinetData,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  roomDimensions: RoomDimensions,
  currentView?: string
): void {
  // Implement the archived corner logic here
  // ... (full implementation from archive)
}
```

---

### Option C: Hybrid Approach (RECOMMENDED)

**Pros:**
- Best of both worlds
- Database controls WHAT to render (is_corner flag, door_side preference)
- Code controls HOW to render (positioning algorithm)

**Cons:**
- Requires understanding both database and code

**Implementation:**
1. Add minimal database flags: `is_corner` and `corner_door_side` (optional override)
2. Keep positioning algorithm in code
3. Handler reads flags but implements logic

---

## Migration Plan

### Phase 1: Preserve Current State ✅
- [x] Archive full corner logic in LEGACY-CODE-FULL-ARCHIVE.md
- [x] Create this preservation document
- [x] Document all algorithms and decision points

### Phase 2: Choose Implementation Strategy (TODO)
- [ ] Review options A, B, C with team
- [ ] Decide on database vs code-driven approach
- [ ] Create implementation plan

### Phase 3: Implement Corner Logic (TODO)
- [ ] Update TypeScript interfaces (if database-driven)
- [ ] Modify renderStandardCabinet() handler
- [ ] Create renderCornerCabinetDoors() helper function
- [ ] Add database migration (if needed)

### Phase 4: Test Corner Cabinets (TODO)
- [ ] Test all 4 corner positions (front-left, front-right, back-left, back-right)
- [ ] Test all 4 elevation views (front, back, left, right)
- [ ] Test manual override (`cornerDoorSide` property)
- [ ] Verify door handle positioning
- [ ] Verify side panel color difference

### Phase 5: Resume Cleanup (TODO)
- [ ] Once corner logic is working, continue removing remaining ~780 lines of elevation detail functions
- [ ] Complete cleanup plan from PHASE5-CLEANUP-PLAN.md

---

## Related Files

- **Archive:** `docs/session-2025-10-09-2d-database-migration/LEGACY-CODE-FULL-ARCHIVE.md`
- **Handler:** `src/services/2d-renderers/elevation-view-handlers.ts` (renderStandardCabinet function)
- **Types:** `src/types/render2d.ts` (StandardCabinetData interface)
- **Database:** `component_2d_renders` table (elevation_data JSONB column)
- **Element Type:** `src/types/project.ts` (DesignElement interface has `cornerDoorSide` property)

---

## Testing Checklist

When implementing corner logic, test the following scenarios:

### Corner Positions
- [ ] Front-left corner cabinet
- [ ] Front-right corner cabinet
- [ ] Back-left corner cabinet
- [ ] Back-right corner cabinet

### Elevation Views
- [ ] Front view shows correct door side
- [ ] Back view shows correct door side
- [ ] Left view shows correct door side
- [ ] Right view shows correct door side

### Manual Override
- [ ] Set `cornerDoorSide: 'left'` - door appears on left
- [ ] Set `cornerDoorSide: 'right'` - door appears on right
- [ ] Set `cornerDoorSide: 'auto'` - uses algorithm

### Visual Details
- [ ] Door color is standard tan (#d2b48c)
- [ ] Side panel color is lighter tan (#c9b896)
- [ ] Handle appears on correct edge of door
- [ ] NO handle appears on side panel
- [ ] Door and panel take equal width (50% each)
- [ ] Gap between door and panel is correct

---

## User Requirements Summary

**From User:** *"i just dont want to losse the code that made it work, it was a pain to get right"*

**Key Requirements:**
1. ✅ Code is fully preserved in archives
2. ⏳ Corner logic needs to be re-implemented in database-driven system
3. ⏳ Must work correctly in all 4 corner positions
4. ⏳ Must work correctly in all 4 elevation views
5. ⏳ Must support manual override via `cornerDoorSide` property

**Status:** Preserved and documented. Ready for implementation when user decides on approach.

---

**End of Document**
