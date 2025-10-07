import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageUsage() {
  console.log('🔍 Checking Supabase storage usage...');
  
  try {
    // Check table sizes
    const tables = [
      'egger_decors',
      'egger_images', 
      'egger_combinations',
      'egger_availability',
      'egger_interior_matches',
      'egger_no_combinations',
      'egger_categories',
      'egger_textures',
      'egger_color_families',
      'egger_board_images',
      'farrow_ball_finishes',
      'farrow_ball_color_schemes',
      'farrow_ball_images',
      'farrow_ball_categories',
      'farrow_ball_color_families'
    ];
    
    console.log('\n📊 Table Record Counts:');
    console.log('=' .repeat(50));
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: Error - ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // Check for large tables that might be consuming storage
    console.log('\n🔍 Identifying large tables...');
    
    const largeTables = [];
    for (const table of ['egger_images', 'farrow_ball_images', 'egger_combinations']) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error && count > 1000) {
          largeTables.push({ table, count });
        }
      } catch (err) {
        // Ignore errors for this check
      }
    }
    
    if (largeTables.length > 0) {
      console.log('\n⚠️  Large tables detected:');
      largeTables.forEach(({ table, count }) => {
        console.log(`   ${table}: ${count} records`);
      });
    }
    
    // Check storage buckets
    console.log('\n🗂️  Checking storage buckets...');
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        console.log('❌ Error listing buckets:', error.message);
      } else {
        console.log('📁 Storage buckets:');
        buckets.forEach(bucket => {
          console.log(`   ${bucket.name}: ${bucket.public ? 'public' : 'private'}`);
        });
      }
    } catch (err) {
      console.log('❌ Error accessing storage:', err.message);
    }
    
  } catch (err) {
    console.error('❌ Error checking storage:', err);
  }
}

checkStorageUsage();
