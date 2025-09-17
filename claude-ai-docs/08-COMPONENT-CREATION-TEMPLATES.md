# 🧩 Component Creation Templates - RightFit Interior Designer

## 🎯 **Overview**

This document provides comprehensive templates and examples for creating new components in RightFit Interior Designer. Use these templates with Claude.ai artifacts to design and implement new components following established patterns.

---

## 📋 **Step-by-Step Component Creation Process**

### **Step 1: Database Entry Template**

```sql
-- Template for adding new component to database
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
  tags,
  metadata,
  
  -- Behavior Properties
  mount_type,
  has_direction,
  door_side,
  default_z_position,
  elevation_height,
  corner_configuration,
  component_behavior
) VALUES (
  'new-component-id',              -- Unique kebab-case identifier
  'New Component Name',            -- Display name (title case)
  'Component description text',    -- User-friendly description
  'cabinet',                       -- Component type (cabinet, appliance, etc.)
  'base-cabinets',                -- Category (kebab-case)
  60,                             -- Width in cm (X-axis)
  85,                             -- Height in cm (Z-axis)
  60,                             -- Depth in cm (Y-axis)
  ARRAY['kitchen', 'utility'],    -- Applicable room types
  'Box',                          -- Lucide icon name
  '1.0',                          -- Version string
  false,                          -- Not deprecated
  ARRAY['storage', 'cabinet'],    -- Searchable tags
  '{}',                           -- Metadata (JSONB)
  
  -- Behavior Properties
  'floor',                        -- mount_type: 'floor' or 'wall'
  true,                           -- has_direction: boolean
  'front',                        -- door_side: 'front', 'back', 'left', 'right'
  0,                              -- default_z_position: height off floor (cm)
  85,                             -- elevation_height: height in elevation view (cm)
  '{}',                           -- corner_configuration: JSONB for corner components
  '{}'                            -- component_behavior: extensible behaviors (JSONB)
);
```

### **Step 2: Icon Integration Template**

```typescript
// Add to CompactComponentSidebar.tsx - getIconComponent function
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    // Existing icons...
    'Box': Box,
    'Package': Package,
    'Home': Home,
    'Sofa': Sofa,
    
    // ADD NEW ICON HERE
    'NewIconName': NewIconName,  // Import from lucide-react
    
    // Default fallback
    'default': Box
  };
  
  return iconMap[iconName] || iconMap['default'];
};
```

### **Step 3: 3D Model Template**

```typescript
// Add to EnhancedModels3D.tsx - New 3D component model
import React from 'react';
import * as THREE from 'three';
import { DesignElement } from '@/types/project';

interface Enhanced3DModelProps {
  element: DesignElement;
  roomDimensions: { width: number; height: number };
  isSelected: boolean;
  onClick: () => void;
}

export const Enhanced[ComponentName]3D: React.FC<Enhanced3DModelProps> = ({
  element,
  roomDimensions,
  isSelected,
  onClick
}) => {
  // Validate and sanitize element dimensions
  const validatedElement = validateElementDimensions(element);
  
  // Convert 2D coordinates to 3D world coordinates
  const { x, z } = convertTo3D(
    validatedElement.x, 
    validatedElement.y, 
    roomDimensions.width, 
    roomDimensions.height
  );

  // Convert dimensions from cm to meters for Three.js
  const widthM = validatedElement.width / 100;
  const heightM = validatedElement.height / 100;
  const depthM = validatedElement.depth / 100;

  return (
    <group
      position={[x, validatedElement.z / 100, z]}
      rotation={[0, (validatedElement.rotation * Math.PI) / 180, 0]}
      onClick={onClick}
    >
      {/* Main component geometry */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[widthM, heightM, depthM]} />
        <meshLambertMaterial 
          color={isSelected ? '#ff6b6b' : validatedElement.color || '#8B4513'} 
        />
      </mesh>
      
      {/* Selection outline (only when selected) */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[
            new THREE.BoxGeometry(widthM, heightM, depthM)
          ]} />
          <lineBasicMaterial color="#ff6b6b" linewidth={2} />
        </lineSegments>
      )}
      
      {/* Additional details for complex components */}
      {/* Add handles, doors, panels, etc. here */}
    </group>
  );
};
```

### **Step 4: 3D Model Integration Template**

```typescript
// Add to AdaptiveView3D.tsx - Switch statement integration
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
  
  // ADD NEW COMPONENT TYPE HERE
  case 'new-component-type':
    return (
      <Enhanced[ComponentName]3D
        key={element.id}
        element={element}
        roomDimensions={roomDimensions}
        isSelected={isSelected}
        onClick={() => handleElementClick(element)}
      />
    );
  
  // ... other cases
  default:
    console.warn(`Unknown element type: ${element.type}`);
    return null;
}
```

---

## 🏗️ **Component Type Templates**

### **Base Cabinet Template**
```sql
INSERT INTO public.components VALUES (
  gen_random_uuid(),
  'base-cabinet-custom',
  'Custom Base Cabinet',
  'Custom base cabinet with doors',
  'cabinet',
  'base-cabinets',
  60,    -- Width (30-80cm typical)
  85,    -- Height (85cm standard)
  60,    -- Depth (60cm standard)
  ARRAY['kitchen', 'utility'],
  'Package',
  NULL,  -- model_url
  NULL,  -- thumbnail_url
  NULL,  -- price
  '1.0',
  false,
  ARRAY['storage', 'base', 'cabinet'],
  '{"material": "wood", "finish": "oak"}',
  now(),
  now(),
  
  -- Behavior
  'floor',   -- Floor mounted
  true,      -- Has direction (doors face front)
  'front',   -- Doors on front
  0,         -- Sits on floor
  85,        -- 85cm height in elevation
  '{}',      -- Not a corner component
  '{"door_count": 2, "has_drawers": false}'
);
```

### **Wall Unit Template**
```sql
INSERT INTO public.components VALUES (
  gen_random_uuid(),
  'wall-unit-custom',
  'Custom Wall Unit',
  'Custom wall-mounted cabinet',
  'cabinet',
  'wall-units',
  60,    -- Width
  70,    -- Height (70cm typical)
  35,    -- Depth (35cm typical for wall units)
  ARRAY['kitchen'],
  'Box',
  NULL, NULL, NULL,
  '1.0', false,
  ARRAY['storage', 'wall', 'cabinet'],
  '{"material": "wood", "finish": "white"}',
  now(), now(),
  
  -- Behavior
  'wall',    -- Wall mounted
  true,      -- Has direction
  'front',   -- Doors face front
  140,       -- 140cm off floor (bottom of wall unit)
  70,        -- 70cm height in elevation
  '{}',
  '{"door_count": 2, "has_shelves": true}'
);
```

### **Appliance Template**
```sql
INSERT INTO public.components VALUES (
  gen_random_uuid(),
  'dishwasher-integrated',
  'Integrated Dishwasher',
  'Built-in dishwasher with panel ready front',
  'appliance',
  'appliances',
  60,    -- Standard dishwasher width
  85,    -- Counter height
  60,    -- Standard depth
  ARRAY['kitchen'],
  'Zap',
  NULL, NULL, NULL,
  '1.0', false,
  ARRAY['appliance', 'dishwasher', 'integrated'],
  '{"power": "2400W", "capacity": "12 place settings"}',
  now(), now(),
  
  -- Behavior
  'floor',   -- Floor mounted
  false,     -- No directional orientation (built-in)
  'front',   -- Control panel on front
  0,         -- Floor level
  85,        -- Counter height in elevation
  '{}',
  '{"requires_plumbing": true, "requires_electrical": true}'
);
```

### **Corner Component Template**
```sql
INSERT INTO public.components VALUES (
  gen_random_uuid(),
  'corner-base-cabinet-l',
  'L-Shaped Corner Base Cabinet',
  'Corner base cabinet with L-shaped configuration',
  'cabinet',
  'base-cabinets',
  90,    -- L-shaped components use 90x90 footprint
  85,    -- Standard base height
  90,    -- L-shaped depth
  ARRAY['kitchen'],
  'CornerDownLeft',
  NULL, NULL, NULL,
  '1.0', false,
  ARRAY['storage', 'base', 'cabinet', 'corner'],
  '{"shape": "L", "corner_type": "base"}',
  now(), now(),
  
  -- Behavior
  'floor',
  true,      -- Has directional orientation for door placement
  'front',   -- Default door side (will be calculated per corner)
  0,
  85,
  -- Corner configuration (CRITICAL for corner components)
  '{
    "is_corner": true,
    "door_width": 30,
    "side_width": 60,
    "corner_type": "L-shaped",
    "auto_rotate": true
  }',
  '{
    "door_count": 1,
    "has_lazy_susan": true,
    "corner_solution": "L-shaped"
  }'
);
```

---

## 🎨 **3D Model Examples**

### **Simple Box Component**
```typescript
export const EnhancedSimpleBox3D: React.FC<Enhanced3DModelProps> = ({
  element, roomDimensions, isSelected, onClick
}) => {
  const validatedElement = validateElementDimensions(element);
  const { x, z } = convertTo3D(validatedElement.x, validatedElement.y, roomDimensions.width, roomDimensions.height);

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
    </group>
  );
};
```

### **Cabinet with Doors**
```typescript
export const EnhancedCabinetWithDoors3D: React.FC<Enhanced3DModelProps> = ({
  element, roomDimensions, isSelected, onClick
}) => {
  const validatedElement = validateElementDimensions(element);
  const { x, z } = convertTo3D(validatedElement.x, validatedElement.y, roomDimensions.width, roomDimensions.height);

  const widthM = validatedElement.width / 100;
  const heightM = validatedElement.height / 100;
  const depthM = validatedElement.depth / 100;

  return (
    <group
      position={[x, validatedElement.z / 100, z]}
      rotation={[0, (validatedElement.rotation * Math.PI) / 180, 0]}
      onClick={onClick}
    >
      {/* Main cabinet body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[widthM, heightM, depthM]} />
        <meshLambertMaterial 
          color={isSelected ? '#ff6b6b' : validatedElement.color || '#8B4513'} 
        />
      </mesh>
      
      {/* Door frames (slightly inset) */}
      <group position={[0, 0, depthM / 2 + 0.01]}>
        {/* Left door */}
        <mesh>
          <boxGeometry args={[widthM / 2 - 0.01, heightM - 0.02, 0.02]} />
          <meshLambertMaterial color={isSelected ? '#ff6b6b' : '#654321'} />
        </mesh>
        
        {/* Right door */}
        <mesh position={[widthM / 2, 0, 0]}>
          <boxGeometry args={[widthM / 2 - 0.01, heightM - 0.02, 0.02]} />
          <meshLambertMaterial color={isSelected ? '#ff6b6b' : '#654321'} />
        </mesh>
        
        {/* Door handles */}
        <mesh position={[widthM / 4, 0, 0.02]}>
          <cylinderGeometry args={[0.005, 0.005, 0.03]} />
          <meshLambertMaterial color="#333" />
        </mesh>
        <mesh position={[-widthM / 4, 0, 0.02]}>
          <cylinderGeometry args={[0.005, 0.005, 0.03]} />
          <meshLambertMaterial color="#333" />
        </mesh>
      </group>
      
      {/* Selection outline */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(widthM, heightM, depthM)]} />
          <lineBasicMaterial color="#ff6b6b" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
};
```

### **L-Shaped Corner Component**
```typescript
export const EnhancedLShapeCorner3D: React.FC<Enhanced3DModelProps> = ({
  element, roomDimensions, isSelected, onClick
}) => {
  const validatedElement = validateElementDimensions(element);
  const { x, z } = convertTo3D(validatedElement.x, validatedElement.y, roomDimensions.width, roomDimensions.height);

  const widthM = validatedElement.width / 100;
  const heightM = validatedElement.height / 100;
  const depthM = validatedElement.depth / 100;

  return (
    <group
      position={[x, validatedElement.z / 100, z]}
      rotation={[0, (validatedElement.rotation * Math.PI) / 180, 0]}
      onClick={onClick}
    >
      {/* Main section (60cm x 60cm) */}
      <mesh castShadow receiveShadow position={[0.15, 0, 0.15]}>
        <boxGeometry args={[0.6, heightM, 0.6]} />
        <meshLambertMaterial 
          color={isSelected ? '#ff6b6b' : validatedElement.color || '#8B4513'} 
        />
      </mesh>
      
      {/* Extension section (30cm x 60cm) */}
      <mesh castShadow receiveShadow position={[-0.15, 0, 0.15]}>
        <boxGeometry args={[0.3, heightM, 0.6]} />
        <meshLambertMaterial 
          color={isSelected ? '#ff6b6b' : validatedElement.color || '#8B4513'} 
        />
      </mesh>
      
      {/* Door on the main section */}
      <mesh position={[0.15, 0, 0.46]}>
        <boxGeometry args={[0.28, heightM - 0.02, 0.02]} />
        <meshLambertMaterial color={isSelected ? '#ff6b6b' : '#654321'} />
      </mesh>
      
      {/* Door handle */}
      <mesh position={[0.05, 0, 0.48]}>
        <cylinderGeometry args={[0.005, 0.005, 0.03]} />
        <meshLambertMaterial color="#333" />
      </mesh>
      
      {/* Selection outline for L-shape */}
      {isSelected && (
        <group>
          <lineSegments position={[0.15, 0, 0.15]}>
            <edgesGeometry args={[new THREE.BoxGeometry(0.6, heightM, 0.6)]} />
            <lineBasicMaterial color="#ff6b6b" linewidth={2} />
          </lineSegments>
          <lineSegments position={[-0.15, 0, 0.15]}>
            <edgesGeometry args={[new THREE.BoxGeometry(0.3, heightM, 0.6)]} />
            <lineBasicMaterial color="#ff6b6b" linewidth={2} />
          </lineSegments>
        </group>
      )}
    </group>
  );
};
```

---

## 🧪 **Testing Templates**

### **Component Testing Checklist**
```typescript
// Testing checklist for new components
const componentTestingChecklist = {
  database: [
    'Component appears in database query results',
    'All required fields populated correctly',
    'Room types array includes intended rooms',
    'Behavior properties set appropriately',
    'Icon name maps to valid Lucide icon'
  ],
  
  ui: [
    'Component appears in CompactComponentSidebar',
    'Icon displays correctly in component card',
    'Category filtering works properly',
    'Room type filtering includes/excludes correctly',
    'Search functionality finds component by name and tags'
  ],
  
  rendering3D: [
    '3D model renders correctly in all views',
    'Dimensions match database values',
    'Positioning works in all room corners',
    'Selection highlighting works',
    'Rotation behaves correctly'
  ],
  
  mobile: [
    'Click-to-add works on mobile devices',
    'Touch interactions function properly',
    'Component card displays correctly in mobile layout',
    'No drag-and-drop conflicts on touch devices'
  ],
  
  performance: [
    'Component loads quickly from cache',
    'No memory leaks in 3D rendering',
    'Batch loading works efficiently',
    'Cache invalidation works correctly'
  ]
};
```

### **Manual Testing Script**
```typescript
// Manual testing procedures for new components
const manualTestingSteps = {
  step1: 'Load component in CompactComponentSidebar',
  step2: 'Verify icon and information display',
  step3: 'Test drag-and-drop placement (desktop)',
  step4: 'Test click-to-add placement (mobile)',
  step5: 'Verify 3D model rendering',
  step6: 'Test rotation and positioning',
  step7: 'Check elevation view rendering',
  step8: 'Validate selection and hover states',
  step9: 'Test in multiple room types',
  step10: 'Performance check with multiple instances'
};
```

---

## 📊 **Component Behavior Examples**

### **Floor-Mounted Component**
```json
{
  "mount_type": "floor",
  "has_direction": true,
  "door_side": "front",
  "default_z_position": 0,
  "elevation_height": 85,
  "corner_configuration": {},
  "component_behavior": {
    "door_count": 2,
    "has_drawers": false,
    "requires_assembly": true
  }
}
```

### **Wall-Mounted Component**
```json
{
  "mount_type": "wall",
  "has_direction": true,
  "door_side": "front",
  "default_z_position": 140,
  "elevation_height": 70,
  "corner_configuration": {},
  "component_behavior": {
    "door_count": 2,
    "has_shelves": true,
    "mounting_hardware": "included"
  }
}
```

### **Corner Component**
```json
{
  "mount_type": "floor",
  "has_direction": true,
  "door_side": "front",
  "default_z_position": 0,
  "elevation_height": 85,
  "corner_configuration": {
    "is_corner": true,
    "door_width": 30,
    "side_width": 60,
    "corner_type": "L-shaped",
    "auto_rotate": true
  },
  "component_behavior": {
    "door_count": 1,
    "has_lazy_susan": true,
    "corner_solution": "L-shaped",
    "access_type": "bi-fold doors"
  }
}
```

### **Appliance Component**
```json
{
  "mount_type": "floor",
  "has_direction": false,
  "door_side": "front",
  "default_z_position": 0,
  "elevation_height": 85,
  "corner_configuration": {},
  "component_behavior": {
    "requires_electrical": true,
    "requires_plumbing": false,
    "power_consumption": "1800W",
    "ventilation_required": false
  }
}
```

---

## 🎯 **Claude.ai Artifact Usage**

### **Database Entry Artifact**
When creating a new component, use Claude.ai artifacts to generate:
1. **SQL INSERT statement** with all required fields
2. **Component behavior JSON** with appropriate settings
3. **Testing checklist** customized for the component type

### **3D Model Artifact**
Create artifacts for:
1. **Complete 3D model component** following the template
2. **Integration code** for AdaptiveView3D.tsx
3. **Icon mapping** addition for CompactComponentSidebar.tsx

### **Documentation Artifact**
Generate artifacts for:
1. **Component specification** with dimensions and behaviors
2. **Installation instructions** for the component
3. **Testing procedures** specific to the component type

---

This comprehensive template system ensures consistent, high-quality component creation that integrates seamlessly with RightFit Interior Designer's architecture while maintaining performance and mobile compatibility.
