import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSmartImagePrioritization() {
  console.log('🔍 TESTING SMART IMAGE PRIORITIZATION SYSTEM');
  console.log('='.repeat(80));
  
  const decorId = 'F032 ST78';
  console.log(`\n🎯 Testing prioritization for: ${decorId}`);
  console.log('-'.repeat(60));

  try {
    // Get all images for this product
    const { data: images, error } = await supabase
      .from('egger_images')
      .select('*')
      .eq('decor_id', decorId)
      .order('sort_order');
    
    if (error || !images) {
      console.error('❌ Error:', error?.message);
      return;
    }
    
    console.log(`📊 Found ${images.length} raw images`);
    
    // Apply the same prioritization logic as the service
    let filteredImages = images.map(img => {
      let priority = 0;
      let reasoning = [];

      // Primary flag gets highest priority
      if (img.is_primary) {
        priority += 1000;
        reasoning.push('marked as primary');
      }

      // AR_16_9 format (web-optimized product boards)
      if (img.image_url.includes('AR_16_9')) {
        priority += 500;
        reasoning.push('AR format');
      }

      // WebP format (modern, optimized)
      if (img.image_type === 'webp') {
        priority += 200;
        reasoning.push('WebP format');
      }

      // Lower sort_order = higher priority
      priority += (1000 - (img.sort_order || 0));
      reasoning.push(`sort order ${img.sort_order || 0}`);

      // Prefer images with higher resolution indicators
      if (img.image_url.includes('width=1024') || img.image_url.includes('width=1122')) {
        priority += 100;
        reasoning.push('high resolution');
      }

      // Penalize original.png files (source files, not web-optimized)
      if (img.image_url.includes('original.png')) {
        priority -= 300;
        reasoning.push('original file (penalized)');
      }

      return {
        ...img,
        priority_score: priority,
        priority_reasoning: reasoning.join(', ')
      };
    });

    // Sort by priority score (highest first)
    filteredImages.sort((a, b) => b.priority_score - a.priority_score);

    console.log('\n🎯 PRIORITIZED IMAGE RESULTS:');
    console.log('='.repeat(60));
    
    filteredImages.forEach((img, index) => {
      const isMainImage = index === 0;
      console.log(`\n${index + 1}. ${isMainImage ? '⭐ MAIN IMAGE' : 'Gallery Image'}`);
      console.log(`   🔢 Priority Score: ${img.priority_score}`);
      console.log(`   💡 Reasoning: ${img.priority_reasoning}`);
      console.log(`   📸 Type: ${img.image_type}`);
      console.log(`   ⭐ Primary Flag: ${img.is_primary ? 'YES' : 'NO'}`);
      console.log(`   📋 Sort Order: ${img.sort_order}`);
      console.log(`   🔗 URL: ${img.image_url.substring(0, 80)}...`);
      
      if (isMainImage) {
        console.log(`   🎯 THIS WILL BE THE MAIN PRODUCT IMAGE`);
      }
    });
    
    console.log('\n✅ WHAT THE USER WILL SEE:');
    console.log('   • Main image: Highest priority score (likely the correct product board)');
    console.log('   • Gallery order: Optimized for best visual presentation');
    console.log('   • Web-optimized: AR_16_9 WebP images prioritized over original.png');
    console.log('   • Primary flag respected: is_primary gets highest priority');
    console.log('   • Smart filtering: Original files deprioritized for web display');
    
    // Test with another product
    console.log('\n' + '='.repeat(80));
    const decorId2 = 'H1133 ST10';
    console.log(`\n🎯 Testing prioritization for: ${decorId2}`);
    console.log('-'.repeat(60));
    
    const { data: images2 } = await supabase
      .from('egger_images')
      .select('*')
      .eq('decor_id', decorId2)
      .order('sort_order');
    
    if (images2) {
      console.log(`📊 Found ${images2.length} raw images`);
      
      const prioritized2 = images2.map(img => {
        let priority = 0;
        if (img.is_primary) priority += 1000;
        if (img.image_url.includes('AR_16_9')) priority += 500;
        if (img.image_type === 'webp') priority += 200;
        priority += (1000 - (img.sort_order || 0));
        if (img.image_url.includes('width=1024') || img.image_url.includes('width=1122')) priority += 100;
        if (img.image_url.includes('original.png')) priority -= 300;
        return { ...img, priority_score: priority };
      }).sort((a, b) => b.priority_score - a.priority_score);
      
      console.log(`\n⭐ MAIN IMAGE for ${decorId2}:`);
      console.log(`   Priority: ${prioritized2[0].priority_score}`);
      console.log(`   Primary: ${prioritized2[0].is_primary ? 'YES' : 'NO'}`);
      console.log(`   Type: ${prioritized2[0].image_type}`);
      console.log(`   URL: ${prioritized2[0].image_url.substring(0, 60)}...`);
    }

  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

testSmartImagePrioritization();
