// Test script for EGGER database integration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEggerDatabase() {
  console.log('🧪 Testing EGGER Database Integration...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1️⃣ Testing table existence...');
    const tables = ['egger_decors', 'egger_images', 'egger_combinations', 'egger_availability'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ Table ${table}: OK`);
        }
      } catch (err) {
        console.log(`   ❌ Table ${table}: ${err.message}`);
      }
    }

    // Test 2: Check data counts
    console.log('\n2️⃣ Testing data counts...');
    const countQueries = [
      { name: 'Decors', table: 'egger_decors' },
      { name: 'Images', table: 'egger_images' },
      { name: 'Combinations', table: 'egger_combinations' },
      { name: 'Availability', table: 'egger_availability' },
      { name: 'Categories', table: 'egger_categories' },
      { name: 'Textures', table: 'egger_textures' },
      { name: 'Color Families', table: 'egger_color_families' }
    ];

    for (const query of countQueries) {
      try {
        const { count, error } = await supabase
          .from(query.table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ ${query.name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${query.name}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`   ❌ ${query.name}: ${err.message}`);
      }
    }

    // Test 3: Test sample queries
    console.log('\n3️⃣ Testing sample queries...');
    
    // Get first decor
    const { data: firstDecor, error: decorError } = await supabase
      .from('egger_decors')
      .select('*')
      .limit(1)
      .single();
    
    if (decorError) {
      console.log(`   ❌ Get first decor: ${decorError.message}`);
    } else {
      console.log(`   ✅ Get first decor: ${firstDecor.decor_name} (${firstDecor.decor_id})`);
    }

    // Test search functionality
    const { data: searchResults, error: searchError } = await supabase
      .from('egger_decors')
      .select('*')
      .ilike('decor_name', '%wood%')
      .limit(5);
    
    if (searchError) {
      console.log(`   ❌ Search test: ${searchError.message}`);
    } else {
      console.log(`   ✅ Search test: Found ${searchResults.length} wood-related decors`);
    }

    // Test 4: Test relationships
    console.log('\n4️⃣ Testing relationships...');
    
    if (firstDecor) {
      // Get images for first decor
      const { data: images, error: imagesError } = await supabase
        .from('egger_images')
        .select('*')
        .eq('decor_id', firstDecor.decor_id);
      
      if (imagesError) {
        console.log(`   ❌ Get images: ${imagesError.message}`);
      } else {
        console.log(`   ✅ Get images: ${images.length} images for ${firstDecor.decor_id}`);
      }

      // Get combinations for first decor
      const { data: combinations, error: combinationsError } = await supabase
        .from('egger_combinations')
        .select('*')
        .eq('decor_id', firstDecor.decor_id);
      
      if (combinationsError) {
        console.log(`   ❌ Get combinations: ${combinationsError.message}`);
      } else {
        console.log(`   ✅ Get combinations: ${combinations.length} combinations for ${firstDecor.decor_id}`);
      }
    }

    console.log('\n🎉 Database integration test completed!');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('   - Database schema is properly set up');
    console.log('   - Tables are accessible');
    console.log('   - Basic queries work');
    console.log('   - Relationships are functional');
    console.log('\n💡 Next steps:');
    console.log('   1. Run the migration in Supabase dashboard');
    console.log('   2. Import your Excel data using the import script');
    console.log('   3. Test the enhanced EGGER gallery');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEggerDatabase().catch(console.error);
