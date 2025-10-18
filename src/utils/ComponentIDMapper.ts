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
    pattern: /corner-cabinet|corner-base-cabinet/i,
    mapper: (elementId, width) => `corner-cabinet`,
    description: 'Corner base cabinet (L-shaped, 90cm)',
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
    pattern: /base-cabinet/i,
    mapper: (elementId, width) => `base-cabinet-${width}`,
    description: 'Standard base cabinets (30, 40, 50, 60, 80, 100cm)',
    priority: 50,
  },

  {
    pattern: /wall-cabinet/i,
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
    pattern: /oven/i,
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
  // Multi-Room: Bedroom Components
  // =====================================================================

  // Beds - size-based (specific types first, then generic)
  {
    pattern: /superking-bed/i,
    mapper: (elementId, width) => `superking-bed-180`,
    description: 'Super King Bed 180cm',
    priority: 32,
  },

  {
    pattern: /king-bed/i,
    mapper: (elementId, width) => `king-bed-150`,
    description: 'King Bed 150cm',
    priority: 31,
  },

  {
    pattern: /double-bed/i,
    mapper: (elementId, width) => `double-bed-140`,
    description: 'Double Bed 140cm',
    priority: 30,
  },

  {
    pattern: /single-bed/i,
    mapper: (elementId, width) => `single-bed-90`,
    description: 'Single Bed 90cm',
    priority: 29,
  },

  {
    pattern: /^bed-|bed$/i,
    mapper: (elementId, width) => {
      if (width >= 180) return 'superking-bed-180';
      if (width >= 150) return 'king-bed-150';
      if (width >= 140) return 'double-bed-140';
      if (width >= 90) return 'single-bed-90';
      return 'bed-single';
    },
    description: 'Beds - width-based (90-180cm)',
    priority: 28,
  },

  // Wardrobes - width-based
  {
    pattern: /wardrobe/i,
    mapper: (elementId, width) => {
      if (elementId.includes('sliding')) return `wardrobe-sliding-180`;
      if (width >= 200 || elementId.includes('4door') || elementId.includes('4-door')) return `wardrobe-4door-200`;
      if (width >= 150 || elementId.includes('3door') || elementId.includes('3-door')) return `wardrobe-3door-150`;
      return `wardrobe-2door-100`;
    },
    description: 'Wardrobes (100-200cm)',
    priority: 30,
  },

  // Chest of Drawers - width-based
  {
    pattern: /chest.*drawers?|dresser/i,
    mapper: (elementId, width) => {
      if (width >= 100) return `chest-drawers-100`;
      return `chest-drawers-80`;
    },
    description: 'Chest of Drawers (80-100cm)',
    priority: 30,
  },

  // Tallboy
  {
    pattern: /tallboy/i,
    mapper: (elementId, width) => `tallboy-50`,
    description: 'Tallboy 50cm',
    priority: 30,
  },

  // Ottoman
  {
    pattern: /ottoman/i,
    mapper: (elementId, width) => {
      if (elementId.includes('storage') || width >= 80) return `ottoman-storage-80`;
      return `ottoman-60`;
    },
    description: 'Ottoman (60-80cm)',
    priority: 25,
  },

  // Bedside Tables
  {
    pattern: /bedside.*table/i,
    mapper: (elementId, width) => {
      if (width >= 50) return `bedside-table-50`;
      return `bedside-table-40`;
    },
    description: 'Bedside Tables (40-50cm)',
    priority: 25,
  },

  // Bedroom Bench
  {
    pattern: /bedroom.*bench/i,
    mapper: (elementId, width) => `bedroom-bench-120`,
    description: 'Bedroom Bench 120cm',
    priority: 25,
  },

  // =====================================================================
  // Multi-Room: Bathroom Components
  // =====================================================================

  // Vanities - width-based
  {
    pattern: /vanity/i,
    mapper: (elementId, width) => {
      if (elementId.includes('table')) {
        return width >= 120 ? `vanity-table-120` : `vanity-table-100`;
      }
      if (elementId.includes('double') || width >= 120) return `vanity-double-120`;
      if (elementId.includes('floating')) return `vanity-floating-80`;
      if (width >= 100) return `vanity-100`;
      if (width >= 80) return `vanity-80`;
      return `vanity-60`;
    },
    description: 'Vanities (60-120cm)',
    priority: 31,
  },

  // Bathroom Storage
  {
    pattern: /bathroom.*cabinet/i,
    mapper: (elementId, width) => `bathroom-cabinet-40`,
    description: 'Bathroom Cabinet 40cm',
    priority: 25,
  },

  {
    pattern: /linen.*cupboard/i,
    mapper: (elementId, width) => `linen-cupboard-60`,
    description: 'Linen Cupboard 60cm',
    priority: 25,
  },

  {
    pattern: /mirror.*cabinet/i,
    mapper: (elementId, width) => `mirror-cabinet-70`,
    description: 'Mirror Cabinet 70cm',
    priority: 26,
  },

  {
    pattern: /mirror/i,
    mapper: (elementId, width) => {
      if (elementId.includes('trifold')) return `mirror-trifold-80`;
      if (elementId.includes('full')) return `mirror-full-60`;
      return `mirror-cabinet-70`;
    },
    description: 'Mirrors',
    priority: 25,
  },

  // Showers - variant-based
  {
    pattern: /shower/i,
    mapper: (elementId, width) => {
      if (elementId.includes('enclosure')) return `shower-enclosure-90`;
      if (elementId.includes('tray')) return `shower-tray-90`;
      return `shower-standard`;
    },
    description: 'Showers',
    priority: 31,
  },

  // Bathtubs - width-based
  {
    pattern: /bathtub|bath(?!room)/i,
    mapper: (elementId, width) => {
      if (width >= 170) return `bathtub-170`;
      return `bathtub-standard`;
    },
    description: 'Bathtubs',
    priority: 31,
  },

  // Toilet
  {
    pattern: /toilet/i,
    mapper: (elementId, width) => `toilet-standard`,
    description: 'Toilets',
    priority: 30,
  },

  // =====================================================================
  // Multi-Room: Living Room Components
  // =====================================================================

  // Sofas - width-based
  {
    pattern: /sofa/i,
    mapper: (elementId, width) => {
      if (width >= 200 || elementId.includes('3seater') || elementId.includes('3-seater')) return `sofa-3seater-200`;
      if (width >= 140 || elementId.includes('2seater') || elementId.includes('2-seater')) return `sofa-2seater-140`;
      return `sofa-3-seater`;
    },
    description: 'Sofas (140-200cm)',
    priority: 26,
  },

  // Loveseat
  {
    pattern: /loveseat/i,
    mapper: (elementId, width) => `loveseat-120`,
    description: 'Loveseat 120cm',
    priority: 25,
  },

  // Armchair
  {
    pattern: /armchair/i,
    mapper: (elementId, width) => `armchair-80`,
    description: 'Armchair 80cm',
    priority: 26,
  },

  // Reading Chair
  {
    pattern: /reading.*chair/i,
    mapper: (elementId, width) => `reading-chair-70`,
    description: 'Reading Chair 70cm',
    priority: 26,
  },

  // Media Cabinet
  {
    pattern: /media.*cabinet/i,
    mapper: (elementId, width) => `media-cabinet-80`,
    description: 'Media Cabinet 80cm',
    priority: 25,
  },

  // TV Units
  {
    pattern: /tv.*unit/i,
    mapper: (elementId, width) => {
      if (width >= 160) return `tv-unit-160`;
      return `tv-unit-120`;
    },
    description: 'TV Units (120-160cm)',
    priority: 26,
  },

  {
    pattern: /^tv-|tv$/i,
    mapper: (elementId, width) => `tv-55-inch`,
    description: 'TVs',
    priority: 25,
  },

  // Sideboard
  {
    pattern: /sideboard/i,
    mapper: (elementId, width) => {
      if (elementId.includes('dining')) {
        return width >= 160 ? `sideboard-dining-160` : `sideboard-dining-140`;
      }
      return `sideboard-180`;
    },
    description: 'Sideboard (140-180cm)',
    priority: 25,
  },

  // Display Cabinet
  {
    pattern: /display.*cabinet/i,
    mapper: (elementId, width) => {
      if (elementId.includes('dining')) return `display-cabinet-dining-100`;
      return `display-cabinet-90`;
    },
    description: 'Display Cabinet (90-100cm)',
    priority: 25,
  },

  // China Cabinet
  {
    pattern: /china.*cabinet/i,
    mapper: (elementId, width) => `china-cabinet-90`,
    description: 'China Cabinet 90cm',
    priority: 25,
  },

  // Drinks Cabinet
  {
    pattern: /drinks.*cabinet/i,
    mapper: (elementId, width) => `drinks-cabinet-80`,
    description: 'Drinks Cabinet 80cm',
    priority: 25,
  },

  // =====================================================================
  // Multi-Room: Dining Room Components
  // =====================================================================

  // Dining Tables
  {
    pattern: /dining.*table/i,
    mapper: (elementId, width) => {
      if (elementId.includes('round')) {
        return width >= 120 ? `dining-table-round-120` : `dining-table-round-110`;
      }
      if (elementId.includes('extendable')) return `dining-table-extendable-160`;
      if (width >= 180) return `dining-table-180`;
      if (width >= 160) return `dining-table-160`;
      if (width >= 120) return `dining-table-120`;
      return `dining-table`;
    },
    description: 'Dining Tables (120-180cm)',
    priority: 27,
  },

  // Dining Chairs
  {
    pattern: /dining.*chair/i,
    mapper: (elementId, width) => {
      if (elementId.includes('upholstered')) return `dining-chair-upholstered`;
      if (elementId.includes('standard')) return `dining-chair-standard`;
      return `dining-chair`;
    },
    description: 'Dining Chairs',
    priority: 27,
  },

  // Dining Bench
  {
    pattern: /dining.*bench/i,
    mapper: (elementId, width) => {
      if (width >= 140) return `dining-bench-140`;
      return `dining-bench-120`;
    },
    description: 'Dining Bench (120-140cm)',
    priority: 26,
  },

  // Generic chair (lower priority)
  {
    pattern: /chair/i,
    mapper: (elementId, width) => `dining-chair`,
    description: 'Chairs (generic)',
    priority: 20,
  },

  // Generic table (lower priority)
  {
    pattern: /table/i,
    mapper: (elementId, width) => `dining-table`,
    description: 'Tables (generic)',
    priority: 20,
  },

  // =====================================================================
  // Multi-Room: Office Components
  // =====================================================================

  // Desks - width-based
  {
    pattern: /desk/i,
    mapper: (elementId, width) => {
      if (elementId.includes('lshaped') || elementId.includes('l-shaped')) return `desk-lshaped-160`;
      if (elementId.includes('corner')) return `desk-corner-120`;
      if (width >= 160) return `desk-160`;
      if (width >= 140) return `desk-140`;
      return `desk-120`;
    },
    description: 'Desks (120-160cm)',
    priority: 30,
  },

  // Filing Cabinets
  {
    pattern: /filing.*cabinet/i,
    mapper: (elementId, width) => {
      if (elementId.includes('3') || elementId.includes('three')) return `filing-cabinet-3drawer`;
      return `filing-cabinet-2drawer`;
    },
    description: 'Filing Cabinets',
    priority: 25,
  },

  // Pedestal
  {
    pattern: /pedestal/i,
    mapper: (elementId, width) => `pedestal-3drawer`,
    description: 'Pedestal 3-Drawer',
    priority: 25,
  },

  // Office Chairs
  {
    pattern: /office.*chair/i,
    mapper: (elementId, width) => {
      if (elementId.includes('executive')) return `office-chair-executive`;
      return `office-chair-task`;
    },
    description: 'Office Chairs',
    priority: 26,
  },

  // Visitor Chair
  {
    pattern: /visitor.*chair/i,
    mapper: (elementId, width) => `visitor-chair`,
    description: 'Visitor Chair',
    priority: 26,
  },

  // Office Bookshelf
  {
    pattern: /bookshelf.*office|office.*bookshelf/i,
    mapper: (elementId, width) => {
      return width >= 100 ? `bookshelf-office-100` : `bookshelf-office-80`;
    },
    description: 'Office Bookshelf (80-100cm)',
    priority: 26,
  },

  // Generic Bookshelf
  {
    pattern: /bookshelf/i,
    mapper: (elementId, width) => {
      return width >= 100 ? `bookshelf-100` : `bookshelf-80`;
    },
    description: 'Bookshelf (80-100cm)',
    priority: 25,
  },

  // Storage Cabinet
  {
    pattern: /storage.*cabinet/i,
    mapper: (elementId, width) => `storage-cabinet-80`,
    description: 'Storage Cabinet 80cm',
    priority: 25,
  },

  // =====================================================================
  // Multi-Room: Dressing Room Components
  // =====================================================================

  // Dressing Table
  {
    pattern: /dressing.*table/i,
    mapper: (elementId, width) => `dressing-table-120`,
    description: 'Dressing Table 120cm',
    priority: 25,
  },

  // Dressing Stool
  {
    pattern: /dressing.*stool/i,
    mapper: (elementId, width) => `dressing-stool`,
    description: 'Dressing Stool',
    priority: 25,
  },

  // Dressing Chair
  {
    pattern: /dressing.*chair/i,
    mapper: (elementId, width) => `dressing-chair`,
    description: 'Dressing Chair',
    priority: 25,
  },

  // Jewelry Armoire
  {
    pattern: /jewelry.*armoire/i,
    mapper: (elementId, width) => `jewelry-armoire-50`,
    description: 'Jewelry Armoire 50cm',
    priority: 25,
  },

  // Shoe Cabinet
  {
    pattern: /shoe.*cabinet/i,
    mapper: (elementId, width) => {
      if (width >= 100) return `shoe-cabinet-100`;
      return `shoe-cabinet-80`;
    },
    description: 'Shoe Cabinet (80-100cm)',
    priority: 25,
  },

  // Tie Rack
  {
    pattern: /tie.*rack/i,
    mapper: (elementId, width) => `tie-rack-30`,
    description: 'Tie Rack 30cm',
    priority: 25,
  },

  // =====================================================================
  // Multi-Room: Utility Components
  // =====================================================================

  // Freezers
  {
    pattern: /freezer/i,
    mapper: (elementId, width) => {
      if (elementId.includes('chest')) return `freezer-chest-90`;
      return `freezer-upright-60`;
    },
    description: 'Freezers',
    priority: 31,
  },

  // Washing Machine
  {
    pattern: /washing-machine|washer(?!-dryer)/i,
    mapper: (elementId, width) => {
      if (width >= 60) return `washing-machine-60`;
      return `washing-machine`;
    },
    description: 'Washing machines',
    priority: 30,
  },

  // Tumble Dryer
  {
    pattern: /tumble-dryer|dryer/i,
    mapper: (elementId, width) => {
      if (width >= 60) return `tumble-dryer-60`;
      return `tumble-dryer`;
    },
    description: 'Tumble dryers',
    priority: 30,
  },

  // Utility Sinks
  {
    pattern: /utility.*sink/i,
    mapper: (elementId, width) => {
      if (elementId.includes('double') || width >= 100) return `utility-sink-double-100`;
      return `utility-sink-single-60`;
    },
    description: 'Utility Sinks (60-100cm)',
    priority: 30,
  },

  // Utility Worktops
  {
    pattern: /utility.*worktop/i,
    mapper: (elementId, width) => {
      if (width >= 120) return `utility-worktop-120`;
      if (width >= 100) return `utility-worktop-100`;
      return `utility-worktop-80`;
    },
    description: 'Utility Worktops (80-120cm)',
    priority: 30,
  },

  // Broom Cupboard
  {
    pattern: /broom.*cupboard/i,
    mapper: (elementId, width) => `broom-cupboard-60`,
    description: 'Broom Cupboard 60cm',
    priority: 25,
  },

  // Utility Tall Units
  {
    pattern: /utility.*tall/i,
    mapper: (elementId, width) => {
      return width >= 80 ? `utility-tall-80` : `utility-tall-60`;
    },
    description: 'Utility Tall Units (60-80cm)',
    priority: 30,
  },

  // Utility Wall Cabinets
  {
    pattern: /utility.*wall/i,
    mapper: (elementId, width) => {
      return width >= 80 ? `utility-wall-80` : `utility-wall-60`;
    },
    description: 'Utility Wall Cabinets (60-80cm)',
    priority: 30,
  },

  // Utility Base Cabinets
  {
    pattern: /utility.*base/i,
    mapper: (elementId, width) => {
      return width >= 80 ? `utility-base-80` : `utility-base-60`;
    },
    description: 'Utility Base Cabinets (60-80cm)',
    priority: 30,
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
