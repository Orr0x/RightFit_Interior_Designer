/**
 * Update default_z_position values in components table
 * Run with: node scripts/update-z-positions.cjs
 *
 * This script updates the database to match the logic in componentZPositionHelper.ts
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

async function updateComponents(filter, body) {
  const options = {
    hostname: SUPABASE_URL,
    port: 443,
    path: `/rest/v1/components?${filter}`,
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          try {
            const result = data ? JSON.parse(data) : [];
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

    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('UPDATING DEFAULT Z-POSITION VALUES');
    console.log('═══════════════════════════════════════════════════\n');

    const updates = [
      {
        description: 'Cornice components → 200cm (top of wall units)',
        filter: 'type=eq.cornice',
        value: 200
      },
      {
        description: 'Pelmet components → 140cm (bottom of wall units)',
        filter: 'type=eq.pelmet',
        value: 140
      },
      {
        description: 'Counter-top components → 90cm (standard counter height)',
        filter: 'type=eq.counter-top',
        value: 90
      },
      {
        description: 'Window components → 90cm (typical sill height)',
        filter: 'type=eq.window',
        value: 90
      },
      {
        description: 'End-panel components → 200cm (wall unit end panels)',
        filter: 'type=eq.end-panel',
        value: 200
      }
    ];

    let totalUpdated = 0;

    for (const update of updates) {
      console.log(`🔄 ${update.description}`);
      try {
        const result = await updateComponents(
          update.filter,
          { default_z_position: update.value }
        );
        console.log(`   ✅ Updated ${result.length} components\n`);
        totalUpdated += result.length;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Handle wall-cabinet pattern separately (component_id contains 'wall-cabinet')
    console.log('🔄 Wall cabinets (component_id contains "wall-cabinet") → 140cm');
    try {
      // First, get all components with wall-cabinet in their ID
      const allComponents = await queryTable('components', 'select=id,component_id,default_z_position');
      const wallCabinets = allComponents.filter(c =>
        c.component_id && c.component_id.includes('wall-cabinet')
      );

      console.log(`   Found ${wallCabinets.length} wall cabinets`);

      // Update each one individually (since we can't use LIKE with REST API)
      let wallCabinetUpdated = 0;
      for (const cabinet of wallCabinets) {
        try {
          await updateComponents(
            `id=eq.${cabinet.id}`,
            { default_z_position: 140 }
          );
          wallCabinetUpdated++;
        } catch (error) {
          console.log(`   ⚠️  Failed to update ${cabinet.component_id}: ${error.message}`);
        }
      }

      console.log(`   ✅ Updated ${wallCabinetUpdated} wall cabinets\n`);
      totalUpdated += wallCabinetUpdated;
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Total components updated: ${totalUpdated}`);
    console.log('═══════════════════════════════════════════════════\n');

    // Run verification
    console.log('🔍 Verifying updates...\n');
    const verification = await queryTable('components', 'select=type,default_z_position');

    const byType = {};
    verification.forEach(c => {
      if (!byType[c.type]) {
        byType[c.type] = new Set();
      }
      byType[c.type].add(c.default_z_position);
    });

    console.log('📊 Verification Results:\n');
    ['cornice', 'pelmet', 'counter-top', 'window', 'end-panel'].forEach(type => {
      if (byType[type]) {
        const values = Array.from(byType[type]).sort((a, b) => a - b);
        console.log(`  ${type}: ${values.join(', ')}`);
      }
    });

    console.log('\n✅ Update complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
