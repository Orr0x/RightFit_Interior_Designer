/**
 * Corner Detection Utilities
 *
 * Centralized logic for detecting and handling corner components in the design canvas.
 * This replaces multiple duplicated inline checks throughout the codebase.
 */

import { DesignElement } from '@/types/project';

/**
 * Corner position types
 */
export type CornerPosition = 'front-left' | 'front-right' | 'back-left' | 'back-right';

/**
 * Result of corner detection
 */
export interface CornerInfo {
  isCorner: boolean;
  corner?: CornerPosition;
}

/**
 * Check if a component is a corner component by its ID
 * This is the TYPE-based detection (different from POSITION-based detection)
 */
export function isCornerComponent(componentId: string): boolean {
  const id = componentId.toLowerCase();
  return id.includes('corner-counter-top') ||
         id.includes('counter-top-corner') ||
         id.includes('corner-wall-cabinet') ||
         id.includes('new-corner-wall-cabinet') ||
         id.includes('corner-base-cabinet') ||
         id.includes('l-shaped-test-cabinet') ||
         id.includes('corner-tall-unit') ||
         id.includes('corner-larder') ||
         id.includes('corner-pantry') ||
         id.includes('corner-sink');
}

/**
 * Check if a component is specifically a corner counter-top
 */
export function isCornerCounterTop(element: DesignElement): boolean {
  return element.type === 'counter-top' &&
         (element.id.includes('counter-top-corner') ||
          element.id.includes('corner-counter-top'));
}

/**
 * Check if a component is specifically a corner wall cabinet
 */
export function isCornerWallCabinet(element: DesignElement): boolean {
  return element.type === 'cabinet' &&
         (element.id.includes('corner-wall-cabinet') ||
          element.id.includes('new-corner-wall-cabinet'));
}

/**
 * Check if a component is specifically a corner base cabinet
 */
export function isCornerBaseCabinet(element: DesignElement): boolean {
  return element.type === 'cabinet' &&
         (element.id.includes('corner-base-cabinet') ||
          element.id.includes('l-shaped-test-cabinet'));
}

/**
 * Check if a component is specifically a corner tall unit
 */
export function isCornerTallUnit(element: DesignElement): boolean {
  return element.type === 'cabinet' &&
         (element.id.includes('corner-tall-unit') ||
          element.id.includes('corner-larder') ||
          element.id.includes('corner-pantry'));
}

/**
 * Check if any element is any type of corner component
 */
export function isAnyCornerComponent(element: DesignElement): boolean {
  return isCornerCounterTop(element) ||
         isCornerWallCabinet(element) ||
         isCornerBaseCabinet(element) ||
         isCornerTallUnit(element);
}

/**
 * Detect corner position based on element coordinates
 * This is POSITION-based detection (different from TYPE-based detection)
 *
 * @param element - The design element to check
 * @param roomDimensions - The room dimensions (width, height in cm)
 * @param tolerance - Distance tolerance for corner detection in cm (default 30)
 */
export function detectCornerPosition(
  element: DesignElement,
  roomDimensions: { width: number; depth: number },
  tolerance: number = 30
): CornerInfo {
  // Check each corner position
  if (element.x <= tolerance && element.y <= tolerance) {
    return { isCorner: true, corner: 'front-left' };
  }
  if (element.x >= roomDimensions.width - element.width - tolerance && element.y <= tolerance) {
    return { isCorner: true, corner: 'front-right' };
  }
  if (element.x <= tolerance && element.y >= roomDimensions.depth - element.depth - tolerance) {
    return { isCorner: true, corner: 'back-left' };
  }
  if (element.x >= roomDimensions.width - element.width - tolerance &&
      element.y >= roomDimensions.depth - element.depth - tolerance) {
    return { isCorner: true, corner: 'back-right' };
  }

  return { isCorner: false };
}

/**
 * Check if a corner unit is visible in a specific elevation view
 *
 * @param element - The design element to check
 * @param roomDimensions - The room dimensions
 * @param viewDirection - The elevation view direction ('front' | 'back' | 'left' | 'right')
 */
export function isCornerVisibleInView(
  element: DesignElement,
  roomDimensions: { width: number; depth: number },
  viewDirection: string
): boolean {
  const cornerInfo = detectCornerPosition(element, roomDimensions);

  if (!cornerInfo.isCorner) return false;

  // Corner units are visible in their two adjacent walls
  switch (cornerInfo.corner) {
    case 'front-left':
      return viewDirection === 'front' || viewDirection === 'left';
    case 'front-right':
      return viewDirection === 'front' || viewDirection === 'right';
    case 'back-left':
      return viewDirection === 'back' || viewDirection === 'left';
    case 'back-right':
      return viewDirection === 'back' || viewDirection === 'right';
    default:
      return false;
  }
}

/**
 * Get the primary wall for a corner element (used for filtering)
 *
 * @param cornerPosition - The corner position
 * @returns The primary wall direction
 */
export function getCornerPrimaryWall(cornerPosition: CornerPosition): 'front' | 'back' | 'left' | 'right' {
  switch (cornerPosition) {
    case 'front-left':
    case 'front-right':
      return 'front';
    case 'back-left':
    case 'back-right':
      return 'back';
  }
}

/**
 * Check if a position is considered a corner position in the room
 *
 * @param x - X coordinate in cm
 * @param y - Y coordinate in cm
 * @param roomDimensions - Room dimensions
 * @param tolerance - Distance tolerance for corner detection in cm
 */
export function isCornerPosition(
  x: number,
  y: number,
  roomDimensions: { width: number; depth: number },
  tolerance: number = 30
): boolean {
  const nearFront = y <= tolerance;
  const nearBack = y >= roomDimensions.depth - tolerance;
  const nearLeft = x <= tolerance;
  const nearRight = x >= roomDimensions.width - tolerance;

  // It's a corner if it's near two adjacent walls
  return (nearFront && nearLeft) ||
         (nearFront && nearRight) ||
         (nearBack && nearLeft) ||
         (nearBack && nearRight);
}
