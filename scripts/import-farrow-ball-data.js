import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
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

class FarrowBallDataImporter {
  constructor() {
    this.stats = {
      total: 0,
      imported: 0,
      errors: [],
      skipped: 0
    };
  }

  async importFromJSON() {
    try {
      console.log('🔄 Importing Farrow & Ball data from JSON...');
      
      // Load the scraped JSON data
      const jsonPath = path.join(__dirname, '../public/Farrow_and_Ball_Colours_Scraped/all_colors_structured_20250929_010851.json');
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      console.log(`📊 Found ${jsonData.length} colors to import`);
      this.stats.total = jsonData.length;

      // Clear existing data
      console.log('🧹 Clearing existing data...');
      await this.clearAllData();

      // Import each color
      for (let i = 0; i < jsonData.length; i++) {
        const color = jsonData[i];
        try {
          await this.importColor(color);
          this.stats.imported++;
          
          if ((i + 1) % 50 === 0) {
            console.log(`✅ Processed ${i + 1}/${jsonData.length} colors`);
          }
        } catch (error) {
          console.error(`❌ Error importing color ${color.color_name}:`, error.message);
          this.stats.errors.push(`${color.color_name}: ${error.message}`);
        }
      }

      this.printStats();
      
    } catch (error) {
      console.error('❌ JSON import failed:', error.message);
      this.stats.errors.push(error.message);
    }
  }

  async importColor(colorData) {
    // Generate finish_id from color name and number
    const finishId = `${colorData.color_name.toLowerCase().replace(/\s+/g, '-')}-${colorData.color_number}`;
    
    // Prepare main finish data
    const finishData = {
      finish_id: finishId,
      color_name: colorData.color_name,
      color_number: colorData.color_number,
      product_url: colorData.url,
      title: colorData.title,
      description: colorData.description,
      main_color_rgb: colorData.main_color_rgb,
      main_color_hex: colorData.main_color_hex,
      recommended_primer: colorData.recommended_primer || null,
      complementary_color: colorData.complementary_color || null,
      key_features: colorData.key_features || [],
      available_finishes: colorData.available_finishes || [],
      room_categories: colorData.room_categories || [],
      price_info: colorData.price_info || null,
      availability: colorData.availability || null
    };

    // Insert main finish
    const { data: finish, error: finishError } = await supabase
      .from('farrow_ball_finishes')
      .insert([finishData])
      .select()
      .single();

    if (finishError) throw finishError;

    // Import color schemes
    if (colorData.extracted_colors && Array.isArray(colorData.extracted_colors)) {
      for (const colorScheme of colorData.extracted_colors) {
        const schemeData = {
          finish_id: finishId,
          rgb: colorScheme.rgb,
          hex: colorScheme.hex,
          color_type: colorScheme.type
        };

        const { error: schemeError } = await supabase
          .from('farrow_ball_color_schemes')
          .insert([schemeData]);

        if (schemeError) {
          console.warn(`⚠️ Error importing color scheme for ${colorData.color_name}:`, schemeError.message);
        }
      }
    }

    // Import product images
    if (colorData.product_images && Array.isArray(colorData.product_images)) {
      for (let i = 0; i < colorData.product_images.length; i++) {
        const imageUrl = colorData.product_images[i];
        if (imageUrl && imageUrl.trim()) {
          // Find the correct main image by checking if the URL contains the color name
          const colorNameInUrl = colorData.color_name.toLowerCase().replace(/\s+/g, '_');
          const isMainImage = imageUrl.toLowerCase().includes(colorNameInUrl) || i === 0;
          
          const imageData = {
            finish_id: finishId,
            image_url: imageUrl,
            image_type: 'product',
            image_order: i,
            is_main_image: isMainImage
          };

          const { error: imageError } = await supabase
            .from('farrow_ball_images')
            .insert([imageData]);

          if (imageError) {
            console.warn(`⚠️ Error importing image for ${colorData.color_name}:`, imageError.message);
          }
        }
      }
    }

    // Import categories
    if (colorData.room_categories && Array.isArray(colorData.room_categories)) {
      for (const category of colorData.room_categories) {
        if (category && category.trim()) {
          await this.importCategory(category);
        }
      }
    }
  }

  async importCategory(categoryName) {
    // Check if category already exists
    const { data: existing } = await supabase
      .from('farrow_ball_categories')
      .select('id')
      .eq('category_name', categoryName)
      .single();

    if (!existing) {
      const { error } = await supabase
        .from('farrow_ball_categories')
        .insert([{
          category_name: categoryName,
          description: `Category for ${categoryName} colors`
        }]);

      if (error) {
        console.warn(`⚠️ Error importing category ${categoryName}:`, error.message);
      }
    }
  }

  async clearAllData() {
    try {
      // Delete in order due to foreign key constraints
      await supabase.from('farrow_ball_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('farrow_ball_color_schemes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('farrow_ball_finishes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('farrow_ball_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('farrow_ball_color_families').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.warn('⚠️ Error clearing data:', error.message);
    }
  }

  printStats() {
    console.log('\n📊 IMPORT STATISTICS');
    console.log('='.repeat(50));
    console.log(`Total colors: ${this.stats.total}`);
    console.log(`Successfully imported: ${this.stats.imported}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n✅ Import completed!');
  }
}

// Main execution
async function main() {
  const importer = new FarrowBallDataImporter();
  await importer.importFromJSON();
}

// Run the import
main().catch(console.error);

export default FarrowBallDataImporter;
