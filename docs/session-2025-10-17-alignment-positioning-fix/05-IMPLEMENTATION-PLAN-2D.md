# 2D Plan View - Implementation Plan
**Date:** 2025-10-17
**Status:** 📋 READY FOR IMPLEMENTATION
**Priority:** 🔴 CRITICAL - Complete before 3D and elevation views

---

## 🎯 Implementation Order

This document outlines the EXACT order to implement fixes for 2D plan view, ensuring each step builds on the previous.

---

## Phase 1: Configuration Consolidation (6-8 hours)

**Goal:** Single source of truth for all configuration values

### Step 1.1: Database Migration (1 hour)
**File:** `supabase/migrations/20251017000001_add_missing_config.sql`

**Task:** Add missing configuration records

```sql
-- Corner snap threshold (currently only in code)
INSERT INTO app_configuration (config_key, config_name, category, value_numeric, unit, description, min_value, max_value)
VALUES ('corner_snap_threshold', 'Corner Snap Threshold', 'snap', 60, 'cm', 'Distance from corner to trigger corner snapping', 20, 200);

-- Drop boundary tolerance
INSERT INTO app_configuration (config_key, config_name, category, value_numeric, unit, description, min_value, max_value)
VALUES ('drop_boundary_tolerance', 'Drop Boundary Tolerance', 'boundary', 50, 'cm', 'Tolerance for dropping components outside room boundaries', 0, 100);

-- Rotation snap increment
INSERT INTO app_configuration (config_key, config_name, category, value_numeric, unit, description, min_value, max_value)
VALUES ('rotation_snap_increment', 'Rotation Snap Increment', 'rotation', 15, 'degrees', 'Angle increment for rotation snapping', 1, 90);

-- Rotation defaults (JSONB)
INSERT INTO app_configuration (config_key, config_name, category, value_json, unit, description)
VALUES ('rotation_defaults', 'Default Rotation Angles', 'rotation',
  '{"corners":{"top_left":0,"top_right":-270,"bottom_right":-180,"bottom_left":-90},"walls":{"left":0,"right":180,"top":0,"bottom":180}}'::jsonb,
  'degrees', 'Default rotation angles for corners and walls');

-- Z-position defaults (JSONB)
INSERT INTO app_configuration (config_key, config_name, category, value_json, unit, description)
VALUES ('z_position_defaults', 'Default Z Positions', 'positioning',
  '{"base_cabinet":0,"wall_cabinet":140,"cornice":200,"pelmet":140,"counter_top":90,"wall_unit_end_panel":200,"window":90}'::jsonb,
  'cm', 'Default Z positions for component types');
```

**Verify:**
```bash
npx supabase db push
# Check records inserted
psql -c "SELECT config_key, value_numeric, value_json FROM app_configuration WHERE config_key IN ('corner_snap_threshold', 'rotation_defaults', 'z_position_defaults');"
```

**Checkpoint:** ✅ All config values exist in database

---

### Step 1.2: Update ConfigurationService Types (1 hour)
**File:** `src/services/ConfigurationService.ts`

**Add type interface:**
```typescript
export interface AppConfiguration {
  // ... existing types ...

  // NEW: Add missing keys
  corner_snap_threshold: number;
  drop_boundary_tolerance: number;
  rotation_snap_increment: number;
  rotation_defaults: {
    corners: { top_left: number; top_right: number; bottom_right: number; bottom_left: number };
    walls: { left: number; right: number; top: number; bottom: number };
  };
  z_position_defaults: Record<string, number>;
}
```

**Add JSON getter:**
```typescript
static getJSON<K extends keyof AppConfiguration>(key: K): AppConfiguration[K] | null {
  const cached = this.configCache.get(key as string);
  if (!cached) return null;

  // If stored as JSON string, parse it
  if (cached.value && typeof cached.value === 'object') {
    return cached.value as AppConfiguration[K];
  }

  return null;
}
```

**Checkpoint:** ✅ TypeScript compilation succeeds

---

### Step 1.3: Preload Configuration on App Init (30 min)
**File:** `src/main.tsx`

**Replace:**
```typescript
// OLD
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**With:**
```typescript
// NEW
import { ConfigurationService } from '@/services/ConfigurationService';

async function initializeApp() {
  console.log('[App] Preloading configuration...');

  try {
    await ConfigurationService.preload();
    console.log('[App] Configuration loaded successfully');
  } catch (error) {
    console.error('[App] Failed to load configuration:', error);
    // Show error UI or use fallback values
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

initializeApp();
```

**Checkpoint:** ✅ Config preloaded before app renders

---

### Step 1.4: Replace Hardcoded Values in canvasCoordinateIntegration.ts (2 hours)
**File:** `src/utils/canvasCoordinateIntegration.ts`

**Replace all hardcoded values:**

```typescript
// Line 70: Wall clearance
// OLD: const wallClearance = 5;
const wallClearance = ConfigurationService.getSync('wall_clearance', 5);

// Line 131: Corner threshold
// OLD: const cornerThreshold = 60;
const cornerThreshold = ConfigurationService.getSync('corner_snap_threshold', 60);

// Line 211: Snap threshold
// OLD: const snapThreshold = 40;
const snapThreshold = ConfigurationService.getSync('wall_snap_threshold', 40);

// Lines 151-171: Corner rotations
const rotationDefaults = ConfigurationService.getJSON('rotation_defaults');
const corners = [
  {
    name: 'top-left',
    condition: dropX <= cornerThreshold && dropY <= cornerThreshold,
    position: { x: bounds.minX, y: bounds.minY },
    rotation: rotationDefaults?.corners.top_left ?? 0
  },
  {
    name: 'top-right',
    condition: dropX >= (roomBounds.width - cornerThreshold) && dropY <= cornerThreshold,
    position: { x: bounds.maxX, y: bounds.minY },
    rotation: rotationDefaults?.corners.top_right ?? -270
  },
  {
    name: 'bottom-right',
    condition: dropX >= (roomBounds.width - cornerThreshold) && dropY >= (roomBounds.height - cornerThreshold),
    position: { x: bounds.maxX, y: bounds.maxY },
    rotation: rotationDefaults?.corners.bottom_right ?? -180
  },
  {
    name: 'bottom-left',
    condition: dropX <= cornerThreshold && dropY >= (roomBounds.height - cornerThreshold),
    position: { x: bounds.minX, y: bounds.maxY },
    rotation: rotationDefaults?.corners.bottom_left ?? -90
  }
];

// Lines 245-266: Wall rotations
if (leftWallDistance <= snapThreshold && leftWallDistance >= 0) {
  snappedX = bounds.minX;
  snappedToWall = true;
  rotation = rotationDefaults?.walls.left ?? 0;
}
// ... repeat for other walls
```

**Checkpoint:** ✅ No hardcoded positioning values remain

---

### Step 1.5: Replace Hardcoded Values in DesignCanvas2D.tsx (2 hours)
**File:** `src/components/designer/DesignCanvas2D.tsx`

**Replace Z-position defaults:**
```typescript
// Lines 2691-2703: Z-position defaults
// OLD: if-else chain
// NEW:
const zDefaults = ConfigurationService.getJSON('z_position_defaults') || {};
const defaultZ = zDefaults[componentData.type] || 0;
```

**Replace drop boundary check:**
```typescript
// Line 2677
// OLD: if (dropX < -50 || ...)
const tolerance = ConfigurationService.getSync('drop_boundary_tolerance', 50);
if (dropX < -tolerance || dropY < -tolerance ||
    dropX > innerRoomBounds.width + tolerance ||
    dropY > innerRoomBounds.height + tolerance) {
  console.warn('⚠️ Drop cancelled: Component dropped outside inner room boundaries');
  return;
}
```

**Checkpoint:** ✅ All hardcoded values replaced

---

### Step 1.6: Test Configuration Loading (1-2 hours)
**Test Cases:**
- [ ] App starts successfully
- [ ] All config values loaded from database
- [ ] Fallback values work if database unavailable
- [ ] Type checking catches typos in config keys
- [ ] Configuration values match database

**Checkpoint:** ✅ Phase 1 complete, all tests passing

---

## Phase 2: Wall Rendering Fix (2-3 hours)

**Goal:** Replace filled rectangles with boundary lines

### Step 2.1: Remove Rectangle Rendering (30 min)
**File:** `DesignCanvas2D.tsx:1073-1091`

**Delete:**
```typescript
// DELETE lines 1074-1079
ctx.fillStyle = '#e5e5e5';
ctx.fillRect(roomPosition.outerX, roomPosition.outerY, outerWidth, outerHeight);
ctx.fillStyle = '#f9f9f9';
ctx.fillRect(roomPosition.innerX, roomPosition.innerY, innerWidth, innerHeight);
```

**Keep background:**
```typescript
// KEEP background fill for inner room
ctx.fillStyle = '#ffffff';
ctx.fillRect(roomPosition.innerX, roomPosition.innerY, innerWidth, innerHeight);
```

---

### Step 2.2: Add Line-Based Wall Rendering (1 hour)
**Insert after background fill:**

```typescript
// Draw wall boundaries as lines
ctx.strokeStyle = '#333';
ctx.lineWidth = 2;
ctx.setLineDash([]);
ctx.lineCap = 'square';

ctx.strokeRect(roomPosition.innerX, roomPosition.innerY, innerWidth, innerHeight);
```

---

### Step 2.3: Update Complex Room Walls (1 hour)
**For L/U-shaped rooms:**

```typescript
// Complex room wall segments
if (design.room_geometry && design.room_geometry.walls) {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);

  for (const wall of design.room_geometry.walls) {
    const [startX, startY] = wall.start;
    const [endX, endY] = wall.end;
    const start = roomToCanvas(startX, startY);
    const end = roomToCanvas(endX, endY);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
}
```

---

### Step 2.4: Test Wall Rendering (30 min)
**Test Cases:**
- [ ] Rectangular room walls render as lines
- [ ] Complex room walls render correctly
- [ ] No filled rectangles visible
- [ ] Components near walls fully visible
- [ ] Wall lines clear at all zoom levels

**Checkpoint:** ✅ Phase 2 complete, walls as lines

---

## Phase 3: True Center Rotation (6-8 hours)

**Goal:** Components rotate around geometric center

### Step 3.1: Create RotationUtils.ts (2 hours)
**File:** `src/utils/RotationUtils.ts` (NEW)

**Implement:**
- `getRotatedBounds()` - Calculate axis-aligned bounding box
- `getRotatedCorners()` - Get 4 corners of rotated rectangle
- `isPointInRotatedRect()` - Mouse hit detection

(See detailed code in 04-TRUE-CENTER-ROTATION.md)

---

### Step 3.2: Update Rendering Rotation (2 hours)
**File:** `DesignCanvas2D.tsx` (render loop)

**Replace rotation code:**
```typescript
// Calculate center
const centerX = canvasPos.x + (width * zoom) / 2;
const centerY = canvasPos.y + (depth * zoom) / 2;

ctx.save();
ctx.translate(centerX, centerY); // Move to center
ctx.rotate(element.rotation * Math.PI / 180);

// Draw centered on (0,0)
const halfW = (width * zoom) / 2;
const halfD = (depth * zoom) / 2;
ctx.fillRect(-halfW, -halfD, width * zoom, depth * zoom);

ctx.restore();
```

---

### Step 3.3: Update Mouse Hit Detection (1-2 hours)
**File:** `DesignCanvas2D.tsx` (handleMouseDown)

**Replace:**
```typescript
import { isPointInRotatedRect } from '@/utils/RotationUtils';

const centerX = element.x + element.width / 2;
const centerY = element.y + element.depth / 2;

if (isPointInRotatedRect(
  roomPos.x, roomPos.y,
  centerX, centerY,
  element.width, element.depth,
  element.rotation
)) {
  // Component clicked
}
```

---

### Step 3.4: Update Rotation Handles (1-2 hours)
**File:** `DesignCanvas2D.tsx` (drawRotationHandles)

**Use rotated corners:**
```typescript
import { getRotatedCorners } from '@/utils/RotationUtils';

const centerX = element.x + element.width / 2;
const centerY = element.y + element.depth / 2;

const corners = getRotatedCorners(
  centerX, centerY,
  element.width, element.depth,
  element.rotation
);

// Draw handles at actual rotated corners
corners.forEach(corner => {
  const canvasPos = roomToCanvas(corner.x, corner.y);
  ctx.fillRect(canvasPos.x - 4, canvasPos.y - 4, 8, 8);
});
```

---

### Step 3.5: Test Rotation (1-2 hours)
**Test Cases:**
- [ ] 0° rotation works
- [ ] 90° rotation works
- [ ] 180° rotation works
- [ ] 270° rotation works
- [ ] Arbitrary angles work (45°, 135°, etc.)
- [ ] Component doesn't jump during rotation
- [ ] Center stays stable
- [ ] Handles at correct positions

**Checkpoint:** ✅ Phase 3 complete, rotation fixed

---

## Phase 4: Remove Duplicate Snapping (1-2 hours)

**Goal:** Single snapping system, no conflicts

### Step 4.1: Remove Second Snap Call (15 min)
**File:** `DesignCanvas2D.tsx:2746-2749`

**Delete these lines:**
```typescript
// DELETE LINES 2746-2749
const snapped = getSnapPosition(newElement, newElement.x, newElement.y);
newElement.x = snapped.x;
newElement.y = snapped.y;
newElement.rotation = snapped.rotation;
```

**Reason:** `getEnhancedComponentPlacement()` already handles snapping!

---

### Step 4.2: Verify Snapping Still Works (1 hour)
**Test Cases:**
- [ ] Wall snapping works
- [ ] Corner snapping works
- [ ] No double-snapping
- [ ] Position stable after drop
- [ ] Rotation correct after snap

---

### Step 4.3: Optional - Deprecate getSnapPosition (30 min)
**If no other code uses it:**

```typescript
/**
 * @deprecated Use getEnhancedComponentPlacement() instead
 */
function getSnapPosition(...) {
  console.warn('getSnapPosition is deprecated');
  // ...
}
```

**Checkpoint:** ✅ Phase 4 complete, single snapping system

---

## Phase 5: Drag Preview Fix (2-3 hours)

**Goal:** Preview matches final component size

### Step 5.1: Remove 1.15x Scale Hack (30 min)
**File:** `CompactComponentSidebar.tsx:277`

**Delete:**
```typescript
// DELETE LINE 277
const scaleFactor = 1.15;
```

---

### Step 5.2: Calculate Preview from Canvas Zoom (1 hour)
**Pass zoom as prop:**

```typescript
// Designer.tsx
<CompactComponentSidebar
  onAddElement={handleAddElement}
  roomType={currentRoom.type}
  canvasZoom={canvasZoom} // NEW PROP
/>
```

**Use in preview:**
```typescript
// CompactComponentSidebar.tsx
const previewWidth = component.width * canvasZoom;
const previewDepth = component.depth * canvasZoom;
```

---

### Step 5.3: Update Drag Image Center (30 min)
**File:** `CompactComponentSidebar.tsx:349-350`

**Simplify:**
```typescript
const centerX = previewWidth / 2;
const centerY = previewDepth / 2;
e.dataTransfer.setDragImage(dragPreview, centerX, centerY);
```

---

### Step 5.4: Test Drag Preview (1 hour)
**Test Cases:**
- [ ] Preview size matches final size
- [ ] Preview position matches drop position
- [ ] Works at zoom 0.5x
- [ ] Works at zoom 1.0x
- [ ] Works at zoom 2.0x
- [ ] Works at zoom 4.0x

**Checkpoint:** ✅ Phase 5 complete, preview accurate

---

## Phase 6: Integration Testing (4-6 hours)

**Goal:** Everything works together

### Test Matrix

| Test | Zoom | Rotation | Snap | Pass? |
|------|------|----------|------|-------|
| Drop center room | 1.0x | 0° | No | [ ] |
| Drop near left wall | 1.0x | 0° | Yes | [ ] |
| Drop in corner | 1.0x | 0° | Yes | [ ] |
| Rotate component | 1.0x | 90° | No | [ ] |
| Drop zoomed in | 2.0x | 0° | Yes | [ ] |
| Drop zoomed out | 0.5x | 0° | Yes | [ ] |
| Complex room | 1.0x | 0° | Yes | [ ] |

### Regression Tests
- [ ] 3D view not broken
- [ ] Elevation views not broken
- [ ] Component properties work
- [ ] Undo/redo works
- [ ] Save/load works

**Checkpoint:** ✅ Phase 6 complete, all tests passing

---

## 🎯 Definition of Done

### Code Quality
- ✅ No hardcoded values
- ✅ TypeScript compilation passes
- ✅ No console errors
- ✅ Code follows style guide
- ✅ Functions documented

### Functionality
- ✅ Configuration from database
- ✅ Walls render as lines
- ✅ True center rotation
- ✅ Single snapping system
- ✅ Accurate drag preview

### Testing
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ Manual testing complete
- ✅ No regressions

### Documentation
- ✅ Code comments added
- ✅ User-facing changes documented
- ✅ Migration guide written

---

## 📅 Timeline

### Optimistic: 20-25 hours (1 week)
- Phase 1: 6 hours
- Phase 2: 2 hours
- Phase 3: 6 hours
- Phase 4: 1 hour
- Phase 5: 2 hours
- Phase 6: 4 hours

### Realistic: 30-35 hours (1.5 weeks)
- Phase 1: 8 hours
- Phase 2: 3 hours
- Phase 3: 8 hours
- Phase 4: 2 hours
- Phase 5: 3 hours
- Phase 6: 6 hours

### Conservative: 40-45 hours (2 weeks)
- Includes debugging time
- Includes iterations
- Includes documentation

---

**Document Status:** ✅ COMPLETE
**Next Document:** `06-IMPLEMENTATION-PLAN-3D.md`
**Ready to Code:** YES - All planning complete for 2D
