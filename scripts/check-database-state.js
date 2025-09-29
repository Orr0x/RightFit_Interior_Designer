import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCurrentData() {
  console.log('🔍 Checking current database state...\n');
  
  // Count current records
  const { count, error } = await supabase
    .from('farrow_ball_finishes')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`📊 Current database records: ${count}`);
  
  // Get sample records
  const { data: sample, error: sampleError } = await supabase
    .from('farrow_ball_finishes')
    .select('color_name, color_number, finish_id')
    .limit(5);
    
  if (sampleError) {
    console.error('Sample error:', sampleError);
    return;
  }
  
  console.log('\n📄 Sample records:');
  sample.forEach(record => {
    console.log(`- ${record.color_name} (${record.color_number}) -> ${record.finish_id}`);
  });
  
  // Check if we have the specific colors we need
  const { data: acidDrop, error: acidError } = await supabase
    .from('farrow_ball_finishes')
    .select('*')
    .eq('color_number', '9908')
    .single();
    
  console.log('\n🎯 Acid Drop (9908) check:');
  if (acidError) {
    console.log('❌ Not found in database');
  } else {
    console.log('✅ Found:', acidDrop.color_name, acidDrop.finish_id);
  }
}

checkCurrentData();

