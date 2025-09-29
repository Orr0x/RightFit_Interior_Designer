import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testDatabaseColours() {
  console.log('🧪 Testing database colour loading...\n');
  
  try {
    const { data, error } = await supabase
      .from('farrow_ball_finishes')
      .select('finish_id, color_name, color_number, thumb_url, hover_url')
      .order('color_name')
      .limit(10);

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log(`✅ Successfully loaded ${data.length} sample records:`);
    
    data.forEach((record, index) => {
      console.log(`\n${index + 1}. ${record.color_name} (${record.color_number})`);
      console.log(`   ID: ${record.finish_id}`);
      console.log(`   Thumb: ${record.thumb_url ? '✅ Available' : '❌ Missing'}`);
      console.log(`   Hover: ${record.hover_url ? '✅ Available' : '❌ Missing'}`);
      
      if (record.thumb_url) {
        console.log(`   Thumb URL: ${record.thumb_url.substring(0, 80)}...`);
      }
    });

    // Count records with and without images
    const { count: totalCount } = await supabase
      .from('farrow_ball_finishes')
      .select('*', { count: 'exact', head: true });
      
    const { count: withImagesCount } = await supabase
      .from('farrow_ball_finishes')
      .select('*', { count: 'exact', head: true })
      .not('thumb_url', 'is', null)
      .not('hover_url', 'is', null);

    console.log(`\n📊 Summary:`);
    console.log(`   Total records: ${totalCount}`);
    console.log(`   With images: ${withImagesCount}`);
    console.log(`   Without images: ${totalCount - withImagesCount}`);
    console.log(`   Coverage: ${Math.round((withImagesCount / totalCount) * 100)}%`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabaseColours();
