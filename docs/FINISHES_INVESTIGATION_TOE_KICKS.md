# Toe Kicks Investigation - Quick Finding

## Issue
Toe kicks are missing from the component sidebar despite existing in the database.

## Root Cause Found

**File**: `src/components/designer/CompactComponentSidebar.tsx` (lines 206-218)

The category label mapping is missing `'kitchen-toe-kick'`:

```typescript
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'base-cabinets': 'Base Cabinets',
    'wall-cabinets': 'Wall Cabinets',
    'wall-units': 'Wall Units',
    'appliances': 'Appliances',
    'counter-tops': 'Counter Tops',
    'end-panels': 'End Panels',
    'tall-units': 'Tall Units',
    'kitchen-larder': 'Larder Units',
    'sinks': 'Sinks & Taps',
    'accessories': 'Accessories'
    // ❌ MISSING: 'kitchen-toe-kick': 'Toe Kicks'
    // ❌ MISSING: 'kitchen-cornice': 'Cornice'
    // ❌ MISSING: 'kitchen-pelmet': 'Pelmet'
  };
  return labels[category] || category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
};
```

## Components in Database

From `supabase/migrations/20250912230000_complete_kitchen_components.sql`:

```sql
-- Toe kicks exist:
('toe-kick-standard', 'Standard Toe Kick', 'toe-kick', 60, 10, 15, '#FFFFFF',
 'kitchen-toe-kick', ARRAY['kitchen'], 'PanelLeft',
 'Standard toe kick for base units - 60cm x 10cm x 15cm'),

('toe-kick-corner', 'Corner Toe Kick', 'toe-kick', 90, 10, 15, '#FFFFFF',
 'kitchen-toe-kick', ARRAY['kitchen'], 'PanelLeft',
 'L-shaped toe kick for corner units - 90cm x 10cm x 15cm'),
```

## Fix Required

Add missing finishes categories to the label mapping:

```typescript
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'base-cabinets': 'Base Cabinets',
    'wall-cabinets': 'Wall Cabinets',
    'wall-units': 'Wall Units',
    'appliances': 'Appliances',
    'counter-tops': 'Counter Tops',
    'end-panels': 'End Panels',
    'tall-units': 'Tall Units',
    'kitchen-larder': 'Larder Units',
    'sinks': 'Sinks & Taps',
    'accessories': 'Accessories',
    // ✅ ADD THESE:
    'kitchen-toe-kick': 'Toe Kicks',
    'kitchen-cornice': 'Cornice',
    'kitchen-pelmet': 'Pelmet',
    'kitchen-wall-unit-end-panels': 'End Panels (Wall Units)'
  };
  return labels[category] || category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
};
```

## Expected Result

After adding the category mapping:
- Toe kicks will appear in sidebar under "Toe Kicks" category
- Other finishes (cornice, pelmet) will also become visible
- Components will be draggable to canvas

## Additional Investigation Needed

1. Check if toe kicks have 3D models (may need migration)
2. Check if ComponentIDMapper has toe-kick pattern (may need mapping)
3. Test positioning (may have underground positioning bug like other components)

## Quick Test Query

```sql
-- Check if toe kicks exist and have 3D models
SELECT
  c.component_id,
  c.name,
  c.category,
  cm.component_id as has_3d_model,
  COUNT(gp.id) as geometry_count
FROM components c
LEFT JOIN component_3d_models cm ON cm.component_id = c.component_id
LEFT JOIN geometry_parts gp ON gp.model_id = cm.id
WHERE c.category = 'kitchen-toe-kick'
GROUP BY c.component_id, c.name, c.category, cm.component_id;
```

## Status

- ✅ **Root cause identified**: Missing category label mapping in sidebar
- ⚠️ **Fix required**: Add category mapping (simple code change)
- ❓ **Unknown**: Whether toe kicks have 3D models or positioning issues

---

**Next Step**: Add category mapping and test if toe kicks appear in sidebar
