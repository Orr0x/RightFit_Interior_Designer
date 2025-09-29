import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyFinalMigration() {
  console.log('🧪 Final verification of complete migration...\n');

  // Check letter-based colors
  const { data: letterColors } = await supabase
    .from('farrow_ball_finishes')
    .select('color_name, color_number, thumb_url, hover_url')
    .in('color_number', ['W40', 'CB1', 'G16', 'CC6'])
    .limit(4);

  console.log('✅ Letter-based colors now with proper URLs:');
  letterColors.forEach(record => {
    console.log(`  ${record.color_name} (${record.color_number})`);
    console.log(`    Thumb: ${record.thumb_url.substring(0, 60)}...`);
    console.log(`    Hover: ${record.hover_url.substring(0, 60)}...`);
    console.log(`    Clean URLs: ${!record.thumb_url.includes('"') && !record.hover_url.includes('"')}`);
    console.log('');
  });

  // Count total with images
  const { count: totalWithImages } = await supabase
    .from('farrow_ball_finishes')
    .select('*', { count: 'exact', head: true })
    .not('thumb_url', 'is', null)
    .not('hover_url', 'is', null);

  const { count: totalRecords } = await supabase
    .from('farrow_ball_finishes')
    .select('*', { count: 'exact', head: true });

  console.log(`🎯 Final Results:`);
  console.log(`   Total colors: ${totalRecords}`);
  console.log(`   With images: ${totalWithImages}`);
  console.log(`   Coverage: ${Math.round((totalWithImages / totalRecords) * 100)}%`);
  
  if (totalWithImages === totalRecords) {
    console.log(`\n🎉 PERFECT! All colors now have image URLs!`);
  }
}

verifyFinalMigration();
