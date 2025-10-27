/**
 * Elevation View Renderer
 *
 * Handles all elevation view specific rendering logic
 * Extracted from DesignCanvas2D.tsx as part of Story 1.15 refactor
 *
 * Story: 1.15 - Refactor DesignCanvas2D into Modular Components
 * Date: 2025-10-27
 */

import type { DesignElement } from '@/types/project';
import { renderElevationView } from '@/services/2d-renderers';
import { render2DService } from '@/services/Render2DService';
import { ComponentService } from '@/services/ComponentService';
import { PositionCalculation } from '@/utils/PositionCalculation';
import { FeatureFlagService } from '@/services/FeatureFlagService';
import { Logger } from '@/utils/Logger';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WALL_THICKNESS,
  type RoomPosition
} from './CanvasSharedUtilities';

// =============================================================================
// TYPES
// =============================================================================

export interface ElevationViewConfig {
  direction: 'front' | 'back' | 'left' | 'right';
  hiddenElements: string[];
}

// =============================================================================
// ROOM RENDERING
// =============================================================================

/**
 * Draw room in elevation view
 */
export function drawRoomElevationView(
  ctx: CanvasRenderingContext2D,
  roomDimensions: { width: number; height: number },
  roomPosition: RoomPosition,
  zoom: number,
  wallHeight: number,
  currentViewInfo: ElevationViewConfig
): void {
  const wallHeightZoomed = wallHeight * zoom;
  const floorY = roomPosition.innerY + (CANVAS_HEIGHT * 0.4); // Fixed floor position
  const topY = floorY - wallHeightZoomed; // Ceiling moves up/down based on wall height

  // Use appropriate dimension for each elevation view based on direction
  let elevationRoomWidth: number;
  if (currentViewInfo.direction === 'front' || currentViewInfo.direction === 'back') {
    elevationRoomWidth = roomDimensions.width * zoom; // Use room width for front/back views
  } else {
    elevationRoomWidth = roomDimensions.height * zoom; // Use room depth for left/right views
  }

  // Draw wall boundaries
  ctx.fillStyle = '#f9f9f9';
  ctx.fillRect(roomPosition.innerX, topY, elevationRoomWidth, wallHeightZoomed);

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(roomPosition.innerX, topY, elevationRoomWidth, wallHeightZoomed);

  // Floor line
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(roomPosition.innerX, floorY);
  ctx.lineTo(roomPosition.innerX + elevationRoomWidth, floorY);
  ctx.stroke();

  // Wall label
  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  const wallLabels = {
    front: 'Front Wall',
    back: 'Back Wall',
    left: 'Left Wall',
    right: 'Right Wall'
  };
  ctx.fillText(
    wallLabels[currentViewInfo.direction] || '',
    roomPosition.innerX + elevationRoomWidth / 2,
    roomPosition.innerY - 20
  );

  // Dimension labels
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';

  // Width dimension (bottom)
  let widthText = '';
  if (currentViewInfo.direction === 'front' || currentViewInfo.direction === 'back') {
    widthText = `${roomDimensions.width}cm (inner)`;
  } else {
    widthText = `${roomDimensions.height}cm (inner)`;
  }
  ctx.textAlign = 'center';
  ctx.fillText(widthText, roomPosition.innerX + elevationRoomWidth / 2, floorY + 20);

  // Wall height dimension (left side)
  const heightText = `${wallHeight}cm`;
  ctx.save();
  ctx.translate(roomPosition.innerX - 35, topY + wallHeightZoomed / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(heightText, 0, 0);
  ctx.restore();

  // Height indicator line with arrows
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  const indicatorX = roomPosition.innerX - 25;

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(indicatorX, topY);
  ctx.lineTo(indicatorX, floorY);
  ctx.stroke();

  // Top arrow
  ctx.beginPath();
  ctx.moveTo(indicatorX, topY);
  ctx.lineTo(indicatorX - 3, topY + 8);
  ctx.moveTo(indicatorX, topY);
  ctx.lineTo(indicatorX + 3, topY + 8);
  ctx.stroke();

  // Bottom arrow
  ctx.beginPath();
  ctx.moveTo(indicatorX, floorY);
  ctx.lineTo(indicatorX - 3, floorY - 8);
  ctx.moveTo(indicatorX, floorY);
  ctx.lineTo(indicatorX + 3, floorY - 8);
  ctx.stroke();
}

// =============================================================================
// ELEMENT RENDERING
// =============================================================================

/**
 * Draw a single element in elevation view
 */
export function drawElementElevationView(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  roomDimensions: { width: number; height: number },
  roomPosition: RoomPosition,
  active2DView: string,
  zoom: number,
  isSelected: boolean = false,
  isHovered: boolean = false,
  showWireframe: boolean = false
): void {
  // Calculate dimensions
  const elevationWidth = roomDimensions.width * zoom;
  const elevationDepth = roomDimensions.height * zoom;
  const floorY = roomPosition.innerY + (CANVAS_HEIGHT * 0.4);

  // Calculate horizontal position using PositionCalculation utility
  const { xPos, elementWidth } = PositionCalculation.calculateElevationPosition(
    element,
    roomDimensions,
    roomPosition,
    active2DView,
    zoom,
    elevationWidth,
    elevationDepth
  );

  // Calculate vertical position using ComponentService
  const zPosition = ComponentService.getZPosition(element);
  const elevationHeightCm = ComponentService.getElevationHeight(element.component_id, element);

  const elementHeight = elevationHeightCm * zoom;
  const mountHeight = zPosition * zoom;
  const yPos = floorY - mountHeight - elementHeight;

  ctx.save();

  // Try database-driven rendering first
  const useDatabaseRendering = FeatureFlagService.isEnabled('use_database_2d_rendering');
  let renderedByDatabase = false;

  if (useDatabaseRendering) {
    try {
      const renderDef = render2DService.getCached(element.component_id);
      if (renderDef) {
        // Apply selection/hover colors
        if (isSelected) {
          ctx.fillStyle = '#ff6b6b';
        } else if (isHovered) {
          ctx.fillStyle = '#b0b0b0';
        } else {
          ctx.fillStyle = renderDef.fill_color || element.color || '#8b4513';
        }

        // Render using database-driven system
        renderElevationView(
          ctx,
          element,
          renderDef,
          active2DView as 'front' | 'back' | 'left' | 'right',
          xPos,
          yPos,
          elementWidth,
          elementHeight,
          zoom,
          roomDimensions
        );
        renderedByDatabase = true;
      }
    } catch (error) {
      Logger.warn('[ElevationViewRenderer] Database rendering failed, falling back to legacy:', error);
    }
  }

  // Fallback to legacy rendering
  if (!renderedByDatabase) {
    if (isSelected) {
      ctx.fillStyle = '#ff6b6b';
    } else if (isHovered) {
      ctx.fillStyle = '#b0b0b0';
    } else {
      ctx.fillStyle = element.color || '#8b4513';
    }

    ctx.fillRect(xPos, yPos, elementWidth, elementHeight);
  }

  // Element border (only when selected)
  if (isSelected) {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(xPos, yPos, elementWidth, elementHeight);
  }

  // Wireframe overlay
  if (showWireframe) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    ctx.strokeRect(xPos, yPos, elementWidth, elementHeight);
  }

  ctx.restore();
}

// =============================================================================
// ELEMENT FILTERING
// =============================================================================

/**
 * Check if element is a corner unit
 */
export function isCornerUnit(
  element: DesignElement,
  roomDimensions: { width: number; height: number }
): { isCorner: boolean; corner?: 'front-left' | 'front-right' | 'back-left' | 'back-right' } {
  const tolerance = 30; // cm tolerance for corner detection

  // Check each corner position
  if (element.x <= tolerance && element.y <= tolerance) {
    return { isCorner: true, corner: 'front-left' };
  }
  if (element.x >= roomDimensions.width - element.width - tolerance && element.y <= tolerance) {
    return { isCorner: true, corner: 'front-right' };
  }
  if (element.x <= tolerance && element.y >= roomDimensions.height - element.height - tolerance) {
    return { isCorner: true, corner: 'back-left' };
  }
  if (
    element.x >= roomDimensions.width - element.width - tolerance &&
    element.y >= roomDimensions.height - element.height - tolerance
  ) {
    return { isCorner: true, corner: 'back-right' };
  }

  return { isCorner: false };
}

/**
 * Get element wall association (updated to handle corner units)
 */
export function getElementWall(
  element: DesignElement,
  roomDimensions: { width: number; height: number }
): 'front' | 'back' | 'left' | 'right' | 'center' {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const tolerance = 50;

  // Check for corner units first
  const cornerInfo = isCornerUnit(element, roomDimensions);
  if (cornerInfo.isCorner) {
    // Return the primary wall for filtering purposes
    switch (cornerInfo.corner) {
      case 'front-left':
        return 'front'; // Also visible in 'left'
      case 'front-right':
        return 'front'; // Also visible in 'right'
      case 'back-left':
        return 'back'; // Also visible in 'left'
      case 'back-right':
        return 'back'; // Also visible in 'right'
    }
  }

  if (centerY <= tolerance) return 'front';
  if (centerY >= roomDimensions.height - tolerance) return 'back';
  if (centerX <= tolerance) return 'left';
  if (centerX >= roomDimensions.width - tolerance) return 'right';
  return 'center';
}

/**
 * Check if corner unit is visible in current elevation view
 */
export function isCornerVisibleInView(
  element: DesignElement,
  view: string,
  roomDimensions: { width: number; height: number }
): boolean {
  const cornerInfo = isCornerUnit(element, roomDimensions);
  if (!cornerInfo.isCorner) return false;

  switch (cornerInfo.corner) {
    case 'front-left':
      return view === 'front' || view === 'left';
    case 'front-right':
      return view === 'front' || view === 'right';
    case 'back-left':
      return view === 'back' || view === 'left';
    case 'back-right':
      return view === 'back' || view === 'right';
    default:
      return false;
  }
}
