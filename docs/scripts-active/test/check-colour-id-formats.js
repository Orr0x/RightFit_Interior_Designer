import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkColourIds() {
  console.log('🔍 Checking colour_id formats...\n');
  
  // Check database finish_id format
  const { data: dbFinishes, error: dbError } = await supabase
    .from('farrow_ball_finishes')
    .select('finish_id, color_name, color_number')
    .limit(3);
    
  if (dbError) {
    console.error('Database error:', dbError);
    return;
  }
  
  console.log('📊 Database finish_id format:');
  dbFinishes.forEach(finish => {
    console.log(`- ${finish.color_name}: ${finish.finish_id}`);
  });
  
  // Check CSV colour_id format
  const csvResponse = await fetch('http://localhost:5173/colours.csv');
  const csvText = await csvResponse.text();
  const csvLines = csvText.split('\n');
  const csvHeader = csvLines[0];
  const csvSample = csvLines[1];
  
  console.log('\n📄 CSV data sample:');
  console.log('Header:', csvHeader);
  console.log('Sample:', csvSample);
  
  // Parse CSV to see colour_id format
  const csvData = csvSample.split(',');
  const name = csvData[0];
  const number = csvData[1];
  const productUrl = csvData[2];
  
  console.log('\n🔍 CSV colour_id would be:');
  console.log(`- Name: ${name}`);
  console.log(`- Number: ${number}`);
  console.log(`- Generated colour_id: ${name.toLowerCase().replace(/\s+/g, '-')}-${number}`);
  
  // Check how CSV parser generates colour_id
  console.log('\n🔧 Checking CSV parser logic...');
  const parseColoursCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    const finishes = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(',');
      
      if (values.length >= 6) {
        const name = values[0];
        const number = values[1];
        const productUrl = values[2];
        const thumbUrl = values[3];
        const hoverUrl = values[4];
        const description = values.slice(5).join(',').replace(/"/g, '');
        
        const colour_id = `${name.toLowerCase().replace(/\s+/g, '-')}-${number}`;
        
        finishes.push({
          colour_id,
          colour_name: name,
          colour_number: number,
          product_url: productUrl,
          thumb_url: thumbUrl,
          hover_url: hoverUrl,
          description
        });
      }
    }
    
    return { finishes };
  };
  
  const parsedData = parseColoursCSV(csvText);
  console.log('CSV parser generates:');
  parsedData.finishes.slice(0, 3).forEach(finish => {
    console.log(`- ${finish.colour_name}: ${finish.colour_id}`);
  });
}

checkColourIds();
