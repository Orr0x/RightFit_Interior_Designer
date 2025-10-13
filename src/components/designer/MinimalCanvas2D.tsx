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
  onSelectElement?: (element: DesignElement | null) => void;
  onUpdateElement?: (element: DesignElement) => void;
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1200;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.0;

export const MinimalCanvas2D: React.FC<MinimalCanvas2DProps> = ({
  design,
  zoom: controlledZoom = 1.0,
  onZoomChange,
  onAddElement,
  onSelectElement,
  onUpdateElement
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coordinateSystemRef = useRef<CoordinateSystem>(createCoordinateSystem());
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Drag-to-move state
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [draggedElement, setDraggedElement] = useState<DesignElement | null>(null);

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
        // 🎯 Use dragged element position if this is the element being dragged (local state only!)
        const displayElement = (isDraggingElement && draggedElement && element.id === draggedElement.id)
          ? draggedElement
          : element;

        // Get position in canvas coordinates
        const pos = coordSystem.worldToCanvas(displayElement.x, displayElement.y);

        // Get size in canvas pixels
        const width = coordSystem.cmToPixels(displayElement.width);
        const height = coordSystem.cmToPixels(displayElement.depth || displayElement.height);

        // Math confirmed: width = cmToPixels(element.width) = element.width × BASE(1.0) × zoom

        // Draw component as colored rectangle
        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.fillRect(pos.x, pos.y, width, height);

        // Draw border INSIDE the rectangle boundary (not centered)
        // This ensures the component dimension (e.g., 60cm) is the TRUE OUTSIDE MEASUREMENT
        const isSelected = element.id === selectedElementId;
        const borderWidth = isSelected ? 4 : 2;
        ctx.strokeStyle = isSelected ? '#FF4500' : '#4682B4'; // Orange if selected, steel blue otherwise
        ctx.lineWidth = borderWidth;

        // Inset the stroke by half the border width to keep it fully inside
        const halfBorder = borderWidth / 2;
        ctx.strokeRect(
          pos.x + halfBorder,
          pos.y + halfBorder,
          width - borderWidth,
          height - borderWidth
        );

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
  }, [controlledZoom, roomDimensions, design.elements, selectedElementId, isDraggingElement, draggedElement]);

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
  // PHASE 5: Selection - Click to select component
  // ============================================================================
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const coordSystem = coordinateSystemRef.current;

    // Convert screen click to world coordinates
    const worldPos = coordSystem.screenToWorld(e.clientX, e.clientY, rect);

    console.log('🖱️ [Click] World:', worldPos);

    // Hit test: Find component at click position with Z-order awareness
    if (design.elements) {
      let foundElement: DesignElement | null = null;

      // Sort by Z-order descending (highest Z first) to ensure top-most layers are selected
      // This handles flooring (z=0) vs base units (z=10) vs wall units (z=150)
      const sortedByZ = [...design.elements].sort((a, b) => (b.z || 0) - (a.z || 0));

      // Iterate through Z-sorted elements
      for (let i = 0; i < sortedByZ.length; i++) {
        const element = sortedByZ[i];

        // Simple rectangle hit test
        const inBounds =
          worldPos.x >= element.x &&
          worldPos.x <= element.x + element.width &&
          worldPos.y >= element.y &&
          worldPos.y <= element.y + (element.depth || element.height);

        if (inBounds) {
          foundElement = element;
          break;
        }
      }

      if (foundElement) {
        console.log('✅ [Click] Selected:', {
          type: foundElement.type,
          id: foundElement.id,
          z: foundElement.z || 0,
          position: `(${foundElement.x}, ${foundElement.y})`
        });
        setSelectedElementId(foundElement.id);
        // Notify parent component about selection change
        if (onSelectElement) {
          onSelectElement(foundElement);
        }
      } else {
        console.log('❌ [Click] No component at position, deselecting');
        setSelectedElementId(null);
        // Notify parent component about deselection
        if (onSelectElement) {
          onSelectElement(null);
        }
      }
    }
  }, [design.elements, onSelectElement]);

  // ============================================================================
  // PHASE 6: Drag-to-Move Selected Components
  // ============================================================================
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedElementId) return; // Only drag if something is selected

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const coordSystem = coordinateSystemRef.current;
    const worldPos = coordSystem.screenToWorld(e.clientX, e.clientY, rect);

    // Check if mouse is over the selected element
    const selectedElement = design.elements?.find(el => el.id === selectedElementId);
    if (!selectedElement) return;

    const inBounds =
      worldPos.x >= selectedElement.x &&
      worldPos.x <= selectedElement.x + selectedElement.width &&
      worldPos.y >= selectedElement.y &&
      worldPos.y <= selectedElement.y + (selectedElement.depth || selectedElement.height);

    if (inBounds) {
      // Start drag operation
      setIsDraggingElement(true);
      setDragStartPos(worldPos);
      setDraggedElement({ ...selectedElement });

      console.log('🎯 [DRAG START]', {
        element: selectedElement.type,
        startPos: worldPos
      });
    }
  }, [selectedElementId, design.elements]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingElement || !dragStartPos || !draggedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const coordSystem = coordinateSystemRef.current;
    const worldPos = coordSystem.screenToWorld(e.clientX, e.clientY, rect);

    // Calculate offset from drag start
    const offsetX = worldPos.x - dragStartPos.x;
    const offsetY = worldPos.y - dragStartPos.y;

    // Update dragged element position
    const updatedElement: DesignElement = {
      ...draggedElement,
      x: draggedElement.x + offsetX,
      y: draggedElement.y + offsetY
    };

    setDraggedElement(updatedElement);
    setDragStartPos(worldPos);

    // NO database update during drag - only update local visual state for smooth dragging!
    // Database update happens only on mouse up (see handleMouseUp)
  }, [isDraggingElement, dragStartPos, draggedElement]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingElement && draggedElement) {
      console.log('🎯 [DRAG END]', {
        element: draggedElement.type,
        newPos: { x: draggedElement.x, y: draggedElement.y }
      });

      // Final update to parent
      if (onUpdateElement) {
        onUpdateElement(draggedElement);
      }
    }

    // Reset drag state
    setIsDraggingElement(false);
    setDragStartPos(null);
    setDraggedElement(null);
  }, [isDraggingElement, draggedElement, onUpdateElement]);

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
          maxHeight: '100%',
          cursor: isDraggingElement ? 'grabbing' : (selectedElementId ? 'grab' : 'default')
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Debug info - Center Top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-purple-50 border-2 border-purple-300 p-3 rounded-lg shadow-lg text-sm z-50">
        <div className="font-bold text-purple-900 text-center mb-2">
          🎯 Clean Slate Canvas - Phase 5
        </div>
        <div className="text-purple-700 text-center">
          Drag & Drop + Selection!
        </div>
        {selectedElementId && (
          <div className="text-orange-600 text-xs text-center mt-1">
            Selected: {design.elements?.find(e => e.id === selectedElementId)?.type || 'Unknown'}
          </div>
        )}
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
