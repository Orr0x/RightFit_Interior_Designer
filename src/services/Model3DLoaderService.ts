/**
 * Model 3D Loader Service
 *
 * Purpose: Load 3D model definitions from database
 * Feature Flag: use_dynamic_3d_models
 *
 * Responsibilities:
 * - Load component 3D models from database
 * - Load geometry parts for each model
 * - Load material definitions
 * - Cache loaded models for performance
 * - Handle feature flag switching
 *
 * Usage:
 * ```typescript
 * const model = await Model3DLoaderService.loadModel('corner-base-cabinet-60');
 * const parts = await Model3DLoaderService.loadGeometryParts(model.id);
 * const materials = await Model3DLoaderService.loadMaterials();
 * ```
 */

import { supabase } from '@/integrations/supabase/client';
import { FeatureFlagService } from './FeatureFlagService';
import { Logger } from '@/utils/Logger';

export interface Component3DModel {
  id: string;
  component_id: string;
  component_name: string;
  component_type: string;
  category: string | null;
  geometry_type: string;
  is_corner_component: boolean;
  leg_length: number | null;
  corner_depth_wall: number | null;
  corner_depth_base: number | null;
  rotation_center_x: string | null;
  rotation_center_y: string | null;
  rotation_center_z: string | null;
  has_direction: boolean;
  auto_rotate_enabled: boolean;
  wall_rotation_left: number | null;
  wall_rotation_right: number | null;
  wall_rotation_top: number | null;
  wall_rotation_bottom: number | null;
  corner_rotation_front_left: number | null;
  corner_rotation_front_right: number | null;
  corner_rotation_back_left: number | null;
  corner_rotation_back_right: number | null;
  default_width: number | null;
  default_height: number | null;
  default_depth: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeometryPart {
  id: string;
  model_id: string;
  part_name: string;
  part_type: string;
  render_order: number;
  position_x: string | null;
  position_y: string | null;
  position_z: string | null;
  dimension_width: string | null;
  dimension_height: string | null;
  dimension_depth: string | null;
  material_name: string | null;
  color_override: string | null;
  metalness: number | null;
  roughness: number | null;
  opacity: number | null;
  render_condition: string | null;
  created_at: string;
}

export interface MaterialDefinition {
  id: string;
  material_name: string;
  material_type: string;
  default_color: string | null;
  roughness: number | null;
  metalness: number | null;
  opacity: number | null;
  description: string | null;
  created_at: string;
}

export class Model3DLoaderService {
  private static readonly FEATURE_FLAG = 'use_dynamic_3d_models';

  // Cache for loaded models
  private static modelCache: Map<string, Component3DModel> = new Map();
  private static geometryCache: Map<string, GeometryPart[]> = new Map();
  private static materialCache: Map<string, MaterialDefinition> = new Map();
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_TTL = 300000; // 5 minutes

  /**
   * Check if dynamic 3D models are enabled via feature flag
   */
  static async isEnabled(): Promise<boolean> {
    try {
      return await FeatureFlagService.isEnabled(this.FEATURE_FLAG);
    } catch (error) {
      Logger.warn('[Model3DLoader] Feature flag check failed:', error);
      return false;
    }
  }

  /**
   * Load a 3D model by component ID
   * @param componentId - Component ID (e.g., 'corner-base-cabinet-60')
   * @returns Component3DModel or null if not found
   */
  static async loadModel(componentId: string): Promise<Component3DModel | null> {
    try {
      // Check feature flag
      const enabled = await this.isEnabled();
      if (!enabled) {
        Logger.debug(`[Model3DLoader] Feature disabled, skipping model load for: ${componentId}`);
        return null;
      }

      // Check cache
      if (this.isCacheValid() && this.modelCache.has(componentId)) {
        Logger.debug(`[Model3DLoader] Cache hit for model: ${componentId}`);
        return this.modelCache.get(componentId)!;
      }

      // Load from database
      let { data, error } = await supabase
        .from('component_3d_models')
        .select('*')
        .eq('component_id', componentId)
        .single();

      // 🔧 FALLBACK: If not found, try stripping directional suffixes (-ns, -ew)
      // These variants are just rotational orientations of the same base component
      if (!data && !error && (componentId.endsWith('-ns') || componentId.endsWith('-ew'))) {
        const baseComponentId = componentId.slice(0, -3); // Remove last 3 chars
        Logger.debug(`✨ [Model3DLoader] Trying fallback for '${componentId}' → '${baseComponentId}'`);

        const fallbackResult = await supabase
          .from('component_3d_models')
          .select('*')
          .eq('component_id', baseComponentId)
          .single();

        data = fallbackResult.data;
        error = fallbackResult.error;

        if (data) {
          Logger.debug(`✨ [Model3DLoader] Fallback successful: Using metadata from '${baseComponentId}' for variant '${componentId}'`);
        }
      }

      if (error) {
        Logger.error(`[Model3DLoader] Error loading model ${componentId}:`, error);
        return null;
      }

      if (!data) {
        Logger.warn(`[Model3DLoader] Model not found: ${componentId}`);
        return null;
      }

      // Cache the result
      this.modelCache.set(componentId, data);
      this.cacheTimestamp = Date.now();

      Logger.debug(`[Model3DLoader] Loaded model from database: ${componentId}`);
      return data;
    } catch (error) {
      Logger.error(`[Model3DLoader] Exception loading model ${componentId}:`, error);
      return null;
    }
  }

  /**
   * Load geometry parts for a model
   * @param modelId - Model UUID
   * @returns Array of geometry parts, sorted by render_order
   */
  static async loadGeometryParts(modelId: string): Promise<GeometryPart[]> {
    try {
      // Check cache
      if (this.isCacheValid() && this.geometryCache.has(modelId)) {
        Logger.debug(`[Model3DLoader] Cache hit for geometry: ${modelId}`);
        return this.geometryCache.get(modelId)!;
      }

      // Load from database
      const { data, error } = await supabase
        .from('geometry_parts')
        .select('*')
        .eq('model_id', modelId)
        .order('render_order', { ascending: true });

      if (error) {
        Logger.error(`[Model3DLoader] Error loading geometry parts for ${modelId}:`, error);
        return [];
      }

      if (!data || data.length === 0) {
        Logger.warn(`[Model3DLoader] No geometry parts found for model: ${modelId}`);
        return [];
      }

      // Cache the result
      this.geometryCache.set(modelId, data);
      this.cacheTimestamp = Date.now();

      Logger.debug(`[Model3DLoader] Loaded ${data.length} geometry parts for model: ${modelId}`);
      return data;
    } catch (error) {
      Logger.error(`[Model3DLoader] Exception loading geometry parts for ${modelId}:`, error);
      return [];
    }
  }

  /**
   * Load all material definitions
   * @returns Map of material_name -> MaterialDefinition
   */
  static async loadMaterials(): Promise<Map<string, MaterialDefinition>> {
    try {
      // Check cache
      if (this.isCacheValid() && this.materialCache.size > 0) {
        Logger.debug(`[Model3DLoader] Cache hit for materials`);
        return new Map(this.materialCache);
      }

      // Load from database
      const { data, error } = await supabase
        .from('material_definitions')
        .select('*');

      if (error) {
        Logger.error('[Model3DLoader] Error loading materials:', error);
        return new Map();
      }

      if (!data || data.length === 0) {
        Logger.warn('[Model3DLoader] No materials found');
        return new Map();
      }

      // Build map and cache
      this.materialCache.clear();
      for (const material of data) {
        this.materialCache.set(material.material_name, material);
      }
      this.cacheTimestamp = Date.now();

      Logger.debug(`[Model3DLoader] Loaded ${data.length} materials`);
      return new Map(this.materialCache);
    } catch (error) {
      Logger.error('[Model3DLoader] Exception loading materials:', error);
      return new Map();
    }
  }

  /**
   * Preload common models for performance
   * Call this during app initialization
   */
  static async preload(componentIds: string[]): Promise<void> {
    try {
      const enabled = await this.isEnabled();
      if (!enabled) {
        Logger.debug('[Model3DLoader] Feature disabled, skipping preload');
        return;
      }

      Logger.debug(`[Model3DLoader] Preloading ${componentIds.length} models...`);

      // Load all models in parallel
      const modelPromises = componentIds.map((id) => this.loadModel(id));
      const models = await Promise.all(modelPromises);

      // Load geometry parts for each model
      const validModels = models.filter((m) => m !== null) as Component3DModel[];
      const geometryPromises = validModels.map((m) => this.loadGeometryParts(m.id));
      await Promise.all(geometryPromises);

      // Load materials
      await this.loadMaterials();

      Logger.debug(`[Model3DLoader] Preloaded ${validModels.length} models with geometry and materials`);
    } catch (error) {
      Logger.error('[Model3DLoader] Preload failed:', error);
    }
  }

  /**
   * Load complete model with geometry and materials
   * Convenience method that loads everything needed to render
   */
  static async loadComplete(componentId: string): Promise<{
    model: Component3DModel | null;
    geometry: GeometryPart[];
    materials: Map<string, MaterialDefinition>;
  }> {
    const model = await this.loadModel(componentId);

    if (!model) {
      return {
        model: null,
        geometry: [],
        materials: new Map(),
      };
    }

    const [geometry, materials] = await Promise.all([
      this.loadGeometryParts(model.id),
      this.loadMaterials(),
    ]);

    return { model, geometry, materials };
  }

  /**
   * Clear all caches
   * Use when models are updated in database
   */
  static clearCache(): void {
    this.modelCache.clear();
    this.geometryCache.clear();
    this.materialCache.clear();
    this.cacheTimestamp = 0;
    Logger.debug('[Model3DLoader] Cache cleared');
  }

  /**
   * Check if cache is still valid
   */
  private static isCacheValid(): boolean {
    if (this.modelCache.size === 0 && this.geometryCache.size === 0 && this.materialCache.size === 0) {
      return false;
    }

    const age = Date.now() - this.cacheTimestamp;
    return age < this.CACHE_TTL;
  }

  /**
   * Get auto-rotate rules for a model
   * Returns rotation angles for different wall positions
   */
  static getAutoRotateRules(model: Component3DModel): {
    wallRotations: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
    cornerRotations: {
      frontLeft: number;
      frontRight: number;
      backLeft: number;
      backRight: number;
    };
  } {
    return {
      wallRotations: {
        left: model.wall_rotation_left ?? 90,
        right: model.wall_rotation_right ?? 270,
        top: model.wall_rotation_top ?? 0,
        bottom: model.wall_rotation_bottom ?? 180,
      },
      cornerRotations: {
        frontLeft: model.corner_rotation_front_left ?? (model.is_corner_component ? 0 : 90),
        frontRight: model.corner_rotation_front_right ?? 270,
        backLeft: model.corner_rotation_back_left ?? 90,
        backRight: model.corner_rotation_back_right ?? (model.is_corner_component ? 180 : 270),
      },
    };
  }

  /**
   * Get rotation center for a model
   * Returns formulas for X, Y, Z rotation center
   */
  static getRotationCenter(model: Component3DModel): {
    x: string;
    y: string;
    z: string;
  } {
    return {
      x: model.rotation_center_x ?? '0',
      y: model.rotation_center_y ?? '0',
      z: model.rotation_center_z ?? '0',
    };
  }

  /**
   * Check if model is a corner component
   */
  static isCornerComponent(model: Component3DModel): boolean {
    return model.is_corner_component && model.geometry_type === 'l_shaped_corner';
  }
}
