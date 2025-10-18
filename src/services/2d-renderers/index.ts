/**
 * Main render dispatcher for database-driven 2D rendering
 * Date: 2025-10-09
 * Related: docs/session-2025-10-09-2d-database-migration/
 */

import type {
  DesignElement,
  Render2DDefinition,
  PlanViewType,
  ElevationViewType,
  RoomDimensions
} from '@/types/render2d';

import {
  renderRectangle,
  renderCornerSquare,
  renderSinkSingle,
  renderSinkDouble,
  renderSinkCorner,
  renderCustomSVG
} from './plan-view-handlers';

import {
  renderStandardCabinet,
  renderAppliance,
  renderSinkElevation,
  renderOpenShelf,
  renderCustomSVGElevation
} from './elevation-view-handlers';

// =====================================================
// Plan View Handlers Registry
// =====================================================

type PlanViewHandlerFn = (
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: any,
  zoom: number
) => void;

const PLAN_VIEW_HANDLERS: Record<PlanViewType, PlanViewHandlerFn> = {
  'rectangle': renderRectangle,
  'corner-square': renderCornerSquare,
  'sink-single': renderSinkSingle,
  'sink-double': renderSinkDouble,
  'sink-corner': renderSinkCorner,
  'custom-svg': (ctx, element, data, zoom) => {
    renderCustomSVG(ctx, element, data.svg_path || '', zoom);
  }
};

// =====================================================
// Elevation View Handlers Registry
// =====================================================

type ElevationViewHandlerFn = (
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: any,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  roomDimensions?: RoomDimensions,
  currentView?: string
) => void;

const ELEVATION_VIEW_HANDLERS: Record<ElevationViewType, ElevationViewHandlerFn> = {
  'standard-cabinet': renderStandardCabinet,
  'appliance': renderAppliance,
  'sink': renderSinkElevation,
  'open-shelf': renderOpenShelf,
  'custom-svg': (ctx, element, data, x, y, width, height, zoom, roomDimensions, currentView) => {
    renderCustomSVGElevation(ctx, element, data.svg_path || '', x, y, width, height, zoom, roomDimensions, currentView);
  }
};

// =====================================================
// Main Plan View Renderer
// =====================================================

/**
 * Render a component in plan view using database-driven definition
 */
export function renderPlanView(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  renderDef: Render2DDefinition,
  zoom: number
): void {
  const handler = PLAN_VIEW_HANDLERS[renderDef.plan_view_type];

  if (!handler) {
    console.warn(
      `[2D Renderer] Unknown plan_view_type: "${renderDef.plan_view_type}" for component "${element.component_id}"`
    );
    // Fallback to rectangle
    renderRectangle(ctx, element, {}, zoom);
    return;
  }

  try {
    handler(ctx, element, renderDef.plan_view_data, zoom);
  } catch (error) {
    console.error(
      `[2D Renderer] Error rendering plan view for "${element.component_id}":`,
      error
    );
    // Fallback to rectangle
    renderRectangle(ctx, element, {}, zoom);
  }
}

// =====================================================
// Main Elevation View Renderer
// =====================================================

/**
 * Render a component in elevation view using database-driven definition
 */
export function renderElevationView(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  renderDef: Render2DDefinition,
  view: 'front' | 'back' | 'left' | 'right',
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  roomDimensions?: RoomDimensions
): void {
  // Determine which elevation definition to use
  const isHorizontalView = view === 'front' || view === 'back';
  const elevationType = isHorizontalView
    ? renderDef.elevation_type
    : renderDef.side_elevation_type;
  const elevationData = isHorizontalView
    ? renderDef.elevation_data
    : renderDef.side_elevation_data;

  const handler = ELEVATION_VIEW_HANDLERS[elevationType];

  if (!handler) {
    console.warn(
      `[2D Renderer] Unknown elevation_type: "${elevationType}" for component "${element.component_id}"`
    );
    // Fallback to standard cabinet
    renderStandardCabinet(ctx, element, {}, x, y, width, height, zoom, roomDimensions, view);
    return;
  }

  try {
    handler(ctx, element, elevationData, x, y, width, height, zoom, roomDimensions, view);
  } catch (error) {
    console.error(
      `[2D Renderer] Error rendering elevation view for "${element.component_id}":`,
      error
    );
    // Fallback to standard cabinet
    renderStandardCabinet(ctx, element, {}, x, y, width, height, zoom, roomDimensions, view);
  }
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Check if a render type is supported
 */
export function isPlanViewTypeSupported(type: string): boolean {
  return type in PLAN_VIEW_HANDLERS;
}

/**
 * Check if an elevation type is supported
 */
export function isElevationViewTypeSupported(type: string): boolean {
  return type in ELEVATION_VIEW_HANDLERS;
}

/**
 * Get list of supported plan view types
 */
export function getSupportedPlanViewTypes(): PlanViewType[] {
  return Object.keys(PLAN_VIEW_HANDLERS) as PlanViewType[];
}

/**
 * Get list of supported elevation view types
 */
export function getSupportedElevationViewTypes(): ElevationViewType[] {
  return Object.keys(ELEVATION_VIEW_HANDLERS) as ElevationViewType[];
}

/**
 * Validate a render definition
 */
export function validateRenderDefinition(renderDef: Render2DDefinition): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check plan view type
  if (!isPlanViewTypeSupported(renderDef.plan_view_type)) {
    errors.push(`Invalid plan_view_type: "${renderDef.plan_view_type}"`);
  }

  // Check elevation type
  if (!isElevationViewTypeSupported(renderDef.elevation_type)) {
    errors.push(`Invalid elevation_type: "${renderDef.elevation_type}"`);
  }

  // Check side elevation type
  if (!isElevationViewTypeSupported(renderDef.side_elevation_type)) {
    errors.push(`Invalid side_elevation_type: "${renderDef.side_elevation_type}"`);
  }

  // Check fill color format (if provided)
  if (renderDef.fill_color && !/^#[0-9A-Fa-f]{6}$/.test(renderDef.fill_color)) {
    errors.push(`Invalid fill_color format: "${renderDef.fill_color}" (expected #RRGGBB)`);
  }

  // Check stroke color format (if provided)
  if (renderDef.stroke_color && !/^#[0-9A-Fa-f]{6}$/.test(renderDef.stroke_color)) {
    errors.push(`Invalid stroke_color format: "${renderDef.stroke_color}" (expected #RRGGBB)`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// =====================================================
// Debug Utilities
// =====================================================

/**
 * Render with debug overlay showing render type and data
 */
export function renderWithDebug(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  renderDef: Render2DDefinition,
  zoom: number,
  view: 'plan' | 'front' | 'back' | 'left' | 'right' = 'plan',
  roomDimensions?: RoomDimensions
): void {
  // Save context state
  ctx.save();

  // Render normally
  if (view === 'plan') {
    renderPlanView(ctx, element, renderDef, zoom);
  } else {
    // Elevation rendering requires position and size
    const x = element.x * zoom;
    const y = element.y * zoom;
    const width = element.width * zoom;
    const height = element.height * zoom;
    renderElevationView(ctx, element, renderDef, view, x, y, width, height, zoom, roomDimensions);
  }

  // Draw debug overlay
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(0, 0, element.width * zoom, (element.depth || element.height) * zoom);

  // Draw label
  ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
  ctx.font = '10px monospace';
  ctx.fillText(
    `${view === 'plan' ? renderDef.plan_view_type : renderDef.elevation_type}`,
    5,
    15
  );

  // Restore context
  ctx.restore();
}

// Export all handlers for direct access if needed
export * from './plan-view-handlers';
export * from './elevation-view-handlers';
