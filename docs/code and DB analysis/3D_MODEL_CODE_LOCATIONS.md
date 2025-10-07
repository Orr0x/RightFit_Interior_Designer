# 3D Model Code Locations - Complete Component Mapping

## 🎯 **Executive Summary**

**3D Model System**: **HARDCODED REACT COMPONENTS** ✅
- **Main File**: `src/components/designer/EnhancedModels3D.tsx` (1,949 lines)
- **Integration File**: `src/components/designer/AdaptiveView3D.tsx` (switch statement)
- **Total 3D Components**: 12 different component types
- **Implementation**: Static React components with Three.js
- **Database Integration**: **NONE** - All hardcoded

---

## 📁 **PRIMARY 3D MODEL FILE**

### **`src/components/designer/EnhancedModels3D.tsx`** (1,949 lines)

**Purpose**: Contains all 3D model component implementations
**Status**: ✅ **ACTIVE** - Main 3D rendering system
**Dependencies**: React, Three.js, DesignElement types

#### **File Structure**
```typescript
// Interface definition
interface Enhanced3DModelProps {
  element: DesignElement;
  roomDimensions: { width: number; height: number };
  isSelected: boolean;
  onClick: () => void;
}

// Helper functions
const convertTo3D = (x, y, roomWidth, roomHeight) => { ... }
const validateElementDimensions = (element) => { ... }
const getApplianceColor = (type, element) => { ... }

// 3D Model Components (12 total)
export const EnhancedCabinet3D = ...
export const EnhancedAppliance3D = ...
export const EnhancedCounterTop3D = ...
export const EnhancedEndPanel3D = ...
export const EnhancedWindow3D = ...
export const EnhancedDoor3D = ...
export const EnhancedFlooring3D = ...
export const EnhancedToeKick3D = ...
export const EnhancedCornice3D = ...
export const EnhancedPelmet3D = ...
export const EnhancedWallUnitEndPanel3D = ...
export const EnhancedSink3D = ...
```

---

## 🎨 **3D MODEL COMPONENTS DETAILED LOCATIONS**

### **1. Cabinet 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 114-683)
- **Function**: `EnhancedCabinet3D`
- **Type**: `'cabinet'`
- **Features**:
  - Realistic cabinet structure with frame, doors, and hardware
  - Material textures for wood grain, metal
  - Proper scale and proportions
  - Specialized rendering for different cabinet types
  - Wall cabinet vs base cabinet detection
  - Custom Z position support

**Key Code Sections**:
```typescript
// Lines 114-119: Function definition
export const EnhancedCabinet3D: React.FC<Enhanced3DModelProps> = ({ 
  element, 
  roomDimensions, 
  isSelected, 
  onClick 
}) => {

// Lines 123-127: Coordinate conversion
const { x, z } = convertTo3D(validElement.x, validElement.y, roomDimensions.width, roomDimensions.height);
const width = validElement.width / 100;  // Convert cm to meters
const depth = validElement.depth / 100;  // Convert cm to meters
const height = validElement.height / 100; // Convert cm to meters

// Lines 128-140: Cabinet type detection
const isWallCabinet = validElement.id.includes('wall') || 
                     validElement.id.includes('upper') ||
                     validElement.category === 'wall-units';

// Lines 162-170: Z position logic
if (validElement.z > 0) {
  baseHeight = validElement.z / 100; // Convert cm to meters
} else {
  baseHeight = isWallCabinet ? 2.0 : 0; // Wall cabinets at 200cm, base cabinets on floor
}
```

---

### **2. Appliance 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 694-1481)
- **Function**: `EnhancedAppliance3D`
- **Type**: `'appliance'`
- **Features**:
  - Realistic appliance models with detailed features
  - Material textures for metal, glass
  - Proper scale and proportions
  - Specialized rendering for different appliance types
  - **11 different appliance types** with unique rendering

**Key Code Sections**:
```typescript
// Lines 694-699: Function definition
export const EnhancedAppliance3D: React.FC<Enhanced3DModelProps> = ({ 
  element, 
  roomDimensions, 
  isSelected, 
  onClick 
}) => {

// Lines 711-723: Appliance type detection (HARDCODED)
const applianceType = element.id.includes('refrigerator') ? 'refrigerator' :
                    element.id.includes('dishwasher') ? 'dishwasher' :
                    element.id.includes('washing-machine') ? 'washing-machine' :
                    element.id.includes('tumble-dryer') ? 'tumble-dryer' :
                    element.id.includes('oven') ? 'oven' :
                    element.id.includes('toilet') ? 'toilet' :
                    element.id.includes('shower') ? 'shower' :
                    element.id.includes('bathtub') ? 'bathtub' :
                    element.id.includes('bed') ? 'bed' :
                    element.id.includes('sofa') ? 'sofa' :
                    element.id.includes('chair') ? 'chair' :
                    element.id.includes('table') ? 'table' :
                    element.id.includes('tv') ? 'tv' : 'generic';

// Lines 743-762: Color function
function getApplianceColor(type: string, element: DesignElement): string {
  if (element.color) return element.color;
  
  switch(type) {
    case 'refrigerator': return '#f8f8f8';
    case 'dishwasher': return '#e0e0e0';
    case 'oven': return '#d0d0d0';
    case 'washing-machine': return '#f0f0f0';
    case 'tumble-dryer': return '#e8e8e8';
    default: return '#cccccc';
  }
}
```

**Appliance Type Renderings** (Lines 765-1476):
- **Bed** (Lines 765-814): Frame, mattress, pillows
- **Sofa** (Lines 815-885): Base, cushions, backrest
- **Chair** (Lines 886-935): Seat, back, legs
- **Table** (Lines 936-991): Top and legs
- **TV** (Lines 992-1044): TV with stand
- **Refrigerator** (Lines 1045-1104): Enhanced with detailed features
- **Dishwasher** (Lines 1105-1166): Controls and door features
- **Oven** (Lines 1167-1246): Controls, window and door
- **Washing Machine** (Lines 1247-1334): Round door and controls
- **Tumble Dryer** (Lines 1335-1476): Round door and controls

---

### **3. Counter Top 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 1484-1507)
- **Function**: `EnhancedCounterTop3D`
- **Type**: `'counter-top'`
- **Features**: Basic countertop rendering

**Key Code**:
```typescript
// Lines 1484-1507: Simple countertop implementation
export const EnhancedCounterTop3D: React.FC<Enhanced3DModelProps> = ({ element, roomDimensions, isSelected, onClick }) => {
  const validElement = validateElementDimensions(element);
  const { x, z } = convertTo3D(validElement.x, validElement.y, roomDimensions.width, roomDimensions.height);
  const width = validElement.width / 100;
  const depth = validElement.depth / 100;
  const height = validElement.height / 100;
  const baseHeight = validElement.z / 100;
  const y = baseHeight + (height / 2);
  
  return (
    <group position={[x + width / 2, y, z + depth / 2]} onClick={onClick}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={isSelected ? '#ff6b6b' : '#8B4513'} />
      </mesh>
    </group>
  );
};
```

---

### **4. End Panel 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 1510-1532)
- **Function**: `EnhancedEndPanel3D`
- **Type**: `'end-panel'`
- **Features**: Basic end panel rendering

---

### **5. Window 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 1534-1557)
- **Function**: `EnhancedWindow3D`
- **Type**: `'window'`
- **Features**: Window with default height positioning

---

### **6. Door 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 1559-1581)
- **Function**: `EnhancedDoor3D`
- **Type**: `'door'`
- **Features**: Basic door rendering

---

### **7. Flooring 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 1583-1605)
- **Function**: `EnhancedFlooring3D`
- **Type**: `'flooring'`
- **Features**: Basic flooring rendering

---

### **8. Toe Kick 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 1607-1629)
- **Function**: `EnhancedToeKick3D`
- **Type**: `'toe-kick'`
- **Features**: Basic toe kick rendering

---

### **9. Cornice 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 1631-1655)
- **Function**: `EnhancedCornice3D`
- **Type**: `'cornice'`
- **Features**: Cornice with default height positioning

---

### **10. Pelmet 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 1657-1681)
- **Function**: `EnhancedPelmet3D`
- **Type**: `'pelmet'`
- **Features**: Pelmet with default height positioning

---

### **11. Wall Unit End Panel 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 1683-1706)
- **Function**: `EnhancedWallUnitEndPanel3D`
- **Type**: `'wall-unit-end-panel'`
- **Features**: Wall unit end panel with default height

---

### **12. Sink 3D Model**
- **Location**: `src/components/designer/EnhancedModels3D.tsx` (Lines 1709-1750)
- **Function**: `EnhancedSink3D`
- **Type**: `'sink'`
- **Features**: Professional sink model with realistic features

---

## 🔗 **3D MODEL INTEGRATION FILE**

### **`src/components/designer/AdaptiveView3D.tsx`** (681 lines)

**Purpose**: Integrates 3D models into the 3D view system
**Status**: ✅ **ACTIVE** - Main 3D view component
**Key Function**: Switch statement that maps component types to 3D models

#### **Import Section** (Lines 26-39)
```typescript
import { 
  EnhancedCabinet3D, 
  EnhancedAppliance3D, 
  EnhancedCounterTop3D, 
  EnhancedEndPanel3D,
  EnhancedWindow3D,
  EnhancedDoor3D,
  EnhancedFlooring3D,
  EnhancedToeKick3D,
  EnhancedCornice3D,
  EnhancedPelmet3D,
  EnhancedWallUnitEndPanel3D,
  EnhancedSink3D
} from './EnhancedModels3D';
```

#### **Component Type Mapping** (Lines 504-624)
```typescript
// Lines 504-624: Switch statement for component type mapping
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
  case 'appliance':
    return (
      <EnhancedAppliance3D
        key={element.id}
        element={element}
        roomDimensions={roomDimensions}
        isSelected={isSelected}
        onClick={() => handleElementClick(element)}
      />
    );
  case 'counter-top':
    return (
      <EnhancedCounterTop3D
        key={element.id}
        element={element}
        roomDimensions={roomDimensions}
        isSelected={isSelected}
        onClick={() => handleElementClick(element)}
      />
    );
  // ... more cases for each component type
}
```

---

## 🎯 **COMPONENT TYPE TO 3D MODEL MAPPING**

| Component Type | 3D Model Function | File Location | Lines | Status |
|----------------|-------------------|---------------|-------|--------|
| **`cabinet`** | `EnhancedCabinet3D` | EnhancedModels3D.tsx | 114-683 | ✅ Active |
| **`appliance`** | `EnhancedAppliance3D` | EnhancedModels3D.tsx | 694-1481 | ✅ Active |
| **`counter-top`** | `EnhancedCounterTop3D` | EnhancedModels3D.tsx | 1484-1507 | ✅ Active |
| **`end-panel`** | `EnhancedEndPanel3D` | EnhancedModels3D.tsx | 1510-1532 | ✅ Active |
| **`window`** | `EnhancedWindow3D` | EnhancedModels3D.tsx | 1534-1557 | ✅ Active |
| **`door`** | `EnhancedDoor3D` | EnhancedModels3D.tsx | 1559-1581 | ✅ Active |
| **`flooring`** | `EnhancedFlooring3D` | EnhancedModels3D.tsx | 1583-1605 | ✅ Active |
| **`toe-kick`** | `EnhancedToeKick3D` | EnhancedModels3D.tsx | 1607-1629 | ✅ Active |
| **`cornice`** | `EnhancedCornice3D` | EnhancedModels3D.tsx | 1631-1655 | ✅ Active |
| **`pelmet`** | `EnhancedPelmet3D` | EnhancedModels3D.tsx | 1657-1681 | ✅ Active |
| **`wall-unit-end-panel`** | `EnhancedWallUnitEndPanel3D` | EnhancedModels3D.tsx | 1683-1706 | ✅ Active |
| **`sink`** | `EnhancedSink3D` | EnhancedModels3D.tsx | 1709-1750 | ✅ Active |

---

## 🔧 **HELPER FUNCTIONS AND UTILITIES**

### **Coordinate Conversion** (Lines 17-86)
```typescript
// Location: EnhancedModels3D.tsx (Lines 17-86)
const convertTo3D = (x: number, y: number, roomWidth: number, roomHeight: number) => {
  // Converts 2D coordinates to 3D world coordinates
  // Accounts for wall thickness (10cm)
  // Maps to inner 3D space boundaries
}
```

### **Element Validation** (Lines 88-102)
```typescript
// Location: EnhancedModels3D.tsx (Lines 88-102)
const validateElementDimensions = (element: DesignElement) => {
  // Validates element dimensions to prevent NaN values
  // Ensures minimum dimensions
  // Returns validated element
}
```

### **Appliance Color Function** (Lines 743-762)
```typescript
// Location: EnhancedModels3D.tsx (Lines 743-762)
function getApplianceColor(type: string, element: DesignElement): string {
  // Returns appliance-specific colors
  // Falls back to element color if set
  // Provides default colors for each appliance type
}
```

---

## 📊 **3D MODEL SYSTEM ARCHITECTURE**

### **Data Flow**
```
DesignElement (from components table)
    ↓
AdaptiveView3D.tsx (switch statement)
    ↓
EnhancedModels3D.tsx (specific 3D component)
    ↓
Three.js rendering (mesh, geometry, materials)
    ↓
3D Scene (rendered in browser)
```

### **Key Dependencies**
- **React**: Component framework
- **Three.js**: 3D rendering library
- **@react-three/fiber**: React Three.js integration
- **@react-three/drei**: Three.js helpers
- **DesignElement**: Type definition from `@/types/project`

### **Rendering Pipeline**
1. **Element Type Detection**: Based on `element.type` property
2. **Component Selection**: Switch statement in `AdaptiveView3D.tsx`
3. **3D Model Rendering**: Specific component in `EnhancedModels3D.tsx`
4. **Coordinate Conversion**: 2D to 3D coordinate mapping
5. **Material Application**: Colors, textures, lighting
6. **Scene Integration**: Positioned in 3D scene

---

## 🚀 **INTEGRATION WITH COMPONENTS TABLE**

### **Current Integration**
- **Components Table**: 168 components with `type` field
- **3D Rendering**: Uses `element.type` to select 3D model
- **No Database Integration**: All 3D models are hardcoded

### **Component Type Distribution** (Estimated)
- **Cabinets**: ~80% (base-units, wall-units, tall-units)
- **Appliances**: ~15% (ovens, fridges, dishwashers)
- **Accessories**: ~5% (sinks, taps, handles)

### **Missing 3D Models**
- **Components without 3D models**: Will render as generic boxes
- **New component types**: Need new 3D model functions
- **Custom components**: Need custom 3D model implementations

---

## 💡 **KEY INSIGHTS**

1. **Single File System**: All 3D models in one 1,949-line file
2. **Hardcoded Implementation**: No database-driven 3D models
3. **Complete Coverage**: 12 component types with 3D models
4. **Appliance Specialization**: 11 different appliance types with unique rendering
5. **Coordinate System**: Sophisticated 2D to 3D coordinate conversion
6. **Material System**: Basic color and material application
7. **Performance**: Static components with Three.js optimization

**The 3D model system is well-organized in a single file with clear component type mapping. All 12 component types have dedicated 3D model implementations, with appliances having the most sophisticated rendering system.**
