# User Reminders - Start of Claude Code Session

## Things to tell Claude at session start:

### For new work:
```
Follow initialization workflow, then [describe your task]
```

### To continue previous work:
```
Read the latest HANDOFF.md in docs/ and continue from there
```

### Before Claude starts coding:
- ✅ Check he's created a session folder (docs/YYYY-MM-DD-task-name/)
- ✅ Check he's verified the current git branch (not on main!)
- ✅ Check he's reviewed recent documentation

## Quick reminders for me:

### Git workflow:
- Never commit directly to main
- Always work on feature branches: `feature/name` or `fix/name`
- Claude will provide PowerShell commands, I run them

### Database:
- Credentials in `.env` file
- If SQL fails, paste directly into Supabase SQL Editor
- Don't let Claude retry failed connections

### Documentation:
- Ask Claude for handoff document when work is done
- Keep handoff documents concise (< 2000 tokens)
- Check docs/YYYY-MM-DD-* folders for recent context

### Token efficiency:
- Stop Claude if he's reading too many files
- Be specific about documentation scope
- Use "skip initialization" for urgent hotfixes

## Project structure quick reference:
- Code: `src/`
- Tests: `docs/test-results/`
- Screenshots: `docs/test-results/ScreenShots/`
- Browser logs: `docs/browser console logs/`
- DB exports: `docs/Database/`
- Session docs: `docs/YYYY-MM-DD-task-name/`

## Common commands I'll need:

### Git - Branch Management
```powershell
# Check which branch I'm on
git branch --show-current

# List all branches
git branch -a

# Create and switch to new branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Switch to existing branch
git checkout feature/branch-name

# Delete local branch (after merged)
git branch -d feature/branch-name
```

### Git - Status and Review
```powershell
# Check current status
git status

# View changes (unstaged)
git diff

# View changes (staged)
git diff --cached

# View recent commits
git log --oneline -10

# View commit history for current branch
git log --oneline main..HEAD
```

### Git - Committing and Pushing
```powershell
# Stage all changes
git add .

# Stage specific file
git add path/to/file.ts

# Commit with message
git commit -m "feat: your commit message"

# Push to remote (first time)
git push -u origin feature/branch-name

# Push to remote (subsequent)
git push

# Check if local is up to date with remote
git fetch
git status
```

### Git - Creating Pull Requests
```powershell
# Create PR using GitHub CLI
gh pr create --title "Your PR title" --body "Description"

# View PRs
gh pr list

# Check PR status
gh pr status
```

### Git - Undoing Changes
```powershell
# Undo unstaged changes in file
git checkout -- path/to/file.ts

# Unstage file (keep changes)
git reset HEAD path/to/file.ts

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View what changed in last commit
git show HEAD
```

### NPM/Build Commands
```powershell
# Install dependencies
npm install

# Run dev server
npm run dev

# Build project
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

### File Operations
```powershell
# View file contents
cat path/to/file.ts

# View .env file
cat .env

# List files in directory
ls
ls -la  # detailed list

# Find files by name
ls -r -filter *.ts

# Create directory
mkdir path/to/directory
```

### Supabase Commands
```powershell
# Login to Supabase
npx supabase login

# Check Supabase status
npx supabase status

# Pull schema from cloud
npx supabase db pull

# Push migrations to cloud
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --local > src/types/supabase.ts
```

### Navigation
```powershell
# Go to project root
cd I:\Curser_Git\CurserCode\plan-view-kitchen-3d

# Go to subdirectory
cd src\components

# Go up one level
cd ..

# Show current directory
pwd
```

### Useful Shortcuts
```powershell
# Clear terminal
clear

# Show command history
history

# Stop running process
Ctrl + C

# Exit terminal
exit
```

## My Personal Rules Checklist

### ✅ Before Starting Work:
- [ ] Am I on the correct branch? (NOT main!)
- [ ] Have I pulled latest changes? (`git pull origin main`)
- [ ] Do I have uncommitted changes? (`git status`)
- [ ] Have I read the latest HANDOFF.md?
- [ ] Do I know what I'm trying to achieve?

### ✅ During Work:
- [ ] Am I committing regularly (not massive commits)?
- [ ] Are my commit messages clear and descriptive?
- [ ] Am I testing changes before committing?
- [ ] Am I keeping .env file secure (not committing it)?
- [ ] Am I stopping Claude if token usage seems high?

### ✅ Safe Git Practices:
- [ ] NEVER commit directly to main
- [ ] NEVER push to main
- [ ] NEVER force push unless I know what I'm doing
- [ ] ALWAYS create feature branches for new work
- [ ] ALWAYS review changes before committing (`git diff`)
- [ ] ALWAYS write meaningful commit messages

### ✅ Database Safety:
- [ ] NEVER commit .env file
- [ ] NEVER hardcode credentials
- [ ] ALWAYS test SQL in Supabase SQL Editor first if unsure
- [ ] ALWAYS backup database before major schema changes
- [ ] NEVER delete production data without backup

### ✅ Claude Code Safety:
- [ ] Stop Claude if he's reading 50+ files
- [ ] Ask for clarification if Claude's plan seems unclear
- [ ] Verify Claude created session folder and HANDOFF
- [ ] Don't let Claude retry failed operations endlessly
- [ ] Ask Claude to explain commands I don't understand

### ✅ Code Quality:
- [ ] Does the code work? (Test it!)
- [ ] Are there any console errors?
- [ ] Is the code readable?
- [ ] Have I removed debug/test code?
- [ ] Does TypeScript show any errors?

### ✅ End of Session:
- [ ] Ask Claude to create HANDOFF.md
- [ ] Review what was completed
- [ ] Commit all working changes
- [ ] Push branch to remote (if ready)
- [ ] Verify tests passed (if any)
- [ ] Document any blockers or issues
- [ ] Close any terminals/processes running

## When Things Go Wrong:

### Git Issues:
```powershell
# Accidentally on main and made changes?
git stash
git checkout -b feature/rescue-changes
git stash pop

# Made commit to wrong branch?
git log  # copy commit hash
git checkout correct-branch
git cherry-pick <commit-hash>

# Need to undo everything and start over?
git reset --hard HEAD  # WARNING: loses all changes!
git clean -fd  # WARNING: deletes untracked files!
```

### Database Issues:
- Credential errors → Check .env file matches Supabase dashboard
- Migration fails → Paste SQL directly in Supabase SQL Editor
- Connection fails → Check internet, check Supabase status page

### Claude Issues:
- Context loss → Check docs/YYYY-MM-DD-*/HANDOFF.md files
- Token waste → Stop him, be more specific about task
- Wrong approach → "Stop, let me clarify the requirement"

## Quick Decision Guide:

**Should I commit this?**
- ✅ If it works and doesn't break anything
- ❌ If it has TODOs, debug code, or is half-finished
- ❌ If tests are failing
- ❌ If it contains secrets/credentials

**Should I push this branch?**
- ✅ If commits are clean and work is complete/stable
- ✅ If I want backup of my work
- ✅ If ready for review/PR
- ❌ If contains experimental/broken code
- ❌ If I'm not ready for others to see it

**Should I create a PR?**
- ✅ If feature is complete and tested
- ✅ If fixes a bug and is tested
- ✅ If ready for code review
- ❌ If work is in progress
- ❌ If tests are failing

**Should I merge to main?**
- ✅ ONLY after PR approval
- ✅ ONLY if all tests pass
- ✅ ONLY if reviewed by team (if applicable)
- ❌ NEVER merge without testing
- ❌ NEVER force merge
