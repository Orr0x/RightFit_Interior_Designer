const fs = require('fs');

// Read CSVs
const models3d = fs.readFileSync('component_3d_models_rows.csv', 'utf8')
  .split('\n')
  .slice(1)
  .map(line => line.split(',')[1])
  .filter(Boolean);

const components = fs.readFileSync('Supabase Snippet Components table export.csv', 'utf8')
  .split('\n')
  .slice(1)
  .filter(Boolean)
  .map(line => {
    const parts = line.split(',');
    return {
      id: parts[3],
      name: parts[4],
      category: parts[10],
      rooms: parts[11] || ''
    };
  });

const kitchenComps = components.filter(c => c.rooms.includes('kitchen'));

console.log(`Total components: ${components.length}`);
console.log(`Kitchen components: ${kitchenComps.length}`);
console.log(`Total 3D models: ${models3d.length}`);
console.log();

// Group by category
const byCategory = {};
kitchenComps.forEach(c => {
  if (!byCategory[c.category]) byCategory[c.category] = [];
  byCategory[c.category].push(c.id);
});

console.log('KITCHEN COMPONENTS BY CATEGORY:');
Object.keys(byCategory).sort().forEach(cat => {
  const ids = byCategory[cat];
  const with3d = ids.filter(id => models3d.includes(id));
  const pct = Math.round(with3d.length * 100 / ids.length);
  console.log(`  ${cat}: ${ids.length} total, ${with3d.length} with 3D (${pct}%)`);
});

console.log('\n\nKITCHEN COMPONENTS MISSING 3D:');
Object.keys(byCategory).sort().forEach(cat => {
  const ids = byCategory[cat];
  const missing = ids.filter(id => !models3d.includes(id));
  if (missing.length > 0) {
    console.log(`\n${cat} (${missing.length} missing):`);
    missing.forEach(id => console.log(`  ❌ ${id}`));
  }
});
