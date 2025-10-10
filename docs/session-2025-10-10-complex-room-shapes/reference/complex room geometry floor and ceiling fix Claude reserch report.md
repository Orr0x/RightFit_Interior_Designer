# Three.js Floor/Ceiling Positioning for Architectural Room Renderer

## Root cause: Understanding geometry centers and rotation transforms

Your floor appears misaligned because **PlaneGeometry's center remains at its position coordinate after rotation**, but the geometry itself rotates around that center point. When you position a PlaneGeometry at `[0, 0, 0]` and rotate it by `[-Math.PI/2, 0, 0]`, the **surface of the plane is indeed at y=0**, not above or below it. However, with walls positioned at `[x, wallHeight/2, z]`, their bottoms are also at y=0, so they should align perfectly.

The actual problem in your code is likely **material sidedness** (the floor may only be visible from below) or **minor positioning offsets** in the complex polygon implementation. Additionally, your complex polygon floor has `elevation / 100 - 0.01` which introduces an arbitrary offset that breaks alignment.

## Critical geometry behavior: How rotation transforms work

### PlaneGeometry default orientation
- **Created in XY plane** (vertical, like a wall)
- **Faces +Z direction** (toward camera by default)
- **Pivot point at center** [0, 0, 0] in local space
- Width extends along X-axis, height along Y-axis

### What rotation={[-Math.PI/2, 0, 0]} actually does

The rotation matrix for -90° around X-axis is:
```
[1    0     0 ]
[0    0     1 ]
[0   -1     0 ]
```

This transforms each vertex `[x, y, z]` to `[x, z, -y]`:
- **X stays unchanged** (sideways position preserved)
- **Y becomes -Z** (what pointed up now points backward)  
- **Z becomes Y** (what pointed forward now points up)

**Result**: The plane rotates from vertical (XY plane) to horizontal (XZ plane). The **center stays at your position coordinate**, but the **surface is now at that Y-coordinate**, extending equally in all directions from the center.

### BoxGeometry vs PlaneGeometry positioning

**BoxGeometry** is always centered on its position:
- Position at `[0, wallHeight/2, 0]` → bottom at `y=0`, top at `y=wallHeight`
- This is correct for walls

**PlaneGeometry** after rotation to horizontal:
- Position at `[0, 0, 0]` with rotation `[-Math.PI/2, 0, 0]` → surface at `y=0`
- The normal vector points **downward (-Y direction)**

## Correct implementations with explanations

### 1. Simple rectangular floor (CORRECT IMPLEMENTATION)

```tsx
// ✅ CORRECT: Simple rectangular floor aligned with walls
<mesh 
  position={[0, 0, 0]} 
  rotation={[-Math.PI / 2, 0, 0]}
  receiveShadow
>
  <planeGeometry args={[roomWidth, roomDepth]} />
  <meshStandardMaterial 
    color={floorColor}
    side={THREE.DoubleSide}  // KEY: Visible from both above and below
  />
</mesh>

// Walls - positioned correctly with bottom at y=0
<mesh position={[0, wallHeight / 2, -roomDepth / 2]}>
  <boxGeometry args={[roomWidth, wallHeight, 0.1]} />
  <meshStandardMaterial color={wallColor} />
</mesh>
```

**Key parameters explained:**
- `position={[0, 0, 0]}`: Center of floor at ground level
- `rotation={[-Math.PI / 2, 0, 0]}`: Rotates plane from vertical to horizontal
- `side={THREE.DoubleSide}`: **Critical** - ensures visibility from above (default FrontSide may only show from below)
- `receiveShadow`: Enables shadow rendering on floor

**Why this works**: PlaneGeometry rotated -90° around X has its surface at the Y-coordinate of its position. With position at y=0 and walls with bottoms at y=0, they align perfectly.

### 2. Simple rectangular ceiling (CORRECT IMPLEMENTATION)

```tsx
// ✅ CORRECT: Ceiling aligned with wall tops
<mesh 
  position={[0, ceilingHeight, 0]} 
  rotation={[Math.PI / 2, 0, 0]}  // Positive rotation for upward-facing normal
  receiveShadow
>
  <planeGeometry args={[roomWidth, roomDepth]} />
  <meshStandardMaterial 
    color={ceilingColor}
    side={THREE.FrontSide}  // Only visible from below (inside room)
  />
</mesh>
```

**Key differences from floor:**
- `position.y = ceilingHeight`: Surface at ceiling height (e.g., 2.4 meters)
- `rotation={[Math.PI / 2, 0, 0]}`: **Positive** rotation makes normal point downward into room
- `side={THREE.FrontSide}`: Optimization - only render face visible from inside room

**For ceilingHeight of 2.4m**: Position at `[0, 2.4, 0]` aligns ceiling surface with wall tops at y=2.4

### 3. Complex polygon floor: L-shape, U-shape (CORRECT IMPLEMENTATION)

**Use ShapeGeometry (recommended) - lighter weight:**

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';

function ComplexFloor({ polygonPoints, floorColor }) {
  // Cache geometry to prevent recreation on every render
  const floorGeometry = useMemo(() => {
    // Create 2D shape from polygon points
    // Points should be in format: [{x: 0, z: 0}, {x: 10, z: 0}, ...]
    const shape = new THREE.Shape();
    
    if (polygonPoints.length > 0) {
      // Start at first point (using x,z for 2D shape, will rotate to horizontal)
      shape.moveTo(polygonPoints[0].x, polygonPoints[0].z);
      
      // Draw lines to remaining points
      for (let i = 1; i < polygonPoints.length; i++) {
        shape.lineTo(polygonPoints[i].x, polygonPoints[i].z);
      }
      
      shape.closePath();
    }
    
    return new THREE.ShapeGeometry(shape);
  }, [polygonPoints]);

  return (
    <mesh
      geometry={floorGeometry}
      position={[0, 0, 0]}  // Ground level, no arbitrary offsets
      rotation={[-Math.PI / 2, 0, 0]}  // Horizontal orientation
      receiveShadow
    >
      <meshStandardMaterial 
        color={floorColor}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
```

**Alternative: ExtrudeGeometry for visible thickness:**

```tsx
function ComplexFloorWithThickness({ polygonPoints, floorColor }) {
  const floorGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    if (polygonPoints.length > 0) {
      shape.moveTo(polygonPoints[0].x, polygonPoints[0].z);
      for (let i = 1; i < polygonPoints.length; i++) {
        shape.lineTo(polygonPoints[i].x, polygonPoints[i].z);
      }
      shape.closePath();
    }
    
    // Extrude with minimal depth for floor thickness
    const extrudeSettings = {
      steps: 1,
      depth: 0.02,  // 2cm thickness in meters
      bevelEnabled: false  // No beveling for clean edges
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [polygonPoints]);

  return (
    <mesh
      geometry={floorGeometry}
      position={[0, 0, 0]}  // ✅ CORRECT: No elevation/100 offset
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <meshStandardMaterial color={floorColor} />
    </mesh>
  );
}
```

**What was wrong in your original code:**
```tsx
// ❌ WRONG: Arbitrary offset breaks alignment
position={[centerOffset.x, elevation / 100 - 0.01, centerOffset.z]}

// ✅ CORRECT: Floor at ground level
position={[centerOffset.x, 0, centerOffset.z]}
```

The `elevation / 100 - 0.01` adds an unpredictable offset. Unless you have a specific use case for elevation (multi-story buildings), keep floor at y=0.

### 4. Complex polygon ceiling (CORRECT IMPLEMENTATION)

```tsx
function ComplexCeiling({ polygonPoints, ceilingHeight, ceilingColor }) {
  const ceilingGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    if (polygonPoints.length > 0) {
      shape.moveTo(polygonPoints[0].x, polygonPoints[0].z);
      for (let i = 1; i < polygonPoints.length; i++) {
        shape.lineTo(polygonPoints[i].x, polygonPoints[i].z);
      }
      shape.closePath();
    }
    
    return new THREE.ShapeGeometry(shape);
  }, [polygonPoints]);

  return (
    <mesh
      geometry={ceilingGeometry}
      position={[0, ceilingHeight, 0]}  // At ceiling height
      rotation={[Math.PI / 2, 0, 0]}    // Upward-facing normal
      receiveShadow
    >
      <meshStandardMaterial 
        color={ceilingColor}
        side={THREE.FrontSide}  // Only visible from below
      />
    </mesh>
  );
}
```

## Geometry selection best practices

### When to use each geometry type

**PlaneGeometry** - Use for 95% of architectural floors:
- ✅ **2 triangles** (minimal GPU cost)
- ✅ Simple rectangular rooms
- ✅ Best performance for mobile
- ✅ Easy texture mapping
- ❌ Can't handle complex polygons (L-shapes, U-shapes)

**ShapeGeometry** - Use for complex polygon rooms:
- ✅ **Handles any 2D polygon** (L-shape, U-shape, concave, convex)
- ✅ **Lightweight** (single flat surface)
- ✅ Supports holes via `shape.holes` array
- ✅ **Recommended for complex floors**
- ❌ Slightly more complex to create

**ExtrudeGeometry** - Use only when thickness must be visible:
- ✅ Adds depth to floors/ceilings
- ✅ Useful for multi-story buildings with visible floor slabs
- ✅ Better for architectural sections
- ❌ **5-10x more vertices** than ShapeGeometry
- ❌ Significant performance cost
- ❌ **Overkill for 95% of use cases**

**BoxGeometry** - Rarely use for floors:
- ❌ **12 triangles minimum** (6x more than PlaneGeometry)
- ❌ Renders invisible faces (bottom, sides)
- ❌ Worse performance
- ✅ Only use for thick floors in cutaway views

### Performance comparison (triangles per geometry)

| Geometry Type | Triangle Count | Use Case |
|--------------|----------------|----------|
| PlaneGeometry | **2** | Simple rectangular floors ⭐ |
| ShapeGeometry | **2-20** | Complex polygon floors ⭐ |
| BoxGeometry | **12** | Floors with visible thickness |
| ExtrudeGeometry | **10-100+** | Multi-story visible slabs |

**For production kitchen design app**: Use PlaneGeometry for rectangular rooms, ShapeGeometry for complex polygons. Avoid ExtrudeGeometry unless specifically showing floor thickness.

## Preventing gaps and z-fighting

### Z-fighting occurs when surfaces occupy the same position in 3D space, causing flickering

**Solution 1: Physical offset (RECOMMENDED)**

```tsx
// Floor slightly below y=0 to prevent z-fighting with wall bottoms
<mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
  <planeGeometry args={[roomWidth, roomDepth]} />
</mesh>

// Ceiling slightly below wallHeight
<mesh position={[0, wallHeight - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
  <planeGeometry args={[roomWidth, roomDepth]} />
</mesh>

// Walls positioned normally
<mesh position={[0, wallHeight / 2, z]}>
  <boxGeometry args={[wallWidth, wallHeight, 0.1]} />
</mesh>
```

**Offset strategy:**
- Use **0.001 to 0.01 meters** (1mm to 1cm)
- Visually imperceptible but eliminates z-fighting
- Works reliably across camera distances

**Solution 2: renderOrder for explicit control**

```tsx
<mesh renderOrder={0}>  {/* Floor renders first */}
  <planeGeometry args={[roomWidth, roomDepth]} />
</mesh>

<mesh renderOrder={1}>  {/* Walls render second */}
  <boxGeometry args={[wallWidth, wallHeight, 0.1]} />
</mesh>

<mesh renderOrder={2}>  {/* Ceiling renders last */}
  <planeGeometry args={[roomWidth, roomDepth]} />
</mesh>
```

## Coordinate transformation visual explanation

### Step-by-step: PlaneGeometry default → rotated → final position

**Initial state (before rotation):**
```
PlaneGeometry at [0, 0, 0]
├─ Width extends along X-axis: -width/2 to +width/2
├─ Height extends along Y-axis: -height/2 to +height/2
├─ Depth: z = 0 (flat)
├─ Normal: Points toward +Z (out of screen)
└─ Orientation: VERTICAL (like a wall)
```

**After rotation={[-Math.PI/2, 0, 0]} (clockwise around X-axis):**
```
Transformation matrix applies to each vertex [x, y, z]:
[x']   [1   0    0]   [x]   [x ]
[y'] = [0   0    1] × [y] = [z ]
[z']   [0  -1    0]   [z]   [-y]

Result:
├─ Width extends along X-axis: -width/2 to +width/2 (unchanged)
├─ Depth extends along Z-axis: -height/2 to +height/2 (was Y)
├─ Height: y = 0 (flat surface)
├─ Normal: Points toward -Y (downward into ground)
└─ Orientation: HORIZONTAL (floor)
```

**Final visualization:**
```
Top view (looking down):        Side view (looking from +X):
      +Z                              +Y
       ↑                               ↑
       |                               |
-X ←---+---→ +X                  ------+------ (floor surface at y=0)
       |                               |
       ↓                               ↓
      -Z                              -Y
```

## Complete architectural room example

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

function ArchitecturalRoom({ 
  roomWidth = 8,      // meters
  roomDepth = 6,      // meters
  wallHeight = 2.4,   // meters (standard ceiling)
  wallThickness = 0.1 // meters
}) {
  // Cache geometries for performance
  const floorGeometry = useMemo(() => 
    new THREE.PlaneGeometry(roomWidth, roomDepth), 
    [roomWidth, roomDepth]
  );
  
  const ceilingGeometry = useMemo(() => 
    new THREE.PlaneGeometry(roomWidth, roomDepth),
    [roomWidth, roomDepth]
  );

  return (
    <group>
      {/* Floor - aligned at y=0 */}
      <mesh 
        geometry={floorGeometry}
        position={[0, -0.001, 0]}  // Slight offset prevents z-fighting
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color="#f5f5f5"
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ceiling - aligned at y=wallHeight */}
      <mesh 
        geometry={ceilingGeometry}
        position={[0, wallHeight - 0.001, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color="#ffffff"
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, wallHeight / 2, -roomDepth / 2]}>
        <boxGeometry args={[roomWidth, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-roomWidth / 2, wallHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, roomDepth]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>

      {/* Right wall */}
      <mesh position={[roomWidth / 2, wallHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, roomDepth]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
    </group>
  );
}

function App() {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 5, 5], fov: 50 }}
      dpr={Math.min(window.devicePixelRatio, 2)}  // Limit for mobile performance
    >
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.8}
        castShadow
      />
      
      <ArchitecturalRoom />
      
      {/* Debugging helpers (remove in production) */}
      <axesHelper args={[5]} />
      <gridHelper args={[20, 20]} position={[0, 0, 0]} />
      
      <OrbitControls />
    </Canvas>
  );
}
```

## Testing and verification techniques

### 1. Visual debugging with helpers

```tsx
// AxesHelper - Shows coordinate system
// Red=X, Green=Y, Blue=Z
<axesHelper args={[5]} />

// GridHelper - Shows floor grid for alignment verification
<gridHelper args={[20, 20]} position={[0, 0, 0]} />

// Add to specific objects to see their local coordinate system
<mesh ref={floorRef}>
  <planeGeometry />
  <primitive object={new THREE.AxesHelper(2)} />
</mesh>
```

### 2. Verify exact positioning in console

```tsx
import { useEffect, useRef } from 'react';

function Floor() {
  const meshRef = useRef();
  
  useEffect(() => {
    if (meshRef.current) {
      console.log('Floor position:', meshRef.current.position);
      console.log('Floor rotation:', meshRef.current.rotation);
      
      // Get world position (accounts for parent transforms)
      const worldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPos);
      console.log('Floor world position:', worldPos);
    }
  }, []);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10]} />
    </mesh>
  );
}
```

### 3. Wireframe mode for geometry inspection

```tsx
// Temporarily enable to see geometry structure
<meshStandardMaterial wireframe color="red" />
```

### 4. Check renderer performance

```tsx
import { useFrame, useThree } from '@react-three/fiber';

function PerformanceMonitor() {
  const gl = useThree((state) => state.gl);
  
  useFrame(() => {
    // Log every 60 frames
    if (gl.info.render.frame % 60 === 0) {
      console.log('Draw calls:', gl.info.render.calls);
      console.log('Triangles:', gl.info.render.triangles);
      console.log('Geometries:', gl.info.memory.geometries);
    }
  });
  
  return null;
}
```

## Production optimization checklist

### For mobile/low-end GPUs

**Critical optimizations:**

1. **Limit pixel ratio** (2-5x performance gain on high-DPI devices):
```tsx
<Canvas dpr={Math.min(window.devicePixelRatio, 2)}>
```

2. **Cache geometries with useMemo** (prevents recreation every render):
```tsx
const geometry = useMemo(() => new THREE.PlaneGeometry(10, 10), []);
```

3. **Share materials** (reduces GPU state changes):
```tsx
const wallMaterial = useMemo(() => 
  new THREE.MeshLambertMaterial({ color: '#e8e8e8' }), 
  []
);

// Use same material for all walls
<mesh material={wallMaterial} />
<mesh material={wallMaterial} />
```

4. **Use simpler materials on mobile**:
```tsx
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

const material = isMobile
  ? new THREE.MeshLambertMaterial({ color: '#fff' })  // Cheaper
  : new THREE.MeshStandardMaterial({ color: '#fff' }); // Better quality
```

5. **Minimize light count** (1-2 lights for mobile):
```tsx
// Desktop: multiple lights
<ambientLight intensity={0.4} />
<directionalLight intensity={0.8} />
<pointLight position={[2, 2, 2]} />

// Mobile: simplified lighting
<ambientLight intensity={0.6} />
<directionalLight intensity={0.6} />
```

6. **Merge geometries to reduce draw calls**:
```tsx
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

const mergedGeometry = useMemo(() => {
  const geometries = [floorGeo, wall1Geo, wall2Geo, ceilingGeo];
  return BufferGeometryUtils.mergeGeometries(geometries);
}, []);

<mesh geometry={mergedGeometry} material={sharedMaterial} />
```

**Target metrics:**
- **Mobile**: 30-60 FPS, <50 draw calls
- **Desktop**: 60+ FPS, <100 draw calls

### Performance monitoring

```tsx
import { PerformanceMonitor } from '@react-three/drei';

<Canvas>
  <PerformanceMonitor
    onIncline={() => console.log('Performance good')}
    onDecline={() => console.log('Performance degrading')}
    flipflops={3}  // Number of changes before callback
    onFallback={() => console.log('Critical performance issue')}
  >
    <Room />
  </PerformanceMonitor>
</Canvas>
```

## Summary: Key takeaways

**Root cause of your issue:**
1. PlaneGeometry rotated to horizontal has its **surface at the Y-coordinate of position**, not above/below
2. Material **sidedness** (use `side={THREE.DoubleSide}` for floors visible from above)
3. The arbitrary `elevation / 100 - 0.01` offset in your complex polygon code breaks alignment

**Correct positioning formulas:**
- **Floor**: `position={[0, 0, 0]}` with `rotation={[-Math.PI/2, 0, 0]}`
- **Ceiling**: `position={[0, wallHeight, 0]}` with `rotation={[Math.PI/2, 0, 0]}`
- **Walls**: `position={[x, wallHeight/2, z]}` with BoxGeometry (centers at position)

**Geometry selection:**
- **Simple rectangular rooms** (95% of users): PlaneGeometry
- **Complex polygon rooms** (5% high-value users): ShapeGeometry
- **Avoid ExtrudeGeometry** unless floor thickness must be visible (massive performance cost)

**Critical fixes for your code:**
1. Add `side={THREE.DoubleSide}` to floor material
2. Remove `elevation / 100 - 0.01` offset (use `position.y = 0` unless multi-story)
3. Add small offset (0.001m) to prevent z-fighting: `position={[0, -0.001, 0]}`
4. Cache geometries with `useMemo` for performance
5. Limit `dpr` to 2 maximum for mobile performance