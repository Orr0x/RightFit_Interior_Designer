/**
 * Position Calculation Utility
 *
 * Purpose: Calculate element positions in 2D elevation views using the
 *          NEW UNIFIED SYSTEM via CoordinateTransformEngine
 *
 * Legacy asymmetry ELIMINATED:
 * - All walls use consistent coordinate mapping
 * - Left wall mirroring handled at render time (shouldMirror flag)
 * - No more asymmetric coordinate calculations
 *
 * Usage:
 * ```typescript
 * const { xPos, elementWidth } = PositionCalculation.calculateElevationPosition(
 *   element,
 *   roomDimensions,
 *   roomPosition,
 *   active2DView,
 *   zoom
 * );
 * ```
 *
 * Story: 1.3 - Refactor to use CoordinateTransformEngine
 * Epic: Epic 1 - Eliminate Circular Dependency Patterns
 */

import { CoordinateTransformEngine } from '@/services/CoordinateTransformEngine';
import { FeatureFlagService } from '@/services/FeatureFlagService';
import type { DesignElement } from '@/types/project';

export interface RoomDimensions {
  width: number;
  height: number;
}

export interface RoomPosition {
  innerX: number;
  innerY: number;
  outerX: number;
  outerY: number;
}

export interface ElevationPosition {
  xPos: number;
  elementWidth: number;
}

export type ViewType = 'plan' | 'front' | 'back' | 'left' | 'right';

export class PositionCalculation {
  /**
   * Calculate element position in elevation views
   *
   * Uses CoordinateTransformEngine for NEW UNIFIED SYSTEM
   * - All walls use consistent coordinate mapping
   * - Left wall mirroring applied at render time (not in coordinates)
   *
   * Story 1.3: Feature flag removed - NEW UNIFIED SYSTEM always used
   */
  static calculateElevationPosition(
    element: DesignElement,
    roomDimensions: RoomDimensions,
    roomPosition: RoomPosition,
    view: ViewType,
    zoom: number,
    elevationWidth?: number,
    elevationDepth?: number
  ): ElevationPosition {
    // Get effective dimensions (considers rotation)
    const effectiveWidth = element.width || 60;
    const effectiveDepth = element.depth || 60;

    // Calculate elevation canvas dimensions
    const calcElevationWidth = elevationWidth || roomDimensions.width * zoom;
    const calcElevationDepth = elevationDepth || roomDimensions.height * zoom;

    // Extract base view direction (handles 'front-default', 'front-dup1', etc.)
    const baseView = view.split('-')[0] as 'plan' | 'front' | 'back' | 'left' | 'right';

    let xPos: number;
    let elementWidth: number;

    if (baseView === 'front' || baseView === 'back' || baseView === 'plan') {
      // Front/back/plan views: use X coordinate from plan view
      xPos = roomPosition.innerX + (element.x / roomDimensions.width) * calcElevationWidth;
      elementWidth = (effectiveWidth / roomDimensions.width) * calcElevationWidth;
    } else {
      // Left/right views: Use CoordinateTransformEngine for NEW UNIFIED SYSTEM

      // Create engine instance with room dimensions
      const engine = new CoordinateTransformEngine({
        width: roomDimensions.width,
        height: roomDimensions.height,
        ceilingHeight: 240 // Default ceiling height (will be made configurable in later story)
      });

      // Transform plan coordinates to elevation coordinates
      const planCoords = {
        x: element.x,
        y: element.y,
        z: element.z || 0
      };

      const elevResult = engine.planToElevation(
        planCoords,
        baseView as 'left' | 'right',
        calcElevationDepth,
        600, // Canvas height (not used for horizontal positioning)
        element.height || 90,
        zoom
      );

      // Use engine's canvasX, add room offset
      xPos = roomPosition.innerX + elevResult.canvasX;

      // Calculate element width
      if (element.type === 'counter-top') {
        elementWidth = (element.depth / roomDimensions.height) * calcElevationDepth;
      } else {
        elementWidth = (effectiveWidth / roomDimensions.height) * calcElevationDepth;
      }

      // NOTE: elevResult.shouldMirror flag should be used by rendering logic
      // This is handled in DesignCanvas2D.tsx, not here
    }

    return { xPos, elementWidth };
  }


  /**
   * Calculate room position with unified logic for all views
   *
   * Story 1.3: Feature flag removed - unified system always used
   */
  static async calculateRoomPosition(
    view: ViewType,
    roomDimensions: RoomDimensions,
    innerRoomBounds: { width: number; height: number },
    zoom: number,
    panOffset: { x: number; y: number },
    wallThickness: number,
    canvasWidth: number,
    getWallHeight: () => number
  ): Promise<RoomPosition> {
    return this.calculateRoomPositionNew(
      view,
      roomDimensions,
      innerRoomBounds,
      zoom,
      panOffset,
      wallThickness,
      canvasWidth,
      getWallHeight
    );
  }

  /**
   * Unified room position calculation for all views
   * Story 1.3: Legacy method removed
   */
  private static calculateRoomPositionNew(
    view: ViewType,
    roomDimensions: RoomDimensions,
    innerRoomBounds: { width: number; height: number },
    zoom: number,
    panOffset: { x: number; y: number },
    wallThickness: number,
    canvasWidth: number,
    getWallHeight: () => number
  ): RoomPosition {
    // Unified top-center alignment for all views
    const topMargin = 100;

    // Calculate inner room dimensions based on view
    let innerRoomWidth: number;
    if (view === 'left' || view === 'right') {
      innerRoomWidth = roomDimensions.height; // Use depth for side views
    } else {
      innerRoomWidth = innerRoomBounds.width;
    }

    // Center the inner room
    const innerX = (canvasWidth / 2) - (innerRoomWidth * zoom / 2) + panOffset.x;
    const innerY = topMargin + panOffset.y;

    // Calculate outer room position (with wall thickness)
    const wallThicknessPx = wallThickness * zoom;

    return {
      outerX: innerX - wallThicknessPx,
      outerY: innerY - wallThicknessPx,
      innerX: innerX,
      innerY: innerY
    };
  }
}
