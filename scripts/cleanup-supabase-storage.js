import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupStorage() {
  console.log('🧹 Supabase Storage Cleanup Tool');
  console.log('=' .repeat(50));
  
  try {
    // Option 1: Clean up duplicate/old images
    console.log('\n1️⃣ Checking for duplicate images...');
    
    const { data: images, error: imagesError } = await supabase
      .from('farrow_ball_images')
      .select('*')
      .limit(10);
    
    if (imagesError) {
      console.error('❌ Error fetching images:', imagesError.message);
      return;
    }
    
    console.log('📄 Sample images:');
    images.forEach((img, index) => {
      console.log(`   ${index + 1}. ${img.finish_id} - ${img.image_type} - Order: ${img.image_order}`);
    });
    
    // Option 2: Keep only main images (is_main_image = true)
    console.log('\n2️⃣ Checking main images...');
    
    const { data: mainImages, error: mainError } = await supabase
      .from('farrow_ball_images')
      .select('*')
      .eq('is_main_image', true);
    
    if (mainError) {
      console.error('❌ Error fetching main images:', mainError.message);
    } else {
      console.log(`✅ Found ${mainImages.length} main images`);
    }
    
    // Option 3: Keep only first 3 images per finish
    console.log('\n3️⃣ Checking image distribution...');
    
    const { data: imageCounts, error: countError } = await supabase
      .from('farrow_ball_images')
      .select('finish_id')
      .order('finish_id');
    
    if (countError) {
      console.error('❌ Error counting images:', countError.message);
    } else {
      // Group by finish_id
      const grouped = imageCounts.reduce((acc, img) => {
        acc[img.finish_id] = (acc[img.finish_id] || 0) + 1;
        return acc;
      }, {});
      
      const finishesWithManyImages = Object.entries(grouped)
        .filter(([_, count]) => count > 5)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log('📊 Finishes with many images:');
      finishesWithManyImages.forEach(([finishId, count]) => {
        console.log(`   ${finishId}: ${count} images`);
      });
    }
    
    console.log('\n💡 Cleanup Recommendations:');
    console.log('1. Keep only main images (is_main_image = true)');
    console.log('2. Keep only first 3 images per finish');
    console.log('3. Remove duplicate or low-quality images');
    console.log('4. Consider using external image hosting (Cloudinary, etc.)');
    
    console.log('\n⚠️  WARNING: This will delete data permanently!');
    console.log('Make sure to backup your data before running cleanup operations.');
    
  } catch (err) {
    console.error('❌ Error during cleanup check:', err);
  }
}

// Interactive cleanup options
async function interactiveCleanup() {
  console.log('\n🔧 Interactive Cleanup Options:');
  console.log('1. Keep only main images (safest)');
  console.log('2. Keep only first 3 images per finish');
  console.log('3. Remove all non-main images');
  console.log('4. Exit without changes');
  
  // For now, just show the analysis
  // In a real implementation, you'd add readline for user input
  console.log('\n📋 Run specific cleanup commands manually:');
  console.log('   node scripts/cleanup-main-images.js');
  console.log('   node scripts/cleanup-excess-images.js');
}

cleanupStorage().then(() => {
  interactiveCleanup();
});
