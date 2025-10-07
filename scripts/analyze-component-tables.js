#!/usr/bin/env node

/**
 * Component Tables Analysis Script
 * Focused analysis on all component-related tables in Supabase
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

// Component-related tables to analyze
const componentTables = [
  'components',
  'component_materials',
  'component_hardware', 
  'component_material_costs',
  'component_total_costs',
  'component_metadata',
  'component_room_types',
  'component_material_finishes'
];

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

async function getTableSample(tableName, limit = 5) {
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

async function analyzeTableStructure(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.warn(`⚠️  Could not get structure for ${tableName}: ${error.message}`);
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    return Object.keys(data[0]);
  } catch (err) {
    console.warn(`⚠️  Error getting structure for ${tableName}: ${err.message}`);
    return null;
  }
}

async function checkDataQuality(tableName, sampleData) {
  const issues = [];
  
  if (!sampleData || sampleData.length === 0) {
    return issues;
  }
  
  const columns = Object.keys(sampleData[0]);
  
  // Check for null/empty values in critical fields
  sampleData.forEach((row, index) => {
    columns.forEach(column => {
      const value = row[column];
      
      // Check for null values in critical fields
      if (value === null || value === undefined) {
        if (['id', 'component_id', 'name'].includes(column)) {
          issues.push(`Row ${index + 1}: ${column} is null`);
        }
      }
      
      // Check for empty strings in critical fields
      if (typeof value === 'string' && value.trim() === '') {
        if (['name', 'component_id'].includes(column)) {
          issues.push(`Row ${index + 1}: ${column} is empty string`);
        }
      }
      
      // Check for invalid UUIDs
      if (column.includes('id') && typeof value === 'string') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value) && value.length > 0) {
          issues.push(`Row ${index + 1}: ${column} has invalid UUID format`);
        }
      }
      
      // Check for negative numbers where they shouldn't be
      if (typeof value === 'number' && value < 0) {
        if (['width', 'depth', 'height', 'cost', 'price'].includes(column)) {
          issues.push(`Row ${index + 1}: ${column} has negative value: ${value}`);
        }
      }
    });
  });
  
  return issues;
}

async function checkForeignKeyRelationships(tableName, sampleData) {
  const relationships = [];
  
  if (!sampleData || sampleData.length === 0) {
    return relationships;
  }
  
  // Check component_id references
  if (tableName !== 'components' && sampleData[0].component_id) {
    try {
      const { data: componentData, error } = await supabase
        .from('components')
        .select('id')
        .eq('id', sampleData[0].component_id)
        .limit(1);
      
      if (error) {
        relationships.push(`Foreign key check failed: ${error.message}`);
      } else if (!componentData || componentData.length === 0) {
        relationships.push(`Orphaned component_id: ${sampleData[0].component_id} not found in components table`);
      }
    } catch (err) {
      relationships.push(`Foreign key check error: ${err.message}`);
    }
  }
  
  return relationships;
}

async function analyzeComponentTables() {
  console.log('🔍 Starting Component Tables Analysis...\n');
  
  const analysis = {
    timestamp: new Date().toISOString(),
    tables: {}
  };
  
  for (const tableName of componentTables) {
    console.log(`📋 Analyzing table: ${tableName}`);
    
    const rowCount = await getTableRowCount(tableName);
    const sampleData = await getTableSample(tableName);
    const structure = await analyzeTableStructure(tableName);
    const dataQualityIssues = await checkDataQuality(tableName, sampleData);
    const foreignKeyIssues = await checkForeignKeyRelationships(tableName, sampleData);
    
    analysis.tables[tableName] = {
      row_count: rowCount,
      has_data: rowCount > 0,
      structure: structure,
      sample_data: sampleData,
      data_quality_issues: dataQualityIssues,
      foreign_key_issues: foreignKeyIssues,
      data_quality_score: calculateDataQualityScore(dataQualityIssues, rowCount),
      integration_status: getIntegrationStatus(tableName)
    };
    
    console.log(`   ✅ ${rowCount} rows, ${structure ? structure.length : 0} columns`);
    if (dataQualityIssues.length > 0) {
      console.log(`   ⚠️  ${dataQualityIssues.length} data quality issues`);
    }
    if (foreignKeyIssues.length > 0) {
      console.log(`   ⚠️  ${foreignKeyIssues.length} foreign key issues`);
    }
  }
  
  // Save detailed analysis
  const outputPath = path.join(process.cwd(), 'docs', 'Positioning fix', 'COMPONENT_TABLES_ANALYSIS.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  
  console.log(`\n💾 Analysis saved to: ${outputPath}`);
  
  // Generate summary report
  const summary = generateComponentSummary(analysis);
  const summaryPath = path.join(process.cwd(), 'docs', 'Positioning fix', 'COMPONENT_TABLES_SUMMARY.md');
  fs.writeFileSync(summaryPath, summary);
  
  console.log(`📝 Summary saved to: ${summaryPath}`);
  
  return analysis;
}

function calculateDataQualityScore(issues, rowCount) {
  if (rowCount === 0) return 'N/A';
  if (issues.length === 0) return 'Excellent';
  if (issues.length <= rowCount * 0.1) return 'Good';
  if (issues.length <= rowCount * 0.2) return 'Fair';
  return 'Poor';
}

function getIntegrationStatus(tableName) {
  // Based on our previous analysis
  const integrationMap = {
    'components': 'FULLY_INTEGRATED',
    'component_materials': 'NOT_INTEGRATED',
    'component_hardware': 'NOT_INTEGRATED',
    'component_material_costs': 'NOT_INTEGRATED',
    'component_total_costs': 'NOT_INTEGRATED',
    'component_metadata': 'NOT_INTEGRATED',
    'component_room_types': 'NOT_INTEGRATED',
    'component_material_finishes': 'NOT_INTEGRATED'
  };
  
  return integrationMap[tableName] || 'UNKNOWN';
}

function generateComponentSummary(analysis) {
  const tables = analysis.tables;
  
  let summary = `# Component Tables Analysis Summary

## Overview
- **Analysis Date**: ${analysis.timestamp}
- **Tables Analyzed**: ${Object.keys(tables).length}
- **Tables with Data**: ${Object.values(tables).filter(t => t.has_data).length}
- **Empty Tables**: ${Object.values(tables).filter(t => !t.has_data).length}

## Table Analysis

| Table Name | Rows | Columns | Data Quality | Integration | Issues |
|------------|------|---------|--------------|-------------|---------|
`;

  Object.entries(tables).forEach(([name, info]) => {
    const issues = info.data_quality_issues.length + info.foreign_key_issues.length;
    summary += `| \`${name}\` | ${info.row_count} | ${info.structure ? info.structure.length : 0} | ${info.data_quality_score} | ${info.integration_status} | ${issues} |
`;
  });

  summary += `
## Detailed Analysis

`;

  Object.entries(tables).forEach(([name, info]) => {
    summary += `### \`${name}\` (${info.row_count} rows)

**Integration Status**: ${info.integration_status}
**Data Quality**: ${info.data_quality_score}
**Columns**: ${info.structure ? info.structure.join(', ') : 'Unknown'}

`;

    if (info.data_quality_issues.length > 0) {
      summary += `**Data Quality Issues** (${info.data_quality_issues.length}):
`;
      info.data_quality_issues.forEach(issue => {
        summary += `- ${issue}
`;
      });
      summary += `
`;
    }

    if (info.foreign_key_issues.length > 0) {
      summary += `**Foreign Key Issues** (${info.foreign_key_issues.length}):
`;
      info.foreign_key_issues.forEach(issue => {
        summary += `- ${issue}
`;
      });
      summary += `
`;
    }

    if (info.sample_data && info.sample_data.length > 0) {
      summary += `**Sample Data**:
\`\`\`json
${JSON.stringify(info.sample_data[0], null, 2)}
\`\`\`

`;
    }
  });

  summary += `
## Key Findings

### Tables with Data
`;

  const tablesWithData = Object.entries(tables).filter(([_, info]) => info.has_data);
  tablesWithData.forEach(([name, info]) => {
    summary += `- **${name}**: ${info.row_count} rows, ${info.data_quality_score} quality
`;
  });

  summary += `
### Empty Tables
`;

  const emptyTables = Object.entries(tables).filter(([_, info]) => !info.has_data);
  emptyTables.forEach(([name, info]) => {
    summary += `- **${name}**: ${info.integration_status}
`;
  });

  summary += `
### Data Quality Issues
`;

  const tablesWithIssues = Object.entries(tables).filter(([_, info]) => 
    info.data_quality_issues.length > 0 || info.foreign_key_issues.length > 0
  );

  if (tablesWithIssues.length === 0) {
    summary += `- No data quality issues found
`;
  } else {
    tablesWithIssues.forEach(([name, info]) => {
      const totalIssues = info.data_quality_issues.length + info.foreign_key_issues.length;
      summary += `- **${name}**: ${totalIssues} issues
`;
    });
  }

  summary += `
## Recommendations

### Immediate Actions
`;

  const criticalIssues = Object.entries(tables).filter(([_, info]) => 
    info.data_quality_issues.length > 0 || info.foreign_key_issues.length > 0
  );

  if (criticalIssues.length > 0) {
    summary += `1. **Fix data quality issues** in tables with problems
`;
  }

  const notIntegrated = Object.entries(tables).filter(([_, info]) => 
    info.integration_status === 'NOT_INTEGRATED' && info.has_data
  );

  if (notIntegrated.length > 0) {
    summary += `2. **Integrate unused tables** with data:
`;
    notIntegrated.forEach(([name, info]) => {
      summary += `   - ${name} (${info.row_count} rows)
`;
    });
  }

  const emptyNeeded = Object.entries(tables).filter(([_, info]) => 
    info.integration_status === 'NOT_INTEGRATED' && !info.has_data
  );

  if (emptyNeeded.length > 0) {
    summary += `3. **Populate empty tables** needed for functionality:
`;
    emptyNeeded.forEach(([name, info]) => {
      summary += `   - ${name}
`;
    });
  }

  summary += `
### Integration Priority
1. **component_materials** - Material relationships (${tables.component_materials?.row_count || 0} rows)
2. **component_hardware** - Hardware relationships (${tables.component_hardware?.row_count || 0} rows)
3. **component_material_costs** - Cost calculations (${tables.component_material_costs?.row_count || 0} rows)
4. **component_total_costs** - Total costs (${tables.component_total_costs?.row_count || 0} rows)
5. **component_room_types** - Room relationships (populate)
6. **component_metadata** - Extended metadata (populate)
7. **component_material_finishes** - Finish relationships (populate)

`;

  return summary;
}

// Run the analysis
analyzeComponentTables()
  .then(() => {
    console.log('\n✅ Component tables analysis completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Component tables analysis failed:', error);
    process.exit(1);
  });
