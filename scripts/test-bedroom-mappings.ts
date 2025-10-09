/**
 * Test script to verify ComponentIDMapper patterns for bedroom components
 */
import { mapComponentIdToModelId, testComponentIdMapping } from '../src/utils/ComponentIDMapper';

console.log('='.repeat(80));
console.log('TESTING BEDROOM COMPONENT MAPPINGS');
console.log('='.repeat(80));
console.log();

// Test data from components table
const bedroomComponents = [
  // Bedroom Furniture (not rendering)
  { id: 'single-bed-90', width: 90, category: 'bedroom-furniture' },
  { id: 'double-bed-140', width: 140, category: 'bedroom-furniture' },
  { id: 'king-bed-150', width: 150, category: 'bedroom-furniture' },
  { id: 'superking-bed-180', width: 180, category: 'bedroom-furniture' },
  { id: 'ottoman-60', width: 60, category: 'bedroom-furniture' },
  { id: 'ottoman-storage-80', width: 80, category: 'bedroom-furniture' },
  { id: 'reading-chair-70', width: 70, category: 'bedroom-furniture' },
  { id: 'bedroom-bench-120', width: 120, category: 'bedroom-furniture' },

  // Bedroom Storage (rendering OK)
  { id: 'wardrobe-2door-100', width: 100, category: 'bedroom-storage' },
  { id: 'chest-drawers-80', width: 80, category: 'bedroom-storage' },
  { id: 'bedside-table-40', width: 40, category: 'bedroom-storage' },
];

console.log('Testing bedroom component mappings:');
console.log();

bedroomComponents.forEach(comp => {
  console.log(`Component: ${comp.id} (${comp.width}cm, ${comp.category})`);

  const mapped = mapComponentIdToModelId(comp.id, comp.width);

  if (mapped) {
    if (mapped === comp.id) {
      console.log(`  ✅ Mapped to: ${mapped} (EXACT MATCH)`);
    } else {
      console.log(`  ⚠️  Mapped to: ${mapped} (DIFFERENT - might not find in DB)`);
    }
  } else {
    console.log(`  ❌ NO MAPPING FOUND - will fall back to hardcoded`);
  }
  console.log();
});

console.log('='.repeat(80));
console.log('DETAILED PATTERN TESTING');
console.log('='.repeat(80));
console.log();

// Test specific problematic components
const problemComponents = [
  { id: 'single-bed-90', width: 90 },
  { id: 'ottoman-60', width: 60 },
  { id: 'reading-chair-70', width: 70 },
  { id: 'bedroom-bench-120', width: 120 },
];

problemComponents.forEach(comp => {
  console.log(`\nTesting: ${comp.id} (${comp.width}cm)`);
  console.log('-'.repeat(80));

  const results = testComponentIdMapping(comp.id, comp.width);

  // Show all matching patterns
  const matches = results.filter(r => r.matched);
  console.log(`Matching patterns: ${matches.length}`);

  matches.forEach((match, i) => {
    console.log(`  ${i + 1}. Pattern: ${match.pattern}`);
    console.log(`     Description: ${match.description}`);
    console.log(`     Result: ${match.result}`);
  });

  if (matches.length === 0) {
    console.log('  ❌ NO PATTERNS MATCHED!');
  }
});

console.log();
console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log();
console.log('Expected behavior:');
console.log('  single-bed-90 should map to: single-bed-90 (exact match)');
console.log('  ottoman-60 should map to: ottoman-60 (exact match)');
console.log('  reading-chair-70 should map to: reading-chair-70 (exact match)');
console.log('  bedroom-bench-120 should map to: bedroom-bench-120 (exact match)');
console.log();
console.log('If mappings are different, the ComponentIDMapper patterns need adjustment.');
