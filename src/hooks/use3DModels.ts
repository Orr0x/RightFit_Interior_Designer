import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DesignElement } from '@/types/project';

// 3D Model interfaces matching database schema
export interface Model3D {
  id: string;
  component_id: string;
  model_type: 'cabinet' | 'appliance' | 'counter-top' | 'end-panel' | 'window' | 'door' | 'flooring' | 'toe-kick' | 'cornice' | 'pelmet' | 'wall-unit-end-panel' | 'furniture';
  geometry_type: 'box' | 'cylinder' | 'complex' | 'composite';
  primary_material: 'wood' | 'metal' | 'glass' | 'plastic' | 'fabric' | 'ceramic' | 'stone' | 'composite';
  secondary_material?: string;
  primary_color: string;
  secondary_color?: string;
  has_doors: boolean;
  has_drawers: boolean;
  has_handles: boolean;
  has_legs: boolean;
  default_y_position: number;
  wall_mounted: boolean;
  special_features: Record<string, any>;
  detail_level: number;
  version: string;
  deprecated: boolean;
}

export interface Model3DVariant {
  id: string;
  model_3d_id: string;
  variant_key: string;
  variant_name: string;
  geometry_overrides: Record<string, any>;
  material_overrides: Record<string, any>;
  feature_overrides: Record<string, any>;
  id_pattern: string[];
  style_pattern: string[];
}

export interface Appliance3DType {
  id: string;
  model_3d_id: string;
  appliance_category: 'refrigerator' | 'dishwasher' | 'washing-machine' | 'tumble-dryer' | 'oven' | 'toilet' | 'shower' | 'bathtub' | 'bed' | 'sofa' | 'chair' | 'table' | 'tv' | 'generic';
  has_display: boolean;
  has_controls: boolean;
  has_glass_door: boolean;
  energy_rating?: string;
  default_colors: Record<string, any>;
}

export interface Furniture3DModel {
  id: string;
  furniture_id: string;
  name: string;
  type: string;
  width: number;
  depth: number;
  height: number;
  color: string;
  category: string;
  room_types: string[];
  icon_name: string;
  description: string;
  model_3d_id?: string;
  version: string;
  deprecated: boolean;
}

// Enhanced 3D model data with all related information
export interface Enhanced3DModel extends Model3D {
  variants: Model3DVariant[];
  appliance_type?: Appliance3DType;
}

export const use3DModels = () => {
  const [models, setModels] = useState<Enhanced3DModel[]>([]);
  const [furniture, setFurniture] = useState<Furniture3DModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all 3D models with related data
  const fetchModels = async () => {
    try {
      setLoading(true);

      // Fetch main 3D models
      const { data: modelsData, error: modelsError } = await supabase
        .from('model_3d')
        .select('*')
        .eq('deprecated', false)
        .order('version', { ascending: false });

      if (modelsError) throw modelsError;

      // Fetch variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('model_3d_variants')
        .select('*');

      if (variantsError) throw variantsError;

      // Fetch appliance types
      const { data: appliancesData, error: appliancesError } = await supabase
        .from('appliance_3d_types')
        .select('*');

      if (appliancesError) throw appliancesError;

      // Fetch furniture models
      const { data: furnitureData, error: furnitureError } = await supabase
        .from('furniture_3d_models')
        .select('*')
        .eq('deprecated', false)
        .order('category')
        .order('name');

      if (furnitureError) throw furnitureError;

      // Combine data
      const enhancedModels: Enhanced3DModel[] = (modelsData || []).map(model => ({
        ...model,
        variants: (variantsData || []).filter(v => v.model_3d_id === model.id),
        appliance_type: (appliancesData || []).find(a => a.model_3d_id === model.id)
      }));

      setModels(enhancedModels);
      setFurniture(furnitureData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching 3D models:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch 3D models');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Get 3D model for a specific component
  const getModelForComponent = useMemo(() => {
    return (componentId: string): Enhanced3DModel | null => {
      return models.find(model => model.component_id === componentId) || null;
    };
  }, [models]);

  // Get best matching variant for an element
  const getVariantForElement = useMemo(() => {
    return (element: DesignElement, model: Enhanced3DModel): Model3DVariant | null => {
      if (!model.variants.length) return null;

      // Find variant that matches element patterns
      const matchingVariant = model.variants.find(variant => {
        // Check ID patterns
        const idMatches = variant.id_pattern.some(pattern => {
          if (pattern.includes('*') || pattern.includes('?')) {
            // Convert simple wildcards to regex
            const regexPattern = pattern
              .replace(/\*/g, '.*')
              .replace(/\?/g, '.');
            return new RegExp(regexPattern, 'i').test(element.id);
          }
          return element.id.toLowerCase().includes(pattern.toLowerCase());
        });

        // Check style patterns
        const styleMatches = element.style ? variant.style_pattern.some(pattern => {
          if (pattern.includes('*') || pattern.includes('?')) {
            const regexPattern = pattern
              .replace(/\*/g, '.*')
              .replace(/\?/g, '.');
            return new RegExp(regexPattern, 'i').test(element.style || '');
          }
          return (element.style || '').toLowerCase().includes(pattern.toLowerCase());
        }) : false;

        return idMatches || styleMatches;
      });

      return matchingVariant || null;
    };
  }, []);

  // Get appliance category from element
  const getApplianceCategory = useMemo(() => {
    return (element: DesignElement): string => {
      const id = element.id.toLowerCase();
      
      if (id.includes('refrigerator')) return 'refrigerator';
      if (id.includes('dishwasher')) return 'dishwasher';
      if (id.includes('washing-machine')) return 'washing-machine';
      if (id.includes('tumble-dryer')) return 'tumble-dryer';
      if (id.includes('oven')) return 'oven';
      if (id.includes('toilet')) return 'toilet';
      if (id.includes('shower')) return 'shower';
      if (id.includes('bathtub')) return 'bathtub';
      if (id.includes('bed')) return 'bed';
      if (id.includes('sofa')) return 'sofa';
      if (id.includes('chair')) return 'chair';
      if (id.includes('table')) return 'table';
      if (id.includes('tv')) return 'tv';
      
      return 'generic';
    };
  }, []);

  // Get complete 3D model data for rendering
  const getModelDataForElement = useMemo(() => {
    return (element: DesignElement) => {
      // First try to find by component ID if available
      if (element.componentId) {
        const model = getModelForComponent(element.componentId);
        if (model) {
          const variant = getVariantForElement(element, model);
          return { model, variant, appliance_type: model.appliance_type };
        }
      }

      // Fallback: try to match by element type and patterns
      const matchingModel = models.find(model => {
        // Match by type
        if (model.model_type !== element.type) return false;
        
        // Check if any variant matches
        return model.variants.some(variant => {
          return variant.id_pattern.some(pattern => 
            element.id.toLowerCase().includes(pattern.toLowerCase())
          );
        });
      });

      if (matchingModel) {
        const variant = getVariantForElement(element, matchingModel);
        return { model: matchingModel, variant, appliance_type: matchingModel.appliance_type };
      }

      return null;
    };
  }, [models, getModelForComponent, getVariantForElement]);

  // Get furniture models by category
  const getFurnitureByCategory = useMemo(() => {
    return (category: string) => {
      return furniture.filter(item => item.category === category);
    };
  }, [furniture]);

  // Get furniture models by room type
  const getFurnitureByRoomType = useMemo(() => {
    return (roomType: string) => {
      return furniture.filter(item => item.room_types.includes(roomType));
    };
  }, [furniture]);

  return {
    models,
    furniture,
    loading,
    error,
    refetch: fetchModels,
    
    // Model utilities
    getModelForComponent,
    getVariantForElement,
    getApplianceCategory,
    getModelDataForElement,
    
    // Furniture utilities
    getFurnitureByCategory,
    getFurnitureByRoomType,
  };
};

export default use3DModels;
