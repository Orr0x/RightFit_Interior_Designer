/**
 * Component Position Validator
 *
 * Purpose: Validate and ensure correct Z position and height usage for design elements.
 *          Prevents ambiguous positioning by requiring explicit Z values instead of
 *          type-based defaults.
 *
 * Story: 1.7 - Create ComponentPositionValidator Utility
 * Epic: Epic 1 - Eliminate Circular Dependency Patterns
 *
 * Usage:
 * ```typescript
 * import { ComponentPositionValidator } from '@/utils/ComponentPositionValidator';
 *
 * // Validate Z position
 * const validation = ComponentPositionValidator.validateZPosition(element, roomDimensions);
 * if (!validation.valid) {
 *   console.error('Invalid Z position:', validation.errors);
 * }
 *
 * // Get default Z for element type
 * const defaultZ = ComponentPositionValidator.getDefaultZ(element.type, element.component_id);
 *
 * // Ensure element has valid Z (adds default if missing)
 * const fixedElement = ComponentPositionValidator.ensureValidZ(element);
 * ```
 */

import { DesignElement } from '@/types/project';

/**
 * Validation result for component positioning
 */
export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  suspiciousCases: string[];
}

/**
 * Room dimensions for validation context
 */
export interface ValidationContext {
  width: number;
  height: number; // depth
  ceilingHeight?: number;
}

/**
 * Component Position Validator
 *
 * Validates Z position and height usage for design elements to ensure
 * explicit positioning instead of relying on type-based defaults.
 */
export class ComponentPositionValidator {
  /**
   * Default ceiling height in cm (if not specified)
   */
  private static readonly DEFAULT_CEILING_HEIGHT = 240;

  /**
   * Type-based default Z positions (in cm)
   *
   * These are fallback values when Z is not specified.
   * Best practice: Always set Z explicitly on elements.
   */
  private static readonly TYPE_DEFAULT_Z: Record<string, number> = {
    // Floor level (Z = 0cm)
    'cabinet': 0, // Base cabinets default to floor (wall cabinets override via component_id)
    'appliance': 0,
    'door': 0,
    'flooring': 0,
    'toe-kick': 0,
    'end-panel': 0,

    // Countertop level (Z = 86cm)
    'counter-top': 86,

    // Window level (Z = 90cm)
    'window': 90,

    // Wall cabinet level (Z = 140-200cm)
    'wall-unit-end-panel': 200,
    'cornice': 200,
    'pelmet': 140,

    // Sink level (Z = 65-75cm, varies by type)
    'sink': 75, // Kitchen sink default, butler sinks use 65cm

    // Wall (background, Z = 0cm)
    'wall': 0,
  };

  /**
   * Component ID patterns that indicate wall-mounted elements
   */
  private static readonly WALL_MOUNTED_PATTERNS = [
    'wall-cabinet',
    'corner-wall-cabinet',
    'new-corner-wall-cabinet',
  ];

  /**
   * Validate Z position for a design element
   *
   * Checks for:
   * - Z within room bounds (0 to ceiling height)
   * - Suspicious cases (Z === height, Z negative, Z > ceiling)
   * - Missing Z values (should have explicit Z)
   *
   * @param element - Design element to validate
   * @param context - Room dimensions for bounds checking
   * @returns Validation result with errors, warnings, and suspicious cases
   *
   * @example
   * ```typescript
   * const validation = ComponentPositionValidator.validateZPosition(element, {
   *   width: 400,
   *   height: 600,
   *   ceilingHeight: 240
   * });
   *
   * if (!validation.valid) {
   *   console.error('Validation errors:', validation.errors);
   * }
   *
   * if (validation.suspiciousCases.length > 0) {
   *   console.warn('Suspicious cases:', validation.suspiciousCases);
   * }
   * ```
   */
  static validateZPosition(
    element: DesignElement,
    context: ValidationContext
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suspiciousCases: string[] = [];

    const ceilingHeight = context.ceilingHeight || this.DEFAULT_CEILING_HEIGHT;
    const z = element.z ?? 0;
    const height = element.height;

    // ERROR: Z is negative
    if (z < 0) {
      errors.push(`Z position is negative: ${z}cm (must be >= 0)`);
    }

    // ERROR: Z exceeds ceiling height
    if (z > ceilingHeight) {
      errors.push(
        `Z position (${z}cm) exceeds ceiling height (${ceilingHeight}cm)`
      );
    }

    // ERROR: Z + height exceeds ceiling (component pokes through ceiling)
    if (z + height > ceilingHeight) {
      errors.push(
        `Component extends beyond ceiling: Z(${z}cm) + height(${height}cm) = ${z + height}cm > ${ceilingHeight}cm`
      );
    }

    // SUSPICIOUS: Z equals height (common copy-paste error)
    if (z === height && z > 0) {
      suspiciousCases.push(
        `Z position equals height (${z}cm) - possible copy-paste error? Z is position, height is dimension.`
      );
    }

    // SUSPICIOUS: Z not specified (using default)
    if (element.z === undefined || element.z === null) {
      const defaultZ = this.getDefaultZ(element.type, element.component_id);
      warnings.push(
        `Z position not specified, using type default (${defaultZ}cm). Best practice: set Z explicitly.`
      );
    }

    // SUSPICIOUS: Wall cabinet at floor level (Z = 0)
    if (this.isWallCabinet(element.component_id) && z === 0) {
      suspiciousCases.push(
        `Wall cabinet at Z=0 (floor level) - should typically be at Z=200cm or higher`
      );
    }

    // SUSPICIOUS: Base cabinet at wall height (Z > 100)
    if (element.type === 'cabinet' && !this.isWallCabinet(element.component_id) && z > 100) {
      suspiciousCases.push(
        `Base cabinet at Z=${z}cm (wall height) - should typically be at Z=0cm (floor level)`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suspiciousCases,
    };
  }

  /**
   * Get default Z position for element type
   *
   * Returns type-based default Z position in cm. This is a fallback
   * for when Z is not explicitly set.
   *
   * **Best Practice**: Always set Z explicitly instead of relying on defaults.
   *
   * @param type - Element type
   * @param componentId - Component ID (for wall cabinet detection)
   * @returns Default Z position in cm
   *
   * @example
   * ```typescript
   * // Floor-level component
   * const z1 = ComponentPositionValidator.getDefaultZ('appliance', 'REF-001');
   * // → 0cm
   *
   * // Countertop
   * const z2 = ComponentPositionValidator.getDefaultZ('counter-top', 'CT-001');
   * // → 86cm
   *
   * // Wall cabinet
   * const z3 = ComponentPositionValidator.getDefaultZ('cabinet', 'wall-cabinet-60x90');
   * // → 200cm (detected as wall-mounted)
   * ```
   */
  static getDefaultZ(type: DesignElement['type'], componentId?: string): number {
    // Special case: Wall cabinets should be at wall height (200cm)
    if (type === 'cabinet' && componentId && this.isWallCabinet(componentId)) {
      return 200;
    }

    // Special case: Butler sinks are lower (65cm) vs kitchen sinks (75cm)
    if (type === 'sink' && componentId?.includes('butler')) {
      return 65;
    }

    // Use type-based default
    return this.TYPE_DEFAULT_Z[type] ?? 0;
  }

  /**
   * Ensure element has valid Z position
   *
   * If Z is undefined/null, sets it to the type-based default.
   * Does NOT modify elements that already have Z set (even if suspicious).
   *
   * **Note**: This mutates the element. Clone first if immutability is needed.
   *
   * @param element - Design element (will be mutated)
   * @returns The same element with Z ensured
   *
   * @example
   * ```typescript
   * const element = {
   *   id: '1',
   *   component_id: 'BC-60',
   *   type: 'cabinet',
   *   x: 100,
   *   y: 0,
   *   // z: undefined  ← missing
   *   width: 60,
   *   depth: 60,
   *   height: 90,
   *   rotation: 0,
   *   zIndex: 2
   * };
   *
   * ComponentPositionValidator.ensureValidZ(element);
   * // element.z is now 0 (floor level for base cabinet)
   * ```
   */
  static ensureValidZ(element: DesignElement): DesignElement {
    if (element.z === undefined || element.z === null) {
      element.z = this.getDefaultZ(element.type, element.component_id);
    }
    return element;
  }

  /**
   * Check if component ID indicates a wall-mounted cabinet
   *
   * @param componentId - Component ID to check
   * @returns True if component is wall-mounted
   */
  private static isWallCabinet(componentId?: string): boolean {
    if (!componentId) return false;
    return this.WALL_MOUNTED_PATTERNS.some((pattern) =>
      componentId.includes(pattern)
    );
  }

  /**
   * Validate all elements in a design
   *
   * Runs validation on all elements and returns aggregate results.
   *
   * @param elements - Array of design elements
   * @param context - Room dimensions
   * @returns Map of element ID to validation result
   *
   * @example
   * ```typescript
   * const results = ComponentPositionValidator.validateAll(
   *   design.design_elements,
   *   design.room_dimensions
   * );
   *
   * // Find all invalid elements
   * const invalid = Array.from(results.entries())
   *   .filter(([_, result]) => !result.valid)
   *   .map(([id, result]) => ({ id, errors: result.errors }));
   *
   * if (invalid.length > 0) {
   *   console.error('Invalid elements:', invalid);
   * }
   * ```
   */
  static validateAll(
    elements: DesignElement[],
    context: ValidationContext
  ): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();

    for (const element of elements) {
      results.set(element.id, this.validateZPosition(element, context));
    }

    return results;
  }

  /**
   * Get summary statistics for validation results
   *
   * @param results - Map of validation results
   * @returns Summary statistics
   */
  static getValidationSummary(results: Map<string, ValidationResult>): {
    total: number;
    valid: number;
    invalid: number;
    withWarnings: number;
    withSuspiciousCases: number;
  } {
    const summary = {
      total: results.size,
      valid: 0,
      invalid: 0,
      withWarnings: 0,
      withSuspiciousCases: 0,
    };

    for (const result of results.values()) {
      if (result.valid) {
        summary.valid++;
      } else {
        summary.invalid++;
      }

      if (result.warnings.length > 0) {
        summary.withWarnings++;
      }

      if (result.suspiciousCases.length > 0) {
        summary.withSuspiciousCases++;
      }
    }

    return summary;
  }
}
