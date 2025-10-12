/**
 * Test updating a single component
 * Run with: node scripts/test-update-single.cjs
 */

const https = require('https');

const SUPABASE_URL = 'akfdezesupzuvukqiggn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZmRlemVzdXB6dXZ1a3FpZ2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDEyNzQsImV4cCI6MjA3Mjc3NzI3NH0.LVMu91CxxbrLHi2kcE7hreVDYi5OYuHI0Z4O1gigAMI';

async function queryTable(params = '') {
  const options = {
    hostname: SUPABASE_URL,
    port: 443,
    path: `/rest/v1/components?${params}`,
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function updateComponent(filter, body) {
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Response status: ${res.statusCode}`);
        console.log(`Response headers:`, res.headers);
        console.log(`Response data:`, data);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : []);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  try {
    console.log('Finding a cornice component...\n');
    const cornices = await queryTable('select=id,component_id,type,default_z_position&type=eq.cornice&limit=1');

    if (cornices.length === 0) {
      console.log('No cornice components found');
      return;
    }

    const cornice = cornices[0];
    console.log('Found:', JSON.stringify(cornice, null, 2));
    console.log(`\nCurrent default_z_position: ${cornice.default_z_position}`);

    console.log('\nAttempting to update to 200...\n');
    const result = await updateComponent(
      `id=eq.${cornice.id}`,
      { default_z_position: 200 }
    );

    console.log('\nUpdate result:', JSON.stringify(result, null, 2));

    console.log('\nVerifying update...\n');
    const verified = await queryTable(`select=id,component_id,type,default_z_position&id=eq.${cornice.id}`);
    console.log('After update:', JSON.stringify(verified[0], null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

main();
