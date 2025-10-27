/**
 * Model 3D Integration Test
 *
 * Purpose: Test the complete flow of loading and building 3D models from database
 *
 * Flow:
 * 1. Load model from database (Model3DLoaderService)
 * 2. Load geometry parts
 * 3. Load materials
 * 4. Build Three.js meshes (GeometryBuilder)
 * 5. Verify corner cabinet geometry
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { Model3DLoaderService } from '@/services/Model3DLoaderService';
import { GeometryBuilder } from './GeometryBuilder';
import { createStandardVariables } from './FormulaEvaluator';

/**
 * Mock Test - Integration test for 3D model loading and building
 *
 * NOTE: This test uses mocked data since we don't have direct database access in tests.
 * In production, the real flow will:
 * 1. Load from Supabase database
 * 2. Build Three.js geometry
 * 3. Render in scene
 */
describe('Model3D Integration Test', () => {
  describe('Corner Cabinet 60cm - Complete Flow', () => {
    it('should load and build corner cabinet with correct L-shape geometry', async () => {
      // Mock the database data (this would come from Supabase in production)
      const mockModel = {
        id: 'test-model-id',
        component_id: 'corner-base-cabinet-60',
        component_name: 'Corner Base Cabinet 60cm',
        component_type: 'base-cabinet',
        category: 'cabinets',
        geometry_type: 'l_shaped_corner',
        is_corner_component: true,
        leg_length: 0.6,
        corner_depth_wall: 0.4,
        corner_depth_base: 0.6,
        rotation_center_x: 'legLength/2',
        rotation_center_y: '0',
        rotation_center_z: 'legLength/2',
        has_direction: true,
        auto_rotate_enabled: true,
        wall_rotation_left: 90,
        wall_rotation_right: 270,
        wall_rotation_top: 0,
        wall_rotation_bottom: 180,
        corner_rotation_front_left: 0,
        corner_rotation_front_right: 270,
        corner_rotation_back_left: 90,
        corner_rotation_back_right: 180,
        default_width: 60,
        default_height: 90,
        default_depth: 60,
        description: 'Corner base cabinet with L-shaped geometry',
        created_at: '2025-01-29T00:00:00Z',
        updated_at: '2025-01-29T00:00:00Z',
      };

      const mockGeometryParts = [
        {
          id: 'part-1',
          model_id: 'test-model-id',
          part_name: 'Plinth X-leg',
          part_type: 'box',
          render_order: 1,
          position_x: '0',
          position_y: '-height / 2 + plinthHeight / 2',
          position_z: 'cornerDepth / 2 - legLength / 2 - 0.1',
          dimension_width: 'legLength',
          dimension_height: 'plinthHeight',
          dimension_depth: 'cornerDepth - 0.1',
          material_name: 'plinth',
          color_override: 'plinthColor',
          metalness: null,
          roughness: null,
          opacity: null,
          render_condition: null,
          created_at: '2025-01-29T00:00:00Z',
        },
        {
          id: 'part-2',
          model_id: 'test-model-id',
          part_name: 'Cabinet X-leg',
          part_type: 'box',
          render_order: 2,
          position_x: '0',
          position_y: 'plinthHeight / 2',
          position_z: 'cornerDepth / 2 - legLength / 2',
          dimension_width: 'legLength',
          dimension_height: 'cabinetHeight',
          dimension_depth: 'cornerDepth',
          material_name: 'cabinet',
          color_override: 'cabinetMaterial',
          metalness: null,
          roughness: null,
          opacity: null,
          render_condition: null,
          created_at: '2025-01-29T00:00:00Z',
        },
        {
          id: 'part-3',
          model_id: 'test-model-id',
          part_name: 'Plinth Z-leg',
          part_type: 'box',
          render_order: 3,
          position_x: 'cornerDepth / 2 - legLength / 2 - 0.1',
          position_y: '-height / 2 + plinthHeight / 2',
          position_z: '0',
          dimension_width: 'cornerDepth - 0.1',
          dimension_height: 'plinthHeight',
          dimension_depth: 'legLength',
          material_name: 'plinth',
          color_override: 'plinthColor',
          metalness: null,
          roughness: null,
          opacity: null,
          render_condition: null,
          created_at: '2025-01-29T00:00:00Z',
        },
        {
          id: 'part-4',
          model_id: 'test-model-id',
          part_name: 'Cabinet Z-leg',
          part_type: 'box',
          render_order: 4,
          position_x: 'cornerDepth / 2 - legLength / 2',
          position_y: 'plinthHeight / 2',
          position_z: '0',
          dimension_width: 'cornerDepth',
          dimension_height: 'cabinetHeight',
          dimension_depth: 'legLength',
          material_name: 'cabinet',
          color_override: 'cabinetMaterial',
          metalness: null,
          roughness: null,
          opacity: null,
          render_condition: null,
          created_at: '2025-01-29T00:00:00Z',
        },
      ];

      const mockMaterials = new Map([
        ['plinth', {
          id: 'mat-1',
          material_name: 'plinth',
          material_type: 'standard',
          default_color: '#5a4a3a',
          roughness: 0.8,
          metalness: 0.0,
          opacity: 1.0,
          description: 'Plinth material',
          created_at: '2025-01-29T00:00:00Z',
        }],
        ['cabinet', {
          id: 'mat-2',
          material_name: 'cabinet',
          material_type: 'standard',
          default_color: '#8B7355',
          roughness: 0.7,
          metalness: 0.1,
          opacity: 1.0,
          description: 'Cabinet body material',
          created_at: '2025-01-29T00:00:00Z',
        }],
      ]);

      // Create builder
      const builder = new GeometryBuilder(mockGeometryParts, mockMaterials);

      // Build the geometry
      const context = {
        width: 60, // cm
        height: 90, // cm
        depth: 60, // cm
        isSelected: false,
        isWallCabinet: false,
        legLength: 0.6, // meters
        cornerDepth: 0.6, // meters
      };

      const group = builder.build(context);

      // Verify the group was created
      expect(group).toBeInstanceOf(THREE.Group);

      // Verify we have 4 meshes (2 plinth legs + 2 cabinet legs)
      expect(group.children.length).toBe(4);

      // Verify all children are meshes
      group.children.forEach((child) => {
        expect(child).toBeInstanceOf(THREE.Mesh);
      });

      // Verify L-shape geometry
      const mesh1 = group.children[0] as THREE.Mesh;
      const mesh2 = group.children[1] as THREE.Mesh;
      const mesh3 = group.children[2] as THREE.Mesh;
      const mesh4 = group.children[3] as THREE.Mesh;

      // Check plinth X-leg dimensions
      const plinthXGeo = mesh1.geometry as THREE.BoxGeometry;
      const plinthXParams = plinthXGeo.parameters;
      expect(plinthXParams.width).toBeCloseTo(0.6); // legLength
      expect(plinthXParams.height).toBeCloseTo(0.15); // plinthHeight
      expect(plinthXParams.depth).toBeCloseTo(0.5); // cornerDepth - 0.1

      // Check cabinet X-leg dimensions
      const cabinetXGeo = mesh2.geometry as THREE.BoxGeometry;
      const cabinetXParams = cabinetXGeo.parameters;
      expect(cabinetXParams.width).toBeCloseTo(0.6); // legLength
      expect(cabinetXParams.height).toBeCloseTo(0.75); // cabinetHeight
      expect(cabinetXParams.depth).toBeCloseTo(0.6); // cornerDepth

      // Check plinth Z-leg dimensions
      const plinthZGeo = mesh3.geometry as THREE.BoxGeometry;
      const plinthZParams = plinthZGeo.parameters;
      expect(plinthZParams.width).toBeCloseTo(0.5); // cornerDepth - 0.1
      expect(plinthZParams.height).toBeCloseTo(0.15); // plinthHeight
      expect(plinthZParams.depth).toBeCloseTo(0.6); // legLength

      // Check cabinet Z-leg dimensions
      const cabinetZGeo = mesh4.geometry as THREE.BoxGeometry;
      const cabinetZParams = cabinetZGeo.parameters;
      expect(cabinetZParams.width).toBeCloseTo(0.6); // cornerDepth
      expect(cabinetZParams.height).toBeCloseTo(0.75); // cabinetHeight
      expect(cabinetZParams.depth).toBeCloseTo(0.6); // legLength

      // Verify positions form L-shape
      // X-leg should be at z = -0.3 (cornerDepth/2 - legLength/2 - 0.1)
      expect(mesh1.position.z).toBeCloseTo(-0.1);
      expect(mesh2.position.z).toBeCloseTo(0.0);

      // Z-leg should be at x = -0.3 (cornerDepth/2 - legLength/2 - 0.1)
      expect(mesh3.position.x).toBeCloseTo(-0.1);
      expect(mesh4.position.x).toBeCloseTo(0.0);

      // Verify materials
      expect((mesh1.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('5a4a3a');
      expect((mesh2.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('8b7355');

      console.log('✅ Integration test passed: Corner cabinet L-shape geometry verified');
    });

    it('should handle conditional rendering', () => {
      // Test with isWallCabinet condition
      const mockGeometryParts = [
        {
          id: 'part-1',
          model_id: 'test-model-id',
          part_name: 'Plinth (base only)',
          part_type: 'box',
          render_order: 1,
          position_x: '0',
          position_y: '0',
          position_z: '0',
          dimension_width: 'width',
          dimension_height: '0.15',
          dimension_depth: 'depth',
          material_name: 'plinth',
          color_override: null,
          metalness: null,
          roughness: null,
          opacity: null,
          render_condition: '!isWallCabinet', // Only render if NOT wall cabinet
          created_at: '2025-01-29T00:00:00Z',
        },
      ];

      const mockMaterials = new Map([
        ['plinth', {
          id: 'mat-1',
          material_name: 'plinth',
          material_type: 'standard',
          default_color: '#5a4a3a',
          roughness: 0.8,
          metalness: 0.0,
          opacity: 1.0,
          description: 'Plinth material',
          created_at: '2025-01-29T00:00:00Z',
        }],
      ]);

      const builder = new GeometryBuilder(mockGeometryParts, mockMaterials);

      // Test with base cabinet (should render plinth)
      const baseContext = {
        width: 60,
        height: 90,
        depth: 60,
        isWallCabinet: false,
      };
      const baseGroup = builder.build(baseContext);
      expect(baseGroup.children.length).toBe(1); // Plinth rendered

      // Test with wall cabinet (should NOT render plinth)
      const wallContext = {
        width: 60,
        height: 70,
        depth: 40,
        isWallCabinet: true,
      };
      const wallGroup = builder.build(wallContext);
      expect(wallGroup.children.length).toBe(0); // Plinth not rendered

      console.log('✅ Conditional rendering test passed');
    });

    it('should calculate bounding box correctly', () => {
      const mockGeometryParts = [
        {
          id: 'part-1',
          model_id: 'test-model-id',
          part_name: 'Test Box',
          part_type: 'box',
          render_order: 1,
          position_x: '0',
          position_y: '0',
          position_z: '0',
          dimension_width: '0.6',
          dimension_height: '0.9',
          dimension_depth: '0.6',
          material_name: 'test',
          color_override: null,
          metalness: null,
          roughness: null,
          opacity: null,
          render_condition: null,
          created_at: '2025-01-29T00:00:00Z',
        },
      ];

      const mockMaterials = new Map([
        ['test', {
          id: 'mat-1',
          material_name: 'test',
          material_type: 'standard',
          default_color: '#8B7355',
          roughness: 0.7,
          metalness: 0.1,
          opacity: 1.0,
          description: 'Test material',
          created_at: '2025-01-29T00:00:00Z',
        }],
      ]);

      const builder = new GeometryBuilder(mockGeometryParts, mockMaterials);
      const context = {
        width: 60,
        height: 90,
        depth: 60,
      };

      const group = builder.build(context);
      const bbox = GeometryBuilder.getBoundingBox(group);

      // Verify bounding box size
      const size = new THREE.Vector3();
      bbox.getSize(size);

      expect(size.x).toBeCloseTo(0.6);
      expect(size.y).toBeCloseTo(0.9);
      expect(size.z).toBeCloseTo(0.6);

      console.log('✅ Bounding box test passed');
    });

    it('should count vertices correctly', () => {
      const mockGeometryParts = [
        {
          id: 'part-1',
          model_id: 'test-model-id',
          part_name: 'Test Box 1',
          part_type: 'box',
          render_order: 1,
          position_x: '0',
          position_y: '0',
          position_z: '0',
          dimension_width: '0.6',
          dimension_height: '0.9',
          dimension_depth: '0.6',
          material_name: 'test',
          color_override: null,
          metalness: null,
          roughness: null,
          opacity: null,
          render_condition: null,
          created_at: '2025-01-29T00:00:00Z',
        },
        {
          id: 'part-2',
          model_id: 'test-model-id',
          part_name: 'Test Box 2',
          part_type: 'box',
          render_order: 2,
          position_x: '0.5',
          position_y: '0',
          position_z: '0',
          dimension_width: '0.3',
          dimension_height: '0.3',
          dimension_depth: '0.3',
          material_name: 'test',
          color_override: null,
          metalness: null,
          roughness: null,
          opacity: null,
          render_condition: null,
          created_at: '2025-01-29T00:00:00Z',
        },
      ];

      const mockMaterials = new Map([
        ['test', {
          id: 'mat-1',
          material_name: 'test',
          material_type: 'standard',
          default_color: '#8B7355',
          roughness: 0.7,
          metalness: 0.1,
          opacity: 1.0,
          description: 'Test material',
          created_at: '2025-01-29T00:00:00Z',
        }],
      ]);

      const builder = new GeometryBuilder(mockGeometryParts, mockMaterials);
      const context = {
        width: 60,
        height: 90,
        depth: 60,
      };

      const group = builder.build(context);
      const vertexCount = GeometryBuilder.getVertexCount(group);

      // BoxGeometry has 24 vertices (6 faces * 4 corners)
      // 2 boxes = 48 vertices
      expect(vertexCount).toBe(48);

      console.log('✅ Vertex count test passed');
    });
  });

  describe('Auto-Rotate Rules', () => {
    it('should extract auto-rotate rules from model', () => {
      const mockModel = {
        id: 'test-model-id',
        component_id: 'corner-base-cabinet-60',
        component_name: 'Corner Base Cabinet 60cm',
        component_type: 'base-cabinet',
        category: 'cabinets',
        geometry_type: 'l_shaped_corner',
        is_corner_component: true,
        leg_length: 0.6,
        corner_depth_wall: 0.4,
        corner_depth_base: 0.6,
        rotation_center_x: 'legLength/2',
        rotation_center_y: '0',
        rotation_center_z: 'legLength/2',
        has_direction: true,
        auto_rotate_enabled: true,
        wall_rotation_left: 90,
        wall_rotation_right: 270,
        wall_rotation_top: 0,
        wall_rotation_bottom: 180,
        corner_rotation_front_left: 0,
        corner_rotation_front_right: 270,
        corner_rotation_back_left: 90,
        corner_rotation_back_right: 180,
        default_width: 60,
        default_height: 90,
        default_depth: 60,
        description: 'Corner base cabinet',
        created_at: '2025-01-29T00:00:00Z',
        updated_at: '2025-01-29T00:00:00Z',
      };

      const rules = Model3DLoaderService.getAutoRotateRules(mockModel);

      expect(rules.wallRotations.left).toBe(90);
      expect(rules.wallRotations.right).toBe(270);
      expect(rules.wallRotations.top).toBe(0);
      expect(rules.wallRotations.bottom).toBe(180);

      expect(rules.cornerRotations.frontLeft).toBe(0);
      expect(rules.cornerRotations.frontRight).toBe(270);
      expect(rules.cornerRotations.backLeft).toBe(90);
      expect(rules.cornerRotations.backRight).toBe(180);

      console.log('✅ Auto-rotate rules test passed');
    });

    it('should extract rotation center from model', () => {
      const mockModel = {
        id: 'test-model-id',
        component_id: 'corner-base-cabinet-60',
        component_name: 'Corner Base Cabinet 60cm',
        component_type: 'base-cabinet',
        category: 'cabinets',
        geometry_type: 'l_shaped_corner',
        is_corner_component: true,
        leg_length: 0.6,
        corner_depth_wall: 0.4,
        corner_depth_base: 0.6,
        rotation_center_x: 'legLength/2',
        rotation_center_y: '0',
        rotation_center_z: 'legLength/2',
        has_direction: true,
        auto_rotate_enabled: true,
        wall_rotation_left: null,
        wall_rotation_right: null,
        wall_rotation_top: null,
        wall_rotation_bottom: null,
        corner_rotation_front_left: null,
        corner_rotation_front_right: null,
        corner_rotation_back_left: null,
        corner_rotation_back_right: null,
        default_width: 60,
        default_height: 90,
        default_depth: 60,
        description: 'Corner base cabinet',
        created_at: '2025-01-29T00:00:00Z',
        updated_at: '2025-01-29T00:00:00Z',
      };

      const center = Model3DLoaderService.getRotationCenter(mockModel);

      expect(center.x).toBe('legLength/2');
      expect(center.y).toBe('0');
      expect(center.z).toBe('legLength/2');

      console.log('✅ Rotation center test passed');
    });
  });
});
