# Model 3D Tables SQL Queries

## 🎯 **Complete 3D Model System Data Extraction**

### **1. All 3D Model Tables (Empty - For Future Use)**
```sql
-- Get all 3D model tables with their structure
SELECT 
    'model_3d' as table_name,
    COUNT(*) as row_count,
    'Core 3D model definitions' as purpose
FROM model_3d

UNION ALL

SELECT 
    'model_3d_config' as table_name,
    COUNT(*) as row_count,
    '3D rendering configuration' as purpose
FROM model_3d_config

UNION ALL

SELECT 
    'model_3d_patterns' as table_name,
    COUNT(*) as row_count,
    '3D model pattern matching' as purpose
FROM model_3d_patterns

UNION ALL

SELECT 
    'model_3d_variants' as table_name,
    COUNT(*) as row_count,
    '3D model variants' as purpose
FROM model_3d_variants

UNION ALL

SELECT 
    'appliance_3d_types' as table_name,
    COUNT(*) as row_count,
    'Appliance-specific 3D types' as purpose
FROM appliance_3d_types

UNION ALL

SELECT 
    'furniture_3d_models' as table_name,
    COUNT(*) as row_count,
    'Furniture 3D models' as purpose
FROM furniture_3d_models;
```

### **2. Model 3D Table Structure (When Populated)**
```sql
-- Get model_3d table structure and sample data
SELECT 
    id,
    component_id,
    model_type,
    geometry_type,
    primary_color,
    primary_material,
    secondary_color,
    secondary_material,
    has_doors,
    has_drawers,
    has_handles,
    has_legs,
    wall_mounted,
    default_y_position,
    detail_level,
    special_features,
    version,
    deprecated,
    created_at,
    updated_at
FROM model_3d
ORDER BY model_type, created_at;
```

### **3. Model 3D Config Table Structure (When Populated)**
```sql
-- Get model_3d_config table structure and sample data
SELECT 
    id,
    component_id,
    detail_level,
    primary_color,
    primary_material,
    secondary_color,
    metalness,
    roughness,
    transparency,
    enable_door_detail,
    enable_detailed_handles,
    enable_wood_grain_texture,
    enable_realistic_lighting,
    use_lod,
    door_gap,
    handle_style,
    metal_finish,
    wood_finish,
    corner_door_style,
    corner_interior_shelving,
    plinth_height,
    version,
    deprecated,
    created_at,
    updated_at
FROM model_3d_config
ORDER BY component_id, created_at;
```

### **4. Appliance 3D Types Table Structure (When Populated)**
```sql
-- Get appliance_3d_types table structure and sample data
SELECT 
    id,
    model_3d_id,
    appliance_category,
    energy_rating,
    has_controls,
    has_display,
    has_glass_door,
    default_colors
FROM appliance_3d_types
ORDER BY appliance_category;
```

### **5. Furniture 3D Models Table Structure (When Populated)**
```sql
-- Get furniture_3d_models table structure and sample data
SELECT 
    id,
    furniture_id,
    model_3d_id,
    name,
    type,
    category,
    description,
    width,
    depth,
    height,
    color,
    icon_name,
    room_types,
    version,
    deprecated,
    created_at
FROM furniture_3d_models
ORDER BY category, name;
```

### **6. Model 3D Patterns Table Structure (When Populated)**
```sql
-- Get model_3d_patterns table structure and sample data
SELECT 
    id,
    name,
    description,
    element_type,
    priority,
    active,
    id_includes,
    style_includes,
    config_overrides,
    created_at
FROM model_3d_patterns
ORDER BY priority DESC, name;
```

### **7. Model 3D Variants Table Structure (When Populated)**
```sql
-- Get model_3d_variants table structure and sample data
SELECT 
    id,
    model_3d_id,
    variant_name,
    variant_description,
    variant_config,
    is_default,
    created_at,
    updated_at
FROM model_3d_variants
ORDER BY model_3d_id, is_default DESC;
```

### **8. Components with 3D Models (When Integrated)**
```sql
-- Get components with their 3D models
SELECT 
    c.id as component_id,
    c.name as component_name,
    c.type as component_type,
    c.category as component_category,
    m.id as model_3d_id,
    m.model_type,
    m.geometry_type,
    m.primary_color,
    m.primary_material,
    m.has_doors,
    m.has_drawers,
    m.detail_level,
    mc.detail_level as config_detail_level,
    mc.enable_door_detail,
    mc.enable_detailed_handles,
    mc.enable_wood_grain_texture
FROM components c
LEFT JOIN model_3d m ON c.id = m.component_id
LEFT JOIN model_3d_config mc ON c.id = mc.component_id
WHERE c.deprecated = false
ORDER BY c.category, c.name;
```

### **9. Appliance Components with 3D Types (When Integrated)**
```sql
-- Get appliance components with their 3D types
SELECT 
    c.id as component_id,
    c.name as component_name,
    c.type as component_type,
    m.id as model_3d_id,
    m.model_type,
    a.appliance_category,
    a.energy_rating,
    a.has_controls,
    a.has_display,
    a.has_glass_door,
    a.default_colors
FROM components c
LEFT JOIN model_3d m ON c.id = m.component_id
LEFT JOIN appliance_3d_types a ON m.id = a.model_3d_id
WHERE c.deprecated = false
  AND c.type = 'appliance'
ORDER BY a.appliance_category, c.name;
```

### **10. 3D Model Statistics (When Populated)**
```sql
-- Get 3D model system statistics
SELECT 
    'Total 3D Models' as metric,
    COUNT(*)::text as value
FROM model_3d

UNION ALL

SELECT 
    'Active 3D Models',
    COUNT(*)::text
FROM model_3d
WHERE deprecated = false

UNION ALL

SELECT 
    '3D Configurations',
    COUNT(*)::text
FROM model_3d_config

UNION ALL

SELECT 
    'Appliance 3D Types',
    COUNT(*)::text
FROM appliance_3d_types

UNION ALL

SELECT 
    'Furniture 3D Models',
    COUNT(*)::text
FROM furniture_3d_models

UNION ALL

SELECT 
    '3D Model Patterns',
    COUNT(*)::text
FROM model_3d_patterns

UNION ALL

SELECT 
    '3D Model Variants',
    COUNT(*)::text
FROM model_3d_variants

UNION ALL

SELECT 
    'Components with 3D Models',
    COUNT(*)::text
FROM components c
INNER JOIN model_3d m ON c.id = m.component_id
WHERE c.deprecated = false;
```

### **11. 3D Model Types Distribution (When Populated)**
```sql
-- Get 3D model types distribution
SELECT 
    model_type,
    COUNT(*) as model_count,
    COUNT(CASE WHEN deprecated = false THEN 1 END) as active_count
FROM model_3d
GROUP BY model_type
ORDER BY model_count DESC;
```

### **12. 3D Model Materials Distribution (When Populated)**
```sql
-- Get 3D model materials distribution
SELECT 
    primary_material,
    COUNT(*) as model_count,
    COUNT(CASE WHEN deprecated = false THEN 1 END) as active_count
FROM model_3d
GROUP BY primary_material
ORDER BY model_count DESC;
```

### **13. 3D Model Detail Levels (When Populated)**
```sql
-- Get 3D model detail levels distribution
SELECT 
    detail_level,
    COUNT(*) as model_count,
    COUNT(CASE WHEN deprecated = false THEN 1 END) as active_count
FROM model_3d
GROUP BY detail_level
ORDER BY detail_level;
```

### **14. 3D Model Features Analysis (When Populated)**
```sql
-- Get 3D model features analysis
SELECT 
    'Models with Doors' as feature,
    COUNT(*)::text as count
FROM model_3d
WHERE has_doors = true

UNION ALL

SELECT 
    'Models with Drawers',
    COUNT(*)::text
FROM model_3d
WHERE has_drawers = true

UNION ALL

SELECT 
    'Models with Handles',
    COUNT(*)::text
FROM model_3d
WHERE has_handles = true

UNION ALL

SELECT 
    'Models with Legs',
    COUNT(*)::text
FROM model_3d
WHERE has_legs = true

UNION ALL

SELECT 
    'Wall Mounted Models',
    COUNT(*)::text
FROM model_3d
WHERE wall_mounted = true;
```

### **15. 3D Model Configuration Analysis (When Populated)**
```sql
-- Get 3D model configuration analysis
SELECT 
    'High Detail Models' as config_type,
    COUNT(*)::text as count
FROM model_3d_config
WHERE detail_level >= 4

UNION ALL

SELECT 
    'Models with Door Detail',
    COUNT(*)::text
FROM model_3d_config
WHERE enable_door_detail = true

UNION ALL

SELECT 
    'Models with Handle Detail',
    COUNT(*)::text
FROM model_3d_config
WHERE enable_detailed_handles = true

UNION ALL

SELECT 
    'Models with Wood Grain',
    COUNT(*)::text
FROM model_3d_config
WHERE enable_wood_grain_texture = true

UNION ALL

SELECT 
    'Models with Realistic Lighting',
    COUNT(*)::text
FROM model_3d_config
WHERE enable_realistic_lighting = true

UNION ALL

SELECT 
    'Models with LOD',
    COUNT(*)::text
FROM model_3d_config
WHERE use_lod = true;
```

### **16. Appliance Categories Distribution (When Populated)**
```sql
-- Get appliance categories distribution
SELECT 
    appliance_category,
    COUNT(*) as appliance_count,
    COUNT(CASE WHEN energy_rating IS NOT NULL THEN 1 END) as with_energy_rating,
    COUNT(CASE WHEN has_controls = true THEN 1 END) as with_controls,
    COUNT(CASE WHEN has_display = true THEN 1 END) as with_display,
    COUNT(CASE WHEN has_glass_door = true THEN 1 END) as with_glass_door
FROM appliance_3d_types
GROUP BY appliance_category
ORDER BY appliance_count DESC;
```

### **17. Furniture Categories Distribution (When Populated)**
```sql
-- Get furniture categories distribution
SELECT 
    category,
    COUNT(*) as furniture_count,
    COUNT(CASE WHEN deprecated = false THEN 1 END) as active_count,
    AVG(width) as avg_width,
    AVG(depth) as avg_depth,
    AVG(height) as avg_height
FROM furniture_3d_models
GROUP BY category
ORDER BY furniture_count DESC;
```

### **18. 3D Model Patterns Analysis (When Populated)**
```sql
-- Get 3D model patterns analysis
SELECT 
    name,
    description,
    element_type,
    priority,
    active,
    array_length(id_includes, 1) as id_patterns_count,
    array_length(style_includes, 1) as style_patterns_count
FROM model_3d_patterns
ORDER BY priority DESC, name;
```

### **19. 3D Model Variants Analysis (When Populated)**
```sql
-- Get 3D model variants analysis
SELECT 
    m.model_type,
    COUNT(v.id) as variant_count,
    COUNT(CASE WHEN v.is_default = true THEN 1 END) as default_variants
FROM model_3d m
LEFT JOIN model_3d_variants v ON m.id = v.model_3d_id
GROUP BY m.model_type
ORDER BY variant_count DESC;
```

### **20. Export 3D Model System to CSV (When Populated)**
```sql
-- Export 3D model system to CSV
COPY (
    SELECT 
        c.id as component_id,
        c.name as component_name,
        c.type as component_type,
        c.category as component_category,
        m.id as model_3d_id,
        m.model_type,
        m.geometry_type,
        m.primary_color,
        m.primary_material,
        m.secondary_color,
        m.secondary_material,
        m.has_doors,
        m.has_drawers,
        m.has_handles,
        m.has_legs,
        m.wall_mounted,
        m.detail_level,
        m.version,
        m.deprecated,
        mc.detail_level as config_detail_level,
        mc.enable_door_detail,
        mc.enable_detailed_handles,
        mc.enable_wood_grain_texture,
        mc.enable_realistic_lighting,
        mc.use_lod,
        a.appliance_category,
        a.energy_rating,
        a.has_controls,
        a.has_display,
        a.has_glass_door
    FROM components c
    LEFT JOIN model_3d m ON c.id = m.component_id
    LEFT JOIN model_3d_config mc ON c.id = mc.component_id
    LEFT JOIN appliance_3d_types a ON m.id = a.model_3d_id
    WHERE c.deprecated = false
    ORDER BY c.category, c.name
) TO '/tmp/3d_model_system_export.csv' WITH CSV HEADER;
```

## 🔧 **Usage Instructions**

### **For Current Status (All Tables Empty)**
- Use query 1 to confirm all tables are empty
- Use queries 2-7 to understand table structures
- Use query 10 to get current statistics (all zeros)

### **For Future Implementation (When Populated)**
- Use queries 8-9 for component integration analysis
- Use queries 11-19 for comprehensive data analysis
- Use query 20 for data export

### **For Development Planning**
- Use query 8 to plan component-3D model integration
- Use query 9 to plan appliance-specific features
- Use query 10 to track implementation progress

## 📊 **Expected Results (When Populated)**

Based on the 168 components in the components table:
- **`model_3d`**: 168 rows (one per component)
- **`model_3d_config`**: 168 rows (one per component)
- **`appliance_3d_types`**: ~20-30 rows (appliance components)
- **`furniture_3d_models`**: ~50-100 rows (furniture items)
- **`model_3d_patterns`**: ~10-15 rows (common patterns)
- **`model_3d_variants`**: ~50-100 rows (model variations)

## ⚠️ **Current Status Notes**

- **All tables are empty** - No data to query
- **Schemas are complete** - Ready for data population
- **Relationships are defined** - Foreign keys properly set up
- **App integration pending** - Not yet connected to application
- **Future functionality** - Represents planned 3D model system
