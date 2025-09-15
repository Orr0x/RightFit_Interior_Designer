import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DesignElement, Design } from '../../types/project';
import { ComponentService } from '@/services/ComponentService';
import { RoomService } from '@/services/RoomService';

// Throttle function for performance optimization
const throttle = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  return ((...args: any[]) => {
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
  }) as T;
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

// Default room fallbacks (will be replaced by database values)
const DEFAULT_ROOM_FALLBACK = {
  width: 600, // cm
  height: 400, // cm
  wallHeight: 240 // cm
};

// Room configuration cache
let roomConfigCache: any = null;

// Helper to get room configuration from database with caching
const getRoomConfig = async (roomType: string, roomDimensions: any) => {
  if (roomConfigCache) {
    return roomConfigCache;
  }

  try {
    const config = await RoomService.getRoomConfiguration(roomType as any, roomDimensions);
    roomConfigCache = config;
    return config;
  } catch (err) {
    console.warn('Failed to load room config, using fallback:', err);
    const fallback = {
      dimensions: roomDimensions || { width: 600, height: 400 },
      wall_height: 240,
      ceiling_height: 250
    };
    roomConfigCache = fallback;
    return fallback;
  }
};

// Canvas constants
const CANVAS_WIDTH = 1200; // Large workspace
const CANVAS_HEIGHT = 800; // Large workspace
const GRID_SIZE = 20; // Grid spacing in pixels
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;

// Component behavior cache for performance
const componentBehaviorCache = new Map<string, any>();

// Helper function to get component behavior from database with caching
const getComponentBehavior = async (componentType: string) => {
  if (componentBehaviorCache.has(componentType)) {
    return componentBehaviorCache.get(componentType);
  }

  try {
    const behavior = await ComponentService.getComponentBehavior(componentType);
    // Add compatibility properties for existing code
    const compatibleBehavior = {
      ...behavior,
      hasDirection: behavior.has_direction,
      doorSide: behavior.door_side,
      mountType: behavior.mount_type,
      defaultDepth: await ComponentService.getDefaultDepth(componentType)
    };
    componentBehaviorCache.set(componentType, compatibleBehavior);
    return compatibleBehavior;
  } catch (err) {
    console.warn(`Failed to load behavior for ${componentType}, using fallback:`, err);
    // Fallback that matches old COMPONENT_DATA structure
    const fallback = {
      hasDirection: true,
      doorSide: 'front',
      mountType: 'floor',
      defaultDepth: 60,
      mount_type: 'floor',
      has_direction: true,
      door_side: 'front',
      default_z_position: 0
    };
    componentBehaviorCache.set(componentType, fallback);
    return fallback;
  }
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
  const [dragThreshold, setDragThreshold] = useState<{ exceeded: boolean; startElement: DesignElement | null }>({ exceeded: false, startElement: null });
  const [snapGuides, setSnapGuides] = useState<{
    vertical: number[];
    horizontal: number[];
    snapPoint: { x: number; y: number } | null;
  }>({ vertical: [], horizontal: [], snapPoint: null });

  // Use design dimensions or default
  const roomDimensions = design.roomDimensions || DEFAULT_ROOM_FALLBACK;
  
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

  // Preload component behaviors and room configuration
  useEffect(() => {
    const preloadData = async () => {
      try {
        // Load room configuration
        await getRoomConfig(design.roomType, design.roomDimensions);
        
        // Preload common component behaviors (use actual database types)
        const commonTypes = ['cabinet', 'appliance', 'counter-top', 'end-panel', 
          'window', 'door', 'flooring', 'toe-kick', 'cornice', 'pelmet'];
          
        // Load all component behaviors in parallel
        await Promise.all(
          commonTypes.map(type => getComponentBehavior(type).catch(console.warn))
        );
        
        console.log('🚀 [DesignCanvas2D] Preloaded component behaviors and room config');
      } catch (err) {
        console.warn('Failed to preload component data:', err);
      }
    };
    
    preloadData();
  }, [design.roomType, design.roomDimensions]);

  // Snap to grid function
  const snapToGrid = useCallback((value: number) => {
    const gridSizeInRoom = GRID_SIZE / zoom;
    return Math.round(value / gridSizeInRoom) * gridSizeInRoom;
  }, [zoom]);

  // Helper function to get effective dimensions based on rotation
  const getEffectiveDimensions = useCallback((element: { width: number; depth: number; rotation?: number }) => {
    const rotation = element.rotation || 0;
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    
    // For 90° and 270° rotations, swap width and depth
    if (normalizedRotation >= 45 && normalizedRotation < 135) {
      // 90° rotation
      return { width: element.depth, depth: element.width };
    } else if (normalizedRotation >= 225 && normalizedRotation < 315) {
      // 270° rotation  
      return { width: element.depth, depth: element.width };
    } else {
      // 0° and 180° rotations (and close to them)
      return { width: element.width, depth: element.depth };
    }
  }, []);

  // Smart snap detection for walls and components
  const getSnapPosition = useCallback((element: DesignElement, x: number, y: number) => {
    // Use more generous snap tolerance for counter tops
    const isCounterTop = element.type === 'counter-top';
    const snapTolerance = isCounterTop ? 25 : 15; // cm - more generous for counter tops
    let snappedX = x;
    let snappedY = y;
    let rotation = element.rotation || 0;
    const guides = { vertical: [] as number[], horizontal: [] as number[] };

    // Get effective dimensions based on current rotation
    let elementWidth = element.width;
    let elementDepth = element.depth;
    
    // Corner counter top behaves as a 90x90 square footprint in plan view
    const isCornerCounterTop = element.type === 'counter-top' && element.id.includes('counter-top-corner');
    if (isCornerCounterTop) {
      elementWidth = 90;
      elementDepth = 90;
    }
    
    // Wall snapping with rotation-aware dimensions
    const distToLeft = x;
    const distToRight = roomDimensions.width - (x + elementWidth);
    const distToTop = y;
    const distToBottom = roomDimensions.height - (y + elementDepth);

    // Snap to walls
    if (distToLeft <= snapTolerance) {
      snappedX = 0;
      guides.vertical.push(0);
    } else if (distToRight <= snapTolerance) {
      // Use effective width (or 90cm for corner counter top)
      snappedX = roomDimensions.width - elementWidth;
      guides.vertical.push(roomDimensions.width);
    }

    if (distToTop <= snapTolerance) {
      snappedY = 0;
      guides.horizontal.push(0);
    } else if (distToBottom <= snapTolerance) {
      snappedY = roomDimensions.height - elementDepth;
      guides.horizontal.push(roomDimensions.height);
    }

    // Component-to-component snapping - only for nearby elements
    const proximityThreshold = 100; // Only snap to elements within 100cm
    const otherElements = design.elements.filter(el => el.id !== element.id);
    
    for (const otherEl of otherElements) {
      // Check proximity first - calculate distance between element centers
      const elementCenterX = x + elementWidth / 2;
      const elementCenterY = y + elementDepth / 2;
      const otherCenterX = otherEl.x + otherEl.width / 2;
      const otherCenterY = otherEl.y + (otherEl.depth || otherEl.height) / 2;
      
      const distance = Math.sqrt(
        Math.pow(elementCenterX - otherCenterX, 2) + 
        Math.pow(elementCenterY - otherCenterY, 2)
      );
      
      // Skip snapping if elements are too far apart
      if (distance > proximityThreshold) continue;
      
      // Get effective dimensions for other element
      const otherEffectiveDims = getEffectiveDimensions(otherEl);
      const otherElWidth = otherEffectiveDims.width;
      const otherElDepth = otherEffectiveDims.depth;
      
      // Horizontal alignment (same Y or adjacent Y)
      const topAlign = Math.abs(y - otherEl.y);
      const bottomAlign = Math.abs((y + elementDepth) - (otherEl.y + otherElDepth));
      const centerAlignY = Math.abs((y + elementDepth/2) - (otherEl.y + otherElDepth/2));
      
      if (topAlign <= snapTolerance) {
        snappedY = otherEl.y;
        guides.horizontal.push(otherEl.y);
      } else if (bottomAlign <= snapTolerance) {
        snappedY = otherEl.y + otherElDepth - elementDepth;
        guides.horizontal.push(otherEl.y + otherElDepth);
      } else if (centerAlignY <= snapTolerance) {
        snappedY = otherEl.y + otherElDepth/2 - elementDepth/2;
        guides.horizontal.push(otherEl.y + otherElDepth/2);
      }

      // Vertical alignment (same X or adjacent X)
      const leftAlign = Math.abs(x - otherEl.x);
      const rightAlign = Math.abs((x + elementWidth) - (otherEl.x + otherEl.width));
      const centerAlignX = Math.abs((x + elementWidth/2) - (otherEl.x + otherEl.width/2));
      
      if (leftAlign <= snapTolerance) {
        snappedX = otherEl.x;
        guides.vertical.push(otherEl.x);
      } else if (rightAlign <= snapTolerance) {
        snappedX = otherEl.x + otherEl.width - elementWidth;
        guides.vertical.push(otherEl.x + otherEl.width);
      } else if (centerAlignX <= snapTolerance) {
        snappedX = otherEl.x + otherEl.width/2 - elementWidth/2;
        guides.vertical.push(otherEl.x + otherEl.width/2);
      }

      // Adjacent snapping (edge-to-edge)
      const adjacentRight = Math.abs(x - (otherEl.x + otherEl.width));
      const adjacentLeft = Math.abs((x + elementWidth) - otherEl.x);
      const adjacentBottom = Math.abs(y - (otherEl.y + otherElDepth));
      const adjacentTop = Math.abs((y + elementDepth) - otherEl.y);

      if (adjacentRight <= snapTolerance && Math.abs(y - otherEl.y) <= snapTolerance * 2) {
        snappedX = otherEl.x + otherEl.width;
        guides.vertical.push(otherEl.x + otherEl.width);
      }
      if (adjacentLeft <= snapTolerance && Math.abs(y - otherEl.y) <= snapTolerance * 2) {
        snappedX = otherEl.x - elementWidth;
        guides.vertical.push(otherEl.x);
      }
      if (adjacentBottom <= snapTolerance && Math.abs(x - otherEl.x) <= snapTolerance * 2) {
        snappedY = otherEl.y + otherElDepth;
        guides.horizontal.push(otherEl.y + otherElDepth);
      }
      if (adjacentTop <= snapTolerance && Math.abs(x - otherEl.x) <= snapTolerance * 2) {
        snappedY = otherEl.y - elementDepth;
        guides.horizontal.push(otherEl.y);
      }
    }

    // Enhanced smart wall orientation - doors always face away from walls into the room
    // Get component behavior from cache (preloaded) or use fallback
    const componentData = componentBehaviorCache.get(element.type) || {
      hasDirection: true, doorSide: 'front', mountType: 'floor', defaultDepth: 60
    };
    
    // Async preload behavior if not cached
    if (!componentBehaviorCache.has(element.type)) {
      getComponentBehavior(element.type).catch(console.warn);
    }
    
    if (componentData?.hasDirection) {
      // Use more generous wall snap distance for counter tops
      const wallSnapDistance = isCounterTop ? 50 : 35; // cm - more generous for counter tops
      const cornerTolerance = 30; // cm tolerance for corner detection
      
      // Check if this is a corner unit placement
      // For corner counter tops, use 90cm square dimensions for detection
      const isCornerCounterTop = element.type === 'counter-top' && element.id.includes('counter-top-corner');
      const detectionWidth = isCornerCounterTop ? 90 : elementWidth;
      const detectionDepth = isCornerCounterTop ? 90 : elementDepth;
      
      const isCornerPosition = 
        (x <= cornerTolerance && y <= cornerTolerance) || // front-left corner
        (x >= roomDimensions.width - detectionWidth - cornerTolerance && y <= cornerTolerance) || // front-right corner
        (x <= cornerTolerance && y >= roomDimensions.height - detectionDepth - cornerTolerance) || // back-left corner
        (x >= roomDimensions.width - detectionWidth - cornerTolerance && y >= roomDimensions.height - detectionDepth - cornerTolerance); // back-right corner
      
      if (isCornerPosition) {
        // Special handling for corner units - they have specific orientations
        // For corner counter tops, use 90cm square dimensions (isCornerCounterTop already defined above)
        const cornerWidth = isCornerCounterTop ? 90 : elementWidth;
        const cornerDepth = isCornerCounterTop ? 90 : elementDepth;
        
        if (x <= cornerTolerance && y <= cornerTolerance) {
          // Front-left corner
          if (isCornerCounterTop) {
            rotation = 0; // L-shape faces down-right
          } else {
            rotation = 90; // door faces right (into room)
          }
          snappedX = 0;
          snappedY = 0;
          guides.vertical.push(0);
          guides.horizontal.push(0);
        } else if (x >= roomDimensions.width - cornerWidth - cornerTolerance && y <= cornerTolerance) {
          // Front-right corner
          if (isCornerCounterTop) {
            rotation = 270; // L-shape faces down-left
          } else {
            rotation = 270; // door faces left (into room)
          }
          snappedX = roomDimensions.width - cornerWidth;
          snappedY = 0;
          guides.vertical.push(roomDimensions.width);
          guides.horizontal.push(0);
        } else if (x <= cornerTolerance && y >= roomDimensions.height - cornerDepth - cornerTolerance) {
          // Back-left corner
          if (isCornerCounterTop) {
            rotation = 90; // L-shape faces up-right
          } else {
            rotation = 90; // door faces right (into room)
          }
          snappedX = 0;
          snappedY = roomDimensions.height - cornerDepth;
          guides.vertical.push(0);
          guides.horizontal.push(roomDimensions.height);
        } else if (x >= roomDimensions.width - cornerWidth - cornerTolerance && y >= roomDimensions.height - cornerDepth - cornerTolerance) {
          // Back-right corner
          if (isCornerCounterTop) {
            rotation = 180; // L-shape faces up-left
          } else {
            rotation = 270; // door faces left (into room)
          }
          snappedX = roomDimensions.width - cornerWidth;
          snappedY = roomDimensions.height - cornerDepth;
          guides.vertical.push(roomDimensions.width);
          guides.horizontal.push(roomDimensions.height);
        }
      } else {
        // Non-corner placement - use normal wall orientation logic
        // Calculate distances to each wall
        const distToLeft = snappedX;
        const distToRight = roomDimensions.width - (snappedX + elementWidth);
        const distToTop = snappedY;
        const distToBottom = roomDimensions.height - (snappedY + elementDepth);
        
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
          // Against top wall (front) - face up (into room)
          rotation = 0;
          guides.horizontal.push(0);
        } else if (minDist === distToBottom) {
          // Against bottom wall (back) - face down (into room)
          rotation = 180;
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
            snappedX = roomDimensions.width - elementWidth; // Snap to wall using effective width
            guides.vertical.push(roomDimensions.width);
          } else if (distToTop <= 10) {
            rotation = 0; // Face up (into room)
            snappedY = 0; // Snap to wall
            guides.horizontal.push(0);
          } else if (distToBottom <= 10) {
            rotation = 180; // Face down (into room)
            snappedY = roomDimensions.height - elementDepth; // Snap to wall using effective depth
            guides.horizontal.push(roomDimensions.height);
          }
        }
      } // End of corner position check
    } // End of hasDirection check

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
      const wallHeight = (roomConfigCache?.wall_height || DEFAULT_ROOM_FALLBACK.wallHeight) * zoom;
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
      const heightText = `${roomConfigCache?.wall_height || DEFAULT_ROOM_FALLBACK.wallHeight}cm`;
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
      // Plan view rendering - use width × depth for top-down view
      const pos = roomToCanvas(element.x, element.y);
      const width = element.width * zoom;
      const depth = (element.depth || element.height) * zoom; // Use depth for Y-axis in plan view
      const rotation = element.rotation || 0;

      ctx.save();
      
      // Check if this is a corner component for proper rotation center
      const isCornerCounterTop = element.type === 'counter-top' && element.id.includes('counter-top-corner');
      const isCornerWallCabinet = element.type === 'cabinet' && element.id.includes('corner-wall-cabinet');
      const isCornerBaseCabinet = element.type === 'cabinet' && element.id.includes('corner-base-cabinet');
      const isCornerTallUnit = element.type === 'cabinet' && (
        element.id.includes('corner-tall') || 
        element.id.includes('corner-larder') ||
        element.id.includes('larder-corner')
      );
      
      // Apply rotation - convert degrees to radians if needed
      if (isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit) {
        // For L-shaped components, rotate around the L-shape center (45cm, 45cm)
        const lShapeCenterX = 45 * zoom; // Center of 90cm leg
        const lShapeCenterY = 45 * zoom; // Center of 90cm leg
        ctx.translate(pos.x + lShapeCenterX, pos.y + lShapeCenterY);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-lShapeCenterX, -lShapeCenterY);
      } else {
        // Standard rectangular rotation from center
        ctx.translate(pos.x + width / 2, pos.y + depth / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-width / 2, -depth / 2);
      }

      // Element fill
      if (isSelected) {
        ctx.fillStyle = '#ff6b6b';
      } else if (isHovered) {
        ctx.fillStyle = '#b0b0b0';
      } else {
        ctx.fillStyle = element.color || '#8b4513';
      }
      
      // L-shape rendering for corner components
      
      if (isCornerCounterTop) {
        // Draw L-shaped corner counter top in plan view
        // Match the 3D geometry: 90cm legs with 60cm depth
        const legLength = 90 * zoom; // 90cm legs
        const legDepth = 60 * zoom;  // 60cm depth
        
        // X leg (horizontal section)
        ctx.fillRect(0, 0, legLength, legDepth);
        
        // Z leg (vertical section) - positioned to form L-shape
        ctx.fillRect(0, 0, legDepth, legLength);
        
        // Element border for L-shape (only when selected)
        if (isSelected) {
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          
          // Border for X leg
          ctx.strokeRect(0, 0, legLength, legDepth);
          // Border for Z leg  
          ctx.strokeRect(0, 0, legDepth, legLength);
        }
      } else if (isCornerWallCabinet) {
        // Draw L-shaped corner wall cabinet in plan view
        // Match the 3D geometry: 90cm legs with 35cm depth (wall cabinet depth)
        const legLength = 90 * zoom; // 90cm legs
        const legDepth = 35 * zoom;  // 35cm depth for wall cabinets
        
        // X leg (horizontal section)
        ctx.fillRect(0, 0, legLength, legDepth);
        
        // Z leg (vertical section) - positioned to form L-shape
        ctx.fillRect(0, 0, legDepth, legLength);
        
        // Element border for L-shape (only when selected)
        if (isSelected) {
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          
          // Border for X leg
          ctx.strokeRect(0, 0, legLength, legDepth);
          // Border for Z leg  
          ctx.strokeRect(0, 0, legDepth, legLength);
        }
      } else if (isCornerBaseCabinet) {
        // Draw L-shaped corner base cabinet in plan view
        // Match the 3D geometry: 90cm legs with 60cm depth (base cabinet depth)
        const legLength = 90 * zoom; // 90cm legs
        const legDepth = 60 * zoom;  // 60cm depth for base cabinets
        
        // X leg (horizontal section)
        ctx.fillRect(0, 0, legLength, legDepth);
        
        // Z leg (vertical section) - positioned to form L-shape
        ctx.fillRect(0, 0, legDepth, legLength);
        
        // Element border for L-shape (only when selected)
        if (isSelected) {
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          
          // Border for X leg
          ctx.strokeRect(0, 0, legLength, legDepth);
          // Border for Z leg  
          ctx.strokeRect(0, 0, legDepth, legLength);
        }
      } else if (isCornerTallUnit) {
        // Draw L-shaped corner tall unit in plan view
        // Match the 3D geometry: 90cm legs with 60cm depth (tall unit depth)
        const legLength = 90 * zoom; // 90cm legs
        const legDepth = 60 * zoom;  // 60cm depth for tall units
        
        // X leg (horizontal section)
        ctx.fillRect(0, 0, legLength, legDepth);
        
        // Z leg (vertical section) - positioned to form L-shape
        ctx.fillRect(0, 0, legDepth, legLength);
        
        // Element border for L-shape (only when selected)
        if (isSelected) {
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          
          // Border for X leg
          ctx.strokeRect(0, 0, legLength, legDepth);
          // Border for Z leg  
          ctx.strokeRect(0, 0, legDepth, legLength);
        }
      } else {
        // Standard rectangular rendering
        ctx.fillRect(0, 0, width, depth);
        
        // Element border (only when selected)
        if (isSelected) {
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(0, 0, width, depth);
        }
      }

      // In plan view, show solid blocks without cabinet details or text labels
      // Cabinet details and text are not appropriate for top-down view

      ctx.restore();

      // Selection handles (drawn after restore)
      if (isSelected) {
        if (isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit) {
          // For L-shaped components, draw square selection handles (90cm x 90cm)
          const squareSize = 90 * zoom;
          drawSelectionHandles(ctx, pos.x, pos.y, squareSize, squareSize);
        } else {
          drawSelectionHandles(ctx, pos.x, pos.y, width, depth);
        }
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

    // Get component behavior from cache or use fallback
    const componentData = componentBehaviorCache.get(element.type) || { 
      mountType: 'floor', 
      defaultDepth: 60,
      hasDirection: true,
      doorSide: 'front'
    };
    
    // Async preload behavior if not cached
    if (!componentBehaviorCache.has(element.type)) {
      getComponentBehavior(element.type).catch(console.warn);
    }
    const roomWidth = roomDimensions.width * zoom;
    const wallHeight = (roomConfigCache?.wall_height || DEFAULT_ROOM_FALLBACK.wallHeight) * zoom;
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
    // Use database-driven elevation heights instead of hardcoded values
    let elementHeight: number;
    let yPos: number;
    
    // Get elevation height from database or use element's actual height
    const useActualHeight = async (elementId: string, elementType: string) => {
      try {
        return await ComponentService.getElevationHeight(elementId, elementType);
      } catch (err) {
        console.warn(`Failed to get elevation height for ${elementId}:`, err);
        return element.height; // Fallback to actual element height
      }
    };
    
    // Check if we have cached behavior for this component
    const componentBehavior = componentBehaviorCache.get(element.type);
    
    // Determine elevation height - prioritize database values
    let elevationHeightCm: number;
    
    if (componentBehavior?.elevation_height) {
      // Use database elevation height
      elevationHeightCm = componentBehavior.elevation_height;
    } else {
      // Use actual element height for tall units, larder cabinets, etc.
      elevationHeightCm = element.height;
    }
    
    elementHeight = elevationHeightCm * zoom;
    
    // Calculate Y position based on component mount type and Z position
    if (componentBehavior?.mount_type === 'wall') {
      // Wall-mounted components use their Z position
      const mountHeight = (element.z || componentBehavior.default_z_position || 140) * zoom;
      yPos = floorY - mountHeight - elementHeight;
    } else {
      // Floor-mounted components
      if (element.z && element.z > 0) {
        // Component has explicit Z position (e.g., raised appliances)
        const mountHeight = element.z * zoom;
        yPos = floorY - mountHeight - elementHeight;
      } else {
        // Floor level
        yPos = floorY - elementHeight;
      }
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

    // Element border (only when selected)
    if (isSelected) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(xPos, yPos, elementWidth, elementHeight);
    }

    // Draw detailed fronts based on component type
    if (element.type.includes('cabinet')) {
      drawCabinetElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    } else if (element.type.includes('appliance')) {
      drawApplianceElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    } else if (element.type === 'counter-top') {
      drawCounterTopElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    } else if (element.type === 'end-panel') {
      drawEndPanelElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    } else if (element.type === 'window') {
      drawWindowElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    } else if (element.type === 'door') {
      drawDoorElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    } else if (element.type === 'flooring') {
      drawFlooringElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    } else if (element.type === 'toe-kick') {
      drawToeKickElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    } else if (element.type === 'cornice') {
      drawCorniceElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    } else if (element.type === 'pelmet') {
      drawPelmetElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
    } else if (element.type === 'wall-unit-end-panel') {
      drawWallUnitEndPanelElevationDetails(ctx, xPos, yPos, elementWidth, elementHeight, element);
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

  // Draw detailed counter top elevation
  const drawCounterTopElevationDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, element: DesignElement) => {
    ctx.strokeStyle = '#8B7355'; // Darker brown for counter top edge
    ctx.lineWidth = 1;

    // Draw counter top surface with subtle texture lines
    ctx.strokeStyle = '#A0522D'; // Saddle brown for surface lines
    ctx.lineWidth = 0.5;
    
    // Horizontal surface lines to simulate wood grain or stone texture
    const lineSpacing = Math.max(2, height * 0.5);
    for (let i = 0; i < Math.floor(height / lineSpacing); i++) {
      const lineY = y + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(x + 2, lineY);
      ctx.lineTo(x + width - 2, lineY);
      ctx.stroke();
    }
    
    // Draw edge detail (slightly darker)
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    
    // Draw subtle highlight on top edge
    ctx.strokeStyle = '#D2B48C';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
  };

  // Draw detailed end panel elevation
  const drawEndPanelElevationDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, element: DesignElement) => {
    ctx.strokeStyle = '#654321'; // Darker brown for end panel edge
    ctx.lineWidth = 1;

    // Draw end panel surface with subtle texture lines
    ctx.strokeStyle = '#8B4513'; // Saddle brown for surface lines
    ctx.lineWidth = 0.5;
    
    // Vertical surface lines to simulate wood grain
    const lineSpacing = Math.max(2, width * 0.5);
    for (let i = 0; i < Math.floor(width / lineSpacing); i++) {
      const lineX = x + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(lineX, y + 2);
      ctx.lineTo(lineX, y + height - 2);
      ctx.stroke();
    }
    
    // Draw edge detail (slightly darker)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    
    // Draw subtle highlight on left edge
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();
  };

  // Draw detailed window elevation
  const drawWindowElevationDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, element: DesignElement) => {
    ctx.strokeStyle = '#2F4F4F'; // Dark slate gray for window frame
    ctx.lineWidth = 2;

    // Draw window frame
    ctx.strokeRect(x, y, width, height);
    
    // Draw window panes (2x2 grid)
    const paneWidth = width / 2;
    const paneHeight = height / 2;
    
    // Vertical divider
    ctx.beginPath();
    ctx.moveTo(x + paneWidth, y);
    ctx.lineTo(x + paneWidth, y + height);
    ctx.stroke();
    
    // Horizontal divider
    ctx.beginPath();
    ctx.moveTo(x, y + paneHeight);
    ctx.lineTo(x + width, y + paneHeight);
    ctx.stroke();
    
    // Draw glass effect (slight transparency)
    ctx.fillStyle = 'rgba(173, 216, 230, 0.3)'; // Light blue with transparency
    ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
    
    // Draw window sill
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 5, y + height, width + 10, 3);
  };

  // Draw detailed door elevation
  const drawDoorElevationDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, element: DesignElement) => {
    ctx.strokeStyle = '#8B4513'; // Brown for door frame
    ctx.lineWidth = 2;

    // Draw door frame
    ctx.strokeRect(x, y, width, height);
    
    // Draw door panel
    ctx.fillStyle = '#D2691E'; // Slightly lighter brown for door
    ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
    
    // Draw door panel details
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 1;
    
    // Vertical panel lines
    for (let i = 1; i < 3; i++) {
      const lineX = x + (width / 3) * i;
      ctx.beginPath();
      ctx.moveTo(lineX, y + 2);
      ctx.lineTo(lineX, y + height - 2);
      ctx.stroke();
    }
    
    // Horizontal panel lines
    for (let i = 1; i < 3; i++) {
      const lineY = y + (height / 3) * i;
      ctx.beginPath();
      ctx.moveTo(x + 2, lineY);
      ctx.lineTo(x + width - 2, lineY);
      ctx.stroke();
    }
    
    // Draw door handle
    ctx.fillStyle = '#FFD700'; // Gold handle
    ctx.beginPath();
    ctx.arc(x + width - 15, y + height / 2, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw door handle backplate
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  // Draw detailed flooring elevation
  const drawFlooringElevationDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, element: DesignElement) => {
    ctx.strokeStyle = '#8B4513'; // Brown for flooring edge
    ctx.lineWidth = 1;

    // Draw flooring surface with texture based on type
    if (element.id.includes('hardwood')) {
      // Hardwood planks
      ctx.strokeStyle = '#D2691E';
      ctx.lineWidth = 0.5;
      
      const plankHeight = Math.max(2, height / 8);
      for (let i = 0; i < 8; i++) {
        const plankY = y + i * plankHeight;
        ctx.beginPath();
        ctx.moveTo(x, plankY);
        ctx.lineTo(x + width, plankY);
        ctx.stroke();
      }
    } else if (element.id.includes('tile')) {
      // Tile pattern
      ctx.strokeStyle = '#CD853F';
      ctx.lineWidth = 0.5;
      
      const tileSize = Math.max(4, width / 6);
      for (let i = 0; i < Math.floor(width / tileSize); i++) {
        for (let j = 0; j < Math.floor(height / tileSize); j++) {
          const tileX = x + i * tileSize;
          const tileY = y + j * tileSize;
          ctx.strokeRect(tileX, tileY, tileSize, tileSize);
        }
      }
    } else if (element.id.includes('carpet')) {
      // Carpet texture
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 0.3;
      
      // Random texture lines
      for (let i = 0; i < 20; i++) {
        const startX = x + Math.random() * width;
        const startY = y + Math.random() * height;
        const endX = startX + (Math.random() - 0.5) * 20;
        const endY = startY + (Math.random() - 0.5) * 20;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    } else {
      // Vinyl - smooth surface
      ctx.strokeStyle = '#D2691E';
      ctx.lineWidth = 0.5;
      
      // Subtle horizontal lines
      for (let i = 0; i < 3; i++) {
        const lineY = y + (height / 4) * (i + 1);
        ctx.beginPath();
        ctx.moveTo(x, lineY);
        ctx.lineTo(x + width, lineY);
        ctx.stroke();
      }
    }
    
    // Draw edge detail
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  };

  // Draw detailed toe kick elevation
  const drawToeKickElevationDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, element: DesignElement) => {
    ctx.strokeStyle = '#654321'; // Dark brown for toe kick
    ctx.lineWidth = 1;

    // Draw toe kick surface
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y, width, height);
    
    // Draw recessed effect
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    
    // Draw subtle texture lines
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 0.5;
    
    // Horizontal lines for wood grain
    for (let i = 0; i < 3; i++) {
      const lineY = y + (height / 4) * (i + 1);
      ctx.beginPath();
      ctx.moveTo(x + 2, lineY);
      ctx.lineTo(x + width - 2, lineY);
      ctx.stroke();
    }
  };

  // Draw detailed cornice elevation
  const drawCorniceElevationDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, element: DesignElement) => {
    ctx.strokeStyle = '#8B4513'; // Brown for cornice
    ctx.lineWidth = 1;

    // Draw cornice surface
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(x, y, width, height);
    
    // Draw decorative profile
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 1;
    
    // Top edge detail
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    
    // Bottom edge detail
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
    
    // Decorative line in middle
    ctx.beginPath();
    ctx.moveTo(x, y + height / 2);
    ctx.lineTo(x + width, y + height / 2);
    ctx.stroke();
  };

  // Draw detailed pelmet elevation
  const drawPelmetElevationDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, element: DesignElement) => {
    ctx.strokeStyle = '#8B4513'; // Brown for pelmet
    ctx.lineWidth = 1;

    // Draw pelmet surface
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(x, y, width, height);
    
    // Draw pelmet profile
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 1;
    
    // Top edge detail
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    
    // Bottom edge detail
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
    
    // Decorative lines
    for (let i = 1; i < 3; i++) {
      const lineY = y + (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x + width, lineY);
      ctx.stroke();
    }
  };

  // Draw detailed wall unit end panel elevation
  const drawWallUnitEndPanelElevationDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, element: DesignElement) => {
    ctx.strokeStyle = '#654321'; // Dark brown for wall unit end panel
    ctx.lineWidth = 1;

    // Draw end panel surface
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y, width, height);
    
    // Draw vertical grain lines
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 0.5;
    
    const lineSpacing = Math.max(2, width * 0.3);
    for (let i = 0; i < Math.floor(width / lineSpacing); i++) {
      const lineX = x + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(lineX, y + 2);
      ctx.lineTo(lineX, y + height - 2);
      ctx.stroke();
    }
    
    // Draw edge detail
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
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
      const wallHeight = (roomConfigCache?.wall_height || DEFAULT_ROOM_FALLBACK.wallHeight) * zoom;
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

      for (let h = 0; h <= (roomConfigCache?.wall_height || DEFAULT_ROOM_FALLBACK.wallHeight); h += 50) {
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
    
    // Check if this is a corner component for L-shape preview
    const isCornerCounterTop = draggedElement.type === 'counter-top' && draggedElement.id.includes('counter-top-corner');
    const isCornerWallCabinet = draggedElement.type === 'cabinet' && draggedElement.id.includes('corner-wall-cabinet');
    const isCornerBaseCabinet = draggedElement.type === 'cabinet' && draggedElement.id.includes('corner-base-cabinet');
    const isCornerTallUnit = draggedElement.type === 'cabinet' && (
      draggedElement.id.includes('corner-tall') || 
      draggedElement.id.includes('corner-larder') ||
      draggedElement.id.includes('larder-corner')
    );
    
    // Draw semi-transparent preview at snap position
    ctx.save();
    ctx.globalAlpha = 0.7;
    
    // Preview border - green if snapping, red if not
    const isSnapped = Math.abs(snapResult.x - roomPos.x) > 0.1 || Math.abs(snapResult.y - roomPos.y) > 0.1;
    ctx.strokeStyle = isSnapped ? '#00ff00' : '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    if (isCornerCounterTop) {
      // Draw L-shaped counter top drag preview
      const legLength = 90 * zoom; // 90cm legs
      const legDepth = 60 * zoom;  // 60cm depth
      
      // Preview fill
      ctx.fillStyle = draggedElement.color || '#8b4513';
      
      // X leg (horizontal section)
      ctx.fillRect(pos.x, pos.y, legLength, legDepth);
      ctx.strokeRect(pos.x, pos.y, legLength, legDepth);
      
      // Z leg (vertical section)
      ctx.fillRect(pos.x, pos.y, legDepth, legLength);
      ctx.strokeRect(pos.x, pos.y, legDepth, legLength);
    } else if (isCornerWallCabinet) {
      // Draw L-shaped wall cabinet drag preview
      const legLength = 90 * zoom; // 90cm legs
      const legDepth = 35 * zoom;  // 35cm depth for wall cabinets
      
      // Preview fill
      ctx.fillStyle = draggedElement.color || '#8b4513';
      
      // X leg (horizontal section)
      ctx.fillRect(pos.x, pos.y, legLength, legDepth);
      ctx.strokeRect(pos.x, pos.y, legLength, legDepth);
      
      // Z leg (vertical section)
      ctx.fillRect(pos.x, pos.y, legDepth, legLength);
      ctx.strokeRect(pos.x, pos.y, legDepth, legLength);
    } else if (isCornerBaseCabinet) {
      // Draw L-shaped base cabinet drag preview
      const legLength = 90 * zoom; // 90cm legs
      const legDepth = 60 * zoom;  // 60cm depth for base cabinets
      
      // Preview fill
      ctx.fillStyle = draggedElement.color || '#8b4513';
      
      // X leg (horizontal section)
      ctx.fillRect(pos.x, pos.y, legLength, legDepth);
      ctx.strokeRect(pos.x, pos.y, legLength, legDepth);
      
      // Z leg (vertical section)
      ctx.fillRect(pos.x, pos.y, legDepth, legLength);
      ctx.strokeRect(pos.x, pos.y, legDepth, legLength);
    } else if (isCornerTallUnit) {
      // Draw L-shaped tall unit drag preview
      const legLength = 90 * zoom; // 90cm legs
      const legDepth = 60 * zoom;  // 60cm depth for tall units
      
      // Preview fill
      ctx.fillStyle = draggedElement.color || '#8b4513';
      
      // X leg (horizontal section)
      ctx.fillRect(pos.x, pos.y, legLength, legDepth);
      ctx.strokeRect(pos.x, pos.y, legLength, legDepth);
      
      // Z leg (vertical section)
      ctx.fillRect(pos.x, pos.y, legDepth, legLength);
      ctx.strokeRect(pos.x, pos.y, legDepth, legLength);
    } else {
      // Standard rectangular drag preview
      const width = draggedElement.width * zoom;
      const height = (draggedElement.depth || draggedElement.height) * zoom; // Use depth for Y-axis in plan view
      
      // Preview fill
      ctx.fillStyle = draggedElement.color || '#8b4513';
      ctx.fillRect(pos.x, pos.y, width, height);
      ctx.strokeRect(pos.x, pos.y, width, height);
    }
    
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
    // 🎯 FIX: Account for CSS scaling of canvas element
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

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
      // Special handling for corner counter tops - use square bounding box
      const isCornerCounterTop = element.type === 'counter-top' && element.id.includes('counter-top-corner');
      
      if (isCornerCounterTop) {
        // Use 90cm x 90cm square for corner counter tops
        return roomPos.x >= element.x && roomPos.x <= element.x + 90 &&
               roomPos.y >= element.y && roomPos.y <= element.y + 90;
      } else {
        // Standard rectangular hit detection
        return roomPos.x >= element.x && roomPos.x <= element.x + element.width &&
               roomPos.y >= element.y && roomPos.y <= element.y + (element.depth || element.height);
      }
    });

    if (clickedElement) {
      onSelectElement(clickedElement);
      if (activeTool === 'select') {
        // 🎯 FIX: Don't start dragging immediately - just prepare for potential drag
        setDragStart({ x, y });
        setDragThreshold({ exceeded: false, startElement: clickedElement });
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
    // 🎯 FIX: Account for CSS scaling of canvas element
    // The canvas internal size is CANVAS_WIDTH × CANVAS_HEIGHT but CSS may scale it
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Always track current mouse position for drag operations
    setCurrentMousePos({ x, y });

    // Handle hover detection
    if (!isDragging && active2DView === 'plan') {
      const roomPos = canvasToRoom(x, y);
      const hoveredEl = design.elements.find(element => {
        // Check if this is a corner component that uses L-shaped footprint
        const isCornerComponent = (element.type === 'counter-top' && element.id.includes('counter-top-corner')) ||
                                 (element.type === 'cabinet' && element.id.includes('corner-wall-cabinet')) ||
                                 (element.type === 'cabinet' && element.id.includes('corner-base-cabinet')) ||
                                 (element.type === 'cabinet' && (
                                   element.id.includes('corner-tall') || 
                                   element.id.includes('corner-larder') ||
                                   element.id.includes('larder-corner')
                                 ));
        
        if (isCornerComponent) {
          // L-shaped components use 90x90 footprint for hover detection
          return roomPos.x >= element.x && roomPos.x <= element.x + 90 &&
                 roomPos.y >= element.y && roomPos.y <= element.y + 90;
        } else {
          // Standard rectangular hover detection
          return roomPos.x >= element.x && roomPos.x <= element.x + element.width &&
                 roomPos.y >= element.y && roomPos.y <= element.y + element.height;
        }
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

    // 🎯 FIX: Check drag threshold before starting drag
    if (!isDragging && dragThreshold.startElement && activeTool === 'select') {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const DRAG_THRESHOLD = 5; // pixels - must move at least 5px to start dragging
      
      if (distance >= DRAG_THRESHOLD && !dragThreshold.exceeded) {
        // Start dragging now that threshold is exceeded
        setIsDragging(true);
        setDraggedElement(dragThreshold.startElement);
        setDragThreshold({ exceeded: true, startElement: dragThreshold.startElement });
      }
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
      
      // Update element with final position - use effective footprint for plan view
      let clampWidth = draggedElement.width;
      let clampDepth = draggedElement.depth;
      // Corner components occupy a 90x90 footprint in plan view
      const isCornerCounterTop = draggedElement.type === 'counter-top' && draggedElement.id.includes('counter-top-corner');
      const isCornerWallCabinet = draggedElement.type === 'cabinet' && draggedElement.id.includes('corner-wall-cabinet');
      const isCornerBaseCabinet = draggedElement.type === 'cabinet' && draggedElement.id.includes('corner-base-cabinet');
      const isCornerTallUnit = draggedElement.type === 'cabinet' && (
        draggedElement.id.includes('corner-tall') || 
        draggedElement.id.includes('corner-larder') ||
        draggedElement.id.includes('larder-corner')
      );
      
      if (isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit) {
        clampWidth = 90;  // L-shaped components use 90x90 footprint
        clampDepth = 90;
      }

      // Enhanced boundary checking for rotated elements
      // Ensure the element stays within room boundaries using effective dimensions
      const clampedX = Math.max(0, Math.min(finalX, roomDimensions.width - clampWidth));
      const clampedY = Math.max(0, Math.min(finalY, roomDimensions.height - clampDepth));
      
      // Additional check: if element was snapped to a wall, ensure it stays snapped
      let finalClampedX = clampedX;
      let finalClampedY = clampedY;
      
      if (snapped.guides.vertical.length > 0) {
        // Element was snapped to a vertical wall, maintain that snap
        if (snapped.guides.vertical.includes(0)) {
          finalClampedX = 0; // Left wall
        } else if (snapped.guides.vertical.includes(roomDimensions.width)) {
          finalClampedX = roomDimensions.width - clampWidth; // Right wall
        }
      }
      
      if (snapped.guides.horizontal.length > 0) {
        // Element was snapped to a horizontal wall, maintain that snap
        if (snapped.guides.horizontal.includes(0)) {
          finalClampedY = 0; // Top wall
        } else if (snapped.guides.horizontal.includes(roomDimensions.height)) {
          finalClampedY = roomDimensions.height - clampDepth; // Bottom wall
        }
      }

      onUpdateElement(draggedElement.id, {
        x: finalClampedX,
        y: finalClampedY,
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
    setDragThreshold({ exceeded: false, startElement: null }); // 🎯 Clear drag threshold
  }, [isDragging, draggedElement, canvasToRoom, currentMousePos, getSnapPosition, snapToGrid, onUpdateElement, roomDimensions, activeTool, onTapeMeasureClick]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * delta)));
  }, []);

  // Handle drag over for drag and drop
  const handleDragOver = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const rawData = e.dataTransfer.getData('component');
      if (!rawData || rawData.trim() === '') {
        console.warn('⚠️ Drop cancelled: No component data (quick drag release)');
        return;
      }
      const componentData = JSON.parse(rawData);
      const rect = canvas.getBoundingClientRect();
      // 🎯 FIX: Account for CSS scaling of canvas element
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const roomPos = canvasToRoom(x, y);

      // Calculate drop position based on mouse coordinates

      // 🎯 FIX: Drop position should place component center at mouse position
      // The drag image center represents where the component center should be placed
      const dropX = roomPos.x - (componentData.width / 2);
      const dropY = roomPos.y - (componentData.depth / 2);


      // 🎯 BOUNDARY CHECK: Prevent drops outside room boundaries
      if (dropX < -50 || dropY < -50 || dropX > roomDimensions.width + 50 || dropY > roomDimensions.height + 50) {
        console.warn('⚠️ Drop cancelled: Component dropped outside room boundaries');
        return;
      }

      // Determine effective dimensions for boundary checks
      // Corner components use 90x90 footprint regardless of their actual dimensions
      const isCornerComponent = componentData.id?.includes('corner-') || 
                               componentData.id?.includes('-corner') ||
                               componentData.id?.includes('corner');
      
      let effectiveWidth = componentData.width;
      let effectiveDepth = componentData.depth;
      
      if (isCornerComponent) {
        effectiveWidth = 90;  // L-shaped components use 90x90 footprint
        effectiveDepth = 90;
      }

      // Set default Z position based on component type
      let defaultZ = 0; // Default for floor-mounted components
      if (componentData.type === 'cornice') {
        defaultZ = 200; // 200cm height for cornice (top of wall units)
      } else if (componentData.type === 'pelmet') {
        defaultZ = 140; // 140cm height for pelmet (FIXED: bottom of wall units)
      } else if (componentData.type === 'counter-top') {
        defaultZ = 90; // 90cm height for counter tops
      } else if (componentData.type === 'wall-cabinet' || componentData.id?.includes('wall-cabinet')) {
        defaultZ = 140; // 140cm height for wall cabinets
      } else if (componentData.type === 'wall-unit-end-panel') {
        defaultZ = 200; // 200cm height for wall unit end panels
      } else if (componentData.type === 'window') {
        defaultZ = 90; // 90cm height for windows
      }

      const newElement: DesignElement = {
        id: `${componentData.id}-${Date.now()}`,
        type: componentData.type,
        x: snapToGrid(Math.max(0, Math.min(dropX, roomDimensions.width - effectiveWidth))),
        y: snapToGrid(Math.max(0, Math.min(dropY, roomDimensions.height - effectiveDepth))),
        z: defaultZ, // Set appropriate Z position
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
      // Enhanced error handling for different drop failure scenarios
      if (error instanceof Error) {
        if (error.message.includes('JSON')) {
          console.warn('⚠️ Drop cancelled: Invalid component data (quick drag/release)');
        } else if (error.message.includes('boundary')) {
          console.warn('⚠️ Drop cancelled: Component dropped outside room boundaries');
        } else {
          console.warn('⚠️ Drop failed:', error.message);
        }
      } else {
        console.warn('⚠️ Drop cancelled: Unknown reason (likely quick drag/release)');
      }
      // Silently handle - this is expected for cancelled drags and off-canvas drops
    }
  }, [canvasToRoom, snapToGrid, roomDimensions, getSnapPosition, onAddElement]);

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
        const wallHeight = roomConfigCache?.wall_height || DEFAULT_ROOM_FALLBACK.wallHeight;
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