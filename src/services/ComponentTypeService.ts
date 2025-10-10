/**
 * ComponentTypeService - Database-driven component type references
 * Provides access to appliance_types and furniture_types tables
 */

import { supabase } from '@/integrations/supabase/client';

export interface ApplianceType {
  id: string;
  appliance_code: string;
  appliance_name: string;
  category: string;
  default_color: string;
  default_finish: string | null;
  typical_width: number | null;
  typical_height: number | null;
  typical_depth: number | null;
  description: string | null;
}

export interface FurnitureType {
  id: string;
  furniture_code: string;
  furniture_name: string;
  category: string;
  default_color: string | null;
  default_material: string | null;
  typical_width: number | null;
  typical_height: number | null;
  typical_depth: number | null;
  weight_capacity_kg: number | null;
  description: string | null;
  style_tags: string[] | null;
}

/**
 * Cache for component type data to avoid repeated database queries
 */
class ComponentTypeCache {
  private applianceCache = new Map<string, ApplianceType>();
  private furnitureCache = new Map<string, FurnitureType>();
  private allAppliancesLoaded = false;
  private allFurnitureLoaded = false;

  getAppliance(code: string): ApplianceType | null {
    return this.applianceCache.get(code) || null;
  }

  setAppliance(code: string, type: ApplianceType): void {
    this.applianceCache.set(code, type);
  }

  getAllAppliances(): ApplianceType[] | null {
    return this.allAppliancesLoaded ? Array.from(this.applianceCache.values()) : null;
  }

  setAllAppliances(types: ApplianceType[]): void {
    this.applianceCache.clear();
    types.forEach(type => this.applianceCache.set(type.appliance_code, type));
    this.allAppliancesLoaded = true;
  }

  getFurniture(code: string): FurnitureType | null {
    return this.furnitureCache.get(code) || null;
  }

  setFurniture(code: string, type: FurnitureType): void {
    this.furnitureCache.set(code, type);
  }

  getAllFurniture(): FurnitureType[] | null {
    return this.allFurnitureLoaded ? Array.from(this.furnitureCache.values()) : null;
  }

  setAllFurniture(types: FurnitureType[]): void {
    this.furnitureCache.clear();
    types.forEach(type => this.furnitureCache.set(type.furniture_code, type));
    this.allFurnitureLoaded = true;
  }

  clear(): void {
    this.applianceCache.clear();
    this.furnitureCache.clear();
    this.allAppliancesLoaded = false;
    this.allFurnitureLoaded = false;
  }
}

const cache = new ComponentTypeCache();

export class ComponentTypeService {
  /**
   * Get appliance type by code (e.g., 'oven', 'dishwasher')
   */
  static async getApplianceType(applianceCode: string): Promise<ApplianceType | null> {
    // Check cache first
    const cached = cache.getAppliance(applianceCode);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('appliance_types')
        .select('*')
        .eq('appliance_code', applianceCode)
        .single();

      if (error) {
        console.warn(`[ComponentTypeService] Appliance type not found: ${applianceCode}`, error);
        return null;
      }

      if (data) {
        cache.setAppliance(applianceCode, data);
        return data;
      }

      return null;
    } catch (error) {
      console.error('[ComponentTypeService] Error fetching appliance type:', error);
      return null;
    }
  }

  /**
   * Get all appliance types
   */
  static async getAllApplianceTypes(): Promise<ApplianceType[]> {
    // Check cache first
    const cached = cache.getAllAppliances();
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('appliance_types')
        .select('*')
        .order('category', { ascending: true })
        .order('appliance_name', { ascending: true });

      if (error) {
        console.error('[ComponentTypeService] Error fetching appliance types:', error);
        return [];
      }

      if (data) {
        cache.setAllAppliances(data);
        return data;
      }

      return [];
    } catch (error) {
      console.error('[ComponentTypeService] Error fetching appliance types:', error);
      return [];
    }
  }

  /**
   * Get appliance color by code
   * Returns hex color string or null if not found
   */
  static async getApplianceColor(applianceCode: string): Promise<string | null> {
    const appliance = await this.getApplianceType(applianceCode);
    return appliance?.default_color || null;
  }

  /**
   * Get furniture type by code (e.g., 'single-bed', 'sofa-3seater')
   */
  static async getFurnitureType(furnitureCode: string): Promise<FurnitureType | null> {
    // Check cache first
    const cached = cache.getFurniture(furnitureCode);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('furniture_types')
        .select('*')
        .eq('furniture_code', furnitureCode)
        .single();

      if (error) {
        console.warn(`[ComponentTypeService] Furniture type not found: ${furnitureCode}`, error);
        return null;
      }

      if (data) {
        cache.setFurniture(furnitureCode, data);
        return data;
      }

      return null;
    } catch (error) {
      console.error('[ComponentTypeService] Error fetching furniture type:', error);
      return null;
    }
  }

  /**
   * Get all furniture types
   */
  static async getAllFurnitureTypes(): Promise<FurnitureType[]> {
    // Check cache first
    const cached = cache.getAllFurniture();
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('furniture_types')
        .select('*')
        .order('category', { ascending: true })
        .order('furniture_name', { ascending: true });

      if (error) {
        console.error('[ComponentTypeService] Error fetching furniture types:', error);
        return [];
      }

      if (data) {
        cache.setAllFurniture(data);
        return data;
      }

      return [];
    } catch (error) {
      console.error('[ComponentTypeService] Error fetching furniture types:', error);
      return [];
    }
  }

  /**
   * Get furniture color by code
   * Returns hex color string or null if not found
   */
  static async getFurnitureColor(furnitureCode: string): Promise<string | null> {
    const furniture = await this.getFurnitureType(furnitureCode);
    return furniture?.default_color || null;
  }

  /**
   * Preload all component types into cache
   * Call this on app startup for better performance
   */
  static async preloadAll(): Promise<void> {
    try {
      await Promise.all([
        this.getAllApplianceTypes(),
        this.getAllFurnitureTypes()
      ]);
      console.log('[ComponentTypeService] All component types preloaded');
    } catch (error) {
      console.error('[ComponentTypeService] Error preloading component types:', error);
    }
  }

  /**
   * Clear cache (useful for testing or admin updates)
   */
  static clearCache(): void {
    cache.clear();
  }
}
