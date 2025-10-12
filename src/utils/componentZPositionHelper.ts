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
 * Priority order:
 * 1. Database default_z_position (if provided and non-zero)
 * 2. Type-based rules (hardcoded fallback)
 * 3. Default to 0 (floor-mounted)
 */

export interface ZPositionCalculation {
  z: number;
  source: 'database' | 'type-rule' | 'default';
  reason: string;
}

/**
 * Calculate default Z-position for a component based on its type
 *
 * @param componentType - Component type (cabinet, cornice, pelmet, etc.)
 * @param componentId - Component ID for special case detection (wall-cabinet, etc.)
 * @param databaseZPosition - Optional Z-position from database (takes priority if provided)
 * @returns Z-position calculation result
 */
export function getDefaultZPosition(
  componentType: string,
  componentId: string,
  databaseZPosition?: number | null
): ZPositionCalculation {
  // Priority 1: Use database value if available and non-zero
  if (databaseZPosition !== undefined && databaseZPosition !== null && databaseZPosition !== 0) {
    return {
      z: databaseZPosition,
      source: 'database',
      reason: `Database value: ${databaseZPosition}cm`
    };
  }
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
 *
 * @param componentType - Component type
 * @param componentId - Component ID
 * @param databaseZPosition - Optional Z-position from database
 * @returns Z-position value in centimeters
 */
export function getDefaultZ(
  componentType: string,
  componentId: string,
  databaseZPosition?: number | null
): number {
  return getDefaultZPosition(componentType, componentId, databaseZPosition).z;
}
