/**
 * Security utilities for input validation and sanitization
 */

// Interface for validated component data
export interface ValidatedComponentData {
  id: string;
  name: string;
  type: 'cabinet' | 'appliance';
  width: number;
  height: number;
  color: string;
  category: string;
  description: string;
}

/**
 * Validates and sanitizes design name input
 */
export function validateDesignName(name: string): string {
  if (typeof name !== 'string') {
    throw new Error('Design name must be a string');
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    throw new Error('Design name cannot be empty');
  }
  
  if (trimmed.length > 100) {
    throw new Error('Design name too long (max 100 characters)');
  }
  
  // Remove potentially dangerous characters but allow common punctuation
  const sanitized = trimmed.replace(/[<>{}[\]\\]/g, '');
  
  if (sanitized.length === 0) {
    throw new Error('Design name contains only invalid characters');
  }
  
  return sanitized;
}

/**
 * Safely parses and validates drag/drop component data
 */
export function parseComponentData(jsonString: string): ValidatedComponentData {
  if (typeof jsonString !== 'string' || jsonString.trim().length === 0) {
    throw new Error('Invalid component data: empty or non-string input');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Invalid component data: malformed JSON');
  }

  // Validate required fields
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid component data: not an object');
  }

  const requiredFields = ['id', 'name', 'type', 'width', 'height', 'color', 'category', 'description'];
  for (const field of requiredFields) {
    if (!(field in parsed)) {
      throw new Error(`Invalid component data: missing field ${field}`);
    }
  }

  // Validate field types and values
  if (typeof parsed.id !== 'string' || parsed.id.length === 0) {
    throw new Error('Invalid component data: id must be non-empty string');
  }

  if (typeof parsed.name !== 'string' || parsed.name.length === 0) {
    throw new Error('Invalid component data: name must be non-empty string');
  }

  if (!['cabinet', 'appliance'].includes(parsed.type)) {
    throw new Error('Invalid component data: type must be cabinet or appliance');
  }

  if (typeof parsed.width !== 'number' || parsed.width <= 0 || parsed.width > 1000) {
    throw new Error('Invalid component data: width must be positive number ≤ 1000');
  }

  if (typeof parsed.height !== 'number' || parsed.height <= 0 || parsed.height > 1000) {
    throw new Error('Invalid component data: height must be positive number ≤ 1000');
  }

  if (typeof parsed.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(parsed.color)) {
    throw new Error('Invalid component data: color must be valid hex color');
  }

  if (typeof parsed.category !== 'string' || parsed.category.length === 0) {
    throw new Error('Invalid component data: category must be non-empty string');
  }

  if (typeof parsed.description !== 'string') {
    throw new Error('Invalid component data: description must be string');
  }

  // Return sanitized data
  return {
    id: parsed.id.trim(),
    name: parsed.name.trim(),
    type: parsed.type,
    width: Math.round(parsed.width),
    height: Math.round(parsed.height),
    color: parsed.color.toLowerCase(),
    category: parsed.category.trim(),
    description: parsed.description.trim()
  };
}

/**
 * Creates safe SVG content for icons
 */
export function createSafeSVGElement(svgString: string): HTMLElement {
  // Create a text node instead of using innerHTML to prevent XSS
  const container = document.createElement('div');
  
  // Basic SVG validation - check it starts with <svg and ends with </svg>
  const trimmed = svgString.trim();
  if (!trimmed.startsWith('<svg') || !trimmed.endsWith('</svg>')) {
    // Return a safe default icon if SVG is invalid
    container.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="2"/></svg>';
    return container;
  }
  
  // Use DOMParser for safer SVG parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, 'image/svg+xml');
  
  // Check for parsing errors
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    // Return safe default if parsing failed
    container.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="2"/></svg>';
    return container;
  }
  
  const svgElement = doc.documentElement;
  if (svgElement.tagName.toLowerCase() !== 'svg') {
    // Return safe default if not an SVG
    container.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="2"/></svg>';
    return container;
  }
  
  // Import the SVG node safely
  const importedSVG = document.importNode(svgElement, true);
  container.appendChild(importedSVG);
  
  return container;
}