# RightFit Interior Designer - Documentation Index

⚠️ **START HERE** - This is the authoritative documentation source for all AI agents and developers.

---

## Current Active Documentation (2025-10-26)

**📋 For AI Agents & Developers - READ THESE FIRST:**

### Primary Planning Documents

1. **[prd.md](./prd.md)** - **Technical Debt Remediation PRD** (THE PLAN)
   - Epic and story breakdown for eliminating 5 circular dependency patterns
   - 17 stories with clear acceptance criteria and integration verification
   - Success metrics and next steps
   - **Start here for understanding what work needs to be done**

### AI Agent Guardrails

2. **[AI-AGENT-GUARDRAILS.md](./AI-AGENT-GUARDRAILS.md)** - ⚠️ **CRITICAL: READ BEFORE MODIFYING POSITION/COORDINATE CODE** ⚠️
   - Red flags that indicate circular pattern entry
   - Required validation steps before position-related changes
   - Testing checklist (plan + 4 elevations + 3D)
   - Coordinate system transformation rules
   - Examples of correct vs incorrect approaches
   - **Must-read for any changes to coordinate transformation, position calculation, or rendering systems**

### Technical Analysis Documents

3. **[brownfield-architecture.md](./brownfield-architecture.md)** - **System Architecture & Circular Patterns**
   - Complete architectural analysis by Winston (AI Architect)
   - Detailed breakdown of 5 circular dependency patterns
   - Dependency graphs and impact analysis
   - 1,430 lines of comprehensive technical analysis

4. **[CODE_REVIEW_COMPREHENSIVE.md](./CODE_REVIEW_COMPREHENSIVE.md)** - **Critical Issues Analysis**
   - Code review by James (Senior Developer)
   - 28 critical issues beyond the circular patterns
   - Security vulnerabilities, data integrity risks, performance problems
   - 1,248 lines of findings with severity ratings

5. **[circular-patterns-fix-plan.md](./circular-patterns-fix-plan.md)** - **Step-by-Step Fix Instructions**
   - Detailed implementation steps for all 5 circular pattern fixes
   - 30.5 hours of mapped work with dependencies
   - Code examples and validation steps
   - 2,100 lines of actionable fix plans

6. **[coordinate-system-visual-guide.md](./coordinate-system-visual-guide.md)** - **Visual Transformation Guides**
   - Visual diagrams of coordinate system transformations
   - Plan view, elevation views, and 3D view coordinate mappings
   - Testing procedures and debugging guides
   - 698 lines with ASCII diagrams

### General Project Instructions

7. **[../CLAUDE.md](../CLAUDE.md)** - **General Project Instructions**
   - Project overview and architecture
   - Development commands and workflows
   - Key files and responsibilities
   - Recent development session notes

---

## How to Use This Documentation

### For AI Coding Agents

**If you're starting a new work session:**

1. **Read [prd.md](./prd.md)** first to understand the overall plan
2. **Identify your story** from Epic 1 (Stories 1.1-1.17)
3. **Review the implementation reference** linked in your story
4. **Follow the acceptance criteria** and integration verification steps
5. **Consult [coordinate-system-visual-guide.md](./coordinate-system-visual-guide.md)** for positioning work

**⚠️ CRITICAL RULES:**

- **Never modify multiple views in isolation** - Always test plan + 4 elevations + 3D
- **Always use CoordinateTransformEngine** after Story 1.2 is complete
- **Always run integration verification** steps from your story
- **Never skip compatibility requirements** (CR1-CR5)
- **Document your rationale** in JSDoc comments

### For Human Developers

1. Start with [prd.md](./prd.md) for the big picture
2. Review Winston's [brownfield-architecture.md](./brownfield-architecture.md) for deep understanding
3. Check James's [CODE_REVIEW_COMPREHENSIVE.md](./CODE_REVIEW_COMPREHENSIVE.md) for known issues
4. Follow the story sequence from [prd.md](./prd.md)

### For Project Managers

- **Current Plan**: [prd.md](./prd.md) - 17 stories, ~120 hours estimated
- **Progress Tracking**: Check story completion status in [prd.md](./prd.md) Section 4
- **Success Metrics**: [prd.md](./prd.md) Section 5
- **Next Steps**: [prd.md](./prd.md) Section 6 (Phase 2: Bug Fixing, Phase 3: Feature Assessment)

---

## Work Organization

### Current Workflow: Epic/Story Structure

Starting 2025-10-26, all work follows an **Epic/Story structure** as defined in [prd.md](./prd.md).

**Story Cards Available:**
- **[stories/](./stories/)** - Individual story task cards with checklists
- **[stories/README.md](./stories/README.md)** - Story status overview and dependency graph

**Session Folder Naming Convention:**
```
session-2025-10-26-story-1.1-typescript-types/
session-2025-10-27-story-1.2-coordinate-engine/
session-2025-10-28-story-1.3-position-calculation/
```

Each session folder should reference its story number for traceability.

---

## Historical Documentation

**📦 [archive/](./archive/)** - Previous exploratory work (FOR REFERENCE ONLY)

⚠️ **These documents may contain outdated approaches and should NOT be used as authoritative sources.**

Historical session folders (`session-2025-*`) have been archived to prevent confusion. They represent exploratory work that led to the current plan but may have:
- Circular dependency patterns that were later identified as problematic
- Incomplete fixes that were superseded
- Different architectural approaches than the current plan

**When to reference archived sessions:**
- Understanding the history of a specific feature
- Researching why certain approaches were abandoned
- Learning from past mistakes

**When NOT to reference archived sessions:**
- Planning new work (use [prd.md](./prd.md) instead)
- Understanding current architecture (use [brownfield-architecture.md](./brownfield-architecture.md))
- Fixing bugs (use [circular-patterns-fix-plan.md](./circular-patterns-fix-plan.md))

---

## Quick Reference

### Story Dependency Graph
```
Story 1.1 (30 min) → Story 1.2 (8h) → Stories 1.3/1.4/1.5 (10h) → Story 1.15 (16h)
                  ↓
                  Story 1.6 (2h)
                  Story 1.7 (3h) → Story 1.8 (5h) → Story 1.9 (3h)
                  Story 1.10 (3h) → Story 1.11 (2h)
                  Story 1.12 (40h - parallel)
                  Story 1.13 (4h)
                  Story 1.14 (8h)
                  Story 1.16 (4h - after all) → Story 1.17 (1h)
```

### Critical Path (P1 Stories)
1.1 → 1.2 → 1.3/1.4/1.5 → 1.15 = **30.5 hours**

### Total Epic Effort
**~120 hours** (includes P1 + P2 stories + test coverage)

---

## Project Status

**Current Phase**: Phase 1 - Technical Debt Remediation
**Epic**: Epic 1 - Eliminate Circular Dependency Patterns
**Next Story**: Story 1.1 - Regenerate TypeScript Types (30 min)
**Overall Progress**: 0 of 17 stories completed

**Success Criteria for Phase 1 Completion**:
- ✅ All 5 circular patterns eliminated
- ✅ 70% test coverage for circular pattern areas
- ✅ AI agents can work without entering loops
- ✅ Zero breaking changes to existing functionality

**After Phase 1**:
- **Phase 2**: Bug Fixing (with stable foundation)
- **Phase 3**: Feature Assessment & Payment Integration (with analyst)

---

## Need Help?

**For AI Agents**:
- Stuck in a circular pattern? Read [brownfield-architecture.md](./brownfield-architecture.md) Appendix C: AI Agent Guidance
- Coordinate system confusion? Read [coordinate-system-visual-guide.md](./coordinate-system-visual-guide.md)
- Story unclear? Check the Implementation Reference link in the story

**For Developers**:
- Not sure where to start? Read [prd.md](./prd.md) Section 1
- Want to understand the technical debt? Read James's [CODE_REVIEW_COMPREHENSIVE.md](./CODE_REVIEW_COMPREHENSIVE.md)
- Need to understand dependencies? Check [prd.md](./prd.md) Appendix A: Story Dependency Graph

---

**Last Updated**: 2025-10-26
**Maintained By**: John (Product Manager) + Winston (Architect)
**Version**: 1.0
