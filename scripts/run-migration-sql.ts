/**
 * Run Migration SQL on Cloud Supabase using PostgreSQL Client
 *
 * Usage: npx tsx scripts/run-migration-sql.ts
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

// Get database password from environment or prompt
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

if (!dbPassword) {
  console.error('❌ Missing SUPABASE_DB_PASSWORD environment variable');
  console.error('   Add to .env.local: SUPABASE_DB_PASSWORD=your_db_password');
  console.error('   Get from: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
  process.exit(1);
}

// Construct connection string
const connectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

async function runMigration(): Promise<void> {
  console.log('📦 Running Room Geometry Migration on Cloud Supabase...\n');

  const migrationPath = join(
    process.cwd(),
    'supabase',
    'migrations',
    '20251011000001_create_room_geometry_system.sql'
  );

  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  console.log(`✅ Loaded migration file (${migrationSQL.length} characters)\n`);

  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔄 Executing migration...\n');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed\n');
  }

  console.log('🔍 Verifying migration...\n');

  // Run verification
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const { stdout, stderr } = await execAsync('npx tsx scripts/check-room-geometry-migration.ts');
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (err: any) {
    console.log(err.stdout || err.message);
    if (err.stderr) console.error(err.stderr);
  }
}

runMigration().catch(console.error);
