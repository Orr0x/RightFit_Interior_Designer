import React from 'react';
import { DesignElement } from '@/types/project';
import { Enhanced3D_v2 } from './Enhanced3D_v2';
import { EnhancedCabinet3D_v2 } from './EnhancedCabinet3D_v2';
import { EnhancedCorner3D_v2 } from './EnhancedCorner3D_v2';
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
  EnhancedWallUnitEndPanel3D
} from './EnhancedModels3D';

interface SafeEnhancedRendererProps {
  element: DesignElement;
  roomDimensions: { width: number; height: number };
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * SafeEnhancedRenderer - SAFE testing of enhanced cabinets
 * 
 * SAFETY RULES:
 * - NEVER touches corner units (uses original)
 * - Only tests standard cabinets
 * - Environment variable controlled
 * - Falls back to original on any error
 */
export const SafeEnhancedRenderer: React.FC<SafeEnhancedRendererProps> = ({
  element,
  roomDimensions,
  isSelected = false,
  onClick
}) => {
  const commonProps = {
    element,
    roomDimensions,
    isSelected,
    onClick
  };

  // Helper function to get the appropriate original renderer
  const getOriginalRenderer = () => {
    switch (element.type) {
      case 'cabinet':
        return <EnhancedCabinet3D {...commonProps} />;
      case 'appliance':
        return <EnhancedAppliance3D {...commonProps} />;
      case 'counter-top':
        return <EnhancedCounterTop3D {...commonProps} />;
      case 'end-panel':
        return <EnhancedEndPanel3D {...commonProps} />;
      case 'window':
        return <EnhancedWindow3D {...commonProps} />;
      case 'door':
        return <EnhancedDoor3D {...commonProps} />;
      case 'flooring':
        return <EnhancedFlooring3D {...commonProps} />;
      case 'toe-kick':
        return <EnhancedToeKick3D {...commonProps} />;
      case 'cornice':
        return <EnhancedCornice3D {...commonProps} />;
      case 'pelmet':
        return <EnhancedPelmet3D {...commonProps} />;
      case 'wall-unit-end-panel':
        return <EnhancedWallUnitEndPanel3D {...commonProps} />;
      default:
        return <EnhancedCabinet3D {...commonProps} />;
    }
  };

  // SAFETY CHECK: Detect corner units (original vs DB)
  const isOriginalCornerUnit = element.id.includes('corner-cabinet') || 
                               element.id.includes('corner-unit') ||
                               (element.style?.toLowerCase().includes('corner') && !element.id.includes('db-corner'));
  
  const isDBCornerUnit = element.id.includes('db-corner') || 
                         element.component_id === 'db-corner-base-cabinet' ||
                         element.component_id === 'db-wall-corner-cabinet' ||
                         element.component_id === 'db-larder-corner-unit';
  
  // Universal DB component detection
  const isDBComponent = element.id.includes('db-') || 
                        element.component_id?.startsWith('db-') ||
                        isDBCornerUnit;

  // Environment flags for safe testing
  const testEnhancedCabinets = import.meta.env.VITE_TEST_ENHANCED_CABINET === 'true';
  const testDBCornerUnits = import.meta.env.VITE_TEST_DB_CORNER === 'true';
  const testAllDBComponents = import.meta.env.VITE_TEST_ALL_DB === 'true';

  // Route to appropriate component
  if (element.type === 'cabinet') {
    // GOLDEN RULE: Original corner units ALWAYS use original renderer
    if (isOriginalCornerUnit) {
      console.log('🛡️ Original corner unit detected - using ORIGINAL (GOLDEN RULE)');
      return <EnhancedCabinet3D {...commonProps} />;
    }
    
    // DB CORNER UNITS: Test new database-driven corner renderer
    if (isDBCornerUnit) {
      if (testDBCornerUnits) {
        try {
          const cornerType = element.component_id === 'db-wall-corner-cabinet' ? 'Wall' :
                           element.component_id === 'db-larder-corner-unit' ? 'Larder' : 'Base';
          console.log(`🔥 Testing DB ${cornerType} corner unit for:`, element.id);
          return (
            <React.Suspense fallback={<EnhancedCabinet3D {...commonProps} />}>
              <EnhancedCorner3D_v2 {...commonProps} />
            </React.Suspense>
          );
        } catch (error) {
          console.error('❌ DB corner unit failed, falling back to original:', error);
          return <EnhancedCabinet3D {...commonProps} />;
        }
      } else {
        console.log('🔒 DB corner testing disabled - using original');
        return <EnhancedCabinet3D {...commonProps} />;
      }
    }
    
    // Test enhanced version for standard cabinets only
    if (testEnhancedCabinets) {
      try {
        console.log('🧪 Testing enhanced cabinet for:', element.id);
        return (
          <React.Suspense fallback={<EnhancedCabinet3D {...commonProps} />}>
            <EnhancedCabinet3D_v2 {...commonProps} />
          </React.Suspense>
        );
      } catch (error) {
        console.error('❌ Enhanced cabinet failed, falling back to original:', error);
        return <EnhancedCabinet3D {...commonProps} />;
      }
    }
    
    // Default to original
    return <EnhancedCabinet3D {...commonProps} />;
  }
  
  // UNIVERSAL DB COMPONENT HANDLER - All non-cabinet DB components
  if (isDBComponent && !isDBCornerUnit) {
    if (testAllDBComponents) {
      try {
        const componentType = element.component_id?.replace('db-', '').replace(/-/g, ' ') || element.type;
        console.log(`🚀 Testing DB ${componentType} for:`, element.id);
        return (
          <React.Suspense fallback={getOriginalRenderer()}>
            <Enhanced3D_v2 {...commonProps} />
          </React.Suspense>
        );
      } catch (error) {
        console.error('❌ DB component failed, falling back to original:', error);
        return getOriginalRenderer();
      }
    } else {
      console.log('🔒 DB component testing disabled - using original');
      return getOriginalRenderer();
    }
  }
  
  // All other component types use original (unchanged)
  switch (element.type) {
    case 'appliance':
      return <EnhancedAppliance3D {...commonProps} />;
    
    case 'counter-top':
      return <EnhancedCounterTop3D {...commonProps} />;
    
    case 'end-panel':
      return <EnhancedEndPanel3D {...commonProps} />;
    
    case 'window':
      return <EnhancedWindow3D {...commonProps} />;
    
    case 'door':
      return <EnhancedDoor3D {...commonProps} />;
    
    case 'flooring':
      return <EnhancedFlooring3D {...commonProps} />;
    
    case 'toe-kick':
      return <EnhancedToeKick3D {...commonProps} />;
    
    case 'cornice':
      return <EnhancedCornice3D {...commonProps} />;
    
    case 'pelmet':
      return <EnhancedPelmet3D {...commonProps} />;
    
    case 'wall-unit-end-panel':
      return <EnhancedWallUnitEndPanel3D {...commonProps} />;
    
    default:
      return <EnhancedCabinet3D {...commonProps} />;
  }
};

export default SafeEnhancedRenderer;
