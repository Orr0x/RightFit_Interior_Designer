import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DesignElement, Design, ElevationViewConfig } from '../../types/project';
import { ComponentService } from '@/services/ComponentService';
import { getElevationViews } from '@/utils/elevationViewHelpers';
import { RoomService } from '@/services/RoomService';
import { useTouchEvents, TouchPoint } from '@/hooks/useTouchEvents';
import { useIsMobile } from '@/hooks/use-mobile';
import { getEnhancedComponentPlacement } from '@/utils/canvasCoordinateIntegration';
import { initializeCoordinateEngine, getCoordinateEngine } from '@/services/CoordinateTransformEngine';
import { PositionCalculation } from '@/utils/PositionCalculation';
import { ConfigurationService } from '@/services/ConfigurationService';
import { render2DService } from '@/services/Render2DService';
import { renderPlanView, renderElevationView } from '@/services/2d-renderers';
import { FeatureFlagService } from '@/services/FeatureFlagService';
import type { RoomGeometry } from '@/types/RoomGeometry';
import * as GeometryUtils from '@/utils/GeometryUtils';
import { useCollisionDetection } from '@/hooks/useCollisionDetection';
import { useComponentMetadata } from '@/hooks/useComponentMetadata';
import { useToast } from '@/hooks/use-toast';
import { Logger } from '@/utils/Logger';

// Story 1.15: Modular canvas rendering
import * as PlanViewRenderer from './canvas/PlanViewRenderer';
import * as ElevationViewRenderer from './canvas/ElevationViewRenderer';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  MIN_ZOOM,
  MAX_ZOOM,
  WALL_THICKNESS,
  WALL_CLEARANCE,
  WALL_SNAP_THRESHOLD,
  throttle,
  isPointInRotatedComponent,
  getWallSnappedPosition,
  snapToGrid,
  calculateRoomPosition,
  isCornerComponent,
  getEffectiveDimensions,
  getElementZIndex
} from './canvas/CanvasSharedUtilities';

// LEGACY: Keep local throttle for now (can be removed after full migration)
const throttle_legacy = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
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
  active2DView: 'plan' | 'front' | 'back' | 'left' | 'right' | string; // Now accepts view IDs like "front-default", "front-dup1"
  // Elevation view management (optional)
  elevationViews?: ElevationViewConfig[];
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
    Logger.warn('Failed to load room config, using fallback:', err);
    const fallback = {
      dimensions: roomDimensions || { width: 600, height: 400 },
      wall_height: 240,
      ceiling_height: 250
    };
    roomConfigCache = fallback;
    return fallback;
  }
};

// Canvas constants - Now imported from CanvasSharedUtilities (Story 1.15)
// REMOVED: Duplicate constants moved to shared module
// See: src/components/designer/canvas/CanvasSharedUtilities.ts

// Configuration cache - loaded from database on component mont
let configCache: Record<string, number> = {};

// Helper functions - Now imported from CanvasSharedUtilities (Story 1.15)
// REMOVED: isPointInRotatedComponent() - now imported
// REMOVED: getWallSnappedPosition() - now imported
// See: src/components/designer/canvas/CanvasSharedUtilities.ts

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
    Logger.warn(`Failed to load behavior for ${componentType}, using fallback:`, err);
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
  // Elevation view management
  elevationViews,
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
  const [roomGeometry, setRoomGeometry] = useState<RoomGeometry | null>(null);
  const [loadingGeometry, setLoadingGeometry] = useState(false);

  // Extract current view direction and hidden elements from ALL view configs (plan, elevation, 3D)
  const currentViewInfo = React.useMemo(() => {
    // Get ALL view configs (includes plan + elevations + 3D)
    const views = elevationViews || getElevationViews();

    // Find view config by active view ID (works for plan, elevations, and 3D)
    const currentView = views.find(v => v.id === active2DView);

    if (currentView) {
      return {
        direction: currentView.direction,
        hiddenElements: currentView.hidden_elements || []
      };
    }

    // Fallback for legacy data that doesn't have plan/3D configs
    if (active2DView === 'plan') {
      return { direction: 'plan' as const, hiddenElements: [] };
    }

    // Fallback: if active2DView is a direction string (legacy behavior)
    if (['front', 'back', 'left', 'right'].includes(active2DView)) {
      return { direction: active2DView as 'front' | 'back' | 'left' | 'right', hiddenElements: [] };
    }

    // Default fallback
    return { direction: 'front', hiddenElements: [] };
  }, [active2DView, elevationViews]);
  
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
  const [draggedElementOriginalPos, setDraggedElementOriginalPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredElement, setHoveredElement] = useState<DesignElement | null>(null);
  const [dragThreshold, setDragThreshold] = useState<{ exceeded: boolean; startElement: DesignElement | null }>({ exceeded: false, startElement: null });
  const [snapGuides, setSnapGuides] = useState<{
    vertical: number[];
    horizontal: number[];
    snapPoint: { x: number; y: number } | null;
  }>({ vertical: [], horizontal: [], snapPoint: null });

  // Collision detection with type-aware magnetic snapping
  const { validatePlacement } = useCollisionDetection();
  const { toast } = useToast();

  // Component metadata for layer-aware selection
  const { getComponentMetadata, loading: metadataLoading } = useComponentMetadata();

  // Use design dimensions (required)
  // If roomDimensions is missing, this indicates a data integrity error
  if (!design.roomDimensions) {
    Logger.error('[DesignCanvas2D] Missing room dimensions in design object:', design);
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

        Logger.debug('[DesignCanvas2D] Configuration loaded from database:', configCache);

        // Preload 2D render definitions (Phase 3: Database-Driven 2D Rendering)
        await render2DService.preloadAll();
        Logger.debug('[DesignCanvas2D] 2D render definitions preloaded');
      } catch (error) {
        Logger.warn('[DesignCanvas2D] Failed to load configuration, using hardcoded fallbacks:', error);
      }
    };

    loadConfiguration();
  }, []);

  // Load room geometry from database (Phase 4: Complex Room Shapes)
  useEffect(() => {
    const loadRoomGeometry = async () => {
      // Only try to load if we have a design ID
      if (design?.id) {
        setLoadingGeometry(true);
        try {
          const geometry = await RoomService.getRoomGeometry(design.id);
          if (geometry) {
            setRoomGeometry(geometry as RoomGeometry);
            Logger.debug(`✅ [DesignCanvas2D] Loaded complex room geometry for room ${design.id}:`, geometry.shape_type);
          } else {
            // No complex geometry - will use simple rectangular fallback
            setRoomGeometry(null);
            Logger.debug(`ℹ️ [DesignCanvas2D] No complex geometry found for room ${design.id}, using simple rectangular room`);
          }
        } catch (error) {
          Logger.warn(`⚠️ [DesignCanvas2D] Failed to load room geometry for ${design.id}:`, error);
          setRoomGeometry(null);
        } finally {
          setLoadingGeometry(false);
        }
      } else {
        // No design ID - use simple rectangular room
        setRoomGeometry(null);
        setLoadingGeometry(false);
      }
    };

    loadRoomGeometry();
  }, [design?.id]);

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
    if (currentViewInfo.direction === 'left' || currentViewInfo.direction === 'right') {
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
  // Story 1.5: Using CoordinateTransformEngine for NEW UNIFIED SYSTEM
  const roomToCanvas = useCallback((roomX: number, roomY: number) => {
    // Pass room dimensions as fallback to prevent "not initialized" errors
    // This handles race conditions when loading existing projects
    const engine = getCoordinateEngine(roomDimensions);
    const canvasPos = engine.planToCanvas({ x: roomX, y: roomY }, zoom);
    return {
      x: roomPosition.innerX + canvasPos.x,
      y: roomPosition.innerY + canvasPos.y
    };
  }, [roomPosition, zoom, active2DView, roomDimensions]);

  // Convert canvas coordinates to room coordinates (uses inner room for component placement)
  const canvasToRoom = useCallback((canvasX: number, canvasY: number) => {
    const x = (canvasX - roomPosition.innerX) / zoom;

    // For elevation views, Y represents vertical height (Z), and needs to be inverted
    // (canvas top = ceiling, canvas bottom = floor)
    if (active2DView !== 'plan') {
      const wallHeight = getWallHeight();
      // Invert Y so that canvas top (innerY) = ceiling (wallHeight) and bottom = floor (0)
      const y = wallHeight - ((canvasY - roomPosition.innerY) / zoom);
      return { x, y };
    }

    // For plan view, Y is normal depth coordinate
    const y = (canvasY - roomPosition.innerY) / zoom;
    return { x, y };
  }, [roomPosition, zoom, active2DView, getWallHeight]);

  // Preload component behaviors and room configuration
  useEffect(() => {
    const preloadData = async () => {
      try {
        // Load room configuration
        await getRoomConfig(design.roomType, design.roomDimensions);
        
        // Initialize the coordinate engine with current room dimensions
        try {
          initializeCoordinateEngine(design.roomDimensions);
          Logger.debug('🏗️ [DesignCanvas2D] Coordinate engine initialized for room:', design.roomDimensions);
        } catch (error) {
          Logger.warn('⚠️ [DesignCanvas2D] Failed to initialize coordinate engine:', error);
        }
        
        // Preload common component behaviors (use actual database types)
        const commonTypes = ['cabinet', 'appliance', 'counter-top', 'end-panel', 
          'window', 'door', 'flooring', 'toe-kick', 'cornice', 'pelmet'];
          
        // Load all component behaviors in parallel
        await Promise.all(
          commonTypes.map(type => getComponentBehavior(type).catch(console.warn))
        );
        
        Logger.debug('🚀 [DesignCanvas2D] Preloaded component behaviors and room config');
      } catch (err) {
        Logger.warn('Failed to preload component data:', err);
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
      const isCornerBaseCabinet = element.type === 'cabinet' && element.id.includes('corner-cabinet');
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
  // REMOVED: drawGrid() - now using PlanViewRenderer.drawGrid() (Story 1.15.1)
  // See: src/components/designer/canvas/PlanViewRenderer.ts

  // Draw room within canvas (Story 1.15.1 - using module renderers)
  const drawRoom = useCallback((ctx: CanvasRenderingContext2D) => {
    if (active2DView === 'plan') {
      // Plan view - use PlanViewRenderer
      PlanViewRenderer.drawRoomPlanView(
        ctx,
        innerRoomBounds,
        outerRoomBounds,
        roomPosition,
        zoom,
        roomGeometry
      );
    } else {
      // Elevation view - use ElevationViewRenderer
      ElevationViewRenderer.drawRoomElevationView(
        ctx,
        roomDimensions,
        roomPosition,
        zoom,
        getWallHeight(),
        currentViewInfo
      );
    }
  }, [roomDimensions, roomPosition, zoom, active2DView, roomGeometry, getWallHeight, currentViewInfo, innerRoomBounds, outerRoomBounds]);

  // REMOVED: 220+ lines of inline room rendering code (Story 1.15.1)
  // See modules: PlanViewRenderer.drawRoomPlanView() and ElevationViewRenderer.drawRoomElevationView()

  // Draw element with smart rendering
  const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: DesignElement) => {
    const isSelected = selectedElement?.id === element.id;
    const isHovered = hoveredElement?.id === element.id;

    if (active2DView === 'plan') {
      // Plan view rendering - using PlanViewRenderer module (Story 1.15.1)
      PlanViewRenderer.drawElementPlanView(
        ctx,
        element,
        zoom,
        roomToCanvas,
        isSelected,
        isHovered,
        showWireframe,
        showColorDetail
      );

      // Selection handles (drawn after element)
      if (isSelected) {
        drawSelectionHandles(ctx, element);
      }
    } else {
      // Elevation view rendering - using ElevationViewRenderer module (Story 1.15.1)
      ElevationViewRenderer.drawElementElevationView(
        ctx,
        element,
        roomDimensions,
        roomPosition,
        active2DView,
        zoom,
        isSelected,
        isHovered,
        showWireframe
      );
    }
  }, [active2DView, roomToCanvas, selectedElement, hoveredElement, zoom, showWireframe, showColorDetail, roomDimensions, roomPosition]);


  // Draw selection handles using canvas rotation (matches component rendering)
  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, element: DesignElement) => {
    const handleSize = 8;
    const width = element.width * zoom;
    const height = (element.depth || element.height) * zoom;
    const rotation = (element.rotation || 0) * Math.PI / 180;

    ctx.save();

    // Apply same transform as component rendering
    const pos = roomToCanvas(element.x, element.y);
    ctx.translate(pos.x + width / 2, pos.y + height / 2);
    ctx.rotate(rotation);

    // Draw handles at corners of UN-rotated rectangle
    ctx.fillStyle = '#ff6b6b';

    const corners = [
      { x: -width / 2, y: -height / 2 },      // Top-left
      { x: width / 2, y: -height / 2 },       // Top-right
      { x: -width / 2, y: height / 2 },       // Bottom-left
      { x: width / 2, y: height / 2 }         // Bottom-right
    ];

    corners.forEach(corner => {
      ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
    });

    ctx.restore();
  };

  // Draw element in elevation view with detailed fronts

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
  // REMOVED: drawRuler() plan view logic - now using PlanViewRenderer.drawRuler() (Story 1.15.1)
  // Elevation view ruler kept inline until ElevationViewRenderer module adds ruler support
  const drawElevationRuler = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showRuler || active2DView === 'plan') return;

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.fillStyle = '#666';

    // Elevation view rulers
    const roomWidth = currentViewInfo.direction === 'front' || currentViewInfo.direction === 'back'
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
  }, [showRuler, active2DView, roomPosition, zoom, roomDimensions, currentViewInfo, getWallHeight]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid (Story 1.15.1 - using PlanViewRenderer module)
    PlanViewRenderer.drawGrid(ctx, showGrid, zoom, panOffset);

    // Draw room
    drawRoom(ctx);

    // Draw elements with proper layering and visibility
    // Filter elements based on view type
    let elementsToRender = design.elements.filter(el => {
      // For plan view: only check per-view hidden_elements (no direction filtering)
      if (active2DView === 'plan') {
        const isHiddenInView = currentViewInfo.hiddenElements.includes(el.id);
        if (isHiddenInView) {
          return false;
        }
        return true;
      }

      // For elevation views: check both direction AND hidden_elements
      const wall = getElementWall(el);
      const isCornerVisible = isCornerVisibleInView(el, currentViewInfo.direction);

      // Check direction visibility
      const isDirectionVisible = wall === currentViewInfo.direction || wall === 'center' || isCornerVisible;
      if (!isDirectionVisible) {
        return false;
      }

      // Check if element is hidden in this specific view
      const isHiddenInView = currentViewInfo.hiddenElements.includes(el.id);
      if (isHiddenInView) {
        return false;
      }

      return true;
    });

    // Sort elements by zIndex for proper layering (lower zIndex = drawn first/behind)
    elementsToRender.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Debug logging for layering order (disabled - causes console spam)
    // Uncomment for debugging: Logger.debug(`🎯 [Rendering] Elements in order:`, elementsToRender.map(el => `${el.id} (${el.type}) -> zIndex: ${el.zIndex}`));

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

    // Draw snap guides and drag preview on top (Story 1.15.1 - using PlanViewRenderer)
    if (active2DView === 'plan') {
      PlanViewRenderer.drawSnapGuides(ctx, snapGuides, roomPosition, zoom);
      PlanViewRenderer.drawDragPreview(ctx, draggedElement, currentMousePos, canvasToRoom, roomToCanvas, zoom);
    }

    // Draw tape measure (Story 1.15.1 - using PlanViewRenderer)
    PlanViewRenderer.drawTapeMeasure(ctx, completedMeasurements, currentMeasureStart, tapeMeasurePreview, zoom);

    // Draw ruler (Story 1.15.1 - using PlanViewRenderer for plan view, inline for elevation)
    if (active2DView === 'plan') {
      PlanViewRenderer.drawRuler(ctx, showRuler, roomDimensions, roomPosition, zoom);
    } else {
      drawElevationRuler(ctx);
    }

  }, [showGrid, panOffset, drawRoom, drawElement, drawElevationRuler, design.elements, active2DView, currentViewInfo, getElementWall, isCornerVisibleInView, draggedElement, isDragging, snapGuides, roomPosition, zoom, currentMousePos, canvasToRoom, roomToCanvas, completedMeasurements, currentMeasureStart, tapeMeasurePreview, showRuler, roomDimensions]);


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
    let elementsToCheck = design.elements.filter(el => {
      // For plan view: only check per-view hidden_elements
      if (active2DView === 'plan') {
        return !currentViewInfo.hiddenElements.includes(el.id);
      }

      // For elevation views: check both direction AND hidden_elements
      const wall = getElementWall(el);
      const isCornerVisible = isCornerVisibleInView(el, currentViewInfo.direction);

      // Check direction visibility
      const isDirectionVisible = wall === currentViewInfo.direction || wall === 'center' || isCornerVisible;
      if (!isDirectionVisible) return false;

      // Check if element is hidden in this specific view
      if (currentViewInfo.hiddenElements.includes(el.id)) return false;

          return true;
        });

    // Sort elements by layer height first (wall units over base units), then by zIndex
    elementsToCheck.sort((a, b) => {
      // Get layer metadata for height-based sorting
      const metaA = getComponentMetadata(a.component_id || a.id);
      const metaB = getComponentMetadata(b.component_id || b.id);

      // Priority 1: Sort by max_height (higher components should be selected first when overlapping)
      const heightA = metaA?.max_height_cm ?? 0;
      const heightB = metaB?.max_height_cm ?? 0;

      if (heightB !== heightA) {
        return heightB - heightA;  // Higher height first (wall units before base units)
      }

      // Priority 2: If same height, sort by zIndex
      return (b.zIndex || 0) - (a.zIndex || 0);
    });
    
    const clickedElement = elementsToCheck.find(element => {
      // Different hit detection for plan vs elevation views
      if (active2DView === 'plan') {
        // Plan view: use X/Y coordinates with rotation
        const width = element.width;
        const height = element.depth || element.height;
        const rotation = (element.rotation || 0) * Math.PI / 180;

        // Transform click point into component's local space
        const centerX = element.x + width / 2;
        const centerY = element.y + height / 2;

        // Translate click to component center
        const dx = roomPos.x - centerX;
        const dy = roomPos.y - centerY;

        // Rotate backwards (inverse rotation)
        const cos = Math.cos(-rotation);
        const sin = Math.sin(-rotation);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        // Check if in un-rotated bounds
        return Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2;
      } else {
        // Elevation view: use X (horizontal) and Z (vertical) coordinates
        const width = element.width;
        const height = element.height || 86; // Use actual height for vertical dimension (updated from 90 to 86)
        const z = element.z || 0;

        // In elevation view, Z represents the mount height (bottom of element above floor)
        // The element extends from z (bottom) to z + height (top)
        const centerX = element.x + width / 2;
        const bottomZ = z; // Bottom of element above floor
        const topZ = z + height; // Top of element above floor
        const centerZ = (bottomZ + topZ) / 2; // Same as z + height/2

        // Check if click is within bounds (no rotation in elevation view)
        const isInHorizontalBounds = Math.abs(roomPos.x - centerX) <= width / 2;
        const isInVerticalBounds = roomPos.y >= bottomZ && roomPos.y <= topZ;

        return isInHorizontalBounds && isInVerticalBounds;
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
  }, [activeTool, canvasToRoom, design.elements, onSelectElement, zoom, getComponentMetadata]);

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
      let elementsToCheck = design.elements.filter(el => {
        // For plan view: only check per-view hidden_elements
        if (active2DView === 'plan') {
          return !currentViewInfo.hiddenElements.includes(el.id);
        }

        // For elevation views: check both direction AND hidden_elements
        const wall = getElementWall(el);
        const isCornerVisible = isCornerVisibleInView(el, currentViewInfo.direction);

        // Check direction visibility
        const isDirectionVisible = wall === currentViewInfo.direction || wall === 'center' || isCornerVisible;
        if (!isDirectionVisible) return false;

        // Check if element is hidden in this specific view
        if (currentViewInfo.hiddenElements.includes(el.id)) return false;

        return true;
      });

      // Sort elements by layer height first (wall units over base units), then by zIndex for hover
      elementsToCheck.sort((a, b) => {
        // Get layer metadata for height-based sorting
        const metaA = getComponentMetadata(a.component_id || a.id);
        const metaB = getComponentMetadata(b.component_id || b.id);

        // Priority 1: Sort by max_height (higher components should be hovered first when overlapping)
        const heightA = metaA?.max_height_cm ?? 0;
        const heightB = metaB?.max_height_cm ?? 0;

        if (heightB !== heightA) {
          return heightB - heightA;  // Higher height first (wall units before base units)
        }

        // Priority 2: If same height, sort by zIndex
        return (b.zIndex || 0) - (a.zIndex || 0);
      });
      
      const hoveredEl = elementsToCheck.find(element => {
        // Use the new rotation-aware boundary detection
        const viewMode = active2DView === 'plan' ? 'plan' : 'elevation';
        return isPointInRotatedComponent(roomPos.x, roomPos.y, element, viewMode);
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
        // Store original position for collision detection fallback
        setDraggedElementOriginalPos({
          x: dragThreshold.startElement.x,
          y: dragThreshold.startElement.y
        });
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
  }, [isDragging, activeTool, dragStart, draggedElement, canvasToRoom, design.elements, active2DView, render, throttledSnapUpdate, snapGuides, onTapeMeasureMouseMove, getComponentMetadata]);

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
        Logger.debug(`🎯 [Drag Snap] Element moved to ${dragWallSnappedPos.corner || 'wall'} at (${finalClampedX}, ${finalClampedY})`);
      } else {
        // Standard boundary clamping if not snapped to wall
        finalClampedX = Math.max(0, Math.min(finalX, innerRoomBounds.width - clampWidth));
        finalClampedY = Math.max(0, Math.min(finalY, innerRoomBounds.height - clampDepth));
      }

      // **COLLISION DETECTION** - Validate placement on drop
      const proposedElement: DesignElement = {
        ...draggedElement,
        x: dragWallSnappedPos.snappedToWall ? finalClampedX : snapToGrid(finalClampedX),
        y: dragWallSnappedPos.snappedToWall ? finalClampedY : snapToGrid(finalClampedY),
        rotation: snapped.rotation
      };

      const validationResult = validatePlacement(
        proposedElement,
        design.elements.filter(el => el.id !== draggedElement.id),
        draggedElementOriginalPos || undefined
      );

      if (validationResult.isValid) {
        // ✅ Valid placement - update position
        onUpdateElement(draggedElement.id, {
          x: proposedElement.x,
          y: proposedElement.y,
          rotation: proposedElement.rotation
        });
      } else if (validationResult.suggestedPosition) {
        // ⚠️ Invalid placement - snap to suggested valid position
        onUpdateElement(draggedElement.id, {
          x: validationResult.suggestedPosition.x,
          y: validationResult.suggestedPosition.y,
          rotation: proposedElement.rotation
        });
        toast({
          title: "Position Adjusted",
          description: validationResult.reason || "Position adjusted to avoid collision",
          variant: "default",
        });
        Logger.debug(`🔄 [Collision] Adjusted position: ${validationResult.reason}`);
      } else {
        // ❌ No valid position found - return to original position
        const fallbackPos = draggedElementOriginalPos || { x: draggedElement.x, y: draggedElement.y };
        onUpdateElement(draggedElement.id, {
          x: fallbackPos.x,
          y: fallbackPos.y,
          rotation: draggedElement.rotation  // Keep original rotation
        });
        toast({
          title: "Invalid Placement",
          description: validationResult.reason || "Cannot place component here",
          variant: "destructive",
        });
        Logger.warn(`❌ [Collision] Returned to original: ${validationResult.reason}`);
      }
    }

    // Handle tape measure clicks
    if (activeTool === 'tape-measure' && onTapeMeasureClick && !isDragging) {
      // Only handle clicks, not drags
      onTapeMeasureClick(currentMousePos.x, currentMousePos.y);
    }

    // Clear drag state
    setIsDragging(false);
    setDraggedElement(null);
    setDraggedElementOriginalPos(null);  // Clear original position
    setSnapGuides({ vertical: [], horizontal: [], snapPoint: null });
    setDragThreshold({ exceeded: false, startElement: null }); // 🎯 Clear drag threshold
  }, [isDragging, draggedElement, draggedElementOriginalPos, canvasToRoom, currentMousePos, getSnapPosition, snapToGrid, onUpdateElement, roomDimensions, activeTool, onTapeMeasureClick, validatePlacement, toast, design.elements]);


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
        let elementsToCheck = design.elements.filter(el => {
          // For plan view: only check per-view hidden_elements
          if (active2DView === 'plan') {
            return !currentViewInfo.hiddenElements.includes(el.id);
          }

          // For elevation views: check both direction AND hidden_elements
          const wall = getElementWall(el);
          const isCornerVisible = isCornerVisibleInView(el, currentViewInfo.direction);

          // Check direction visibility
          const isDirectionVisible = wall === currentViewInfo.direction || wall === 'center' || isCornerVisible;
          if (!isDirectionVisible) return false;

          // Check if element is hidden in this specific view
          if (currentViewInfo.hiddenElements.includes(el.id)) return false;

          return true;
        });

        // Sort elements by zIndex in DESCENDING order (highest zIndex first) for hover
        elementsToCheck.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
        
        const hoveredEl = elementsToCheck.find(element => {
          const viewMode = active2DView === 'plan' ? 'plan' : 'elevation';
          return isPointInRotatedComponent(roomPos.x, roomPos.y, element, viewMode);
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
          
          Logger.debug(`🎯 [Touch Drag Snap] Element moved to ${dragWallSnappedPos.corner || 'wall'} at (${finalClampedX}, ${finalClampedY})`);
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
      const viewMode = active2DView === 'plan' ? 'plan' : 'elevation';
      const longPressedElement = design.elements.find(element => {
        return isPointInRotatedComponent(roomPos.x, roomPos.y, element, viewMode);
      });

      if (longPressedElement) {
        onSelectElement(longPressedElement);
        // Could trigger a context menu here in the future
        Logger.debug(`🔗 [Long Press] Selected element: ${longPressedElement.type} at (${longPressedElement.x}, ${longPressedElement.y})`);
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
        Logger.warn('⚠️ Drop cancelled: No component data (quick drag release)');
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
      const dropBoundaryTolerance = ConfigurationService.getSync('drop_boundary_tolerance', 50); // 50cm tolerance (fallback)
      if (dropX < -dropBoundaryTolerance || dropY < -dropBoundaryTolerance || dropX > innerRoomBounds.width + dropBoundaryTolerance || dropY > innerRoomBounds.height + dropBoundaryTolerance) {
        Logger.warn('⚠️ Drop cancelled: Component dropped outside inner room boundaries');
        return;
      }

      // Use actual component dimensions for ALL components (no more forced 90x90)
      const isCornerComponent = componentData.id?.includes('corner-') || 
                               componentData.id?.includes('-corner') ||
                               componentData.id?.includes('corner');
      
      const effectiveWidth = componentData.width;
      const effectiveDepth = componentData.depth;

      // Set default Z position based on component type (from database configuration)
      const zPositionDefaults = ConfigurationService.getJSONSync('z_position_defaults', {
        floor_unit: 0,
        base_unit: 10,
        wall_unit: 150,
        tall_unit: 0,
        appliance: 0,
        sink: 92,
        worktop: 92
      });

      // Get Y-offset config for elevation-specific components
      let defaultZ = 0; // Default for floor-mounted components
      if (componentData.type === 'cornice') {
        defaultZ = ConfigurationService.getSync('cornice_y_offset', 210); // Top of wall units (updated from 200 to 210 to match tall units)
      } else if (componentData.type === 'pelmet') {
        defaultZ = ConfigurationService.getSync('pelmet_y_offset', 140); // Bottom of wall units
      } else if (componentData.type === 'counter-top') {
        defaultZ = ConfigurationService.getSync('countertop_y_offset', 86); // Counter top height (updated from 90 to 86)
      } else if (componentData.type === 'wall-cabinet' || componentData.id?.includes('wall-cabinet')) {
        defaultZ = ConfigurationService.getSync('wall_cabinet_y_offset', 140); // Wall cabinet height
      } else if (componentData.type === 'wall-unit-end-panel') {
        defaultZ = ConfigurationService.getSync('cornice_y_offset', 210); // Top of wall units (updated from 200 to 210)
      } else if (componentData.type === 'window') {
        defaultZ = ConfigurationService.getSync('countertop_y_offset', 86); // Window sill height (updated from 90 to 86)
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
        Logger.debug(`🎯 [Enhanced Placement] Component snapped to ${placementResult.corner || 'wall'} at (${placementResult.x}, ${placementResult.y}) with rotation ${placementResult.rotation}°`);
      }
      
      // Validate placement
      if (!placementResult.withinBounds) {
        Logger.warn('⚠️ [Enhanced Placement] Component placement outside room bounds, adjusting...');
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
      };

      // ✅ Enhanced placement already handled snapping - no need for duplicate getSnapPosition() call
      // This was causing components to snap twice with potentially conflicting results

      onAddElement(newElement);
    } catch (error) {
      // Enhanced error handling for different drop failure scenarios
      if (error instanceof Error) {
        if (error.message.includes('JSON')) {
          Logger.warn('⚠️ Drop cancelled: Invalid component data (quick drag/release)');
        } else if (error.message.includes('boundary')) {
          Logger.warn('⚠️ Drop cancelled: Component dropped outside room boundaries');
        } else {
          Logger.warn('⚠️ Drop failed:', error.message);
        }
      } else {
        Logger.warn('⚠️ Drop cancelled: Unknown reason (likely quick drag/release)');
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
    if (currentViewInfo.direction === 'plan') {
      // Plan view - 150% zoom, centered
      setZoom(1.5); // 150% zoom
      setPanOffset({ x: 0, y: 0 });
    } else if (currentViewInfo.direction === 'front' || currentViewInfo.direction === 'back') {
      // Front/Back views - 170% zoom, top-center aligned
      setZoom(1.7); // 170% zoom
      // Top-center alignment: move view up slightly
      setPanOffset({ x: 0, y: -50 });
    } else if (currentViewInfo.direction === 'left' || currentViewInfo.direction === 'right') {
      // Left/Right views - 170% zoom, centered (same as front/back)
      setZoom(1.7); // 170% zoom
      setPanOffset({ x: 0, y: 0 });
    }
  }, [active2DView, roomDimensions, getWallHeight, currentViewInfo.direction]);

  // Fit to screen - different logic for elevation views
  useEffect(() => {
    if (fitToScreenSignal > 0) {
      if (currentViewInfo.direction === 'plan') {
        // Plan view - 150% zoom, centered
        setZoom(1.5); // 150% zoom
        setPanOffset({ x: 0, y: 0 });
      } else if (currentViewInfo.direction === 'front' || currentViewInfo.direction === 'back') {
        // Front/Back views - 170% zoom, top-center aligned
        setZoom(1.7); // 170% zoom
        setPanOffset({ x: 0, y: -50 });
      } else if (currentViewInfo.direction === 'left' || currentViewInfo.direction === 'right') {
        // Left/Right views - 170% zoom, centered (same as front/back)
        setZoom(1.7); // 170% zoom
        setPanOffset({ x: 0, y: 0 });
      }
    }
  }, [fitToScreenSignal, roomDimensions, getWallHeight, currentViewInfo.direction]);

  // Wait for component metadata to load before rendering (prevents height flash bug)
  if (metadataLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading component data...</div>
      </div>
    );
  }

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

