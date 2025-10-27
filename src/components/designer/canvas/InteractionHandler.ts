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
  snappedToWall: boolean;
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
  // Implementation will be extracted from DesignCanvas2D.tsx
  // Placeholder for now
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
  // Implementation will be extracted from DesignCanvas2D.tsx
  // Placeholder for now
}

/**
 * Handle touch end events
 */
export function handleTouchEnd(
  point: TouchPoint,
  event: TouchEvent,
  state: InteractionState,
  callbacks: InteractionCallbacks,
  utils: InteractionUtilities
): void {
  // Implementation will be extracted from DesignCanvas2D.tsx
  // Placeholder for now
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
