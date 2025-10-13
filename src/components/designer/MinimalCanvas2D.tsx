/**
 * MinimalCanvas2D - Clean slate canvas implementation
 *
 * PHILOSOPHY: Build features incrementally, test each phase thoroughly
 *
 * CURRENT PHASE: Room outline only
 * - Draw room rectangle
 * - Support zoom
 * - No components, no grid, no selection, no drag & drop yet
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Design, DesignElement } from '../../types/project';
import { CoordinateSystem, createCoordinateSystem } from '../../utils/CoordinateSystem';

interface MinimalCanvas2DProps {
  design: Design;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onAddElement?: (element: DesignElement) => void;
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1200;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.0;

export const MinimalCanvas2D: React.FC<MinimalCanvas2DProps> = ({
  design,
  zoom: controlledZoom = 1.0,
  onZoomChange,
  onAddElement
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coordinateSystemRef = useRef<CoordinateSystem>(createCoordinateSystem());
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Get room dimensions
  const roomDimensions = design.roomDimensions;
  if (!roomDimensions) {
    throw new Error('Room dimensions are required');
  }

  // Update coordinate system when zoom or pan changes
  useEffect(() => {
    const coordSystem = coordinateSystemRef.current;
    coordSystem.setZoom(controlledZoom);
    coordSystem.setPanOffset(panOffset);

    // Calculate room offset to center the room on canvas
    const roomWidthPx = coordSystem.cmToPixels(roomDimensions.width);
    const roomHeightPx = coordSystem.cmToPixels(roomDimensions.height);
    const offsetX = (CANVAS_WIDTH - roomWidthPx) / 2;
    const offsetY = 100; // Top margin

    coordSystem.setCanvasInfo({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      offsetX,
      offsetY
    });
  }, [controlledZoom, panOffset, roomDimensions]);

  // Render function - ONLY draws room outline
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coordSystem = coordinateSystemRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Get room corners in canvas space
    const topLeft = coordSystem.worldToCanvas(0, 0);
    const roomWidthPx = coordSystem.cmToPixels(roomDimensions.width);
    const roomHeightPx = coordSystem.cmToPixels(roomDimensions.height);

    // Draw room outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(topLeft.x, topLeft.y, roomWidthPx, roomHeightPx);

    // ============================================================================
    // PHASE 3: Draw components as simple colored rectangles
    // ============================================================================
    if (design.elements) {
      design.elements.forEach((element) => {
        // Get position in canvas coordinates
        const pos = coordSystem.worldToCanvas(element.x, element.y);

        // Get size in canvas pixels
        const width = coordSystem.cmToPixels(element.width);
        const height = coordSystem.cmToPixels(element.depth || element.height);

        // Math confirmed: width = cmToPixels(element.width) = element.width × BASE(1.0) × zoom

        // Draw component as colored rectangle
        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.fillRect(pos.x, pos.y, width, height);

        // Draw border
        ctx.strokeStyle = '#4682B4'; // Steel blue
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x, pos.y, width, height);

        // Draw component type label
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          element.type || 'component',
          pos.x + width / 2,
          pos.y + height / 2
        );

        // Draw dimensions label
        ctx.font = '8px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(
          `${element.width}×${element.depth || element.height}cm`,
          pos.x + width / 2,
          pos.y + height / 2 + 12
        );
      });
    }

    // Draw room dimensions label
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${roomDimensions.width}cm × ${roomDimensions.height}cm`,
      topLeft.x + roomWidthPx / 2,
      topLeft.y - 10
    );

    // Draw zoom level and scale info in bottom-left (so it's not covered by UI)
    ctx.textAlign = 'left';
    ctx.fillText(
      `Zoom: ${(controlledZoom * 100).toFixed(0)}%`,
      10,
      CANVAS_HEIGHT - 40
    );

    // Draw coordinate system info (for debugging)
    ctx.fillText(
      `Scale: ${coordSystem.getCurrentScale().toFixed(2)} px/cm`,
      10,
      CANVAS_HEIGHT - 20
    );
  }, [controlledZoom, roomDimensions, design.elements]);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    render();
  }, [render]);

  // Handle mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, controlledZoom * delta));
      if (onZoomChange) {
        onZoomChange(newZoom);
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [controlledZoom, onZoomChange]);

  // ============================================================================
  // PHASE 4: Drag & Drop Handlers
  // ============================================================================
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    if (!onAddElement) return;

    try {
      // Get component data from drag event (key is 'component' from CompactComponentSidebar)
      const componentData = e.dataTransfer.getData('component');
      if (!componentData) {
        console.warn('❌ [DROP] No component data found');
        return;
      }

      const component = JSON.parse(componentData);
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Convert screen coordinates to world coordinates (cm)
      const rect = canvas.getBoundingClientRect();
      const coordSystem = coordinateSystemRef.current;
      const worldPos = coordSystem.screenToWorld(e.clientX, e.clientY, rect);

      // Center component on cursor (not top-left)
      const centeredX = worldPos.x - (component.width / 2);
      const centeredY = worldPos.y - (component.depth / 2);

      console.log('🎯 [DROP] Screen:', { x: e.clientX, y: e.clientY });
      console.log('🎯 [DROP] World (cursor):', worldPos);
      console.log('🎯 [DROP] World (centered):', { x: centeredX, y: centeredY });
      console.log('🎯 [DROP] Component:', component);

      // Create new element at drop position (centered on cursor)
      const newElement: DesignElement = {
        id: `element-${Date.now()}`,
        type: component.component_id || component.name,
        x: centeredX,
        y: centeredY,
        width: component.width,
        height: component.height,
        depth: component.depth,
        rotation: 0,
        component_id: component.component_id,
        z: component.default_z_position || 0
      };

      onAddElement(newElement);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [onAddElement]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-300 bg-white max-w-full max-h-full"
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {/* Debug info - Center Top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-purple-50 border-2 border-purple-300 p-3 rounded-lg shadow-lg text-sm z-50">
        <div className="font-bold text-purple-900 text-center mb-2">
          🎯 Clean Slate Canvas - Phase 4 (CRITICAL)
        </div>
        <div className="text-purple-700 text-center">
          Drag & Drop Enabled!
        </div>
        <div className="text-gray-600 mt-2 text-xs text-center">
          Room: {roomDimensions.width}×{roomDimensions.height}cm
        </div>
        <div className="text-gray-600 text-xs text-center">
          Zoom: {(controlledZoom * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
};
