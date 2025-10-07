/**
 * Feature Flag Service
 *
 * Purpose: Enable safe, gradual rollout of new features with instant rollback capability
 *
 * Key Features:
 * - Environment-specific flags (dev, staging, production)
 * - Gradual rollout by percentage (1% → 100%)
 * - User tier overrides
 * - Caching for performance
 * - Automatic fallback to legacy on errors
 * - A/B testing support
 *
 * Usage:
 * ```typescript
 * // Simple boolean check
 * const enabled = await FeatureFlagService.isEnabled('use_new_positioning_system');
 *
 * // Use legacy or new implementation
 * const result = await FeatureFlagService.useLegacyOr(
 *   'use_new_positioning_system',
 *   () => legacyFunction(),
 *   () => newFunction()
 * );
 * ```
 */

import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  user_tier_override: Record<string, boolean> | null;
  enabled_dev: boolean;
  enabled_staging: boolean;
  enabled_production: boolean;
  test_status: 'untested' | 'testing' | 'passed' | 'failed';
  test_results: any;
  can_disable: boolean;
  created_at: string;
  updated_at: string;
}

export class FeatureFlagService {
  private static flagCache = new Map<string, FeatureFlag>();
  private static cacheExpiry = 60000; // 1 minute cache
  private static lastFetch = 0;
  private static debugMode = false;

  /**
   * Enable debug mode for verbose logging
   */
  static enableDebugMode(enable: boolean = true): void {
    this.debugMode = enable;
    if (enable) {
      console.log('[FeatureFlag] Debug mode enabled');
    }
  }

  /**
   * Check if a feature is enabled
   * Falls back to false if flag doesn't exist or DB fails
   */
  static async isEnabled(flagKey: string, userId?: string): Promise<boolean> {
    try {
      // Check cache first
      if (this.isCacheValid() && this.flagCache.has(flagKey)) {
        const flag = this.flagCache.get(flagKey)!;
        const result = this.evaluateFlag(flag, userId);
        if (this.debugMode) {
          console.log(`[FeatureFlag] Cache hit for "${flagKey}": ${result}`);
        }
        return result;
      }

      // Fetch from database
      if (this.debugMode) {
        console.log(`[FeatureFlag] Fetching "${flagKey}" from database...`);
      }

      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('flag_key', flagKey)
        .single();

      if (error || !data) {
        console.warn(`[FeatureFlag] Flag "${flagKey}" not found, defaulting to FALSE (using legacy)`);
        return false;
      }

      // Cache the flag
      this.flagCache.set(flagKey, data as FeatureFlag);
      this.lastFetch = Date.now();

      const result = this.evaluateFlag(data as FeatureFlag, userId);
      if (this.debugMode) {
        console.log(`[FeatureFlag] Fetched "${flagKey}" from database: ${result}`);
      }
      return result;
    } catch (error) {
      console.error(`[FeatureFlag] Error checking flag "${flagKey}":`, error);
      return false; // Safe default - use legacy
    }
  }

  /**
   * Evaluate flag based on environment, user tier, rollout percentage
   */
  private static evaluateFlag(flag: FeatureFlag, userId?: string): boolean {
    // Environment check
    const env = import.meta.env.MODE;
    if (env === 'development' && !flag.enabled_dev) {
      if (this.debugMode) {
        console.log(`[FeatureFlag] "${flag.flag_key}" disabled in development`);
      }
      return false;
    }
    if (env === 'staging' && !flag.enabled_staging) {
      if (this.debugMode) {
        console.log(`[FeatureFlag] "${flag.flag_key}" disabled in staging`);
      }
      return false;
    }
    if (env === 'production' && !flag.enabled_production) {
      if (this.debugMode) {
        console.log(`[FeatureFlag] "${flag.flag_key}" disabled in production`);
      }
      return false;
    }

    // Master enabled check
    if (!flag.enabled) {
      if (this.debugMode) {
        console.log(`[FeatureFlag] "${flag.flag_key}" master flag disabled`);
      }
      return false;
    }

    // User tier override
    if (userId && flag.user_tier_override) {
      const userTier = this.getUserTier(userId);
      if (userTier && flag.user_tier_override[userTier] !== undefined) {
        const result = flag.user_tier_override[userTier];
        if (this.debugMode) {
          console.log(`[FeatureFlag] "${flag.flag_key}" user tier override for ${userTier}: ${result}`);
        }
        return result;
      }
    }

    // Rollout percentage (for gradual rollout)
    if (flag.rollout_percentage < 100) {
      const userHash = userId ? this.hashUserId(userId) : Math.random() * 100;
      const result = userHash <= flag.rollout_percentage;
      if (this.debugMode) {
        console.log(`[FeatureFlag] "${flag.flag_key}" rollout ${flag.rollout_percentage}%, user hash ${userHash.toFixed(2)}: ${result}`);
      }
      return result;
    }

    return true;
  }

  /**
   * Use legacy or new implementation based on feature flag
   * Automatically falls back to legacy on errors
   */
  static async useLegacyOr<T>(
    flagKey: string,
    legacyFn: () => T | Promise<T>,
    newFn: () => T | Promise<T>,
    userId?: string
  ): Promise<T> {
    const useNew = await this.isEnabled(flagKey, userId);

    if (useNew) {
      console.log(`[FeatureFlag] 🆕 Using NEW implementation for "${flagKey}"`);
      try {
        return await newFn();
      } catch (error) {
        console.error(`[FeatureFlag] ❌ NEW implementation failed for "${flagKey}", falling back to LEGACY:`, error);
        return await legacyFn();
      }
    } else {
      console.log(`[FeatureFlag] 🔒 Using LEGACY implementation for "${flagKey}"`);
      return await legacyFn();
    }
  }

  /**
   * Run BOTH implementations and log comparison (no user impact)
   * Always returns legacy result to user, but tests new system silently
   */
  static async testInParallel<T>(
    testName: string,
    legacyFn: () => T | Promise<T>,
    newFn: () => T | Promise<T>
  ): Promise<T> {
    // Always return legacy to user
    const legacyResult = await legacyFn();

    // Test new system in background (don't await, don't block)
    Promise.resolve().then(async () => {
      try {
        const newStart = performance.now();
        await newFn();
        const newTime = performance.now() - newStart;

        if (this.debugMode) {
          console.log(`[ParallelTest] "${testName}" new implementation completed in ${newTime.toFixed(2)}ms`);
        }
      } catch (error) {
        console.error(`[ParallelTest] New implementation failed for "${testName}":`, error);
      }
    });

    return legacyResult; // User always gets legacy result
  }

  /**
   * Get all feature flags (for admin UI)
   */
  static async getAllFlags(): Promise<FeatureFlag[]> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('flag_name');

      if (error) {
        console.error('[FeatureFlag] Error fetching all flags:', error);
        return [];
      }

      return (data || []) as FeatureFlag[];
    } catch (error) {
      console.error('[FeatureFlag] Error fetching all flags:', error);
      return [];
    }
  }

  /**
   * Update feature flag (admin only)
   */
  static async updateFlag(
    flagKey: string,
    updates: Partial<FeatureFlag>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update(updates)
        .eq('flag_key', flagKey);

      if (error) {
        console.error(`[FeatureFlag] Error updating flag "${flagKey}":`, error);
        return { success: false, error: error.message };
      }

      // Clear cache after update
      this.flagCache.delete(flagKey);
      console.log(`[FeatureFlag] ✅ Updated flag "${flagKey}"`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[FeatureFlag] Error updating flag "${flagKey}":`, error);
      return { success: false, error: message };
    }
  }

  /**
   * Emergency: Disable ALL new features at once
   */
  static async emergencyDisableAll(): Promise<void> {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled: false, rollout_percentage: 0 })
        .eq('can_disable', true);

      if (error) {
        console.error('[FeatureFlag] Error during emergency disable:', error);
        return;
      }

      this.clearCache();
      console.error('🚨 EMERGENCY: All new features disabled, using legacy systems');
    } catch (error) {
      console.error('[FeatureFlag] Error during emergency disable:', error);
    }
  }

  /**
   * Clear cache (useful for testing or after manual flag updates)
   */
  static clearCache(): void {
    this.flagCache.clear();
    this.lastFetch = 0;
    if (this.debugMode) {
      console.log('[FeatureFlag] Cache cleared');
    }
  }

  /**
   * Check if cache is still valid
   */
  private static isCacheValid(): boolean {
    return Date.now() - this.lastFetch < this.cacheExpiry;
  }

  /**
   * Hash user ID to consistent percentage (0-100)
   * Ensures same user always gets same rollout decision
   */
  private static hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Get user tier (placeholder - implement based on your user system)
   */
  private static getUserTier(userId: string): string | null {
    // TODO: Implement user tier lookup from your user/profiles table
    // For now, return null to skip tier-based overrides
    return null;
  }

  /**
   * Get cache stats (for debugging)
   */
  static getCacheStats(): { size: number; age: number; valid: boolean } {
    return {
      size: this.flagCache.size,
      age: Date.now() - this.lastFetch,
      valid: this.isCacheValid()
    };
  }
}

// Enable debug mode if localStorage flag is set
if (typeof localStorage !== 'undefined' && localStorage.getItem('debug_feature_flags') === 'true') {
  FeatureFlagService.enableDebugMode(true);
}
