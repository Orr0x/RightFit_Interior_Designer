import { useCallback } from 'react';
import { DesignElement, RoomType } from '@/types/project';
import { toast } from 'sonner';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const useDesignValidation = () => {
  
  const validateElement = useCallback((element: DesignElement, roomType: RoomType): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic element validation
    if (element.width <= 0 || element.height <= 0) {
      errors.push(`Element ${element.id} has invalid dimensions`);
    }

    if (element.x < 0 || element.y < 0) {
      warnings.push(`Element ${element.id} is positioned outside the room bounds`);
    }

    // Room-specific validations
    if (roomType === 'kitchen') {
      // Kitchen-specific validations
      if (element.type === 'cabinet' && element.id.includes('corner')) {
        // Ensure corner units maintain proper dimensions
        if (element.width !== element.height) {
          warnings.push(`Corner cabinet ${element.id} should have equal width and height for proper geometry`);
        }
      }
      
      if (element.type === 'appliance' && element.id.includes('refrigerator')) {
        if (element.width < 60 || element.height < 60) {
          warnings.push(`Refrigerator ${element.id} might be too small for standard appliances`);
        }
      }
    }

    if (roomType === 'bathroom') {
      // Bathroom-specific validations
      if (element.type === 'appliance' && element.id.includes('shower')) {
        if (element.width < 90 || element.height < 90) {
          warnings.push(`Shower tray ${element.id} should be at least 90x90cm for comfortable use`);
        }
      }
    }

    if (roomType === 'bedroom') {
      // Bedroom-specific validations
      if (element.type === 'appliance' && element.id.includes('bed')) {
        if (element.width < 140 && element.height < 200) {
          warnings.push(`Bed ${element.id} might be too small for comfortable sleeping`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  const validateDesign = useCallback((design: Design): ValidationResult => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Validate room dimensions
    if (design.roomDimensions.width < 100 || design.roomDimensions.height < 100) {
      allErrors.push('Room dimensions are too small (minimum 100cm x 100cm)');
    }

    if (design.roomDimensions.width > 2000 || design.roomDimensions.height > 2000) {
      allWarnings.push('Room dimensions are very large and might affect performance');
    }

    // Validate each element
    design.elements.forEach(element => {
      const elementValidation = validateElement(element, design.roomType);
      allErrors.push(...elementValidation.errors);
      allWarnings.push(...elementValidation.warnings);

      // Check if element is within room bounds
      if (element.x + element.width > design.roomDimensions.width ||
          element.y + element.height > design.roomDimensions.height) {
        allWarnings.push(`Element ${element.id} extends beyond room boundaries`);
      }
    });

    // Check for overlapping elements (basic collision detection)
    const overlappingPairs: string[] = [];
    for (let i = 0; i < design.elements.length; i++) {
      for (let j = i + 1; j < design.elements.length; j++) {
        const el1 = design.elements[i];
        const el2 = design.elements[j];
        
        // Simple rectangular collision detection
        if (el1.x < el2.x + el2.width &&
            el1.x + el1.width > el2.x &&
            el1.y < el2.y + el2.height &&
            el1.y + el1.height > el2.y) {
          overlappingPairs.push(`${el1.id} and ${el2.id}`);
        }
      }
    }

    if (overlappingPairs.length > 0) {
      allWarnings.push(`Overlapping elements detected: ${overlappingPairs.join(', ')}`);
    }

    // Room-specific design validations
    if (design.roomType === 'kitchen') {
      const hasCornerCabinets = design.elements.some(el => el.id.includes('corner'));
      const hasSink = design.elements.some(el => el.id.includes('dishwasher') || el.id.includes('sink'));
      
      if (design.elements.length > 5 && !hasSink) {
        allWarnings.push('Large kitchen design without sink or dishwasher - consider adding water source');
      }

      if (hasCornerCabinets) {
        // Extra validation for corner cabinets to ensure geometry integrity
        const cornerCabinets = design.elements.filter(el => el.id.includes('corner'));
        cornerCabinets.forEach(corner => {
          if (corner.rotation % 90 !== 0) {
            allWarnings.push(`Corner cabinet ${corner.id} should be rotated in 90-degree increments for proper fit`);
          }
        });
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }, [validateElement]);

  const showValidationResults = useCallback((result: ValidationResult) => {
    if (result.errors.length > 0) {
      result.errors.forEach(error => toast.error(error));
    }
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => toast.warning(warning));
    }

    if (result.isValid && result.warnings.length === 0) {
      toast.success('Design validation passed!');
    }
  }, []);

  return {
    validateElement,
    validateDesign,
    showValidationResults
  };
};