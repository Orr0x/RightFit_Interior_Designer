/**
 * RoomService - Database-driven room configuration and templates
 * Replaces hardcoded ROOM_TYPE_CONFIGS and DEFAULT_ROOM constants
 */

import { supabase } from '@/integrations/supabase/client';
import { RoomType, RoomDimensions } from '@/types/project';

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

    console.log(`🏠 [RoomService] Loading template for room type: ${roomType}`);

    try {
      const { data, error } = await supabase
        .from('room_type_templates')
        .select('*')
        .eq('room_type', roomType)
        .single();

      if (error) {
        console.warn(`⚠️ [RoomService] No template found for ${roomType}, using defaults:`, error);
        // Fallback to reasonable defaults
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
      console.log(`✅ [RoomService] Loaded template for ${roomType}:`, template);
      return template;

    } catch (err) {
      console.error(`❌ [RoomService] Failed to load template for ${roomType}:`, err);
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
    console.log(`📋 [RoomService] Loading all room type templates`);

    try {
      const { data, error } = await supabase
        .from('room_type_templates')
        .select('*')
        .order('room_type');

      if (error) {
        console.error(`❌ [RoomService] Failed to load room templates:`, error);
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

      console.log(`✅ [RoomService] Loaded ${templates.length} room type templates`);
      return templates;

    } catch (err) {
      console.error(`❌ [RoomService] Failed to load room templates:`, err);
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

    console.log(`🏗️ [RoomService] Creating new ${roomType} room design:`, roomDesign);

    try {
      const { data, error } = await supabase
        .from('room_designs')
        .insert([roomDesign])
        .select()
        .single();

      if (error) {
        console.error(`❌ [RoomService] Failed to create room design:`, error);
        throw error;
      }

      console.log(`✅ [RoomService] Created new room design:`, data);
      return data;

    } catch (err) {
      console.error(`❌ [RoomService] Failed to create room design:`, err);
      throw err;
    }
  }

  /**
   * Clear all caches (useful for testing or data refresh)
   */
  static clearCache(): void {
    templateCache.clear();
    console.log('🧹 [RoomService] Cache cleared');
  }
}

export default RoomService;
