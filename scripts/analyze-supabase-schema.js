#!/usr/bin/env node

/**
 * Supabase Schema Analysis Script
 * Pulls complete schema from Supabase and analyzes table structures
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
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
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

async function getTableSchema(tableName) {
  try {
    // Get table structure from information_schema
    const { data, error } = await supabase.rpc('get_table_schema', { table_name: tableName });
    
    if (error) {
      console.warn(`⚠️  Could not get schema for ${tableName}: ${error.message}`);
      return null;
    }
    
    return data;
  } catch (err) {
    console.warn(`⚠️  Error getting schema for ${tableName}: ${err.message}`);
    return null;
  }
}

async function getTableRowCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.warn(`⚠️  Could not get count for ${tableName}: ${error.message}`);
      return 'Unknown';
    }
    
    return count || 0;
  } catch (err) {
    console.warn(`⚠️  Error getting count for ${tableName}: ${err.message}`);
    return 'Error';
  }
}

async function getTableSample(tableName, limit = 3) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);
    
    if (error) {
      console.warn(`⚠️  Could not get sample for ${tableName}: ${error.message}`);
      return null;
    }
    
    return data;
  } catch (err) {
    console.warn(`⚠️  Error getting sample for ${tableName}: ${err.message}`);
    return null;
  }
}

async function getAllTables() {
  try {
    // Get all tables from information_schema
    const { data, error } = await supabase.rpc('get_all_tables');
    
    if (error) {
      console.warn(`⚠️  Could not get tables list: ${error.message}`);
      // Fallback: try to get tables from a known table
      return await getTablesFallback();
    }
    
    return data;
  } catch (err) {
    console.warn(`⚠️  Error getting tables: ${err.message}`);
    return await getTablesFallback();
  }
}

async function getTablesFallback() {
  // Known tables from the images
  const knownTables = [
    'active_subscriptions', 'appliance_3d_types', 'blog_categories', 'blog_post_categories',
    'blog_posts', 'component_hardware', 'component_material_costs', 'component_material_finishes',
    'component_materials', 'component_metadata', 'component_room_types', 'component_total_costs',
    'components', 'designs', 'designs_backup', 'egger_availability', 'egger_categories',
    'egger_color_families', 'egger_combinations', 'egger_decors', 'egger_images',
    'egger_interior_matches', 'egger_no_combinations', 'egger_textures', 'farrow_ball_categories',
    'farrow_ball_color_families', 'farrow_ball_color_schemes', 'farrow_ball_finishes',
    'farrow_ball_images', 'furniture_3d_models', 'hardware', 'keyboard_shortcuts',
    'material_finishes', 'materials', 'media_files', 'model_3d', 'model_3d_config',
    'model_3d_patterns', 'model_3d_variants', 'paint_finishes', 'profiles', 'projects',
    'regional_material_pricing', 'regional_revenue', 'regional_tier_pricing', 'regions',
    'room_designs', 'room_type_templates', 'room_types', 'room_types_localized',
    'translations', 'ui_configurations', 'user_preferences_summary', 'user_tier_assignments',
    'user_tiers', 'user_ui_preferences'
  ];
  
  return knownTables.map(name => ({ table_name: name }));
}

async function analyzeDatabase() {
  console.log('🔍 Starting Supabase Schema Analysis...\n');
  
  try {
    // Get all tables
    const tables = await getAllTables();
    console.log(`📊 Found ${tables.length} tables to analyze\n`);
    
    const analysis = {
      timestamp: new Date().toISOString(),
      total_tables: tables.length,
      tables: {}
    };
    
    // Analyze each table
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`📋 Analyzing table: ${tableName}`);
      
      const rowCount = await getTableRowCount(tableName);
      const sample = await getTableSample(tableName);
      
      analysis.tables[tableName] = {
        row_count: rowCount,
        sample_data: sample,
        has_data: rowCount > 0,
        columns: sample && sample.length > 0 ? Object.keys(sample[0]) : []
      };
      
      console.log(`   ✅ ${rowCount} rows, ${analysis.tables[tableName].columns.length} columns`);
    }
    
    // Save analysis
    const outputPath = path.join(process.cwd(), 'docs', 'Positioning fix', 'SUPABASE_SCHEMA_ANALYSIS.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    
    console.log(`\n💾 Analysis saved to: ${outputPath}`);
    
    // Generate summary
    const summary = generateSummary(analysis);
    const summaryPath = path.join(process.cwd(), 'docs', 'Positioning fix', 'SUPABASE_SCHEMA_SUMMARY.md');
    fs.writeFileSync(summaryPath, summary);
    
    console.log(`📝 Summary saved to: ${summaryPath}`);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  }
}

function generateSummary(analysis) {
  const tables = analysis.tables;
  const tablesWithData = Object.entries(tables).filter(([_, info]) => info.has_data);
  const tablesWithoutData = Object.entries(tables).filter(([_, info]) => !info.has_data);
  
  let summary = `# Supabase Schema Analysis Summary

## Overview
- **Analysis Date**: ${analysis.timestamp}
- **Total Tables**: ${analysis.total_tables}
- **Tables with Data**: ${tablesWithData.length}
- **Empty Tables**: ${tablesWithoutData.length}

## Tables with Data (${tablesWithData.length})

| Table Name | Row Count | Columns | Sample Columns |
|------------|-----------|---------|----------------|
`;

  tablesWithData.forEach(([name, info]) => {
    const sampleCols = info.columns.slice(0, 5).join(', ') + (info.columns.length > 5 ? '...' : '');
    summary += `| \`${name}\` | ${info.row_count} | ${info.columns.length} | ${sampleCols} |\n`;
  });

  summary += `
## Empty Tables (${tablesWithoutData.length})

| Table Name | Purpose (Inferred) |
|------------|-------------------|
`;

  tablesWithoutData.forEach(([name, info]) => {
    const purpose = inferTablePurpose(name);
    summary += `| \`${name}\` | ${purpose} |\n`;
  });

  summary += `
## Key Findings

### High-Value Tables (Most Data)
`;

  const sortedByRows = tablesWithData.sort((a, b) => b[1].row_count - a[1].row_count);
  sortedByRows.slice(0, 10).forEach(([name, info]) => {
    summary += `- **${name}**: ${info.row_count} rows\n`;
  });

  summary += `
### System Categories

#### Component System
`;

  const componentTables = Object.keys(tables).filter(name => name.includes('component'));
  componentTables.forEach(name => {
    const info = tables[name];
    summary += `- **${name}**: ${info.row_count} rows\n`;
  });

  summary += `
#### 3D Model System
`;

  const modelTables = Object.keys(tables).filter(name => name.includes('3d') || name.includes('model'));
  modelTables.forEach(name => {
    const info = tables[name];
    summary += `- **${name}**: ${info.row_count} rows\n`;
  });

  summary += `
#### Material System
`;

  const materialTables = Object.keys(tables).filter(name => 
    name.includes('material') || name.includes('finish') || name.includes('paint')
  );
  materialTables.forEach(name => {
    const info = tables[name];
    summary += `- **${name}**: ${info.row_count} rows\n`;
  });

  summary += `
#### Regional/Localization System
`;

  const regionalTables = Object.keys(tables).filter(name => 
    name.includes('regional') || name.includes('translation') || name.includes('localized')
  );
  regionalTables.forEach(name => {
    const info = tables[name];
    summary += `- **${name}**: ${info.row_count} rows\n`;
  });

  summary += `
## Next Steps

1. **Focus on tables with data** - These are actively used
2. **Investigate empty tables** - May be for future features
3. **Check table relationships** - Look for foreign keys
4. **Analyze sample data** - Understand data structure
5. **Update application code** - Ensure all tables are properly integrated

## Data Population Priority

Based on row counts, prioritize populating these tables:
`;

  sortedByRows.slice(0, 5).forEach(([name, info], index) => {
    summary += `${index + 1}. **${name}** (${info.row_count} rows)\n`;
  });

  return summary;
}

function inferTablePurpose(tableName) {
  const purposes = {
    'component_': 'Component management',
    'model_3d': '3D model system',
    'material_': 'Material management',
    'regional_': 'Regional/localization',
    'user_': 'User management',
    'blog_': 'Content management',
    'egger_': 'EGGER product data',
    'farrow_ball': 'Farrow & Ball products',
    'room_': 'Room management',
    'design': 'Design data',
    'hardware': 'Hardware components',
    'media_': 'Media management',
    'ui_': 'UI configuration',
    'keyboard_': 'Keyboard shortcuts',
    'translation': 'Localization',
    'validation': 'Data validation'
  };
  
  for (const [prefix, purpose] of Object.entries(purposes)) {
    if (tableName.includes(prefix)) {
      return purpose;
    }
  }
  
  return 'Unknown purpose';
}

// Run the analysis
analyzeDatabase()
  .then(() => {
    console.log('\n✅ Schema analysis completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Schema analysis failed:', error);
    process.exit(1);
  });
