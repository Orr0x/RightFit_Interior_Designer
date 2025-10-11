/**
 * Wall-Count Elevation System - Helper Functions
 * Date: 2025-10-11
 *
 * IMPORTANT: This file ADDS functionality for complex rooms (L/U-shaped).
 * It does NOT replace existing cardinal direction elevation logic.
 *
 * Purpose: Filter elements by proximity to specific wall segments
 * Use case: L-shaped rooms need more than 4 elevation views (one per wall)
 */

import type { DesignElement } from '@/types/project';
import type { RoomGeometry, WallSegment } from '@/types/RoomGeometry';
import * as GeometryUtils from '@/utils/GeometryUtils';

/**
 * Filter elements that are "near" a specific wall
 *
 * Uses perpendicular distance calculation to determine if element is within
 * tolerance distance of a wall segment. This allows "fuzzy" matching so users
 * don't have to position elements perfectly on walls.
 *
 * @param wallId - ID of the wall to filter by (e.g., 'wall-4', 'wall_north')
 * @param elements - All design elements in the room
 * @param roomGeometry - Room geometry containing wall definitions
 * @param tolerance - Distance threshold in cm (default 20cm)
 * @returns Elements within tolerance distance of the wall
 *
 * @example
 * // Get elements near interior return wall in L-shaped room
 * const elementsOnWall4 = getElementsForWall('wall-4', allElements, roomGeometry, 20);
 * // Returns: [cabinet1, cabinet2] - only elements within 20cm of wall-4
 */
export function getElementsForWall(
  wallId: string,
  elements: DesignElement[],
  roomGeometry: RoomGeometry,
  tolerance: number = 20
): DesignElement[] {
  // Find the wall in geometry
  const wall = roomGeometry.walls?.find(w => w.id === wallId);

  if (!wall) {
    console.warn(`[getElementsForWall] Wall ${wallId} not found in geometry`);
    return [];
  }

  // Filter elements by perpendicular distance to wall line segment
  return elements.filter(el => {
    // Calculate perpendicular distance from element center to wall
    const distance = GeometryUtils.pointToLineSegmentDistance(
      [el.x, el.y],
      wall.start,
      wall.end
    );

    // Include element if within tolerance ("near" the wall)
    // Tolerance allows for user error and elements slightly away from wall
    return distance <= tolerance;
  });
}

/**
 * Calculate wall length for display purposes
 *
 * @param wall - Wall segment with start/end points
 * @returns Length in cm
 *
 * @example
 * const wall = { id: 'wall-1', start: [0, 0], end: [600, 0], height: 240 };
 * calculateWallLength(wall); // Returns: 600
 */
export function calculateWallLength(wall: WallSegment): number {
  return GeometryUtils.calculateLineLength(wall.start, wall.end);
}

/**
 * Determine if wall is on perimeter or interior
 *
 * Uses 5cm tolerance to detect if wall endpoints are on bounding box edges.
 * Perimeter walls have both endpoints on bounding box, interior walls don't.
 *
 * @param wall - Wall segment to check
 * @param boundingBox - Room bounding box with min/max coordinates
 * @returns true if wall is on perimeter, false if interior
 *
 * @example
 * // L-shaped room bounding box
 * const bbox = { min_x: 0, max_x: 600, min_y: 0, max_y: 600 };
 *
 * // Perimeter wall (both points on edge)
 * const wall1 = { start: [0, 0], end: [600, 0] };
 * isWallOnPerimeter(wall1, bbox); // true
 *
 * // Interior wall (perpendicular return wall)
 * const wall4 = { start: [300, 400], end: [300, 600] };
 * isWallOnPerimeter(wall4, bbox); // false (start point not on edge)
 */
export function isWallOnPerimeter(
  wall: WallSegment,
  boundingBox: { min_x: number; max_x: number; min_y: number; max_y: number }
): boolean {
  const tolerance = 5; // 5cm tolerance for edge detection

  // Check if point is on any bounding box edge
  const isPointOnEdge = (point: [number, number]): boolean => {
    const [x, y] = point;
    return (
      Math.abs(x - boundingBox.min_x) < tolerance ||  // On left edge
      Math.abs(x - boundingBox.max_x) < tolerance ||  // On right edge
      Math.abs(y - boundingBox.min_y) < tolerance ||  // On top edge
      Math.abs(y - boundingBox.max_y) < tolerance     // On bottom edge
    );
  };

  // Wall is on perimeter only if BOTH endpoints are on bounding box edges
  const startOnEdge = isPointOnEdge(wall.start);
  const endOnEdge = isPointOnEdge(wall.end);

  return startOnEdge && endOnEdge;
}

/**
 * Get human-readable wall label for UI display
 *
 * @param wall - Wall segment
 * @param index - Wall index in array (0-based)
 * @param boundingBox - Room bounding box
 * @returns Display label (e.g., "Wall 1 (600cm) - Perimeter")
 *
 * @example
 * getWallLabel(wall, 0, bbox); // "Wall 1 (600cm) - Perimeter"
 * getWallLabel(wall, 3, bbox); // "Wall 4 (150cm) - Interior"
 */
export function getWallLabel(
  wall: WallSegment,
  index: number,
  boundingBox: { min_x: number; max_x: number; min_y: number; max_y: number }
): string {
  const length = Math.round(calculateWallLength(wall));
  const type = isWallOnPerimeter(wall, boundingBox) ? 'Perimeter' : 'Interior';
  return `Wall ${index + 1} (${length}cm) - ${type}`;
}

/**
 * Get all walls assigned to a specific elevation view (database-driven)
 *
 * This function enables template-defined elevation views where wall assignments
 * are stored in the database rather than hardcoded in the application.
 *
 * @param elevationView - View identifier ('front', 'interior-return', etc.)
 * @param roomGeometry - Room geometry with wall definitions
 * @returns Array of walls assigned to this elevation view
 *
 * @example
 * // Get walls for front elevation view
 * const frontWalls = getWallsForElevationView('front', roomGeometry);
 * // Returns: [wall_1, wall_6] for L-shape room
 *
 * @example
 * // Get interior return wall in L-shaped room
 * const interiorWalls = getWallsForElevationView('interior-return', roomGeometry);
 * // Returns: [wall_4_internal]
 */
export function getWallsForElevationView(
  elevationView: string,
  roomGeometry: RoomGeometry
): WallSegment[] {
  if (!roomGeometry.walls) return [];

  // Filter walls that match this elevation view assignment
  return roomGeometry.walls.filter(wall =>
    wall.elevation_view === elevationView
  );
}

/**
 * Get all unique elevation views defined in room geometry (database-driven)
 *
 * Dynamically discovers available elevation views from wall assignments.
 * Enables UI to adapt to template-defined views without hardcoding.
 *
 * @param roomGeometry - Room geometry with wall definitions
 * @returns Array of unique elevation view identifiers
 *
 * @example
 * // Rectangle room
 * getAvailableElevationViews(rectangleGeometry);
 * // Returns: ['front', 'right', 'back', 'left']
 *
 * @example
 * // L-shaped room
 * getAvailableElevationViews(lShapeGeometry);
 * // Returns: ['front', 'right', 'back', 'left', 'interior-return']
 */
export function getAvailableElevationViews(
  roomGeometry: RoomGeometry
): string[] {
  if (!roomGeometry.walls) return [];

  // Extract elevation_view from all walls, filter out undefined
  const views = roomGeometry.walls
    .map(wall => wall.elevation_view)
    .filter((view): view is string => view !== undefined);

  // Return unique views
  return Array.from(new Set(views));
}
