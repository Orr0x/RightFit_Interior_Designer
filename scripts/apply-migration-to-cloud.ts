/**
 * Apply Room Geometry Migration to Cloud Supabase
 *
 * Reads the migration SQL file and executes it against the cloud database.
 *
 * Usage: npx tsx scripts/apply-migration-to-cloud.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY!.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(): Promise<void> {
  console.log('📦 Applying Room Geometry Migration to Cloud Supabase...\n');

  const migrationPath = join(
    process.cwd(),
    'supabase',
    'migrations',
    '20251011000001_create_room_geometry_system.sql'
  );

  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  console.log(`✅ Loaded migration file (${migrationSQL.length} characters)\n`);

  console.log('🔄 Executing migration...\n');

  try {
    // Execute the entire migration as one transaction
    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('\nTrying alternative method...\n');

      // Alternative: Direct fetch to REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: migrationSQL })
      });

      if (!response.ok) {
        console.error('❌ Alternative method also failed');
        console.error('Response:', await response.text());
        process.exit(1);
      }
    }

    console.log('✅ Migration executed successfully!\n');
  } catch (err) {
    console.error('❌ Exception during migration:', err);
    process.exit(1);
  }

  console.log('🔍 Verifying migration...\n');

  // Import and run verification
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const { stdout } = await execAsync('npx tsx scripts/check-room-geometry-migration.ts');
    console.log(stdout);
  } catch (err: any) {
    console.log(err.stdout || err.message);
  }
}

applyMigration().catch(console.error);
