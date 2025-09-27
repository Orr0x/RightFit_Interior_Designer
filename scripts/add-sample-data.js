// Add sample EGGER data to test the database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleData() {
  console.log('🎯 Adding sample EGGER data...\n');

  try {
    // Add sample categories
    console.log('1️⃣ Adding categories...');
    const categories = ['Marble', 'Wood', 'Metal', 'Concrete', 'Stone', 'Textile'];
    for (const category of categories) {
      const { error } = await supabase
        .from('egger_categories')
        .upsert({ name: category }, { onConflict: 'name' });
      
      if (error) {
        console.log(`   ❌ Error adding category ${category}: ${error.message}`);
      } else {
        console.log(`   ✅ Added category: ${category}`);
      }
    }

    // Add sample textures
    console.log('\n2️⃣ Adding textures...');
    const textures = ['Matt', 'Gloss', 'Textured', 'Smooth', 'Brushed'];
    for (const texture of textures) {
      const { error } = await supabase
        .from('egger_textures')
        .upsert({ name: texture }, { onConflict: 'name' });
      
      if (error) {
        console.log(`   ❌ Error adding texture ${texture}: ${error.message}`);
      } else {
        console.log(`   ✅ Added texture: ${texture}`);
      }
    }

    // Add sample color families
    console.log('\n3️⃣ Adding color families...');
    const colorFamilies = ['White', 'Grey', 'Black', 'Brown', 'Beige', 'Blue'];
    for (const colorFamily of colorFamilies) {
      const { error } = await supabase
        .from('egger_color_families')
        .upsert({ 
          name: colorFamily,
          color_hex: colorFamily === 'White' ? '#FFFFFF' : 
                    colorFamily === 'Grey' ? '#808080' :
                    colorFamily === 'Black' ? '#000000' : null
        }, { onConflict: 'name' });
      
      if (error) {
        console.log(`   ❌ Error adding color family ${colorFamily}: ${error.message}`);
      } else {
        console.log(`   ✅ Added color family: ${colorFamily}`);
      }
    }

    // Add sample decors
    console.log('\n4️⃣ Adding sample decors...');
    const sampleDecors = [
      {
        decor_id: 'SAMPLE-001',
        decor_name: 'Carrara Marble',
        decor: 'Marble',
        texture: 'Matt',
        product_page_url: 'https://egger.com/sample-001',
        category: 'Marble',
        color_family: 'White',
        cost_per_sqm: 45.50
      },
      {
        decor_id: 'SAMPLE-002',
        decor_name: 'Oak Wood Grain',
        decor: 'Wood',
        texture: 'Textured',
        product_page_url: 'https://egger.com/sample-002',
        category: 'Wood',
        color_family: 'Brown',
        cost_per_sqm: 32.75
      },
      {
        decor_id: 'SAMPLE-003',
        decor_name: 'Brushed Steel',
        decor: 'Metal',
        texture: 'Brushed',
        product_page_url: 'https://egger.com/sample-003',
        category: 'Metal',
        color_family: 'Grey',
        cost_per_sqm: 67.25
      }
    ];

    for (const decor of sampleDecors) {
      const { error } = await supabase
        .from('egger_decors')
        .upsert(decor, { onConflict: 'decor_id' });
      
      if (error) {
        console.log(`   ❌ Error adding decor ${decor.decor_id}: ${error.message}`);
      } else {
        console.log(`   ✅ Added decor: ${decor.decor_name} (${decor.decor_id})`);
      }
    }

    // Add sample images
    console.log('\n5️⃣ Adding sample images...');
    const sampleImages = [
      {
        decor_id: 'SAMPLE-001',
        image_url: 'https://via.placeholder.com/400x300/FFFFFF/000000?text=Carrara+Marble',
        image_type: 'jpg',
        is_primary: true,
        sort_order: 0
      },
      {
        decor_id: 'SAMPLE-002',
        image_url: 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Oak+Wood',
        image_type: 'jpg',
        is_primary: true,
        sort_order: 0
      },
      {
        decor_id: 'SAMPLE-003',
        image_url: 'https://via.placeholder.com/400x300/808080/FFFFFF?text=Brushed+Steel',
        image_type: 'jpg',
        is_primary: true,
        sort_order: 0
      }
    ];

    for (const image of sampleImages) {
      const { error } = await supabase
        .from('egger_images')
        .insert(image);
      
      if (error) {
        console.log(`   ❌ Error adding image for ${image.decor_id}: ${error.message}`);
      } else {
        console.log(`   ✅ Added image for: ${image.decor_id}`);
      }
    }

    // Add sample combinations
    console.log('\n6️⃣ Adding sample combinations...');
    const sampleCombinations = [
      {
        decor_id: 'SAMPLE-001',
        recommended_decor_id: 'SAMPLE-002',
        match_type: 'complementary',
        confidence_score: 0.85,
        notes: 'Marble and wood create a classic contrast'
      },
      {
        decor_id: 'SAMPLE-002',
        recommended_decor_id: 'SAMPLE-003',
        match_type: 'style',
        confidence_score: 0.75,
        notes: 'Natural wood pairs well with industrial metal'
      }
    ];

    for (const combination of sampleCombinations) {
      const { error } = await supabase
        .from('egger_combinations')
        .insert(combination);
      
      if (error) {
        console.log(`   ❌ Error adding combination: ${error.message}`);
      } else {
        console.log(`   ✅ Added combination: ${combination.decor_id} -> ${combination.recommended_decor_id}`);
      }
    }

    // Add sample availability
    console.log('\n7️⃣ Adding sample availability...');
    const sampleAvailability = [
      {
        decor_id: 'SAMPLE-001',
        product_type: 'Laminate',
        availability_status: 'in_stock',
        lead_time_days: 7,
        minimum_order_quantity: 10
      },
      {
        decor_id: 'SAMPLE-002',
        product_type: 'Laminate',
        availability_status: 'in_stock',
        lead_time_days: 5,
        minimum_order_quantity: 5
      },
      {
        decor_id: 'SAMPLE-003',
        product_type: 'Laminate',
        availability_status: 'limited',
        lead_time_days: 14,
        minimum_order_quantity: 20
      }
    ];

    for (const availability of sampleAvailability) {
      const { error } = await supabase
        .from('egger_availability')
        .insert(availability);
      
      if (error) {
        console.log(`   ❌ Error adding availability: ${error.message}`);
      } else {
        console.log(`   ✅ Added availability for: ${availability.decor_id}`);
      }
    }

    console.log('\n🎉 Sample data added successfully!');
    console.log('\n💡 You can now test the enhanced EGGER gallery with real data!');

  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  }
}

// Run the script
addSampleData().catch(console.error);
