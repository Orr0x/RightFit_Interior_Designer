# Configuration System Testing Guide

**Feature**: Database-driven configuration
**Feature Flag**: `use_database_configuration`
**Status**: Integration Complete ✅ | Testing In Progress ⏭️

---

## 🧪 Test Plan

### **Test 1: Feature Flag DISABLED (Default Behavior)**

**Purpose**: Verify fallback to hardcoded values when feature flag is disabled

**Steps:**
1. Ensure feature flag is disabled:
```sql
SELECT enabled, enabled_dev, enabled_production
FROM feature_flags
WHERE flag_key = 'use_database_configuration';
```
Should show: `enabled = false` (all environments)

2. Refresh the app (Ctrl+Shift+R to hard refresh)

3. Open browser console and check for logs:
```
[ConfigService] Feature disabled, skipping preload
[DesignCanvas2D] Failed to load configuration, using hardcoded fallbacks
```

4. Test snap functionality:
   - Place a cabinet near wall - should snap at ~15cm tolerance ✅
   - Place counter-top near wall - should snap at ~25cm tolerance ✅
   - Drag elements - should require 5px movement (mouse) or 10px (touch) ✅

**Expected Result**: App works normally with hardcoded values ✅

---

### **Test 2: Feature Flag ENABLED (Database-Driven)**

**Purpose**: Verify configuration loads from database

**Steps:**
1. Enable feature flag:
```sql
UPDATE feature_flags
SET enabled = true, enabled_dev = true
WHERE flag_key = 'use_database_configuration';
```

2. Hard refresh the app (Ctrl+Shift+R)

3. Check browser console for logs:
```
[ConfigService] Preloaded 31 configuration values
[DesignCanvas2D] Configuration loaded from database: {
  canvas_width: 1600,
  canvas_height: 1200,
  grid_size: 20,
  wall_thickness: 10,
  snap_tolerance_default: 15,
  snap_tolerance_countertop: 25,
  proximity_threshold: 100,
  ...
}
```

4. Test snap functionality (should behave same as Test 1):
   - Cabinet snap: ~15cm ✅
   - Counter-top snap: ~25cm ✅
   - Drag threshold: 5px/10px ✅

**Expected Result**: App works with database values (same behavior) ✅

---

### **Test 3: Live Configuration Update**

**Purpose**: Verify configuration changes take effect without code deployment

**Steps:**
1. Ensure feature flag is enabled (from Test 2)

2. Update snap tolerance in database:
```sql
UPDATE app_configuration
SET value_numeric = 30
WHERE config_key = 'snap_tolerance_default';
```

3. Wait 60 seconds (cache TTL)
   - OR clear cache via console: `window.ConfigurationService.clearCache()`

4. Refresh the app

5. Test cabinet placement:
   - Should now snap at ~30cm (was 15cm) ✅
   - More generous snap behavior

**Expected Result**: Configuration changes applied without code deployment ✅

---

### **Test 4: Environment Overrides**

**Purpose**: Verify dev/staging/production overrides work

**Steps:**
1. Set environment-specific value:
```sql
UPDATE app_configuration
SET dev_value = 50, staging_value = 25, production_value = 15
WHERE config_key = 'snap_tolerance_default';
```

2. Check current environment:
```javascript
console.log(import.meta.env.MODE); // Should be 'development'
```

3. Refresh app

4. Check console for loaded config:
```
snap_tolerance_default: 50  // Uses dev_value in development
```

5. Test snap - should use 50cm in development

**Expected Result**: Environment-specific overrides apply correctly ✅

---

### **Test 5: Validation (Min/Max Constraints)**

**Purpose**: Verify values are clamped to valid ranges

**Steps:**
1. Try to set invalid value:
```sql
UPDATE app_configuration
SET value_numeric = 500  -- Way too large
WHERE config_key = 'snap_tolerance_default';
-- Note: max_value = 50
```

2. Refresh app

3. Check console:
```
[ConfigService] Value 500 above max 50 for "snap_tolerance_default", clamping
```

4. Verify clamped value used:
```
snap_tolerance_default: 50  // Clamped to max
```

**Expected Result**: Invalid values are clamped to valid ranges ✅

---

### **Test 6: Database Failure Fallback**

**Purpose**: Verify app doesn't break if database is unreachable

**Steps:**
1. Simulate database error by temporarily breaking Supabase connection
   - OR delete app_configuration table (don't actually do this!)

2. Refresh app

3. Check console:
```
[ConfigService] Preload failed: [error]
[DesignCanvas2D] Failed to load configuration, using hardcoded fallbacks
```

4. Test app functionality:
   - Should work normally with fallback values ✅

**Expected Result**: App degrades gracefully, uses hardcoded fallbacks ✅

---

### **Test 7: Rollback Feature Flag**

**Purpose**: Verify instant rollback capability

**Steps:**
1. With feature flag enabled and custom config values set:
```sql
-- Custom config
UPDATE app_configuration SET value_numeric = 30 WHERE config_key = 'snap_tolerance_default';
```

2. Disable feature flag:
```sql
UPDATE feature_flags
SET enabled = false
WHERE flag_key = 'use_database_configuration';
```

3. Wait 60 seconds (cache TTL) OR hard refresh

4. App should revert to hardcoded values:
   - snap_tolerance_default = 15 (hardcoded, not 30 from database)

**Expected Result**: Instant rollback to hardcoded values ✅

---

## 📊 Configuration Values to Test

### **Snap & Alignment**
| Config Key | Default | Test Value | How to Test |
|------------|---------|------------|-------------|
| `snap_tolerance_default` | 15 | 30 | Place cabinet near wall, measure snap distance |
| `snap_tolerance_countertop` | 25 | 40 | Place counter-top near wall |
| `proximity_threshold` | 100 | 200 | Test component-to-component snapping range |
| `wall_snap_distance_default` | 35 | 60 | Test wall attachment for cabinets |
| `corner_tolerance` | 30 | 50 | Place corner units, test detection |

### **Component Dimensions**
| Config Key | Default | Test Value | How to Test |
|------------|---------|------------|-------------|
| `toe_kick_height` | 8 | 12 | View base cabinet in elevation, measure toe kick |

### **Interaction**
| Config Key | Default | Test Value | How to Test |
|------------|---------|------------|-------------|
| `drag_threshold_mouse` | 5 | 15 | Click-drag element, measure pixels before drag starts |
| `drag_threshold_touch` | 10 | 20 | Touch-drag on mobile/tablet |

---

## ✅ Test Checklist

- [ ] Test 1: Feature flag disabled (fallback behavior)
- [ ] Test 2: Feature flag enabled (database values)
- [ ] Test 3: Live config update (without deployment)
- [ ] Test 4: Environment overrides (dev/staging/prod)
- [ ] Test 5: Validation (min/max clamping)
- [ ] Test 6: Database failure fallback
- [ ] Test 7: Rollback via feature flag

---

## 🐛 Common Issues

### **Issue**: Console shows "Failed to load configuration"
**Solution**: Check feature flag is enabled and app_configuration table exists

### **Issue**: Changes not taking effect
**Solution**: Wait 60 seconds for cache to expire, or hard refresh (Ctrl+Shift+R)

### **Issue**: Values seem wrong
**Solution**: Check environment - dev_value overrides value_numeric in development

### **Issue**: App broken after enabling flag
**Solution**: Disable flag immediately:
```sql
UPDATE feature_flags SET enabled = false WHERE flag_key = 'use_database_configuration';
```

---

## 📝 Test Results Template

```markdown
## Test Results - [Date]

**Tester**: [Name]
**Environment**: [Development/Staging/Production]
**Feature Flag Status**: [Enabled/Disabled]

### Test 1: Fallback Behavior
- ✅/❌ Hardcoded values used when flag disabled
- Notes: [...]

### Test 2: Database Values
- ✅/❌ Configuration loaded from database
- Console logs: [...]

### Test 3: Live Updates
- ✅/❌ Config changes applied without deployment
- Changed value: [...]
- Behavior change: [...]

### Test 4: Environment Overrides
- ✅/❌ Dev/staging/prod values work correctly
- Environment detected: [...]

### Test 5: Validation
- ✅/❌ Invalid values clamped to min/max
- Test case: [...]

### Test 6: Failure Handling
- ✅/❌ Graceful degradation on DB error
- Fallback behavior: [...]

### Test 7: Rollback
- ✅/❌ Instant rollback via feature flag
- Rollback time: [...]

### Overall Result
- ✅ All tests passed - Ready for production
- ⚠️ Some tests failed - Needs fixes
- ❌ Critical issues - Do not deploy
```

---

**Start testing now! Enable the feature flag and verify the configuration system works as expected.**
