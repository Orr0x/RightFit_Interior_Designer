import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function analyzeGalleryPerformance() {
  console.log('⚡ ANALYZING GALLERY PERFORMANCE');
  console.log('='.repeat(60));
  
  try {
    console.log('\n1️⃣ TESTING MAIN GALLERY QUERY...');
    const startTime = Date.now();
    
    const { data: decors, error } = await supabase
      .from('egger_decors')
      .select('id, decor_id, decor_name, decor, texture, category, color_family, cost_per_sqm')
      .limit(1000);
    
    const queryTime = Date.now() - startTime;
    
    if (error) {
      console.error('❌ Query error:', error.message);
      return;
    }
    
    console.log(`✅ Query completed in ${queryTime}ms`);
    console.log(`📊 Retrieved ${decors?.length || 0} products`);
    
    console.log('\n2️⃣ TESTING IMAGE LOADING STRATEGY...');
    
    // Test how many images are loaded per product
    const sampleDecor = decors?.[0];
    if (sampleDecor) {
      const imageStartTime = Date.now();
      
      const { data: images } = await supabase
        .from('egger_images')
        .select('image_url, image_type, is_primary')
        .eq('decor_id', sampleDecor.decor_id)
        .eq('image_type', 'webp')
        .order('sort_order')
        .limit(1); // Only get first image for gallery
      
      const imageQueryTime = Date.now() - imageStartTime;
      
      console.log(`📸 Sample product (${sampleDecor.decor_id}) image query: ${imageQueryTime}ms`);
      console.log(`📸 Images found: ${images?.length || 0}`);
      
      if (images && images.length > 0) {
        console.log(`📸 Sample image URL: ${images[0].image_url.substring(0, 60)}...`);
      }
    }
    
    console.log('\n3️⃣ PERFORMANCE ANALYSIS:');
    console.log(`🔍 Database query time: ${queryTime}ms`);
    console.log(`📊 Products loaded: ${decors?.length || 0}`);
    console.log(`⚡ Performance: ${queryTime < 500 ? '✅ GOOD' : queryTime < 1000 ? '⚠️ MODERATE' : '❌ SLOW'}`);
    
    console.log('\n4️⃣ RECOMMENDATIONS:');
    if (queryTime > 500) {
      console.log('⚠️ SLOW QUERY - Consider:');
      console.log('   • Reduce limit from 1000 to 100-200');
      console.log('   • Add pagination');
      console.log('   • Remove unnecessary columns');
    }
    
    console.log('\n5️⃣ CONSOLE LOG IMPACT:');
    console.log('🔍 Current console logs per product load:');
    console.log('   • EggerDataService.getDecors(): ~2 logs');
    console.log('   • EggerDataService.getEnhancedProduct(): ~8-12 logs per product');
    console.log('   • Image prioritization: ~3-5 logs per product');
    console.log('   • Total: ~15-20 console logs per product page visit');
    console.log('');
    console.log('💡 For 1000 products in gallery: Minimal console impact');
    console.log('💡 For individual product pages: High console impact');
    
  } catch (error) {
    console.error('❌ Performance analysis error:', error.message);
  }
}

analyzeGalleryPerformance();
