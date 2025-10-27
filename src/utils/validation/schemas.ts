/**
 * Zod Validation Schemas
 *
 * Provides client-side validation for all user inputs before database operations.
 * Ensures data integrity and provides helpful error messages.
 *
 * Story 1.14: Input Validation Layer
 */

import { z } from 'zod';

// ============================================================================
// PROJECT VALIDATION
// ============================================================================

/**
 * Project validation schema
 *
 * Validates:
 * - Project name (1-100 characters, no special chars except spaces/hyphens)
 * - Description (optional, max 500 characters)
 * - User ID (UUID format)
 */
export const ProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be 100 characters or less')
    .regex(
      /^[a-zA-Z0-9\s\-]+$/,
      'Project name can only contain letters, numbers, spaces, and hyphens'
    )
    .trim(),

  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),

  user_id: z
    .string()
    .uuid('Invalid user ID format'),
});

export type ValidatedProject = z.infer<typeof ProjectSchema>;

/**
 * Project update schema (all fields optional except id)
 */
export const ProjectUpdateSchema = ProjectSchema.partial().extend({
  id: z.string().uuid('Invalid project ID'),
});

export type ValidatedProjectUpdate = z.infer<typeof ProjectUpdateSchema>;

// ============================================================================
// ROOM DIMENSIONS VALIDATION
// ============================================================================

/**
 * Room dimensions validation schema
 *
 * Validates:
 * - Width: 100-2000cm (1-20 meters)
 * - Depth: 100-2000cm (1-20 meters)
 * - Height: 200-400cm (2-4 meters, typical ceiling heights)
 *
 * Reasoning:
 * - Min 100cm (1m) prevents unusably small rooms
 * - Max 2000cm (20m) prevents unrealistic dimensions
 * - Height 200-400cm covers typical residential/commercial ceilings
 */
export const RoomDimensionsSchema = z.object({
  width: z
    .number()
    .min(100, 'Room width must be at least 100cm (1 meter)')
    .max(2000, 'Room width must not exceed 2000cm (20 meters)')
    .finite('Room width must be a valid number'),

  depth: z
    .number()
    .min(100, 'Room depth must be at least 100cm (1 meter)')
    .max(2000, 'Room depth must not exceed 2000cm (20 meters)')
    .finite('Room depth must be a valid number'),

  height: z
    .number()
    .min(200, 'Room height must be at least 200cm (2 meters)')
    .max(400, 'Room height must not exceed 400cm (4 meters)')
    .finite('Room height must be a valid number'),
}).refine(
  (data) => data.width * data.depth >= 10000, // At least 1m x 1m = 10,000 cm²
  {
    message: 'Room area must be at least 1 square meter',
    path: ['width'], // Show error on width field
  }
);

export type ValidatedRoomDimensions = z.infer<typeof RoomDimensionsSchema>;

// ============================================================================
// DESIGN ELEMENT VALIDATION
// ============================================================================

/**
 * Design element position validation
 *
 * Validates:
 * - Position within room bounds
 * - Non-negative coordinates
 * - Valid rotation angles
 */
export const ElementPositionSchema = z.object({
  x: z
    .number()
    .min(0, 'X position must be non-negative')
    .finite('X position must be a valid number'),

  y: z
    .number()
    .min(0, 'Y position must be non-negative')
    .finite('Y position must be a valid number'),

  z: z
    .number()
    .min(0, 'Z position (height) must be non-negative')
    .max(400, 'Z position cannot exceed room height (400cm)')
    .finite('Z position must be a valid number')
    .optional(),

  rotation: z
    .number()
    .min(0, 'Rotation must be between 0 and 360 degrees')
    .max(360, 'Rotation must be between 0 and 360 degrees')
    .finite('Rotation must be a valid number')
    .default(0),
});

/**
 * Design element dimensions validation
 *
 * Validates:
 * - Positive dimensions
 * - Reasonable maximum sizes (not larger than room)
 */
export const ElementDimensionsSchema = z.object({
  width: z
    .number()
    .min(1, 'Width must be at least 1cm')
    .max(2000, 'Width cannot exceed 2000cm')
    .finite('Width must be a valid number'),

  depth: z
    .number()
    .min(1, 'Depth must be at least 1cm')
    .max(2000, 'Depth cannot exceed 2000cm')
    .finite('Depth must be a valid number')
    .optional(),

  height: z
    .number()
    .min(1, 'Height must be at least 1cm')
    .max(400, 'Height cannot exceed 400cm (room height)')
    .finite('Height must be a valid number')
    .optional(),
});

/**
 * Complete design element validation
 *
 * Validates:
 * - Element ID
 * - Component ID reference
 * - Position and dimensions
 * - Wall assignment (optional)
 */
export const DesignElementSchema = z.object({
  id: z.string().min(1, 'Element ID is required'),

  component_id: z.string().min(1, 'Component ID is required'),

  position: ElementPositionSchema,

  dimensions: ElementDimensionsSchema,

  wall: z
    .enum(['front', 'back', 'left', 'right'])
    .optional()
    .nullable(),

  metadata: z.record(z.unknown()).optional().nullable(),
}).refine(
  (data) => {
    // Ensure element fits within typical room bounds
    const maxX = data.position.x + data.dimensions.width;
    const maxY = data.position.y + (data.dimensions.depth || 0);

    return maxX <= 2000 && maxY <= 2000;
  },
  {
    message: 'Element position + dimensions exceed room bounds (max 2000cm)',
    path: ['position'],
  }
);

export type ValidatedDesignElement = z.infer<typeof DesignElementSchema>;

// ============================================================================
// ROOM DESIGN VALIDATION
// ============================================================================

/**
 * Room design validation schema
 *
 * Validates:
 * - Room type
 * - Room dimensions
 * - Design elements array
 */
export const RoomDesignSchema = z.object({
  room_type: z
    .string()
    .min(1, 'Room type is required')
    .regex(/^[a-z_]+$/, 'Invalid room type format'),

  dimensions: RoomDimensionsSchema,

  design_elements: z
    .array(DesignElementSchema)
    .max(100, 'Maximum 100 elements per room')
    .default([]),

  design_settings: z.record(z.unknown()).optional().nullable(),
});

export type ValidatedRoomDesign = z.infer<typeof RoomDesignSchema>;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validate data against a schema and return helpful error messages
 *
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validation result with data or errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into user-friendly messages
  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { success: false, errors };
}

/**
 * Validate data and throw on error (for use in mutation functions)
 *
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validated data
 * @throws Error with user-friendly message
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = validateData(schema, data);

  if (!result.success) {
    throw new Error(`Validation failed:\n${result.errors.join('\n')}`);
  }

  return result.data;
}

/**
 * Validate room dimensions with element bounds checking
 *
 * Ensures all design elements fit within room dimensions
 *
 * @param roomDimensions Room dimensions to validate
 * @param elements Design elements in the room
 * @returns Validation result
 */
export function validateRoomWithElements(
  roomDimensions: { width: number; depth: number; height: number },
  elements: Array<{ position: { x: number; y: number; z?: number }; dimensions: { width: number; depth?: number; height?: number } }>
): { success: true } | { success: false; errors: string[] } {
  // First validate room dimensions
  const roomResult = validateData(RoomDimensionsSchema, roomDimensions);
  if (!roomResult.success) {
    return roomResult;
  }

  const errors: string[] = [];

  // Check each element fits within room
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    // Check X bounds
    const maxX = element.position.x + element.dimensions.width;
    if (maxX > roomDimensions.width) {
      errors.push(`Element ${i + 1}: X position (${maxX}cm) exceeds room width (${roomDimensions.width}cm)`);
    }

    // Check Y bounds
    if (element.dimensions.depth) {
      const maxY = element.position.y + element.dimensions.depth;
      if (maxY > roomDimensions.depth) {
        errors.push(`Element ${i + 1}: Y position (${maxY}cm) exceeds room depth (${roomDimensions.depth}cm)`);
      }
    }

    // Check Z bounds
    if (element.position.z !== undefined && element.dimensions.height) {
      const maxZ = element.position.z + element.dimensions.height;
      if (maxZ > roomDimensions.height) {
        errors.push(`Element ${i + 1}: Z position (${maxZ}cm) exceeds room height (${roomDimensions.height}cm)`);
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true };
}
