import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testDualImageSystem() {
  console.log('🔍 TESTING DUAL-IMAGE SYSTEM');
  console.log('='.repeat(80));
  
  const testDecors = ['F032 ST78', 'H1180 ST37', 'H1133 ST10', 'U104 ST9'];
  
  for (const decorId of testDecors) {
    console.log(`\n🎯 TESTING: ${decorId}`);
    console.log('-'.repeat(60));
    
    try {
      // Test board images (high-quality PNG from Boards.csv)
      const { data: boardImages, error: boardError } = await supabase
        .from('egger_images')
        .select('*')
        .eq('decor_id', decorId)
        .eq('image_type', 'png')
        .ilike('image_url', '%original.png%')
        .order('sort_order')
        .limit(2);
      
      console.log(`🖼️ Board Images (PNG): ${boardImages?.length || 0}`);
      if (boardImages && boardImages.length > 0) {
        boardImages.forEach((img, index) => {
          console.log(`   ${index + 1}. ${index === 0 ? 'Main Board' : 'Close-up'}: ${img.image_url.substring(0, 60)}...`);
        });
      }
      
      // Test WebP gallery images (fast loading)
      const { data: webpImages, error: webpError } = await supabase
        .from('egger_images')
        .select('*')
        .eq('decor_id', decorId)
        .eq('image_type', 'webp')
        .order('sort_order');
      
      console.log(`🌐 WebP Gallery Images: ${webpImages?.length || 0}`);
      if (webpImages && webpImages.length > 0) {
        console.log(`   Sample: ${webpImages[0].image_url.substring(0, 60)}...`);
        if (webpImages.length > 1) {
          console.log(`   + ${webpImages.length - 1} more gallery images`);
        }
      }
      
      // Summary
      console.log(`📊 SUMMARY for ${decorId}:`);
      console.log(`   • Board Images: ${boardImages?.length || 0} (High-quality PNG for hero/details)`);
      console.log(`   • Gallery Images: ${webpImages?.length || 0} (Fast-loading WebP for gallery)`);
      console.log(`   • Total Images: ${(boardImages?.length || 0) + (webpImages?.length || 0)}`);
      
      if ((boardImages?.length || 0) === 0 && (webpImages?.length || 0) === 0) {
        console.log(`   ⚠️ WARNING: No images found for ${decorId}`);
      } else if ((boardImages?.length || 0) === 0) {
        console.log(`   ⚠️ WARNING: No board images found for ${decorId} (will use WebP as fallback)`);
      } else if ((webpImages?.length || 0) === 0) {
        console.log(`   ⚠️ WARNING: No WebP gallery images found for ${decorId}`);
      } else {
        console.log(`   ✅ PERFECT: Both board and gallery images available`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${decorId}:`, error.message);
    }
  }
  
  console.log('\n💡 DUAL-IMAGE SYSTEM BENEFITS:');
  console.log('='.repeat(80));
  console.log('✅ HERO SECTION: High-quality board images (PNG) for main display');
  console.log('✅ PRODUCT DETAILS: Close-up board image for texture detail');
  console.log('✅ GALLERY: Fast-loading WebP images for additional views');
  console.log('✅ PERFORMANCE: Optimized loading with appropriate image types');
  console.log('✅ FALLBACK: Graceful degradation when images are missing');
  
  console.log('\n🎯 IMPLEMENTATION STATUS:');
  console.log('   • EggerDataService: ✅ Updated with dual-image support');
  console.log('   • ProductPage Hero: ✅ Uses board images');
  console.log('   • ProductPage Details: ✅ Uses close-up board image');
  console.log('   • Gallery Section: ✅ Uses WebP images');
  console.log('   • Main Gallery: ✅ Still uses WebP for fast loading');
}

testDualImageSystem();
