/**
 * Test bedroom component ID patterns
 */

// Replicate the bed pattern logic from ComponentIDMapper
function testBedPattern(elementId, width) {
  // Pattern 1: /superking-bed/i (priority 32)
  if (/superking-bed/i.test(elementId)) {
    return 'superking-bed-180';
  }

  // Pattern 2: /king-bed/i (priority 31)
  if (/king-bed/i.test(elementId)) {
    return 'king-bed-150';
  }

  // Pattern 3: /double-bed/i (priority 30)
  if (/double-bed/i.test(elementId)) {
    return 'double-bed-140';
  }

  // Pattern 4: /single-bed/i (priority 29)
  if (/single-bed/i.test(elementId)) {
    return 'single-bed-90';
  }

  // Pattern 5: /^bed-|bed$/i (priority 28)
  if (/^bed-|bed$/i.test(elementId)) {
    if (width >= 180) return 'superking-bed-180';
    if (width >= 150) return 'king-bed-150';
    if (width >= 140) return 'double-bed-140';
    if (width >= 90) return 'single-bed-90';
    return 'bed-single';
  }

  return null;
}

function testOttomanPattern(elementId, width) {
  if (/ottoman/i.test(elementId)) {
    if (elementId.includes('storage') || width >= 80) return 'ottoman-storage-80';
    return 'ottoman-60';
  }
  return null;
}

function testChairPattern(elementId, width) {
  // Reading chair (priority 26)
  if (/reading.*chair/i.test(elementId)) {
    return 'reading-chair-70';
  }

  // Generic chair (priority 20)
  if (/chair/i.test(elementId)) {
    return 'dining-chair';
  }

  return null;
}

function testBenchPattern(elementId, width) {
  if (/bedroom.*bench/i.test(elementId)) {
    return 'bedroom-bench-120';
  }
  return null;
}

function testWardrobePattern(elementId, width) {
  if (/wardrobe/i.test(elementId)) {
    if (elementId.includes('sliding')) return 'wardrobe-sliding-180';
    if (width >= 200 || elementId.includes('4door') || elementId.includes('4-door')) return 'wardrobe-4door-200';
    if (width >= 150 || elementId.includes('3door') || elementId.includes('3-door')) return 'wardrobe-3door-150';
    return 'wardrobe-2door-100';
  }
  return null;
}

console.log('='.repeat(80));
console.log('BEDROOM COMPONENT PATTERN TESTING');
console.log('='.repeat(80));
console.log();

// Test data from components table
const tests = [
  // Beds - NOT RENDERING
  { id: 'single-bed-90', width: 90, category: 'bedroom-furniture' },
  { id: 'double-bed-140', width: 140, category: 'bedroom-furniture' },
  { id: 'king-bed-150', width: 150, category: 'bedroom-furniture' },
  { id: 'superking-bed-180', width: 180, category: 'bedroom-furniture' },

  // Other furniture - NOT RENDERING
  { id: 'ottoman-60', width: 60, category: 'bedroom-furniture' },
  { id: 'ottoman-storage-80', width: 80, category: 'bedroom-furniture' },
  { id: 'reading-chair-70', width: 70, category: 'bedroom-furniture' },
  { id: 'bedroom-bench-120', width: 120, category: 'bedroom-furniture' },

  // Storage - RENDERING OK
  { id: 'wardrobe-2door-100', width: 100, category: 'bedroom-storage' },
  { id: 'wardrobe-3door-150', width: 150, category: 'bedroom-storage' },
  { id: 'chest-drawers-80', width: 80, category: 'bedroom-storage' },
];

tests.forEach(test => {
  console.log(`Component: ${test.id} (${test.width}cm)`);
  console.log(`  Category: ${test.category}`);

  let result = null;

  // Try each pattern
  result = testBedPattern(test.id, test.width);
  if (result) {
    console.log(`  ✅ Bed pattern matched -> ${result}`);
    if (result === test.id) {
      console.log(`     ✅ EXACT MATCH - should find in database`);
    } else {
      console.log(`     ⚠️  MISMATCH - DB has "${test.id}", pattern returns "${result}"`);
    }
    console.log();
    return;
  }

  result = testOttomanPattern(test.id, test.width);
  if (result) {
    console.log(`  ✅ Ottoman pattern matched -> ${result}`);
    if (result === test.id) {
      console.log(`     ✅ EXACT MATCH - should find in database`);
    } else {
      console.log(`     ⚠️  MISMATCH - DB has "${test.id}", pattern returns "${result}"`);
    }
    console.log();
    return;
  }

  result = testChairPattern(test.id, test.width);
  if (result) {
    console.log(`  ✅ Chair pattern matched -> ${result}`);
    if (result === test.id) {
      console.log(`     ✅ EXACT MATCH - should find in database`);
    } else {
      console.log(`     ⚠️  MISMATCH - DB has "${test.id}", pattern returns "${result}"`);
    }
    console.log();
    return;
  }

  result = testBenchPattern(test.id, test.width);
  if (result) {
    console.log(`  ✅ Bench pattern matched -> ${result}`);
    if (result === test.id) {
      console.log(`     ✅ EXACT MATCH - should find in database`);
    } else {
      console.log(`     ⚠️  MISMATCH - DB has "${test.id}", pattern returns "${result}"`);
    }
    console.log();
    return;
  }

  result = testWardrobePattern(test.id, test.width);
  if (result) {
    console.log(`  ✅ Wardrobe pattern matched -> ${result}`);
    if (result === test.id) {
      console.log(`     ✅ EXACT MATCH - should find in database`);
    } else {
      console.log(`     ⚠️  MISMATCH - DB has "${test.id}", pattern returns "${result}"`);
    }
    console.log();
    return;
  }

  console.log(`  ❌ NO PATTERN MATCHED`);
  console.log();
});

console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log();
console.log('Key Finding:');
console.log('  If patterns return exact matches -> Database lookup should succeed');
console.log('  If patterns return different IDs -> Database lookup will FAIL (no model found)');
console.log();
console.log('Expected Results:');
console.log('  single-bed-90 pattern should return: single-bed-90 (exact match)');
console.log('  ottoman-60 pattern should return: ottoman-60 (exact match)');
console.log('  reading-chair-70 pattern should return: reading-chair-70 (exact match)');
console.log('  wardrobe-2door-100 pattern should return: wardrobe-2door-100 (exact match)');
