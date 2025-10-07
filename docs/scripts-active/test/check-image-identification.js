import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkImageIdentification() {
  console.log('🔍 Checking how product images are identified in database...\n');
  
  // Get a sample finish with its images
  const { data: finishWithImages, error: error1 } = await supabase
    .from('farrow_ball_finishes')
    .select(`
      finish_id,
      color_name,
      color_number,
      farrow_ball_images (
        image_url,
        image_type,
        is_main_image,
        image_order
      )
    `)
    .eq('finish_id', 'acid-drop-9908')
    .single();
    
  if (error1) {
    console.error('Error fetching finish with images:', error1);
    return;
  }
  
  console.log('🎨 Finish:', finishWithImages.color_name, `(No. ${finishWithImages.color_number})`);
  console.log('🆔 Finish ID:', finishWithImages.finish_id);
  console.log('🖼️ Images:');
  
  finishWithImages.farrow_ball_images.forEach((img, index) => {
    console.log(`  ${index + 1}. ${img.image_url}`);
    console.log(`     Type: ${img.image_type}, Main: ${img.is_main_image}, Order: ${img.image_order}`);
  });
  
  // Check another finish to see the pattern
  const { data: anotherFinish, error: error2 } = await supabase
    .from('farrow_ball_finishes')
    .select(`
      finish_id,
      color_name,
      color_number,
      farrow_ball_images (
        image_url,
        image_type,
        is_main_image,
        image_order
      )
    `)
    .eq('finish_id', 'card-room-green-79')
    .single();
    
  if (error2) {
    console.error('Error fetching another finish:', error2);
    return;
  }
  
  console.log('\n🎨 Another Finish:', anotherFinish.color_name, `(No. ${anotherFinish.color_number})`);
  console.log('🆔 Finish ID:', anotherFinish.finish_id);
  console.log('🖼️ Images:');
  
  anotherFinish.farrow_ball_images.forEach((img, index) => {
    console.log(`  ${index + 1}. ${img.image_url}`);
    console.log(`     Type: ${img.image_type}, Main: ${img.is_main_image}, Order: ${img.image_order}`);
  });
  
  // Check if there's a pattern in image URLs
  console.log('\n🔍 Analyzing image URL patterns...');
  const { data: allImages, error: error3 } = await supabase
    .from('farrow_ball_images')
    .select('finish_id, image_url')
    .limit(10);
    
  if (error3) {
    console.error('Error fetching all images:', error3);
    return;
  }
  
  console.log('Sample image URLs:');
  allImages.forEach(img => {
    const urlParts = img.image_url.split('/');
    const filename = urlParts[urlParts.length - 1];
    console.log(`- ${img.finish_id}: ${filename}`);
  });
  
  // Check the relationship between finish_id and color_number
  console.log('\n🔗 Checking finish_id vs color_number relationship...');
  const { data: sampleFinishes, error: error4 } = await supabase
    .from('farrow_ball_finishes')
    .select('finish_id, color_name, color_number')
    .limit(5);
    
  if (error4) {
    console.error('Error fetching sample finishes:', error4);
    return;
  }
  
  console.log('Finish ID patterns:');
  sampleFinishes.forEach(finish => {
    console.log(`- Color: ${finish.color_name} (No. ${finish.color_number})`);
    console.log(`  Finish ID: ${finish.finish_id}`);
    console.log(`  Pattern: ${finish.finish_id.includes(finish.color_number) ? 'Contains number' : 'Does not contain number'}`);
  });
}

checkImageIdentification();
