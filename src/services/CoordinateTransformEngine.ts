/**
 * CoordinateTransformEngine - Unified coordinate transformation system
 * 
 * FUNDAMENTAL PRINCIPLE: Room dimensions = inner usable space
 * - (0,0) = inner room corner (where components can be placed)
 * - All coordinates represent positions within usable interior space
 * - Wall thickness is handled separately from room dimensions
 * - Consistent reference point across 2D/3D/drag-drop systems
 */

import { RoomDimensions } from '@/types/project';

// Core coordinate system interfaces
export interface PlanCoordinates {
  x: number; // X position within inner room space (0 to roomWidth)
  y: number; // Y position within inner room space (0 to roomHeight)  
  z?: number; // Height above floor (optional, defaults to 0)
}

export interface WorldCoordinates {
  x: number; // 3D world X coordinate (centered at 0)
  y: number; // 3D world Y coordinate (height above floor)
  z: number; // 3D world Z coordinate (centered at 0)
}

export interface ElevationCoordinates {
  x: number; // Horizontal position along wall
  y: number; // Vertical height on wall
}

export interface WallConfiguration {
  thickness: number; // Wall thickness in cm (default: 10cm)
  innerFaceToInnerFace: boolean; // Always true - room dimensions are inner space
}

export type WallType = 'front' | 'back' | 'left' | 'right';

export interface RoomConfiguration {
  innerWidth: number;  // Inner usable width (room dimension)
  innerHeight: number; // Inner usable height/depth (room dimension)
  ceilingHeight: number; // Height from floor to ceiling
  wallConfig: WallConfiguration;
}

/**
 * Universal coordinate transformation engine
 * Maintains consistent inner room space reference across all systems
 */
export class CoordinateTransformEngine {
  private roomConfig: RoomConfiguration;
  
  constructor(roomDimensions: RoomDimensions) {
    this.roomConfig = {
      innerWidth: roomDimensions.width,   // Room width = inner usable width
      innerHeight: roomDimensions.height, // Room height = inner usable height/depth
      ceilingHeight: roomDimensions.ceilingHeight || 240,
      wallConfig: {
        thickness: 10, // Standard interior wall thickness
        innerFaceToInnerFace: true // Room dimensions always represent inner space
      }
    };
    
    console.log('🏗️ [CoordinateEngine] Initialized with inner room dimensions:', {
      innerWidth: this.roomConfig.innerWidth,
      innerHeight: this.roomConfig.innerHeight,
      ceilingHeight: this.roomConfig.ceilingHeight,
      wallThickness: this.roomConfig.wallConfig.thickness
    });
  }

  /**
   * Convert 2D plan coordinates to 3D world coordinates
   * Plan coordinates (0,0) = inner room corner
   * World coordinates (0,0,0) = center of inner room space
   */
  planToWorld(coords: PlanCoordinates): WorldCoordinates {
    return {
      x: coords.x - this.roomConfig.innerWidth / 2,    // Center in world space
      z: coords.y - this.roomConfig.innerHeight / 2,   // Center in world space (Y becomes Z)
      y: coords.z || 0                                  // Height unchanged
    };
  }

  /**
   * Convert 3D world coordinates back to 2D plan coordinates
   * Inverse of planToWorld transformation
   */
  worldToPlan(coords: WorldCoordinates): PlanCoordinates {
    return {
      x: coords.x + this.roomConfig.innerWidth / 2,    // Back to inner room space
      y: coords.z + this.roomConfig.innerHeight / 2,   // Back to inner room space (Z becomes Y)
      z: coords.y                                       // Height unchanged
    };
  }

  /**
   * Convert plan coordinates to elevation view coordinates
   * Each wall view shows different perspective of the room
   */
  planToElevation(coords: PlanCoordinates, wall: WallType): ElevationCoordinates {
    switch (wall) {
      case 'front':
        return { 
          x: coords.x,                    // X position along front wall
          y: coords.z || 0                // Height on wall
        };
      case 'back':
        return { 
          x: this.roomConfig.innerWidth - coords.x,  // Mirrored X for back wall
          y: coords.z || 0                            // Height on wall
        };
      case 'left':
        return { 
          x: this.roomConfig.innerHeight - coords.y, // Y becomes X (mirrored)
          y: coords.z || 0                            // Height on wall
        };
      case 'right':
        return { 
          x: coords.y,                    // Y becomes X (direct)
          y: coords.z || 0                // Height on wall
        };
      default:
        throw new Error(`Unknown wall type: ${wall}`);
    }
  }

  /**
   * Convert elevation coordinates back to plan coordinates
   * Requires knowing which wall the elevation represents
   */
  elevationToPlan(coords: ElevationCoordinates, wall: WallType): PlanCoordinates {
    switch (wall) {
      case 'front':
        return {
          x: coords.x,                    // X position unchanged
          y: 0,                          // At front wall (Y = 0)
          z: coords.y                     // Height from elevation
        };
      case 'back':
        return {
          x: this.roomConfig.innerWidth - coords.x,  // Reverse mirroring
          y: this.roomConfig.innerHeight,             // At back wall (Y = max)
          z: coords.y                                 // Height from elevation
        };
      case 'left':
        return {
          x: 0,                                       // At left wall (X = 0)
          y: this.roomConfig.innerHeight - coords.x, // Reverse Y->X mapping
          z: coords.y                                 // Height from elevation
        };
      case 'right':
        return {
          x: this.roomConfig.innerWidth,  // At right wall (X = max)
          y: coords.x,                    // Reverse Y->X mapping
          z: coords.y                     // Height from elevation
        };
      default:
        throw new Error(`Unknown wall type: ${wall}`);
    }
  }

  /**
   * Get room boundaries in plan coordinates
   * Always represents the inner usable space
   */
  getInnerRoomBounds() {
    return {
      minX: 0,
      minY: 0,
      maxX: this.roomConfig.innerWidth,
      maxY: this.roomConfig.innerHeight,
      width: this.roomConfig.innerWidth,
      height: this.roomConfig.innerHeight
    };
  }

  /**
   * Get wall positions for rendering
   * Walls surround the inner room space
   */
  getWallPositions() {
    const halfThickness = this.roomConfig.wallConfig.thickness / 2;
    
    return {
      // Wall center lines (for rendering wall thickness)
      front: { x: this.roomConfig.innerWidth / 2, y: -halfThickness },
      back: { x: this.roomConfig.innerWidth / 2, y: this.roomConfig.innerHeight + halfThickness },
      left: { x: -halfThickness, y: this.roomConfig.innerHeight / 2 },
      right: { x: this.roomConfig.innerWidth + halfThickness, y: this.roomConfig.innerHeight / 2 },
      
      // Wall inner faces (component placement boundaries)
      innerFaces: {
        front: 0,
        back: this.roomConfig.innerHeight,
        left: 0,
        right: this.roomConfig.innerWidth
      }
    };
  }

  /**
   * Validate coordinates are within inner room bounds
   */
  validatePlanCoordinates(coords: PlanCoordinates): boolean {
    const bounds = this.getInnerRoomBounds();
    return coords.x >= bounds.minX && 
           coords.x <= bounds.maxX && 
           coords.y >= bounds.minY && 
           coords.y <= bounds.maxY;
  }

  /**
   * Get room configuration for external systems
   */
  getRoomConfiguration(): RoomConfiguration {
    return { ...this.roomConfig };
  }

  /**
   * Update room dimensions (maintains inner space reference)
   */
  updateRoomDimensions(newDimensions: RoomDimensions): void {
    this.roomConfig.innerWidth = newDimensions.width;
    this.roomConfig.innerHeight = newDimensions.height;
    this.roomConfig.ceilingHeight = newDimensions.ceilingHeight || this.roomConfig.ceilingHeight;
    
    console.log('🔄 [CoordinateEngine] Updated room dimensions:', {
      innerWidth: this.roomConfig.innerWidth,
      innerHeight: this.roomConfig.innerHeight,
      ceilingHeight: this.roomConfig.ceilingHeight
    });
  }
}

// Singleton instance for global access
let globalCoordinateEngine: CoordinateTransformEngine | null = null;

/**
 * Get the global coordinate transform engine
 * Creates one if it doesn't exist
 */
export const getCoordinateEngine = (roomDimensions?: RoomDimensions): CoordinateTransformEngine => {
  if (!globalCoordinateEngine && roomDimensions) {
    globalCoordinateEngine = new CoordinateTransformEngine(roomDimensions);
  } else if (!globalCoordinateEngine) {
    throw new Error('CoordinateTransformEngine not initialized. Provide room dimensions.');
  }
  
  return globalCoordinateEngine;
};

/**
 * Initialize or update the global coordinate engine
 */
export const initializeCoordinateEngine = (roomDimensions: RoomDimensions): CoordinateTransformEngine => {
  globalCoordinateEngine = new CoordinateTransformEngine(roomDimensions);
  return globalCoordinateEngine;
};

/**
 * Clear the global coordinate engine (useful for testing)
 */
export const clearCoordinateEngine = (): void => {
  globalCoordinateEngine = null;
};

export default CoordinateTransformEngine;
