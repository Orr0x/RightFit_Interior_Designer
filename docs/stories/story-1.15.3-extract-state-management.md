# Story 1.15.3: Extract State Management to useCanvasState Hook

**Status**: 📋 **READY FOR WORK** (After Story 1.15.2)
**Parent**: Story 1.15 - Refactor DesignCanvas2D into Modular Components
**Priority**: P2
**Estimated Effort**: 4-6 hours
**Risk Level**: Very High
**Created**: 2025-10-27

## User Story

As a developer,
I want canvas state management extracted to a custom hook,
so that DesignCanvas2D becomes a thin orchestrator (<400 lines).

## Dependencies

- ✅ Story 1.15 - Rendering modules created
- ⏳ Story 1.15.1 - Module integration complete
- ⏳ Story 1.15.2 - Event handlers extracted

## Context

DesignCanvas2D has ~400+ lines of state management (useState, useEffect, useCallback, useRef). This story extracts this to a `useCanvasState()` custom hook, achieving the final target of <400 lines.

## Acceptance Criteria

1. Create `src/hooks/useCanvasState.ts` custom hook
2. Extract all useState declarations
3. Extract all useEffect hooks
4. Extract all useCallback memoizations
5. Extract all useRef declarations
6. Maintain state consistency
7. DesignCanvas2D.tsx reduced to ~400 lines (TARGET MET)
8. All functionality works correctly

## Technical Approach

### Phase 1: Design Hook Interface (1 hour)
- Define return type for `useCanvasState()`
- Determine what props hook needs
- Create TypeScript interfaces

### Phase 2: Extract State (2 hours)
- Extract zoom, pan, selection state
- Extract drag state
- Extract hover state
- Extract snap guides state

### Phase 3: Extract Effects (2 hours)
- Extract initialization effects
- Extract render triggers
- Extract cleanup effects
- Maintain effect dependencies

### Phase 4: Testing & Cleanup (1 hour)
- Test all functionality
- Optimize re-renders
- Update documentation

## Risk Assessment

**Risk Level**: Very High

**Risks**:
1. **State Consistency**: Complex state interactions might break
   - Mitigation: Thorough testing, maintain state update order
2. **Re-render Cascade**: Hook might cause unnecessary re-renders
   - Mitigation: Proper memoization, React DevTools profiling
3. **Effect Dependencies**: Effect dependency arrays might be incorrect
   - Mitigation: ESLint exhaustive-deps, manual review

## Success Metrics

- DesignCanvas2D.tsx: ~400 lines (TARGET MET - 86% reduction from 2,772)
- All functionality works
- No performance degradation
- No state bugs

## Final Goal Achievement

With this story complete, Story 1.15 will be 100% complete:
- ✅ AC1: PlanViewRenderer.ts (<800 lines)
- ✅ AC2: ElevationViewRenderer.ts (<800 lines)
- ✅ AC3: CanvasSharedUtilities.ts
- ✅ AC4: DesignCanvas2D.tsx (<400 lines) - **TARGET MET**
