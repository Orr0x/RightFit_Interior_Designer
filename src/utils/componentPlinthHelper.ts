/**
 * Component Plinth/Toe-Kick Helper
 *
 * Centralized logic for component plinth (toe-kick) heights.
 * Plinth is the recessed base under floor-mounted cabinets that provides
 * toe space. Typically 10-15cm tall for base cabinets, 0cm for wall cabinets.
 *
 * Terminology:
 * - "Plinth" (UK/Europe) = "Toe-kick" (US) - same thing!
 *
 * Priority order:
 * 1. Database plinth_height (if provided and non-negative)
 * 2. Type-based rules (fallback)
 * 3. Default to 0 (no plinth)
 */

export interface PlinthCalculation {
  height: number; // cm
  source: 'database' | 'type-rule' | 'default';
  reason: string;
}

/**
 * Calculate plinth height for a component
 *
 * @param componentType - Component type (cabinet, appliance, etc.)
 * @param componentId - Component ID for pattern matching
 * @param databasePlinthHeight - Optional plinth height from database (takes priority)
 * @param defaultZPosition - Z-position helps determine if wall-mounted (0 plinth)
 * @returns Plinth height calculation result
 */
export function getPlinthHeight(
  componentType: string,
  componentId: string,
  databasePlinthHeight?: number | null,
  defaultZPosition?: number
): PlinthCalculation {
  // Priority 1: Use database value if available and non-negative
  if (databasePlinthHeight !== undefined && databasePlinthHeight !== null && databasePlinthHeight >= 0) {
    return {
      height: databasePlinthHeight,
      source: 'database',
      reason: `Database value: ${databasePlinthHeight}cm`
    };
  }

  // Priority 2: Type-based rules (fallback)

  // Wall-mounted components (z > 0) have no plinth
  if (defaultZPosition !== undefined && defaultZPosition > 0) {
    return {
      height: 0,
      source: 'type-rule',
      reason: 'Wall-mounted component (no plinth)'
    };
  }

  // Wall cabinets explicitly have no plinth
  if (componentType === 'cabinet' && componentId.includes('wall-cabinet')) {
    return {
      height: 0,
      source: 'type-rule',
      reason: 'Wall cabinet (no plinth)'
    };
  }

  // Base cabinets standard plinth
  if (componentType === 'cabinet') {
    return {
      height: 10,
      source: 'type-rule',
      reason: 'Base cabinet standard plinth (10cm)'
    };
  }

  // Appliances typically have no plinth (built-in or freestanding)
  if (componentType === 'appliance') {
    return {
      height: 0,
      source: 'type-rule',
      reason: 'Appliance (integrated or freestanding, no plinth)'
    };
  }

  // Cornice, pelmet, windows - no plinth (wall-mounted)
  if (['cornice', 'pelmet', 'window', 'end-panel', 'wall-unit-end-panel'].includes(componentType)) {
    return {
      height: 0,
      source: 'type-rule',
      reason: 'Wall-mounted component (no plinth)'
    };
  }

  // Counter-tops - no plinth (sits on top of cabinets)
  if (componentType === 'counter-top') {
    return {
      height: 0,
      source: 'type-rule',
      reason: 'Counter-top (sits on cabinets, no own plinth)'
    };
  }

  // Sinks - no plinth (integrated into counter/cabinet)
  if (componentType === 'sink') {
    return {
      height: 0,
      source: 'type-rule',
      reason: 'Sink (integrated, no own plinth)'
    };
  }

  // All other types default to no plinth
  return {
    height: 0,
    source: 'default',
    reason: 'Default: no plinth for this component type'
  };
}

/**
 * Simple version that just returns the height value
 *
 * @param componentType - Component type
 * @param componentId - Component ID
 * @param databasePlinthHeight - Optional plinth height from database
 * @param defaultZPosition - Optional Z-position (helps determine wall-mounted)
 * @returns Plinth height in centimeters
 */
export function getPlinthHeightValue(
  componentType: string,
  componentId: string,
  databasePlinthHeight?: number | null,
  defaultZPosition?: number
): number {
  return getPlinthHeight(componentType, componentId, databasePlinthHeight, defaultZPosition).height;
}

/**
 * Convert plinth height from centimeters to meters (for 3D rendering)
 *
 * @param heightCm - Height in centimeters
 * @returns Height in meters
 */
export function plinthHeightToMeters(heightCm: number): number {
  return heightCm / 100;
}

/**
 * Check if component should have a plinth
 *
 * @param componentType - Component type
 * @param defaultZPosition - Z-position (wall-mounted if > 0)
 * @returns True if component should have plinth
 */
export function shouldHavePlinth(componentType: string, defaultZPosition?: number): boolean {
  // Wall-mounted components don't have plinths
  if (defaultZPosition !== undefined && defaultZPosition > 0) {
    return false;
  }

  // Only base cabinets have plinths by default
  return componentType === 'cabinet';
}
