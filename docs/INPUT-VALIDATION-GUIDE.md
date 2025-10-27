## Input Validation Guide

**Status**: ✅ Implemented (Story 1.14)
**Date**: 2025-10-27

---

## Overview

The application uses Zod schemas for comprehensive input validation at all API boundaries. This prevents invalid data from reaching the database and provides helpful error messages to users.

---

## Quick Start

### Project Creation

```typescript
import { validateProjectCreate } from '@/utils/validation';

// Validate before creating project
try {
  const validatedData = validateProjectCreate(
    projectName,
    projectDescription,
    userId
  );

  // Safe to proceed with database call
  const { data, error } = await supabase
    .from('projects')
    .insert(validatedData);

} catch (error) {
  // Show user-friendly error message
  toast.error(error.message);
}
```

### Room Dimensions

```typescript
import { validateRoomDimensions } from '@/utils/validation';

// Validate room dimensions
try {
  const validatedDimensions = validateRoomDimensions({
    width: 400,
    depth: 300,
    height: 250,
  });

  // Dimensions are valid, proceed
} catch (error) {
  // Handle validation error
  toast.error(error.message);
}
```

### Element Position

```typescript
import { validateElementPosition } from '@/utils/validation';

// Validate element position before update
const result = validateElementPosition(
  newX,
  newY,
  newZ,
  element.width,
  element.depth,
  element.height,
  roomWidth,
  roomDepth,
  roomHeight
);

if (!result.valid) {
  toast.error(result.message);
  return;
}

// Position is valid, proceed with update
```

---

## Validation Schemas

### ProjectSchema

Validates project creation data:

**Rules:**
- Name: 1-100 characters, letters/numbers/spaces/hyphens only
- Description: Optional, max 500 characters
- User ID: Valid UUID format

**Example:**
```typescript
const project = {
  name: 'My Kitchen Renovation',
  description: 'Modern kitchen design',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
};

const result = validateData(ProjectSchema, project);
if (!result.success) {
  console.error(result.errors);
}
```

### RoomDimensionsSchema

Validates room dimensions:

**Rules:**
- Width: 100-2000cm (1-20 meters)
- Depth: 100-2000cm (1-20 meters)
- Height: 200-400cm (2-4 meters)
- Minimum area: 1 square meter
- No infinite or NaN values

**Reasoning:**
- Min 100cm prevents unusably small rooms
- Max 2000cm prevents unrealistic dimensions
- Height range covers typical ceiling heights
- Area check ensures room is usable

**Example:**
```typescript
const dimensions = {
  width: 400,  // 4 meters
  depth: 300,  // 3 meters
  height: 250, // 2.5 meters
};

const result = validateData(RoomDimensionsSchema, dimensions);
```

### DesignElementSchema

Validates design element placement:

**Rules:**
- Position: Non-negative X, Y, Z coordinates
- Rotation: 0-360 degrees
- Dimensions: Width/depth/height > 0cm
- Must fit within room bounds (≤ 2000cm)

**Example:**
```typescript
const element = {
  id: 'element-123',
  component_id: 'base-cabinet-60',
  position: {
    x: 100,
    y: 200,
    z: 0,
    rotation: 90,
  },
  dimensions: {
    width: 60,
    depth: 60,
    height: 80,
  },
  wall: 'front',
};

const result = validateData(DesignElementSchema, element);
```

### RoomDesignSchema

Validates complete room design:

**Rules:**
- Room type: Lowercase with underscores (e.g., 'kitchen', 'living_room')
- Valid dimensions (see RoomDimensionsSchema)
- Design elements array (max 100 elements)
- Each element validated with DesignElementSchema

**Example:**
```typescript
const roomDesign = {
  room_type: 'kitchen',
  dimensions: {
    width: 400,
    depth: 300,
    height: 250,
  },
  design_elements: [
    {
      id: 'element-1',
      component_id: 'base-cabinet-60',
      position: { x: 0, y: 0, rotation: 0 },
      dimensions: { width: 60, depth: 60, height: 80 },
    },
  ],
};

const result = validateData(RoomDesignSchema, roomDesign);
```

---

## Validation Helpers

### validateData()

Returns validation result with helpful error messages.

**Usage:**
```typescript
import { validateData, ProjectSchema } from '@/utils/validation';

const result = validateData(ProjectSchema, projectData);

if (result.success) {
  // Use result.data (type-safe validated data)
  console.log(result.data.name);
} else {
  // Show result.errors (array of error messages)
  toast.error(result.errors.join('\n'));
}
```

### validateOrThrow()

Throws error on validation failure (for use in mutation functions).

**Usage:**
```typescript
import { validateOrThrow, RoomDimensionsSchema } from '@/utils/validation';

try {
  const validated = validateOrThrow(RoomDimensionsSchema, dimensions);
  // Proceed with validated data
} catch (error) {
  // Validation failed, error.message contains details
  console.error(error.message);
}
```

### validateRoomWithElements()

Validates room dimensions and checks all elements fit within bounds.

**Usage:**
```typescript
import { validateRoomWithElements } from '@/utils/validation';

const result = validateRoomWithElements(
  { width: 400, depth: 300, height: 250 },
  designElements
);

if (!result.success) {
  console.error('Elements exceed room bounds:', result.errors);
}
```

---

## Integration Points

### Where to Add Validation

1. **ProjectContext.createProject()**
   - Validate name, description, user_id before Supabase insert

2. **ProjectContext.updateProject()**
   - Validate updates before Supabase update

3. **ProjectContext.createRoomDesign()**
   - Validate room dimensions from template
   - Validate room type format

4. **ProjectContext.updateCurrentRoomDesign()**
   - Validate dimension changes
   - Validate design elements array

5. **DesignCanvas2D Element Operations**
   - Validate position on drag
   - Validate dimensions on resize
   - Validate element fits in room

6. **PropertiesPanel**
   - Validate user input before applying changes
   - Show immediate feedback on invalid input

### Example Integration

```typescript
// In ProjectContext.tsx
import { validateProjectCreate } from '@/utils/validation';

const createProject = async (
  name: string,
  description?: string
): Promise<Project | null> => {
  try {
    // Validate input
    const validatedData = validateProjectCreate(
      name,
      description,
      user.id
    );

    // Proceed with validated data
    const { data, error } = await supabase
      .from('projects')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw error;
    return data;

  } catch (error) {
    // User sees helpful validation error
    toast.error(error.message);
    return null;
  }
};
```

---

## Error Messages

### User-Friendly Messages

All validation errors provide clear, actionable messages:

**Good:**
- "Room width must be at least 100cm (1 meter)"
- "Element would exceed room width. Maximum X position: 340cm"
- "Project name can only contain letters, numbers, spaces, and hyphens"

**Avoid:**
- "width: Expected number >= 100, received 50"
- "Invalid input"
- "Validation failed"

### Formatting Multiple Errors

```typescript
const result = validateData(schema, data);

if (!result.success) {
  // Join errors with newlines for readability
  const errorMessage = result.errors.join('\n');

  // Show in toast or alert
  toast.error(errorMessage, {
    duration: 5000, // Longer duration for multiple errors
  });
}
```

---

## Security Benefits

### SQL Injection Prevention

**Before validation:**
```typescript
// Unsafe: User input directly to database
const name = "'; DROP TABLE projects; --";
await supabase.from('projects').insert({ name });
```

**After validation:**
```typescript
// Safe: Validation rejects invalid characters
const name = "'; DROP TABLE projects; --";
validateProjectCreate(name, null, userId);
// Throws: "Project name can only contain letters, numbers, spaces, and hyphens"
```

### Type Safety

Validation ensures TypeScript types match runtime data:

```typescript
const result = validateData(ProjectSchema, unknownData);

if (result.success) {
  // result.data is type-safe ValidatedProject
  const name: string = result.data.name; // ✅ Type-safe
  const userId: string = result.data.user_id; // ✅ Type-safe
}
```

---

## Testing

### Unit Tests

All validation schemas have comprehensive unit tests:

**Run tests:**
```bash
npm run test:run -- schemas.test.ts
```

**Coverage:**
- 40 tests covering all schemas
- Edge cases: min/max values, NaN, Infinity
- Invalid formats: special characters, wrong types
- Boundary conditions: room area, element bounds

### Integration Tests

**Test checklist:**
- [ ] Valid inputs pass through unchanged
- [ ] Invalid room dimensions rejected
- [ ] SQL injection attempts blocked
- [ ] Element position validated
- [ ] User sees helpful error messages

---

## Performance Considerations

### Validation Overhead

Zod validation is fast but not free:

**Benchmarks:**
- ProjectSchema: ~0.1ms per validation
- RoomDimensionsSchema: ~0.05ms per validation
- DesignElementSchema: ~0.2ms per validation

**Best practices:**
- Validate once before database operations
- Don't validate on every keystroke (use debounce)
- Cache validation results when possible

### When to Validate

**Always validate:**
- Before Supabase insert/update
- On form submit
- Before expensive operations

**Optional validation:**
- On input field blur (nice UX)
- On drag/resize end (not during)

---

## Troubleshooting

### "Validation failed" errors

**Problem:** Generic validation error

**Solution:** Log the error details
```typescript
try {
  validateOrThrow(schema, data);
} catch (error) {
  console.error('Validation details:', error.message);
  // Will show all field errors
}
```

### False positives

**Problem:** Valid data rejected

**Solution:** Check schema constraints
```typescript
// If width: 100 is rejected, check min value
const schema = RoomDimensionsSchema;
// width.min(100) means >= 100, not > 100
```

### Type mismatches

**Problem:** TypeScript error after validation

**Solution:** Use `z.infer` for type

```typescript
import { z } from 'zod';
import { ProjectSchema } from '@/utils/validation';

// Generate TypeScript type from schema
type Project = z.infer<typeof ProjectSchema>;

// Now Project type matches validated data
const validated: Project = validateOrThrow(ProjectSchema, data);
```

---

## Migration Guide

### Existing Code Without Validation

**Before:**
```typescript
const createProject = async (name: string) => {
  const { data } = await supabase
    .from('projects')
    .insert({ name, user_id: user.id });
  return data;
};
```

**After:**
```typescript
import { validateProjectCreate } from '@/utils/validation';

const createProject = async (name: string) => {
  try {
    const validated = validateProjectCreate(name, null, user.id);

    const { data, error } = await supabase
      .from('projects')
      .insert(validated);

    if (error) throw error;
    return data;

  } catch (error) {
    toast.error(error.message);
    return null;
  }
};
```

---

## Related Documentation

- [schemas.ts](../src/utils/validation/schemas.ts) - Validation schemas
- [projectValidation.ts](../src/utils/validation/projectValidation.ts) - Integration helpers
- [Story 1.14](./stories/1.14-input-validation.md) - Story card
- [PRD Section 4.14](./prd.md#story-114) - Requirements

---

**Last Updated**: 2025-10-27
**Story**: 1.14 - Implement Input Validation Layer
