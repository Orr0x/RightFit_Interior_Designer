import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Farrow & Ball import...');
console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Supabase Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImport() {
  try {
    console.log('📊 Loading JSON data...');
    
    // Load the scraped JSON data
    const jsonPath = path.join(__dirname, '../public/Farrow_and_Ball_Colours_Scraped/all_colors_structured_20250929_010851.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`📊 Found ${jsonData.length} colors to import`);
    
    // Test database connection
    console.log('🔌 Testing database connection...');
    const { data, error } = await supabase
      .from('farrow_ball_finishes')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Test with first color
    console.log('🎨 Testing with first color...');
    const firstColor = jsonData[0];
    console.log('First color:', firstColor.color_name);
    
    const finishId = `${firstColor.color_name.toLowerCase().replace(/\s+/g, '-')}-${firstColor.color_number}`;
    
    const finishData = {
      finish_id: finishId,
      color_name: firstColor.color_name,
      color_number: firstColor.color_number,
      product_url: firstColor.url,
      title: firstColor.title,
      description: firstColor.description,
      main_color_rgb: firstColor.main_color_rgb,
      main_color_hex: firstColor.main_color_hex,
      recommended_primer: firstColor.recommended_primer || null,
      complementary_color: firstColor.complementary_color || null,
      key_features: firstColor.key_features || [],
      available_finishes: firstColor.available_finishes || [],
      room_categories: firstColor.room_categories || [],
      price_info: firstColor.price_info || null,
      availability: firstColor.availability || null
    };
    
    console.log('📝 Inserting test color...');
    const { data: inserted, error: insertError } = await supabase
      .from('farrow_ball_finishes')
      .insert([finishData])
      .select();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }
    
    console.log('✅ Test insert successful!');
    console.log('Inserted color:', inserted[0].color_name);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImport();
