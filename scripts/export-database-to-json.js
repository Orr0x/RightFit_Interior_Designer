#!/usr/bin/env node

/**
 * Database to JSON Export Script
 * Exports all EGGER materials and Farrow & Ball finishes data to JSON files
 * for static loading instead of live database calls
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'public', 'data');
await fs.mkdir(dataDir, { recursive: true });

console.log('🚀 Starting database export to JSON...');
console.log('📁 Output directory:', dataDir);

/**
 * Export EGGER materials data
 */
async function exportEggerMaterials() {
  console.log('\n📦 Exporting EGGER materials...');
  
  try {
    // Export main decors table
    const { data: decors, error: decorsError } = await supabase
      .from('egger_decors')
      .select('*')
      .order('decor_name');

    if (decorsError) throw decorsError;

    // Export combinations
    const { data: combinations, error: combinationsError } = await supabase
      .from('egger_combinations')
      .select('*');

    if (combinationsError) throw combinationsError;

    // Export availability
    const { data: availability, error: availabilityError } = await supabase
      .from('egger_availability')
      .select('*');

    if (availabilityError) throw availabilityError;

    // Export interior matches
    const { data: interiorMatches, error: interiorMatchesError } = await supabase
      .from('egger_interior_matches')
      .select('*');

    if (interiorMatchesError) throw interiorMatchesError;

    // Export images
    const { data: images, error: imagesError } = await supabase
      .from('egger_images')
      .select('*')
      .order('decor_id, sort_order');

    if (imagesError) throw imagesError;

    // Export categories
    const { data: categories, error: categoriesError } = await supabase
      .from('egger_categories')
      .select('*');

    if (categoriesError) throw categoriesError;

    // Export textures
    const { data: textures, error: texturesError } = await supabase
      .from('egger_textures')
      .select('*');

    if (texturesError) throw texturesError;

    // Export color families
    const { data: colorFamilies, error: colorFamiliesError } = await supabase
      .from('egger_color_families')
      .select('*');

    if (colorFamiliesError) throw colorFamiliesError;

    // Group related data by decor_id
    const materialsData = decors.map(decor => {
      const decorCombinations = combinations.filter(c => c.decor_id === decor.decor_id);
      const decorAvailability = availability.filter(a => a.decor_id === decor.decor_id);
      const decorInteriorMatch = interiorMatches.find(im => im.decor_id === decor.decor_id);
      const decorImages = images.filter(img => img.decor_id === decor.decor_id);

      return {
        ...decor,
        combinations: decorCombinations,
        availability: decorAvailability,
        interior_match: decorInteriorMatch,
        images: decorImages
      };
    });

    // Create comprehensive EGGER data structure
    const eggerData = {
      materials: materialsData,
      categories: categories,
      textures: textures,
      color_families: colorFamilies,
      export_info: {
        exported_at: new Date().toISOString(),
        total_materials: materialsData.length,
        total_combinations: combinations.length,
        total_availability_records: availability.length,
        total_images: images.length
      }
    };

    // Write to JSON file
    const eggerPath = path.join(dataDir, 'egger-materials.json');
    await fs.writeFile(eggerPath, JSON.stringify(eggerData, null, 2));
    
    console.log(`✅ EGGER materials exported: ${materialsData.length} products`);
    console.log(`   📄 File: ${eggerPath}`);
    console.log(`   🖼️ Images: ${images.length}`);
    console.log(`   🔗 Combinations: ${combinations.length}`);

  } catch (error) {
    console.error('❌ Error exporting EGGER materials:', error);
    throw error;
  }
}

/**
 * Export Farrow & Ball finishes data
 */
async function exportFarrowBallFinishes() {
  console.log('\n🎨 Exporting Farrow & Ball finishes...');
  
  try {
    // Export main finishes table
    const { data: finishes, error: finishesError } = await supabase
      .from('farrow_ball_finishes')
      .select('*')
      .order('color_name');

    if (finishesError) throw finishesError;

    // Export color schemes
    const { data: colorSchemes, error: colorSchemesError } = await supabase
      .from('farrow_ball_color_schemes')
      .select('*')
      .order('finish_id, color_type');

    if (colorSchemesError) throw colorSchemesError;

    // Export images
    const { data: images, error: imagesError } = await supabase
      .from('farrow_ball_images')
      .select('*')
      .order('finish_id, image_order');

    if (imagesError) throw imagesError;

    // Group related data by finish_id
    const finishesData = finishes.map(finish => {
      const finishColorSchemes = colorSchemes.filter(cs => cs.finish_id === finish.finish_id);
      const finishImages = images.filter(img => img.finish_id === finish.finish_id);

      return {
        ...finish,
        color_schemes: finishColorSchemes,
        images: finishImages
      };
    });

    // Create comprehensive Farrow & Ball data structure
    const farrowBallData = {
      finishes: finishesData,
      export_info: {
        exported_at: new Date().toISOString(),
        total_finishes: finishesData.length,
        total_color_schemes: colorSchemes.length,
        total_images: images.length
      }
    };

    // Write to JSON file
    const farrowBallPath = path.join(dataDir, 'farrow-ball-finishes.json');
    await fs.writeFile(farrowBallPath, JSON.stringify(farrowBallData, null, 2));
    
    console.log(`✅ Farrow & Ball finishes exported: ${finishesData.length} colors`);
    console.log(`   📄 File: ${farrowBallPath}`);
    console.log(`   🎨 Color schemes: ${colorSchemes.length}`);
    console.log(`   🖼️ Images: ${images.length}`);

  } catch (error) {
    console.error('❌ Error exporting Farrow & Ball finishes:', error);
    throw error;
  }
}

/**
 * Export legacy CSV data for fallback
 */
async function exportLegacyData() {
  console.log('\n📄 Exporting legacy CSV data...');
  
  try {
    // Read existing CSV files
    const coloursCsvPath = path.join(__dirname, '..', 'public', 'colours.csv');
    const webpCsvPath = path.join(__dirname, '..', 'public', 'webp-images.csv');
    const boardsCsvPath = path.join(__dirname, '..', 'public', 'Boards.csv');

    const legacyData = {};

    // Export colours.csv data
    try {
      const coloursCsv = await fs.readFile(coloursCsvPath, 'utf-8');
      legacyData.colours_csv = coloursCsv;
      console.log('   ✅ colours.csv exported');
    } catch (error) {
      console.log('   ⚠️ colours.csv not found, skipping');
    }

    // Export webp-images.csv data
    try {
      const webpCsv = await fs.readFile(webpCsvPath, 'utf-8');
      legacyData.webp_images_csv = webpCsv;
      console.log('   ✅ webp-images.csv exported');
    } catch (error) {
      console.log('   ⚠️ webp-images.csv not found, skipping');
    }

    // Export Boards.csv data
    try {
      const boardsCsv = await fs.readFile(boardsCsvPath, 'utf-8');
      legacyData.boards_csv = boardsCsv;
      console.log('   ✅ Boards.csv exported');
    } catch (error) {
      console.log('   ⚠️ Boards.csv not found, skipping');
    }

    // Write legacy data
    const legacyPath = path.join(dataDir, 'legacy-csv-data.json');
    await fs.writeFile(legacyPath, JSON.stringify(legacyData, null, 2));
    
    console.log(`   📄 Legacy data exported: ${legacyPath}`);

  } catch (error) {
    console.error('❌ Error exporting legacy data:', error);
    // Don't throw here, legacy data is optional
  }
}

/**
 * Main export function
 */
async function main() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    const { data, error } = await supabase
      .from('egger_decors')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Database connection successful');

    // Export all data
    await exportEggerMaterials();
    await exportFarrowBallFinishes();
    await exportLegacyData();

    console.log('\n🎉 Export completed successfully!');
    console.log('📁 All JSON files saved to:', dataDir);
    console.log('\n📋 Next steps:');
    console.log('1. Update data services to use JSON files');
    console.log('2. Add development mode switching');
    console.log('3. Test both JSON and database modes');

  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  }
}

// Run the export
main();

