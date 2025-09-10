import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DesignElement, Design } from '../../types/project';

// Throttle function for performance optimization
const throttle = (func: (...args: unknown[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  return (...args: unknown[]) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};


interface DesignCanvas2DProps {
  design: Design;
  selectedElement: DesignElement | null;
  onSelectElement: (element: DesignElement | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<DesignElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onUpdateRoomDimensions: (dimensions: { width: number; height: number }) => void;
  onAddElement: (element: DesignElement) => void;
  showGrid?: boolean;
  showRuler?: boolean;
  activeTool?: 'select' | 'fit-screen' | 'pan' | 'tape-measure' | 'none';
  fitToScreenSignal?: number;
  active2DView: 'plan' | 'front' | 'back' | 'left' | 'right';
  // Tape measure props - multi-measurement support
  completedMeasurements?: { start: { x: number; y: number }, end: { x: number; y: number } }[];
  currentMeasureStart?: { x: number; y: number } | null;
  tapeMeasurePreview?: { x: number; y: number } | null;
  onTapeMeasureClick?: (x: number, y: number) => void;
  onTapeMeasureMouseMove?: (x: number, y: number) => void;
  onClearTapeMeasure?: () => void;
}

// Default room dimensions for kitchen (matching reference images)
const DEFAULT_ROOM = {
  width: 600, // cm
  height: 400, // cm
  wallHeight: 240 // cm
};

// Canvas constants
const CANVAS_WIDTH = 1200; // Large workspace
const CANVAS_HEIGHT = 800; // Large workspace
const GRID_SIZE = 20; // Grid spacing in pixels
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;

// Component data for smart orientation
const COMPONENT_DATA: Record<string, { 
  hasDirection: boolean; 
  doorSide: 'front' | 'back' | 'left' | 'right';
  mountType: 'floor' | 'wall';
  defaultDepth: number;
}> = {
  'cabinet': { hasDirection: true, doorSide: 'front', mountType: 'floor', defaultDepth: 60 },
  'base-cabinet': { hasDirection: true, doorSide: 'front', mountType: 'floor', defaultDepth: 60 },
  'wall-cabinet': { hasDirection: true, doorSide: 'front', mountType: 'wall', defaultDepth: 35 },
  'appliance': { hasDirection: true, doorSide: 'front', mountType: 'floor', defaultDepth: 60 }
};

export const DesignCanvas2D: React.FC<DesignCanvas2DProps> = ({
  design,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onUpdateRoomDimensions,
  onAddElement,
  showGrid = true,
  showRuler = false,
  activeTool = 'select',
  fitToScreenSignal = 0,
  active2DView = 'plan',
  // Tape measure props - multi-measurement support
  completedMeasurements = [],
  currentMeasureStart = null,
  tapeMeasurePreview = null,
  onTapeMeasureClick,
  onTapeMeasureMouseMove,
  onClearTapeMeasure
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<DesignElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<DesignElement | null>(null);
  const [snapGuides, setSnapGuides] = useState<{
    vertical: number[];
    horizontal: number[];
    snapPoint: { x: number; y: number } | null;
  }>({ vertical: [], horizontal: [], snapPoint: null });

  // Use design dimensions or default
  const roomDimensions = design.roomDimensions || DEFAULT_ROOM;
  
  // Room positioning - center the room in the canvas
  const roomPosition = {
    x: (CANVAS_WIDTH / 2) - (roomDimensions.width * zoom / 2) + panOffset.x,
    y: (CANVAS_HEIGHT / 2) - (roomDimensions.height * zoom / 2) + panOffset.y
  };

  // Convert room coordinates to canvas coordinates
  const roomToCanvas = useCallback((roomX: number, roomY: number) => {
    return {
      x: roomPosition.x + (roomX * zoom),
      y: roomPosition.y + (roomY * zoom)
    };
  }, [roomPosition, zoom]);

  // Convert canvas coordinates to room coordinates
  const canvasToRoom = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: (canvasX - roomPosition.x) / zoom,
      y: (canvasY - roomPosition.y) / zoom
    };
  }, [roomPosition, zoom]);

  // Snap to grid function
  const snapToGrid = useCallback((value: number) => {
    const gridSizeInRoom = GRID_SIZE / zoom;
    return Math.round(value / gridSizeInRoom) * gridSizeInRoom;
  }, [zoom]);

  // Smart snap detection for walls and components
  const getSnapPosition = useCallback((element: DesignElement, x: number, y: number) => {
    const snapTolerance = 15; // cm
    let snappedX = x;
    let snappedY = y;
    let rotation = element.rotation || 0;
    const guides = { vertical: [] as number[], horizontal: [] as number[] };

    // Wall snapping
    const distToLeft = x;
    const distToRight = roomDimensions.width - (x + element.width);
    const distToTop = y;
    const distToBottom = roomDimensions.height - (y + element.height);

    // Snap to walls
    if (distToLeft <= snapTolerance) {
      snappedX = 0;
      guides.vertical.push(0);
    } else if (distToRight <= snapTolerance) {
      snappedX = roomDimensions.width - element.width;
      guides.vertical.push(roomDimensions.width);
    }

    if (distToTop <= snapTolerance) {
      snappedY = 0;
      guides.horizontal.push(0);
    } else if (distToBottom <= snapTolerance) {
      snappedY = roomDimensions.height - element.height;
      guides.horizontal.push(roomDimensions.height);
    }

    // Component-to-component snapping
    const otherElements = design.elements.filter(el => el.id !== element.id);
    
    for (const otherEl of otherElements) {
      // Horizontal alignment (same Y or adjacent Y)
      const topAlign = Math.abs(y - otherEl.y);
      const bottomAlign = Math.abs((y + element.height) - (otherEl.y + otherEl.height));
      const centerAlignY = Math.abs((y + element.height/2) - (otherEl.y + otherEl.height/2));
      
      if (topAlign <= snapTolerance) {
        snappedY = otherEl.y;
        guides.horizontal.push(otherEl.y);
      } else if (bottomAlign <= snapTolerance) {
        snappedY = otherEl.y + otherEl.height - element.height;
        guides.horizontal.push(otherEl.y + otherEl.height);
      } else if (centerAlignY <= snapTolerance) {
        snappedY = otherEl.y + otherEl.height/2 - element.height/2;
        guides.horizontal.push(otherEl.y + otherEl.height/2);
      }

      // Vertical alignment (same X or adjacent X)
      const leftAlign = Math.abs(x - otherEl.x);
      const rightAlign = Math.abs((x + element.width) - (otherEl.x + otherEl.width));
      const centerAlignX = Math.abs((x + element.width/2) - (otherEl.x + otherEl.width/2));
      
      if (leftAlign <= snapTolerance) {
        snappedX = otherEl.x;
        guides.vertical.push(otherEl.x);
      } else if (rightAlign <= snapTolerance) {
        snappedX = otherEl.x + otherEl.width - element.width;
        guides.vertical.push(otherEl.x + otherEl.width);
      } else if (centerAlignX <= snapTolerance) {
        snappedX = otherEl.x + otherEl.width/2 - element.width/2;
        guides.vertical.push(otherEl.x + otherEl.width/2);
      }

      // Adjacent snapping (edge-to-edge)
      const adjacentRight = Math.abs(x - (otherEl.x + otherEl.width));
      const adjacentLeft = Math.abs((x + element.width) - otherEl.x);
      const adjacentBottom = Math.abs(y - (otherEl.y + otherEl.height));
      const adjacentTop = Math.abs((y + element.height) - otherEl.y);

      if (adjacentRight <= snapTolerance && Math.abs(y - otherEl.y) <= snapTolerance * 2) {
        snappedX = otherEl.x + otherEl.width;
        guides.vertical.push(otherEl.x + otherEl.width);
      }
      if (adjacentLeft <= snapTolerance && Math.abs(y - otherEl.y) <= snapTolerance * 2) {
        snappedX = otherEl.x - element.width;
        guides.vertical.push(otherEl.x);
      }
      if (adjacentBottom <= snapTolerance && Math.abs(x - otherEl.x) <= snapTolerance * 2) {
        snappedY = otherEl.y + otherEl.height;
        guides.horizontal.push(otherEl.y + otherEl.height);
      }
      if (adjacentTop <= snapTolerance && Math.abs(x - otherEl.x) <= snapTolerance * 2) {
        snappedY = otherEl.y - element.height;
        guides.horizontal.push(otherEl.y);
      }
    }

    // Enhanced smart wall orientation - doors always face away from walls into the room
    const componentData = COMPONENT_DATA[element.type];
    if (componentData?.hasDirection) {
      const wallSnapDistance = 35; // cm - increased for better detection
      
      // Calculate distances to each wall
      const distToLeft = snappedX;
      const distToRight = roomDimensions.width - (snappedX + element.width);
      const distToTop = snappedY;
      const distToBottom = roomDimensions.height - (snappedY + element.height);
      
      // Find the closest wall and orient accordingly
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      
      if (minDist <= wallSnapDistance) {
        // Orient based on closest wall - doors always face into the room
        if (minDist === distToLeft) {
          // Against left wall - face right (into room)
          rotation = 90;
          guides.vertical.push(0);
        } else if (minDist === distToRight) {
          // Against right wall - face left (into room)
          rotation = 270;
          guides.vertical.push(roomDimensions.width);
        } else if (minDist === distToTop) {
          // Against top wall - face down (into room)
          rotation = 180;
          guides.horizontal.push(0);
        } else if (minDist === distToBottom) {
          // Against bottom wall - face up (into room)
          rotation = 0;
          guides.horizontal.push(roomDimensions.height);
        }
      } else {
        // If not against a wall, check if very close and auto-orient
        if (distToLeft <= 10) {
          rotation = 90; // Face right
          snappedX = 0; // Snap to wall
          guides.vertical.push(0);
        } else if (distToRight <= 10) {
          rotation = 270; // Face left
          snappedX = roomDimensions.width - element.width; // Snap to wall
          guides.vertical.push(roomDimensions.width);
        } else if (distToTop <= 10) {
          rotation = 180; // Face down
          snappedY = 0; // Snap to wall
          guides.horizontal.push(0);
        } else if (distToBottom <= 10) {
          rotation = 0; // Face up
          snappedY = roomDimensions.height - element.height; // Snap to wall
          guides.horizontal.push(roomDimensions.height);
        }
      }
    }

    return { x: snappedX, y: snappedY, rotation, guides };
  }, [roomDimensions, design.elements]);

  // Draw full canvas grid
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
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
  }, [showGrid, zoom, panOffset]);

  // Draw room within canvas
  const drawRoom = useCallback((ctx: CanvasRenderingContext2D) => {
    const roomWidth = roomDimensions.width * zoom;
    const roomHeight = roomDimensions.height * zoom;

    if (active2DView === 'plan') {
      // Plan view - draw room as rectangle
      ctx.fillStyle = '#f9f9f9';
      ctx.fillRect(roomPosition.x, roomPosition.y, roomWidth, roomHeight);

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(roomPosition.x, roomPosition.y, roomWidth, roomHeight);

      // Room dimensions labels
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      // Width label (top)
      ctx.fillText(
        `${roomDimensions.width}cm`,
        roomPosition.x + roomWidth / 2,
        roomPosition.y - 10
      );

      // Height label (left)
      ctx.save();
      ctx.translate(roomPosition.x - 20, roomPosition.y + roomHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${roomDimensions.height}cm`, 0, 0);
      ctx.restore();

    } else {
      // Elevation view - draw room as elevation (aligned to top)
      const wallHeight = DEFAULT_ROOM.wallHeight * zoom;
      const topY = roomPosition.y + 50; // Start from top with padding
      const floorY = topY + wallHeight; // Floor at bottom of wall height

      // Draw wall boundaries
      ctx.fillStyle = '#f9f9f9';
      ctx.fillRect(roomPosition.x, topY, roomWidth, wallHeight);

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(roomPosition.x, topY, roomWidth, wallHeight);

      // Floor line
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(roomPosition.x, floorY);
      ctx.lineTo(roomPosition.x + roomWidth, floorY);
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
        wallLabels[active2DView] || '',
        roomPosition.x + roomWidth / 2,
        roomPosition.y - 20
      );

      // Dimension labels
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      
      // Width dimension (bottom)
      let widthText = '';
      if (active2DView === 'front' || active2DView === 'back') {
        widthText = `${roomDimensions.width}cm`;
      } else {
        widthText = `${roomDimensions.height}cm`;
      }
      ctx.textAlign = 'center';
      ctx.fillText(widthText, roomPosition.x + roomWidth / 2, floorY + 20);
      
      // Wall height dimension (left side)
      const heightText = `${DEFAULT_ROOM.wallHeight}cm`;
      ctx.save();
      ctx.translate(roomPosition.x - 35, topY + wallHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(heightText, 0, 0);
      ctx.restore();
      
      // Height indicator line with arrows
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      const indicatorX = roomPosition.x - 25;
      
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
  }, [roomDimensions, roomPosition, zoom, active2DView]);

  // Draw element with smart rendering
  const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: DesignElement) => {
    const isSelected = selectedElement?.id === element.id;
    const isHovered = hoveredElement?.id === element.id;
    
    if (active2DView === 'plan') {
      // Plan view rendering
      const pos = roomToCanvas(element.x, element.y);
      const width = element.width * zoom;
      const height = element.height * zoom;
      const rotation = element.rotation || 0;

      ctx.save();
      
      // Apply rotation - convert degrees to radians if needed
      ctx.translate(pos.x + width / 2, pos.y + height / 2);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-width / 2, -height / 2);

      // Element fill
      if (isSelected) {
        ctx.fillStyle = '#ff6b6b';
      } else if (isHovered) {
        ctx.fillStyle = '#b0b0b0';
      } else {
        ctx.fillStyle = element.color || '#8b4513';
      }
      
      ctx.fillRect(0, 0, width, height);

      // Element border
      ctx.strokeStyle = isSelected ? '#ff0000' : '#333';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.setLineDash([]);
      ctx.strokeRect(0, 0, width, height);

      // In plan view, show solid blocks without cabinet details or text labels
      // Cabinet details and text are not appropriate for top-down view

      ctx.restore();

      // Selection handles (drawn after restore)
      if (isSelected) {
        drawSelectionHandles(ctx, pos.x, pos.y, width, height);
      }

    } else {
      // Elevation view rendering
      drawElementElevation(ctx, element, isSelected, isHovered);
    }
  }, [active2DView, roomToCanvas, selectedElement, hoveredElement, zoom]);

  // Draw cabinet details (doors, handles)
  const drawCabinetDetails = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    
    // Door dividers
    const doorWidth = width / 2;
    ctx.beginPath();
    ctx.moveTo(doorWidth, 0);
    ctx.lineTo(doorWidth, height);
    ctx.stroke();
    
    // Door handles
    ctx.fillStyle = '#333';
    const handleSize = 3;
    const handleY = height / 2;
    
    // Left door handle
    ctx.fillRect(doorWidth * 0.8 - handleSize/2, handleY - handleSize/2, handleSize, handleSize);
    
    // Right door handle  
    ctx.fillRect(doorWidth * 1.2 - handleSize/2, handleY - handleSize/2, handleSize, handleSize);
  };

  // Draw selection handles
  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    const handleSize = 8;
    ctx.fillStyle = '#ff6b6b';
    
    const handles = [
      { x: x - handleSize/2, y: y - handleSize/2 },
      { x: x + width - handleSize/2, y: y - handleSize/2 },
      { x: x - handleSize/2, y: y + height - handleSize/2 },
      { x: x + width - handleSize/2, y: y + height - handleSize/2 }
    ];
    
    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
    });
  };

  // Draw element in elevation view with detailed fronts
  const drawElementElevation = (ctx: CanvasRenderingContext2D, element: DesignElement, isSelected: boolean, isHovered: boolean) => {
    // Check if element should be visible in current elevation view
    const wall = getElementWall(element);
    const isCornerVisible = isCornerVisibleInView(element, active2DView);
    
    if (!isCornerVisible && wall !== active2DView && wall !== 'center') return;

    const componentData = COMPONENT_DATA[element.type] || { mountType: 'floor', defaultDepth: 60 };
    const roomWidth = roomDimensions.width * zoom;
    const wallHeight = DEFAULT_ROOM.wallHeight * zoom;
    const topY = roomPosition.y + 50; // Top of elevation view
    const floorY = topY + wallHeight; // Floor at bottom of wall height
    
    // Calculate horizontal position
    let xPos: number;
    let elementWidth: number;
    
    if (active2DView === 'front' || active2DView === 'back') {
      xPos = roomPosition.x + (element.x / roomDimensions.width) * roomWidth;
      elementWidth = (element.width / roomDimensions.width) * roomWidth;
    } else if (active2DView === 'left') {
      // Left wall view - flip horizontally (mirror Y coordinate)
      // When looking at left wall from inside room, far end of room appears on left side of view
      const flippedY = roomDimensions.height - element.y - element.height;
      xPos = roomPosition.x + (flippedY / roomDimensions.height) * roomWidth;
      elementWidth = (componentData.defaultDepth / roomDimensions.height) * roomWidth;
    } else { // right wall
      xPos = roomPosition.x + (element.y / roomDimensions.height) * roomWidth;
      elementWidth = (componentData.defaultDepth / roomDimensions.height) * roomWidth;
    }
    
    // Calculate vertical position and height based on component type
    let elementHeight: number;
    let yPos: number;
    
    // More robust type checking for wall cabinets
    const isWallCabinet = element.type.includes('wall-cabinet') ||
                         element.type.includes('wall_cabinet') ||
                         element.style?.toLowerCase().includes('wall');
    
    if (isWallCabinet) {
      // Wall cabinet dimensions and positioning
      elementHeight = 70 * zoom; // Wall cabinet height (70cm)
      const wallCabinetBottomHeight = 135 * zoom; // 135cm from floor (base cabinet + counter + gap)
      yPos = floorY - wallCabinetBottomHeight - elementHeight; // Position from floor level
    } else if (element.type.includes('appliance')) {
      if (element.style?.toLowerCase().includes('refrigerator')) {
        elementHeight = 180 * zoom; // Tall refrigerator
        yPos = floorY - elementHeight;
      } else {
        elementHeight = 85 * zoom; // Standard appliance height
        yPos = floorY - elementHeight;
      }
    } else {
      // Base cabinet (default)
      elementHeight = 85 * zoom; // Standard base cabinet height
      yPos = floorY - elementHeight;
    }

    // Draw detailed elevation view
    ctx.save();

    // Main cabinet body
    if (isSelected) {
      ctx.fillStyle = '#ff6b6b';
    } else if (isHovered) {
      ctx.fillStyle = '#b0b0b0';
    } else {
      ctx.fillStyle = element.color || '#8b4513';
    }
    
    ctx.fillRect(xPos, yPos, elementWidth, elementHeight);

    // Element border
    ctx.strokeStyle = isSelected ? '#ff0000' : '#333';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(xPos, yPos, elementWidth, elementHeight);

    // Draw detailed fronts based on component type
    if (element.type.includes('cabinet')) {
      drawCabinetElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    } else if (element.type.includes('appliance')) {
      drawApplianceElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    }

    ctx.restore();
  };

  // Draw detailed cabinet elevation with doors and handles
  const drawCabinetElevationDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, element: DesignElement) => {
    const doorInset = 3;
    const handleSize = Math.max(2, width * 0.02);
    const showDoorFace = shouldShowCornerDoorFace(element, active2DView);
    
    ctx.strokeStyle = '#4a3728';
    ctx.lineWidth = 1;

    // If this is a corner unit showing the back panel, draw simplified back view
    if (!showDoorFace && isCornerUnit(element).isCorner) {
      // Draw simple back panel for corner unit
      ctx.strokeStyle = '#5a4738';
      ctx.lineWidth = 1;
      
      // Back panel outline
      ctx.strokeRect(x + doorInset, y + doorInset, width - doorInset * 2, height - doorInset * 2);
      
      // Simple back panel detail (vertical lines for wood grain effect)
      ctx.strokeStyle = '#6a5748';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 4; i++) {
        const lineX = x + (width / 4) * i;
        ctx.beginPath();
        ctx.moveTo(lineX, y + doorInset * 2);
        ctx.lineTo(lineX, y + height - doorInset * 2);
        ctx.stroke();
      }
      return;
    }

    // Check if this is a wall cabinet
    const isWallCabinet = element.type.includes('wall-cabinet') ||
                         element.type.includes('wall_cabinet') ||
                         element.style?.toLowerCase().includes('wall');

    if (isWallCabinet) {
      // Wall cabinet - typically 2 doors, NO toe kick
      const doorCount = width > 80 ? 2 : 1;
      const doorWidth = (width - doorInset * 2) / doorCount;
      
      for (let i = 0; i < doorCount; i++) {
        const doorX = x + doorInset + i * doorWidth;
        const doorY = y + doorInset;
        const doorH = height - doorInset * 2; // Full height for wall cabinets (no toe kick)
        
        // Door panel
        ctx.strokeRect(doorX, doorY, doorWidth - (i < doorCount - 1 ? 1 : 0), doorH);
        
        // Door frame detail
        ctx.strokeRect(doorX + 3, doorY + 3, doorWidth - 6 - (i < doorCount - 1 ? 1 : 0), doorH - 6);
        
        // Handle (positioned lower on wall cabinets for accessibility)
        const handleX = doorCount === 1 ? doorX + doorWidth * 0.8 : (i === 0 ? doorX + doorWidth * 0.7 : doorX + doorWidth * 0.3);
        const handleY = doorY + doorH * 0.7; // Lower position on wall cabinets
        
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(handleX - handleSize/2, handleY - handleSize*2, handleSize, handleSize*4);
      }
    } else if (element.type.includes('base-cabinet') || element.type === 'cabinet') {
      // Base cabinet - doors and possibly drawers with toe kick
      const hasDoors = true;
      const cornerInfo = isCornerUnit(element);
      const isCorner = cornerInfo.isCorner;
      
      // Corner units have different door configurations
      const doorCount = isCorner ? 1 : (width > 100 ? 2 : 1);
      const toeKickHeight = 8 * zoom; // 8cm toe kick
      
      // Draw toe kick (recessed area at bottom)
      const toeKickDepth = 3; // Visual depth in pixels
      ctx.fillStyle = '#3d2f1f'; // Darker shade for recessed appearance
      ctx.fillRect(x + toeKickDepth, y + height - toeKickHeight, width - toeKickDepth * 2, toeKickHeight);
      
      // Toe kick border (top edge)
      ctx.strokeStyle = '#2c1810';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + toeKickDepth, y + height - toeKickHeight);
      ctx.lineTo(x + width - toeKickDepth, y + height - toeKickHeight);
      ctx.stroke();
      
      if (hasDoors && showDoorFace) {
        const doorWidth = isCorner ? width * 0.6 : ((width - doorInset * 2) / doorCount); // Corner units have narrow doors
        const adjustedDoorHeight = height - doorInset * 2 - toeKickHeight; // Account for toe kick
        
        for (let i = 0; i < doorCount; i++) {
          const doorX = isCorner ? x + doorInset : (x + doorInset + i * doorWidth);
          const doorY = y + doorInset;
          const doorH = adjustedDoorHeight;
          const doorW = isCorner ? doorWidth : (doorWidth - (i < doorCount - 1 ? 1 : 0));
          
          // Door panel
          ctx.strokeRect(doorX, doorY, doorW, doorH);
          
          // Door frame detail
          ctx.strokeRect(doorX + 4, doorY + 4, doorW - 8, doorH - 8);
          
          // Handle (corner units have handle on the right side of the narrow door)
          const handleX = isCorner ? doorX + doorW * 0.9 : (doorCount === 1 ? doorX + doorW * 0.8 : (i === 0 ? doorX + doorW * 0.8 : doorX + doorW * 0.2));
          const handleY = doorY + doorH * 0.5;
          
          ctx.fillStyle = '#2c1810';
          ctx.fillRect(handleX - handleSize/2, handleY - handleSize*3, handleSize, handleSize*6);
        }
      } else if (!showDoorFace && isCorner) {
        // Corner unit back panel - show side view
        ctx.strokeStyle = '#5a4738';
        ctx.strokeRect(x + doorInset, y + doorInset, width - doorInset * 2, height - doorInset * 2 - toeKickHeight);
        
        // Side panel details (horizontal lines)
        ctx.strokeStyle = '#6a5748';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 3; i++) {
          const lineY = y + doorInset + (height - doorInset * 2 - toeKickHeight) / 3 * i;
          ctx.beginPath();
          ctx.moveTo(x + doorInset * 2, lineY);
          ctx.lineTo(x + width - doorInset * 2, lineY);
          ctx.stroke();
        }
      }
    } else if (element.style?.toLowerCase().includes('drawer') || element.id.includes('drawer')) {
      // Drawer unit
      const drawerCount = Math.max(2, Math.min(4, Math.floor(height / 25)));
      const drawerHeight = (height - doorInset * 2) / drawerCount;
      
      for (let i = 0; i < drawerCount; i++) {
        const drawerY = y + doorInset + i * drawerHeight;
        const drawerX = x + doorInset;
        const drawerW = width - doorInset * 2;
        const drawerH = drawerHeight - 2;
        
        // Drawer front
        ctx.strokeRect(drawerX, drawerY, drawerW, drawerH);
        ctx.strokeRect(drawerX + 3, drawerY + 3, drawerW - 6, drawerH - 6);
        
        // Drawer handle
        const handleX = drawerX + drawerW * 0.8;
        const handleY = drawerY + drawerH * 0.5;
        
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(handleX - handleSize/2, handleY - handleSize/2, handleSize*3, handleSize);
      }
    }
  };

  // Draw detailed appliance elevation
  const drawApplianceElevationDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, element: DesignElement) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    if (element.style?.toLowerCase().includes('refrigerator') || element.id.includes('refrigerator')) {
      // Refrigerator with two doors
      const doorWidth = width / 2;
      
      // Left door
      ctx.strokeRect(x + 2, y + 2, doorWidth - 3, height - 4);
      ctx.strokeRect(x + 6, y + 6, doorWidth - 11, height - 12);
      
      // Right door
      ctx.strokeRect(x + doorWidth + 1, y + 2, doorWidth - 3, height - 4);
      ctx.strokeRect(x + doorWidth + 5, y + 6, doorWidth - 11, height - 12);
      
      // Handles
      ctx.fillStyle = '#666';
      const handleHeight = Math.max(8, height * 0.1);
      ctx.fillRect(x + doorWidth - 8, y + height * 0.3, 3, handleHeight);
      ctx.fillRect(x + doorWidth + 5, y + height * 0.3, 3, handleHeight);
      
      // Freezer section line (if tall enough)
      if (height > 120) {
        ctx.beginPath();
        ctx.moveTo(x + 2, y + height * 0.3);
        ctx.lineTo(x + width - 2, y + height * 0.3);
        ctx.stroke();
      }
    } else if (element.style?.toLowerCase().includes('oven') || element.id.includes('oven')) {
      // Built-in oven
      ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
      ctx.strokeRect(x + 8, y + 8, width - 16, height - 16);
      
      // Oven door handle
      ctx.fillStyle = '#666';
      ctx.fillRect(x + width * 0.1, y + height - 12, width * 0.8, 4);
      
      // Control panel (top section)
      if (height > 60) {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(x + width * 0.2, y + 8, width * 0.6, 15);
        
        // Control knobs
        ctx.fillStyle = '#555';
        for (let i = 0; i < 3; i++) {
          const knobX = x + width * (0.3 + i * 0.2);
          ctx.beginPath();
          ctx.arc(knobX, y + 15, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (element.style?.toLowerCase().includes('dishwasher') || element.id.includes('dishwasher')) {
      // Dishwasher
      ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
      ctx.strokeRect(x + 5, y + 5, width - 10, height - 10);
      
      // Control panel
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x + width * 0.1, y + 5, width * 0.8, 12);
      
      // Handle (bottom)
      ctx.fillStyle = '#666';
      ctx.fillRect(x + width * 0.1, y + height - 8, width * 0.8, 3);
    } else {
      // Generic appliance
      ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
      
      // Generic handle
      ctx.fillStyle = '#666';
      const handleHeight = Math.min(height * 0.4, 30);
      ctx.fillRect(x + width - 8, y + (height - handleHeight) / 2, 3, handleHeight);
    }
  };

  // Check if element is a corner unit
  const isCornerUnit = (element: DesignElement): { isCorner: boolean; corner?: 'front-left' | 'front-right' | 'back-left' | 'back-right' } => {
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
    if (element.x >= roomDimensions.width - element.width - tolerance &&
        element.y >= roomDimensions.height - element.height - tolerance) {
      return { isCorner: true, corner: 'back-right' };
    }
    
    return { isCorner: false };
  };

  // Get element wall association (updated to handle corner units)
  const getElementWall = (element: DesignElement): 'front' | 'back' | 'left' | 'right' | 'center' => {
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    const tolerance = 50;
    
    // Check for corner units first
    const cornerInfo = isCornerUnit(element);
    if (cornerInfo.isCorner) {
      // Corner units are visible in both adjacent walls
      // Return the primary wall for filtering purposes
      switch (cornerInfo.corner) {
        case 'front-left': return 'front'; // Also visible in 'left'
        case 'front-right': return 'front'; // Also visible in 'right'
        case 'back-left': return 'back'; // Also visible in 'left'
        case 'back-right': return 'back'; // Also visible in 'right'
      }
    }
    
    if (centerY <= tolerance) return 'front';
    if (centerY >= roomDimensions.height - tolerance) return 'back';
    if (centerX <= tolerance) return 'left';
    if (centerX >= roomDimensions.width - tolerance) return 'right';
    return 'center';
  };

  // Check if corner unit is visible in current elevation view
  const isCornerVisibleInView = (element: DesignElement, view: string): boolean => {
    const cornerInfo = isCornerUnit(element);
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
  };

  // Determine if corner unit should show door face in current view
  const shouldShowCornerDoorFace = (element: DesignElement, view: string): boolean => {
    const cornerInfo = isCornerUnit(element);
    if (!cornerInfo.isCorner) return true; // Non-corner units always show door face
    
    // Corner units show door face on one wall and back panel on adjacent wall
    switch (cornerInfo.corner) {
      case 'front-left':
        return view === 'left'; // Door faces into room from left wall
      case 'front-right':
        return view === 'right'; // Door faces into room from right wall
      case 'back-left':
        return view === 'left'; // Door faces into room from left wall
      case 'back-right':
        return view === 'right'; // Door faces into room from right wall
      default:
        return true;
    }
  };

  // Draw zoom controls
  const drawZoomControls = useCallback((ctx: CanvasRenderingContext2D) => {
    const controlsX = CANVAS_WIDTH - 100;
    const controlsY = 20;
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(controlsX, controlsY, 80, 60);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(controlsX, controlsY, 80, 60);
    
    // Zoom percentage
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(zoom * 100)}%`, controlsX + 40, controlsY + 20);
    
    // Zoom controls
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.fillText('+', controlsX + 20, controlsY + 45);
    ctx.fillText('-', controlsX + 60, controlsY + 45);
  }, [zoom]);

  // Draw ruler/tape measure
  const drawRuler = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showRuler) return;

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.fillStyle = '#666';

    if (active2DView === 'plan') {
      // Horizontal ruler (top)
      const rulerY = roomPosition.y - 30;
      const stepSize = 50 * zoom; // Every 50cm
      
      ctx.beginPath();
      ctx.moveTo(roomPosition.x, rulerY);
      ctx.lineTo(roomPosition.x + roomDimensions.width * zoom, rulerY);
      ctx.stroke();

      for (let x = 0; x <= roomDimensions.width; x += 50) {
        const xPos = roomPosition.x + x * zoom;
        ctx.beginPath();
        ctx.moveTo(xPos, rulerY - 5);
        ctx.lineTo(xPos, rulerY + 5);
        ctx.stroke();
        
        if (x > 0) {
          ctx.textAlign = 'center';
          ctx.fillText(`${x}cm`, xPos, rulerY - 8);
        }
      }

      // Vertical ruler (left)
      const rulerX = roomPosition.x - 30;
      
      ctx.beginPath();
      ctx.moveTo(rulerX, roomPosition.y);
      ctx.lineTo(rulerX, roomPosition.y + roomDimensions.height * zoom);
      ctx.stroke();

      for (let y = 0; y <= roomDimensions.height; y += 50) {
        const yPos = roomPosition.y + y * zoom;
        ctx.beginPath();
        ctx.moveTo(rulerX - 5, yPos);
        ctx.lineTo(rulerX + 5, yPos);
        ctx.stroke();
        
        if (y > 0) {
          ctx.save();
          ctx.translate(rulerX - 8, yPos);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.fillText(`${y}cm`, 0, 0);
          ctx.restore();
        }
      }
    } else {
      // Elevation view rulers
      const roomWidth = active2DView === 'front' || active2DView === 'back'
        ? roomDimensions.width
        : roomDimensions.height;
      
      // Horizontal ruler (bottom)
      const wallHeight = DEFAULT_ROOM.wallHeight * zoom;
      const topY = roomPosition.y + 50;
      const floorY = topY + wallHeight;
      const rulerY = floorY + 25;
      
      ctx.beginPath();
      ctx.moveTo(roomPosition.x, rulerY);
      ctx.lineTo(roomPosition.x + roomWidth * zoom, rulerY);
      ctx.stroke();

      for (let x = 0; x <= roomWidth; x += 50) {
        const xPos = roomPosition.x + x * zoom;
        ctx.beginPath();
        ctx.moveTo(xPos, rulerY - 3);
        ctx.lineTo(xPos, rulerY + 3);
        ctx.stroke();
        
        if (x > 0) {
          ctx.textAlign = 'center';
          ctx.fillText(`${x}cm`, xPos, rulerY + 15);
        }
      }

      // Vertical ruler (right side)
      const rulerX = roomPosition.x + roomWidth * zoom + 25;
      
      ctx.beginPath();
      ctx.moveTo(rulerX, topY);
      ctx.lineTo(rulerX, floorY);
      ctx.stroke();

      for (let h = 0; h <= DEFAULT_ROOM.wallHeight; h += 50) {
        const yPos = floorY - h * zoom;
        ctx.beginPath();
        ctx.moveTo(rulerX - 3, yPos);
        ctx.lineTo(rulerX + 3, yPos);
        ctx.stroke();
        
        if (h > 0) {
          ctx.save();
          ctx.translate(rulerX + 8, yPos);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.fillText(`${h}cm`, 0, 0);
          ctx.restore();
        }
      }
    }
  }, [showRuler, active2DView, roomPosition, zoom, roomDimensions]);

  // Draw snap guides
  const drawSnapGuides = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isDragging || !draggedElement) return;
    
    ctx.save();
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.globalAlpha = 0.8;
    
    // Draw vertical snap guides
    snapGuides.vertical.forEach(x => {
      const canvasX = roomToCanvas(x, 0).x;
      ctx.beginPath();
      ctx.moveTo(canvasX, 0);
      ctx.lineTo(canvasX, CANVAS_HEIGHT);
      ctx.stroke();
    });
    
    // Draw horizontal snap guides
    snapGuides.horizontal.forEach(y => {
      const canvasY = roomToCanvas(0, y).y;
      ctx.beginPath();
      ctx.moveTo(0, canvasY);
      ctx.lineTo(CANVAS_WIDTH, canvasY);
      ctx.stroke();
    });
    
    ctx.restore();
  }, [isDragging, draggedElement, snapGuides, roomToCanvas]);

  // Draw drag preview
  const drawDragPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isDragging || !draggedElement) return;
    
    const roomPos = canvasToRoom(currentMousePos.x, currentMousePos.y);
    
    // Calculate snap position (but don't update guides in real-time to avoid performance issues)
    const snapResult = getSnapPosition(draggedElement, roomPos.x, roomPos.y);
    const pos = roomToCanvas(snapResult.x, snapResult.y);
    const width = draggedElement.width * zoom;
    const height = draggedElement.height * zoom;
    
    // Draw semi-transparent preview at snap position
    ctx.save();
    ctx.globalAlpha = 0.7;
    
    // Preview fill
    ctx.fillStyle = draggedElement.color || '#8b4513';
    ctx.fillRect(pos.x, pos.y, width, height);
    
    // Preview border - green if snapping, red if not
    const isSnapped = Math.abs(snapResult.x - roomPos.x) > 0.1 || Math.abs(snapResult.y - roomPos.y) > 0.1;
    ctx.strokeStyle = isSnapped ? '#00ff00' : '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(pos.x, pos.y, width, height);
    
    ctx.restore();
  }, [isDragging, draggedElement, currentMousePos, canvasToRoom, roomToCanvas, zoom, getSnapPosition]);

  // Draw tape measure - multi-measurement support
  const drawTapeMeasure = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();

    // Helper function to draw a single measurement
    const drawSingleMeasurement = (start: { x: number; y: number }, end: { x: number; y: number }, isCompleted: boolean, measurementIndex?: number) => {
      // Calculate distance in cm
      const pixelDistance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + 
        Math.pow(end.y - start.y, 2)
      );
      const distanceInCm = Math.round(pixelDistance / zoom);

      // Draw measurement line
      ctx.strokeStyle = isCompleted ? '#3b82f6' : '#94a3b8'; // Blue if completed, gray if preview
      ctx.lineWidth = 2;
      ctx.setLineDash(isCompleted ? [] : [8, 4]); // Solid if completed, dashed if preview
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Draw start point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(start.x, start.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw end point
      ctx.fillStyle = isCompleted ? '#3b82f6' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(end.x, end.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw distance label
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      // Background for text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = isCompleted ? '#3b82f6' : '#94a3b8';
      ctx.lineWidth = 1;
      
      const text = `${distanceInCm}cm`;
      const textWidth = ctx.measureText(text).width;
      const padding = 6;
      const bgWidth = textWidth + padding * 2;
      const bgHeight = 20;
      
      ctx.fillRect(midX - bgWidth/2, midY - bgHeight/2, bgWidth, bgHeight);
      ctx.strokeRect(midX - bgWidth/2, midY - bgHeight/2, bgWidth, bgHeight);
      
      // Distance text
      ctx.fillStyle = isCompleted ? '#1e40af' : '#64748b';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, midX, midY);

      // Add measurement number for completed measurements
      if (isCompleted && measurementIndex !== undefined) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(start.x - 8, start.y - 8, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((measurementIndex + 1).toString(), start.x - 8, start.y - 8);
      }
    };

    // Draw all completed measurements
    completedMeasurements.forEach((measurement, index) => {
      drawSingleMeasurement(measurement.start, measurement.end, true, index);
    });

    // Draw current measurement in progress
    if (currentMeasureStart) {
      if (tapeMeasurePreview) {
        // Show preview line
        drawSingleMeasurement(currentMeasureStart, tapeMeasurePreview, false);
      } else {
        // Just show start point
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(currentMeasureStart.x, currentMeasureStart.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw start point label
        ctx.fillStyle = '#1e40af';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('START', currentMeasureStart.x, currentMeasureStart.y - 15);
      }
    }

    ctx.restore();
  }, [completedMeasurements, currentMeasureStart, tapeMeasurePreview, zoom]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    drawGrid(ctx);

    // Draw room
    drawRoom(ctx);

    // Draw elements
    const elementsToRender = active2DView === 'plan'
      ? design.elements
      : design.elements.filter(el => {
          const wall = getElementWall(el);
          const isCornerVisible = isCornerVisibleInView(el, active2DView);
          return wall === active2DView || wall === 'center' || isCornerVisible;
        });

    elementsToRender.forEach(element => {
      // Always draw all elements, but make dragged element semi-transparent
      if (isDragging && draggedElement?.id === element.id) {
        ctx.save();
        ctx.globalAlpha = 0.3; // Make original element very faint during drag
        drawElement(ctx, element);
        ctx.restore();
      } else {
        drawElement(ctx, element);
      }
    });

    // Draw snap guides and drag preview on top
    if (active2DView === 'plan') {
      drawSnapGuides(ctx);
      drawDragPreview(ctx);
    }

    // Draw tape measure
    drawTapeMeasure(ctx);

    // Draw zoom controls
    drawZoomControls(ctx);

    // Draw ruler
    drawRuler(ctx);

  }, [drawGrid, drawRoom, drawElement, drawSnapGuides, drawDragPreview, drawTapeMeasure, drawZoomControls, drawRuler, design.elements, active2DView, draggedElement, isDragging]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check for zoom control clicks
    const controlsX = CANVAS_WIDTH - 100;
    const controlsY = 20;
    
    if (x >= controlsX && x <= controlsX + 80 && y >= controlsY && y <= controlsY + 60) {
      if (x <= controlsX + 40) {
        // Zoom in
        setZoom(prev => Math.min(MAX_ZOOM, prev * 1.2));
      } else {
        // Zoom out  
        setZoom(prev => Math.max(MIN_ZOOM, prev / 1.2));
      }
      return;
    }

    if (activeTool === 'pan') {
      setIsDragging(true);
      setDragStart({ x, y });
      return;
    }

    // Handle tape measure tool
    if (activeTool === 'tape-measure') {
      // Just set up for click handling in mouse up
      setDragStart({ x, y });
      return;
    }

    // Check for element clicks
    const roomPos = canvasToRoom(x, y);
    const clickedElement = design.elements.find(element => {
      return roomPos.x >= element.x && roomPos.x <= element.x + element.width &&
             roomPos.y >= element.y && roomPos.y <= element.y + element.height;
    });

    if (clickedElement) {
      onSelectElement(clickedElement);
      if (activeTool === 'select') {
        setIsDragging(true);
        setDragStart({ x, y });
        setDraggedElement(clickedElement);
      }
    } else {
      onSelectElement(null);
    }
  }, [activeTool, canvasToRoom, design.elements, onSelectElement, zoom]);

  // Throttled snap guide update to improve performance
  const throttledSnapUpdate = useCallback(
    throttle((roomPos: { x: number; y: number }, element: DesignElement) => {
      const snapResult = getSnapPosition(element, roomPos.x, roomPos.y);
      setSnapGuides({
        vertical: snapResult.guides.vertical,
        horizontal: snapResult.guides.horizontal,
        snapPoint: { x: snapResult.x, y: snapResult.y }
      });
    }, 16), // ~60fps
    [getSnapPosition]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Always track current mouse position for drag operations
    setCurrentMousePos({ x, y });

    // Handle hover detection
    if (!isDragging && active2DView === 'plan') {
      const roomPos = canvasToRoom(x, y);
      const hoveredEl = design.elements.find(element => {
        return roomPos.x >= element.x && roomPos.x <= element.x + element.width &&
               roomPos.y >= element.y && roomPos.y <= element.y + element.height;
      });
      setHoveredElement(hoveredEl || null);
      
      // Clear snap guides when not dragging
      if (snapGuides.vertical.length > 0 || snapGuides.horizontal.length > 0) {
        setSnapGuides({ vertical: [], horizontal: [], snapPoint: null });
      }
    }

    // Handle tape measure preview
    if (activeTool === 'tape-measure' && onTapeMeasureMouseMove) {
      onTapeMeasureMouseMove(x, y);
    }

    if (!isDragging) return;

    if (activeTool === 'pan') {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStart({ x, y });
    } else if (draggedElement && activeTool === 'select') {
      // Update snap guides with throttling to improve performance
      const roomPos = canvasToRoom(x, y);
      throttledSnapUpdate(roomPos, draggedElement);
      
      // Trigger re-render to show drag preview (also throttled by requestAnimationFrame)
      requestAnimationFrame(() => render());
    }
  }, [isDragging, activeTool, dragStart, draggedElement, canvasToRoom, design.elements, active2DView, render, throttledSnapUpdate, snapGuides, onTapeMeasureMouseMove]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && draggedElement) {
      // Use current mouse position for final placement
      const roomPos = canvasToRoom(currentMousePos.x, currentMousePos.y);
      
      // Smart snap with walls and components
      const snapped = getSnapPosition(draggedElement, roomPos.x, roomPos.y);
      
      // Apply light grid snapping only if not snapped to walls/components
      let finalX = snapped.x;
      let finalY = snapped.y;
      
      const isWallSnapped = snapped.guides.vertical.length > 0 || snapped.guides.horizontal.length > 0;
      if (!isWallSnapped) {
        finalX = snapToGrid(snapped.x);
        finalY = snapToGrid(snapped.y);
      }
      
      // Update element with final position
      onUpdateElement(draggedElement.id, {
        x: Math.max(0, Math.min(finalX, roomDimensions.width - draggedElement.width)),
        y: Math.max(0, Math.min(finalY, roomDimensions.height - draggedElement.height)),
        rotation: snapped.rotation
      });
    }

    // Handle tape measure clicks
    if (activeTool === 'tape-measure' && onTapeMeasureClick && !isDragging) {
      // Only handle clicks, not drags
      onTapeMeasureClick(currentMousePos.x, currentMousePos.y);
    }

    // Clear drag state
    setIsDragging(false);
    setDraggedElement(null);
    setSnapGuides({ vertical: [], horizontal: [], snapPoint: null });
  }, [isDragging, draggedElement, canvasToRoom, currentMousePos, getSnapPosition, snapToGrid, onUpdateElement, roomDimensions, activeTool, onTapeMeasureClick]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * delta)));
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const componentData = JSON.parse(e.dataTransfer.getData('component'));
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const roomPos = canvasToRoom(x, y);

      const newElement: DesignElement = {
        id: `${componentData.id}-${Date.now()}`,
        type: componentData.type,
        x: snapToGrid(Math.max(0, Math.min(roomPos.x, roomDimensions.width - componentData.width))),
        y: snapToGrid(Math.max(0, Math.min(roomPos.y, roomDimensions.height - componentData.depth))),
        width: componentData.width, // X-axis dimension
        depth: componentData.depth, // Y-axis dimension (front-to-back)
        height: componentData.height, // Z-axis dimension (bottom-to-top)
        rotation: 0,
        color: componentData.color,
        style: componentData.name
      };

      // Apply smart snapping for new elements
      const snapped = getSnapPosition(newElement, newElement.x, newElement.y);
      newElement.x = snapped.x;
      newElement.y = snapped.y;
      newElement.rotation = snapped.rotation;

      onAddElement(newElement);
    } catch (error) {
      // Error parsing dropped component - handled by toast
    }
  }, [canvasToRoom, snapToGrid, roomDimensions, getSnapPosition, onAddElement]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  }, []);

  // Initialize canvas and set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    render();

    // Handle wheel events
    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * delta)));
    };

    canvas.addEventListener('wheel', handleWheelNative, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
    };
  }, [render]);

  // Render on updates
  useEffect(() => {
    render();
  }, [render]);

  // Fit to screen - different logic for elevation views
  useEffect(() => {
    if (fitToScreenSignal > 0) {
      if (active2DView === 'plan') {
        // Plan view - fit entire room
        const roomWidth = roomDimensions.width;
        const roomHeight = roomDimensions.height;
        const scaleX = (CANVAS_WIDTH * 0.6) / roomWidth;
        const scaleY = (CANVAS_HEIGHT * 0.6) / roomHeight;
        setZoom(Math.min(scaleX, scaleY, MAX_ZOOM));
        setPanOffset({ x: 0, y: 0 });
      } else {
        // Elevation views - fit wall width and height
        const roomWidth = active2DView === 'front' || active2DView === 'back'
          ? roomDimensions.width
          : roomDimensions.height;
        const wallHeight = DEFAULT_ROOM.wallHeight;
        const scaleX = (CANVAS_WIDTH * 0.8) / roomWidth;
        const scaleY = (CANVAS_HEIGHT * 0.6) / wallHeight;
        setZoom(Math.min(scaleX, scaleY, MAX_ZOOM));
        setPanOffset({ x: 0, y: 0 });
      }
    }
  }, [fitToScreenSignal, roomDimensions, active2DView]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-start justify-center bg-gray-50 overflow-hidden"
      style={{ padding: '0' }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-300 bg-white cursor-crosshair max-w-full max-h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => {
          e.preventDefault();
          if (activeTool === 'tape-measure' && onClearTapeMeasure) {
            // Right-click clears tape measure
            onClearTapeMeasure();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          cursor: activeTool === 'pan' ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair'
        }}
      />
    </div>
  );
};