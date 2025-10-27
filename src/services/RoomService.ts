/**
 * RoomService - Database-driven room configuration and templates
 * Replaces hardcoded ROOM_TYPE_CONFIGS and DEFAULT_ROOM constants
 */

import { supabase } from '@/integrations/supabase/client';
import { RoomType, RoomDimensions } from '@/types/project';
import { Logger } from '@/utils/Logger';

export interface RoomColors {
  floor: string;
  walls: string;
  ceiling: string;
  text: string;
}

export interface RoomTypeTemplate {
  id: string;
  room_type: RoomType;
  name: string;
  icon_name: string;
  description: string;
  default_width: number;
  default_height: number;
  default_wall_height: number;
  default_ceiling_height: number;
  default_settings: any;
  default_colors?: RoomColors;
}

export interface RoomConfiguration {
  dimensions: RoomDimensions;
  wall_height: number;
  ceiling_height: number;
  settings: any;
}

/**
 * Cache for room templates to avoid repeated database queries
 */
class RoomTemplateCache {
  private cache = new Map<RoomType, RoomTypeTemplate>();

  get(roomType: RoomType): RoomTypeTemplate | null {
    return this.cache.get(roomType) || null;
  }

  set(roomType: RoomType, template: RoomTypeTemplate): void {
    this.cache.set(roomType, template);
  }

  clear(): void {
    this.cache.clear();
  }
}

const templateCache = new RoomTemplateCache();

export class RoomService {
  /**
   * Get room type template (replaces ROOM_TYPE_CONFIGS lookup)
   */
  static async getRoomTypeTemplate(roomType: RoomType): Promise<RoomTypeTemplate> {
    // Check cache first
    const cached = templateCache.get(roomType);
    if (cached) {
      return cached;
    }

    Logger.debug(`🏠 [RoomService] Loading template for room type: ${roomType}`);

    try {
      const { data, error } = await supabase
        .from('room_type_templates')
        .select('*')
        .eq('room_type', roomType)
        .single();

      if (error) {
        Logger.warn(`⚠️ [RoomService] No template found for ${roomType}, using defaults:`, error);
        // Fallback to reasonable defaults
        const safeName = roomType ? roomType.charAt(0).toUpperCase() + roomType.slice(1) : 'Kitchen';
        const fallback: RoomTypeTemplate = {
          id: 'fallback',
          room_type: roomType || 'kitchen',
          name: safeName,
          icon_name: 'Square',
          description: `${roomType} design`,
          default_width: 400,
          default_height: 300,
          default_wall_height: 240,
          default_ceiling_height: 250,
          default_settings: {}
        };
        templateCache.set(roomType, fallback);
        return fallback;
      }

      const template: RoomTypeTemplate = {
        id: data.id,
        room_type: data.room_type as RoomType,
        name: data.name,
        icon_name: data.icon_name,
        description: data.description,
        default_width: Number(data.default_width),
        default_height: Number(data.default_height),
        default_wall_height: Number(data.default_wall_height),
        default_ceiling_height: Number(data.default_ceiling_height),
        default_settings: data.default_settings || {}
      };

      templateCache.set(roomType, template);
      Logger.debug(`✅ [RoomService] Loaded template for ${roomType}:`, template);
      return template;

    } catch (err) {
      Logger.error(`❌ [RoomService] Failed to load template for ${roomType}:`, err);
      // Return safe defaults
      const fallback: RoomTypeTemplate = {
        id: 'fallback',
        room_type: roomType,
        name: roomType.charAt(0).toUpperCase() + roomType.slice(1),
        icon_name: 'Square',
        description: `${roomType} design`,
        default_width: 400,
        default_height: 300,
        default_wall_height: 240,
        default_ceiling_height: 250,
        default_settings: {}
      };
      return fallback;
    }
  }

  /**
   * Get default dimensions for room type (replaces ROOM_TYPE_CONFIGS.defaultDimensions)
   */
  static async getDefaultDimensions(roomType: RoomType): Promise<RoomDimensions> {
    const template = await this.getRoomTypeTemplate(roomType);
    return {
      width: template.default_width,
      height: template.default_height
    };
  }

  /**
   * Get default wall height for room type (replaces DEFAULT_ROOM.wallHeight)
   */
  static async getDefaultWallHeight(roomType: RoomType): Promise<number> {
    const template = await this.getRoomTypeTemplate(roomType);
    return template.default_wall_height;
  }

  /**
   * Get default ceiling height for room type
   */
  static async getDefaultCeilingHeight(roomType: RoomType): Promise<number> {
    const template = await this.getRoomTypeTemplate(roomType);
    return template.default_ceiling_height;
  }

  /**
   * Get default settings for room type
   */
  static async getDefaultSettings(roomType: RoomType): Promise<any> {
    const template = await this.getRoomTypeTemplate(roomType);
    return template.default_settings;
  }

  /**
   * Get all available room type templates
   */
  static async getAllRoomTypeTemplates(): Promise<RoomTypeTemplate[]> {
    Logger.debug(`📋 [RoomService] Loading all room type templates`);

    try {
      const { data, error } = await supabase
        .from('room_type_templates')
        .select('*')
        .order('room_type');

      if (error) {
        Logger.error(`❌ [RoomService] Failed to load room templates:`, error);
        return [];
      }

      const templates = data.map(item => ({
        id: item.id,
        room_type: item.room_type as RoomType,
        name: item.name,
        icon_name: item.icon_name,
        description: item.description,
        default_width: Number(item.default_width),
        default_height: Number(item.default_height),
        default_wall_height: Number(item.default_wall_height),
        default_ceiling_height: Number(item.default_ceiling_height),
        default_settings: item.default_settings || {}
      }));

      // Cache all templates
      templates.forEach(template => {
        templateCache.set(template.room_type, template);
      });

      Logger.debug(`✅ [RoomService] Loaded ${templates.length} room type templates`);
      return templates;

    } catch (err) {
      Logger.error(`❌ [RoomService] Failed to load room templates:`, err);
      return [];
    }
  }

  /**
   * Get room configuration with fallbacks (replaces DEFAULT_ROOM usage)
   */
  static async getRoomConfiguration(
    roomType: RoomType, 
    customDimensions?: RoomDimensions,
    customWallHeight?: number
  ): Promise<RoomConfiguration> {
    const template = await this.getRoomTypeTemplate(roomType);

    return {
      dimensions: customDimensions || {
        width: template.default_width,
        height: template.default_height
      },
      wall_height: customWallHeight || template.default_wall_height,
      ceiling_height: template.default_ceiling_height,
      settings: template.default_settings
    };
  }

  /**
   * Create new room design with template defaults
   */
  static async createRoomDesign(
    projectId: string,
    roomType: RoomType,
    customName?: string
  ): Promise<any> {
    const template = await this.getRoomTypeTemplate(roomType);
    
    const roomDesign = {
      project_id: projectId,
      room_type: roomType,
      name: customName || template.name,
      room_dimensions: {
        width: template.default_width,
        height: template.default_height
      },
      wall_height: template.default_wall_height,
      ceiling_height: template.default_ceiling_height,
      room_style: {},
      design_elements: [],
      design_settings: template.default_settings
    };

    Logger.debug(`🏗️ [RoomService] Creating new ${roomType} room design:`, roomDesign);

    try {
      const { data, error } = await supabase
        .from('room_designs')
        .insert([roomDesign])
        .select()
        .single();

      if (error) {
        Logger.error(`❌ [RoomService] Failed to create room design:`, error);
        throw error;
      }

      Logger.debug(`✅ [RoomService] Created new room design:`, data);
      return data;

    } catch (err) {
      Logger.error(`❌ [RoomService] Failed to create room design:`, err);
      throw err;
    }
  }

  /**
   * Clear all caches (useful for testing or data refresh)
   */
  static clearCache(): void {
    templateCache.clear();
    Logger.debug('🧹 [RoomService] Cache cleared');
  }

  // =========================================================================
  // PHASE 2: Room Geometry Methods (Complex Room Shapes)
  // =========================================================================

  /**
   * Load all room geometry templates
   * @param activeOnly - Only return active templates (default: true)
   */
  static async getRoomGeometryTemplates(activeOnly = true) {
    try {
      let query = supabase
        .from('room_geometry_templates')
        .select('*')
        .order('sort_order', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        Logger.error('❌ [RoomService] Error loading room geometry templates:', error);
        throw error;
      }

      Logger.debug(`✅ [RoomService] Loaded ${data?.length || 0} geometry templates`);
      return data || [];
    } catch (error) {
      Logger.error('❌ [RoomService] Failed to load room geometry templates:', error);
      return [];
    }
  }

  /**
   * Load a specific geometry template by name
   * @param templateName - Template identifier (e.g., 'l-shape-standard')
   */
  static async getGeometryTemplate(templateName: string) {
    try {
      const { data, error } = await supabase
        .from('room_geometry_templates')
        .select('*')
        .eq('template_name', templateName)
        .single();

      if (error) {
        Logger.error(`❌ [RoomService] Error loading template "${templateName}":`, error);
        throw error;
      }

      Logger.debug(`✅ [RoomService] Loaded geometry template: ${templateName}`);
      return data;
    } catch (error) {
      Logger.error(`❌ [RoomService] Failed to load template "${templateName}":`, error);
      return null;
    }
  }

  /**
   * Get templates by category
   * @param category - Template category ('standard', 'l-shape', 'u-shape', etc.)
   */
  static async getTemplatesByCategory(category: string) {
    try {
      const { data, error } = await supabase
        .from('room_geometry_templates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      Logger.debug(`✅ [RoomService] Loaded ${data?.length || 0} templates for category: ${category}`);
      return data || [];
    } catch (error) {
      Logger.error(`❌ [RoomService] Failed to load templates for category "${category}":`, error);
      return [];
    }
  }

  /**
   * Apply geometry template to a room with optional custom parameters
   * @param roomId - Room design ID
   * @param templateName - Template identifier
   * @param parameters - Optional parameter overrides (e.g., { width: 800, depth: 500 })
   */
  static async applyGeometryTemplate(
    roomId: string,
    templateName: string,
    parameters?: Record<string, number>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Load template
      const template = await this.getGeometryTemplate(templateName);
      if (!template) {
        return { success: false, error: `Template "${templateName}" not found` };
      }

      // 2. Get geometry (with or without parameter application)
      let geometry = template.geometry_definition;

      // 3. Apply parameters if provided
      if (parameters && template.parameter_config) {
        // TODO: Implement parameter application (Phase 2 advanced task)
        // For now, just use default geometry
        Logger.warn('⚠️ [RoomService] Parameter application not yet implemented');
      }

      // 4. Update room
      const { error } = await supabase
        .from('room_designs')
        .update({ room_geometry: geometry })
        .eq('id', roomId);

      if (error) throw error;

      Logger.debug(`✅ [RoomService] Applied geometry template "${templateName}" to room ${roomId}`);
      return { success: true };
    } catch (error: any) {
      Logger.error('❌ [RoomService] Failed to apply geometry template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get room geometry (returns complex geometry or generates simple rectangle)
   * @param roomId - Room design ID
   */
  static async getRoomGeometry(roomId: string) {
    try {
      const { data, error } = await supabase
        .from('room_designs')
        .select('room_geometry, room_dimensions')
        .eq('id', roomId)
        .single();

      if (error) throw error;

      // Return complex geometry if available
      if (data.room_geometry) {
        Logger.debug(`✅ [RoomService] Loaded complex geometry for room ${roomId}`);
        return data.room_geometry;
      }

      // Fallback: Generate simple rectangle from room_dimensions
      if (data.room_dimensions) {
        Logger.debug(`📐 [RoomService] Generating simple rectangle for room ${roomId}`);
        return this.generateSimpleRectangleGeometry(data.room_dimensions);
      }

      Logger.warn(`⚠️ [RoomService] No geometry or dimensions found for room ${roomId}`);
      return null;
    } catch (error) {
      Logger.error(`❌ [RoomService] Failed to load room geometry for ${roomId}:`, error);
      return null;
    }
  }

  /**
   * Generate simple rectangle geometry from room_dimensions (backward compatibility)
   * @private
   */
  private static generateSimpleRectangleGeometry(dimensions: any) {
    const width = dimensions.width || 600;
    const height = dimensions.height || 400;
    const ceilingHeight = dimensions.ceilingHeight || 250;

    return {
      shape_type: 'rectangle',
      bounding_box: {
        min_x: 0,
        min_y: 0,
        max_x: width,
        max_y: height
      },
      floor: {
        type: 'polygon',
        vertices: [
          [0, 0],
          [width, 0],
          [width, height],
          [0, height]
        ],
        elevation: 0
      },
      walls: [
        {
          id: 'wall_north',
          start: [0, 0],
          end: [width, 0],
          height: ceilingHeight,
          type: 'solid'
        },
        {
          id: 'wall_east',
          start: [width, 0],
          end: [width, height],
          height: ceilingHeight,
          type: 'solid'
        },
        {
          id: 'wall_south',
          start: [width, height],
          end: [0, height],
          height: ceilingHeight,
          type: 'solid'
        },
        {
          id: 'wall_west',
          start: [0, height],
          end: [0, 0],
          height: ceilingHeight,
          type: 'solid'
        }
      ],
      ceiling: {
        type: 'flat',
        zones: [
          {
            vertices: [
              [0, 0],
              [width, 0],
              [width, height],
              [0, height]
            ],
            height: ceilingHeight,
            style: 'flat'
          }
        ]
      },
      metadata: {
        total_floor_area: width * height
      }
    };
  }

  /**
   * Clear room geometry (revert to simple rectangle)
   * @param roomId - Room design ID
   */
  static async clearRoomGeometry(roomId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('room_designs')
        .update({ room_geometry: null })
        .eq('id', roomId);

      if (error) throw error;

      Logger.debug(`✅ [RoomService] Cleared geometry for room ${roomId}`);
      return true;
    } catch (error) {
      Logger.error(`❌ [RoomService] Failed to clear room geometry for ${roomId}:`, error);
      return false;
    }
  }
}

export default RoomService;
