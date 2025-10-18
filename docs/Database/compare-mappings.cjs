const fs = require('fs');

// Read database 3D models
const models3dContent = fs.readFileSync('component_3d_models_rows.csv', 'utf8');
const models3dLines = models3dContent.split('\n').slice(1).filter(line => line.trim());
const models3d = models3dLines.map(line => {
  const firstComma = line.indexOf(',');
  const remainder = line.substring(firstComma + 1);
  const secondComma = remainder.indexOf(',');
  const componentId = remainder.substring(0, secondComma);
  return componentId;
}).filter(Boolean);

// Read components table
const componentsContent = fs.readFileSync('Supabase Snippet Components table export.csv', 'utf8');
const componentsLines = componentsContent.split('\n').slice(1).filter(line => line.trim());
const components = componentsLines.map(line => {
  const parts = line.split(',');
  return {
    id: parts[3],
    name: parts[4],
    category: parts[10],
    rooms: parts[11] || ''
  };
});

// Categorize by room type
const kitchenComps = components.filter(c => c.rooms.includes('kitchen'));
const bedroomComps = components.filter(c => c.rooms.includes('bedroom'));
const bathroomComps = components.filter(c => c.rooms.includes('bathroom'));
const livingComps = components.filter(c => c.rooms.includes('living'));
const officeComps = components.filter(c => c.rooms.includes('office'));
const utilityComps = components.filter(c => c.rooms.includes('utility'));

console.log('='.repeat(80));
console.log('COMPONENT ID MAPPER ANALYSIS - Kitchen vs Multi-Room');
console.log('='.repeat(80));
console.log();

// Kitchen Analysis
console.log('KITCHEN COMPONENTS:');
console.log('-'.repeat(80));
const kitchenWith3D = kitchenComps.filter(c => models3d.includes(c.id));
const kitchenWithout3D = kitchenComps.filter(c => !models3d.includes(c.id));
console.log(`Total: ${kitchenComps.length}`);
console.log(`With 3D: ${kitchenWith3D.length} (${Math.round(kitchenWith3D.length/kitchenComps.length*100)}%)`);
console.log(`Without 3D: ${kitchenWithout3D.length}`);
console.log();

// Multi-Room Analysis
console.log('MULTI-ROOM COMPONENTS:');
console.log('-'.repeat(80));

const analyzeRoom = (roomComps, roomName) => {
  const with3D = roomComps.filter(c => models3d.includes(c.id));
  const without3D = roomComps.filter(c => !models3d.includes(c.id));
  console.log(`${roomName}:`);
  console.log(`  Total: ${roomComps.length}`);
  console.log(`  With 3D: ${with3D.length} (${Math.round(with3D.length/roomComps.length*100)}%)`);
  console.log(`  Without 3D: ${without3D.length}`);
  return { with3D, without3D };
};

const bedroom = analyzeRoom(bedroomComps, 'Bedroom');
const bathroom = analyzeRoom(bathroomComps, 'Bathroom');
const living = analyzeRoom(livingComps, 'Living Room');
const office = analyzeRoom(officeComps, 'Office');
const utility = analyzeRoom(utilityComps, 'Utility');

console.log();
console.log('='.repeat(80));
console.log('DATABASE 3D MODELS BY CATEGORY:');
console.log('-'.repeat(80));

// Group 3D models by prefix pattern
const modelsByPattern = {};
models3d.forEach(id => {
  // Extract pattern (e.g., 'bed-' from 'bed-single')
  const parts = id.split('-');
  const pattern = parts[0];
  if (!modelsByPattern[pattern]) {
    modelsByPattern[pattern] = [];
  }
  modelsByPattern[pattern].push(id);
});

// Sort by count
const sortedPatterns = Object.entries(modelsByPattern)
  .sort((a, b) => b[1].length - a[1].length);

sortedPatterns.forEach(([pattern, ids]) => {
  console.log(`${pattern}* (${ids.length} models):`);
  ids.forEach(id => console.log(`  - ${id}`));
});

console.log();
console.log('='.repeat(80));
console.log('COMPONENTIDMAPPER MULTI-ROOM PATTERNS:');
console.log('-'.repeat(80));
console.log('Pattern: bed -> bed-single (hardcoded, no width variation)');
console.log('Pattern: sofa -> sofa-3-seater (hardcoded)');
console.log('Pattern: chair -> dining-chair (hardcoded)');
console.log('Pattern: table -> dining-table (hardcoded)');
console.log('Pattern: tv -> tv-55-inch (hardcoded)');
console.log('Pattern: washing-machine -> washing-machine (hardcoded)');
console.log('Pattern: tumble-dryer -> tumble-dryer (hardcoded)');
console.log('Pattern: toilet -> toilet-standard (hardcoded)');
console.log('Pattern: shower -> shower-standard (hardcoded)');
console.log('Pattern: bathtub -> bathtub-standard (hardcoded)');
console.log();
console.log('⚠️  ISSUE: Multi-room patterns are HARDCODED to single variants');
console.log('⚠️  Kitchen patterns use width-based mapping (e.g., base-cabinet-${width})');
console.log('⚠️  Multi-room patterns do NOT use width/size-based mapping');
console.log();

console.log('='.repeat(80));
console.log('MISSING MULTI-ROOM PATTERNS:');
console.log('-'.repeat(80));

// Check for multi-room components WITHOUT mappings
const multiRoomComps = [
  ...bedroomComps,
  ...bathroomComps,
  ...livingComps,
  ...officeComps,
  ...utilityComps
];

const unmappedCategories = new Set();
multiRoomComps.forEach(comp => {
  const id = comp.id;
  const hasMapping =
    /bed/i.test(id) ||
    /sofa/i.test(id) ||
    /chair/i.test(id) ||
    /table/i.test(id) ||
    /tv/i.test(id) ||
    /washing-machine|washer(?!-dryer)/i.test(id) ||
    /tumble-dryer|dryer/i.test(id) ||
    /toilet/i.test(id) ||
    /shower/i.test(id) ||
    /bathtub|bath(?!room)/i.test(id);

  if (!hasMapping && models3d.includes(id)) {
    unmappedCategories.add(comp.category);
    console.log(`Missing pattern for: ${id} (${comp.name}, category: ${comp.category})`);
  }
});

console.log();
console.log('Categories with unmapped 3D models:');
unmappedCategories.forEach(cat => console.log(`  - ${cat}`));

console.log();
console.log('='.repeat(80));
console.log('SUMMARY:');
console.log('-'.repeat(80));
console.log('✅ Kitchen patterns: COMPLETE (width-based, dynamic)');
console.log('⚠️  Multi-room patterns: INCOMPLETE (hardcoded, no width variants)');
console.log('❌ Missing patterns: wardrobes, dressers, desks, vanities, etc.');
console.log();
console.log('RECOMMENDATION:');
console.log('1. Add width-based patterns for all multi-room furniture with size variants');
console.log('2. Add explicit patterns for missing categories (wardrobe, dresser, desk, etc.)');
console.log('3. Test each multi-room component after adding patterns');
console.log('='.repeat(80));
