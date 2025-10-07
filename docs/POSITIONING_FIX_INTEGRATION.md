# Positioning Fix Integration Guide

**Created**: January 2025
**Purpose**: Guide for integrating PositionCalculation utility into DesignCanvas2D.tsx
**Feature Flag**: `use_new_positioning_system`

---

## 🎯 **What This Fixes**

### **Critical Issue**
Left and right wall views use asymmetric coordinate systems:

**LEFT WALL** (Line 1384):
```typescript
const flippedY = roomDimensions.height - element.y - effectiveDepth;
xPos = roomPosition.innerX + (flippedY / roomDimensions.height) * elevationDepth;
```

**RIGHT WALL** (Line 1396):
```typescript
xPos = roomPosition.innerX + (element.y / roomDimensions.height) * elevationDepth;
```

**Result**: Components appear at different positions in left vs right views ❌

### **Solution**
Unified coordinate mapping for both walls, with view mirroring handled by rendering ✅

---

## 📝 **Integration Steps**

### **Step 1: Import PositionCalculation**

Add to imports section at top of `DesignCanvas2D.tsx`:

```typescript
import { PositionCalculation } from '@/utils/PositionCalculation';
```

### **Step 2: Replace Elevation Position Calculation**

**Find this code** (around lines 1375-1405):

```typescript
let xPos: number;
let elementWidth: number;

if (active2DView === 'front' || active2DView === 'back') {
  // Front/back walls: use X coordinate from plan view
  xPos = roomPosition.innerX + (element.x / roomDimensions.width) * elevationWidth;
  elementWidth = (effectiveWidth / roomDimensions.width) * elevationWidth;
} else if (active2DView === 'left') {
  // Left wall view - flip horizontally (mirror Y coordinate)
  const flippedY = roomDimensions.height - element.y - effectiveDepth;
  xPos = roomPosition.innerX + (flippedY / roomDimensions.height) * elevationDepth;

  if (element.type === 'counter-top') {
    elementWidth = (element.depth / roomDimensions.height) * elevationDepth;
  } else {
    elementWidth = (effectiveWidth / roomDimensions.height) * elevationDepth;
  }
} else { // right wall
  // Right wall view: use Y coordinate from plan view
  xPos = roomPosition.innerX + (element.y / roomDimensions.height) * elevationDepth;

  if (element.type === 'counter-top') {
    elementWidth = (element.depth / roomDimensions.height) * elevationDepth;
  } else {
    elementWidth = (effectiveWidth / roomDimensions.height) * elevationDepth;
  }
}
```

**Replace with**:

```typescript
// 🎯 Use PositionCalculation utility with automatic legacy/new switching
const { xPos, elementWidth } = await PositionCalculation.calculateElevationPosition(
  element,
  roomDimensions,
  roomPosition,
  active2DView,
  zoom,
  elevationWidth,
  elevationDepth
);
```

### **Step 3: Make Function Async**

The function containing this code needs to be async. Find the function definition and add `async`:

**Before**:
```typescript
const renderElement2D = (element: DesignElement) => {
```

**After**:
```typescript
const renderElement2D = async (element: DesignElement) => {
```

### **Step 4: Update Function Calls**

Any calls to `renderElement2D` need to be awaited:

**Before**:
```typescript
{elements.map(element => renderElement2D(element))}
```

**After**:
```typescript
{elements.map(async element => await renderElement2D(element))}
```

---

## 🧪 **Testing**

### **1. Enable Feature Flag in Development**

Run this SQL in your Supabase SQL Editor:

```sql
UPDATE feature_flags
SET enabled_dev = TRUE, enabled_staging = FALSE, enabled_production = FALSE
WHERE flag_key = 'use_new_positioning_system';
```

### **2. Enable Debug Mode**

In browser console:

```javascript
localStorage.setItem('debug_feature_flags', 'true');
```

Then refresh the page.

### **3. Test Scenarios**

1. **Place cabinet in plan view**
   - Note coordinates
   - Switch to left wall view
   - Switch to right wall view
   - Verify position is consistent ✅

2. **Place counter-top on left wall**
   - Should match position on right wall ✅

3. **Test corner units**
   - Should appear correctly in both adjacent walls ✅

### **4. Monitor Console**

You should see logs like:

```
[FeatureFlag] 🆕 Using NEW implementation for "use_new_positioning_system"
```

Or:

```
[FeatureFlag] 🔒 Using LEGACY implementation for "use_new_positioning_system"
```

---

## 🔄 **Rollback**

If issues occur, instantly disable the feature:

```sql
UPDATE feature_flags
SET enabled = FALSE
WHERE flag_key = 'use_new_positioning_system';
```

System automatically falls back to legacy positioning within 1 minute (cache TTL).

---

## 📊 **Comparison Testing**

Want to compare legacy vs new side-by-side?

```typescript
import { ABTestLogger } from '@/utils/ABTestLogger';

const comparison = await ABTestLogger.compareImplementations(
  'positioning_calculation',
  'calculate_elevation_position',
  async () => {
    // Legacy calculation
    // ... original code
  },
  async () => {
    // New calculation
    return await PositionCalculation.calculateElevationPosition(...);
  },
  {
    viewType: active2DView,
    componentType: element.type
  }
);

console.log('Performance gain:', comparison.performanceGain.toFixed(1) + '%');
console.log('Results match:', comparison.resultsMatch);
```

---

## ⚠️ **Important Notes**

1. **Don't delete legacy code** - It's preserved inside `PositionCalculation.calculateElevationPositionLegacy()`
2. **Feature flag controls everything** - Easy switch between old/new
3. **Automatic fallback** - If new system errors, legacy is used automatically
4. **Cache-aware** - Changes to feature flags take effect within 1 minute
5. **Environment-specific** - Can be enabled in dev only for testing

---

## 🚀 **Gradual Rollout Plan**

### **Week 1-2: Development Testing**
```sql
UPDATE feature_flags
SET enabled_dev = TRUE
WHERE flag_key = 'use_new_positioning_system';
```

### **Week 3: Staging Testing**
```sql
UPDATE feature_flags
SET enabled_staging = TRUE
WHERE flag_key = 'use_new_positioning_system';
```

### **Week 4: Production Canary (1%)**
```sql
UPDATE feature_flags
SET enabled_production = TRUE, rollout_percentage = 1
WHERE flag_key = 'use_new_positioning_system';
```

### **Week 5+: Gradual Increase**
```sql
-- After monitoring for 3-7 days
UPDATE feature_flags SET rollout_percentage = 10;

-- After 3-7 more days
UPDATE feature_flags SET rollout_percentage = 50;

-- After 1 week
UPDATE feature_flags SET rollout_percentage = 100;
```

### **Week 8+: Lock-in**
After 2 weeks at 100% with no issues:

```sql
UPDATE feature_flags
SET can_disable = FALSE, test_status = 'passed'
WHERE flag_key = 'use_new_positioning_system';
```

---

## 📞 **Support**

If you encounter issues:

1. Check feature flag status: `SELECT * FROM feature_flags WHERE flag_key = 'use_new_positioning_system';`
2. Check console for errors
3. Disable flag if critical: `UPDATE feature_flags SET enabled = FALSE ...`
4. Review A/B test results: `SELECT * FROM ab_test_summary WHERE test_name = 'positioning_calculation';`

---

**Remember: The legacy code is preserved and always available as a fallback!**
