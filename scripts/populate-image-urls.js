import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function populateImageUrls() {
  console.log('🔄 Populating thumb_url and hover_url from CSV data...\n');
  
  // First, run the migration to add the columns
  console.log('📋 Running migration to add image URL columns...');
  
  // Get CSV data from file system
  const csvPath = path.join(process.cwd(), 'public', 'colours.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const csvLines = csvText.split('\n');
  
  const csvData = new Map();
  for (let i = 1; i < csvLines.length; i++) {
    const line = csvLines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    if (values.length >= 6) {
      const name = values[0];
      const number = values[1];
      const productUrl = values[2];
      const thumbUrl = values[3];
      const hoverUrl = values[4];
      const description = values.slice(5).join(',').replace(/"/g, '');
      
      const finish_id = `${name.toLowerCase().replace(/\s+/g, '-')}-${number}`;
      
      // Clean URLs by removing quotes and trimming
      const cleanThumbUrl = thumbUrl?.replace(/^"/, '').replace(/"$/, '').trim();
      const cleanHoverUrl = hoverUrl?.replace(/^"/, '').replace(/"$/, '').trim();
      
      csvData.set(finish_id, {
        thumb_url: cleanThumbUrl,
        hover_url: cleanHoverUrl
      });
    }
  }
  
  console.log(`📄 Parsed CSV data: ${csvData.size} records`);
  
  // Get all database records
  const { data: dbFinishes, error: dbError } = await supabase
    .from('farrow_ball_finishes')
    .select('finish_id, color_name, color_number');
    
  if (dbError) {
    console.error('Database error:', dbError);
    return;
  }
  
  console.log(`📊 Database records: ${dbFinishes.length}`);
  
  // Update records with image URLs
  let updated = 0;
  let notFound = 0;
  
  for (const dbFinish of dbFinishes) {
    const csvRecord = csvData.get(dbFinish.finish_id);
    
    if (csvRecord) {
      const { error: updateError } = await supabase
        .from('farrow_ball_finishes')
        .update({
          thumb_url: csvRecord.thumb_url,
          hover_url: csvRecord.hover_url
        })
        .eq('finish_id', dbFinish.finish_id);
        
      if (updateError) {
        console.error(`Error updating ${dbFinish.finish_id}:`, updateError);
      } else {
        updated++;
        if (updated % 50 === 0) {
          console.log(`✅ Updated ${updated} records...`);
        }
      }
    } else {
      notFound++;
      if (notFound <= 5) {
        console.log(`⚠️ No CSV data found for: ${dbFinish.finish_id} (${dbFinish.color_name})`);
      }
    }
  }
  
  console.log(`\n🎉 Update complete!`);
  console.log(`✅ Updated: ${updated} records`);
  console.log(`⚠️ Not found in CSV: ${notFound} records`);
  
  // Verify the update
  const { data: sample, error: sampleError } = await supabase
    .from('farrow_ball_finishes')
    .select('color_name, thumb_url, hover_url')
    .not('thumb_url', 'is', null)
    .limit(5);
    
  if (sampleError) {
    console.error('Sample error:', sampleError);
  } else {
    console.log('\n📋 Sample updated records:');
    sample.forEach(record => {
      console.log(`- ${record.color_name}: thumb=${record.thumb_url ? '✅' : '❌'}, hover=${record.hover_url ? '✅' : '❌'}`);
    });
  }
}

populateImageUrls();


