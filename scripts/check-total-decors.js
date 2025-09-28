import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTotalDecors() {
  console.log('🔍 CHECKING TOTAL DECOR COUNT');
  console.log('='.repeat(50));
  
  try {
    // Count total decors in database
    const { count, error: countError } = await supabase
      .from('egger_decors')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count error:', countError.message);
      return;
    }
    
    console.log(`📊 Total decors in database: ${count}`);
    
    // Test the getDecors query with different limits
    console.log('\n🔍 Testing different query limits:');
    
    const limits = [200, 500, 1000];
    
    for (const limit of limits) {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('egger_decors')
        .select('id, decor_id, decor_name, decor, texture')
        .limit(limit);
      
      const queryTime = Date.now() - startTime;
      
      if (error) {
        console.log(`❌ Limit ${limit}: Error - ${error.message}`);
      } else {
        console.log(`✅ Limit ${limit}: Retrieved ${data?.length || 0} decors in ${queryTime}ms`);
      }
    }
    
    // Test with no limit to get all
    console.log('\n🔍 Testing query with no limit (get all):');
    const startTime = Date.now();
    const { data: allData, error: allError } = await supabase
      .from('egger_decors')
      .select('id, decor_id, decor_name, decor, texture');
    
    const queryTime = Date.now() - startTime;
    
    if (allError) {
      console.log(`❌ No limit: Error - ${allError.message}`);
    } else {
      console.log(`✅ No limit: Retrieved ${allData?.length || 0} decors in ${queryTime}ms`);
    }
    
    console.log('\n💡 RECOMMENDATION:');
    if (count && count <= 350) {
      console.log(`✅ With only ${count} decors, loading all at once is fine`);
      console.log('✅ Performance impact is minimal for this dataset size');
      console.log('✅ User gets complete gallery without pagination clicks');
    } else {
      console.log('⚠️ Consider pagination for better performance');
    }
    
  } catch (error) {
    console.error('❌ Error checking decor count:', error.message);
  }
}

checkTotalDecors();
