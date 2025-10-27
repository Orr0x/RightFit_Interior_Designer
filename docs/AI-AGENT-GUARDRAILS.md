# AI Agent Development Guardrails

**Document Status**: ✅ COMPLETE (Story 1.16)
**Created**: 2025-10-27
**Last Updated**: 2025-10-27
**Author**: AI Agent (Epic 1 - Story 1.16)
**Purpose**: Prevent AI agents from falling into circular dependency traps when working on this codebase

---

## Executive Summary

This document identifies **five circular dependency patterns** that have historically trapped AI agents in infinite coding loops. These patterns emerge from architectural decisions in a brownfield codebase with organic growth and multiple coordinate systems.

**Critical Insight**: When AI agents encounter bugs in these areas, they often create "fixes" that resolve symptoms in one view but break functionality in another view, leading to an endless cycle of "fix left, break right, fix right, break left."

**This document provides**:
- ✅ Detailed description of each circular pattern
- ✅ Step-by-step explanation of how AI agents get stuck
- ✅ Prevention strategies and solution paths
- ✅ Code examples from actual fixes (Epic 1 Stories)
- ✅ AI Agent Development Checklist
- ✅ Lessons learned from successful refactors

**Target Audience**: AI agents (Claude, GPT, etc.) and human developers working on this codebase.

---

## Table of Contents

1. [The Five Circular Dependency Patterns](#the-five-circular-dependency-patterns)
   - [Pattern #1: Positioning Coordinate Circle](#pattern-1-positioning-coordinate-circle)
   - [Pattern #2: State Update Circle](#pattern-2-state-update-circle)
   - [Pattern #3: Type/Schema Mismatch Circle](#pattern-3-typeschema-mismatch-circle)
   - [Pattern #4: Corner Cabinet Logic Circle](#pattern-4-corner-cabinet-logic-circle)
   - [Pattern #5: Height Property Circle](#pattern-5-height-property-circle)
2. [AI Agent Development Checklist](#ai-agent-development-checklist)
3. [Lessons Learned from Epic 1](#lessons-learned-from-epic-1)
4. [Quick Reference: Pattern Detection](#quick-reference-pattern-detection)
5. [References](#references)

---

## The Five Circular Dependency Patterns

### Pattern #1: Positioning Coordinate Circle

**Status**: ⚠️ PARTIALLY RESOLVED (unified system exists but legacy code remains)

**The Trap**: Three incompatible coordinate systems with no unified transformation layer.

**Systems**:
1. **Plan View** (Canvas 2D)
   - Origin: Top-left (0, 0)
   - Units: Centimeters
   - Direct x/y mapping

2. **Elevation View** (Canvas 2D)
   - Origin: Canvas top-left (pixels), room origin varies
   - Units: Centimeters → pixels with zoom
   - TWO implementations (legacy + new)
   - Legacy: Asymmetric logic (left uses flipped Y, right uses direct Y)

3. **3D View** (Three.js)
   - Origin: Room center (0, 0, 0)
   - Units: Meters (divide by 100)
   - Y-axis is UP (not depth)

**How AI Agents Get Stuck**:

```
Step 1: User reports "Component positioned wrong on LEFT elevation view"
Step 2: Agent fixes left view positioning logic
Step 3: LEFT view now correct ✅
Step 4: User tests RIGHT elevation view → now broken ❌
Step 5: Agent fixes right view positioning logic
Step 6: RIGHT view now correct ✅
Step 7: LEFT view broken again ❌
Step 8: Agent realizes views use different logic
Step 9: Agent creates "unified" logic that averages both
Step 10: BOTH views now slightly wrong ❌❌
Step 11: Agent creates view-specific branches
Step 12: Back to Step 1 (infinite loop)
```

**Root Cause**:
- Left wall uses `roomDimensions.height - element.y` (flipped)
- Right wall uses `element.y` directly (not flipped)
- No clear documentation of which views use which system
- Feature flag `use_new_positioning_system` exists but behavior uncertain

**Code Location**:
- **File**: [src/utils/PositionCalculation.ts](../src/utils/PositionCalculation.ts)
- **Legacy System**: Lines 145-197
- **New System**: Lines 208-266
- **Issue**: Both implementations coexist, flag behavior unclear

**Solution Path**:

1. **Identify Active System**:
   ```typescript
   // Check feature flag first
   const useNewSystem = ConfigurationService.getSync('use_new_positioning_system', true);
   ```

2. **Use Coordinate Transformation Engine**:
   ```typescript
   // CORRECT: Use unified transformation
   import { CoordinateTransformEngine } from '@/utils/CoordinateTransformEngine';

   const engine = new CoordinateTransformEngine(roomDimensions, currentViewInfo);
   const canvasPos = engine.roomToCanvas(element.x, element.y);
   ```

3. **Test Across ALL Views**:
   - Plan view
   - Front elevation
   - Back elevation
   - Left elevation
   - Right elevation
   - 3D view
   - **If ONE view breaks, DON'T create view-specific logic**

**Prevention Strategies**:

✅ **Always use CoordinateTransformEngine for transformations**
✅ **Never create view-specific coordinate logic**
✅ **Test all 6 views before committing**
✅ **Check feature flags before assuming behavior**
❌ **Never toggle flags to "fix" a single view**
❌ **Never create asymmetric logic (left ≠ right)**

**Real-World Fix** (Epic 1 - Story 1.2):
- Created `CoordinateTransformEngine` as single source of truth
- Unified elevation positioning logic
- All views now use same transformation functions
- Result: Consistent positioning across all views

---

### Pattern #2: State Update Circle

**Status**: ⚠️ KNOWN ISSUE (not yet fixed)

**The Trap**: `hasUnsavedChanges` flag stuck true after successful save due to array reference changes without deep equality checking.

**How AI Agents Get Stuck**:

```
Step 1: User reports "Orange 'unsaved changes' indicator won't clear after save"
Step 2: Agent checks auto-save logic → save IS succeeding
Step 3: Agent adds debug logs → confirms flag clearing AFTER save
Step 4: Agent sees flag set to TRUE again immediately
Step 5: Agent adds more logging → discovers useEffect triggering
Step 6: Agent checks useEffect dependencies → includes design_elements array
Step 7: Agent realizes array reference changes on every update
Step 8: Agent tries to memoize array → breaks rendering
Step 9: Agent tries to debounce flag updates → flag sometimes wrong
Step 10: Agent tries to clear flag BEFORE save → race condition
Step 11: Agent tries to compare array lengths → insufficient (content changed)
Step 12: Back to Step 1 (infinite loop)
```

**Root Cause**:
```typescript
// ProjectContext.tsx line 886
useEffect(() => {
  // This comparison uses reference equality
  if (currentDesign?.design_elements !== previousElementsRef.current) {
    dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
    previousElementsRef.current = currentDesign?.design_elements;
  }
}, [currentDesign?.design_elements]);

// Every state update creates NEW array reference:
updateCurrentRoomDesign((prev) => ({
  ...prev,
  design_elements: [...prev.design_elements]  // NEW REFERENCE
}));

// Result: Flag set to true AFTER every successful save
```

**Code Location**:
- **File**: [src/contexts/ProjectContext.tsx](../src/contexts/ProjectContext.tsx)
- **Issue Location**: Lines 886-890
- **Auto-save Logic**: Lines 892-933

**Solution Path**:

1. **Implement Deep Equality**:
   ```typescript
   import { isEqual } from 'lodash';  // or custom implementation

   useEffect(() => {
     if (!isEqual(currentDesign?.design_elements, previousElementsRef.current)) {
       dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
       previousElementsRef.current = currentDesign?.design_elements;
     }
   }, [currentDesign?.design_elements]);
   ```

**Prevention Strategies**:

✅ **Use deep equality for array/object comparisons**
✅ **Test auto-save mechanism after state changes**
✅ **Consider optimistic updates for UX**
❌ **Never rely on reference equality for arrays**
❌ **Never add debouncing without understanding root cause**

**Current Workaround**:
- Manual save (File → Save) clears flag correctly
- Page reload resets state
- Not a functional blocker, but poor UX

---

### Pattern #3: Type/Schema Mismatch Circle

**Status**: ✅ RESOLVED (Epic 1 - Story 1.1)

**The Trap**: TypeScript types not regenerated after database migrations, causing TypeScript errors on fields that exist in database but not in type definitions.

**How AI Agents Get Stuck**:

```
Step 1: User requests "Add collision detection to component placement"
Step 2: Agent checks database → finds collision detection migration already exists
Step 3: Agent writes code using `component_3d_models.layer_type`
Step 4: TypeScript error: "Property 'layer_type' does not exist"
Step 5: Agent assumes migration not run → tries to create migration
Step 6: Migration already exists (20251017000001_add_collision_detection_layer_fields.sql)
Step 7: Agent creates workaround with `any` type
Step 8: Agent loses type safety
Step 9: Runtime errors occur (field exists but typed as `any`)
Step 10: Agent creates interface with optional field
Step 11: Optional field allows `undefined`, breaks logic
Step 12: Agent creates type guard function
Step 13: Type guard adds complexity, doesn't solve root cause
Step 14: Back to Step 1 (infinite loop)
```

**Root Cause**:
- Database migrations add columns to tables
- TypeScript types generated from database schema
- **Types NOT regenerated after migrations**
- Code references new columns → TypeScript errors
- AI agents create workarounds instead of regenerating types

**Solution Path** (CORRECT):

1. **Regenerate Types**:
   ```bash
   npx supabase gen types typescript > src/integrations/supabase/types.ts
   ```

2. **Verify Types Exist**:
   ```typescript
   // After regeneration, check interface:
   export interface component_3d_models extends Tables<'component_3d_models'> {
     layer_type?: string;           // ✅ Now present
     min_height_cm?: number;        // ✅ Now present
     max_height_cm?: number;        // ✅ Now present
     can_overlap_layers?: boolean;  // ✅ Now present
   }
   ```

**Prevention Strategies**:

✅ **ALWAYS regenerate types after database migrations**
✅ **Check types file BEFORE writing code that uses new fields**
✅ **Add type regeneration to CI/CD pipeline**
❌ **Never use `any` type to bypass TypeScript errors**
❌ **Never create workarounds with optional types**
❌ **Never assume types are up-to-date**

**Real-World Fix** (Epic 1 - Story 1.1):
- Identified 4 missing collision detection fields
- Regenerated types with Supabase CLI
- Verified all 4 fields present in TypeScript definitions
- Zero TypeScript errors after regeneration

**Workflow** (MEMORIZE THIS):
```bash
# 1. Create/run migration
npx supabase db push

# 2. IMMEDIATELY regenerate types
npx supabase gen types typescript > src/integrations/supabase/types.ts

# 3. Verify types updated
npm run type-check  # Should pass with 0 errors

# 4. Commit both migration and types
git add supabase/migrations/*.sql src/integrations/supabase/types.ts
git commit -m "feat(db): Add new fields + regenerate types"
```

---

### Pattern #4: Corner Cabinet Logic Circle

**Status**: ⚠️ PARTIALLY RESOLVED (DoorRotationMatrix created in Stories 1.10-1.11)

**The Trap**: Corner cabinet door side determination has 16 different rules (4 views × 4 corners) with no unified system.

**How AI Agents Get Stuck**:

```
Step 1: User reports "Corner cabinet door facing wrong way in FRONT view"
Step 2: Agent checks corner detection logic
Step 3: Agent finds view-specific if/else chain (16 branches)
Step 4: Agent updates FRONT + TOP-RIGHT logic
Step 5: FRONT view now correct ✅
Step 6: User tests BACK view → same corner, now wrong ❌
Step 7: Agent updates BACK + TOP-RIGHT logic
Step 8: BACK view now correct ✅
Step 9: FRONT view broken again ❌
Step 10: Agent realizes views use opposite rules
Step 11: Agent adds more if/else branches for edge cases
Step 12: Now 24 branches, harder to debug
Step 13: Agent tries to create "unified" rule → breaks 3 views
Step 14: Back to Step 1 (infinite loop)
```

**Root Cause**:
- Corner detection: 30cm tolerance from walls (top-left, top-right, bottom-left, bottom-right)
- Door side determination: View-specific rules with no transformation matrix
- Code has 16 hardcoded conditions (one per corner per view)
- Fixing one view often breaks another view

**Solution Path**:

1. **Use DoorRotationMatrix** (if implemented):
   ```typescript
   import { getDoorSide } from '@/utils/DoorRotationMatrix';

   const corner = detectCornerPosition(element, roomDimensions);
   const doorSide = getDoorSide(corner, currentViewInfo.direction, element.cornerDoorSide);
   ```

2. **Test All 16 Scenarios**:
   - 4 corners (top-left, top-right, bottom-left, bottom-right)
   - 4 views (front, back, left, right)
   - Door side should be consistent with principle: "Door faces away from walls"

**Prevention Strategies**:

✅ **Use transformation matrices for view-specific rendering**
✅ **Single source of truth (matrix) instead of if/else chains**
✅ **Test all views when changing corner logic**
✅ **Allow manual overrides via element properties**
❌ **Never add more if/else branches for corner logic**
❌ **Never use opposite rules in different views (code smell)**

---

### Pattern #5: Height Property Circle

**Status**: ⚠️ PARTIALLY RESOLVED (component audit complete, enforcement pending)

**The Trap**: Multiple sources of truth for component height/positioning, causing different heights in elevation vs 3D views.

**How AI Agents Get Stuck**:

```
Step 1: User reports "Wall cabinet at wrong height in elevation view"
Step 2: Agent checks element.height → 70cm (dimension)
Step 3: Agent sets element.z = 140cm (position off floor)
Step 4: Elevation view ignores element.z, uses type default
Step 5: Agent adds elevation_height to database
Step 6: 3D view ignores elevation_height, uses element.z
Step 7: Agent sets component_behavior.use_actual_height_in_elevation = true
Step 8: Elevation now uses element.height (dimension, not position)
Step 9: Cabinet appears at 70cm off floor (wrong)
Step 10: Agent creates hybrid logic (if elevation_height exists, use that)
Step 11: Now 4 sources of truth (z, height, elevation_height, type default)
Step 12: Agent confuses dimension (height) with position (z)
Step 13: Elevation shows 140cm, 3D shows 235cm (95cm difference)
Step 14: Back to Step 1 (infinite loop)
```

**Root Cause**:
- **Property Confusion**:
  - `element.height` = component DIMENSION (vertical size)
  - `element.z` = component POSITION (height off floor)
- **Multiple Sources**: element.height, element.z, elevation_height, type defaults, behavior flags, 3D defaults

**Solution Path**:

1. **Separate Concerns**:
   ```typescript
   // element.height = DIMENSION (vertical size)
   // element.z = POSITION (height off floor)

   const wallUnit = {
     width: 60,      // 60cm wide (dimension)
     depth: 35,      // 35cm deep (dimension)
     height: 70,     // 70cm tall (dimension)
     z: 140,         // 140cm off floor (position)
   };
   ```

2. **Use Unified Positioning**:
   ```typescript
   // BOTH views use element.z
   const positionOffFloor = element.z ?? getDefaultZForType(element.type);
   ```

**Prevention Strategies**:

✅ **Always separate dimension (height) from position (z)**
✅ **Set explicit z values, don't rely on defaults**
✅ **Use same positioning source (element.z) in all views**
✅ **Test elevation AND 3D views together**
❌ **Never use element.height for positioning**
❌ **Never create view-specific height logic**

---

## AI Agent Development Checklist

Use this checklist BEFORE making changes to prevent falling into circular patterns:

### Before Any Change

- [ ] Read [docs/README.md](./README.md) for documentation index
- [ ] Read [CLAUDE.md](../CLAUDE.md) for project instructions
- [ ] Check [docs/prd.md](./prd.md) for current work plan
- [ ] Identify which circular pattern(s) apply to your task

### Before Positioning/Coordinate Changes

- [ ] Identify view context (plan, elevation, 3D)
- [ ] Check `use_new_positioning_system` feature flag
- [ ] Use `CoordinateTransformEngine` for transformations
- [ ] Never create view-specific coordinate logic
- [ ] Test ALL 6 views (plan + 4 elevations + 3D)

### Before State Management Changes

- [ ] Check if change affects `design_elements` array
- [ ] Use deep equality for array/object comparisons
- [ ] All ProjectContext functions wrapped in `useCallback`
- [ ] Test auto-save behavior (make change, wait 30 sec)

### Before Database Schema Changes

- [ ] Create migration file in `supabase/migrations/`
- [ ] Run migration: `npx supabase db push`
- [ ] **CRITICAL**: Regenerate types: `npx supabase gen types typescript > src/integrations/supabase/types.ts`
- [ ] Verify types contain new fields: `npm run type-check`
- [ ] Commit both migration and types together

### Before Component Height/Position Changes

- [ ] Identify property: `element.height` (dimension) vs `element.z` (position)
- [ ] Set explicit `element.z` value (don't rely on defaults)
- [ ] Test in BOTH elevation AND 3D views
- [ ] Never use `element.height` for positioning

### Red Flags (STOP if you see these)

- 🚩 Fixing left wall breaks right wall → Pattern #1 (Positioning)
- 🚩 Fixing elevation breaks 3D → Pattern #5 (Height)
- 🚩 `hasUnsavedChanges` won't clear → Pattern #2 (State)
- 🚩 TypeScript error on field in migration → Pattern #3 (Types)
- 🚩 Corner door logic has view-specific if/else → Pattern #4 (Corner)

### When Stuck

1. **STOP coding** - Don't make more changes
2. **Read this document** - Identify which circular pattern applies
3. **Follow the solution path** - Don't invent new approaches
4. **Test comprehensively** - All views, all scenarios
5. **Ask for clarification** - Don't assume understanding

---

## Lessons Learned from Epic 1

### Story 1.15.2 - Successful Modular Refactor

**Context**: Extracted 1,073 lines of event handler logic from monolithic DesignCanvas2D.tsx to InteractionHandler.ts module.

**Success Patterns**:

1. **Module Delegation Pattern**:
   ```typescript
   // Create clear interfaces
   interface InteractionState { /* all state */ }
   interface InteractionCallbacks { /* all callbacks */ }
   interface InteractionUtilities { /* all utilities */ }

   // Delegate to module
   InteractionHandler.handleMouseDown(e, state, callbacks, utils);
   ```

2. **Incremental Approach**:
   - Phase 1: Design interfaces
   - Phase 2: Extract mouse handlers
   - Phase 3: Integration & testing
   - Phase 4: Extract touch handlers
   - Phase 5: Extract drag/drop
   - Phase 6: Cleanup

**Results**:
- ✅ Reduced DesignCanvas2D from 2,080 → 1,512 lines (27% reduction)
- ✅ Zero TypeScript errors throughout
- ✅ All functionality preserved

**Key Takeaway**: Incremental refactoring with clear interfaces prevents breaking changes.

---

### General Lessons

1. **Read Documentation First**: Always check docs/README.md and relevant session docs
2. **Test Comprehensively**: Manual testing across all views, TypeScript compilation
3. **Incremental Changes**: Small phases with clear deliverables
4. **Clear Interfaces**: Define TypeScript interfaces for module boundaries
5. **Deep Equality for Arrays/Objects**: Never rely on reference equality
6. **Feature Flags**: Check flags before assuming behavior, never toggle to "fix" issues
7. **Modular Architecture**: Extract logic to separate modules, single source of truth

---

## Quick Reference: Pattern Detection

**Symptoms → Patterns Mapping**:

| Symptom | Likely Pattern | Action |
|---------|---------------|---------|
| Left elevation wrong, right correct | Pattern #1 (Positioning) | Use CoordinateTransformEngine |
| 3D height ≠ elevation height | Pattern #5 (Height) | Set explicit element.z, test both views |
| Orange "unsaved" indicator stuck | Pattern #2 (State) | Check array reference, add deep equality |
| TypeScript error on DB field | Pattern #3 (Types) | Regenerate types with Supabase CLI |
| Corner door wrong in one view | Pattern #4 (Corner) | Use DoorRotationMatrix, test all views |
| Fix breaks another view | ANY pattern | STOP, read this doc, identify pattern |

**Critical Commands**:

```bash
# Regenerate types (Pattern #3)
npx supabase gen types typescript > src/integrations/supabase/types.ts

# Type checking
npm run type-check

# Push migrations
npx supabase db push

# Check current branch (never commit to main)
git branch
```

---

## References

**Primary Documentation**:
- [docs/README.md](./README.md) - Documentation index
- [docs/prd.md](./prd.md) - Technical Debt Remediation PRD
- [docs/brownfield-architecture.md](./brownfield-architecture.md) - Detailed architecture analysis
- [CLAUDE.md](../CLAUDE.md) - Project instructions for AI agents

**Epic 1 Progress**:
- [docs/EPIC_1_PROGRESS.md](./EPIC_1_PROGRESS.md) - Complete Epic 1 status

**Code Files** (Read for context):
- [src/utils/CoordinateTransformEngine.ts](../src/utils/CoordinateTransformEngine.ts) - Unified coordinates (Pattern #1)
- [src/contexts/ProjectContext.tsx](../src/contexts/ProjectContext.tsx) - State management (Pattern #2)
- [src/integrations/supabase/types.ts](../src/integrations/supabase/types.ts) - TypeScript types (Pattern #3)
- [src/services/2d-renderers/elevation-view-handlers.ts](../src/services/2d-renderers/elevation-view-handlers.ts) - Corner logic (Pattern #4)
- [src/services/ComponentService.ts](../src/services/ComponentService.ts) - Height resolution (Pattern #5)

---

## Document Metadata

**Version**: 1.0
**Status**: ✅ Complete
**Last Updated**: 2025-10-27
**Author**: AI Agent (Epic 1 - Story 1.16)
**Maintained By**: Development team + AI agents

**Change Log**:
- 2025-10-27: Initial creation (Story 1.16) - Comprehensive documentation of five circular patterns

**Feedback**: If you encounter a circular pattern not documented here, please add it to this document.

---

**END OF DOCUMENT**
