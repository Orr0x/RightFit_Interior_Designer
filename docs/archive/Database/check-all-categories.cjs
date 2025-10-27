const fs = require('fs');

console.log('='.repeat(80));
console.log('CHECKING ALL COMPONENT CATEGORIES');
console.log('='.repeat(80));
console.log();

// Read component types from components table
const componentsData = fs.readFileSync('Supabase Snippet Components table export.csv', 'utf8');
const componentLines = componentsData.split('\n').slice(1).filter(line => line.trim());

const typeCount = new Map();
const roomTypes = new Set();

componentLines.forEach(line => {
  const parts = line.split(',');
  const componentId = parts[3];
  const type = parts[5]; // type column
  const roomStr = parts[11]; // room_types column

  if (type) {
    typeCount.set(type, (typeCount.get(type) || 0) + 1);
  }

  if (roomStr) {
    const cleaned = roomStr.replace(/[\[\]"]/g, '');
    cleaned.split(',').forEach(room => {
      if (room.trim()) roomTypes.add(room.trim());
    });
  }
});

console.log('ROOM TYPES IN DATABASE:');
Array.from(roomTypes).sort().forEach(r => console.log(`  - ${r}`));
console.log();

console.log('COMPONENT TYPES IN DATABASE:');
const sortedTypes = Array.from(typeCount.entries()).sort((a, b) => b[1] - a[1]);
sortedTypes.forEach(([type, count]) => {
  console.log(`  - ${type}: ${count} components`);
});
console.log();

// Read 3D models categories
const models3dData = fs.readFileSync('component_3d_models_rows.csv', 'utf8');
const modelLines = models3dData.split('\n').slice(1).filter(line => line.trim());

const categoryCount = new Map();
modelLines.forEach(line => {
  const parts = line.split(',');
  const category = parts[4]; // category column
  if (category && category !== 'category') {
    categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
  }
});

console.log('CATEGORIES WITH 3D MODELS:');
const sortedCategories = Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1]);
sortedCategories.forEach(([cat, count]) => {
  console.log(`  - ${cat}: ${count} models`);
});
console.log();

console.log('='.repeat(80));
console.log('ADAPTIVEVIEW3D SWITCH STATEMENT COVERAGE');
console.log('='.repeat(80));
console.log();

// Types handled in AdaptiveView3D switch statement (after our fix)
const handledTypes = new Set([
  'cabinet',
  'appliance',
  'counter-top',
  'end-panel',
  'window',
  'door',
  'flooring',
  'toe-kick',
  'cornice',
  'pelmet',
  'wall-unit-end-panel',
  'sink',
  // Multi-room types we added
  'bed',
  'seating',
  'storage',
  'desk',
  'table',
  'chair',
]);

console.log('Types EXPLICITLY handled in switch:');
Array.from(handledTypes).sort().forEach(t => console.log(`  ✅ ${t}`));
console.log();

console.log('Types NOT explicitly handled (use default case):');
sortedTypes.forEach(([type, count]) => {
  if (!handledTypes.has(type)) {
    console.log(`  ⚠️  ${type} (${count} components) - uses default case`);
  }
});
console.log();

console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log();

const totalTypes = typeCount.size;
const explicitlyHandled = Array.from(typeCount.keys()).filter(t => handledTypes.has(t)).length;
const defaultCase = totalTypes - explicitlyHandled;

console.log(`Total component types: ${totalTypes}`);
console.log(`Explicitly handled: ${explicitlyHandled} types`);
console.log(`Using default case: ${defaultCase} types`);
console.log();

if (defaultCase > 0) {
  console.log('ℹ️  Types using default case will still render via EnhancedCabinet3D');
  console.log('   (as long as they have 3D models in database and feature flag is enabled)');
} else {
  console.log('✅ All component types are explicitly handled!');
}
