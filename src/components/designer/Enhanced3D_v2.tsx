import React from 'react';
import { DesignElement } from '@/types/project';
import * as THREE from 'three';
import { use3DModelConfig } from '@/hooks/use3DModelConfig';

// Interface for enhanced model props (universal)
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
 * Enhanced3D_v2 - Universal database-enhanced 3D renderer
 * 
 * SUPPORTS ALL COMPONENT TYPES:
 * - Cabinets (base, wall, corner, larder) ✅
 * - Appliances (all kitchen/laundry appliances) ✅
 * - Counter Tops (stone, wood, composite) ✅
 * - Windows (all frame types) ✅
 * - Doors (all door types) ✅
 * - Flooring (wood, tile, etc.) ✅
 * - Accessories (toe kick, cornice, pelmet, end panels) ✅
 * 
 * CRITICAL RULES:
 * - PRESERVE ALL existing geometry calculations
 * - ONLY enhance materials and colors via database
 * - MAINTAIN identical rendering output to originals
 * - NEVER break existing functionality
 * 
 * This component is a PERFECT CLONE of ALL original logic with database enhancement
 */
export const Enhanced3D_v2: React.FC<Enhanced3DModelProps> = ({ 
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
  
  // Enhanced material colors (database-configurable, with original fallbacks)
  const primaryColor = config?.primary_color || element.color || '#8B4513';
  const doorColor = config?.door_color || '#654321';
  const selectedColor = '#ff6b6b'; // Keep original selection color
  const handleColor = '#C0C0C0'; // Keep original handle color
  
  // Enhanced material properties (database-configurable)
  const roughness = config?.roughness || 0.7;
  const metalness = config?.metalness || 0.1;
  
  // Route to appropriate renderer based on element type
  switch (element.type) {
    case 'cabinet':
      return renderCabinet();
    
    case 'appliance':
      return renderAppliance();
    
    case 'counter-top':
      return renderCounterTop();
    
    case 'window':
      return renderWindow();
    
    case 'door':
      return renderDoor();
    
    case 'flooring':
      return renderFlooring();
    
    case 'toe-kick':
      return renderToeKick();
    
    case 'cornice':
      return renderCornice();
    
    case 'pelmet':
      return renderPelmet();
    
    case 'end-panel':
    case 'wall-unit-end-panel':
      return renderEndPanel();
    
    default:
      return renderGeneric();
  }
  
  // ============================================================================
  // CABINET RENDERER - Enhanced version of EnhancedCabinet3D_v2
  // ============================================================================
  function renderCabinet() {
    // For cabinets, use the specialized corner renderer if it's a corner
    const isCorner = element.id.includes('corner') || 
                     element.component_id?.includes('corner');
    
    if (isCorner) {
      // Import and use the specialized corner renderer
      const { EnhancedCorner3D_v2 } = require('./EnhancedCorner3D_v2');
      return <EnhancedCorner3D_v2 element={element} roomDimensions={roomDimensions} isSelected={isSelected} onClick={onClick} />;
    }
    
    // For non-corner cabinets, use the enhanced cabinet renderer
    const { EnhancedCabinet3D_v2 } = require('./EnhancedCabinet3D_v2');
    return <EnhancedCabinet3D_v2 element={element} roomDimensions={roomDimensions} isSelected={isSelected} onClick={onClick} />;
  }
  
  // ============================================================================
  // APPLIANCE RENDERER - Database-enhanced appliances
  // ============================================================================
  function renderAppliance() {
    const yPosition = height / 2;
    
    return (
      <group 
        position={[x + width / 2, yPosition, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Main appliance body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : primaryColor} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>
        
        {/* Enhanced appliance-specific features can be added here */}
        {config?.appliance_type === 'refrigerator' && renderRefrigeratorFeatures()}
        {config?.appliance_type === 'oven' && renderOvenFeatures()}
        {config?.appliance_type === 'dishwasher' && renderDishwasherFeatures()}
      </group>
    );
  }
  
  // ============================================================================
  // COUNTER TOP RENDERER - Database-enhanced counter tops
  // ============================================================================
  function renderCounterTop() {
    const baseHeight = 0.9; // 90cm standard counter height
    const yPos = baseHeight + (height / 2);
    
    return (
      <group 
        position={[x + width / 2, yPos, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Counter top surface */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : primaryColor} 
            roughness={config?.material_type === 'stone' ? 0.1 : 0.3} 
            metalness={0.0}
          />
        </mesh>
        
        {/* Enhanced edge profile */}
        <mesh position={[0, -height / 2 + 0.005, 0]}>
          <boxGeometry args={[width + 0.01, 0.01, depth + 0.01]} />
          <meshStandardMaterial 
            color={config?.secondary_color || '#B8860B'} 
            roughness={0.2} 
            metalness={0.1}
          />
        </mesh>
      </group>
    );
  }
  
  // ============================================================================
  // WINDOW RENDERER - Database-enhanced windows
  // ============================================================================
  function renderWindow() {
    const baseHeight = 0.9; // 90cm from floor
    const yPos = baseHeight + (height / 2);
    
    return (
      <group 
        position={[x + width / 2, yPos, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Window frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : primaryColor} 
            roughness={0.3} 
            metalness={0.1}
          />
        </mesh>
        
        {/* Window glass */}
        <mesh position={[0, 0, 0.001]}>
          <boxGeometry args={[width - 0.05, height - 0.05, 0.005]} />
          <meshStandardMaterial 
            color="#E6F3FF" 
            transparent={true} 
            opacity={0.7}
            roughness={0.0} 
            metalness={0.0}
          />
        </mesh>
      </group>
    );
  }
  
  // ============================================================================
  // DOOR RENDERER - Database-enhanced doors
  // ============================================================================
  function renderDoor() {
    const yPos = height / 2;
    
    return (
      <group 
        position={[x + width / 2, yPos, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Door panel */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : primaryColor} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>
        
        {/* Door handle */}
        <mesh position={[width * 0.4, 0, depth / 2 + 0.02]}>
          <boxGeometry args={[0.02, 0.15, 0.03]} />
          <meshStandardMaterial 
            color={handleColor} 
            roughness={0.2} 
            metalness={0.8}
          />
        </mesh>
      </group>
    );
  }
  
  // ============================================================================
  // FLOORING RENDERER - Database-enhanced flooring
  // ============================================================================
  function renderFlooring() {
    const yPos = height / 2;
    
    return (
      <group 
        position={[x + width / 2, yPos, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        {/* Flooring surface */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : primaryColor} 
            roughness={config?.flooring_type === 'wood' ? 0.7 : 0.1} 
            metalness={0.0}
          />
        </mesh>
      </group>
    );
  }
  
  // ============================================================================
  // ACCESSORY RENDERERS - Toe kick, cornice, pelmet, end panels
  // ============================================================================
  function renderToeKick() {
    const yPos = height / 2;
    
    return (
      <group 
        position={[x + width / 2, yPos, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : primaryColor} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>
      </group>
    );
  }
  
  function renderCornice() {
    const baseHeight = 2.0; // Top of wall units
    const yPos = baseHeight + (height / 2);
    
    return (
      <group 
        position={[x + width / 2, yPos, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : primaryColor} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>
      </group>
    );
  }
  
  function renderPelmet() {
    const baseHeight = 1.4; // Bottom of wall units
    const yPos = baseHeight - (height / 2);
    
    return (
      <group 
        position={[x + width / 2, yPos, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : primaryColor} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>
      </group>
    );
  }
  
  function renderEndPanel() {
    const isWallUnit = element.type === 'wall-unit-end-panel';
    const yPos = isWallUnit ? 2.0 - height / 2 : height / 2;
    
    return (
      <group 
        position={[x + width / 2, yPos, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : primaryColor} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>
      </group>
    );
  }
  
  // ============================================================================
  // GENERIC RENDERER - Fallback for unknown types
  // ============================================================================
  function renderGeneric() {
    const yPos = height / 2;
    
    return (
      <group 
        position={[x + width / 2, yPos, z + depth / 2]} 
        onClick={onClick} 
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={isSelected ? selectedColor : primaryColor} 
            roughness={roughness} 
            metalness={metalness}
          />
        </mesh>
      </group>
    );
  }
  
  // ============================================================================
  // APPLIANCE-SPECIFIC FEATURE RENDERERS
  // ============================================================================
  function renderRefrigeratorFeatures() {
    return (
      <>
        {/* Refrigerator door handles */}
        <mesh position={[width * 0.4, height * 0.3, depth / 2 + 0.01]}>
          <boxGeometry args={[0.02, 0.3, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[width * 0.4, -height * 0.2, depth / 2 + 0.01]}>
          <boxGeometry args={[0.02, 0.3, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>
      </>
    );
  }
  
  function renderOvenFeatures() {
    return (
      <>
        {/* Oven window */}
        <mesh position={[0, 0, depth / 2 + 0.01]}>
          <boxGeometry args={[width * 0.6, height * 0.4, 0.005]} />
          <meshStandardMaterial color="#000000" transparent opacity={0.8} />
        </mesh>
        
        {/* Oven handle */}
        <mesh position={[0, -height * 0.3, depth / 2 + 0.02]}>
          <boxGeometry args={[width * 0.6, 0.02, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>
      </>
    );
  }
  
  function renderDishwasherFeatures() {
    return (
      <>
        {/* Dishwasher handle */}
        <mesh position={[0, height * 0.4, depth / 2 + 0.02]}>
          <boxGeometry args={[width * 0.6, 0.02, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.8} roughness={0.2} />
        </mesh>
      </>
    );
  }
};

export default Enhanced3D_v2;
