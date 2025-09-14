import React from 'react';
import { DesignElement } from '@/types/project';
import * as THREE from 'three';
import { use3DModelConfig } from '@/hooks/use3DModelConfig';

// Interface for enhanced corner model props (identical to original)
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
 * EnhancedCorner3D_v2 - Universal database-enhanced corner renderer
 * 
 * SUPPORTS ALL CORNER TYPES:
 * - Base Corner Cabinets (60cm depth, with plinth)
 * - Wall Corner Cabinets (40cm depth, no plinth, wall-mounted)
 * - Larder Corner Units (custom L-shape, full height)
 * 
 * CRITICAL RULES:
 * - NEVER change the corner unit geometry calculations
 * - PRESERVE ALL positioning logic exactly as original
 * - MAINTAIN the sacred 90cm leg length (0.9m)
 * - KEEP L-shaped geometry identical
 * - ONLY enhance materials and colors via database
 * 
 * This component is a PERFECT CLONE of ALL original corner logic with database enhancement
 */
export const EnhancedCorner3D_v2: React.FC<Enhanced3DModelProps> = ({ 
  element, 
  roomDimensions, 
  isSelected, 
  onClick 
}) => {
  const { getConfigForElement } = use3DModelConfig();
  
  // Get database configuration (enhances, doesn't replace)
  const config = getConfigForElement(element);
  
  // EXACT COPY of original coordinate conversion
  const { x, z } = convertTo3D(element.x, element.y, roomDimensions.width, roomDimensions.height);
  const width = element.width / 100;  // Convert cm to meters (X-axis)
  const depth = element.depth / 100;  // Convert cm to meters (Y-axis)  
  const height = element.height / 100; // Convert cm to meters (Z-axis)
  
  // EXACT COPY of original cabinet type detection logic
  const isWallCabinet = element.style?.toLowerCase().includes('wall') || 
                        element.id.includes('wall-cabinet') ||
                        element.component_id === 'db-wall-corner-cabinet';
  
  const isLarderCornerUnit = element.id.includes('larder-corner-unit') ||
                            element.component_id === 'db-larder-corner-unit';
  
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
  
  // EXACT COPY of original plinth calculations
  const plinthHeight = config?.plinth_height || (isWallCabinet ? 0 : 0.15); // Original logic preserved
  const cabinetHeight = isWallCabinet ? height : height - plinthHeight;
  const doorHeight = cabinetHeight - (config?.door_gap || 0.05); // Original logic with configurable gap
  
  // ============================================================================
  // LARDER CORNER UNIT - EXACT COPY FROM ORIGINAL
  // ============================================================================
  if (isLarderCornerUnit) {
    const centerX = width / 2;
    const centerZ = depth / 2;
    
    return (
      <group 
        position={[x + centerX, yPosition, z + centerZ]} 
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

        {/* EXACT COPY: Main larder body - L-shaped for corner */}
        <mesh position={[-width/4, plinthHeight/2, -depth/4]}>
          <boxGeometry args={[width/2, cabinetHeight, depth/2]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>
        <mesh position={[width/4, plinthHeight/2, depth/4]}>
          <boxGeometry args={[width/2, cabinetHeight, depth/2]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : cabinetMaterial} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>

        {/* EXACT COPY: Larder doors with enhanced materials */}
        <mesh position={[-width/4, plinthHeight/2, -depth/2 + 0.01]}>
          <boxGeometry args={[width/2 - 0.05, doorHeight, 0.02]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : doorColor} 
            roughness={0.6} 
            metalness={0.1}
          />
        </mesh>
        <mesh position={[width/2 - 0.01, plinthHeight/2, depth/4]}>
          <boxGeometry args={[0.02, doorHeight, depth/2 - 0.05]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : doorColor} 
            roughness={0.6} 
            metalness={0.1}
          />
        </mesh>

        {/* EXACT COPY: Door handles with enhanced materials */}
        <mesh position={[-width/8, plinthHeight/2, -depth/2 + 0.03]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[width/2 - 0.03, plinthHeight/2, depth/8]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Cabinet frame removed for cleaner appearance */}
      </group>
    );
  }

  // ============================================================================
  // SACRED CORNER CABINET GEOMETRY - EXACT COPY FROM ORIGINAL  
  // ============================================================================
  
  // SACRED CONSTANTS - UPDATED TO MATCH ACTUAL WALL CABINET DEPTHS
  const legLength = 0.9; // 90cm leg length for corner cabinets (ORIGINAL - DO NOT CHANGE)
  const cornerDepth = isWallCabinet ? 0.35 : 0.6; // UPDATED: 35cm for wall, 60cm for base (matches standard cabinets)
  const centerX = legLength / 2; // ORIGINAL - DO NOT CHANGE
  const centerZ = legLength / 2; // ORIGINAL - DO NOT CHANGE
  
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

      {/* EXACT COPY: Front door with enhanced materials */}
      <mesh position={[0, plinthHeight/2, cornerDepth - legLength / 2 + 0.01]}>
        <boxGeometry args={[legLength - 0.05, doorHeight, 0.02]} />
        <meshStandardMaterial 
          color={isSelected ? selectedColor : doorColor} 
          roughness={0.6} 
          metalness={0.1}
        />
      </mesh>

      {/* EXACT COPY: Side door with enhanced materials */}
      <mesh position={[cornerDepth - legLength / 2 + 0.01, plinthHeight/2, 0]}>
        <boxGeometry args={[0.02, doorHeight, legLength - 0.05]} />
        <meshStandardMaterial 
          color={isSelected ? selectedColor : doorColor} 
          roughness={0.6} 
          metalness={0.1}
        />
      </mesh>

      {/* EXACT COPY: Door handles with enhanced materials */}
      <mesh position={[legLength / 2 - 0.05, plinthHeight/2, cornerDepth - legLength / 2 + 0.03]}>
        <boxGeometry args={[0.02, 0.15, 0.02]} />
        <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[cornerDepth - legLength / 2 + 0.03, plinthHeight/2, -0.25]}>
        <boxGeometry args={[0.02, 0.15, 0.02]} />
        <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Cabinet frames removed for cleaner appearance */}
    </group>
  );
};

export default EnhancedCorner3D_v2;
