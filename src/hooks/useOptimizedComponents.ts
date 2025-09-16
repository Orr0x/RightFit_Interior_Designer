/**
 * useOptimizedComponents - Enhanced component loading with intelligent caching
 * Replaces useComponents with performance optimizations
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoomType } from '@/types/project';
import { cacheManager } from '@/services/CacheService';
// Define DatabaseComponent type locally since it may not be in generated types yet
interface DatabaseComponent {
  id: string;
  component_id: string;
  name: string;
  description: string | null;
  type: string;
  category: string;
  width: number;
  height: number;
  depth: number;
  room_types: string[];
  icon_name: string;
  model_url: string | null;
  thumbnail_url: string | null;
  price: number | null;
  deprecated: boolean;
  tags: string[] | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  color?: string; // Optional color property
}

// Enhanced caching for components
const componentCache = cacheManager.getCache<DatabaseComponent[]>('components', {
  ttl: 15 * 60 * 1000, // 15 minutes TTL for components
  maxSize: 10,
  enableBatching: false
});

const categoryCache = cacheManager.getCache<DatabaseComponent[]>('components-by-category', {
  ttl: 15 * 60 * 1000,
  maxSize: 100,
  enableBatching: false
});

const roomTypeCache = cacheManager.getCache<DatabaseComponent[]>('components-by-room-type', {
  ttl: 15 * 60 * 1000,
  maxSize: 50,
  enableBatching: false
});

export const useOptimizedComponents = () => {
  const [components, setComponents] = useState<DatabaseComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Optimized fetch with intelligent caching
  const fetchComponents = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = componentCache.get('all-components');
        if (cached) {
          console.log('⚡ [useOptimizedComponents] Loaded components from cache');
          setComponents(cached);
          setLoading(false);
          return;
        }
      }

      console.log('🔄 [useOptimizedComponents] Fetching components from database...');
      const startTime = Date.now();

      const { data, error: fetchError } = await supabase
        .from('components')
        .select('*')
        .eq('deprecated', false)
        .order('category')
        .order('name');

      const fetchTime = Date.now() - startTime;
      console.log(`⏱️ [useOptimizedComponents] Database query completed in ${fetchTime}ms`);

      if (fetchError) {
        console.error('❌ [useOptimizedComponents] Database error:', fetchError);
        throw fetchError;
      }

      const componentData = data || [];
      console.log(`✅ [useOptimizedComponents] Loaded ${componentData.length} components`);

      // Cache the results
      componentCache.set('all-components', componentData);
      setComponents(componentData);
      setLastFetchTime(Date.now());

      // Pre-warm category and room type caches
      warmCaches(componentData);

      // Debug logging
      logDebugInfo(componentData);

    } catch (err) {
      console.error('💥 [useOptimizedComponents] Fatal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch components');
    } finally {
      setLoading(false);
    }
  }, []);

  // Pre-warm related caches for better performance
  const warmCaches = useCallback((componentData: DatabaseComponent[]) => {
    console.log('🔥 [useOptimizedComponents] Pre-warming category and room type caches');

    // Group by category
    const categoryGroups = new Map<string, DatabaseComponent[]>();
    const roomTypeGroups = new Map<string, DatabaseComponent[]>();

    for (const component of componentData) {
      // Category grouping
      const category = component.category;
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(component);

      // Room type grouping
      for (const roomType of component.room_types || []) {
        const key = `${roomType}`;
        if (!roomTypeGroups.has(key)) {
          roomTypeGroups.set(key, []);
        }
        roomTypeGroups.get(key)!.push(component);

        // Also cache category + room type combinations
        const categoryRoomKey = `${category}-${roomType}`;
        const existing = categoryCache.get(categoryRoomKey) || [];
        if (existing.length === 0) {
          categoryCache.set(categoryRoomKey, [component]);
        }
      }
    }

    // Cache category groups
    for (const [category, items] of categoryGroups) {
      categoryCache.set(category, items);
    }

    // Cache room type groups
    for (const [roomType, items] of roomTypeGroups) {
      roomTypeCache.set(roomType, items);
    }

    console.log(`🔥 [useOptimizedComponents] Pre-warmed ${categoryGroups.size} categories and ${roomTypeGroups.size} room types`);
  }, []);

  // Debug logging function
  const logDebugInfo = useCallback((componentData: DatabaseComponent[]) => {
    // Wall units debugging
    const wallUnitsLowercase = componentData.filter(comp => comp.category === 'wall-units');
    const wallUnitsTitle = componentData.filter(comp => comp.category === 'Wall Units');
    const totalWallUnits = wallUnitsLowercase.length + wallUnitsTitle.length;
    
    console.log(`🏠 [useOptimizedComponents] Wall units: ${totalWallUnits} (lowercase: ${wallUnitsLowercase.length}, title: ${wallUnitsTitle.length})`);
    
    if (totalWallUnits === 0) {
      console.warn('⚠️ [useOptimizedComponents] NO WALL UNITS FOUND!');
      const categories = [...new Set(componentData.map(comp => comp.category))].sort();
      console.log('📂 [useOptimizedComponents] Available categories:', categories);
    }

    // Kitchen components
    const kitchenComponents = componentData.filter(comp => comp.room_types?.includes('kitchen'));
    console.log(`🍳 [useOptimizedComponents] Kitchen components: ${kitchenComponents.length}`);
  }, []);

  // Initial load
  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  // Optimized getters with caching
  const getComponentsByRoomType = useMemo(() => {
    return (roomType: RoomType): DatabaseComponent[] => {
      // Check cache first
      const cached = roomTypeCache.get(roomType);
      if (cached) {
        console.log(`⚡ [useOptimizedComponents] Cache hit for room type: ${roomType}`);
        return cached;
      }

      // Filter and cache
      const filtered = components.filter(component => 
        component.room_types?.includes(roomType)
      );
      roomTypeCache.set(roomType, filtered);
      return filtered;
    };
  }, [components]);

  const getComponentsByCategory = useMemo(() => {
    return (category: string, roomType?: RoomType): DatabaseComponent[] => {
      // Create cache key
      const cacheKey = roomType ? `${category}-${roomType}` : category;
      
      // Check cache first
      const cached = categoryCache.get(cacheKey);
      if (cached) {
        console.log(`⚡ [useOptimizedComponents] Cache hit for category: ${cacheKey}`);
        return cached;
      }

      // Filter and cache
      let filtered = components.filter(component => 
        component.category === category
      );
      
      if (roomType) {
        filtered = filtered.filter(component => 
          component.room_types?.includes(roomType)
        );
      }
      
      categoryCache.set(cacheKey, filtered);
      return filtered;
    };
  }, [components]);

  const getCategoriesForRoomType = useMemo(() => {
    return (roomType: RoomType): string[] => {
      const roomComponents = getComponentsByRoomType(roomType);
      return [...new Set(roomComponents.map(comp => comp.category))].sort();
    };
  }, [getComponentsByRoomType]);

  const getComponentById = useMemo(() => {
    return (id: string): DatabaseComponent | undefined => {
      return components.find(comp => comp.id === id || comp.component_id === id);
    };
  }, [components]);

  // Cache statistics for debugging
  const getCacheStats = useCallback(() => {
    return {
      components: componentCache.getStats(),
      categories: categoryCache.getStats(),
      roomTypes: roomTypeCache.getStats(),
      lastFetch: new Date(lastFetchTime).toISOString()
    };
  }, [lastFetchTime]);

  return {
    components,
    loading,
    error,
    refetch: () => fetchComponents(true),
    getComponentsByRoomType,
    getComponentsByCategory,
    getCategoriesForRoomType,
    getComponentById,
    getCacheStats
  };
};

export default useOptimizedComponents;
