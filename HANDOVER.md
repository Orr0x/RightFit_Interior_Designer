# Handover Document for Next AI Agent

**Date:** October 27, 2025
**Current Branch:** `feature/component-elevation-fixes`
**Epic:** Epic 1 - Eliminate Circular Dependency Patterns
**Progress:** 12/17 Stories Complete (71%)

---

## 🎯 Mission Overview

You are continuing work on **Epic 1: Eliminate Circular Dependency Patterns**, a technical debt remediation initiative for the RightFit Interior Designer application. The goal is to eliminate circular dependencies in the coordinate transformation and component rendering systems.

---

## ✅ What's Been Completed (12 Stories)

### Stories 1.1-1.8 (October 26, 2025)
These stories established the foundation:

1. **Story 1.1**: Regenerated TypeScript types from Supabase schema
2. **Story 1.2**: Created NEW UNIFIED CoordinateTransformEngine (eliminates asymmetric calculations)
3. **Story 1.3**: Refactored PositionCalculation to use the engine
4. **Story 1.4**: Integrated engine into EnhancedModels3D (3D rendering)
5. **Story 1.5**: Integrated engine into DesignCanvas2D (plan view)
6. **Story 1.6**: Implemented deep equality state check (prevents unnecessary re-renders)
7. **Story 1.7**: Created ComponentPositionValidator utility (Z position validation)
8. **Story 1.8**: Audited component library Z positions + database migration

### Stories 1.9-1.11 (October 27, 2025 - Morning)
These stories fixed critical rendering bugs:

9. **Story 1.9**: Simplified height property usage (`getZPosition()` single source of truth)
10. **Story 1.10**: Created CornerCabinetDoorMatrix utility (door orientation)
11. **Story 1.11**: Refactored elevation-view-handlers to use door matrix

**Key Achievement:** Fixed 7 critical rendering bugs including:
- Height calculation bypass
- Door count logic (width-based now)
- Drawer rendering issues
- Corner door orientation in left/right views
- Finishing components (cornice/pelmet) showing doors

### Story 1.12 (October 27, 2025 - Afternoon)
Test infrastructure established:

12. **Story 1.12**: Complete test infrastructure
   - **210 total tests** (198 unit + 12 E2E)
   - **89.56% code coverage** for circular pattern files
   - **Vitest 3.0.0** configured (unit tests)
   - **Playwright** configured (E2E tests)
   - **GitHub Actions CI/CD** pipeline (4 parallel jobs)
   - Fixed critical singleton initialization bug in CoordinateTransformEngine

---

## 🔴 What's Remaining (5 Stories)

### Story 1.13: Structured Logging (4 hours)
**Objective:** Remove console.log statements and implement structured logging

**Tasks:**
- Replace development console.logs with proper logger
- Implement log levels (debug, info, warn, error)
- Add request ID tracking
- Configure log output (dev vs production)

**Files to Review:**
- `src/services/2d-renderers/elevation-view-handlers.ts` (many debug logs added in Story 1.11)
- `src/services/ComponentService.ts`
- `src/components/designer/DesignCanvas2D.tsx`

**Acceptance Criteria:**
- [ ] All `console.log` replaced with structured logger
- [ ] Logger supports log levels (debug, info, warn, error)
- [ ] Development mode shows debug logs, production does not
- [ ] Error logs include stack traces

### Story 1.14: Input Validation (8 hours)
**Objective:** Add comprehensive input validation for coordinate/dimension operations

**Tasks:**
- Create InputValidator utility class
- Validate room dimensions (positive, reasonable ranges)
- Validate element positions (within room bounds)
- Validate Z positions (0-ceiling height)
- Add validation to all public API entry points

**Key Files:**
- `src/services/CoordinateTransformEngine.ts` (validate room dimensions)
- `src/utils/ComponentPositionValidator.ts` (extend validation)
- `src/services/ComponentService.ts` (validate operations)

**Acceptance Criteria:**
- [ ] InputValidator utility created
- [ ] All coordinate operations validated
- [ ] User-friendly error messages
- [ ] Validation integrated into API boundaries
- [ ] Unit tests for validation logic

### Story 1.15: Refactor DesignCanvas2D Modular (16 hours)
**Objective:** Break down monolithic DesignCanvas2D.tsx (117K+ characters) into modular components

**Current Problem:**
- `DesignCanvas2D.tsx` is 117K+ characters (too large)
- Multiple responsibilities mixed together
- Hard to maintain and test

**Suggested Module Structure:**
```
src/components/designer/canvas/
  ├── CanvasCore.tsx            (main canvas wrapper)
  ├── PlanViewRenderer.tsx      (plan view logic)
  ├── ElevationViewRenderer.tsx (elevation view logic)
  ├── ElementRenderer.tsx       (element drawing)
  ├── SelectionManager.tsx      (selection state)
  ├── InteractionHandler.tsx    (mouse/keyboard events)
  └── GridOverlay.tsx           (grid lines)
```

**Acceptance Criteria:**
- [ ] DesignCanvas2D.tsx under 1000 lines
- [ ] Each module has single responsibility
- [ ] All existing functionality preserved
- [ ] No visual regressions
- [ ] Module interfaces documented

### Story 1.16: Document AI Agent Guardrails (4 hours)
**Objective:** Document patterns AI agents should avoid

**Tasks:**
- Document the circular patterns that were fixed
- Create AI agent guidelines for this codebase
- Add examples of "before/after" for each pattern
- Create checklist for AI agents to follow

**Deliverables:**
- [ ] `docs/AI-AGENT-GUARDRAILS.md` created
- [ ] Circular pattern anti-patterns documented
- [ ] Code review checklist for AI agents
- [ ] Examples from this epic included

### Story 1.17: Archive Documentation (1 hour)
**Objective:** Move session documentation to archive

**Tasks:**
- Review all docs in `docs/archive/` vs `docs/stories/sessions/`
- Consolidate session documentation
- Update README to point to new structure
- Add "lessons learned" summary

**Acceptance Criteria:**
- [ ] All session docs in proper location
- [ ] Archive structure documented
- [ ] README updated with navigation guide

---

## 📁 Critical Files You Need to Know

### Core Utilities (Circular Pattern Fixes)
1. **CoordinateTransformEngine.ts** (`src/services/`)
   - NEW UNIFIED SYSTEM for coordinate transformations
   - 98.68% test coverage
   - Eliminates asymmetric left/right calculations
   - **Critical:** Always use `initializeCoordinateEngine()` before using

2. **ComponentPositionValidator.ts** (`src/utils/`)
   - Z position validation
   - Type-based default Z positions
   - 98.75% test coverage

3. **CornerCabinetDoorMatrix.ts** (`src/utils/`)
   - Door orientation logic
   - 46 tests, 100% coverage
   - Principle: "Door faces away from walls"

4. **PositionCalculation.ts** (`src/utils/`)
   - Elevation position calculations
   - 100% test coverage
   - Uses CoordinateTransformEngine for left/right views

5. **ComponentService.ts** (`src/services/`)
   - `getZPosition()` - Single source of truth for Z position
   - `getElevationHeight()` - Always returns element.height
   - Component data fetching and caching

### Rendering Components
6. **DesignCanvas2D.tsx** (`src/components/designer/`)
   - **117K+ characters** (needs Story 1.15 refactor)
   - Plan view and elevation view rendering
   - Uses CoordinateTransformEngine for plan view
   - Uses PositionCalculation for elevation views

7. **elevation-view-handlers.ts** (`src/services/2d-renderers/`)
   - Elevation-specific rendering logic
   - Uses CornerCabinetDoorMatrix
   - Many debug console.logs (remove in Story 1.13)

8. **EnhancedModels3D.tsx** (`src/components/designer/`)
   - 3D rendering component
   - Uses CoordinateTransformEngine.planTo3D()
   - Uses ComponentService.getZPosition()

### Test Files
9. **Test Suite** (210 tests, 89.56% coverage)
   - `vitest.config.ts` - Vitest configuration
   - `playwright.config.ts` - Playwright E2E configuration
   - `src/utils/__tests__/*.test.ts` - Unit tests
   - `tests/e2e/*.spec.ts` - E2E tests

---

## 🧪 Testing Instructions

### Run Unit Tests
```bash
npm run test:run          # Run all unit tests once
npm run test:coverage     # Run with coverage report
npm run test:ui           # Open Vitest UI
```

**Expected:** 198/198 tests passing, 89.56% coverage

### Run E2E Tests
```bash
npx playwright test                    # All browsers
npx playwright test --project=chromium # Chromium only (faster)
npx playwright test --ui               # UI mode
npx playwright show-report             # View last report
```

**Expected:** 12/12 tests passing

### Type Check
```bash
npm run type-check        # Must pass before committing
```

**Expected:** Zero TypeScript errors

### Development Server
```bash
npm run dev               # Start on http://localhost:5174
```

---

## 🔀 Git Workflow (CRITICAL)

### ⚠️ DANGER: Auto-Deploy to Production

**THIS PROJECT HAS AUTO-DEPLOY ENABLED ON `main` BRANCH**

**ABSOLUTE RULES:**
1. ✅ **Work on feature branches** (currently: `feature/component-elevation-fixes`)
2. ✅ **Commit freely to feature branches**
3. ❌ **NEVER push to `main`** without explicit user permission
4. ❌ **NEVER merge to `main`** - Only user can approve production deployments
5. ❌ **Pushing to `main` = INSTANT LIVE DEPLOYMENT TO PRODUCTION**

### Current Branch Status
```bash
git branch                # Should show: feature/component-elevation-fixes
git status                # Check for uncommitted changes
```

### Safe Workflow
```bash
# Commit your work
git add -A
git commit -m "feat(story): Your descriptive commit message"

# Push to feature branch (SAFE)
git push origin feature/component-elevation-fixes

# Create PR for user review (SAFE)
gh pr create --base main --title "Epic 1: Stories 1.13-1.17 Complete"
```

---

## 📚 Documentation Structure

### Must Read First
1. **[docs/README.md](docs/README.md)** - Documentation index (START HERE)
2. **[docs/prd.md](docs/prd.md)** - Technical Debt Remediation PRD (THE PLAN)
3. **[docs/stories/README.md](docs/stories/README.md)** - Epic 1 progress tracker

### Story Cards
- Located in: `docs/stories/`
- Format: `1.XX-story-name.md`
- Each has acceptance criteria and integration verification steps

### Session Documentation
- Located in: `docs/stories/sessions/`
- Each completed story has comprehensive session summary
- Example: `docs/stories/sessions/1.12-test-infrastructure/SESSION-SUMMARY.md`

### Architecture Docs
- `docs/brownfield-architecture.md` - System architecture
- `docs/CODE_REVIEW_COMPREHENSIVE.md` - Critical issues (READ THIS)
- `docs/circular-patterns-fix-plan.md` - Fix instructions
- `docs/coordinate-system-visual-guide.md` - Coordinate system explained

---

## 🔧 Key Technical Decisions

### 1. NEW UNIFIED SYSTEM (Story 1.2)
**What:** CoordinateTransformEngine eliminates asymmetric left/right calculations

**Before:**
```typescript
// Left and right walls had different coordinate logic (ASYMMETRIC)
if (view === 'left') {
  xPos = roomY + offsetY; // Different formula
} else if (view === 'right') {
  xPos = roomHeight - roomY + offsetY; // Different formula
}
```

**After:**
```typescript
// All views use same engine (SYMMETRIC)
const engine = getCoordinateEngine(roomDimensions);
const result = engine.planToElevation(element.x, element.y, view);
```

### 2. Z Position Single Source of Truth (Story 1.9)
**What:** `ComponentService.getZPosition()` is authoritative

**Priority Order:**
1. `element.z` (explicit override)
2. Database `default_z_position`
3. Type-based fallback (ComponentPositionValidator)

**Never use hardcoded Z positions in rendering code.**

### 3. Width-Based Door Count (Story 1.9)
**What:** IGNORE database `door_count`, use width-based logic

**Rationale:** Database has incorrect data (2 doors for 60cm cabinets)

**Logic:**
```typescript
const doorCount = width <= 60 ? 1 : 2;  // Industry standard
```

### 4. Door Matrix Principle (Story 1.10)
**What:** "Door faces away from walls"

**Matrix:**
```typescript
front-left  → right door (away from left wall)
front-right → left door  (away from right wall)
back-left   → right door (away from left wall)
back-right  → left door  (away from right wall)
```

### 5. Function Coverage Threshold (Story 1.12)
**What:** 45% function coverage threshold (not 70%)

**Rationale:** V8 counts 60+ internal mapper lambdas in ComponentIDMapper

**All public API functions are 100% tested.**

---

## 🐛 Known Issues and TODOs

### Database Data Quality Issues
**Problem:** `component_2d_renders` table has incorrect data:
- ❌ `drawer_count = 0` for all pan-drawer units (should be 2-4)
- ❌ `door_count = 2` for 50cm/60cm cabinets (should be 1)
- ❌ `door_count = 2` for drawer units (should be 0)

**Current Solution:** Code ignores database and uses width-based/type-based logic

**Future Work:** Create database migration to fix (deferred to after Epic 1)

### Story 1.15 Challenge
**Problem:** DesignCanvas2D.tsx is 117K+ characters

**Warning:** This refactor is complex. Test thoroughly after each extraction.

**Strategy:**
1. Start with smallest module (GridOverlay)
2. Extract one module at a time
3. Run full test suite after each extraction
4. Keep git commits small and incremental
5. User can test in browser after each module

---

## 🎯 Recommended Next Steps

### Option A: Continue with Story 1.13 (Structured Logging)
**Time:** 4 hours
**Complexity:** Low
**Value:** High (removes debug clutter)

**Start here:**
1. Read Story 1.13 card: `docs/stories/1.13-structured-logging.md`
2. Review console.logs in `elevation-view-handlers.ts`
3. Create logger utility: `src/utils/Logger.ts`
4. Replace console.logs incrementally
5. Test in development mode

### Option B: Continue with Story 1.14 (Input Validation)
**Time:** 8 hours
**Complexity:** Medium
**Value:** High (prevents bugs)

**Start here:**
1. Read Story 1.14 card: `docs/stories/1.14-input-validation.md`
2. Review existing validation in ComponentPositionValidator
3. Create InputValidator utility: `src/utils/InputValidator.ts`
4. Add validation to API boundaries
5. Write comprehensive unit tests

### Option C: Skip to Story 1.17 (Archive Documentation)
**Time:** 1 hour
**Complexity:** Low
**Value:** Medium (cleanup)

**Good choice if:** You want to complete Epic 1 quickly (only 1.17 is non-code work)

---

## 🚨 Critical Warnings

### 1. Don't Break the Tests
- 210 tests must remain passing
- Run `npm run test:run` before committing
- CI/CD will fail if tests break

### 2. Don't Push to Main
- Auto-deploy is enabled
- User will lose trust if production breaks
- Always work on feature branches

### 3. Don't Remove Debug Logs Until Story 1.13
- Current debug logs are intentional (Story 1.11)
- They help with troubleshooting
- Only remove as part of Story 1.13 structured logging

### 4. Don't Modify CoordinateTransformEngine Without Tests
- It's the core of the NEW UNIFIED SYSTEM
- 34 tests with 98.68% coverage
- Breaking it breaks everything

### 5. Don't Hardcode Z Positions
- Use `ComponentService.getZPosition()`
- Story 1.9 established this pattern
- Hardcoding will cause regressions

---

## 📞 Getting Help

### User Communication
- User is available for questions
- User has tested all completed stories
- User confirmed: "all corner base, wall and tall larder units are now correct"

### Documentation References
- **Stuck on coordinates?** Read `docs/coordinate-system-visual-guide.md`
- **Stuck on architecture?** Read `docs/brownfield-architecture.md`
- **Stuck on circular patterns?** Read `docs/circular-patterns-fix-plan.md`
- **Need story details?** Read `docs/prd.md` Section 4

### Git History
```bash
git log --oneline | head -30    # See recent commits
git show <commit-hash>          # See commit details
```

### Test a Specific Story's Code
```bash
# Find commits for a story
git log --oneline --grep="Story 1.9"

# See what changed
git show <commit-hash> --stat
```

---

## ✅ Pre-Flight Checklist (Before You Start)

- [ ] Read this handover document completely
- [ ] Read `docs/README.md` (documentation index)
- [ ] Read `docs/stories/README.md` (Epic 1 progress)
- [ ] Verify you're on `feature/component-elevation-fixes` branch
- [ ] Run `npm install` (if needed)
- [ ] Run `npm run test:run` (verify 198/198 passing)
- [ ] Run `npx playwright test --project=chromium` (verify 12/12 passing)
- [ ] Run `npm run type-check` (verify zero errors)
- [ ] Read CLAUDE.md (project instructions)
- [ ] Choose which story to work on (1.13, 1.14, 1.15, 1.16, or 1.17)
- [ ] Read that story's card in `docs/stories/`

---

## 🎉 Final Notes

**Congratulations on taking over!** You're inheriting a project that's 71% complete on Epic 1. The hardest technical work (Stories 1.1-1.12) is done. The remaining stories are mostly cleanup and documentation.

**The NEW UNIFIED SYSTEM is working beautifully.** All circular patterns are eliminated. The test suite is comprehensive. The code is in good shape.

**Key Success Factors:**
1. ✅ Read the documentation first (don't skip this!)
2. ✅ Keep tests passing (run them frequently)
3. ✅ Work on feature branch (never touch main)
4. ✅ Commit often with clear messages
5. ✅ Ask user for clarification when needed

**You've got this!** 💪

---

**Handover Created:** October 27, 2025
**Handover By:** Claude (Sonnet 4.5)
**Next Agent:** Good luck! 🚀
