/**
 * Canvas Coordinate Integration
 * Bridges the new CoordinateTransformEngine with the existing DesignCanvas2D
 * Fixes wall overlap and corner rotation issues
 */

import { 
  CoordinateTransformEngine, 
  getCoordinateEngine,
  PlanCoordinates 
} from '@/services/CoordinateTransformEngine';
import { DesignElement } from '@/types/project';

export interface ComponentPlacementResult {
  x: number;
  y: number;
  rotation: number;
  snappedToWall: boolean;
  corner: string | null;
  withinBounds: boolean;
}

export interface CanvasDropData {
  dropX: number;
  dropY: number;
  componentWidth: number;
  componentDepth: number;
  componentId: string;
  componentType: string;
}

/**
 * Enhanced component placement using the unified coordinate system
 * Fixes wall overlap and corner rotation issues
 */
export class CanvasCoordinateIntegrator {
  private coordinateEngine: CoordinateTransformEngine;
  
  constructor(coordinateEngine: CoordinateTransformEngine) {
    this.coordinateEngine = coordinateEngine;
  }
  
  /**
   * Calculate proper component placement with wall clearance
   * Uses the inner room coordinate system correctly
   */
  calculateComponentPlacement(dropData: CanvasDropData): ComponentPlacementResult {
    const { dropX, dropY, componentWidth, componentDepth, componentId, componentType } = dropData;
    
    // Get room configuration from coordinate engine
    const roomConfig = this.coordinateEngine.getRoomConfiguration();
    const roomBounds = this.coordinateEngine.getInnerRoomBounds();
    const wallPositions = this.coordinateEngine.getWallPositions();
    
    // Determine if this is a corner component
    const isCornerComponent = this.isCornerComponent(componentId);
    
    // Use effective dimensions
    const effectiveWidth = isCornerComponent ? 90 : componentWidth;
    const effectiveDepth = isCornerComponent ? 90 : componentDepth;
    
    console.log('🎯 [CanvasIntegrator] Calculating placement:', {
      dropPosition: { x: dropX, y: dropY },
      componentSize: { width: effectiveWidth, depth: effectiveDepth },
      roomBounds,
      isCorner: isCornerComponent
    });
    
    // CRITICAL FIX: Ensure component stays within inner room bounds with proper clearance
    const wallClearance = 5; // 5cm clearance from inner wall faces
    
    // Calculate boundaries for component placement (accounting for component size)
    const placementBounds = {
      minX: wallClearance,
      minY: wallClearance,
      maxX: roomBounds.width - effectiveWidth - wallClearance,
      maxY: roomBounds.height - effectiveDepth - wallClearance
    };
    
    console.log('📐 [CanvasIntegrator] Placement bounds:', placementBounds);
    
    // Check for corner placement first
    if (isCornerComponent) {
      const cornerResult = this.calculateCornerPlacement(dropX, dropY, effectiveWidth, effectiveDepth, placementBounds);
      if (cornerResult) {
        return cornerResult;
      }
    }
    
    // Apply wall snapping with proper clearance
    const wallSnappedPosition = this.calculateWallSnapping(
      dropX, dropY, 
      effectiveWidth, effectiveDepth, 
      placementBounds
    );
    
    // Ensure final position is within bounds
    const finalX = Math.max(placementBounds.minX, Math.min(placementBounds.maxX, wallSnappedPosition.x));
    const finalY = Math.max(placementBounds.minY, Math.min(placementBounds.maxY, wallSnappedPosition.y));
    
    // Validate final position
    const withinBounds = this.coordinateEngine.validatePlanCoordinates({ x: finalX, y: finalY });
    
    console.log('✅ [CanvasIntegrator] Final placement:', {
      position: { x: finalX, y: finalY },
      snapped: wallSnappedPosition.snappedToWall,
      withinBounds
    });
    
    return {
      x: finalX,
      y: finalY,
      rotation: wallSnappedPosition.rotation,
      snappedToWall: wallSnappedPosition.snappedToWall,
      corner: wallSnappedPosition.corner,
      withinBounds
    };
  }
  
  /**
   * Calculate corner placement with proper rotation
   * Fixes the corner rotation issues
   */
  private calculateCornerPlacement(
    dropX: number, 
    dropY: number, 
    width: number, 
    depth: number, 
    bounds: any
  ): ComponentPlacementResult | null {
    const cornerThreshold = 60; // Increased threshold for better corner detection
    const roomBounds = this.coordinateEngine.getInnerRoomBounds();
    
    console.log('🔲 [CanvasIntegrator] Corner detection:', {
      dropPosition: { x: dropX, y: dropY },
      roomBounds,
      threshold: cornerThreshold
    });
    
    // DIAGONAL CORNER LOGIC: L-shaped components have 2 diagonal pairs
    // Each diagonal pair mirrors each other's L-opening toward room center
    
    // FOCUS: Correct rotation angles based on which corner works (top-left at 0°)
    // Top-left works at 0°, so let's figure out the correct angles for other corners
    
    const corners = [
      {
        name: 'top-left',
        condition: dropX <= cornerThreshold && dropY <= cornerThreshold,
        position: { x: bounds.minX, y: bounds.minY },
        rotation: 0 // Position 1: 0 degrees (baseline)
      },
      {
        name: 'top-right', 
        condition: dropX >= (roomBounds.width - cornerThreshold) && dropY <= cornerThreshold,
        position: { x: bounds.maxX, y: bounds.minY },
        rotation: -270 // SWAPPED: Was -90, now -270 (270° clockwise)
      },
      {
        name: 'bottom-right',
        condition: dropX >= (roomBounds.width - cornerThreshold) && dropY >= (roomBounds.height - cornerThreshold),
        position: { x: bounds.maxX, y: bounds.maxY },
        rotation: -180 // Position 3: CLOCKWISE 180° (negative for clockwise)
      },
      {
        name: 'bottom-left',
        condition: dropX <= cornerThreshold && dropY >= (roomBounds.height - cornerThreshold),
        position: { x: bounds.minX, y: bounds.maxY },
        rotation: -90 // SWAPPED: Was -270, now -90 (90° clockwise)
      }
    ];
    
    for (const corner of corners) {
      if (corner.condition) {
        // Log corner detection
        const cornerInfo = `${corner.name} corner (rotation: ${corner.rotation}°)`;
        
        console.log(`🔲 [CanvasIntegrator] Corner placement MATCHED: ${corner.name} at (${corner.position.x}, ${corner.position.y}) with rotation ${corner.rotation}°`);
        console.log(`🔄 [CanvasIntegrator] Using ${cornerInfo} - L opens toward room center`);
        
        return {
          x: corner.position.x,
          y: corner.position.y,
          rotation: corner.rotation,
          snappedToWall: true,
          corner: corner.name,
          withinBounds: true
        };
      }
    }
    
    console.log('🔲 [CanvasIntegrator] No corner match found');
    return null;
  }
  
  /**
   * Calculate wall snapping with proper clearance
   * Ensures components don't overlap walls
   */
  private calculateWallSnapping(
    dropX: number, 
    dropY: number, 
    width: number, 
    depth: number, 
    bounds: any
  ): { x: number, y: number, rotation: number, snappedToWall: boolean, corner: string | null } {
    let snappedX = dropX;
    let snappedY = dropY;
    let rotation = 0;
    let snappedToWall = false;
    const snapThreshold = 40;
    const roomBounds = this.coordinateEngine.getInnerRoomBounds();
    
    console.log('🎯 [CanvasIntegrator] Wall snapping check:', {
      dropPosition: { x: dropX, y: dropY },
      componentSize: { width, depth },
      bounds,
      roomBounds,
      snapThreshold
    });
    
    // CRITICAL FIX: Proper wall detection logic
    // Check proximity to each wall individually
    
    // Left wall proximity
    const leftWallDistance = dropX;
    // Right wall proximity  
    const rightWallDistance = roomBounds.width - (dropX + width);
    // Top wall proximity (front)
    const topWallDistance = dropY;
    // Bottom wall proximity (back)
    const bottomWallDistance = roomBounds.height - (dropY + depth);
    
    console.log('📏 [CanvasIntegrator] Wall distances:', {
      left: leftWallDistance,
      right: rightWallDistance, 
      top: topWallDistance,
      bottom: bottomWallDistance
    });
    
    // Snap to closest wall if within threshold
    if (leftWallDistance <= snapThreshold && leftWallDistance >= 0) {
      snappedX = bounds.minX;
      snappedToWall = true;
      rotation = 0; // Face into room (right)
      console.log('🎯 [CanvasIntegrator] Snapped to LEFT wall');
    }
    else if (rightWallDistance <= snapThreshold && rightWallDistance >= 0) {
      snappedX = bounds.maxX;
      snappedToWall = true;
      rotation = 180; // Face into room (left)
      console.log('🎯 [CanvasIntegrator] Snapped to RIGHT wall');
    }
    
    if (topWallDistance <= snapThreshold && topWallDistance >= 0) {
      snappedY = bounds.minY;
      snappedToWall = true;
      // Only override rotation if not already set by left/right wall
      if (rotation === 0 && snappedX === dropX) rotation = 0; // Face into room (down)
      console.log('🎯 [CanvasIntegrator] Snapped to TOP wall (front)');
    }
    else if (bottomWallDistance <= snapThreshold && bottomWallDistance >= 0) {
      snappedY = bounds.maxY;
      snappedToWall = true;
      // Only override rotation if not already set by left/right wall
      if (rotation === 0 && snappedX === dropX) rotation = 180; // Face into room (up)
      console.log('🎯 [CanvasIntegrator] Snapped to BOTTOM wall (back)');
    }
    
    return {
      x: snappedX,
      y: snappedY,
      rotation,
      snappedToWall,
      corner: null
    };
  }
  
  /**
   * Check if component is a corner component
   */
  private isCornerComponent(componentId: string): boolean {
    const id = componentId.toLowerCase();
    return id.includes('corner') || 
           id.includes('larder-corner') || 
           id.includes('corner-larder');
  }
  
  /**
   * Validate component placement doesn't overlap walls
   */
  validatePlacement(element: DesignElement): boolean {
    const roomBounds = this.coordinateEngine.getInnerRoomBounds();
    const wallClearance = 5;
    
    // Check if component (including its dimensions) fits within bounds
    const fitsWidth = element.x >= wallClearance && 
                     (element.x + element.width) <= (roomBounds.width - wallClearance);
    const fitsHeight = element.y >= wallClearance && 
                      (element.y + element.depth) <= (roomBounds.height - wallClearance);
    
    return fitsWidth && fitsHeight;
  }
}

/**
 * Create canvas integrator for current room
 */
export const createCanvasIntegrator = (): CanvasCoordinateIntegrator => {
  const coordinateEngine = getCoordinateEngine();
  return new CanvasCoordinateIntegrator(coordinateEngine);
};

/**
 * Helper function for existing canvas code
 * Replaces the old getWallSnappedPosition function
 */
export const getEnhancedComponentPlacement = (
  dropX: number,
  dropY: number, 
  componentWidth: number,
  componentDepth: number,
  componentId: string,
  componentType: string,
  roomDimensions: { width: number; height: number }
): ComponentPlacementResult => {
  try {
    // Initialize coordinate engine if needed
    const coordinateEngine = getCoordinateEngine(roomDimensions);
    const integrator = new CanvasCoordinateIntegrator(coordinateEngine);
    
    return integrator.calculateComponentPlacement({
      dropX,
      dropY,
      componentWidth,
      componentDepth,
      componentId,
      componentType
    });
  } catch (error) {
    console.error('❌ [CanvasIntegrator] Placement calculation failed:', error);
    
    // Fallback to basic placement
    return {
      x: Math.max(5, Math.min(roomDimensions.width - componentWidth - 5, dropX)),
      y: Math.max(5, Math.min(roomDimensions.height - componentDepth - 5, dropY)),
      rotation: 0,
      snappedToWall: false,
      corner: null,
      withinBounds: true
    };
  }
};
