/**
 * FormulaEvaluator Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { FormulaEvaluator, createStandardVariables, evaluateCondition } from './FormulaEvaluator';

describe('FormulaEvaluator', () => {
  describe('Basic Operations', () => {
    it('should evaluate simple numbers', () => {
      const evaluator = new FormulaEvaluator({});
      expect(evaluator.evaluate('5')).toBe(5);
      expect(evaluator.evaluate('0.5')).toBe(0.5);
      expect(evaluator.evaluate('-10')).toBe(-10);
    });

    it('should evaluate addition', () => {
      const evaluator = new FormulaEvaluator({});
      expect(evaluator.evaluate('2 + 3')).toBe(5);
      expect(evaluator.evaluate('0.5 + 0.3')).toBeCloseTo(0.8);
    });

    it('should evaluate subtraction', () => {
      const evaluator = new FormulaEvaluator({});
      expect(evaluator.evaluate('5 - 3')).toBe(2);
      expect(evaluator.evaluate('0.6 - 0.3')).toBeCloseTo(0.3);
    });

    it('should evaluate multiplication', () => {
      const evaluator = new FormulaEvaluator({});
      expect(evaluator.evaluate('4 * 3')).toBe(12);
      expect(evaluator.evaluate('0.5 * 2')).toBe(1.0);
    });

    it('should evaluate division', () => {
      const evaluator = new FormulaEvaluator({});
      expect(evaluator.evaluate('10 / 2')).toBe(5);
      expect(evaluator.evaluate('0.6 / 2')).toBe(0.3);
    });
  });

  describe('Variables', () => {
    it('should substitute single variable', () => {
      const evaluator = new FormulaEvaluator({ width: 0.6 });
      expect(evaluator.evaluate('width')).toBe(0.6);
    });

    it('should substitute multiple variables', () => {
      const evaluator = new FormulaEvaluator({ width: 0.6, height: 0.9 });
      expect(evaluator.evaluate('width + height')).toBeCloseTo(1.5);
    });

    it('should handle variable division', () => {
      const evaluator = new FormulaEvaluator({ width: 0.6 });
      expect(evaluator.evaluate('width / 2')).toBe(0.3);
    });

    it('should throw on unknown variable', () => {
      const evaluator = new FormulaEvaluator({});
      expect(() => evaluator.evaluate('unknownVar')).toThrow('Invalid formula');
    });
  });

  describe('Complex Formulas', () => {
    it('should evaluate corner cabinet X-leg formula', () => {
      const evaluator = new FormulaEvaluator({
        cornerDepth: 0.6,
        legLength: 0.6,
      });
      // cornerDepth/2 - legLength/2 = 0.3 - 0.3 = 0.0
      expect(evaluator.evaluate('cornerDepth / 2 - legLength / 2')).toBeCloseTo(0.0);
    });

    it('should evaluate corner cabinet Z-leg formula', () => {
      const evaluator = new FormulaEvaluator({
        cornerDepth: 0.6,
        legLength: 0.6,
      });
      // cornerDepth/2 - legLength/2 - 0.1 = 0.3 - 0.3 - 0.1 = -0.1
      expect(evaluator.evaluate('cornerDepth / 2 - legLength / 2 - 0.1')).toBeCloseTo(-0.1);
    });

    it('should evaluate plinth height formula', () => {
      const evaluator = new FormulaEvaluator({
        height: 0.9,
        plinthHeight: 0.15,
      });
      // -height/2 + plinthHeight/2 = -0.45 + 0.075 = -0.375
      expect(evaluator.evaluate('-height / 2 + plinthHeight / 2')).toBeCloseTo(-0.375);
    });

    it('should evaluate door position formula', () => {
      const evaluator = new FormulaEvaluator({
        cornerDepth: 0.6,
        legLength: 0.6,
      });
      // cornerDepth - legLength/2 + 0.01 = 0.6 - 0.3 + 0.01 = 0.31
      expect(evaluator.evaluate('cornerDepth - legLength / 2 + 0.01')).toBeCloseTo(0.31);
    });
  });

  describe('Operator Precedence', () => {
    it('should respect multiplication before addition', () => {
      const evaluator = new FormulaEvaluator({});
      expect(evaluator.evaluate('2 + 3 * 4')).toBe(14); // Not 20
    });

    it('should respect division before subtraction', () => {
      const evaluator = new FormulaEvaluator({});
      expect(evaluator.evaluate('10 - 6 / 2')).toBe(7); // Not 2
    });

    it('should handle parentheses correctly', () => {
      const evaluator = new FormulaEvaluator({});
      expect(evaluator.evaluate('(2 + 3) * 4')).toBe(20);
      expect(evaluator.evaluate('(10 - 6) / 2')).toBe(2);
    });

    it('should handle nested parentheses', () => {
      const evaluator = new FormulaEvaluator({});
      expect(evaluator.evaluate('((2 + 3) * 4) / 2')).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace', () => {
      const evaluator = new FormulaEvaluator({ width: 0.6 });
      expect(evaluator.evaluate('  width  /  2  ')).toBe(0.3);
    });

    it('should handle no whitespace', () => {
      const evaluator = new FormulaEvaluator({ width: 0.6 });
      expect(evaluator.evaluate('width/2+0.01')).toBeCloseTo(0.31);
    });

    it('should throw on division by zero', () => {
      const evaluator = new FormulaEvaluator({});
      expect(() => evaluator.evaluate('10 / 0')).toThrow('Invalid formula');
    });

    it('should handle numeric input', () => {
      const evaluator = new FormulaEvaluator({});
      expect(evaluator.evaluate(5)).toBe(5);
      expect(evaluator.evaluate(0.3)).toBe(0.3);
    });

    it('should handle string numbers', () => {
      const evaluator = new FormulaEvaluator({});
      expect(evaluator.evaluate('0.6')).toBe(0.6);
    });
  });

  describe('Batch Evaluation', () => {
    it('should evaluate multiple formulas', () => {
      const evaluator = new FormulaEvaluator({
        width: 0.6,
        height: 0.9,
        depth: 0.6,
      });

      const results = evaluator.evaluateBatch([
        'width / 2',
        'height / 2',
        'depth / 2',
      ]);

      expect(results).toEqual([0.3, 0.45, 0.3]);
    });

    it('should handle mixed formulas and numbers', () => {
      const evaluator = new FormulaEvaluator({ width: 0.6 });

      const results = evaluator.evaluateBatch([
        'width / 2',
        0.5,
        '0.3 + 0.2',
      ]);

      expect(results).toEqual([0.3, 0.5, 0.5]);
    });
  });

  describe('Variable Updates', () => {
    it('should update variable values', () => {
      const evaluator = new FormulaEvaluator({ width: 0.6 });
      expect(evaluator.evaluate('width')).toBe(0.6);

      evaluator.updateVariable('width', 0.9);
      expect(evaluator.evaluate('width')).toBe(0.9);
    });

    it('should get all variables', () => {
      const vars = { width: 0.6, height: 0.9 };
      const evaluator = new FormulaEvaluator(vars);
      expect(evaluator.getVariables()).toEqual(vars);
    });
  });
});

describe('createStandardVariables', () => {
  it('should create variables for standard cabinet', () => {
    const element = { width: 60, height: 90, depth: 60 };
    const vars = createStandardVariables(element);

    expect(vars.width).toBe(0.6); // Converted to meters
    expect(vars.height).toBe(0.9);
    expect(vars.depth).toBe(0.6);
    expect(vars.plinthHeight).toBe(0.15); // Default
    expect(vars.cabinetHeight).toBeCloseTo(0.75); // height - plinth
  });

  it('should create variables for corner cabinet', () => {
    const element = { width: 60, height: 90, depth: 60 };
    const vars = createStandardVariables(element, {
      legLength: 0.6,
      cornerDepth: 0.6,
      isWallCabinet: false,
    });

    expect(vars.legLength).toBe(0.6);
    expect(vars.cornerDepth).toBe(0.6);
    expect(vars.isWallCabinet).toBe(0); // false = 0
  });

  it('should create variables for wall cabinet', () => {
    const element = { width: 60, height: 70, depth: 40 };
    const vars = createStandardVariables(element, {
      isWallCabinet: true,
    });

    expect(vars.cornerDepth).toBe(0.4); // Wall cabinet default
    expect(vars.isWallCabinet).toBe(1); // true = 1
  });

  it('should use default depth if not provided', () => {
    const element = { width: 60, height: 90 };
    const vars = createStandardVariables(element);

    expect(vars.depth).toBe(0.6); // Default
  });
});

describe('evaluateCondition', () => {
  it('should evaluate negation', () => {
    const vars = { isWallCabinet: 0 };
    expect(evaluateCondition('!isWallCabinet', vars)).toBe(true);
  });

  it('should evaluate negation false', () => {
    const vars = { isWallCabinet: 1 };
    expect(evaluateCondition('!isWallCabinet', vars)).toBe(false);
  });

  it('should evaluate direct variable', () => {
    const vars = { hasHandle: 1 };
    expect(evaluateCondition('hasHandle', vars)).toBe(true);
  });

  it('should evaluate direct variable false', () => {
    const vars = { hasHandle: 0 };
    expect(evaluateCondition('hasHandle', vars)).toBe(false);
  });
});

describe('Real-World Corner Cabinet Test', () => {
  it('should evaluate all corner cabinet 60cm formulas correctly', () => {
    // Element dimensions: 60cm x 90cm x 60cm
    const element = { width: 60, height: 90, depth: 60 };
    const vars = createStandardVariables(element, {
      legLength: 0.6,
      cornerDepth: 0.6,
      isWallCabinet: false,
    });

    const evaluator = new FormulaEvaluator(vars);

    // Test all 8 geometry parts from sample data

    // Plinth X-leg position
    const plinthX = evaluator.evaluateBatch([
      '0',
      '-height / 2 + plinthHeight / 2',
      'cornerDepth / 2 - legLength / 2 - 0.1',
    ]);
    expect(plinthX).toEqual([0, -0.375, -0.1]);

    // Cabinet X-leg position
    const cabinetX = evaluator.evaluateBatch([
      '0',
      'plinthHeight / 2',
      'cornerDepth / 2 - legLength / 2',
    ]);
    expect(cabinetX[0]).toBe(0);
    expect(cabinetX[1]).toBeCloseTo(0.075);
    expect(cabinetX[2]).toBeCloseTo(0.0);

    // Door front position
    const doorFront = evaluator.evaluateBatch([
      '0',
      'plinthHeight / 2',
      'cornerDepth - legLength / 2 + 0.01',
    ]);
    expect(doorFront[0]).toBe(0);
    expect(doorFront[1]).toBeCloseTo(0.075);
    expect(doorFront[2]).toBeCloseTo(0.31);

    // Handle front position
    const handleFront = evaluator.evaluateBatch([
      'legLength / 2 - 0.05',
      'plinthHeight / 2',
      'cornerDepth - legLength / 2 + 0.03',
    ]);
    expect(handleFront[0]).toBeCloseTo(0.25);
    expect(handleFront[1]).toBeCloseTo(0.075);
    expect(handleFront[2]).toBeCloseTo(0.33);
  });
});
