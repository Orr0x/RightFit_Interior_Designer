/**
 * Formula Evaluator
 *
 * Purpose: Safely evaluate mathematical formulas for 3D model geometry
 * WITHOUT using eval() for security
 *
 * Supports:
 * - Variables: width, height, depth, legLength, cornerDepth, etc.
 * - Operators: +, -, *, /, ()
 * - Numbers: integers and decimals (0.5, -10, 2.5)
 *
 * Usage:
 * ```typescript
 * const evaluator = new FormulaEvaluator({
 *   width: 0.6,
 *   height: 0.9,
 *   legLength: 0.6,
 *   cornerDepth: 0.6
 * });
 *
 * evaluator.evaluate('width/2'); // 0.3
 * evaluator.evaluate('cornerDepth/2 - legLength/2'); // 0.0
 * evaluator.evaluate('(width + height) * 0.5'); // 0.75
 * ```
 *
 * Security:
 * - NO eval() or Function() constructor
 * - Only whitelisted operators
 * - Safe variable substitution
 * - Throws on invalid formulas
 */

export class FormulaEvaluator {
  private variables: Record<string, number>;

  constructor(variables: Record<string, number>) {
    this.variables = variables;
  }

  /**
   * Evaluate a formula string and return numeric result
   * @param formula - Formula string (e.g., 'width/2 + 0.01')
   * @returns Numeric result
   */
  evaluate(formula: string | number): number {
    // Handle numeric literals
    if (typeof formula === 'number') {
      return formula;
    }

    // Handle string numbers
    if (!isNaN(Number(formula))) {
      return Number(formula);
    }

    try {
      // Tokenize the formula
      const tokens = this.tokenize(formula);

      // Convert to Reverse Polish Notation (RPN)
      const rpn = this.toRPN(tokens);

      // Evaluate RPN
      return this.evaluateRPN(rpn);
    } catch (error) {
      console.error('[FormulaEvaluator] Failed to evaluate formula:', formula, error);
      throw new Error(`Invalid formula: ${formula}`);
    }
  }

  /**
   * Tokenize a formula string into tokens
   * Example: 'width/2 + 0.01' => ['width', '/', '2', '+', '0.01']
   * Handles unary minus: '-height' => ['0', '-', 'height']
   */
  private tokenize(formula: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let i = 0;

    while (i < formula.length) {
      const char = formula[i];

      // Skip whitespace
      if (char === ' ') {
        if (current) {
          tokens.push(current);
          current = '';
        }
        i++;
        continue;
      }

      // Handle operators and parentheses
      if (['+', '-', '*', '/', '(', ')'].includes(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }

        // Handle unary minus: if '-' is at start or after an operator/opening paren
        // Convert to '0 - value' (e.g., '-height' => ['0', '-', 'height'])
        if (char === '-' && (tokens.length === 0 || ['+', '-', '*', '/', '('].includes(tokens[tokens.length - 1]))) {
          tokens.push('0');
        }

        tokens.push(char);
        i++;
        continue;
      }

      // Handle numbers and variable names
      current += char;
      i++;
    }

    // Push final token
    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  /**
   * Convert infix notation to Reverse Polish Notation (RPN)
   * Example: ['width', '/', '2'] => ['width', '2', '/']
   * Uses Shunting Yard algorithm
   */
  private toRPN(tokens: string[]): string[] {
    const output: string[] = [];
    const operators: string[] = [];

    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
    };

    for (const token of tokens) {
      // Numbers and variables go to output
      if (this.isNumber(token) || this.isVariable(token)) {
        output.push(token);
        continue;
      }

      // Operators
      if (['+', '-', '*', '/'].includes(token)) {
        while (
          operators.length > 0 &&
          operators[operators.length - 1] !== '(' &&
          precedence[operators[operators.length - 1]] >= precedence[token]
        ) {
          output.push(operators.pop()!);
        }
        operators.push(token);
        continue;
      }

      // Left parenthesis
      if (token === '(') {
        operators.push(token);
        continue;
      }

      // Right parenthesis
      if (token === ')') {
        while (operators.length > 0 && operators[operators.length - 1] !== '(') {
          output.push(operators.pop()!);
        }
        // Remove the '('
        operators.pop();
        continue;
      }

      throw new Error(`Unknown token: ${token}`);
    }

    // Pop remaining operators
    while (operators.length > 0) {
      output.push(operators.pop()!);
    }

    return output;
  }

  /**
   * Evaluate Reverse Polish Notation (RPN)
   * Example: ['width', '2', '/'] with width=0.6 => 0.3
   */
  private evaluateRPN(rpn: string[]): number {
    const stack: number[] = [];

    for (const token of rpn) {
      // If it's a number, push to stack
      if (this.isNumber(token)) {
        stack.push(parseFloat(token));
        continue;
      }

      // If it's a variable, substitute and push
      if (this.isVariable(token)) {
        const value = this.variables[token];
        if (value === undefined) {
          throw new Error(`Unknown variable: ${token}`);
        }
        stack.push(value);
        continue;
      }

      // If it's an operator, pop operands and compute
      if (['+', '-', '*', '/'].includes(token)) {
        if (stack.length < 2) {
          throw new Error(`Insufficient operands for operator: ${token}`);
        }

        const b = stack.pop()!;
        const a = stack.pop()!;
        let result: number;

        switch (token) {
          case '+':
            result = a + b;
            break;
          case '-':
            result = a - b;
            break;
          case '*':
            result = a * b;
            break;
          case '/':
            if (b === 0) {
              throw new Error('Division by zero');
            }
            result = a / b;
            break;
          default:
            throw new Error(`Unknown operator: ${token}`);
        }

        stack.push(result);
        continue;
      }

      throw new Error(`Unknown token in RPN: ${token}`);
    }

    if (stack.length !== 1) {
      throw new Error('Invalid expression: stack should have exactly one result');
    }

    return stack[0];
  }

  /**
   * Check if token is a number
   */
  private isNumber(token: string): boolean {
    return !isNaN(parseFloat(token)) && isFinite(parseFloat(token));
  }

  /**
   * Check if token is a variable name
   */
  private isVariable(token: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token);
  }

  /**
   * Update a variable value
   */
  updateVariable(name: string, value: number): void {
    this.variables[name] = value;
  }

  /**
   * Get all variables
   */
  getVariables(): Record<string, number> {
    return { ...this.variables };
  }

  /**
   * Batch evaluate multiple formulas
   * Useful for evaluating position [x, y, z] or dimensions [w, h, d]
   */
  evaluateBatch(formulas: (string | number)[]): number[] {
    return formulas.map((f) => this.evaluate(f));
  }
}

/**
 * Helper function to create standard variable set for 3D models
 */
export function createStandardVariables(
  element: {
    width: number;
    height: number;
    depth?: number;
  },
  options?: {
    legLength?: number;
    cornerDepth?: number;
    plinthHeight?: number;
    cabinetHeight?: number;
    doorHeight?: number;
    isWallCabinet?: boolean;
  }
): Record<string, number> {
  const variables: Record<string, number> = {
    // Element dimensions
    width: element.width / 100, // Convert cm to meters
    height: element.height / 100,
    depth: element.depth ? element.depth / 100 : 0.6,

    // Common calculated values
    plinthHeight: options?.plinthHeight ?? 0.10, // 10cm default (changed from 15cm for consistency)
    cabinetHeight: options?.cabinetHeight ?? (element.height / 100 - 0.10),
    doorHeight: options?.doorHeight ?? (element.height / 100 - 0.12),

    // Corner-specific
    legLength: options?.legLength ?? (element.width / 100),
    cornerDepth: options?.cornerDepth ?? (options?.isWallCabinet ? 0.4 : 0.6),

    // Boolean flags (converted to 0/1 for formulas)
    isWallCabinet: options?.isWallCabinet ? 1 : 0,
  };

  return variables;
}

/**
 * Helper function to evaluate a conditional expression
 * Example: '!isWallCabinet' => true if isWallCabinet = 0
 */
export function evaluateCondition(
  condition: string,
  variables: Record<string, number>
): boolean {
  // Handle negation
  if (condition.startsWith('!')) {
    const varName = condition.substring(1);
    return variables[varName] === 0;
  }

  // Handle direct variable check
  return variables[condition] !== 0;
}
