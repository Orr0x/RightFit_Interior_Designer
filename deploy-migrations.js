const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile(filePath) {
  try {
    console.log(`📄 Reading migration file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`🚀 Executing migration: ${path.basename(filePath)}`);
    
    // Split SQL into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`   Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.error(`❌ Error executing statement: ${error.message}`);
          throw error;
        }
      }
    }
    
    console.log(`✅ Successfully executed: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to execute ${filePath}:`, error.message);
    return false;
  }
}

async function deployMigrations() {
  console.log('🎯 Starting Phase 1 Database Migration Deployment');
  console.log('================================================');
  
  const migrations = [
    'supabase/migrations/20250908160000_create_multi_room_schema.sql',
    'supabase/migrations/20250908160001_migrate_existing_designs.sql'
  ];
  
  let allSuccessful = true;
  
  for (const migration of migrations) {
    const success = await executeSQLFile(migration);
    if (!success) {
      allSuccessful = false;
      break;
    }
    console.log(''); // Add spacing between migrations
  }
  
  if (allSuccessful) {
    console.log('🎉 All migrations deployed successfully!');
    console.log('✅ Phase 1 database deployment complete');
    
    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    await verifyDeployment();
  } else {
    console.log('❌ Migration deployment failed');
    process.exit(1);
  }
}

async function verifyDeployment() {
  try {
    // Check if projects table exists
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (projectsError) {
      console.log('❌ Projects table verification failed:', projectsError.message);
      return;
    }
    
    // Check if room_designs table exists
    const { data: roomDesigns, error: roomDesignsError } = await supabase
      .from('room_designs')
      .select('count')
      .limit(1);
    
    if (roomDesignsError) {
      console.log('❌ Room designs table verification failed:', roomDesignsError.message);
      return;
    }
    
    console.log('✅ Database tables verified successfully');
    console.log('✅ Migration deployment verification complete');
    
  } catch (error) {
    console.log('⚠️  Verification failed:', error.message);
  }
}

// Run the deployment
deployMigrations().catch(console.error);