# Browser Testing - GeometryUtils Verification
**Date:** 2025-10-11
**Purpose:** Verify GeometryUtils functions work in browser before implementation

---

## How to Test in Browser Console

### Step 1: Open Dev Tools
1. Start app: `npm run dev`
2. Open in browser (usually http://localhost:5173)
3. Open browser console (F12 or Ctrl+Shift+J)

### Step 2: Import GeometryUtils
```javascript
// Option A: If module is globally available
const GeometryUtils = window.GeometryUtils;

// Option B: Import from running app context
// Navigate to any page with the designer component loaded
// The functions should be available in the module scope
```

### Step 3: Test pointToLineSegmentDistance()

**Test 1: Point directly on line**
```javascript
// Wall from (0, 0) to (600, 0) - horizontal wall
// Point at (300, 0) - center of wall
const distance1 = GeometryUtils.pointToLineSegmentDistance(
  [300, 0],
  [0, 0],
  [600, 0]
);
console.log('Point on wall:', distance1); // Expected: 0
```

**Test 2: Point near wall (within tolerance)**
```javascript
// Point at (300, 15) - 15cm above wall
const distance2 = GeometryUtils.pointToLineSegmentDistance(
  [300, 15],
  [0, 0],
  [600, 0]
);
console.log('Point 15cm from wall:', distance2); // Expected: 15
```

**Test 3: Point far from wall (outside tolerance)**
```javascript
// Point at (300, 50) - 50cm above wall
const distance3 = GeometryUtils.pointToLineSegmentDistance(
  [300, 50],
  [0, 0],
  [600, 0]
);
console.log('Point 50cm from wall:', distance3); // Expected: 50
```

**Test 4: Point beyond wall endpoint**
```javascript
// Point at (700, 50) - beyond wall end
const distance4 = GeometryUtils.pointToLineSegmentDistance(
  [700, 50],
  [0, 0],
  [600, 0]
);
console.log('Point beyond wall:', distance4); // Expected: ~111.8 (diagonal)
```

### Step 4: Test calculateLineLength()

```javascript
// Horizontal wall
const length1 = GeometryUtils.calculateLineLength([0, 0], [600, 0]);
console.log('Horizontal wall length:', length1); // Expected: 600

// Vertical wall
const length2 = GeometryUtils.calculateLineLength([0, 0], [0, 400]);
console.log('Vertical wall length:', length2); // Expected: 400

// Diagonal
const length3 = GeometryUtils.calculateLineLength([0, 0], [300, 400]);
console.log('Diagonal length:', length3); // Expected: 500
```

### Step 5: Test with Real Room Geometry

**Access room geometry from app state:**
```javascript
// If using React DevTools, you can access component state
// Or check if roomGeometry is available in window/global scope

// Example: L-shaped room
const testLShapeWalls = [
  { id: 'wall-1', start: [0, 0], end: [600, 0] },
  { id: 'wall-2', start: [600, 0], end: [600, 300] },
  { id: 'wall-3', start: [600, 300], end: [300, 300] },
  { id: 'wall-4', start: [300, 300], end: [300, 400] },  // Interior wall
  { id: 'wall-5', start: [300, 400], end: [0, 400] },
  { id: 'wall-6', start: [0, 400], end: [0, 0] }
];

// Test cabinet position near interior wall
const cabinetPos = [310, 350]; // 10cm from wall-4

testLShapeWalls.forEach(wall => {
  const dist = GeometryUtils.pointToLineSegmentDistance(
    cabinetPos,
    wall.start,
    wall.end
  );
  console.log(`Distance to ${wall.id}:`, dist.toFixed(2) + 'cm');
});

// Expected: wall-4 should have smallest distance (~10cm)
```

---

## Alternative: Direct File Import Test

If modules aren't exposed globally, you can test by temporarily adding console.log in the actual file:

### Add to GeometryUtils.ts (temporary):
```typescript
// At the end of src/utils/GeometryUtils.ts
if (typeof window !== 'undefined') {
  (window as any).testGeometryUtils = () => {
    console.log('🧪 Testing GeometryUtils...');

    const test1 = pointToLineSegmentDistance([300, 15], [0, 0], [600, 0]);
    console.log('✅ Test 1 - Point 15cm from wall:', test1);

    const test2 = calculateLineLength([0, 0], [600, 0]);
    console.log('✅ Test 2 - Wall length:', test2);

    console.log('✅ All tests passed!');
  };
}
```

Then in browser console:
```javascript
window.testGeometryUtils();
```

---

## Expected Results

### ✅ Success Indicators:
- All distance calculations return numbers (not NaN)
- Distance from point on wall ≈ 0
- Distance from point 20cm away ≈ 20
- Wall lengths match expected dimensions
- No console errors

### ❌ Failure Indicators:
- Functions return `undefined`
- "function not found" errors
- NaN or Infinity values
- Type errors

---

## Quick Test (Simplest Method)

**Just paste this in browser console:**
```javascript
// Test if functions are accessible
const tests = {
  pointToLineSegmentDistance: typeof GeometryUtils?.pointToLineSegmentDistance === 'function',
  calculateLineLength: typeof GeometryUtils?.calculateLineLength === 'function',
  findNearestWall: typeof GeometryUtils?.findNearestWall === 'function'
};

console.table(tests);

// If all show 'true', functions are available ✅
// If 'false' or errors, need to check import path
```

---

## What to Report Back

1. ✅ Functions accessible? (true/false)
2. ✅ Distance calculations work? (sample output)
3. ✅ No console errors? (true/false)
4. ✅ Results match expectations? (true/false)

If all ✅, we're ready to proceed with implementation!
