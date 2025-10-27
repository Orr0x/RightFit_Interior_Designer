# TypeScript Type Generation Workflow

**Purpose**: Standard operating procedure for regenerating TypeScript types from Supabase database schema

**Audience**: Developers working on RightFit Interior Designer

**Last Updated**: 2025-10-26 (Story 1.1)

---

## When to Regenerate Types

Regenerate TypeScript types whenever:

1. **Database schema changes**
   - New tables added
   - New columns added to existing tables
   - Column types modified
   - Column constraints changed

2. **After running migrations**
   - Always regenerate after `npx supabase db push`
   - Always regenerate after `npx supabase migration up`

3. **Type errors appear**
   - TypeScript errors reference missing database fields
   - Autocomplete doesn't show expected database columns

4. **Starting new features**
   - Before implementing collision detection
   - Before implementing new database-driven features

---

## Prerequisites

1. **Supabase Project Access**
   - Project ID available (check `.env.example` or `.env.local`)
   - OR local Docker environment running

2. **Dependencies Installed**
   - `npm install` completed
   - `supabase` CLI installed (via `npx` or globally)

3. **Environment Variables**
   - `VITE_SUPABASE_URL` set
   - `VITE_SUPABASE_ANON_KEY` set

---

## Step-by-Step Workflow

### Option 1: Remote Generation (Recommended)

**When to use**: Docker not running, quickest method

```bash
# 1. Navigate to project root
cd i:/Curser_Git/CurserCode/plan-view-kitchen-3d

# 2. Generate types from remote project
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/integrations/supabase/types.ts

# 3. Verify generation succeeded
wc -l src/integrations/supabase/types.ts
# Expected: Thousands of lines (e.g., 4,081)

# 4. Run type checking
npm run type-check
# Expected: Zero errors

# 5. Commit the changes
git add src/integrations/supabase/types.ts
git commit -m "chore(types): Regenerate Supabase types from latest schema"
```

**Project ID**: Find in `.env.example` → `VITE_SUPABASE_URL` → Extract from URL

Example: `https://akfdezesupzuvukqiggn.supabase.co` → Project ID: `akfdezesupzuvukqiggn`

---

### Option 2: Local Generation

**When to use**: Working with local Supabase instance, testing migrations locally

```bash
# 1. Start local Supabase instance
npx supabase start

# 2. Verify instance is running
npx supabase status
# Should show all services running

# 3. Generate types from local instance
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# 4. Verify and commit (same as Option 1, steps 3-5)
```

**Note**: If `npx supabase status` fails with Docker errors, use Option 1 (Remote Generation) instead.

---

## Verification Checklist

After generating types, verify:

- [ ] **File size reasonable**: Thousands of lines generated (not empty or tiny)
- [ ] **No syntax errors**: File is valid TypeScript
- [ ] **Type check passes**: `npm run type-check` returns zero errors
- [ ] **Expected types present**: Grep for tables you modified
- [ ] **Git diff reasonable**: Changes match schema modifications

### Verification Commands

```bash
# Check file size
wc -l src/integrations/supabase/types.ts

# Check for specific table
grep -A 20 "your_table_name" src/integrations/supabase/types.ts

# Run type check
npm run type-check

# View git diff
git diff src/integrations/supabase/types.ts | head -100
```

---

## Common Issues & Solutions

### Issue 1: "Error: Project not linked"

**Cause**: Supabase CLI doesn't know which project to use

**Solution**: Use `--project-id` flag explicitly
```bash
npx supabase gen types typescript --project-id akfdezesupzuvukqiggn > src/integrations/supabase/types.ts
```

---

### Issue 2: "Docker not found" or "Container health check failed"

**Cause**: Docker Desktop not running or local instance not started

**Solution**: Use remote generation instead (Option 1 above)

---

### Issue 3: Empty or minimal types file generated

**Cause**: Wrong project ID or authentication issues

**Solution**:
1. Verify project ID matches `.env.example`
2. Check you have access to the Supabase project
3. Try regenerating with explicit project ID

---

### Issue 4: TypeScript errors after regeneration

**Cause**: Schema changes broke existing code

**Solution**:
1. Review git diff to see what changed
2. Update affected code to match new types
3. This is expected when fields are removed/renamed
4. Consider this a feature - TypeScript caught breaking changes!

---

## Integration with CI/CD

### Recommended: Type Check in CI

Add to your CI pipeline:

```yaml
# .github/workflows/ci.yml (example)
- name: Type Check
  run: npm run type-check
```

### NOT Recommended: Auto-generation in CI

**Don't**: Automatically regenerate types in CI
**Why**: Types should be committed and reviewed
**Instead**: Manually regenerate and commit when schema changes

---

## Best Practices

1. **Regenerate immediately after schema changes**
   - Don't let types drift from database reality

2. **Review the git diff**
   - Understand what changed
   - Verify changes match your schema modifications

3. **Run type-check before committing**
   - Catch breaking changes early
   - Fix affected code immediately

4. **Commit types with schema changes**
   - Include type regeneration in same commit as migration
   - OR: Commit types separately with clear message

5. **Document schema changes**
   - Add migration notes explaining field additions
   - Reference story/issue in commit message

---

## Type Generation Flags Reference

| Flag | Purpose | Example |
|------|---------|---------|
| `--local` | Generate from local Docker instance | `npx supabase gen types typescript --local` |
| `--project-id` | Generate from specific remote project | `npx supabase gen types typescript --project-id abc123` |
| `--schema` | Generate only specific schema | `npx supabase gen types typescript --schema public` |
| `--debug` | Show detailed error messages | `npx supabase gen types typescript --debug` |

---

## Quick Reference Commands

```bash
# Remote generation (most common)
npx supabase gen types typescript --project-id <ID> > src/integrations/supabase/types.ts

# Local generation
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# Type check
npm run type-check

# Find your project ID
cat .env.example | grep VITE_SUPABASE_URL
# Extract from URL: https://<PROJECT_ID>.supabase.co

# Verify generation
wc -l src/integrations/supabase/types.ts && npm run type-check
```

---

## Related Documentation

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [TypeScript Type Generation](https://supabase.com/docs/guides/api/generating-types)
- Story 1.1: [1.1-typescript-types.md](../stories/1.1-typescript-types.md)
- Winston's Analysis: [circular-patterns-fix-plan.md](../circular-patterns-fix-plan.md) - Fix #3

---

**Document Version**: 1.0
**Created**: 2025-10-26
**Created By**: James (Dev Agent)
**Last Verified**: Story 1.1 completion
