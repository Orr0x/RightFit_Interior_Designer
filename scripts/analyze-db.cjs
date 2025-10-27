// Database Analysis Script (CommonJS version)
// Analyzes current Supabase database state before Story 1.1
// Run with: node scripts/analyze-db.cjs

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// Parse environment variables (handle Windows line endings)
envContent.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();

  // Skip empty lines and comments
  if (!trimmed || trimmed.startsWith('#')) {
    return;
  }

  // Match KEY=VALUE pattern
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Expected to find: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('Found variables:', Object.keys(envVars));
  process.exit(1);
}

console.log(`\n🔗 Connecting to: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES_TO_ANALYZE = [
  // Component tables (unified)
  'components',

  // 3D and render tables
  'component_3d_models',
  'component_2d_renders',
  '3d_models',
  'model_3d',
  'geometry_parts',

  // Room and project tables
  'room_designs',
  'projects',
  'room_geometry_templates',
  'room_type_templates',

  // Configuration tables
  'app_configuration',
  'feature_flags',

  // A/B testing tables
  'ab_test_results',
  'ab_test_sessions',

  // User and profile tables
  'profiles',
  'user_preferences',

  // Color and material tables
  'farrow_ball_colors',
  'material_definitions',

  // Additional tables
  'design_styles',
  'cabinet_styles'
];

async function analyzeTable(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { tableName, rowCount: null, error: error.message };
    }

    return { tableName, rowCount: count, error: null };
  } catch (err) {
    return { tableName, rowCount: null, error: err.message };
  }
}

async function getSampleRows(tableName, limit = 3) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);

    if (error) {
      return { tableName, sample: null, error: error.message };
    }

    return { tableName, sample: data, error: null };
  } catch (err) {
    return { tableName, sample: null, error: err.message };
  }
}

async function checkSinkComponents() {
  console.log('\n🔍 Checking for Sink Components...\n');
  console.log('='.repeat(80));

  try {
    // Check if any sink components exist
    const { data: sinks, error } = await supabase
      .from('components')
      .select('*')
      .or('type.eq.sink,category.ilike.%sink%,name.ilike.%sink%')
      .limit(50);

    if (error) {
      console.log('❌ Error querying sinks:', error.message);
      return;
    }

    console.log(`Found ${sinks?.length || 0} sink components in database:\n`);

    if (sinks && sinks.length > 0) {
      sinks.forEach(sink => {
        console.log(`  ✅ ${sink.name} (${sink.component_id})`);
        console.log(`     Type: ${sink.type}, Category: ${sink.category}`);
      });
    } else {
      console.log('  ⚠️  NO sink components found in database');
      console.log('  → The hardcoded getSinkComponents() may need to be migrated');
    }

    console.log('\n' + '='.repeat(80));
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

async function main() {
  console.log('🔍 Analyzing Supabase Database...\n');
  console.log('='.repeat(80));

  const results = {
    timestamp: new Date().toISOString(),
    tables: [],
    summary: {
      totalTables: 0,
      emptyTables: [],
      populatedTables: [],
      errorTables: []
    }
  };

  // Analyze each table
  for (const tableName of TABLES_TO_ANALYZE) {
    process.stdout.write(`Analyzing ${tableName.padEnd(35)}...`);

    const analysis = await analyzeTable(tableName);
    results.tables.push(analysis);
    results.summary.totalTables++;

    if (analysis.error) {
      results.summary.errorTables.push(tableName);
      console.log(` ❌ ERROR: ${analysis.error}`);
    } else if (analysis.rowCount === 0) {
      results.summary.emptyTables.push(tableName);
      console.log(` ⚠️  EMPTY (0 rows)`);
    } else {
      results.summary.populatedTables.push(tableName);
      console.log(` ✅ ${String(analysis.rowCount).padStart(6)} rows`);

      // Get sample data for small populated tables
      if (analysis.rowCount > 0 && analysis.rowCount < 1000) {
        const sample = await getSampleRows(tableName, 3);
        analysis.sampleData = sample.sample;
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY:\n');
  console.log(`Total Tables Analyzed: ${results.summary.totalTables}`);
  console.log(`Populated Tables: ${results.summary.populatedTables.length}`);
  console.log(`Empty Tables: ${results.summary.emptyTables.length}`);
  console.log(`Error Tables: ${results.summary.errorTables.length}`);

  if (results.summary.emptyTables.length > 0) {
    console.log('\n⚠️  EMPTY TABLES (Never Used - Potential Future Features):');
    results.summary.emptyTables.forEach(table => console.log(`   - ${table}`));
  }

  if (results.summary.errorTables.length > 0) {
    console.log('\n❌ TABLES WITH ERRORS (May not exist):');
    results.summary.errorTables.forEach(table => console.log(`   - ${table}`));
  }

  // Save detailed results to file
  const outputPath = 'docs/archive/database-analysis-2025-10-26.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Detailed analysis saved to: ${outputPath}\n`);

  // Create human-readable report
  const reportPath = 'docs/archive/database-analysis-report-2025-10-26.md';
  let report = `# Database Analysis Report\n\n`;
  report += `**Date**: ${new Date().toISOString()}\n`;
  report += `**Purpose**: Baseline analysis before Story 1.1 (TypeScript type regeneration)\n\n`;
  report += `---\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Tables**: ${results.summary.totalTables}\n`;
  report += `- **Populated**: ${results.summary.populatedTables.length}\n`;
  report += `- **Empty**: ${results.summary.emptyTables.length}\n`;
  report += `- **Errors**: ${results.summary.errorTables.length}\n\n`;

  report += `## Table Details\n\n`;
  report += `| Table Name | Row Count | Status |\n`;
  report += `|------------|-----------|--------|\n`;

  results.tables
    .sort((a, b) => {
      if (a.rowCount === null) return 1;
      if (b.rowCount === null) return -1;
      return b.rowCount - a.rowCount;
    })
    .forEach(table => {
      const status = table.error ? '❌ Error' : table.rowCount === 0 ? '⚠️ Empty' : table.rowCount === null ? '⚠️ Unknown' : '✅ Active';
      const count = table.error || table.rowCount === null ? 'N/A' : table.rowCount.toLocaleString();
      report += `| ${table.tableName} | ${count} | ${status} |\n`;
    });

  if (results.summary.emptyTables.length > 0) {
    report += `\n## Empty Tables (Future Features)\n\n`;
    report += `These tables exist but have never been used:\n\n`;
    results.summary.emptyTables.forEach(table => {
      report += `- **${table}** - Added for future feature, never populated\n`;
    });
    report += `\n**Recommendation**: Consider removing these from TypeScript types or marking them optional.\n`;
  }

  if (results.summary.errorTables.length > 0) {
    report += `\n## Tables With Errors\n\n`;
    report += `These tables may not exist or have permission issues:\n\n`;
    results.summary.errorTables.forEach(table => {
      const error = results.tables.find(t => t.tableName === table)?.error;
      report += `- **${table}** - ${error}\n`;
    });
    report += `\n**Recommendation**: These tables should be removed from analysis list if they don't exist.\n`;
  }

  report += `\n## Next Steps for Story 1.1\n\n`;
  report += `1. ✅ Baseline types generated: \`src/types/database-baseline-2025-10-26.ts\`\n`;
  report += `2. ⏳ Regenerate types: \`npx supabase gen types typescript --linked > src/types/supabase.ts\`\n`;
  report += `3. ⏳ Compare baseline vs new types to identify changes\n`;
  report += `4. ⏳ Update imports to use new types\n`;
  report += `5. ⏳ Run \`npm run type-check\` to verify no breakages\n`;

  fs.writeFileSync(reportPath, report);
  console.log(`✅ Human-readable report saved to: ${reportPath}\n`);

  // Check for sink components
  await checkSinkComponents();
}

main().catch(console.error);
