/**
 * Plan View Renderer
 *
 * Handles all plan view specific rendering logic
 * Extracted from DesignCanvas2D.tsx as part of Story 1.15 refactor
 *
 * Story: 1.15 - Refactor DesignCanvas2D into Modular Components
 * Date: 2025-10-27
 */

import type { DesignElement, Design, ElevationViewConfig } from '@/types/project';
import type { RoomGeometry } from '@/types/RoomGeometry';
import { renderPlanView } from '@/services/2d-renderers';
import { render2DService } from '@/services/Render2DService';
import { Logger } from '@/utils/Logger';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  WALL_THICKNESS,
  calculateRoomPosition,
  type RoomPosition,
  type RoomBounds,
  type SnapGuides
} from './CanvasSharedUtilities';

// =============================================================================
// GRID RENDERING
// =============================================================================

/**
 * Draw grid overlay on canvas
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  showGrid: boolean,
  zoom: number,
  panOffset: { x: number; y: number }
): void {
  if (!showGrid) return;

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  const gridSize = GRID_SIZE * zoom;

  // Draw vertical lines
  for (let x = (panOffset.x % gridSize); x <= CANVAS_WIDTH; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let y = (panOffset.y % gridSize); y <= CANVAS_HEIGHT; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

// =============================================================================
// ROOM RENDERING
// =============================================================================

/**
 * Draw room walls and floor in plan view
 */
export function drawRoomPlanView(
  ctx: CanvasRenderingContext2D,
  innerRoomBounds: RoomBounds,
  outerRoomBounds: RoomBounds,
  roomPosition: RoomPosition,
  zoom: number,
  roomGeometry?: RoomGeometry | null
): void {
  const innerWidth = innerRoomBounds.width * zoom;
  const innerHeight = innerRoomBounds.height * zoom;
  const outerWidth = outerRoomBounds.width * zoom;
  const outerHeight = outerRoomBounds.height * zoom;
  const wallThickness = WALL_THICKNESS * zoom;

  if (roomGeometry) {
    // Complex room geometry (L-shape, U-shape, custom polygons)
    const vertices = roomGeometry.floor.vertices;

    // Convert vertices to canvas coordinates
    const canvasVertices = vertices.map(v => [
      roomPosition.innerX + v[0] * zoom,
      roomPosition.innerY + v[1] * zoom
    ]);

    // Draw floor (usable space)
    ctx.fillStyle = '#f9f9f9';
    ctx.beginPath();
    ctx.moveTo(canvasVertices[0][0], canvasVertices[0][1]);
    for (let i = 1; i < canvasVertices.length; i++) {
      ctx.lineTo(canvasVertices[i][0], canvasVertices[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    // Draw floor outline (inner boundary)
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.stroke();

    // Draw wall segments
    roomGeometry.walls.forEach(wall => {
      const startX = roomPosition.innerX + wall.start[0] * zoom;
      const startY = roomPosition.innerY + wall.start[1] * zoom;
      const endX = roomPosition.innerX + wall.end[0] * zoom;
      const endY = roomPosition.innerY + wall.end[1] * zoom;
      const thickness = (wall.thickness || WALL_THICKNESS) * zoom;

      // Calculate wall perpendicular vector (for thickness)
      const dx = endX - startX;
      const dy = endY - startY;
      const len = Math.sqrt(dx * dx + dy * dy);
      const perpX = (-dy / len) * thickness / 2;
      const perpY = (dx / len) * thickness / 2;

      // Draw wall as thick line
      ctx.fillStyle = '#e5e5e5';
      ctx.beginPath();
      ctx.moveTo(startX + perpX, startY + perpY);
      ctx.lineTo(endX + perpX, endY + perpY);
      ctx.lineTo(endX - perpX, endY - perpY);
      ctx.lineTo(startX - perpX, startY - perpY);
      ctx.closePath();
      ctx.fill();

      // Draw wall outline
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  } else {
    // Simple rectangular room
    // Draw outer walls (thick rectangles)
    ctx.fillStyle = '#e5e5e5';
    ctx.fillRect(roomPosition.outerX, roomPosition.outerY, outerWidth, outerHeight);

    // Draw inner room (usable space)
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(roomPosition.innerX, roomPosition.innerY, innerWidth, innerHeight);

    // Draw inner room outline
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(roomPosition.innerX, roomPosition.innerY, innerWidth, innerHeight);
  }
}

// =============================================================================
// ELEMENT RENDERING
// =============================================================================

/**
 * Draw a single element in plan view
 */
export async function drawElementPlanView(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  zoom: number,
  roomToCanvas: (x: number, y: number) => { x: number; y: number },
  isSelected: boolean = false,
  isHovered: boolean = false,
  showWireframe: boolean = false,
  showColorDetail: boolean = true
): Promise<void> {
  const pos = roomToCanvas(element.x, element.y);
  const width = element.width * zoom;
  const depth = (element.depth || element.height) * zoom;
  const rotation = element.rotation || 0;

  // Save context state
  ctx.save();

  // Translate and rotate for element
  ctx.translate(pos.x, pos.y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Try database-driven rendering first
  let renderedByDatabase = false;
  try {
    const renderDef = await render2DService.get2DRender(element.component_id);
    if (renderDef) {
      // Apply colors based on render mode
      if (showWireframe) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = '#666';
      } else if (!showColorDetail) {
        ctx.fillStyle = '#d4d4d4';
      } else {
        ctx.fillStyle = renderDef.fill_color || element.color || '#8b4513';
      }

      // Render using database-driven system
      renderPlanView(ctx, element, renderDef, zoom);
      renderedByDatabase = true;
    }
  } catch (error) {
    Logger.warn('[PlanViewRenderer] Database rendering failed, falling back to legacy:', error);
  }

  // Fallback to simple rectangle if database rendering failed
  if (!renderedByDatabase) {
    if (showWireframe) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = '#666';
    } else if (!showColorDetail) {
      ctx.fillStyle = '#d4d4d4';
    } else {
      ctx.fillStyle = element.color || '#8b4513';
    }

    ctx.fillRect(0, 0, width, depth);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, depth);
  }

  // Draw selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(0, 0, width, depth);

    // Draw rotation handle
    const handleRadius = 8;
    const handleY = -20;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(width / 2, handleY, handleRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw hover highlight
  if (isHovered && !isSelected) {
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(0, 0, width, depth);
  }

  // Restore context
  ctx.restore();
}

// =============================================================================
// SNAP GUIDES
// =============================================================================

/**
 * Draw snap guide lines
 */
export function drawSnapGuides(
  ctx: CanvasRenderingContext2D,
  snapGuides: SnapGuides,
  roomPosition: RoomPosition,
  zoom: number
): void {
  if (snapGuides.vertical.length === 0 && snapGuides.horizontal.length === 0) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  // Draw vertical guides
  snapGuides.vertical.forEach(x => {
    const canvasX = roomPosition.innerX + x * zoom;
    ctx.beginPath();
    ctx.moveTo(canvasX, 0);
    ctx.lineTo(canvasX, CANVAS_HEIGHT);
    ctx.stroke();
  });

  // Draw horizontal guides
  snapGuides.horizontal.forEach(y => {
    const canvasY = roomPosition.innerY + y * zoom;
    ctx.beginPath();
    ctx.moveTo(0, canvasY);
    ctx.lineTo(CANVAS_WIDTH, canvasY);
    ctx.stroke();
  });

  ctx.restore();
}

// =============================================================================
// DRAG PREVIEW
// =============================================================================

/**
 * Draw drag preview at mouse position
 */
export function drawDragPreview(
  ctx: CanvasRenderingContext2D,
  draggedElement: DesignElement | null,
  currentMousePos: { x: number; y: number },
  canvasToRoom: (x: number, y: number) => { x: number; y: number },
  roomToCanvas: (x: number, y: number) => { x: number; y: number },
  zoom: number
): void {
  if (!draggedElement) return;

  const roomPos = canvasToRoom(currentMousePos.x, currentMousePos.y);
  const pos = roomToCanvas(roomPos.x, roomPos.y);
  const width = draggedElement.width * zoom;
  const depth = (draggedElement.depth || draggedElement.height) * zoom;
  const rotation = draggedElement.rotation || 0;

  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.translate(pos.x, pos.y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Draw preview
  ctx.fillStyle = draggedElement.color || '#8b4513';
  ctx.fillRect(0, 0, width, depth);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(0, 0, width, depth);

  ctx.restore();
}

// =============================================================================
// TAPE MEASURE
// =============================================================================

/**
 * Draw tape measure visualization
 */
export function drawTapeMeasure(
  ctx: CanvasRenderingContext2D,
  completedMeasurements: Array<{ start: { x: number; y: number }, end: { x: number; y: number } }>,
  currentMeasureStart: { x: number; y: number } | null,
  tapeMeasurePreview: { x: number; y: number } | null,
  zoom: number
): void {
  ctx.save();

  // Helper to draw a single measurement
  const drawSingleMeasurement = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    isCompleted: boolean,
    index?: number
  ) => {
    // Draw line
    ctx.strokeStyle = isCompleted ? '#10b981' : '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Draw end points
    ctx.fillStyle = isCompleted ? '#10b981' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(end.x, end.y, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Calculate distance in cm
    const dx = (end.x - start.x) / zoom;
    const dy = (end.y - start.y) / zoom;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Draw distance label
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    ctx.fillStyle = isCompleted ? '#065f46' : '#1e40af';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // White background for text
    const text = `${Math.round(distance)} cm${isCompleted && index !== undefined ? ` (#${index + 1})` : ''}`;
    const textMetrics = ctx.measureText(text);
    const padding = 4;
    ctx.fillStyle = 'white';
    ctx.fillRect(
      midX - textMetrics.width / 2 - padding,
      midY - 10,
      textMetrics.width + padding * 2,
      20
    );

    // Text
    ctx.fillStyle = isCompleted ? '#065f46' : '#1e40af';
    ctx.fillText(text, midX, midY);
  };

  // Draw all completed measurements
  completedMeasurements.forEach((measurement, index) => {
    drawSingleMeasurement(measurement.start, measurement.end, true, index);
  });

  // Draw current measurement in progress
  if (currentMeasureStart) {
    if (tapeMeasurePreview) {
      drawSingleMeasurement(currentMeasureStart, tapeMeasurePreview, false);
    } else {
      // Just show start point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(currentMeasureStart.x, currentMeasureStart.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('START', currentMeasureStart.x, currentMeasureStart.y - 15);
    }
  }

  ctx.restore();
}

// =============================================================================
// RULER
// =============================================================================

/**
 * Draw ruler/dimension lines around room
 */
export function drawRuler(
  ctx: CanvasRenderingContext2D,
  showRuler: boolean,
  roomDimensions: { width: number; height: number },
  roomPosition: RoomPosition,
  zoom: number
): void {
  if (!showRuler) return;

  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.font = '10px Arial';
  ctx.fillStyle = '#666';

  // Horizontal ruler (top)
  const rulerY = roomPosition.innerY - 30;

  ctx.beginPath();
  ctx.moveTo(roomPosition.innerX, rulerY);
  ctx.lineTo(roomPosition.innerX + roomDimensions.width * zoom, rulerY);
  ctx.stroke();

  for (let x = 0; x <= roomDimensions.width; x += 50) {
    const xPos = roomPosition.innerX + x * zoom;
    ctx.beginPath();
    ctx.moveTo(xPos, rulerY - 5);
    ctx.lineTo(xPos, rulerY + 5);
    ctx.stroke();

    if (x > 0) {
      ctx.textAlign = 'center';
      ctx.fillText(`${x}cm`, xPos, rulerY - 10);
    }
  }

  // Vertical ruler (left)
  const rulerX = roomPosition.innerX - 30;

  ctx.beginPath();
  ctx.moveTo(rulerX, roomPosition.innerY);
  ctx.lineTo(rulerX, roomPosition.innerY + roomDimensions.height * zoom);
  ctx.stroke();

  for (let y = 0; y <= roomDimensions.height; y += 50) {
    const yPos = roomPosition.innerY + y * zoom;
    ctx.beginPath();
    ctx.moveTo(rulerX - 5, yPos);
    ctx.lineTo(rulerX + 5, yPos);
    ctx.stroke();

    if (y > 0) {
      ctx.save();
      ctx.translate(rulerX - 10, yPos);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(`${y}cm`, 0, 0);
      ctx.restore();
    }
  }
}
