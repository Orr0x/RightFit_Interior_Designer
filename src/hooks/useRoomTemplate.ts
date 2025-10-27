/**
 * useRoomTemplate - React hook for database-driven room templates
 * Replaces hardcoded ROOM_TYPE_CONFIGS usage in React components
 */

import { useState, useEffect, useMemo } from 'react';
import { RoomService, RoomTypeTemplate, RoomConfiguration } from '@/services/RoomService';
import { RoomType, RoomDimensions } from '@/types/project';
import { Logger } from '@/utils/Logger';

/**
 * Hook to get room type template from database
 */
export const useRoomTemplate = (roomType: RoomType) => {
  const [template, setTemplate] = useState<RoomTypeTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const templateData = await RoomService.getRoomTypeTemplate(roomType);
        
        if (isMounted) {
          setTemplate(templateData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load room template');
          Logger.error(`❌ [useRoomTemplate] Error loading template for ${roomType}:`, err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (roomType) {
      loadTemplate();
    }

    return () => {
      isMounted = false;
    };
  }, [roomType]);

  // Memoized convenience properties
  const templateData = useMemo(() => {
    if (!template) return null;

    return {
      ...template,
      // Convenience getters that match the old ROOM_TYPE_CONFIGS structure
      defaultDimensions: {
        width: template.default_width,
        height: template.default_height
      },
      defaultWallHeight: template.default_wall_height,
      defaultCeilingHeight: template.default_ceiling_height,
      settings: template.default_settings
    };
  }, [template]);

  return {
    template: templateData,
    loading,
    error,
    // Convenience properties
    defaultDimensions: template ? { width: template.default_width, height: template.default_height } : null,
    defaultWallHeight: template?.default_wall_height || 240,
    defaultCeilingHeight: template?.default_ceiling_height || 250
  };
};

/**
 * Hook to get room configuration with fallbacks (replaces DEFAULT_ROOM usage)
 */
export const useRoomConfiguration = (
  roomType: RoomType,
  customDimensions?: RoomDimensions,
  customWallHeight?: number
) => {
  const [config, setConfig] = useState<RoomConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadConfiguration = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const configData = await RoomService.getRoomConfiguration(
          roomType, 
          customDimensions, 
          customWallHeight
        );
        
        if (isMounted) {
          setConfig(configData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load room configuration');
          Logger.error(`❌ [useRoomConfiguration] Error loading config for ${roomType}:`, err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (roomType) {
      loadConfiguration();
    }

    return () => {
      isMounted = false;
    };
  }, [roomType, JSON.stringify(customDimensions), customWallHeight]);

  return {
    config,
    loading,
    error,
    // Convenience properties
    dimensions: config?.dimensions || { width: 400, height: 300 },
    wallHeight: config?.wall_height || 240,
    ceilingHeight: config?.ceiling_height || 250
  };
};

/**
 * Hook to get all available room type templates
 */
export const useAllRoomTemplates = () => {
  const [templates, setTemplates] = useState<RoomTypeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAllTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const templatesData = await RoomService.getAllRoomTypeTemplates();
        
        if (isMounted) {
          setTemplates(templatesData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load room templates');
          Logger.error(`❌ [useAllRoomTemplates] Error loading templates:`, err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAllTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized room type map for quick lookups
  const roomTypeMap = useMemo(() => {
    return templates.reduce((map, template) => {
      map[template.room_type] = template;
      return map;
    }, {} as Record<RoomType, RoomTypeTemplate>);
  }, [templates]);

  return {
    templates,
    loading,
    error,
    roomTypeMap,
    getTemplate: (roomType: RoomType) => roomTypeMap[roomType] || null
  };
};

export default useRoomTemplate;
