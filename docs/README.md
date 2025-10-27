# Documentation Index

**Last Updated**: 2025-10-27
**Status**: Active

---

## ⚠️ Important: Start Here

**For current work, see [prd.md](./prd.md) and the linked authoritative documents below.**

Historical session documentation has been moved to [`docs/archive/`](./archive/) to prevent confusion with current approaches.

---

## Authoritative Documentation

These are the **current, authoritative** documents for working on this codebase:

### Core Project Documentation

1. **[CLAUDE.md](../CLAUDE.md)** - Project instructions for AI agents and developers
   - Git workflow rules (⚠️ AUTO-DEPLOY TO PRODUCTION)
   - Common development commands
   - Architecture overview
   - Critical files and responsibilities
   - Known issues and limitations

2. **[prd.md](./prd.md)** - Technical Debt Remediation PRD (THE PLAN)
   - Epic 1: Eliminate Circular Dependency Patterns
   - All stories with acceptance criteria
   - Success metrics and integration verification

3. **[HANDOVER.md](../HANDOVER.md)** - 🔥 **START HERE IF CONTINUING SESSION** 🔥
   - Complete context for next AI agent
   - Current progress and blockers
   - Next steps and recommendations

### Architecture & Technical Debt

4. **[brownfield-architecture.md](./brownfield-architecture.md)** - System architecture analysis
   - The 5 circular dependency patterns (detailed analysis)
   - Tech stack and module organization
   - Data models and coordinate systems
   - Technical debt catalog

5. **[CODE_REVIEW_COMPREHENSIVE.md](./CODE_REVIEW_COMPREHENSIVE.md)** - Comprehensive code review
   - 28 critical issues identified
   - Priority rankings and fix recommendations
   - Code quality analysis

6. **[circular-patterns-fix-plan.md](./circular-patterns-fix-plan.md)** - Step-by-step fix instructions
   - Detailed fix plans for each circular pattern
   - Testing strategies
   - Implementation order

7. **[coordinate-system-visual-guide.md](./coordinate-system-visual-guide.md)** - Visual transformation guides
   - ASCII diagrams of coordinate systems
   - Transformation examples
   - Common pitfalls

### AI Agent Guardrails

8. **[AI-AGENT-GUARDRAILS.md](./AI-AGENT-GUARDRAILS.md)** - ⚠️ **READ BEFORE MAKING CHANGES** ⚠️
   - The 5 circular patterns with step-by-step loop explanations
   - AI agent development checklist
   - Prevention strategies and red flags
   - Lessons learned from Epic 1

### Development Guidelines

9. **[STRUCTURED-LOGGING-GUIDE.md](./STRUCTURED-LOGGING-GUIDE.md)** - Logging best practices
   - Logger utility usage
   - Message formatting standards
   - Environment-aware behavior

10. **[INPUT-VALIDATION-GUIDE.md](./INPUT-VALIDATION-GUIDE.md)** - Input validation patterns
    - Zod schema usage
    - User-friendly error messages
    - Runtime validation integration

### Epic 1 Progress

11. **[EPIC_1_PROGRESS.md](./EPIC_1_PROGRESS.md)** - Complete Epic 1 status
    - Story completion status
    - Test coverage metrics
    - Integration verification results

---

## Historical Documentation

Historical session documentation (exploratory work, iteration notes, etc.) is archived in [`docs/archive/`](./archive/).

**⚠️ Do not reference archived documents for current work** - they may contain outdated approaches that led to circular patterns.

See [`docs/archive/ARCHIVE-README.md`](./archive/ARCHIVE-README.md) for details on what's archived and why.

---

## Quick Reference

### For AI Agents Starting a Session

1. Read [HANDOVER.md](../HANDOVER.md) for complete context
2. Read [AI-AGENT-GUARDRAILS.md](./AI-AGENT-GUARDRAILS.md) to avoid circular patterns
3. Check [prd.md](./prd.md) for current work plan
4. Review [EPIC_1_PROGRESS.md](./EPIC_1_PROGRESS.md) for status

### For Developers Fixing Bugs

1. Check [AI-AGENT-GUARDRAILS.md](./AI-AGENT-GUARDRAILS.md) - Which circular pattern applies?
2. Review [brownfield-architecture.md](./brownfield-architecture.md) - System architecture
3. See [circular-patterns-fix-plan.md](./circular-patterns-fix-plan.md) - Fix instructions

### For Understanding Coordinate Systems

1. [coordinate-system-visual-guide.md](./coordinate-system-visual-guide.md) - Visual diagrams
2. [AI-AGENT-GUARDRAILS.md](./AI-AGENT-GUARDRAILS.md) - Pattern #1 (Positioning Coordinate Circle)

### For Database Schema Changes

1. Always regenerate TypeScript types after migrations:
   ```bash
   npx supabase gen types typescript > src/integrations/supabase/types.ts
   ```
2. See [AI-AGENT-GUARDRAILS.md](./AI-AGENT-GUARDRAILS.md) - Pattern #3 (Type/Schema Mismatch)

---

## Feedback

If you find documentation issues:
1. Update the relevant document
2. Update this README if structure changes
3. Commit with clear message explaining the change

---

**Remember**: When in doubt, read [AI-AGENT-GUARDRAILS.md](./AI-AGENT-GUARDRAILS.md) to avoid circular patterns.
