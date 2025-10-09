/**
 * Type definitions for database-driven 2D rendering system
 * Date: 2025-10-09
 * Related: docs/session-2025-10-09-2d-database-migration/
 */

// =====================================================
// Plan View Types
// =====================================================

export type PlanViewType =
  | 'rectangle'
  | 'corner-square'
  | 'sink-single'
  | 'sink-double'
  | 'sink-corner'
  | 'custom-svg';

export type ElevationViewType =
  | 'standard-cabinet'
  | 'appliance'
  | 'sink'
  | 'open-shelf'
  | 'custom-svg';

// =====================================================
// Main Render Definition
// =====================================================

export interface Render2DDefinition {
  id: string;
  component_id: string;

  // Plan view
  plan_view_type: PlanViewType;
  plan_view_data: PlanViewData;
  plan_view_svg?: string;

  // Elevation views
  elevation_type: ElevationViewType;
  elevation_data: ElevationData;
  elevation_svg_front?: string;
  elevation_svg_back?: string;

  // Side elevations
  side_elevation_type: ElevationViewType;
  side_elevation_data: ElevationData;
  elevation_svg_left?: string;
  elevation_svg_right?: string;

  // Visual properties
  fill_color: string;
  stroke_color: string;
  stroke_width?: number;

  // Metadata
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// =====================================================
// Plan View Data Types
// =====================================================

export type PlanViewData =
  | RectangleData
  | CornerSquareData
  | SinkSingleData
  | SinkDoubleData
  | SinkCornerData
  | Record<string, never>; // Empty object for types with no data

export interface RectangleData {
  // No special parameters - uses element dimensions
}

export interface CornerSquareData {
  // No special parameters - uses min(width, depth)
}

export interface SinkSingleData {
  bowl_inset_ratio?: number;  // Default: 0.15 (15% inset from edge)
  bowl_depth_ratio?: number;  // Default: 0.8 (80% of total depth)
  bowl_style?: 'ceramic' | 'stainless'; // Material appearance
  has_drain?: boolean;
  has_faucet_hole?: boolean;
  faucet_hole_position?: number; // Y position ratio (0-1)
  has_draining_board?: boolean;
}

export interface SinkDoubleData {
  bowl_inset_ratio?: number;  // Default: 0.1 (10% inset)
  bowl_width_ratio?: number;  // Default: 0.4 (40% each bowl)
  center_divider_width?: number; // Width in cm
  bowl_style?: 'ceramic' | 'stainless';
  has_drain?: boolean;
  has_faucet_hole?: boolean;
}

export interface SinkCornerData {
  bowl_size_ratio?: number; // Default: 0.6 (60% of available space)
  bowl_style?: 'ceramic' | 'stainless';
  has_drain?: boolean;
}

// =====================================================
// Elevation View Data Types
// =====================================================

export type ElevationData =
  | StandardCabinetData
  | ApplianceData
  | SinkElevationData
  | OpenShelfData
  | Record<string, never>; // Empty object

export interface StandardCabinetData {
  door_count?: number;     // Number of doors (1-4)
  door_style?: 'flat' | 'shaker' | 'glass';
  handle_style?: 'bar' | 'knob' | 'none';
  handle_position?: 'top' | 'center' | 'bottom';
  has_toe_kick?: boolean;  // Base cabinets only
  toe_kick_height?: number; // Height in cm
  drawer_count?: number;   // Optional drawers
  drawer_heights?: number[]; // Heights in cm

  // Corner cabinet configuration (Option C - Hybrid)
  is_corner?: boolean;     // True for corner cabinets
  corner_door_side?: 'left' | 'right' | 'auto'; // Door position (auto = use algorithm)
  corner_panel_style?: 'standard' | 'glass' | 'open'; // Side panel appearance
}

export interface ApplianceData {
  panel_style?: 'integrated' | 'standalone';
  has_display?: boolean;
  has_handle?: boolean;
}

export interface SinkElevationData {
  has_front_panel?: boolean;
  panel_height?: number; // Height in cm
  panel_style?: 'exposed' | 'under-mount';
}

export interface OpenShelfData {
  shelf_count?: number;
  shelf_spacing?: 'equal' | 'varied';
}

// =====================================================
// Element Interface (from existing codebase)
// =====================================================

export interface DesignElement {
  id: string;
  component_id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  rotation?: number;
  color?: string;
  metadata?: Record<string, any>;
  cornerDoorSide?: 'left' | 'right' | 'auto'; // Manual override for corner door positioning
}

export interface RoomDimensions {
  width: number;  // Room width in cm
  height: number; // Room depth in cm (Y-axis)
  ceilingHeight?: number; // Room ceiling height in cm (Z-axis)
}

// =====================================================
// Render Context
// =====================================================

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  element: DesignElement;
  renderDef: Render2DDefinition;
  zoom: number;
  isSelected?: boolean;
  isHovered?: boolean;
}

// =====================================================
// Handler Function Types
// =====================================================

export type PlanViewHandler = (
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: PlanViewData,
  zoom: number
) => void;

export type ElevationViewHandler = (
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: ElevationData,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  roomDimensions?: RoomDimensions,
  currentView?: string
) => void;
