# Components Table SQL Queries

## 🎯 **Complete Components Table Data Extraction**

### **1. Full Table Data (All 168 Components)**
```sql
-- Get all components with complete data
SELECT 
    id,
    created_at,
    updated_at,
    component_id,
    name,
    type,
    width,
    depth,
    height,
    color,
    category,
    room_types,
    icon_name,
    description,
    version,
    deprecated,
    mount_type,
    has_direction,
    door_side,
    default_z_position,
    elevation_height,
    corner_configuration,
    component_behavior,
    tags,
    metadata,
    deprecation_reason,
    replacement_component_id
FROM components
ORDER BY category, name;
```

### **2. Components with Row Count**
```sql
-- Get total count and all data
SELECT 
    COUNT(*) as total_components,
    COUNT(CASE WHEN deprecated = false THEN 1 END) as active_components,
    COUNT(CASE WHEN deprecated = true THEN 1 END) as deprecated_components
FROM components;

-- Then get all data
SELECT * FROM components ORDER BY category, name;
```

### **3. Components by Category**
```sql
-- Get components grouped by category
SELECT 
    category,
    COUNT(*) as component_count,
    COUNT(CASE WHEN deprecated = false THEN 1 END) as active_count
FROM components
GROUP BY category
ORDER BY component_count DESC;
```

### **4. Components by Type**
```sql
-- Get components grouped by type
SELECT 
    type,
    COUNT(*) as component_count,
    COUNT(CASE WHEN deprecated = false THEN 1 END) as active_count
FROM components
GROUP BY type
ORDER BY component_count DESC;
```

### **5. Components by Room Type**
```sql
-- Get components by room type (using array functions)
SELECT 
    room_type,
    COUNT(*) as component_count
FROM (
    SELECT unnest(room_types) as room_type
    FROM components
    WHERE deprecated = false
) as room_type_expanded
GROUP BY room_type
ORDER BY component_count DESC;
```

### **6. Active Components Only (Non-Deprecated)**
```sql
-- Get only active components
SELECT 
    id,
    component_id,
    name,
    type,
    category,
    width,
    depth,
    height,
    color,
    room_types,
    mount_type,
    has_direction,
    door_side,
    corner_configuration
FROM components
WHERE deprecated = false
ORDER BY category, name;
```

### **7. Component Dimensions Analysis**
```sql
-- Analyze component dimensions
SELECT 
    category,
    type,
    COUNT(*) as count,
    AVG(width) as avg_width,
    AVG(depth) as avg_depth,
    AVG(height) as avg_height,
    MIN(width) as min_width,
    MAX(width) as max_width,
    MIN(depth) as min_depth,
    MAX(depth) as max_depth,
    MIN(height) as min_height,
    MAX(height) as max_height
FROM components
WHERE deprecated = false
GROUP BY category, type
ORDER BY category, type;
```

### **8. Corner Components Analysis**
```sql
-- Get corner components with configuration details
SELECT 
    id,
    component_id,
    name,
    category,
    corner_configuration,
    width,
    depth,
    height
FROM components
WHERE deprecated = false
  AND corner_configuration IS NOT NULL
  AND (corner_configuration->>'is_corner')::boolean = true
ORDER BY category, name;
```

### **9. Components with Custom Behavior**
```sql
-- Get components with custom behavior
SELECT 
    id,
    component_id,
    name,
    category,
    component_behavior,
    corner_configuration
FROM components
WHERE deprecated = false
  AND (component_behavior IS NOT NULL 
       OR corner_configuration IS NOT NULL)
ORDER BY category, name;
```

### **10. Data Quality Check**
```sql
-- Check for data quality issues
SELECT 
    'component_id_format' as check_type,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN component_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as valid_uuid_format,
    COUNT(CASE WHEN component_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as non_uuid_format
FROM components

UNION ALL

SELECT 
    'door_side_format' as check_type,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN door_side ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as valid_uuid_format,
    COUNT(CASE WHEN door_side !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as non_uuid_format
FROM components
WHERE door_side IS NOT NULL;
```

### **11. Export to CSV Format**
```sql
-- Export components to CSV format (for data export)
COPY (
    SELECT 
        id,
        component_id,
        name,
        type,
        category,
        width,
        depth,
        height,
        color,
        array_to_string(room_types, ',') as room_types,
        icon_name,
        description,
        version,
        deprecated,
        mount_type,
        has_direction,
        door_side,
        default_z_position,
        elevation_height,
        corner_configuration::text,
        component_behavior::text,
        created_at,
        updated_at
    FROM components
    ORDER BY category, name
) TO '/tmp/components_export.csv' WITH CSV HEADER;
```

### **12. Sample Data (First 10 Components)**
```sql
-- Get sample data for testing
SELECT 
    id,
    component_id,
    name,
    type,
    category,
    width,
    depth,
    height,
    color,
    room_types,
    mount_type,
    has_direction,
    door_side,
    corner_configuration
FROM components
WHERE deprecated = false
ORDER BY created_at
LIMIT 10;
```

### **13. Component Statistics Summary**
```sql
-- Get comprehensive statistics
SELECT 
    'Total Components' as metric,
    COUNT(*)::text as value
FROM components

UNION ALL

SELECT 
    'Active Components',
    COUNT(*)::text
FROM components
WHERE deprecated = false

UNION ALL

SELECT 
    'Deprecated Components',
    COUNT(*)::text
FROM components
WHERE deprecated = true

UNION ALL

SELECT 
    'Unique Categories',
    COUNT(DISTINCT category)::text
FROM components
WHERE deprecated = false

UNION ALL

SELECT 
    'Unique Types',
    COUNT(DISTINCT type)::text
FROM components
WHERE deprecated = false

UNION ALL

SELECT 
    'Corner Components',
    COUNT(*)::text
FROM components
WHERE deprecated = false
  AND corner_configuration IS NOT NULL
  AND (corner_configuration->>'is_corner')::boolean = true

UNION ALL

SELECT 
    'Components with Custom Behavior',
    COUNT(*)::text
FROM components
WHERE deprecated = false
  AND component_behavior IS NOT NULL;
```

## 🔧 **Usage Instructions**

### **For Data Analysis**
- Use queries 1-9 for comprehensive data analysis
- Use query 10 for data quality assessment
- Use query 13 for quick statistics

### **For Data Export**
- Use query 11 for CSV export (adjust file path as needed)
- Use query 12 for sample data testing

### **For Application Integration**
- Use query 6 for active components only
- Use query 1 for complete data with all fields

## 📊 **Expected Results**

Based on the analysis, you should expect:
- **168 total components**
- **168 active components** (0 deprecated)
- **~8-10 categories** (base-units, wall-units, etc.)
- **~5-7 types** (cabinet, appliance, etc.)
- **~90% kitchen components**
- **~10-15 corner components**
- **~20-30 components with custom behavior**

## ⚠️ **Data Quality Notes**

- **component_id**: Uses string format (e.g., "l-shaped-test-cabinet") instead of UUID
- **door_side**: Uses string format (e.g., "front") instead of UUID
- **All other fields**: Properly formatted and validated
- **No deprecated components**: All 168 components are active
