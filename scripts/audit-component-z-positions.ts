/**
 * Component Z Position Audit Script
 *
 * Purpose: Audit all 154+ components across room types and generate SQL migration
 *          to add `default_z_position` column with correct Z values.
 *
 * Story: 1.8 - Audit Component Library Z Positions
 * Epic: Epic 1 - Eliminate Circular Dependency Patterns
 *
 * Usage:
 * ```bash
 * # Install tsx if not already installed
 * npm install --save-dev tsx
 *
 * # Run script
 * npx tsx scripts/audit-component-z-positions.ts
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Category to Z position mapping
 *
 * Based on product owner specifications (2025-10-26):
 * - Tall larders: 210cm tall (Z=0, tops at 210cm)
 * - Wall cabinets: Z=140cm (tops match larders at 210cm)
 * - Counter tops: Z=86cm (4cm thick, top at 90cm)
 * - Windows: Z=100cm (above 90cm worktop)
 * - Base units: Z=0cm (86cm tall with kick plates)
 */
const CATEGORY_Z_MAP: Record<string, number> = {
  // Floor level (Z = 0cm)
  'Base Cabinets': 0,
  'Base Cabinet': 0,
  'Base Units': 0,
  'Corner Base Units': 0,
  'Corner Base Cabinets': 0,
  'Appliances': 0,
  'Tall Units': 0,
  'Larder Units': 0,
  'Larder': 0,
  'Doors': 0,
  'Flooring': 0,

  // Countertop level (Z = 86cm)
  'Counter Tops': 86,
  'Counter-Tops': 86,
  'Worktops': 86,
  'Countertops': 86,

  // Window level (Z = 100cm)
  'Windows': 100,
  'Window': 100,

  // Wall cabinet level (Z = 140cm)
  'Wall Units': 140,
  'Wall Cabinets': 140,
  'Wall Cabinet': 140,
  'Corner Wall Units': 140,
  'Corner Wall Cabinets': 140,

  // Cornice level (Z = 210cm)
  'Cornice': 210,

  // Pelmet level (Z = 140cm)
  'Pelmet': 140,

  // Sinks (Z = 75cm kitchen, 65cm butler)
  'Sinks': 75,
  'Sink': 75,

  // Finishing/Accessories - varies, default to 0
  'Finishing': 0,
  'Accessories': 0,
  'Props': 0,

  // Drawer units (Z = 0, same as base cabinets)
  'Pan Drawers': 0,
  'Drawers': 0,

  // End panels match their parent component
  'End Panels': 0, // Base end panels
  'Wall Unit End Panels': 140, // Wall end panels

  // Toe kicks (Z = 0, floor level)
  'Toe Kicks': 0,
  'Plinth': 0,
};

/**
 * Component ID patterns for special handling
 */
const ID_PATTERN_Z_MAP: Array<{ pattern: RegExp; z: number; description: string }> = [
  { pattern: /wall-cabinet/i, z: 140, description: 'Wall cabinet (detected by ID)' },
  { pattern: /corner-wall/i, z: 140, description: 'Corner wall cabinet' },
  { pattern: /butler.*sink/i, z: 65, description: 'Butler sink (lower than kitchen sink)' },
  { pattern: /larder/i, z: 0, description: 'Tall larder unit (floor to ceiling)' },
  { pattern: /tall.*unit/i, z: 0, description: 'Tall unit (floor to ceiling)' },
];

interface ComponentRecord {
  id: string;
  component_id: string;
  name: string;
  category: string | null;
  room_type: string;
  default_z_position?: number | null;
}

interface AuditResult {
  table: string;
  totalComponents: number;
  missingZ: number;
  hasZ: number;
  components: ComponentRecord[];
}

/**
 * Determine Z position for a component
 */
function determineZPosition(component: ComponentRecord): number {
  // Check ID patterns first (more specific)
  for (const { pattern, z, description } of ID_PATTERN_Z_MAP) {
    if (pattern.test(component.component_id) || pattern.test(component.name)) {
      console.log(`  ✓ ${component.component_id} → Z=${z}cm (${description})`);
      return z;
    }
  }

  // Check category mapping
  if (component.category && CATEGORY_Z_MAP[component.category] !== undefined) {
    const z = CATEGORY_Z_MAP[component.category];
    console.log(`  ✓ ${component.component_id} → Z=${z}cm (category: ${component.category})`);
    return z;
  }

  // Default to floor level
  console.warn(`  ⚠️  ${component.component_id} → Z=0cm (no category match, defaulting to floor)`);
  return 0;
}

/**
 * Audit a single component table
 */
async function auditComponentTable(tableName: string, roomType: string): Promise<AuditResult> {
  console.log(`\n📋 Auditing table: ${tableName} (${roomType})`);

  const { data, error } = await supabase
    .from(tableName)
    .select('id, component_id, name, category, default_z_position');

  if (error) {
    console.error(`❌ Error querying ${tableName}:`, error.message);
    return {
      table: tableName,
      totalComponents: 0,
      missingZ: 0,
      hasZ: 0,
      components: [],
    };
  }

  const components = (data || []).map(c => ({
    ...c,
    room_type: roomType,
  }));

  const missingZ = components.filter(c => c.default_z_position === null || c.default_z_position === undefined).length;
  const hasZ = components.length - missingZ;

  console.log(`  Total: ${components.length} components`);
  console.log(`  Has Z: ${hasZ}`);
  console.log(`  Missing Z: ${missingZ}`);

  return {
    table: tableName,
    totalComponents: components.length,
    missingZ,
    hasZ,
    components,
  };
}

/**
 * Generate SQL migration file
 */
function generateMigration(results: AuditResult[]): string {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const lines: string[] = [];

  lines.push('-- Migration: Add default_z_position to component tables');
  lines.push('-- Story: 1.8 - Audit Component Library Z Positions');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('--');
  lines.push('-- Design Specifications:');
  lines.push('-- - Tall larders: 210cm tall (Z=0, tops at 210cm)');
  lines.push('-- - Wall cabinets: Z=140cm (tops match larders at 210cm)');
  lines.push('-- - Counter tops: Z=86cm (4cm thick, top at 90cm)');
  lines.push('-- - Windows: Z=100cm (above 90cm worktop)');
  lines.push('-- - Base units: Z=0cm (86cm tall with kick plates)');
  lines.push('');

  for (const result of results) {
    if (result.totalComponents === 0) continue;

    lines.push(`-- =====================================================`);
    lines.push(`-- Table: ${result.table} (${result.totalComponents} components)`);
    lines.push(`-- =====================================================`);
    lines.push('');

    // Add column if it doesn't exist (check first)
    lines.push(`-- Add default_z_position column (nullable, backward-compatible)`);
    lines.push(`DO $$`);
    lines.push(`BEGIN`);
    lines.push(`  IF NOT EXISTS (`);
    lines.push(`    SELECT 1 FROM information_schema.columns`);
    lines.push(`    WHERE table_name = '${result.table}' AND column_name = 'default_z_position'`);
    lines.push(`  ) THEN`);
    lines.push(`    ALTER TABLE ${result.table} ADD COLUMN default_z_position INTEGER NULL;`);
    lines.push(`    COMMENT ON COLUMN ${result.table}.default_z_position IS 'Default Z position in cm (height off floor)';`);
    lines.push(`  END IF;`);
    lines.push(`END $$;`);
    lines.push('');

    // Group components by Z position for efficient updates
    const componentsByZ: Map<number, ComponentRecord[]> = new Map();
    for (const component of result.components) {
      const z = determineZPosition(component);
      if (!componentsByZ.has(z)) {
        componentsByZ.set(z, []);
      }
      componentsByZ.get(z)!.push(component);
    }

    // Generate UPDATE statements grouped by Z
    for (const [z, components] of componentsByZ.entries()) {
      const ids = components.map(c => `'${c.component_id}'`).join(', ');
      lines.push(`-- Set Z=${z}cm for ${components.length} components (${components[0].category || 'various'})`);
      lines.push(`UPDATE ${result.table}`);
      lines.push(`SET default_z_position = ${z}`);
      lines.push(`WHERE component_id IN (${ids});`);
      lines.push('');
    }

    lines.push('');
  }

  // Add verification query
  lines.push('-- =====================================================');
  lines.push('-- Verification');
  lines.push('-- =====================================================');
  lines.push('');
  for (const result of results) {
    if (result.totalComponents === 0) continue;
    lines.push(`-- Verify ${result.table}`);
    lines.push(`SELECT`);
    lines.push(`  category,`);
    lines.push(`  default_z_position,`);
    lines.push(`  COUNT(*) as count`);
    lines.push(`FROM ${result.table}`);
    lines.push(`GROUP BY category, default_z_position`);
    lines.push(`ORDER BY category, default_z_position;`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main audit function
 */
async function main() {
  console.log('🔍 Component Z Position Audit');
  console.log('================================\n');

  const componentTables = [
    { table: 'kitchen_components', roomType: 'kitchen' },
    { table: 'bedroom_components', roomType: 'bedroom' },
    { table: 'bathroom_components', roomType: 'bathroom' },
    { table: 'living_room_components', roomType: 'living-room' },
    { table: 'office_components', roomType: 'office' },
    { table: 'dining_room_components', roomType: 'dining-room' },
    { table: 'dressing_room_components', roomType: 'dressing-room' },
    { table: 'utility_components', roomType: 'utility' },
  ];

  const results: AuditResult[] = [];

  for (const { table, roomType } of componentTables) {
    const result = await auditComponentTable(table, roomType);
    results.push(result);
  }

  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('================================');
  const totalComponents = results.reduce((sum, r) => sum + r.totalComponents, 0);
  const totalMissingZ = results.reduce((sum, r) => sum + r.missingZ, 0);
  const totalHasZ = results.reduce((sum, r) => sum + r.hasZ, 0);

  console.log(`Total components across all tables: ${totalComponents}`);
  console.log(`Components with Z position: ${totalHasZ}`);
  console.log(`Components missing Z position: ${totalMissingZ}`);
  console.log(`Coverage: ${((totalHasZ / totalComponents) * 100).toFixed(1)}%`);

  // Generate migration
  console.log('\n\n📝 Generating SQL migration...');
  const migration = generateMigration(results);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const migrationPath = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    `${timestamp}_add_default_z_position.sql`
  );

  fs.writeFileSync(migrationPath, migration, 'utf-8');
  console.log(`✅ Migration file created: ${migrationPath}`);

  // Also save audit report
  const reportPath = path.join(
    __dirname,
    '..',
    'docs',
    'session-2025-10-26-story-1.8-component-z-audit',
    'AUDIT_REPORT.md'
  );

  const report = [
    '# Component Z Position Audit Report',
    '',
    `**Generated**: ${new Date().toISOString()}`,
    `**Story**: 1.8 - Audit Component Library Z Positions`,
    '',
    '## Summary',
    '',
    `- **Total Components**: ${totalComponents}`,
    `- **Has Z Position**: ${totalHasZ}`,
    `- **Missing Z Position**: ${totalMissingZ}`,
    `- **Coverage**: ${((totalHasZ / totalComponents) * 100).toFixed(1)}%`,
    '',
    '## By Table',
    '',
    '| Table | Total | Has Z | Missing Z | Coverage |',
    '|-------|-------|-------|-----------|----------|',
    ...results.map(r => {
      const coverage = r.totalComponents > 0 ? ((r.hasZ / r.totalComponents) * 100).toFixed(1) : '0.0';
      return `| ${r.table} | ${r.totalComponents} | ${r.hasZ} | ${r.missingZ} | ${coverage}% |`;
    }),
    '',
    '## Category Mapping',
    '',
    '```typescript',
    JSON.stringify(CATEGORY_Z_MAP, null, 2),
    '```',
    '',
    '## ID Pattern Mapping',
    '',
    '```typescript',
    JSON.stringify(ID_PATTERN_Z_MAP.map(p => ({ pattern: p.pattern.source, z: p.z, description: p.description })), null, 2),
    '```',
  ].join('\n');

  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`✅ Audit report saved: ${reportPath}`);

  console.log('\n✅ Audit complete!');
  console.log('\nNext steps:');
  console.log('1. Review the migration file');
  console.log('2. Test migration on development database');
  console.log('3. Run migration: npx supabase db push');
  console.log('4. Regenerate TypeScript types: npx supabase gen types typescript');
}

main().catch(console.error);
