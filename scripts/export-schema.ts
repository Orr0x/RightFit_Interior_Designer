/**
 * Export complete database schema from Supabase
 * Run with: npx tsx scripts/export-schema.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportSchema() {
  console.log('🔍 Querying database schema...\n');

  const queries = {
    tables: `
      SELECT
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `,
    columns: `
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `,
    constraints: `
      SELECT
        tc.constraint_name,
        tc.table_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      LEFT JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name;
    `
  };

  let schemaReport = '# Database Schema Report\n\n';
  schemaReport += `**Generated:** ${new Date().toISOString()}\n`;
  schemaReport += `**Database:** ${supabaseUrl}\n\n`;
  schemaReport += '---\n\n';

  // Get tables
  const { data: tables, error: tablesError } = await supabase.rpc('execute_sql', {
    sql: queries.tables
  });

  if (tablesError) {
    console.error('❌ Error fetching tables:', tablesError);
  } else {
    schemaReport += '## Tables\n\n';
    if (tables && Array.isArray(tables)) {
      tables.forEach((table: any) => {
        schemaReport += `- **${table.table_name}** (${table.table_type})\n`;
      });
    }
    schemaReport += '\n---\n\n';
  }

  // Get columns
  const { data: columns, error: columnsError } = await supabase.rpc('execute_sql', {
    sql: queries.columns
  });

  if (columnsError) {
    console.error('❌ Error fetching columns:', columnsError);
  } else {
    schemaReport += '## Table Columns\n\n';
    if (columns && Array.isArray(columns)) {
      let currentTable = '';
      columns.forEach((col: any) => {
        if (col.table_name !== currentTable) {
          currentTable = col.table_name;
          schemaReport += `\n### ${currentTable}\n\n`;
          schemaReport += '| Column | Type | Nullable | Default |\n';
          schemaReport += '|--------|------|----------|----------|\n';
        }
        const nullable = col.is_nullable === 'YES' ? 'Yes' : 'No';
        const defaultVal = col.column_default || '-';
        const typeInfo = col.character_maximum_length
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        schemaReport += `| ${col.column_name} | ${typeInfo} | ${nullable} | ${defaultVal} |\n`;
      });
    }
    schemaReport += '\n---\n\n';
  }

  // Get constraints
  const { data: constraints, error: constraintsError } = await supabase.rpc('execute_sql', {
    sql: queries.constraints
  });

  if (constraintsError) {
    console.error('❌ Error fetching constraints:', constraintsError);
  } else {
    schemaReport += '## Constraints\n\n';
    if (constraints && Array.isArray(constraints)) {
      let currentTable = '';
      constraints.forEach((con: any) => {
        if (con.table_name !== currentTable) {
          currentTable = con.table_name;
          schemaReport += `\n### ${currentTable}\n\n`;
        }
        const foreignRef = con.foreign_table_name
          ? ` → ${con.foreign_table_name}.${con.foreign_column_name}`
          : '';
        schemaReport += `- **${con.constraint_name}** (${con.constraint_type}): ${con.column_name}${foreignRef}\n`;
      });
    }
  }

  // Write to file
  const outputPath = path.join(process.cwd(), 'docs', 'database_schema_latest.md');
  fs.writeFileSync(outputPath, schemaReport, 'utf-8');
  console.log(`\n✅ Schema exported to: ${outputPath}`);
}

exportSchema().catch(console.error);
