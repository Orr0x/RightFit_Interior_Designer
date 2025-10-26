# Component Positioning Reference

**Created**: 2025-10-26 (Story 1.7)
**Purpose**: Comprehensive guide to component positioning in the RightFit Interior Designer application

---

## Table of Contents

1. [Overview](#overview)
2. [Coordinate System](#coordinate-system)
3. [Position vs Dimension](#position-vs-dimension)
4. [Z Position Guidelines](#z-position-guidelines)
5. [Common Mistakes](#common-mistakes)
6. [Validation](#validation)
7. [Type-Based Defaults](#type-based-defaults)
8. [Best Practices](#best-practices)

---

## Overview

Components in RightFit Interior Designer are positioned using a 3D coordinate system with explicit position (x, y, z) and dimension (width, depth, height) properties. Understanding the difference between position and dimension is critical for correct component placement.

**Key Principle**: Position tells you WHERE the component is, dimension tells you HOW BIG it is.

---

## Coordinate System

### Axes Definition

- **X-axis**: Width (left-to-right)
  - Origin (0): Left wall of room
  - Positive direction: Towards right wall
  - Units: Centimeters (cm)

- **Y-axis**: Depth (front-to-back)
  - Origin (0): Front wall of room
  - Positive direction: Towards back wall
  - Units: Centimeters (cm)

- **Z-axis**: Height (floor-to-ceiling)
  - Origin (0): Floor level
  - Positive direction: Towards ceiling
  - Units: Centimeters (cm)
  - Typical ceiling height: 240cm

### Visual Representation

```
         ┌─────────────────────┐  ← Ceiling (Z = 240cm)
         │                     │
         │  ─ Cornice          │  ← Z = 210cm (above wall cabinets)
         │   Wall Cabinet      │  ← Z = 140cm (tops at 210cm)
         │   ┌───────┐         │
         │  ─│Pelmet │         │  ← Z = 140cm (below wall cabinets)
         │   └───────┘         │
         │                     │
         │   Window            │  ← Z = 100cm (above worktop)
         │   ┌─────┐           │
    Y    │   └─────┘           │
    ↑    │  ═ Countertop       │  ← Z = 86cm (4cm thick, top at 90cm)
    │    │   ═══════════       │
    │    │   Base Cabinet      │  ← Z = 0cm (86cm tall)
    │    │   ┌───────┐         │
    └──→ X   │       │         │
   /     └───┴───────┴─────────┘  ← Floor (Z = 0cm)
  Z
```

---

## Position vs Dimension

### Position Properties

- `x`: X-axis position (cm from left wall)
- `y`: Y-axis position (cm from front wall)
- `z`: Z-axis position (cm from floor)

**Example**: Cabinet at x=100, y=0, z=0
- 100cm from left wall
- Against front wall (y=0)
- Sitting on floor (z=0)

### Dimension Properties

- `width`: Size along X-axis (cm)
- `depth`: Size along Y-axis (cm)
- `height`: Size along Z-axis (cm)

**Example**: Cabinet with width=60, depth=60, height=90
- 60cm wide (left-to-right)
- 60cm deep (front-to-back)
- 90cm tall (floor-to-ceiling)

### Complete Example

```typescript
const baseСabinet: DesignElement = {
  id: '1',
  component_id: 'BC-60-90',
  type: 'cabinet',

  // POSITION: Where it is
  x: 100,      // 100cm from left wall
  y: 0,        // Against front wall
  z: 0,        // On floor

  // DIMENSION: How big it is
  width: 60,   // 60cm wide
  depth: 60,   // 60cm deep
  height: 90,  // 90cm tall

  rotation: 0,
  zIndex: 2
};

// This cabinet:
// - Sits on the floor (z=0)
// - Is 90cm tall (height=90)
// - Occupies floor space from (100, 0) to (160, 60)
// - Occupies vertical space from 0cm to 90cm
```

---

## Z Position Guidelines

### Standard Heights by Component Type

| Component Type | Typical Z Position | Rationale |
|----------------|-------------------|-----------|
| **Floor Level** | | |
| Base cabinets | 0cm | Sit directly on floor (86cm tall) |
| Base corner units | 0cm | Match base cabinet height (86cm tall) |
| Tall larder units | 0cm | Floor-to-ceiling units (210cm tall, tops match wall cabinets) |
| Appliances | 0cm | Sit directly on floor |
| Doors | 0cm | Door frame starts at floor |
| Flooring | 0cm | IS the floor |
| Toe kicks | 0cm | Recessed into base of cabinets |
| End panels | 0cm | Start at floor |
| **Countertop Level** | | |
| Counter tops | 86cm | Sit on 86cm base units, 4cm thick, top at 90cm |
| **Window Level** | | |
| Windows | 100cm | Above 90cm worktop |
| **Wall Cabinet Level** | | |
| Wall cabinets | 140cm | Tops match larders at 210cm (70cm tall typical) |
| Wall unit end panels | 140cm | Match wall cabinet start height |
| Pelmet | 140cm | Below wall cabinets (decorative trim) |
| **Cornice Level** | | |
| Cornice | 210cm | Above wall cabinets (at top, decorative trim) |
| **Sink Level** | | |
| Kitchen sinks | 75cm | Integrated into countertop |
| Butler sinks | 65cm | Lower for utility sink |

### Validation Rules

**Rule 1**: Z must be non-negative
```typescript
// ❌ INVALID
{ z: -10, height: 90 }  // Cannot be below floor

// ✅ VALID
{ z: 0, height: 90 }    // Starts at floor
```

**Rule 2**: Z must not exceed ceiling height
```typescript
// ❌ INVALID (ceiling = 240cm)
{ z: 250, height: 80 }  // Above ceiling

// ✅ VALID
{ z: 200, height: 80 }  // Below ceiling (280cm total would exceed)
```

**Rule 3**: Z + height must not exceed ceiling height
```typescript
// ❌ INVALID (ceiling = 240cm)
{ z: 200, height: 90 }  // 200 + 90 = 290cm (exceeds ceiling)

// ✅ VALID
{ z: 200, height: 40 }  // 200 + 40 = 240cm (exactly at ceiling)
```

**Rule 4**: Z should not equal height (common copy-paste error)
```typescript
// ⚠️ SUSPICIOUS
{ z: 90, height: 90 }   // Likely mistake (90cm off floor AND 90cm tall?)

// ✅ TYPICAL
{ z: 0, height: 90 }    // On floor, 90cm tall
{ z: 86, height: 4 }    // Countertop, 4cm thick
```

---

## Common Mistakes

### Mistake #1: Confusing Z with Height

**Problem**: Setting z = height (copy-paste error)

```typescript
// ❌ WRONG - z confused with height
const cabinet = {
  x: 100,
  y: 0,
  z: 90,      // ← Mistake: this is 90cm OFF THE FLOOR
  width: 60,
  depth: 60,
  height: 90  // ← And 90cm tall
};
// This cabinet would be floating 90cm above floor!

// ✅ RIGHT - z is position, height is dimension
const cabinet = {
  x: 100,
  y: 0,
  z: 0,       // ← On floor
  width: 60,
  depth: 60,
  height: 90  // ← 90cm tall
};
```

### Mistake #2: Wall Cabinets at Floor Level

**Problem**: Forgetting to set Z for wall-mounted components

```typescript
// ❌ WRONG - wall cabinet on floor
const wallCabinet = {
  component_id: 'wall-cabinet-60x90',
  type: 'cabinet',
  z: 0,       // ← Mistake: wall cabinet should be high up
  height: 80
};

// ✅ RIGHT - wall cabinet at wall height
const wallCabinet = {
  component_id: 'wall-cabinet-60x90',
  type: 'cabinet',
  z: 200,     // ← 200cm off floor
  height: 80  // ← 80cm tall
};
```

### Mistake #3: Base Cabinets at Wall Height

**Problem**: Setting Z too high for floor-level components

```typescript
// ❌ WRONG - base cabinet floating
const baseCabinet = {
  component_id: 'base-cabinet-60x90',
  type: 'cabinet',
  z: 200,     // ← Mistake: base cabinet should be on floor
  height: 90
};

// ✅ RIGHT - base cabinet on floor
const baseCabinet = {
  component_id: 'base-cabinet-60x90',
  type: 'cabinet',
  z: 0,       // ← On floor
  height: 90  // ← 90cm tall
};
```

### Mistake #4: Components Exceeding Ceiling

**Problem**: Z + height > ceiling height

```typescript
// ❌ WRONG - extends through ceiling (240cm)
const larderUnit = {
  z: 0,        // Floor level
  height: 260  // ← 260cm tall exceeds 240cm ceiling
};

// ✅ RIGHT - fits within ceiling
const larderUnit = {
  z: 0,        // Floor level
  height: 240  // ← Exactly ceiling height (floor-to-ceiling unit)
};
```

---

## Validation

### Using ComponentPositionValidator

```typescript
import { ComponentPositionValidator } from '@/utils/ComponentPositionValidator';

// Validate single element
const validation = ComponentPositionValidator.validateZPosition(element, {
  width: 400,
  height: 600,
  ceilingHeight: 240
});

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}

if (validation.suspiciousCases.length > 0) {
  console.warn('Suspicious cases:', validation.suspiciousCases);
}

// Validate all elements in design
const results = ComponentPositionValidator.validateAll(
  design.design_elements,
  design.room_dimensions
);

const summary = ComponentPositionValidator.getValidationSummary(results);
console.log('Validation summary:', summary);
```

### Validation Output Types

**Errors** (invalid, must fix):
- Z position is negative
- Z exceeds ceiling height
- Component extends beyond ceiling (Z + height > ceiling)

**Warnings** (valid, but should review):
- Z not specified (using type default)

**Suspicious Cases** (valid, but likely mistakes):
- Z equals height (common copy-paste error)
- Wall cabinet at floor level (Z = 0)
- Base cabinet at wall height (Z > 100)

---

## Type-Based Defaults

When `z` is not explicitly set, the system uses type-based defaults:

```typescript
const defaults = {
  // Floor level (0cm)
  'cabinet': 0,      // Base cabinets (wall cabinets detected by component_id)
  'appliance': 0,
  'door': 0,
  'flooring': 0,
  'toe-kick': 0,
  'end-panel': 0,
  'wall': 0,

  // Countertop level (86cm)
  'counter-top': 86,

  // Window level (90cm)
  'window': 90,

  // Wall cabinet level (140-200cm)
  'pelmet': 140,
  'cornice': 200,
  'wall-unit-end-panel': 200,

  // Sink level (65-75cm)
  'sink': 75  // Kitchen sink (butler sink = 65cm)
};

// Special cases:
// - Wall cabinets: Detected by component_id containing "wall-cabinet" → Z = 200cm
// - Butler sinks: Detected by component_id containing "butler" → Z = 65cm
```

**Best Practice**: Always set Z explicitly instead of relying on defaults.

---

## Best Practices

### 1. Always Set Z Explicitly

```typescript
// ❌ BAD - relying on type default
const element = {
  type: 'cabinet',
  // z: undefined  ← Using default (0 or 200 depending on component_id)
  height: 90
};

// ✅ GOOD - explicit Z
const element = {
  type: 'cabinet',
  z: 0,  // ← Explicitly on floor
  height: 90
};
```

### 2. Use Validation Early and Often

```typescript
// Validate when creating elements
const element = createNewElement(componentId);
const validation = ComponentPositionValidator.validateZPosition(
  element,
  roomDimensions
);

if (!validation.valid) {
  console.error('Invalid element:', validation.errors);
  return;
}

// Validate entire design before saving
const results = ComponentPositionValidator.validateAll(
  design.design_elements,
  design.room_dimensions
);

const summary = ComponentPositionValidator.getValidationSummary(results);
if (summary.invalid > 0) {
  console.error(`Found ${summary.invalid} invalid elements`);
}
```

### 3. Document Special Cases

```typescript
const windowAboveDoor = {
  type: 'window',
  x: 100,
  y: 0,
  z: 210,  // ← Unusual height - document why
  height: 30,
  // Comment: Transom window above door
};
```

### 4. Use ensureValidZ for Legacy Data

```typescript
// When loading legacy designs that might not have Z set
const elements = loadedDesign.design_elements.map(element =>
  ComponentPositionValidator.ensureValidZ(element)
);
```

---

## Reference

**Related Files**:
- Type definition: `src/types/project.ts` (DesignElement interface)
- Validator utility: `src/utils/ComponentPositionValidator.ts`
- Coordinate engine: `src/services/CoordinateTransformEngine.ts`

**Related Documentation**:
- [Coordinate System Visual Guide](./coordinate-system-visual-guide.md)
- [Session Notes: Story 1.7](./session-2025-10-26-story-1.7-position-validator/)

**Created**: Story 1.7 - Create ComponentPositionValidator Utility
**Epic**: Epic 1 - Eliminate Circular Dependency Patterns
