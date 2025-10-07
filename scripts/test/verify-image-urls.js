import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyImageUrls() {
  console.log('🔍 Verifying image URL population...\n');
  
  // Count records with image URLs
  const { count: totalCount } = await supabase
    .from('farrow_ball_finishes')
    .select('*', { count: 'exact', head: true });
    
  const { count: withThumbCount } = await supabase
    .from('farrow_ball_finishes')
    .select('*', { count: 'exact', head: true })
    .not('thumb_url', 'is', null);
    
  const { count: withHoverCount } = await supabase
    .from('farrow_ball_finishes')
    .select('*', { count: 'exact', head: true })
    .not('hover_url', 'is', null);
    
  console.log(`📊 Total records: ${totalCount}`);
  console.log(`🖼️ Records with thumb_url: ${withThumbCount}`);
  console.log(`🖼️ Records with hover_url: ${withHoverCount}`);
  console.log(`📈 Coverage: ${Math.round((withThumbCount / totalCount) * 100)}%\n`);
  
  // Show sample records with URLs
  const { data: sampleWithUrls } = await supabase
    .from('farrow_ball_finishes')
    .select('color_name, color_number, thumb_url, hover_url')
    .not('thumb_url', 'is', null)
    .limit(5);
    
  console.log('✅ Sample records with image URLs:');
  sampleWithUrls?.forEach(record => {
    console.log(`- ${record.color_name} (${record.color_number})`);
    console.log(`  Thumb: ${record.thumb_url}`);
    console.log(`  Hover: ${record.hover_url}\n`);
  });
  
  // Show records without URLs
  const { data: sampleWithoutUrls } = await supabase
    .from('farrow_ball_finishes')
    .select('color_name, color_number, finish_id')
    .is('thumb_url', null)
    .limit(5);
    
  if (sampleWithoutUrls?.length > 0) {
    console.log('⚠️ Sample records missing image URLs:');
    sampleWithoutUrls.forEach(record => {
      console.log(`- ${record.color_name} (${record.color_number}) -> ${record.finish_id}`);
    });
  }
}

verifyImageUrls();
