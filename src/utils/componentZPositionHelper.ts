/**
 * Component Z-Position Helper
 *
 * Centralized logic for calculating default Z-position (height off floor)
 * for components based on their type.
 *
 * This replaces duplicate hardcoded rules in 3 locations:
 * - CompactComponentSidebar.tsx (handleMobileClickToAdd)
 * - CompactComponentSidebar.tsx (handleComponentSelect)
 * - DesignCanvas2D.tsx (handleDrop)
 *
 * Future: Will read from database default_z_position column with fallback to these rules
 */

export interface ZPositionCalculation {
  z: number;
  source: 'type-rule' | 'database' | 'default';
  reason: string;
}

/**
 * Calculate default Z-position for a component based on its type
 *
 * @param componentType - Component type (cabinet, cornice, pelmet, etc.)
 * @param componentId - Component ID for special case detection (wall-cabinet, etc.)
 * @returns Z-position calculation result
 */
export function getDefaultZPosition(
  componentType: string,
  componentId: string
): ZPositionCalculation {
  // Check component type with explicit rules
  if (componentType === 'cornice') {
    return {
      z: 200,
      source: 'type-rule',
      reason: 'Cornice: top of wall units at 200cm'
    };
  }

  if (componentType === 'pelmet') {
    return {
      z: 140,
      source: 'type-rule',
      reason: 'Pelmet: bottom of wall units at 140cm'
    };
  }

  if (componentType === 'counter-top') {
    return {
      z: 90,
      source: 'type-rule',
      reason: 'Counter-top: standard height 90cm'
    };
  }

  if (componentType === 'wall-unit-end-panel') {
    return {
      z: 200,
      source: 'type-rule',
      reason: 'Wall unit end panel: top of wall units at 200cm'
    };
  }

  if (componentType === 'window') {
    return {
      z: 90,
      source: 'type-rule',
      reason: 'Window: typical sill height 90cm'
    };
  }

  // Special case: wall cabinets (detected by ID)
  if (componentType === 'cabinet' && componentId.includes('wall-cabinet')) {
    return {
      z: 140,
      source: 'type-rule',
      reason: 'Wall cabinet: mounted at 140cm above floor'
    };
  }

  // Default: floor-mounted component
  return {
    z: 0,
    source: 'default',
    reason: 'Floor-mounted component (default)'
  };
}

/**
 * Simple version that just returns the Z value (for backward compatibility)
 */
export function getDefaultZ(componentType: string, componentId: string): number {
  return getDefaultZPosition(componentType, componentId).z;
}
