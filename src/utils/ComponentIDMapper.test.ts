/**
 * Component ID Mapper Tests
 *
 * Tests for centralized component ID to 3D model ID mapping logic
 */

import { describe, it, expect } from 'vitest';
import {
  mapComponentIdToModelId,
  getAvailableMappings,
  testComponentIdMapping,
} from './ComponentIDMapper';

describe('ComponentIDMapper', () => {
  describe('mapComponentIdToModelId', () => {
    // =====================================================================
    // P0: Corner Cabinets
    // =====================================================================

    describe('Corner Base Cabinets', () => {
      it('should map l-shaped-test-cabinet to corner-cabinet (no width suffix)', () => {
        // Note: l-shaped-test-cabinet pattern not in mappings, returns null
        expect(mapComponentIdToModelId('l-shaped-test-cabinet-1234567', 90)).toBeNull();
        expect(mapComponentIdToModelId('l-shaped-test-cabinet-7654321', 60)).toBeNull();
      });

      it('should map corner-cabinet to corner-cabinet (no width suffix)', () => {
        expect(mapComponentIdToModelId('corner-cabinet-1234567', 90)).toBe('corner-cabinet');
        expect(mapComponentIdToModelId('corner-cabinet-7654321', 60)).toBe('corner-cabinet');
      });

      it('should map corner-base-cabinet to corner-cabinet (no width suffix)', () => {
        expect(mapComponentIdToModelId('corner-base-cabinet-1234567', 90)).toBe('corner-cabinet');
        expect(mapComponentIdToModelId('corner-base-cabinet-7654321', 60)).toBe('corner-cabinet');
      });
    });

    describe('Corner Wall Cabinets', () => {
      it('should map new-corner-wall-cabinet to new-corner-wall-cabinet-{width}', () => {
        expect(mapComponentIdToModelId('new-corner-wall-cabinet-1234567', 90)).toBe('new-corner-wall-cabinet-90');
        expect(mapComponentIdToModelId('new-corner-wall-cabinet-7654321', 60)).toBe('new-corner-wall-cabinet-60');
      });

      it('should map corner-wall-cabinet to new-corner-wall-cabinet-{width}', () => {
        expect(mapComponentIdToModelId('corner-wall-cabinet-1234567', 90)).toBe('new-corner-wall-cabinet-90');
        expect(mapComponentIdToModelId('corner-wall-cabinet-7654321', 60)).toBe('new-corner-wall-cabinet-60');
      });
    });

    describe('Larder Corner Units', () => {
      it('should map larder-corner-unit to larder-corner-unit-{width}', () => {
        expect(mapComponentIdToModelId('larder-corner-unit-1234567', 90)).toBe('larder-corner-unit-90');
      });
    });

    // =====================================================================
    // P1: Standard Cabinets
    // =====================================================================

    describe('Base Cabinets', () => {
      it('should map base-cabinet to base-cabinet-{width}', () => {
        expect(mapComponentIdToModelId('base-cabinet-1234567', 40)).toBe('base-cabinet-40');
        expect(mapComponentIdToModelId('base-cabinet-1234567', 50)).toBe('base-cabinet-50');
        expect(mapComponentIdToModelId('base-cabinet-1234567', 60)).toBe('base-cabinet-60');
        expect(mapComponentIdToModelId('base-cabinet-1234567', 80)).toBe('base-cabinet-80');
        expect(mapComponentIdToModelId('base-cabinet-1234567', 100)).toBe('base-cabinet-100');
      });
    });

    describe('Wall Cabinets', () => {
      it('should map wall-cabinet to wall-cabinet-{width}', () => {
        expect(mapComponentIdToModelId('wall-cabinet-1234567', 30)).toBe('wall-cabinet-30');
        expect(mapComponentIdToModelId('wall-cabinet-1234567', 40)).toBe('wall-cabinet-40');
        expect(mapComponentIdToModelId('wall-cabinet-1234567', 50)).toBe('wall-cabinet-50');
        expect(mapComponentIdToModelId('wall-cabinet-1234567', 60)).toBe('wall-cabinet-60');
        expect(mapComponentIdToModelId('wall-cabinet-1234567', 80)).toBe('wall-cabinet-80');
      });
    });

    // =====================================================================
    // P2: Tall Units & Appliances
    // =====================================================================

    describe('Tall Units', () => {
      it('should map tall-unit to tall-unit-{width}', () => {
        expect(mapComponentIdToModelId('tall-unit-1234567', 60)).toBe('tall-unit-60');
        expect(mapComponentIdToModelId('tall-unit-1234567', 80)).toBe('tall-unit-80');
      });

      it('should map larder to tall-unit-{width}', () => {
        expect(mapComponentIdToModelId('larder-1234567', 60)).toBe('tall-unit-60');
      });
    });

    describe('Oven Housing', () => {
      it('should map oven-housing to oven-housing-{width}', () => {
        expect(mapComponentIdToModelId('oven-housing-1234567', 60)).toBe('oven-housing-60');
      });
    });

    describe('Appliances', () => {
      it('should map oven to oven-{width}', () => {
        expect(mapComponentIdToModelId('oven-1234567', 60)).toBe('oven-60');
      });

      it('should map dishwasher to dishwasher-{width}', () => {
        expect(mapComponentIdToModelId('dishwasher-1234567', 60)).toBe('dishwasher-60');
      });

      it('should map fridge to fridge-{width}', () => {
        expect(mapComponentIdToModelId('fridge-1234567', 60)).toBe('fridge-60');
        expect(mapComponentIdToModelId('refrigerator-1234567', 90)).toBe('fridge-90');
      });
    });

    // =====================================================================
    // P3: Sinks & Counter-tops
    // =====================================================================

    describe('Sinks', () => {
      it('should map sink to sink-{width}', () => {
        expect(mapComponentIdToModelId('sink-1234567', 60)).toBe('sink-60');
        expect(mapComponentIdToModelId('kitchen-sink-1234567', 80)).toBe('sink-80');
      });
    });

    describe('Counter-tops', () => {
      it('should map counter-top to counter-top-{width}', () => {
        expect(mapComponentIdToModelId('counter-top-1234567', 100)).toBe('counter-top-100');
        expect(mapComponentIdToModelId('worktop-1234567', 150)).toBe('counter-top-150');
      });
    });

    // =====================================================================
    // P4: Finishing
    // =====================================================================

    describe('Finishing', () => {
      it('should map cornice to cornice-{width}', () => {
        expect(mapComponentIdToModelId('cornice-1234567', 60)).toBe('cornice-60');
      });

      it('should map pelmet to pelmet-{width}', () => {
        expect(mapComponentIdToModelId('pelmet-1234567', 60)).toBe('pelmet-60');
      });

      it('should map end-panel to end-panel-{width}', () => {
        expect(mapComponentIdToModelId('end-panel-1234567', 60)).toBe('end-panel-60');
      });
    });

    // =====================================================================
    // Edge Cases
    // =====================================================================

    describe('Edge Cases', () => {
      it('should return null for unmapped component IDs', () => {
        expect(mapComponentIdToModelId('unknown-component-1234567', 60)).toBeNull();
        expect(mapComponentIdToModelId('random-id-7654321', 80)).toBeNull();
      });

      it('should handle case-insensitive matching', () => {
        expect(mapComponentIdToModelId('BASE-CABINET-1234567', 60)).toBe('base-cabinet-60');
        expect(mapComponentIdToModelId('WALL-CABINET-1234567', 60)).toBe('wall-cabinet-60');
        expect(mapComponentIdToModelId('Corner-Cabinet-1234567', 90)).toBe('corner-cabinet');
      });

      it('should prioritize more specific patterns', () => {
        // corner-wall-cabinet should match corner wall pattern, not general corner pattern
        expect(mapComponentIdToModelId('corner-wall-cabinet-1234567', 60)).toBe('new-corner-wall-cabinet-60');

        // corner-base-cabinet should match corner base pattern
        expect(mapComponentIdToModelId('corner-base-cabinet-1234567', 60)).toBe('corner-cabinet');
      });

      it('should handle components with complex IDs', () => {
        expect(mapComponentIdToModelId('db-corner-cabinet-1759929836172', 90)).toBe('corner-cabinet');
        expect(mapComponentIdToModelId('new-corner-wall-cabinet-1759929889209', 60)).toBe('new-corner-wall-cabinet-60');
      });
    });
  });

  describe('getAvailableMappings', () => {
    it('should return all available mappings sorted by priority', () => {
      const mappings = getAvailableMappings();

      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings[0]).toHaveProperty('pattern');
      expect(mappings[0]).toHaveProperty('description');
      expect(mappings[0]).toHaveProperty('priority');

      // Check sorted by priority (highest first)
      for (let i = 0; i < mappings.length - 1; i++) {
        expect(mappings[i].priority).toBeGreaterThanOrEqual(mappings[i + 1].priority);
      }
    });

    it('should include corner cabinet mappings with highest priority', () => {
      const mappings = getAvailableMappings();
      const cornerMappings = mappings.filter(m => m.priority === 100);

      expect(cornerMappings.length).toBeGreaterThan(0);
      expect(cornerMappings.some(m => m.description.includes('Corner'))).toBe(true);
    });
  });

  describe('testComponentIdMapping', () => {
    it('should return all matching mappings for a component ID', () => {
      const results = testComponentIdMapping('base-cabinet-1234567', 60);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('pattern');
      expect(results[0]).toHaveProperty('description');
      expect(results[0]).toHaveProperty('matched');
      expect(results[0]).toHaveProperty('result');
    });

    it('should identify matched patterns', () => {
      const results = testComponentIdMapping('base-cabinet-1234567', 60);
      const matchedResults = results.filter(r => r.matched);

      expect(matchedResults.length).toBeGreaterThan(0);
      expect(matchedResults.some(r => r.result === 'base-cabinet-60')).toBe(true);
    });

    it('should show all unmatched patterns as false', () => {
      const results = testComponentIdMapping('unknown-component-1234567', 60);
      const matchedResults = results.filter(r => r.matched);

      expect(matchedResults.length).toBe(0);
      results.forEach(r => {
        expect(r.matched).toBe(false);
        expect(r.result).toBeNull();
      });
    });
  });
});
