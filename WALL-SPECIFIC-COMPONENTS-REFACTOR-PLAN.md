# Wall-Specific Components Refactor Plan

## Overview
This document outlines a major refactoring to implement wall-specific component variants, eliminating rotation complexity and simplifying the component library while maintaining backward compatibility.

## Problem Statement
- Rotation-based positioning causes visual inconsistencies and complex logic
- Rectangular components (30×60, 40×60, 80×60) have positioning/snapping issues when rotated
- Component library has too many size-specific variants that could be simplified
- Complex rotation calculations throughout the codebase

## Solution Strategy
Implement wall-specific component variants with a simplified component library, maintaining full backward compatibility.

## Phase 1: Analysis & Planning

### 1.1 Component Library Audit
- [ ] Scan `src/scripts/extracted-components.json` for problematic dimensions
- [ ] Identify components with 30×60, 40×60, 80×60 dimensions
- [ ] Catalog all worktop, kickstand, cornice, pelmet, end-panel variants
- [ ] Document current drawer unit variants

### 1.2 Database Schema Design
- [ ] Design new tables for wall-specific variants
- [ ] Plan migration strategy for existing data
- [ ] Ensure backward compatibility with legacy projects

### 1.3 Component Simplification Strategy
- [ ] Define simplified component categories
- [ ] Plan wall detection logic
- [ ] Design properties panel enhancements

## Phase 2: Database Migration

### 2.1 Create New Tables
```sql
-- Wall-specific component variants
CREATE TABLE component_wall_variants (
  id SERIAL PRIMARY KEY,
  base_component_id INTEGER REFERENCES components(id),
  wall_orientation VARCHAR(10) NOT NULL, -- 'front', 'back', 'left', 'right'
  variant_name VARCHAR(100) NOT NULL,
  width_cm INTEGER,
  depth_cm INTEGER,
  height_cm INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Simplified component categories
CREATE TABLE component_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(50) NOT NULL, -- 'worktop', 'kickstand', 'cornice', etc.
  orientation VARCHAR(20) NOT NULL, -- 'horizontal', 'vertical'
  base_width_cm INTEGER,
  base_depth_cm INTEGER,
  base_height_cm INTEGER,
  is_customizable BOOLEAN DEFAULT true
);
```

### 2.2 Add New Columns (Non-Destructive)
```sql
-- Add new columns to existing components table
ALTER TABLE components ADD COLUMN wall_orientation VARCHAR(10);
ALTER TABLE components ADD COLUMN is_wall_specific BOOLEAN DEFAULT false;
ALTER TABLE components ADD COLUMN parent_component_id INTEGER REFERENCES components(id);
ALTER TABLE components ADD COLUMN is_simplified_variant BOOLEAN DEFAULT false;
```

### 2.3 Migration Scripts
- [ ] Create data migration scripts
- [ ] Populate new tables with existing data
- [ ] Add migration flags to projects table

## Phase 3: Component Library Refactoring

### 3.1 Create Wall-Specific Variants
- [ ] `base-cabinet-30-front` / `base-cabinet-30-left`
- [ ] `base-cabinet-40-front` / `base-cabinet-40-left`
- [ ] `base-cabinet-80-front` / `base-cabinet-80-left`
- [ ] `drawer-unit-80-front` / `drawer-unit-80-left`

### 3.2 Simplified Component Categories
- [ ] `worktop-horizontal` / `worktop-vertical`
- [ ] `kickstand-horizontal` / `kickstand-vertical`
- [ ] `cornice-horizontal` / `cornice-vertical`
- [ ] `pelmet-horizontal` / `pelmet-vertical`
- [ ] `end-panel-vertical` / `end-panel-horizontal`

### 3.3 Remove Redundant Variants
- [ ] Remove all size-specific worktop variants
- [ ] Remove all size-specific kickstand variants
- [ ] Remove all size-specific cornice/pelmet variants
- [ ] Remove all size-specific end-panel variants
- [ ] Remove all drawer unit variants except 80cm

## Phase 4: Code Implementation

### 4.1 Wall Detection Logic
- [ ] Implement wall detection for component placement
- [ ] Create component selection logic with fallback
- [ ] Update placement system to auto-select variants

### 4.2 Remove Rotation Logic
- [ ] Remove rotation-aware dimension calculations
- [ ] Simplify elevation view rendering
- [ ] Clean up positioning logic
- [ ] Remove complex rotation calculations

### 4.3 Properties Panel Enhancements
- [ ] Ensure width/height adjustments work for all components
- [ ] Add orientation switching for simplified components
- [ ] Improve dimension input validation

### 4.4 Update Services
- [ ] Update `EggerDataService` for new component structure
- [ ] Update `FarrowBallDataService` if needed
- [ ] Modify component loading logic

## Phase 5: Testing & Validation

### 5.1 Backward Compatibility Testing
- [ ] Test existing projects still work
- [ ] Verify legacy component loading
- [ ] Test migration scripts

### 5.2 New Functionality Testing
- [ ] Test wall-specific component placement
- [ ] Verify simplified component sizing
- [ ] Test all elevation views
- [ ] Validate 3D rendering

### 5.3 Performance Testing
- [ ] Measure component loading performance
- [ ] Test with large projects
- [ ] Validate database query performance

## Phase 6: Documentation & Cleanup

### 6.1 Update Documentation
- [ ] Update component library documentation
- [ ] Document new placement logic
- [ ] Update API documentation

### 6.2 Code Cleanup
- [ ] Remove unused rotation logic
- [ ] Clean up component definitions
- [ ] Optimize database queries

## Implementation Timeline

### Week 1: Analysis & Database
- Complete component library audit
- Design and implement database migrations
- Create migration scripts

### Week 2: Component Refactoring
- Create wall-specific variants
- Implement simplified components
- Remove redundant variants

### Week 3: Code Implementation
- Implement wall detection logic
- Remove rotation complexity
- Update services and rendering

### Week 4: Testing & Polish
- Comprehensive testing
- Performance optimization
- Documentation updates

## Risk Mitigation

### Backward Compatibility
- All existing projects continue to work
- Gradual migration path available
- Rollback capability maintained

### Data Safety
- Non-destructive database changes
- Comprehensive backup strategy
- Migration testing in staging

### Performance
- Minimal impact on existing functionality
- Optimized queries for new structure
- Caching strategy for component variants

## Success Criteria

1. **Visual Consistency**: 40cm cabinets appear as 40cm in all views
2. **Simplified Logic**: No complex rotation calculations
3. **Better UX**: Intuitive component placement and sizing
4. **Maintainability**: Cleaner, more maintainable codebase
5. **Performance**: No degradation in app performance
6. **Compatibility**: All existing projects continue working

## Rollback Plan

If issues arise:
1. Revert database migrations
2. Restore original component library
3. Re-enable rotation logic
4. Restore previous codebase state

## Next Steps

1. Commit current changes
2. Begin Phase 1: Component Library Audit
3. Create detailed implementation tasks
4. Start with database migration design
