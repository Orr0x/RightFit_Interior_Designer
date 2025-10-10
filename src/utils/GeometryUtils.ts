/**
 * GeometryUtils - Polygon geometry operations for complex room shapes
 *
 * Provides algorithms for:
 * - Point-in-polygon testing (ray casting)
 * - Point-to-line-segment distance calculations
 * - Nearest wall finding
 * - Bounding box calculations
 * - Polygon area calculations (Shoelace formula)
 *
 * Used by both 2D canvas and 3D rendering systems.
 */

import type { WallSegment } from '@/types/RoomGeometry';

/**
 * Ray casting algorithm to check if point is inside polygon
 * Time complexity: O(n) where n = number of vertices
 *
 * Algorithm:
 * - Cast a ray from the point to infinity (horizontal right)
 * - Count how many times the ray intersects polygon edges
 * - If odd number of intersections, point is inside
 * - If even number, point is outside
 *
 * @param point - [x, y] coordinates in cm
 * @param vertices - Polygon vertices [[x1, y1], [x2, y2], ...]
 * @returns true if point is inside polygon
 *
 * @example
 * const vertices = [[0, 0], [100, 0], [100, 100], [0, 100]];
 * isPointInPolygon([50, 50], vertices); // true - center of square
 * isPointInPolygon([150, 50], vertices); // false - outside square
 */
export function isPointInPolygon(
  point: [number, number],
  vertices: [number, number][]
): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];

    // Check if ray from point intersects this edge
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate perpendicular distance from point to line segment
 * Time complexity: O(1)
 *
 * Algorithm:
 * - Project point onto infinite line through segment
 * - Clamp projection to segment endpoints (parameter t ∈ [0, 1])
 * - Calculate Euclidean distance from point to clamped projection
 *
 * @param point - [x, y] coordinates in cm
 * @param lineStart - Start of line segment [x1, y1] in cm
 * @param lineEnd - End of line segment [x2, y2] in cm
 * @returns distance in cm
 *
 * @example
 * // Point directly above segment midpoint
 * pointToLineSegmentDistance([50, 100], [0, 0], [100, 0]); // 100
 *
 * // Point beyond segment endpoint
 * pointToLineSegmentDistance([150, 50], [0, 0], [100, 0]); // ~70.7 (diagonal to corner)
 */
export function pointToLineSegmentDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    // Line segment is a point - return distance to point
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Calculate projection parameter (t = 0 at start, t = 1 at end)
  // If t < 0, closest point is start; if t > 1, closest point is end
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

  // Find closest point on segment using projection parameter
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  // Return Euclidean distance
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

/**
 * Calculate closest point on line segment to given point
 * Time complexity: O(1)
 *
 * @param point - [x, y] coordinates in cm
 * @param lineStart - Start of line segment [x1, y1] in cm
 * @param lineEnd - End of line segment [x2, y2] in cm
 * @returns closest point [x, y] on segment
 */
export function closestPointOnLineSegment(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): [number, number] {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return [x1, y1]; // Line segment is a point
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

  return [x1 + t * dx, y1 + t * dy];
}

/**
 * Find nearest wall segment to a point
 * Time complexity: O(n) where n = number of walls
 *
 * @param point - [x, y] coordinates in cm
 * @param walls - Array of wall segments with start/end points
 * @returns Wall segment ID, distance, and closest point on wall
 *
 * @example
 * const walls = [
 *   { id: 'wall-1', start: [0, 0], end: [100, 0] },
 *   { id: 'wall-2', start: [100, 0], end: [100, 100] }
 * ];
 * findNearestWall([50, 10], walls);
 * // Returns: { wallId: 'wall-1', distance: 10, closestPoint: [50, 0] }
 */
export function findNearestWall(
  point: [number, number],
  walls: WallSegment[]
): { wallId: string; distance: number; closestPoint: [number, number] } {
  let minDistance = Infinity;
  let nearestWallId: string | null = null;
  let nearestClosestPoint: [number, number] = [0, 0];

  for (const wall of walls) {
    const distance = pointToLineSegmentDistance(point, wall.start, wall.end);

    if (distance < minDistance) {
      minDistance = distance;
      nearestWallId = wall.id;
      nearestClosestPoint = closestPointOnLineSegment(point, wall.start, wall.end);
    }
  }

  if (!nearestWallId) {
    throw new Error('No walls found');
  }

  return {
    wallId: nearestWallId,
    distance: minDistance,
    closestPoint: nearestClosestPoint
  };
}

/**
 * Calculate polygon area using Shoelace formula (Gauss's area formula)
 * Time complexity: O(n) where n = number of vertices
 *
 * Algorithm:
 * - Sum of (x[i] * y[i+1] - x[i+1] * y[i]) for all edges
 * - Divide by 2 and take absolute value
 *
 * @param vertices - Polygon vertices [[x1, y1], [x2, y2], ...]
 * @returns area in cm²
 *
 * @example
 * // Square 100cm × 100cm
 * calculatePolygonArea([[0, 0], [100, 0], [100, 100], [0, 100]]); // 10000
 *
 * // L-shape: 200×200 with 100×100 cut out
 * calculatePolygonArea([
 *   [0, 0], [200, 0], [200, 200], [100, 200], [100, 100], [0, 100]
 * ]); // 30000
 */
export function calculatePolygonArea(vertices: [number, number][]): number {
  let area = 0;

  for (let i = 0; i < vertices.length; i++) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[(i + 1) % vertices.length];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
}

/**
 * Calculate axis-aligned bounding box for polygon
 * Time complexity: O(n) where n = number of vertices
 *
 * Used for quick bounds checking before expensive polygon tests.
 * Most drag operations fail bounding box check, avoiding O(n) polygon test.
 *
 * @param vertices - Polygon vertices [[x1, y1], [x2, y2], ...]
 * @returns Bounding box with min/max coordinates
 *
 * @example
 * calculateBoundingBox([[0, 0], [100, 50], [50, 100]]);
 * // Returns: { minX: 0, minY: 0, maxX: 100, maxY: 100 }
 */
export function calculateBoundingBox(
  vertices: [number, number][]
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const [x, y] of vertices) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Check if point is inside axis-aligned bounding box
 * Time complexity: O(1)
 *
 * @param point - [x, y] coordinates in cm
 * @param bbox - Bounding box with min/max coordinates
 * @returns true if point is inside bounding box
 */
export function isPointInBoundingBox(
  point: [number, number],
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
): boolean {
  const [x, y] = point;
  return x >= bbox.minX && x <= bbox.maxX && y >= bbox.minY && y <= bbox.maxY;
}

/**
 * Calculate length of line segment
 * Time complexity: O(1)
 *
 * @param start - Start point [x1, y1] in cm
 * @param end - End point [x2, y2] in cm
 * @returns length in cm
 */
export function calculateLineLength(
  start: [number, number],
  end: [number, number]
): number {
  const [x1, y1] = start;
  const [x2, y2] = end;
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculate angle of line segment in degrees
 * Time complexity: O(1)
 *
 * @param start - Start point [x1, y1] in cm
 * @param end - End point [x2, y2] in cm
 * @returns angle in degrees (0° = right, 90° = down, -90° = up)
 *
 * @example
 * calculateLineAngle([0, 0], [100, 0]); // 0° - horizontal right
 * calculateLineAngle([0, 0], [0, 100]); // 90° - vertical down
 * calculateLineAngle([0, 0], [-100, 0]); // 180° or -180° - horizontal left
 */
export function calculateLineAngle(
  start: [number, number],
  end: [number, number]
): number {
  const [x1, y1] = start;
  const [x2, y2] = end;
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

/**
 * Check if rectangle (element) is fully inside polygon
 * Time complexity: O(n) where n = number of vertices
 *
 * Tests all 4 corners of the rectangle. All corners must be inside polygon.
 *
 * @param rect - Rectangle with x, y, width, height in cm
 * @param vertices - Polygon vertices [[x1, y1], [x2, y2], ...]
 * @returns true if all corners are inside polygon
 *
 * @example
 * const room = [[0, 0], [200, 0], [200, 200], [0, 200]];
 * isRectangleInPolygon({ x: 50, y: 50, width: 50, height: 50 }, room); // true
 * isRectangleInPolygon({ x: 150, y: 150, width: 100, height: 100 }, room); // false - exceeds bounds
 */
export function isRectangleInPolygon(
  rect: { x: number; y: number; width: number; height: number },
  vertices: [number, number][]
): boolean {
  // Check all 4 corners
  const corners: [number, number][] = [
    [rect.x, rect.y], // Top-left
    [rect.x + rect.width, rect.y], // Top-right
    [rect.x + rect.width, rect.y + rect.height], // Bottom-right
    [rect.x, rect.y + rect.height] // Bottom-left
  ];

  // All corners must be inside polygon
  return corners.every(corner => isPointInPolygon(corner, vertices));
}

/**
 * Check if rectangle intersects with polygon boundary (even if not fully inside)
 * Time complexity: O(n) where n = number of vertices
 *
 * Useful for detecting partial overlaps.
 *
 * @param rect - Rectangle with x, y, width, height in cm
 * @param vertices - Polygon vertices [[x1, y1], [x2, y2], ...]
 * @returns true if any corner is inside polygon OR polygon has vertex inside rect
 */
export function doesRectangleIntersectPolygon(
  rect: { x: number; y: number; width: number; height: number },
  vertices: [number, number][]
): boolean {
  // Check if any corner of rectangle is inside polygon
  const corners: [number, number][] = [
    [rect.x, rect.y],
    [rect.x + rect.width, rect.y],
    [rect.x + rect.width, rect.y + rect.height],
    [rect.x, rect.y + rect.height]
  ];

  if (corners.some(corner => isPointInPolygon(corner, vertices))) {
    return true;
  }

  // Check if any vertex of polygon is inside rectangle
  const rectBbox = {
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height
  };

  return vertices.some(vertex => isPointInBoundingBox(vertex, rectBbox));
}

/**
 * Calculate centroid (geometric center) of polygon
 * Time complexity: O(n) where n = number of vertices
 *
 * @param vertices - Polygon vertices [[x1, y1], [x2, y2], ...]
 * @returns centroid [x, y] in cm
 */
export function calculatePolygonCentroid(
  vertices: [number, number][]
): [number, number] {
  const n = vertices.length;
  let sumX = 0, sumY = 0;

  for (const [x, y] of vertices) {
    sumX += x;
    sumY += y;
  }

  return [sumX / n, sumY / n];
}
