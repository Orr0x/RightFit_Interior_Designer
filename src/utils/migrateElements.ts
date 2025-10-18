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
