/**
 * Configuration Service
 *
 * Purpose: Load application configuration from database instead of hardcoded constants
 * Feature Flag: use_database_configuration
 *
 * Benefits:
 * - Update configuration without code deployment
 * - Environment-specific overrides (dev/staging/production)
 * - Validation and constraints
 * - Audit trail of changes
 *
 * Usage:
 * ```typescript
 * const wallThickness = await ConfigurationService.get('wall_thickness', 10); // 10 = fallback
 * const config = await ConfigurationService.getAll('wall'); // Get category
 * ```
 */

import { supabase } from '@/integrations/supabase/client';
import { FeatureFlagService } from './FeatureFlagService';
import { Logger } from '@/utils/Logger';

export interface AppConfig {
  config_key: string;
  config_name: string;
  category: string;
  value_numeric: number | null;
  value_string: string | null;
  value_boolean: boolean | null;
  value_json: any | null;
  unit: string | null;
  description: string | null;
  min_value: number | null;
  max_value: number | null;
  dev_value: number | null;
  staging_value: number | null;
  production_value: number | null;
  updated_at: string;
}

export interface ConfigValue {
  key: string;
  value: number;
  unit: string | null;
  description: string | null;
}

export interface ConfigJsonValue {
  key: string;
  value: any;
  description: string | null;
}

export class ConfigurationService {
  private static readonly FEATURE_FLAG = 'use_database_configuration';
  private static configCache: Map<string, ConfigValue> = new Map();
  private static jsonCache: Map<string, ConfigJsonValue> = new Map();
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_TTL = 60000; // 1 minute cache

  /**
   * Get configuration value by key
   * Automatically switches between database and hardcoded based on feature flag
   *
   * @param key - Configuration key (e.g., 'wall_thickness')
   * @param fallback - Fallback value if not found or flag disabled
   * @param environment - Optional environment override ('development', 'staging', 'production')
   * @returns Configuration value
   */
  static async get(
    key: string,
    fallback: number,
    environment?: 'development' | 'staging' | 'production'
  ): Promise<number> {
    try {
      // Check feature flag
      const useDatabaseConfig = await FeatureFlagService.isEnabled(this.FEATURE_FLAG);

      if (!useDatabaseConfig) {
        // Feature disabled - use hardcoded fallback
        return fallback;
      }

      // Check cache
      if (this.isCacheValid()) {
        const cached = this.configCache.get(key);
        if (cached) {
          return cached.value;
        }
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('app_configuration')
        .select('*')
        .eq('config_key', key)
        .single();

      if (error || !data) {
        Logger.warn(`[ConfigService] Config "${key}" not found, using fallback:`, fallback);
        return fallback;
      }

      // Determine effective value based on environment
      const effectiveValue = this.getEffectiveValue(data, environment);

      // Validate against constraints
      const validatedValue = this.validateValue(effectiveValue, data);

      // Cache the result
      this.configCache.set(key, {
        key,
        value: validatedValue,
        unit: data.unit,
        description: data.description,
      });

      return validatedValue;
    } catch (error) {
      Logger.error(`[ConfigService] Error loading config "${key}":`, error);
      return fallback;
    }
  }

  /**
   * Get all configuration values for a category
   *
   * @param category - Category name ('canvas', 'wall', 'snap', etc.)
   * @returns Map of key -> value
   */
  static async getAll(category: string): Promise<Map<string, ConfigValue>> {
    try {
      const useDatabaseConfig = await FeatureFlagService.isEnabled(this.FEATURE_FLAG);

      if (!useDatabaseConfig) {
        return new Map(); // Return empty if feature disabled
      }

      const { data, error } = await supabase
        .from('app_configuration')
        .select('*')
        .eq('category', category);

      if (error || !data) {
        Logger.warn(`[ConfigService] Category "${category}" not found`);
        return new Map();
      }

      const result = new Map<string, ConfigValue>();

      for (const config of data) {
        const effectiveValue = this.getEffectiveValue(config);
        const validatedValue = this.validateValue(effectiveValue, config);

        result.set(config.config_key, {
          key: config.config_key,
          value: validatedValue,
          unit: config.unit,
          description: config.description,
        });
      }

      return result;
    } catch (error) {
      Logger.error(`[ConfigService] Error loading category "${category}":`, error);
      return new Map();
    }
  }

  /**
   * Get multiple configuration values at once
   *
   * @param keys - Array of config keys
   * @param fallbacks - Object with fallback values
   * @returns Object with key -> value mappings
   */
  static async getMany(
    keys: string[],
    fallbacks: Record<string, number>
  ): Promise<Record<string, number>> {
    const result: Record<string, number> = {};

    for (const key of keys) {
      result[key] = await this.get(key, fallbacks[key] || 0);
    }

    return result;
  }

  /**
   * Get JSON configuration value by key
   * For configuration values stored as JSONB
   *
   * @param key - Configuration key (e.g., 'rotation_defaults')
   * @param fallback - Fallback value if not found or flag disabled
   * @returns Configuration JSON value
   */
  static async getJSON<T = any>(key: string, fallback: T): Promise<T> {
    try {
      // Check feature flag
      const useDatabaseConfig = await FeatureFlagService.isEnabled(this.FEATURE_FLAG);

      if (!useDatabaseConfig) {
        return fallback;
      }

      // Check cache
      if (this.isCacheValid()) {
        const cached = this.jsonCache.get(key);
        if (cached) {
          return cached.value as T;
        }
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('app_configuration')
        .select('*')
        .eq('config_key', key)
        .single();

      if (error || !data || !data.value_json) {
        Logger.warn(`[ConfigService] JSON config "${key}" not found, using fallback`);
        return fallback;
      }

      // Cache the result
      this.jsonCache.set(key, {
        key,
        value: data.value_json,
        description: data.description,
      });

      return data.value_json as T;
    } catch (error) {
      Logger.error(`[ConfigService] Error loading JSON config "${key}":`, error);
      return fallback;
    }
  }

  /**
   * Get JSON configuration value synchronously from cache
   * Must call preload() first, or this will return fallback
   *
   * @param key - Configuration key
   * @param fallback - Fallback value if not in cache
   * @returns Configuration JSON value
   */
  static getJSONSync<T = any>(key: string, fallback: T): T {
    const cached = this.jsonCache.get(key);
    return cached ? (cached.value as T) : fallback;
  }

  /**
   * Preload all configuration values into cache
   * Call this during app initialization for better performance
   */
  static async preload(): Promise<void> {
    try {
      const useDatabaseConfig = await FeatureFlagService.isEnabled(this.FEATURE_FLAG);

      if (!useDatabaseConfig) {
        Logger.debug('[ConfigService] Feature disabled, skipping preload');
        return;
      }

      const { data, error } = await supabase
        .from('app_configuration')
        .select('*');

      if (error || !data) {
        Logger.warn('[ConfigService] Preload failed:', error);
        return;
      }

      // Clear and rebuild cache
      this.configCache.clear();
      this.jsonCache.clear();

      for (const config of data) {
        // Cache numeric values
        if (config.value_numeric !== null) {
          const effectiveValue = this.getEffectiveValue(config);
          const validatedValue = this.validateValue(effectiveValue, config);

          this.configCache.set(config.config_key, {
            key: config.config_key,
            value: validatedValue,
            unit: config.unit,
            description: config.description,
          });
        }

        // Cache JSON values
        if (config.value_json !== null) {
          this.jsonCache.set(config.config_key, {
            key: config.config_key,
            value: config.value_json,
            description: config.description,
          });
        }
      }

      this.cacheTimestamp = Date.now();

      Logger.debug(`[ConfigService] Preloaded ${this.configCache.size} numeric and ${this.jsonCache.size} JSON configuration values`);
    } catch (error) {
      Logger.error('[ConfigService] Preload error:', error);
    }
  }

  /**
   * Clear configuration cache
   * Use this when configuration values are updated
   */
  static clearCache(): void {
    this.configCache.clear();
    this.jsonCache.clear();
    this.cacheTimestamp = 0;
    Logger.debug('[ConfigService] Cache cleared');
  }

  /**
   * Get effective value based on environment overrides
   */
  private static getEffectiveValue(
    config: AppConfig,
    environment?: 'development' | 'staging' | 'production'
  ): number {
    // Determine current environment
    const env = environment || this.detectEnvironment();

    // Check for environment-specific override
    if (env === 'development' && config.dev_value !== null) {
      return config.dev_value;
    }
    if (env === 'staging' && config.staging_value !== null) {
      return config.staging_value;
    }
    if (env === 'production' && config.production_value !== null) {
      return config.production_value;
    }

    // Fall back to default value
    return config.value_numeric || 0;
  }

  /**
   * Validate value against min/max constraints
   */
  private static validateValue(value: number, config: AppConfig): number {
    let validated = value;

    if (config.min_value !== null && validated < config.min_value) {
      Logger.warn(
        `[ConfigService] Value ${validated} below min ${config.min_value} for "${config.config_key}", clamping`
      );
      validated = config.min_value;
    }

    if (config.max_value !== null && validated > config.max_value) {
      Logger.warn(
        `[ConfigService] Value ${validated} above max ${config.max_value} for "${config.config_key}", clamping`
      );
      validated = config.max_value;
    }

    return validated;
  }

  /**
   * Detect current environment
   */
  private static detectEnvironment(): 'development' | 'staging' | 'production' {
    // Check for explicit environment variable
    const env = import.meta.env.MODE;

    if (env === 'development' || env === 'dev') {
      return 'development';
    }
    if (env === 'staging') {
      return 'staging';
    }

    // Default to production
    return 'production';
  }

  /**
   * Check if cache is still valid
   */
  private static isCacheValid(): boolean {
    if (this.configCache.size === 0) {
      return false;
    }

    const age = Date.now() - this.cacheTimestamp;
    return age < this.CACHE_TTL;
  }

  /**
   * Get configuration value synchronously from cache
   * Must call preload() first, or this will return fallback
   *
   * @param key - Configuration key
   * @param fallback - Fallback value if not in cache
   * @returns Configuration value
   */
  static getSync(key: string, fallback: number): number {
    const cached = this.configCache.get(key);
    return cached ? cached.value : fallback;
  }

  /**
   * Check if configuration is loaded from database
   */
  static async isUsingDatabase(): Promise<boolean> {
    return await FeatureFlagService.isEnabled(this.FEATURE_FLAG);
  }
}
