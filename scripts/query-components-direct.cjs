/**
 * Query components table directly from Supabase REST API
 * Run with: node scripts/query-components-direct.cjs
 */

const https = require('https');
const fs = require('fs');

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
    console.log('COMPONENTS TABLE SCHEMA ANALYSIS');
    console.log('═══════════════════════════════════════════════════\n');

    // Get first component to see structure
    console.log('🔍 Fetching sample component...\n');
    const components = await queryTable('components', 'select=*&limit=1');

    if (!components || components.length === 0) {
      console.error('❌ No components found in database');
      return;
    }

    const sampleComponent = components[0];
    const columns = Object.keys(sampleComponent);

    console.log('📊 Components Table Structure:\n');
    console.log(`Total Columns: ${columns.length}\n`);

    // Analyze each column
    let report = '# Components Table Schema - Live Database\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Database:** https://${SUPABASE_URL}\n`;
    report += `**Table:** components\n\n`;
    report += '---\n\n';

    report += '## Column Analysis\n\n';
    report += '| Column Name | Type | Sample Value | Notes |\n';
    report += '|-------------|------|--------------|-------|\n';

    columns.forEach(col => {
      const value = sampleComponent[col];
      const type = Array.isArray(value) ? 'array' : typeof value;
      let sampleValue = '';

      if (value === null) {
        sampleValue = 'null';
      } else if (type === 'array') {
        sampleValue = `[${value.length} items]`;
      } else if (type === 'object') {
        sampleValue = '{...}';
      } else if (typeof value === 'string' && value.length > 50) {
        sampleValue = value.substring(0, 50) + '...';
      } else {
        sampleValue = String(value);
      }

      report += `| ${col} | ${type} | ${sampleValue} | |\n`;

      console.log(`  ✓ ${col}: ${type}`);
      if (type === 'array' && value.length > 0) {
        console.log(`    └─ Sample: ${JSON.stringify(value[0])}`);
      } else if (type === 'object' && value) {
        console.log(`    └─ Keys: ${Object.keys(value).join(', ')}`);
      }
    });

    report += '\n---\n\n';
    report += '## Sample Component Data\n\n';
    report += '```json\n';
    report += JSON.stringify(sampleComponent, null, 2);
    report += '\n```\n\n';

    // Get component count
    console.log('\n📊 Querying component statistics...\n');
    const allComponents = await queryTable('components', 'select=component_id,type,category');
    console.log(`Total Components: ${allComponents.length}`);

    // Group by type
    const byType = {};
    const byCategory = {};
    allComponents.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });

    report += '## Component Statistics\n\n';
    report += `**Total Components:** ${allComponents.length}\n\n`;

    report += '### By Type\n\n';
    report += '| Type | Count |\n';
    report += '|------|-------|\n';
    Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      report += `| ${type} | ${count} |\n`;
      console.log(`  ${type}: ${count}`);
    });

    report += '\n### By Category\n\n';
    report += '| Category | Count |\n';
    report += '|----------|-------|\n';
    Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
      report += `| ${category} | ${count} |\n`;
    });

    report += '\n---\n\n';
    report += '## Key Findings\n\n';

    // Check for important columns
    const importantColumns = [
      'default_z_position',
      'elevation_height',
      'mount_type',
      'corner_configuration',
      'component_behavior',
      'plinth_height'
    ];

    report += '### Migration Status\n\n';
    importantColumns.forEach(col => {
      const exists = columns.includes(col);
      const hasData = exists && sampleComponent[col] !== null;
      const status = exists ? (hasData ? '✅' : '⚠️') : '❌';
      const note = exists ? (hasData ? 'Exists with data' : 'Exists but null') : 'Missing';

      report += `- **${col}**: ${status} ${note}\n`;
      console.log(`${status} ${col}: ${note}`);
    });

    // Write report
    const outputPath = './docs/COMPONENTS_TABLE_SCHEMA.md';
    fs.writeFileSync(outputPath, report, 'utf-8');

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`✅ Report saved to: ${outputPath}`);
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
