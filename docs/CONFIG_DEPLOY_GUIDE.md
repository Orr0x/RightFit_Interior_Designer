# Configuration System Deployment Guide

**Purpose**: Deploy database-driven configuration system (Week 5-8)
**Feature Flag**: `use_database_configuration`
**Migration**: `20250129000005_create_app_configuration.sql`

---

## 🚀 Quick Deploy

### **Step 1: Run Migration**

Go to: **Supabase Dashboard → SQL Editor → New Query**

Copy and paste the entire contents of:
```
supabase/migrations/20250129000005_create_app_configuration.sql
```

Click **Run** ✅

### **Step 2: Verify Deployment**

Run this verification query:

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'app_configuration';

-- Check configuration values loaded
SELECT category, COUNT(*) as count
FROM app_configuration
GROUP BY category
ORDER BY category;
```

**Expected output:**
```
| category     | count |
|--------------|-------|
| canvas       | 3     |
| component    | 9     |
| interaction  | 2     |
| positioning  | 6     |
| snap         | 6     |
| wall         | 3     |
| zoom         | 2     |
```

**Total**: 31 configuration values

### **Step 3: Test Feature Flag**

The configuration system is controlled by the `use_database_configuration` feature flag (currently disabled).

**To enable in development only:**
```sql
UPDATE feature_flags
SET enabled_dev = true, enabled_production = false
WHERE flag_key = 'use_database_configuration';
```

**To enable globally:**
```sql
UPDATE feature_flags
SET enabled = true
WHERE flag_key = 'use_database_configuration';
```

---

## 📊 Configuration Categories

### **Canvas Settings** (3 values)
- `canvas_width` - 1600px
- `canvas_height` - 1200px
- `grid_size` - 20px

### **Zoom Settings** (2 values)
- `min_zoom` - 0.5
- `max_zoom` - 4.0

### **Wall Settings** (3 values)
- `wall_thickness` - 10cm
- `wall_clearance` - 5cm
- `wall_snap_threshold` - 40cm

### **Snap & Alignment** (6 values)
- `snap_tolerance_default` - 15cm
- `snap_tolerance_countertop` - 25cm
- `proximity_threshold` - 100cm
- `wall_snap_distance_default` - 35cm
- `wall_snap_distance_countertop` - 50cm
- `corner_tolerance` - 30cm

### **Component Dimensions** (9 values)
- `cornice_height` - 30cm
- `pelmet_height` - 20cm
- `countertop_thickness` - 4cm
- `wall_cabinet_height` - 70cm
- `base_cabinet_height` - 90cm
- `window_height` - 100cm
- `wall_end_panel_height` - 70cm
- `toe_kick_height` - 8cm
- `corner_countertop_size` - 90cm

### **Vertical Positioning** (6 values)
- `wall_cabinet_y_offset` - 140cm
- `cornice_y_offset` - 200cm
- `pelmet_y_offset` - 140cm
- `countertop_y_offset` - 90cm
- `butler_sink_y_offset` - 65cm
- `kitchen_sink_y_offset` - 75cm

### **Interaction Settings** (2 values)
- `drag_threshold_mouse` - 5px
- `drag_threshold_touch` - 10px

---

## 🧪 Testing

### **Test 1: Verify Values Load**

In browser console (after enabling flag):
```javascript
// Check if using database
const usingDb = await window.ConfigurationService.isUsingDatabase();
console.log('Using database:', usingDb); // Should be true

// Get a value
const wallThickness = await window.ConfigurationService.get('wall_thickness', 10);
console.log('Wall thickness:', wallThickness); // Should be 10
```

### **Test 2: Update a Value**

In Supabase SQL Editor:
```sql
-- Increase wall thickness
UPDATE app_configuration
SET value_numeric = 15
WHERE config_key = 'wall_thickness';
```

Refresh app - walls should be thicker! ✅

### **Test 3: Environment Overrides**

```sql
-- Make grid larger in development only
UPDATE app_configuration
SET dev_value = 30
WHERE config_key = 'grid_size';
```

Development: 30px grid
Production: 20px grid ✅

---

## 🔄 Rollback

If issues occur, instantly disable the feature:

```sql
UPDATE feature_flags
SET enabled = false
WHERE flag_key = 'use_database_configuration';
```

App automatically reverts to hardcoded values within 1 minute (cache TTL).

---

## 🎯 Integration Status

### **✅ Completed**
- Database schema designed
- Migration file created
- ConfigurationService.ts built
- 31 configuration values identified

### **⏭️ Next Steps**
1. Integrate into DesignCanvas2D.tsx
2. Replace hardcoded constants with `ConfigurationService.get()`
3. Test with feature flag
4. Deploy and verify
5. Gradual rollout

---

## 💡 Usage Examples

### **Before (Hardcoded)**
```typescript
const WALL_THICKNESS = 10; // 10cm wall thickness
const GRID_SIZE = 20; // Grid spacing
```

### **After (Database-driven)**
```typescript
import { ConfigurationService } from '@/services/ConfigurationService';

// Async usage
const wallThickness = await ConfigurationService.get('wall_thickness', 10);
const gridSize = await ConfigurationService.get('grid_size', 20);

// Or preload and use sync
await ConfigurationService.preload();
const wallThickness = ConfigurationService.getSync('wall_thickness', 10);
```

---

## 📈 Benefits

✅ **Update without deployment** - Change values in database
✅ **Environment-specific** - Different values for dev/staging/prod
✅ **Validation** - Min/max constraints enforced
✅ **Audit trail** - Track who changed what and when
✅ **Instant rollback** - Feature flag control
✅ **Type-safe** - TypeScript interfaces

---

## 🚨 Important Notes

1. **Feature flag controls everything** - Easy switch between database and hardcoded
2. **Automatic fallback** - If database fails, uses hardcoded fallback values
3. **1-minute cache** - Changes take effect within 60 seconds
4. **Validation enforced** - Values clamped to min/max ranges
5. **Safe migration** - Never deletes hardcoded constants (used as fallbacks)

---

**Ready to deploy? Run the migration in Supabase SQL Editor!**
