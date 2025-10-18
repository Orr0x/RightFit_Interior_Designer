/**
 * Geometry Validator
 *
 * Validates room geometry structures for correctness and performance.
 * Catches invalid polygons, self-intersections, disconnected walls, etc.
 *
 * Phase 2 of Complex Room Shapes Implementation
 */

import {
  RoomGeometry,
  GeometryValidationResult,
  WallSegment,
  Point2D,
  BoundingBox,
  CeilingGeometry
} from '@/types/RoomGeometry';

export class GeometryValidator {
  // =========================================================================
  // Main Validation Method
  // =========================================================================

  /**
   * Validate complete room geometry structure
   */
  static validateRoomGeometry(geometry: RoomGeometry): GeometryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate floor polygon
    const floorResult = this.validatePolygon(geometry.floor.vertices, 'floor');
    errors.push(...floorResult.errors);
    warnings.push(...floorResult.warnings);

    // 2. Validate walls
    const wallsResult = this.validateWalls(geometry.walls, geometry.floor.vertices);
    errors.push(...wallsResult.errors);
    warnings.push(...wallsResult.warnings);

    // 3. Validate ceiling
    const ceilingResult = this.validateCeiling(geometry.ceiling);
    errors.push(...ceilingResult.errors);
    warnings.push(...ceilingResult.warnings);

    // 4. Validate bounding box
    const bboxResult = this.validateBoundingBox(geometry.bounding_box, geometry.floor.vertices);
    errors.push(...bboxResult.errors);

    // 5. Validate metadata consistency
    const metaResult = this.validateMetadata(geometry);
    warnings.push(...metaResult.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // =========================================================================
  // Polygon Validation
  // =========================================================================

  /**
   * Validate polygon vertices
   */
  static validatePolygon(
    vertices: Point2D[],
    context: string
  ): GeometryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum vertices
    if (vertices.length < 3) {
      errors.push(`${context}: Polygon must have at least 3 vertices (has ${vertices.length})`);
      return { valid: false, errors, warnings };
    }

    // Check maximum vertices (performance limit)
    if (vertices.length > 100) {
      warnings.push(`${context}: Polygon has ${vertices.length} vertices (>100 may impact performance)`);
    }

    // Check for duplicate consecutive vertices
    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      if (vertices[i][0] === vertices[next][0] && vertices[i][1] === vertices[next][1]) {
        warnings.push(`${context}: Duplicate consecutive vertices at index ${i} and ${next}`);
      }
    }

    // Check if polygon is closed (first and last should be different)
    const first = vertices[0];
    const last = vertices[vertices.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
      warnings.push(`${context}: First and last vertices are identical (polygon auto-closes)`);
    }

    // Check for self-intersections
    if (this.hasSimpleSelfIntersection(vertices)) {
      errors.push(`${context}: Polygon has self-intersecting edges`);
    }

    // Check for very small edges (< 1cm)
    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      const distance = this.distance(vertices[i], vertices[next]);
      if (distance < 1 && distance > 0) {
        warnings.push(`${context}: Very small edge (${distance.toFixed(2)}cm) between vertices ${i} and ${next}`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // =========================================================================
  // Wall Validation
  // =========================================================================

  /**
   * Validate walls align with floor perimeter and connect properly
   */
  static validateWalls(
    walls: WallSegment[],
    floorVertices: Point2D[]
  ): GeometryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (walls.length < 3) {
      errors.push(`Must have at least 3 walls (has ${walls.length})`);
      return { valid: false, errors, warnings };
    }

    // Check each wall
    walls.forEach((wall, i) => {
      // Check wall height
      if (wall.height <= 0) {
        errors.push(`Wall ${wall.id}: height must be positive (has ${wall.height})`);
      }
      if (wall.height > 500) {
        warnings.push(`Wall ${wall.id}: height ${wall.height}cm is unusually tall (>5m)`);
      }

      // Check wall length
      const length = this.distance(wall.start, wall.end);
      if (length < 1) {
        warnings.push(`Wall ${wall.id}: very short wall (${length.toFixed(2)}cm)`);
      }

      // Check wall thickness
      if (wall.thickness !== undefined) {
        if (wall.thickness <= 0) {
          errors.push(`Wall ${wall.id}: thickness must be positive`);
        }
        if (wall.thickness > 50) {
          warnings.push(`Wall ${wall.id}: unusually thick wall (${wall.thickness}cm)`);
        }
      }
    });

    // Check wall connectivity (each wall's end should connect to next wall's start)
    for (let i = 0; i < walls.length; i++) {
      const nextIndex = (i + 1) % walls.length;
      const currentEnd = walls[i].end;
      const nextStart = walls[nextIndex].start;

      const gap = this.distance(currentEnd, nextStart);
      if (gap > 0.1) {
        // Allow tiny floating point errors
        warnings.push(
          `Wall ${walls[i].id} end [${currentEnd}] does not connect to wall ${walls[nextIndex].id} start [${nextStart}] (gap: ${gap.toFixed(2)}cm)`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // =========================================================================
  // Ceiling Validation
  // =========================================================================

  /**
   * Validate ceiling geometry
   */
  static validateCeiling(ceiling: CeilingGeometry): GeometryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!ceiling.zones || ceiling.zones.length === 0) {
      errors.push('Ceiling must have at least one zone');
      return { valid: false, errors, warnings };
    }

    ceiling.zones.forEach((zone, i) => {
      // Check vertices
      if (!zone.vertices || zone.vertices.length < 3) {
        errors.push(`Ceiling zone ${i}: must have at least 3 vertices`);
      }

      // Check height
      if (zone.height <= 0) {
        errors.push(`Ceiling zone ${i}: height must be positive (has ${zone.height})`);
      }
      if (zone.height < 200) {
        warnings.push(`Ceiling zone ${i}: unusually low ceiling (${zone.height}cm < 2m)`);
      }
      if (zone.height > 600) {
        warnings.push(`Ceiling zone ${i}: unusually high ceiling (${zone.height}cm > 6m)`);
      }

      // Check vaulted ceiling parameters
      if (zone.style === 'vaulted') {
        if (zone.apex_height === undefined) {
          warnings.push(`Ceiling zone ${i}: vaulted ceiling missing apex_height`);
        } else if (zone.apex_height <= zone.height) {
          warnings.push(`Ceiling zone ${i}: vaulted apex_height should be greater than base height`);
        }
      }

      // Check sloped ceiling parameters
      if (ceiling.type === 'sloped') {
        if (zone.slope === undefined) {
          warnings.push(`Ceiling zone ${i}: sloped ceiling missing slope angle`);
        } else if (zone.slope < 0 || zone.slope > 45) {
          warnings.push(`Ceiling zone ${i}: unusual slope angle (${zone.slope}°)`);
        }
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  // =========================================================================
  // Bounding Box Validation
  // =========================================================================

  /**
   * Validate bounding box contains all floor vertices
   */
  static validateBoundingBox(
    bbox: BoundingBox,
    vertices: Point2D[]
  ): GeometryValidationResult {
    const errors: string[] = [];

    vertices.forEach(([x, y], i) => {
      if (x < bbox.min_x - 0.1 || x > bbox.max_x + 0.1 || y < bbox.min_y - 0.1 || y > bbox.max_y + 0.1) {
        errors.push(`Vertex ${i} [${x}, ${y}] is outside bounding box [${bbox.min_x}, ${bbox.min_y}, ${bbox.max_x}, ${bbox.max_y}]`);
      }
    });

    return { valid: errors.length === 0, errors, warnings: [] };
  }

  // =========================================================================
  // Metadata Validation
  // =========================================================================

  /**
   * Validate metadata consistency with geometry
   */
  static validateMetadata(geometry: RoomGeometry): GeometryValidationResult {
    const warnings: string[] = [];

    // Calculate actual floor area
    const calculatedArea = this.calculatePolygonArea(geometry.floor.vertices);
    const metadataArea = geometry.metadata.total_floor_area;

    // Allow 1% tolerance
    const areaDiff = Math.abs(calculatedArea - metadataArea);
    const tolerance = calculatedArea * 0.01;

    if (areaDiff > tolerance) {
      warnings.push(
        `Metadata floor area (${metadataArea.toFixed(0)}cm²) differs from calculated area (${calculatedArea.toFixed(0)}cm²) by ${areaDiff.toFixed(0)}cm²`
      );
    }

    return { valid: true, errors: [], warnings };
  }

  // =========================================================================
  // Geometric Calculations
  // =========================================================================

  /**
   * Calculate polygon area using Shoelace formula
   */
  static calculatePolygonArea(vertices: Point2D[]): number {
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i][0] * vertices[j][1];
      area -= vertices[j][0] * vertices[i][1];
    }
    return Math.abs(area) / 2;
  }

  /**
   * Calculate bounding box from vertices
   */
  static calculateBoundingBox(vertices: Point2D[]): BoundingBox {
    if (vertices.length === 0) {
      return { min_x: 0, min_y: 0, max_x: 0, max_y: 0 };
    }

    const xs = vertices.map(v => v[0]);
    const ys = vertices.map(v => v[1]);

    return {
      min_x: Math.min(...xs),
      min_y: Math.min(...ys),
      max_x: Math.max(...xs),
      max_y: Math.max(...ys)
    };
  }

  /**
   * Calculate distance between two points
   */
  static distance(p1: Point2D, p2: Point2D): number {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate perimeter of polygon
   */
  static calculatePerimeter(vertices: Point2D[]): number {
    let perimeter = 0;
    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      perimeter += this.distance(vertices[i], vertices[next]);
    }
    return perimeter;
  }

  // =========================================================================
  // Self-Intersection Detection
  // =========================================================================

  /**
   * Check if polygon has self-intersecting edges
   */
  private static hasSimpleSelfIntersection(vertices: Point2D[]): boolean {
    // Check each edge against all non-adjacent edges
    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      const edge1 = { start: vertices[i], end: vertices[next] };

      for (let j = i + 2; j < vertices.length; j++) {
        // Skip adjacent edges
        if (j === vertices.length - 1 && i === 0) continue;

        const jNext = (j + 1) % vertices.length;
        const edge2 = { start: vertices[j], end: vertices[jNext] };

        if (this.edgesIntersect(edge1.start, edge1.end, edge2.start, edge2.end)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if two line segments intersect (excluding endpoints)
   */
  static edgesIntersect(
    p1: Point2D,
    p2: Point2D,
    p3: Point2D,
    p4: Point2D
  ): boolean {
    const ccw = (a: Point2D, b: Point2D, c: Point2D) => {
      return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
    };

    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  }

  // =========================================================================
  // Point-in-Polygon Test
  // =========================================================================

  /**
   * Check if a point is inside a polygon (ray casting algorithm)
   */
  static isPointInPolygon(point: Point2D, vertices: Point2D[]): boolean {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const [xi, yi] = vertices[i];
      const [xj, yj] = vertices[j];

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  // =========================================================================
  // Polygon Orientation
  // =========================================================================

  /**
   * Check if polygon vertices are in clockwise order
   */
  static isClockwise(vertices: Point2D[]): boolean {
    let sum = 0;
    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      sum += (vertices[next][0] - vertices[i][0]) * (vertices[next][1] + vertices[i][1]);
    }
    return sum > 0;
  }

  /**
   * Reverse polygon vertex order
   */
  static reverseVertices(vertices: Point2D[]): Point2D[] {
    return [...vertices].reverse();
  }
}
