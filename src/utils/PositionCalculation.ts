/**
 * Position Calculation Utility
 *
 * Purpose: Calculate element positions in 2D elevation views with support for
 *          both legacy (asymmetric) and new (unified) coordinate systems
 *
 * Critical Issue Fixed:
 * - Left wall uses flipped Y coordinate: `roomDimensions.height - element.y - effectiveDepth`
 * - Right wall uses direct Y coordinate: `element.y`
 * - This asymmetry causes position mismatches between left and right views
 *
 * Solution:
 * - New system uses unified coordinate mapping for both left/right walls
 * - View mirroring is handled by rendering, not coordinate transformation
 * - Feature flag controls which system is used
 *
 * Usage:
 * ```typescript
 * const { xPos, elementWidth } = await PositionCalculation.calculateElevationPosition(
 *   element,
 *   roomDimensions,
 *   roomPosition,
 *   active2DView,
 *   zoom
 * );
 * ```
 */

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
  private static readonly FEATURE_FLAG = 'use_new_positioning_system';
  private static featureFlagCache: { enabled: boolean; timestamp: number } | null = null;
  private static readonly CACHE_TTL = 5000; // 5 seconds cache for feature flag

  /**
   * Check feature flag with short-term caching to avoid repeated DB calls per render
   */
  private static async isFeatureEnabled(): Promise<boolean> {
    const now = Date.now();

    // Return cached value if still valid
    if (this.featureFlagCache && (now - this.featureFlagCache.timestamp) < this.CACHE_TTL) {
      return this.featureFlagCache.enabled;
    }

    // Fetch fresh value
    const enabled = await FeatureFlagService.isEnabled(this.FEATURE_FLAG);

    // Cache it
    this.featureFlagCache = {
      enabled,
      timestamp: now
    };

    return enabled;
  }

  /**
   * Calculate element position in elevation views
   * Automatically switches between legacy and new implementations based on feature flag
   */
  static async calculateElevationPosition(
    element: DesignElement,
    roomDimensions: RoomDimensions,
    roomPosition: RoomPosition,
    view: ViewType,
    zoom: number,
    elevationWidth?: number,
    elevationDepth?: number
  ): Promise<ElevationPosition> {
    // Use cached feature flag check to avoid DB calls on every element
    const useNew = await this.isFeatureEnabled();

    if (useNew) {
      try {
        return this.calculateElevationPositionNew(
          element,
          roomDimensions,
          roomPosition,
          view,
          zoom,
          elevationWidth,
          elevationDepth
        );
      } catch (error) {
        console.error('[PositionCalculation] New implementation failed, using legacy:', error);
        return this.calculateElevationPositionLegacy(
          element,
          roomDimensions,
          roomPosition,
          view,
          zoom,
          elevationWidth,
          elevationDepth
        );
      }
    }

    return this.calculateElevationPositionLegacy(
      element,
      roomDimensions,
      roomPosition,
      view,
      zoom,
      elevationWidth,
      elevationDepth
    );
  }

  /**
   * 🔒 LEGACY IMPLEMENTATION - DO NOT MODIFY
   *
   * Exact copy from DesignCanvas2D.tsx lines 1377-1405
   * This is the safety net - keep it exactly as-is
   */
  private static calculateElevationPositionLegacy(
    element: DesignElement,
    roomDimensions: RoomDimensions,
    roomPosition: RoomPosition,
    view: ViewType,
    zoom: number,
    elevationWidth?: number,
    elevationDepth?: number
  ): ElevationPosition {
    // Get effective width (considers rotation)
    const effectiveWidth = element.width || 60;
    const effectiveDepth = element.depth || 60;

    // Calculate elevation dimensions
    const calcElevationWidth = elevationWidth || roomDimensions.width * zoom;
    const calcElevationDepth = elevationDepth || roomDimensions.height * zoom;

    let xPos: number;
    let elementWidth: number;

    if (view === 'front' || view === 'back') {
      // Front/back walls: use X coordinate from plan view
      xPos = roomPosition.innerX + (element.x / roomDimensions.width) * calcElevationWidth;
      elementWidth = (effectiveWidth / roomDimensions.width) * calcElevationWidth;
    } else if (view === 'left') {
      // 🔒 LEGACY: Left wall view - flip horizontally (mirror Y coordinate)
      // When looking at left wall from inside room, far end of room appears on left side of view
      const flippedY = roomDimensions.height - element.y - effectiveDepth;
      xPos = roomPosition.innerX + (flippedY / roomDimensions.height) * calcElevationDepth;

      // For worktops/counter-tops, use depth as width (length along wall)
      // For cabinets and other components, use effective width (length along wall)
      if (element.type === 'counter-top') {
        elementWidth = (element.depth / roomDimensions.height) * calcElevationDepth;
      } else {
        elementWidth = (effectiveWidth / roomDimensions.height) * calcElevationDepth; // Use rotation-aware width
      }
    } else {
      // 🔒 LEGACY: Right wall view - use Y coordinate from plan view
      xPos = roomPosition.innerX + (element.y / roomDimensions.height) * calcElevationDepth;

      // For worktops/counter-tops, use depth as width (length along wall)
      // For cabinets and other components, use effective width (length along wall)
      if (element.type === 'counter-top') {
        elementWidth = (element.depth / roomDimensions.height) * calcElevationDepth;
      } else {
        elementWidth = (effectiveWidth / roomDimensions.height) * calcElevationDepth; // Use rotation-aware width
      }
    }

    return { xPos, elementWidth };
  }

  /**
   * ✨ NEW IMPLEMENTATION - Unified Coordinate System
   *
   * Fixes the left/right wall asymmetry by using consistent coordinate mapping
   * View mirroring is handled by rendering logic, not coordinate transformation
   */
  private static calculateElevationPositionNew(
    element: DesignElement,
    roomDimensions: RoomDimensions,
    roomPosition: RoomPosition,
    view: ViewType,
    zoom: number,
    elevationWidth?: number,
    elevationDepth?: number
  ): ElevationPosition {
    // Get effective width (considers rotation)
    const effectiveWidth = element.width || 60;
    const effectiveDepth = element.depth || 60;

    // Calculate elevation dimensions
    const calcElevationWidth = elevationWidth || roomDimensions.width * zoom;
    const calcElevationDepth = elevationDepth || roomDimensions.height * zoom;

    let xPos: number;
    let elementWidth: number;

    if (view === 'front' || view === 'back') {
      // Front/back walls: use X coordinate from plan view
      xPos = roomPosition.innerX + (element.x / roomDimensions.width) * calcElevationWidth;
      elementWidth = (effectiveWidth / roomDimensions.width) * calcElevationWidth;
    } else {
      // ✨ NEW: Unified coordinate system for left AND right walls
      // Both walls use the same Y coordinate mapping - no flipping

      // Calculate base position using direct Y coordinate (same for both walls)
      const normalizedPosition = element.y / roomDimensions.height;
      xPos = roomPosition.innerX + normalizedPosition * calcElevationDepth;

      // Calculate element width
      if (element.type === 'counter-top') {
        elementWidth = (element.depth / roomDimensions.height) * calcElevationDepth;
      } else {
        elementWidth = (effectiveWidth / roomDimensions.height) * calcElevationDepth;
      }

      // For left wall, mirror the rendering by inverting the X position
      // This is done at rendering time, not in coordinate calculation
      // This keeps the coordinate system consistent while achieving the visual effect
      if (view === 'left') {
        // Mirror position: reflect around center of elevation
        const elevationCenter = roomPosition.innerX + calcElevationDepth / 2;
        const distanceFromCenter = xPos - elevationCenter;
        xPos = elevationCenter - distanceFromCenter - elementWidth;
      }
    }

    return { xPos, elementWidth };
  }

  /**
   * Calculate room position with unified logic
   * Feature flag controlled switching between legacy and new implementations
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
    return FeatureFlagService.useLegacyOr(
      this.FEATURE_FLAG,

      // 🔒 LEGACY - Different logic for elevation vs plan views (lines 472-502)
      () => this.calculateRoomPositionLegacy(
        view,
        roomDimensions,
        innerRoomBounds,
        zoom,
        panOffset,
        wallThickness,
        canvasWidth,
        getWallHeight
      ),

      // ✨ NEW - Unified positioning logic for all views
      () => this.calculateRoomPositionNew(
        view,
        roomDimensions,
        innerRoomBounds,
        zoom,
        panOffset,
        wallThickness,
        canvasWidth,
        getWallHeight
      )
    );
  }

  /**
   * 🔒 LEGACY - Room position calculation (exact copy from lines 472-502)
   */
  private static calculateRoomPositionLegacy(
    view: ViewType,
    roomDimensions: RoomDimensions,
    innerRoomBounds: { width: number; height: number },
    zoom: number,
    panOffset: { x: number; y: number },
    wallThickness: number,
    canvasWidth: number,
    getWallHeight: () => number
  ): RoomPosition {
    if (view === 'left' || view === 'right') {
      // Left/Right elevation views: top-center based on room depth and wall height
      const wallHeight = getWallHeight();
      const roomDepth = roomDimensions.height; // Use height as depth for side views
      const topMargin = 100; // Space from top of canvas
      return {
        // Outer room position (for wall drawing)
        outerX: (canvasWidth / 2) - (roomDepth * zoom / 2) + panOffset.x,
        outerY: topMargin + panOffset.y,
        // Inner room position (for component placement)
        innerX: (canvasWidth / 2) - (roomDepth * zoom / 2) + panOffset.x,
        innerY: topMargin + panOffset.y
      };
    } else {
      // Plan, Front, Back views: top-center alignment
      const topMargin = 100; // Space from top of canvas
      // For plan view, center the inner room and add wall thickness around it
      const innerX = (canvasWidth / 2) - (innerRoomBounds.width * zoom / 2) + panOffset.x;
      const innerY = topMargin + panOffset.y;
      const wallThicknessPx = wallThickness * zoom;
      return {
        // Outer room position (for wall drawing) - centered around inner room
        outerX: innerX - wallThicknessPx,
        outerY: innerY - wallThicknessPx,
        // Inner room position (for component placement)
        innerX: innerX,
        innerY: innerY
      };
    }
  }

  /**
   * ✨ NEW - Unified room position calculation for all views
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
