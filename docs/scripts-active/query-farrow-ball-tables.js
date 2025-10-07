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

// List of Farrow & Ball tables from the Supabase dashboard
const farrowBallTables = [
  'farrow_ball_finishes',
  'farrow_ball_color_schemes', 
  'farrow_ball_images',
  'farrow_ball_categories',
  'farrow_ball_color_families'
];

async function queryTable(tableName) {
  console.log(`\n🔍 Querying table: ${tableName}`);
  console.log('=' .repeat(50));
  
  try {
    // Get table structure by fetching a few rows
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);
    
    if (error) {
      console.error(`❌ Error querying ${tableName}:`, error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`⚠️  No data found in ${tableName}`);
      return;
    }
    
    console.log(`✅ Found ${data.length} sample records:`);
    console.log('📋 Table Structure:');
    const columns = Object.keys(data[0]);
    columns.forEach((col, index) => {
      const sampleValue = data[0][col];
      const type = typeof sampleValue;
      console.log(`   ${index + 1}. ${col} (${type}): ${JSON.stringify(sampleValue)}`);
    });
    
    // Get total count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`📊 Total records: ${count}`);
    }
    
    // Show sample data
    console.log('\n📄 Sample Data:');
    data.forEach((row, index) => {
      console.log(`   Record ${index + 1}:`, JSON.stringify(row, null, 2));
    });
    
  } catch (err) {
    console.error(`❌ Exception querying ${tableName}:`, err.message);
  }
}

async function getTableRelationships() {
  console.log('\n🔗 Analyzing Table Relationships');
  console.log('=' .repeat(50));
  
  try {
    // Query each table to understand relationships
    for (const table of farrowBallTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        const columns = Object.keys(data[0]);
        const foreignKeyColumns = columns.filter(col => 
          col.includes('_id') || col.includes('finish_id') || col.includes('category_id')
        );
        
        if (foreignKeyColumns.length > 0) {
          console.log(`\n${table}:`);
          console.log(`   Foreign Key Columns: ${foreignKeyColumns.join(', ')}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error analyzing relationships:', err.message);
  }
}

async function main() {
  console.log('🚀 Starting Farrow & Ball Database Analysis');
  console.log('=' .repeat(60));
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using Anon Key: ${supabaseKey.substring(0, 20)}...`);
  
  // Query each table
  for (const table of farrowBallTables) {
    await queryTable(table);
  }
  
  // Analyze relationships
  await getTableRelationships();
  
  console.log('\n✅ Database analysis complete!');
}

main().catch(console.error);
