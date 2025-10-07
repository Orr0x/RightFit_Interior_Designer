#!/usr/bin/env node

/**
 * Simple Migration Status Checker
 * Checks if database migrations are needed and provides instructions
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

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

async function checkMigrationStatus() {
  console.log('🎯 Database Migration Status Checker');
  console.log('===================================\n');
  
  try {
    console.log('🔌 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error && !error.message.includes('relation "profiles" does not exist')) {
      throw error;
    }
    console.log('✅ Database connection successful\n');
    
    // Check if new tables exist
    console.log('🔍 Checking migration status...');
    
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (projectsError) {
      if (projectsError.message.includes('relation "projects" does not exist') || 
          projectsError.message.includes('table "projects" does not exist') ||
          projectsError.code === 'PGRST116' || projectsError.code === '42P01') {
        
        console.log('📋 Status: Migrations needed');
        console.log('❌ Projects table does not exist\n');
        displayMigrationInstructions();
        return;
      }
      throw projectsError;
    }
    
    // Check room_designs table
    const { data: roomsData, error: roomsError } = await supabase
      .from('room_designs')
      .select('count')
      .limit(1);
    
    if (roomsError) {
      console.log('⚠️  Projects table exists but room_designs table missing');
      console.log('📋 Status: Partial migration - please complete Phase 1\n');
      displayMigrationInstructions();
      return;
    }
    
    console.log('✅ Projects table exists');
    console.log('✅ Room designs table exists');
    console.log('🎉 Status: Migrations appear to be deployed!\n');
    
    // Check for migrated data
    const { data: migratedData, error: migratedError } = await supabase
      .from('room_designs')
      .select('count')
      .eq('design_settings->>migrated', 'true')
      .limit(1);
    
    if (!migratedError && migratedData && migratedData.length > 0) {
      console.log('✅ Migrated data detected');
    }
    
    console.log('🚀 Your application should work correctly!');
    console.log('💡 If you\'re still seeing errors, try refreshing your browser\n');
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
    console.log('\n💡 This might indicate a connection issue or missing credentials');
  }
}

function displayMigrationInstructions() {
  console.log('🚀 MIGRATION DEPLOYMENT INSTRUCTIONS');
  console.log('=====================================\n');
  
  console.log('To deploy the database migrations:');
  console.log('1️⃣  Open Supabase Dashboard → https://supabase.com/dashboard');
  console.log('2️⃣  Navigate to SQL Editor');
  console.log('3️⃣  Copy & run: supabase/migrations/20250908160000_create_multi_room_schema.sql');
  console.log('4️⃣  Copy & run: supabase/migrations/20250908160001_migrate_existing_designs.sql');
  console.log('5️⃣  Run this script again to verify: node check-migrations.js\n');
  
  console.log('📁 Migration files are in the supabase/migrations/ directory');
  console.log('📖 See QUICK-FIX-GUIDE.md for detailed step-by-step instructions\n');
}

// Run the checker
checkMigrationStatus().catch(console.error);