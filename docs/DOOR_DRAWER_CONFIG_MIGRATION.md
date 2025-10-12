# Door/Drawer Configuration - Simple Data Migration

## Goal

Move existing door/drawer configuration from `component_2d_renders.elevation_data` to `components.component_behavior` for single source of truth.

**NOT adding new features** - just consolidating existing data.

## Why Now?

- ✅ Aligns with your database-first migration pattern
- ✅ Eliminates duplication between 2D render table and future needs
- ✅ Prepares foundation for future customization (but doesn't build it yet)
- ✅ Quick win (~1 hour)

## Current State

**Door/drawer config scattered:**
```
component_2d_renders.elevation_data (JSON):
  - door_count: 2
  - door_style: 'flat' | 'shaker' | 'glass'
  - handle_style: 'bar' | 'knob' | 'none'
  - handle_position: 'top' | 'center' | 'bottom'
  - drawer_count: 0
  - drawer_heights: []

components.component_behavior (JSON):
  - {} (mostly empty)
```

## Target State

**Single source in components table:**
```
components.component_behavior (JSON):
  {
    "door": {
      "count": 2,
      "style": "shaker",
      "width_cm": 30
    },
    "handle": {
      "style": "bar",
      "position": "center"
    },
    "drawer": {
      "count": 0,
      "heights_cm": []
    }
  }

component_2d_renders.elevation_data:
  - (eventually remove these fields, but keep for fallback during transition)
```

## Migration Steps

### Step 1: Populate component_behavior (SQL)

```sql
-- Create migration script to copy data from component_2d_renders to components
-- This is a one-time data migration

BEGIN;

-- For each component that has 2D render definition, copy door/drawer config
UPDATE components c
SET component_behavior = jsonb_build_object(
  'door', jsonb_build_object(
    'count', COALESCE((r.elevation_data->>'door_count')::int,
                     CASE WHEN c.width <= 60 THEN 1 ELSE 2 END),
    'style', COALESCE(r.elevation_data->>'door_style', 'flat'),
    'width_cm', 30  -- Default for now
  ),
  'handle', jsonb_build_object(
    'style', COALESCE(r.elevation_data->>'handle_style', 'bar'),
    'position', COALESCE(r.elevation_data->>'handle_position', 'center')
  ),
  'drawer', jsonb_build_object(
    'count', COALESCE((r.elevation_data->>'drawer_count')::int, 0),
    'heights_cm', COALESCE(r.elevation_data->'drawer_heights', '[]'::jsonb)
  )
)
FROM component_2d_renders r
WHERE c.component_id = r.component_id
  AND c.type = 'cabinet'
  AND r.elevation_data IS NOT NULL;

-- Verify
SELECT
  component_id,
  type,
  component_behavior->'door'->>'count' as door_count,
  component_behavior->'door'->>'style' as door_style,
  component_behavior->'handle'->>'style' as handle_style
FROM components
WHERE type = 'cabinet'
  AND component_behavior IS NOT NULL
LIMIT 10;

COMMIT;
```

### Step 2: Update ComponentService to Load Config

**File:** `src/services/ComponentService.ts`

Already loads `component_behavior`, just need to parse door/drawer fields:

```typescript
// Add interface
export interface DoorDrawerConfig {
  door: {
    count: number;
    style: 'flat' | 'shaker' | 'glass';
    width_cm: number;
  };
  handle: {
    style: 'bar' | 'knob' | 'none';
    position: 'top' | 'center' | 'bottom';
  };
  drawer: {
    count: number;
    heights_cm: number[];
  };
}

// Add method
static getDoorDrawerConfig(componentBehavior: any): DoorDrawerConfig {
  return {
    door: {
      count: componentBehavior?.door?.count ?? 2,
      style: componentBehavior?.door?.style ?? 'flat',
      width_cm: componentBehavior?.door?.width_cm ?? 30
    },
    handle: {
      style: componentBehavior?.handle?.style ?? 'bar',
      position: componentBehavior?.handle?.position ?? 'center'
    },
    drawer: {
      count: componentBehavior?.drawer?.count ?? 0,
      heights_cm: componentBehavior?.drawer?.heights_cm ?? []
    }
  };
}
```

### Step 3: Update 2D Renderer (Fallback Chain)

**File:** `src/services/2d-renderers/elevation-view-handlers.ts`

```typescript
// Line 36-40 - Update to check component_behavior first
const doorCount =
  componentBehavior?.door?.count ??           // NEW: From components table
  data.door_count ??                          // OLD: From 2D render table (fallback)
  2;                                          // Default

const doorStyle =
  componentBehavior?.door?.style ??           // NEW
  data.door_style ??                          // OLD (fallback)
  'flat';                                     // Default

const handleStyle =
  componentBehavior?.handle?.style ??         // NEW
  data.handle_style ??                        // OLD (fallback)
  'bar';                                      // Default

const handlePosition =
  componentBehavior?.handle?.position ??      // NEW
  data.handle_position ??                     // OLD (fallback)
  'center';                                   // Default
```

**How to get componentBehavior in renderer?**

Need to pass it through from DesignCanvas2D:

```typescript
// DesignCanvas2D.tsx - when loading component for rendering
const componentBehavior = await ComponentService.getComponentBehavior(element.type);

// Pass to renderer
renderElevationView(ctx, element, renderDef, view, x, y, width, height, zoom, roomDimensions, componentBehavior);
```

### Step 4: Update 3D Renderer (Use Same Pattern)

**File:** `src/components/designer/EnhancedModels3D.tsx`

```typescript
// Line 547-548 - Replace hardcoded calculation
// OLD:
const doorCount = width > 0.6 ? 2 : 1; // 0.6m = 60cm threshold

// NEW (need to load component_behavior):
const componentBehavior = useComponentBehavior(element.component_id);
const doorCount = componentBehavior?.door?.count ?? (width > 0.6 ? 2 : 1);
```

### Step 5: Testing

**Verify migration:**
- [ ] 2D elevation views show correct door count/style
- [ ] 3D views show correct door count
- [ ] Falls back correctly if component_behavior missing
- [ ] No visual changes (data moved, not changed)

## Rollback Plan

If issues arise, fallback chain ensures nothing breaks:
- Renderers still check `component_2d_renders` as fallback
- Can roll back SQL migration
- No code changes required to revert

## Timeline

- SQL migration: 15 minutes
- ComponentService update: 15 minutes
- 2D renderer update: 15 minutes
- 3D renderer update: 15 minutes
- Testing: 15 minutes
- **Total: ~1 hour**

## Success Criteria

✅ Door/drawer config in `components.component_behavior`
✅ 2D and 3D renderers read from component_behavior
✅ Fallback to component_2d_renders still works
✅ No visual changes to existing components
✅ Foundation ready for future customization (but not built yet)

---

**Note:** This does NOT add customization UI or per-instance config. That's in the backlog (see INTERCHANGEABLE_HARDWARE_FEATURE_SPEC.md).

This is just data consolidation - same pattern as default_z_position and plinth_height migrations.
