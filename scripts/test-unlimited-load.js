import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testUnlimitedLoad() {
  console.log('🔍 TESTING UNLIMITED DECOR LOADING');
  console.log('='.repeat(50));
  
  try {
    // Test the new unlimited loading logic
    console.log('🔄 Testing query with limit = 0 (unlimited)...');
    const startTime = Date.now();
    
    let query = supabase
      .from('egger_decors')
      .select('*', { count: 'exact' })
      .order('decor_name');
    
    // This simulates the new logic in EggerDataService
    const limit = 0;
    let result;
    if (limit > 0) {
      result = await query
        .range(0, limit - 1)
        .limit(limit);
    } else {
      result = await query; // Get all records
    }
    
    const { data, error, count } = result;
    const queryTime = Date.now() - startTime;
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    console.log(`✅ Query completed in ${queryTime}ms`);
    console.log(`📊 Total count from database: ${count}`);
    console.log(`📊 Records retrieved: ${data?.length || 0}`);
    
    if (count === data?.length) {
      console.log('✅ SUCCESS: All decors loaded correctly!');
    } else {
      console.log('❌ MISMATCH: Count and retrieved records don\'t match');
    }
    
    // Show sample of loaded decors
    console.log('\n📋 Sample of loaded decors:');
    data?.slice(0, 5).forEach((decor, index) => {
      console.log(`   ${index + 1}. ${decor.decor_id} - ${decor.decor_name}`);
    });
    
    if (data && data.length > 5) {
      console.log(`   ... and ${data.length - 5} more decors`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testUnlimitedLoad();
