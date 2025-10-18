// Multi-Room Project Architecture - TypeScript Interfaces
// Phase 1: Core Data Models

export type RoomType = 
  | 'kitchen' 
  | 'bedroom' 
  | 'master-bedroom'
  | 'guest-bedroom'
  | 'bathroom' 
  | 'ensuite'
  | 'living-room' 
  | 'dining-room' 
  | 'office'
  | 'dressing-room'
  | 'utility' 
  | 'under-stairs';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Populated when needed (not always loaded)
  room_designs?: RoomDesign[];
}

export interface RoomDesign {
  id: string;
  project_id: string;
  room_type: RoomType;
  name?: string; // Custom room name (optional)
  room_dimensions: RoomDimensions;
  design_elements: DesignElement[];
  design_settings: RoomDesignSettings;
  created_at: string;
  updated_at: string;
}

export interface RoomDimensions {
  width: number;        // in cm - room width (X-axis)
  height: number;       // in cm - room depth (Y-axis, called "height" for legacy compatibility)
  ceilingHeight?: number; // in cm - room ceiling height (Z-axis), optional for backward compatibility
}

export interface RoomDesignSettings {
  // Room-specific settings
  default_wall_height?: number;
  floor_material?: string;
  wall_color?: string;
  lighting_settings?: LightingSettings;
  view_preferences?: ViewPreferences;
  // Elevation view configurations (for complex rooms with duplicates)
  elevation_views?: ElevationViewConfig[];
  // Migration tracking
  migrated?: boolean;
  original_design_id?: string;
  migration_date?: string;
  fallback_migration?: boolean;
}

export interface LightingSettings {
  ambient_intensity?: number;
  directional_intensity?: number;
  point_light_intensity?: number;
  shadows_enabled?: boolean;
}

export interface ViewPreferences {
  default_2d_view?: '2d' | '3d';
  default_2d_mode?: 'plan' | 'front' | 'back' | 'left' | 'right';
  grid_enabled?: boolean;
  ruler_enabled?: boolean;
  snap_to_grid?: boolean;
}

// View configuration for all view types (plan, elevation, 3D)
// Allows up to 3 views per cardinal direction (original + 2 duplicates)
// Supports H-shaped rooms with 3 walls per direction = 12 total views max
// Plus plan view and 3D view (each with independent visibility filtering)
export interface ElevationViewConfig {
  id: string;                                                       // Unique ID: "front-default", "plan", "3d", etc.
  direction: 'front' | 'back' | 'left' | 'right' | 'plan' | '3d';  // View type/direction
  label: string;                                                    // User-friendly name
  hidden_elements: string[];                                        // Element IDs to hide in this view
  is_default: boolean;                                              // True for standard views
  sort_order: number;                                               // Display order in ViewSelector
}

// Design interface for component compatibility
export interface Design {
  id: string;
  name: string;
  elements: DesignElement[];
  roomDimensions: RoomDimensions;
  roomType: RoomType;
}

// DesignElement interface with proper 3D dimension mapping
export interface DesignElement {
  id: string;
  component_id: string; // Component ID for database lookup (2D/3D definitions)
  name?: string; // Component name for display and debugging
  type: 'wall' | 'cabinet' | 'appliance' | 'counter-top' | 'end-panel' | 'window' | 'door' | 'flooring' | 'toe-kick' | 'cornice' | 'pelmet' | 'wall-unit-end-panel' | 'sink';
  x: number; // X position in room
  y: number; // Y position in room
  z?: number; // Z position in room (height off ground)
  width: number; // X-axis dimension (left-to-right)
  depth: number; // Y-axis dimension (front-to-back)
  height: number; // Z-axis dimension (bottom-to-top)
  // Legacy properties for backward compatibility
  verticalHeight?: number; // DEPRECATED: Use height instead
  rotation: number;
  style?: string;
  color?: string;
  material?: string;
  // Layering and visibility properties
  zIndex: number; // Rendering layer order (lower = behind, higher = in front)
  // ⚠️ COMMENTED OUT 2025-10-18: Global isVisible replaced by per-view hidden_elements
  // Reason: Redundant with view-specific visibility (ElevationViewConfig.hidden_elements)
  // Per-view system provides finer control - each view (plan, elevations, 3D) has independent visibility
  // isVisible: boolean; // Whether the component is visible in the 2D plan view
  // Corner unit door positioning
  cornerDoorSide?: 'left' | 'right' | 'auto'; // Manual override for corner unit door side (auto = use centerline logic)
}

// Z-Index layering system for 2D plan view rendering
export const getDefaultZIndex = (type: DesignElement['type'], id?: string): number => {
  // Check if this is a wall cabinet based on ID
  const isWallCabinet = id && (
    id.includes('wall-cabinet') || 
    id.includes('corner-wall-cabinet') || 
    id.includes('new-corner-wall-cabinet')
  );
  
  // Check if this is a tall unit (floor-standing but full height)
  const isTallUnit = id && (
    id.includes('tall') || 
    id.includes('larder') || 
    id.includes('corner-tall') ||
    id.includes('corner-larder') ||
    id.includes('larder-corner')
  );

  // Check if this is a butler sink (base unit mounted)
  const isButlerSink = id && (
    id.includes('butler-sink') || 
    id.includes('butler') ||
    id.includes('base-unit-sink')
  );

  switch (type) {
    case 'flooring':
      return 1.0; // Bottom layer
    case 'cabinet':
      if (isWallCabinet) {
        return 4.0; // Wall cabinets - above countertops
      } else if (isTallUnit) {
        return 2.0; // Tall units - base level (floor-standing)
      } else {
        return 2.0; // Base cabinets - base level
      }
    case 'appliance': // Appliances (floor-standing)
    case 'end-panel': // Base unit end panels
    case 'toe-kick': // Base level trim
      return 2.0; // Base units layer
    case 'counter-top':
      return 3.0; // Work surface layer - above base units, below wall units
    case 'sink':
      return 3.5; // All sinks - above worktops, below wall units
    case 'wall-unit-end-panel': // Wall unit end panels
      return 4.0; // Wall units layer
    case 'pelmet':
      return 4.5; // Below wall units
    case 'cornice':
      return 5.0; // Above wall units
    case 'window':
    case 'door':
      return 6.0; // Doors and windows
    case 'wall':
      return 0.5; // Walls (behind everything)
    default:
      return 2.0; // Default to base layer
  }
};

// Database response types (what we get from Supabase)
export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomDesignRow {
  id: string;
  project_id: string;
  room_type: string;
  name: string | null;
  room_dimensions: Record<string, number>; // JSONB - room dimensions
  design_elements: Record<string, unknown>[]; // JSONB - design elements array
  design_settings: Record<string, unknown>; // JSONB - settings object
  created_at: string;
  updated_at: string;
}

// API request/response types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  thumbnail_url?: string;
  is_public?: boolean;
}

export interface CreateRoomDesignRequest {
  project_id: string;
  room_type: RoomType;
  name?: string;
  room_dimensions?: RoomDimensions;
  design_elements?: DesignElement[];
  design_settings?: RoomDesignSettings;
}

export interface UpdateRoomDesignRequest {
  name?: string;
  room_dimensions?: RoomDimensions;
  design_elements?: DesignElement[];
  design_settings?: RoomDesignSettings;
}

// Utility types
export interface ProjectWithRooms extends Project {
  room_designs: RoomDesign[];
}

export interface RoomDesignSummary {
  room_type: RoomType;
  name?: string;
  element_count: number;
  last_updated: string;
  has_design: boolean;
}

export interface ProjectSummary extends Project {
  room_count: number;
  total_elements: number;
  room_summaries: RoomDesignSummary[];
}

// =============================================================================
// REMOVED: ROOM_TYPE_CONFIGS (lines 254-435 deleted on 2025-10-10)
// =============================================================================
// The hardcoded ROOM_TYPE_CONFIGS object has been removed and replaced with
// database-driven room templates.
//
// MIGRATION GUIDE:
// ----------------
// OLD CODE (deleted):
//   const config = getRoomTypeConfig('kitchen');
//   const width = config.defaultDimensions.width;
//
// NEW CODE (use RoomService or useRoomTemplate hook):
//   import { RoomService } from '@/services/RoomService';
//   const template = await RoomService.getRoomTypeTemplate('kitchen');
//   const width = template.default_width;
//
// OR in React components:
//   import { useRoomTemplate } from '@/hooks/useRoomTemplate';
//   const { template } = useRoomTemplate('kitchen');
//   const width = template?.defaultDimensions.width;
//
// BENEFITS:
// - Single source of truth (database)
// - Admin can update templates without code changes
// - No duplicate data maintenance
// - Easier testing
//
// DATABASE TABLE: room_type_templates
// MIGRATION: supabase/migrations/20250915000002_phase1_create_room_templates.sql
// =============================================================================

// Room type configuration interface (kept for backward compatibility)
export interface RoomTypeConfig {
  name: string;
  defaultDimensions: RoomDimensions;
  icon: string;
  description: string;
  defaultSettings: RoomDesignSettings;
}

// Helper functions - DEPRECATED: Use RoomService instead
/**
 * @deprecated Use RoomService.getRoomTypeTemplate() instead
 * This function is kept for backward compatibility but will be removed in future versions
 */
export const getRoomTypeConfig = async (roomType: RoomType): Promise<RoomTypeConfig> => {
  throw new Error(
    `getRoomTypeConfig() is deprecated. Use RoomService.getRoomTypeTemplate('${roomType}') instead.`
  );
};

/**
 * @deprecated Use RoomService.getAllRoomTypes() instead
 */
export const getAllRoomTypes = (): RoomType[] => {
  // Return hardcoded list of valid room types from the RoomType union
  return [
    'kitchen',
    'bedroom',
    'master-bedroom',
    'guest-bedroom',
    'bathroom',
    'ensuite',
    'living-room',
    'dining-room',
    'office',
    'dressing-room',
    'utility',
    'under-stairs'
  ];
};

/**
 * Check if a string is a valid RoomType
 * This function is NOT deprecated as it's a type guard
 */
export const isValidRoomType = (roomType: string): roomType is RoomType => {
  return getAllRoomTypes().includes(roomType as RoomType);
};

// Migration helpers - Updated for proper 3D dimension mapping
export const migrateDesignElement = (element: Record<string, string | number | boolean | undefined>): DesignElement => {
  // Handle legacy elements that might have old dimension structure
  const legacyHeight = element.height as number;
  const legacyDepth = element.depth as number;
  const legacyVerticalHeight = element.verticalHeight as number;
  
  // Determine proper dimensions based on what's available
  let width = element.width as number;
  let depth = legacyDepth ?? legacyHeight ?? 60; // Use depth if available, otherwise height, default 60cm
  let height = legacyVerticalHeight ?? 90; // Use verticalHeight if available, default 90cm
  
  // If we have legacy height but no depth, assume height was actually depth
  if (legacyHeight && !legacyDepth && !legacyVerticalHeight) {
    depth = legacyHeight;
    height = 90; // Default cabinet height
  }
  
  return {
    id: element.id as string,
    type: element.type as 'wall' | 'cabinet' | 'appliance' | 'counter-top' | 'end-panel' | 'window' | 'door' | 'flooring' | 'toe-kick' | 'cornice' | 'pelmet' | 'wall-unit-end-panel',
    x: element.x as number,
    y: element.y as number,
    width: width,
    depth: depth, // Y-axis dimension (front-to-back)
    height: height, // Z-axis dimension (bottom-to-top)
    // Legacy properties for backward compatibility
    verticalHeight: legacyVerticalHeight, // Keep for backward compatibility
    rotation: (element.rotation ?? 0) as number,
    style: element.style as string | undefined,
    color: element.color as string | undefined,
    material: element.material as string | undefined
  };
};

/**
 * @deprecated Use RoomService.createRoomDesign() instead
 * This synchronous function cannot query the database for templates.
 * Use the async RoomService.createRoomDesign() for proper database-driven room creation.
 */
export const createDefaultRoomDesign = (
  projectId: string,
  roomType: RoomType,
  customName?: string
): Omit<RoomDesign, 'id' | 'created_at' | 'updated_at'> => {
  throw new Error(
    `createDefaultRoomDesign() is deprecated and cannot access database templates. ` +
    `Use RoomService.createRoomDesign('${projectId}', '${roomType}') instead.`
  );
};