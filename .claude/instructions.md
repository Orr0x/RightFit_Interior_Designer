# Claude Code Instructions - RightFit Interior Designer

## 🚨 CRITICAL: Start Every New Session Here

**Before doing ANYTHING, read:** `docs/START-HERE-USER-REMINDERS.md`

This file contains:
- Current task (coordinate system verification)
- Approved strategy (elevation view duplication)
- Rejected approaches (don't implement wall-count system)
- User's explicit requirements
- Branch structure and history
- File locations and technical context

## Current Status

**Branch:** `feature/coordinate-system-setup`
**Task:** Coordinate system verification and fixes
**Priority:** HIGH - Required before elevation view finalization

## Quick Context

### What We're Building
- Complex room shapes (L/U-shaped kitchens)
- Elevation view duplication (max 3 per direction)
- Manual element visibility control per view
- Two-stage filtering: direction + hidden elements

### What NOT to Do
- ❌ Don't implement wall-count algorithmic elevation system
- ❌ Don't auto-detect which wall segment an element belongs to
- ❌ Don't show all elements on all elevations
- ❌ Don't skip coordinate verification

### User's Priorities
1. Database-first approach (no hardcoding)
2. Simplicity over algorithmic complexity
3. User control over automatic behavior
4. Backward compatibility
5. Test holistically (not piecemeal)

## File Structure

```
docs/
  ├── START-HERE-USER-REMINDERS.md ⭐ READ FIRST
  └── session-2025-10-10-complex-room-shapes/
      ├── ELEVATION_VIEW_DUPLICATION_IMPLEMENTATION.md (670 lines)
      ├── README.md (session overview)
      └── PHASE_4_PLAN_REVISED.md (approved strategy)

src/
  ├── utils/elevationViewHelpers.ts (285 lines - CRUD for views)
  ├── components/designer/
  │   ├── ViewSelector.tsx (290 lines - UI with context menu)
  │   └── DesignCanvas2D.tsx (filtering logic)
  └── pages/Designer.tsx (state management)
```

## Branch Structure

```
main
  └─ feature/complex-room-shapes
       └─ feature/elevation-simplified
            └─ feature/coordinate-system-setup ⭐ YOU ARE HERE
```

## Next Steps

1. Review coordinate system code
2. Document current coordinate conventions
3. Verify component positioning
4. Fix any coordinate bugs
5. Test wall detection accuracy
6. Update documentation

## Remember

- User has clear vision - when in doubt, ask!
- Coordinate fix MUST come before elevation view finalization
- Testing postponed until everything is in database
- Follow existing patterns and database-first approach

---

**Last Updated:** 2025-10-12
**Session:** Coordinate System Setup
