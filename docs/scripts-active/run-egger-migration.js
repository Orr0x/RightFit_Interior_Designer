// Run EGGER database migration directly
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running EGGER database migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250127000000_create_egger_database_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('1️⃣ Creating EGGER database schema...');
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (schemaError) {
      console.log(`   ❌ Schema creation error: ${schemaError.message}`);
    } else {
      console.log('   ✅ EGGER database schema created successfully');
    }

    // Read the policies file
    const policiesPath = path.join(__dirname, '../supabase/migrations/20250127000001_add_egger_insert_policies.sql');
    const policiesSQL = fs.readFileSync(policiesPath, 'utf8');
    
    console.log('\n2️⃣ Adding INSERT/UPDATE/DELETE policies...');
    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    
    if (policiesError) {
      console.log(`   ❌ Policies creation error: ${policiesError.message}`);
    } else {
      console.log('   ✅ EGGER policies added successfully');
    }

    console.log('\n🎉 Migration completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: node scripts/add-sample-data.js');
    console.log('   2. Test: node scripts/test-egger-database.js');
    console.log('   3. Visit: /egger-boards to see the enhanced gallery');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Run the migration SQL directly in your Supabase dashboard');
  }
}

// Run the migration
runMigration().catch(console.error);
