/**
 * Geometry Builder
 *
 * Purpose: Build Three.js geometry from database geometry parts
 *
 * Responsibilities:
 * - Parse geometry parts from database
 * - Evaluate position/dimension formulas
 * - Create Three.js meshes (boxes, cylinders, etc.)
 * - Apply materials and properties
 * - Handle conditional rendering
 * - Build complete model groups
 *
 * Usage:
 * ```typescript
 * const builder = new GeometryBuilder(geometryParts, materials);
 * const group = builder.build(element, {
 *   isSelected: false,
 *   isWallCabinet: false
 * });
 * ```
 */

import * as THREE from 'three';
import { FormulaEvaluator, createStandardVariables, evaluateCondition } from './FormulaEvaluator';
import type { GeometryPart, MaterialDefinition } from '@/services/Model3DLoaderService';

export interface BuildContext {
  // Element data
  width: number; // in cm
  height: number; // in cm
  depth: number; // in cm

  // State flags
  isSelected?: boolean;
  isWallCabinet?: boolean;

  // Corner-specific
  legLength?: number; // in meters
  cornerDepth?: number; // in meters

  // Custom variable overrides
  customVariables?: Record<string, number>;
}

export class GeometryBuilder {
  private geometryParts: GeometryPart[];
  private materials: Map<string, MaterialDefinition>;

  constructor(
    geometryParts: GeometryPart[],
    materials: Map<string, MaterialDefinition>
  ) {
    this.geometryParts = geometryParts;
    this.materials = materials;
  }

  /**
   * Build complete Three.js group from geometry parts
   * @param context - Build context with element dimensions and state
   * @returns THREE.Group containing all meshes
   */
  build(context: BuildContext): THREE.Group {
    const group = new THREE.Group();

    // Create standard variables for formula evaluation
    const variables = this.createVariables(context);
    const evaluator = new FormulaEvaluator(variables);

    // Build each geometry part
    for (const part of this.geometryParts) {
      try {
        // Check render condition
        if (part.render_condition) {
          const shouldRender = evaluateCondition(part.render_condition, variables);
          if (!shouldRender) {
            console.log(`[GeometryBuilder] Skipping part ${part.part_name} due to condition: ${part.render_condition}`);
            continue;
          }
        }

        // Create mesh for this part
        const mesh = this.createMesh(part, evaluator, context);
        if (mesh) {
          group.add(mesh);
        }
      } catch (error) {
        console.error(`[GeometryBuilder] Error building part ${part.part_name}:`, error);
        // Continue with other parts even if one fails
      }
    }

    console.log(`[GeometryBuilder] Built ${group.children.length} geometry parts`);
    return group;
  }

  /**
   * Create a single Three.js mesh from a geometry part
   */
  private createMesh(
    part: GeometryPart,
    evaluator: FormulaEvaluator,
    context: BuildContext
  ): THREE.Mesh | null {
    // Evaluate position
    const position = this.evaluatePosition(part, evaluator);

    // Evaluate dimensions
    const dimensions = this.evaluateDimensions(part, evaluator);

    // Create geometry based on part type
    const geometry = this.createGeometry(part.part_type, dimensions);
    if (!geometry) {
      console.warn(`[GeometryBuilder] Unknown geometry type: ${part.part_type}`);
      return null;
    }

    // Create material
    const material = this.createMaterial(part, context);

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);

    // Set name for debugging
    mesh.name = part.part_name;

    return mesh;
  }

  /**
   * Evaluate position formulas
   */
  private evaluatePosition(
    part: GeometryPart,
    evaluator: FormulaEvaluator
  ): THREE.Vector3 {
    const x = part.position_x ? evaluator.evaluate(part.position_x) : 0;
    const y = part.position_y ? evaluator.evaluate(part.position_y) : 0;
    const z = part.position_z ? evaluator.evaluate(part.position_z) : 0;

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Evaluate dimension formulas
   */
  private evaluateDimensions(
    part: GeometryPart,
    evaluator: FormulaEvaluator
  ): THREE.Vector3 {
    const width = part.dimension_width ? evaluator.evaluate(part.dimension_width) : 0.1;
    const height = part.dimension_height ? evaluator.evaluate(part.dimension_height) : 0.1;
    const depth = part.dimension_depth ? evaluator.evaluate(part.dimension_depth) : 0.1;

    return new THREE.Vector3(width, height, depth);
  }

  /**
   * Create Three.js geometry based on type
   */
  private createGeometry(type: string, dimensions: THREE.Vector3): THREE.BufferGeometry | null {
    switch (type.toLowerCase()) {
      case 'box':
        return new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);

      case 'cylinder':
        // For cylinder: width = radius, height = height, depth = segments
        return new THREE.CylinderGeometry(
          dimensions.x, // radiusTop
          dimensions.x, // radiusBottom
          dimensions.y, // height
          Math.max(8, Math.floor(dimensions.z)) // radialSegments
        );

      case 'sphere':
        // For sphere: width = radius, height = widthSegments, depth = heightSegments
        return new THREE.SphereGeometry(
          dimensions.x, // radius
          Math.max(8, Math.floor(dimensions.y)), // widthSegments
          Math.max(6, Math.floor(dimensions.z))  // heightSegments
        );

      default:
        console.warn(`[GeometryBuilder] Unsupported geometry type: ${type}`);
        return null;
    }
  }

  /**
   * Create Three.js material
   */
  private createMaterial(
    part: GeometryPart,
    context: BuildContext
  ): THREE.Material {
    // Get material definition
    const materialDef = part.material_name
      ? this.materials.get(part.material_name)
      : null;

    // Determine color
    let color = '#8B7355'; // Default cabinet color

    if (part.color_override) {
      // Handle color overrides like 'selectedColor', 'cabinetMaterial', etc.
      color = this.resolveColorOverride(part.color_override, context);
    } else if (materialDef?.default_color) {
      color = materialDef.default_color;
    }

    // Get material properties (part overrides material definition)
    const roughness = part.roughness ?? materialDef?.roughness ?? 0.7;
    const metalness = part.metalness ?? materialDef?.metalness ?? 0.1;
    const opacity = part.opacity ?? materialDef?.opacity ?? 1.0;

    // Create material based on type
    const materialType = materialDef?.material_type ?? 'standard';

    switch (materialType.toLowerCase()) {
      case 'lambert':
        return new THREE.MeshLambertMaterial({
          color,
          transparent: opacity < 1.0,
          opacity,
        });

      case 'phong':
        return new THREE.MeshPhongMaterial({
          color,
          shininess: (1 - roughness) * 100,
          transparent: opacity < 1.0,
          opacity,
        });

      case 'standard':
      default:
        return new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness,
          transparent: opacity < 1.0,
          opacity,
        });
    }
  }

  /**
   * Resolve color overrides like 'selectedColor', 'cabinetMaterial'
   */
  private resolveColorOverride(override: string, context: BuildContext): string {
    switch (override.toLowerCase()) {
      case 'selectedcolor':
        return context.isSelected ? '#FFD700' : '#8B7355'; // Gold if selected

      case 'cabinetmaterial':
        return '#8B7355'; // Brown

      case 'doorcolor':
        return '#654321'; // Darker brown

      case 'handlecolor':
        return '#C0C0C0'; // Silver

      case 'plinthcolor':
        return '#5a4a3a'; // Dark brown

      case 'worktopcolor':
        return '#E8E8E8'; // Light gray

      default:
        // If it looks like a hex color, use it
        if (override.startsWith('#')) {
          return override;
        }
        return '#8B7355'; // Default
    }
  }

  /**
   * Create variables object for formula evaluation
   */
  private createVariables(context: BuildContext): Record<string, number> {
    // Start with standard variables
    const element = {
      width: context.width,
      height: context.height,
      depth: context.depth,
    };

    const options = {
      legLength: context.legLength,
      cornerDepth: context.cornerDepth,
      isWallCabinet: context.isWallCabinet,
    };

    const variables = createStandardVariables(element, options);

    // Add custom variable overrides
    if (context.customVariables) {
      Object.assign(variables, context.customVariables);
    }

    // Add selection flag
    variables.isSelected = context.isSelected ? 1 : 0;

    return variables;
  }

  /**
   * Get bounding box of built geometry
   * Useful for debugging and visualization
   */
  static getBoundingBox(group: THREE.Group): THREE.Box3 {
    const box = new THREE.Box3();
    box.setFromObject(group);
    return box;
  }

  /**
   * Get total vertex count
   * Useful for performance monitoring
   */
  static getVertexCount(group: THREE.Group): number {
    let count = 0;

    group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const geometry = object.geometry;
        if (geometry.attributes.position) {
          count += geometry.attributes.position.count;
        }
      }
    });

    return count;
  }
}
