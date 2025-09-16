import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoomType } from '@/types/project';

export interface DatabaseComponent {
  id: string;
  component_id: string;
  name: string;
  type: 'cabinet' | 'appliance' | 'counter-top' | 'end-panel' | 'window' | 'door' | 'flooring' | 'toe-kick' | 'cornice' | 'pelmet' | 'wall-unit-end-panel';
  width: number;
  depth: number;
  height: number;
  color: string;
  category: string;
  room_types: string[];
  icon_name: string;
  description: string;
  version: string;
  deprecated: boolean;
  metadata: any;
  tags: string[];
}

// Map icon names back to React components
const getIconComponent = (iconName: string) => {
  // Import icons dynamically based on name
  // This is a simplified version - you'd want a more comprehensive mapping
  const iconMap: Record<string, any> = {
    'Square': () => import('lucide-react').then(m => m.Square),
    'Archive': () => import('lucide-react').then(m => m.Archive),
    'Refrigerator': () => import('lucide-react').then(m => m.Refrigerator),
    'Microwave': () => import('lucide-react').then(m => m.Microwave),
    'Waves': () => import('lucide-react').then(m => m.Waves),
    'Box': () => import('lucide-react').then(m => m.Box),
    'Zap': () => import('lucide-react').then(m => m.Zap),
    'Wind': () => import('lucide-react').then(m => m.Wind),
    'RectangleHorizontal': () => import('lucide-react').then(m => m.RectangleHorizontal),
    'Bed': () => import('lucide-react').then(m => m.Bed),
    'Shirt': () => import('lucide-react').then(m => m.Shirt),
    'Bath': () => import('lucide-react').then(m => m.Bath),
    'Tv': () => import('lucide-react').then(m => m.Tv),
    'Sofa': () => import('lucide-react').then(m => m.Sofa),
    'Grid3X3': () => import('lucide-react').then(m => m.Grid3X3),
    'Home': () => import('lucide-react').then(m => m.Home),
    'DoorOpen': () => import('lucide-react').then(m => m.DoorOpen),
    'DoorClosed': () => import('lucide-react').then(m => m.DoorClosed),
    'Layers': () => import('lucide-react').then(m => m.Layers),
    'Crown': () => import('lucide-react').then(m => m.Crown),
    'PanelLeft': () => import('lucide-react').then(m => m.PanelLeft),
    'PanelRight': () => import('lucide-react').then(m => m.PanelRight),
  };
  
  return iconMap[iconName] || iconMap['Square'];
};

// Convert database component to legacy format for compatibility
export const convertToLegacyComponent = (dbComponent: DatabaseComponent) => ({
  id: dbComponent.component_id,
  name: dbComponent.name,
  type: dbComponent.type,
  width: dbComponent.width,
  depth: dbComponent.depth,
  height: dbComponent.height,
  color: dbComponent.color,
  category: dbComponent.category,
  roomTypes: dbComponent.room_types as RoomType[],
  icon: React.createElement('div', { className: 'h-4 w-4' }), // Placeholder for now
  description: dbComponent.description,
  version: dbComponent.version,
  deprecated: dbComponent.deprecated,
  metadata: dbComponent.metadata,
  tags: dbComponent.tags
});

export const useComponents = () => {
  const [components, setComponents] = useState<DatabaseComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all components with comprehensive debugging
  const fetchComponents = async () => {
    try {
      setLoading(true);
      console.log('🔄 [useComponents] Starting component fetch from database...');
      
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .eq('deprecated', false)
        .order('category')
        .order('name');

      const fetchTime = Date.now() - startTime;
      console.log(`⏱️ [useComponents] Database query completed in ${fetchTime}ms`);

      if (error) {
        console.error('❌ [useComponents] Database error:', error);
        throw error;
      }
      
      const componentCount = data?.length || 0;
      console.log(`✅ [useComponents] Loaded ${componentCount} components from database`);
      
      // Debug wall units specifically (check both possible category formats)
      const wallUnitsLowercase = data?.filter(comp => comp.category === 'wall-units') || [];
      const wallUnitsTitle = data?.filter(comp => comp.category === 'Wall Units') || [];
      const totalWallUnits = wallUnitsLowercase.length + wallUnitsTitle.length;
      
      console.log(`🏠 [useComponents] Wall units found: ${totalWallUnits} (lowercase: ${wallUnitsLowercase.length}, title: ${wallUnitsTitle.length})`);
      if (totalWallUnits === 0) {
        console.warn('⚠️ [useComponents] NO WALL UNITS FOUND IN DATABASE!');
        console.log('🔍 [useComponents] Available categories:', [...new Set(data?.map(comp => comp.category) || [])].sort());
      }
      
      // Debug categories
      const categories = [...new Set(data?.map(comp => comp.category) || [])];
      console.log('📂 [useComponents] Available categories:', categories.sort());
      
      // Debug kitchen components
      const kitchenComponents = data?.filter(comp => comp.room_types?.includes('kitchen')) || [];
      console.log(`🍳 [useComponents] Kitchen components: ${kitchenComponents.length}`);
      
      setComponents(data || []);
      setError(null);
    } catch (err) {
      console.error('💥 [useComponents] Fatal error fetching components:', err);
      console.error('💥 [useComponents] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      });
      setError(err instanceof Error ? err.message : 'Failed to fetch components');
    } finally {
      setLoading(false);
      console.log('🏁 [useComponents] Component fetch completed');
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  // Get components by room type
  const getComponentsByRoomType = useMemo(() => {
    return (roomType: RoomType) => {
      return components.filter(component => 
        component.room_types.includes(roomType)
      );
    };
  }, [components]);

  // Get components by category
  const getComponentsByCategory = useMemo(() => {
    return (category: string, roomType?: RoomType) => {
      let filtered = components.filter(component => 
        component.category === category
      );
      
      if (roomType) {
        filtered = filtered.filter(component => 
          component.room_types.includes(roomType)
        );
      }
      
      return filtered;
    };
  }, [components]);

  // Get categories for room type
  const getCategoriesForRoomType = useMemo(() => {
    return (roomType: RoomType) => {
      const categories = new Set<string>();
      components.forEach(component => {
        if (component.room_types.includes(roomType)) {
          categories.add(component.category);
        }
      });
      return Array.from(categories).sort();
    };
  }, [components]);

  // Get component by ID (for design compatibility)
  const getComponentById = useMemo(() => {
    return (componentId: string, version?: string) => {
      if (version) {
        return components.find(c => 
          c.component_id === componentId && c.version === version
        );
      }
      // Get latest version
      const matching = components.filter(c => c.component_id === componentId);
      return matching.sort((a, b) => b.version.localeCompare(a.version))[0];
    };
  }, [components]);

  // Create new component (DEV+ only)
  const createComponent = async (componentData: Omit<DatabaseComponent, 'id' | 'deprecated' | 'metadata' | 'tags'>) => {
    try {
      const { data, error } = await supabase
        .from('components')
        .insert([{
          ...componentData,
          deprecated: false,
          metadata: {},
          tags: []
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh components
      await fetchComponents();
      return data;
    } catch (err) {
      console.error('Error creating component:', err);
      throw err;
    }
  };

  // Update component (DEV+ only)
  const updateComponent = async (id: string, updates: Partial<DatabaseComponent>) => {
    try {
      const { data, error } = await supabase
        .from('components')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh components
      await fetchComponents();
      return data;
    } catch (err) {
      console.error('Error updating component:', err);
      throw err;
    }
  };

  // Deprecate component (DEV+ only)
  const deprecateComponent = async (id: string, reason: string, replacementId?: string) => {
    try {
      const { data, error } = await supabase
        .from('components')
        .update({
          deprecated: true,
          deprecation_reason: reason,
          replacement_component_id: replacementId
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh components
      await fetchComponents();
      return data;
    } catch (err) {
      console.error('Error deprecating component:', err);
      throw err;
    }
  };

  return {
    components,
    loading,
    error,
    refetch: fetchComponents,
    getComponentsByRoomType,
    getComponentsByCategory,
    getCategoriesForRoomType,
    getComponentById,
    createComponent,
    updateComponent,
    deprecateComponent
  };
};

export default useComponents;
