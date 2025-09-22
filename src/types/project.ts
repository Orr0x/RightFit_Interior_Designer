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
  isVisible: boolean; // Whether the component is visible in the 2D plan view
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

// Room type configuration
export interface RoomTypeConfig {
  name: string;
  defaultDimensions: RoomDimensions;
  icon: string;
  description: string;
  defaultSettings: RoomDesignSettings;
}

export const ROOM_TYPE_CONFIGS: Record<RoomType, RoomTypeConfig> = {
  kitchen: {
    name: 'Kitchen',
    defaultDimensions: { width: 600, height: 400 },
    icon: 'ChefHat',
    description: 'Kitchen design with cabinets and appliances',
    defaultSettings: {
      default_wall_height: 250,
      view_preferences: {
        default_2d_view: '2d',
        default_2d_mode: 'plan',
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  },
  bedroom: {
    name: 'Bedroom',
    defaultDimensions: { width: 500, height: 400 },
    icon: 'Bed',
    description: 'Bedroom design with furniture and storage',
    defaultSettings: {
      default_wall_height: 250,
      view_preferences: {
        default_2d_view: '2d',
        default_2d_mode: 'plan',
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  },
  'master-bedroom': {
    name: 'Master Bedroom',
    defaultDimensions: { width: 600, height: 500 },
    icon: 'Bed',
    description: 'Master bedroom with en-suite and walk-in closet space',
    defaultSettings: {
      default_wall_height: 250,
      view_preferences: {
        default_2d_view: '2d',
        default_2d_mode: 'plan',
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  },
  'guest-bedroom': {
    name: 'Guest Bedroom',
    defaultDimensions: { width: 450, height: 400 },
    icon: 'Bed',
    description: 'Guest bedroom design with essential furniture',
    defaultSettings: {
      default_wall_height: 250,
      view_preferences: {
        default_2d_view: '2d',
        default_2d_mode: 'plan',
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  },
  bathroom: {
    name: 'Bathroom',
    defaultDimensions: { width: 300, height: 300 },
    icon: 'Bath',
    description: 'Bathroom design with fixtures and vanities',
    defaultSettings: {
      default_wall_height: 250,
      view_preferences: {
        default_2d_view: '2d',
        default_2d_mode: 'plan',
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  },
  ensuite: {
    name: 'Ensuite',
    defaultDimensions: { width: 250, height: 200 },
    icon: 'Bath',
    description: 'Ensuite bathroom connected to master bedroom',
    defaultSettings: {
      default_wall_height: 250,
      view_preferences: {
        default_2d_view: '2d',
        default_2d_mode: 'plan',
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  },
  'living-room': {
    name: 'Living Room',
    defaultDimensions: { width: 600, height: 500 },
    icon: 'Sofa',
    description: 'Living room design with seating and entertainment',
    defaultSettings: {
      default_wall_height: 250,
      view_preferences: {
        default_2d_view: '3d',
        default_2d_mode: 'plan',
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  },
  'dining-room': {
    name: 'Dining Room',
    defaultDimensions: { width: 500, height: 400 },
    icon: 'UtensilsCrossed',
    description: 'Dining room design with table and storage',
    defaultSettings: {
      default_wall_height: 250,
      view_preferences: {
        default_2d_view: '2d',
        default_2d_mode: 'plan',
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  },
  office: {
    name: 'Office',
    defaultDimensions: { width: 400, height: 350 },
    icon: 'Monitor',
    description: 'Home office design with desk and storage',
    defaultSettings: {
      default_wall_height: 250,
      view_preferences: {
        default_2d_view: '2d',
        default_2d_mode: 'plan',
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  },
  'dressing-room': {
    name: 'Dressing Room',
    defaultDimensions: { width: 300, height: 400 },
    icon: 'Shirt',
    description: 'Dressing room with wardrobe and storage solutions',
    defaultSettings: {
      default_wall_height: 250,
      view_preferences: {
        default_2d_view: '2d',
        default_2d_mode: 'plan',
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  },
  utility: {
    name: 'Utility Room',
    defaultDimensions: { width: 300, height: 250 },
    icon: 'Wrench',
    description: 'Utility room design with appliances and storage',
    defaultSettings: {
      default_wall_height: 250,
      view_preferences: {
        default_2d_view: '2d',
        default_2d_mode: 'plan',
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  },
  'under-stairs': {
    name: 'Under Stairs',
    defaultDimensions: { width: 200, height: 250 },
    icon: 'Home',
    description: 'Under stairs storage design',
    defaultSettings: {
      default_wall_height: 200, // Lower ceiling
      view_preferences: {
        default_2d_view: '2d',
        default_2d_mode: 'front', // Side view more useful for under stairs
        grid_enabled: true,
        snap_to_grid: true
      }
    }
  }
};

// Helper functions
export const getRoomTypeConfig = (roomType: RoomType): RoomTypeConfig => {
  return ROOM_TYPE_CONFIGS[roomType];
};

export const getAllRoomTypes = (): RoomType[] => {
  return Object.keys(ROOM_TYPE_CONFIGS) as RoomType[];
};

export const isValidRoomType = (roomType: string): roomType is RoomType => {
  return roomType in ROOM_TYPE_CONFIGS;
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

export const createDefaultRoomDesign = (
  projectId: string,
  roomType: RoomType,
  customName?: string
): Omit<RoomDesign, 'id' | 'created_at' | 'updated_at'> => {
  const config = getRoomTypeConfig(roomType);
  
  return {
    project_id: projectId,
    room_type: roomType,
    name: customName,
    room_dimensions: config.defaultDimensions,
    design_elements: [],
    design_settings: config.defaultSettings
  };
};