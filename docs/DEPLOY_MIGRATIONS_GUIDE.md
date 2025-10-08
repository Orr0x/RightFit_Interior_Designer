# Migration Deployment Guide

**Purpose**: Deploy feature flag system to Supabase
**Migrations**: 2 files
**Estimated Time**: 5 minutes

---

## 📋 **Migrations to Deploy**

1. ✅ `20250129000003_create_feature_flags.sql` - Feature flags table
2. ✅ `20250129000004_create_ab_test_results.sql` - A/B testing table

---

## 🚀 **Deployment Steps**

### **Option 1: Supabase Dashboard (Recommended)**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `RightFit Interior Designer`

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Deploy Migration 1: Feature Flags**
   - Copy entire contents of `supabase/migrations/20250129000003_create_feature_flags.sql`
   - Paste into SQL Editor
   - Click "Run" (bottom right)
   - ✅ Should see "Success. No rows returned"

4. **Deploy Migration 2: A/B Testing**
   - Click "New Query" again
   - Copy entire contents of `supabase/migrations/20250129000004_create_ab_test_results.sql`
   - Paste into SQL Editor
   - Click "Run"
   - ✅ Should see "Success. No rows returned"

5. **Verify Tables Created**
   - Click "Table Editor" in left sidebar
   - You should see two new tables:
     - `feature_flags` (with 4 initial rows)
     - `ab_test_results` (empty)

---

### **Option 2: Supabase CLI (Advanced)**

```bash
cd "I:\Curser_Git\CurserCode\plan-view-kitchen-3d"

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref akfdezesupzuvukqiggn

# Deploy migrations
supabase db push
```

---

## ✅ **Verification**

### **1. Check Tables Exist**

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('feature_flags', 'ab_test_results');
```

Should return 2 rows:
- `feature_flags`
- `ab_test_results`

### **2. Check Initial Feature Flags**

```sql
SELECT flag_key, flag_name, enabled, enabled_dev, enabled_production
FROM feature_flags;
```

Should return 4 flags:
- `use_new_positioning_system` (disabled)
- `use_database_configuration` (disabled)
- `use_cost_calculation_system` (disabled)
- `use_dynamic_3d_models` (disabled)

### **3. Check Permissions**

```sql
-- Test insert (should work for anyone)
SELECT has_table_privilege('feature_flags', 'SELECT');
```

Should return `true`

---

## 🧪 **Enable Feature Flag in Development**

After deployment, enable the positioning fix in development only:

```sql
UPDATE feature_flags
SET
  enabled = true,
  enabled_dev = true,
  enabled_staging = false,
  enabled_production = false
WHERE flag_key = 'use_new_positioning_system';
```

---

## 🔍 **Test in Browser**

1. **Refresh your app**
2. **Open browser console**
3. **You should now see**:
   - No more 404 errors ✅
   - `[FeatureFlag] Cache hit for "use_new_positioning_system": true` (if enabled)
   - Or `[FeatureFlag] Using LEGACY implementation` (if disabled)

4. **Enable debug mode** (optional):
   ```javascript
   localStorage.setItem('debug_feature_flags', 'true');
   ```
   Then refresh

---

## 🚨 **Troubleshooting**

### **Error: "relation 'feature_flags' already exists"**
Table already deployed. Skip to verification steps.

### **Error: "permission denied"**
You need admin access. Check you're logged in as project owner.

### **404 errors still appearing**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear service worker cache
3. Check migration ran successfully in Supabase dashboard

### **RLS policy errors**
Check if `profiles` table exists with `god_mode` column:
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'god_mode';
```

If missing, update RLS policies in migration to use simpler auth check.

---

## 📊 **What Gets Created**

### **feature_flags table**
- 18 columns including enabled, rollout_percentage, environment flags
- 4 initial flags pre-populated
- RLS policies for security
- Indexes for performance
- Auto-update trigger for `updated_at`

### **ab_test_results table**
- Performance tracking for A/B tests
- Aggregate view `ab_test_summary`
- RLS policies for data access
- Indexes for fast queries

---

## 🎯 **Next Steps After Deployment**

1. ✅ Verify tables created
2. ✅ Check initial flags exist
3. ✅ Enable positioning flag in dev (optional)
4. ✅ Test in browser - no more 404s
5. ✅ Test positioning fix (if enabled)

---

**Remember: All flags are disabled by default. Enable only in development for testing!**
