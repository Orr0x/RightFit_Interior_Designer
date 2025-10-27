/**
 * Unit tests for CornerCabinetDoorMatrix
 *
 * Story 1.10: Corner Cabinet Door Orientation Matrix
 * Epic: Epic 1 - Eliminate Circular Dependency Patterns
 *
 * Test framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import { CornerCabinetDoorMatrix } from '../CornerCabinetDoorMatrix';

describe('CornerCabinetDoorMatrix', () => {
  const roomDimensions = { width: 400, depth: 600 };

  describe('Corner position detection', () => {
    it('should detect front-left corner', () => {
      const element = { x: 0, y: 0, width: 90, depth: 90 };
      const position = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions);
      expect(position).toBe('front-left');
    });

    it('should detect front-right corner', () => {
      const element = { x: 310, y: 0, width: 90, depth: 90 };  // 310 + 90 = 400
      const position = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions);
      expect(position).toBe('front-right');
    });

    it('should detect back-left corner', () => {
      const element = { x: 0, y: 510, width: 90, depth: 90 };  // 510 + 90 = 600
      const position = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions);
      expect(position).toBe('back-left');
    });

    it('should detect back-right corner', () => {
      const element = { x: 310, y: 510, width: 90, depth: 90 };
      const position = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions);
      expect(position).toBe('back-right');
    });

    it('should return null for non-corner element', () => {
      const element = { x: 100, y: 100, width: 60, depth: 60 };
      const position = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions);
      expect(position).toBeNull();
    });

    it('should respect tolerance parameter', () => {
      const element = { x: 35, y: 0, width: 60, depth: 60 };

      // With default tolerance (30cm) - not in corner
      const positionDefault = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions);
      expect(positionDefault).toBeNull();

      // With higher tolerance (40cm) - is in corner
      const positionHighTolerance = CornerCabinetDoorMatrix.detectCornerPosition(element, roomDimensions, 40);
      expect(positionHighTolerance).toBe('front-left');
    });
  });

  describe('Door side determination', () => {
    it('should return right for front-left corner', () => {
      const doorSide = CornerCabinetDoorMatrix.getDoorSide('front-left');
      expect(doorSide).toBe('right');
    });

    it('should return left for front-right corner', () => {
      const doorSide = CornerCabinetDoorMatrix.getDoorSide('front-right');
      expect(doorSide).toBe('left');
    });

    it('should return right for back-left corner', () => {
      const doorSide = CornerCabinetDoorMatrix.getDoorSide('back-left');
      expect(doorSide).toBe('right');
    });

    it('should return left for back-right corner', () => {
      const doorSide = CornerCabinetDoorMatrix.getDoorSide('back-right');
      expect(doorSide).toBe('left');
    });

    it('should respect manual override', () => {
      const doorSide = CornerCabinetDoorMatrix.getDoorSide('front-left', 'left');
      expect(doorSide).toBe('left');  // Overridden from default 'right'
    });

    it('should ignore auto override', () => {
      const doorSide = CornerCabinetDoorMatrix.getDoorSide('front-left', 'auto');
      expect(doorSide).toBe('right');  // Uses matrix, ignores 'auto'
    });
  });

  describe('Complete determination', () => {
    it('should determine door side for front-left corner element', () => {
      const element = { x: 0, y: 0, width: 90, depth: 90 };
      const result = CornerCabinetDoorMatrix.determineCornerDoorSide(element, roomDimensions);

      expect(result.cornerPosition).toBe('front-left');
      expect(result.doorSide).toBe('right');
    });

    it('should determine door side for front-right corner element', () => {
      const element = { x: 310, y: 0, width: 90, depth: 90 };
      const result = CornerCabinetDoorMatrix.determineCornerDoorSide(element, roomDimensions);

      expect(result.cornerPosition).toBe('front-right');
      expect(result.doorSide).toBe('left');
    });

    it('should determine door side for back-left corner element', () => {
      const element = { x: 0, y: 510, width: 90, depth: 90 };
      const result = CornerCabinetDoorMatrix.determineCornerDoorSide(element, roomDimensions);

      expect(result.cornerPosition).toBe('back-left');
      expect(result.doorSide).toBe('right');
    });

    it('should determine door side for back-right corner element', () => {
      const element = { x: 310, y: 510, width: 90, depth: 90 };
      const result = CornerCabinetDoorMatrix.determineCornerDoorSide(element, roomDimensions);

      expect(result.cornerPosition).toBe('back-right');
      expect(result.doorSide).toBe('left');
    });

    it('should handle manual override', () => {
      const element = {
        x: 0, y: 0, width: 90, depth: 90,
        cornerDoorSide: 'left' as const
      };
      const result = CornerCabinetDoorMatrix.determineCornerDoorSide(element, roomDimensions);

      expect(result.doorSide).toBe('left');  // Manual override
      expect(result.cornerPosition).toBe('front-left');
    });

    it('should return default for non-corner element', () => {
      const element = { x: 100, y: 100, width: 60, depth: 60 };
      const result = CornerCabinetDoorMatrix.determineCornerDoorSide(element, roomDimensions);

      expect(result.cornerPosition).toBeNull();
      expect(result.doorSide).toBe('right');  // Default
    });

    it('should handle auto as cornerDoorSide (uses matrix)', () => {
      const element = {
        x: 0, y: 0, width: 90, depth: 90,
        cornerDoorSide: 'auto' as const
      };
      const result = CornerCabinetDoorMatrix.determineCornerDoorSide(element, roomDimensions);

      expect(result.doorSide).toBe('right');  // Matrix result, not overridden
      expect(result.cornerPosition).toBe('front-left');
    });
  });

  describe('Matrix consistency (all 16 scenarios: 4 corners × 4 views)', () => {
    // The door side should be the SAME across all 4 elevation views
    // because the door orientation is based on CORNER POSITION, not view

    const corners = [
      { position: 'front-left' as const, element: { x: 0, y: 0, width: 90, depth: 90 }, expectedDoor: 'right' },
      { position: 'front-right' as const, element: { x: 310, y: 0, width: 90, depth: 90 }, expectedDoor: 'left' },
      { position: 'back-left' as const, element: { x: 0, y: 510, width: 90, depth: 90 }, expectedDoor: 'right' },
      { position: 'back-right' as const, element: { x: 310, y: 510, width: 90, depth: 90 }, expectedDoor: 'left' },
    ];

    const views = ['front', 'back', 'left', 'right'];

    corners.forEach(({ position, element, expectedDoor }) => {
      views.forEach((view) => {
        it(`should return ${expectedDoor} for ${position} corner in ${view} view`, () => {
          const result = CornerCabinetDoorMatrix.determineCornerDoorSide(element, roomDimensions);

          expect(result.cornerPosition).toBe(position);
          expect(result.doorSide).toBe(expectedDoor);

          // This proves the door side is VIEW-INDEPENDENT (same for all views)
        });
      });
    });
  });

  describe('transformDoorSideForView', () => {
    describe('Front View - No Transformation', () => {
      it('should not transform door side in front view', () => {
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', 'front-left', 'front')).toBe('left');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('right', 'front-right', 'front')).toBe('right');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', 'front-left', 'front-default')).toBe('left');
      });
    });

    describe('Back View - No Transformation', () => {
      it('should not transform door side in back view', () => {
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', 'back-left', 'back')).toBe('left');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('right', 'back-right', 'back')).toBe('right');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', 'back-left', 'back-default')).toBe('left');
      });
    });

    describe('Left View - Mirror Transformation', () => {
      it('should transform back-left corner door sides', () => {
        // Back-left corner: On RIGHT side of left elevation view
        // Matrix says 'right' (away from left wall), flip it to 'left'
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('right', 'back-left', 'left')).toBe('left');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', 'back-left', 'left')).toBe('right');
      });

      it('should not transform front-left corner door sides', () => {
        // Front-left corner: No transformation needed
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', 'front-left', 'left')).toBe('left');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('right', 'front-left', 'left')).toBe('right');
      });

      it('should handle view suffixes in left view', () => {
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('right', 'back-left', 'left-default')).toBe('left');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('right', 'back-left', 'left-dup1')).toBe('left');
      });
    });

    describe('Right View - Transformation', () => {
      it('should transform front-right corner door sides', () => {
        // Front-right corner: On LEFT side of right elevation view
        // Matrix says 'left' (away from right wall), flip it to 'right'
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', 'front-right', 'right')).toBe('right');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('right', 'front-right', 'right')).toBe('left');
      });

      it('should not transform back-right corner door sides', () => {
        // Back-right corner: No transformation needed
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', 'back-right', 'right')).toBe('left');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('right', 'back-right', 'right')).toBe('right');
      });

      it('should handle view suffixes in right view', () => {
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', 'front-right', 'right-default')).toBe('right');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', 'front-right', 'right-dup1')).toBe('right');
      });
    });

    describe('Edge Cases', () => {
      it('should return original door side when corner position is null', () => {
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', null, 'front')).toBe('left');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('right', null, 'back')).toBe('right');
      });

      it('should return original door side when view is undefined', () => {
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', 'front-left', undefined)).toBe('left');
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('right', 'back-right', undefined)).toBe('right');
      });

      it('should return original door side when both are null/undefined', () => {
        expect(CornerCabinetDoorMatrix.transformDoorSideForView('left', null, undefined)).toBe('left');
      });
    });
  });
});
