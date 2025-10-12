/**
 * Query components table schema from Supabase
 * Run with: node scripts/query-components-schema.js
 */

const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://akfdezesupzuvukqiggn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZmRlemVzdXB6dXZ1a3FpZ2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDEyNzQsImV4cCI6MjA3Mjc3NzI3NH0.LVMu91CxxbrLHi2kcE7hreVDYi5OYuHI0Z4O1gigAMI';

async function querySchema() {
  console.log('🔍 Querying components table schema from Supabase...\n');

  // Query to get components table columns
  const query = `
    SELECT
      column_name,
      data_type,
      character_maximum_length,
      column_default,
      is_nullable,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'components'
    ORDER BY ordinal_position;
  `;

  const postData = JSON.stringify({
    query: query
  });

  const options = {
    hostname: 'akfdezesupzuvukqiggn.supabase.co',
    port: 443,
    path: '/rest/v1/rpc/execute_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Length': postData.length
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

    req.write(postData);
    req.end();
  });
}

async function getTablesList() {
  console.log('📋 Getting all public tables...\n');

  const query = `
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  const postData = JSON.stringify({
    query: query
  });

  const options = {
    hostname: 'akfdezesupzuvukqiggn.supabase.co',
    port: 443,
    path: '/rest/v1/rpc/execute_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Length': postData.length
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

    req.write(postData);
    req.end();
  });
}

// Alternative: Use REST API to query components directly
async function queryComponentsTable() {
  console.log('🔍 Querying components table data (first 5 rows)...\n');

  const options = {
    hostname: 'akfdezesupzuvukqiggn.supabase.co',
    port: 443,
    path: '/rest/v1/components?select=*&limit=5',
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
    // Get tables list
    console.log('═══════════════════════════════════════════════════');
    console.log('DATABASE SCHEMA QUERY');
    console.log('═══════════════════════════════════════════════════\n');

    const tables = await getTablesList();
    console.log('📋 Public Tables:');
    console.log(JSON.stringify(tables, null, 2));
    console.log('\n');

    // Get components table structure
    const schema = await querySchema();
    console.log('📊 Components Table Schema:');
    console.log(JSON.stringify(schema, null, 2));
    console.log('\n');

    // Get sample data
    const components = await queryComponentsTable();
    console.log('🔢 Sample Components (first 5):');
    console.log(JSON.stringify(components, null, 2));
    console.log('\n');

    // Generate markdown report
    let report = '# Database Schema Report - Components Table\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Database:** ${SUPABASE_URL}\n\n`;
    report += '---\n\n';

    if (schema && Array.isArray(schema)) {
      report += '## Components Table Columns\n\n';
      report += '| Column Name | Data Type | Nullable | Default | Notes |\n';
      report += '|-------------|-----------|----------|---------|-------|\n';

      schema.forEach(col => {
        const dataType = col.character_maximum_length
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const nullable = col.is_nullable === 'YES' ? 'Yes' : 'No';
        const defaultVal = col.column_default || '-';

        report += `| ${col.column_name} | ${dataType} | ${nullable} | ${defaultVal} | |\n`;
      });

      report += '\n';
    }

    if (components && Array.isArray(components) && components.length > 0) {
      report += '## Sample Data\n\n';
      report += 'First component in database:\n\n';
      report += '```json\n';
      report += JSON.stringify(components[0], null, 2);
      report += '\n```\n\n';

      report += `**Total columns in sample:** ${Object.keys(components[0]).length}\n\n`;
      report += '**Available columns:**\n';
      Object.keys(components[0]).forEach(key => {
        const value = components[0][key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        report += `- \`${key}\` (${type})\n`;
      });
    }

    // Write report
    const outputPath = './docs/COMPONENTS_TABLE_SCHEMA.md';
    fs.writeFileSync(outputPath, report, 'utf-8');

    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Report saved to: ${outputPath}`);
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
