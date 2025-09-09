#!/usr/bin/env node

/**
 * Simple Database Migration Runner
 * Deploys Phase 1 migrations for multi-room architecture
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import readline from 'readline';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error && !error.message.includes('relation "profiles" does not exist')) {
      throw error;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function checkIfMigrationsNeeded() {
  try {
    console.log('🔍 Checking if migrations are needed...');
    
    // Try to query projects table
    const { data, error } = await supabase.from('projects').select('count').limit(1);
    
    if (error) {
      if (error.message.includes('relation "projects" does not exist') || 
          error.message.includes('table "projects" does not exist') ||
          error.code === 'PGRST116' || error.code === '42P01') {
        console.log('📋 Migrations needed: projects table does not exist');
        return true;
      }
      throw error;
    }
    
    console.log('✅ Projects table exists - migrations may already be deployed');
    return false;
  } catch (error) {
    console.error('⚠️  Error checking migration status:', error.message);
    return true; // Assume migrations are needed if we can't check
  }
}

function displayMigrationInstructions() {
  console.log('\n🚀 MIGRATION DEPLOYMENT INSTRUCTIONS');
  console.log('=====================================\n');
  
  console.log('Since automatic migration execution requires special database permissions,');
  console.log('please follow these steps to deploy the migrations manually:\n');
  
  console.log('1️⃣  Open your Supabase Dashboard');
  console.log('   → Go to https://supabase.com/dashboard');
  console.log('   → Select your project\n');
  
  console.log('2️⃣  Navigate to SQL Editor');
  console.log('   → Click "SQL Editor" in the left sidebar\n');
  
  console.log('3️⃣  Execute Migration 1 - Create Schema');
  console.log('   → Copy the contents of: supabase/migrations/20250908160000_create_multi_room_schema.sql');
  console.log('   → Paste into SQL Editor');
  console.log('   → Click "Run" button');
  console.log('   → Wait for "Success" message\n');
  
  console.log('4️⃣  Execute Migration 2 - Migrate Data');
  console.log('   → Copy the contents of: supabase/migrations/20250908160001_migrate_existing_designs.sql');
  console.log('   → Paste into SQL Editor');
  console.log('   → Click "Run" button');
  console.log('   → Wait for migration summary messages\n');
  
  console.log('5️⃣  Verify Deployment');
  console.log('   → Run this script again to verify: node run-migrations.js');
  console.log('   → Or refresh your application to test functionality\n');
}

async function verifyMigrationSuccess() {
  try {
    console.log('🔍 Verifying migration deployment...\n');
    
    // Check projects table
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (projectsError) {
      console.log('❌ Projects table not found:', projectsError.message);
      return false;
    }
    console.log('✅ Projects table exists');
    
    // Check room_designs table
    const { data: roomsData, error: roomsError } = await supabase
      .from('room_designs')
      .select('count')
      .limit(1);
    
    if (roomsError) {
      console.log('❌ Room designs table not found:', roomsError.message);
      return false;
    }
    console.log('✅ Room designs table exists');
    
    // Check for migrated data
    const { data: migratedData, error: migratedError } = await supabase
      .from('room_designs')
      .select('count')
      .eq('design_settings->>migrated', 'true')
      .limit(1);
    
    if (!migratedError && migratedData) {
      console.log('✅ Migrated data detected');
    }
    
    console.log('\n🎉 Migration verification successful!');
    console.log('✅ Your application should now work correctly');
    console.log('✅ Refresh your browser to test the new functionality\n');
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 Phase 1 Database Migration Runner');
  console.log('====================================\n');
  
  // Check database connection
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.log('\n💡 Please check your .env file and Supabase credentials');
    process.exit(1);
  }
  
  // Check if migrations are needed
  const migrationsNeeded = await checkIfMigrationsNeeded();
  
  if (!migrationsNeeded) {
    console.log('\n🎉 Migrations appear to be already deployed!');
    const verified = await verifyMigrationSuccess();
    if (verified) {
      console.log('✅ All systems ready - your application should work correctly');
    }
    return;
  }
  
  // Display manual migration instructions
  displayMigrationInstructions();
  
  // Wait for user confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Have you completed the manual migration steps? (y/n): ', async (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('\n🔍 Verifying migration deployment...');
      const success = await verifyMigrationSuccess();
      
      if (success) {
        console.log('🎉 Migration deployment complete!');
        console.log('🚀 Your application is ready to use');
      } else {
        console.log('⚠️  Verification failed - please check the migration steps');
      }
    } else {
      console.log('\n📋 Please complete the migration steps and run this script again');
      console.log('   Command: node run-migrations.js');
    }
  });
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
});

// Run the migration runner
main().catch(console.error);