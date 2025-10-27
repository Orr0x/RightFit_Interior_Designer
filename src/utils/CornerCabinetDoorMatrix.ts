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

  /**
   * Transform door side for specific elevation view
   *
   * The matrix returns physical door orientation (which wall the door faces away from).
   * But when rendering from different elevation views, we need to transform this
   * to the correct visual position.
   *
   * Example: A front-left corner has door='right' (away from left wall).
   * - FRONT view: Door renders on right side ✓
   * - LEFT view: Door physically faces right, but viewed from left wall it appears on left side
   *
   * @param doorSide - Physical door side from matrix
   * @param cornerPosition - Corner position (front-left, etc.)
   * @param currentView - Current elevation view (front, back, left, right)
   * @returns Transformed door side for rendering in this view
   */
  static transformDoorSideForView(
    doorSide: DoorSide,
    cornerPosition: CornerPosition | null,
    currentView: string | undefined
  ): DoorSide {
    if (!cornerPosition || !currentView) {
      return doorSide; // No transformation needed
    }

    // Extract base view direction (remove '-default', '-dup1', etc.)
    const viewDirection = currentView.split('-')[0] as 'front' | 'back' | 'left' | 'right';

    // LEFT and RIGHT views are MIRRORS - they need OPPOSITE transformations
    //
    // RIGHT elevation (looking at right wall from inside room):
    // - Front-right corner: On LEFT side of view → FLIP door side
    // - Back-right corner: On RIGHT side of view → NO FLIP
    //
    // LEFT elevation (looking at left wall from inside room) - MIRROR of right:
    // - Front-left corner: On LEFT side of view → NO FLIP (opposite of right)
    // - Back-left corner: On RIGHT side of view → FLIP (opposite of right)

    if (viewDirection === 'left') {
      // LEFT elevation: Looking at left wall (MIRROR of right elevation)
      if (cornerPosition === 'back-left') {
        // Back-left corner: On the RIGHT side of view (near back wall)
        // Matrix says 'right' (away from left wall), flip it to 'left'
        return doorSide === 'right' ? 'left' : 'right';
      }
      // front-left: NO transformation needed
    }

    if (viewDirection === 'right') {
      // RIGHT elevation: Looking at right wall
      if (cornerPosition === 'front-right') {
        // Front-right corner: On the LEFT side of view (near front wall)
        // Matrix says 'left' (away from right wall), flip it to 'right'
        return doorSide === 'left' ? 'right' : 'left';
      }
      // back-right: NO transformation needed
    }

    // FRONT and BACK views: No transformation needed
    // The matrix orientation matches the rendering orientation
    return doorSide;
  }
}
