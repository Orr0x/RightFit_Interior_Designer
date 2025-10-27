# Documentation Archive

⚠️ **HISTORICAL DOCUMENTS - FOR REFERENCE ONLY**

This folder contains exploratory session work from before the **Technical Debt Remediation PRD** (2025-10-26) was created.

---

## Why These Documents Are Archived

**Date Archived**: 2025-10-26
**Reason**: Prevent AI agent confusion and circular dependency patterns

These session folders represent **organic, exploratory development** that led to the discovery of 5 circular dependency patterns. While valuable for understanding project history, they contain:

❌ **Approaches that were later identified as problematic**
❌ **Incomplete fixes that were superseded**
❌ **Different architectural decisions than the current plan**
❌ **Conflicting instructions that confuse AI agents**

---

## Current Authoritative Documentation

For current work, see:

- **[../prd.md](../prd.md)** - Technical Debt Remediation PRD (THE PLAN)
- **[../brownfield-architecture.md](../brownfield-architecture.md)** - Current system architecture
- **[../CODE_REVIEW_COMPREHENSIVE.md](../CODE_REVIEW_COMPREHENSIVE.md)** - Critical issues analysis
- **[../circular-patterns-fix-plan.md](../circular-patterns-fix-plan.md)** - Step-by-step fix instructions

**Full documentation index**: [../README.md](../README.md)

---

## Archived Session Overview

### session-2025-01-09-3d-migration
**Purpose**: Migrated components to 3D view
**Status**: ✅ COMPLETE (97% coverage - 161/166 components)
**Key Achievement**: ComponentIDMapper patterns + AdaptiveView3D type routing
**Superseded By**: None (this work is still valid)

### session-2025-10-09-2d-database-migration
**Purpose**: Made 2D rendering database-driven
**Status**: ⚠️ PHASE 1-3 COMPLETE, Phase 5 (legacy code removal) pending
**Key Achievement**: Render2DService with caching
**Superseded By**: Part of current PRD Story 1.15 (DesignCanvas2D refactor)

### session-2025-10-10-complex-room-shapes
**Purpose**: L-shaped and U-shaped rooms with manual wall controls
**Status**: ✅ PHASES 1-5 COMPLETE
**Key Achievement**: ComplexRoomGeometry, RoomShapeSelector, walk mode
**Known Limitation**: Phase 4 (2D rendering for complex shapes) not started
**Superseded By**: None (this work is still valid but incomplete)

### session-2025-10-10-hardcoded-values-cleanup
**Purpose**: Database-driven room templates
**Status**: ✅ COMPLETE
**Superseded By**: None (this work is still valid)

### session-2025-10-10-multi-room-expansion
**Purpose**: Multi-room project system
**Status**: ✅ COMPLETE
**Superseded By**: None (this work is still valid)

### session-2025-10-10-room-system-analysis
**Purpose**: Analyze room system architecture
**Status**: ✅ COMPLETE (analysis phase)
**Superseded By**: None (analysis still relevant)

### session-2025-10-17-alignment-positioning-fix
**Purpose**: Fix coordinate system alignment and positioning
**Status**: ⚠️ INCOMPLETE - Led to discovery of Circular Pattern #1
**Key Finding**: Identified asymmetric left/right elevation positioning
**Superseded By**: **PRD Stories 1.2-1.5 (CoordinateTransformEngine)**

### session-2025-10-18-code-cleanup-and-elevation-selection
**Purpose**: Code cleanup and elevation view enhancements
**Status**: ⚠️ INCOMPLETE
**Superseded By**: **PRD Stories 1.15-1.17 (Modular refactor + documentation)**

### session-2025-10-18-Component-fixes
**Purpose**: Fix component rendering issues
**Status**: ⚠️ INCOMPLETE - Discovered multiple circular patterns
**Superseded By**: **PRD Stories 1.7-1.9 (ComponentPositionValidator + Z audit)**

### session-2025-10-18-view-specific-visibility
**Purpose**: View-specific element visibility
**Status**: ⚠️ INCOMPLETE
**Superseded By**: Deferred to Phase 2 (post-remediation)

### session-2025-10-19-Component-elevation-fixes
**Purpose**: Fix component elevation view rendering
**Status**: ⚠️ INCOMPLETE - Part of circular pattern identification
**Superseded By**: **PRD Stories 1.2-1.5 (CoordinateTransformEngine)**

---

## When to Reference Archived Sessions

### ✅ Good Reasons to Look at Archives:

1. **Understanding History**: "Why did we try approach X?"
2. **Learning from Mistakes**: "What led to the circular patterns?"
3. **Recovering Context**: "What was the original intent of this feature?"
4. **Continuity Check**: "Did we miss anything from that session?"

### ❌ Bad Reasons (Use Current Docs Instead):

1. ~~"Planning new work"~~ → Use [prd.md](../prd.md)
2. ~~"Understanding current architecture"~~ → Use [brownfield-architecture.md](../brownfield-architecture.md)
3. ~~"Fixing positioning bugs"~~ → Use [circular-patterns-fix-plan.md](../circular-patterns-fix-plan.md)
4. ~~"Following implementation steps"~~ → Use current PRD stories

---

## Key Lessons from Archived Sessions

### Circular Patterns Discovered

These patterns emerged from the archived session work:

**Pattern #1: Positioning Coordinate Circle** (session-2025-10-17, session-2025-10-19)
- **Problem**: Asymmetric left/right elevation positioning
- **Solution**: Story 1.2-1.5 (CoordinateTransformEngine)

**Pattern #2: State Update Circle** (ongoing issue)
- **Problem**: False positive `hasUnsavedChanges` flags
- **Solution**: Story 1.6 (Deep equality checking)

**Pattern #3: Type/Schema Mismatch Circle** (ongoing issue)
- **Problem**: TypeScript types out of sync with database
- **Solution**: Story 1.1 (Type regeneration + CI/CD)

**Pattern #4: Corner Cabinet Logic Circle** (session-2025-10-09)
- **Problem**: View-specific door orientation rules
- **Solution**: Story 1.10-1.11 (CornerCabinetDoorMatrix)

**Pattern #5: Height Property Circle** (session-2025-10-18-Component-fixes)
- **Problem**: Ambiguous use of `height` vs `z` positioning
- **Solution**: Story 1.7-1.9 (ComponentPositionValidator + Z audit)

### What Went Wrong

1. **No Unified Coordinate System**: Each view had its own transformation logic
2. **No Test Coverage**: Changes broke other views without detection
3. **No Architectural Guardrails**: AI agents repeated the same mistakes
4. **Organic Growth**: Features added without considering system-wide impact
5. **Session-Based Work**: No clear story boundaries led to scope creep

### What We Learned

1. **Epic/Story Structure Needed**: Clear boundaries prevent confusion
2. **Test Coverage Essential**: 70% coverage enables safe refactoring
3. **Coordinate Transform Engine**: Single source of truth prevents asymmetry
4. **AI Agent Guardrails**: Documentation prevents circular loops
5. **Backward Compatibility**: CR1-CR5 requirements prevent breaking changes

---

## Archive Maintenance

**Policy**: Archives are **read-only** and should not be modified.

**If you need to reference archive content**:
1. Read it for context
2. Create new work in current session folders (following PRD story naming)
3. Do NOT copy old approaches without validating against current architecture

**Moving Forward**:
- All new work follows Epic/Story structure from [prd.md](../prd.md)
- Session folders named: `session-YYYY-MM-DD-story-X.Y-description/`
- All work must reference PRD story numbers for traceability

---

## Questions?

**"Should I use code from an archived session?"**
- Only if it doesn't conflict with current PRD stories
- Always validate against CoordinateTransformEngine (after Story 1.2)
- Check compatibility requirements (CR1-CR5)

**"The archive has a fix for my problem!"**
- Check if the fix led to a circular pattern
- Verify it's compatible with current architecture
- Consider if the PRD already addresses this (Stories 1.1-1.17)

**"Can I update an archived session?"**
- No - archives are read-only
- Create new documentation in current structure instead

---

**Archive Created**: 2025-10-26
**Maintained By**: John (Product Manager)
**Version**: 1.0
