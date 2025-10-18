/**
 * View Management Helpers
 *
 * Purpose: Manage all view types with independent visibility filtering
 * - Plan view (2D top-down)
 * - Elevation views (4 cardinal directions, up to 3 per direction)
 * - 3D view
 * - Each view has independent hidden_elements array
 *
 * Supports up to 14 total views (plan + 12 elevations + 3D) for H-shaped rooms
 */

import type { ElevationViewConfig, RoomDesignSettings } from '@/types/project';

// Constants
export const MAX_VIEWS_PER_DIRECTION = 3;
export const DEFAULT_DIRECTIONS = ['front', 'back', 'left', 'right'] as const;
export const SPECIAL_VIEWS = ['plan', '3d'] as const;

/**
 * Generate default view configs (plan + 4 elevations + 3D)
 * Used when elevation_views is undefined in design_settings
 */
export function getDefaultElevationViews(): ElevationViewConfig[] {
  return [
    {
      id: 'plan',
      direction: 'plan',
      label: 'Plan View',
      hidden_elements: [],
      is_default: true,
      sort_order: 0
    },
    {
      id: 'front-default',
      direction: 'front',
      label: 'Front',
      hidden_elements: [],
      is_default: true,
      sort_order: 1
    },
    {
      id: 'back-default',
      direction: 'back',
      label: 'Back',
      hidden_elements: [],
      is_default: true,
      sort_order: 2
    },
    {
      id: 'left-default',
      direction: 'left',
      label: 'Left',
      hidden_elements: [],
      is_default: true,
      sort_order: 3
    },
    {
      id: 'right-default',
      direction: 'right',
      label: 'Right',
      hidden_elements: [],
      is_default: true,
      sort_order: 4
    },
    {
      id: '3d',
      direction: '3d',
      label: '3D View',
      hidden_elements: [],
      is_default: true,
      sort_order: 5
    }
  ];
}

/**
 * Get elevation views from design settings, or generate defaults
 */
export function getElevationViews(designSettings?: RoomDesignSettings): ElevationViewConfig[] {
  if (!designSettings?.elevation_views || designSettings.elevation_views.length === 0) {
    return getDefaultElevationViews();
  }
  return designSettings.elevation_views;
}

/**
 * Check if a direction can have more views (max 3 per direction)
 */
export function canDuplicateView(
  direction: 'front' | 'back' | 'left' | 'right',
  elevationViews: ElevationViewConfig[]
): boolean {
  const viewsForDirection = elevationViews.filter(v => v.direction === direction);
  return viewsForDirection.length < MAX_VIEWS_PER_DIRECTION;
}

/**
 * Generate unique ID for a new view
 */
function generateViewId(direction: string, elevationViews: ElevationViewConfig[]): string {
  const existingViews = elevationViews.filter(v => v.direction === direction);
  const duplicateCount = existingViews.filter(v => !v.is_default).length;
  return `${direction}-dup${duplicateCount + 1}`;
}

/**
 * Generate default label for duplicated view
 */
function generateViewLabel(direction: string, elevationViews: ElevationViewConfig[]): string {
  const existingViews = elevationViews.filter(v => v.direction === direction);
  const duplicateCount = existingViews.filter(v => !v.is_default).length;
  const capitalizedDirection = direction.charAt(0).toUpperCase() + direction.slice(1);
  return `${capitalizedDirection} (${duplicateCount + 1})`;
}

/**
 * Duplicate an elevation view
 * Creates a new view with same direction but empty hidden_elements
 */
export function duplicateElevationView(
  viewId: string,
  elevationViews: ElevationViewConfig[]
): ElevationViewConfig[] | null {
  // Find the view to duplicate
  const sourceView = elevationViews.find(v => v.id === viewId);
  if (!sourceView) {
    console.error(`View ${viewId} not found`);
    return null;
  }

  // Check if we can duplicate this direction
  if (!canDuplicateView(sourceView.direction, elevationViews)) {
    console.error(`Cannot duplicate ${sourceView.direction}: max ${MAX_VIEWS_PER_DIRECTION} views per direction`);
    return null;
  }

  // Calculate next sort order
  const maxSortOrder = Math.max(...elevationViews.map(v => v.sort_order));

  // Create new view
  const newView: ElevationViewConfig = {
    id: generateViewId(sourceView.direction, elevationViews),
    direction: sourceView.direction,
    label: generateViewLabel(sourceView.direction, elevationViews),
    hidden_elements: [...sourceView.hidden_elements], // Copy hidden elements from source
    is_default: false,
    sort_order: maxSortOrder + 1
  };

  return [...elevationViews, newView];
}

/**
 * Delete an elevation view (cannot delete default views)
 */
export function deleteElevationView(
  viewId: string,
  elevationViews: ElevationViewConfig[]
): ElevationViewConfig[] | null {
  const viewToDelete = elevationViews.find(v => v.id === viewId);

  if (!viewToDelete) {
    console.error(`View ${viewId} not found`);
    return null;
  }

  if (viewToDelete.is_default) {
    console.error(`Cannot delete default view ${viewId}`);
    return null;
  }

  return elevationViews.filter(v => v.id !== viewId);
}

/**
 * Rename an elevation view
 */
export function renameElevationView(
  viewId: string,
  newLabel: string,
  elevationViews: ElevationViewConfig[]
): ElevationViewConfig[] | null {
  const viewIndex = elevationViews.findIndex(v => v.id === viewId);

  if (viewIndex === -1) {
    console.error(`View ${viewId} not found`);
    return null;
  }

  // Validate label
  if (!newLabel.trim()) {
    console.error('Label cannot be empty');
    return null;
  }

  // Create updated array
  const updated = [...elevationViews];
  updated[viewIndex] = {
    ...updated[viewIndex],
    label: newLabel.trim()
  };

  return updated;
}

/**
 * Toggle element visibility in a specific view
 */
export function toggleElementVisibility(
  viewId: string,
  elementId: string,
  elevationViews: ElevationViewConfig[]
): ElevationViewConfig[] | null {
  const viewIndex = elevationViews.findIndex(v => v.id === viewId);

  if (viewIndex === -1) {
    console.error(`View ${viewId} not found`);
    return null;
  }

  const view = elevationViews[viewIndex];
  const isCurrentlyHidden = view.hidden_elements.includes(elementId);

  // Create updated array
  const updated = [...elevationViews];
  updated[viewIndex] = {
    ...view,
    hidden_elements: isCurrentlyHidden
      ? view.hidden_elements.filter(id => id !== elementId) // Show element
      : [...view.hidden_elements, elementId] // Hide element
  };

  return updated;
}

/**
 * Check if an element should be visible in a specific view
 */
export function isElementVisibleInView(
  elementId: string,
  viewId: string,
  elevationViews: ElevationViewConfig[]
): boolean {
  const view = elevationViews.find(v => v.id === viewId);
  if (!view) return true; // Default to visible if view not found

  return !view.hidden_elements.includes(elementId);
}

/**
 * Get all views for a specific direction
 */
export function getViewsForDirection(
  direction: 'front' | 'back' | 'left' | 'right',
  elevationViews: ElevationViewConfig[]
): ElevationViewConfig[] {
  return elevationViews
    .filter(v => v.direction === direction)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Validate elevation view configuration
 */
export function validateElevationViews(elevationViews: ElevationViewConfig[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for duplicate IDs
  const ids = elevationViews.map(v => v.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('Duplicate view IDs found');
  }

  // Check max views per direction
  for (const direction of DEFAULT_DIRECTIONS) {
    const viewsForDirection = elevationViews.filter(v => v.direction === direction);
    if (viewsForDirection.length > MAX_VIEWS_PER_DIRECTION) {
      errors.push(`Too many views for ${direction}: ${viewsForDirection.length} (max ${MAX_VIEWS_PER_DIRECTION})`);
    }
  }

  // Check that default views exist
  for (const direction of DEFAULT_DIRECTIONS) {
    const hasDefaultView = elevationViews.some(v => v.direction === direction && v.is_default);
    if (!hasDefaultView) {
      errors.push(`Missing default view for ${direction}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
