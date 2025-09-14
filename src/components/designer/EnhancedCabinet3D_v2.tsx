import React from 'react';
import { DesignElement } from '@/types/project';
import * as THREE from 'three';
import { use3DModelConfig } from '@/hooks/use3DModelConfig';

// Interface for enhanced model props (same as original)
interface Enhanced3DModelProps {
  element: DesignElement;
  roomDimensions: { width: number; height: number };
  isSelected?: boolean;
  onClick?: () => void;
}

// Convert 2D coordinates to 3D world coordinates (EXACT COPY from original)
const convertTo3D = (x: number, y: number, roomWidth: number, roomHeight: number) => {
  const roomWidthMeters = roomWidth / 100;
  const roomHeightMeters = roomHeight / 100;
  
  return {
    x: (x / 100) - roomWidthMeters / 2,
    z: (y / 100) - roomHeightMeters / 2
  };
};

/**
 * EnhancedCabinet3D_v2 - Database-enhanced version that PRESERVES all existing logic
 * 
 * This component:
 * - Keeps ALL existing geometry calculations EXACTLY the same
 * - Preserves ALL corner unit logic (GOLDEN RULE!)
 * - Enhances materials and visual properties via database configuration
 * - Maintains identical rendering output to original
 */
export const EnhancedCabinet3D_v2: React.FC<Enhanced3DModelProps> = ({ 
  element, 
  roomDimensions, 
  isSelected, 
  onClick 
}) => {
  const { getConfigForElement, detectCabinetType } = use3DModelConfig();
  
  // Get database configuration (enhances, doesn't replace)
  const config = getConfigForElement(element);
  
  // EXACT COPY of original coordinate conversion
  const { x, z } = convertTo3D(element.x, element.y, roomDimensions.width, roomDimensions.height);
  
  // Validate and convert dimensions - prevent NaN errors
  const width = (element.width && !isNaN(element.width)) ? element.width / 100 : 0.6;  // Default 60cm
  const depth = (element.depth && !isNaN(element.depth)) ? element.depth / 100 : 0.6;  // Default 60cm  
  const height = (element.height && !isNaN(element.height)) ? element.height / 100 : 0.9; // Default 90cm
  
  // Early validation - don't render if dimensions are still invalid
  if (isNaN(width) || isNaN(depth) || isNaN(height) || width <= 0 || depth <= 0 || height <= 0) {
    console.warn('EnhancedCabinet3D_v2 has invalid dimensions:', { 
      elementId: element.id, 
      elementWidth: element.width, 
      elementDepth: element.depth, 
      elementHeight: element.height
    });
    return null; // Don't render invalid geometry
  }
  
  // EXACT COPY of original cabinet type detection logic
  const cabinetTypes = detectCabinetType(element);
  const {
    isWallCabinet,
    isCornerCabinet,
    isLarderCornerUnit,
    isPanDrawer,
    isBedroom,
    isBathroom,
    isMediaUnit,
    isLarderFridge,
    isLarderSingleOven,
    isLarderDoubleOven,
    isLarderOvenMicrowave,
    isLarderCoffeeMachine
  } = cabinetTypes;
  
  // EXACT COPY of original position calculation
  const yPosition = isWallCabinet ? 2.0 - height / 2 : height / 2;
  
  // Enhanced material colors (database-configurable, with original fallbacks)
  const cabinetMaterial = config?.primary_color || '#8B4513'; // Original fallback
  const doorColor = config?.door_color || '#654321'; // Match corner cabinet door color
  const selectedColor = '#ff6b6b'; // Keep original selection color
  const handleColor = '#C0C0C0'; // Keep original handle color
  const plinthColor = '#654321'; // Keep original plinth color
  
  // Enhanced material properties (database-configurable)
  const roughness = config?.roughness || 0.7; // Original fallback
  const metalness = config?.metalness || 0.1; // Original fallback
  const enableDetailedHandles = config?.enable_detailed_handles ?? true;
  const enableDoorDetail = config?.enable_door_detail ?? true;
  
  // EXACT COPY of original plinth calculations
  const plinthHeight = config?.plinth_height || (isWallCabinet ? 0 : 0.15); // Original logic preserved
  const cabinetHeight = isWallCabinet ? height : height - plinthHeight;
  const doorHeight = cabinetHeight - (config?.door_gap || 0.05); // Original logic with configurable gap
  
  // EXACT COPY of original corner cabinet constants (SACRED - DO NOT CHANGE)
  const legLength = 0.9; // 90cm leg length for corner cabinets (ORIGINAL - DO NOT CHANGE)
  
  // ============================================================================
  // CORNER CABINET RENDERING - EXACT COPY OF ORIGINAL LOGIC
  // ============================================================================
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
        {/* EXACT COPY: Plinths for base cabinets */}
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

        {/* EXACT COPY: Cabinet body - X leg */}
        <mesh position={[0, plinthHeight/2, cornerDepth / 2 - legLength / 2]}>
          <boxGeometry args={[legLength, cabinetHeight, cornerDepth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>

        {/* EXACT COPY: Cabinet body - Z leg */}
        <mesh position={[cornerDepth / 2 - legLength / 2, plinthHeight/2, 0]}>
          <boxGeometry args={[cornerDepth, cabinetHeight, legLength]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>

        {/* EXACT COPY: Front door with improved detail */}
        {enableDoorDetail && (
          <mesh position={[0, plinthHeight/2, cornerDepth - legLength / 2 + 0.01]}>
            <boxGeometry args={[legLength - 0.05, doorHeight, 0.02]} />
            <meshStandardMaterial 
              color={isSelected ? selectedColor : cabinetMaterial} 
              roughness={roughness} 
              metalness={metalness}
            />
          </mesh>
        )}

        {/* EXACT COPY: Side door with improved detail */}
        {enableDoorDetail && (
          <mesh position={[cornerDepth - legLength / 2 + 0.01, plinthHeight/2, 0]}>
            <boxGeometry args={[0.02, doorHeight, legLength - 0.05]} />
            <meshStandardMaterial 
              color={isSelected ? selectedColor : cabinetMaterial} 
              roughness={roughness} 
              metalness={metalness}
            />
          </mesh>
        )}

        {/* Enhanced handles (configurable detail level) */}
        {enableDetailedHandles && (
          <>
            <mesh position={[legLength * 0.3, plinthHeight/2, cornerDepth - legLength / 2 + 0.02]}>
              <boxGeometry args={[0.02, 0.1, 0.02]} />
              <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[cornerDepth - legLength / 2 + 0.02, plinthHeight/2, legLength * 0.3]}>
              <boxGeometry args={[0.02, 0.1, 0.02]} />
              <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
            </mesh>
          </>
        )}
      </group>
    );
  }

  // ============================================================================
  // LARDER CORNER UNIT - EXACT COPY OF ORIGINAL LOGIC
  // ============================================================================
  if (isLarderCornerUnit) {
    return (
      <group 
        position={[x + width / 2, yPosition, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* EXACT COPY: Plinth for larder corner unit */}
        {!isWallCabinet && (
          <mesh position={[0, -height/2 + plinthHeight/2, 0]}>
            <boxGeometry args={[width, plinthHeight, depth]} />
            <meshLambertMaterial color={plinthColor} />
          </mesh>
        )}

        {/* EXACT COPY: Main cabinet body */}
        <mesh position={[0, plinthHeight/2, 0]}>
          <boxGeometry args={[width, cabinetHeight, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>

        {/* EXACT COPY: Door with enhanced materials */}
        {enableDoorDetail && (
          <mesh position={[0, plinthHeight/2, depth / 2 + 0.01]}>
            <boxGeometry args={[width - 0.05, doorHeight, 0.02]} />
            <meshStandardMaterial 
              color={isSelected ? selectedColor : doorColor} 
              roughness={roughness} 
              metalness={metalness}
            />
          </mesh>
        )}

        {/* Enhanced handle */}
        {enableDetailedHandles && (
          <mesh position={[width * 0.3, plinthHeight/2, depth / 2 + 0.02]}>
            <boxGeometry args={[0.02, 0.1, 0.02]} />
            <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
          </mesh>
        )}
      </group>
    );
  }

  // ============================================================================
  // PAN DRAWER UNIT - EXACT COPY OF ORIGINAL LOGIC
  // ============================================================================
  if (isPanDrawer) {
    const cabinetYPosition = plinthHeight / 2; // Define cabinetYPosition for pan drawers
    
    return (
      <group 
        position={[x + width / 2, yPosition, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* EXACT COPY: Plinth */}
        <mesh position={[0, -height/2 + plinthHeight/2, 0]}>
          <boxGeometry args={[width, plinthHeight, depth]} />
          <meshLambertMaterial color={plinthColor} />
        </mesh>

        {/* EXACT COPY: Main cabinet body */}
        <mesh position={[0, cabinetYPosition, 0]}>
          <boxGeometry args={[width, cabinetHeight, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>

        {/* EXACT COPY: Three drawer fronts */}
        {[0, 1, 2].map((drawerIndex) => {
          const drawerHeight = cabinetHeight / 3 - 0.02;
          const drawerY = cabinetYPosition + (drawerIndex - 1) * (cabinetHeight / 3);
          
          return (
            <React.Fragment key={drawerIndex}>
              {/* Drawer front */}
              <mesh position={[0, drawerY, depth / 2 + 0.01]}>
                <boxGeometry args={[width - 0.05, drawerHeight, 0.02]} />
                <meshStandardMaterial 
                  color={isSelected ? selectedColor : doorColor} 
                  roughness={roughness} 
                  metalness={metalness}
                />
              </mesh>
              
              {/* Enhanced drawer handle */}
              {enableDetailedHandles && (
                <mesh position={[width * 0.3, drawerY, depth / 2 + 0.02]}>
                  <boxGeometry args={[0.15, 0.02, 0.02]} />
                  <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
                </mesh>
              )}
            </React.Fragment>
          );
        })}
      </group>
    );
  }

  // ============================================================================
  // STANDARD CABINET - EXACT COPY OF ORIGINAL LOGIC
  // ============================================================================
  const cabinetYPosition = isWallCabinet ? 0 : plinthHeight / 2;
  
  return (
    <group 
      position={[x + width / 2, yPosition, z + depth / 2]} 
      onClick={onClick} 
      rotation={[0, element.rotation * Math.PI / 180, 0]}
    >
      {/* EXACT COPY: Plinth */}
      {!isWallCabinet && (
        <mesh position={[0, -height/2 + plinthHeight/2, -0.1]}>
          <boxGeometry args={[width, plinthHeight, depth - 0.2]} />
          <meshLambertMaterial color={plinthColor} />
        </mesh>
      )}

      {/* EXACT COPY: Main cabinet body with enhanced materials */}
      <mesh position={[0, cabinetYPosition, 0]}>
        <boxGeometry args={[width, cabinetHeight, depth]} />
        <meshStandardMaterial 
          color={isSelected ? selectedColor : cabinetMaterial} 
          roughness={roughness} 
          metalness={metalness}
        />
      </mesh>

      {/* EXACT COPY: Door with enhanced materials */}
      {enableDoorDetail && (
        <mesh position={[0, cabinetYPosition, depth / 2 + 0.01]}>
          <boxGeometry args={[width - 0.05, doorHeight, 0.02]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : doorColor} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>
      )}

      {/* Enhanced handle with configurable style */}
      {enableDetailedHandles && (
        <mesh position={[width * 0.3, cabinetYPosition, depth / 2 + 0.02]}>
          <boxGeometry args={[0.02, 0.1, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>
      )}
    </group>
  );
};

export default EnhancedCabinet3D_v2;
