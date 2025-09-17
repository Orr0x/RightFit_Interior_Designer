# 🏗️ Technical Architecture - RightFit Interior Designer

## 📋 **System Overview**

RightFit Interior Designer follows a modern, scalable architecture designed for professional interior design workflows with mobile-first accessibility.

### **Architecture Principles**
- **Database-Driven**: All components and behaviors stored in PostgreSQL
- **Service Layer**: Clean separation between data access and UI
- **Type Safety**: Comprehensive TypeScript interfaces throughout
- **Performance-First**: Adaptive rendering and intelligent caching
- **Mobile-Responsive**: Touch-first design with progressive enhancement

---

## 🗄️ **Database Schema**

### **Core Tables**

#### **`components` Table**
```sql
-- Primary component data
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
component_id TEXT UNIQUE NOT NULL           -- e.g., 'base-cabinet-60cm'
name TEXT NOT NULL                          -- e.g., 'Base Cabinet 60cm'
description TEXT
type TEXT NOT NULL                          -- cabinet, appliance, etc.
category TEXT NOT NULL                      -- base-cabinets, wall-units, etc.
width DECIMAL(10,2) NOT NULL               -- X-axis dimension (cm)
height DECIMAL(10,2) NOT NULL              -- Z-axis dimension (cm)
depth DECIMAL(10,2) NOT NULL               -- Y-axis dimension (cm)
room_types TEXT[] NOT NULL                 -- ['kitchen', 'bedroom', etc.]
icon_name TEXT NOT NULL                    -- Lucide icon name
model_url TEXT                             -- 3D model URL (future)
thumbnail_url TEXT                         -- Component thumbnail
price DECIMAL(10,2)                        -- Component price (future)
version TEXT DEFAULT '1.0'                -- Version control
deprecated BOOLEAN DEFAULT false           -- Deprecation flag
tags TEXT[]                               -- Searchable tags
metadata JSONB DEFAULT '{}'               -- Flexible metadata
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()

-- Behavior properties (Phase 1 expansion)
mount_type TEXT CHECK (mount_type IN ('floor', 'wall')) DEFAULT 'floor'
has_direction BOOLEAN DEFAULT true
door_side TEXT CHECK (door_side IN ('front', 'back', 'left', 'right')) DEFAULT 'front'
default_z_position DECIMAL(10,2) DEFAULT 0
elevation_height DECIMAL(10,2)            -- Height in elevation view (if different)
corner_configuration JSONB DEFAULT '{}'   -- Corner-specific config
component_behavior JSONB DEFAULT '{}'     -- Extensible behaviors
```

#### **`projects` Table**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
name TEXT NOT NULL
description TEXT
thumbnail_url TEXT
is_public BOOLEAN DEFAULT false
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
```

#### **`room_designs` Table**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id UUID REFERENCES projects(id) ON DELETE CASCADE
room_type TEXT NOT NULL CHECK (room_type IN (
  'kitchen', 'bedroom', 'master-bedroom', 'guest-bedroom',
  'bathroom', 'ensuite', 'living-room', 'dining-room',
  'office', 'dressing-room', 'utility', 'under-stairs'
))
name TEXT
room_dimensions JSONB NOT NULL DEFAULT '{}'    -- {width: 800, height: 600, ceilingHeight: 240}
design_elements JSONB NOT NULL DEFAULT '[]'    -- Array of DesignElement objects
design_settings JSONB NOT NULL DEFAULT '{}'    -- Room-specific settings
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
```

#### **`room_type_templates` Table**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
room_type TEXT NOT NULL UNIQUE
name TEXT NOT NULL
icon_name TEXT NOT NULL
description TEXT NOT NULL
default_width DECIMAL(10,2) NOT NULL
default_height DECIMAL(10,2) NOT NULL
default_wall_height DECIMAL(10,2) DEFAULT 240
default_ceiling_height DECIMAL(10,2) DEFAULT 250
default_settings JSONB DEFAULT '{}'
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
```

### **Indexes & Performance**
```sql
-- Component indexes
CREATE INDEX idx_components_room_types ON components USING GIN(room_types);
CREATE INDEX idx_components_category ON components(category);
CREATE INDEX idx_components_type ON components(type);
CREATE INDEX idx_components_mount_type ON components(mount_type);
CREATE INDEX idx_components_behavior ON components USING GIN(component_behavior);
CREATE INDEX idx_components_corner_config ON components USING GIN(corner_configuration);

-- Room design indexes
CREATE INDEX idx_room_designs_project_id ON room_designs(project_id);
CREATE INDEX idx_room_designs_room_type ON room_designs(room_type);
```

---

## 🏛️ **Service Layer Architecture**

### **ComponentService.ts**
```typescript
export class ComponentService {
  // Batch load component behaviors for performance
  static async batchLoadComponentBehaviors(componentTypes: string[]): Promise<Map<string, ComponentBehavior>>
  
  // Get component behavior with caching
  static async getComponentBehavior(componentType: string): Promise<ComponentBehavior>
  
  // Get elevation height with fallbacks
  static async getElevationHeight(componentType: string, actualHeight: number): Promise<ComponentElevationData>
  
  // Preload behaviors for performance
  static async preloadBehaviors(componentTypes: string[]): Promise<void>
}

export interface ComponentBehavior {
  mount_type: 'floor' | 'wall';
  has_direction: boolean;
  door_side: 'front' | 'back' | 'left' | 'right';
  default_z_position: number;
  elevation_height?: number;
  corner_configuration: any;
  component_behavior: any;
}
```

### **CacheService.ts**
```typescript
export class CacheService {
  // Intelligent cache with TTL and LRU eviction
  getCache<T>(name: string, options?: CacheOptions): IntelligentCache<T>
  
  // Global cache management
  clearAll(): void
  getStats(): CacheStats
  setGlobalTTL(ttl: number): void
}

interface CacheOptions {
  ttl?: number;          // Time to live in milliseconds
  maxSize?: number;      // Maximum cache entries
  enableBatching?: boolean; // Enable batch operations
}
```

---

## 🎣 **React Hooks Architecture**

### **Component Loading Hooks**

#### **`useOptimizedComponents.ts`**
```typescript
export const useOptimizedComponents = () => {
  // Enhanced component loading with intelligent caching
  const fetchComponents = useCallback(async (forceRefresh: boolean = false) => {
    // Check cache first, batch load from database
    // Pre-warm category and room type caches
  }, []);
  
  return {
    components: DatabaseComponent[],
    loading: boolean,
    error: string | null,
    getComponentsByRoomType: (roomType: RoomType) => DatabaseComponent[],
    getComponentsByCategory: (category: string, roomType?: RoomType) => DatabaseComponent[],
    getCategoriesForRoomType: (roomType: RoomType) => string[],
    refreshComponents: () => Promise<void>
  };
};
```

#### **`useComponentBehavior.ts`**
```typescript
export const useComponentBehavior = (componentType: string) => {
  // Get component behavior from database with caching
  return {
    behavior: ComponentBehavior | null,
    loading: boolean,
    error: string | null,
    // Convenience getters matching old COMPONENT_DATA structure
    mountType: 'floor' | 'wall',
    hasDirection: boolean,
    doorSide: string,
    defaultDepth: number,
    defaultZ: number,
    elevationHeight?: number
  };
};
```

### **Mobile Support Hooks**

#### **`useIsMobile.ts`**
```typescript
export function useIsMobile() {
  // Detects mobile based on 768px breakpoint
  // Uses matchMedia for responsive updates
  return boolean;
}
```

#### **`useTouchEvents.ts`**
```typescript
export const useTouchEvents = (props: UseTouchEventsProps) => {
  // Comprehensive touch event handling
  // Supports: single touch, pinch-to-zoom, long press
  return {
    attachTouchEvents: (element: HTMLElement) => () => void // cleanup function
  };
};

interface UseTouchEventsProps {
  onTouchStart?: (point: TouchPoint, event: TouchEvent) => void;
  onTouchMove?: (point: TouchPoint, event: TouchEvent) => void;
  onTouchEnd?: (point: TouchPoint, event: TouchEvent) => void;
  onPinchStart?: (distance: number, center: TouchPoint, event: TouchEvent) => void;
  onPinchMove?: (distance: number, scale: number, center: TouchPoint, event: TouchEvent) => void;
  onPinchEnd?: (event: TouchEvent) => void;
  onLongPress?: (point: TouchPoint, event: TouchEvent) => void;
}
```

---

## 📱 **Mobile Architecture**

### **Responsive Layout System**
```typescript
// Designer.tsx - Main layout with mobile detection
const Designer = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Conditional rendering based on device */}
      {isMobile ? (
        <MobileDesignerLayout {...mobileProps} />
      ) : (
        <DesktopLayout {...desktopProps} />
      )}
    </div>
  );
};
```

### **Touch Interaction Patterns**
```typescript
// Mobile UX: Click-to-add instead of drag-and-drop
const handleMobileClickToAdd = (component: DatabaseComponent) => {
  const newElement: DesignElement = {
    id: `${component.component_id}-${Date.now()}`,
    type: component.type as any,
    x: 200, // Center-ish position
    y: 150, // Center-ish position
    z: 0,   // Will be set by component behavior logic
    width: component.width,
    height: component.height,
    depth: component.depth,
    rotation: 0,
    color: component.color || '#8B4513',
    name: component.name
  };
  
  onAddElement(newElement);
};
```

---

## 🎨 **3D Rendering Architecture**

### **Adaptive Performance System**
```typescript
// AdaptiveView3D.tsx - Performance-aware 3D rendering
export const AdaptiveView3D: React.FC<AdaptiveView3DProps> = ({ design, ... }) => {
  const [renderQuality, setRenderQuality] = useState<RenderQuality>('medium');
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  
  // Automatic performance detection
  useEffect(() => {
    const detectCapabilities = async () => {
      const capabilities = await performanceDetector.detectCapabilities();
      setDeviceCapabilities(capabilities);
      setRenderQuality(capabilities.recommendedQuality);
    };
    
    detectCapabilities();
  }, []);
  
  // Quality-based element limiting
  const maxElements = renderQuality === 'high' ? 100 : renderQuality === 'medium' ? 50 : 25;
  const visibleElements = design.elements.slice(0, maxElements);
};
```

### **3D Model System**
```typescript
// EnhancedModels3D.tsx - Component 3D models
interface Enhanced3DModelProps {
  element: DesignElement;
  roomDimensions: { width: number; height: number };
  isSelected: boolean;
  onClick: () => void;
}

// Coordinate conversion accounting for wall thickness
const convertTo3D = (x: number, y: number, roomWidth: number, roomHeight: number) => {
  const WALL_THICKNESS_CM = 10; // 10cm wall thickness
  const WALL_THICKNESS_METERS = WALL_THICKNESS_CM / 100;
  
  // Map 2D inner room coordinates to 3D world space
  const roomWidthMeters = roomWidth / 100;
  const roomHeightMeters = roomHeight / 100;
  
  const halfWallThickness = WALL_THICKNESS_METERS / 2;
  const innerLeftBoundary = -roomWidthMeters / 2 + halfWallThickness;
  const innerRightBoundary = roomWidthMeters / 2 - halfWallThickness;
  const innerBackBoundary = -roomHeightMeters / 2 + halfWallThickness;
  const innerFrontBoundary = roomHeightMeters / 2 - halfWallThickness;
  
  const xRange = innerRightBoundary - innerLeftBoundary;
  const zRange = innerFrontBoundary - innerBackBoundary;
  
  return {
    x: innerLeftBoundary + (x / roomWidth) * xRange,
    z: innerBackBoundary + (y / roomHeight) * zRange
  };
};
```

---

## 🎯 **TypeScript Interfaces**

### **Core Data Types**
```typescript
// project.ts - Core interfaces
export interface DesignElement {
  id: string;
  name?: string;
  type: 'wall' | 'cabinet' | 'appliance' | 'counter-top' | 'end-panel' | 'window' | 'door' | 'flooring' | 'toe-kick' | 'cornice' | 'pelmet' | 'wall-unit-end-panel';
  x: number;        // X position in room
  y: number;        // Y position in room  
  z?: number;       // Z position in room (height off ground)
  width: number;    // X-axis dimension (left-to-right)
  depth: number;    // Y-axis dimension (front-to-back)
  height: number;   // Z-axis dimension (bottom-to-top)
  rotation: number;
  style?: string;
  color?: string;
  material?: string;
}

export interface DatabaseComponent {
  id: string;
  component_id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  depth: number;
  color: string;
  category: string;
  room_types: string[];
  icon_name: string;
  description: string;
  version: string;
  deprecated: boolean;
  metadata: any;
  tags: string[];
}

export interface Design {
  id: string;
  name: string;
  elements: DesignElement[];
  roomDimensions: RoomDimensions;
  roomType: RoomType;
}

export interface RoomDimensions {
  width: number;
  height: number;
  ceilingHeight?: number; // Added in v2.5 for ceiling height control
}
```

---

## ⚡ **Performance Optimizations**

### **Bundle Optimization**
- **Code Splitting**: React, Three.js, UI components in separate chunks
- **Lazy Loading**: Three.js loads only when 3D view accessed
- **Dynamic Imports**: Route-based code splitting
- **Tree Shaking**: Unused code elimination
- **Result**: 47% bundle size reduction

### **Memory Management**
```typescript
// MemoryManager.ts - Automatic resource cleanup
export class MemoryManager {
  // Three.js resource disposal
  static disposeGeometry(geometry: THREE.BufferGeometry): void
  static disposeMaterial(material: THREE.Material | THREE.Material[]): void
  static disposeTexture(texture: THREE.Texture): void
  
  // Cache size monitoring
  static monitorMemoryUsage(): void
  static clearCaches(): void
  
  // Event listener cleanup
  static cleanupEventListeners(): void
}
```

### **Intelligent Caching**
```typescript
// Multi-layer caching strategy
const componentCache = cacheManager.getCache<DatabaseComponent[]>('all-components', {
  ttl: 10 * 60 * 1000,  // 10 minutes
  maxSize: 1000,
  enableBatching: true
});

const behaviorCache = cacheManager.getCache<ComponentBehavior>('component-behavior', {
  ttl: 10 * 60 * 1000,  // 10 minutes
  maxSize: 500,
  enableBatching: true
});
```

---

## 🔒 **Security Architecture**

### **Row Level Security (RLS)**
```sql
-- Projects are only viewable by their owners
CREATE POLICY "Projects are viewable by owner" ON projects
  FOR SELECT USING (auth.uid() = user_id);

-- Room designs inherit project permissions
CREATE POLICY "Room designs are viewable by project owner" ON room_designs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = room_designs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Components are viewable by all authenticated users
CREATE POLICY "Components are viewable by authenticated users" ON components
  FOR SELECT TO authenticated USING (true);
```

### **Input Validation**
- **TypeScript interfaces** for compile-time validation
- **Zod schemas** for runtime validation
- **Supabase RLS** for database-level security
- **XSS prevention** through safe DOM manipulation

---

## 📊 **Monitoring & Analytics**

### **Performance Monitoring**
```typescript
// PerformanceMonitor.tsx - Real-time monitoring
export const PerformanceMonitor: React.FC = () => {
  const [fps, setFps] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  
  // Real-time FPS monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }, []);
};
```

---

This technical architecture provides the foundation for understanding how RightFit Interior Designer is built, how components are managed, and how the system scales for professional use while maintaining excellent performance across devices.
