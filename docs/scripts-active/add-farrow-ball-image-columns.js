import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function addImageColumns() {
  console.log('🔄 Adding image URL columns to farrow_ball_finishes table...\n');
  
  // Check if columns already exist
  const { data: columns, error: columnsError } = await supabase
    .rpc('get_table_columns', { table_name: 'farrow_ball_finishes' })
    .select();
    
  if (columnsError) {
    console.log('⚠️ Could not check existing columns, proceeding with ALTER TABLE...');
  }
  
  console.log('📋 Executing SQL to add columns...');
  console.log('\nSQL to run manually in Supabase SQL Editor:');
  console.log('=' .repeat(50));
  console.log(`
-- Add thumb_url and hover_url columns to farrow_ball_finishes table
ALTER TABLE farrow_ball_finishes 
ADD COLUMN IF NOT EXISTS thumb_url TEXT,
ADD COLUMN IF NOT EXISTS hover_url TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_farrow_ball_finishes_thumb_url ON farrow_ball_finishes(thumb_url);
CREATE INDEX IF NOT EXISTS idx_farrow_ball_finishes_hover_url ON farrow_ball_finishes(hover_url);

-- Add comments for documentation
COMMENT ON COLUMN farrow_ball_finishes.thumb_url IS 'URL for the thumbnail image of the color swatch';
COMMENT ON COLUMN farrow_ball_finishes.hover_url IS 'URL for the hover image of the color swatch';
`);
  console.log('=' .repeat(50));
  console.log('\n✅ Copy the SQL above and paste it into your Supabase SQL Editor');
  console.log('Then run the populate script to fill the data.');
}

addImageColumns();

