/**
 * Interaction Handler Module
 *
 * Handles all user interactions (mouse, touch, drag, drop, selection)
 * Extracted from DesignCanvas2D.tsx as part of Story 1.15.2 refactor
 *
 * Story: 1.15.2 - Extract Event Handlers to InteractionHandler Module
 * Date: 2025-10-27
 */

import type { DesignElement, Design, ElevationViewConfig } from '@/types/project';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './CanvasSharedUtilities';
import { Logger } from '@/utils/Logger';
import { ConfigurationService } from '@/services/ConfigurationService';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Interaction state - all state values needed by event handlers
 */
export interface InteractionState {
  // Canvas state
  canvasRef: React.RefObject<HTMLCanvasElement>;

  // View state
  active2DView: string;
  currentViewInfo: ElevationViewConfig;
  zoom: number;
  panOffset: { x: number; y: number };

  // Design state
  design: Design;

  // Selection state
  selectedElement: DesignElement | null;
  hoveredElement: DesignElement | null;

  // Interaction state
  isDragging: boolean;
  draggedElement: DesignElement | null;
  draggedElementOriginalPos: { x: number; y: number } | null;
  dragStart: { x: number; y: number } | null;
  dragThreshold: { exceeded: boolean; startElement: DesignElement | null };
  currentMousePos: { x: number; y: number };
  activeTool: string;

  // Tape measure state
  currentMeasureStart: { x: number; y: number } | null;
  tapeMeasurePreview: { x: number; y: number } | null;
  completedMeasurements: Array<{ start: { x: number; y: number }, end: { x: number; y: number } }>;

  // Configuration
  configCache: {
    drag_threshold_mouse?: number;
  };
}

/**
 * Interaction callbacks - state setters and update functions
 */
export interface InteractionCallbacks {
  setSelectedElement: (element: DesignElement | null) => void;
  setHoveredElement: (element: DesignElement | null) => void;
  setIsDragging: (dragging: boolean) => void;
  setDraggedElement: (element: DesignElement | null) => void;
  setDraggedElementOriginalPos: (pos: { x: number; y: number } | null) => void;
  setDragStart: (pos: { x: number; y: number } | null) => void;
  setDragThreshold: (threshold: { exceeded: boolean; startElement: DesignElement | null }) => void;
  setCurrentMousePos: (pos: { x: number; y: number }) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setCurrentMeasureStart: (pos: { x: number; y: number } | null) => void;
  setTapeMeasurePreview: (pos: { x: number; y: number } | null) => void;
  setCompletedMeasurements: (measurements: Array<{ start: { x: number; y: number }, end: { x: number; y: number } }>) => void;
  setSnapGuides: (guides: { vertical: number[]; horizontal: number[]; snapPoint: { x: number; y: number } | null }) => void;
  updateCurrentRoomDesign: (updateFn: (design: Design) => Design) => void;
  onUpdateElement: (elementId: string, updates: Partial<DesignElement>) => void;
  onAddElement: (element: DesignElement) => void;
  showToast: (options: { title: string; description: string; variant: 'default' | 'destructive' }) => void;
  requestRender: () => void;
}

/**
 * Placement result from collision detection
 */
export interface PlacementResult {
  isValid: boolean;
  reason?: string;
  suggestedPosition?: { x: number; y: number };
}

/**
 * Enhanced placement position with wall snapping info
 */
export interface EnhancedPlacement {
  x: number;
  y: number;
  rotation: number;
  snappedToWall: boolean;
  withinBounds: boolean;
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
}

/**
 * Snap position result with guides
 */
export interface SnapResult {
  x: number;
  y: number;
  rotation: number;
  guides: {
    vertical: number[];
    horizontal: number[];
  };
}

/**
 * Interaction utilities - helper functions and coordinate transforms
 */
export interface InteractionUtilities {
  canvasToRoom: (x: number, y: number) => { x: number; y: number };
  roomToCanvas: (x: number, y: number) => { x: number; y: number };
  getElementWall: (element: DesignElement) => string;
  isCornerVisibleInView: (element: DesignElement, direction: string) => boolean;
  getComponentMetadata: (componentId: string) => any;
  getSnapPosition: (element: DesignElement, x: number, y: number) => SnapResult;
  snapToGrid: (value: number) => number;
  getEnhancedComponentPlacement: (
    x: number,
    y: number,
    width: number,
    depth: number,
    componentId: string,
    componentType: string,
    roomDimensions: { width: number; height: number }
  ) => EnhancedPlacement;
  validatePlacement: (
    element: DesignElement,
    otherElements: DesignElement[],
    originalPosition?: { x: number; y: number }
  ) => PlacementResult;
  getInnerRoomBounds: () => { width: number; height: number };
}

// =============================================================================
// MOUSE EVENT HANDLERS
// =============================================================================

/**
 * Handle mouse down events
 */
export function handleMouseDown(
  event: React.MouseEvent<HTMLCanvasElement>,
  state: InteractionState,
  callbacks: InteractionCallbacks,
  utils: InteractionUtilities
): void {
  const canvas = state.canvasRef.current;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  // Account for CSS scaling of canvas element
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;

  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  // Right-click for panning (regardless of active tool)
  if (event.button === 2) { // Right mouse button
    event.preventDefault(); // Prevent context menu
    callbacks.setIsDragging(true);
    callbacks.setDragStart({ x, y });
    return;
  }

  // Left-click pan tool (legacy support)
  if (state.activeTool === 'pan' && event.button === 0) {
    callbacks.setIsDragging(true);
    callbacks.setDragStart({ x, y });
    return;
  }

  // Handle tape measure tool
  if (state.activeTool === 'tape-measure') {
    // Just set up for click handling in mouse up
    callbacks.setDragStart({ x, y });
    return;
  }

  // Check for element clicks - use same filtering and ordering as rendering
  const roomPos = utils.canvasToRoom(x, y);

  // Filter and sort elements the same way as rendering (but in reverse order for selection)
  let elementsToCheck = state.design.elements.filter(el => {
    // For plan view: only check per-view hidden_elements
    if (state.active2DView === 'plan') {
      return !state.currentViewInfo.hiddenElements.includes(el.id);
    }

    // For elevation views: check both direction AND hidden_elements
    const wall = utils.getElementWall(el);
    const isCornerVisible = utils.isCornerVisibleInView(el, state.currentViewInfo.direction);

    // Check direction visibility
    const isDirectionVisible = wall === state.currentViewInfo.direction || wall === 'center' || isCornerVisible;
    if (!isDirectionVisible) return false;

    // Check if element is hidden in this specific view
    if (state.currentViewInfo.hiddenElements.includes(el.id)) return false;

    return true;
  });

  // Sort elements by layer height first (wall units over base units), then by zIndex
  elementsToCheck.sort((a, b) => {
    // Get layer metadata for height-based sorting
    const metaA = utils.getComponentMetadata(a.component_id || a.id);
    const metaB = utils.getComponentMetadata(b.component_id || b.id);

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
    if (state.active2DView === 'plan') {
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
      const height = element.height || 86; // Use actual height for vertical dimension
      const z = element.z || 0;

      // In elevation view, Z represents the mount height (bottom of element above floor)
      // The element extends from z (bottom) to z + height (top)
      const centerX = element.x + width / 2;
      const bottomZ = z; // Bottom of element above floor
      const topZ = z + height; // Top of element above floor

      // Check if click is within bounds (no rotation in elevation view)
      const isInHorizontalBounds = Math.abs(roomPos.x - centerX) <= width / 2;
      const isInVerticalBounds = roomPos.y >= bottomZ && roomPos.y <= topZ;

      return isInHorizontalBounds && isInVerticalBounds;
    }
  });

  if (clickedElement) {
    callbacks.setSelectedElement(clickedElement);
    if (state.activeTool === 'select') {
      // Don't start dragging immediately - just prepare for potential drag
      callbacks.setDragStart({ x, y });
      callbacks.setDragThreshold({ exceeded: false, startElement: clickedElement });
    }
  } else {
    callbacks.setSelectedElement(null);
  }
}

/**
 * Handle mouse move events
 */
export function handleMouseMove(
  event: React.MouseEvent<HTMLCanvasElement>,
  state: InteractionState,
  callbacks: InteractionCallbacks,
  utils: InteractionUtilities
): void {
  const canvas = state.canvasRef.current;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  // Account for CSS scaling of canvas element
  // The canvas internal size is CANVAS_WIDTH × CANVAS_HEIGHT but CSS may scale it
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;

  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  // Always track current mouse position for drag operations
  callbacks.setCurrentMousePos({ x, y });

  // Handle hover detection
  if (!state.isDragging && state.active2DView === 'plan') {
    const roomPos = utils.canvasToRoom(x, y);

    // Use same filtering and ordering as selection for hover detection
    let elementsToCheck = state.design.elements.filter(el => {
      // For plan view: only check per-view hidden_elements
      if (state.active2DView === 'plan') {
        return !state.currentViewInfo.hiddenElements.includes(el.id);
      }

      // For elevation views: check both direction AND hidden_elements
      const wall = utils.getElementWall(el);
      const isCornerVisible = utils.isCornerVisibleInView(el, state.currentViewInfo.direction);

      // Check direction visibility
      const isDirectionVisible = wall === state.currentViewInfo.direction || wall === 'center' || isCornerVisible;
      if (!isDirectionVisible) return false;

      // Check if element is hidden in this specific view
      if (state.currentViewInfo.hiddenElements.includes(el.id)) return false;

      return true;
    });

    // Sort elements by layer height first (wall units over base units), then by zIndex for hover
    elementsToCheck.sort((a, b) => {
      // Get layer metadata for height-based sorting
      const metaA = utils.getComponentMetadata(a.component_id || a.id);
      const metaB = utils.getComponentMetadata(b.component_id || b.id);

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
      // Different hit detection for plan vs elevation views
      if (state.active2DView === 'plan') {
        // Plan view: use X/Y coordinates with rotation
        const width = element.width;
        const height = element.depth || element.height;
        const rotation = (element.rotation || 0) * Math.PI / 180;

        // Transform hover point into component's local space
        const centerX = element.x + width / 2;
        const centerY = element.y + height / 2;

        // Translate point to component center
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
        const height = element.height || 86;
        const z = element.z || 0;

        const centerX = element.x + width / 2;
        const bottomZ = z;
        const topZ = z + height;

        const isInHorizontalBounds = Math.abs(roomPos.x - centerX) <= width / 2;
        const isInVerticalBounds = roomPos.y >= bottomZ && roomPos.y <= topZ;

        return isInHorizontalBounds && isInVerticalBounds;
      }
    });
    callbacks.setHoveredElement(hoveredEl || null);
  }

  // Handle tape measure preview
  if (state.activeTool === 'tape-measure' && state.tapeMeasurePreview !== null) {
    callbacks.setTapeMeasurePreview({ x, y });
  }

  // Check drag threshold before starting drag
  if (!state.isDragging && state.dragThreshold.startElement && state.activeTool === 'select' && state.dragStart) {
    const deltaX = x - state.dragStart.x;
    const deltaY = y - state.dragStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const DRAG_THRESHOLD = state.configCache.drag_threshold_mouse || 5; // Database-driven drag threshold

    if (distance >= DRAG_THRESHOLD && !state.dragThreshold.exceeded) {
      // Start dragging now that threshold is exceeded
      callbacks.setIsDragging(true);
      callbacks.setDraggedElement(state.dragThreshold.startElement);
      // Store original position for collision detection fallback
      callbacks.setDraggedElementOriginalPos({
        x: state.dragThreshold.startElement.x,
        y: state.dragThreshold.startElement.y
      });
      callbacks.setDragThreshold({ exceeded: true, startElement: state.dragThreshold.startElement });
    }
  }

  if (!state.isDragging) return;

  // Handle panning (both right-click and pan tool)
  if (state.activeTool === 'pan' || (state.isDragging && !state.draggedElement)) {
    if (!state.dragStart) return;
    const deltaX = x - state.dragStart.x;
    const deltaY = y - state.dragStart.y;
    callbacks.setPanOffset({
      x: state.panOffset.x + deltaX,
      y: state.panOffset.y + deltaY
    });
    callbacks.setDragStart({ x, y });
  } else if (state.draggedElement && state.activeTool === 'select') {
    // Update snap guides with current position
    const roomPos = utils.canvasToRoom(x, y);
    const snapResult = utils.getSnapPosition(state.draggedElement, roomPos.x, roomPos.y);
    callbacks.setSnapGuides({
      vertical: snapResult.guides.vertical,
      horizontal: snapResult.guides.horizontal,
      snapPoint: { x: snapResult.x, y: snapResult.y }
    });

    // Trigger re-render to show drag preview
    callbacks.requestRender();
  }
}

/**
 * Handle mouse up events
 */
export function handleMouseUp(
  state: InteractionState,
  callbacks: InteractionCallbacks,
  utils: InteractionUtilities
): void {
  if (state.isDragging && state.draggedElement) {
    // Use current mouse position for final placement
    const roomPos = utils.canvasToRoom(state.currentMousePos.x, state.currentMousePos.y);

    // Smart snap with walls and components
    const snapped = utils.getSnapPosition(state.draggedElement, roomPos.x, roomPos.y);

    // Apply light grid snapping only if not snapped to walls/components
    let finalX = snapped.x;
    let finalY = snapped.y;

    const isWallSnapped = snapped.guides.vertical.length > 0 || snapped.guides.horizontal.length > 0;
    if (!isWallSnapped) {
      finalX = utils.snapToGrid(snapped.x);
      finalY = utils.snapToGrid(snapped.y);
    }

    // Update element with final position - use effective footprint for plan view
    let clampWidth = state.draggedElement.width;
    let clampDepth = state.draggedElement.depth;

    // Check if this is a corner component
    const isCornerCounterTop = state.draggedElement.type === 'counter-top' && state.draggedElement.id.includes('counter-top-corner');
    const isCornerWallCabinet = state.draggedElement.type === 'cabinet' && state.draggedElement.id.includes('corner-wall-cabinet');
    const isCornerBaseCabinet = state.draggedElement.type === 'cabinet' && state.draggedElement.id.includes('corner-base-cabinet');
    const isCornerTallUnit = state.draggedElement.type === 'cabinet' && (
      state.draggedElement.id.includes('corner-tall') ||
      state.draggedElement.id.includes('corner-larder') ||
      state.draggedElement.id.includes('larder-corner')
    );

    if (isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit) {
      // Use actual square dimensions for corner components
      const squareSize = Math.min(state.draggedElement.width, state.draggedElement.depth);
      clampWidth = squareSize;
      clampDepth = squareSize;
    }

    // Apply Smart Wall Snapping for dragged elements
    const isCornerComponent = isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit;

    const dragWallSnappedPos = utils.getEnhancedComponentPlacement(
      finalX,
      finalY,
      state.draggedElement.width,
      state.draggedElement.depth || state.draggedElement.height,
      state.draggedElement.id,
      state.draggedElement.type || 'cabinet',
      state.design.roomDimensions
    );

    // Use wall snapped position if snapped, otherwise clamp to boundaries
    let finalClampedX, finalClampedY;
    const innerRoomBounds = utils.getInnerRoomBounds();

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
      ...state.draggedElement,
      x: dragWallSnappedPos.snappedToWall ? finalClampedX : utils.snapToGrid(finalClampedX),
      y: dragWallSnappedPos.snappedToWall ? finalClampedY : utils.snapToGrid(finalClampedY),
      rotation: snapped.rotation
    };

    const validationResult = utils.validatePlacement(
      proposedElement,
      state.design.elements.filter(el => el.id !== state.draggedElement!.id),
      state.draggedElementOriginalPos || undefined
    );

    if (validationResult.isValid) {
      // ✅ Valid placement - update position
      callbacks.onUpdateElement(state.draggedElement.id, {
        x: proposedElement.x,
        y: proposedElement.y,
        rotation: proposedElement.rotation
      });
    } else if (validationResult.suggestedPosition) {
      // ⚠️ Invalid placement - snap to suggested valid position
      callbacks.onUpdateElement(state.draggedElement.id, {
        x: validationResult.suggestedPosition.x,
        y: validationResult.suggestedPosition.y,
        rotation: proposedElement.rotation
      });
      callbacks.showToast({
        title: "Position Adjusted",
        description: validationResult.reason || "Position adjusted to avoid collision",
        variant: "default",
      });
      Logger.debug(`🔄 [Collision] Adjusted position: ${validationResult.reason}`);
    } else {
      // ❌ No valid position found - return to original position
      const fallbackPos = state.draggedElementOriginalPos || { x: state.draggedElement.x, y: state.draggedElement.y };
      callbacks.onUpdateElement(state.draggedElement.id, {
        x: fallbackPos.x,
        y: fallbackPos.y,
        rotation: state.draggedElement.rotation  // Keep original rotation
      });
      callbacks.showToast({
        title: "Invalid Placement",
        description: validationResult.reason || "Cannot place component here",
        variant: "destructive",
      });
      Logger.warn(`❌ [Collision] Returned to original: ${validationResult.reason}`);
    }
  }

  // Handle tape measure clicks
  if (state.activeTool === 'tape-measure' && !state.isDragging && state.currentMeasureStart !== null) {
    // Add measurement to completed list (click on existing measurement start)
    callbacks.setCompletedMeasurements([
      ...state.completedMeasurements,
      { start: state.currentMeasureStart, end: state.currentMousePos }
    ]);
    callbacks.setCurrentMeasureStart(null);
    callbacks.setTapeMeasurePreview(null);
  } else if (state.activeTool === 'tape-measure' && !state.isDragging) {
    // Start new measurement (first click)
    callbacks.setCurrentMeasureStart(state.currentMousePos);
  }

  // Clear drag state
  callbacks.setIsDragging(false);
  callbacks.setDraggedElement(null);
  callbacks.setDraggedElementOriginalPos(null);
  callbacks.setSnapGuides({ vertical: [], horizontal: [], snapPoint: null });
  callbacks.setDragThreshold({ exceeded: false, startElement: null });
  callbacks.setDragStart(null);
}

/**
 * Handle context menu (right-click)
 */
export function handleContextMenu(
  event: React.MouseEvent<HTMLCanvasElement>
): void {
  event.preventDefault();
}

// =============================================================================
// TOUCH EVENT HANDLERS
// =============================================================================

/**
 * Touch point type (from useTouchEvents hook)
 */
export interface TouchPoint {
  x: number;
  y: number;
}

/**
 * Handle touch start events
 */
export function handleTouchStart(
  point: TouchPoint,
  event: TouchEvent,
  state: InteractionState,
  callbacks: InteractionCallbacks,
  utils: InteractionUtilities
): void {
  const canvas = state.canvasRef.current;
  if (!canvas) return;

  // Convert touch coordinates to canvas coordinates
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;

  const x = point.x * scaleX;
  const y = point.y * scaleY;

  if (state.activeTool === 'pan') {
    callbacks.setIsDragging(true);
    callbacks.setDragStart({ x, y });
    return;
  }

  // Handle tape measure tool
  if (state.activeTool === 'tape-measure') {
    callbacks.setDragStart({ x, y });
    return;
  }

  // Check for element touches
  const roomPos = utils.canvasToRoom(x, y);
  const touchedElement = state.design.elements.find(element => {
    // Special handling for corner counter tops - use square bounding box
    const isCornerCounterTop = element.type === 'counter-top' && element.id.includes('counter-top-corner');

    if (isCornerCounterTop) {
      // Use actual square dimensions for corner counter tops
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
    callbacks.setSelectedElement(touchedElement);
    if (state.activeTool === 'select') {
      callbacks.setDragStart({ x, y });
      callbacks.setDragThreshold({ exceeded: false, startElement: touchedElement });
    }
  } else {
    callbacks.setSelectedElement(null);
  }
}

/**
 * Handle touch move events
 */
export function handleTouchMove(
  point: TouchPoint,
  event: TouchEvent,
  state: InteractionState,
  callbacks: InteractionCallbacks,
  utils: InteractionUtilities
): void {
  const canvas = state.canvasRef.current;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;

  const x = point.x * scaleX;
  const y = point.y * scaleY;

  // Always track current touch position for drag operations
  callbacks.setCurrentMousePos({ x, y });

  // Handle hover detection (for touch devices, only when not dragging)
  if (!state.isDragging && state.active2DView === 'plan') {
    const roomPos = utils.canvasToRoom(x, y);

    // Use same filtering and ordering as selection for hover detection
    let elementsToCheck = state.design.elements.filter(el => {
      // For plan view: only check per-view hidden_elements
      if (state.active2DView === 'plan') {
        return !state.currentViewInfo.hiddenElements.includes(el.id);
      }

      // For elevation views: check both direction AND hidden_elements
      const wall = utils.getElementWall(el);
      const isCornerVisible = utils.isCornerVisibleInView(el, state.currentViewInfo.direction);

      // Check direction visibility
      const isDirectionVisible = wall === state.currentViewInfo.direction || wall === 'center' || isCornerVisible;
      if (!isDirectionVisible) return false;

      // Check if element is hidden in this specific view
      if (state.currentViewInfo.hiddenElements.includes(el.id)) return false;

      return true;
    });

    // Sort elements by zIndex in DESCENDING order (highest zIndex first) for hover
    elementsToCheck.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

    const hoveredEl = elementsToCheck.find(element => {
      // Different hit detection for plan vs elevation views
      if (state.active2DView === 'plan') {
        // Plan view: rotation-aware hit detection
        const width = element.width;
        const height = element.depth || element.height;
        const rotation = (element.rotation || 0) * Math.PI / 180;

        const centerX = element.x + width / 2;
        const centerY = element.y + height / 2;

        const dx = roomPos.x - centerX;
        const dy = roomPos.y - centerY;

        const cos = Math.cos(-rotation);
        const sin = Math.sin(-rotation);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        return Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2;
      } else {
        // Elevation view: X/Z coordinates
        const width = element.width;
        const height = element.height || 86;
        const z = element.z || 0;

        const centerX = element.x + width / 2;
        const bottomZ = z;
        const topZ = z + height;

        const isInHorizontalBounds = Math.abs(roomPos.x - centerX) <= width / 2;
        const isInVerticalBounds = roomPos.y >= bottomZ && roomPos.y <= topZ;

        return isInHorizontalBounds && isInVerticalBounds;
      }
    });
    callbacks.setHoveredElement(hoveredEl || null);
  }

  // Handle tape measure preview
  if (state.activeTool === 'tape-measure' && state.tapeMeasurePreview !== null) {
    callbacks.setTapeMeasurePreview({ x, y });
  }

  // Check drag threshold before starting drag (touch uses larger threshold)
  if (!state.isDragging && state.dragThreshold.startElement && state.activeTool === 'select' && state.dragStart) {
    const deltaX = x - state.dragStart.x;
    const deltaY = y - state.dragStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const DRAG_THRESHOLD = state.configCache.drag_threshold_mouse || 10; // Touch threshold is larger

    if (distance >= DRAG_THRESHOLD && !state.dragThreshold.exceeded) {
      // Start dragging now that threshold is exceeded
      callbacks.setIsDragging(true);
      callbacks.setDraggedElement(state.dragThreshold.startElement);
      callbacks.setDraggedElementOriginalPos({
        x: state.dragThreshold.startElement.x,
        y: state.dragThreshold.startElement.y
      });
      callbacks.setDragThreshold({ exceeded: true, startElement: state.dragThreshold.startElement });
    }
  }

  if (!state.isDragging) return;

  if (state.activeTool === 'pan') {
    if (!state.dragStart) return;
    const deltaX = x - state.dragStart.x;
    const deltaY = y - state.dragStart.y;
    callbacks.setPanOffset({
      x: state.panOffset.x + deltaX,
      y: state.panOffset.y + deltaY
    });
    callbacks.setDragStart({ x, y });
  } else if (state.draggedElement && state.activeTool === 'select') {
    // Update snap guides with current position
    const roomPos = utils.canvasToRoom(x, y);
    const snapResult = utils.getSnapPosition(state.draggedElement, roomPos.x, roomPos.y);
    callbacks.setSnapGuides({
      vertical: snapResult.guides.vertical,
      horizontal: snapResult.guides.horizontal,
      snapPoint: { x: snapResult.x, y: snapResult.y }
    });

    // Trigger re-render to show drag preview
    callbacks.requestRender();
  }
}

/**
 * Handle touch end events
 * Note: Simplified version without collision detection for faster touch interactions
 */
export function handleTouchEnd(
  point: TouchPoint,
  event: TouchEvent,
  state: InteractionState,
  callbacks: InteractionCallbacks,
  utils: InteractionUtilities
): void {
  if (state.isDragging && state.draggedElement) {
    const roomPos = utils.canvasToRoom(state.currentMousePos.x, state.currentMousePos.y);

    // Smart snap with walls and components
    const snapped = utils.getSnapPosition(state.draggedElement, roomPos.x, roomPos.y);

    // Apply light grid snapping only if not snapped to walls/components
    let finalX = snapped.x;
    let finalY = snapped.y;

    const isWallSnapped = snapped.guides.vertical.length > 0 || snapped.guides.horizontal.length > 0;
    if (!isWallSnapped) {
      finalX = utils.snapToGrid(snapped.x);
      finalY = utils.snapToGrid(snapped.y);
    }

    // Update element with final position
    let clampWidth = state.draggedElement.width;
    let clampDepth = state.draggedElement.depth;

    // Handle corner components
    const isCornerCounterTop = state.draggedElement.type === 'counter-top' && state.draggedElement.id.includes('counter-top-corner');
    const isCornerWallCabinet = state.draggedElement.type === 'cabinet' && state.draggedElement.id.includes('corner-wall-cabinet');
    const isCornerBaseCabinet = state.draggedElement.type === 'cabinet' && state.draggedElement.id.includes('corner-base-cabinet');
    const isCornerTallUnit = state.draggedElement.type === 'cabinet' && (
      state.draggedElement.id.includes('corner-tall') ||
      state.draggedElement.id.includes('corner-larder') ||
      state.draggedElement.id.includes('larder-corner')
    );

    if (isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit) {
      // Use actual square dimensions for corner components
      const squareSize = Math.min(state.draggedElement.width, state.draggedElement.depth);
      clampWidth = squareSize;
      clampDepth = squareSize;
    }

    // Apply Smart Wall Snapping for dragged elements
    const dragWallSnappedPos = utils.getEnhancedComponentPlacement(
      finalX,
      finalY,
      state.draggedElement.width,
      state.draggedElement.depth || state.draggedElement.height,
      state.draggedElement.id,
      state.draggedElement.type || 'cabinet',
      state.design.roomDimensions
    );

    // Use wall snapped position if snapped, otherwise clamp to boundaries
    let finalClampedX, finalClampedY;
    const innerRoomBounds = utils.getInnerRoomBounds();

    if (dragWallSnappedPos.snappedToWall) {
      finalClampedX = dragWallSnappedPos.x;
      finalClampedY = dragWallSnappedPos.y;

      Logger.debug(`🎯 [Touch Drag Snap] Element moved to ${dragWallSnappedPos.corner || 'wall'} at (${finalClampedX}, ${finalClampedY})`);
    } else {
      // Standard boundary clamping if not snapped to wall
      finalClampedX = Math.max(0, Math.min(finalX, innerRoomBounds.width - clampWidth));
      finalClampedY = Math.max(0, Math.min(finalY, innerRoomBounds.height - clampDepth));
    }

    // Update element (simplified - no collision detection for faster touch interactions)
    callbacks.onUpdateElement(state.draggedElement.id, {
      x: dragWallSnappedPos.snappedToWall ? finalClampedX : utils.snapToGrid(finalClampedX),
      y: dragWallSnappedPos.snappedToWall ? finalClampedY : utils.snapToGrid(finalClampedY),
      rotation: snapped.rotation
    });
  }

  // Handle tape measure clicks
  if (state.activeTool === 'tape-measure' && !state.isDragging && state.currentMeasureStart !== null) {
    // Add measurement to completed list
    callbacks.setCompletedMeasurements([
      ...state.completedMeasurements,
      { start: state.currentMeasureStart, end: state.currentMousePos }
    ]);
    callbacks.setCurrentMeasureStart(null);
    callbacks.setTapeMeasurePreview(null);
  } else if (state.activeTool === 'tape-measure' && !state.isDragging) {
    // Start new measurement
    callbacks.setCurrentMeasureStart(state.currentMousePos);
  }

  // Clear drag state
  callbacks.setIsDragging(false);
  callbacks.setDraggedElement(null);
  callbacks.setDraggedElementOriginalPos(null);
  callbacks.setSnapGuides({ vertical: [], horizontal: [], snapPoint: null });
  callbacks.setDragThreshold({ exceeded: false, startElement: null });
}

// =============================================================================
// DRAG AND DROP HANDLERS
// =============================================================================

/**
 * Handle drag over events (for component library drag)
 */
export function handleDragOver(
  event: React.DragEvent<HTMLCanvasElement>
): void {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
}

/**
 * Handle drop events (when component is dropped on canvas)
 */
export function handleDrop(
  event: React.DragEvent<HTMLCanvasElement>,
  state: InteractionState,
  callbacks: InteractionCallbacks,
  utils: InteractionUtilities
): void {
  event.preventDefault();
  const canvas = state.canvasRef.current;
  if (!canvas) return;

  try {
    const rawData = event.dataTransfer.getData('component');
    if (!rawData || rawData.trim() === '') {
      Logger.warn('⚠️ Drop cancelled: No component data (quick drag release)');
      return;
    }
    const componentData = JSON.parse(rawData);
    const rect = canvas.getBoundingClientRect();
    // Account for CSS scaling of canvas element
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const roomPos = utils.canvasToRoom(x, y);

    // Calculate drop position based on mouse coordinates
    const dropX = roomPos.x;
    const dropY = roomPos.y;

    // BOUNDARY CHECK: Prevent drops outside inner room boundaries
    const dropBoundaryTolerance = ConfigurationService.getSync('drop_boundary_tolerance', 50);
    const innerRoomBounds = utils.getInnerRoomBounds();
    if (dropX < -dropBoundaryTolerance || dropY < -dropBoundaryTolerance ||
        dropX > innerRoomBounds.width + dropBoundaryTolerance ||
        dropY > innerRoomBounds.height + dropBoundaryTolerance) {
      Logger.warn('⚠️ Drop cancelled: Component dropped outside inner room boundaries');
      return;
    }

    // Use actual component dimensions
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
      defaultZ = ConfigurationService.getSync('cornice_y_offset', 210);
    } else if (componentData.type === 'pelmet') {
      defaultZ = ConfigurationService.getSync('pelmet_y_offset', 140);
    } else if (componentData.type === 'counter-top') {
      defaultZ = ConfigurationService.getSync('countertop_y_offset', 86);
    } else if (componentData.type === 'wall-cabinet' || componentData.id?.includes('wall-cabinet')) {
      defaultZ = ConfigurationService.getSync('wall_cabinet_y_offset', 140);
    } else if (componentData.type === 'wall-unit-end-panel') {
      defaultZ = ConfigurationService.getSync('cornice_y_offset', 210);
    } else if (componentData.type === 'window') {
      defaultZ = ConfigurationService.getSync('countertop_y_offset', 86);
    }

    // Apply Enhanced Component Placement
    const placementResult = utils.getEnhancedComponentPlacement(
      dropX,
      dropY,
      effectiveWidth,
      effectiveDepth,
      componentData.id,
      componentData.type,
      state.design.roomDimensions
    );

    // Log placement results
    if (placementResult.snappedToWall) {
      Logger.debug(`🎯 [Enhanced Placement] Component snapped to ${placementResult.corner || 'wall'} at (${placementResult.x}, ${placementResult.y}) with rotation ${placementResult.rotation}°`);
    }

    // Validate placement
    if (!placementResult.withinBounds) {
      Logger.warn('⚠️ [Enhanced Placement] Component placement outside room bounds, adjusting...');
    }

    const newElement: DesignElement = {
      id: `${componentData.id}-${Date.now()}`,
      component_id: componentData.id,
      type: componentData.type,
      // Use enhanced placement results with proper wall clearance and rotation
      x: placementResult.snappedToWall ? placementResult.x : utils.snapToGrid(placementResult.x),
      y: placementResult.snappedToWall ? placementResult.y : utils.snapToGrid(placementResult.y),
      z: defaultZ,
      width: componentData.width,
      depth: componentData.depth,
      height: componentData.height,
      rotation: placementResult.rotation,
      color: componentData.color,
      style: componentData.name,
      zIndex: 0,
    };

    callbacks.onAddElement(newElement);
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
  }
}
