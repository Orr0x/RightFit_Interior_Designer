/**
 * useComponentBehavior - React hook for database-driven component behavior
 * Replaces hardcoded COMPONENT_DATA usage in React components
 */

import { useState, useEffect, useMemo } from 'react';
import { ComponentService, ComponentBehavior } from '@/services/ComponentService';
import { Logger } from '@/utils/Logger';

/**
 * Hook to get component behavior data from database
 */
export const useComponentBehavior = (componentType: string) => {
  const [behavior, setBehavior] = useState<ComponentBehavior | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBehavior = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const behaviorData = await ComponentService.getComponentBehavior(componentType);
        
        if (isMounted) {
          setBehavior(behaviorData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load component behavior');
          Logger.error(`❌ [useComponentBehavior] Error loading behavior for ${componentType}:`, err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (componentType) {
      loadBehavior();
    }

    return () => {
      isMounted = false;
    };
  }, [componentType]);

  // Memoized convenience properties
  const behaviorData = useMemo(() => {
    if (!behavior) return null;

    return {
      ...behavior,
      // Convenience getters that match the old COMPONENT_DATA structure
      mountType: behavior.mount_type,
      hasDirection: behavior.has_direction,
      doorSide: behavior.door_side,
      defaultDepth: behavior.mount_type === 'wall' ? 35 : 60, // Common defaults
      defaultZ: behavior.default_z_position,
      elevationHeight: behavior.elevation_height
    };
  }, [behavior]);

  return {
    behavior: behaviorData,
    loading,
    error,
    // Convenience methods
    isWallMounted: behavior?.mount_type === 'wall',
    isFloorMounted: behavior?.mount_type === 'floor',
    hasDirection: behavior?.has_direction || false,
    defaultZPosition: behavior?.default_z_position || 0
  };
};

/**
 * Hook to get elevation height for a specific component
 */
export const useElevationHeight = (componentId: string, componentType: string) => {
  const [height, setHeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHeight = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const elevationHeight = await ComponentService.getElevationHeight(componentId, componentType);
        
        if (isMounted) {
          setHeight(elevationHeight);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load elevation height');
          Logger.error(`❌ [useElevationHeight] Error loading height for ${componentId}:`, err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (componentId && componentType) {
      loadHeight();
    }

    return () => {
      isMounted = false;
    };
  }, [componentId, componentType]);

  return {
    height,
    loading,
    error
  };
};

/**
 * Hook to get multiple component behaviors at once
 */
export const useComponentBehaviors = (componentTypes: string[]) => {
  const [behaviors, setBehaviors] = useState<Record<string, ComponentBehavior>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBehaviors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const behaviorPromises = componentTypes.map(async (type) => {
          const behavior = await ComponentService.getComponentBehavior(type);
          return [type, behavior] as [string, ComponentBehavior];
        });
        
        const results = await Promise.all(behaviorPromises);
        const behaviorMap = Object.fromEntries(results);
        
        if (isMounted) {
          setBehaviors(behaviorMap);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load component behaviors');
          Logger.error(`❌ [useComponentBehaviors] Error loading behaviors:`, err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (componentTypes.length > 0) {
      loadBehaviors();
    }

    return () => {
      isMounted = false;
    };
  }, [componentTypes.join(',')]); // Re-run if component types change

  return {
    behaviors,
    loading,
    error,
    getBehavior: (type: string) => behaviors[type] || null
  };
};

export default useComponentBehavior;
