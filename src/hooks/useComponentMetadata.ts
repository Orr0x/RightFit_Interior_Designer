import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Component metadata with collision detection layer information
 */
export interface ComponentMetadata {
  component_id: string;
  component_name: string;
  component_type: string;
  category: string | null;

  // Layer-based collision detection fields
  layer_type: string | null;  // 'base', 'wall', 'tall', 'worktop', 'pelmet', 'cornice', etc.
  min_height_cm: number | null;
  max_height_cm: number | null;
  can_overlap_layers: string[] | null;  // Array of layer types this component can overlap
}

/**
 * Hook to fetch component metadata including collision detection layer data
 * from component_3d_models table
 */
export const useComponentMetadata = () => {
  const [metadata, setMetadata] = useState<ComponentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all component metadata
  const fetchMetadata = async () => {
    try {
      setLoading(true);
      console.log('🔄 [useComponentMetadata] Fetching component metadata from component_3d_models...');

      const { data, error } = await supabase
        .from('component_3d_models')
        .select(`
          component_id,
          component_name,
          component_type,
          category,
          layer_type,
          min_height_cm,
          max_height_cm,
          can_overlap_layers
        `);

      if (error) {
        console.error('❌ [useComponentMetadata] Database error:', error);
        throw error;
      }

      console.log(`✅ [useComponentMetadata] Loaded ${data?.length || 0} component metadata records`);

      setMetadata(data || []);
      setError(null);
    } catch (err) {
      console.error('💥 [useComponentMetadata] Fatal error fetching metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch component metadata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Get metadata by component_id (memoized for performance)
  const getComponentMetadata = useMemo(() => {
    return (componentId: string): ComponentMetadata | undefined => {
      // Try exact match first
      let found = metadata.find(m => m.component_id === componentId);

      // 🔧 FALLBACK: If not found, try stripping directional suffixes (-ns, -ew)
      // These variants are just rotational orientations of the same base component
      if (!found && (componentId.endsWith('-ns') || componentId.endsWith('-ew'))) {
        const baseComponentId = componentId.slice(0, -3); // Remove last 3 chars ("-ns" or "-ew")
        found = metadata.find(m => m.component_id === baseComponentId);

        if (found) {
          console.log(`✨ [useComponentMetadata] Fallback: Using metadata from '${baseComponentId}' for variant '${componentId}'`);
        }
      }

      return found;
    };
  }, [metadata]);

  // Get all components of a specific layer type
  const getComponentsByLayerType = useMemo(() => {
    return (layerType: string): ComponentMetadata[] => {
      return metadata.filter(m => m.layer_type === layerType);
    };
  }, [metadata]);

  // Check if two components can overlap based on their layers
  const canComponentsOverlap = useMemo(() => {
    return (componentId1: string, componentId2: string): boolean => {
      const meta1 = metadata.find(m => m.component_id === componentId1);
      const meta2 = metadata.find(m => m.component_id === componentId2);

      if (!meta1 || !meta2) {
        // If metadata missing, default to allowing overlap (permissive fallback)
        console.warn(`⚠️ [useComponentMetadata] Missing metadata for collision check: ${componentId1} or ${componentId2}`);
        return true;
      }

      // Check if component1 can overlap component2's layer
      const component1CanOverlap = meta1.can_overlap_layers?.includes(meta2.layer_type || '') || false;

      // Check if component2 can overlap component1's layer
      const component2CanOverlap = meta2.can_overlap_layers?.includes(meta1.layer_type || '') || false;

      // Allow overlap if either component permits it
      return component1CanOverlap || component2CanOverlap;
    };
  }, [metadata]);

  return {
    metadata,
    loading,
    error,
    refetch: fetchMetadata,
    getComponentMetadata,
    getComponentsByLayerType,
    canComponentsOverlap
  };
};

export default useComponentMetadata;
