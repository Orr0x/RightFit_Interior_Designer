/**
 * Canvas Shared Utilities
 *
 * Shared constants, types, and utility functions for 2D canvas rendering
 * Used by both PlanViewCanvas and ElevationViewCanvas
 *
 * Story: 1.15 - Refactor DesignCanvas2D into Modular Components
 * Date: 2025-10-27
 */

import type { DesignElement } from '@/types/project';

// =============================================================================
// CONSTANTS
// =============================================================================

export const CANVAS_WIDTH = 1600; // Larger workspace for better zoom
export const CANVAS_HEIGHT = 1200; // Larger workspace for better zoom
export const GRID_SIZE = 20; // Grid spacing in pixels
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 4.0;

// Wall thickness constants to match 3D implementation
export const WALL_THICKNESS = 10; // 10cm wall thickness (matches 3D: 0.1 meters)
export const WALL_CLEARANCE = 5; // 5cm clearance from walls for component placement
export const WALL_SNAP_THRESHOLD = 40; // Snap to wall if within 40cm

// =============================================================================
// TYPES
// =============================================================================

export interface RoomPosition {
  innerX: number;
  innerY: number;
  outerX: number;
  outerY: number;
}

export interface RoomBounds {
  width: number;
  height: number;
}

export interface SnapPosition {
  x: number;
  y: number;
  snappedToWall: boolean;
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
}

export interface SnapGuides {
  vertical: number[];
  horizontal: number[];
}

// =============================================================================
// THROTTLE UTILITY
// =============================================================================

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  return ((...args: any[]) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
};

// =============================================================================
// HIT DETECTION
// =============================================================================

/**
 * Check if a point is inside a rotated component
 * Uses inverse rotation transform to check point in component's local space
 */
export const isPointInRotatedComponent = (
  pointX: number,
  pointY: number,
  element: DesignElement,
  viewMode: 'plan' | 'elevation' = 'plan'
): boolean => {
  if (viewMode === 'plan') {
    // Plan view: use X/Y coordinates with rotation
    const width = element.width;
    const height = element.depth || element.height;
    const rotation = (element.rotation || 0) * Math.PI / 180;

    // Transform click point into component's local space
    const centerX = element.x + width / 2;
    const centerY = element.y + height / 2;

    // Translate point to component center
    const dx = pointX - centerX;
    const dy = pointY - centerY;

    // Rotate backwards (inverse rotation)
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // Check if in un-rotated bounds
    return Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2;
  } else {
    // Elevation view: use X (horizontal) and Z (vertical) coordinates
    const width = element.width;
    const height = element.height || 86; // Use actual height for vertical dimension
    const z = element.z || 0;

    // In elevation view, Z represents the mount height (bottom of element above floor)
    // The element extends from z (bottom) to z + height (top)
    const centerX = element.x + width / 2;
    const bottomZ = z; // Bottom of element above floor
    const topZ = z + height; // Top of element above floor

    // Check if point is within bounds (no rotation in elevation view)
    const isInHorizontalBounds = Math.abs(pointX - centerX) <= width / 2;
    const isInVerticalBounds = pointY >= bottomZ && pointY <= topZ;

    return isInHorizontalBounds && isInVerticalBounds;
  }
};

// =============================================================================
// WALL SNAPPING
// =============================================================================

/**
 * Smart Wall Snapping System with 5cm clearance
 * Returns snapped position for component placement near walls
 */
export const getWallSnappedPosition = (
  dropX: number,
  dropY: number,
  componentWidth: number,
  componentDepth: number,
  roomWidth: number,
  roomHeight: number,
  isCornerComponent: boolean = false
): SnapPosition => {
  let snappedX = dropX;
  let snappedY = dropY;
  let snappedToWall = false;

  // For corner components, use 90x90 footprint
  const effectiveWidth = isCornerComponent ? 90 : componentWidth;
  const effectiveDepth = isCornerComponent ? 90 : componentDepth;

  // Calculate wall snap positions with 5cm clearance
  const leftWallX = WALL_CLEARANCE;
  const rightWallX = roomWidth - effectiveWidth - WALL_CLEARANCE;
  const topWallY = WALL_CLEARANCE;
  const bottomWallY = roomHeight - effectiveDepth - WALL_CLEARANCE;

  // Check for corner snapping first (higher priority)
  if (isCornerComponent) {
    const cornerThreshold = WALL_SNAP_THRESHOLD;

    // Top-left corner
    if (dropX <= cornerThreshold && dropY <= cornerThreshold) {
      return { x: leftWallX, y: topWallY, snappedToWall: true, corner: 'top-left' };
    }

    // Top-right corner
    if (dropX >= roomWidth - cornerThreshold && dropY <= cornerThreshold) {
      return { x: rightWallX, y: topWallY, snappedToWall: true, corner: 'top-right' };
    }

    // Bottom-left corner
    if (dropX <= cornerThreshold && dropY >= roomHeight - cornerThreshold) {
      return { x: leftWallX, y: bottomWallY, snappedToWall: true, corner: 'bottom-left' };
    }

    // Bottom-right corner
    if (dropX >= roomWidth - cornerThreshold && dropY >= roomHeight - cornerThreshold) {
      return { x: rightWallX, y: bottomWallY, snappedToWall: true, corner: 'bottom-right' };
    }
  }

  // Wall snapping for all components (including corners if not in corner zones)
  // dropX/dropY represent component's TOP-LEFT corner position
  // Check both the component's start edge AND end edge for wall proximity

  // Snap to left wall
  if (dropX <= WALL_SNAP_THRESHOLD) {
    snappedX = leftWallX;
    snappedToWall = true;
  }
  // Snap to right wall
  else if (dropX + effectiveWidth >= roomWidth - WALL_SNAP_THRESHOLD) {
    snappedX = rightWallX;
    snappedToWall = true;
  }
  // Also check if the drop position itself is near the right boundary
  else if (dropX >= roomWidth - WALL_SNAP_THRESHOLD - effectiveWidth) {
    snappedX = rightWallX;
    snappedToWall = true;
  }

  // Snap to top wall
  if (dropY <= WALL_SNAP_THRESHOLD) {
    snappedY = topWallY;
    snappedToWall = true;
  }
  // Snap to bottom wall
  else if (dropY + effectiveDepth >= roomHeight - WALL_SNAP_THRESHOLD) {
    snappedY = bottomWallY;
    snappedToWall = true;
  }
  // Also check if the drop position itself is near the bottom boundary
  else if (dropY >= roomHeight - WALL_SNAP_THRESHOLD - effectiveDepth) {
    snappedY = bottomWallY;
    snappedToWall = true;
  }

  return {
    x: snappedX,
    y: snappedY,
    snappedToWall,
    corner: null
  };
};

// =============================================================================
// COORDINATE TRANSFORMATIONS
// =============================================================================

/**
 * Snap a value to the grid
 */
export const snapToGrid = (value: number, gridSize: number = GRID_SIZE): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Calculate room position on canvas considering zoom and pan
 */
export const calculateRoomPosition = (
  canvasWidth: number,
  canvasHeight: number,
  roomWidth: number,
  roomHeight: number,
  zoom: number,
  panOffset: { x: number; y: number },
  wallThickness: number = WALL_THICKNESS
): RoomPosition => {
  const centerX = canvasWidth / 2 + panOffset.x;
  const centerY = canvasHeight / 2 + panOffset.y;

  const innerWidth = roomWidth * zoom;
  const innerHeight = roomHeight * zoom;
  const outerWidth = (roomWidth + wallThickness * 2) * zoom;
  const outerHeight = (roomHeight + wallThickness * 2) * zoom;

  return {
    innerX: centerX - innerWidth / 2,
    innerY: centerY - innerHeight / 2,
    outerX: centerX - outerWidth / 2,
    outerY: centerY - outerHeight / 2
  };
};

// =============================================================================
// ELEMENT UTILITIES
// =============================================================================

/**
 * Check if element is a corner component
 */
export const isCornerComponent = (element: DesignElement): boolean => {
  const cornerId = element.id.toLowerCase();
  return (
    cornerId.includes('corner-base-cabinet') ||
    cornerId.includes('corner-wall-cabinet') ||
    cornerId.includes('corner-tall') ||
    cornerId.includes('corner-larder') ||
    cornerId.includes('larder-corner') ||
    cornerId.includes('counter-top-corner')
  );
};

/**
 * Get effective dimensions for corner components
 * Corner components use 90x90cm footprint for positioning
 */
export const getEffectiveDimensions = (element: DesignElement): { width: number; depth: number } => {
  if (isCornerComponent(element)) {
    const squareSize = Math.min(element.width, element.depth || element.height);
    return { width: squareSize, depth: squareSize };
  }
  return {
    width: element.width,
    depth: element.depth || element.height
  };
};

// =============================================================================
// Z-INDEX LAYERING
// =============================================================================

/**
 * Get z-index for element layering in 2D canvas
 * Higher z-index = rendered on top
 */
export const getElementZIndex = (element: DesignElement): number => {
  if (element.zIndex !== undefined) {
    return element.zIndex;
  }

  // Default z-index based on component type
  const type = element.type?.toLowerCase() || '';
  const id = element.id.toLowerCase();

  if (type === 'wall' || id.includes('wall-panel')) return 0.5;
  if (type === 'floor' || id.includes('flooring')) return 1.0;
  if (id.includes('base-cabinet') || id.includes('appliance') || id.includes('tall-unit')) return 2.0;
  if (id.includes('counter-top')) return 3.0;
  if (id.includes('sink')) return 3.5;
  if (id.includes('wall-cabinet') || id.includes('wall-unit')) return 4.0;
  if (id.includes('pelmet')) return 4.5;
  if (id.includes('cornice')) return 5.0;
  if (id.includes('window') || id.includes('door')) return 6.0;

  return 2.0; // Default
};
