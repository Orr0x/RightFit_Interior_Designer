# 🧩 Component System Guide - RightFit Interior Designer

## 📋 **Component System Overview**

RightFit Interior Designer uses a sophisticated, database-driven component system that manages 154+ professional interior design components across 8 room types. This guide provides everything needed to understand, create, and manage components.

---

## 🏗️ **Component Architecture**

### **Database-Driven Design**
- **Single Source of Truth**: All components stored in Supabase PostgreSQL
- **Behavior System**: Separate behavior properties for mounting, positioning, and rendering
- **Version Control**: Component versioning with deprecation management
- **Flexible Metadata**: JSONB columns for extensible properties
- **Performance Optimized**: Intelligent caching with TTL and LRU eviction

### **Component Lifecycle**
1. **Database Storage**: Component data and behaviors
2. **Service Layer**: ComponentService handles caching and batch loading
3. **React Hooks**: useOptimizedComponents loads and filters components
4. **UI Rendering**: CompactComponentSidebar displays components
5. **3D Models**: EnhancedModels3D renders 3D representations

---

## 📊 **DatabaseComponent Interface**

### **Core Properties**
```typescript
interface DatabaseComponent {
  // Identity
  id: string;                    // Auto-generated UUID
  component_id: string;          // Unique identifier (e.g., 'base-cabinet-60cm')
  name: string;                  // Display name (e.g., 'Base Cabinet 60cm')
  description: string | null;    // Component description
  
  // Classification
  type: string;                  // Component type (cabinet, appliance, etc.)
  category: string;              // Category (base-cabinets, wall-units, etc.)
  room_types: string[];          // Applicable room types ['kitchen', 'bedroom']
  
  // Physical Dimensions (in centimeters)
  width: number;                 // X-axis dimension (left-to-right)
  height: number;                // Z-axis dimension (bottom-to-top)
  depth: number;                 // Y-axis dimension (front-to-back)
  
  // Visual Properties
  icon_name: string;             // Lucide icon name for UI
  model_url: string | null;      // 3D model URL (future feature)
  thumbnail_url: string | null;  // Component thumbnail
  color?: string;                // Default color (optional)
  
  // Business Properties
  price: number | null;          // Component price (future feature)
  version: string;               // Version control
  deprecated: boolean;           // Deprecation flag
  
  // Flexible Properties
  tags: string[] | null;         // Searchable tags
  metadata: any;                 // Flexible metadata (JSONB)
  
  // Timestamps
  created_at: string;
  updated_at: string;
}
```

### **Component Behavior Properties**
```typescript
// Stored as separate columns in database
interface ComponentBehavior {
  // Mounting & Positioning
  mount_type: 'floor' | 'wall';              // Where component mounts
  has_direction: boolean;                     // Has directional orientation
  door_side: 'front' | 'back' | 'left' | 'right'; // Door/opening side
  default_z_position: number;                // Default height off floor (cm)
  elevation_height?: number;                 // Height in elevation view (if different)
  
  // Advanced Configuration
  corner_configuration: object;              // Corner-specific config (JSONB)
  component_behavior: object;                // Extensible behaviors (JSONB)
}
```

---

## 🎯 **Component Types & Categories**

### **Component Types**
- **`cabinet`**: All types of cabinetry (base, wall, tall)
- **`appliance`**: Kitchen and utility appliances
- **`counter-top`**: Horizontal work surfaces
- **`end-panel`**: Cabinet end panels and finishing
- **`window`**: Window openings
- **`door`**: Door openings
- **`flooring`**: Floor materials and finishes
- **`toe-kick`**: Cabinet toe kicks
- **`cornice`**: Crown molding and cornice
- **`pelmet`**: Pelmet boards and valances
- **`wall-unit-end-panel`**: Wall unit end panels

### **Categories by Room Type**

#### **Kitchen Categories**
- **`base-cabinets`**: Floor-mounted storage (30-80cm widths)
- **`base-drawers`**: Pan drawer units (50-80cm widths)
- **`wall-units`**: Wall-mounted cabinets (30-80cm widths)
- **`appliances`**: Built-in and freestanding appliances
- **`kitchen-larder`**: Tall storage units (200-244cm height)
- **`finishing`**: Cornice, pelmet, toe-kick, end panels

#### **Bedroom Categories**
- **`bedroom-storage`**: Wardrobes, drawers, floating units
- **`bedroom-furniture`**: Beds, seating, reading chairs
- **`bedroom-props`**: Lamps, mirrors, rugs, curtains

#### **Bathroom Categories**
- **`bathroom-fixtures`**: Toilets, baths, showers, bidets
- **`bathroom-vanities`**: Vanity units (40-120cm widths)
- **`bathroom-storage`**: Bathroom storage solutions
- **`bathroom-props`**: Mirrors, towel rails, accessories

#### **Universal Categories**
- **`counter-tops`**: Available in all rooms
- **`end-panels`**: Available in all rooms
- **`doors-windows`**: Architectural elements
- **`flooring`**: Floor materials and finishes

---

## 🛠️ **Creating New Components**

### **Step 1: Database Entry**
```sql
INSERT INTO public.components (
  component_id,
  name,
  description,
  type,
  category,
  width,
  height,
  depth,
  room_types,
  icon_name,
  version,
  deprecated,
  
  -- Behavior properties
  mount_type,
  has_direction,
  door_side,
  default_z_position,
  elevation_height,
  corner_configuration,
  component_behavior
) VALUES (
  'new-component-id',
  'New Component Name',
  'Component description',
  'cabinet',
  'base-cabinets',
  60,    -- width (cm)
  85,    -- height (cm)
  60,    -- depth (cm)
  ARRAY['kitchen', 'utility'],
  'Box', -- Lucide icon name
  '1.0',
  false,
  
  -- Behavior properties
  'floor',           -- mount_type
  true,             -- has_direction
  'front',          -- door_side
  0,                -- default_z_position
  85,               -- elevation_height
  '{}',             -- corner_configuration
  '{}'              -- component_behavior
);
```

### **Step 2: Icon Integration**
```typescript
// In CompactComponentSidebar.tsx - getIconComponent function
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    // Existing icons...
    'Box': Box,
    'NewIcon': NewIcon, // Add your new icon here
    // ...
  };
  
  return iconMap[iconName] || Box; // Default fallback
};
```

### **Step 3: 3D Model Creation**
```typescript
// In EnhancedModels3D.tsx - Create new 3D model component
export const EnhancedNewComponent3D: React.FC<Enhanced3DModelProps> = ({
  element,
  roomDimensions,
  isSelected,
  onClick
}) => {
  const validatedElement = validateElementDimensions(element);
  const { x, z } = convertTo3D(
    validatedElement.x, 
    validatedElement.y, 
    roomDimensions.width, 
    roomDimensions.height
  );

  return (
    <group
      position={[x, validatedElement.z / 100, z]}
      rotation={[0, (validatedElement.rotation * Math.PI) / 180, 0]}
      onClick={onClick}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[
          validatedElement.width / 100,
          validatedElement.height / 100,
          validatedElement.depth / 100
        ]} />
        <meshLambertMaterial 
          color={isSelected ? '#ff6b6b' : validatedElement.color || '#8B4513'} 
        />
      </mesh>
      
      {/* Add additional geometry for complex shapes */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[
            new THREE.BoxGeometry(
              validatedElement.width / 100,
              validatedElement.height / 100,
              validatedElement.depth / 100
            )
          ]} />
          <lineBasicMaterial color="#ff6b6b" />
        </lineSegments>
      )}
    </group>
  );
};
```

### **Step 4: 3D Model Integration**
```typescript
// In AdaptiveView3D.tsx - Add to switch statement
switch (element.type) {
  case 'cabinet':
    return (
      <EnhancedCabinet3D
        key={element.id}
        element={element}
        roomDimensions={roomDimensions}
        isSelected={isSelected}
        onClick={() => handleElementClick(element)}
      />
    );
  case 'new-component-type':
    return (
      <EnhancedNewComponent3D
        key={element.id}
        element={element}
        roomDimensions={roomDimensions}
        isSelected={isSelected}
        onClick={() => handleElementClick(element)}
      />
    );
  // ... other cases
}
```

---

## 🎨 **Component Behavior System**

### **Mount Types**
- **`floor`**: Component sits on the floor (base cabinets, appliances)
- **`wall`**: Component mounts to wall (wall units, cornice, pelmet)

### **Direction & Door Configuration**
```typescript
// Example behavior configurations
const baseCabinetBehavior = {
  mount_type: 'floor',
  has_direction: true,      // Has front/back orientation
  door_side: 'front',       // Doors open from front
  default_z_position: 0,    // Sits on floor
  elevation_height: 85      // 85cm height in elevation view
};

const wallUnitBehavior = {
  mount_type: 'wall',
  has_direction: true,
  door_side: 'front',
  default_z_position: 140,  // 140cm height (bottom of wall unit)
  elevation_height: 70      // 70cm height in elevation view
};

const corniceBehavior = {
  mount_type: 'wall',
  has_direction: false,     // No directional orientation
  door_side: 'front',
  default_z_position: 200,  // 200cm height (top of wall units)
  elevation_height: null    // Use actual height
};
```

### **Corner Configuration**
```typescript
// For L-shaped corner components
const cornerConfiguration = {
  is_corner: true,
  door_width: 30,           // Door width in cm
  side_width: 60,           // Side panel width in cm
  corner_type: 'L-shaped'   // Corner type identifier
};

// For tall units that use actual height in elevation
const tallUnitBehavior = {
  use_actual_height_in_elevation: true,
  is_tall_unit: true
};
```

---

## 🔄 **Component Loading & Caching**

### **React Hook Usage**
```typescript
// In React components
const MyComponent = ({ roomType }: { roomType: RoomType }) => {
  const { 
    components, 
    loading, 
    error,
    getComponentsByCategory,
    getCategoriesForRoomType 
  } = useOptimizedComponents();

  // Filter components by room type and category
  const baseCabinets = getComponentsByCategory('base-cabinets', roomType);
  const categories = getCategoriesForRoomType(roomType);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {baseCabinets.map(component => (
        <ComponentCard key={component.id} component={component} />
      ))}
    </div>
  );
};
```

### **Component Behavior Loading**
```typescript
// Load component behavior data
const { behavior, loading, error } = useComponentBehavior('base-cabinet');

if (behavior) {
  console.log('Mount type:', behavior.mount_type);
  console.log('Default Z position:', behavior.default_z_position);
  console.log('Elevation height:', behavior.elevation_height);
}
```

---

## 📱 **Mobile Component Interaction**

### **Click-to-Add Pattern**
```typescript
// Mobile-optimized component addition
const handleMobileClickToAdd = (component: DatabaseComponent) => {
  console.log('📱 [Mobile Click-to-Add] Adding component:', component.name);
  
  const newElement: DesignElement = {
    id: `${component.component_id}-${Date.now()}`,
    type: component.type as any,
    x: 200, // Center-ish position (will be adjustable by dragging)
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
  
  // Update recently used components
  setRecentlyUsed(prev => {
    const updated = [component.component_id, ...prev.filter(id => id !== component.component_id)];
    return updated.slice(0, 5);
  });
};
```

---

## 🧪 **Component Testing Checklist**

### **Database Validation**
- [ ] Component appears in database query results
- [ ] All required fields populated correctly
- [ ] Room types array includes intended rooms
- [ ] Behavior properties set appropriately

### **UI Integration**
- [ ] Component appears in CompactComponentSidebar
- [ ] Icon displays correctly
- [ ] Category filtering works
- [ ] Room type filtering works
- [ ] Search functionality includes component

### **3D Rendering**
- [ ] 3D model renders correctly
- [ ] Dimensions match database values
- [ ] Positioning works in all room corners
- [ ] Selection highlighting works
- [ ] Rotation behaves correctly

### **Mobile Compatibility**
- [ ] Click-to-add works on mobile
- [ ] Touch interactions function properly
- [ ] Component card displays correctly in mobile layout
- [ ] No drag-and-drop conflicts

### **Performance**
- [ ] Component loads quickly from cache
- [ ] No memory leaks in 3D rendering
- [ ] Batch loading works efficiently
- [ ] Cache invalidation works correctly

---

## 🎯 **Best Practices**

### **Naming Conventions**
- **component_id**: Use kebab-case (e.g., 'base-cabinet-60cm')
- **name**: Use title case (e.g., 'Base Cabinet 60cm')
- **category**: Use kebab-case (e.g., 'base-cabinets')
- **type**: Use single word or kebab-case (e.g., 'cabinet', 'counter-top')

### **Dimension Standards**
- **Width increments**: 30, 40, 50, 60, 80cm for base cabinets
- **Standard heights**: 85cm (base), 70cm (wall), 200-244cm (tall)
- **Standard depths**: 60cm (base), 35cm (wall), 60cm (tall)

### **Room Type Associations**
- **Kitchen components**: Always include 'kitchen'
- **Universal components**: Include all relevant room types
- **Specialized components**: Only include specific room types

### **Performance Considerations**
- **Use caching**: ComponentService automatically caches behaviors
- **Batch operations**: Load multiple component behaviors together
- **Lazy loading**: 3D models load only when needed
- **Memory management**: Dispose of Three.js resources properly

---

This comprehensive guide provides everything needed to understand, create, and manage components in the RightFit Interior Designer system. The database-driven approach ensures scalability while maintaining excellent performance across all devices.
