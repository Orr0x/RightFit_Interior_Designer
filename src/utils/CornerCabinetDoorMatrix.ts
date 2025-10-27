/**
 * Corner Cabinet Door Orientation Matrix
 *
 * Story 1.10: Single source of truth for corner cabinet door orientation
 * Epic: Epic 1 - Eliminate Circular Dependency Patterns
 *
 * Fixes Fix #4 (Corner Cabinet Logic Circle) from circular-patterns-fix-plan.md
 * Replaces 16 view-specific door side rules with 4 corner-position rules.
 *
 * Key insight: Door always faces AWAY from walls
 */

export type CornerPosition = 'front-left' | 'front-right' | 'back-left' | 'back-right';
export type DoorSide = 'left' | 'right';

/**
 * Master door orientation matrix
 *
 * Maps corner positions to door sides based on physical constraints:
 * - Front-left corner: Door faces right (away from left wall)
 * - Front-right corner: Door faces left (away from right wall)
 * - Back-left corner: Door faces right (away from left wall)
 * - Back-right corner: Door faces left (away from right wall)
 *
 * This is the SINGLE SOURCE OF TRUTH for door orientation.
 * No view-specific rules should exist anywhere else in the codebase.
 */
const DOOR_ORIENTATION_MATRIX: Record<CornerPosition, DoorSide> = {
  'front-left': 'right',   // Door swings to the right (away from left wall)
  'front-right': 'left',   // Door swings to the left (away from right wall)
  'back-left': 'right',    // Door swings to the right (away from left wall)
  'back-right': 'left'     // Door swings to the left (away from right wall)
};

export class CornerCabinetDoorMatrix {

  /**
   * Detect corner position based on element coordinates
   *
   * @param element - Element with position and dimensions
   * @param roomDimensions - Room width and depth (inner dimensions)
   * @param tolerance - Distance from wall to be considered "in corner" (default 30cm)
   * @returns Corner position or null if not in a corner
   */
  static detectCornerPosition(
    element: { x: number; y: number; width: number; depth: number },
    roomDimensions: { width: number; depth: number },
    tolerance: number = 30  // cm
  ): CornerPosition | null {

    const isLeftEdge = element.x < tolerance;
    const isRightEdge = element.x + element.width > roomDimensions.width - tolerance;
    const isFrontEdge = element.y < tolerance;
    const isBackEdge = element.y + element.depth > roomDimensions.depth - tolerance;

    if (isFrontEdge && isLeftEdge) return 'front-left';
    if (isFrontEdge && isRightEdge) return 'front-right';
    if (isBackEdge && isLeftEdge) return 'back-left';
    if (isBackEdge && isRightEdge) return 'back-right';

    return null;  // Not in a corner
  }

  /**
   * Get door side for corner position (single source of truth)
   *
   * @param cornerPosition - Detected corner position
   * @param manualOverride - Optional manual override from element.cornerDoorSide
   * @returns Door side ('left' or 'right')
   */
  static getDoorSide(
    cornerPosition: CornerPosition,
    manualOverride?: DoorSide | 'auto'
  ): DoorSide {

    // Priority 1: Manual override
    if (manualOverride && manualOverride !== 'auto') {
      return manualOverride;
    }

    // Priority 2: Matrix lookup
    return DOOR_ORIENTATION_MATRIX[cornerPosition];
  }

  /**
   * Complete door side determination with all logic
   *
   * This is the main entry point for determining door orientation.
   * Use this method from rendering code.
   *
   * @param element - Element with position, dimensions, and optional cornerDoorSide
   * @param roomDimensions - Room width and depth (inner dimensions)
   * @returns Object with doorSide and detected cornerPosition
   */
  static determineCornerDoorSide(
    element: {
      x: number;
      y: number;
      width: number;
      depth: number;
      cornerDoorSide?: DoorSide | 'auto';
    },
    roomDimensions: { width: number; depth: number }
  ): { doorSide: DoorSide; cornerPosition: CornerPosition | null } {

    // Detect corner position
    const cornerPosition = this.detectCornerPosition(element, roomDimensions);

    if (!cornerPosition) {
      // Not a corner - default to right
      return { doorSide: 'right', cornerPosition: null };
    }

    // Get door side from matrix
    const doorSide = this.getDoorSide(cornerPosition, element.cornerDoorSide);

    return { doorSide, cornerPosition };
  }
}
