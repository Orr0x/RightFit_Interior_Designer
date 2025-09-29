import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDataAvailability() {
  console.log('🔍 Checking data availability mismatch...\n');
  
  // Get sample database colors
  const { data: dbFinishes, error: dbError } = await supabase
    .from('farrow_ball_finishes')
    .select('color_name, color_number')
    .limit(10);
    
  if (dbError) {
    console.error('Database error:', dbError);
    return;
  }
  
  console.log('📊 Database colors:');
  dbFinishes.forEach(finish => {
    console.log(`- ${finish.color_name} (${finish.color_number})`);
  });
  
  // Get sample CSV colors
  const csvResponse = await fetch('http://localhost:5173/colours.csv');
  const csvText = await csvResponse.text();
  const csvLines = csvText.split('\n');
  
  console.log('\n📄 CSV colors (first 10):');
  for (let i = 1; i <= 10 && i < csvLines.length; i++) {
    const line = csvLines[i];
    const values = line.split(',');
    if (values.length >= 2) {
      console.log(`- ${values[0]} (${values[1]})`);
    }
  }
  
  // Check for overlap
  console.log('\n🔍 Checking for overlap...');
  const dbNumbers = new Set(dbFinishes.map(f => f.color_number));
  const csvNumbers = new Set();
  
  for (let i = 1; i < csvLines.length; i++) {
    const line = csvLines[i];
    const values = line.split(',');
    if (values.length >= 2) {
      csvNumbers.add(values[1]);
    }
  }
  
  const overlap = [...dbNumbers].filter(num => csvNumbers.has(num));
  console.log(`Database colors: ${dbNumbers.size}`);
  console.log(`CSV colors: ${csvNumbers.size}`);
  console.log(`Overlap: ${overlap.length}`);
  console.log(`Overlap examples: ${overlap.slice(0, 5).join(', ')}`);
  
  // Check specific examples
  console.log('\n🎯 Specific examples:');
  const examples = ['9908', '79', '268', '54'];
  examples.forEach(num => {
    const inDb = dbNumbers.has(num);
    const inCsv = csvNumbers.has(num);
    console.log(`Color ${num}: DB=${inDb}, CSV=${inCsv}, Match=${inDb && inCsv}`);
  });
}

checkDataAvailability();

