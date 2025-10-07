# Component Tables Analysis Summary

## Overview
- **Analysis Date**: 2025-10-07T21:45:41.537Z
- **Tables Analyzed**: 8
- **Tables with Data**: 5
- **Empty Tables**: 3

## Table Analysis

| Table Name | Rows | Columns | Data Quality | Integration | Issues |
|------------|------|---------|--------------|-------------|---------|
| `components` | 168 | 27 | Good | FULLY_INTEGRATED | 10 |
| `component_materials` | 12 | 15 | Excellent | NOT_INTEGRATED | 0 |
| `component_hardware` | 12 | 5 | Excellent | NOT_INTEGRATED | 0 |
| `component_material_costs` | 12 | 11 | Excellent | NOT_INTEGRATED | 0 |
| `component_total_costs` | 4 | 5 | Excellent | NOT_INTEGRATED | 0 |
| `component_metadata` | 0 | 0 | N/A | NOT_INTEGRATED | 0 |
| `component_room_types` | 0 | 0 | N/A | NOT_INTEGRATED | 0 |
| `component_material_finishes` | 0 | 0 | N/A | NOT_INTEGRATED | 0 |

## Detailed Analysis

### `components` (168 rows)

**Integration Status**: FULLY_INTEGRATED
**Data Quality**: Good
**Columns**: id, created_at, updated_at, component_id, name, type, width, depth, height, color, category, room_types, icon_name, description, version, deprecated, deprecation_reason, replacement_component_id, metadata, tags, mount_type, has_direction, door_side, default_z_position, elevation_height, corner_configuration, component_behavior

**Data Quality Issues** (10):
- Row 1: component_id has invalid UUID format
- Row 1: door_side has invalid UUID format
- Row 2: component_id has invalid UUID format
- Row 2: door_side has invalid UUID format
- Row 3: component_id has invalid UUID format
- Row 3: door_side has invalid UUID format
- Row 4: component_id has invalid UUID format
- Row 4: door_side has invalid UUID format
- Row 5: component_id has invalid UUID format
- Row 5: door_side has invalid UUID format

**Sample Data**:
```json
{
  "id": "2e1cf538-b1fa-4ebf-b79a-6eb055072664",
  "created_at": "2025-09-21T16:36:54.974767+00:00",
  "updated_at": "2025-09-21T20:59:32.561221+00:00",
  "component_id": "l-shaped-test-cabinet",
  "name": "L-Shaped Test Cabinet",
  "type": "cabinet",
  "width": 90,
  "depth": 90,
  "height": 90,
  "color": "#FF6B35",
  "category": "base-units",
  "room_types": [
    "kitchen"
  ],
  "icon_name": "Square",
  "description": "Test component with proper L-shaped geometry (2 x 90cm legs)",
  "version": "1.0.0",
  "deprecated": false,
  "deprecation_reason": null,
  "replacement_component_id": null,
  "metadata": {},
  "tags": [],
  "mount_type": "floor",
  "has_direction": true,
  "door_side": "front",
  "default_z_position": 0,
  "elevation_height": null,
  "corner_configuration": {
    "is_corner": true,
    "door_width": 30,
    "side_width": 60,
    "auto_rotate": true,
    "corner_type": "L-shaped"
  },
  "component_behavior": {}
}
```

### `component_materials` (12 rows)

**Integration Status**: NOT_INTEGRATED
**Data Quality**: Excellent
**Columns**: id, created_at, component_id, material_id, part_name, part_description, quantity, unit, waste_factor, cutting_complexity, requires_edge_banding, grain_direction, is_primary_material, is_visible, is_structural

**Sample Data**:
```json
{
  "id": "29edd4bc-2580-4d6d-a669-3693c0413f2f",
  "created_at": "2025-09-14T01:41:27.502608+00:00",
  "component_id": "c9c7391c-345a-4b01-99b6-fdc7903739fa",
  "material_id": "b2667b36-96d9-4a56-9299-f215354f30b9",
  "part_name": "body",
  "part_description": "Main cabinet carcase",
  "quantity": 2.5,
  "unit": "sqm",
  "waste_factor": 1.15,
  "cutting_complexity": "simple",
  "requires_edge_banding": false,
  "grain_direction": null,
  "is_primary_material": true,
  "is_visible": true,
  "is_structural": true
}
```

### `component_hardware` (12 rows)

**Integration Status**: NOT_INTEGRATED
**Data Quality**: Excellent
**Columns**: id, component_id, hardware_id, quantity_per_component, placement_notes

**Sample Data**:
```json
{
  "id": "05cfdcad-852f-4551-b8a5-9d601093a625",
  "component_id": "c9c7391c-345a-4b01-99b6-fdc7903739fa",
  "hardware_id": "7c4fa947-df21-46c9-8546-1e575af088cc",
  "quantity_per_component": 1,
  "placement_notes": "Center of door, 96mm from edge"
}
```

### `component_material_costs` (12 rows)

**Integration Status**: NOT_INTEGRATED
**Data Quality**: Excellent
**Columns**: component_id, component_name, part_name, material_name, material_category, quantity, unit, waste_factor, quantity_with_waste, unit_cost_pence, total_cost_pence

**Sample Data**:
```json
{
  "component_id": "c9c7391c-345a-4b01-99b6-fdc7903739fa",
  "component_name": "DB-2 Door Wardrobe",
  "part_name": "door",
  "material_name": "Oak Veneer 18mm",
  "material_category": "wood",
  "quantity": 0.8,
  "unit": "sqm",
  "waste_factor": 1.1,
  "quantity_with_waste": 0.88,
  "unit_cost_pence": 4500,
  "total_cost_pence": 3960
}
```

### `component_total_costs` (4 rows)

**Integration Status**: NOT_INTEGRATED
**Data Quality**: Excellent
**Columns**: component_id, component_name, material_count, total_material_cost_pence, total_material_cost_gbp

**Sample Data**:
```json
{
  "component_id": "6c9d4c3a-1e84-4cfb-8c8a-eaf76ba43c3b",
  "component_name": "DB-3 Door Wardrobe",
  "material_count": 3,
  "total_material_cost_pence": 10521,
  "total_material_cost_gbp": 105.21
}
```

### `component_metadata` (0 rows)

**Integration Status**: NOT_INTEGRATED
**Data Quality**: N/A
**Columns**: Unknown

### `component_room_types` (0 rows)

**Integration Status**: NOT_INTEGRATED
**Data Quality**: N/A
**Columns**: Unknown

### `component_material_finishes` (0 rows)

**Integration Status**: NOT_INTEGRATED
**Data Quality**: N/A
**Columns**: Unknown


## Key Findings

### Tables with Data
- **components**: 168 rows, Good quality
- **component_materials**: 12 rows, Excellent quality
- **component_hardware**: 12 rows, Excellent quality
- **component_material_costs**: 12 rows, Excellent quality
- **component_total_costs**: 4 rows, Excellent quality

### Empty Tables
- **component_metadata**: NOT_INTEGRATED
- **component_room_types**: NOT_INTEGRATED
- **component_material_finishes**: NOT_INTEGRATED

### Data Quality Issues
- **components**: 10 issues

## Recommendations

### Immediate Actions
1. **Fix data quality issues** in tables with problems
2. **Integrate unused tables** with data:
   - component_materials (12 rows)
   - component_hardware (12 rows)
   - component_material_costs (12 rows)
   - component_total_costs (4 rows)
3. **Populate empty tables** needed for functionality:
   - component_metadata
   - component_room_types
   - component_material_finishes

### Integration Priority
1. **component_materials** - Material relationships (12 rows)
2. **component_hardware** - Hardware relationships (12 rows)
3. **component_material_costs** - Cost calculations (12 rows)
4. **component_total_costs** - Total costs (4 rows)
5. **component_room_types** - Room relationships (populate)
6. **component_metadata** - Extended metadata (populate)
7. **component_material_finishes** - Finish relationships (populate)

