import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkImageData() {
  console.log('🔍 Checking Farrow & Ball image data in database...\n');
  
  // Check finishes table for image fields
  const { data: finishes, error: finishesError } = await supabase
    .from('farrow_ball_finishes')
    .select('finish_id, color_name, product_url')
    .limit(3);
    
  if (finishesError) {
    console.error('Error fetching finishes:', finishesError);
    return;
  }
  
  console.log('📋 Sample finishes data:');
  finishes.forEach(finish => {
    console.log(`- ${finish.color_name} (${finish.finish_id})`);
    console.log(`  Product URL: ${finish.product_url}`);
  });
  
  // Check images table
  const { data: images, error: imagesError } = await supabase
    .from('farrow_ball_images')
    .select('finish_id, image_url, image_type, is_main_image')
    .limit(5);
    
  if (imagesError) {
    console.error('Error fetching images:', imagesError);
    return;
  }
  
  console.log('\n🖼️ Sample images data:');
  images.forEach(img => {
    console.log(`- ${img.finish_id}: ${img.image_url} (type: ${img.image_type}, main: ${img.is_main_image})`);
  });
  
  // Check if we have thumb_url and hover_url in finishes
  const { data: sampleFinish, error: sampleError } = await supabase
    .from('farrow_ball_finishes')
    .select('*')
    .limit(1)
    .single();
    
  if (sampleError) {
    console.error('Error fetching sample finish:', sampleError);
    return;
  }
  
  console.log('\n🔍 Sample finish fields:');
  Object.keys(sampleFinish).forEach(key => {
    console.log(`- ${key}: ${typeof sampleFinish[key]}`);
  });
  
  // Check CSV data structure
  console.log('\n📄 Checking CSV data structure...');
  const csvResponse = await fetch('http://localhost:5173/colours.csv');
  const csvText = await csvResponse.text();
  const csvLines = csvText.split('\n');
  const csvHeader = csvLines[0];
  const csvSample = csvLines[1];
  
  console.log('CSV Header:', csvHeader);
  console.log('CSV Sample:', csvSample);
}

checkImageData();
