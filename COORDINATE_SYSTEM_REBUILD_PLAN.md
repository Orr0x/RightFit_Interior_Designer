# Coordinate System Rebuild Plan

## 🎯 Goal
Get drag & drop working perfectly with no extra features. Once the foundation is solid, we can add snapping, guides, etc. one at a time.

---

## 📐 Core Architecture

### Single Source of Truth: `CoordinateSystem.ts`
✅ **Created** - Handles all coordinate conversions between:
- **World Space** (cm) - where components live in the room
- **Canvas Space** (px) - where we draw on the HTML canvas
- **Screen Space** (px) - where the mouse cursor is

---

## 🚀 Implementation Phases

### Phase 1: Foundation (CURRENT)
**Status**: ✅ CoordinateSystem class created

**What we have**:
- Clear coordinate space definitions
- Essential conversion functions only
- Well-documented with examples
- No extra features

---

### Phase 2: Minimal Canvas (NEXT)
**Goal**: Draw a room outline and nothing else

**Steps**:
1. Create new canvas component (or clean up existing)
2. Use CoordinateSystem to:
   - Position room outline
   - Handle zoom (just for testing)
3. Test: Room appears at correct size

**Files to modify**:
- `src/components/designer/DesignCanvas2D.tsx` (or create `_v2`)

**What NOT to include yet**:
- Components
- Grid
- Rulers
- Selection
- Drag preview
- Anything else

---

### Phase 3: Component Rendering
**Goal**: Draw components at correct size and position

**Steps**:
1. Add component rendering using CoordinateSystem
2. For each component:
   ```typescript
   // Get canvas position
   const pos = coordinateSystem.worldToCanvas(element.x, element.y);

   // Get canvas size
   const width = coordinateSystem.cmToPixels(element.width);
   const height = coordinateSystem.cmToPixels(element.depth);

   // Draw
   ctx.fillRect(pos.x, pos.y, width, height);
   ```

**Test**: Component appears at correct position and size when zoom changes

**What NOT to include yet**:
- Selection highlights
- Bounding boxes
- Rotation
- Drag and drop
- Anything else

---

### Phase 4: Drag & Drop (THE CRITICAL ONE)
**Goal**: Drag from sidebar, drop on canvas, component appears exactly where dropped

**Steps**:

#### 4.1 Drag Preview
```typescript
// In CompactComponentSidebar.tsx
const handleDragStart = (e: DragEvent, component: Component) => {
  // Create preview using CoordinateSystem
  const width = coordinateSystem.cmToPixels(component.width);
  const height = coordinateSystem.cmToPixels(component.depth);

  // Create drag image at correct size
  dragPreview.style.width = `${width}px`;
  dragPreview.style.height = `${height}px`;
};
```

#### 4.2 Drop Handling
```typescript
// In DesignCanvas2D.tsx
const handleDrop = (e: DragEvent) => {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();

  // Convert mouse position to world coordinates
  const worldPos = coordinateSystem.screenToWorld(
    e.clientX,
    e.clientY,
    rect
  );

  // Create component at this position
  const newComponent = {
    ...component,
    x: worldPos.x,  // cm in room
    y: worldPos.y   // cm in room
  };

  onAddElement(newComponent);
};
```

**Test**:
- Drag preview appears at correct size
- When dropped, component appears exactly where preview was
- Works at different zoom levels

**What NOT to include yet**:
- Snapping
- Guides
- Rotation
- Wall detection
- Anything else

---

### Phase 5: Selection (After drag & drop works)
**Goal**: Click component to select it

**Steps**:
1. Add click detection using CoordinateSystem
2. Draw selection highlight (simple rectangle)
3. No bounding box handles yet

---

### Phase 6: Bounding Box (After selection works)
**Goal**: Show selection handles at correct positions

**Steps**:
1. Calculate handle positions using CoordinateSystem
2. Draw handles
3. Test: Handles appear at component corners exactly

---

### Phase 7: Additional Features (One at a time)
Only add these AFTER drag & drop is perfect:
- Snapping to walls
- Snapping to other components
- Snap guides
- Grid snapping
- Rotation
- Rulers
- Tape measure
- etc.

---

## 🔑 Key Principles

1. **One thing at a time**: Don't move to next phase until current phase is perfect
2. **Use CoordinateSystem for EVERYTHING**: Never do coordinate math anywhere else
3. **Test at multiple zoom levels**: If it works at 100% but breaks at 150%, it's broken
4. **No "temporary" workarounds**: If something doesn't work, fix the root cause
5. **Keep it simple**: Resist the urge to add features until foundation is solid

---

## 🧪 Testing Strategy

For each phase:
1. Test at zoom 100%
2. Test at zoom 50%
3. Test at zoom 200%
4. Pan the view and test again
5. Resize browser window and test again

If ANY test fails, don't move forward.

---

## 📊 Success Criteria

**Drag & Drop is DONE when**:
- ✅ Drag preview size matches dropped component size
- ✅ Drop position matches where preview appeared
- ✅ Works perfectly at any zoom level (50% to 400%)
- ✅ Works after panning the view
- ✅ No "close enough" - must be pixel-perfect
- ✅ Code is clean and uses only CoordinateSystem

---

## 🚫 Things to AVOID

- ❌ Adding features before drag & drop works
- ❌ Multiple scale factors in different files
- ❌ Coordinate math outside CoordinateSystem
- ❌ "Quick fixes" that don't use the coordinate system
- ❌ Moving forward when tests fail

---

## Next Steps

1. Review this plan
2. Decide: Clean up existing canvas or create new one?
3. Start Phase 2: Draw room outline only
4. Test thoroughly before moving to Phase 3
