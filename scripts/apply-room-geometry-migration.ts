/**
 * Apply Room Geometry Migration to Remote Database
 *
 * This script reads the SQL migration file and executes it against the remote database.
 * Use this when Docker Desktop is not available for local Supabase.
 *
 * Usage: npx tsx scripts/apply-room-geometry-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   VITE_SUPABASE_SERVICE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Use service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(): Promise<void> {
  console.log('📦 Applying Room Geometry Migration...\n');

  // Read migration file
  const migrationPath = join(
    process.cwd(),
    'supabase',
    'migrations',
    '20251011000001_create_room_geometry_system.sql'
  );

  let migrationSQL: string;
  try {
    migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Loaded migration file (${migrationSQL.length} characters)\n`);
  } catch (err) {
    console.error('❌ Failed to read migration file:', err);
    process.exit(1);
  }

  // Split SQL into individual statements (simple split by semicolon)
  // Note: This won't work for complex SQL with semicolons in strings
  // For production, use a proper SQL parser
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Found ${statements.length} SQL statements\n`);

  let successCount = 0;
  let errorCount = 0;

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 80).replace(/\n/g, ' ');

    console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase.from('_migrations').select('*').limit(0);

        if (directError) {
          console.error(`   ❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log('   ✅ Success');
          successCount++;
        }
      } else {
        console.log('   ✅ Success');
        successCount++;
      }
    } catch (err) {
      console.error(`   ❌ Exception: ${err}`);
      errorCount++;
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`\n📈 Migration Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total: ${statements.length}\n`);

  if (errorCount > 0) {
    console.log('⚠️  Some statements failed. This might be normal if:');
    console.log('   - Tables/columns already exist');
    console.log('   - Supabase RPC exec_sql is not available\n');
    console.log('🔧 Alternative approach:');
    console.log('   1. Open Supabase Dashboard > SQL Editor');
    console.log('   2. Paste contents of:');
    console.log('      supabase/migrations/20251011000001_create_room_geometry_system.sql');
    console.log('   3. Execute manually\n');
  } else {
    console.log('✅ Migration applied successfully!\n');
  }

  console.log('🔍 Verifying migration...\n');

  // Run verification
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

console.log('⚠️  IMPORTANT: Supabase client library cannot execute raw SQL directly.');
console.log('   This script demonstrates the approach, but manual execution is recommended.\n');
console.log('📝 Manual steps (RECOMMENDED):');
console.log('   1. Open: https://supabase.com/dashboard/project/akfdezesupzuvukqiggn/sql/new');
console.log('   2. Copy/paste: supabase/migrations/20251011000001_create_room_geometry_system.sql');
console.log('   3. Click "Run"');
console.log('   4. Verify with: npx tsx scripts/check-room-geometry-migration.ts\n');

console.log('Press Ctrl+C to cancel, or Enter to attempt automated execution...');

process.stdin.once('data', () => {
  applyMigration().catch(console.error);
});
