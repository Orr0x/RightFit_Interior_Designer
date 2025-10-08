/**
 * Component ID Mapper
 *
 * Purpose: Centralized mapping logic for component IDs to 3D model IDs
 *
 * This utility maps component IDs (from the components table and user designs)
 * to the standardized 3D model component_ids in the component_3d_models table.
 *
 * Usage:
 * ```typescript
 * import { mapComponentIdToModelId } from '@/utils/ComponentIDMapper';
 *
 * const modelId = mapComponentIdToModelId('l-shaped-test-cabinet-1234567', 90);
 * // Returns: 'l-shaped-test-cabinet-90'
 * ```
 */

export interface ComponentIDMapping {
  /**
   * Pattern to match against component ID
   * Can be a string (exact match) or regex pattern
   */
  pattern: string | RegExp;

  /**
   * Function to generate the 3D model component_id
   * @param elementId - The element ID from the design
   * @param width - Component width in cm
   * @param height - Component height in cm
   * @param depth - Component depth in cm
   * @returns The component_id to look up in component_3d_models table
   */
  mapper: (elementId: string, width: number, height?: number, depth?: number) => string;

  /**
   * Description of this mapping rule
   */
  description: string;

  /**
   * Priority for matching (higher = checked first)
   * Used when multiple patterns could match
   */
  priority?: number;
}

/**
 * Component ID Mapping Rules
 *
 * Order matters! More specific patterns should come first.
 * Patterns are checked in priority order (highest first), then array order.
 */
export const COMPONENT_ID_MAPPINGS: ComponentIDMapping[] = [
  // =====================================================================
  // P0: Corner Cabinets (L-shaped)
  // =====================================================================

  {
    pattern: /corner-wall-cabinet|new-corner-wall-cabinet/i,
    mapper: (elementId, width) => `new-corner-wall-cabinet-${width}`,
    description: 'Corner wall cabinets (60cm, 90cm)',
    priority: 100,
  },

  {
    pattern: /corner-cabinet|corner-base-cabinet|l-shaped-test-cabinet/i,
    mapper: (elementId, width) => `l-shaped-test-cabinet-${width}`,
    description: 'Corner base cabinets / L-shaped test cabinet (60cm, 90cm)',
    priority: 100,
  },

  {
    pattern: /larder-corner-unit/i,
    mapper: (elementId, width) => `larder-corner-unit-${width}`,
    description: 'Larder corner units (90cm)',
    priority: 100,
  },

  // =====================================================================
  // P1: Standard Cabinets (Base & Wall)
  // =====================================================================

  {
    pattern: /^base-cabinet/i,
    mapper: (elementId, width) => `base-cabinet-${width}`,
    description: 'Standard base cabinets (40, 50, 60, 80, 100cm)',
    priority: 50,
  },

  {
    pattern: /^wall-cabinet/i,
    mapper: (elementId, width) => `wall-cabinet-${width}`,
    description: 'Standard wall cabinets (30, 40, 50, 60, 80cm)',
    priority: 50,
  },

  // =====================================================================
  // P2: Tall Units & Larders
  // =====================================================================

  {
    pattern: /tall-unit|larder/i,
    mapper: (elementId, width) => `tall-unit-${width}`,
    description: 'Tall units and larders (60cm, 80cm)',
    priority: 40,
  },

  {
    pattern: /oven-housing/i,
    mapper: (elementId, width) => `oven-housing-${width}`,
    description: 'Oven housing units (60cm)',
    priority: 40,
  },

  // =====================================================================
  // P2: Appliances
  // =====================================================================

  {
    pattern: /^oven/i,
    mapper: (elementId, width) => `oven-${width}`,
    description: 'Ovens (60cm)',
    priority: 30,
  },

  {
    pattern: /dishwasher/i,
    mapper: (elementId, width) => `dishwasher-${width}`,
    description: 'Dishwashers (60cm)',
    priority: 30,
  },

  {
    pattern: /fridge|refrigerator/i,
    mapper: (elementId, width) => `fridge-${width}`,
    description: 'Fridges (60cm, 90cm)',
    priority: 30,
  },

  // =====================================================================
  // P3: Sinks & Counter-tops
  // =====================================================================

  {
    pattern: /sink/i,
    mapper: (elementId, width) => `sink-${width}`,
    description: 'Kitchen sinks (various sizes)',
    priority: 20,
  },

  {
    pattern: /counter-top|worktop/i,
    mapper: (elementId, width) => `counter-top-${width}`,
    description: 'Counter-tops and worktops',
    priority: 20,
  },

  // =====================================================================
  // P4: Finishing (Cornice, Pelmet, End Panels)
  // =====================================================================

  {
    pattern: /cornice/i,
    mapper: (elementId, width) => `cornice-${width}`,
    description: 'Cornice finishing',
    priority: 10,
  },

  {
    pattern: /pelmet/i,
    mapper: (elementId, width) => `pelmet-${width}`,
    description: 'Pelmet finishing',
    priority: 10,
  },

  {
    pattern: /end-panel/i,
    mapper: (elementId, width) => `end-panel-${width}`,
    description: 'End panels',
    priority: 10,
  },

  // =====================================================================
  // Default: No mapping (fallback to hardcoded or return original ID)
  // =====================================================================
];

/**
 * Map a component ID to its 3D model component_id
 *
 * @param elementId - The element ID from the design (e.g., 'l-shaped-test-cabinet-1234567')
 * @param width - Component width in cm
 * @param height - Component height in cm (optional)
 * @param depth - Component depth in cm (optional)
 * @returns The component_id to look up in component_3d_models table, or null if no mapping found
 *
 * @example
 * mapComponentIdToModelId('l-shaped-test-cabinet-1234567', 90)
 * // Returns: 'l-shaped-test-cabinet-90'
 *
 * @example
 * mapComponentIdToModelId('new-corner-wall-cabinet-7654321', 60)
 * // Returns: 'new-corner-wall-cabinet-60'
 *
 * @example
 * mapComponentIdToModelId('base-cabinet-9876543', 80)
 * // Returns: 'base-cabinet-80'
 */
export function mapComponentIdToModelId(
  elementId: string,
  width: number,
  height?: number,
  depth?: number
): string | null {
  // Sort mappings by priority (highest first)
  const sortedMappings = [...COMPONENT_ID_MAPPINGS].sort((a, b) => {
    const priorityA = a.priority ?? 0;
    const priorityB = b.priority ?? 0;
    return priorityB - priorityA;
  });

  // Find first matching mapping
  for (const mapping of sortedMappings) {
    let isMatch = false;

    if (typeof mapping.pattern === 'string') {
      // Exact string match (case-insensitive)
      isMatch = elementId.toLowerCase().includes(mapping.pattern.toLowerCase());
    } else {
      // RegExp match
      isMatch = mapping.pattern.test(elementId);
    }

    if (isMatch) {
      try {
        const modelId = mapping.mapper(elementId, width, height, depth);
        console.log(`[ComponentIDMapper] Mapped '${elementId}' (${width}cm) -> '${modelId}' using: ${mapping.description}`);
        return modelId;
      } catch (error) {
        console.error(`[ComponentIDMapper] Error in mapper for '${elementId}':`, error);
        continue; // Try next mapping
      }
    }
  }

  // No mapping found
  console.warn(`[ComponentIDMapper] No mapping found for '${elementId}' (${width}cm). Returning null for hardcoded fallback.`);
  return null;
}

/**
 * Get all available mappings for debugging
 *
 * @returns Array of all component ID mappings with their descriptions
 */
export function getAvailableMappings(): Array<{
  pattern: string;
  description: string;
  priority: number;
}> {
  return COMPONENT_ID_MAPPINGS.map(mapping => ({
    pattern: mapping.pattern.toString(),
    description: mapping.description,
    priority: mapping.priority ?? 0,
  })).sort((a, b) => b.priority - a.priority);
}

/**
 * Test a component ID against all mappings
 * Useful for debugging mapping issues
 *
 * @param elementId - The element ID to test
 * @param width - Component width
 * @returns Array of matching mappings with their results
 */
export function testComponentIdMapping(
  elementId: string,
  width: number
): Array<{
  pattern: string;
  description: string;
  matched: boolean;
  result: string | null;
}> {
  return COMPONENT_ID_MAPPINGS.map(mapping => {
    let matched = false;
    let result: string | null = null;

    if (typeof mapping.pattern === 'string') {
      matched = elementId.toLowerCase().includes(mapping.pattern.toLowerCase());
    } else {
      matched = mapping.pattern.test(elementId);
    }

    if (matched) {
      try {
        result = mapping.mapper(elementId, width);
      } catch (error) {
        result = null;
      }
    }

    return {
      pattern: mapping.pattern.toString(),
      description: mapping.description,
      matched,
      result,
    };
  });
}
