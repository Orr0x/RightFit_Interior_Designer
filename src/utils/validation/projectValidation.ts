/**
 * Project Validation Integration
 *
 * Provides validation wrappers for ProjectContext operations
 * to be used before database calls.
 *
 * Story 1.14: Input Validation Layer
 */

import {
  ProjectSchema,
  ProjectUpdateSchema,
  RoomDimensionsSchema,
  RoomDesignSchema,
  validateOrThrow,
  validateData,
} from './schemas';
import { Logger } from '../Logger';

/**
 * Validate project creation data
 *
 * @param name Project name
 * @param description Project description (optional)
 * @param userId User ID
 * @returns Validated project data
 * @throws Error with validation message if invalid
 */
export function validateProjectCreate(
  name: string,
  description: string | undefined | null,
  userId: string
): { name: string; description: string | null; user_id: string } {
  Logger.debug('[Validation] Validating project creation', { name, userId });

  const projectData = {
    name,
    description: description || null,
    user_id: userId,
  };

  try {
    const validated = validateOrThrow(ProjectSchema, projectData);
    Logger.debug('[Validation] Project creation validated successfully');
    return validated;
  } catch (error) {
    Logger.error('[Validation] Project creation validation failed', error as Error);
    throw error;
  }
}

/**
 * Validate project update data
 *
 * @param projectId Project ID
 * @param updates Partial project updates
 * @returns Validated update data
 * @throws Error with validation message if invalid
 */
export function validateProjectUpdate(
  projectId: string,
  updates: {
    name?: string;
    description?: string | null;
  }
): { id: string; name?: string; description?: string | null } {
  Logger.debug('[Validation] Validating project update', { projectId, updates });

  const updateData = {
    id: projectId,
    ...updates,
  };

  try {
    const validated = validateOrThrow(ProjectUpdateSchema, updateData);
    Logger.debug('[Validation] Project update validated successfully');
    return validated;
  } catch (error) {
    Logger.error('[Validation] Project update validation failed', error as Error);
    throw error;
  }
}

/**
 * Validate room dimensions
 *
 * @param dimensions Room dimensions (width, depth, height)
 * @returns Validated dimensions
 * @throws Error with validation message if invalid
 */
export function validateRoomDimensions(dimensions: {
  width: number;
  depth: number;
  height: number;
}): { width: number; depth: number; height: number } {
  Logger.debug('[Validation] Validating room dimensions', dimensions);

  try {
    const validated = validateOrThrow(RoomDimensionsSchema, dimensions);
    Logger.debug('[Validation] Room dimensions validated successfully');
    return validated;
  } catch (error) {
    Logger.error('[Validation] Room dimensions validation failed', error as Error);
    throw error;
  }
}

/**
 * Validate room design data
 *
 * @param roomType Room type
 * @param dimensions Room dimensions
 * @param designElements Design elements array
 * @returns Validation result
 */
export function validateRoomDesign(
  roomType: string,
  dimensions: { width: number; depth: number; height: number },
  designElements: any[] = []
): { success: true } | { success: false; errors: string[] } {
  Logger.debug('[Validation] Validating room design', {
    roomType,
    dimensions,
    elementCount: designElements.length,
  });

  const roomDesign = {
    room_type: roomType,
    dimensions,
    design_elements: designElements,
  };

  const result = validateData(RoomDesignSchema, roomDesign);

  if (!result.success) {
    Logger.warn('[Validation] Room design validation failed', { errors: result.errors });
  } else {
    Logger.debug('[Validation] Room design validated successfully');
  }

  return result;
}

/**
 * Validate element updates before saving
 *
 * Checks if elements fit within room bounds
 *
 * @param roomWidth Room width in cm
 * @param roomDepth Room depth in cm
 * @param roomHeight Room height in cm
 * @param elements Design elements
 * @returns Validation result
 */
export function validateElementsInRoom(
  roomWidth: number,
  roomDepth: number,
  roomHeight: number,
  elements: Array<{
    position: { x: number; y: number; z?: number };
    width?: number;
    depth?: number;
    height?: number;
  }>
): { success: true } | { success: false; errors: string[] } {
  Logger.debug('[Validation] Validating elements in room', {
    roomWidth,
    roomDepth,
    roomHeight,
    elementCount: elements.length,
  });

  const errors: string[] = [];

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    // Check X bounds
    if (element.width) {
      const maxX = element.position.x + element.width;
      if (maxX > roomWidth) {
        errors.push(
          `Element ${i + 1}: X position (${maxX}cm) exceeds room width (${roomWidth}cm)`
        );
      }
    }

    // Check Y bounds
    if (element.depth) {
      const maxY = element.position.y + element.depth;
      if (maxY > roomDepth) {
        errors.push(
          `Element ${i + 1}: Y position (${maxY}cm) exceeds room depth (${roomDepth}cm)`
        );
      }
    }

    // Check Z bounds
    if (element.position.z !== undefined && element.height) {
      const maxZ = element.position.z + element.height;
      if (maxZ > roomHeight) {
        errors.push(
          `Element ${i + 1}: Z position (${maxZ}cm) exceeds room height (${roomHeight}cm)`
        );
      }
    }
  }

  if (errors.length > 0) {
    Logger.warn('[Validation] Elements exceed room bounds', { errors });
    return { success: false, errors };
  }

  Logger.debug('[Validation] All elements within room bounds');
  return { success: true };
}

/**
 * Validate element position update
 *
 * Ensures element stays within room bounds after position change
 *
 * @param x New X position
 * @param y New Y position
 * @param z New Z position (optional)
 * @param elementWidth Element width
 * @param elementDepth Element depth (optional)
 * @param elementHeight Element height (optional)
 * @param roomWidth Room width
 * @param roomDepth Room depth
 * @param roomHeight Room height
 * @returns Validation result with helpful message
 */
export function validateElementPosition(
  x: number,
  y: number,
  z: number | undefined,
  elementWidth: number,
  elementDepth: number | undefined,
  elementHeight: number | undefined,
  roomWidth: number,
  roomDepth: number,
  roomHeight: number
): { valid: true } | { valid: false; message: string } {
  // Check X bounds
  const maxX = x + elementWidth;
  if (maxX > roomWidth) {
    return {
      valid: false,
      message: `Element would exceed room width. Maximum X position: ${roomWidth - elementWidth}cm`,
    };
  }

  // Check Y bounds
  if (elementDepth) {
    const maxY = y + elementDepth;
    if (maxY > roomDepth) {
      return {
        valid: false,
        message: `Element would exceed room depth. Maximum Y position: ${roomDepth - elementDepth}cm`,
      };
    }
  }

  // Check Z bounds
  if (z !== undefined && elementHeight) {
    const maxZ = z + elementHeight;
    if (maxZ > roomHeight) {
      return {
        valid: false,
        message: `Element would exceed room height. Maximum Z position: ${roomHeight - elementHeight}cm`,
      };
    }
  }

  // Check negative positions
  if (x < 0 || y < 0 || (z !== undefined && z < 0)) {
    return {
      valid: false,
      message: 'Element position cannot be negative',
    };
  }

  return { valid: true };
}
