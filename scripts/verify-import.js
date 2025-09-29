import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyImport() {
  try {
    console.log('🔍 Verifying Farrow & Ball import...');
    
    // Check finishes count
    const { count: finishesCount, error: finishesError } = await supabase
      .from('farrow_ball_finishes')
      .select('*', { count: 'exact', head: true });
    
    if (finishesError) {
      console.error('❌ Error checking finishes:', finishesError);
      return;
    }
    
    console.log(`✅ Finishes imported: ${finishesCount}`);
    
    // Check color schemes count
    const { count: schemesCount, error: schemesError } = await supabase
      .from('farrow_ball_color_schemes')
      .select('*', { count: 'exact', head: true });
    
    if (schemesError) {
      console.error('❌ Error checking color schemes:', schemesError);
      return;
    }
    
    console.log(`✅ Color schemes imported: ${schemesCount}`);
    
    // Check images count
    const { count: imagesCount, error: imagesError } = await supabase
      .from('farrow_ball_images')
      .select('*', { count: 'exact', head: true });
    
    if (imagesError) {
      console.error('❌ Error checking images:', imagesError);
      return;
    }
    
    console.log(`✅ Images imported: ${imagesCount}`);
    
    // Check categories count
    const { count: categoriesCount, error: categoriesError } = await supabase
      .from('farrow_ball_categories')
      .select('*', { count: 'exact', head: true });
    
    if (categoriesError) {
      console.error('❌ Error checking categories:', categoriesError);
      return;
    }
    
    console.log(`✅ Categories imported: ${categoriesCount}`);
    
    // Show sample data
    const { data: sampleFinishes, error: sampleError } = await supabase
      .from('farrow_ball_finishes')
      .select('color_name, color_number, main_color_hex')
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Error getting sample data:', sampleError);
      return;
    }
    
    console.log('\n📋 Sample finishes:');
    sampleFinishes.forEach(finish => {
      console.log(`  - ${finish.color_name} (${finish.color_number}) - ${finish.main_color_hex}`);
    });
    
    console.log('\n🎉 Import verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyImport();
