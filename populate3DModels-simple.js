// Simple 3D Models Population Script (ES Module)
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://akfdezesupzuvukqiggn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('🚀 Starting 3D models migration...');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Service key provided:', SUPABASE_SERVICE_KEY ? 'Yes' : 'No');

if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.includes('your-service-role-key')) {
  console.error('❌ Please set SUPABASE_SERVICE_KEY environment variable');
  console.log('Usage: $env:SUPABASE_SERVICE_KEY = "sb_secret_your_key"; node populate3DModels-simple.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Core 3D model data
const core3DModels = [
  {
    model_type: 'cabinet',
    geometry_type: 'box',
    primary_material: 'wood',
    primary_color: '#8B4513',
    has_doors: true,
    has_drawers: false,
    has_handles: true,
    has_legs: false,
    default_y_position: 0,
    wall_mounted: false,
    special_features: {
      frame_thickness: 0.02,
      door_thickness: 0.018,
      handle_style: 'modern',
      wood_grain: true
    }
  },
  {
    model_type: 'appliance',
    geometry_type: 'box',
    primary_material: 'metal',
    primary_color: '#C0C0C0',
    has_doors: false,
    has_drawers: false,
    has_handles: true,
    has_legs: false,
    default_y_position: 0,
    wall_mounted: false,
    special_features: {
      metallic_finish: true,
      rounded_corners: true
    }
  },
  {
    model_type: 'counter-top',
    geometry_type: 'box',
    primary_material: 'stone',
    primary_color: '#D2B48C',
    has_doors: false,
    has_drawers: false,
    has_handles: false,
    has_legs: false,
    default_y_position: 0.9,
    wall_mounted: false,
    special_features: {
      thickness: 0.04,
      edge_profile: 'bullnose',
      surface_finish: 'polished'
    }
  },
  {
    model_type: 'end-panel',
    geometry_type: 'box',
    primary_material: 'wood',
    primary_color: '#8B4513',
    has_doors: false,
    has_drawers: false,
    has_handles: false,
    has_legs: false,
    default_y_position: 0,
    wall_mounted: false,
    special_features: {
      thickness: 0.02,
      wood_grain: true,
      edge_banding: true
    }
  }
];

async function populateModels() {
  try {
    console.log('📊 Inserting core 3D models...');
    
    for (const modelData of core3DModels) {
      console.log(`  Inserting ${modelData.model_type} model...`);
      
      const { data, error } = await supabase
        .from('model_3d')
        .insert([modelData])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error inserting ${modelData.model_type}:`, error.message);
      } else {
        console.log(`✅ Inserted ${modelData.model_type} model (ID: ${data.id})`);
      }
    }
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('model_3d')
      .select('count(*)', { count: 'exact' });
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError.message);
    } else {
      console.log(`✅ Database connected. Total 3D models: ${testData.length > 0 ? testData[0].count : 'Unknown'}`);
    }
    
    console.log('🎉 3D Models population completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the population
populateModels();
