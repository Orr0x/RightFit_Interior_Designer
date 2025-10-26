/**
 * Unit Tests for CoordinateTransformEngine
 *
 * Tests Winston's NEW UNIFIED SYSTEM for coordinate transformations.
 * Validates all transformations meet <0.1cm accuracy target.
 *
 * Story: 1.2 - Implement CoordinateTransformEngine
 * Epic: Epic 1 - Eliminate Circular Dependency Patterns
 */

import { describe, it, expect, beforeEach } from '@playwright/test';
import {
  CoordinateTransformEngine,
  initializeCoordinateEngine,
  getCoordinateEngine,
  clearCoordinateEngine,
  type RoomDimensions,
  type PlanCoordinates,
  type CanvasCoordinates,
  type ThreeJSPosition,
  type ElevationWall
} from './CoordinateTransformEngine';

describe('CoordinateTransformEngine', () => {
  let engine: CoordinateTransformEngine;
  const testRoom: RoomDimensions = {
    width: 400,  // 4m wide
    height: 600, // 6m deep (legacy "height" = depth)
    ceilingHeight: 240 // 2.4m tall
  };

  beforeEach(() => {
    clearCoordinateEngine();
    engine = new CoordinateTransformEngine(testRoom);
  });

  describe('Plan to Canvas Transformations', () => {
    it('should convert plan coordinates to canvas with zoom 1.0', () => {
      const plan: PlanCoordinates = { x: 100, y: 80 };
      const canvas = engine.planToCanvas(plan, 1.0);

      expect(canvas.x).toBe(100);
      expect(canvas.y).toBe(80);
    });

    it('should convert plan coordinates to canvas with zoom 1.5', () => {
      const plan: PlanCoordinates = { x: 100, y: 80 };
      const canvas = engine.planToCanvas(plan, 1.5);

      expect(canvas.x).toBe(150);
      expect(canvas.y).toBe(120);
    });

    it('should handle corner position (0,0)', () => {
      const plan: PlanCoordinates = { x: 0, y: 0 };
      const canvas = engine.planToCanvas(plan, 2.0);

      expect(canvas.x).toBe(0);
      expect(canvas.y).toBe(0);
    });

    it('should handle room far corner', () => {
      const plan: PlanCoordinates = { x: 400, y: 600 };
      const canvas = engine.planToCanvas(plan, 1.0);

      expect(canvas.x).toBe(400);
      expect(canvas.y).toBe(600);
    });
  });

  describe('Canvas to Plan Transformations', () => {
    it('should reverse plan to canvas transformation', () => {
      const original: PlanCoordinates = { x: 100, y: 80 };
      const canvas = engine.planToCanvas(original, 1.5);
      const result = engine.canvasToPlan(canvas, 1.5);

      expect(result.x).toBeCloseTo(100, 10);
      expect(result.y).toBeCloseTo(80, 10);
    });

    it('should convert canvas to plan with zoom 2.0', () => {
      const canvas: CanvasCoordinates = { x: 200, y: 160 };
      const plan = engine.canvasToPlan(canvas, 2.0);

      expect(plan.x).toBe(100);
      expect(plan.y).toBe(80);
    });
  });

  describe('Plan to Elevation Transformations - Front Wall', () => {
    it('should map X coordinate for horizontal position on front wall', () => {
      const plan: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 140 };
      const elevation = engine.planToElevation(
        plan,
        'front',
        800,  // canvas width
        600,  // canvas height
        70,   // element height
        1.0   // zoom
      );

      // Front wall uses X: (100 / 400) * 800 = 200
      expect(elevation.canvasX).toBeCloseTo(200, 1);
      expect(elevation.shouldMirror).toBe(false);
    });

    it('should calculate vertical position from ceiling', () => {
      const plan: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 140 };
      const elevation = engine.planToElevation(
        plan,
        'front',
        800,
        600,
        70,
        1.0
      );

      // Vertical: (240 - 140 - 70) * 1.0 = 30px from top
      expect(elevation.canvasY).toBeCloseTo(30, 1);
    });
  });

  describe('Plan to Elevation Transformations - Left Wall (NEW UNIFIED SYSTEM)', () => {
    it('should use unified calculation (same as right wall before mirroring)', () => {
      const plan: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 140 };
      const leftElev = engine.planToElevation(plan, 'left', 800, 600, 70, 1.0);
      const rightElev = engine.planToElevation(plan, 'right', 800, 600, 70, 1.0);

      // Both use: (80 / 600) * 800 = 106.67px (before mirroring)
      expect(leftElev.canvasX).toBeCloseTo(rightElev.canvasX, 1);

      // Left has mirror flag, right doesn't
      expect(leftElev.shouldMirror).toBe(true);
      expect(rightElev.shouldMirror).toBe(false);
    });

    it('should set shouldMirror flag for left wall', () => {
      const plan: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 140 };
      const elevation = engine.planToElevation(plan, 'left', 800, 600, 70, 1.0);

      expect(elevation.shouldMirror).toBe(true);
    });

    it('should map Y coordinate (depth) for horizontal position', () => {
      const plan: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 140 };
      const elevation = engine.planToElevation(plan, 'left', 800, 600, 70, 1.0);

      // Left wall uses Y: (80 / 600) * 800 = 106.67px
      expect(elevation.canvasX).toBeCloseTo(106.67, 1);
    });
  });

  describe('Plan to Elevation Transformations - Right Wall', () => {
    it('should NOT mirror right wall', () => {
      const plan: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 140 };
      const elevation = engine.planToElevation(plan, 'right', 800, 600, 70, 1.0);

      expect(elevation.shouldMirror).toBe(false);
    });

    it('should map Y coordinate for horizontal position', () => {
      const plan: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 140 };
      const elevation = engine.planToElevation(plan, 'right', 800, 600, 70, 1.0);

      // Right wall uses Y: (80 / 600) * 800 = 106.67px
      expect(elevation.canvasX).toBeCloseTo(106.67, 1);
    });
  });

  describe('Plan to 3D Transformations', () => {
    it('should convert plan coordinates to centered 3D position', () => {
      const plan: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 0 };
      const pos3d = engine.planTo3D(plan, 86); // 86cm tall element

      // X: -roomWidth/2 + x/100 = -2.0 + 1.0 = -1.0m
      expect(pos3d.x).toBeCloseTo(-1.0, 2);

      // Y: z/100 + height/200 = 0 + 0.43 = 0.43m
      expect(pos3d.y).toBeCloseTo(0.43, 2);

      // Z: -roomDepth/2 + y/100 = -3.0 + 0.8 = -2.2m
      expect(pos3d.z).toBeCloseTo(-2.2, 2);
    });

    it('should handle corner position in 3D', () => {
      const plan: PlanCoordinates & { z: number } = { x: 0, y: 0, z: 0 };
      const pos3d = engine.planTo3D(plan, 90);

      // Corner should be at -width/2, height/2, -depth/2
      expect(pos3d.x).toBeCloseTo(-2.0, 2);
      expect(pos3d.y).toBeCloseTo(0.45, 2); // 90cm element center
      expect(pos3d.z).toBeCloseTo(-3.0, 2);
    });

    it('should handle center position in 3D', () => {
      const plan: PlanCoordinates & { z: number } = { x: 200, y: 300, z: 0 };
      const pos3d = engine.planTo3D(plan, 100);

      // Center should be at (0, height/2, 0)
      expect(pos3d.x).toBeCloseTo(0.0, 2);
      expect(pos3d.y).toBeCloseTo(0.5, 2); // 100cm element center
      expect(pos3d.z).toBeCloseTo(0.0, 2);
    });
  });

  describe('3D to Plan Transformations', () => {
    it('should reverse plan to 3D transformation', () => {
      const original: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 0 };
      const pos3d = engine.planTo3D(original, 86);
      const result = engine.threeJSToPlan(pos3d, 86);

      expect(result.x).toBeCloseTo(100, 1);
      expect(result.y).toBeCloseTo(80, 1);
      expect(result.z).toBeCloseTo(0, 1);
    });

    it('should convert 3D position back to plan coordinates', () => {
      const pos3d: ThreeJSPosition = { x: -1.0, y: 0.43, z: -2.2 };
      const plan = engine.threeJSToPlan(pos3d, 86);

      expect(plan.x).toBeCloseTo(100, 1);
      expect(plan.y).toBeCloseTo(80, 1);
      expect(plan.z).toBeCloseTo(0, 1);
    });
  });

  describe('Round-Trip Consistency Validation', () => {
    it('should maintain <0.1cm error for corner position', () => {
      const plan: PlanCoordinates & { z: number } = { x: 0, y: 0, z: 0 };
      const error = engine.validateConsistency(plan, 90);

      expect(error).toBeLessThan(0.1);
    });

    it('should maintain <0.1cm error for arbitrary position', () => {
      const plan: PlanCoordinates & { z: number } = { x: 123.45, y: 234.56, z: 75 };
      const error = engine.validateConsistency(plan, 70);

      expect(error).toBeLessThan(0.1);
    });

    it('should maintain <0.1cm error for center position', () => {
      const plan: PlanCoordinates & { z: number } = { x: 200, y: 300, z: 100 };
      const error = engine.validateConsistency(plan, 100);

      expect(error).toBeLessThan(0.1);
    });

    it('should maintain <0.1cm error for room far corner', () => {
      const plan: PlanCoordinates & { z: number } = { x: 400, y: 600, z: 0 };
      const error = engine.validateConsistency(plan, 86);

      expect(error).toBeLessThan(0.1);
    });

    it('should have near-zero error for integer positions', () => {
      const plan: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 0 };
      const error = engine.validateConsistency(plan, 86);

      // Integer positions should have extremely low error
      expect(error).toBeLessThan(0.01);
    });
  });

  describe('Factory Functions', () => {
    it('should initialize engine with factory function', () => {
      const factoryEngine = initializeCoordinateEngine(testRoom);
      const plan: PlanCoordinates = { x: 100, y: 80 };
      const canvas = factoryEngine.planToCanvas(plan, 1.0);

      expect(canvas.x).toBe(100);
      expect(canvas.y).toBe(80);
    });

    it('should get global engine instance', () => {
      initializeCoordinateEngine(testRoom);
      const globalEngine = getCoordinateEngine();

      const plan: PlanCoordinates = { x: 100, y: 80 };
      const canvas = globalEngine.planToCanvas(plan, 1.0);

      expect(canvas.x).toBe(100);
    });

    it('should throw error if global engine not initialized', () => {
      clearCoordinateEngine();

      expect(() => getCoordinateEngine()).toThrow(
        'CoordinateTransformEngine not initialized'
      );
    });

    it('should clear global engine', () => {
      initializeCoordinateEngine(testRoom);
      clearCoordinateEngine();

      expect(() => getCoordinateEngine()).toThrow();
    });
  });

  describe('Room Dimensions Methods', () => {
    it('should return room dimensions', () => {
      const dims = engine.getRoomDimensions();

      expect(dims.width).toBe(400);
      expect(dims.height).toBe(600);
      expect(dims.ceilingHeight).toBe(240);
    });

    it('should create new engine with different dimensions', () => {
      const newDims: RoomDimensions = {
        width: 500,
        height: 700,
        ceilingHeight: 270
      };

      const newEngine = engine.withDimensions(newDims);
      const dims = newEngine.getRoomDimensions();

      expect(dims.width).toBe(500);
      expect(dims.height).toBe(700);
      expect(dims.ceilingHeight).toBe(270);

      // Original engine unchanged
      const originalDims = engine.getRoomDimensions();
      expect(originalDims.width).toBe(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero zoom (edge case - avoid in production)', () => {
      const plan: PlanCoordinates = { x: 100, y: 80 };

      // This would cause division by zero in canvasToPlan
      // Engine doesn't validate - caller responsibility
      expect(() => engine.planToCanvas(plan, 0)).not.toThrow();
    });

    it('should handle very small element heights', () => {
      const plan: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 0 };
      const pos3d = engine.planTo3D(plan, 1); // 1cm tall element

      expect(pos3d.y).toBeCloseTo(0.005, 3); // 0.5cm above floor
    });

    it('should handle ceiling-height elements', () => {
      const plan: PlanCoordinates & { z: number } = { x: 100, y: 80, z: 0 };
      const pos3d = engine.planTo3D(plan, 240); // Ceiling height element

      expect(pos3d.y).toBeCloseTo(1.2, 2); // Center at 1.2m
    });
  });

  describe('Symmetric Test Cases', () => {
    it('should produce symmetric X coordinates for front/back walls', () => {
      const planLeft: PlanCoordinates & { z: number } = { x: 100, y: 300, z: 100 };
      const planRight: PlanCoordinates & { z: number } = { x: 300, y: 300, z: 100 };

      const frontLeft = engine.planToElevation(planLeft, 'front', 800, 600, 70, 1.0);
      const frontRight = engine.planToElevation(planRight, 'front', 800, 600, 70, 1.0);

      // 100cm vs 300cm should be symmetric around center (200cm)
      const leftDistance = frontLeft.canvasX;
      const rightDistance = 800 - frontRight.canvasX;

      // Should be approximately equal distances from edges
      expect(Math.abs(leftDistance - rightDistance)).toBeLessThan(1);
    });

    it('should produce consistent Y coordinates for left/right walls (UNIFIED)', () => {
      const plan: PlanCoordinates & { z: number } = { x: 200, y: 100, z: 100 };

      const leftElev = engine.planToElevation(plan, 'left', 800, 600, 70, 1.0);
      const rightElev = engine.planToElevation(plan, 'right', 800, 600, 70, 1.0);

      // NEW UNIFIED SYSTEM: Both use same calculation
      expect(leftElev.canvasX).toBeCloseTo(rightElev.canvasX, 1);

      // Only difference is mirror flag
      expect(leftElev.shouldMirror).toBe(true);
      expect(rightElev.shouldMirror).toBe(false);
    });
  });
});
