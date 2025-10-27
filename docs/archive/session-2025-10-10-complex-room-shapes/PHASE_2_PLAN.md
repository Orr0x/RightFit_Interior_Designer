# Phase 2: TypeScript Interfaces & Service Layer

**Date Started:** 2025-10-10
**Phase:** 2 of 6 (TypeScript Interfaces & Service Layer - Weeks 3-4)
**Status:** 🎯 STARTING

---

## Overview

Phase 2 creates the TypeScript layer that sits between the database (Phase 1) and the UI/rendering components (Phases 3-5). This includes type-safe interfaces, service methods, and validation logic.

---

## Goals

1. **Type Safety** - Define strict TypeScript interfaces for all geometry structures
2. **Service Layer** - Extend RoomService to load and apply geometry templates
3. **Validation** - Ensure JSONB data integrity and catch invalid geometries
4. **Developer Experience** - Full IDE autocomplete and type checking

---

## Tasks Breakdown

### Task 1: Update Supabase Types ⏱️ 5 minutes

**Action:** Generate TypeScript types from database schema

**Commands:**
```bash
# Generate types from cloud database (if using remote)
npx supabase gen types typescript --project-id akfdezesupzuvukqiggn > src/types/supabase.ts

# Or from local (if Docker is running)
npx supabase gen types typescript --local > src/types/supabase.ts
```

**Expected Changes:**
- `room_geometry_templates` table types
- `room_designs.room_geometry` column type (JSONB)

**Files Modified:**
- `src/types/supabase.ts`

---

### Task 2: Define Core Geometry Interfaces ⏱️ 1 hour

**Create:** `src/types/RoomGeometry.ts`

**Interfaces to Define:**

```typescript
// Core geometry types
export interface RoomGeometry {
  shape_type: RoomShapeType;
  bounding_box: BoundingBox;
  floor: FloorGeometry;
  walls: WallSegment[];
  ceiling: CeilingGeometry;
  sections?: RoomSection[];
  metadata: RoomMetadata;
}

export type RoomShapeType = 'rectangle' | 'l-shape' | 'u-shape' | 't-shape' | 'custom';

export interface BoundingBox {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
}

export interface FloorGeometry {
  type: 'polygon';
  vertices: [number, number][];
  elevation: number;
  material?: string;
  material_zones?: MaterialZone[];
}

export interface WallSegment {
  id: string;
  start: [number, number];
  end: [number, number];
  height: number;
  thickness?: number;
  type: WallType;
  material?: string;
}

export type WallType = 'solid' | 'door' | 'window' | 'opening';

export interface CeilingGeometry {
  type: CeilingType;
  zones: CeilingZone[];
}

export type CeilingType = 'flat' | 'vaulted' | 'sloped';

export interface CeilingZone {
  vertices: [number, number][];
  height: number;
  style: 'flat' | 'vaulted';
}

export interface RoomSection {
  id: string;
  name?: string;
  type?: 'primary' | 'secondary' | 'arm';
  vertices: [number, number][];
}

export interface RoomMetadata {
  total_floor_area: number;   // cm²
  total_wall_area?: number;    // cm²
  usable_floor_area?: number;  // cm²
  total_perimeter?: number;    // cm
}

export interface MaterialZone {
  vertices: [number, number][];
  material: string;
}

// Parameter configuration types
export interface ParameterConfig {
  configurable_params: ConfigurableParam[];
  template_variables?: Record<string, string>;
}

export interface ConfigurableParam {
  name: string;
  label: string;
  type: 'number';
  min: number;
  max: number;
  default: number;
  step?: number;
  unit: 'cm';
  description?: string;
}

// Template types
export interface RoomGeometryTemplate {
  id: string;
  template_name: string;
  display_name: string;
  description?: string;
  category: TemplateCategory;
  preview_image_url?: string;
  geometry_definition: RoomGeometry;
  parameter_config?: ParameterConfig;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type TemplateCategory = 'standard' | 'l-shape' | 'u-shape' | 't-shape' | 'custom';

// Validation types
export interface GeometryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

**Files Created:**
- `src/types/RoomGeometry.ts`

---

### Task 3: Create Geometry Validation Utilities ⏱️ 2 hours

**Create:** `src/utils/GeometryValidator.ts`

**Validation Functions:**

```typescript
import { RoomGeometry, GeometryValidationResult, WallSegment } from '@/types/RoomGeometry';

export class GeometryValidator {
  /**
   * Validate complete room geometry structure
   */
  static validateRoomGeometry(geometry: RoomGeometry): GeometryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate floor polygon
    const floorResult = this.validatePolygon(geometry.floor.vertices, 'floor');
    errors.push(...floorResult.errors);
    warnings.push(...floorResult.warnings);

    // 2. Validate walls
    const wallsResult = this.validateWalls(geometry.walls, geometry.floor.vertices);
    errors.push(...wallsResult.errors);
    warnings.push(...wallsResult.warnings);

    // 3. Validate ceiling
    const ceilingResult = this.validateCeiling(geometry.ceiling);
    errors.push(...ceilingResult.errors);
    warnings.push(...ceilingResult.warnings);

    // 4. Validate bounding box
    const bboxResult = this.validateBoundingBox(geometry.bounding_box, geometry.floor.vertices);
    errors.push(...bboxResult.errors);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate polygon vertices
   */
  static validatePolygon(
    vertices: [number, number][],
    context: string
  ): GeometryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum vertices
    if (vertices.length < 3) {
      errors.push(`${context}: Polygon must have at least 3 vertices (has ${vertices.length})`);
    }

    // Check maximum vertices (performance limit)
    if (vertices.length > 100) {
      warnings.push(`${context}: Polygon has ${vertices.length} vertices (>100 may impact performance)`);
    }

    // Check for duplicate consecutive vertices
    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      if (vertices[i][0] === vertices[next][0] && vertices[i][1] === vertices[next][1]) {
        warnings.push(`${context}: Duplicate consecutive vertices at index ${i}`);
      }
    }

    // Check for self-intersections (simplified check)
    if (this.hasSimpleSelfIntersection(vertices)) {
      errors.push(`${context}: Polygon has self-intersecting edges`);
    }

    // Check if polygon is closed (first and last vertex should be different)
    const first = vertices[0];
    const last = vertices[vertices.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
      warnings.push(`${context}: First and last vertices are identical (polygon auto-closes)`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate walls align with floor perimeter
   */
  static validateWalls(
    walls: WallSegment[],
    floorVertices: [number, number][]
  ): GeometryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (walls.length < 3) {
      errors.push(`Must have at least 3 walls (has ${walls.length})`);
    }

    // Check wall connectivity
    for (let i = 0; i < walls.length - 1; i++) {
      const currentEnd = walls[i].end;
      const nextStart = walls[i + 1].start;

      if (currentEnd[0] !== nextStart[0] || currentEnd[1] !== nextStart[1]) {
        warnings.push(`Wall ${walls[i].id} end does not connect to wall ${walls[i + 1].id} start`);
      }
    }

    // Check wall heights
    walls.forEach((wall, i) => {
      if (wall.height <= 0) {
        errors.push(`Wall ${wall.id}: height must be positive (has ${wall.height})`);
      }
      if (wall.height > 500) {
        warnings.push(`Wall ${wall.id}: height ${wall.height}cm is unusually tall (>5m)`);
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate ceiling geometry
   */
  static validateCeiling(ceiling: any): GeometryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!ceiling.zones || ceiling.zones.length === 0) {
      errors.push('Ceiling must have at least one zone');
    }

    ceiling.zones?.forEach((zone: any, i: number) => {
      if (!zone.vertices || zone.vertices.length < 3) {
        errors.push(`Ceiling zone ${i}: must have at least 3 vertices`);
      }
      if (zone.height <= 0) {
        errors.push(`Ceiling zone ${i}: height must be positive`);
      }
      if (zone.height > 600) {
        warnings.push(`Ceiling zone ${i}: height ${zone.height}cm is unusually tall (>6m)`);
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate bounding box contains all floor vertices
   */
  static validateBoundingBox(
    bbox: any,
    vertices: [number, number][]
  ): GeometryValidationResult {
    const errors: string[] = [];

    vertices.forEach(([x, y], i) => {
      if (x < bbox.min_x || x > bbox.max_x || y < bbox.min_y || y > bbox.max_y) {
        errors.push(`Vertex ${i} [${x}, ${y}] is outside bounding box`);
      }
    });

    return { valid: errors.length === 0, errors, warnings: [] };
  }

  /**
   * Simple self-intersection check (checks if any two non-adjacent edges intersect)
   */
  private static hasSimpleSelfIntersection(vertices: [number, number][]): boolean {
    // Check each edge against all non-adjacent edges
    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      const edge1 = { start: vertices[i], end: vertices[next] };

      for (let j = i + 2; j < vertices.length; j++) {
        if (j === vertices.length - 1 && i === 0) continue; // Skip adjacent edges

        const jNext = (j + 1) % vertices.length;
        const edge2 = { start: vertices[j], end: vertices[jNext] };

        if (this.edgesIntersect(edge1.start, edge1.end, edge2.start, edge2.end)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if two line segments intersect
   */
  private static edgesIntersect(
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
    p4: [number, number]
  ): boolean {
    const ccw = (a: [number, number], b: [number, number], c: [number, number]) => {
      return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
    };

    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  }

  /**
   * Calculate polygon area (Shoelace formula)
   */
  static calculatePolygonArea(vertices: [number, number][]): number {
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i][0] * vertices[j][1];
      area -= vertices[j][0] * vertices[i][1];
    }
    return Math.abs(area) / 2;
  }

  /**
   * Calculate bounding box from vertices
   */
  static calculateBoundingBox(vertices: [number, number][]): {
    min_x: number;
    min_y: number;
    max_x: number;
    max_y: number;
  } {
    const xs = vertices.map(v => v[0]);
    const ys = vertices.map(v => v[1]);

    return {
      min_x: Math.min(...xs),
      min_y: Math.min(...ys),
      max_x: Math.max(...xs),
      max_y: Math.max(...ys)
    };
  }
}
```

**Files Created:**
- `src/utils/GeometryValidator.ts`

---

### Task 4: Extend RoomService with Geometry Methods ⏱️ 2 hours

**Modify:** `src/services/RoomService.ts`

**New Methods to Add:**

```typescript
import { RoomGeometryTemplate, RoomGeometry, ParameterConfig } from '@/types/RoomGeometry';
import { GeometryValidator } from '@/utils/GeometryValidator';

// Add to existing RoomService class

/**
 * Load all room geometry templates
 */
static async getRoomGeometryTemplates(activeOnly = true): Promise<RoomGeometryTemplate[]> {
  try {
    let query = supabase
      .from('room_geometry_templates')
      .select('*')
      .order('sort_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading room geometry templates:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to load room geometry templates:', error);
    return [];
  }
}

/**
 * Load a specific geometry template by name
 */
static async getGeometryTemplate(templateName: string): Promise<RoomGeometryTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('room_geometry_templates')
      .select('*')
      .eq('template_name', templateName)
      .single();

    if (error) {
      console.error(`Error loading template "${templateName}":`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Failed to load template "${templateName}":`, error);
    return null;
  }
}

/**
 * Get templates by category
 */
static async getTemplatesByCategory(category: string): Promise<RoomGeometryTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('room_geometry_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(`Failed to load templates for category "${category}":`, error);
    return [];
  }
}

/**
 * Apply geometry template to a room with custom parameters
 */
static async applyGeometryTemplate(
  roomId: string,
  templateName: string,
  parameters?: Record<string, number>
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Load template
    const template = await this.getGeometryTemplate(templateName);
    if (!template) {
      return { success: false, error: `Template "${templateName}" not found` };
    }

    // 2. Apply parameters if provided
    let geometry = template.geometry_definition;
    if (parameters && template.parameter_config) {
      geometry = this.applyParametersToGeometry(
        template.geometry_definition,
        template.parameter_config,
        parameters
      );
    }

    // 3. Validate geometry
    const validation = GeometryValidator.validateRoomGeometry(geometry);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid geometry: ${validation.errors.join(', ')}`
      };
    }

    // 4. Update room
    const { error } = await supabase
      .from('room_designs')
      .update({ room_geometry: geometry })
      .eq('id', roomId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Failed to apply geometry template:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Apply parameter values to geometry definition
 * (Scales vertices based on parameter changes)
 */
private static applyParametersToGeometry(
  geometry: RoomGeometry,
  paramConfig: ParameterConfig,
  parameters: Record<string, number>
): RoomGeometry {
  // Clone geometry to avoid mutation
  const newGeometry = JSON.parse(JSON.stringify(geometry)) as RoomGeometry;

  // For now, simple scaling based on width/depth parameters
  // TODO: Implement proper parametric geometry transformation

  const widthParam = paramConfig.configurable_params.find(p => p.name === 'width');
  const depthParam = paramConfig.configurable_params.find(p => p.name === 'depth' || p.name === 'main_depth');

  if (widthParam && parameters.width) {
    const widthScale = parameters.width / widthParam.default;
    newGeometry.floor.vertices = newGeometry.floor.vertices.map(([x, y]) => [
      x * widthScale,
      y
    ] as [number, number]);
  }

  if (depthParam && parameters[depthParam.name]) {
    const depthScale = parameters[depthParam.name] / depthParam.default;
    newGeometry.floor.vertices = newGeometry.floor.vertices.map(([x, y]) => [
      x,
      y * depthScale
    ] as [number, number]);
  }

  // Recalculate bounding box
  newGeometry.bounding_box = GeometryValidator.calculateBoundingBox(newGeometry.floor.vertices);

  // Recalculate metadata
  newGeometry.metadata.total_floor_area = GeometryValidator.calculatePolygonArea(
    newGeometry.floor.vertices
  );

  return newGeometry;
}

/**
 * Get room geometry (with fallback to simple rectangle)
 */
static async getRoomGeometry(roomId: string): Promise<RoomGeometry | null> {
  try {
    const { data, error } = await supabase
      .from('room_designs')
      .select('room_geometry, room_dimensions')
      .eq('id', roomId)
      .single();

    if (error) throw error;

    // Return complex geometry if available
    if (data.room_geometry) {
      return data.room_geometry as RoomGeometry;
    }

    // Fallback: Generate simple rectangle from room_dimensions
    if (data.room_dimensions) {
      return this.generateSimpleRectangleGeometry(data.room_dimensions);
    }

    return null;
  } catch (error) {
    console.error('Failed to load room geometry:', error);
    return null;
  }
}

/**
 * Generate simple rectangle geometry from room_dimensions
 * (For backward compatibility)
 */
private static generateSimpleRectangleGeometry(dimensions: any): RoomGeometry {
  const width = dimensions.width || 600;
  const height = dimensions.height || 400;
  const ceilingHeight = dimensions.ceilingHeight || 250;

  return {
    shape_type: 'rectangle',
    bounding_box: {
      min_x: 0,
      min_y: 0,
      max_x: width,
      max_y: height
    },
    floor: {
      type: 'polygon',
      vertices: [
        [0, 0],
        [width, 0],
        [width, height],
        [0, height]
      ],
      elevation: 0
    },
    walls: [
      {
        id: 'wall_north',
        start: [0, 0],
        end: [width, 0],
        height: ceilingHeight,
        type: 'solid'
      },
      {
        id: 'wall_east',
        start: [width, 0],
        end: [width, height],
        height: ceilingHeight,
        type: 'solid'
      },
      {
        id: 'wall_south',
        start: [width, height],
        end: [0, height],
        height: ceilingHeight,
        type: 'solid'
      },
      {
        id: 'wall_west',
        start: [0, height],
        end: [0, 0],
        height: ceilingHeight,
        type: 'solid'
      }
    ],
    ceiling: {
      type: 'flat',
      zones: [
        {
          vertices: [
            [0, 0],
            [width, 0],
            [width, height],
            [0, height]
          ],
          height: ceilingHeight,
          style: 'flat'
        }
      ]
    },
    metadata: {
      total_floor_area: width * height
    }
  };
}

/**
 * Clear room geometry (revert to simple rectangle)
 */
static async clearRoomGeometry(roomId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('room_designs')
      .update({ room_geometry: null })
      .eq('id', roomId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to clear room geometry:', error);
    return false;
  }
}
```

**Files Modified:**
- `src/services/RoomService.ts`

---

### Task 5: Create React Hook for Geometry Templates ⏱️ 1 hour

**Create:** `src/hooks/useRoomGeometryTemplates.ts`

```typescript
import { useState, useEffect } from 'react';
import { RoomGeometryTemplate } from '@/types/RoomGeometry';
import { RoomService } from '@/services/RoomService';

interface UseRoomGeometryTemplatesResult {
  templates: RoomGeometryTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRoomGeometryTemplates(
  activeOnly = true
): UseRoomGeometryTemplatesResult {
  const [templates, setTemplates] = useState<RoomGeometryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RoomService.getRoomGeometryTemplates(activeOnly);
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load geometry templates');
      console.error('Error loading geometry templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [activeOnly]);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates
  };
}

// Hook for single template
export function useRoomGeometryTemplate(templateName: string | null) {
  const [template, setTemplate] = useState<RoomGeometryTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateName) {
      setTemplate(null);
      return;
    }

    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await RoomService.getGeometryTemplate(templateName);
        setTemplate(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load template');
        console.error('Error loading template:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateName]);

  return { template, loading, error };
}
```

**Files Created:**
- `src/hooks/useRoomGeometryTemplates.ts`

---

## Files Summary

### Files to Create (5 files)
1. `src/types/RoomGeometry.ts` - TypeScript interfaces
2. `src/utils/GeometryValidator.ts` - Validation utilities
3. `src/hooks/useRoomGeometryTemplates.ts` - React hooks
4. `src/tests/GeometryValidator.test.ts` - Unit tests (Task 6)
5. `docs/session-2025-10-10-complex-room-shapes/PHASE_2_COMPLETE.md` - Documentation

### Files to Modify (2 files)
1. `src/services/RoomService.ts` - Add geometry methods
2. `src/types/supabase.ts` - Update from database schema

---

## Testing Strategy

### Unit Tests (Task 6)

**Create:** `src/tests/GeometryValidator.test.ts`

**Test Cases:**
- Polygon validation (3+ vertices, no self-intersections)
- Wall connectivity validation
- Bounding box validation
- Area calculation accuracy
- Edge intersection detection
- Parameter application

---

## Success Criteria

Phase 2 is complete when:

- [ ] ✅ Supabase types updated with new tables/columns
- [ ] ✅ TypeScript interfaces defined (RoomGeometry, WallSegment, etc.)
- [ ] ✅ GeometryValidator class implemented with validation logic
- [ ] ✅ RoomService extended with 7+ new methods
- [ ] ✅ React hooks created (useRoomGeometryTemplates)
- [ ] ✅ Unit tests written (10+ test cases)
- [ ] ✅ All tests passing
- [ ] ✅ No TypeScript errors
- [ ] ✅ Documentation complete

---

## Timeline

**Estimated Duration:** 1-2 weeks (8-16 hours)

**Breakdown:**
- Task 1: Update types (5 min)
- Task 2: Define interfaces (1 hour)
- Task 3: Create validator (2 hours)
- Task 4: Extend RoomService (2 hours)
- Task 5: Create React hooks (1 hour)
- Task 6: Write unit tests (2 hours)

**Total:** ~8 hours (can be done in 2-3 focused sessions)

---

## Next Phase

**Phase 3:** 3D Rendering (Weeks 5-7)
- Create ComplexRoomGeometry component
- Implement polygon floor renderer
- Implement wall segment renderer
- Add ceiling renderer (flat/vaulted)

---

**Status:** 🎯 Ready to begin Phase 2
