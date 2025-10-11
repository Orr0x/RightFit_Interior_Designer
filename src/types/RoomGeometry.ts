/**
 * Room Geometry Types
 *
 * TypeScript interfaces for complex room shapes (L-shape, U-shape, custom polygons)
 * These types define the structure of JSONB data stored in the database.
 *
 * Phase 2 of Complex Room Shapes Implementation
 */

// ============================================================================
// Core Geometry Types
// ============================================================================

export interface RoomGeometry {
  shape_type: RoomShapeType;
  bounding_box: BoundingBox;
  floor: FloorGeometry;
  walls: WallSegment[];
  ceiling: CeilingGeometry;
  sections?: RoomSection[];
  metadata: RoomMetadata;
}

export type RoomShapeType = 'rectangle' | 'l-shape' | 'u-shape' | 't-shape' | 'custom';

export interface BoundingBox {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
}

// ============================================================================
// Floor Geometry
// ============================================================================

export interface FloorGeometry {
  type: 'polygon';
  vertices: [number, number][]; // Ordered vertices (clockwise), in cm
  elevation: number; // Height above ground level (cm), typically 0
  material?: string; // 'hardwood', 'tile', 'carpet', etc.
  material_zones?: MaterialZone[]; // Optional: different floor materials in zones
}

export interface MaterialZone {
  vertices: [number, number][];
  material: string;
}

// ============================================================================
// Wall Geometry
// ============================================================================

export interface WallSegment {
  id: string; // Unique ID: 'wall_north', 'wall_internal_1'
  start: [number, number]; // Start point [x, y] in cm
  end: [number, number]; // End point [x, y] in cm
  height: number; // Wall height in cm (e.g., 240)
  thickness?: number; // Wall thickness in cm (default 10)
  type: WallType;
  material?: string; // 'plaster', 'brick', 'glass', etc.
  elevation_view?: string; // Elevation view assignment: 'front', 'back', 'left', 'right', 'interior-return', etc.
}

export type WallType = 'solid' | 'door' | 'window' | 'opening';

// ============================================================================
// Ceiling Geometry
// ============================================================================

export interface CeilingGeometry {
  type: CeilingType;
  zones: CeilingZone[]; // Multiple zones for complex ceilings
}

export type CeilingType = 'flat' | 'vaulted' | 'sloped';

export interface CeilingZone {
  vertices: [number, number][]; // Floor projection of ceiling zone
  height: number; // Ceiling height in cm (e.g., 250)
  style: 'flat' | 'vaulted'; // Rendering style
  slope?: number; // For sloped ceilings (degrees)
  apex_height?: number; // For vaulted ceilings (cm)
}

// ============================================================================
// Room Sections (for L/U/T shapes)
// ============================================================================

export interface RoomSection {
  id: string; // 'main_section', 'extension', 'left_arm'
  name?: string; // User-friendly name
  type?: RoomSectionType;
  vertices: [number, number][]; // Section floor vertices
}

export type RoomSectionType = 'primary' | 'secondary' | 'arm' | 'extension';

// ============================================================================
// Metadata
// ============================================================================

export interface RoomMetadata {
  total_floor_area: number; // Total floor area in cm²
  total_wall_area?: number; // Total wall surface area in cm²
  usable_floor_area?: number; // Usable floor area (excluding obstacles) in cm²
  total_perimeter?: number; // Total perimeter length in cm
  total_wall_length?: number; // Total wall length in cm
}

// ============================================================================
// Template Configuration
// ============================================================================

export interface ParameterConfig {
  configurable_params: ConfigurableParam[];
  template_variables?: Record<string, string>; // Internal variable mappings
}

export interface ConfigurableParam {
  name: string; // 'width', 'extension_depth', 'ceiling_height'
  label: string; // User-friendly label for UI
  type: 'number'; // Future: 'boolean', 'select'
  min: number; // Minimum value (cm)
  max: number; // Maximum value (cm)
  default: number; // Default value (cm)
  step?: number; // Increment step (default 10cm)
  unit: 'cm'; // Future: 'm', 'in'
  description?: string; // Help text for users
}

// ============================================================================
// Template Types
// ============================================================================

export interface RoomGeometryTemplate {
  id: string;
  template_name: string; // Unique: 'l-shape-standard', 'u-shape-large'
  display_name: string; // User-friendly: 'Standard L-Shape'
  description?: string;
  category: TemplateCategory;
  preview_image_url?: string; // Preview image path
  geometry_definition: RoomGeometry;
  parameter_config?: ParameterConfig;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type TemplateCategory = 'standard' | 'l-shape' | 'u-shape' | 't-shape' | 'custom';

// ============================================================================
// Validation Types
// ============================================================================

export interface GeometryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Helper Types for Rendering
// ============================================================================

/**
 * Simplified room dimensions for backward compatibility
 */
export interface SimpleRoomDimensions {
  width: number; // cm
  height: number; // cm (depth)
  ceilingHeight: number; // cm
}

/**
 * Union type for room representation
 */
export type RoomRepresentation =
  | { type: 'simple'; dimensions: SimpleRoomDimensions }
  | { type: 'complex'; geometry: RoomGeometry };

// ============================================================================
// Point and Line Types (for calculations)
// ============================================================================

export type Point2D = [number, number];

export interface LineSegment {
  start: Point2D;
  end: Point2D;
}

export interface Polygon {
  vertices: Point2D[];
  holes?: Point2D[][]; // For polygons with holes (future)
}

// ============================================================================
// Transformation Types
// ============================================================================

export interface GeometryTransform {
  translate?: { x: number; y: number };
  rotate?: number; // Degrees
  scale?: { x: number; y: number };
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  RoomGeometry,
  RoomShapeType,
  BoundingBox,
  FloorGeometry,
  MaterialZone,
  WallSegment,
  WallType,
  CeilingGeometry,
  CeilingType,
  CeilingZone,
  RoomSection,
  RoomSectionType,
  RoomMetadata,
  ParameterConfig,
  ConfigurableParam,
  RoomGeometryTemplate,
  TemplateCategory,
  GeometryValidationResult,
  SimpleRoomDimensions,
  RoomRepresentation,
  Point2D,
  LineSegment,
  Polygon,
  GeometryTransform
};
