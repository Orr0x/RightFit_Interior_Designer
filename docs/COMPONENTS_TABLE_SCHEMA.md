# Components Table Schema - Live Database

**Generated:** 2025-10-12T21:04:12.617Z
**Database:** https://akfdezesupzuvukqiggn.supabase.co
**Table:** components

---

## Column Analysis

| Column Name | Type | Sample Value | Notes |
|-------------|------|--------------|-------|
| id | string | c773d487-cc86-4782-9df8-cfcf993c0813 | |
| created_at | string | 2025-10-08T18:02:52.04969+00:00 | |
| updated_at | string | 2025-10-08T18:02:52.04969+00:00 | |
| component_id | string | wardrobe-2door-100 | |
| name | string | Wardrobe 2-Door 100cm | |
| type | string | cabinet | |
| width | number | 100 | |
| depth | number | 60 | |
| height | number | 200 | |
| color | string | #8B4513 | |
| category | string | bedroom-storage | |
| room_types | array | [1 items] | |
| icon_name | string | Square | |
| description | string | Two door wardrobe 100cm | |
| version | string | 1.0.0 | |
| deprecated | boolean | false | |
| deprecation_reason | object | null | |
| replacement_component_id | object | null | |
| metadata | object | {...} | |
| tags | array | [0 items] | |
| mount_type | string | floor | |
| has_direction | boolean | true | |
| door_side | string | front | |
| default_z_position | number | 0 | |
| elevation_height | object | null | |
| corner_configuration | object | {...} | |
| component_behavior | object | {...} | |
| plinth_height | object | null | |

---

## Sample Component Data

```json
{
  "id": "c773d487-cc86-4782-9df8-cfcf993c0813",
  "created_at": "2025-10-08T18:02:52.04969+00:00",
  "updated_at": "2025-10-08T18:02:52.04969+00:00",
  "component_id": "wardrobe-2door-100",
  "name": "Wardrobe 2-Door 100cm",
  "type": "cabinet",
  "width": 100,
  "depth": 60,
  "height": 200,
  "color": "#8B4513",
  "category": "bedroom-storage",
  "room_types": [
    "bedroom"
  ],
  "icon_name": "Square",
  "description": "Two door wardrobe 100cm",
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
  "corner_configuration": {},
  "component_behavior": {},
  "plinth_height": null
}
```

## Component Statistics

**Total Components:** 194

### By Type

| Type | Count |
|------|-------|
| cabinet | 79 |
| sink | 22 |
| appliance | 16 |
| seating | 14 |
| door | 12 |
| counter-top | 9 |
| window | 7 |
| table | 6 |
| desk | 5 |
| bed | 4 |
| cornice | 4 |
| pelmet | 4 |
| sofa | 3 |
| end-panel | 3 |
| shower | 2 |
| mirror | 2 |
| toilet | 1 |
| bathtub | 1 |

### By Category

| Category | Count |
|----------|-------|
| sinks | 20 |
| base-cabinets | 15 |
| appliances | 11 |
| finishing | 11 |
| bedroom-storage | 10 |
| dining-room-furniture | 10 |
| bedroom-furniture | 8 |
| office-furniture | 8 |
| doors-internal | 8 |
| wall-cabinets | 7 |
| living-room-storage | 7 |
| dressing-room-storage | 7 |
| utility-storage | 7 |
| windows | 7 |
| counter-tops | 6 |
| office-storage | 6 |
| dressing-room-furniture | 6 |
| bathroom-vanities | 5 |
| dining-room-storage | 5 |
| utility-appliances | 5 |
| utility-fixtures | 5 |
| kitchen-larder | 5 |
| bathroom-fixtures | 4 |
| living-room-furniture | 4 |
| doors-external | 4 |
| bathroom-storage | 3 |

---

## Key Findings

### Migration Status

- **default_z_position**: ✅ Exists with data
- **elevation_height**: ⚠️ Exists but null
- **mount_type**: ✅ Exists with data
- **corner_configuration**: ✅ Exists with data
- **component_behavior**: ✅ Exists with data
- **plinth_height**: ⚠️ Exists but null
