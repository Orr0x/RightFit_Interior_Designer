# Project Instructions for Claude Code

## Session Initialization (CRITICAL - READ FIRST)

### Starting a New Conversation
**BEFORE accepting any coding tasks**, perform the following initialization:

1. **Review Recent Documentation**
   - Check `docs/` for the most recent session folders (sorted by date)
   - Read the latest 2-3 session plans to understand recent work
   - Review any planning documents, analysis files, and decisions made

2. **Understand Current Codebase State**
   - Review git status and recent commits
   - Check current branch and recent changes
   - Identify what features/fixes were recently implemented

3. **Identify Documentation Inconsistencies**
   - Compare documentation in `docs/` with actual code implementation
   - Note any discrepancies between:
     - Planned features vs implemented features
     - Documentation descriptions vs actual code
     - Database schema docs vs actual schema
     - API documentation vs actual endpoints
   - Flag outdated documentation that needs updating

4. **Create Context Report**
   - Create session folder: `docs/YYYY-MM-DD-context-review/`
   - Document findings: `docs/YYYY-MM-DD-context-review/initialization-report.md`
   - Include:
     - Recent changes summary
     - Current project state
     - Documentation inconsistencies found
     - Recommendations for updates needed
   - Present this report to the user BEFORE starting work

**Purpose**:
- Ensures correct context before coding starts
- Prevents working with outdated assumptions
- Identifies technical debt in documentation
- Provides clear picture of project state

**When to skip**: Only skip if user explicitly says "skip initialization" or requests urgent hotfix

## Database Configuration

### Supabase Connection
- **ALWAYS** use Supabase credentials from `.env` file
- Database URL: `VITE_SUPABASE_URL`
- Anon Key: `VITE_SUPABASE_ANON_KEY`
- Project ID: `VITE_SUPABASE_PROJECT_ID`
- **NEVER** attempt to:
  - Start Docker containers for local databases
  - Look for local PostgreSQL instances
  - Suggest alternative database connections
- The Supabase client is properly configured in `src/integrations/supabase/client.ts`

### Credential Failure Handling
If Supabase connection fails due to authentication/credential errors:
1. **DO NOT retry multiple times** - this wastes tokens
2. **STOP and discuss with user** - Start a conversation about testing credentials
3. **Suggest verification steps**:
   ```powershell
   # Check .env file exists and has correct values
   cat .env

   # Test credentials manually in Supabase dashboard
   # Or provide a simple test script
   ```
4. **Discuss potential issues**:
   - Are credentials expired?
   - Has the Supabase project URL changed?
   - Are environment variables being loaded correctly?
   - Is there a network/firewall issue?
5. **Wait for user confirmation** before proceeding with any database operations

**DO NOT**:
- Keep retrying with same credentials
- Try to "fix" credentials automatically
- Suggest hardcoding credentials
- Look for alternative connection methods

### Database Access Methods
**NEVER use `psql` command directly** - it is not installed on this system.

**Instead, use these methods** (in order of preference):
1. **Supabase JavaScript Client** - Use `@supabase/supabase-js` for queries
2. **Node.js scripts** - Write `.js` or `.ts` scripts that use Supabase client from `.env`
3. **Ask user to paste SQL** - Provide SQL for user to run in Supabase SQL Editor

**Example Node.js script approach:**
```typescript
// scripts/run-migration.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function runMigration() {
  const { data, error } = await supabase.rpc('your_function');
  // or use .from('table').select()
  console.log(data, error);
}

runMigration();
```

### SQL Migration Strategy
When SQL migrations or database operations fail:
1. **DO NOT retry multiple times** - this wastes tokens
2. **After first failure**: Ask the user to paste the SQL directly into Supabase SQL Editor
3. Provide the SQL content clearly formatted for easy copy-paste
4. Explain what the SQL does and any expected results
5. Move on to other tasks while waiting for user confirmation

Example response on failure:
```
The automated migration failed. To avoid retry loops, please:
1. Open Supabase SQL Editor
2. Paste this SQL:
   [SQL CONTENT HERE]
3. Run it manually
4. Let me know the result
```

## Git and Deployment Rules

### Branch Protection
- **NEVER commit directly to `main` branch**
- **NEVER push to `main` branch**
- Always work on feature branches
- Current feature branch: Check with `git branch --show-current`

### Creating Safe Work Branches (CRITICAL)
**BEFORE starting ANY coding work** (features, fixes, refactors, etc.):

1. **Check current branch**:
   ```powershell
   git branch --show-current
   ```

2. **If on `main` branch, STOP and create a new branch**:
   - Branch naming format: `feature/descriptive-name` or `fix/descriptive-name`
   - Examples:
     - `feature/wall-counting-system`
     - `fix/supabase-credential-error`
     - `refactor/room-template-logic`

3. **Provide PowerShell commands for user to create branch**:
   ```powershell
   # Create and switch to new branch from main
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name

   # Or create from current branch
   git checkout -b feature/your-feature-name
   ```

4. **Wait for confirmation** that user has switched to the new branch

5. **Only then proceed** with coding work

**Protection workflow**:
- Check branch → Not on safe branch? → Stop → Ask user to create branch → Wait → Proceed
- On safe feature branch? → Proceed with work
- This ensures ALL commits go to feature branches, never to main

### Commit and Push Process
When commits or pushes are needed:
1. **DO NOT** execute git commands for main branch operations
2. **DO** provide PowerShell commands for the user to execute
3. Format commands clearly for easy copy-paste

Example format:
```powershell
# Review changes
git status
git diff

# Commit changes
git add .
git commit -m "Your commit message"

# Push to current branch
git push origin feature/branch-name

# Create PR (if needed)
gh pr create --title "PR Title" --body "Description"
```

### When to provide commands vs execute
- **Execute automatically**: Development commands (npm, build, test, lint)
- **Provide commands only**:
  - Commits to main
  - Pushes to main
  - Branch merges
  - Git operations that modify main branch
  - Deployment operations

## Project Context

### Project Root
- **Root directory**: `I:\Curser_Git\CurserCode\plan-view-kitchen-3d`
- All file paths should be relative to this root directory
- This is the working directory for all operations

### Technology Stack
- Frontend: React + TypeScript + Vite
- 3D Rendering: Three.js / React Three Fiber
- Database: Supabase (PostgreSQL)
- Styling: Tailwind CSS
- State Management: React hooks

### Key Directories
- `src/components/` - React components
- `src/services/` - Business logic and API services
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions
- `scripts/` - Database and build scripts
- `src/integrations/supabase/` - Supabase client and types

### Documentation and Output Directories
- **Test results**: `docs/test-results/` - All test output files and reports
- **Screenshots**: `docs/test-results/ScreenShots/` - Test screenshots and visual artifacts
- **Browser logs**: `docs/browser console logs/` - Browser console output and debugging logs
- **Database exports**: `docs/Database/` - Database schema exports, backups, and SQL files

When creating or looking for:
- Test results → Use `docs/test-results/`
- Screenshots → Use `docs/test-results/ScreenShots/`
- Console logs → Use `docs/browser console logs/`
- DB exports → Use `docs/Database/`

### Session Documentation (IMPORTANT)
**At the start of each session**, create a new folder in `docs/` for that session:
- **Naming format**: `YYYY-MM-DD-task-description`
  - Example: `2025-10-11-implement-wall-counting-system`
  - Example: `2025-10-11-fix-supabase-migration-errors`
  - Example: `2025-10-11-refactor-room-templates`
- **Purpose**: Store all session-related documentation and context
- **Contents should include**:
  - Analysis files
  - Planning documents
  - Task breakdowns
  - Research findings
  - Relevant code snippets or examples
  - Session notes and decisions made
  - Any other context data for the session's tasks

**Workflow**:
1. User provides task/goal
2. Create session folder: `docs/YYYY-MM-DD-task-description/`
3. Create initial planning file: `docs/YYYY-MM-DD-task-description/session-plan.md`
4. Document analysis, decisions, and progress throughout the session
5. Keep all session artifacts organized in this folder
6. **At end of work**: Create handoff document (see Session Handoff below)

This ensures:
- Historical record of work done
- Easy reference for future sessions
- Context preservation across sessions
- Clear organization of documentation

### Session Handoff Document (CRITICAL)
**At the end of each work session or when work is complete**, create a handoff document for the next agent:

**File location**: `docs/YYYY-MM-DD-task-description/HANDOFF.md`

**Must include (be concise - max 2000 tokens)**:
1. **Work Completed**:
   - What was accomplished
   - Files changed (with line references)
   - Features added/bugs fixed

2. **Current State**:
   - What's working
   - What's tested
   - Current branch name
   - Any pending commits or PRs

3. **Next Steps** (if applicable):
   - What remains to be done
   - Specific tasks or issues to address
   - Dependencies or blockers

4. **Important Context**:
   - Key decisions made and why
   - Any gotchas or issues encountered
   - Location of relevant files/functions
   - Database changes (if any)

5. **Testing Notes**:
   - What was tested
   - Test results location
   - Any failing tests or known issues

**Format example**:
```markdown
# Session Handoff: [Task Name]
Date: YYYY-MM-DD
Branch: feature/branch-name

## Work Completed
- Implemented wall counting system in `src/services/WallCounter.ts:45`
- Added new hook `useWallCount` in `src/hooks/useWallCount.ts`
- Updated room template to include wall count data

## Current State
✅ Wall counting logic working
✅ Tests passing (see docs/test-results/2025-10-11/)
⏳ Needs PR review
Branch: feature/wall-counting

## Next Steps
1. Get PR merged to main
2. Update documentation for wall counting API
3. Add UI component to display wall count

## Important Context
- Using polygon-based counting, not edge-based (decided after testing showed better accuracy)
- Database schema updated with `wall_count` column in `room_templates` table
- See `docs/2025-10-11-wall-counting/analysis.md` for decision rationale

## Testing
- All unit tests pass
- Manual testing done on L-shaped and U-shaped rooms
- No integration tests yet
```

**When to create handoff**:
- End of work session
- Before stopping work on a feature
- When switching to different task
- When user says "done" or "finished"

**Purpose**:
- Next agent can continue seamlessly
- No context loss between sessions
- Clear continuity of plans and decisions
- Reduces need to re-analyze codebase

### Important Files
- `.env` - Environment variables (DO NOT commit)
- `src/integrations/supabase/client.ts` - Database client
- `vite.config.ts` - Build configuration

## Documentation Creation Rules (CRITICAL)

### Token-Efficient Documentation
When user requests documentation be created:

**NEVER:**
- Read hundreds of files to create comprehensive documentation
- Generate massive documentation sets that consume 50K+ tokens
- Create exhaustive API documentation by reading every file
- Perform deep recursive analysis of entire codebase
- Generate documentation "just in case" without specific request

**ALWAYS:**
- Ask user FIRST: "What specific aspect needs documentation?"
- Document only what was explicitly requested
- Use targeted file reads (5-10 files maximum)
- Create concise, focused documentation
- Use bullet points and brief descriptions
- Link to code locations instead of copying code
- Estimate token usage BEFORE creating large docs

**Examples of efficient documentation:**

Good (efficient):
```markdown
# Authentication System
- Location: `src/auth/`
- Uses Supabase Auth
- Key files: `AuthProvider.tsx`, `useAuth.ts`
- See: src/auth/AuthProvider.tsx:23 for implementation
```

Bad (wasteful):
```markdown
# Complete Authentication System Documentation
[Reads 50 files, copies entire code blocks, generates 20 pages]
```

**Documentation workflow:**
1. User requests documentation
2. Ask: "What specific aspect? (API, architecture, feature X, etc.)"
3. User clarifies scope
4. Read only relevant files (max 5-10)
5. Create focused, concise documentation
6. Save to session folder

**Token budget for documentation:**
- Small doc (feature/component): < 2000 tokens
- Medium doc (system/architecture): < 5000 tokens
- Large doc (full module): < 10000 tokens
- If exceeding these limits: Ask user if they want to proceed

**Remember:** Documentation that's not retained (due to context loss) is wasted tokens. Keep it minimal and targeted.

## Best Practices

### Code Quality
- Always use TypeScript strict mode
- Prefer functional components and hooks
- Follow existing code patterns in the project
- Add comments for complex logic

### Performance
- Be mindful of React re-renders
- Use useMemo/useCallback where appropriate
- Optimize 3D rendering operations

### Token Efficiency
- Don't get stuck in retry loops
- Ask for manual intervention early
- Provide clear, actionable instructions when blocked
- Focus on productive tasks while waiting for user input
- NEVER create documentation without specific scope defined
- Use Task tool for large analysis tasks to reduce context usage
