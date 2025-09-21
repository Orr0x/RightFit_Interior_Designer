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
    const cornerThreshold = 40; // 40cm threshold for corner detection
    
    // Check each corner with proper rotation logic
    const corners = [
      {
        name: 'top-left',
        condition: dropX <= cornerThreshold && dropY <= cornerThreshold,
        position: { x: bounds.minX, y: bounds.minY },
        rotation: 0 // L-shape faces down-right
      },
      {
        name: 'top-right', 
        condition: dropX >= (bounds.maxX + width - cornerThreshold) && dropY <= cornerThreshold,
        position: { x: bounds.maxX, y: bounds.minY },
        rotation: 270 // L-shape faces down-left
      },
      {
        name: 'bottom-left',
        condition: dropX <= cornerThreshold && dropY >= (bounds.maxY + depth - cornerThreshold),
        position: { x: bounds.minX, y: bounds.maxY },
        rotation: 90 // L-shape faces up-right
      },
      {
        name: 'bottom-right',
        condition: dropX >= (bounds.maxX + width - cornerThreshold) && dropY >= (bounds.maxY + depth - cornerThreshold),
        position: { x: bounds.maxX, y: bounds.maxY },
        rotation: 180 // L-shape faces up-left
      }
    ];
    
    for (const corner of corners) {
      if (corner.condition) {
        console.log(`🔲 [CanvasIntegrator] Corner placement: ${corner.name} at (${corner.position.x}, ${corner.position.y}) with rotation ${corner.rotation}°`);
        
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
    
    // Snap to left wall
    if (dropX <= snapThreshold) {
      snappedX = bounds.minX;
      snappedToWall = true;
      rotation = 90; // Face right (into room)
    }
    // Snap to right wall
    else if (dropX + width >= bounds.maxX + width - snapThreshold) {
      snappedX = bounds.maxX;
      snappedToWall = true;
      rotation = 270; // Face left (into room)
    }
    
    // Snap to top wall (front)
    if (dropY <= snapThreshold) {
      snappedY = bounds.minY;
      snappedToWall = true;
      if (rotation === 0) rotation = 0; // Face down (into room)
    }
    // Snap to bottom wall (back)
    else if (dropY + depth >= bounds.maxY + depth - snapThreshold) {
      snappedY = bounds.maxY;
      snappedToWall = true;
      if (rotation === 0) rotation = 180; // Face up (into room)
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
