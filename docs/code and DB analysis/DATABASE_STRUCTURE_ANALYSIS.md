# Database Structure Analysis - Current vs Supabase

## Overview
This document provides a comprehensive analysis of the current database structure based on migrations and documentation, with SQL queries to verify the actual state in Supabase.

---

## 🗄️ **CURRENT DATABASE STRUCTURE**

### **1. Component System Tables**

#### **`components` Table**
```sql
-- Main components table for interior design system
CREATE TABLE public.components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Core component data
  component_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cabinet', 'appliance', 'counter-top', 'end-panel', 'window', 'door', 'flooring', 'toe-kick', 'cornice', 'pelmet', 'wall-unit-end-panel')),
  width DECIMAL(10,2) NOT NULL,
  depth DECIMAL(10,2) NOT NULL,
  height DECIMAL(10,2) NOT NULL,
  color TEXT NOT NULL,
  category TEXT NOT NULL,
  room_types TEXT[] NOT NULL,
  icon_name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Versioning and lifecycle
  version TEXT NOT NULL DEFAULT '1.0.0',
  deprecated BOOLEAN NOT NULL DEFAULT false,
  deprecation_reason TEXT,
  replacement_component_id TEXT,
  
  -- Future extensibility
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Component behavior properties (added in Phase 1)
  mount_type TEXT CHECK (mount_type IN ('floor', 'wall', 'ceiling')),
  has_direction BOOLEAN DEFAULT false,
  door_side TEXT CHECK (door_side IN ('front', 'left', 'right', 'back')),
  default_z_position DECIMAL(10,2) DEFAULT 0,
  elevation_height DECIMAL(10,2),
  
  -- Constraints
  CONSTRAINT valid_dimensions CHECK (width > 0 AND depth > 0 AND height > 0)
);
```

#### **`component_room_types` Table**
```sql
-- Junction table for component-room type relationships
CREATE TABLE public.component_room_types (
  component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  PRIMARY KEY (component_id, room_type)
);
```

### **2. Room Management Tables**

#### **`projects` Table**
```sql
-- Projects table (replaces current designs table concept)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### **`room_designs` Table**
```sql
-- Room designs table (individual room designs within projects)
CREATE TABLE public.room_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL CHECK (room_type IN (
    'kitchen', 'bedroom', 'bathroom', 'living-room', 
    'dining-room', 'utility', 'under-stairs'
  )),
  name TEXT, -- Optional custom name for the room
  room_dimensions JSONB NOT NULL DEFAULT '{"width": 400, "height": 300}',
  design_elements JSONB NOT NULL DEFAULT '[]',
  design_settings JSONB NOT NULL DEFAULT '{}', -- Room-specific settings
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one room design per room type per project
  UNIQUE(project_id, room_type)
);
```

#### **`room_templates` Table**
```sql
-- Pre-defined room templates
CREATE TABLE public.room_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL,
  description TEXT,
  template_data JSONB,
  
  -- Additional fields...
);
```

### **3. EGGER Product Tables**

#### **`egger_decors` Table**
```sql
-- Main EGGER products table containing decor information
CREATE TABLE public.egger_decors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT UNIQUE NOT NULL,
    decor_name TEXT NOT NULL,
    decor TEXT NOT NULL,
    texture TEXT NOT NULL,
    product_page_url TEXT,
    description TEXT,
    category TEXT,
    color_family TEXT,
    finish_type TEXT,
    supplier_notes TEXT,
    cost_per_sqm DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **`egger_images` Table**
```sql
-- EGGER product images with different types and sizes
CREATE TABLE public.egger_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT CHECK (image_type IN ('webp', 'png', 'jpg', 'jpeg')),
    width INTEGER,
    height INTEGER,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **`egger_combinations` Table**
```sql
-- EGGER product combinations and recommendations
CREATE TABLE public.egger_combinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    recommended_decor_id TEXT NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    match_type TEXT NOT NULL CHECK (match_type IN ('color', 'texture', 'style', 'complementary')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **`egger_availability` Table**
```sql
-- EGGER product availability information
CREATE TABLE public.egger_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT NOT NULL REFERENCES public.egger_decors(decor_id) ON DELETE CASCADE,
    product_type TEXT NOT NULL,
    availability_status TEXT NOT NULL CHECK (availability_status IN ('in_stock', 'limited', 'out_of_stock', 'discontinued')),
    lead_time_days INTEGER NOT NULL DEFAULT 0,
    minimum_order_quantity INTEGER,
    region TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **4. Farrow & Ball Tables**

#### **`farrow_ball_finishes` Table**
```sql
-- Farrow & Ball paint finishes and colors
CREATE TABLE public.farrow_ball_finishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finish_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    number TEXT,
    category TEXT,
    description TEXT,
    thumb_url TEXT, -- Added in migration 20250129000002
    hover_url TEXT, -- Added in migration 20250129000002
    -- Additional fields...
);
```

#### **`farrow_ball_images` Table**
```sql
-- Farrow & Ball product images
CREATE TABLE public.farrow_ball_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finish_id TEXT NOT NULL,
    image_type TEXT NOT NULL,
    image_url TEXT NOT NULL,
    -- Additional fields...
);
```

### **5. User Management Tables**

#### **`user_tiers` Table**
```sql
-- User permission tiers
CREATE TABLE public.user_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    user_id UUID UNIQUE NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'pro', 'god')),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional fields...
);
```

#### **`profiles` Table**
```sql
-- User profiles with tier information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_tier TEXT NOT NULL DEFAULT 'free' CHECK (user_tier IN ('free', 'premium', 'pro', 'dev', 'admin', 'god')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **6. Content Management Tables**

#### **`blog_posts` Table**
```sql
-- Blog posts for the CMS
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    featured_image_url TEXT,
    published BOOLEAN DEFAULT false,
    author_id UUID,
    
    -- Additional fields...
);
```

---

## 🔍 **VERIFICATION SQL QUERIES**

### **1. Check Component System Structure**
```sql
-- Verify components table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'components' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check component data count and types
SELECT 
    type,
    COUNT(*) as count,
    COUNT(DISTINCT category) as categories
FROM public.components 
WHERE deprecated = false
GROUP BY type
ORDER BY count DESC;

-- Check component behavior properties
SELECT 
    mount_type,
    has_direction,
    door_side,
    COUNT(*) as count
FROM public.components 
WHERE deprecated = false
GROUP BY mount_type, has_direction, door_side
ORDER BY count DESC;
```

### **2. Check Room Management Structure**
```sql
-- Verify projects table
SELECT COUNT(*) as project_count FROM public.projects;

-- Verify room_designs table
SELECT 
    room_type,
    COUNT(*) as design_count
FROM public.room_designs 
GROUP BY room_type
ORDER BY design_count DESC;

-- Check room templates
SELECT COUNT(*) as template_count FROM public.room_templates;
```

### **3. Check EGGER Data Structure**
```sql
-- Verify EGGER decors table
SELECT 
    COUNT(*) as total_decors,
    COUNT(DISTINCT category) as categories,
    COUNT(DISTINCT texture) as textures
FROM public.egger_decors;

-- Check EGGER images
SELECT 
    image_type,
    COUNT(*) as image_count
FROM public.egger_images 
GROUP BY image_type
ORDER BY image_count DESC;

-- Check EGGER combinations
SELECT 
    match_type,
    COUNT(*) as combination_count
FROM public.egger_combinations 
GROUP BY match_type
ORDER BY combination_count DESC;
```

### **4. Check Farrow & Ball Data Structure**
```sql
-- Verify Farrow & Ball finishes
SELECT 
    COUNT(*) as total_finishes,
    COUNT(DISTINCT category) as categories
FROM public.farrow_ball_finishes;

-- Check image URLs
SELECT 
    COUNT(*) as total_finishes,
    COUNT(thumb_url) as with_thumb_url,
    COUNT(hover_url) as with_hover_url
FROM public.farrow_ball_finishes;
```

### **5. Check User Management Structure**
```sql
-- Verify user tiers
SELECT 
    tier,
    COUNT(*) as user_count
FROM public.user_tiers 
GROUP BY tier
ORDER BY user_count DESC;

-- Check profiles
SELECT 
    user_tier,
    COUNT(*) as profile_count
FROM public.profiles 
GROUP BY user_tier
ORDER BY profile_count DESC;
```

---

## 🚨 **POTENTIAL ISSUES TO INVESTIGATE**

### **1. Component System Issues**
- **Missing component behavior properties**: Some components may not have `mount_type`, `has_direction`, etc.
- **Inconsistent elevation heights**: Some components may have NULL elevation heights
- **Room type constraints**: Check if all room types in `room_types` array are valid

### **2. Data Integrity Issues**
- **Orphaned records**: Check for components without valid room types
- **Duplicate component_ids**: Verify uniqueness constraints
- **Missing required fields**: Check for NULL values in NOT NULL columns

### **3. Performance Issues**
- **Missing indexes**: Verify all performance indexes are created
- **Large JSONB fields**: Check size of `design_elements` and `metadata` fields
- **Unused data**: Check for deprecated components that should be cleaned up

---

## 📊 **COMPONENT DATA ANALYSIS**

### **Component Type Distribution**
```sql
-- Analyze component distribution by type
SELECT 
    type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN deprecated = false THEN 1 END) as active_count,
    COUNT(CASE WHEN deprecated = true THEN 1 END) as deprecated_count,
    ROUND(AVG(width), 2) as avg_width,
    ROUND(AVG(depth), 2) as avg_depth,
    ROUND(AVG(height), 2) as avg_height
FROM public.components 
GROUP BY type
ORDER BY active_count DESC;
```

### **Component Category Analysis**
```sql
-- Analyze component distribution by category
SELECT 
    category,
    COUNT(*) as count,
    STRING_AGG(DISTINCT type, ', ') as types_in_category
FROM public.components 
WHERE deprecated = false
GROUP BY category
ORDER BY count DESC;
```

### **Room Type Coverage**
```sql
-- Analyze room type coverage
SELECT 
    room_type,
    COUNT(*) as component_count
FROM (
    SELECT UNNEST(room_types) as room_type
    FROM public.components 
    WHERE deprecated = false
) t
GROUP BY room_type
ORDER BY component_count DESC;
```

### **Component Behavior Analysis**
```sql
-- Analyze component behavior properties
SELECT 
    mount_type,
    has_direction,
    COUNT(*) as count,
    ROUND(AVG(default_z_position), 2) as avg_z_position,
    ROUND(AVG(elevation_height), 2) as avg_elevation_height
FROM public.components 
WHERE deprecated = false
GROUP BY mount_type, has_direction
ORDER BY count DESC;
```

---

## 🎯 **RECOMMENDATIONS**

### **1. Immediate Actions**
1. **Run verification queries** to check actual database state
2. **Identify missing data** in component behavior properties
3. **Check for orphaned records** and data integrity issues
4. **Verify all indexes** are properly created

### **2. Data Quality Improvements**
1. **Standardize component dimensions** (ensure consistent units)
2. **Complete missing elevation heights** for all components
3. **Validate room type constraints** across all components
4. **Clean up deprecated components** if no longer needed

### **3. Performance Optimizations**
1. **Add missing indexes** for frequently queried fields
2. **Optimize JSONB queries** for design elements
3. **Consider partitioning** for large tables
4. **Implement data archiving** for old designs

### **4. Schema Evolution**
1. **Add component versioning** for better change management
2. **Implement soft deletes** for better data recovery
3. **Add audit trails** for component changes
4. **Consider materialized views** for complex queries

---

## 📝 **NEXT STEPS**

1. **Execute verification queries** against your Supabase instance
2. **Compare results** with expected structure
3. **Identify discrepancies** and missing data
4. **Create migration scripts** for any fixes needed
5. **Update documentation** based on actual findings

This analysis provides a comprehensive foundation for understanding your current database structure and identifying areas for improvement.
