import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase database connection...');
  console.log('📡 URL:', supabaseUrl);
  console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...');
  
  try {
    // Test basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data, error, count } = await supabase
      .from('egger_decors')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }
    
    console.log('✅ Basic connection successful');
    console.log('📊 Total records in egger_decors:', count);
    
    // Test a simple query
    console.log('\n2️⃣ Testing simple query...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('egger_decors')
      .select('decor_id, decor_name')
      .limit(3);
    
    if (sampleError) {
      console.error('❌ Sample query failed:', sampleError);
      return;
    }
    
    console.log('✅ Sample query successful');
    console.log('📄 Sample data:', sampleData);
    
    // Test the specific query that's failing
    console.log('\n3️⃣ Testing the failing query...');
    const { data: failingData, error: failingError } = await supabase
      .from('egger_decors')
      .select('*')
      .limit(0); // This is what the app is trying to do
    
    if (failingError) {
      console.error('❌ Failing query error:', failingError);
      console.error('Error details:', {
        message: failingError.message,
        details: failingError.details,
        hint: failingError.hint,
        code: failingError.code
      });
    } else {
      console.log('✅ Failing query actually works!');
      console.log('📊 Records returned:', failingData?.length || 0);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      stack: err.stack
    });
  }
}

testDatabaseConnection();
