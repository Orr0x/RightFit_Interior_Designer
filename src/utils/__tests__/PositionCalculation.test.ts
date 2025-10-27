/**
 * PositionCalculation Unit Tests
 *
 * Tests the NEW UNIFIED SYSTEM for elevation position calculations using
 * CoordinateTransformEngine
 *
 * Story: 1.3 - Refactor to use CoordinateTransformEngine
 * Epic: Epic 1 - Eliminate Circular Dependency Patterns
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PositionCalculation, type RoomDimensions, type RoomPosition, type ViewType } from '../PositionCalculation';
import type { DesignElement } from '@/types/project';

describe('PositionCalculation', () => {
  const testRoom: RoomDimensions = {
    width: 400,  // 4m wide
    height: 600  // 6m deep (legacy "height" = depth)
  };

  const testRoomPosition: RoomPosition = {
    innerX: 100,
    innerY: 100,
    outerX: 90,
    outerY: 90
  };

  describe('calculateElevationPosition', () => {
    describe('Front/Back View Calculations', () => {
      it('should calculate position for front view using X coordinate', () => {
        const element: Partial<DesignElement> = {
          x: 100, // 1m from left
          y: 50,
          width: 60,
          depth: 60,
          type: 'cabinet'
        };

        const result = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'front',
          1.0
        );

        // X position: innerX + (x / room.width) * elevationWidth
        // 100 + (100 / 400) * 400 = 100 + 100 = 200
        expect(result.xPos).toBe(200);

        // Element width: (width / room.width) * elevationWidth
        // (60 / 400) * 400 = 60
        expect(result.elementWidth).toBe(60);
      });

      it('should calculate position for back view using X coordinate', () => {
        const element: Partial<DesignElement> = {
          x: 200,
          y: 50,
          width: 80,
          depth: 60,
          type: 'cabinet'
        };

        const result = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'back',
          1.0
        );

        // X position: 100 + (200 / 400) * 400 = 100 + 200 = 300
        expect(result.xPos).toBe(300);

        // Element width: (80 / 400) * 400 = 80
        expect(result.elementWidth).toBe(80);
      });

      it('should handle zoom correctly for front view', () => {
        const element: Partial<DesignElement> = {
          x: 100,
          y: 50,
          width: 60,
          depth: 60,
          type: 'cabinet'
        };

        const result = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'front',
          2.0  // 2x zoom
        );

        // Elevation width with zoom: 400 * 2.0 = 800
        // X position: 100 + (100 / 400) * 800 = 100 + 200 = 300
        expect(result.xPos).toBe(300);

        // Element width: (60 / 400) * 800 = 120
        expect(result.elementWidth).toBe(120);
      });
    });

    describe('Left/Right View Calculations (NEW UNIFIED SYSTEM)', () => {
      it('should calculate position for left view using CoordinateTransformEngine', () => {
        const element: Partial<DesignElement> = {
          x: 100,
          y: 200, // 2m from front (Y coordinate used for side views)
          z: 0,
          width: 60,
          depth: 60,
          height: 90,
          type: 'cabinet'
        };

        const result = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'left',
          1.0
        );

        // Left view uses Y coordinate for horizontal position
        // Engine transforms: y=200 in 600cm room → canvas position
        // Expect xPos to be calculated via engine
        expect(result.xPos).toBeGreaterThan(0);
        expect(result.elementWidth).toBeGreaterThan(0);
      });

      it('should calculate position for right view using CoordinateTransformEngine', () => {
        const element: Partial<DesignElement> = {
          x: 100,
          y: 300,
          z: 0,
          width: 60,
          depth: 60,
          height: 90,
          type: 'cabinet'
        };

        const result = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'right',
          1.0
        );

        // Right view also uses Y coordinate
        expect(result.xPos).toBeGreaterThan(0);
        expect(result.elementWidth).toBeGreaterThan(0);
      });

      it('should handle counter-top element width correctly in side views', () => {
        const element: Partial<DesignElement> = {
          x: 100,
          y: 200,
          z: 86,
          width: 100,
          depth: 60,
          height: 4,
          type: 'counter-top'
        };

        const result = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'left',
          1.0
        );

        // Counter-tops use depth for width calculation in side views
        // (depth / room.height) * elevationDepth
        // (60 / 600) * 600 = 60
        expect(result.elementWidth).toBe(60);
      });

      it('should respect zoom in side views', () => {
        const element: Partial<DesignElement> = {
          x: 100,
          y: 200,
          z: 0,
          width: 60,
          depth: 60,
          height: 90,
          type: 'cabinet'
        };

        const result1x = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'left',
          1.0
        );

        const result2x = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'left',
          2.0
        );

        // With 2x zoom, element width should be roughly 2x
        expect(result2x.elementWidth).toBeGreaterThan(result1x.elementWidth * 1.8);
        expect(result2x.elementWidth).toBeLessThan(result1x.elementWidth * 2.2);
      });
    });

    describe('Plan View Calculations', () => {
      it('should calculate position for plan view using X coordinate', () => {
        const element: Partial<DesignElement> = {
          x: 150,
          y: 200,
          width: 60,
          depth: 60,
          type: 'cabinet'
        };

        const result = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'plan',
          1.0
        );

        // Plan view uses X coordinate like front/back
        // X position: 100 + (150 / 400) * 400 = 100 + 150 = 250
        expect(result.xPos).toBe(250);

        // Element width: (60 / 400) * 400 = 60
        expect(result.elementWidth).toBe(60);
      });
    });

    describe('Edge Cases', () => {
      it('should use default width if not specified', () => {
        const element: Partial<DesignElement> = {
          x: 100,
          y: 50,
          // width not specified
          depth: 60,
          type: 'cabinet'
        };

        const result = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'front',
          1.0
        );

        // Default width is 60cm
        // (60 / 400) * 400 = 60
        expect(result.elementWidth).toBe(60);
      });

      it('should handle view IDs with suffixes (e.g., front-default, front-dup1)', () => {
        const element: Partial<DesignElement> = {
          x: 100,
          y: 50,
          width: 60,
          depth: 60,
          type: 'cabinet'
        };

        const result1 = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'front-default' as ViewType,
          1.0
        );

        const result2 = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'front-dup1' as ViewType,
          1.0
        );

        // Both should extract 'front' and calculate same position
        expect(result1.xPos).toBe(result2.xPos);
        expect(result1.elementWidth).toBe(result2.elementWidth);
      });

      it('should use Z coordinate default of 0 if not specified', () => {
        const element: Partial<DesignElement> = {
          x: 100,
          y: 200,
          // z not specified
          width: 60,
          depth: 60,
          height: 90,
          type: 'cabinet'
        };

        // Should not throw error
        const result = PositionCalculation.calculateElevationPosition(
          element as DesignElement,
          testRoom,
          testRoomPosition,
          'left',
          1.0
        );

        expect(result.xPos).toBeGreaterThan(0);
      });
    });
  });

  describe('calculateRoomPosition', () => {
    it('should calculate unified room position for front view', async () => {
      const innerRoomBounds = { width: 400, height: 600 };
      const panOffset = { x: 0, y: 0 };
      const zoom = 1.0;
      const wallThickness = 10;
      const canvasWidth = 800;
      const getWallHeight = () => 240;

      const result = await PositionCalculation.calculateRoomPosition(
        'front',
        testRoom,
        innerRoomBounds,
        zoom,
        panOffset,
        wallThickness,
        canvasWidth,
        getWallHeight
      );

      // Room should be centered: (800 / 2) - (400 * 1.0 / 2) = 400 - 200 = 200
      expect(result.innerX).toBe(200);

      // Top margin is 100
      expect(result.innerY).toBe(100);

      // Outer position includes wall thickness
      // outerX = innerX - wallThickness * zoom = 200 - 10 = 190
      expect(result.outerX).toBe(190);
      expect(result.outerY).toBe(90);
    });

    it('should calculate unified room position for left view', async () => {
      const innerRoomBounds = { width: 400, height: 600 };
      const panOffset = { x: 0, y: 0 };
      const zoom = 1.0;
      const wallThickness = 10;
      const canvasWidth = 800;
      const getWallHeight = () => 240;

      const result = await PositionCalculation.calculateRoomPosition(
        'left',
        testRoom,
        innerRoomBounds,
        zoom,
        panOffset,
        wallThickness,
        canvasWidth,
        getWallHeight
      );

      // Left view uses room depth (600cm) for inner room width
      // (800 / 2) - (600 * 1.0 / 2) = 400 - 300 = 100
      expect(result.innerX).toBe(100);
      expect(result.innerY).toBe(100);
    });

    it('should apply pan offset correctly', async () => {
      const innerRoomBounds = { width: 400, height: 600 };
      const panOffset = { x: 50, y: -30 };
      const zoom = 1.0;
      const wallThickness = 10;
      const canvasWidth = 800;
      const getWallHeight = () => 240;

      const result = await PositionCalculation.calculateRoomPosition(
        'front',
        testRoom,
        innerRoomBounds,
        zoom,
        panOffset,
        wallThickness,
        canvasWidth,
        getWallHeight
      );

      // innerX = 200 + 50 = 250
      expect(result.innerX).toBe(250);

      // innerY = 100 - 30 = 70
      expect(result.innerY).toBe(70);
    });

    it('should scale with zoom', async () => {
      const innerRoomBounds = { width: 400, height: 600 };
      const panOffset = { x: 0, y: 0 };
      const zoom = 2.0;
      const wallThickness = 10;
      const canvasWidth = 800;
      const getWallHeight = () => 240;

      const result = await PositionCalculation.calculateRoomPosition(
        'front',
        testRoom,
        innerRoomBounds,
        zoom,
        panOffset,
        wallThickness,
        canvasWidth,
        getWallHeight
      );

      // With 2x zoom: (800 / 2) - (400 * 2.0 / 2) = 400 - 400 = 0
      expect(result.innerX).toBe(0);

      // Wall thickness also scales: 10 * 2.0 = 20
      expect(result.outerX).toBe(-20);
    });
  });
});
