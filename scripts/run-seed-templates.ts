/**
 * Run Seed Templates Migration on Cloud Supabase
 *
 * Usage: npx tsx scripts/run-seed-templates.ts
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;

// Extract project reference from URL: https://PROJECT_REF.supabase.co
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project reference from VITE_SUPABASE_URL');
  process.exit(1);
}

// Get database password from environment
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

if (!dbPassword) {
  console.error('❌ Missing SUPABASE_DB_PASSWORD environment variable');
  console.error('   Add to .env.local: SUPABASE_DB_PASSWORD=your_db_password');
  console.error('   Get from: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
  process.exit(1);
}

// Construct connection string
const connectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

async function runSeedMigration(): Promise<void> {
  console.log('📦 Running Room Geometry Templates Seed Data...\n');

  const migrationPath = join(
    process.cwd(),
    'supabase',
    'migrations',
    '20250915000003_phase1_seed_geometry_templates.sql'
  );

  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  console.log(`✅ Loaded migration file (${migrationSQL.length} characters)\n`);

  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔄 Executing seed data migration...\n');
    await client.query(migrationSQL);
    console.log('✅ Seed data inserted successfully!\n');

    // Verify templates were inserted
    console.log('🔍 Verifying templates...\n');
    const result = await client.query(`
      SELECT
        id,
        template_name,
        display_name,
        category,
        (geometry_definition->'metadata'->>'total_floor_area')::float / 10000 as floor_area_m2,
        jsonb_array_length(geometry_definition->'walls') as wall_count,
        is_active
      FROM room_geometry_templates
      ORDER BY sort_order;
    `);

    console.log('✅ Templates in database:');
    console.table(result.rows);

  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed\n');
  }
}

runSeedMigration().catch(console.error);
