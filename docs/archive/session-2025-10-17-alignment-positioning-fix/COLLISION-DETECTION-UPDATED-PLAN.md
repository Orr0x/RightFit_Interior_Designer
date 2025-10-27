# Collision Detection Implementation Plan - UPDATED

**Date:** 2025-10-17
**Updated Requirement:** Collision detection triggers **on drop/release only**, component moves into place after validation

---

## Key Requirement Change

**Original Plan (INCORRECT):**
- ❌ Real-time collision feedback during drag (red/green outlines while dragging)
- ❌ Prevent drop if collision detected

**Updated Plan (CORRECT):**
- ✅ No collision checking during drag operation
- ✅ Collision detection triggers **on mouse release/drop**
- ✅ Component **moves into place** after validation
- ✅ If collision detected, snap to valid position or return to previous position

---

## User Experience Flow

### Drag & Drop Flow:

1. **User picks up component** (mousedown)
   - Component enters drag state
   - NO collision checking

2. **User drags component** (mousemove)
   - Component follows cursor
   - NO visual feedback about validity
   - NO collision detection running
   - Smooth dragging performance

3. **User releases component** (mouseup)
   - **COLLISION DETECTION TRIGGERS HERE**
   - Check if placement is valid
   - **Outcome A:** Valid placement → component moves into place
   - **Outcome B:** Invalid placement → component snaps to nearest valid position OR returns to original position

4. **Post-drop feedback**
   - Toast message if collision prevented placement
   - Component animates to final position
   - Design state updated

---

## Implementation Plan

### Phase 1: Database Schema ✅ COMPLETE

**Status:** Already implemented and tested
**Files:**
- `ADD_COLLISION_DETECTION_LAYER_FIELDS.sql`
- `POPULATE_REMAINING_COMPONENTS.sql`

**Result:** 176 components with layer metadata

---

### Phase 2: Collision Detection Hook

**File:** `src/hooks/useCollisionDetection.ts`

**Hook Interface:**
```typescript
interface CollisionResult {
  isValid: boolean;          // Can component be placed here?
  collidingElements: DesignElement[];  // What components would it collide with
  reason?: string;           // Human-readable reason
  suggestedPosition?: { x: number; y: number };  // Nearest valid position
}

export const useCollisionDetection = () => {
  const { getComponentMetadata } = useComponentMetadata();

  const validatePlacement = (
    element: DesignElement,
    existingElements: DesignElement[],
    originalPosition?: { x: number; y: number }
  ): CollisionResult => {
    // 1. Get layer info for dropped element
    // 2. Check 2D (X/Y) overlap with all existing elements
    // 3. Check 3D (height) overlap
    // 4. Apply layer overlap rules
    // 5. Return validation result + suggested position if invalid
  };

  return { validatePlacement };
};
```

**Key Functions:**

1. **`validatePlacement()`** - Called on mouseup/drop
   - Takes proposed position
   - Returns validation result
   - Suggests alternative position if needed

2. **`findNearestValidPosition()`** - Helper function
   - If placement invalid, find nearby valid spot
   - Try positions in expanding radius
   - Return original position if no valid spot found

---

### Phase 3: Update DesignCanvas2D.tsx Drop Handling

**File:** `src/components/designer/DesignCanvas2D.tsx`

**Changes to drag/drop logic:**

```typescript
// ===== MOUSEDOWN: Start Drag =====
const handleMouseDown = (e: MouseEvent) => {
  // ... existing logic to identify clicked element

  setDragState({
    isDragging: true,
    draggedElement: element,
    originalPosition: { x: element.x, y: element.y },  // Store original position
    offset: { x: clickX - element.x, y: clickY - element.y }
  });
};

// ===== MOUSEMOVE: Update Position (NO COLLISION CHECK) =====
const handleMouseMove = (e: MouseEvent) => {
  if (!dragState.isDragging) return;

  const roomPos = canvasToRoom(e.offsetX, e.offsetY);

  // Update visual position (no validation)
  setDragState(prev => ({
    ...prev,
    currentPosition: {
      x: roomPos.x - dragState.offset.x,
      y: roomPos.y - dragState.offset.y
    }
  }));

  // Render component at new position
  // NO collision checking here
};

// ===== MOUSEUP: Validate & Place =====
const handleMouseUp = (e: MouseEvent) => {
  if (!dragState.isDragging) return;

  const { draggedElement, currentPosition, originalPosition } = dragState;

  // Create proposed element with new position
  const proposedElement = {
    ...draggedElement,
    x: currentPosition.x,
    y: currentPosition.y
  };

  // **COLLISION DETECTION HAPPENS HERE**
  const validationResult = validatePlacement(
    proposedElement,
    design.elements.filter(el => el.id !== draggedElement.id),
    originalPosition
  );

  if (validationResult.isValid) {
    // ✅ Valid placement - move component to dropped position
    updateElementPosition(draggedElement.id, currentPosition);
    toast.success('Component placed');

  } else {
    // ❌ Invalid placement - snap to nearest valid position (user error handling)

    if (validationResult.suggestedPosition) {
      // Snap to suggested valid position
      updateElementPosition(draggedElement.id, validationResult.suggestedPosition);
      toast.warning(`Position adjusted to avoid collision`);

    } else {
      // No valid position found nearby - return to original position as last resort
      updateElementPosition(draggedElement.id, originalPosition);
      toast.error(`Cannot place here: ${validationResult.reason}. Returned to original position.`);
    }
  }

  // Clear drag state
  setDragState({ isDragging: false, draggedElement: null });
};
```

**Key Points:**
- **No collision checking in `handleMouseMove`** - smooth dragging
- **All validation in `handleMouseUp`** - single check on drop
- **Three possible outcomes:**
  1. Valid → place at dropped position
  2. Invalid with suggestion → snap to suggested position
  3. Invalid without suggestion → return to original position

---

### Phase 4: Snap-to-Valid-Position Logic (Type-Aware Snapping)

**Snapping Rules:**
- **Wall units** → Snap to other **wall units** (align edges)
- **Base units** → Snap to other **base units** (align edges)
- **Tall units** → Snap to **both base AND wall units** (align with either type)
- **Other components** → Avoid collisions only (no magnetic snapping)

**Snap Distance Threshold:**
- Magnetic snapping only activates within **10cm** of a valid snap point
- Beyond 10cm, no snapping occurs (prevents annoying drag-away-from-mouse behavior)
- 10cm is small enough for 30cm wide cabinets (1/3 of cabinet width)
- Configurable via `SNAP_THRESHOLD_CM` constant (can be disabled by setting to 0)

**Algorithm for finding nearest valid position with type-aware snapping:**

```typescript
const SNAP_THRESHOLD_CM = 10;  // Only snap if within 10cm (small enough for 30cm cabinets)

const findNearestValidPosition = (
  element: DesignElement,
  proposedPosition: { x: number; y: number },
  existingElements: DesignElement[],
  maxSearchRadius: number = 100  // cm
): { x: number; y: number } | null => {

  const elementMeta = getComponentMetadata(element.component_id);

  // STEP 1: Try to snap to same-type components (magnetic snapping)
  const snapTargets = getSnapTargets(element, existingElements, elementMeta);

  if (snapTargets.length > 0) {
    // Find closest snap point (only if within threshold distance)
    const snapPosition = findClosestSnapPoint(
      proposedPosition,
      element,
      snapTargets,
      existingElements,
      SNAP_THRESHOLD_CM  // Only snap if within 10cm
    );

    if (snapPosition) {
      return snapPosition;  // Successfully snapped to same-type component
    }
  }

  // STEP 2: If snapping failed, find any valid position nearby
  for (let radius = 10; radius <= maxSearchRadius; radius += 10) {

    // Try 8 directions (N, NE, E, SE, S, SW, W, NW)
    const directions = [
      { dx: 0, dy: -radius },      // N
      { dx: radius, dy: -radius }, // NE
      { dx: radius, dy: 0 },       // E
      { dx: radius, dy: radius },  // SE
      { dx: 0, dy: radius },       // S
      { dx: -radius, dy: radius }, // SW
      { dx: -radius, dy: 0 },      // W
      { dx: -radius, dy: -radius } // NW
    ];

    for (const dir of directions) {
      const testPosition = {
        x: proposedPosition.x + dir.dx,
        y: proposedPosition.y + dir.dy
      };

      const testElement = { ...element, ...testPosition };
      const result = validatePlacement(testElement, existingElements);

      if (result.isValid) {
        return testPosition;  // Found valid position!
      }
    }
  }

  return null;  // No valid position found within radius
};

/**
 * Get components that this element should snap to
 */
const getSnapTargets = (
  element: DesignElement,
  existingElements: DesignElement[],
  elementMeta: ComponentMetadata
): DesignElement[] => {

  const snapTargets: DesignElement[] = [];

  for (const existing of existingElements) {
    const existingMeta = getComponentMetadata(existing.component_id);

    // Wall units snap to wall units
    if (elementMeta.layer_type === 'wall' && existingMeta.layer_type === 'wall') {
      snapTargets.push(existing);
    }

    // Base units snap to base units
    else if (elementMeta.layer_type === 'base' && existingMeta.layer_type === 'base') {
      snapTargets.push(existing);
    }

    // Tall units snap to BOTH base AND wall units
    else if (elementMeta.layer_type === 'tall' &&
            (existingMeta.layer_type === 'base' || existingMeta.layer_type === 'wall')) {
      snapTargets.push(existing);
    }
  }

  return snapTargets;
};

/**
 * Find closest snap point (edge-to-edge alignment)
 * Only snaps if within snapThreshold distance (prevents annoying behavior)
 */
const findClosestSnapPoint = (
  proposedPosition: { x: number; y: number },
  element: DesignElement,
  snapTargets: DesignElement[],
  allElements: DesignElement[],
  snapThreshold: number = 20  // cm - only snap if within this distance
): { x: number; y: number } | null => {

  let closestSnapPosition: { x: number; y: number } | null = null;
  let closestDistance = Infinity;

  for (const target of snapTargets) {
    // Try snapping to all 4 edges of target component
    const snapPositions = [
      // Snap to left edge (align right edge of dragged to left edge of target)
      { x: target.x - element.width, y: target.y },

      // Snap to right edge (align left edge of dragged to right edge of target)
      { x: target.x + target.width, y: target.y },

      // Snap to top edge (align bottom edge of dragged to top edge of target)
      { x: target.x, y: target.y - element.depth },

      // Snap to bottom edge (align top edge of dragged to bottom edge of target)
      { x: target.x, y: target.y + target.depth }
    ];

    for (const snapPos of snapPositions) {
      const distance = Math.sqrt(
        Math.pow(snapPos.x - proposedPosition.x, 2) +
        Math.pow(snapPos.y - proposedPosition.y, 2)
      );

      // IMPORTANT: Only consider snap points within threshold
      if (distance > snapThreshold) continue;

      // Check if this snap position is valid (no collisions)
      const testElement = { ...element, ...snapPos };
      const result = validatePlacement(testElement, allElements);

      if (result.isValid && distance < closestDistance) {
        closestDistance = distance;
        closestSnapPosition = snapPos;
      }
    }
  }

  return closestSnapPosition;  // Returns null if no snap point within threshold
};
```

**Behavior:**
1. **FIRST:** Try to snap to same-type components (wall→wall, base→base, tall→both)
   - Find all same-type components
   - Try aligning to their edges (4 positions per component)
   - **Only snap if within 10cm threshold** (prevents drag-away-from-mouse annoyance, small enough for 30cm cabinets)
   - Use closest valid snap point within threshold
2. **FALLBACK:** If snapping fails (nothing within 10cm), search for any valid position nearby
   - Search in expanding radius (10cm, 20cm, ... 100cm)
   - Try 8 directions per radius
   - Return first valid position found
3. **LAST RESORT:** Return null (component returns to original position)

---

### Phase 5: Optional Visual Feedback (Post-Drop)

**After drop, briefly highlight the collision result:**

```typescript
// After placement decision
if (!validationResult.isValid) {
  // Briefly flash red outline on component
  showCollisionFeedback(draggedElement.id, validationResult.collidingElements);

  setTimeout(() => {
    hideCollisionFeedback();
  }, 1000);  // Remove after 1 second
}
```

**Visual indicators (optional):**
- Red flash on component if collision detected
- Red flash on colliding elements
- Toast message with reason
- Animation of component moving to final position

---

## Collision Detection Logic (Same as Before)

**Layer-based collision rules:**

```typescript
const validatePlacement = (element, existingElements, originalPosition?) => {
  const elementMeta = getComponentMetadata(element.component_id);

  for (const existing of existingElements) {
    const existingMeta = getComponentMetadata(existing.component_id);

    // 1. Check 2D (X/Y) overlap
    const has2DOverlap =
      element.x < existing.x + existing.width &&
      element.x + element.width > existing.x &&
      element.y < existing.y + existing.depth &&
      element.y + element.depth > existing.y;

    if (!has2DOverlap) continue;

    // 2. Check height overlap
    const hasHeightOverlap =
      elementMeta.min_height_cm < existingMeta.max_height_cm &&
      elementMeta.max_height_cm > existingMeta.min_height_cm;

    if (!hasHeightOverlap) continue;  // Different heights OK

    // 3. Check if overlap is allowed by layer rules
    const canOverlap = elementMeta.can_overlap_layers?.includes(existingMeta.layer_type);

    if (!canOverlap) {
      // COLLISION DETECTED
      return {
        isValid: false,
        collidingElements: [existing],
        reason: `${elementMeta.layer_type} cannot overlap ${existingMeta.layer_type}`,
        suggestedPosition: findNearestValidPosition(element, { x: element.x, y: element.y }, existingElements)
      };
    }
  }

  return { isValid: true };
};
```

---

## Benefits of Drop-Time Validation

### Performance ✅
- **No continuous collision checking** during drag
- Single validation on drop
- Smooth, responsive dragging

### User Experience ✅
- **Simpler visual feedback** - no distracting red/green outlines while dragging
- Clear outcome on drop
- Helpful suggestions (snap to valid position)

### Code Simplicity ✅
- Less render complexity in mousemove handler
- Single validation point (easier to debug)
- Cleaner separation of concerns

---

## Edge Cases to Handle

### 1. Component Snaps to Suggested Position (PRIMARY BEHAVIOR)
**Scenario:** User drags component to invalid location or close to valid spot

**Behavior:**
- Component **automatically snaps** to nearest valid position
  - First tries magnetic snap to same-type components (within 10cm)
  - Falls back to collision-free position search (within 100cm radius)
- Toast: "Position adjusted to avoid collision"
- **Purpose:** Allow for user error - be forgiving

### 2. Component Returns to Original Position (FALLBACK ONLY)
**Scenario:** User drags component to invalid location AND no valid position found within 100cm search radius

**Behavior:**
- Component returns to original position (last resort only)
- Toast: "Cannot place here: [reason]. Returned to original position."
- **Purpose:** Prevent component from getting stuck in invalid state

### 3. Overlapping Multiple Components
**Scenario:** Dropped position collides with 3 components

**Behavior:**
- Report first collision found
- Toast: "Cannot overlap wall units (collides with 3 components)"

### 4. Valid Multi-Layer Overlap
**Scenario:** User places wall unit over base unit (allowed)

**Behavior:**
- Component placed successfully
- No toast message (normal operation)

---

## Testing Scenarios

### Test Case 1: Base Unit + Base Unit
**Setup:** Place base cabinet, try to drop another base cabinet on top
**Expected:** ❌ Collision detected, component snaps to nearby valid position or returns to original

### Test Case 2: Wall Unit + Base Unit
**Setup:** Place base cabinet, place wall unit above it (same X/Y)
**Expected:** ✅ Valid placement (wall can overlap base due to height difference)

### Test Case 3: Worktop + Base Unit
**Setup:** Place base cabinet, place worktop on top
**Expected:** ✅ Valid placement (worktop designed to sit on base units)

### Test Case 4: Tall Unit + Wall Unit
**Setup:** Place wall unit, try to place tall unit in same X/Y position
**Expected:** ❌ Collision detected (tall unit goes floor-to-ceiling, blocks everything)

### Test Case 5: Base Unit Magnetic Snapping
**Setup:** Place base cabinet at x=0, drag second base cabinet to x=55 (5cm overlap)
**Expected:** Second base cabinet **snaps to x=60** (aligns edge-to-edge with first cabinet)

### Test Case 6: Wall Unit Magnetic Snapping
**Setup:** Place wall cabinet at y=0, drag second wall cabinet to y=75 (5cm overlap)
**Expected:** Second wall cabinet **snaps to y=80** (aligns edge-to-edge with first cabinet)

### Test Case 7: Tall Unit Snapping to Base Unit
**Setup:** Place base cabinet at x=0, drag tall unit to x=55
**Expected:** Tall unit **snaps to x=60** (aligns with base cabinet edge)

### Test Case 8: Tall Unit Snapping to Wall Unit
**Setup:** Place wall cabinet at x=0, drag tall unit to x=55
**Expected:** Tall unit **snaps to x=60** (aligns with wall cabinet edge)

### Test Case 9: No Magnetic Snapping for Different Types
**Setup:** Place base cabinet at x=0, drag wall cabinet to x=55
**Expected:** Wall cabinet placed at x=55 (no snapping, different types, valid due to height difference)

---

## Implementation Checklist

### Phase 2: Hook
- [ ] Create `src/hooks/useCollisionDetection.ts`
- [ ] Implement `validatePlacement()` function
- [ ] Implement `findNearestValidPosition()` helper
- [ ] Add component metadata fetching
- [ ] Test collision rules with sample data

### Phase 3: Canvas Integration
- [ ] Update `handleMouseDown` to store original position
- [ ] Update `handleMouseMove` to skip collision checking
- [ ] Update `handleMouseUp` to call validation
- [ ] Add snap-to-valid-position logic
- [ ] Add return-to-original-position logic
- [ ] Add toast notifications

### Phase 4: Testing
- [ ] Test base + base collision
- [ ] Test wall + base valid overlap
- [ ] Test worktop + base valid overlap
- [ ] Test tall unit blocking
- [ ] Test snap-to-valid behavior
- [ ] Test return-to-original behavior

---

## Next Steps

1. ✅ **Phase 1 Complete** - Database has layer metadata
2. ⏳ **Phase 2** - Implement `useCollisionDetection` hook
3. ⏳ **Phase 3** - Update DesignCanvas2D drop handling
4. ⏳ **Phase 4** - Add snap-to-valid-position logic
5. ⏳ **Phase 5** - Test with all component combinations

---

## Files to Create/Modify

### New Files:
1. `src/hooks/useCollisionDetection.ts` - Main collision detection logic
2. `src/hooks/useComponentMetadata.ts` - Fetch component layer data from database

### Modified Files:
1. `src/components/designer/DesignCanvas2D.tsx` - Update drop handler
2. `src/hooks/useDesignValidation.ts` - Replace or remove basic 2D collision

---

**Status:** 📋 Plan updated - Ready to implement Phase 2
