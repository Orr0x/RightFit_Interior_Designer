import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DesignElement, Design } from '../../types/project';
import { ComponentService } from '@/services/ComponentService';
import { RoomService } from '@/services/RoomService';
import { useTouchEvents, TouchPoint } from '@/hooks/useTouchEvents';
import { useIsMobile } from '@/hooks/use-mobile';
import { getEnhancedComponentPlacement } from '@/utils/canvasCoordinateIntegration';
import { initializeCoordinateEngine } from '@/services/CoordinateTransformEngine';
import { PositionCalculation } from '@/utils/PositionCalculation';
import { ConfigurationService } from '@/services/ConfigurationService';
import { render2DService } from '@/services/Render2DService';
import { renderPlanView, renderElevationView } from '@/services/2d-renderers';
import { FeatureFlagService } from '@/services/FeatureFlagService';

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
  showWireframe?: boolean;
  showColorDetail?: boolean;
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
  // Zoom control props
  onZoomChange?: (zoom: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

// =============================================================================
// REMOVED: DEFAULT_ROOM_FALLBACK (deleted on 2025-10-10)
// =============================================================================
// Hardcoded room fallback removed. Room dimensions must come from:
// 1. design.roomDimensions (primary source)
// 2. room_type_templates database table (via RoomService)
//
// If design.roomDimensions is missing, this is a data integrity error
// and should be logged/reported rather than silently falling back.
// =============================================================================

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

// Canvas constants - Default fallbacks (database-driven via ConfigurationService)
const CANVAS_WIDTH = 1600; // Larger workspace for better zoom
const CANVAS_HEIGHT = 1200; // Larger workspace for better zoom
const GRID_SIZE = 20; // Grid spacing in pixels
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.0; // Increased to take advantage of larger canvas

// Wall thickness constants to match 3D implementation - Default fallbacks
const WALL_THICKNESS = 10; // 10cm wall thickness (matches 3D: 0.1 meters)
const WALL_CLEARANCE = 5; // 5cm clearance from walls for component placement
const WALL_SNAP_THRESHOLD = 40; // Snap to wall if within 40cm

// Configuration cache - loaded from database on component mount
let configCache: Record<string, number> = {};

// Helper function to calculate rotated bounding box for components
const getRotatedBoundingBox = (element: DesignElement) => {
  const rotation = (element.rotation || 0) * Math.PI / 180; // Convert to radians
  
  // Determine if this is a corner component with L-shaped footprint
  const isCornerCounterTop = element.type === 'counter-top' && element.id.includes('counter-top-corner');
  const isCornerWallCabinet = element.type === 'cabinet' && (element.id.includes('corner-wall-cabinet') || element.id.includes('new-corner-wall-cabinet'));
  const isCornerBaseCabinet = element.type === 'cabinet' && (element.id.includes('corner-base-cabinet') || element.id.includes('l-shaped-test-cabinet'));
  const isCornerTallUnit = element.type === 'cabinet' && (
    element.id.includes('corner-tall') || 
    element.id.includes('corner-larder') ||
    element.id.includes('larder-corner')
  );
  
  const isCornerComponent = isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit;
  
  if (isCornerComponent) {
    // Corner components use their ACTUAL dimensions (no more hardcoded 90x90)
    const width = element.width;
    const height = element.depth || element.height;
    const centerX = element.x + width / 2;
    const centerY = element.y + height / 2;
    
    // Use actual component dimensions for bounding box
    return {
      minX: element.x,
      minY: element.y,
      maxX: element.x + width,
      maxY: element.y + height,
      centerX,
      centerY,
      width: width,
      height: height,
      isCorner: true
    };
  } else {
    // Standard rectangular component
    const width = element.width;
    const height = element.depth || element.height;
    const centerX = element.x + width / 2;
    const centerY = element.y + height / 2;
    
    if (rotation === 0) {
      // No rotation - simple case
      return {
        minX: element.x,
        minY: element.y,
        maxX: element.x + width,
        maxY: element.y + height,
        centerX,
        centerY,
        width,
        height,
        isCorner: false
      };
    } else {
      // Calculate rotated bounding box
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      
      // Calculate the four corners of the rotated rectangle
      const corners = [
        { x: -width / 2, y: -height / 2 },
        { x: width / 2, y: -height / 2 },
        { x: width / 2, y: height / 2 },
        { x: -width / 2, y: height / 2 }
      ];
      
      // Rotate each corner and find the bounding box
      const rotatedCorners = corners.map(corner => ({
        x: centerX + corner.x * cos - corner.y * sin,
        y: centerY + corner.x * sin + corner.y * cos
      }));
      
      const minX = Math.min(...rotatedCorners.map(c => c.x));
      const minY = Math.min(...rotatedCorners.map(c => c.y));
      const maxX = Math.max(...rotatedCorners.map(c => c.x));
      const maxY = Math.max(...rotatedCorners.map(c => c.y));
      
      return {
        minX,
        minY,
        maxX,
        maxY,
        centerX,
        centerY,
        width: maxX - minX,
        height: maxY - minY,
        isCorner: false
      };
    }
  }
};

// Helper function to check if a point is inside a rotated component
const isPointInRotatedComponent = (pointX: number, pointY: number, element: DesignElement) => {
  const rotation = (element.rotation || 0) * Math.PI / 180;
  
  // Determine if this is a corner component
  const isCornerComponent = (element.type === 'counter-top' && element.id.includes('counter-top-corner')) ||
                           (element.type === 'cabinet' && element.id.includes('corner-wall-cabinet')) ||
                           (element.type === 'cabinet' && element.id.includes('corner-base-cabinet')) ||
                           (element.type === 'cabinet' && (
                             element.id.includes('corner-tall') || 
                             element.id.includes('corner-larder') ||
                             element.id.includes('larder-corner')
                           ));
  
  if (isCornerComponent) {
    // L-shaped components use their actual square footprint - dynamic check
    const squareSize = Math.min(element.width, element.depth); // Use smaller dimension for square
    return pointX >= element.x && pointX <= element.x + squareSize &&
           pointY >= element.y && pointY <= element.y + squareSize;
  } else {
    // Standard rectangular component with rotation
    const width = element.width;
    const height = element.depth || element.height;
    const centerX = element.x + width / 2;
    const centerY = element.y + height / 2;
    
    if (rotation === 0) {
      // No rotation - simple check
      return pointX >= element.x && pointX <= element.x + width &&
             pointY >= element.y && pointY <= element.y + height;
    } else {
      // Rotate the point relative to the component center
      const cos = Math.cos(-rotation); // Negative rotation to transform point to component space
      const sin = Math.sin(-rotation);
      const dx = pointX - centerX;
      const dy = pointY - centerY;
      const rotatedX = dx * cos - dy * sin;
      const rotatedY = dx * sin + dy * cos;
      
      // Check if the rotated point is within the original rectangle
      return rotatedX >= -width / 2 && rotatedX <= width / 2 &&
             rotatedY >= -height / 2 && rotatedY <= height / 2;
    }
  }
};

// Smart Wall Snapping System with 5cm clearance
const getWallSnappedPosition = (
  dropX: number, 
  dropY: number, 
  componentWidth: number, 
  componentDepth: number, 
  roomWidth: number, 
  roomHeight: number,
  isCornerComponent: boolean = false
) => {
  let snappedX = dropX;
  let snappedY = dropY;
  let snappedToWall = false;

  // For corner components, use 90x90 footprint
  const effectiveWidth = isCornerComponent ? 90 : componentWidth;
  const effectiveDepth = isCornerComponent ? 90 : componentDepth;

  // Calculate wall snap positions with 5cm clearance
  const leftWallX = WALL_CLEARANCE;
  const rightWallX = roomWidth - effectiveWidth - WALL_CLEARANCE;
  const topWallY = WALL_CLEARANCE;
  const bottomWallY = roomHeight - effectiveDepth - WALL_CLEARANCE;

  // Check for corner snapping first (higher priority)
  if (isCornerComponent) {
    const cornerThreshold = WALL_SNAP_THRESHOLD;
    
    // Top-left corner: (5, 5)
    if (dropX <= cornerThreshold && dropY <= cornerThreshold) {
      return { x: leftWallX, y: topWallY, snappedToWall: true, corner: 'top-left' };
    }
    
    // Top-right corner: (505, 5) for 90cm component in 600cm room
    if (dropX >= roomWidth - cornerThreshold && dropY <= cornerThreshold) {
      return { x: rightWallX, y: topWallY, snappedToWall: true, corner: 'top-right' };
    }
    
    // Bottom-left corner: (5, 310) for 90cm component in 400cm room
    if (dropX <= cornerThreshold && dropY >= roomHeight - cornerThreshold) {
      return { x: leftWallX, y: bottomWallY, snappedToWall: true, corner: 'bottom-left' };
    }
    
    // Bottom-right corner: (505, 310)
    if (dropX >= roomWidth - cornerThreshold && dropY >= roomHeight - cornerThreshold) {
      return { x: rightWallX, y: bottomWallY, snappedToWall: true, corner: 'bottom-right' };
    }
  }

  // Wall snapping for all components (including corners if not in corner zones)
  // CRITICAL FIX: dropX/dropY represent component's TOP-LEFT corner position
  // Check both the component's start edge AND end edge for wall proximity
  
  // Snap to left wall - check if component's left edge is near left wall
  if (dropX <= WALL_SNAP_THRESHOLD) {
    snappedX = leftWallX;
    snappedToWall = true;
  }
  // Snap to right wall - check if component's right edge would be near right wall boundary
  else if (dropX + effectiveWidth >= roomWidth - WALL_SNAP_THRESHOLD) {
    snappedX = rightWallX;
    snappedToWall = true;
  }
  // ADDITIONAL: Also check if the drop position itself is near the right boundary
  // This handles cases where wide components are dropped near the right edge
  else if (dropX >= roomWidth - WALL_SNAP_THRESHOLD - effectiveWidth) {
    snappedX = rightWallX;
    snappedToWall = true;
  }

  // Snap to top wall - check if component's top edge is near top wall  
  if (dropY <= WALL_SNAP_THRESHOLD) {
    snappedY = topWallY;
    snappedToWall = true;
  }
  // Snap to bottom wall - check if component's bottom edge would be near bottom wall boundary
  else if (dropY + effectiveDepth >= roomHeight - WALL_SNAP_THRESHOLD) {
    snappedY = bottomWallY;
    snappedToWall = true;
  }
  // ADDITIONAL: Also check if the drop position itself is near the bottom boundary  
  else if (dropY >= roomHeight - WALL_SNAP_THRESHOLD - effectiveDepth) {
    snappedY = bottomWallY;
    snappedToWall = true;
  }

  return { 
    x: snappedX, 
    y: snappedY, 
    snappedToWall, 
    corner: null 
  };
};

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
  onAddElement,
  showGrid = true,
  showRuler = false,
  showWireframe = false,
  showColorDetail = true,
  activeTool = 'select',
  fitToScreenSignal = 0,
  active2DView = 'plan',
  // Tape measure props - multi-measurement support
  completedMeasurements = [],
  currentMeasureStart = null,
  tapeMeasurePreview = null,
  onTapeMeasureClick,
  onTapeMeasureMouseMove,
  onClearTapeMeasure,
  // Zoom control props
  onZoomChange,
  onZoomIn,
  onZoomOut
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Notify parent of zoom changes
  useEffect(() => {
    if (onZoomChange) {
      onZoomChange(zoom);
    }
  }, [zoom, onZoomChange]);
  
  // Zoom control functions
  const handleZoomIn = useCallback(() => {
    if (onZoomIn) {
      onZoomIn();
    } else {
      setZoom(prev => Math.min(MAX_ZOOM, prev * 1.2));
    }
  }, [onZoomIn]);
  
  const handleZoomOut = useCallback(() => {
    if (onZoomOut) {
      onZoomOut();
    } else {
      setZoom(prev => Math.max(MIN_ZOOM, prev / 1.2));
    }
  }, [onZoomOut]);
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

  // Use design dimensions (required)
  // If roomDimensions is missing, this indicates a data integrity error
  if (!design.roomDimensions) {
    console.error('[DesignCanvas2D] Missing room dimensions in design object:', design);
    throw new Error('Room dimensions are required. This is a data integrity error.');
  }
  const roomDimensions = design.roomDimensions;
  
  // Mobile detection
  const isMobile = useIsMobile();

  // Touch events state
  const [touchZoomStart, setTouchZoomStart] = useState<number | null>(null);

  // Preload configuration values from database on component mount
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        await ConfigurationService.preload();

        // Load all config values into cache for synchronous access
        configCache = {
          canvas_width: ConfigurationService.getSync('canvas_width', CANVAS_WIDTH),
          canvas_height: ConfigurationService.getSync('canvas_height', CANVAS_HEIGHT),
          grid_size: ConfigurationService.getSync('grid_size', GRID_SIZE),
          min_zoom: ConfigurationService.getSync('min_zoom', MIN_ZOOM),
          max_zoom: ConfigurationService.getSync('max_zoom', MAX_ZOOM),
          wall_thickness: ConfigurationService.getSync('wall_thickness', WALL_THICKNESS),
          wall_clearance: ConfigurationService.getSync('wall_clearance', WALL_CLEARANCE),
          wall_snap_threshold: ConfigurationService.getSync('wall_snap_threshold', WALL_SNAP_THRESHOLD),
          snap_tolerance_default: ConfigurationService.getSync('snap_tolerance_default', 15),
          snap_tolerance_countertop: ConfigurationService.getSync('snap_tolerance_countertop', 25),
          proximity_threshold: ConfigurationService.getSync('proximity_threshold', 100),
          wall_snap_distance_default: ConfigurationService.getSync('wall_snap_distance_default', 35),
          wall_snap_distance_countertop: ConfigurationService.getSync('wall_snap_distance_countertop', 50),
          corner_tolerance: ConfigurationService.getSync('corner_tolerance', 30),
          toe_kick_height: ConfigurationService.getSync('toe_kick_height', 8),
          drag_threshold_mouse: ConfigurationService.getSync('drag_threshold_mouse', 5),
          drag_threshold_touch: ConfigurationService.getSync('drag_threshold_touch', 10),
        };

        console.log('[DesignCanvas2D] Configuration loaded from database:', configCache);

        // Preload 2D render definitions (Phase 3: Database-Driven 2D Rendering)
        await render2DService.preloadAll();
        console.log('[DesignCanvas2D] 2D render definitions preloaded');
      } catch (error) {
        console.warn('[DesignCanvas2D] Failed to load configuration, using hardcoded fallbacks:', error);
      }
    };

    loadConfiguration();
  }, []);

  // Helper function to get wall height (ceiling height) - prioritize room dimensions over cache
  const getWallHeight = useCallback(() => {
    // Priority: roomDimensions.ceilingHeight > roomConfigCache > hardcoded 250cm default
    return roomDimensions.ceilingHeight || roomConfigCache?.wall_height || 250;
  }, [roomDimensions.ceilingHeight]);
  
  // Calculate room bounds with wall thickness
  // roomDimensions represents the INNER usable space (like 3D interior)
  const innerRoomBounds = {
    width: roomDimensions.width,
    height: roomDimensions.height
  };
  
  // Outer bounds include wall thickness (for drawing walls)
  const outerRoomBounds = {
    width: roomDimensions.width + (WALL_THICKNESS * 2),
    height: roomDimensions.height + (WALL_THICKNESS * 2)
  };
  
  // Room positioning - align rooms to top-center of the canvas for better space utilization
  // For elevation views, use different centering logic
  const roomPosition = (() => {
    if (active2DView === 'left' || active2DView === 'right') {
      // Left/Right elevation views: top-center based on room depth and wall height
      const wallHeight = getWallHeight();
      const roomDepth = roomDimensions.height; // Use height as depth for side views
      const topMargin = 100; // Space from top of canvas
      return {
        // Outer room position (for wall drawing)
        outerX: (CANVAS_WIDTH / 2) - (roomDepth * zoom / 2) + panOffset.x,
        outerY: topMargin + panOffset.y,
        // Inner room position (for component placement)
        innerX: (CANVAS_WIDTH / 2) - (roomDepth * zoom / 2) + panOffset.x,
        innerY: topMargin + panOffset.y
      };
    } else {
      // Plan, Front, Back views: top-center alignment
      const topMargin = 100; // Space from top of canvas
      // For plan view, center the inner room and add wall thickness around it
      const innerX = (CANVAS_WIDTH / 2) - (innerRoomBounds.width * zoom / 2) + panOffset.x;
      const innerY = topMargin + panOffset.y;
      const wallThickness = WALL_THICKNESS * zoom;
      return {
        // Outer room position (for wall drawing) - centered around inner room
        outerX: innerX - wallThickness,
        outerY: innerY - wallThickness,
        // Inner room position (for component placement)
        innerX: innerX,
        innerY: innerY
      };
    }
  })();

  // Convert room coordinates to canvas coordinates (uses inner room for component placement)
  const roomToCanvas = useCallback((roomX: number, roomY: number) => {
    return {
      x: roomPosition.innerX + (roomX * zoom),
      y: roomPosition.innerY + (roomY * zoom)
    };
  }, [roomPosition, zoom, active2DView]);

  // Convert canvas coordinates to room coordinates (uses inner room for component placement)
  const canvasToRoom = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: (canvasX - roomPosition.innerX) / zoom,
      y: (canvasY - roomPosition.innerY) / zoom
    };
  }, [roomPosition, zoom, active2DView]);

  // Preload component behaviors and room configuration
  useEffect(() => {
    const preloadData = async () => {
      try {
        // Load room configuration
        await getRoomConfig(design.roomType, design.roomDimensions);
        
        // Initialize the coordinate engine with current room dimensions
        try {
          initializeCoordinateEngine(design.roomDimensions);
          console.log('🏗️ [DesignCanvas2D] Coordinate engine initialized for room:', design.roomDimensions);
        } catch (error) {
          console.warn('⚠️ [DesignCanvas2D] Failed to initialize coordinate engine:', error);
        }
        
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
    // Use more generous snap tolerance for counter tops - database-driven
    const isCounterTop = element.type === 'counter-top';
    const snapTolerance = isCounterTop
      ? (configCache.snap_tolerance_countertop || 25)
      : (configCache.snap_tolerance_default || 15);
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

    // Component-to-component snapping - only for nearby elements (database-driven)
    const proximityThreshold = configCache.proximity_threshold || 100;
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
      // Use more generous wall snap distance for counter tops (database-driven)
      const wallSnapDistance = isCounterTop
        ? (configCache.wall_snap_distance_countertop || 50)
        : (configCache.wall_snap_distance_default || 35);
      const cornerTolerance = configCache.corner_tolerance || 30;
      
      // Check if this is a corner unit placement
      // ALL corner components use 90cm square dimensions for detection
      const isCornerCounterTop = element.type === 'counter-top' && element.id.includes('counter-top-corner');
      const isCornerWallCabinet = element.type === 'cabinet' && element.id.includes('corner-wall-cabinet');
      const isCornerBaseCabinet = element.type === 'cabinet' && (element.id.includes('corner-base-cabinet') || element.id.includes('l-shaped-test-cabinet'));
      const isCornerTallUnit = element.type === 'cabinet' && (
        element.id.includes('corner-tall') || 
        element.id.includes('corner-larder') ||
        element.id.includes('larder-corner')
      );
      const isAnyCornerComponent = isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit;
      
      const detectionWidth = isAnyCornerComponent ? 90 : elementWidth;
      const detectionDepth = isAnyCornerComponent ? 90 : elementDepth;
      
      const isCornerPosition = 
        (x <= cornerTolerance && y <= cornerTolerance) || // front-left corner
        (x >= roomDimensions.width - detectionWidth - cornerTolerance && y <= cornerTolerance) || // front-right corner
        (x <= cornerTolerance && y >= roomDimensions.height - detectionDepth - cornerTolerance) || // back-left corner
        (x >= roomDimensions.width - detectionWidth - cornerTolerance && y >= roomDimensions.height - detectionDepth - cornerTolerance); // back-right corner
      
      if (isCornerPosition) {
        // Special handling for corner units - they have specific orientations
        // ALL corner components use 90cm square dimensions for positioning
        const cornerWidth = isAnyCornerComponent ? 90 : elementWidth;
        const cornerDepth = isAnyCornerComponent ? 90 : elementDepth;
        
        if (x <= cornerTolerance && y <= cornerTolerance) {
          // Front-left corner (TOP-LEFT)
          if (isAnyCornerComponent) {
            rotation = 0; // L-shape faces down-right
          } else {
            rotation = 90; // door faces right (into room)
          }
          snappedX = 0;
          snappedY = 0;
          guides.vertical.push(0);
          guides.horizontal.push(0);
        } else if (x >= roomDimensions.width - cornerWidth - cornerTolerance && y <= cornerTolerance) {
          // Front-right corner (TOP-RIGHT)
          if (isAnyCornerComponent) {
            rotation = 270; // L-shape faces down-left
          } else {
            rotation = 270; // door faces left (into room)
          }
          snappedX = roomDimensions.width - cornerWidth;
          snappedY = 0;
          guides.vertical.push(roomDimensions.width);
          guides.horizontal.push(0);
        } else if (x <= cornerTolerance && y >= roomDimensions.height - cornerDepth - cornerTolerance) {
          // Back-left corner (BOTTOM-LEFT)
          if (isAnyCornerComponent) {
            rotation = 90; // L-shape faces up-right
          } else {
            rotation = 90; // door faces right (into room)
          }
          snappedX = 0;
          snappedY = roomDimensions.height - cornerDepth;
          guides.vertical.push(0);
          guides.horizontal.push(roomDimensions.height);
        } else if (x >= roomDimensions.width - cornerWidth - cornerTolerance && y >= roomDimensions.height - cornerDepth - cornerTolerance) {
          // Back-right corner (BOTTOM-RIGHT)
          if (isAnyCornerComponent) {
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
    const innerWidth = innerRoomBounds.width * zoom;
    const innerHeight = innerRoomBounds.height * zoom;
    const outerWidth = outerRoomBounds.width * zoom;
    const outerHeight = outerRoomBounds.height * zoom;
    const wallThickness = WALL_THICKNESS * zoom;

    if (active2DView === 'plan') {
      // Plan view - draw walls with proper thickness
      
      // Draw outer walls (wall structure)
      ctx.fillStyle = '#e5e5e5';
      ctx.fillRect(roomPosition.outerX, roomPosition.outerY, outerWidth, outerHeight);
      
      // Draw inner room (usable space)
      ctx.fillStyle = '#f9f9f9';
      ctx.fillRect(roomPosition.innerX, roomPosition.innerY, innerWidth, innerHeight);

      // Draw wall outlines
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      
      // Outer wall boundary
      ctx.strokeRect(roomPosition.outerX, roomPosition.outerY, outerWidth, outerHeight);
      // Inner room boundary (where components can be placed)
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(roomPosition.innerX, roomPosition.innerY, innerWidth, innerHeight);

      // Room dimensions labels
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      // Width label (top) - show inner room dimensions
      ctx.fillText(
        `${roomDimensions.width}cm (inner)`,
        roomPosition.innerX + innerWidth / 2,
        roomPosition.outerY - 10
      );

      // Height label (left) - show inner room dimensions
      ctx.save();
      ctx.translate(roomPosition.outerX - 25, roomPosition.innerY + innerHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${roomDimensions.height}cm (inner)`, 0, 0);
      ctx.restore();
      
      // Wall thickness labels
      ctx.fillStyle = '#999';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      
      // Top wall thickness
      ctx.fillText(
        `${WALL_THICKNESS}cm`,
        roomPosition.innerX + innerWidth / 2,
        roomPosition.outerY + wallThickness / 2 + 3
      );
      
      // Left wall thickness
      ctx.save();
      ctx.translate(roomPosition.outerX + wallThickness / 2, roomPosition.innerY + innerHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${WALL_THICKNESS}cm`, 0, 3);
      ctx.restore();

    } else {
      // Elevation view - draw room as elevation (floor fixed, ceiling moves)
      const wallHeight = getWallHeight() * zoom;
      const floorY = roomPosition.innerY + (CANVAS_HEIGHT * 0.4); // Fixed floor position (adjusted for top-center alignment)
      const topY = floorY - wallHeight; // Ceiling moves up/down based on wall height

      // CRITICAL FIX: Use appropriate dimension for each elevation view
      let elevationRoomWidth: number;
      if (active2DView === 'front' || active2DView === 'back') {
        elevationRoomWidth = roomDimensions.width * zoom; // Use room width for front/back views
      } else {
        elevationRoomWidth = roomDimensions.height * zoom; // Use room depth for left/right views
      }

      // Draw wall boundaries 
      ctx.fillStyle = '#f9f9f9';
      ctx.fillRect(roomPosition.innerX, topY, elevationRoomWidth, wallHeight);

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(roomPosition.innerX, topY, elevationRoomWidth, wallHeight);

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
        wallLabels[active2DView] || '',
        roomPosition.innerX + elevationRoomWidth / 2,
        roomPosition.innerY - 20
      );

      // Dimension labels
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      
      // Width dimension (bottom) - use inner room dimensions
      let widthText = '';
      if (active2DView === 'front' || active2DView === 'back') {
        widthText = `${roomDimensions.width}cm (inner)`;
      } else {
        widthText = `${roomDimensions.height}cm (inner)`;
      }
      ctx.textAlign = 'center';
      ctx.fillText(widthText, roomPosition.innerX + elevationRoomWidth / 2, floorY + 20);
      
      // Wall height dimension (left side)
      const heightText = `${getWallHeight()}cm`;
      ctx.save();
      ctx.translate(roomPosition.innerX - 35, topY + wallHeight / 2);
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
  }, [roomDimensions, roomPosition, zoom, active2DView]);

  // LEGACY CODE REMOVED: drawSinkPlanView function (173 lines)
  // Replaced by database-driven handlers in src/services/2d-renderers/plan-view-handlers.ts
  // See archive: docs/session-2025-10-09-2d-database-migration/LEGACY-CODE-FULL-ARCHIVE.md

  // Draw element with smart rendering
  const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: DesignElement) => {
    const isSelected = selectedElement?.id === element.id;
    const isHovered = hoveredElement?.id === element.id;
    
    if (active2DView === 'plan') {
      // Plan view rendering - Support both color detail and wireframe overlays
      const pos = roomToCanvas(element.x, element.y);
      const width = element.width * zoom;
      const depth = (element.depth || element.height) * zoom; // Use depth for Y-axis in plan view
      const rotation = element.rotation || 0;

      ctx.save();
      
      // Check if this is a corner component (needed for wireframe/selection overlays)
      // Note: Main rendering now uses database field plan_view_type: 'corner-square'
      const isCornerComponent = element.id.includes('corner-');

      // Apply rotation - convert degrees to radians if needed
      ctx.translate(pos.x + width / 2, pos.y + depth / 2);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-width / 2, -depth / 2);

      // COLOR DETAIL RENDERING (if enabled)
      if (showColorDetail) {
        // Try database-driven rendering first (Phase 3: Database-Driven 2D Rendering)
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
              renderPlanView(ctx, element, renderDef, zoom);
              renderedByDatabase = true;
            }
          } catch (error) {
            console.warn('[DesignCanvas2D] Database rendering failed, falling back to legacy:', error);
          }
        }

        // Minimal fallback if database rendering not enabled or failed
        if (!renderedByDatabase) {
          // Simple rectangle fallback
          ctx.fillStyle = element.color || '#8b4513';
          ctx.fillRect(0, 0, width, depth);
        }
      }

      // WIREFRAME OVERLAY (if enabled)
      if (showWireframe) {
        ctx.strokeStyle = '#000000'; // Black wireframe outlines
        ctx.lineWidth = 0.5; // Ultra-thin lines as requested
        ctx.setLineDash([]);
        
        if (isCornerComponent) {
          // Corner components: Draw as square wireframe
          const squareSize = Math.min(element.width, element.depth) * zoom;
          ctx.strokeRect(0, 0, squareSize, squareSize);
        } else {
          // Standard components: Draw as rectangular wireframe
          ctx.strokeRect(0, 0, width, depth);
        }
      }

      // Selection overlay - Red outline when selected (drawn on top of everything)
      if (isSelected) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        
        if (isCornerComponent) {
          const squareSize = Math.min(element.width, element.depth) * zoom;
          ctx.strokeRect(0, 0, squareSize, squareSize);
        } else {
          ctx.strokeRect(0, 0, width, depth);
        }
      }

      ctx.restore();

      // Selection handles (drawn after restore)
      if (isSelected) {
        drawSelectionHandles(ctx, element);
      }

    } else {
      // Elevation view rendering
      drawElementElevation(ctx, element, isSelected, isHovered, showWireframe);
    }
  }, [active2DView, roomToCanvas, selectedElement, hoveredElement, zoom, showWireframe, showColorDetail]);


  // Draw selection handles using rotated bounding box
  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, element: DesignElement) => {
    const handleSize = 8;
    ctx.fillStyle = '#ff6b6b';
    
    // Get the rotated bounding box for the element
    const bbox = getRotatedBoundingBox(element);
    const canvasMin = roomToCanvas(bbox.minX, bbox.minY);
    const canvasMax = roomToCanvas(bbox.maxX, bbox.maxY);
    
    // Draw handles at the corners of the bounding box
    const handles = [
      { x: canvasMin.x - handleSize/2, y: canvasMin.y - handleSize/2 },
      { x: canvasMax.x - handleSize/2, y: canvasMin.y - handleSize/2 },
      { x: canvasMin.x - handleSize/2, y: canvasMax.y - handleSize/2 },
      { x: canvasMax.x - handleSize/2, y: canvasMax.y - handleSize/2 }
    ];
    
    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
    });
  };

  // Draw element in elevation view with detailed fronts
  const drawElementElevation = (ctx: CanvasRenderingContext2D, element: DesignElement, isSelected: boolean, isHovered: boolean, showWireframe: boolean) => {
    // Check if element should be visible in current elevation view
    const wall = getElementWall(element);
    const isCornerVisible = isCornerVisibleInView(element, active2DView);
    
    if (!isCornerVisible && wall !== active2DView && wall !== 'center') return;

    // Async preload behavior if not cached
    if (!componentBehaviorCache.has(element.type)) {
      getComponentBehavior(element.type).catch(console.warn);
    }
    // CRITICAL FIX: Elevation views should use inner room dimensions for proper alignment
    // Components are positioned within the inner room space, not including wall thickness
    const elevationWidth = roomDimensions.width * zoom; // Inner room width for front/back views
    const elevationDepth = roomDimensions.height * zoom; // Inner room depth for left/right views
    const floorY = roomPosition.innerY + (CANVAS_HEIGHT * 0.4); // Fixed floor position (adjusted for top-center alignment)
    
    // Calculate rotation-aware dimensions
    const rotation = (element.rotation || 0) * Math.PI / 180;
    const isRotated = Math.abs(Math.sin(rotation)) > 0.1; // 90° or 270° rotation
    
    // Get effective dimensions based on rotation
    let effectiveWidth: number;
    let effectiveDepth: number;
    
    if (isRotated) {
      // When rotated 90° or 270°, width and depth are swapped
      effectiveWidth = element.depth;
      effectiveDepth = element.width;
    } else {
      // Normal orientation
      effectiveWidth = element.width;
      effectiveDepth = element.depth;
    }

    // 🎯 Calculate horizontal position using PositionCalculation utility
    // Feature flag controls switching between legacy (asymmetric) and new (unified) coordinate systems
    // Legacy code preserved inside PositionCalculation for instant rollback capability
    // Now synchronous to avoid render race conditions
    const { xPos, elementWidth } = PositionCalculation.calculateElevationPosition(
      element,
      roomDimensions,
      roomPosition,
      active2DView,
      zoom,
      elevationWidth,
      elevationDepth
    );
    
    // Tall corner unit dimensions are now correct (90x90cm) after database migration
    
    // Calculate vertical position and height based on component type
    // REVERT TO SIMPLE HARDCODED APPROACH - database system was too complex
    let elementHeight: number;
    let yPos: number;
    
    // Simple hardcoded elevation heights that were working before
    let elevationHeightCm: number;
    
    // Determine elevation height based on component type and ID
    if (element.type === 'cornice') {
      elevationHeightCm = 30; // Cornice height
    } else if (element.type === 'pelmet') {
      elevationHeightCm = 20; // Pelmet height
    } else if (element.type === 'counter-top') {
      elevationHeightCm = 4; // Counter top thickness
    } else if (element.type === 'cabinet' && element.id.includes('wall-cabinet')) {
      elevationHeightCm = 70; // Wall cabinet height
    } else if (element.type === 'cabinet' && (element.id.includes('tall') || element.id.includes('larder'))) {
      elevationHeightCm = element.height; // Use actual height for tall units - THIS IS KEY!
    } else if (element.type === 'cabinet') {
      elevationHeightCm = 90; // Base cabinet height
    } else if (element.type === 'appliance') {
      elevationHeightCm = element.height; // Use actual height for appliances
    } else if (element.type === 'window') {
      elevationHeightCm = 100; // Window height
    } else if (element.type === 'wall-unit-end-panel') {
      elevationHeightCm = 70; // Wall unit end panel height
    } else if (element.type === 'sink') {
      // Different heights for butler vs kitchen sinks
      const isButlerSink = element.id.includes('butler-sink') || element.id.includes('butler') || element.id.includes('base-unit-sink');
      elevationHeightCm = isButlerSink ? 30 : 20; // 30cm for butler sinks, 20cm for kitchen sinks
    } else {
      elevationHeightCm = element.height; // Default to actual element height
    }
    
    elementHeight = elevationHeightCm * zoom;
    
    // Calculate Y position based on component Z position and type
    if (element.z && element.z > 0) {
      // Component has explicit Z position - use it
      const mountHeight = element.z * zoom;
      yPos = floorY - mountHeight - elementHeight;
    } else {
      // Default positioning based on type
      if (element.type === 'cabinet' && element.id.includes('wall-cabinet')) {
        // Wall cabinets at 140cm height
        yPos = floorY - (140 * zoom) - elementHeight;
      } else if (element.type === 'cornice') {
        // Cornice at top of wall units (200cm)
        yPos = floorY - (200 * zoom) - elementHeight;
      } else if (element.type === 'pelmet') {
        // Pelmet at bottom of wall units (140cm)
        yPos = floorY - (140 * zoom);
      } else if (element.type === 'window') {
        // Windows at 90cm height
        yPos = floorY - (90 * zoom) - elementHeight;
      } else if (element.type === 'sink') {
        // Sink positioning based on type
        const isButlerSink = element.id.includes('butler-sink') || element.id.includes('butler') || element.id.includes('base-unit-sink');
        if (isButlerSink) {
          // Butler sinks at Z position 65cm
          yPos = floorY - (65 * zoom) - elementHeight;
        } else {
          // Kitchen sinks at Z position 75cm
          yPos = floorY - (75 * zoom) - elementHeight;
        }
      } else {
        // Floor level components
        yPos = floorY - elementHeight;
      }
    }

    // Draw detailed elevation view
    ctx.save();

    // Try database-driven rendering first (Phase 3: Database-Driven 2D Rendering)
    const useDatabaseRendering = FeatureFlagService.isEnabled('use_database_2d_rendering');
    let renderedByDatabase = false;

    if (useDatabaseRendering) {
      try {
        const renderDef = render2DService.getCached(element.component_id);
        if (renderDef) {
          console.log('[DesignCanvas2D] Rendering elevation for:', element.component_id, 'with data:', renderDef.elevation_data);

          // Apply selection/hover colors
          if (isSelected) {
            ctx.fillStyle = '#ff6b6b';
          } else if (isHovered) {
            ctx.fillStyle = '#b0b0b0';
          } else {
            ctx.fillStyle = renderDef.fill_color || element.color || '#8b4513';
          }

          // Render using database-driven system (with roomDimensions for corner logic)
          renderElevationView(
            ctx,
            element,
            renderDef,
            active2DView,
            xPos,
            yPos,
            elementWidth,
            elementHeight,
            zoom,
            roomDimensions // Pass room dimensions for corner cabinet positioning
          );
          renderedByDatabase = true;
        } else {
          console.warn('[DesignCanvas2D] No render definition found for:', element.component_id);
        }
      } catch (error) {
        console.warn('[DesignCanvas2D] Elevation database rendering failed, falling back to legacy:', error);
      }
    } else {
      console.warn('[DesignCanvas2D] Database rendering disabled by feature flag');
    }

    // Fallback to legacy rendering if database rendering not enabled or failed
    if (!renderedByDatabase) {
      // Main cabinet body
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

    // WIREFRAME OVERLAY (if enabled) - for elevation views
    if (showWireframe) {
      ctx.strokeStyle = '#000000'; // Black wireframe outlines
      ctx.lineWidth = 0.5; // Ultra-thin lines as requested
      ctx.setLineDash([]);
      ctx.strokeRect(xPos, yPos, elementWidth, elementHeight);
    }

    // LEGACY CODE REMOVED: Elevation detail function calls (28 lines)
    // All elevation detail rendering now handled by database-driven handlers
    // See archive: docs/session-2025-10-09-2d-database-migration/LEGACY-CODE-FULL-ARCHIVE.md

    ctx.restore();
  };

  // =============================================================================
  // LEGACY ELEVATION DETAIL FUNCTIONS REMOVED (875 lines)
  // =============================================================================
  // Date: 2025-10-10
  // Reason: Migrated to database-driven 2D rendering system
  //
  // All elevation detail rendering now handled by:
  // - src/services/2d-renderers/elevation-view-handlers.ts
  // - Database: component_2d_renders table (elevation_data JSONB)
  //
  // Functions removed:
  // - drawCabinetElevationDetails (233 lines)
  // - drawApplianceElevationDetails (75 lines)
  // - drawCounterTopElevationDetails (32 lines)
  // - drawEndPanelElevationDetails (32 lines)
  // - drawWindowElevationDetails (32 lines)
  // - drawDoorElevationDetails (45 lines)
  // - drawFlooringElevationDetails (69 lines)
  // - drawToeKickElevationDetails (27 lines)
  // - drawCorniceElevationDetails (31 lines)
  // - drawPelmetElevationDetails (34 lines)
  // - drawWallUnitEndPanelElevationDetails (27 lines)
  // - drawSinkElevationDetails (71 lines)
  // - isCornerUnit (19 lines)
  // - getElementWall (23 lines)
  // - isCornerVisibleInView (16 lines)
  // - shouldShowCornerDoorFace (8 lines)
  //
  // Full archive available at:
  // docs/session-2025-10-09-2d-database-migration/LEGACY-CODE-FULL-ARCHIVE.md
  //
  // Git commit before removal: 14b478d (feat: Implement view-specific corner cabinet door logic)
  // Git commit with removal: d31b6e2 (Refactor: Remove 875 lines of legacy elevation rendering code)
  // =============================================================================

  // =============================================================================
  // HELPER FUNCTIONS - Element Visibility Logic (Required for Elevation Views)
  // =============================================================================
  // These functions were preserved because they're used throughout the component
  // for determining element visibility in elevation views, not just for rendering.
  // =============================================================================

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

  // =============================================================================
  // END HELPER FUNCTIONS
  // =============================================================================

  // Zoom controls removed - now handled by React component in Designer.tsx

  // Draw ruler/tape measure
  const drawRuler = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showRuler) return;

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.fillStyle = '#666';

    if (active2DView === 'plan') {
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
          ctx.fillText(`${x}cm`, xPos, rulerY - 8);
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
      const wallHeight = getWallHeight() * zoom;
      const floorY = roomPosition.innerY + (CANVAS_HEIGHT * 0.4); // Fixed floor position (adjusted for top-center alignment)
      const topY = floorY - wallHeight; // Ceiling moves up/down based on wall height
      const rulerY = floorY + 25;
      
      ctx.beginPath();
      ctx.moveTo(roomPosition.innerX, rulerY);
      ctx.lineTo(roomPosition.innerX + roomWidth * zoom, rulerY);
      ctx.stroke();

      for (let x = 0; x <= roomWidth; x += 50) {
        const xPos = roomPosition.innerX + x * zoom;
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
      const rulerX = roomPosition.innerX + roomWidth * zoom + 25;
      
      ctx.beginPath();
      ctx.moveTo(rulerX, topY);
      ctx.lineTo(rulerX, floorY);
      ctx.stroke();

      for (let h = 0; h <= getWallHeight(); h += 50) {
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
    const isCornerWallCabinet = draggedElement.type === 'cabinet' && (draggedElement.id.includes('corner-wall-cabinet') || draggedElement.id.includes('new-corner-wall-cabinet'));
    const isCornerBaseCabinet = draggedElement.type === 'cabinet' && draggedElement.id.includes('corner-base-cabinet');
    const isCornerTallUnit = draggedElement.type === 'cabinet' && (
      draggedElement.id.includes('corner-tall') || 
      draggedElement.id.includes('corner-larder') ||
      draggedElement.id.includes('larder-corner')
    );
    
    const isCornerComponent = isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit;
    
    // Draw preview at snap position (plan view only)
    ctx.save();
    ctx.globalAlpha = 0.8;
    
    // Preview border - green if snapping, red if not
    const isSnapped = Math.abs(snapResult.x - roomPos.x) > 0.1 || Math.abs(snapResult.y - roomPos.y) > 0.1;
    const previewColor = isSnapped ? '#00ff00' : '#ff6b6b';
    
    // COLOR DETAIL PREVIEW (if enabled)
    if (showColorDetail) {
      ctx.fillStyle = draggedElement.color || '#8b4513';
      
      if (isCornerComponent) {
        const squareSize = Math.min(draggedElement.width, draggedElement.depth) * zoom;
        ctx.fillRect(pos.x, pos.y, squareSize, squareSize);
      } else {
        const width = draggedElement.width * zoom;
        const height = (draggedElement.depth || draggedElement.height) * zoom;
        ctx.fillRect(pos.x, pos.y, width, height);
      }
    }
    
    // WIREFRAME PREVIEW (if enabled)
    if (showWireframe) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([]);
      
      if (isCornerComponent) {
        const squareSize = Math.min(draggedElement.width, draggedElement.depth) * zoom;
        ctx.strokeRect(pos.x, pos.y, squareSize, squareSize);
      } else {
        const width = draggedElement.width * zoom;
        const height = (draggedElement.depth || draggedElement.height) * zoom;
        ctx.strokeRect(pos.x, pos.y, width, height);
      }
    }
    
    // Preview border outline
    ctx.strokeStyle = previewColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    if (isCornerComponent) {
      const squareSize = Math.min(draggedElement.width, draggedElement.depth) * zoom;
      ctx.strokeRect(pos.x, pos.y, squareSize, squareSize);
    } else {
      const width = draggedElement.width * zoom;
      const height = (draggedElement.depth || draggedElement.height) * zoom;
      ctx.strokeRect(pos.x, pos.y, width, height);
    }
    
    ctx.restore();
  }, [isDragging, draggedElement, currentMousePos, canvasToRoom, roomToCanvas, zoom, getSnapPosition, showWireframe, showColorDetail]);

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

    // Draw elements with proper layering and visibility
    let elementsToRender = active2DView === 'plan'
      ? design.elements
      : design.elements.filter(el => {
          const wall = getElementWall(el);
          const isCornerVisible = isCornerVisibleInView(el, active2DView);
          return wall === active2DView || wall === 'center' || isCornerVisible;
        });

    // Filter out invisible elements
    elementsToRender = elementsToRender.filter(element => element.isVisible !== false);

    // Sort elements by zIndex for proper layering (lower zIndex = drawn first/behind)
    elementsToRender.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Debug logging for layering order (disabled - causes console spam)
    // Uncomment for debugging: console.log(`🎯 [Rendering] Elements in order:`, elementsToRender.map(el => `${el.id} (${el.type}) -> zIndex: ${el.zIndex}`));

    // Use for...of loop to handle async drawElement calls
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

    // Draw ruler
    drawRuler(ctx);

  }, [drawGrid, drawRoom, drawElement, drawSnapGuides, drawDragPreview, drawTapeMeasure, drawRuler, design.elements, active2DView, draggedElement, isDragging]);


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

    // Zoom control clicks now handled by React component in Designer.tsx

    // Right-click for panning (regardless of active tool)
    if (e.button === 2) { // Right mouse button
      e.preventDefault(); // Prevent context menu
      setIsDragging(true);
      setDragStart({ x, y });
      return;
    }

    // Left-click pan tool (legacy support)
    if (activeTool === 'pan' && e.button === 0) {
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

    // Check for element clicks - use same filtering and ordering as rendering
    const roomPos = canvasToRoom(x, y);
    
    // Filter and sort elements the same way as rendering (but in reverse order for selection)
    let elementsToCheck = active2DView === 'plan'
      ? design.elements
      : design.elements.filter(el => {
          const wall = getElementWall(el);
          const isCornerVisible = isCornerVisibleInView(el, active2DView);
          return wall === active2DView || wall === 'center' || isCornerVisible;
        });

    // Filter out invisible elements
    elementsToCheck = elementsToCheck.filter(element => element.isVisible !== false);

    // Sort elements by zIndex in DESCENDING order (highest zIndex first) for selection
    elementsToCheck.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    
    const clickedElement = elementsToCheck.find(element => {
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
      
      // Use same filtering and ordering as selection for hover detection
      let elementsToCheck = active2DView === 'plan'
        ? design.elements
        : design.elements.filter(el => {
            const wall = getElementWall(el);
            const isCornerVisible = isCornerVisibleInView(el, active2DView);
            return wall === active2DView || wall === 'center' || isCornerVisible;
          });

      // Filter out invisible elements
      elementsToCheck = elementsToCheck.filter(element => element.isVisible !== false);

      // Sort elements by zIndex in DESCENDING order (highest zIndex first) for hover
      elementsToCheck.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
      
      const hoveredEl = elementsToCheck.find(element => {
        // Use the new rotation-aware boundary detection
        return isPointInRotatedComponent(roomPos.x, roomPos.y, element);
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
      const DRAG_THRESHOLD = configCache.drag_threshold_mouse || 5; // Database-driven drag threshold

      if (distance >= DRAG_THRESHOLD && !dragThreshold.exceeded) {
        // Start dragging now that threshold is exceeded
        setIsDragging(true);
        setDraggedElement(dragThreshold.startElement);
        setDragThreshold({ exceeded: true, startElement: dragThreshold.startElement });
      }
    }

    if (!isDragging) return;

    // Handle panning (both right-click and pan tool)
    if (activeTool === 'pan' || (isDragging && !draggedElement)) {
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

  // Prevent context menu on right-click
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  }, []);

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
      // DYNAMIC: Corner components use their actual square footprint
      const isCornerCounterTop = draggedElement.type === 'counter-top' && draggedElement.id.includes('counter-top-corner');
      const isCornerWallCabinet = draggedElement.type === 'cabinet' && draggedElement.id.includes('corner-wall-cabinet');
      const isCornerBaseCabinet = draggedElement.type === 'cabinet' && draggedElement.id.includes('corner-base-cabinet');
      const isCornerTallUnit = draggedElement.type === 'cabinet' && (
        draggedElement.id.includes('corner-tall') || 
        draggedElement.id.includes('corner-larder') ||
        draggedElement.id.includes('larder-corner')
      );
      
      if (isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit) {
        // Use actual square dimensions for corner components
        const squareSize = Math.min(draggedElement.width, draggedElement.depth);
        clampWidth = squareSize;
        clampDepth = squareSize;
      }

      // Apply Smart Wall Snapping for dragged elements
      const isCornerComponent = isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit;
      
      const dragWallSnappedPos = getEnhancedComponentPlacement(
        finalX,
        finalY,
        draggedElement.width,
        draggedElement.depth || draggedElement.height,
        draggedElement.id,
        draggedElement.type || 'cabinet',
        design.roomDimensions
      );

      // Use wall snapped position if snapped, otherwise clamp to boundaries
      let finalClampedX, finalClampedY;
      
      if (dragWallSnappedPos.snappedToWall) {
        finalClampedX = dragWallSnappedPos.x;
        finalClampedY = dragWallSnappedPos.y;
        
        // Log drag snapping for debugging
        console.log(`🎯 [Drag Snap] Element moved to ${dragWallSnappedPos.corner || 'wall'} at (${finalClampedX}, ${finalClampedY})`);
      } else {
        // Standard boundary clamping if not snapped to wall
        finalClampedX = Math.max(0, Math.min(finalX, innerRoomBounds.width - clampWidth));
        finalClampedY = Math.max(0, Math.min(finalY, innerRoomBounds.height - clampDepth));
      }

      onUpdateElement(draggedElement.id, {
        // CRITICAL FIX: Don't apply grid snapping if component was snapped to wall
        x: dragWallSnappedPos.snappedToWall ? finalClampedX : snapToGrid(finalClampedX),
        y: dragWallSnappedPos.snappedToWall ? finalClampedY : snapToGrid(finalClampedY),
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


  // Touch event handlers
  const touchEventHandlers = useTouchEvents({
    onTouchStart: useCallback((point: TouchPoint, _event: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Convert touch coordinates to canvas coordinates
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      
      const x = point.x * scaleX;
      const y = point.y * scaleY;

      // Zoom control touches now handled by React component in Designer.tsx

      if (activeTool === 'pan') {
        setIsDragging(true);
        setDragStart({ x, y });
        return;
      }

      // Handle tape measure tool
      if (activeTool === 'tape-measure') {
        setDragStart({ x, y });
        return;
      }

      // Check for element touches
      const roomPos = canvasToRoom(x, y);
      const touchedElement = design.elements.find(element => {
        // Special handling for corner counter tops - use square bounding box
        const isCornerCounterTop = element.type === 'counter-top' && element.id.includes('counter-top-corner');
        
        if (isCornerCounterTop) {
          // DYNAMIC: Use actual square dimensions for corner counter tops
          const squareSize = Math.min(element.width, element.depth);
          return roomPos.x >= element.x && roomPos.x <= element.x + squareSize &&
                 roomPos.y >= element.y && roomPos.y <= element.y + squareSize;
        } else {
          // Standard rectangular hit detection
          return roomPos.x >= element.x && roomPos.x <= element.x + element.width &&
                 roomPos.y >= element.y && roomPos.y <= element.y + (element.depth || element.height);
        }
      });

      if (touchedElement) {
        onSelectElement(touchedElement);
        if (activeTool === 'select') {
          setDragStart({ x, y });
          setDragThreshold({ exceeded: false, startElement: touchedElement });
        }
      } else {
        onSelectElement(null);
      }
    }, [activeTool, canvasToRoom, design.elements, onSelectElement, zoom]),

    onTouchMove: useCallback((point: TouchPoint, _event: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      
      const x = point.x * scaleX;
      const y = point.y * scaleY;
      
      // Always track current touch position for drag operations
      setCurrentMousePos({ x, y });

      // Handle hover detection (for touch devices, only when not dragging)
      if (!isDragging && active2DView === 'plan') {
        const roomPos = canvasToRoom(x, y);
        
        // Use same filtering and ordering as selection for hover detection
        let elementsToCheck = active2DView === 'plan'
          ? design.elements
          : design.elements.filter(el => {
              const wall = getElementWall(el);
              const isCornerVisible = isCornerVisibleInView(el, active2DView);
              return wall === active2DView || wall === 'center' || isCornerVisible;
            });

        // Filter out invisible elements
        elementsToCheck = elementsToCheck.filter(element => element.isVisible !== false);

        // Sort elements by zIndex in DESCENDING order (highest zIndex first) for hover
        elementsToCheck.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
        
        const hoveredEl = elementsToCheck.find(element => {
          return isPointInRotatedComponent(roomPos.x, roomPos.y, element);
        });
        setHoveredElement(hoveredEl || null);
      }

      // Handle tape measure preview
      if (activeTool === 'tape-measure' && onTapeMeasureMouseMove) {
        onTapeMeasureMouseMove(x, y);
      }

      // Check drag threshold before starting drag
      if (!isDragging && dragThreshold.startElement && activeTool === 'select') {
        const deltaX = x - dragStart.x;
        const deltaY = y - dragStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const DRAG_THRESHOLD = configCache.drag_threshold_touch || 10; // Database-driven touch drag threshold

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
        
        // Trigger re-render to show drag preview
        requestAnimationFrame(() => render());
      }
    }, [isDragging, activeTool, dragStart, draggedElement, canvasToRoom, design.elements, active2DView, render, throttledSnapUpdate, onTapeMeasureMouseMove]),

    onTouchEnd: useCallback((_point: TouchPoint, _event: TouchEvent) => {
      // Same logic as handleMouseUp
      if (isDragging && draggedElement) {
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
        let clampWidth = draggedElement.width;
        let clampDepth = draggedElement.depth;
        
        // Handle corner components
        const isCornerCounterTop = draggedElement.type === 'counter-top' && draggedElement.id.includes('counter-top-corner');
        const isCornerWallCabinet = draggedElement.type === 'cabinet' && draggedElement.id.includes('corner-wall-cabinet');
        const isCornerBaseCabinet = draggedElement.type === 'cabinet' && draggedElement.id.includes('corner-base-cabinet');
        const isCornerTallUnit = draggedElement.type === 'cabinet' && (
          draggedElement.id.includes('corner-tall') || 
          draggedElement.id.includes('corner-larder') ||
          draggedElement.id.includes('larder-corner')
        );
        
        if (isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit) {
          // DYNAMIC: Use actual square dimensions for corner components
          const squareSize = Math.min(draggedElement.width, draggedElement.depth);
          clampWidth = squareSize;
          clampDepth = squareSize;
        }

        // Apply Smart Wall Snapping for dragged elements
        const isCornerComponent = isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit;
        
        const dragWallSnappedPos = getEnhancedComponentPlacement(
          finalX,
          finalY,
          draggedElement.width,
          draggedElement.depth || draggedElement.height,
          draggedElement.id,
          draggedElement.type || 'cabinet',
          design.roomDimensions
        );

        // Use wall snapped position if snapped, otherwise clamp to boundaries
        let finalClampedX, finalClampedY;
        
        if (dragWallSnappedPos.snappedToWall) {
          finalClampedX = dragWallSnappedPos.x;
          finalClampedY = dragWallSnappedPos.y;
          
          console.log(`🎯 [Touch Drag Snap] Element moved to ${dragWallSnappedPos.corner || 'wall'} at (${finalClampedX}, ${finalClampedY})`);
        } else {
          // Standard boundary clamping if not snapped to wall
          finalClampedX = Math.max(0, Math.min(finalX, innerRoomBounds.width - clampWidth));
          finalClampedY = Math.max(0, Math.min(finalY, innerRoomBounds.height - clampDepth));
        }

        onUpdateElement(draggedElement.id, {
          x: dragWallSnappedPos.snappedToWall ? finalClampedX : snapToGrid(finalClampedX),
          y: dragWallSnappedPos.snappedToWall ? finalClampedY : snapToGrid(finalClampedY),
          rotation: snapped.rotation
        });
      }

      // Handle tape measure clicks
      if (activeTool === 'tape-measure' && onTapeMeasureClick && !isDragging) {
        onTapeMeasureClick(currentMousePos.x, currentMousePos.y);
      }

      // Clear drag state
      setIsDragging(false);
      setDraggedElement(null);
      setSnapGuides({ vertical: [], horizontal: [], snapPoint: null });
      setDragThreshold({ exceeded: false, startElement: null });
    }, [isDragging, draggedElement, canvasToRoom, currentMousePos, getSnapPosition, snapToGrid, onUpdateElement, roomDimensions, activeTool, onTapeMeasureClick]),

    onPinchStart: useCallback((_distance: number, _center: TouchPoint, _event: TouchEvent) => {
      setTouchZoomStart(zoom);
    }, [zoom]),

    onPinchMove: useCallback((_distance: number, scale: number, _center: TouchPoint, _event: TouchEvent) => {
      if (touchZoomStart !== null) {
        const newZoom = touchZoomStart * scale;
        setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
      }
    }, [touchZoomStart]),

    onPinchEnd: useCallback((_event: TouchEvent) => {
      setTouchZoomStart(null);
    }, []),

    onLongPress: useCallback((point: TouchPoint, _event: TouchEvent) => {
      // Handle long press for context menu or special actions
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      
      const x = point.x * scaleX;
      const y = point.y * scaleY;
      
      const roomPos = canvasToRoom(x, y);
      const longPressedElement = design.elements.find(element => {
        return isPointInRotatedComponent(roomPos.x, roomPos.y, element);
      });

      if (longPressedElement) {
        onSelectElement(longPressedElement);
        // Could trigger a context menu here in the future
        console.log(`🔗 [Long Press] Selected element: ${longPressedElement.type} at (${longPressedElement.x}, ${longPressedElement.y})`);
      }
    }, [canvasToRoom, design.elements, onSelectElement])
  });

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
      // The drag image center is already positioned correctly, so use mouse position directly
      const dropX = roomPos.x;
      const dropY = roomPos.y;


      // 🎯 BOUNDARY CHECK: Prevent drops outside inner room boundaries (usable space)
      // Components should only be placed within the inner room, not in the wall thickness
      if (dropX < -50 || dropY < -50 || dropX > innerRoomBounds.width + 50 || dropY > innerRoomBounds.height + 50) {
        console.warn('⚠️ Drop cancelled: Component dropped outside inner room boundaries');
        return;
      }

      // Use actual component dimensions for ALL components (no more forced 90x90)
      const isCornerComponent = componentData.id?.includes('corner-') || 
                               componentData.id?.includes('-corner') ||
                               componentData.id?.includes('corner');
      
      const effectiveWidth = componentData.width;
      const effectiveDepth = componentData.depth;

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

      // Apply Enhanced Component Placement using unified coordinate system
      const placementResult = getEnhancedComponentPlacement(
        dropX,
        dropY,
        effectiveWidth,
        effectiveDepth,
        componentData.id,
        componentData.type,
        design.roomDimensions
      );

      // Log placement results for debugging
      if (placementResult.snappedToWall) {
        console.log(`🎯 [Enhanced Placement] Component snapped to ${placementResult.corner || 'wall'} at (${placementResult.x}, ${placementResult.y}) with rotation ${placementResult.rotation}°`);
      }
      
      // Validate placement
      if (!placementResult.withinBounds) {
        console.warn('⚠️ [Enhanced Placement] Component placement outside room bounds, adjusting...');
      }

      const newElement: DesignElement = {
        id: `${componentData.id}-${Date.now()}`,
        component_id: componentData.id, // Database lookup key for 2D/3D rendering
        type: componentData.type,
        // Use enhanced placement results with proper wall clearance and rotation
        x: placementResult.snappedToWall ? placementResult.x : snapToGrid(placementResult.x),
        y: placementResult.snappedToWall ? placementResult.y : snapToGrid(placementResult.y),
        z: defaultZ, // Set appropriate Z position
        width: componentData.width, // X-axis dimension
        depth: componentData.depth, // Y-axis dimension (front-to-back)
        height: componentData.height, // Z-axis dimension (bottom-to-top)
        rotation: placementResult.rotation, // Use calculated rotation from enhanced placement
        color: componentData.color,
        style: componentData.name,
        zIndex: 0, // Required by DesignElement interface
        isVisible: true // Required by DesignElement interface
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

  // Attach touch events for mobile devices
  useEffect(() => {
    if (isMobile && canvasRef.current) {
      const cleanup = touchEventHandlers.attachTouchEvents(canvasRef.current);
      return cleanup;
    }
  }, [isMobile, touchEventHandlers]);

  // Auto-fit when switching to different views with specific zoom and alignment
  useEffect(() => {
    if (active2DView === 'plan') {
      // Plan view - 150% zoom, centered
      setZoom(1.5); // 150% zoom
      setPanOffset({ x: 0, y: 0 });
    } else if (active2DView === 'front' || active2DView === 'back') {
      // Front/Back views - 170% zoom, top-center aligned
      setZoom(1.7); // 170% zoom
      // Top-center alignment: move view up slightly
      setPanOffset({ x: 0, y: -50 });
    } else if (active2DView === 'left' || active2DView === 'right') {
      // Left/Right views - 170% zoom, centered (same as front/back)
      setZoom(1.7); // 170% zoom
      setPanOffset({ x: 0, y: 0 });
    }
  }, [active2DView, roomDimensions, getWallHeight]);

  // Fit to screen - different logic for elevation views
  useEffect(() => {
    if (fitToScreenSignal > 0) {
      if (active2DView === 'plan') {
        // Plan view - 150% zoom, centered
        setZoom(1.5); // 150% zoom
        setPanOffset({ x: 0, y: 0 });
      } else if (active2DView === 'front' || active2DView === 'back') {
        // Front/Back views - 170% zoom, top-center aligned
        setZoom(1.7); // 170% zoom
        setPanOffset({ x: 0, y: -50 });
      } else if (active2DView === 'left' || active2DView === 'right') {
        // Left/Right views - 170% zoom, centered (same as front/back)
        setZoom(1.7); // 170% zoom
        setPanOffset({ x: 0, y: 0 });
      }
    }
  }, [fitToScreenSignal, roomDimensions, active2DView, getWallHeight]);

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
        onContextMenu={handleContextMenu}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          cursor: activeTool === 'pan' ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair'
        }}
      />
    </div>
  );
};

