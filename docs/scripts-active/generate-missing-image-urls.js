import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function generateMissingImageUrls() {
  console.log('🔧 Generating image URLs for letter-based color numbers...\n');
  
  // Get colors without image URLs
  const { data: missingColors } = await supabase
    .from('farrow_ball_finishes')
    .select('finish_id, color_name, color_number, product_url')
    .is('thumb_url', null);

  console.log(`Found ${missingColors.length} colors without image URLs\n`);

  let updated = 0;
  let failed = 0;

  for (const color of missingColors) {
    try {
      // Generate image URLs based on Farrow & Ball pattern
      const colorSlug = color.color_name.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      const thumbUrl = `https://www.farrow-ball.com/media/catalog/product/${colorSlug.charAt(0)}/${colorSlug.charAt(1)}/${colorSlug}_no._${color.color_number}_-_swirl.jpg?optimize=low&fit=bounds&height=370&width=370&canvas=370:370`;
      
      const hoverUrl = `https://www.farrow-ball.com/media/catalog/product/p/a/paint_${colorSlug}${color.color_number}_hover.jpg?width=350&height=350&canvas=350,350&optimize=low&fit=bounds`;

      // Update the database
      const { error } = await supabase
        .from('farrow_ball_finishes')
        .update({
          thumb_url: thumbUrl,
          hover_url: hoverUrl
        })
        .eq('finish_id', color.finish_id);

      if (error) {
        console.log(`❌ Failed to update ${color.color_name}: ${error.message}`);
        failed++;
      } else {
        console.log(`✅ Generated URLs for ${color.color_name} (${color.color_number})`);
        updated++;
      }
    } catch (err) {
      console.log(`❌ Error processing ${color.color_name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n🎉 Complete!`);
  console.log(`✅ Updated: ${updated} colors`);
  console.log(`❌ Failed: ${failed} colors`);
  
  // Note about URL validation
  console.log(`\n⚠️ Note: Generated URLs may not all be valid.`);
  console.log(`   Some images might still fail to load if Farrow & Ball uses different naming patterns.`);
  console.log(`   The UI will show color swatches as fallback for broken image URLs.`);
}

generateMissingImageUrls();
