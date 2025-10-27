# Story 1.15.1: Complete Canvas Module Integration

**Status**: 📋 **READY FOR WORK**
**Parent**: Story 1.15 - Refactor DesignCanvas2D into Modular Components
**Priority**: P2
**Estimated Effort**: 4-6 hours
**Risk Level**: Medium
**Created**: 2025-10-27

## User Story

As a developer,
I want DesignCanvas2D to use the extracted rendering modules,
so that we eliminate duplicate code and reduce the file size.

## Dependencies

- ✅ Story 1.15 - Rendering modules created (PlanViewRenderer, ElevationViewRenderer, CanvasSharedUtilities)

## Context

Story 1.15 created 3 rendering modules (1,200 lines) but DesignCanvas2D still has inline rendering code. This story completes the integration by replacing inline code with module calls.

## Acceptance Criteria

1. Replace `drawGrid()` calls with `PlanViewRenderer.drawGrid()`
2. Replace `drawRoom()` calls with appropriate renderer modules
3. Replace `drawElement()` calls with `drawElementPlanView()` / `drawElementElevationView()`
4. Replace `drawSnapGuides()` with module function
5. Replace `drawDragPreview()` with module function
6. Replace `drawTapeMeasure()` with module function
7. Replace `drawRuler()` with module function
8. Remove all duplicate rendering code from DesignCanvas2D
9. DesignCanvas2D.tsx reduced to ~2,300 lines (19% reduction from 2,772)
10. All views render correctly (manual testing)

## Integration Verification

- IV1: Plan view renders identically to before
- IV2: All 4 elevation views render correctly
- IV3: Element selection works in all views
- IV4: Drag and drop works in all views
- IV5: Snap guides appear correctly
- IV6: Tape measure functions properly
- IV7: Grid toggle works
- IV8: Zoom/pan work correctly
- IV9: TypeScript compilation passes (0 errors)
- IV10: No console errors or warnings

## Technical Approach

### Phase 1: Plan View Integration (2 hours)
- Replace `drawGrid()` with `PlanViewRenderer.drawGrid(ctx, showGrid, zoom, panOffset)`
- Replace `drawRoom()` plan view branch with `PlanViewRenderer.drawRoomPlanView(...)`
- Replace `drawElement()` plan view branch with `PlanViewRenderer.drawElementPlanView(...)`
- Test plan view thoroughly

### Phase 2: Elevation View Integration (2 hours)
- Replace `drawRoom()` elevation view branch with `ElevationViewRenderer.drawRoomElevationView(...)`
- Replace `drawElementElevation()` with `ElevationViewRenderer.drawElementElevationView(...)`
- Use `ElevationViewRenderer.getElementWall()` for filtering
- Use `ElevationViewRenderer.isCornerVisibleInView()` for corner logic
- Test all 4 elevation views

### Phase 3: Helper Functions Integration (1 hour)
- Replace snap guide rendering with module function
- Replace drag preview with module function
- Replace tape measure with module function
- Replace ruler with module function
- Test all interactive features

### Phase 4: Cleanup (1 hour)
- Remove all duplicate rendering code
- Remove unused imports
- Verify no regressions
- Update comments and documentation

## Testing Checklist

**Manual Testing** (Required):
- [ ] Plan view renders correctly
- [ ] Front elevation view renders correctly
- [ ] Back elevation view renders correctly
- [ ] Left elevation view renders correctly
- [ ] Right elevation view renders correctly
- [ ] Can select elements in plan view
- [ ] Can select elements in elevation views
- [ ] Can drag and drop in plan view
- [ ] Snap guides appear during drag
- [ ] Tape measure works
- [ ] Grid toggle works
- [ ] Zoom in/out works
- [ ] Pan works (both mouse and touch)
- [ ] Corner units render correctly
- [ ] Complex room shapes render (L-shaped, U-shaped)
- [ ] No visual regressions

**Automated Testing** (Nice to have):
- [ ] TypeScript compilation passes
- [ ] No console errors
- [ ] No console warnings

## Risk Assessment

**Risk Level**: Medium

**Risks**:
1. **Rendering Differences**: Module functions might render slightly differently than inline code
   - Mitigation: Side-by-side testing, visual comparison
2. **Performance Impact**: Function calls add overhead
   - Mitigation: Performance monitoring, throttling
3. **State Dependencies**: Rendering functions depend on component state
   - Mitigation: Pass all required state as parameters
4. **Event Handler Coupling**: Rendering interacts with events
   - Mitigation: Keep event handlers in component for now

**Rollback Plan**:
- Keep feature branch separate
- Don't merge to main until fully tested
- Can revert commits if issues found

## Success Metrics

- DesignCanvas2D.tsx: ~2,300 lines (target)
- Zero TypeScript errors
- Zero visual regressions
- All interactive features work
- No performance degradation

## Documentation Updates

- Update COMPLETION_SUMMARY.md with integration results
- Document any rendering differences found
- Update architecture diagrams if needed

## Follow-up Stories

After this story is complete, consider:
- Story 1.15.2: Extract Event Handlers
- Story 1.15.3: Extract State Management

## Notes

- This story focuses ONLY on rendering integration
- Event handlers stay in DesignCanvas2D for now
- State management stays in DesignCanvas2D for now
- Goal is to reduce file size and eliminate duplication with minimal risk
