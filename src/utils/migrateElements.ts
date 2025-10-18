// ⚠️ UPDATED 2025-10-18: Migration utility updated - removed isVisible (now using per-view hidden_elements)
// Migration utility for existing DesignElements to add zIndex property
import { DesignElement, getDefaultZIndex } from '@/types/project';

/**
 * Migrates existing DesignElement objects to include zIndex property
 * @param element - The element to migrate
 * @returns The migrated element with zIndex property
 */
export const migrateElement = (element: DesignElement): DesignElement => {
  return {
    ...element,
    zIndex: element.zIndex ?? getDefaultZIndex(element.type, element.id),
    // ⚠️ REMOVED 2025-10-18: isVisible no longer part of DesignElement
    // Now using per-view hidden_elements array in ElevationViewConfig
    // isVisible: element.isVisible ?? true
  };
};

/**
 * Migrates an array of DesignElement objects
 * @param elements - Array of elements to migrate
 * @returns Array of migrated elements
 */
export const migrateElements = (elements: DesignElement[]): DesignElement[] => {
  return elements.map(migrateElement);
};
