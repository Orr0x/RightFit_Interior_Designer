import { useComponentMetadata, ComponentMetadata } from './useComponentMetadata';
import { DesignElement } from '@/types/project';
import { Logger } from '@/utils/Logger';

// Snapping configuration
const SNAP_THRESHOLD_CM = 10;  // Only snap if within 10cm (prevents annoying drag-away behavior, small enough for 30cm cabinets)
const MAX_SEARCH_RADIUS_CM = 100;  // Maximum distance to search for valid position

/**
 * Result of collision detection validation
 */
export interface CollisionResult {
  isValid: boolean;  // Can component be placed here?
  collidingElements: DesignElement[];  // What components would it collide with
  reason?: string;  // Human-readable reason for collision
  suggestedPosition?: { x: number; y: number };  // Nearest valid position if invalid
}

/**
 * Hook for layer-aware collision detection with type-aware magnetic snapping
 *
 * Behavior:
 * - Wall units snap to wall units
 * - Base units snap to base units
 * - Tall units snap to both base AND wall units
 * - Only snaps if within 20cm threshold (prevents annoying behavior)
 * - Falls back to collision-free position if no snap point available
 */
export const useCollisionDetection = () => {
  const { getComponentMetadata } = useComponentMetadata();

  /**
   * Validate component placement and suggest position if invalid
   * Called on mouseup/drop only (NOT during drag)
   */
  const validatePlacement = (
    element: DesignElement,
    existingElements: DesignElement[],
    originalPosition?: { x: number; y: number }
  ): CollisionResult => {

    const elementMeta = getComponentMetadata(element.component_id || element.id);

    if (!elementMeta) {
      // No metadata available - allow placement (permissive fallback)
      Logger.warn(`⚠️ [Collision] No metadata for component: ${element.component_id || element.id}`);
      return { isValid: true, collidingElements: [] };
    }

    const collidingElements: DesignElement[] = [];
    let firstCollisionReason: string | undefined;

    // Check collision with all existing elements
    for (const existing of existingElements) {
      if (existing.id === element.id) continue;  // Skip self

      const existingMeta = getComponentMetadata(existing.component_id || existing.id);
      if (!existingMeta) continue;  // Skip if no metadata

      // 1. Check 2D (X/Y) overlap
      const has2DOverlap = check2DOverlap(element, existing);
      if (!has2DOverlap) continue;  // No X/Y overlap = no collision

      // 2. Check 3D (height) overlap
      const hasHeightOverlap = checkHeightOverlap(elementMeta, existingMeta);
      if (!hasHeightOverlap) continue;  // Different heights = no collision

      // 3. Check if overlap is allowed by layer rules
      const canOverlap = canLayersOverlap(elementMeta, existingMeta);
      if (!canOverlap) {
        // COLLISION DETECTED
        collidingElements.push(existing);
        if (!firstCollisionReason) {
          firstCollisionReason = `${elementMeta.layer_type || 'Component'} cannot overlap ${existingMeta.layer_type || 'component'}`;
        }
      }
    }

    // If valid placement, return success
    if (collidingElements.length === 0) {
      return { isValid: true, collidingElements: [] };
    }

    // Invalid placement - find suggested position
    const suggestedPosition = findNearestValidPosition(
      element,
      { x: element.x, y: element.y },
      existingElements
    );

    return {
      isValid: false,
      collidingElements,
      reason: firstCollisionReason,
      suggestedPosition: suggestedPosition || originalPosition  // Fallback to original if no valid position found
    };
  };

  /**
   * Check if two elements overlap in 2D (X/Y plane)
   */
  const check2DOverlap = (el1: DesignElement, el2: DesignElement): boolean => {
    return (
      el1.x < el2.x + el2.width &&
      el1.x + el1.width > el2.x &&
      el1.y < el2.y + (el2.depth || el2.height) &&
      el1.y + (el1.depth || el1.height) > el2.y
    );
  };

  /**
   * Check if two components overlap in height (Z axis)
   */
  const checkHeightOverlap = (meta1: ComponentMetadata, meta2: ComponentMetadata): boolean => {
    const min1 = meta1.min_height_cm ?? 0;
    const max1 = meta1.max_height_cm ?? 300;
    const min2 = meta2.min_height_cm ?? 0;
    const max2 = meta2.max_height_cm ?? 300;

    return min1 < max2 && max1 > min2;
  };

  /**
   * Check if two layers can overlap based on their can_overlap_layers rules
   */
  const canLayersOverlap = (meta1: ComponentMetadata, meta2: ComponentMetadata): boolean => {
    const layer1 = meta1.layer_type;
    const layer2 = meta2.layer_type;

    if (!layer1 || !layer2) return true;  // Permissive if layer not defined

    // Check if component1 can overlap component2's layer
    const component1CanOverlap = meta1.can_overlap_layers?.includes(layer2) || false;

    // Check if component2 can overlap component1's layer
    const component2CanOverlap = meta2.can_overlap_layers?.includes(layer1) || false;

    // Allow overlap if either component permits it
    return component1CanOverlap || component2CanOverlap;
  };

  /**
   * Find nearest valid position with type-aware magnetic snapping
   *
   * Priority:
   * 1. Snap to same-type components (within 20cm threshold)
   * 2. Find any collision-free position nearby
   * 3. Return null if nothing found
   */
  const findNearestValidPosition = (
    element: DesignElement,
    proposedPosition: { x: number; y: number },
    existingElements: DesignElement[]
  ): { x: number; y: number } | null => {

    const elementMeta = getComponentMetadata(element.component_id || element.id);
    if (!elementMeta) return null;

    // STEP 1: Try magnetic snapping to same-type components (within threshold)
    const snapTargets = getSnapTargets(element, existingElements, elementMeta);

    if (snapTargets.length > 0) {
      const snapPosition = findClosestSnapPoint(
        proposedPosition,
        element,
        snapTargets,
        existingElements,
        SNAP_THRESHOLD_CM
      );

      if (snapPosition) {
        return snapPosition;  // Successfully snapped
      }
    }

    // STEP 2: Find any valid collision-free position nearby (expanding search)
    for (let radius = 10; radius <= MAX_SEARCH_RADIUS_CM; radius += 10) {
      // Try 8 directions (N, NE, E, SE, S, SW, W, NW)
      const directions = [
        { dx: 0, dy: -radius },      // N
        { dx: radius, dy: -radius }, // NE
        { dx: radius, dy: 0 },       // E
        { dx: radius, dy: radius },  // SE
        { dx: 0, dy: radius },       // S
        { dx: -radius, dy: radius }, // SW
        { dx: -radius, dy: 0 },      // W
        { dx: -radius, dy: -radius } // NW
      ];

      for (const dir of directions) {
        const testPosition = {
          x: proposedPosition.x + dir.dx,
          y: proposedPosition.y + dir.dy
        };

        const testElement = { ...element, ...testPosition };
        const result = validatePlacement(testElement, existingElements);

        if (result.isValid) {
          return testPosition;  // Found valid position
        }
      }
    }

    return null;  // No valid position found
  };

  /**
   * Get components that this element should snap to based on layer type
   *
   * Snap rules:
   * - Wall units → snap to wall units
   * - Base units → snap to base units
   * - Tall units → snap to both base AND wall units
   */
  const getSnapTargets = (
    element: DesignElement,
    existingElements: DesignElement[],
    elementMeta: ComponentMetadata
  ): DesignElement[] => {

    const snapTargets: DesignElement[] = [];

    for (const existing of existingElements) {
      if (existing.id === element.id) continue;

      const existingMeta = getComponentMetadata(existing.component_id || existing.id);
      if (!existingMeta) continue;

      const elementLayer = elementMeta.layer_type;
      const existingLayer = existingMeta.layer_type;

      // Wall units snap to wall units
      if (elementLayer === 'wall' && existingLayer === 'wall') {
        snapTargets.push(existing);
      }
      // Base units snap to base units
      else if (elementLayer === 'base' && existingLayer === 'base') {
        snapTargets.push(existing);
      }
      // Tall units snap to BOTH base AND wall units
      else if (elementLayer === 'tall' && (existingLayer === 'base' || existingLayer === 'wall')) {
        snapTargets.push(existing);
      }
    }

    return snapTargets;
  };

  /**
   * Find closest snap point (edge-to-edge alignment)
   * Only snaps if within snapThreshold distance (10cm - prevents annoying behavior)
   */
  const findClosestSnapPoint = (
    proposedPosition: { x: number; y: number },
    element: DesignElement,
    snapTargets: DesignElement[],
    allElements: DesignElement[],
    snapThreshold: number = SNAP_THRESHOLD_CM  // 10cm threshold
  ): { x: number; y: number } | null => {

    let closestSnapPosition: { x: number; y: number } | null = null;
    let closestDistance = Infinity;

    for (const target of snapTargets) {
      // Try snapping to all 4 edges of target component
      const snapPositions = [
        // Snap to left edge (align right edge of dragged to left edge of target)
        { x: target.x - element.width, y: target.y },

        // Snap to right edge (align left edge of dragged to right edge of target)
        { x: target.x + target.width, y: target.y },

        // Snap to top edge (align bottom edge of dragged to top edge of target)
        { x: target.x, y: target.y - (element.depth || element.height) },

        // Snap to bottom edge (align top edge of dragged to bottom edge of target)
        { x: target.x, y: target.y + (target.depth || target.height) }
      ];

      for (const snapPos of snapPositions) {
        const distance = Math.sqrt(
          Math.pow(snapPos.x - proposedPosition.x, 2) +
          Math.pow(snapPos.y - proposedPosition.y, 2)
        );

        // IMPORTANT: Only consider snap points within threshold
        if (distance > snapThreshold) continue;

        // Check if this snap position is valid (no collisions)
        const testElement = { ...element, ...snapPos };
        const result = validatePlacement(testElement, allElements);

        if (result.isValid && distance < closestDistance) {
          closestDistance = distance;
          closestSnapPosition = snapPos;
        }
      }
    }

    return closestSnapPosition;  // Returns null if no snap point within threshold
  };

  return {
    validatePlacement,
    SNAP_THRESHOLD_CM,
    MAX_SEARCH_RADIUS_CM
  };
};

export default useCollisionDetection;
