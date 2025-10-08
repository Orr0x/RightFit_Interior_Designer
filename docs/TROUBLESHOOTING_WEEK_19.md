# Week 19 Troubleshooting Guide

## Issue: No Console Output from Dynamic Renderer

**Symptoms:**
- No `[DynamicRenderer]` messages in console
- No `[EnhancedCabinet3D]` messages in console
- No `[Model3DLoader]` messages in console
- Components render using hardcoded geometry

**Root Cause:**
The integration files (App.tsx and EnhancedModels3D.tsx) were not properly committed in Week 17-18.

**Fix Applied:**
Commit `2fa4009` - "Fix: Add missing Week 17-18 integration files"

---

## Steps to Test After Fix

### 1. Restart Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
# or
yarn dev
```

### 2. Clear Browser Cache

**Option A: Hard Reload**
1. Open Developer Tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Option B: Clear All Cache**
1. F12 → Settings → Clear browsing data
2. Select "Cached images and files"
3. Click "Clear data"

### 3. Enable Feature Flag (if not already done)

```sql
UPDATE feature_flags
SET enabled_dev = TRUE, enabled_production = FALSE
WHERE flag_key = 'use_dynamic_3d_models';
```

### 4. Navigate to Designer

1. Go to `/designer`
2. Open browser console (F12)
3. Look for startup messages

---

## Expected Console Output

### On App Startup:

```
[DynamicRenderer] Preloaded common components
```

This should appear immediately when the app loads.

### When Opening Designer:

```
[EnhancedCabinet3D] Dynamic 3D models ENABLED
```

or

```
[EnhancedCabinet3D] Dynamic 3D models disabled
```

### When Placing a Corner Cabinet:

```
[EnhancedCabinet3D] Rendering corner-cabinet-60 with DynamicComponentRenderer
[Model3DLoader] Loaded model from database: corner-base-cabinet-60
[Model3DLoader] Loaded 8 geometry parts for model: {uuid}
[GeometryBuilder] Built 8 geometry parts
[DynamicRenderer] Built component: corner-base-cabinet-60 (8 parts)
```

---

## Still Not Working?

### Check 1: Files Were Actually Updated

```bash
# Check App.tsx has the import
grep "preloadCommonComponents" src/App.tsx

# Check EnhancedModels3D.tsx has the import
grep "DynamicComponentRenderer" src/components/designer/EnhancedModels3D.tsx
```

Expected output:
```
src/App.tsx:import { preloadCommonComponents } from "./components/3d/DynamicComponentRenderer";
src/App.tsx:    preloadCommonComponents();

src/components/designer/EnhancedModels3D.tsx:import { DynamicComponentRenderer } from '@/components/3d/DynamicComponentRenderer';
src/components/designer/EnhancedModels3D.tsx:      <DynamicComponentRenderer
```

### Check 2: Feature Flag is Enabled

```sql
SELECT flag_key, enabled_dev, enabled_production
FROM feature_flags
WHERE flag_key = 'use_dynamic_3d_models';
```

Expected:
```
flag_key                 | enabled_dev | enabled_production
use_dynamic_3d_models    | true        | false
```

### Check 3: Database Has Models

```sql
SELECT component_id FROM component_3d_models
WHERE is_corner_component = true;
```

Expected 4 rows:
```
corner-base-cabinet-60
corner-base-cabinet-90
new-corner-wall-cabinet-60
new-corner-wall-cabinet-90
```

### Check 4: Dev Server Restarted

The files must be recompiled. Make sure you:
1. Stopped the dev server (Ctrl+C)
2. Started it again (`npm run dev`)
3. Waited for "compiled successfully"

### Check 5: Browser Cache Cleared

Old JavaScript files may be cached. Try:
1. Hard reload (Ctrl+Shift+R)
2. Or open in incognito/private window
3. Or clear all cache

---

## Verification Steps

### Step 1: Check Preload Ran

Open console on any page and look for:
```
[DynamicRenderer] Preloaded common components
```

If NOT present:
- App.tsx was not updated
- Or dev server wasn't restarted
- Or browser is using cached version

### Step 2: Check Feature Flag Check

Navigate to `/designer` and look for:
```
[EnhancedCabinet3D] Dynamic 3D models ENABLED
```

If you see "disabled" instead:
- Feature flag is not enabled in database
- Or FeatureFlagService has an error

If you see NOTHING:
- EnhancedModels3D.tsx was not updated
- Or component isn't mounting
- Or console.log is being filtered

### Step 3: Try to Place Corner Cabinet

Add "Corner Base Cabinet 60cm" and look for:
```
[EnhancedCabinet3D] Rendering corner-cabinet-60 with DynamicComponentRenderer
[DynamicRenderer] Built component: corner-base-cabinet-60 (8 parts)
```

If NOT present but flag is enabled:
- DynamicComponentRenderer isn't being called
- Check component ID mapping
- Check if model exists in database

---

## Common Mistakes

### ❌ Mistake 1: Didn't Restart Dev Server
**Symptom**: Old code still running
**Fix**: Stop and restart dev server

### ❌ Mistake 2: Didn't Clear Browser Cache
**Symptom**: Old JavaScript bundle loaded
**Fix**: Hard reload or clear cache

### ❌ Mistake 3: Feature Flag Not Enabled
**Symptom**: Console shows "disabled"
**Fix**: Run UPDATE SQL to enable flag

### ❌ Mistake 4: Wrong Database Connection
**Symptom**: Models not found
**Fix**: Check Supabase connection in `.env`

### ❌ Mistake 5: Wrong Branch
**Symptom**: Files don't have changes
**Fix**: `git checkout feature/feature-flag-system`

---

## Quick Debug Checklist

Run through this checklist:

- [ ] Committed changes are on current branch
- [ ] Dev server was restarted
- [ ] Browser cache was cleared
- [ ] Feature flag is enabled in database
- [ ] Database migrations were run
- [ ] Models exist in database (4 corner cabinets)
- [ ] Console is open (F12)
- [ ] Console filters are not hiding messages
- [ ] Navigated to `/designer`
- [ ] Tried to place a corner cabinet

---

## Success Indicators

You know it's working when you see:

✅ **On App Load:**
```
[DynamicRenderer] Preloaded common components
```

✅ **On Designer Open:**
```
[EnhancedCabinet3D] Dynamic 3D models ENABLED
```

✅ **On Component Place:**
```
[DynamicRenderer] Built component: corner-base-cabinet-60 (8 parts)
```

✅ **Visual Check:**
- Corner cabinet appears in 3D view
- L-shaped geometry visible
- Plinth, cabinet, doors, handles all present

---

## Contact Points

If still not working after all checks:

1. Check git log: `git log --oneline -5`
2. Check current branch: `git branch`
3. Check file contents: `cat src/App.tsx | grep preload`
4. Share console output
5. Share database query results

---

**This fix resolves the missing integration code from Week 17-18.**
