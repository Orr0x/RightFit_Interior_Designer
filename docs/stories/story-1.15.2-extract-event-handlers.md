# Story 1.15.2: Extract Event Handlers to InteractionHandler Module

**Status**: 📋 **READY FOR WORK** (After Story 1.15.1)
**Parent**: Story 1.15 - Refactor DesignCanvas2D into Modular Components
**Priority**: P2
**Estimated Effort**: 6-8 hours
**Risk Level**: High
**Created**: 2025-10-27

## User Story

As a developer,
I want event handlers extracted to a separate module,
so that interaction logic is separate from rendering and state management.

## Dependencies

- ✅ Story 1.15 - Rendering modules created
- ⏳ Story 1.15.1 - Module integration complete

## Context

DesignCanvas2D has ~1,000 lines of event handler code (mouse, touch, drag, drop, selection). This story extracts this logic to an InteractionHandler module, reducing DesignCanvas2D to ~1,500 lines.

## Acceptance Criteria

1. Create `src/components/designer/canvas/InteractionHandler.ts`
2. Extract mouse event handlers (`handleMouseDown`, `handleMouseMove`, `handleMouseUp`)
3. Extract touch event handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`)
4. Extract drag and drop logic
5. Extract selection logic
6. Extract context menu handling
7. Maintain all event flow integrity
8. DesignCanvas2D.tsx reduced to ~1,500 lines (46% reduction from 2,772)
9. All interactions work correctly (manual testing)

## Technical Approach

### Phase 1: Design Module Interface (1 hour)
- Define `InteractionHandler` class or functions
- Determine what state/callbacks need to be passed
- Create TypeScript interfaces

### Phase 2: Extract Mouse Handlers (2 hours)
- Extract `handleMouseDown()`
- Extract `handleMouseMove()`
- Extract `handleMouseUp()`
- Extract `handleContextMenu()`
- Pass required state/callbacks as parameters

### Phase 3: Extract Touch Handlers (2 hours)
- Extract `onTouchStart()`
- Extract `onTouchMove()`
- Extract `onTouchEnd()`
- Integrate with `useTouchEvents` hook

### Phase 4: Extract Drag/Drop Logic (2 hours)
- Extract drag threshold logic
- Extract snap position calculation
- Extract drag preview logic
- Maintain collision detection integration

### Phase 5: Testing & Cleanup (1 hour)
- Test all interactions thoroughly
- Remove duplicate code
- Update documentation

## Risk Assessment

**Risk Level**: High

**Risks**:
1. **State Coupling**: Event handlers tightly coupled to component state
   - Mitigation: Pass state as parameters, use callbacks for updates
2. **Event Flow**: Complex event flow might break
   - Mitigation: Thorough testing, maintain event sequence
3. **Performance**: Additional function calls might impact responsiveness
   - Mitigation: Performance monitoring, throttling where needed

## Success Metrics

- DesignCanvas2D.tsx: ~1,500 lines
- All interactions work (selection, drag, drop, zoom, pan)
- No performance degradation
- Zero TypeScript errors

## Follow-up

- Story 1.15.3: Extract State Management
