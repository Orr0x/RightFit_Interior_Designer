import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function populateFromCompleteCSV() {
  console.log('🔄 Populating from complete Farrow_and_Ball_Colors.csv...\n');
  
  // Read the complete CSV file
  const csvPath = path.join(process.cwd(), 'public', 'Farrow_and_Ball_Colors.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const csvLines = csvText.split('\n');
  
  console.log(`📄 Found ${csvLines.length - 1} records in complete CSV`);
  
  const csvData = new Map();
  let parseErrors = 0;
  
  for (let i = 1; i < csvLines.length; i++) {
    const line = csvLines[i].trim();
    if (!line) continue;
    
    try {
      // Use proper CSV parsing to handle quoted fields
      const parsed = parseCSVLine(line);
      if (parsed.length < 6) {
        console.log(`⚠️ Skipping line ${i}: insufficient fields`);
        continue;
      }

      const name = parsed[0];
      const number = parsed[1];
      const productUrl = parsed[2];
      const thumbUrl = parsed[3];
      const hoverUrl = parsed[4];
      const description = parsed[5];

      if (!name || !number) {
        console.log(`⚠️ Skipping line ${i}: missing name or number`);
        continue;
      }

      // Generate finish_id the same way as database
      const finish_id = `${name.toLowerCase().replace(/\s+/g, '-')}-${number}`;
      
      // Clean URLs by removing quotes and trimming
      const cleanThumbUrl = thumbUrl?.replace(/^"/, '').replace(/"$/, '').trim();
      const cleanHoverUrl = hoverUrl?.replace(/^"/, '').replace(/"$/, '').trim();
      
      csvData.set(finish_id, {
        name,
        number,
        product_url: productUrl,
        thumb_url: cleanThumbUrl,
        hover_url: cleanHoverUrl,
        description: description?.replace(/^"/, '').replace(/"$/, '').trim()
      });
      
    } catch (error) {
      parseErrors++;
      console.log(`❌ Error parsing line ${i}: ${error.message}`);
    }
  }
  
  console.log(`✅ Parsed ${csvData.size} records from CSV`);
  if (parseErrors > 0) {
    console.log(`⚠️ Parse errors: ${parseErrors}`);
  }
  
  // Get all database records
  const { data: dbFinishes, error: dbError } = await supabase
    .from('farrow_ball_finishes')
    .select('finish_id, color_name, color_number');
    
  if (dbError) {
    console.error('❌ Database error:', dbError);
    return;
  }
  
  console.log(`📊 Database records: ${dbFinishes.length}`);
  
  // Update records with image URLs
  let updated = 0;
  let notFound = 0;
  let errors = 0;
  
  for (const dbFinish of dbFinishes) {
    const csvRecord = csvData.get(dbFinish.finish_id);
    
    if (csvRecord) {
      const { error: updateError } = await supabase
        .from('farrow_ball_finishes')
        .update({
          thumb_url: csvRecord.thumb_url,
          hover_url: csvRecord.hover_url,
          product_url: csvRecord.product_url
        })
        .eq('finish_id', dbFinish.finish_id);
        
      if (updateError) {
        console.error(`❌ Error updating ${dbFinish.finish_id}:`, updateError.message);
        errors++;
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
  console.log(`❌ Errors: ${errors} records`);
  
  // Verify the update with letter-based colors
  const { data: letterSample, error: letterError } = await supabase
    .from('farrow_ball_finishes')
    .select('color_name, color_number, thumb_url, hover_url')
    .in('color_number', ['W9', 'CB9', 'G16', 'CC6'])
    .not('thumb_url', 'is', null);
    
  if (letterError) {
    console.error('Sample error:', letterError);
  } else {
    console.log(`\n📋 Sample letter-based colors now with images:`);
    letterSample.forEach(record => {
      console.log(`✅ ${record.color_name} (${record.color_number}): ${record.thumb_url ? 'HAS THUMB' : 'NO THUMB'}, ${record.hover_url ? 'HAS HOVER' : 'NO HOVER'}`);
    });
  }
}

/**
 * Parse a single CSV line handling quoted fields properly
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current);
  return result;
}

populateFromCompleteCSV();
