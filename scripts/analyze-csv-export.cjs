/**
 * Analyze CSV export of components table
 * Run with: node scripts/analyze-csv-export.cjs
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'docs', 'Database', 'Supabase Snippet Component Default Z Positions.csv');

function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      data.push(row);
    }
  }
  return data;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('CSV EXPORT ANALYSIS');
  console.log('═══════════════════════════════════════════════════\n');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_PATH}`);
    return;
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const components = parseCSV(content);

  console.log(`📊 Total components: ${components.length}\n`);

  // Analyze default_z_position
  console.log('═══ DEFAULT_Z_POSITION ANALYSIS ═══\n');

  const zPositions = {
    null: 0,
    zero: 0,
    nonZero: new Map() // type -> Set of values
  };

  components.forEach(c => {
    const z = c.default_z_position;
    if (z === 'null' || z === '') {
      zPositions.null++;
    } else if (parseFloat(z) === 0) {
      zPositions.zero++;
    } else {
      if (!zPositions.nonZero.has(c.type)) {
        zPositions.nonZero.set(c.type, new Set());
      }
      zPositions.nonZero.get(c.type).add(parseFloat(z));
    }
  });

  console.log(`Null/Empty: ${zPositions.null}`);
  console.log(`Zero (0.00): ${zPositions.zero}`);
  console.log(`Non-zero: ${[...zPositions.nonZero.values()].reduce((sum, set) => sum + set.size, 0)}\n`);

  if (zPositions.nonZero.size > 0) {
    console.log('Components with non-zero default_z_position:');
    for (const [type, values] of zPositions.nonZero) {
      console.log(`  ${type}: ${[...values].sort((a, b) => a - b).join(', ')}`);
    }
    console.log('');
  }

  // Analyze elevation_height
  console.log('═══ ELEVATION_HEIGHT ANALYSIS ═══\n');

  const elevationHeights = {
    null: 0,
    hasValue: new Map() // type -> Set of values
  };

  components.forEach(c => {
    const eh = c.elevation_height;
    if (eh === 'null' || eh === '') {
      elevationHeights.null++;
    } else {
      if (!elevationHeights.hasValue.has(c.type)) {
        elevationHeights.hasValue.set(c.type, new Set());
      }
      elevationHeights.hasValue.get(c.type).add(parseFloat(eh));
    }
  });

  console.log(`Null/Empty: ${elevationHeights.null}`);
  console.log(`Has value: ${components.length - elevationHeights.null}\n`);

  if (elevationHeights.hasValue.size > 0) {
    console.log('Components with elevation_height:');
    for (const [type, values] of elevationHeights.hasValue) {
      const count = components.filter(c => c.type === type && c.elevation_height !== 'null' && c.elevation_height !== '').length;
      console.log(`  ${type} (${count} components): ${[...values].sort((a, b) => a - b).join(', ')}`);
    }
    console.log('');
  }

  // Analyze plinth_height
  console.log('═══ PLINTH_HEIGHT ANALYSIS ═══\n');

  const plinthHeights = {
    null: 0,
    hasValue: 0
  };

  components.forEach(c => {
    const ph = c.plinth_height;
    if (ph === 'null' || ph === '') {
      plinthHeights.null++;
    } else {
      plinthHeights.hasValue++;
    }
  });

  console.log(`Null/Empty: ${plinthHeights.null}`);
  console.log(`Has value: ${plinthHeights.hasValue}\n`);

  // Type breakdown
  console.log('═══ COMPONENT TYPES BREAKDOWN ═══\n');

  const typeCount = new Map();
  components.forEach(c => {
    typeCount.set(c.type, (typeCount.get(c.type) || 0) + 1);
  });

  const sortedTypes = [...typeCount.entries()].sort((a, b) => b[1] - a[1]);
  console.log('| Type | Count | default_z | elevation_h | plinth_h |');
  console.log('|------|-------|-----------|-------------|----------|');

  sortedTypes.forEach(([type, count]) => {
    const withZ = components.filter(c => c.type === type && c.default_z_position !== '0.00' && c.default_z_position !== 'null' && c.default_z_position !== '').length;
    const withEH = components.filter(c => c.type === type && c.elevation_height !== 'null' && c.elevation_height !== '').length;
    const withPH = components.filter(c => c.type === type && c.plinth_height !== 'null' && c.plinth_height !== '').length;

    console.log(`| ${type.padEnd(20)} | ${String(count).padStart(5)} | ${String(withZ).padStart(9)} | ${String(withEH).padStart(11)} | ${String(withPH).padStart(8)} |`);
  });

  console.log('\n');

  // Target types that need default_z_position
  console.log('═══ RECOMMENDED Z-POSITION VALUES ═══\n');

  const recommendations = [
    { type: 'cornice', z: 200, reason: 'Top of wall units' },
    { type: 'pelmet', z: 140, reason: 'Bottom of wall units' },
    { type: 'counter-top', z: 90, reason: 'Standard counter height' },
    { type: 'window', z: 90, reason: 'Typical sill height' },
    { type: 'end-panel', z: 200, reason: 'Wall unit end panels' },
    { type: 'wall-cabinet', z: 140, reason: 'Wall mounted cabinets (pattern match)' }
  ];

  recommendations.forEach(rec => {
    const count = rec.type === 'wall-cabinet'
      ? components.filter(c => c.component_id.includes('wall-cabinet')).length
      : components.filter(c => c.type === rec.type).length;

    if (count > 0) {
      console.log(`✅ ${rec.type} (${count} components) → ${rec.z}cm - ${rec.reason}`);
    } else {
      console.log(`⚠️  ${rec.type} - No components found`);
    }
  });

  // Check for components that might need elevation_height
  console.log('\n═══ COMPONENTS WITH elevation_height ═══\n');

  const withElevation = components.filter(c => c.elevation_height !== 'null' && c.elevation_height !== '');
  console.log(`Found ${withElevation.length} components with elevation_height\n`);

  const elevationSample = withElevation.slice(0, 10);
  elevationSample.forEach(c => {
    console.log(`  ${c.component_id} (${c.type}): elevation=${c.elevation_height}, z=${c.default_z_position}`);
  });

  if (withElevation.length > 10) {
    console.log(`  ... and ${withElevation.length - 10} more`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ Analysis complete');
  console.log('═══════════════════════════════════════════════════\n');
}

main();
