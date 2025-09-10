import React from 'react';
import { DesignElement } from '@/types/project';
import * as THREE from 'three';
import { Sofa, RectangleHorizontal } from 'lucide-react';

// Import ComponentDefinition type
interface ComponentDefinition {
  id: string;
  name: string;
  type: 'cabinet' | 'appliance' | 'counter-top';
  width: number; // X-axis dimension (left-to-right)
  depth: number; // Y-axis dimension (front-to-back)
  height: number; // Z-axis dimension (bottom-to-top)
  color: string;
  category: string;
  roomTypes: string[];
  icon: React.ReactNode;
  description: string;
}

// Interface for enhanced model props
interface Enhanced3DModelProps {
  element: DesignElement;
  roomDimensions: { width: number; height: number };
  isSelected: boolean;
  onClick: () => void;
}

// Helper function to convert 2D coordinates to 3D world coordinates
const convertTo3D = (x: number, y: number, roomWidth: number, roomHeight: number) => {
  const roomWidthMeters = roomWidth / 100;
  const roomHeightMeters = roomHeight / 100;
  
  return {
    x: (x / 100) - roomWidthMeters / 2,
    z: (y / 100) - roomHeightMeters / 2
  };
};

/**
 * EnhancedCabinet3D - Detailed 3D cabinet model
 * 
 * Features:
 * - Realistic cabinet structure with frame, doors, and hardware
 * - Material textures for wood grain, metal, etc.
 * - Proper scale and proportions
 * - Specialized rendering for different cabinet types
 */
export const EnhancedCabinet3D: React.FC<Enhanced3DModelProps> = ({ 
  element, 
  roomDimensions, 
  isSelected, 
  onClick 
}) => {
  const { x, z } = convertTo3D(element.x, element.y, roomDimensions.width, roomDimensions.height);
  const width = element.width / 100;  // Convert cm to meters (X-axis)
  const depth = element.depth / 100;  // Convert cm to meters (Y-axis)
  const height = element.height / 100; // Convert cm to meters (Z-axis)
  
  // Determine cabinet type
  const isWallCabinet = element.style?.toLowerCase().includes('wall') || 
                        element.id.includes('wall-cabinet');
  
  const isCornerCabinet = element.id.includes('corner-cabinet') || 
                        element.style?.toLowerCase().includes('corner');
                        
  const isLarderCornerUnit = element.id.includes('larder-corner-unit');
                        
  const isPanDrawer = element.id.includes('pan-drawers') || 
                     element.style?.toLowerCase().includes('pan drawer');
                     
  const isBedroom = element.id.includes('wardrobe') || 
                   element.id.includes('chest') ||
                   element.id.includes('bedside');
  
  const isBathroom = element.id.includes('vanity');
  
  const isMediaUnit = element.id.includes('tv-unit') || 
                     element.id.includes('media');
  
  // Larder unit types
  const isLarderFridge = element.id.includes('larder-built-in-fridge');
  const isLarderSingleOven = element.id.includes('larder-single-oven');
  const isLarderDoubleOven = element.id.includes('larder-double-oven');
  const isLarderOvenMicrowave = element.id.includes('larder-oven-microwave');
  const isLarderCoffeeMachine = element.id.includes('larder-coffee-machine');
  
  // Set position based on cabinet type
  const yPosition = isWallCabinet ? 2.0 - height / 2 : height / 2;
  
  // Material colors - more refined than basic colors
  const selectedColor = '#ff6b6b';
  const baseColor = element.color || '#8b4513';
  
  // Handle different wood finishes based on cabinet type
  let cabinetMaterial = baseColor;
  if (isBedroom) {
    cabinetMaterial = element.color || '#654321'; // Darker wood for bedroom furniture
  } else if (isBathroom) {
    cabinetMaterial = element.color || '#F5F5DC'; // Lighter color for bathroom vanities
  } else if (isMediaUnit) {
    cabinetMaterial = element.color || '#2F4F4F'; // Dark slate for media units
  }
  
  const doorColor = isSelected ? selectedColor : '#654321'; // Slightly darker than cabinet body
  const handleColor = '#c0c0c0';
  const plinthColor = '#2d2d2d';
  
  // Plinth dimensions
  const plinthHeight = isWallCabinet ? 0 : 0.15; // 15cm plinth for base cabinets
  const cabinetHeight = isWallCabinet ? height : height - plinthHeight;
  const doorHeight = cabinetHeight - 0.05; // Door height with slight gap
  
  // Corner cabinet specific dimensions - restore original geometry
  const legLength = 0.9; // 90cm leg length for corner cabinets (ORIGINAL - DO NOT CHANGE)
  
  // Specialized rendering for different cabinet types
  if (isCornerCabinet) {
    // L-shaped corner cabinet with detailed features (ORIGINAL GEOMETRY - DO NOT CHANGE)
    const cornerDepth = isWallCabinet ? 0.4 : 0.6;
    const centerX = legLength / 2;
    const centerZ = legLength / 2;
    
    return (
      <group 
        position={[x + centerX, yPosition, z + centerZ]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Plinths for base cabinets */}
        {!isWallCabinet && (
          <>
            <mesh position={[0, -height/2 + plinthHeight/2, cornerDepth / 2 - legLength / 2 - 0.1]}>
              <boxGeometry args={[legLength, plinthHeight, cornerDepth - 0.2]} />
              <meshLambertMaterial color={plinthColor} />
            </mesh>
            <mesh position={[cornerDepth / 2 - legLength / 2 - 0.1, -height/2 + plinthHeight/2, 0]}>
              <boxGeometry args={[cornerDepth - 0.2, plinthHeight, legLength]} />
              <meshLambertMaterial color={plinthColor} />
            </mesh>
          </>
        )}

        {/* Cabinet body - X leg */}
        <mesh position={[0, plinthHeight/2, cornerDepth / 2 - legLength / 2]}>
          <boxGeometry args={[legLength, cabinetHeight, cornerDepth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>

        {/* Cabinet body - Z leg */}
        <mesh position={[cornerDepth / 2 - legLength / 2, plinthHeight/2, 0]}>
          <boxGeometry args={[cornerDepth, cabinetHeight, legLength]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>

        {/* Front door with improved detail */}
        <mesh position={[0, plinthHeight/2, cornerDepth - legLength / 2 + 0.01]}>
          <boxGeometry args={[legLength - 0.05, doorHeight, 0.02]} />
          <meshStandardMaterial 
            color={doorColor} 
            roughness={0.6} 
            metalness={0.1}
          />
        </mesh>

        {/* Side door with improved detail */}
        <mesh position={[cornerDepth - legLength / 2 + 0.01, plinthHeight/2, 0]}>
          <boxGeometry args={[0.02, doorHeight, legLength - 0.05]} />
          <meshStandardMaterial 
            color={doorColor} 
            roughness={0.6} 
            metalness={0.1}
          />
        </mesh>

        {/* Door handles with improved metallic finish */}
        <mesh position={[legLength / 2 - 0.05, plinthHeight/2, cornerDepth - legLength / 2 + 0.03]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[cornerDepth - legLength / 2 + 0.03, plinthHeight/2, -0.25]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Cabinet frames */}
        <lineSegments position={[0, 0, cornerDepth / 2 - legLength / 2]}>
          <edgesGeometry args={[new THREE.BoxGeometry(legLength, height, cornerDepth)]} />
          <lineBasicMaterial color="#333" />
        </lineSegments>
        <lineSegments position={[cornerDepth / 2 - legLength / 2, 0, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(cornerDepth, height, legLength)]} />
          <lineBasicMaterial color="#333" />
        </lineSegments>
      </group>
    );
  } else if (isLarderCornerUnit) {
    // Larder corner unit - separate from regular corner cabinet
    const centerX = width / 2;
    const centerZ = depth / 2;
    
    return (
      <group 
        position={[x + centerX, yPosition, z + centerZ]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Plinth for larder corner unit */}
        {!isWallCabinet && (
          <mesh position={[0, -height/2 + plinthHeight/2, 0]}>
            <boxGeometry args={[width, plinthHeight, depth]} />
            <meshLambertMaterial color={plinthColor} />
          </mesh>
        )}

        {/* Main larder body - L-shaped for corner */}
        <mesh position={[-width/4, plinthHeight/2, -depth/4]}>
          <boxGeometry args={[width/2, cabinetHeight, depth/2]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>
        <mesh position={[width/4, plinthHeight/2, depth/4]}>
          <boxGeometry args={[width/2, cabinetHeight, depth/2]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>

        {/* Larder doors */}
        <mesh position={[-width/4, plinthHeight/2, -depth/2 + 0.01]}>
          <boxGeometry args={[width/2 - 0.05, doorHeight, 0.02]} />
          <meshStandardMaterial 
            color={doorColor} 
            roughness={0.6} 
            metalness={0.1}
          />
        </mesh>
        <mesh position={[width/2 - 0.01, plinthHeight/2, depth/4]}>
          <boxGeometry args={[0.02, doorHeight, depth/2 - 0.05]} />
          <meshStandardMaterial 
            color={doorColor} 
            roughness={0.6} 
            metalness={0.1}
          />
        </mesh>

        {/* Door handles */}
        <mesh position={[-width/8, plinthHeight/2, -depth/2 + 0.03]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[width/2 - 0.03, plinthHeight/2, depth/8]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#333" />
        </lineSegments>
      </group>
    );
  } else if (isPanDrawer) {
    // Pan drawer unit with multiple drawers
    const cabinetYPosition = plinthHeight / 2; // Define cabinetYPosition for pan drawers
    
    return (
      <group
        position={[x + width / 2, yPosition, z + depth / 2]}
        onClick={onClick}
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Plinth */}
        <mesh position={[0, -height/2 + plinthHeight/2, -0.1]}>
          <boxGeometry args={[width, plinthHeight, depth - 0.2]} />
          <meshLambertMaterial color={plinthColor} />
        </mesh>

        {/* Cabinet body */}
        <mesh position={[0, plinthHeight/2, 0]}>
          <boxGeometry args={[width, cabinetHeight, depth]} />
          <meshStandardMaterial
            color={isSelected ? selectedColor : cabinetMaterial}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>

        {/* Drawer fronts with better detail */}
        {/* Top drawer */}
        <mesh position={[0, cabinetYPosition + doorHeight/3, depth / 2 + 0.01]}>
          <boxGeometry args={[width - 0.05, doorHeight/3 - 0.02, 0.02]} />
          <meshStandardMaterial color={doorColor} roughness={0.6} metalness={0.1} />
        </mesh>
        <mesh position={[0, cabinetYPosition + doorHeight/3, depth / 2 + 0.03]}>
          <boxGeometry args={[0.15, 0.02, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Middle drawer */}
        <mesh position={[0, cabinetYPosition, depth / 2 + 0.01]}>
          <boxGeometry args={[width - 0.05, doorHeight/3 - 0.02, 0.02]} />
          <meshStandardMaterial color={doorColor} roughness={0.6} metalness={0.1} />
        </mesh>
        <mesh position={[0, cabinetYPosition, depth / 2 + 0.03]}>
          <boxGeometry args={[0.15, 0.02, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Bottom drawer */}
        <mesh position={[0, cabinetYPosition - doorHeight/3, depth / 2 + 0.01]}>
          <boxGeometry args={[width - 0.05, doorHeight/3 - 0.02, 0.02]} />
          <meshStandardMaterial color={doorColor} roughness={0.6} metalness={0.1} />
        </mesh>
        <mesh position={[0, cabinetYPosition - doorHeight/3, depth / 2 + 0.03]}>
          <boxGeometry args={[0.15, 0.02, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Cabinet frame */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#333" />
        </lineSegments>
      </group>
    );
  } else if (isBedroom && element.id.includes('wardrobe')) {
    // Wardrobe with doors and detailed features
    const doorCount = element.id.includes('3door') ? 3 : 
                     element.id.includes('2door') ? 2 : 1;
    const doorWidth = (width - 0.05) / doorCount;
    
    return (
      <group 
        position={[x + width / 2, yPosition, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Wardrobe body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>

        {/* Wardrobe doors */}
        {Array.from({ length: doorCount }).map((_, index) => {
          const doorPosition = -width/2 + doorWidth/2 + index * doorWidth;
          return (
            <React.Fragment key={index}>
              <mesh position={[doorPosition, 0, depth / 2 + 0.01]}>
                <boxGeometry args={[doorWidth - 0.02, height - 0.05, 0.02]} />
                <meshStandardMaterial 
                  color={doorColor} 
                  roughness={0.6} 
                  metalness={0.1}
                />
              </mesh>
              
              {/* Door handle */}
              <mesh position={[doorPosition + doorWidth/3, 0, depth / 2 + 0.03]}>
                <boxGeometry args={[0.02, 0.15, 0.02]} />
                <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
              </mesh>
            </React.Fragment>
          );
        })}

        {/* Cabinet frame */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#333" />
        </lineSegments>
      </group>
    );
  } else if (isBedroom && element.id.includes('chest')) {
    // Chest of drawers with multiple drawers
    const drawerCount = 4; // Standard chest with 4 drawers
    const drawerHeight = (height - 0.05) / drawerCount;
    
    return (
      <group 
        position={[x + width / 2, yPosition, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Chest body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>

        {/* Drawers */}
        {Array.from({ length: drawerCount }).map((_, index) => {
          const drawerPosition = height/2 - drawerHeight/2 - index * drawerHeight;
          return (
            <React.Fragment key={index}>
              <mesh position={[0, drawerPosition, depth / 2 + 0.01]}>
                <boxGeometry args={[width - 0.05, drawerHeight - 0.02, 0.02]} />
                <meshStandardMaterial 
                  color={doorColor} 
                  roughness={0.6} 
                  metalness={0.1}
                />
              </mesh>
              
              {/* Drawer handles */}
              <mesh position={[0, drawerPosition, depth / 2 + 0.03]}>
                <boxGeometry args={[width/2, 0.02, 0.02]} />
                <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
              </mesh>
            </React.Fragment>
          );
        })}

        {/* Frame */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#333" />
        </lineSegments>
      </group>
    );
  } else {
    // Standard cabinet with door
    const cabinetYPosition = isWallCabinet ? 0 : plinthHeight / 2;
    
    return (
      <group 
        position={[x + width / 2, yPosition, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Plinth */}
        {!isWallCabinet && (
          <mesh position={[0, -height/2 + plinthHeight/2, -0.1]}>
            <boxGeometry args={[width, plinthHeight, depth - 0.2]} />
            <meshLambertMaterial color={plinthColor} />
          </mesh>
        )}

        {/* Cabinet body with improved material */}
        <mesh position={[0, cabinetYPosition, 0]}>
          <boxGeometry args={[width, cabinetHeight, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>

        {/* Cabinet door with improved material */}
        <mesh position={[0, cabinetYPosition, depth / 2 + 0.01]}>
          <boxGeometry args={[width - 0.05, doorHeight, 0.02]} />
          <meshStandardMaterial 
            color={doorColor} 
            roughness={0.6} 
            metalness={0.1}
          />
        </mesh>

        {/* Door handle with metallic finish */}
        <mesh position={[width / 2 - 0.05, cabinetYPosition, depth / 2 + 0.03]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Larder-specific appliance elements */}
        {isLarderFridge && (
          <>
            {/* Fridge grill at bottom */}
            <mesh position={[0, -height/2 + 0.1, depth / 2 + 0.005]}>
              <boxGeometry args={[width - 0.1, 0.15, 0.01]} />
              <meshStandardMaterial color="#333333" roughness={0.8} metalness={0.2} />
            </mesh>
            {/* Fridge handle - vertical */}
            <mesh position={[width / 2 - 0.03, height/3, depth / 2 + 0.04]}>
              <boxGeometry args={[0.01, height/2, 0.02]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
            </mesh>
          </>
        )}
        
        {isLarderSingleOven && (
          <>
            {/* Oven door with window */}
            <mesh position={[0, height/4, depth / 2 + 0.005]}>
              <boxGeometry args={[width - 0.1, height/3, 0.01]} />
              <meshStandardMaterial color="#2c2c2c" roughness={0.3} metalness={0.7} />
            </mesh>
            {/* Oven window */}
            <mesh position={[0, height/4, depth / 2 + 0.01]}>
              <boxGeometry args={[width - 0.2, height/4, 0.005]} />
              <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* Oven handle */}
            <mesh position={[0, height/6, depth / 2 + 0.04]}>
              <boxGeometry args={[width/3, 0.02, 0.02]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
            </mesh>
          </>
        )}
        
        {isLarderDoubleOven && (
          <>
            {/* Upper oven */}
            <mesh position={[0, height/3, depth / 2 + 0.005]}>
              <boxGeometry args={[width - 0.1, height/4, 0.01]} />
              <meshStandardMaterial color="#2c2c2c" roughness={0.3} metalness={0.7} />
            </mesh>
            <mesh position={[0, height/3, depth / 2 + 0.01]}>
              <boxGeometry args={[width - 0.2, height/6, 0.005]} />
              <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* Lower oven */}
            <mesh position={[0, 0, depth / 2 + 0.005]}>
              <boxGeometry args={[width - 0.1, height/4, 0.01]} />
              <meshStandardMaterial color="#2c2c2c" roughness={0.3} metalness={0.7} />
            </mesh>
            <mesh position={[0, 0, depth / 2 + 0.01]}>
              <boxGeometry args={[width - 0.2, height/6, 0.005]} />
              <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* Oven handles */}
            <mesh position={[0, height/4, depth / 2 + 0.04]}>
              <boxGeometry args={[width/3, 0.02, 0.02]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, -height/8, depth / 2 + 0.04]}>
              <boxGeometry args={[width/3, 0.02, 0.02]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
            </mesh>
          </>
        )}
        
        {isLarderOvenMicrowave && (
          <>
            {/* Oven (lower) */}
            <mesh position={[0, 0, depth / 2 + 0.005]}>
              <boxGeometry args={[width - 0.1, height/3, 0.01]} />
              <meshStandardMaterial color="#2c2c2c" roughness={0.3} metalness={0.7} />
            </mesh>
            <mesh position={[0, 0, depth / 2 + 0.01]}>
              <boxGeometry args={[width - 0.2, height/5, 0.005]} />
              <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* Microwave (upper) */}
            <mesh position={[0, height/3, depth / 2 + 0.005]}>
              <boxGeometry args={[width - 0.1, height/4, 0.01]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.4} metalness={0.6} />
            </mesh>
            <mesh position={[0, height/3, depth / 2 + 0.01]}>
              <boxGeometry args={[width - 0.2, height/6, 0.005]} />
              <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* Handles */}
            <mesh position={[0, -height/8, depth / 2 + 0.04]}>
              <boxGeometry args={[width/3, 0.02, 0.02]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[width/3, height/4, depth / 2 + 0.04]}>
              <boxGeometry args={[0.02, 0.08, 0.02]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
            </mesh>
          </>
        )}
        
        {isLarderCoffeeMachine && (
          <>
            {/* Coffee machine front panel */}
            <mesh position={[0, height/4, depth / 2 + 0.005]}>
              <boxGeometry args={[width - 0.1, height/3, 0.01]} />
              <meshStandardMaterial color="#2c2c2c" roughness={0.3} metalness={0.7} />
            </mesh>
            {/* Coffee machine display */}
            <mesh position={[0, height/3, depth / 2 + 0.01]}>
              <boxGeometry args={[width/3, 0.08, 0.005]} />
              <meshStandardMaterial color="#001122" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* Coffee spout */}
            <mesh position={[0, height/6, depth / 2 + 0.02]}>
              <boxGeometry args={[0.05, 0.03, 0.08]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Control buttons */}
            <mesh position={[-width/4, height/4, depth / 2 + 0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.01]} />
              <meshStandardMaterial color="#444444" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[width/4, height/4, depth / 2 + 0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.01]} />
              <meshStandardMaterial color="#444444" roughness={0.2} metalness={0.8} />
            </mesh>
          </>
        )}

        {/* Cabinet frame */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#333" />
        </lineSegments>
      </group>
    );
  }
};

/**
 * EnhancedAppliance3D - Detailed 3D appliance model
 * 
 * Features:
 * - Realistic appliance models with detailed features
 * - Material textures for metal, glass, etc.
 * - Proper scale and proportions
 * - Specialized rendering for different appliance types
 */
export const EnhancedAppliance3D: React.FC<Enhanced3DModelProps> = ({ 
  element, 
  roomDimensions, 
  isSelected, 
  onClick 
}) => {
  const { x, z } = convertTo3D(element.x, element.y, roomDimensions.width, roomDimensions.height);
  const width = element.width / 100;  // Convert cm to meters (X-axis)
  const depth = element.depth / 100;  // Convert cm to meters (Y-axis)
  const height = element.height / 100; // Convert cm to meters (Z-axis)
  
  const selectedColor = '#ff6b6b';
  
  // Determine appliance type
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
  
  // Use actual element height
  const yPosition = height / 2;
  
  // Base color based on appliance type
  const applianceColor = getApplianceColor(applianceType, element);
  
  
  // Helper function to get appliance-specific color
  function getApplianceColor(type: string, element: DesignElement): string {
    if (element.color) return element.color;
    
    switch(type) {
      case 'refrigerator': return '#f8f8f8';
      case 'dishwasher': return '#e0e0e0';
      case 'washing-machine': return '#f0f0f0';
      case 'tumble-dryer': return '#e8e8e8';
      case 'oven': return '#2c2c2c';
      case 'toilet': return '#FFFFFF';
      case 'shower': return '#E6E6FA';
      case 'bathtub': return '#FFFFFF';
      case 'bed': return '#8B4513';
      case 'sofa': return '#3A6EA5';
      case 'chair': return '#6B8E23';
      case 'table': return '#8B4513';
      case 'tv': return '#2F4F4F';
      default: return '#c0c0c0';
    }
  }
  
  // Furniture-specific rendering
  if (applianceType === 'bed') {
    // Bed with frame, mattress, and pillows
    const frameHeight = 0.2;
    const mattressHeight = 0.3;
    const bedDepth = depth * 2; // Beds are deeper than standard appliances
    
    return (
      <group 
        position={[x + width / 2, yPosition, z + bedDepth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Bed frame */}
        <mesh position={[0, -height/2 + frameHeight/2, 0]}>
          <boxGeometry args={[width, frameHeight, bedDepth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>
        
        {/* Mattress */}
        <mesh position={[0, -height/2 + frameHeight + mattressHeight/2, 0]}>
          <boxGeometry args={[width - 0.1, mattressHeight, bedDepth - 0.1]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} metalness={0} />
        </mesh>
        
        {/* Headboard */}
        <mesh position={[0, 0, -bedDepth/2 + 0.05]}>
          <boxGeometry args={[width, height, 0.1]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>
        
        {/* Pillows */}
        <mesh position={[-width/4, -height/2 + frameHeight + mattressHeight + 0.05, -bedDepth/3]}>
          <boxGeometry args={[width/3, 0.1, bedDepth/4]} />
          <meshStandardMaterial color="#F5F5F5" roughness={0.9} metalness={0} />
        </mesh>
        <mesh position={[width/4, -height/2 + frameHeight + mattressHeight + 0.05, -bedDepth/3]}>
          <boxGeometry args={[width/3, 0.1, bedDepth/4]} />
          <meshStandardMaterial color="#F5F5F5" roughness={0.9} metalness={0} />
        </mesh>
        
        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, bedDepth)]} />
          <lineBasicMaterial color="#333" />
        </lineSegments>
      </group>
    );
  } else if (applianceType === 'sofa') {
    // Sofa with base, cushions, and backrest
    const baseHeight = 0.3;
    const sofaDepth = depth * 1.5;
    
    return (
      <group 
        position={[x + width / 2, yPosition, z + sofaDepth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Sofa base */}
        <mesh position={[0, -height/2 + baseHeight/2, 0]}>
          <boxGeometry args={[width, baseHeight, sofaDepth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>
        
        {/* Sofa back */}
        <mesh position={[0, 0, -sofaDepth/2 + 0.2]}>
          <boxGeometry args={[width, height, 0.4]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.8} 
            metalness={0}
          />
        </mesh>
        
        {/* Sofa arms */}
        <mesh position={[-width/2 + 0.2, 0, 0]}>
          <boxGeometry args={[0.4, height, sofaDepth - 0.2]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.8} 
            metalness={0}
          />
        </mesh>
        <mesh position={[width/2 - 0.2, 0, 0]}>
          <boxGeometry args={[0.4, height, sofaDepth - 0.2]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.8} 
            metalness={0}
          />
        </mesh>
        
        {/* Seat cushions */}
        <mesh position={[0, -height/4, sofaDepth/6]}>
          <boxGeometry args={[width - 1, 0.15, sofaDepth - 0.6]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : (element.color ? element.color : "#4A6F8C")} 
            roughness={0.9} 
            metalness={0}
          />
        </mesh>
        
        {/* Back cushions */}
        <mesh position={[0, 0.1, -sofaDepth/3]}>
          <boxGeometry args={[width - 1, 0.4, 0.2]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : (element.color ? element.color : "#4A6F8C")} 
            roughness={0.9} 
            metalness={0}
          />
        </mesh>
        
        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, sofaDepth)]} />
          <lineBasicMaterial color="#333" />
        </lineSegments>
      </group>
    );
  } else if (applianceType === 'chair') {
    // Chair with seat, back, and legs
    const chairDepth = depth;
    
    return (
      <group 
        position={[x + width / 2, yPosition, z + chairDepth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Chair seat */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, 0.1, chairDepth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>
        
        {/* Chair back */}
        <mesh position={[0, height/3, -chairDepth/2 + 0.05]}>
          <boxGeometry args={[width, height * 0.8, 0.1]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.7} 
            metalness={0.1}
          />
        </mesh>
        
        {/* Chair legs */}
        <mesh position={[-width/2 + 0.05, -height/2 + 0.4, -chairDepth/2 + 0.05]}>
          <boxGeometry args={[0.05, 0.8, 0.05]} />
          <meshStandardMaterial color="#2F4F4F" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[width/2 - 0.05, -height/2 + 0.4, -chairDepth/2 + 0.05]}>
          <boxGeometry args={[0.05, 0.8, 0.05]} />
          <meshStandardMaterial color="#2F4F4F" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[-width/2 + 0.05, -height/2 + 0.4, chairDepth/2 - 0.05]}>
          <boxGeometry args={[0.05, 0.8, 0.05]} />
          <meshStandardMaterial color="#2F4F4F" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[width/2 - 0.05, -height/2 + 0.4, chairDepth/2 - 0.05]}>
          <boxGeometry args={[0.05, 0.8, 0.05]} />
          <meshStandardMaterial color="#2F4F4F" roughness={0.4} metalness={0.6} />
        </mesh>
        
        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, chairDepth)]} />
          <lineBasicMaterial color="#333" />
        </lineSegments>
      </group>
    );
  } else if (applianceType === 'table') {
    // Table with top and legs
    const tableDepth = depth * 1.5;
    
    return (
      <group 
        position={[x + width / 2, yPosition, z + tableDepth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Table top */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, 0.05, tableDepth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.6} 
            metalness={0.2}
          />
        </mesh>
        
        {/* Table legs */}
        <mesh position={[-width/2 + 0.05, -height/2 + 0.35, -tableDepth/2 + 0.05]}>
          <boxGeometry args={[0.08, 0.7, 0.08]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.6} 
            metalness={0.2}
          />
        </mesh>
        <mesh position={[width/2 - 0.05, -height/2 + 0.35, -tableDepth/2 + 0.05]}>
          <boxGeometry args={[0.08, 0.7, 0.08]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.6} 
            metalness={0.2}
          />
        </mesh>
        <mesh position={[-width/2 + 0.05, -height/2 + 0.35, tableDepth/2 - 0.05]}>
          <boxGeometry args={[0.08, 0.7, 0.08]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.6} 
            metalness={0.2}
          />
        </mesh>
        <mesh position={[width/2 - 0.05, -height/2 + 0.35, tableDepth/2 - 0.05]}>
          <boxGeometry args={[0.08, 0.7, 0.08]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.6} 
            metalness={0.2}
          />
        </mesh>
        
        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, tableDepth)]} />
          <lineBasicMaterial color="#333" />
        </lineSegments>
      </group>
    );
  } else if (applianceType === 'tv') {
    // TV with stand
    const tvThickness = 0.05;
    const standHeight = 0.2;
    
    return (
      <group 
        position={[x + width / 2, yPosition + height/2, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* TV screen */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, tvThickness]} />
          <meshStandardMaterial 
            color="#000000" 
            roughness={0.2} 
            metalness={0.8}
          />
        </mesh>
        
        {/* TV frame */}
        <mesh position={[0, 0, 0]} scale={[1.05, 1.05, 1]}>
          <boxGeometry args={[width, height, tvThickness]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : "#333333"} 
            roughness={0.4} 
            metalness={0.6}
          />
        </mesh>
        
        {/* TV stand */}
        <mesh position={[0, -height/2 - standHeight/2, depth/3]}>
          <boxGeometry args={[width/3, standHeight, depth/2]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : "#2F4F4F"} 
            roughness={0.4} 
            metalness={0.6}
          />
        </mesh>
        
        {/* TV stand neck */}
        <mesh position={[0, -height/2, depth/4]}>
          <boxGeometry args={[0.05, 0.1, depth/3]} />
          <meshStandardMaterial 
            color="#333333" 
            roughness={0.4} 
            metalness={0.8}
          />
        </mesh>
        
        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, tvThickness)]} />
          <lineBasicMaterial color="#666" />
        </lineSegments>
      </group>
    );
  } else if (applianceType === 'refrigerator') {
    // Enhanced refrigerator with detailed features
    return (
      <group 
        position={[x + width / 2, yPosition, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Main body */}
        <mesh>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : applianceColor} 
            roughness={0.4} 
            metalness={0.6}
          />
        </mesh>
        
        {/* Fridge door with improved detail */}
        <mesh position={[0, height * 0.25, depth / 2 + 0.005]}>
          <boxGeometry args={[width - 0.02, height * 0.4, 0.015]} />
          <meshStandardMaterial 
            color="#f0f0f0" 
            roughness={0.4} 
            metalness={0.6}
          />
        </mesh>
        <mesh position={[0, -height * 0.25, depth / 2 + 0.005]}>
          <boxGeometry args={[width - 0.02, height * 0.4, 0.015]} />
          <meshStandardMaterial 
            color="#f0f0f0" 
            roughness={0.4} 
            metalness={0.6}
          />
        </mesh>
        
        {/* Door handles with metallic finish */}
        <mesh position={[width / 2 - 0.05, height * 0.2, depth / 2 + 0.025]}>
          <boxGeometry args={[0.02, 0.3, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[width / 2 - 0.05, -height * 0.2, depth / 2 + 0.025]}>
          <boxGeometry args={[0.02, 0.3, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Door seals */}
        <mesh position={[0, 0, depth / 2 + 0.002]} scale={[0.997, 0.997, 1]}>
          <boxGeometry args={[width, height, 0.001]} />
          <meshStandardMaterial color="#dddddd" />
        </mesh>
        
        {/* Fridge logo */}
        <mesh position={[0, height * 0.4, depth / 2 + 0.006]}>
          <boxGeometry args={[width * 0.2, 0.05, 0.001]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        
        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#666" />
        </lineSegments>
      </group>
    );
  } else if (applianceType === 'dishwasher') {
    // Detailed dishwasher with controls and door features
    return (
      <group
        position={[x + width / 2, yPosition, z + depth / 2]}
        onClick={onClick}
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Main appliance body */}
        <mesh>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial
            color={isSelected ? selectedColor : applianceColor}
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
        
        {/* Dishwasher front panel with more realistic details */}
        <mesh position={[0, 0, depth / 2 + 0.005]}>
          <boxGeometry args={[width - 0.02, height - 0.02, 0.01]} />
          <meshStandardMaterial
            color="#e8e8e8"
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>
        
        {/* Control panel with buttons */}
        <mesh position={[0, height / 3, depth / 2 + 0.01]}>
          <boxGeometry args={[width * 0.8, 0.05, 0.005]} />
          <meshStandardMaterial color="#222" roughness={0.3} metalness={0.6} />
        </mesh>
        
        {/* Control buttons */}
        {[-0.2, -0.1, 0, 0.1, 0.2].map((offset, i) => (
          <mesh key={i} position={[width * offset, height / 3, depth / 2 + 0.015]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.005, 12]} />
            <meshStandardMaterial color={i === 2 ? "#3f6eb5" : "#444"} metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
        
        {/* Door divider line */}
        <mesh position={[0, 0, depth / 2 + 0.006]}>
          <boxGeometry args={[width - 0.1, 0.01, 0.001]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>
        
        {/* Handle */}
        <mesh position={[0, -height / 4, depth / 2 + 0.02]}>
          <boxGeometry args={[width * 0.6, 0.02, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Status light */}
        <mesh position={[width / 3, height / 3, depth / 2 + 0.015]}>
          <boxGeometry args={[0.02, 0.02, 0.005]} />
          <meshStandardMaterial color="#5fe968" emissive="#5fe968" emissiveIntensity={0.5} />
        </mesh>
        
        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#666" />
        </lineSegments>
      </group>
    );
  } else if (applianceType === 'oven') {
    // Detailed oven with controls, window and door
    return (
      <group
        position={[x + width / 2, yPosition, z + depth / 2]}
        onClick={onClick}
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Main appliance body */}
        <mesh>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial
            color={isSelected ? selectedColor : applianceColor}
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
        
        {/* Oven cabinet surround */}
        <mesh position={[0, height * 0.4, 0]}>
          <boxGeometry args={[width, height * 0.2, depth]} />
          <meshStandardMaterial color="#222" roughness={0.6} metalness={0.4} />
        </mesh>
        
        {/* Oven door */}
        <mesh position={[0, -height * 0.1, depth / 2 + 0.005]}>
          <boxGeometry args={[width - 0.1, height * 0.5, 0.01]} />
          <meshStandardMaterial color="#111" roughness={0.3} metalness={0.7} />
        </mesh>
        
        {/* Oven window with glass */}
        <mesh position={[0, -height * 0.1, depth / 2 + 0.01]}>
          <boxGeometry args={[width * 0.6, height * 0.3, 0.005]} />
          <meshStandardMaterial
            color="#000"
            transparent
            opacity={0.6}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
        
        {/* Control panel with dials */}
        <mesh position={[0, height * 0.25, depth / 2 + 0.01]}>
          <boxGeometry args={[width * 0.8, 0.08, 0.005]} />
          <meshStandardMaterial color="#111" roughness={0.3} metalness={0.7} />
        </mesh>
        
        {/* Oven dials */}
        {[-0.3, -0.1, 0.1, 0.3].map((offset, i) => (
          <mesh key={i} position={[width * offset, height * 0.25, depth / 2 + 0.02]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
            <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        
        {/* Temperature display */}
        <mesh position={[0, height * 0.25, depth / 2 + 0.015]}>
          <boxGeometry args={[0.1, 0.04, 0.001]} />
          <meshStandardMaterial color="#300d0d" emissive="#ff0000" emissiveIntensity={0.2} />
        </mesh>
        
        {/* Handle */}
        <mesh position={[0, height * 0.05, depth / 2 + 0.02]}>
          <boxGeometry args={[width * 0.4, 0.02, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Inside illumination (when selected) */}
        {isSelected && (
          <pointLight
            position={[0, -height * 0.1, depth / 3]}
            intensity={0.3}
            color="#ffbb73"
            distance={0.5}
          />
        )}
        
        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#666" />
        </lineSegments>
      </group>
    );
  } else if (applianceType === 'washing-machine') {
    // Detailed washing machine with round door and controls
    return (
      <group
        position={[x + width / 2, yPosition, z + depth / 2]}
        onClick={onClick}
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Main appliance body */}
        <mesh>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial
            color={isSelected ? selectedColor : applianceColor}
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
        
        {/* Washing machine front panel */}
        <mesh position={[0, 0, depth / 2 + 0.005]}>
          <boxGeometry args={[width - 0.02, height - 0.02, 0.01]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.6} metalness={0.3} />
        </mesh>
        
        {/* Round door with window */}
        <mesh position={[0, -height * 0.1, depth / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.02, 32]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.4} metalness={0.6} />
        </mesh>
        
        {/* Door window - blue tinted glass */}
        <mesh position={[0, -height * 0.1, depth / 2 + 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.01, 32]} />
          <meshStandardMaterial
            color="#1a3b57"
            transparent
            opacity={0.7}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
        
        {/* Drum inside - visible through glass */}
        <mesh position={[0, -height * 0.1, depth / 2 - 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.2, 32, 1, true]} />
          <meshStandardMaterial color="#888" roughness={0.6} metalness={0.7} side={THREE.BackSide} />
        </mesh>
        
        {/* Control panel with display */}
        <mesh position={[0, height * 0.3, depth / 2 + 0.01]}>
          <boxGeometry args={[width * 0.7, 0.15, 0.005]} />
          <meshStandardMaterial color="#222" roughness={0.3} metalness={0.6} />
        </mesh>
        
        {/* LCD display */}
        <mesh position={[width * 0.2, height * 0.3, depth / 2 + 0.015]}>
          <boxGeometry args={[0.15, 0.08, 0.001]} />
          <meshStandardMaterial
            color="#001b2e"
            emissive="#4fc3f7"
            emissiveIntensity={0.3}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
        
        {/* Program dial */}
        <mesh position={[-width * 0.2, height * 0.3, depth / 2 + 0.02]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
          <meshStandardMaterial color="#ddd" metalness={0.7} roughness={0.3} />
        </mesh>
        
        {/* Buttons */}
        {[-0.1, 0, 0.1].map((offset, i) => (
          <mesh key={i} position={[width * offset, height * 0.22, depth / 2 + 0.015]}>
            <boxGeometry args={[0.06, 0.02, 0.005]} />
            <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        
        {/* Brand logo */}
        <mesh position={[0, height * 0.4, depth / 2 + 0.006]}>
          <boxGeometry args={[0.12, 0.03, 0.001]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        
        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#666" />
        </lineSegments>
      </group>
    );
  } else if (applianceType === 'tumble-dryer') {
    // Detailed tumble dryer with round door and controls
    return (
      <group
        position={[x + width / 2, yPosition, z + depth / 2]}
        onClick={onClick}
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Main appliance body */}
        <mesh>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial
            color={isSelected ? selectedColor : applianceColor}
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
        
        {/* Dryer front panel */}
        <mesh position={[0, 0, depth / 2 + 0.005]}>
          <boxGeometry args={[width - 0.02, height - 0.02, 0.01]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.6} metalness={0.3} />
        </mesh>
        
        {/* Round door with window */}
        <mesh position={[0, -height * 0.1, depth / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.02, 32]} />
          <meshStandardMaterial color="#ddd" roughness={0.4} metalness={0.6} />
        </mesh>
        
        {/* Door window - darker than washing machine */}
        <mesh position={[0, -height * 0.1, depth / 2 + 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.01, 32]} />
          <meshStandardMaterial
            color="#222"
            transparent
            opacity={0.8}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
        
        {/* Drum fins - visible inside the door when selected */}
        {isSelected && (
          <group position={[0, -height * 0.1, depth / 2 - 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            {[0, Math.PI/3, 2*Math.PI/3, Math.PI, 4*Math.PI/3, 5*Math.PI/3].map((angle, i) => (
              <mesh key={i} position={[0.12 * Math.cos(angle), 0.12 * Math.sin(angle), 0]} rotation={[0, 0, angle]}>
                <boxGeometry args={[0.04, 0.15, 0.02]} />
                <meshStandardMaterial color="#999" />
              </mesh>
            ))}
          </group>
        )}
        
        {/* Control panel with buttons and display */}
        <mesh position={[0, height * 0.3, depth / 2 + 0.01]}>
          <boxGeometry args={[width * 0.7, 0.15, 0.005]} />
          <meshStandardMaterial color="#222" roughness={0.3} metalness={0.6} />
        </mesh>
        
        {/* Display screen */}
        <mesh position={[width * 0.2, height * 0.3, depth / 2 + 0.015]}>
          <boxGeometry args={[0.15, 0.08, 0.001]} />
          <meshStandardMaterial
            color="#001400"
            emissive="#4caf50"
            emissiveIntensity={0.3}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
        
        {/* Program selector */}
        <mesh position={[-width * 0.2, height * 0.3, depth / 2 + 0.02]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
          <meshStandardMaterial color="#ddd" metalness={0.7} roughness={0.3} />
        </mesh>
        
        {/* Control buttons */}
        {[-0.1, 0, 0.1].map((offset, i) => (
          <mesh key={i} position={[width * offset, height * 0.22, depth / 2 + 0.015]}>
            <boxGeometry args={[0.06, 0.02, 0.005]} />
            <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        
        {/* Lint filter indicator */}
        <mesh position={[0, height * 0.15, depth / 2 + 0.012]}>
          <boxGeometry args={[0.12, 0.04, 0.002]} />
          <meshStandardMaterial color="#ff6b3d" opacity={0.9} transparent />
        </mesh>
        
        {/* Brand logo */}
        <mesh position={[0, height * 0.4, depth / 2 + 0.006]}>
          <boxGeometry args={[0.12, 0.03, 0.001]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        
        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#666" />
        </lineSegments>
      </group>
    );
  } else {
    // Generic appliance with better materials and details
    return (
      <group
        position={[x + width / 2, yPosition, z + depth / 2]}
        onClick={onClick}
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Main body */}
        <mesh>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial
            color={isSelected ? selectedColor : applianceColor}
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
        
        {/* Appliance front panel */}
        <mesh position={[0, 0, depth / 2 + 0.005]}>
          <boxGeometry args={[width - 0.02, height - 0.02, 0.01]} />
          <meshStandardMaterial
            color={isSelected ? selectedColor : "#f0f0f0"}
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>
        
        {/* Control panel for larger appliances */}
        {width > 0.5 && (
          <mesh position={[0, height / 3, depth / 2 + 0.01]}>
            <boxGeometry args={[width * 0.6, 0.08, 0.005]} />
            <meshStandardMaterial color="#333" roughness={0.5} metalness={0.3} />
          </mesh>
        )}
        
        {/* Handle or knobs based on appliance type */}
        <mesh position={[0, 0, depth / 2 + 0.02]}>
          <boxGeometry args={[width * 0.3, 0.02, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Frame outline */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#666" />
        </lineSegments>
      </group>
    );
  }
};

/**
 * Enhanced3DFurniture - Collection of specialized furniture models
 * 
 * This component provides enhanced 3D furniture models that can be easily
 * added to the component library.
 */
export const createFurnitureModels = (): Record<string, ComponentDefinition> => {
  return {
    // Living Room Furniture
    'modern-sofa': {
      id: 'modern-sofa',
      name: 'Modern Sofa',
      type: 'appliance',
      width: 200,
      depth: 80,
      height: 80,
      color: '#3A6EA5',
      category: 'living-room',
      roomTypes: ['media-wall'],
      icon: <Sofa className="h-4 w-4" />,
      description: 'Contemporary 3-seater sofa'
    },
    'armchair': {
      id: 'armchair',
      name: 'Armchair',
      type: 'appliance',
      width: 80,
      depth: 80,
      height: 80,
      color: '#3A6EA5',
      category: 'living-room',
      roomTypes: ['media-wall'],
      icon: <Sofa className="h-4 w-4" />,
      description: 'Comfortable single armchair'
    },
    'coffee-table': {
      id: 'coffee-table',
      name: 'Coffee Table',
      type: 'appliance',
      width: 120,
      depth: 60,
      height: 45,
      color: '#8B4513',
      category: 'living-room',
      roomTypes: ['media-wall'],
      icon: <RectangleHorizontal className="h-4 w-4" />,
      description: 'Rectangular coffee table'
    },
    
    // Dining Room Furniture
    'dining-table': {
      id: 'dining-table',
      name: 'Dining Table',
      type: 'appliance',
      width: 180,
      depth: 90,
      height: 75,
      color: '#8B4513',
      category: 'dining-room',
      roomTypes: ['kitchen'],
      icon: <RectangleHorizontal className="h-4 w-4" />,
      description: 'Dining table for 6 people'
    },
    'dining-chair': {
      id: 'dining-chair',
      name: 'Dining Chair',
      type: 'appliance',
      width: 45,
      depth: 45,
      height: 90,
      color: '#8B4513',
      category: 'dining-room',
      roomTypes: ['kitchen'],
      icon: <Sofa className="h-4 w-4" />,
      description: 'Standard dining chair'
    },
    
    // Bedroom Additional Furniture
    'dressing-table': {
      id: 'dressing-table',
      name: 'Dressing Table',
      type: 'appliance',
      width: 120,
      depth: 50,
      height: 75,
      color: '#8B4513',
      category: 'bedroom-furniture',
      roomTypes: ['bedroom'],
      icon: <RectangleHorizontal className="h-4 w-4" />,
      description: 'Bedroom dressing table with mirror'
    },
    'ottoman': {
      id: 'ottoman',
      name: 'Ottoman',
      type: 'appliance',
      width: 60,
      depth: 60,
      height: 45,
      color: '#6B8E23',
      category: 'bedroom-furniture',
      roomTypes: ['bedroom'],
      icon: <Sofa className="h-4 w-4" />,
      description: 'Bedroom ottoman/seat'
    },
    
    // Office Furniture
    'desk': {
      id: 'desk',
      name: 'Office Desk',
      type: 'appliance',
      width: 150,
      depth: 75,
      height: 75,
      color: '#2F4F4F',
      category: 'office',
      roomTypes: ['bedroom', 'media-wall'],
      icon: <RectangleHorizontal className="h-4 w-4" />,
      description: 'Standard office desk'
    },
    'office-chair': {
      id: 'office-chair',
      name: 'Office Chair',
      type: 'appliance',
      width: 60,
      depth: 60,
      height: 110,
      color: '#2F4F4F',
      category: 'office',
      roomTypes: ['bedroom', 'media-wall'],
      icon: <Sofa className="h-4 w-4" />,
      description: 'Ergonomic office chair'
    },
    'bookshelf': {
      id: 'bookshelf',
      name: 'Bookshelf',
      type: 'cabinet',
      width: 100,
      depth: 30,
      height: 200,
      color: '#8B4513',
      category: 'office',
      roomTypes: ['bedroom', 'media-wall'],
      icon: <RectangleHorizontal className="h-4 w-4" />,
      description: 'Tall bookshelf'
    }
  };
};

/**
 * EnhancedCounterTop3D - Detailed 3D counter top model
 * 
 * Features:
 * - Realistic counter top with proper thickness
 * - Material textures for stone/wood surfaces
 * - Proper scale and proportions
 * - Positioned at 90cm height (0.9m) off ground
 */
export const EnhancedCounterTop3D: React.FC<Enhanced3DModelProps> = ({ 
  element, 
  roomDimensions, 
  isSelected, 
  onClick 
}) => {
  const { x, z } = convertTo3D(element.x, element.y, roomDimensions.width, roomDimensions.height);
  
  // Convert dimensions from cm to meters
  const width = element.width / 100;
  const depth = element.depth / 100;
  const height = element.height / 100;
  
  // Counter tops are positioned at 90cm (0.9m) off the ground, or use element.z if set
  const baseHeight = element.z ? element.z / 100 : 0.9; // Convert cm to meters
  const y = baseHeight + (height / 2);
  
  // Create materials
  const counterTopMaterial = new THREE.MeshLambertMaterial({ 
    color: element.color || '#D2B48C' 
  });
  
  const edgeMaterial = new THREE.MeshLambertMaterial({ 
    color: '#B8860B' // Darker edge color
  });
  
  return (
    <group 
      position={[x, y, z]} 
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Main counter top surface */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <primitive object={counterTopMaterial} />
      </mesh>
      
      {/* Counter top edge - slightly darker for depth */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[width, height * 0.1, depth]} />
        <primitive object={edgeMaterial} />
      </mesh>
      
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, height / 2 + 0.01, 0]}>
          <boxGeometry args={[width + 0.02, 0.02, depth + 0.02]} />
          <meshLambertMaterial color="#00ff00" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

/**
 * To integrate these enhanced models with the existing component system:
 * 
 * 1. Import this file in View3D.tsx
 * 2. Replace the Cabinet3D and Appliance3D components with the enhanced versions
 * 3. Import createFurnitureModels in ComponentLibrary.tsx and add them to the component list
 */