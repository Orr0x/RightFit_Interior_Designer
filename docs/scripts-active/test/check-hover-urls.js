import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkHoverUrls() {
  console.log('🔍 Checking hover URL formatting...\n');
  
  const { data } = await supabase
    .from('farrow_ball_finishes')
    .select('color_name, thumb_url, hover_url')
    .not('thumb_url', 'is', null)
    .limit(5);

  data.forEach(record => {
    console.log(`Color: ${record.color_name}`);
    console.log(`Thumb URL: ${record.thumb_url.substring(0, 80)}...`);
    console.log(`Hover URL: ${record.hover_url.substring(0, 80)}...`);
    console.log(`Hover starts with quote: ${record.hover_url?.startsWith('"')}`);
    console.log(`Hover ends with quote: ${record.hover_url?.endsWith('"')}`);
    console.log(`Hover URL length: ${record.hover_url?.length}`);
    console.log('---\n');
  });
}

checkHoverUrls();
