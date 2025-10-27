/**
 * Service for loading and caching 2D render definitions from database
 * Date: 2025-10-09
 * Related: docs/session-2025-10-09-2d-database-migration/
 */

import { supabase } from '@/integrations/supabase/client';
import type { Render2DDefinition } from '@/types/render2d';
import { Logger } from '@/utils/Logger';

class Render2DService {
  private cache: Map<string, Render2DDefinition> = new Map();
  private isPreloaded: boolean = false;
  private preloadPromise: Promise<void> | null = null;

  /**
   * Preload all 2D render definitions on app startup
   * This is called once and caches all definitions in memory
   */
  async preloadAll(): Promise<void> {
    // Return existing promise if preload already in progress
    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    // Already preloaded
    if (this.isPreloaded) {
      return Promise.resolve();
    }

    // Create new preload promise
    this.preloadPromise = this._performPreload();
    return this.preloadPromise;
  }

  private async _performPreload(): Promise<void> {
    Logger.debug('[Render2DService] Preloading 2D render definitions...');
    const startTime = performance.now();

    try {
      const { data, error } = await supabase
        .from('component_2d_renders')
        .select('*');

      if (error) {
        Logger.error('[Render2DService] Preload failed:', error);
        this.preloadPromise = null; // Reset so it can be retried
        throw error;
      }

      if (!data) {
        Logger.warn('[Render2DService] No 2D render definitions found');
        this.isPreloaded = true;
        this.preloadPromise = null;
        return;
      }

      // Cache all definitions
      data.forEach(def => {
        this.cache.set(def.component_id, def as Render2DDefinition);
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      this.isPreloaded = true;
      this.preloadPromise = null;

      Logger.debug(`[Render2DService] ✅ Preloaded ${data.length} definitions in ${duration}ms`);
    } catch (error) {
      Logger.error('[Render2DService] Preload error:', error);
      this.preloadPromise = null;
      throw error;
    }
  }

  /**
   * Get 2D render definition for a component (cached)
   * This is the main method used by rendering code
   */
  async get(componentId: string): Promise<Render2DDefinition | null> {
    // Check cache first (fastest path)
    if (this.cache.has(componentId)) {
      return this.cache.get(componentId)!;
    }

    // 🔧 FALLBACK: Try base component for directional variants
    const fallbackId = this.getBaseComponentId(componentId);
    if (fallbackId !== componentId && this.cache.has(fallbackId)) {
      Logger.debug(`✨ [Render2DService] Using cached fallback '${fallbackId}' for '${componentId}'`);
      return this.cache.get(fallbackId)!;
    }

    // If not preloaded yet, try to fetch individually
    // This handles edge cases where rendering happens before preload
    if (!this.isPreloaded) {
      Logger.warn(`[Render2DService] Definition for "${componentId}" requested before preload`);

      try {
        let { data, error } = await supabase
          .from('component_2d_renders')
          .select('*')
          .eq('component_id', componentId)
          .single();

        // 🔧 FALLBACK: If not found, try base component for directional variants
        if (!data && !error && fallbackId !== componentId) {
          Logger.debug(`✨ [Render2DService] Trying fallback for '${componentId}' → '${fallbackId}'`);
          const fallbackResult = await supabase
            .from('component_2d_renders')
            .select('*')
            .eq('component_id', fallbackId)
            .single();

          data = fallbackResult.data;
          error = fallbackResult.error;

          if (data) {
            Logger.debug(`✨ [Render2DService] Fallback successful: Using '${fallbackId}' for '${componentId}'`);
          }
        }

        if (error) {
          Logger.error(`[Render2DService] Error fetching definition for "${componentId}":`, error);
          return null;
        }

        if (data) {
          // Cache for future use
          this.cache.set(componentId, data as Render2DDefinition);
          return data as Render2DDefinition;
        }
      } catch (error) {
        Logger.error(`[Render2DService] Fetch error for "${componentId}":`, error);
        return null;
      }
    }

    // Not in cache and preload is complete - try fallback one more time
    if (fallbackId !== componentId && this.cache.has(fallbackId)) {
      Logger.debug(`✨ [Render2DService] Using fallback '${fallbackId}' for '${componentId}'`);
      return this.cache.get(fallbackId)!;
    }

    // Not in cache and preload is complete - definition doesn't exist
    Logger.warn(`[Render2DService] No 2D render definition found for "${componentId}"`);
    return null;
  }

  /**
   * Get base component ID by stripping directional suffixes (-ns, -ew)
   * These variants are just rotational orientations of the same base component
   */
  private getBaseComponentId(componentId: string): string {
    if (componentId.endsWith('-ns') || componentId.endsWith('-ew')) {
      return componentId.slice(0, -3); // Remove last 3 chars ("-ns" or "-ew")
    }
    return componentId;
  }

  /**
   * Get multiple definitions at once (batch operation)
   * Useful for preloading specific subsets
   */
  async getMultiple(componentIds: string[]): Promise<Map<string, Render2DDefinition>> {
    const result = new Map<string, Render2DDefinition>();

    // Check cache first
    const uncached: string[] = [];
    componentIds.forEach(id => {
      const cached = this.cache.get(id);
      if (cached) {
        result.set(id, cached);
      } else {
        uncached.push(id);
      }
    });

    // Fetch uncached definitions
    if (uncached.length > 0) {
      try {
        const { data, error } = await supabase
          .from('component_2d_renders')
          .select('*')
          .in('component_id', uncached);

        if (error) {
          Logger.error('[Render2DService] Error fetching multiple definitions:', error);
        } else if (data) {
          data.forEach(def => {
            const definition = def as Render2DDefinition;
            this.cache.set(definition.component_id, definition);
            result.set(definition.component_id, definition);
          });
        }
      } catch (error) {
        Logger.error('[Render2DService] Batch fetch error:', error);
      }
    }

    return result;
  }

  /**
   * Clear cache (for admin updates or debugging)
   * Call this after admin modifies render definitions
   */
  clearCache(): void {
    Logger.debug('[Render2DService] Clearing cache...');
    this.cache.clear();
    this.isPreloaded = false;
    this.preloadPromise = null;
  }

  /**
   * Get cache statistics (for debugging/monitoring)
   */
  getCacheStats(): { size: number; isPreloaded: boolean; componentIds: string[] } {
    return {
      size: this.cache.size,
      isPreloaded: this.isPreloaded,
      componentIds: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if a component has a render definition (synchronous after preload)
   */
  has(componentId: string): boolean {
    return this.cache.has(componentId);
  }

  /**
   * Get cached definition synchronously (for rendering)
   * Returns null if not in cache - caller should handle fallback
   */
  getCached(componentId: string): Render2DDefinition | null {
    // Try exact match first
    let cached = this.cache.get(componentId);

    // 🔧 FALLBACK: Try base component for directional variants
    if (!cached) {
      const fallbackId = this.getBaseComponentId(componentId);
      if (fallbackId !== componentId) {
        cached = this.cache.get(fallbackId);
        if (cached) {
          Logger.debug(`✨ [Render2DService] Using cached fallback '${fallbackId}' for '${componentId}'`);
        }
      }
    }

    return cached || null;
  }

  /**
   * Get all cached definitions (for debugging)
   */
  getAll(): Render2DDefinition[] {
    return Array.from(this.cache.values());
  }

  /**
   * Manually add a definition to cache (for testing or admin preview)
   */
  setCached(definition: Render2DDefinition): void {
    this.cache.set(definition.component_id, definition);
  }
}

// Export singleton instance
export const render2DService = new Render2DService();

// Export class for testing
export { Render2DService };
