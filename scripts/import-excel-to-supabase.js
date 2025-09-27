// Import Excel data to Supabase EGGER database
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Excel file path
const EXCEL_FILE_PATH = path.join(__dirname, '../public/MAIN_EGGER_DECOR_DATA.xlsx');

class EggerDataImporter {
  constructor() {
    this.stats = {
      decors: 0,
      combinations: 0,
      availability: 0,
      interior_matches: 0,
      no_combinations: 0,
      images: 0,
      categories: 0,
      textures: 0,
      color_families: 0,
      errors: []
    };
  }

  async importFromExcel() {
    try {
      console.log('🚀 Starting EGGER Excel to Supabase import...');
      console.log(`📁 Excel file: ${EXCEL_FILE_PATH}`);
      
      // Check if Excel file exists
      if (!fs.existsSync(EXCEL_FILE_PATH)) {
        throw new Error(`Excel file not found: ${EXCEL_FILE_PATH}`);
      }

      // For now, we'll create a mock implementation
      // In production, you'd use xlsx library to read the actual Excel file
      console.log('⚠️  Excel processing not yet implemented');
      console.log('📋 Please convert Excel to CSV first, then run the CSV import');
      
      // TODO: Implement actual Excel reading with xlsx library
      // const workbook = xlsx.readFile(EXCEL_FILE_PATH);
      // const mainSheet = workbook.Sheets['Main'];
      // const combinationsSheet = workbook.Sheets['Combinations'];
      // etc.
      
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      this.stats.errors.push(error.message);
    }
  }

  async importFromCSV() {
    try {
      console.log('🔄 Importing from existing CSV files...');
      
      // Load existing CSV data
      const webpData = await this.loadCSVData('/webp-images.csv');
      const boardsData = await this.loadCSVData('/Boards.csv');
      const coloursData = await this.loadCSVData('/colours.csv');
      
      // Process and import data
      await this.importDecors(webpData, boardsData);
      await this.importImages(webpData);
      await this.importLookupData(boardsData, coloursData);
      
      this.printStats();
      
    } catch (error) {
      console.error('❌ CSV import failed:', error.message);
      this.stats.errors.push(error.message);
    }
  }

  async loadCSVData(filename) {
    try {
      // Try to load from public folder
      const filePath = path.join(__dirname, '../public', filename);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      }
      
      // Fallback to fetch (for development server)
      const response = await fetch(`http://localhost:3000${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
      }
      return await response.text();
    } catch (error) {
      console.warn(`⚠️  Could not load ${filename}:`, error.message);
      return '';
    }
  }

  async importDecors(webpData, boardsData) {
    console.log('📦 Importing decors...');
    
    // Parse WebP data for decor information
    const webpLines = webpData.split('\n').filter(line => line.trim());
    const decorMap = new Map();
    
    for (let i = 1; i < webpLines.length; i++) {
      const line = webpLines[i].trim();
      if (!line) continue;
      
      const [decor_id, decor_name, decor, texture, product_page_url, image_url, fileType, uniqueKey] = line.split(',');
      
      if (!decor_id || !decor_name) continue;
      
      if (!decorMap.has(decor_id)) {
        decorMap.set(decor_id, {
          decor_id,
          decor_name,
          decor,
          texture,
          product_page_url,
          images: []
        });
      }
      
      if (image_url) {
        decorMap.get(decor_id).images.push(image_url);
      }
    }
    
    // Insert decors into database
    const decors = Array.from(decorMap.values());
    for (const decor of decors) {
      try {
        const { error } = await supabase
          .from('egger_decors')
          .upsert({
            decor_id: decor.decor_id,
            decor_name: decor.decor_name,
            decor: decor.decor,
            texture: decor.texture,
            product_page_url: decor.product_page_url || null
          }, { onConflict: 'decor_id' });
        
        if (error) throw error;
        this.stats.decors++;
        
      } catch (error) {
        console.error(`❌ Failed to import decor ${decor.decor_id}:`, error.message);
        this.stats.errors.push(`Decor ${decor.decor_id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Imported ${this.stats.decors} decors`);
  }

  async importImages(webpData) {
    console.log('🖼️  Importing images...');
    
    const webpLines = webpData.split('\n').filter(line => line.trim());
    
    for (let i = 1; i < webpLines.length; i++) {
      const line = webpLines[i].trim();
      if (!line) continue;
      
      const [decor_id, decor_name, decor, texture, product_page_url, image_url, fileType, uniqueKey] = line.split(',');
      
      if (!decor_id || !image_url) continue;
      
      try {
        const { error } = await supabase
          .from('egger_images')
          .insert({
            decor_id,
            image_url,
            image_type: fileType || 'webp',
            is_primary: false,
            sort_order: 0
          });
        
        if (error) throw error;
        this.stats.images++;
        
      } catch (error) {
        console.error(`❌ Failed to import image for ${decor_id}:`, error.message);
        this.stats.errors.push(`Image ${decor_id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Imported ${this.stats.images} images`);
  }

  async importLookupData(boardsData, coloursData) {
    console.log('📚 Importing lookup data...');
    
    // Import textures
    const textureSet = new Set();
    const boardsLines = boardsData.split('\n').filter(line => line.trim());
    
    for (let i = 1; i < boardsLines.length; i++) {
      const line = boardsLines[i].trim();
      if (!line) continue;
      
      const [decor_id, decor_name, decor, texture, product_page_url, image_url] = line.split(',');
      if (texture) textureSet.add(texture);
    }
    
    // Insert textures
    for (const texture of textureSet) {
      try {
        const { error } = await supabase
          .from('egger_textures')
          .upsert({ name: texture }, { onConflict: 'name' });
        
        if (error) throw error;
        this.stats.textures++;
      } catch (error) {
        console.error(`❌ Failed to import texture ${texture}:`, error.message);
      }
    }
    
    console.log(`✅ Imported ${textureSet.size} textures`);
    
    // Import color families from colours data
    if (coloursData) {
      await this.importColorFamilies(coloursData);
    }
  }

  async importColorFamilies(coloursData) {
    console.log('🎨 Importing color families...');
    
    const colourLines = coloursData.split('\n').filter(line => line.trim());
    const colorFamilySet = new Set();
    
    for (let i = 1; i < colourLines.length; i++) {
      const line = colourLines[i].trim();
      if (!line) continue;
      
      const [name, color_hex, description] = line.split(',');
      if (name) colorFamilySet.add(name);
    }
    
    // Insert color families
    for (const colorFamily of colorFamilySet) {
      try {
        const { error } = await supabase
          .from('egger_color_families')
          .upsert({ 
            name: colorFamily,
            color_hex: null,
            description: null
          }, { onConflict: 'name' });
        
        if (error) throw error;
        this.stats.color_families++;
      } catch (error) {
        console.error(`❌ Failed to import color family ${colorFamily}:`, error.message);
      }
    }
    
    console.log(`✅ Imported ${colorFamilySet.size} color families`);
  }

  async createSampleData() {
    console.log('🎯 Creating sample EGGER data for testing...');
    
    try {
      // Create sample categories
      const categories = ['Marble', 'Wood', 'Metal', 'Concrete', 'Stone', 'Textile'];
      for (const category of categories) {
        await supabase
          .from('egger_categories')
          .upsert({ name: category }, { onConflict: 'name' });
        this.stats.categories++;
      }
      
      // Create sample combinations
      const sampleCombinations = [
        {
          decor_id: 'sample-1',
          recommended_decor_id: 'sample-2',
          match_type: 'color',
          confidence_score: 0.85,
          notes: 'Complementary color match'
        }
      ];
      
      for (const combination of sampleCombinations) {
        await supabase
          .from('egger_combinations')
          .insert(combination);
        this.stats.combinations++;
      }
      
      console.log('✅ Sample data created');
      
    } catch (error) {
      console.error('❌ Failed to create sample data:', error.message);
    }
  }

  printStats() {
    console.log('\n📊 Import Statistics:');
    console.log('====================');
    console.log(`✅ Decors: ${this.stats.decors}`);
    console.log(`✅ Images: ${this.stats.images}`);
    console.log(`✅ Textures: ${this.stats.textures}`);
    console.log(`✅ Color Families: ${this.stats.color_families}`);
    console.log(`✅ Categories: ${this.stats.categories}`);
    console.log(`✅ Combinations: ${this.stats.combinations}`);
    console.log(`✅ Availability: ${this.stats.availability}`);
    console.log(`✅ Interior Matches: ${this.stats.interior_matches}`);
    console.log(`✅ No Combinations: ${this.stats.no_combinations}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors (${this.stats.errors.length}):`);
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n🎉 Import completed!');
    console.log('💡 Next steps:');
    console.log('  1. Run the database migration in Supabase');
    console.log('  2. Update your EGGER gallery to use the new service');
    console.log('  3. Test the database integration');
  }
}

// Main execution
async function main() {
  const importer = new EggerDataImporter();
  
  // Check if Excel file exists
  if (fs.existsSync(EXCEL_FILE_PATH)) {
    console.log('📊 Excel file found, attempting Excel import...');
    await importer.importFromExcel();
  } else {
    console.log('📄 Excel file not found, falling back to CSV import...');
    await importer.importFromCSV();
  }
  
  // Create sample data for testing
  await importer.createSampleData();
}

// Run the import
main().catch(console.error);
