import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function addImageColumns() {
  console.log('🔄 Adding thumb_url and hover_url columns to farrow_ball_finishes...\n');
  
  try {
    // Add the columns
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE farrow_ball_finishes 
        ADD COLUMN IF NOT EXISTS thumb_url TEXT,
        ADD COLUMN IF NOT EXISTS hover_url TEXT;
      `
    });
    
    if (alterError) {
      console.error('Error adding columns:', alterError);
      return;
    }
    
    console.log('✅ Columns added successfully!');
    
    // Add indexes
    const { error: indexError1 } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_farrow_ball_finishes_thumb_url ON farrow_ball_finishes(thumb_url);'
    });
    
    const { error: indexError2 } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_farrow_ball_finishes_hover_url ON farrow_ball_finishes(hover_url);'
    });
    
    if (indexError1 || indexError2) {
      console.error('Error adding indexes:', indexError1 || indexError2);
    } else {
      console.log('✅ Indexes added successfully!');
    }
    
    // Verify the columns exist
    const { data: sample, error: sampleError } = await supabase
      .from('farrow_ball_finishes')
      .select('color_name, thumb_url, hover_url')
      .limit(3);
      
    if (sampleError) {
      console.error('Error verifying columns:', sampleError);
    } else {
      console.log('\n📋 Sample data with new columns:');
      sample.forEach(record => {
        console.log(`- ${record.color_name}: thumb=${record.thumb_url ? '✅' : '❌'}, hover=${record.hover_url ? '✅' : '❌'}`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addImageColumns();

