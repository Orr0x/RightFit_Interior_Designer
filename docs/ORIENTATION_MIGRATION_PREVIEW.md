# Orientation Migration Preview

## What This Migration Does

**Purpose:** Simplify rotation logic by creating orientation variants for non-square components.

**Strategy:** Only non-square components (width ≠ depth) need orientation variants.

## Components That WILL Get Variants

Examples of components that will be duplicated:
- Base Cabinet 100cm (100×60) → **Base Cabinet 100cm (N/S)** + **Base Cabinet 100cm (E/W)** (60×100)
- Base Cabinet 80cm (80×60) → **Base Cabinet 80cm (N/S)** + **Base Cabinet 80cm (E/W)** (60×80)
- Pan Drawers 30cm (30×60) → **Pan Drawers 30cm (N/S)** + **Pan Drawers 30cm (E/W)** (60×30)
- Wall Cabinet 100cm (100×60) → **Wall Cabinet 100cm (N/S)** + **Wall Cabinet 100cm (E/W)** (60×100)

## Components That WON'T Get Variants

Square or orientation-neutral components stay as-is:
- Corner Base Cabinet 60cm (60×60) - square ✅
- Corner Base Cabinet 90cm (90×90) - square ✅
- Base Cabinet 60cm (60×60) - square ✅
- Wall Cabinet 40cm (40×40) - square ✅
- Sinks, appliances - orientation neutral ✅

## Migration Steps

1. **Add `-ns` suffix to existing non-square components**
   - `base-cabinet-100` → `base-cabinet-100-ns`
   - Name: "Base Cabinet 100cm" → "Base Cabinet 100cm (N/S)"
   - Dimensions stay: width=100, depth=60

2. **Create E/W variants with swapped dimensions**
   - Create `base-cabinet-100-ew`
   - Name: "Base Cabinet 100cm (E/W)"
   - Dimensions swapped: width=60, depth=100

## Expected Results

**Before Migration:**
- ~194 total components
- Non-square components: ~40-50
- No orientation suffixes

**After Migration:**
- ~240-250 total components
- Each non-square component now has 2 variants
- All have clear orientation labels

## Benefits

✅ **No rotation field needed** - just select the right orientation variant
✅ **Width/depth always correct** - no swapping logic
✅ **Simple bounding boxes** - always axis-aligned rectangles
✅ **WYSIWYG drag preview** - preview matches dropped orientation
✅ **Cleaner code** - no rotation math in rendering

## User Experience

**Sidebar will show:**
```
📦 Base Cabinets
  ├─ Base Cabinet 60cm (square - no orientation)
  ├─ Base Cabinet 100cm (N/S)
  ├─ Base Cabinet 100cm (E/W)
  ├─ Base Cabinet 80cm (N/S)
  └─ Base Cabinet 80cm (E/W)
```

**Drag & Drop:**
- User drags "Base Cabinet 100cm (N/S)" → drops with 100cm along X-axis
- User drags "Base Cabinet 100cm (E/W)" → drops with 100cm along Y-axis
- No rotation button needed!

## Query to Preview Components

```sql
-- Find all non-square components that will get variants
SELECT
  component_id,
  name,
  width,
  depth,
  height,
  category
FROM components
WHERE width != depth
AND category IN ('base-cabinets', 'wall-cabinets', 'drawer-units', 'tall-units')
ORDER BY category, width;
```

## Rollback Plan

If needed, we can roll back by:
1. Delete all components with `-ew` suffix
2. Remove `-ns` suffix from remaining components
3. Restore original names
