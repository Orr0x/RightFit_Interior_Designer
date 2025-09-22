import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Text } from '@react-three/drei';
import { DesignElement, Design } from '@/types/project';

import * as THREE from 'three';
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

interface View3DProps {
  design: Design;
  selectedElement: DesignElement | null;
  onSelectElement: (element: DesignElement | null) => void;
  activeTool?: 'select' | 'fit-screen' | 'pan' | 'tape-measure' | 'none';
  showGrid?: boolean;
  fitToScreenSignal?: number;
}

// Convert 2D coordinates to 3D world coordinates accounting for wall thickness
const convertTo3D = (x: number, y: number, roomWidth: number, roomHeight: number) => {
  // Validate input parameters to prevent NaN values
  const safeX = isNaN(x) || x === undefined ? 0 : x;
  const safeY = isNaN(y) || y === undefined ? 0 : y;
  const safeRoomWidth = isNaN(roomWidth) || roomWidth === undefined ? 600 : roomWidth;
  const safeRoomHeight = isNaN(roomHeight) || roomHeight === undefined ? 400 : roomHeight;
  
  // CRITICAL FIX: Account for wall thickness in coordinate conversion
  // 2D coordinates now represent positions within the inner room bounds (usable space)
  // 3D room positioning needs to match this by offsetting for wall thickness
  const WALL_THICKNESS_CM = 10; // 10cm wall thickness (matches DesignCanvas2D)
  const WALL_THICKNESS_METERS = WALL_THICKNESS_CM / 100; // Convert to meters
  
  // Scale down the room to reasonable 3D size (divide by 100 to convert cm to meters-like units)
  const roomWidthMeters = safeRoomWidth / 100;
  const roomHeightMeters = safeRoomHeight / 100;
  
  // Convert 2D inner room coordinates to 3D world coordinates
  // 2D coordinates represent positions within the inner usable space (after wall thickness)
  // 3D needs to map these coordinates to the actual inner 3D space
  
  // Calculate the inner 3D room dimensions (subtracting wall thickness)
  const inner3DWidth = roomWidthMeters - WALL_THICKNESS_METERS;
  const inner3DHeight = roomHeightMeters - WALL_THICKNESS_METERS;
  
  // PRECISION FIX: Account for exact wall positioning
  // 2D coordinates represent positions within inner room bounds
  // 3D walls are positioned with their centers at ±roomWidth/2, ±roomHeight/2
  // Inner faces of walls are at ±(roomWidth/2 - wallThickness/2)
  
  const halfWallThickness = WALL_THICKNESS_METERS / 2; // 5cm in meters
  
  // Calculate 3D inner boundaries (where wall inner faces are)
  const innerLeftBoundary = -roomWidthMeters / 2 + halfWallThickness;   // Left wall inner face
  const innerRightBoundary = roomWidthMeters / 2 - halfWallThickness;   // Right wall inner face  
  const innerBackBoundary = -roomHeightMeters / 2 + halfWallThickness;  // Back wall inner face
  const innerFrontBoundary = roomHeightMeters / 2 - halfWallThickness;  // Front wall inner face
  
  // Map 2D coordinates directly to 3D inner space
  // 2D (0,0) maps to (innerLeftBoundary, innerBackBoundary)
  // 2D (roomWidth, roomHeight) maps to (innerRightBoundary, innerFrontBoundary)
  const xRange = innerRightBoundary - innerLeftBoundary;
  const zRange = innerFrontBoundary - innerBackBoundary;
  
  return {
    x: innerLeftBoundary + (safeX / safeRoomWidth) * xRange,
    z: innerBackBoundary + (safeY / safeRoomHeight) * zRange
  };
};


// Room Floor and Walls
const Room3D: React.FC<{ roomDimensions: { width: number; height: number; ceilingHeight?: number } }> = ({ roomDimensions }) => {
  const roomWidth = roomDimensions.width / 100;  // Convert cm to meters
  const roomDepth = roomDimensions.height / 100;
  const wallHeight = (roomDimensions.ceilingHeight || 240) / 100;  // Use ceiling height from room dimensions or default to 240cm

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[roomWidth, 0.02, roomDepth]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>
      
      {/* Back Wall */}
      <mesh position={[0, wallHeight / 2, -roomDepth / 2]} receiveShadow>
        <boxGeometry args={[roomWidth, wallHeight, 0.1]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      
      {/* Left Wall */}
      <mesh position={[-roomWidth / 2, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.1, wallHeight, roomDepth]} />
        <meshLambertMaterial color="#f8f8f8" />
      </mesh>
      
      {/* Right Wall */}
      <mesh position={[roomWidth / 2, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.1, wallHeight, roomDepth]} />
        <meshLambertMaterial color="#f8f8f8" />
      </mesh>
      
      {/* Room dimensions text */}
      <Text
        position={[0, 0.1, roomDepth / 2 - 0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="#666"
      >
        {roomDimensions.width}cm × {roomDimensions.height}cm
      </Text>
    </group>
  );
};

export const View3D: React.FC<View3DProps> = ({
  design,
  selectedElement,
  onSelectElement,
  activeTool = 'select',
  showGrid = true,
  fitToScreenSignal = 0
}) => {
  // Add safety check for design and roomDimensions
  if (!design || !design.roomDimensions) {
    return (
      <div className="w-full h-full relative bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-gray-500">Loading 3D View...</div>
      </div>
    );
  }

  // Ensure roomDimensions has default values
  const roomDimensions = {
    width: design.roomDimensions?.width || 600,
    height: design.roomDimensions?.height || 400,
    ceilingHeight: design.roomDimensions?.ceilingHeight || 240
  };

  // Controller inside Canvas to handle fit-to-screen and controls target updates
  const FitToScreenController: React.FC<{ roomDimensions: { width: number; height: number }; signal: number; controlsRef: React.RefObject<OrbitControls | null>; }> = ({ roomDimensions, signal, controlsRef }) => {
    const { camera } = useThree();
    useEffect(() => {
      if (!signal) return;
      const maxDim = Math.max(roomDimensions.width, roomDimensions.height) / 100; // meters
      const distance = Math.max(4, maxDim * 1.2);
      camera.position.set(distance, distance * 0.8, distance);
      camera.updateProjectionMatrix();
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }, [signal, roomDimensions.width, roomDimensions.height, camera, controlsRef]);
    return null;
  };
  const handleElementClick = (element: DesignElement) => {
    onSelectElement(selectedElement?.id === element.id ? null : element);
  };

  const controlsRef = useRef<OrbitControls | null>(null);
  return (
    <div className="w-full h-full relative z-0 bg-gray-50 rounded-lg overflow-hidden">
      <Canvas
        camera={{
          position: [5, 4, 5],
          fov: 60
        }}
        shadows
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[0, 2, 0]} intensity={0.3} />
          
          {/* Environment */}
          <Environment preset="apartment" />
          
          {/* Room */}
          <Room3D roomDimensions={roomDimensions} />
          
          {/* Grid - centered to match room positioning */}
          {showGrid && (
            <Grid
              args={[roomDimensions.width / 100, roomDimensions.height / 100]}
              cellSize={0.2}
              cellThickness={1}
              cellColor="#e0e0e0"
              sectionSize={1}
              sectionThickness={1.5}
              sectionColor="#c0c0c0"
              position={[0, 0, 0]}
            />
          )}
          
          {/* Design Elements */}
          {design.elements && design.elements.map((element) => {
            const isSelected = selectedElement?.id === element.id;
            
            if (element.type === 'cabinet') {
              return (
                <EnhancedCabinet3D
                  key={element.id}
                  element={element}
                  roomDimensions={roomDimensions}
                  isSelected={isSelected}
                  onClick={() => handleElementClick(element)}
                />
              );
            }
            
            if (element.type === 'appliance') {
              return (
                <EnhancedAppliance3D
                  key={element.id}
                  element={element}
                  roomDimensions={roomDimensions}
                  isSelected={isSelected}
                  onClick={() => handleElementClick(element)}
                />
              );
            }
            
              if (element.type === 'counter-top') {
                return (
                  <EnhancedCounterTop3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              }
             
              if (element.type === 'end-panel') {
                return (
                  <EnhancedEndPanel3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              }
              
              if (element.type === 'window') {
                return (
                  <EnhancedWindow3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              }
              
              if (element.type === 'door') {
                return (
                  <EnhancedDoor3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              }
              
              if (element.type === 'flooring') {
                return (
                  <EnhancedFlooring3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              }
              
              if (element.type === 'toe-kick') {
                return (
                  <EnhancedToeKick3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              }
              
              if (element.type === 'cornice') {
                return (
                  <EnhancedCornice3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              }
              
              if (element.type === 'pelmet') {
                return (
                  <EnhancedPelmet3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              }
              
              if (element.type === 'wall-unit-end-panel') {
                return (
                  <EnhancedWallUnitEndPanel3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              }
              
              if (element.type === 'sink') {
                return (
                  <EnhancedSink3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              }
              
              return null;
          })}
          
          {/* Camera Controls */}
          <FitToScreenController roomDimensions={roomDimensions} signal={fitToScreenSignal} controlsRef={controlsRef} />
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={15}
            maxPolarAngle={Math.PI / 2.2}
            mouseButtons={{
              LEFT: activeTool === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN,
            }}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
