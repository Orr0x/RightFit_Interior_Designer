# Current Database Schema

This document describes the current database schema for the RightFit Interiors application as of the latest migration.

## Overview

The database consists of several main areas:
- **EGGER Product Data** - EGGER materials and finishes
- **Farrow & Ball Data** - Farrow & Ball finishes and colors
- **Component System** - Interior design components
- **Room Management** - User designs and templates
- **Content Management** - Blog and media
- **User Management** - User tiers and permissions

## Core Tables

### EGGER Product Tables

#### `egger_decors`
Main EGGER products table containing decor information.
```sql
CREATE TABLE public.egger_decors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT UNIQUE NOT NULL,
    decor_name TEXT NOT NULL,
    decor TEXT NOT NULL,
    texture TEXT NOT NULL,
    product_page_url TEXT,
    description TEXT,
    category TEXT,
    -- Additional fields...
);
```

#### `egger_images`
EGGER product images with different types and sizes.
```sql
CREATE TABLE public.egger_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT NOT NULL,
    image_type TEXT NOT NULL, -- 'webp', 'original', etc.
    image_url TEXT NOT NULL,
    sort_order INTEGER,
    -- Additional fields...
);
```

#### `egger_combinations`
EGGER product combinations and recommendations.
```sql
CREATE TABLE public.egger_combinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT NOT NULL,
    recommended_decor_id TEXT NOT NULL,
    -- Additional fields...
);
```

#### `egger_availability`
EGGER product availability information.
```sql
CREATE TABLE public.egger_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decor_id TEXT NOT NULL,
    availability_status TEXT,
    -- Additional fields...
);
```

### Farrow & Ball Tables

#### `farrow_ball_finishes`
Farrow & Ball paint finishes and colors.
```sql
CREATE TABLE public.farrow_ball_finishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finish_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    number TEXT,
    category TEXT,
    description TEXT,
    -- Additional fields...
);
```

#### `farrow_ball_color_schemes`
Farrow & Ball color scheme combinations.
```sql
CREATE TABLE public.farrow_ball_color_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id TEXT NOT NULL,
    name TEXT NOT NULL,
    -- Additional fields...
);
```

#### `farrow_ball_images`
Farrow & Ball product images.
```sql
CREATE TABLE public.farrow_ball_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finish_id TEXT NOT NULL,
    image_type TEXT NOT NULL,
    image_url TEXT NOT NULL,
    -- Additional fields...
);
```

### Component System

#### `components`
Main components table for the interior design system.
```sql
CREATE TABLE public.components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Core component data
    component_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cabinet', 'appliance', 'counter-top', 'end-panel', 'window', 'door', 'flooring', 'toe-kick', 'cornice', 'pelmet', 'wall-unit-end-panel')),
    width DECIMAL(10,2) NOT NULL,
    depth DECIMAL(10,2) NOT NULL,
    height DECIMAL(10,2) NOT NULL,
    color TEXT,
    category TEXT NOT NULL,
    room_types TEXT[] NOT NULL,
    icon_name TEXT,
    description TEXT,
    version TEXT DEFAULT '1.0.0',
    deprecated BOOLEAN DEFAULT false,
    metadata JSONB,
    tags TEXT[],
    
    -- Additional fields...
);
```

### Room Management

#### `room_designs`
User-created room designs.
```sql
CREATE TABLE public.room_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    user_id UUID NOT NULL,
    project_id UUID,
    room_type TEXT NOT NULL,
    room_name TEXT,
    design_elements JSONB,
    room_dimensions JSONB,
    
    -- Additional fields...
);
```

#### `room_templates`
Pre-defined room templates.
```sql
CREATE TABLE public.room_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    template_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    room_type TEXT NOT NULL,
    description TEXT,
    template_data JSONB,
    
    -- Additional fields...
);
```

### Content Management

#### `blog_posts`
Blog posts for the CMS.
```sql
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
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

### User Management

#### `user_tiers`
User permission tiers.
```sql
CREATE TABLE public.user_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    user_id UUID UNIQUE NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'pro', 'god')),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional fields...
);
```

## Storage Buckets

The application uses Supabase Storage for:
- **images** - Product images, blog images, user uploads
- **static-pages** - Generated static content

## Row Level Security (RLS)

All tables have Row Level Security enabled with appropriate policies for:
- Public read access for product data
- User-specific access for designs and content
- Admin access for management functions

## Indexes

Key indexes are created for:
- `decor_id` on EGGER tables
- `finish_id` on Farrow & Ball tables
- `component_id` on components table
- `user_id` on user-specific tables
- `slug` on blog_posts table

## Relationships

- EGGER tables are linked by `decor_id`
- Farrow & Ball tables are linked by `finish_id`
- User designs link to components via JSONB references
- Blog posts link to users via `author_id`
- User tiers link to auth users via `user_id`

## Migration Status

Current schema is based on migrations up to:
- `20250916000000_fix_tall_corner_unit_dimensions.sql` (Latest)

All previous migrations have been consolidated and archived.
