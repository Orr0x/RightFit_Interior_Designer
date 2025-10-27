import { describe, it, expect } from 'vitest';
import {
  ProjectSchema,
  ProjectUpdateSchema,
  RoomDimensionsSchema,
  ElementPositionSchema,
  ElementDimensionsSchema,
  DesignElementSchema,
  RoomDesignSchema,
  validateData,
  validateOrThrow,
  validateRoomWithElements,
} from '../schemas';

describe('ProjectSchema', () => {
  it('should validate valid project data', () => {
    const validProject = {
      name: 'My Kitchen Renovation',
      description: 'Modern kitchen design',
      user_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = validateData(ProjectSchema, validProject);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Kitchen Renovation');
    }
  });

  it('should reject empty project name', () => {
    const invalidProject = {
      name: '',
      user_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = validateData(ProjectSchema, invalidProject);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('Project name is required');
    }
  });

  it('should reject project name with special characters', () => {
    const invalidProject = {
      name: 'My Project @#$%',
      user_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = validateData(ProjectSchema, invalidProject);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('can only contain letters');
    }
  });

  it('should reject project name longer than 100 characters', () => {
    const invalidProject = {
      name: 'A'.repeat(101),
      user_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = validateData(ProjectSchema, invalidProject);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('100 characters or less');
    }
  });

  it('should reject invalid UUID format', () => {
    const invalidProject = {
      name: 'Valid Name',
      user_id: 'not-a-uuid',
    };

    const result = validateData(ProjectSchema, invalidProject);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('Invalid user ID format');
    }
  });

  it('should trim whitespace from project name', () => {
    const project = {
      name: '  My Project  ',
      user_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = validateData(ProjectSchema, project);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Project');
    }
  });

  it('should allow null description', () => {
    const project = {
      name: 'My Project',
      description: null,
      user_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = validateData(ProjectSchema, project);
    expect(result.success).toBe(true);
  });
});

describe('ProjectUpdateSchema', () => {
  it('should validate project update with partial fields', () => {
    const update = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Updated Name',
    };

    const result = validateData(ProjectUpdateSchema, update);
    expect(result.success).toBe(true);
  });

  it('should require project ID', () => {
    const update = {
      name: 'Updated Name',
    };

    const result = validateData(ProjectUpdateSchema, update);
    expect(result.success).toBe(false);
  });
});

describe('RoomDimensionsSchema', () => {
  it('should validate valid room dimensions', () => {
    const validDimensions = {
      width: 300,
      depth: 400,
      height: 250,
    };

    const result = validateData(RoomDimensionsSchema, validDimensions);
    expect(result.success).toBe(true);
  });

  it('should reject width below minimum (100cm)', () => {
    const invalidDimensions = {
      width: 50,
      depth: 300,
      height: 250,
    };

    const result = validateData(RoomDimensionsSchema, invalidDimensions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('at least 100cm');
    }
  });

  it('should reject width above maximum (2000cm)', () => {
    const invalidDimensions = {
      width: 2500,
      depth: 300,
      height: 250,
    };

    const result = validateData(RoomDimensionsSchema, invalidDimensions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('2000cm');
    }
  });

  it('should reject height below minimum (200cm)', () => {
    const invalidDimensions = {
      width: 300,
      depth: 300,
      height: 150,
    };

    const result = validateData(RoomDimensionsSchema, invalidDimensions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('200cm');
    }
  });

  it('should reject height above maximum (400cm)', () => {
    const invalidDimensions = {
      width: 300,
      depth: 300,
      height: 500,
    };

    const result = validateData(RoomDimensionsSchema, invalidDimensions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('400cm');
    }
  });

  it('should reject room with area less than 1 square meter', () => {
    const invalidDimensions = {
      width: 50, // 0.5m
      depth: 150, // 1.5m - area = 0.75 m² (< 1 m²)
      height: 250,
    };

    const result = validateData(RoomDimensionsSchema, invalidDimensions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some(e => e.includes('1 square meter'))).toBe(true);
    }
  });

  it('should reject infinite numbers', () => {
    const invalidDimensions = {
      width: Infinity,
      depth: 300,
      height: 250,
    };

    const result = validateData(RoomDimensionsSchema, invalidDimensions);
    expect(result.success).toBe(false);
  });

  it('should reject NaN values', () => {
    const invalidDimensions = {
      width: NaN,
      depth: 300,
      height: 250,
    };

    const result = validateData(RoomDimensionsSchema, invalidDimensions);
    expect(result.success).toBe(false);
  });
});

describe('ElementPositionSchema', () => {
  it('should validate valid position', () => {
    const validPosition = {
      x: 100,
      y: 200,
      z: 50,
      rotation: 90,
    };

    const result = validateData(ElementPositionSchema, validPosition);
    expect(result.success).toBe(true);
  });

  it('should reject negative X position', () => {
    const invalidPosition = {
      x: -10,
      y: 200,
      rotation: 0,
    };

    const result = validateData(ElementPositionSchema, invalidPosition);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('non-negative');
    }
  });

  it('should reject rotation above 360 degrees', () => {
    const invalidPosition = {
      x: 100,
      y: 200,
      rotation: 400,
    };

    const result = validateData(ElementPositionSchema, invalidPosition);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('360 degrees');
    }
  });

  it('should default rotation to 0', () => {
    const position = {
      x: 100,
      y: 200,
    };

    const result = validateData(ElementPositionSchema, position);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rotation).toBe(0);
    }
  });

  it('should allow optional Z position', () => {
    const position = {
      x: 100,
      y: 200,
      rotation: 0,
    };

    const result = validateData(ElementPositionSchema, position);
    expect(result.success).toBe(true);
  });
});

describe('ElementDimensionsSchema', () => {
  it('should validate valid dimensions', () => {
    const validDimensions = {
      width: 60,
      depth: 60,
      height: 80,
    };

    const result = validateData(ElementDimensionsSchema, validDimensions);
    expect(result.success).toBe(true);
  });

  it('should reject width below 1cm', () => {
    const invalidDimensions = {
      width: 0,
      depth: 60,
      height: 80,
    };

    const result = validateData(ElementDimensionsSchema, invalidDimensions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('at least 1cm');
    }
  });

  it('should reject width above 2000cm', () => {
    const invalidDimensions = {
      width: 2500,
      depth: 60,
      height: 80,
    };

    const result = validateData(ElementDimensionsSchema, invalidDimensions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('2000cm');
    }
  });

  it('should allow optional depth and height', () => {
    const dimensions = {
      width: 60,
    };

    const result = validateData(ElementDimensionsSchema, dimensions);
    expect(result.success).toBe(true);
  });
});

describe('DesignElementSchema', () => {
  it('should validate complete design element', () => {
    const validElement = {
      id: 'element-123',
      component_id: 'base-cabinet-60',
      position: {
        x: 100,
        y: 200,
        z: 0,
        rotation: 0,
      },
      dimensions: {
        width: 60,
        depth: 60,
        height: 80,
      },
      wall: 'front' as const,
      metadata: { color: 'white' },
    };

    const result = validateData(DesignElementSchema, validElement);
    expect(result.success).toBe(true);
  });

  it('should reject element exceeding room bounds', () => {
    const invalidElement = {
      id: 'element-123',
      component_id: 'base-cabinet-60',
      position: {
        x: 1950, // x + width = 2010 > 2000
        y: 200,
        rotation: 0,
      },
      dimensions: {
        width: 60,
        depth: 60,
        height: 80,
      },
    };

    const result = validateData(DesignElementSchema, invalidElement);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some(e => e.includes('exceed room bounds'))).toBe(true);
    }
  });

  it('should allow null wall assignment', () => {
    const element = {
      id: 'element-123',
      component_id: 'base-cabinet-60',
      position: { x: 100, y: 200, rotation: 0 },
      dimensions: { width: 60 },
      wall: null,
    };

    const result = validateData(DesignElementSchema, element);
    expect(result.success).toBe(true);
  });
});

describe('RoomDesignSchema', () => {
  it('should validate valid room design', () => {
    const validRoomDesign = {
      room_type: 'kitchen',
      dimensions: {
        width: 400,
        depth: 300,
        height: 250,
      },
      design_elements: [],
      design_settings: {},
    };

    const result = validateData(RoomDesignSchema, validRoomDesign);
    expect(result.success).toBe(true);
  });

  it('should reject invalid room type format', () => {
    const invalidRoomDesign = {
      room_type: 'Kitchen Room', // Should be lowercase with underscores
      dimensions: {
        width: 400,
        depth: 300,
        height: 250,
      },
      design_elements: [],
    };

    const result = validateData(RoomDesignSchema, invalidRoomDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('Invalid room type format');
    }
  });

  it('should reject more than 100 elements', () => {
    const elements = Array.from({ length: 101 }, (_, i) => ({
      id: `element-${i}`,
      component_id: 'base-cabinet-60',
      position: { x: 0, y: 0, rotation: 0 },
      dimensions: { width: 60 },
    }));

    const invalidRoomDesign = {
      room_type: 'kitchen',
      dimensions: {
        width: 400,
        depth: 300,
        height: 250,
      },
      design_elements: elements,
    };

    const result = validateData(RoomDesignSchema, invalidRoomDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('Maximum 100 elements');
    }
  });

  it('should default design_elements to empty array', () => {
    const roomDesign = {
      room_type: 'kitchen',
      dimensions: {
        width: 400,
        depth: 300,
        height: 250,
      },
    };

    const result = validateData(RoomDesignSchema, roomDesign);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.design_elements).toEqual([]);
    }
  });
});

describe('validateOrThrow', () => {
  it('should return validated data on success', () => {
    const validData = {
      width: 300,
      depth: 400,
      height: 250,
    };

    const result = validateOrThrow(RoomDimensionsSchema, validData);
    expect(result).toEqual(validData);
  });

  it('should throw error on validation failure', () => {
    const invalidData = {
      width: 50, // Too small
      depth: 400,
      height: 250,
    };

    expect(() => {
      validateOrThrow(RoomDimensionsSchema, invalidData);
    }).toThrow('Validation failed');
  });
});

describe('validateRoomWithElements', () => {
  it('should validate room with elements within bounds', () => {
    const roomDimensions = { width: 400, depth: 300, height: 250 };
    const elements = [
      {
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 60, depth: 60, height: 80 },
      },
      {
        position: { x: 100, y: 100, z: 0 },
        dimensions: { width: 60, depth: 60, height: 80 },
      },
    ];

    const result = validateRoomWithElements(roomDimensions, elements);
    expect(result.success).toBe(true);
  });

  it('should reject elements exceeding room width', () => {
    const roomDimensions = { width: 400, depth: 300, height: 250 };
    const elements = [
      {
        position: { x: 350, y: 0 }, // 350 + 60 = 410 > 400
        dimensions: { width: 60, depth: 60 },
      },
    ];

    const result = validateRoomWithElements(roomDimensions, elements);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('exceeds room width');
    }
  });

  it('should reject elements exceeding room depth', () => {
    const roomDimensions = { width: 400, depth: 300, height: 250 };
    const elements = [
      {
        position: { x: 0, y: 250 }, // 250 + 60 = 310 > 300
        dimensions: { width: 60, depth: 60 },
      },
    ];

    const result = validateRoomWithElements(roomDimensions, elements);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('exceeds room depth');
    }
  });

  it('should reject elements exceeding room height', () => {
    const roomDimensions = { width: 400, depth: 300, height: 250 };
    const elements = [
      {
        position: { x: 0, y: 0, z: 200 }, // 200 + 80 = 280 > 250
        dimensions: { width: 60, depth: 60, height: 80 },
      },
    ];

    const result = validateRoomWithElements(roomDimensions, elements);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('exceeds room height');
    }
  });

  it('should reject invalid room dimensions', () => {
    const roomDimensions = { width: 50, depth: 300, height: 250 }; // Too small
    const elements: any[] = [];

    const result = validateRoomWithElements(roomDimensions, elements);
    expect(result.success).toBe(false);
  });
});
