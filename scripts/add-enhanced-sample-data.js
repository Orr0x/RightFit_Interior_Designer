// Add enhanced sample data to make product pages more interesting
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

async function addEnhancedSampleData() {
  console.log('🎨 Adding enhanced sample data...\n');

  try {
    // Get some existing decors
    const { data: decors, error: decorsError } = await supabase
      .from('egger_decors')
      .select('decor_id, decor_name')
      .limit(20);

    if (decorsError) {
      console.error('❌ Error fetching decors:', decorsError.message);
      return;
    }

    if (!decors || decors.length === 0) {
      console.log('⚠️ No decors found, skipping data addition');
      return;
    }

    console.log(`📋 Found ${decors.length} decors, adding enhanced data...`);

    // Add sample availability data
    console.log('\n1️⃣ Adding sample availability data...');
    const availabilityData = decors.map(decor => ({
      decor_id: decor.decor_id,
      product_type: ['Board', 'Panel', 'Laminate', 'Worktop'][Math.floor(Math.random() * 4)],
      availability_status: ['in_stock', 'limited', 'out_of_stock', 'discontinued'][Math.floor(Math.random() * 4)],
      lead_time_days: Math.floor(Math.random() * 21) + 1
    }));

    for (const availability of availabilityData) {
      const { error } = await supabase
        .from('egger_availability')
        .insert(availability);
      
      if (error) {
        console.log(`   ⚠️  Availability error for ${availability.decor_id}: ${error.message}`);
      } else {
        console.log(`   ✅ Added availability for ${availability.decor_id}`);
      }
    }

    // Add sample combinations data
    console.log('\n2️⃣ Adding sample combinations data...');
    const combinationsData = [];
    for (let i = 0; i < decors.length; i += 2) {
      if (i + 1 < decors.length) {
        combinationsData.push({
          decor_id: decors[i].decor_id,
          recommended_decor_id: decors[i + 1].decor_id,
          match_type: 'complementary',
          confidence_score: Math.random() * 0.5 + 0.5
        });
      }
    }

    for (const combination of combinationsData) {
      const { error } = await supabase
        .from('egger_combinations')
        .insert(combination);
      
      if (error) {
        console.log(`   ⚠️  Combination error for ${combination.decor_id}: ${error.message}`);
      } else {
        console.log(`   ✅ Added combination for ${combination.decor_id}`);
      }
    }

    // Update decors with enhanced data
    console.log('\n3️⃣ Updating decors with enhanced data...');
    for (const decor of decors) {
      const { error } = await supabase
        .from('egger_decors')
        .update({
          cost_per_sqm: Math.random() * 100 + 20, // £20-120 per m²
          category: ['Kitchen', 'Bathroom', 'Living Room', 'Office', 'Bedroom'][Math.floor(Math.random() * 5)],
          description: `Premium ${decor.decor_name} material perfect for modern interior design. This high-quality surface offers exceptional durability and aesthetic appeal, making it ideal for both residential and commercial applications.`,
          color_family: ['White', 'Grey', 'Brown', 'Blue', 'Green', 'Beige'][Math.floor(Math.random() * 6)],
          finish_type: ['Matt', 'Gloss', 'Textured', 'Smooth'][Math.floor(Math.random() * 4)]
        })
        .eq('decor_id', decor.decor_id);
      
      if (error) {
        console.log(`   ⚠️  Update error for ${decor.decor_id}: ${error.message}`);
      } else {
        console.log(`   ✅ Updated ${decor.decor_id}`);
      }
    }

    console.log('\n🎉 Enhanced sample data added successfully!');
    console.log('💡 Product pages should now show much more data!');

  } catch (error) {
    console.error('❌ Error adding enhanced sample data:', error.message);
  }
}

// Run the script
addEnhancedSampleData().catch(console.error);
