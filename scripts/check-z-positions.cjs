/**
 * Check current default_z_position values in components table
 * Run with: node scripts/check-z-positions.cjs
 */

const https = require('https');

const SUPABASE_URL = 'akfdezesupzuvukqiggn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZmRlemVzdXB6dXZ1a3FpZ2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDEyNzQsImV4cCI6MjA3Mjc3NzI3NH0.LVMu91CxxbrLHi2kcE7hreVDYi5OYuHI0Z4O1gigAMI';

async function queryTable(table, params = '') {
  const options = {
    hostname: SUPABASE_URL,
    port: 443,
    path: `/rest/v1/${table}?${params}`,
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('CHECKING DEFAULT Z-POSITION VALUES');
    console.log('═══════════════════════════════════════════════════\n');

    // Query all components with relevant fields
    const components = await queryTable('components', 'select=component_id,type,default_z_position');

    console.log(`📊 Total components: ${components.length}\n`);

    // Group by type and z-position
    const byType = {};
    const nullCount = components.filter(c => c.default_z_position === null).length;
    const zeroCount = components.filter(c => c.default_z_position === 0).length;
    const hasValueCount = components.filter(c => c.default_z_position !== null && c.default_z_position !== 0).length;

    components.forEach(c => {
      if (!byType[c.type]) {
        byType[c.type] = {
          count: 0,
          null: 0,
          zero: 0,
          values: new Set()
        };
      }
      byType[c.type].count++;
      if (c.default_z_position === null) {
        byType[c.type].null++;
      } else if (c.default_z_position === 0) {
        byType[c.type].zero++;
      } else {
        byType[c.type].values.add(c.default_z_position);
      }
    });

    console.log('📈 Overall Summary:');
    console.log(`  Null values: ${nullCount}`);
    console.log(`  Zero values: ${zeroCount}`);
    console.log(`  Has value (non-zero): ${hasValueCount}\n`);

    console.log('📋 By Component Type:\n');
    console.log('| Type | Count | Null | Zero | Non-Zero Values |');
    console.log('|------|-------|------|------|-----------------|');

    Object.entries(byType).sort((a, b) => b[1].count - a[1].count).forEach(([type, stats]) => {
      const values = stats.values.size > 0 ? Array.from(stats.values).join(', ') : '-';
      console.log(`| ${type.padEnd(25)} | ${String(stats.count).padEnd(5)} | ${String(stats.null).padEnd(4)} | ${String(stats.zero).padEnd(4)} | ${values} |`);
    });

    console.log('\n');

    // Check specific types we care about
    const targetTypes = [
      { type: 'cornice', expectedZ: 200, description: 'Top of wall units' },
      { type: 'pelmet', expectedZ: 140, description: 'Bottom of wall units' },
      { type: 'counter-top', expectedZ: 90, description: 'Standard counter height' },
      { type: 'wall-unit-end-panel', expectedZ: 200, description: 'Wall unit end panel' },
      { type: 'window', expectedZ: 90, description: 'Typical sill height' }
    ];

    console.log('🎯 Target Types Analysis:\n');
    targetTypes.forEach(({ type, expectedZ, description }) => {
      const typeData = byType[type];
      if (typeData) {
        const needsUpdate = typeData.null > 0 || typeData.zero > 0;
        const status = needsUpdate ? '❌ NEEDS UPDATE' : '✅ OK';
        console.log(`${status} ${type} (expected: ${expectedZ}cm - ${description})`);
        console.log(`     Count: ${typeData.count}, Null: ${typeData.null}, Zero: ${typeData.zero}`);
        if (typeData.values.size > 0) {
          console.log(`     Current values: ${Array.from(typeData.values).join(', ')}`);
        }
      } else {
        console.log(`⚠️  ${type} - No components found`);
      }
      console.log('');
    });

    // Check wall-cabinet pattern
    const wallCabinets = components.filter(c =>
      c.component_id && c.component_id.includes('wall-cabinet')
    );
    console.log(`🏗️  Wall Cabinets (component_id contains 'wall-cabinet'):`);
    console.log(`     Count: ${wallCabinets.length}`);
    console.log(`     Null: ${wallCabinets.filter(c => c.default_z_position === null).length}`);
    console.log(`     Zero: ${wallCabinets.filter(c => c.default_z_position === 0).length}`);
    const wallCabinetValues = new Set(wallCabinets.map(c => c.default_z_position).filter(z => z !== null && z !== 0));
    if (wallCabinetValues.size > 0) {
      console.log(`     Current values: ${Array.from(wallCabinetValues).join(', ')}`);
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ Analysis complete');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
