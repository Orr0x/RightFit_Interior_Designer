/**
 * CoordinateTransformEngine - Unified Coordinate Transformation System
 *
 * Purpose: Eliminate Winston's Circular Pattern #1 (Positioning Coordinate Circle)
 * by providing a single source of truth for all coordinate transformations.
 *
 * This engine ensures mathematical consistency across all view types:
 * - Plan View (2D top-down, cm from top-left)
 * - Elevation Views (2D side views, cm from top-left)
 * - 3D View (Three.js meters from room center)
 *
 * Story: 1.2 - Implement CoordinateTransformEngine
 * Epic: Epic 1 - Eliminate Circular Dependency Patterns
 * Date: 2025-10-26
 *
 * @see docs/coordinate-system-visual-guide.md for visual diagrams
 * @see docs/circular-patterns-fix-plan.md#fix-1 for implementation plan
 */

export interface RoomDimensions {
  width: number;          // X-axis width in cm (left to right)
  height: number;         // Y-axis depth in cm (front to back) - Legacy name for "depth"
  ceilingHeight?: number; // Z-axis height in cm (floor to ceiling)
}

export interface PlanCoordinates {
  x: number;  // cm from left wall (0 = left edge)
  y: number;  // cm from front wall (0 = front edge)
  z?: number; // cm above floor (0 = floor level)
}

export interface CanvasCoordinates {
  x: number;  // pixels from canvas left edge
  y: number;  // pixels from canvas top edge
}

export interface ThreeJSPosition {
  x: number;  // meters from room center (-width/2 to +width/2)
  y: number;  // meters above floor (vertical)
  z: number;  // meters from room center (-depth/2 to +depth/2)
}

export interface ElevationCoordinates {
  canvasX: number;   // pixels horizontal position
  canvasY: number;   // pixels vertical position
  shouldMirror: boolean;  // true for left wall (apply mirroring at render time)
}

export type ElevationWall = 'front' | 'back' | 'left' | 'right';

/**
 * Coordinate Transformation Engine
 *
 * Provides bidirectional transformations between all coordinate systems used
 * in the RightFit Interior Designer application.
 *
 * **Coordinate Systems**:
 * 1. **Plan View**: Top-down 2D, cm from top-left corner (0,0)
 * 2. **Canvas**: Pixel coordinates with zoom factor applied
 * 3. **Elevation**: 2D side view, cm mapped to canvas pixels
 * 4. **Three.JS**: 3D world space, meters from room center
 *
 * **Key Principles**:
 * - All transformations are pure functions (no side effects)
 * - Accuracy target: <0.1cm for round-trip transformations
 * - Left/right elevation mirroring applied at RENDER time, not in coordinates
 * - 3D uses meters and centered origin, 2D uses cm and top-left origin
 *
 * @example
 * ```typescript
 * const engine = new CoordinateTransformEngine({
 *   width: 400,
 *   height: 600,
 *   ceilingHeight: 240
 * });
 *
 * // Plan to canvas
 * const canvas = engine.planToCanvas({ x: 100, y: 80 }, 1.5);
 * // → { x: 150, y: 120 }
 *
 * // Plan to 3D
 * const pos3d = engine.planTo3D({ x: 100, y: 80, z: 0 }, 86);
 * // → { x: -1.0, y: 0.43, z: -2.2 } in meters
 *
 * // Validate round-trip
 * const error = engine.validateConsistency({ x: 100, y: 80, z: 0 }, 86);
 * // → error < 0.1cm
 * ```
 */
export class CoordinateTransformEngine {
  private roomDimensions: RoomDimensions;

  constructor(roomDimensions: RoomDimensions) {
    this.roomDimensions = roomDimensions;
  }

  /**
   * Transform plan view coordinates to canvas pixel coordinates
   *
   * **Coordinate System**: Plan View (cm) → Canvas (px)
   * **Origin**: Top-left (0,0) in both systems
   * **Formula**:
   * - canvasX = planX * zoom
   * - canvasY = planY * zoom
   *
   * @param plan - Plan coordinates in cm (x, y from top-left)
   * @param zoom - Zoom factor (1.0 = 1cm per pixel, 2.0 = 2px per cm)
   * @returns Canvas coordinates in pixels
   *
   * @example
   * ```typescript
   * // Component at 100cm from left, 80cm from front, zoom 1.5x
   * const canvas = engine.planToCanvas({ x: 100, y: 80 }, 1.5);
   * // → { x: 150, y: 120 } pixels
   * ```
   */
  planToCanvas(plan: PlanCoordinates, zoom: number): CanvasCoordinates {
    return {
      x: plan.x * zoom,
      y: plan.y * zoom
    };
  }

  /**
   * Transform canvas pixel coordinates back to plan view coordinates
   *
   * **Coordinate System**: Canvas (px) → Plan View (cm)
   * **Origin**: Top-left (0,0) in both systems
   * **Formula**:
   * - planX = canvasX / zoom
   * - planY = canvasY / zoom
   *
   * @param canvas - Canvas coordinates in pixels
   * @param zoom - Zoom factor (1.0 = 1cm per pixel)
   * @returns Plan coordinates in cm
   *
   * @example
   * ```typescript
   * // Click at pixel (150, 120) with zoom 1.5x
   * const plan = engine.canvasToPlan({ x: 150, y: 120 }, 1.5);
   * // → { x: 100, y: 80 } cm from top-left
   * ```
   */
  canvasToPlan(canvas: CanvasCoordinates, zoom: number): PlanCoordinates {
    return {
      x: canvas.x / zoom,
      y: canvas.y / zoom
    };
  }

  /**
   * Transform plan coordinates to elevation view canvas coordinates
   *
   * **Coordinate System**: Plan View (cm) → Elevation Canvas (px)
   * **Origin**: Plan is top-left, Elevation is canvas top-left
   *
   * **Wall-Specific Mapping**:
   * - **Front/Back walls**: Uses plan.x for horizontal position
   * - **Left/Right walls**: Uses plan.y for horizontal position
   * - **Vertical position**: Uses plan.z (height above floor)
   *
   * **Mirroring Strategy** (NEW UNIFIED SYSTEM):
   * - Front/Back/Right: No mirroring (shouldMirror = false)
   * - Left: Mirroring flag set (shouldMirror = true), applied at render time
   * - This ensures consistent positioning before mirroring
   *
   * **Formulas**:
   * ```
   * Front/Back walls:
   *   canvasX = (plan.x / roomWidth) * canvasWidth
   *   canvasY = (ceilingHeight - plan.z - elementHeight) * zoom
   *
   * Left wall (UNIFIED):
   *   canvasX = (plan.y / roomDepth) * canvasWidth
   *   shouldMirror = true  // Mirror at render: canvasWidth - canvasX - elementWidth
   *   canvasY = (ceilingHeight - plan.z - elementHeight) * zoom
   *
   * Right wall (UNIFIED):
   *   canvasX = (plan.y / roomDepth) * canvasWidth
   *   shouldMirror = false  // No mirroring
   *   canvasY = (ceilingHeight - plan.z - elementHeight) * zoom
   * ```
   *
   * @param plan - Plan coordinates (x, y from top-left, z above floor)
   * @param wall - Which elevation wall to project onto
   * @param canvasWidth - Width of the elevation canvas in pixels
   * @param canvasHeight - Height of the elevation canvas in pixels
   * @param elementHeight - Height of the element in cm (for Y positioning)
   * @param zoom - Zoom factor for elevation view
   * @returns Elevation canvas coordinates with mirroring flag
   *
   * @example
   * ```typescript
   * // Wall cabinet at (100, 80, 140) on left wall
   * const elevation = engine.planToElevation(
   *   { x: 100, y: 80, z: 140 },
   *   'left',
   *   800,  // canvas width
   *   600,  // canvas height
   *   70,   // cabinet height
   *   1.0   // zoom
   * );
   * // → {
   * //     canvasX: 80,  // Before mirroring
   * //     canvasY: 30,  // From ceiling
   * //     shouldMirror: true  // Apply at render: 800 - 80 - 60 = 660
   * //   }
   * ```
   */
  planToElevation(
    plan: PlanCoordinates & { z: number },
    wall: ElevationWall,
    canvasWidth: number,
    canvasHeight: number,
    elementHeight: number,
    zoom: number
  ): ElevationCoordinates {
    const { width: roomWidth, height: roomDepth, ceilingHeight = 240 } = this.roomDimensions;

    let canvasX: number;
    let shouldMirror: boolean;

    // Horizontal positioning based on wall
    switch (wall) {
      case 'front':
      case 'back':
        // Front/back walls use X coordinate (left-to-right position)
        canvasX = (plan.x / roomWidth) * canvasWidth;
        shouldMirror = false;
        break;

      case 'left':
        // Left wall uses Y coordinate (front-to-back position)
        // UNIFIED SYSTEM: Same calculation as right, mirror at render time
        canvasX = (plan.y / roomDepth) * canvasWidth;
        shouldMirror = true;  // Mirror at render
        break;

      case 'right':
        // Right wall uses Y coordinate (front-to-back position)
        canvasX = (plan.y / roomDepth) * canvasWidth;
        shouldMirror = false;  // No mirroring
        break;
    }

    // Vertical positioning (same for all walls)
    // Position from ceiling, accounting for element height
    const canvasY = (ceilingHeight - plan.z - elementHeight) * zoom;

    return {
      canvasX,
      canvasY,
      shouldMirror
    };
  }

  /**
   * Transform plan coordinates to Three.JS 3D world coordinates
   *
   * **Coordinate System**: Plan View (cm, top-left) → Three.JS (meters, centered)
   *
   * **Coordinate Mapping**:
   * - Plan X (cm from left) → Three.js X (meters from center)
   * - Plan Y (cm from front) → Three.js Z (meters from center)
   * - Plan Z (cm above floor) → Three.js Y (meters above floor)
   *
   * **Origin Transformation**:
   * - Plan: Top-left corner (0, 0, 0)
   * - Three.js: Room center at floor level (0, 0, 0)
   *
   * **Formula**:
   * ```
   * Step 1: Convert to meters
   *   roomWidthMeters = roomWidth / 100
   *   roomDepthMeters = roomDepth / 100
   *
   * Step 2: Calculate room boundaries (centered at origin)
   *   innerLeftBoundary = -roomWidthMeters / 2
   *   innerBackBoundary = -roomDepthMeters / 2
   *
   * Step 3: Convert plan position to meters and center
   *   x3d = innerLeftBoundary + (plan.x / 100)
   *   y3d = (plan.z / 100) + (elementHeight / 100) / 2
   *   z3d = innerBackBoundary + (plan.y / 100)
   * ```
   *
   * @param plan - Plan coordinates (x, y from top-left, z above floor) in cm
   * @param elementHeight - Height of element in cm (for vertical centering)
   * @returns Three.JS position in meters from room center
   *
   * @example
   * ```typescript
   * // Component at (100, 80, 0) in 400×600cm room, 86cm tall
   * const pos3d = engine.planTo3D({ x: 100, y: 80, z: 0 }, 86);
   * // → {
   * //     x: -1.0,   // 1m left of center
   * //     y: 0.43,   // 43cm above floor (center of 86cm cabinet)
   * //     z: -2.2    // 2.2m back from center
   * //   }
   * ```
   */
  planTo3D(plan: PlanCoordinates & { z: number }, elementHeight: number): ThreeJSPosition {
    const { width: roomWidth, height: roomDepth } = this.roomDimensions;

    // Step 1: Convert room dimensions to meters
    const roomWidthMeters = roomWidth / 100;
    const roomDepthMeters = roomDepth / 100;

    // Step 2: Calculate room boundaries (centered at origin)
    const innerLeftBoundary = -roomWidthMeters / 2;
    const innerBackBoundary = -roomDepthMeters / 2;

    // Step 3: Convert plan position to meters and center
    const x = innerLeftBoundary + (plan.x / 100);
    const y = (plan.z / 100) + (elementHeight / 100) / 2;
    const z = innerBackBoundary + (plan.y / 100);

    return { x, y, z };
  }

  /**
   * Transform Three.JS 3D coordinates back to plan view coordinates
   *
   * **Coordinate System**: Three.JS (meters, centered) → Plan View (cm, top-left)
   *
   * **Inverse Transformation**:
   * This is the inverse of `planTo3D()`, reversing the centering and unit conversion.
   *
   * **Formula**:
   * ```
   * Step 1: Calculate room boundaries
   *   innerLeftBoundary = -roomWidthMeters / 2
   *   innerBackBoundary = -roomDepthMeters / 2
   *
   * Step 2: Convert from centered meters to cm
   *   planX = (pos.x - innerLeftBoundary) * 100
   *   planY = (pos.z - innerBackBoundary) * 100
   *   planZ = (pos.y - elementHeight / 200) * 100
   * ```
   *
   * @param pos - Three.JS position in meters from room center
   * @param elementHeight - Height of element in cm (for vertical de-centering)
   * @returns Plan coordinates in cm from top-left
   *
   * @example
   * ```typescript
   * // 3D position at (-1.0, 0.43, -2.2) with 86cm element
   * const plan = engine.threeJSToPlan({ x: -1.0, y: 0.43, z: -2.2 }, 86);
   * // → { x: 100, y: 80, z: 0 }
   * ```
   */
  threeJSToPlan(pos: ThreeJSPosition, elementHeight: number): PlanCoordinates & { z: number } {
    const { width: roomWidth, height: roomDepth } = this.roomDimensions;

    // Step 1: Room dimensions in meters
    const roomWidthMeters = roomWidth / 100;
    const roomDepthMeters = roomDepth / 100;

    // Step 2: Room boundaries (centered at origin)
    const innerLeftBoundary = -roomWidthMeters / 2;
    const innerBackBoundary = -roomDepthMeters / 2;

    // Step 3: Convert from centered meters to cm from top-left
    const x = (pos.x - innerLeftBoundary) * 100;
    const y = (pos.z - innerBackBoundary) * 100;
    const z = (pos.y - (elementHeight / 100) / 2) * 100;

    return { x, y, z };
  }

  /**
   * Validate transformation consistency through round-trip testing
   *
   * **Purpose**: Ensure coordinate transformations are mathematically consistent
   * by testing round-trip accuracy (plan → 3D → plan).
   *
   * **Accuracy Target**: <0.1cm error for round-trip transformations
   *
   * **Test Process**:
   * 1. Start with plan coordinates
   * 2. Transform to 3D: plan → planTo3D() → 3D position
   * 3. Transform back to plan: 3D → threeJSToPlan() → plan coordinates
   * 4. Calculate error: distance between original and final plan coordinates
   *
   * @param originalPlan - Original plan coordinates in cm
   * @param elementHeight - Element height in cm (for vertical centering)
   * @returns Error distance in cm (should be <0.1cm)
   *
   * @example
   * ```typescript
   * // Test round-trip accuracy
   * const error = engine.validateConsistency({ x: 100, y: 80, z: 0 }, 86);
   * console.log(error);  // → 0.0001 cm (acceptable)
   *
   * // Test corner position
   * const cornerError = engine.validateConsistency({ x: 0, y: 0, z: 0 }, 90);
   * console.log(cornerError);  // → 0.0 cm (perfect accuracy)
   * ```
   */
  validateConsistency(
    originalPlan: PlanCoordinates & { z: number },
    elementHeight: number
  ): number {
    // Round-trip: plan → 3D → plan
    const pos3d = this.planTo3D(originalPlan, elementHeight);
    const finalPlan = this.threeJSToPlan(pos3d, elementHeight);

    // Calculate error distance
    const dx = finalPlan.x - originalPlan.x;
    const dy = finalPlan.y - originalPlan.y;
    const dz = finalPlan.z - originalPlan.z;

    const error = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return error;
  }

  /**
   * Get room dimensions used by this engine
   *
   * @returns Current room dimensions
   */
  getRoomDimensions(): RoomDimensions {
    return { ...this.roomDimensions };
  }

  /**
   * Create a new engine with updated room dimensions
   *
   * @param newDimensions - New room dimensions
   * @returns New engine instance
   */
  withDimensions(newDimensions: RoomDimensions): CoordinateTransformEngine {
    return new CoordinateTransformEngine(newDimensions);
  }
}

/**
 * Factory function to initialize coordinate engine
 *
 * @param roomDimensions - Room dimensions in cm
 * @returns Configured coordinate transformation engine
 *
 * @example
 * ```typescript
 * const engine = initializeCoordinateEngine({
 *   width: 400,
 *   height: 600,
 *   ceilingHeight: 240
 * });
 * ```
 */
export function initializeCoordinateEngine(
  roomDimensions: RoomDimensions
): CoordinateTransformEngine {
  return new CoordinateTransformEngine(roomDimensions);
}

// Singleton instance management
let globalEngine: CoordinateTransformEngine | null = null;

/**
 * Get or create the global coordinate engine
 *
 * @param roomDimensions - Room dimensions (required if not yet initialized)
 * @returns Global coordinate engine instance
 */
export function getCoordinateEngine(roomDimensions?: RoomDimensions): CoordinateTransformEngine {
  if (!globalEngine && !roomDimensions) {
    throw new Error('CoordinateTransformEngine not initialized. Provide room dimensions.');
  }

  if (roomDimensions) {
    globalEngine = new CoordinateTransformEngine(roomDimensions);
  }

  return globalEngine!;
}

/**
 * Clear the global engine (useful for testing)
 */
export function clearCoordinateEngine(): void {
  globalEngine = null;
}

export default CoordinateTransformEngine;
