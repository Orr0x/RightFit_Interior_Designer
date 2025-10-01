# Material Library Implementation Plan

## Overview

This document outlines the implementation plan for integrating a comprehensive material library consisting of 300+ Egger decor renders and 300+ Farrow & Ball colors into the 2D and 3D design views.

## Current State

### Existing Material Data
- **Egger Decors**: 300+ cabinet/board renders with high-quality images
- **Farrow & Ball Colors**: 300+ paint colors for walls, accents, etc.
- **Current Storage**: CSV files (`Boards.csv`, `Farrow_and_Ball_Colors.csv`)
- **Current Services**: `EggerDataService` and `FarrowBallDataService`

### Current Rendering
- **2D Views**: Simple geometric shapes (rectangles) with basic styling
- **3D Views**: Basic 3D models without material textures
- **Material Selection**: Limited to basic color/material properties

## Proposed Enhancement

### Goals
1. **Visual Quality**: Replace geometric shapes with high-quality material renders
2. **Material Library**: Centralized database for 600+ materials
3. **Performance**: Efficient loading and caching of material images
4. **User Experience**: Rich material browsing and selection interface
5. **Scalability**: Easy to add more materials and categories

## Technical Architecture

### 1. Database Schema Design

```sql
-- Materials table for all decor types
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'cabinet', 'worktop', 'backsplash', 'wall'
  subcategory TEXT, -- 'base_cabinet', 'wall_cabinet', 'corner_cabinet', etc.
  brand TEXT NOT NULL, -- 'egger', 'farrow_ball'
  color_code TEXT,
  color_hex TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  medium_url TEXT,
  full_url TEXT,
  metadata JSONB, -- for additional properties like finish, texture, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Material categories for organization
CREATE TABLE material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  parent_id UUID REFERENCES material_categories(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Material usage tracking
CREATE TABLE material_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id),
  element_id UUID, -- Reference to design element
  usage_type TEXT NOT NULL, -- 'cabinet', 'worktop', 'backsplash', 'wall'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_brand ON materials(brand);
CREATE INDEX idx_materials_color_code ON materials(color_code);
CREATE INDEX idx_materials_search ON materials USING gin(to_tsvector('english', name || ' ' || display_name));
```

### 2. Image Storage Strategy

#### Supabase Storage Organization
```
materials/
├── egger/
│   ├── cabinets/
│   │   ├── base/
│   │   ├── wall/
│   │   ├── corner/
│   │   └── tall/
│   ├── worktops/
│   └── backsplashes/
├── farrow_ball/
│   ├── walls/
│   ├── accents/
│   └── trims/
└── thumbnails/
    ├── egger/
    └── farrow_ball/
```

#### Image Processing Pipeline
```typescript
interface ImageSizes {
  thumbnail: { width: 150, height: 150 };
  medium: { width: 512, height: 512 };
  full: { width: 1024, height: 1024 };
  original: { width: 2048, height: 2048 };
}

interface ProcessedImage {
  thumbnailUrl: string;
  mediumUrl: string;
  fullUrl: string;
  originalUrl: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}
```

### 3. Service Layer Architecture

#### Enhanced Material Service
```typescript
class MaterialService {
  // Material retrieval
  async getMaterialsByCategory(category: string, filters?: MaterialFilters): Promise<Material[]>
  async getMaterialById(id: string): Promise<Material | null>
  async searchMaterials(query: string, filters?: MaterialFilters): Promise<Material[]>
  async getPopularMaterials(limit: number): Promise<Material[]>
  
  // Image management
  async getMaterialImage(materialId: string, size: ImageSize): Promise<string>
  async preloadMaterialImages(materialIds: string[]): Promise<void>
  
  // Material application
  async applyMaterialToElement(elementId: string, materialId: string): Promise<void>
  async getElementMaterials(elementId: string): Promise<Material[]>
  
  // Caching
  async clearMaterialCache(): Promise<void>
  async warmupCache(categories: string[]): Promise<void>
}
```

#### Material Types
```typescript
interface Material {
  id: string;
  name: string;
  displayName: string;
  category: MaterialCategory;
  subcategory?: string;
  brand: 'egger' | 'farrow_ball';
  colorCode?: string;
  colorHex?: string;
  imageUrls: {
    thumbnail: string;
    medium: string;
    full: string;
    original: string;
  };
  metadata: {
    finish?: string;
    texture?: string;
    durability?: string;
    price?: number;
    availability?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MaterialFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  colorCode?: string;
  priceRange?: { min: number; max: number };
  availability?: boolean;
}
```

### 4. UI Components

#### Material Browser
```typescript
interface MaterialBrowserProps {
  category: string;
  onMaterialSelect: (material: Material) => void;
  selectedMaterial?: Material;
  filters?: MaterialFilters;
  showSearch?: boolean;
  showFilters?: boolean;
  layout?: 'grid' | 'list';
}
```

#### Material Preview
```typescript
interface MaterialPreviewProps {
  material: Material;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  onApply?: (material: Material) => void;
}
```

#### Material Selector
```typescript
interface MaterialSelectorProps {
  elementType: 'cabinet' | 'worktop' | 'backsplash' | 'wall';
  currentMaterial?: Material;
  onMaterialChange: (material: Material) => void;
  showPreview?: boolean;
}
```

### 5. Rendering Integration

#### 2D View Enhancement
```typescript
// Enhanced cabinet rendering with materials
const drawCabinetWithMaterial = (
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  material: Material,
  view: string
) => {
  // Load material image
  const image = await loadMaterialImage(material.id, 'medium');
  
  // Apply material to cabinet geometry
  ctx.drawImage(
    image,
    x, y, width, height
  );
  
  // Apply any additional effects (shadows, highlights, etc.)
  applyMaterialEffects(ctx, material, element);
};
```

#### 3D View Enhancement
```typescript
// Apply materials to 3D models
const applyMaterialTo3DModel = (
  model: THREE.Object3D,
  material: Material
) => {
  const texture = await loadMaterialTexture(material.id, 'full');
  const material3D = new THREE.MeshLambertMaterial({
    map: texture,
    // Additional material properties
  });
  
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = material3D;
    }
  });
};
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create database schema and migrations
- [ ] Set up Supabase Storage buckets
- [ ] Implement basic MaterialService
- [ ] Create image processing pipeline
- [ ] Migrate 20-30 sample materials for testing

### Phase 2: Core Functionality (Week 3-4)
- [ ] Implement MaterialBrowser component
- [ ] Create MaterialPreview component
- [ ] Integrate with existing 2D rendering
- [ ] Add material selection to element properties
- [ ] Implement basic search and filtering

### Phase 3: Full Integration (Week 5-6)
- [ ] Migrate all 300+ Egger materials
- [ ] Migrate all 300+ Farrow & Ball colors
- [ ] Implement 3D material application
- [ ] Add advanced filtering and search
- [ ] Implement material usage tracking

### Phase 4: Optimization (Week 7-8)
- [ ] Implement image caching and preloading
- [ ] Add progressive image loading
- [ ] Optimize database queries
- [ ] Implement material favorites
- [ ] Add material comparison features

### Phase 5: Advanced Features (Week 9-10)
- [ ] Implement material recommendations
- [ ] Add material cost estimation
- [ ] Create material usage reports
- [ ] Implement material sharing
- [ ] Add material import/export

## Performance Considerations

### Image Optimization
- **Format**: Use WebP for better compression
- **Sizing**: Multiple sizes for different use cases
- **Lazy Loading**: Load images only when needed
- **Caching**: Implement browser and service worker caching
- **CDN**: Use Supabase CDN for global distribution

### Database Optimization
- **Indexing**: Proper indexes on search and filter fields
- **Pagination**: Implement cursor-based pagination
- **Query Optimization**: Use database views for complex queries
- **Connection Pooling**: Optimize database connections

### Memory Management
- **Image Cleanup**: Dispose of unused images
- **Cache Limits**: Implement LRU cache with size limits
- **Memory Monitoring**: Track memory usage and optimize

## Migration Strategy

### Data Migration
1. **CSV Processing**: Parse existing CSV files
2. **Image Download**: Download and process all images
3. **Database Population**: Insert materials into database
4. **Validation**: Verify data integrity and completeness
5. **Testing**: Test with sample data before full migration

### Service Migration
1. **Backward Compatibility**: Maintain existing service interfaces
2. **Gradual Migration**: Migrate one service at a time
3. **Feature Flags**: Use feature flags for gradual rollout
4. **Monitoring**: Monitor performance and user feedback

## Testing Strategy

### Unit Tests
- MaterialService methods
- Image processing functions
- Database queries and mutations
- UI component rendering

### Integration Tests
- Material selection workflow
- 2D/3D rendering with materials
- Search and filtering functionality
- Performance under load

### User Acceptance Tests
- Material browsing experience
- Material application to elements
- Search and discovery
- Performance on different devices

## Success Metrics

### Performance Metrics
- **Image Load Time**: < 2 seconds for medium images
- **Search Response Time**: < 500ms for material search
- **Database Query Time**: < 100ms for category queries
- **Memory Usage**: < 100MB for material cache

### User Experience Metrics
- **Material Discovery**: Time to find desired material
- **Application Success**: Successful material application rate
- **User Satisfaction**: Feedback on material quality and selection
- **Usage Patterns**: Most popular materials and categories

## Future Enhancements

### Advanced Features
- **AI Material Recommendations**: Based on design context
- **Material Compatibility**: Check material combinations
- **Cost Estimation**: Real-time material cost calculation
- **Supplier Integration**: Direct ordering from suppliers
- **Custom Materials**: User-uploaded material support

### Integration Opportunities
- **3D Rendering**: Enhanced 3D material visualization
- **VR/AR**: Virtual material preview
- **Mobile App**: Material selection on mobile devices
- **API**: External material library access

## Conclusion

This material library implementation will significantly enhance the visual quality and user experience of the design application. The phased approach ensures manageable development while delivering value at each stage. The database-centric architecture provides scalability and performance for the growing material library.

The integration with existing 2D and 3D rendering systems will create a seamless material selection and application experience, making the application more professional and user-friendly for interior design and kitchen planning workflows.
