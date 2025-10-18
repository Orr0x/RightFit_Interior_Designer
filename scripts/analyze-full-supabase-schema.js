/**
 * Full Supabase Schema Analysis
 * 
 * Purpose: Pull complete database schema including:
 * - All tables with row counts
 * - Column definitions (name, type, nullable, default)
 * - Sample data (first 5 rows per table)
 * 
 * This gives us a complete picture of what's actually in production.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
}

loadEnvFile();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get all tables in public schema
 */
async function getAllTables() {
  const { data, error } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .order('tablename');
  
  if (error) throw error;
  return data.map(row => row.tablename);
}

/**
 * Get row count and sample data for a table
 */
async function getTableData(tableName) {
  try {
    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.warn(`⚠️  Could not get row count for ${tableName}: ${countError.message}`);
    }

    // Get sample data (first 5 rows)
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (sampleError) {
      console.warn(`⚠️  Could not get sample data for ${tableName}: ${sampleError.message}`);
    }

    // Infer columns from sample data
    const columns = sampleData && sampleData.length > 0 
      ? Object.keys(sampleData[0]).map(key => ({
          column_name: key,
          data_type: typeof sampleData[0][key],
          sample_value: sampleData[0][key]
        }))
      : [];

    return {
      row_count: count || 0,
      has_data: (count || 0) > 0,
      columns: columns,
      column_count: columns.length,
      sample_data: sampleData || [],
      sample_count: (sampleData || []).length
    };
  } catch (error) {
    console.error(`❌ Error analyzing ${tableName}:`, error.message);
    return {
      row_count: 0,
      has_data: false,
      columns: [],
      column_count: 0,
      sample_data: [],
      error: error.message
    };
  }
}

/**
 * Main analysis function
 */
async function analyzeFullSchema() {
  console.log('🔍 Starting Full Supabase Schema Analysis...\n');
  
  const analysis = {
    analysis_timestamp: new Date().toISOString(),
    supabase_url: supabaseUrl,
    database_summary: {
      total_tables: 0,
      tables_with_data: 0,
      empty_tables: 0,
      total_rows: 0,
      total_columns: 0
    },
    tables: {}
  };

  // Get all tables
  console.log('📋 Fetching table list...');
  const allTables = await getAllTables();
  analysis.database_summary.total_tables = allTables.length;
  console.log(`✅ Found ${allTables.length} tables\n`);

  // Analyze each table
  let processedCount = 0;
  for (const tableName of allTables) {
    processedCount++;
    console.log(`[${processedCount}/${allTables.length}] Analyzing: ${tableName}`);
    
    const tableData = await getTableData(tableName);
    
    analysis.tables[tableName] = tableData;

    // Update summary
    analysis.database_summary.total_columns += tableData.column_count;
    analysis.database_summary.total_rows += tableData.row_count;
    
    if (tableData.has_data) {
      analysis.database_summary.tables_with_data++;
    } else {
      analysis.database_summary.empty_tables++;
    }

    const status = tableData.has_data ? '✅ DATA' : '⚪ EMPTY';
    console.log(`   └─ ${tableData.row_count} rows, ${tableData.column_count} cols ${status}\n`);
  }

  return analysis;
}

/**
 * Generate comprehensive markdown report
 */
function generateMarkdownReport(analysis) {
  const timestamp = new Date().toLocaleString();
  let md = `# 🗄️ Complete Supabase Schema Analysis\n\n`;
  md += `**Generated**: ${timestamp}\n`;
  md += `**Database**: ${analysis.supabase_url}\n\n`;

  md += `---\n\n`;
  md += `## 📊 Database Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Tables | ${analysis.database_summary.total_tables} |\n`;
  md += `| Tables with Data | ${analysis.database_summary.tables_with_data} |\n`;
  md += `| Empty Tables | ${analysis.database_summary.empty_tables} |\n`;
  md += `| Total Rows | ${analysis.database_summary.total_rows.toLocaleString()} |\n`;
  md += `| Total Columns | ${analysis.database_summary.total_columns} |\n`;
  md += `| Data Population | ${((analysis.database_summary.tables_with_data / analysis.database_summary.total_tables) * 100).toFixed(1)}% |\n\n`;

  // Sort tables by row count (descending)
  const sortedTables = Object.entries(analysis.tables)
    .sort(([, a], [, b]) => b.row_count - a.row_count);

  md += `---\n\n`;
  md += `## 📋 All Tables (Sorted by Row Count)\n\n`;
  md += `| # | Table Name | Rows | Columns | Status |\n`;
  md += `|---|------------|------|---------|--------|\n`;
  
  sortedTables.forEach(([tableName, table], index) => {
    const status = table.has_data ? '✅' : '⚪';
    md += `| ${index + 1} | \`${tableName}\` | ${table.row_count.toLocaleString()} | ${table.column_count} | ${status} |\n`;
  });

  md += `\n---\n\n`;
  md += `## 🔍 Detailed Analysis by Category\n\n`;

  // Group tables by category
  const categories = {
    'Component System': [],
    '3D Models': [],
    'Materials & Costs': [],
    'Room & Design': [],
    'User Management': [],
    'Content Management': [],
    'Regional & Localization': [],
    'Configuration': [],
    'Other': []
  };

  sortedTables.forEach(([tableName, table]) => {
    if (tableName.includes('component')) {
      categories['Component System'].push([tableName, table]);
    } else if (tableName.includes('3d') || tableName.includes('model') || tableName.includes('appliance_3d') || tableName.includes('furniture_3d')) {
      categories['3D Models'].push([tableName, table]);
    } else if (tableName.includes('material') || tableName.includes('cost') || tableName.includes('hardware') || tableName.includes('pricing')) {
      categories['Materials & Costs'].push([tableName, table]);
    } else if (tableName.includes('room') || tableName.includes('design') || tableName.includes('project')) {
      categories['Room & Design'].push([tableName, table]);
    } else if (tableName.includes('user') || tableName.includes('profile') || tableName.includes('tier')) {
      categories['User Management'].push([tableName, table]);
    } else if (tableName.includes('blog') || tableName.includes('post') || tableName.includes('media')) {
      categories['Content Management'].push([tableName, table]);
    } else if (tableName.includes('region') || tableName.includes('translation')) {
      categories['Regional & Localization'].push([tableName, table]);
    } else if (tableName.includes('config') || tableName.includes('feature_flag') || tableName.includes('ab_test')) {
      categories['Configuration'].push([tableName, table]);
    } else {
      categories['Other'].push([tableName, table]);
    }
  });

  Object.entries(categories).forEach(([category, tables]) => {
    if (tables.length > 0) {
      md += `### ${category} (${tables.length} tables)\n\n`;
      md += `| Table Name | Rows | Columns | Status |\n`;
      md += `|------------|------|---------|--------|\n`;
      
      tables.forEach(([tableName, table]) => {
        const status = table.has_data ? '✅' : '⚪';
        md += `| \`${tableName}\` | ${table.row_count.toLocaleString()} | ${table.column_count} | ${status} |\n`;
      });
      md += `\n`;
    }
  });

  md += `---\n\n`;
  md += `## 📝 Table Details with Sample Data\n\n`;

  sortedTables.forEach(([tableName, table]) => {
    md += `### \`${tableName}\`\n\n`;
    md += `**Rows**: ${table.row_count.toLocaleString()} | **Columns**: ${table.column_count} | **Status**: ${table.has_data ? '✅ HAS DATA' : '⚪ EMPTY'}\n\n`;

    if (table.columns.length > 0) {
      md += `**Columns**:\n`;
      table.columns.forEach(col => {
        const sampleVal = col.sample_value !== null && col.sample_value !== undefined 
          ? ` (e.g., \`${String(col.sample_value).substring(0, 50)}${String(col.sample_value).length > 50 ? '...' : ''}\`)`
          : '';
        md += `- \`${col.column_name}\` (${col.data_type})${sampleVal}\n`;
      });
      md += `\n`;
    }

    if (table.sample_data && table.sample_data.length > 0) {
      md += `**Sample Data** (first ${table.sample_data.length} rows):\n\n`;
      md += `\`\`\`json\n`;
      md += JSON.stringify(table.sample_data.slice(0, 2), null, 2); // Only show 2 rows for brevity
      md += `\n\`\`\`\n\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

/**
 * Generate migration comparison
 */
function generateMigrationComparison(analysis) {
  let md = `# 🔄 Migration vs Reality Comparison\n\n`;
  md += `**Generated**: ${new Date().toLocaleString()}\n\n`;
  
  md += `## 🎯 Expected vs Actual Status\n\n`;
  
  const checks = [
    { table: 'feature_flags', expected: 'Populated with 4+ flags', migration: '20250129000003' },
    { table: 'app_configuration', expected: 'Populated with 50+ config values', migration: '20250129000005' },
    { table: 'component_3d_models', expected: 'Populated with 168+ models', migration: '20250129000006' },
    { table: 'component_3d_geometries', expected: 'Populated with geometry data', migration: '20250129000006' },
    { table: 'component_3d_materials', expected: 'Populated with material data', migration: '20250129000006' },
    { table: 'components', expected: 'Populated with 500+ components', migration: 'Multiple' },
    { table: 'component_materials', expected: 'Populated with material data', migration: 'Phase 1' },
    { table: 'component_hardware', expected: 'Populated with hardware data', migration: 'Phase 1' },
    { table: 'ab_test_results', expected: 'Empty (fills during testing)', migration: '20250129000004' }
  ];

  md += `| Table | Expected State | Migration | Actual Rows | Status |\n`;
  md += `|-------|----------------|-----------|-------------|--------|\n`;
  
  checks.forEach(check => {
    const table = analysis.tables[check.table];
    if (table) {
      let status;
      if (check.expected.includes('Empty') && table.row_count === 0) {
        status = '✅ CORRECT';
      } else if (check.expected.includes('Populated') && table.row_count > 0) {
        status = '✅ POPULATED';
      } else if (check.expected.includes('Populated') && table.row_count === 0) {
        status = '❌ EMPTY (SHOULD HAVE DATA)';
      } else {
        status = '⚠️ CHECK NEEDED';
      }
      md += `| \`${check.table}\` | ${check.expected} | ${check.migration} | ${table.row_count} | ${status} |\n`;
    } else {
      md += `| \`${check.table}\` | ${check.expected} | ${check.migration} | - | ⚠️ TABLE NOT FOUND |\n`;
    }
  });

  md += `\n## 🚨 Critical Findings\n\n`;
  
  const criticalTables = checks.filter(check => {
    const table = analysis.tables[check.table];
    return table && check.expected.includes('Populated') && table.row_count === 0;
  });

  if (criticalTables.length > 0) {
    md += `**EMPTY TABLES THAT SHOULD BE POPULATED**:\n\n`;
    criticalTables.forEach(check => {
      md += `- ❌ \`${check.table}\` - Expected: ${check.expected}\n`;
    });
  } else {
    md += `✅ All expected tables are populated or correctly empty!\n`;
  }

  md += `\n`;
  return md;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('  FULL SUPABASE SCHEMA ANALYSIS');
    console.log('═══════════════════════════════════════════════════\n');

    const analysis = await analyzeFullSchema();

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'docs', 'code and DB analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save detailed JSON
    const jsonPath = path.join(outputDir, 'FULL_SUPABASE_SCHEMA.json');
    fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));
    console.log(`\n✅ Detailed JSON saved to: ${jsonPath}`);

    // Generate markdown report
    const mdReport = generateMarkdownReport(analysis);
    const mdPath = path.join(outputDir, 'FULL_SUPABASE_SCHEMA_REPORT.md');
    fs.writeFileSync(mdPath, mdReport);
    console.log(`✅ Markdown report saved to: ${mdPath}`);

    // Generate migration comparison
    const comparisonReport = generateMigrationComparison(analysis);
    const comparisonPath = path.join(outputDir, 'MIGRATION_VS_REALITY.md');
    fs.writeFileSync(comparisonPath, comparisonReport);
    console.log(`✅ Migration comparison saved to: ${comparisonPath}`);

    // Print summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ANALYSIS COMPLETE');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(`📊 Total Tables: ${analysis.database_summary.total_tables}`);
    console.log(`✅ Tables with Data: ${analysis.database_summary.tables_with_data}`);
    console.log(`⚪ Empty Tables: ${analysis.database_summary.empty_tables}`);
    console.log(`📈 Total Rows: ${analysis.database_summary.total_rows.toLocaleString()}`);
    console.log(`📋 Total Columns: ${analysis.database_summary.total_columns}`);
    console.log(`\n🎯 Data Population: ${((analysis.database_summary.tables_with_data / analysis.database_summary.total_tables) * 100).toFixed(1)}%`);
    console.log('\n✨ All reports generated successfully!\n');

  } catch (error) {
    console.error('\n❌ Fatal error during analysis:', error);
    process.exit(1);
  }
}

main();




