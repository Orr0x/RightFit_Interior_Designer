# Wall-Count Elevation System - Development Plan
**Date:** 2025-10-11
**Status:** 📋 PLANNING - Ready for Implementation
**Approach:** ✅ Incremental, Non-Destructive, Additive

---

## Core Principles: Non-Destructive Development Rules

### 🚨 CRITICAL RULES - MUST FOLLOW

#### Rule 1: Never Delete or Replace Working Code
- ✅ ADD new code alongside existing code
- ❌ DO NOT delete existing cardinal direction logic (front/back/left/right)
- ❌ DO NOT rewrite existing elevation rendering functions
- ✅ USE conditional logic: `if (complex room) { new logic } else { existing logic }`

#### Rule 2: Backward Compatibility is Mandatory
- ✅ Rectangular rooms MUST continue to use 4-view system exactly as they do now
- ✅ All existing tests/screenshots of rectangular rooms must still pass
- ❌ DO NOT change behavior for rooms without `room_geometry`
- ✅ Complex room logic only activates when `roomGeometry && roomGeometry.walls.length > 4`

#### Rule 3: No Database Schema Changes
- ❌ DO NOT modify any database tables
- ❌ DO NOT add new columns
- ❌ DO NOT create new tables
- ✅ USE existing `room_geometry.walls` array (already exists from Phase 1-3)
- ✅ All data needed already exists in the database

#### Rule 4: Minimal Code Changes
- ✅ Target: ~50-75 lines of NEW code total
- ✅ If adding more than 100 lines, STOP and reconsider approach
- ✅ Reuse existing GeometryUtils functions (already written)
- ❌ DO NOT create new service layers, managers, or abstractions

#### Rule 5: Test Existing Functionality First
- ✅ Before ANY code changes, verify rectangular room elevation views work
- ✅ Take screenshots of working state
- ✅ After each change, test rectangular rooms immediately
- ❌ DO NOT proceed if rectangular room behavior changes

#### Rule 6: Additive UI Changes Only
- ✅ ADD wall selector dropdown for complex rooms
- ✅ KEEP existing 4-button layout for rectangular rooms
- ❌ DO NOT remove or hide existing elevation view buttons
- ✅ Show different UI based on room type (conditional rendering)

---

## Development Phases

### Phase 1: Preparation & Verification (30 minutes)
**Goal:** Establish baseline, verify existing system works

#### Task 1.1: Test Existing Rectangular Room Elevation Views
```bash
# Manual testing checklist:
1. Open designer with rectangular kitchen
2. Switch to "Front" elevation view
3. Verify cabinets on north wall (Y≈0) are visible
4. Switch to "Back" elevation view
5. Verify cabinets on south wall (Y≈roomHeight) are visible
6. Switch to "Left" elevation view
7. Verify cabinets on west wall (X≈0) are visible
8. Switch to "Right" elevation view
9. Verify cabinets on east wall (X≈roomWidth) are visible
10. Take 4 screenshots (one per view)
```

**Acceptance Criteria:**
- ✅ All 4 views show correct elements
- ✅ No console errors
- ✅ Screenshots saved to `docs/test-results/baseline-rectangular-elevations/`

**⚠️ BLOCKER:** If any view doesn't work, DO NOT proceed. Fix existing issues first.

---

#### Task 1.2: Test Existing L-Shaped Room (Current Behavior)
```bash
# Manual testing checklist:
1. Open designer with L-shaped kitchen (from Phase 5)
2. Switch to each elevation view (front/back/left/right)
3. Document which walls are visible
4. Identify which walls have NO elevation view
5. Take 4 screenshots
6. Note which elements are invisible
```

**Expected Results:**
- ✅ 4 cardinal views work (perimeter walls visible)
- ❌ Interior return walls have no view (expected limitation)
- ✅ This establishes the problem we're solving

**Deliverable:**
- `docs/test-results/baseline-lshaped-elevations/README.md` documenting current limitations

---

#### Task 1.3: Verify GeometryUtils.pointToLineSegmentDistance Exists
```typescript
// Check that this function exists from Phase 4:
import * as GeometryUtils from '@/utils/GeometryUtils';

// Should have these functions already:
// - pointToLineSegmentDistance(point, lineStart, lineEnd): number
// - isPointInPolygon(point, vertices): boolean
// - calculateBoundingBox(vertices): BoundingBox
```

**Acceptance Criteria:**
- ✅ Function exists and is exported
- ✅ Function has unit tests or documented examples
- ✅ No TypeScript errors when importing

**⚠️ BLOCKER:** If function doesn't exist, implement it first (it's ~15 lines, already designed in Phase 4 docs)

---

### Phase 2: Add Wall-Based Filtering Function (1 hour)
**Goal:** Create the core filtering logic WITHOUT touching existing code

#### Task 2.1: Create getElementsForWall Function
**Location:** `src/services/2d-renderers/elevation-helpers.ts` (NEW FILE)

```typescript
/**
 * Wall-Count Elevation System - Helper Functions
 * Date: 2025-10-11
 *
 * IMPORTANT: This file ADDS functionality for complex rooms.
 * It does NOT replace existing cardinal direction elevation logic.
 */

import type { DesignElement } from '@/types/project';
import type { RoomGeometry, WallSegment } from '@/types/RoomGeometry';
import * as GeometryUtils from '@/utils/GeometryUtils';

/**
 * Filter elements that are "near" a specific wall
 *
 * @param wallId - ID of the wall to filter by
 * @param elements - All design elements in the room
 * @param roomGeometry - Room geometry containing wall definitions
 * @param tolerance - Distance threshold in cm (default 20cm)
 * @returns Elements within tolerance distance of the wall
 *
 * @example
 * // Get elements near Wall 4 (interior return wall)
 * const elementsOnWall4 = getElementsForWall('wall-4', allElements, roomGeometry, 20);
 */
export function getElementsForWall(
  wallId: string,
  elements: DesignElement[],
  roomGeometry: RoomGeometry,
  tolerance: number = 20
): DesignElement[] {
  // Find the wall
  const wall = roomGeometry.walls.find(w => w.id === wallId);
  if (!wall) {
    console.warn(`[getElementsForWall] Wall ${wallId} not found in geometry`);
    return [];
  }

  // Filter elements by distance to wall
  return elements.filter(el => {
    // Calculate perpendicular distance from element center to wall line segment
    const distance = GeometryUtils.pointToLineSegmentDistance(
      [el.x, el.y],
      wall.start,
      wall.end
    );

    // Include element if within tolerance ("near" the wall)
    return distance <= tolerance;
  });
}

/**
 * Calculate wall length for display purposes
 */
export function calculateWallLength(wall: WallSegment): number {
  const dx = wall.end[0] - wall.start[0];
  const dy = wall.end[1] - wall.start[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Determine if wall is on perimeter or interior
 * Uses 5cm tolerance to detect bounding box edges
 */
export function isWallOnPerimeter(
  wall: WallSegment,
  boundingBox: { min_x: number; max_x: number; min_y: number; max_y: number }
): boolean {
  const tolerance = 5; // 5cm tolerance

  // Check if wall start or end point is on bounding box edge
  const startOnEdge =
    Math.abs(wall.start[0] - boundingBox.min_x) < tolerance ||
    Math.abs(wall.start[0] - boundingBox.max_x) < tolerance ||
    Math.abs(wall.start[1] - boundingBox.min_y) < tolerance ||
    Math.abs(wall.start[1] - boundingBox.max_y) < tolerance;

  const endOnEdge =
    Math.abs(wall.end[0] - boundingBox.min_x) < tolerance ||
    Math.abs(wall.end[0] - boundingBox.max_x) < tolerance ||
    Math.abs(wall.end[1] - boundingBox.min_y) < tolerance ||
    Math.abs(wall.end[1] - boundingBox.max_y) < tolerance;

  return startOnEdge && endOnEdge;
}
```

**Acceptance Criteria:**
- ✅ File created with NO modifications to existing files
- ✅ Functions exported and typed correctly
- ✅ JSDoc comments explain purpose
- ✅ No side effects (pure functions only)

**Testing:**
```typescript
// Quick manual test in browser console:
import { getElementsForWall } from '@/services/2d-renderers/elevation-helpers';

// Assuming L-shaped room with 6 walls:
const wall4Elements = getElementsForWall('wall-4', design.elements, roomGeometry);
console.log(`Wall 4 has ${wall4Elements.length} elements`);
```

---

#### Task 2.2: Write Unit Tests (Optional but Recommended)
**Location:** `src/services/2d-renderers/elevation-helpers.test.ts`

```typescript
import { getElementsForWall } from './elevation-helpers';

describe('getElementsForWall', () => {
  test('filters elements within tolerance', () => {
    const wall = {
      id: 'wall-1',
      start: [0, 0],
      end: [400, 0],
      height: 240
    };

    const elements = [
      { id: '1', x: 100, y: 10 }, // 10cm from wall - should be included
      { id: '2', x: 200, y: 50 }, // 50cm from wall - should be excluded
    ];

    const result = getElementsForWall('wall-1', elements, mockGeometry, 20);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});
```

**Note:** If pressed for time, skip unit tests and rely on manual testing. But document test cases.

---

### Phase 3: Add Wall Selector UI (2 hours)
**Goal:** Add dropdown for complex rooms WITHOUT changing rectangular room UI

#### Task 3.1: Add Wall Selector Component (Conditional Rendering)
**Location:** `src/components/designer/DesignCanvas2D.tsx`

**Find this section (around line 52):**
```typescript
active2DView: 'plan' | 'front' | 'back' | 'left' | 'right';
```

**ADD new optional prop (don't remove existing):**
```typescript
active2DView: 'plan' | 'front' | 'back' | 'left' | 'right';
selectedWallId?: string; // NEW: For complex room wall-based elevation views
onWallChange?: (wallId: string) => void; // NEW: Callback when wall selected
```

**Find the view selector UI (search for "Front" button or elevation controls):**

**REPLACE (carefully, preserving existing logic):**
```typescript
// OLD: Hard-coded 4-button layout
<div className="view-selector">
  <Button onClick={() => onViewChange('front')}>Front</Button>
  <Button onClick={() => onViewChange('back')}>Back</Button>
  <Button onClick={() => onViewChange('left')}>Left</Button>
  <Button onClick={() => onViewChange('right')}>Right</Button>
</div>
```

**WITH (conditional rendering):**
```typescript
// NEW: Conditional - wall-based OR cardinal direction
<div className="view-selector">
  {roomGeometry && roomGeometry.walls.length > 4 ? (
    // Complex room: Show wall selector dropdown
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Wall:</span>
      <Select
        value={selectedWallId || roomGeometry.walls[0]?.id}
        onValueChange={onWallChange}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select wall" />
        </SelectTrigger>
        <SelectContent>
          {roomGeometry.walls.map((wall, index) => {
            const length = calculateWallLength(wall);
            const isPerimeter = isWallOnPerimeter(wall, roomGeometry.bounding_box);
            const label = isPerimeter ? 'Perimeter' : 'Interior';

            return (
              <SelectItem key={wall.id} value={wall.id}>
                Wall {index + 1} ({Math.round(length)}cm) - {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  ) : (
    // Simple room: Keep existing 4-button layout (NO CHANGES!)
    <div className="flex gap-1">
      <Button
        variant={active2DView === 'front' ? 'default' : 'outline'}
        onClick={() => onViewChange('front')}
      >
        Front
      </Button>
      <Button
        variant={active2DView === 'back' ? 'default' : 'outline'}
        onClick={() => onViewChange('back')}
      >
        Back
      </Button>
      <Button
        variant={active2DView === 'left' ? 'default' : 'outline'}
        onClick={() => onViewChange('left')}
      >
        Left
      </Button>
      <Button
        variant={active2DView === 'right' ? 'default' : 'outline'}
        onClick={() => onViewChange('right')}
      >
        Right
      </Button>
    </div>
  )}
</div>
```

**Acceptance Criteria:**
- ✅ Rectangular rooms still show 4 buttons (no visual change)
- ✅ L-shaped rooms show dropdown with 6 wall options
- ✅ Dropdown shows wall length and perimeter/interior label
- ✅ No TypeScript errors
- ✅ No layout shifts or UI glitches

**Testing Checklist:**
```bash
1. Test rectangular room → Should see 4 buttons (Front/Back/Left/Right) - NO CHANGE
2. Test L-shaped room → Should see dropdown with 6 walls
3. Test U-shaped room → Should see dropdown with 8 walls
4. Verify dropdown labels are clear (e.g., "Wall 3 (200cm) - Interior")
```

---

#### Task 3.2: Add State Management for Selected Wall
**Location:** Same file, near top of component

**ADD state (don't remove existing state):**
```typescript
const DesignCanvas2D: React.FC<DesignCanvas2DProps> = ({ ... }) => {
  // ... existing state ...

  // NEW: Wall selection state for complex rooms
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);

  // NEW: Auto-select first wall when room geometry loads
  useEffect(() => {
    if (roomGeometry && roomGeometry.walls.length > 0 && !selectedWallId) {
      setSelectedWallId(roomGeometry.walls[0].id);
    }
  }, [roomGeometry, selectedWallId]);

  // ... rest of component ...
};
```

**Acceptance Criteria:**
- ✅ State initializes to null (no impact on rectangular rooms)
- ✅ Auto-selects first wall when L-shaped room loads
- ✅ No errors in console

---

### Phase 4: Integrate Filtering Logic (1 hour)
**Goal:** Use wall-based filtering for complex rooms, keep cardinal filtering for simple rooms

#### Task 4.1: Update Element Filtering in Elevation Render
**Location:** Find where elevation view filters elements (likely in render loop)

**Search for existing code like:**
```typescript
// Current filtering (cardinal direction)
const visibleElements = elements.filter(el => {
  if (active2DView === 'front') {
    return Math.abs(el.y - 0) < 20; // Near north wall
  }
  // ... similar for back, left, right
});
```

**WRAP in conditional (don't delete existing logic):**
```typescript
// Import the new helper at top of file:
import { getElementsForWall } from '@/services/2d-renderers/elevation-helpers';

// ... later in render function ...

// NEW: Conditional filtering based on room type
let visibleElements: DesignElement[];

if (roomGeometry && roomGeometry.walls.length > 4 && selectedWallId) {
  // Complex room: Use wall-based filtering
  console.log(`[DesignCanvas2D] Filtering elements for wall: ${selectedWallId}`);
  visibleElements = getElementsForWall(
    selectedWallId,
    elements,
    roomGeometry,
    20 // tolerance in cm
  );
  console.log(`[DesignCanvas2D] Found ${visibleElements.length} elements near wall`);

} else {
  // Simple room: Use existing cardinal direction filtering (NO CHANGES!)
  visibleElements = elements.filter(el => {
    const tolerance = 20;

    if (active2DView === 'front') {
      return Math.abs(el.y - 0) < tolerance;
    } else if (active2DView === 'back') {
      return Math.abs(el.y - roomDimensions.height) < tolerance;
    } else if (active2DView === 'left') {
      return Math.abs(el.x - 0) < tolerance;
    } else if (active2DView === 'right') {
      return Math.abs(el.x - roomDimensions.width) < tolerance;
    }

    return false;
  });
}

// Rest of rendering code uses visibleElements (no changes needed)
```

**Acceptance Criteria:**
- ✅ Rectangular rooms use original cardinal filtering (unchanged behavior)
- ✅ L-shaped rooms use new wall-based filtering
- ✅ Console logs show correct element counts
- ✅ No TypeScript errors

---

#### Task 4.2: Update Elevation View Rendering
**Location:** Where `renderElevationView` is called

**Current code likely looks like:**
```typescript
renderElevationView(ctx, element, renderDef, active2DView, ...);
```

**MODIFY to pass wall data for complex rooms:**
```typescript
// Determine which "view" to pass to renderer
let elevationView: 'front' | 'back' | 'left' | 'right' | string;

if (roomGeometry && selectedWallId) {
  // Complex room: Pass wall ID (renderer needs to handle this)
  elevationView = selectedWallId;
} else {
  // Simple room: Pass cardinal direction (existing behavior)
  elevationView = active2DView;
}

renderElevationView(ctx, element, renderDef, elevationView, ...);
```

**Note:** This may require small changes to `renderElevationView` signature to accept `string` instead of union type. Mark with TODO if needed.

---

### Phase 5: Testing & Validation (2 hours)
**Goal:** Comprehensive testing to ensure nothing broke

#### Task 5.1: Test Rectangular Rooms (Regression Testing)
```bash
# Critical: Test ALL rectangular room functionality
1. Create new rectangular kitchen (600x400cm)
2. Add 4 cabinets (one on each wall)
3. Switch to Front elevation → Verify north cabinet visible
4. Switch to Back elevation → Verify south cabinet visible
5. Switch to Left elevation → Verify west cabinet visible
6. Switch to Right elevation → Verify east cabinet visible
7. Verify corner cabinet logic still works
8. Take screenshots of all 4 views
9. Compare to baseline screenshots from Phase 1
```

**Acceptance Criteria:**
- ✅ NO visual differences from baseline
- ✅ NO console errors
- ✅ NO behavior changes
- ✅ All 4 views show correct elements

**⚠️ BLOCKER:** If ANY test fails, REVERT changes and debug. Rectangular rooms must not be affected.

---

#### Task 5.2: Test L-Shaped Rooms (New Functionality)
```bash
# Test new wall-based elevation system
1. Open existing L-shaped kitchen from Phase 5
2. Verify wall selector dropdown appears (6 options)
3. Select "Wall 1" → Verify perimeter wall elements visible
4. Select "Wall 2" → Verify perimeter wall elements visible
5. Select "Wall 4 (Interior)" → Verify interior wall elements NOW VISIBLE! 🎉
6. Select "Wall 5 (Interior)" → Verify interior wall elements NOW VISIBLE! 🎉
7. Add cabinet to interior return wall
8. Verify it appears in correct wall elevation view
9. Take screenshots of all 6 wall views
```

**Acceptance Criteria:**
- ✅ All 6 walls have elevation views
- ✅ Interior walls (4 & 5) show elements correctly
- ✅ Elements near wall appear, elements far away don't
- ✅ No console errors
- ✅ Tolerance (20cm) works reasonably

---

#### Task 5.3: Test U-Shaped Rooms (Validation)
```bash
# Test with more complex shape
1. Create U-shaped kitchen from template
2. Verify wall selector shows 8 walls
3. Test random walls to ensure filtering works
4. Add cabinet to each wall, verify it appears in correct elevation view
```

**Acceptance Criteria:**
- ✅ 8 walls listed in dropdown
- ✅ Element filtering works for all walls
- ✅ No performance issues with 8 elevation views

---

#### Task 5.4: Edge Case Testing
```bash
# Test boundary conditions
1. Element exactly on wall (distance = 0) → Should appear
2. Element 19cm from wall → Should appear (within tolerance)
3. Element 21cm from wall → Should NOT appear (outside tolerance)
4. Element in corner (near 2 walls) → Should appear in BOTH wall views
5. Room with no room_geometry → Should use 4-view system (backward compat)
```

---

### Phase 6: Documentation & Cleanup (1 hour)

#### Task 6.1: Create Feature Documentation
**Location:** `docs/2025-10-11-initialization/WALL-COUNT-ELEVATION-COMPLETE.md`

```markdown
# Wall-Count Elevation System - Implementation Complete

**Date:** 2025-10-11
**Status:** ✅ COMPLETE
**Files Changed:** 3
**Lines Added:** ~75
**Lines Removed:** 0 (non-destructive!)

## Summary
Added wall-based elevation views for complex room shapes (L/U/T/H-shaped).
Rectangular rooms continue to use existing 4-view system (backward compatible).

## What Changed
1. NEW: elevation-helpers.ts (helper functions)
2. MODIFIED: DesignCanvas2D.tsx (conditional UI + filtering)
3. MODIFIED: No other files touched

## Testing Results
- ✅ Rectangular rooms: No behavior change (4 views still work)
- ✅ L-shaped rooms: 6 elevation views now available
- ✅ U-shaped rooms: 8 elevation views now available
- ✅ Interior walls: Now visible in elevation views! 🎉

## Screenshots
[Link to test-results folder with before/after images]
```

---

#### Task 6.2: Update Main README (Optional)
**Location:** Root `README.md`

**Add to Features section:**
```markdown
### 🏗️ Complex Room Elevation Views (v3.1)
- **Wall-Based Elevation System**: L/U-shaped rooms show individual elevation views per wall
- **Interior Wall Support**: Return walls and interior sections now have dedicated elevation views
- **Smart Filtering**: Elements shown based on proximity to wall (20cm tolerance)
- **Backward Compatible**: Rectangular rooms continue to use 4-direction elevation system
```

---

#### Task 6.3: Code Comments & Cleanup
```typescript
// Add clear comments at decision points:

// NON-DESTRUCTIVE: Wall-based elevation for complex rooms (2025-10-11)
// This code ADDS functionality without changing rectangular room behavior
if (roomGeometry && roomGeometry.walls.length > 4) {
  // Complex room logic (NEW)
} else {
  // Simple room logic (ORIGINAL - unchanged)
}
```

---

## Success Criteria

### Must Have (Blocking)
- ✅ Rectangular room elevation views work EXACTLY as before
- ✅ L-shaped rooms have 6 elevation views (one per wall)
- ✅ Interior walls are visible in elevation views
- ✅ No console errors for any room type
- ✅ No database changes required
- ✅ Less than 100 lines of code added

### Nice to Have (Non-Blocking)
- ✅ U-shaped room testing complete
- ✅ Unit tests for elevation-helpers
- ✅ Clear wall labels (Perimeter vs Interior)
- ✅ Tolerance configurable (currently hardcoded 20cm)

### Documentation
- ✅ Test screenshots for rectangular rooms (baseline)
- ✅ Test screenshots for L-shaped rooms (new functionality)
- ✅ Feature completion document
- ✅ Code comments explaining conditional logic

---

## Rollback Plan

If something goes wrong:

### Step 1: Identify Scope of Issue
- If rectangular rooms broken → IMMEDIATE ROLLBACK
- If only complex rooms broken → Can debug, less critical

### Step 2: Revert Changes
```bash
# Revert the specific files changed:
git checkout HEAD -- src/components/designer/DesignCanvas2D.tsx
git checkout HEAD -- src/services/2d-renderers/elevation-helpers.ts

# Or revert entire commit:
git revert <commit-hash>
```

### Step 3: Delete New Files
```bash
# If elevation-helpers.ts causing issues:
rm src/services/2d-renderers/elevation-helpers.ts
```

### Step 4: Test Rectangular Rooms
```bash
# Verify rollback successful:
1. Load rectangular kitchen
2. Test all 4 elevation views
3. Confirm original behavior restored
```

---

## Performance Considerations

### Expected Performance
- **Rectangular rooms:** No change (same code path)
- **Complex rooms:** O(n) filtering per wall view (n = number of elements)
- **Typical case:** 50 elements, 6 walls → 300 distance calculations per view change
- **Calculation time:** ~0.1ms per element = ~5ms total (negligible)

### Performance Red Flags
- ❌ Frame rate drops below 60fps
- ❌ Lag when switching wall views
- ❌ Console warnings about slow renders

### Optimization Options (if needed)
1. Memoize wall filtering results
2. Increase tolerance check threshold (early exit)
3. Spatial indexing for very large element counts (100+)

---

## Estimated Timeline

| Phase | Duration | Total |
|-------|----------|-------|
| Phase 1: Preparation | 30 min | 0.5h |
| Phase 2: Filtering Logic | 1 hour | 1.5h |
| Phase 3: UI Changes | 2 hours | 3.5h |
| Phase 4: Integration | 1 hour | 4.5h |
| Phase 5: Testing | 2 hours | 6.5h |
| Phase 6: Documentation | 1 hour | 7.5h |
| **Total** | **7.5 hours** | **~1 day** |

**Buffer:** Add 2 hours for unexpected issues = **~2 days total**

---

## Final Checklist Before Commit

- [ ] Rectangular room elevation views tested (all 4 views work)
- [ ] L-shaped room elevation views tested (all 6 walls visible)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No database changes made
- [ ] Code commented with "NON-DESTRUCTIVE" markers
- [ ] Screenshots taken (baseline + new functionality)
- [ ] Feature documentation written
- [ ] Commit message follows convention:
  ```
  feat(elevation): Add wall-based elevation views for complex rooms

  - Add wall selector dropdown for L/U-shaped rooms (6-8 walls)
  - Keep existing 4-view system for rectangular rooms (backward compatible)
  - Interior walls now visible in elevation views
  - Uses distance-based filtering (20cm tolerance)

  Non-destructive changes (~75 lines added, 0 removed)
  Files: elevation-helpers.ts (NEW), DesignCanvas2D.tsx (MODIFIED)
  ```

---

## Notes for Future Developers

### Why This Approach?
This incremental approach was chosen after a previous attempt over-engineered the solution:
- Previous attempt: 800+ lines, database changes, complete rewrite
- Current approach: ~75 lines, no database changes, additive only

### Key Decisions
1. **Conditional Logic Over Replacement**: Preserves rectangular room behavior
2. **No Database Changes**: Uses existing `room_geometry.walls` array
3. **20cm Tolerance**: Balances user forgiveness vs. precision
4. **Perimeter Detection**: 5cm tolerance to classify walls

### Known Limitations
1. Tolerance is hardcoded (could be user-configurable in future)
2. No collision detection (elements can overlap)
3. No snapping to angled walls yet (Phase 4 future work)

---

**Status:** 📋 READY FOR IMPLEMENTATION
**Review:** Read all rules before starting
**Question:** If unsure, ask before proceeding
