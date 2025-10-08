# Rollback Procedures: Dynamic 3D Models

**Purpose**: Emergency procedures for rolling back the dynamic 3D model system
**Audience**: DevOps, System Administrators, Technical Leads
**Last Updated**: January 29, 2025

⚠️ **CRITICAL**: Keep this document accessible during production rollout

---

## 📋 Table of Contents

1. [Quick Reference](#quick-reference)
2. [Rollback Scenarios](#rollback-scenarios)
3. [Level 1: Feature Flag Disable](#level-1-feature-flag-disable)
4. [Level 2: Database Rollback](#level-2-database-rollback)
5. [Level 3: Code Rollback](#level-3-code-rollback)
6. [Verification Procedures](#verification-procedures)
7. [Post-Rollback Actions](#post-rollback-actions)
8. [Prevention & Monitoring](#prevention--monitoring)

---

## Quick Reference

### **Emergency Contact**

| Role | Contact | Availability |
|------|---------|--------------|
| Technical Lead | [Name] | 24/7 |
| DevOps On-Call | [Name] | 24/7 |
| Database Admin | [Name] | Business hours |

### **Quick Rollback Commands**

```bash
# Level 1: Disable feature flag (30 seconds)
psql $DATABASE_URL -c "UPDATE feature_flags SET enabled_dev = FALSE, enabled_production = FALSE WHERE flag_key = 'use_dynamic_3d_models';"

# Level 2: Rollback database (5 minutes)
supabase db reset --db-url $DATABASE_URL

# Level 3: Rollback code (10 minutes)
git revert <commit-hash>
git push origin main
# Trigger deployment
```

---

## Rollback Scenarios

### **When to Rollback**

Roll back immediately if you observe:

1. **Critical Errors** (P0)
   - 500 errors > 5% of requests
   - Complete loss of 3D rendering
   - Database connection failures
   - Data corruption

2. **Major Issues** (P1)
   - Visual regressions affecting > 50% of components
   - Performance degradation > 2x slower
   - Memory leaks causing crashes
   - Feature flag not disabling properly

3. **Moderate Issues** (P2)
   - Visual issues affecting < 50% of components
   - Performance degradation 1.5-2x slower
   - Non-critical errors in logs
   - User reports of missing features

### **When NOT to Rollback**

Do NOT rollback for:
- Minor visual differences (< 5px off)
- Single component issues (can disable that component)
- Performance issues < 1.5x slower
- Non-critical console warnings
- User confusion (can be addressed with support)

**Instead**: File a bug, disable specific models, or schedule a fix.

---

## Level 1: Feature Flag Disable

**Time**: 30 seconds
**Impact**: Immediate fallback to hardcoded 3D models
**Risk**: LOW - Designed for safe fallback

Use this for:
- Quick testing of rollback
- Suspected issues with dynamic rendering
- Performance problems
- Any uncertainty about system health

### **Procedure**

#### **Step 1: Disable Feature Flag (30 seconds)**

```sql
-- Connect to Supabase dashboard or use psql
-- SQL Editor → New Query

-- Disable dynamic 3D models
UPDATE feature_flags
SET
  enabled_dev = FALSE,
  enabled_production = FALSE,
  rollout_percentage = 0
WHERE flag_key = 'use_dynamic_3d_models';

-- Verify change
SELECT
  flag_key,
  enabled_dev,
  enabled_production,
  rollout_percentage,
  updated_at
FROM feature_flags
WHERE flag_key = 'use_dynamic_3d_models';
```

**Expected Output:**
```
flag_key               | enabled_dev | enabled_production | rollout_percentage | updated_at
use_dynamic_3d_models  | false       | false              | 0                  | 2025-01-29 14:30:00
```

#### **Step 2: Verify Fallback (1 minute)**

Open the application in a private/incognito browser window:

1. **Clear cache**: Ctrl+Shift+Delete → Clear cache
2. **Navigate to designer**: Create new kitchen design
3. **Check console logs**:
   ```javascript
   // Should see:
   [Model3DLoader] Feature disabled, skipping preload
   [EnhancedCabinet3D] Dynamic 3D models DISABLED, using hardcoded
   ```
4. **Drop components**: Test 2-3 corner cabinets
5. **Verify rendering**: Should use hardcoded 3D models (old system)

#### **Step 3: Monitor for 5 Minutes**

Watch for:
- ✅ No 3D rendering errors
- ✅ Components appear correctly
- ✅ Selection works
- ✅ Rotation works
- ✅ No console errors

#### **Step 4: Communicate Status**

```markdown
## Feature Flag Disabled ✅

**Time**: [timestamp]
**Action**: Disabled use_dynamic_3d_models feature flag
**Status**: All users now using hardcoded 3D models
**Impact**: No user-facing changes expected
**Next Steps**: Investigating issue, will re-enable when resolved

**Verification**:
- ✅ Feature flag disabled in database
- ✅ Hardcoded rendering confirmed
- ✅ No errors in last 5 minutes
- ✅ User reports stable
```

### **Re-enable After Fix**

Once issue is resolved:

```sql
-- Re-enable feature flag
UPDATE feature_flags
SET
  enabled_dev = TRUE,
  enabled_production = FALSE,  -- Start with dev only
  rollout_percentage = 0       -- Or gradual rollout
WHERE flag_key = 'use_dynamic_3d_models';
```

---

## Level 2: Database Rollback

**Time**: 5-10 minutes
**Impact**: Removes 3D model data from database
**Risk**: MEDIUM - Preserves user designs, removes model data

Use this when:
- Feature flag disable didn't resolve issue
- Database schema has problems
- Data corruption detected
- Need to revert to pre-migration state

### **Procedure**

#### **Step 1: Backup Current Database (2 minutes)**

```bash
# Create backup before rollback
supabase db dump --db-url $DATABASE_URL > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql

# Verify backup created
ls -lh backup_before_rollback_*.sql
```

#### **Step 2: Identify Target Migration (1 minute)**

```bash
# List migrations
supabase migration list

# Identify last good migration before 3D models
# Should be: 20250129000005_create_app_configuration.sql
```

**Migrations to Rollback:**
- ❌ `20250129000009_add_performance_indexes.sql`
- ❌ `20250129000008_rename_corner_cabinets_to_lshaped.sql`
- ❌ `20250129000007_populate_corner_cabinets.sql`
- ❌ `20250129000006_create_3d_models_schema.sql`
- ✅ `20250129000005_create_app_configuration.sql` ← Roll back to here

#### **Step 3: Execute Rollback (2 minutes)**

```bash
# Option A: Supabase CLI (recommended)
supabase db reset --db-url $DATABASE_URL
# Then manually reapply migrations up to 20250129000005

# Option B: Manual SQL rollback
psql $DATABASE_URL << 'EOF'
-- Drop 3D model tables (in reverse dependency order)
DROP TABLE IF EXISTS geometry_parts CASCADE;
DROP TABLE IF EXISTS material_definitions CASCADE;
DROP TABLE IF EXISTS component_3d_models CASCADE;

-- Remove feature flag
DELETE FROM feature_flags WHERE flag_key = 'use_dynamic_3d_models';
EOF
```

#### **Step 4: Verify Rollback (1 minute)**

```sql
-- Check tables are gone
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('component_3d_models', 'geometry_parts', 'material_definitions');
-- Should return 0 rows

-- Check feature flag removed
SELECT * FROM feature_flags WHERE flag_key = 'use_dynamic_3d_models';
-- Should return 0 rows

-- Check user data intact
SELECT COUNT(*) FROM room_designs;
-- Should return same count as before rollback
```

#### **Step 5: Clear Application Caches (1 minute)**

```bash
# If using Redis or similar
redis-cli FLUSHDB

# If using CDN cache
# Purge CDN cache for /designer routes
```

#### **Step 6: Monitor Application (5 minutes)**

1. **Clear browser cache**
2. **Test application**:
   - Create new design
   - Drop components
   - Check 3D rendering (should use hardcoded)
   - Verify no errors
3. **Check logs** for errors
4. **Monitor error tracking** (Sentry, etc.)

---

## Level 3: Code Rollback

**Time**: 10-30 minutes
**Impact**: Reverts code changes related to dynamic 3D models
**Risk**: HIGH - Affects entire codebase

Use this when:
- Database rollback didn't resolve issue
- Code changes causing problems
- Need to revert to completely stable state

### **Procedure**

#### **Step 1: Identify Commits to Revert**

```bash
# List commits related to dynamic 3D models
git log --oneline --grep="Week 1[3-9]" --grep="3D" --grep="dynamic" -20

# Identify commits to revert (from Week 13-19)
# Example:
# 9d2d65b - Week 19 completion review
# 0b3b967 - Refactor: Centralize component ID mapping
# 066f2ba - Add database indexes
# 7607a12 - Fix migration
# b3c79bf - Rename corner cabinets
# c6aec1c - Add L-Shaped Test Cabinet mapping
# 5d1dede - Fix unary minus operator
# 7bf75b7 - Add height component variables
# 0706bb5 - Week 19 troubleshooting
# ... (more commits)
```

#### **Step 2: Create Rollback Branch**

```bash
# Create rollback branch from last known good commit
git checkout main
git pull origin main

# Find last commit before Week 13
git log --oneline --before="2025-01-15" -5

# Create rollback branch
git checkout -b rollback/dynamic-3d-models-$(date +%Y%m%d)

# Revert commits (latest first)
git revert <commit-hash-1> <commit-hash-2> ... <commit-hash-n>

# Or reset to specific commit (destructive)
# git reset --hard <last-good-commit-hash>
```

#### **Step 3: Test Rollback Locally**

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Start dev server
npm run dev

# Manual testing:
# 1. Open http://localhost:5173
# 2. Create new design
# 3. Drop components
# 4. Check 3D rendering
# 5. Verify no errors
```

#### **Step 4: Deploy Rollback**

```bash
# Push rollback branch
git push origin rollback/dynamic-3d-models-$(date +%Y%m%d)

# Create PR for review
gh pr create --title "ROLLBACK: Dynamic 3D Models" --body "Emergency rollback due to [issue]"

# After approval, merge to main
git checkout main
git merge rollback/dynamic-3d-models-$(date +%Y%m%d)
git push origin main

# Trigger deployment (depends on CI/CD setup)
# Option A: Automatic deploy on push to main
# Option B: Manual deploy
npm run deploy
# Option C: GitHub Actions
gh workflow run deploy.yml
```

#### **Step 5: Verify Production**

1. **Wait for deployment** (5-10 minutes)
2. **Check production site**
3. **Test designer functionality**
4. **Monitor error rates** (should drop to 0)
5. **Check user reports** (should stop coming in)

---

## Verification Procedures

### **Feature Flag Verification**

```sql
-- Check flag status
SELECT
  flag_key,
  enabled_dev,
  enabled_production,
  rollout_percentage,
  updated_at
FROM feature_flags
WHERE flag_key = 'use_dynamic_3d_models';

-- Expected after rollback:
-- enabled_dev = false
-- enabled_production = false
-- rollout_percentage = 0
```

### **Database Schema Verification**

```sql
-- Check if 3D model tables exist
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('component_3d_models', 'geometry_parts', 'material_definitions');

-- Expected after Level 1: 3 tables present
-- Expected after Level 2: 0 tables present
```

### **User Data Verification**

```sql
-- Verify user designs intact
SELECT
  COUNT(*) as total_designs,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(updated_at) as last_update
FROM room_designs;

-- Compare to pre-rollback metrics
-- Should be identical or slightly higher (ongoing activity)
```

### **Application Verification**

**Browser Console Checks:**

```javascript
// After Level 1 rollback (feature flag):
// Should see:
[Model3DLoader] Feature disabled, skipping preload
[EnhancedCabinet3D] Dynamic 3D models DISABLED

// After Level 2/3 rollback:
// Should see only hardcoded rendering logs
// NO dynamic model logs
```

**Visual Verification:**
1. Drop 5 different component types
2. Switch to 3D view
3. Verify all render correctly
4. Test rotation (should work)
5. Test selection (should work)
6. Check console for errors (should be 0)

---

## Post-Rollback Actions

### **Immediate Actions (Within 1 Hour)**

1. **Notify Team**
   ```markdown
   ## Dynamic 3D Models Rollback Complete

   **Time**: [timestamp]
   **Level**: [1/2/3]
   **Reason**: [brief description]
   **Status**: System stable on hardcoded models
   **User Impact**: None expected
   **Next Steps**: Root cause analysis scheduled
   ```

2. **Document Incident**
   - Create incident report
   - Note timeline of events
   - Record metrics (error rates, response times)
   - Capture screenshots/logs

3. **Update Status Page**
   - Mark incident as resolved
   - Post summary of issue and resolution
   - Provide ETA for fix (if known)

### **Short-Term Actions (Within 24 Hours)**

4. **Root Cause Analysis**
   - Review logs and error messages
   - Identify exact failure point
   - Determine why testing didn't catch it
   - Create bug ticket with details

5. **Fix Implementation**
   - Develop fix for root cause
   - Add tests to prevent regression
   - Test thoroughly in dev environment
   - Code review with 2+ reviewers

6. **Update Rollback Procedures**
   - Document what worked well
   - Note any difficulties encountered
   - Update procedures with lessons learned

### **Long-Term Actions (Within 1 Week)**

7. **Enhanced Testing**
   - Add missing test coverage
   - Implement load testing
   - Add visual regression tests
   - Expand monitoring

8. **Gradual Re-deployment**
   - Enable in dev environment
   - Test for 1-2 days
   - Enable for 1% of production users
   - Monitor closely, increase gradually

9. **Post-Mortem**
   - Schedule team meeting
   - Review incident timeline
   - Identify prevention measures
   - Update documentation

---

## Prevention & Monitoring

### **Pre-Deployment Checklist**

Before enabling dynamic 3D models in production:

- [ ] All tests passing (unit, integration, e2e)
- [ ] Visual regression tests completed
- [ ] Load testing completed (500+ concurrent users)
- [ ] Performance benchmarks met (<50ms per component)
- [ ] Feature flag verified working in dev
- [ ] Rollback procedures tested in staging
- [ ] Database backup created
- [ ] Monitoring alerts configured
- [ ] On-call engineer notified
- [ ] Rollback decision tree documented

### **Monitoring Setup**

**Key Metrics to Track:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 1% | Investigate |
| Error Rate | > 5% | Rollback |
| Load Time | > 200ms | Investigate |
| Load Time | > 500ms | Rollback |
| Memory Usage | > 500MB | Investigate |
| Memory Usage | > 1GB | Rollback |

**Alerts to Configure:**

```yaml
# Example: Sentry/Datadog alerts
alerts:
  - name: "High Error Rate - Dynamic 3D Models"
    condition: error_rate > 5%
    window: 5 minutes
    action: notify_on_call

  - name: "Slow Model Loading"
    condition: p95_load_time > 500ms
    window: 10 minutes
    action: notify_team

  - name: "Memory Leak Detected"
    condition: memory_growth > 100MB/hour
    window: 1 hour
    action: notify_on_call
```

### **Gradual Rollout Plan**

**Phase 1: Development (Week 19)**
- ✅ Enable for internal team
- ✅ Test all functionality
- ✅ Fix any issues found

**Phase 2: Staging (Week 24)**
- [ ] Enable in staging environment
- [ ] Run full test suite
- [ ] Invite beta testers
- [ ] Monitor for 2 days

**Phase 3: Production Canary (Week 25)**
- [ ] Enable for 1% of users
- [ ] Monitor closely for 24 hours
- [ ] If stable, increase to 5%
- [ ] Monitor for 48 hours

**Phase 4: Production Gradual (Week 25-26)**
- [ ] Increase to 10% (monitor 48h)
- [ ] Increase to 25% (monitor 48h)
- [ ] Increase to 50% (monitor 72h)
- [ ] Increase to 100% (monitor 1 week)

**Phase 5: Lock-in (Week 26)**
- [ ] Remove hardcoded fallback
- [ ] Remove feature flag
- [ ] Mark as production stable

### **Decision Tree**

```
Issue Detected
    |
    ├─ Severity: P0 (Critical)
    │   └─> Rollback immediately (Level 1)
    │       ├─ Resolved? → Monitor, document
    │       └─ Not resolved? → Level 2 or 3
    │
    ├─ Severity: P1 (Major)
    │   └─> Disable feature flag (Level 1)
    │       ├─ Resolved? → Fix and re-enable gradually
    │       └─ Not resolved? → Level 2
    │
    └─ Severity: P2 (Moderate)
        └─> Investigate first, rollback if worsens
            ├─ Can fix quickly? → Fix without rollback
            └─ Cannot fix quickly? → Level 1 rollback
```

---

## Appendix

### **A. Contact List**

| Person | Role | Phone | Email | Slack |
|--------|------|-------|-------|-------|
| [Name] | Tech Lead | [Phone] | [Email] | @handle |
| [Name] | DevOps | [Phone] | [Email] | @handle |
| [Name] | DBA | [Phone] | [Email] | @handle |

### **B. System Access**

```bash
# Supabase Dashboard
https://app.supabase.com/project/<project-id>

# Database Connection
export DATABASE_URL="postgresql://..."

# Error Tracking
https://sentry.io/organizations/<org>/projects/<project>/

# Monitoring Dashboard
https://datadog.com/dashboard/<dashboard-id>

# Git Repository
https://github.com/<org>/<repo>
```

### **C. SQL Rollback Scripts**

**Complete Database Rollback:**

```sql
-- Save this as: rollback_3d_models.sql

-- Step 1: Disable feature flag
UPDATE feature_flags
SET enabled_dev = FALSE, enabled_production = FALSE, rollout_percentage = 0
WHERE flag_key = 'use_dynamic_3d_models';

-- Step 2: Drop indexes
DROP INDEX IF EXISTS idx_component_3d_models_component_id;
DROP INDEX IF EXISTS idx_geometry_parts_model_id;
DROP INDEX IF EXISTS idx_geometry_parts_material_name;
DROP INDEX IF EXISTS idx_component_3d_models_is_corner;

-- Step 3: Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS geometry_parts CASCADE;
DROP TABLE IF EXISTS material_definitions CASCADE;
DROP TABLE IF EXISTS component_3d_models CASCADE;

-- Step 4: Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%3d%';
-- Should return 0 rows

-- Step 5: Check user data intact
SELECT COUNT(*) as room_designs FROM room_designs;
SELECT COUNT(*) as components FROM components;
-- Both should return same counts as before
```

**Execute:**
```bash
psql $DATABASE_URL -f rollback_3d_models.sql
```

---

**Last Updated**: January 29, 2025
**Version**: 1.0
**Next Review**: Before Week 25 production rollout
**Maintained By**: DevOps Team
