import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DesignElement } from '@/types/project';

// Configuration interface - ENHANCES existing logic, doesn't replace it
export interface Model3DConfig {
  id: string;
  component_id?: string; // Links to components table
  
  // Material Configuration (enhances existing hardcoded materials)
  primary_material: 'wood' | 'metal' | 'glass' | 'plastic' | 'fabric' | 'ceramic' | 'stone' | 'composite';
  primary_color: string;
  door_color?: string; // Color for doors/drawer fronts (for visual definition)
  secondary_color?: string;
  wood_finish?: 'oak' | 'pine' | 'walnut' | 'cherry' | 'maple';
  metal_finish?: 'brushed' | 'polished' | 'matte' | 'antique';
  
  // Visual Enhancement (doesn't change geometry)
  roughness: number;
  metalness: number;
  transparency?: number;
  
  // Feature Flags (enable/disable existing features)
  enable_detailed_handles: boolean;
  enable_wood_grain_texture: boolean;
  enable_realistic_lighting: boolean;
  enable_door_detail: boolean;
  
  // Customizable Parameters (within existing logic bounds)
  plinth_height?: number; // Default 0.15, can be customized
  door_gap?: number; // Default 0.05, can be customized
  handle_style?: 'modern' | 'traditional' | 'minimalist' | 'industrial';
  
  // Corner Unit Overrides (ONLY for non-geometric properties)
  corner_door_style?: 'standard' | 'bi-fold' | 'lazy-susan';
  corner_interior_shelving?: boolean;
  
  // Performance Settings
  detail_level: 1 | 2 | 3; // 1=basic, 2=standard, 3=high-detail
  use_lod: boolean; // Level of detail based on camera distance
  
  version: string;
  deprecated: boolean;
}

// Pattern matching for element detection (preserves existing logic)
export interface ElementPattern {
  id: string;
  patterns: {
    id_includes?: string[];
    style_includes?: string[];
    element_type?: string;
  };
  config_overrides: Partial<Model3DConfig>;
}

export const use3DModelConfig = () => {
  const [configs, setConfigs] = useState<Model3DConfig[]>([]);
  const [patterns, setPatterns] = useState<ElementPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch configuration data
  const fetchConfigs = async () => {
    try {
      setLoading(true);
      
      // Fetch base configurations
      const { data: configData, error: configError } = await supabase
        .from('model_3d_config')
        .select('*')
        .eq('deprecated', false);

      if (configError) throw configError;

      // Fetch element patterns
      const { data: patternData, error: patternError } = await supabase
        .from('model_3d_patterns')
        .select('*');

      if (patternError) throw patternError;

      setConfigs(configData || []);
      setPatterns(patternData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching 3D model configs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Get configuration for a specific element (PRESERVES existing detection logic)
  const getConfigForElement = useMemo(() => {
    return (element: DesignElement): Model3DConfig | null => {
      // If database is loading or empty, return default immediately
      if (loading || configs.length === 0) {
        return getDefaultConfig(element.type);
      }

      try {
        // First, try to match by component_id if available
        if (element.componentId) {
          const componentConfig = configs.find(c => c.component_id === element.componentId);
          if (componentConfig) return componentConfig;
        }

        // Fallback: match by patterns (mirrors existing hardcoded logic)
        const matchingPattern = patterns.find(pattern => {
          // Handle case where patterns might be undefined or malformed
          if (!pattern.patterns) return false;
          
          const { id_includes, style_includes, element_type } = pattern.patterns;
          
          // Match element type
          if (element_type && element.type !== element_type) return false;
          
          // Match ID patterns
          if (id_includes && Array.isArray(id_includes)) {
            const idMatches = id_includes.some(pattern => 
              element.id.toLowerCase().includes(pattern.toLowerCase())
            );
            if (idMatches) return true;
          }
          
          // Match style patterns
          if (style_includes && Array.isArray(style_includes) && element.style) {
            const styleMatches = style_includes.some(pattern => 
              element.style!.toLowerCase().includes(pattern.toLowerCase())
            );
            if (styleMatches) return true;
          }
          
          return false;
        });

        if (matchingPattern) {
          // Find base config and apply overrides
          const baseConfig = configs.find(c => c.component_id === null && c.primary_material === 'wood');
          if (baseConfig) {
            return {
              ...baseConfig,
              ...matchingPattern.config_overrides
            };
          }
        }
      } catch (error) {
        console.warn('Error in 3D config lookup, using defaults:', error);
      }

      // Return default configuration if no match or error
      return getDefaultConfig(element.type);
    };
  }, [configs, patterns, loading]);

  // Default configurations (mirrors existing hardcoded defaults)
  const getDefaultConfig = (elementType: string): Model3DConfig => {
    const baseConfig: Model3DConfig = {
      id: 'default',
      primary_material: 'wood',
      primary_color: '#8B4513', // Matches existing cabinetMaterial
      door_color: '#654321', // Matches corner cabinet door color
      roughness: 0.7, // Matches existing hardcoded value
      metalness: 0.1, // Matches existing hardcoded value
      enable_detailed_handles: true,
      enable_wood_grain_texture: true,
      enable_realistic_lighting: true,
      enable_door_detail: true,
      plinth_height: 0.15, // Matches existing hardcoded value
      door_gap: 0.05, // Matches existing hardcoded value
      handle_style: 'modern',
      detail_level: 2,
      use_lod: false,
      version: '1.0.0',
      deprecated: false
    };

    // Element-specific defaults
    switch (elementType) {
      case 'appliance':
        return {
          ...baseConfig,
          primary_material: 'metal',
          primary_color: '#C0C0C0',
          metalness: 0.8,
          roughness: 0.2
        };
      
      case 'counter-top':
        return {
          ...baseConfig,
          primary_material: 'stone',
          primary_color: '#D2B48C',
          roughness: 0.1,
          metalness: 0.0
        };
      
      default:
        return baseConfig;
    }
  };

  // Enhanced detection functions (mirrors existing hardcoded logic)
  const detectCabinetType = useMemo(() => {
    return (element: DesignElement) => {
      return {
        isWallCabinet: element.style?.toLowerCase().includes('wall') || 
                       element.id.includes('wall-cabinet'),
        isCornerCabinet: element.id.includes('corner-cabinet') || 
                         element.style?.toLowerCase().includes('corner'),
        isLarderCornerUnit: element.id.includes('larder-corner-unit'),
        isPanDrawer: element.id.includes('pan-drawers') || 
                     element.style?.toLowerCase().includes('pan drawer'),
        isBedroom: element.id.includes('wardrobe') || 
                   element.id.includes('chest') ||
                   element.id.includes('bedside'),
        isBathroom: element.id.includes('vanity'),
        isMediaUnit: element.id.includes('tv-unit') || 
                     element.id.includes('media'),
        isLarderFridge: element.id.includes('larder-built-in-fridge'),
        isLarderSingleOven: element.id.includes('larder-single-oven'),
        isLarderDoubleOven: element.id.includes('larder-double-oven'),
        isLarderOvenMicrowave: element.id.includes('larder-oven-microwave'),
        isLarderCoffeeMachine: element.id.includes('larder-coffee-machine')
      };
    };
  }, []);

  return {
    configs,
    patterns,
    loading,
    error,
    refetch: fetchConfigs,
    getConfigForElement,
    detectCabinetType,
    getDefaultConfig
  };
};

export default use3DModelConfig;
