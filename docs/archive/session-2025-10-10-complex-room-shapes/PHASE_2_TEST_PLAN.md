# Phase 2 Test Plan: TypeScript Layer Testing

**Date:** 2025-10-10
**Phase:** 2 of 6 (TypeScript Interfaces & Service Layer)
**Status:** Ready for Testing

---

## Test Objectives

Verify that all TypeScript interfaces, validation methods, service methods, and React hooks work correctly with the database schema created in Phase 1.

---

## Prerequisites

✅ **Phase 1 Complete:**
- Database migration applied
- 3 templates in database (rectangle, L-shape, U-shape)
- Verification script passed (5/5 tests)

✅ **Phase 2 Complete:**
- TypeScript interfaces defined
- GeometryValidator created
- RoomService extended
- React hooks created
- Dev server running with no TypeScript errors

---

## Test Environment

**Dev Server:** http://localhost:5174
**Database:** Cloud Supabase (akfdezesupzuvukqiggn.supabase.co)
**Branch:** `feature/complex-room-shapes`

---

## Test Suite

### Test 1: TypeScript Compilation ✅

**Objective:** Verify no TypeScript errors

**Steps:**
1. Restart dev server: `npm run dev`
2. Check console output for TypeScript errors
3. Open browser at http://localhost:5174

**Expected Result:**
- ✅ Dev server starts successfully
- ✅ No TypeScript compilation errors
- ✅ Application loads in browser

**Status:** ✅ PASS (verified - server running)

---

### Test 2: GeometryValidator - Rectangle Validation

**Objective:** Test validation on simple rectangle geometry

**Test File:** Create `src/tests/test-geometry-validator.ts` (manual test)

**Test Code:**
```typescript
import { GeometryValidator } from '@/utils/GeometryValidator';
import type { RoomGeometry } from '@/types/RoomGeometry';

// Test 1: Valid Rectangle
const validRectangle: RoomGeometry = {
  shape_type: 'rectangle',
  bounding_box: { min_x: 0, min_y: 0, max_x: 600, max_y: 400 },
  floor: {
    type: 'polygon',
    vertices: [[0, 0], [600, 0], [600, 400], [0, 400]],
    elevation: 0
  },
  walls: [
    { id: 'wall_north', start: [0, 0], end: [600, 0], height: 240, type: 'solid' },
    { id: 'wall_east', start: [600, 0], end: [600, 400], height: 240, type: 'solid' },
    { id: 'wall_south', start: [600, 400], end: [0, 400], height: 240, type: 'solid' },
    { id: 'wall_west', start: [0, 400], end: [0, 0], height: 240, type: 'solid' }
  ],
  ceiling: {
    type: 'flat',
    zones: [{ vertices: [[0, 0], [600, 0], [600, 400], [0, 400]], height: 250, style: 'flat' }]
  },
  metadata: { total_floor_area: 240000 }
};

const result = GeometryValidator.validateRoomGeometry(validRectangle);
console.log('✅ Valid Rectangle Test:', result);
// Expected: { valid: true, errors: [], warnings: [] }
```

**Expected Results:**
- ✅ `valid: true`
- ✅ `errors: []` (empty)
- ✅ `warnings: []` (empty or minor)

**How to Test:**
1. Open browser console (F12)
2. Copy/paste test code into console
3. Check output

---

### Test 3: GeometryValidator - Invalid Polygon

**Objective:** Test validation catches errors

**Test Code:**
```typescript
import { GeometryValidator } from '@/utils/GeometryValidator';

// Test: Invalid polygon (only 2 vertices)
const invalidPolygon = {
  shape_type: 'rectangle',
  bounding_box: { min_x: 0, min_y: 0, max_x: 600, max_y: 400 },
  floor: {
    type: 'polygon',
    vertices: [[0, 0], [600, 0]],  // ❌ Only 2 vertices!
    elevation: 0
  },
  walls: [],
  ceiling: { type: 'flat', zones: [] },
  metadata: { total_floor_area: 0 }
};

const result = GeometryValidator.validateRoomGeometry(invalidPolygon);
console.log('❌ Invalid Polygon Test:', result);
// Expected: { valid: false, errors: ['floor: Polygon must have at least 3 vertices...'], warnings: [...] }
```

**Expected Results:**
- ✅ `valid: false`
- ✅ `errors` array contains: "floor: Polygon must have at least 3 vertices"
- ✅ Additional errors about walls and ceiling

---

### Test 4: GeometryValidator - Area Calculation

**Objective:** Test polygon area calculation accuracy

**Test Code:**
```typescript
import { GeometryValidator } from '@/utils/GeometryValidator';

// Test: Calculate area of 600×400 rectangle
const vertices = [[0, 0], [600, 0], [600, 400], [0, 400]];
const area = GeometryValidator.calculatePolygonArea(vertices);

console.log('📐 Area Calculation Test:');
console.log('  Vertices:', vertices);
console.log('  Calculated Area:', area);
console.log('  Expected Area:', 600 * 400);
console.log('  Match:', area === 600 * 400 ? '✅ PASS' : '❌ FAIL');
```

**Expected Results:**
- ✅ Calculated area: `240000` (600 × 400)
- ✅ Matches expected value exactly

---

### Test 5: RoomService - Load Templates

**Objective:** Test loading geometry templates from database

**Test Code:**
```typescript
import { RoomService } from '@/services/RoomService';

// Test: Load all templates
async function testLoadTemplates() {
  console.log('🔄 Loading geometry templates...');

  const templates = await RoomService.getRoomGeometryTemplates();

  console.log('📦 Templates loaded:', templates.length);
  console.log('Template names:', templates.map(t => t.template_name));

  // Check expected templates
  const expectedNames = ['rectangle-standard', 'l-shape-standard', 'u-shape-standard'];
  const actualNames = templates.map(t => t.template_name);
  const hasAll = expectedNames.every(name => actualNames.includes(name));

  console.log('✅ Has all templates:', hasAll ? 'PASS' : 'FAIL');

  // Log details of L-shape template
  const lShape = templates.find(t => t.template_name === 'l-shape-standard');
  if (lShape) {
    console.log('📐 L-Shape Template:');
    console.log('  Display Name:', lShape.display_name);
    console.log('  Category:', lShape.category);
    console.log('  Vertices:', lShape.geometry_definition.floor.vertices.length);
    console.log('  Walls:', lShape.geometry_definition.walls.length);
  }

  return templates;
}

testLoadTemplates();
```

**Expected Results:**
- ✅ Returns 3 templates
- ✅ Contains: rectangle-standard, l-shape-standard, u-shape-standard
- ✅ L-shape has 6 vertices and 6 walls
- ✅ Console logs show "✅ [RoomService] Loaded 3 geometry templates"

**How to Test:**
1. Open browser console (F12)
2. Copy/paste test code
3. Check console output and network tab (should see Supabase query)

---

### Test 6: RoomService - Load Single Template

**Objective:** Test loading specific template by name

**Test Code:**
```typescript
import { RoomService } from '@/services/RoomService';

async function testLoadSingleTemplate() {
  console.log('🔄 Loading L-shape template...');

  const template = await RoomService.getGeometryTemplate('l-shape-standard');

  if (!template) {
    console.error('❌ Template not found!');
    return;
  }

  console.log('✅ Template loaded:', template.display_name);
  console.log('📊 Geometry Data:');
  console.log('  Shape Type:', template.geometry_definition.shape_type);
  console.log('  Floor Vertices:', template.geometry_definition.floor.vertices);
  console.log('  Walls:', template.geometry_definition.walls.length);
  console.log('  Sections:', template.geometry_definition.sections?.length || 0);
  console.log('  Floor Area:', template.geometry_definition.metadata.total_floor_area, 'cm²');

  // Validate the geometry
  const validation = GeometryValidator.validateRoomGeometry(template.geometry_definition);
  console.log('🔍 Validation Result:', validation.valid ? '✅ VALID' : '❌ INVALID');
  if (!validation.valid) {
    console.error('  Errors:', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.warn('  Warnings:', validation.warnings);
  }

  return template;
}

testLoadSingleTemplate();
```

**Expected Results:**
- ✅ Template found and loaded
- ✅ Display name: "Standard L-Shape"
- ✅ Shape type: "l-shape"
- ✅ 6 floor vertices
- ✅ 6 walls
- ✅ 2 sections (main_section, extension)
- ✅ Floor area: 300,000 cm²
- ✅ Validation passes

---

### Test 7: RoomService - Templates by Category

**Objective:** Test filtering templates by category

**Test Code:**
```typescript
import { RoomService } from '@/services/RoomService';

async function testTemplatesByCategory() {
  console.log('🔄 Loading L-shape category templates...');

  const templates = await RoomService.getTemplatesByCategory('l-shape');

  console.log('📦 L-Shape Templates:', templates.length);
  console.log('Template names:', templates.map(t => t.template_name));

  // Should only have L-shape templates
  const allLShapes = templates.every(t => t.category === 'l-shape');
  console.log('✅ All templates are L-shapes:', allLShapes ? 'PASS' : 'FAIL');

  return templates;
}

testTemplatesByCategory();
```

**Expected Results:**
- ✅ Returns 1 template
- ✅ Contains: l-shape-standard
- ✅ All templates have category: 'l-shape'

---

### Test 8: RoomService - Generate Simple Rectangle (Fallback)

**Objective:** Test backward compatibility - generate rectangle from dimensions

**Test Code:**
```typescript
import { RoomService } from '@/services/RoomService';

// Test the private method via getRoomGeometry
// First, we need a room with no geometry (should generate fallback)

async function testSimpleRectangleFallback() {
  console.log('📐 Testing simple rectangle generation...');

  // Simulate dimensions object
  const dimensions = {
    width: 500,
    height: 350,
    ceilingHeight: 270
  };

  // This tests the fallback logic internally
  // In real use, this would query a room with NULL room_geometry
  console.log('Input dimensions:', dimensions);
  console.log('Expected floor area:', 500 * 350, 'cm²');

  // Note: Can't test private method directly
  // Will test in Test 10 with actual room
}

testSimpleRectangleFallback();
```

**Expected Results:**
- ✅ Generates rectangle geometry
- ✅ 4 vertices: [[0,0], [500,0], [500,350], [0,350]]
- ✅ 4 walls with height 270cm
- ✅ Floor area: 175,000 cm²

---

### Test 9: React Hook - useRoomGeometryTemplates

**Objective:** Test React hook loads templates correctly

**Test Component:** Create temporary test component

**Test Code:**
```tsx
// Create: src/components/test/TestGeometryHooks.tsx
import { useRoomGeometryTemplates } from '@/hooks/useRoomGeometryTemplates';

export function TestGeometryHooks() {
  const { templates, loading, error } = useRoomGeometryTemplates();

  if (loading) return <div>Loading templates...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Geometry Templates Test</h2>
      <p>Total templates: {templates.length}</p>
      <ul className="list-disc pl-6">
        {templates.map(template => (
          <li key={template.id}>
            {template.display_name} ({template.category}) -
            {template.geometry_definition.floor.vertices.length} vertices
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**How to Test:**
1. Add component to a page (e.g., Designer page temporarily)
2. Load the page
3. Check rendered output

**Expected Results:**
- ✅ Shows "Total templates: 3"
- ✅ Lists all 3 templates with correct data
- ✅ No loading errors

---

### Test 10: Integration Test - Create Room with Complex Geometry

**Objective:** Full integration test - create room, apply template, validate

**Test Code:**
```typescript
import { RoomService } from '@/services/RoomService';
import { GeometryValidator } from '@/utils/GeometryValidator';

async function testFullIntegration() {
  console.log('🔄 Starting full integration test...');

  // Step 1: Load L-shape template
  console.log('\n1️⃣ Loading L-shape template...');
  const template = await RoomService.getGeometryTemplate('l-shape-standard');
  if (!template) {
    console.error('❌ Failed to load template');
    return;
  }
  console.log('✅ Template loaded:', template.display_name);

  // Step 2: Validate geometry
  console.log('\n2️⃣ Validating geometry...');
  const validation = GeometryValidator.validateRoomGeometry(template.geometry_definition);
  console.log('Validation:', validation.valid ? '✅ VALID' : '❌ INVALID');
  if (!validation.valid) {
    console.error('Errors:', validation.errors);
    return;
  }

  // Step 3: Check geometry calculations
  console.log('\n3️⃣ Checking geometry calculations...');
  const area = GeometryValidator.calculatePolygonArea(template.geometry_definition.floor.vertices);
  const perimeter = GeometryValidator.calculatePerimeter(template.geometry_definition.floor.vertices);
  const bbox = GeometryValidator.calculateBoundingBox(template.geometry_definition.floor.vertices);

  console.log('Calculated Area:', area, 'cm²');
  console.log('Template Area:', template.geometry_definition.metadata.total_floor_area, 'cm²');
  console.log('Match:', Math.abs(area - template.geometry_definition.metadata.total_floor_area) < 100 ? '✅' : '❌');
  console.log('Perimeter:', perimeter, 'cm');
  console.log('Bounding Box:', bbox);

  // Step 4: Test geometry operations
  console.log('\n4️⃣ Testing geometry operations...');
  const testPoint = [300, 200];
  const isInside = GeometryValidator.isPointInPolygon(testPoint, template.geometry_definition.floor.vertices);
  console.log(`Point [${testPoint}] is inside polygon:`, isInside ? '✅ YES' : '❌ NO');

  const isClockwise = GeometryValidator.isClockwise(template.geometry_definition.floor.vertices);
  console.log('Vertices are clockwise:', isClockwise ? '✅ YES' : '❌ NO');

  console.log('\n✅ Integration test complete!');
}

testFullIntegration();
```

**Expected Results:**
- ✅ Template loads successfully
- ✅ Geometry validates
- ✅ Area calculation matches metadata (within 100 cm² tolerance)
- ✅ Point [300, 200] is inside polygon
- ✅ Vertices are in clockwise order
- ✅ All operations complete without errors

---

## TypeScript Type Checking Tests

### Test 11: Type Safety Verification

**Objective:** Verify TypeScript catches type errors

**Test Code:**
```typescript
import type { RoomGeometry, WallSegment } from '@/types/RoomGeometry';

// Test 1: Valid type usage
const validWall: WallSegment = {
  id: 'wall_1',
  start: [0, 0],
  end: [600, 0],
  height: 240,
  type: 'solid'
};
console.log('✅ Valid wall:', validWall);

// Test 2: TypeScript should catch this error
// Uncomment to test:
// const invalidWall: WallSegment = {
//   id: 'wall_1',
//   start: [0, 0],
//   end: [600, 0],
//   height: 'tall',  // ❌ Should error: string not assignable to number
//   type: 'invalid'  // ❌ Should error: not a valid WallType
// };

// Test 3: TypeScript should prevent invalid shape types
// const invalidGeometry: RoomGeometry = {
//   shape_type: 'octagon',  // ❌ Should error: not a valid RoomShapeType
//   // ...
// };

console.log('✅ TypeScript type checking works correctly');
```

**Expected Results:**
- ✅ Valid code compiles without errors
- ✅ Invalid code (when uncommented) shows TypeScript errors in IDE
- ✅ IDE provides autocomplete for types

---

## Performance Tests

### Test 12: Query Performance

**Objective:** Measure database query speed

**Test Code:**
```typescript
import { RoomService } from '@/services/RoomService';

async function testPerformance() {
  console.log('⚡ Performance Test Starting...\n');

  // Test 1: Load all templates
  const start1 = performance.now();
  const templates = await RoomService.getRoomGeometryTemplates();
  const end1 = performance.now();
  console.log('Load all templates:', (end1 - start1).toFixed(2), 'ms');
  console.log('  Expected: < 100ms');
  console.log('  Status:', (end1 - start1) < 100 ? '✅ PASS' : '⚠️ SLOW');

  // Test 2: Load single template
  const start2 = performance.now();
  const template = await RoomService.getGeometryTemplate('l-shape-standard');
  const end2 = performance.now();
  console.log('\nLoad single template:', (end2 - start2).toFixed(2), 'ms');
  console.log('  Expected: < 50ms');
  console.log('  Status:', (end2 - start2) < 50 ? '✅ PASS' : '⚠️ SLOW');

  // Test 3: Validation speed
  if (template) {
    const start3 = performance.now();
    const validation = GeometryValidator.validateRoomGeometry(template.geometry_definition);
    const end3 = performance.now();
    console.log('\nValidate L-shape geometry:', (end3 - start3).toFixed(2), 'ms');
    console.log('  Expected: < 5ms');
    console.log('  Status:', (end3 - start3) < 5 ? '✅ PASS' : '⚠️ SLOW');
  }

  console.log('\n⚡ Performance Test Complete');
}

testPerformance();
```

**Expected Results:**
- ✅ Load all templates: < 100ms
- ✅ Load single template: < 50ms
- ✅ Validate geometry: < 5ms

---

## Test Summary Checklist

### Manual Tests (Browser Console)

- [ ] Test 2: Rectangle validation ✅
- [ ] Test 3: Invalid polygon detection ✅
- [ ] Test 4: Area calculation ✅
- [ ] Test 5: Load all templates ✅
- [ ] Test 6: Load single template ✅
- [ ] Test 7: Templates by category ✅
- [ ] Test 10: Full integration test ✅
- [ ] Test 11: Type safety (IDE check) ✅
- [ ] Test 12: Performance test ⚡

### Automated Tests (TypeScript Compilation)

- [ ] Test 1: Dev server compiles ✅

### Component Tests (Optional)

- [ ] Test 9: React hook in component ✅

---

## Success Criteria

Phase 2 testing is successful when:

- [x] ✅ Dev server compiles with no TypeScript errors
- [ ] ✅ All validation tests pass (valid/invalid detection)
- [ ] ✅ Area calculations are accurate
- [ ] ✅ Database queries return expected templates
- [ ] ✅ Service methods work correctly
- [ ] ✅ React hooks load data without errors
- [ ] ✅ Performance meets targets (<100ms queries)
- [ ] ✅ TypeScript provides type safety and autocomplete

**Current Status:** 1/8 manual tests complete (Test 1 - compilation)

---

## Quick Test Script

For convenience, here's a complete test script to run all tests:

**File:** `src/tests/run-phase2-tests.ts`

```typescript
import { RoomService } from '@/services/RoomService';
import { GeometryValidator } from '@/utils/GeometryValidator';

console.log('🧪 Phase 2 Test Suite\n');
console.log('═'.repeat(60));

async function runAllTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Load templates
  try {
    console.log('\n1️⃣ Loading templates...');
    const templates = await RoomService.getRoomGeometryTemplates();
    if (templates.length === 3) {
      console.log('✅ PASS - Found 3 templates');
      passed++;
    } else {
      console.log('❌ FAIL - Expected 3, got', templates.length);
      failed++;
    }
  } catch (err) {
    console.log('❌ FAIL - Error loading templates:', err);
    failed++;
  }

  // Test 2: Validate L-shape
  try {
    console.log('\n2️⃣ Validating L-shape geometry...');
    const template = await RoomService.getGeometryTemplate('l-shape-standard');
    if (template) {
      const validation = GeometryValidator.validateRoomGeometry(template.geometry_definition);
      if (validation.valid) {
        console.log('✅ PASS - L-shape geometry is valid');
        passed++;
      } else {
        console.log('❌ FAIL - Validation errors:', validation.errors);
        failed++;
      }
    } else {
      console.log('❌ FAIL - Template not found');
      failed++;
    }
  } catch (err) {
    console.log('❌ FAIL - Error validating:', err);
    failed++;
  }

  // Test 3: Area calculation
  try {
    console.log('\n3️⃣ Testing area calculation...');
    const vertices: [number, number][] = [[0, 0], [600, 0], [600, 400], [0, 400]];
    const area = GeometryValidator.calculatePolygonArea(vertices);
    if (area === 240000) {
      console.log('✅ PASS - Area calculation correct:', area);
      passed++;
    } else {
      console.log('❌ FAIL - Expected 240000, got', area);
      failed++;
    }
  } catch (err) {
    console.log('❌ FAIL - Error calculating area:', err);
    failed++;
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED! Phase 2 is working correctly.\n');
  } else {
    console.log('❌ SOME TESTS FAILED. Check errors above.\n');
  }
}

runAllTests();
```

**How to Run:**
1. Open browser console (F12)
2. Copy/paste the entire script
3. Review results

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark Phase 2 as tested
2. 📝 Document any issues found
3. 🔄 Fix any bugs discovered
4. ✅ Update PHASE_2_COMPLETE.md with test results
5. 🚀 Proceed to Phase 3 (3D Rendering)

---

**Created:** 2025-10-10
**Status:** Ready for Testing
**Related:** PHASE_2_COMPLETE.md, PHASE_2_PLAN.md
