# Feature Flag System - Usage Guide

**Created**: January 2025
**Purpose**: Guide for using the feature flag system safely and effectively
**Location**: `src/services/FeatureFlagService.ts`

---

## 🎯 **Quick Start**

### **1. Basic Feature Flag Check**

```typescript
import { FeatureFlagService } from '@/services/FeatureFlagService';

// Check if feature is enabled
const enabled = await FeatureFlagService.isEnabled('use_new_positioning_system');

if (enabled) {
  // Use new system
} else {
  // Use legacy system
}
```

### **2. Automatic Legacy Fallback (Recommended)**

```typescript
import { FeatureFlagService } from '@/services/FeatureFlagService';

// Automatically switches between legacy and new with error handling
const result = await FeatureFlagService.useLegacyOr(
  'use_new_positioning_system',
  () => calculatePositionLegacy(element, roomDimensions, view),  // Legacy
  () => calculatePositionNew(element, roomDimensions, view)      // New
);
```

---

## 📚 **Core Concepts**

### **Feature Flag Structure**

```typescript
{
  flag_key: 'use_new_positioning_system',     // Unique identifier
  flag_name: 'New Positioning System',         // Human-readable name
  enabled: true,                                // Master on/off switch
  rollout_percentage: 10,                      // 0-100% gradual rollout
  enabled_dev: true,                           // Enable in development
  enabled_staging: false,                      // Enable in staging
  enabled_production: true,                    // Enable in production
  test_status: 'testing'                       // untested, testing, passed, failed
}
```

### **Evaluation Order**

1. **Environment Check**: Is it enabled for current environment (dev/staging/production)?
2. **Master Switch**: Is the `enabled` flag true?
3. **User Tier Override**: Does user's tier have an override?
4. **Rollout Percentage**: Is user in the rollout percentage?

---

## 🚀 **Common Use Cases**

### **Use Case 1: Dual Implementation Pattern**

When you have both legacy and new code:

```typescript
// src/utils/PositionCalculation.ts

import { FeatureFlagService } from '@/services/FeatureFlagService';

export class PositionCalculation {
  static async calculatePosition(
    element: DesignElement,
    roomDimensions: RoomDimensions,
    view: ViewType
  ): Promise<Position> {
    return FeatureFlagService.useLegacyOr(
      'use_new_positioning_system',

      // 🔒 LEGACY - Keep exact original code
      () => this.calculatePositionLegacy(element, roomDimensions, view),

      // ✨ NEW - Improved implementation
      () => this.calculatePositionNew(element, roomDimensions, view)
    );
  }

  // Legacy implementation (kept intact)
  private static calculatePositionLegacy(...): Position {
    // Original code from lines 1381-1405
  }

  // New implementation (added alongside)
  private static calculatePositionNew(...): Position {
    // Improved unified coordinate system
  }
}
```

### **Use Case 2: Silent Parallel Testing**

Test new system without affecting users:

```typescript
import { FeatureFlagService } from '@/services/FeatureFlagService';

// User gets legacy result, but new system is tested silently
const result = await FeatureFlagService.testInParallel(
  'positioning_calculation',
  () => legacyFunction(),  // This result is returned to user
  () => newFunction()      // This runs in background for testing
);
```

### **Use Case 3: A/B Testing with Logging**

Compare performance of implementations:

```typescript
import { ABTestLogger } from '@/utils/ABTestLogger';

const comparison = await ABTestLogger.compareImplementations(
  'positioning_calculation',
  'calculate_position',
  () => legacyFunction(),
  () => newFunction(),
  {
    componentType: 'cabinet',
    viewType: 'left'
  }
);

console.log(`Performance gain: ${comparison.performanceGain.toFixed(1)}%`);
console.log(`Results match: ${comparison.resultsMatch}`);
```

---

## 🔧 **Database Operations**

### **Enable Feature in Development Only**

```sql
UPDATE feature_flags
SET enabled_dev = TRUE, enabled_staging = FALSE, enabled_production = FALSE
WHERE flag_key = 'use_new_positioning_system';
```

### **Gradual Production Rollout**

```sql
-- Start with 1%
UPDATE feature_flags
SET enabled_production = TRUE, rollout_percentage = 1
WHERE flag_key = 'use_new_positioning_system';

-- After 3-7 days, increase to 10%
UPDATE feature_flags SET rollout_percentage = 10;

-- After testing, increase to 50%
UPDATE feature_flags SET rollout_percentage = 50;

-- Finally, 100%
UPDATE feature_flags SET rollout_percentage = 100;
```

### **Instant Disable (Emergency)**

```sql
-- Disable immediately
UPDATE feature_flags
SET enabled = FALSE
WHERE flag_key = 'use_new_positioning_system';
```

### **User Tier Override**

```sql
-- Enable only for pro and enterprise users
UPDATE feature_flags
SET user_tier_override = '{"free": false, "pro": true, "enterprise": true}'::jsonb
WHERE flag_key = 'use_new_positioning_system';
```

---

## 🧪 **Testing & Debugging**

### **Enable Debug Mode**

```typescript
// In browser console or at app start
localStorage.setItem('debug_feature_flags', 'true');

// Or in code
FeatureFlagService.enableDebugMode(true);

// Enable A/B test debugging
localStorage.setItem('debug_ab_testing', 'true');
```

### **Check Cache Stats**

```typescript
const stats = FeatureFlagService.getCacheStats();
console.log('Cache size:', stats.size);
console.log('Cache age:', stats.age);
console.log('Cache valid:', stats.valid);
```

### **Clear Cache**

```typescript
FeatureFlagService.clearCache();
```

### **View Test Results**

```typescript
// Get summary for specific test
const summary = await ABTestLogger.getTestSummary('positioning_calculation');

// Get performance comparison
const comparison = await ABTestLogger.getPerformanceComparison('positioning_calculation');
console.log('Improvement:', comparison.improvement.toFixed(1) + '%');
```

---

## 📊 **Monitoring & Analytics**

### **Check Test Performance**

```sql
-- View A/B test summary
SELECT * FROM ab_test_summary
WHERE test_name = 'positioning_calculation';

-- Recent test results
SELECT
  variant,
  operation,
  execution_time_ms,
  success,
  created_at
FROM ab_test_results
WHERE test_name = 'positioning_calculation'
ORDER BY created_at DESC
LIMIT 20;
```

### **Compare Success Rates**

```sql
SELECT
  variant,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
  AVG(execution_time_ms) as avg_time,
  (SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT * 100) as success_rate
FROM ab_test_results
WHERE test_name = 'positioning_calculation'
GROUP BY variant;
```

---

## ⚠️ **Best Practices**

### **DO's** ✅

1. ✅ **Always start with feature flag disabled in production**
2. ✅ **Test in development first**
3. ✅ **Use gradual rollout (1% → 10% → 50% → 100%)**
4. ✅ **Log comparisons with ABTestLogger**
5. ✅ **Keep legacy code intact until 100% rollout for 2+ weeks**
6. ✅ **Monitor error rates and performance**
7. ✅ **Document what each flag controls**

### **DON'Ts** ❌

1. ❌ **Never enable 100% immediately in production**
2. ❌ **Never delete legacy code while flag is active**
3. ❌ **Never remove fallback logic**
4. ❌ **Never assume database is available**
5. ❌ **Never skip testing phase**
6. ❌ **Never ignore performance degradation**
7. ❌ **Never forget to update documentation**

---

## 🚨 **Emergency Procedures**

### **Disable Single Feature**

```typescript
await FeatureFlagService.updateFlag('use_new_positioning_system', {
  enabled: false,
  rollout_percentage: 0
});
```

### **Disable All Features (Emergency)**

```typescript
await FeatureFlagService.emergencyDisableAll();
```

Or via SQL:

```sql
UPDATE feature_flags
SET enabled = FALSE, rollout_percentage = 0
WHERE can_disable = TRUE;
```

---

## 📈 **Rollout Checklist**

### **Before Production Rollout**

- [ ] Feature flag created in database
- [ ] Tested in development environment
- [ ] Legacy code kept intact
- [ ] Fallback system working
- [ ] A/B test logging implemented
- [ ] Performance benchmarks established
- [ ] Rollback procedure documented

### **During Rollout**

- [ ] Started at 1% rollout
- [ ] Monitored for 3-7 days
- [ ] Checked error rates
- [ ] Verified performance
- [ ] Increased to 10% if no issues
- [ ] Monitored for 3-7 days
- [ ] Increased to 50%
- [ ] Monitored for 1 week
- [ ] Increased to 100%

### **After 100% Rollout**

- [ ] Monitored for 2+ weeks
- [ ] No critical errors
- [ ] Performance maintained/improved
- [ ] Set `can_disable = FALSE`
- [ ] Documented in changelog
- [ ] Created backup branch
- [ ] Removed legacy code (optional)

---

## 🔍 **Troubleshooting**

### **Feature not enabling in development**

```typescript
// Check flag settings
const flags = await FeatureFlagService.getAllFlags();
const flag = flags.find(f => f.flag_key === 'use_new_positioning_system');
console.log('Flag settings:', flag);

// Verify environment
console.log('Environment:', import.meta.env.MODE);
```

### **Cache not updating**

```typescript
// Clear cache manually
FeatureFlagService.clearCache();

// Check cache stats
const stats = FeatureFlagService.getCacheStats();
```

### **New system not being used**

```typescript
// Enable debug mode
FeatureFlagService.enableDebugMode(true);

// Check if feature is enabled
const enabled = await FeatureFlagService.isEnabled('use_new_positioning_system');
console.log('Feature enabled:', enabled);
```

---

## 📝 **Example: Complete Implementation**

```typescript
// src/utils/PositionCalculation.ts

import { FeatureFlagService } from '@/services/FeatureFlagService';
import { ABTestLogger } from '@/utils/ABTestLogger';

export class PositionCalculation {
  /**
   * Calculate element position with automatic legacy/new switching
   */
  static async calculatePosition(
    element: DesignElement,
    roomDimensions: RoomDimensions,
    view: ViewType
  ): Promise<Position> {
    // Use feature flag with automatic fallback
    return FeatureFlagService.useLegacyOr(
      'use_new_positioning_system',

      // 🔒 LEGACY - Exact copy of original code
      () => this.calculatePositionLegacy(element, roomDimensions, view),

      // ✨ NEW - Improved implementation
      async () => {
        try {
          const result = this.calculatePositionNew(element, roomDimensions, view);

          // Log success
          await ABTestLogger.logOperation(
            'positioning_calculation',
            'new',
            'calculate_position',
            { success: true, executionTime: performance.now() },
            { viewType: view }
          );

          return result;
        } catch (error) {
          // Log error and fallback
          await ABTestLogger.logOperation(
            'positioning_calculation',
            'new',
            'calculate_position',
            {
              success: false,
              executionTime: performance.now(),
              error: error.message
            },
            { viewType: view }
          );

          throw error; // Will trigger automatic fallback to legacy
        }
      }
    );
  }

  // 🔒 LEGACY - DO NOT MODIFY
  private static calculatePositionLegacy(
    element: DesignElement,
    roomDimensions: RoomDimensions,
    view: ViewType
  ): Position {
    // Exact copy of lines 1381-1405 from DesignCanvas2D.tsx
    if (view === 'left') {
      const flippedY = roomDimensions.height - element.y - element.depth;
      const xPos = (flippedY / roomDimensions.height) * 1000;
      return { x: xPos, y: element.z };
    } else if (view === 'right') {
      const xPos = (element.y / roomDimensions.height) * 1000;
      return { x: xPos, y: element.z };
    }
    // ... rest of legacy logic
    return { x: 0, y: 0 };
  }

  // ✨ NEW - Unified coordinate system
  private static calculatePositionNew(
    element: DesignElement,
    roomDimensions: RoomDimensions,
    view: ViewType
  ): Position {
    if (view === 'left' || view === 'right') {
      // Unified Y coordinate mapping
      const xPos = (element.y / roomDimensions.height) * 1000;
      const mirrorMultiplier = view === 'left' ? -1 : 1;
      return {
        x: xPos * mirrorMultiplier,
        y: element.z
      };
    }
    // ... rest of new logic
    return { x: 0, y: 0 };
  }
}
```

---

## 📞 **Support**

For questions or issues:

1. Check this guide
2. Enable debug mode: `FeatureFlagService.enableDebugMode(true)`
3. Check database flag settings
4. Review A/B test results
5. Check application logs

---

**Remember: Safety first! Always use feature flags, always keep legacy code, always test thoroughly.**
