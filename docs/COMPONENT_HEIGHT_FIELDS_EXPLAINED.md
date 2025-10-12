# Component Height Fields - Complete Explanation

## Overview

The application uses **THREE different height-related fields** for components, each serving a distinct purpose. Understanding the difference is critical for proper rendering.

## The Three Height Fields

### 1. `height` (Component's Physical Height - Z-axis dimension)

**Source:** Database `components` table → `height` column
**Type:** Dimension (physical measurement)
**Unit:** Centimeters
**Purpose:** The actual **physical height** of the component itself (bottom to top)

**Where it's used:**
- ✅ `DesignElement.height` - Stored in every placed component
- ✅ Elevation view rendering - Determines how tall to draw the component
- ✅ 3D rendering - Z-axis dimension of the bounding box
- ✅ Component drag data - Transferred during drag-and-drop

**Examples:**
```typescript
Base Cabinet: height = 85cm   // Cabinet is 85cm tall
Wall Cabinet: height = 72cm   // Cabinet is 72cm tall
Refrigerator: height = 180cm  // Appliance is 180cm tall
Counter-top: height = 4cm     // Counter is 4cm thick
Cornice: height = 10cm        // Trim piece is 10cm tall
```

**Coordinate system:**
```
        ┌─────────────┐ ← Top edge (z + height)
        │             │
height  │  Component  │  This is the component's
(85cm)  │             │  physical vertical size
        │             │
        └─────────────┘ ← Bottom edge (z position)
```

---

### 2. `default_z_position` (Placement Height Off Floor)

**Source:** Database `components` table → `default_z_position` column
**Type:** Position (placement coordinate)
**Unit:** Centimeters
**Purpose:** Where the component's **bottom edge** is positioned vertically off the floor

**Where it's used:**
- ✅ `componentZPositionHelper.ts` - Calculates initial Z placement
- ✅ Component creation (3 paths: mobile click, desktop click, drag-drop)
- ✅ `DesignElement.z` - Initial placement coordinate

**Examples:**
```typescript
Base Cabinet: default_z_position = 0     // Sits on floor
Wall Cabinet: default_z_position = 140   // Bottom edge 140cm above floor
Cornice: default_z_position = 200        // Bottom edge 200cm above floor
Counter-top: default_z_position = 90     // Top of base cabinets
Window: default_z_position = 90          // Sill height
```

**Coordinate system:**
```
Ceiling 240cm ┌─────────────────┐

        200cm │                 │ ← Cornice (z=200, height=10)
              ├─────────────────┤   Top edge = 210cm

        140cm │                 │ ← Wall Cabinet (z=140, height=72)
              │                 │   Top edge = 212cm
              └─────────────────┘

         90cm ├─────────────────┤ ← Counter-top (z=90, height=4)
              │                 │   Top edge = 94cm
              │                 │
          0cm └─────────────────┘ ← Base Cabinet (z=0, height=85)
                                    Top edge = 85cm
Floor     0cm ═══════════════════
```

**Key relationship:**
```typescript
topEdge = default_z_position + height;

// Example: Wall Cabinet
topEdge = 140 + 72 = 212cm
```

---

### 3. `elevation_height` (Override for Elevation Views)

**Source:** Database `components` table → `elevation_height` column
**Type:** Optional override
**Unit:** Centimeters
**Purpose:** **Alternative height** specifically for elevation view rendering (when different from physical height)

**Where it's used:**
- ✅ `ComponentService.getElevationHeight()` - Loads override value
- ✅ `useElevationHeight` hook - React hook for elevation rendering
- ⚠️ **Rarely populated** - Only 7 components have this set

**When to use:**
- Component looks different in elevation view vs 3D view
- Visual representation needs different proportions
- Special display rules for certain component types

**Current database state:**
```
Total components: 194
With elevation_height: 7 (3.6%)

Components that have elevation_height:
- dishwasher: 85cm
- refrigerator: 180cm
- corner-cabinet: 85cm
- base-cabinet-60: 85cm
- counter-top-horizontal: 4cm
- counter-top-vertical: 4cm
- wall-cabinet-60: 85cm
```

**Priority system in code:**
```typescript
// From ComponentService.getElevationHeight()

if (component.use_actual_height_in_elevation || component.is_tall_unit) {
  return component.height;  // Use actual height
} else if (component.elevation_height) {
  return component.elevation_height;  // Use override
} else {
  return component.height;  // Fallback to actual height
}
```

---

## Comparison Table

| Field | What It Represents | Where Bottom Edge | Where Top Edge | Used In |
|-------|-------------------|-------------------|----------------|---------|
| `height` | Physical size | `z` | `z + height` | 3D, Elevation, Drag-drop |
| `default_z_position` | Placement off floor | `default_z_position` | `default_z_position + height` | Initial placement only |
| `elevation_height` | Visual override | `z` | `z + elevation_height` | Elevation view only |

## Real-World Example: Wall Cabinet

```typescript
// Database values:
wall_cabinet = {
  component_id: "wall-cabinet-60",
  height: 72,                  // Physical: 72cm tall
  default_z_position: 140,     // Placement: Bottom edge at 140cm
  elevation_height: 85         // Override: Show as 85cm in elevation
}

// When user drags this cabinet onto canvas:
DesignElement = {
  height: 72,         // Physical dimension (from database)
  z: 140,             // Initial placement (from componentZPositionHelper)
  // Top edge will be at 140 + 72 = 212cm
}

// When rendering elevation view:
const displayHeight = getElevationHeight(component);
// Returns 85 (from elevation_height override)
// Draws component as 85cm tall (not 72cm)
```

## Code Flow

### Component Creation (Drag-and-Drop):
```typescript
// 1. User drags component from sidebar
const dragData = {
  height: component.height,                       // Physical: 72cm
  default_z_position: component.default_z_position // Placement: 140cm
};

// 2. User drops component on canvas
const defaultZ = getDefaultZ(
  component.type,
  component.component_id,
  component.default_z_position  // Priority: database value
);

// 3. Create DesignElement
const element: DesignElement = {
  z: defaultZ,          // 140cm (bottom edge)
  height: component.height,  // 72cm (physical size)
  // Top edge = 140 + 72 = 212cm
};
```

### Elevation View Rendering:
```typescript
// 1. Get elevation height (with override priority)
const elevationHeight = await ComponentService.getElevationHeight(
  component.component_id,
  component.type
);

// Returns elevation_height if set (85cm), otherwise height (72cm)

// 2. Render at correct Y position
const y = roomHeight - (element.z + elevationHeight);
// For wall cabinet: y = 240 - (140 + 85) = 15cm from top

// 3. Draw with override height
ctx.fillRect(x, y, width, elevationHeight);
// Draws 85cm tall (not 72cm)
```

## Why This Complexity?

**Historical reasons:**
1. Started with just `height` field
2. Added `default_z_position` for smart placement
3. Added `elevation_height` for visual overrides in elevation views

**Design decision:**
- `height` = "truth" (physical dimension)
- `default_z_position` = "placement logic" (where to put it)
- `elevation_height` = "presentation" (how to show it)

## Recommendations

### ✅ Current State is Good:
- `height` field is populated for all 194 components ✅
- `default_z_position` is populated for 34 components, rest correctly at 0 ✅
- `elevation_height` is sparse (only 7 components) - **this is fine** ✅

### 📝 Database Population Priority:
1. **HIGH**: Ensure `default_z_position` correct for wall-mounted components (mostly done)
2. **MEDIUM**: Consider if any other components need non-zero `default_z_position`
3. **LOW**: `elevation_height` only needs values if visual representation differs from physical

### 🚫 Don't Confuse:
- ❌ `elevation_height` is NOT "height in elevation view" (that's still `height`)
- ❌ `default_z_position` is NOT "component height" (that's `height`)
- ❌ Don't set `elevation_height` unless you specifically want different visual representation

## Summary

**For 95% of components:**
- ✅ Set `height` to physical dimension
- ✅ Set `default_z_position` to where it mounts (0 for floor, 140 for wall, etc.)
- ✅ Leave `elevation_height` null/empty

**Only set `elevation_height` when:**
- Visual representation in elevation view should differ from 3D
- Specific display requirements for that component type
- Design calls for proportional adjustments

---

**Document Status:** Complete analysis based on code review
**Last Updated:** 2025-10-12
**Components Analyzed:** 194
**Code Files Reviewed:** 12
