/**
 * ComponentPositionValidator Unit Tests
 *
 * Tests validation of component Z positions and height usage to prevent
 * ambiguous positioning errors.
 *
 * Story: 1.7 - Create ComponentPositionValidator Utility
 * Epic: Epic 1 - Eliminate Circular Dependency Patterns
 */

import { describe, it, expect } from 'vitest';
import { ComponentPositionValidator, type ValidationContext } from '../ComponentPositionValidator';
import type { DesignElement } from '@/types/project';

describe('ComponentPositionValidator', () => {
  const testContext: ValidationContext = {
    width: 400,
    height: 600,
    ceilingHeight: 240
  };

  const createTestElement = (overrides: Partial<DesignElement> = {}): DesignElement => ({
    id: 'test-element-1',
    component_id: 'TEST-001',
    type: 'cabinet',
    x: 100,
    y: 50,
    z: 0,
    width: 60,
    depth: 60,
    height: 90,
    rotation: 0,
    zIndex: 2,
    ...overrides
  });

  describe('validateZPosition', () => {
    describe('Valid Cases', () => {
      it('should validate base cabinet at floor level', () => {
        const element = createTestElement({ z: 0, height: 90 });
        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate wall cabinet at correct height', () => {
        const element = createTestElement({
          component_id: 'wall-cabinet-60',
          z: 140,
          height: 70
        });
        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate counter-top at 86cm', () => {
        const element = createTestElement({
          type: 'counter-top',
          z: 86,
          height: 4
        });
        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate element at ceiling height', () => {
        const element = createTestElement({
          type: 'cornice',
          z: 210,
          height: 10
        });
        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Error Cases', () => {
      it('should error on negative Z position', () => {
        const element = createTestElement({ z: -10 });
        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('negative');
        expect(result.errors[0]).toContain('-10cm');
      });

      it('should error when Z exceeds ceiling height', () => {
        const element = createTestElement({ z: 250, height: 10 });
        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Z position (250cm) exceeds ceiling height (240cm)'
        );
      });

      it('should error when component extends beyond ceiling', () => {
        const element = createTestElement({ z: 200, height: 50 });
        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('extends beyond ceiling');
        expect(result.errors[0]).toContain('250cm');
      });

      it('should use default ceiling height if not specified', () => {
        const contextWithoutCeiling: ValidationContext = {
          width: 400,
          height: 600
        };
        const element = createTestElement({ z: 245, height: 10 });
        const result = ComponentPositionValidator.validateZPosition(element, contextWithoutCeiling);

        // Default ceiling is 240cm, so 245cm should exceed it
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('exceeds ceiling height');
      });
    });

    describe('Warning Cases', () => {
      it('should warn when Z is not specified', () => {
        const element = createTestElement();
        delete (element as any).z;

        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toContain('not specified');
        expect(result.warnings[0]).toContain('type default');
      });
    });

    describe('Suspicious Cases', () => {
      it('should flag Z equals height as suspicious', () => {
        const element = createTestElement({ z: 90, height: 90 });
        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        expect(result.suspiciousCases.length).toBeGreaterThan(0);
        expect(result.suspiciousCases[0]).toContain('Z position equals height');
        expect(result.suspiciousCases[0]).toContain('copy-paste error');
      });

      it('should flag wall cabinet at floor level', () => {
        const element = createTestElement({
          component_id: 'wall-cabinet-60',
          z: 0,
          height: 70
        });
        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        expect(result.suspiciousCases.length).toBeGreaterThan(0);
        expect(result.suspiciousCases[0]).toContain('Wall cabinet at Z=0');
        expect(result.suspiciousCases[0]).toContain('140cm');
      });

      it('should flag base cabinet at wall height', () => {
        const element = createTestElement({
          type: 'cabinet',
          component_id: 'base-cabinet-60',
          z: 150,
          height: 90
        });
        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        expect(result.suspiciousCases.length).toBeGreaterThan(0);
        expect(result.suspiciousCases[0]).toContain('Base cabinet at Z=150cm');
        expect(result.suspiciousCases[0]).toContain('floor level');
      });

      it('should not flag Z=0 equal to height as suspicious', () => {
        const element = createTestElement({ z: 0, height: 90 });
        const result = ComponentPositionValidator.validateZPosition(element, testContext);

        // Z=0 is normal floor level, should not trigger copy-paste warning
        const copyPasteWarning = result.suspiciousCases.find(c => c.includes('copy-paste'));
        expect(copyPasteWarning).toBeUndefined();
      });
    });
  });

  describe('getDefaultZ', () => {
    it('should return 0 for base cabinets', () => {
      const z = ComponentPositionValidator.getDefaultZ('cabinet', 'base-cabinet-60');
      expect(z).toBe(0);
    });

    it('should return 140 for wall cabinets', () => {
      const z = ComponentPositionValidator.getDefaultZ('cabinet', 'wall-cabinet-60');
      expect(z).toBe(140);
    });

    it('should return 140 for corner wall cabinets', () => {
      const z = ComponentPositionValidator.getDefaultZ('cabinet', 'corner-wall-cabinet-90');
      expect(z).toBe(140);
    });

    it('should return 0 for appliances', () => {
      const z = ComponentPositionValidator.getDefaultZ('appliance');
      expect(z).toBe(0);
    });

    it('should return 86 for counter-tops', () => {
      const z = ComponentPositionValidator.getDefaultZ('counter-top');
      expect(z).toBe(86);
    });

    it('should return 75 for sinks', () => {
      const z = ComponentPositionValidator.getDefaultZ('sink');
      expect(z).toBe(75);
    });

    it('should return 65 for butler sinks (lower than kitchen sinks)', () => {
      const z = ComponentPositionValidator.getDefaultZ('sink', 'butler-sink-60');
      expect(z).toBe(65);
    });

    it('should return 100 for windows', () => {
      const z = ComponentPositionValidator.getDefaultZ('window');
      expect(z).toBe(100);
    });

    it('should return 130 for pelmet', () => {
      const z = ComponentPositionValidator.getDefaultZ('pelmet');
      expect(z).toBe(130);
    });

    it('should return 210 for cornice', () => {
      const z = ComponentPositionValidator.getDefaultZ('cornice');
      expect(z).toBe(210);
    });

    it('should return 0 for unknown types', () => {
      const z = ComponentPositionValidator.getDefaultZ('unknown-type' as any);
      expect(z).toBe(0);
    });
  });

  describe('ensureValidZ', () => {
    it('should set default Z when undefined', () => {
      const element = createTestElement({ type: 'cabinet', component_id: 'base-cabinet-60' });
      delete (element as any).z;

      const result = ComponentPositionValidator.ensureValidZ(element);

      expect(result.z).toBe(0);
      expect(result).toBe(element); // Should return same object (mutation)
    });

    it('should set wall cabinet default Z when undefined', () => {
      const element = createTestElement({ type: 'cabinet', component_id: 'wall-cabinet-60' });
      delete (element as any).z;

      const result = ComponentPositionValidator.ensureValidZ(element);

      expect(result.z).toBe(140);
    });

    it('should not change existing Z value', () => {
      const element = createTestElement({ z: 50 });

      const result = ComponentPositionValidator.ensureValidZ(element);

      expect(result.z).toBe(50); // Should keep original value
    });

    it('should not change Z even if suspicious', () => {
      const element = createTestElement({ z: 0, type: 'cabinet', component_id: 'wall-cabinet-60' });

      const result = ComponentPositionValidator.ensureValidZ(element);

      // Should keep Z=0 even though wall cabinet should be at 140
      expect(result.z).toBe(0);
    });

    it('should handle null Z as missing', () => {
      const element = createTestElement({ z: null as any, type: 'counter-top' });

      const result = ComponentPositionValidator.ensureValidZ(element);

      expect(result.z).toBe(86);
    });
  });

  describe('validateAll', () => {
    it('should validate multiple elements', () => {
      const elements: DesignElement[] = [
        createTestElement({ id: '1', z: 0, height: 90 }),
        createTestElement({ id: '2', z: 86, height: 4, type: 'counter-top' }),
        createTestElement({ id: '3', z: 140, height: 70, component_id: 'wall-cabinet-60' }),
      ];

      const results = ComponentPositionValidator.validateAll(elements, testContext);

      expect(results.size).toBe(3);
      expect(results.get('1')?.valid).toBe(true);
      expect(results.get('2')?.valid).toBe(true);
      expect(results.get('3')?.valid).toBe(true);
    });

    it('should identify invalid elements', () => {
      const elements: DesignElement[] = [
        createTestElement({ id: '1', z: 0, height: 90 }), // Valid
        createTestElement({ id: '2', z: -10, height: 90 }), // Invalid: negative Z
        createTestElement({ id: '3', z: 250, height: 10 }), // Invalid: exceeds ceiling
      ];

      const results = ComponentPositionValidator.validateAll(elements, testContext);

      expect(results.get('1')?.valid).toBe(true);
      expect(results.get('2')?.valid).toBe(false);
      expect(results.get('2')?.errors.length).toBeGreaterThan(0);
      expect(results.get('3')?.valid).toBe(false);
      expect(results.get('3')?.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getValidationSummary', () => {
    it('should calculate summary statistics', () => {
      const elements: DesignElement[] = [
        createTestElement({ id: '1', z: 0, height: 90 }), // Valid
        createTestElement({ id: '2', z: 86, height: 4, type: 'counter-top' }), // Valid
        createTestElement({ id: '3', z: -10, height: 90 }), // Invalid
        createTestElement({ id: '4', z: 250, height: 10 }), // Invalid
      ];

      const results = ComponentPositionValidator.validateAll(elements, testContext);
      const summary = ComponentPositionValidator.getValidationSummary(results);

      expect(summary.total).toBe(4);
      expect(summary.valid).toBe(2);
      expect(summary.invalid).toBe(2);
    });

    it('should count warnings and suspicious cases', () => {
      const elements: DesignElement[] = [
        createTestElement({ id: '1', z: 90, height: 90 }), // Suspicious: Z=height
        createTestElement({ id: '2', component_id: 'wall-cabinet-60', z: 0, height: 70 }), // Suspicious: wall at floor
      ];

      const results = ComponentPositionValidator.validateAll(elements, testContext);
      const summary = ComponentPositionValidator.getValidationSummary(results);

      expect(summary.total).toBe(2);
      expect(summary.valid).toBe(2); // Still valid, just suspicious
      expect(summary.withSuspiciousCases).toBe(2);
    });

    it('should handle empty results', () => {
      const results = new Map();
      const summary = ComponentPositionValidator.getValidationSummary(results);

      expect(summary.total).toBe(0);
      expect(summary.valid).toBe(0);
      expect(summary.invalid).toBe(0);
    });
  });
});
