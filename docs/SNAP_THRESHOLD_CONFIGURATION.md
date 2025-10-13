# Snap Threshold Configuration

This document describes the snap threshold configuration system used in the application.

## Overview

All snap thresholds are database-driven with fallback constants. The system loads configuration values from the database on component mount and uses them throughout the application.

## Configuration Values

### Snap Thresholds

| Configuration Key | Default Value | Description | Used In |
|------------------|---------------|-------------|---------|
| `wall_snap_threshold` | 40 cm | Distance within which components snap to walls | DesignCanvas2D.tsx |
| `snap_tolerance_default` | 15 cm | Default component-to-component snap distance | getSnapPosition() |
| `snap_tolerance_countertop` | 25 cm | Countertop-specific snap distance | getSnapPosition() |
| `wall_snap_distance_default` | 35 cm | Default distance from wall for snapping | getSnapPosition() |
| `wall_snap_distance_countertop` | 50 cm | Countertop distance from wall for snapping | getSnapPosition() |
| `corner_tolerance` | 30 cm | Distance tolerance for corner detection | Corner snapping logic |
| `proximity_threshold` | 100 cm | Threshold for component proximity detection | Component snapping |
| `drag_threshold_mouse` | 5 px | Mouse drag threshold (prevents accidental drags) | Mouse handlers |
| `drag_threshold_touch` | 10 px | Touch drag threshold (prevents accidental drags) | Touch handlers |

## Fallback Constants

Constants defined at the top of `DesignCanvas2D.tsx`:

```typescript
const WALL_THICKNESS = 10;        // 10cm wall thickness
const WALL_CLEARANCE = 5;          // 5cm clearance from walls
const WALL_SNAP_THRESHOLD = 40;    // Snap to wall if within 40cm
```

These constants are used as fallbacks when database values are not available.

## Configuration Loading

Configuration is loaded from the database on component mount:

```typescript
configCache = {
  wall_snap_threshold: ConfigurationService.getSync('wall_snap_threshold', WALL_SNAP_THRESHOLD),
  snap_tolerance_default: ConfigurationService.getSync('snap_tolerance_default', 15),
  // ... other values
};
```

## Usage Pattern

All snap logic uses the configuration cache:

```typescript
// Example: Wall snap distance
const wallSnapDistance = element.type === 'counter-top'
  ? (configCache.wall_snap_distance_countertop || 50)
  : (configCache.wall_snap_distance_default || 35);
```

## Notes

- All values use centimeters (cm) as the unit for consistency
- Drag thresholds use pixels (px) as they relate to screen space
- Configuration is loaded synchronously from the database cache
- Fallback values ensure the application works even if database is unavailable

## Consolidation Status (Phase 1.4)

✅ **All snap thresholds are properly consolidated:**
- All values are database-driven with proper fallbacks
- No hardcoded magic numbers in snap logic
- Consistent usage of `configCache` throughout the codebase
- Corner detection utilities use standard tolerance (30cm)

**Removed Legacy Code:**
- `canvasCoordinateIntegration.ts` hardcoded `snapThreshold = 40` is no longer used (file itself is deprecated after Phase 1.3)

## Future Improvements

Consider adding to database configuration:
- Grid snap size (currently hardcoded as GRID_SIZE = 10)
- Zoom limits (MIN_ZOOM, MAX_ZOOM)
- Canvas dimensions (if they should be dynamic)
