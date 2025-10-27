/**
 * ComponentService - Database-driven component behavior and properties
 * Replaces hardcoded COMPONENT_DATA and elevation height constants
 * Enhanced with intelligent caching and batch loading
 */

import { supabase } from '@/integrations/supabase/client';
import { RoomType, DesignElement } from '@/types/project';
import { cacheManager, IntelligentCache } from './CacheService';
import { ComponentPositionValidator } from '@/utils/ComponentPositionValidator';

export interface ComponentBehavior {
  mount_type: 'floor' | 'wall';
  has_direction: boolean;
  door_side: 'front' | 'back' | 'left' | 'right';
  default_z_position: number;
  elevation_height?: number;
  corner_configuration: any;
  component_behavior: any;
}

export interface ComponentElevationData {
  height: number;
  elevation_height?: number;
  use_actual_height: boolean;
  is_tall_unit: boolean;
}

// Enhanced caching with TTL and intelligent eviction
const behaviorCache = cacheManager.getCache<ComponentBehavior>('component-behavior', {
  ttl: 10 * 60 * 1000, // 10 minutes TTL
  maxSize: 500,
  enableBatching: true
});

const elevationCache = cacheManager.getCache<ComponentElevationData>('component-elevation', {
  ttl: 10 * 60 * 1000, // 10 minutes TTL
  maxSize: 1000,
  enableBatching: true
});

export class ComponentService {
  /**
   * Batch load component behaviors for better performance
   */
  static async batchLoadComponentBehaviors(componentTypes: string[]): Promise<Map<string, ComponentBehavior>> {
    console.log(`🔄 [ComponentService] Batch loading behaviors for ${componentTypes.length} component types`);
    
    // Check cache for existing entries
    const results = new Map<string, ComponentBehavior>();
    const uncachedTypes: string[] = [];

    for (const type of componentTypes) {
      const cached = behaviorCache.get(type);
      if (cached) {
        results.set(type, cached);
      } else {
        uncachedTypes.push(type);
      }
    }

    if (uncachedTypes.length === 0) {
      console.log(`⚡ [ComponentService] All ${componentTypes.length} behaviors found in cache`);
      return results;
    }

    console.log(`🔍 [ComponentService] Loading ${uncachedTypes.length} uncached behaviors from database`);

    try {
      // Batch query for all uncached types
      const { data, error } = await supabase
        .from('components')
        .select('type, mount_type, has_direction, door_side, default_z_position, elevation_height, corner_configuration, component_behavior')
        .in('type', uncachedTypes);

      if (error) {
        console.warn('⚠️ [ComponentService] Batch query error:', error);
      }

      // Process results
      const foundTypes = new Set<string>();
      if (data) {
        for (const item of data) {
          const behavior: ComponentBehavior = {
            mount_type: item.mount_type as 'floor' | 'wall',
            has_direction: item.has_direction,
            door_side: item.door_side as 'front' | 'back' | 'left' | 'right',
            default_z_position: Number(item.default_z_position),
            elevation_height: item.elevation_height ? Number(item.elevation_height) : undefined,
            corner_configuration: item.corner_configuration || {},
            component_behavior: item.component_behavior || {}
          };

          results.set(item.type, behavior);
          behaviorCache.set(item.type, behavior);
          foundTypes.add(item.type);
        }
      }

      // Add fallbacks for types not found in database
      for (const type of uncachedTypes) {
        if (!foundTypes.has(type)) {
          const fallback: ComponentBehavior = {
            mount_type: 'floor',
            has_direction: true,
            door_side: 'front',
            default_z_position: 0,
            elevation_height: 86, // Fixed: Was 85cm, now 86cm (base cabinet standard)
            corner_configuration: {},
            component_behavior: {}
          };
          console.warn(`⚠️ [ComponentService] Using fallback behavior for type "${type}" - elevation_height: 86cm`);
          results.set(type, fallback);
          behaviorCache.set(type, fallback, 30 * 60 * 1000); // Cache fallbacks for 30 minutes
        }
      }

      console.log(`✅ [ComponentService] Batch loaded ${results.size} component behaviors`);
      return results;

    } catch (err) {
      console.error('💥 [ComponentService] Batch loading error:', err);
      
      // Return fallbacks for all uncached types
      for (const type of uncachedTypes) {
        if (!results.has(type)) {
          const fallback: ComponentBehavior = {
            mount_type: 'floor',
            has_direction: true,
            door_side: 'front',
            default_z_position: 0,
            elevation_height: 86, // Fixed: Was 85cm, now 86cm (base cabinet standard)
            corner_configuration: {},
            component_behavior: {}
          };
          console.error(`💥 [ComponentService] ERROR fallback for type "${type}" - using elevation_height: 86cm`);
          results.set(type, fallback);
        }
      }

      return results;
    }
  }

  /**
   * Preload common component behaviors for performance
   */
  static async preloadCommonBehaviors(): Promise<void> {
    const commonTypes = [
      'cabinet', 'appliance', 'counter-top', 'end-panel',
      'window', 'door', 'flooring', 'toe-kick', 'cornice', 'pelmet'
    ];

    console.log('🔥 [ComponentService] Preloading common component behaviors');
    await this.batchLoadComponentBehaviors(commonTypes);
  }
  /**
   * Get component behavior properties (replaces COMPONENT_DATA lookup)
   */
  static async getComponentBehavior(componentType: string): Promise<ComponentBehavior> {
    // Check intelligent cache first
    const cached = behaviorCache.get(componentType);
    if (cached) {
      console.log(`⚡ [ComponentService] Cache hit for component type: ${componentType}`);
      return cached;
    }

    console.log(`🔍 [ComponentService] Loading behavior for component type: ${componentType}`);

    try {
      const { data, error } = await supabase
        .from('components')
        .select('mount_type, has_direction, door_side, default_z_position, elevation_height, corner_configuration, component_behavior')
        .eq('type', componentType)
        .limit(1)
        .single();

      if (error) {
        console.warn(`⚠️ [ComponentService] No behavior data found for ${componentType}, using defaults:`, error);
        // Fallback to reasonable defaults
        const fallback: ComponentBehavior = {
          mount_type: 'floor',
          has_direction: true,
          door_side: 'front',
          default_z_position: 0,
          elevation_height: 86, // Fixed: Was 85cm, now 86cm (base cabinet standard)
          corner_configuration: {},
          component_behavior: {}
        };
        console.warn(`⚠️ [ComponentService] FALLBACK USED - Type: ${componentType}, elevation_height: 86cm`);
        behaviorCache.set(componentType, fallback, 30 * 60 * 1000); // Cache fallbacks for 30 minutes
        return fallback;
      }

      const behavior: ComponentBehavior = {
        mount_type: data.mount_type as 'floor' | 'wall',
        has_direction: data.has_direction,
        door_side: data.door_side as 'front' | 'back' | 'left' | 'right',
        default_z_position: Number(data.default_z_position),
        elevation_height: data.elevation_height ? Number(data.elevation_height) : undefined,
        corner_configuration: data.corner_configuration || {},
        component_behavior: data.component_behavior || {}
      };

      behaviorCache.set(componentType, behavior);
      console.log(`✅ [ComponentService] Loaded and cached behavior for ${componentType}`);
      return behavior;

    } catch (err) {
      console.error(`❌ [ComponentService] Failed to load behavior for ${componentType}:`, err);
      // Return safe defaults
      const fallback: ComponentBehavior = {
        mount_type: 'floor',
        has_direction: true,
        door_side: 'front',
        default_z_position: 0,
        elevation_height: 86, // Fixed: Was 85cm, now 86cm (base cabinet standard)
        corner_configuration: {},
        component_behavior: {}
      };
      console.error(`❌ [ComponentService] EXCEPTION FALLBACK - Type: ${componentType}, elevation_height: 86cm`);
      return fallback;
    }
  }

  /**
   * Get Z position for element (height off floor)
   *
   * Priority order:
   * 1. Explicit Z set on element
   * 2. Default from component definition (database)
   * 3. Fallback based on type (ComponentPositionValidator)
   *
   * @param element - Design element
   * @param componentData - Component data from database (optional)
   * @returns Z position in cm
   */
  static getZPosition(
    element: DesignElement,
    componentData?: { default_z_position?: number | null }
  ): number {
    // Priority 1: Explicit Z set on element
    if (element.z !== undefined && element.z !== null) {
      return element.z;
    }

    // Priority 2: Default from component definition
    if (componentData?.default_z_position !== null && componentData?.default_z_position !== undefined) {
      return componentData.default_z_position;
    }

    // Priority 3: Fallback based on type
    return ComponentPositionValidator.getDefaultZ(element.type, element.component_id);
  }

  /**
   * Get elevation rendering height (SIZE of component in elevation view)
   *
   * Always uses element.height (the SIZE of the component).
   * The elevation_height field in database is deprecated.
   *
   * @param componentId - Component ID (unused, kept for compatibility)
   * @param element - Design element
   * @returns Height in cm (element.height)
   */
  static getElevationHeight(componentId: string, element?: DesignElement): number {
    if (!element) {
      console.warn(`⚠️ [ComponentService] getElevationHeight called without element for ${componentId}, returning default 86cm`);
      return 86;
    }

    // Always use element.height (the SIZE of the component)
    return element.height;
  }

  /**
   * Get default Z position for component type
   */
  static async getDefaultZPosition(componentType: string): Promise<number> {
    const behavior = await this.getComponentBehavior(componentType);
    return behavior.default_z_position;
  }

  /**
   * Check if component has directional orientation
   */
  static async hasDirection(componentType: string): Promise<boolean> {
    const behavior = await this.getComponentBehavior(componentType);
    return behavior.has_direction;
  }

  /**
   * Get component mount type (floor or wall)
   */
  static async getMountType(componentType: string): Promise<'floor' | 'wall'> {
    const behavior = await this.getComponentBehavior(componentType);
    return behavior.mount_type;
  }

  /**
   * Get door side for component
   */
  static async getDoorSide(componentType: string): Promise<'front' | 'back' | 'left' | 'right'> {
    const behavior = await this.getComponentBehavior(componentType);
    return behavior.door_side;
  }

  /**
   * Get corner configuration for L-shaped components
   */
  static async getCornerConfiguration(componentId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('components')
        .select('corner_configuration')
        .eq('component_id', componentId)
        .single();

      if (error || !data) {
        return {};
      }

      return data.corner_configuration || {};
    } catch (err) {
      console.error(`❌ [ComponentService] Failed to load corner config for ${componentId}:`, err);
      return {};
    }
  }

  /**
   * Check if component is a corner unit
   */
  static isCornerComponent(componentId: string): boolean {
    return componentId.toLowerCase().includes('corner');
  }

  /**
   * Get default depth for component type (replaces COMPONENT_DATA.defaultDepth)
   */
  static async getDefaultDepth(componentType: string): Promise<number> {
    const behavior = await this.getComponentBehavior(componentType);
    
    // Map component types to their typical depths
    const depthMap: Record<string, number> = {
      'cabinet': 60,
      'base-cabinet': 60,
      'wall-cabinet': 35,
      'appliance': 60,
      'counter-top': 60,
      'end-panel': 60,
      'window': 15,
      'door': 4,
      'flooring': 2,
      'toe-kick': 10,
      'cornice': 5,
      'pelmet': 8,
      'wall-unit-end-panel': 60
    };

    return depthMap[componentType] || 60;
  }

  /**
   * Clear all caches (useful for testing or data refresh)
   */
  static clearCache(): void {
    behaviorCache.clear();
    console.log('🧹 [ComponentService] Cache cleared');
  }
}

export default ComponentService;
