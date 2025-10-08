# 3D Models Migration Strategy

**Duration**: Week 13-26 (14 weeks)
**Target**: Move 1,948 lines of hardcoded 3D models to database
**Feature Flag**: `use_dynamic_3d_models`
**Special Focus**: Corner units & auto-rotate system

---

## 🎯 Migration Goals

**Primary Objectives:**
1. ✅ Move all 3D geometry from code to database
2. ✅ Preserve exact corner unit L-shape geometry
3. ✅ Maintain auto-rotate logic (wall snap + corner detection)
4. ✅ Enable easy addition of new components via admin panel
5. ✅ Zero visual regressions
6. ✅ Performance parity or better

**Success Criteria:**
- All components render identically to hardcoded versions
- Corner units maintain exact L-shape ratios
- Auto-rotate works perfectly for all scenarios
- Performance impact < 50ms per component load
- Feature flag enables instant rollback

---

## 📊 Scope Analysis

### **Components to Migrate**

| Category | Count | Complexity | Priority |
|----------|-------|------------|----------|
| Corner Cabinets (L-shaped) | ~8 | **CRITICAL** | P0 |
| Standard Base Cabinets | ~10 | Medium | P1 |
| Wall Cabinets | ~10 | Medium | P1 |
| Tall Units/Larders | ~8 | High | P2 |
| Appliances | ~12 | Medium | P2 |
| Sinks | ~8 | Medium | P3 |
| Counter-tops | ~6 | Medium | P3 |
| Finishing (Cornice/Pelmet) | ~10 | Low | P4 |
| Other (Doors/Windows/Flooring) | ~10 | Low | P4 |

**Total**: ~82 unique component models
**Total Lines**: 1,948 lines of React/Three.js code

### **Database Tables**

1. **`component_3d_models`** - Model metadata and auto-rotate rules
2. **`geometry_parts`** - Individual geometry pieces (boxes, cylinders)
3. **`material_definitions`** - Material properties (color, metalness, roughness)

---

## 📅 Week-by-Week Plan

### **Week 13-14: Foundation & Schema** ✅

**Deliverables:**
- [x] Complete 3D models analysis
- [x] Document corner unit geometry requirements
- [x] Document auto-rotate system requirements
- [x] Design database schema
- [x] Create migration file (`20250129000006_create_3d_models_schema.sql`)
- [ ] Deploy schema to Supabase

**Status**: Schema designed, ready for deployment

---

### **Week 15-16: Formula Parser & Service**

**Objective**: Build the service layer to load and parse 3D models from database

**Tasks:**
1. Create `Model3DLoaderService.ts`
   - Load models from database with caching
   - Parse formula strings safely
   - Evaluate position/dimension formulas
   - Handle conditional rendering

2. Create `FormulaEvaluator.ts`
   - Safe formula evaluation (no eval!)
   - Support common formulas:
     - `width`, `height`, `depth`
     - `legLength`, `cornerDepth`
     - `plinthHeight`, `cabinetHeight`, `doorHeight`
     - Arithmetic: `+`, `-`, `*`, `/`
     - Functions: `Math.min`, `Math.max`

3. Create `GeometryBuilder.ts`
   - Build Three.js geometry from database parts
   - Apply materials and properties
   - Handle corner unit special cases

**Deliverables:**
- `src/services/Model3DLoaderService.ts` (300+ lines)
- `src/utils/FormulaEvaluator.ts` (200+ lines)
- `src/utils/GeometryBuilder.ts` (400+ lines)
- Unit tests for formula evaluation

---

### **Week 17-18: Data Population (P0: Corner Units)**

**Objective**: Populate database with critical P0 components

**Priority 0 Components (Corner Units):**
1. Corner Base Cabinet 60cm ✅ (sample in migration)
2. Corner Base Cabinet 90cm
3. New Corner Wall Cabinet 60cm
4. New Corner Wall Cabinet 90cm
5. Larder Corner Unit 90cm

**Process:**
1. Extract geometry from `EnhancedModels3D.tsx`
2. Convert to database format
3. Create insertion SQL
4. Verify rendering matches exactly

**Validation:**
- Visual comparison screenshots
- Measure dimensions in 3D view
- Test all 4 corner positions (0°, 90°, 180°, 270°)
- Verify L-shape proportions

**Deliverables:**
- Migration script: `populate_corner_units.sql`
- Visual regression test suite
- Documentation of corner unit geometry

---

### **Week 19-20: Renderer Integration**

**Objective**: Integrate dynamic model loader into 3D rendering

**Tasks:**
1. Create `DynamicComponentRenderer.tsx`
   - Load model from database or cache
   - Build Three.js meshes dynamically
   - Apply materials and transformations
   - Handle rotation and positioning

2. Modify `EnhancedModels3D.tsx`
   - Add feature flag check
   - Use DynamicComponentRenderer when flag enabled
   - Fallback to hardcoded when flag disabled
   - Preserve exact rendering behavior

3. Add caching layer
   - Cache loaded models in memory
   - Preload common components
   - Invalidate cache on model updates

**Deliverables:**
- `src/components/3d/DynamicComponentRenderer.tsx`
- Modified `EnhancedModels3D.tsx` with feature flag
- Performance benchmarks (load time, render time)

---

### **Week 21: Data Population (P1: Standard Cabinets)**

**Objective**: Populate standard base and wall cabinets

**Priority 1 Components:**
- Base Cabinets: 40cm, 50cm, 60cm, 80cm, 100cm
- Wall Cabinets: 30cm, 40cm, 50cm, 60cm, 80cm

**Process:**
- Extract geometry for each size
- Populate database
- Test rendering with dynamic loader
- Verify dimensions and materials

**Deliverables:**
- Migration script: `populate_standard_cabinets.sql`
- Test suite for all cabinet sizes

---

### **Week 22: Data Population (P2: Tall Units & Appliances)**

**Objective**: Populate tall units, larders, and appliances

**Priority 2 Components:**
- Tall Units: Larders, pantries, oven housings
- Appliances: Ovens, microwaves, dishwashers, fridges

**Deliverables:**
- Migration script: `populate_tall_units_appliances.sql`
- Test suite

---

### **Week 23: Data Population (P3-P4: Remaining Components)**

**Objective**: Complete all remaining components

**Priority 3-4 Components:**
- Sinks (kitchen, butler)
- Counter-tops (straight, corner)
- Finishing (cornice, pelmet, end panels)
- Other (doors, windows, flooring)

**Deliverables:**
- Migration script: `populate_remaining_components.sql`
- Complete component catalog

---

### **Week 24: Testing & Validation**

**Objective**: Comprehensive testing of all components

**Test Scenarios:**
1. **Visual Regression**
   - Screenshot every component (hardcoded vs dynamic)
   - Pixel-by-pixel comparison
   - Document any differences

2. **Corner Unit Testing**
   - Place in all 4 corners
   - Test all rotation angles
   - Verify L-shape geometry
   - Test auto-rotate logic

3. **Auto-Rotate Testing**
   - Test wall snap (left, right, top, bottom)
   - Test corner detection (4 corners)
   - Test non-corner components at corners
   - Verify "door faces into room" logic

4. **Performance Testing**
   - Measure model load time
   - Measure render time
   - Compare with hardcoded baseline
   - Optimize if necessary

5. **Edge Cases**
   - Components with custom dimensions
   - Rotated components
   - Selected components (color override)
   - Wall vs base cabinet variations

**Deliverables:**
- Test report with screenshots
- Performance benchmarks
- Bug fixes and optimizations

---

### **Week 25-26: Gradual Rollout & Lock-in**

**Objective**: Deploy to production safely

**Rollout Plan:**

**Week 25:**
```sql
-- Day 1-2: Enable in development
UPDATE feature_flags
SET enabled_dev = TRUE, enabled_production = FALSE
WHERE flag_key = 'use_dynamic_3d_models';

-- Day 3-4: Enable in staging
UPDATE feature_flags
SET enabled_staging = TRUE
WHERE flag_key = 'use_dynamic_3d_models';

-- Day 5-7: Canary rollout (1%)
UPDATE feature_flags
SET enabled_production = TRUE, rollout_percentage = 1
WHERE flag_key = 'use_dynamic_3d_models';
```

**Week 26:**
```sql
-- Day 1-3: Increase to 10%
UPDATE feature_flags SET rollout_percentage = 10;

-- Day 4-5: Increase to 50%
UPDATE feature_flags SET rollout_percentage = 50;

-- Day 6-7: Full rollout (100%)
UPDATE feature_flags SET rollout_percentage = 100;
```

**Monitoring:**
- Watch for error rates
- Monitor performance metrics
- Check A/B test results
- User feedback

**Lock-in (if successful):**
```sql
UPDATE feature_flags
SET can_disable = FALSE, test_status = 'passed'
WHERE flag_key = 'use_dynamic_3d_models';
```

---

## 🔧 Technical Implementation

### **Formula Evaluation System**

**Safe Formula Parser (No eval!):**

```typescript
class FormulaEvaluator {
  private variables: Record<string, number>;

  constructor(variables: Record<string, number>) {
    this.variables = variables;
  }

  evaluate(formula: string): number {
    // Parse formula into tokens
    const tokens = this.tokenize(formula);

    // Evaluate using shunting-yard algorithm
    return this.evaluateRPN(this.toRPN(tokens));
  }

  private tokenize(formula: string): Token[] {
    // 'width/2 + 0.01' → ['width', '/', '2', '+', '0.01']
  }

  private toRPN(tokens: Token[]): Token[] {
    // Convert to Reverse Polish Notation
  }

  private evaluateRPN(tokens: Token[]): number {
    // Evaluate RPN expression
  }
}
```

**Supported Formulas:**
- Variables: `width`, `height`, `depth`, `legLength`, `cornerDepth`, etc.
- Operators: `+`, `-`, `*`, `/`
- Constants: Numeric values
- Functions: `Math.min()`, `Math.max()` (optional)

**Example:**
```typescript
const evaluator = new FormulaEvaluator({
  width: 0.6,
  height: 0.9,
  depth: 0.6,
  legLength: 0.6,
  cornerDepth: 0.6,
  plinthHeight: 0.15,
  cabinetHeight: 0.72
});

evaluator.evaluate('legLength/2'); // = 0.3
evaluator.evaluate('cornerDepth/2 - legLength/2 - 0.1'); // = 0.0
evaluator.evaluate('plinthHeight/2'); // = 0.075
```

---

### **Dynamic Geometry Builder**

```typescript
class GeometryBuilder {
  buildFromParts(
    parts: GeometryPart[],
    variables: Record<string, number>,
    materials: Record<string, Material>
  ): THREE.Group {
    const group = new THREE.Group();
    const evaluator = new FormulaEvaluator(variables);

    for (const part of parts.sort((a, b) => a.render_order - b.render_order)) {
      // Evaluate condition
      if (part.render_condition && !this.evaluateCondition(part.render_condition, variables)) {
        continue;
      }

      // Evaluate position
      const position = new THREE.Vector3(
        evaluator.evaluate(part.position_x),
        evaluator.evaluate(part.position_y),
        evaluator.evaluate(part.position_z)
      );

      // Evaluate dimensions
      const dimensions = new THREE.Vector3(
        evaluator.evaluate(part.dimension_width),
        evaluator.evaluate(part.dimension_height),
        evaluator.evaluate(part.dimension_depth)
      );

      // Create geometry
      const geometry = this.createGeometry(part.part_type, dimensions);
      const material = this.getMaterial(part.material_name, part, materials);
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.copy(position);
      group.add(mesh);
    }

    return group;
  }
}
```

---

## ⚠️ Risk Mitigation

### **Risk: Corner Unit Geometry Wrong**

**Mitigation:**
- Exact measurements from existing code
- Visual regression testing
- Manual verification of all 4 corner positions
- Rollback capability via feature flag

### **Risk: Formula Evaluation Errors**

**Mitigation:**
- Comprehensive unit tests
- Safe parser (no eval)
- Fallback to hardcoded on error
- Error logging and monitoring

### **Risk: Performance Degradation**

**Mitigation:**
- Aggressive caching of loaded models
- Preload common components
- Lazy load less common components
- Performance benchmarks before/after

### **Risk: Auto-Rotate Breaks**

**Mitigation:**
- Preserve exact rotation logic in database
- Test all wall snap scenarios
- Test all corner scenarios
- A/B testing to compare behavior

---

## 📈 Success Metrics

**Functional:**
- ✅ 100% of components render correctly
- ✅ Corner units maintain exact L-shape geometry
- ✅ Auto-rotate works in all scenarios
- ✅ Zero visual regressions

**Performance:**
- ✅ Model load time < 50ms per component
- ✅ Render performance parity with hardcoded
- ✅ Cache hit rate > 90%

**Code Quality:**
- ✅ -1,948 lines of hardcoded geometry
- ✅ +~1,000 lines of reusable services
- ✅ Net reduction: ~950 lines
- ✅ All components in database

**User Experience:**
- ✅ No disruption during rollout
- ✅ Instant rollback capability
- ✅ Same visual quality

---

## 🚀 Next Steps (Week 13-14)

1. **Deploy schema** - Run migration `20250129000006_create_3d_models_schema.sql`
2. **Verify deployment** - Check all tables created
3. **Test sample** - Verify corner cabinet sample renders
4. **Start Week 15-16** - Build formula parser and service layer

---

**This migration will make the 3D system infinitely extensible while preserving the exact geometry and behavior that currently works.**
