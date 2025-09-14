import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://akfdezesupzuvukqiggn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixKitchenCategories() {
  console.log('🏠 FIXING KITCHEN COMPONENT CATEGORIES...');
  
  try {
    // 1. Remove DB prefix from component names
    console.log('🔄 Removing DB prefixes...');
    const { data: components } = await supabase
      .from('components')
      .select('id, name, component_id')
      .eq('room_type', 'kitchen')
      .like('component_id', 'db-%');
    
    if (components && components.length > 0) {
      for (const component of components) {
        const newName = component.name.replace(/^DB-/, '');
        if (newName !== component.name) {
          await supabase
            .from('components')
            .update({ name: newName })
            .eq('id', component.id);
          console.log(`✅ ${component.name} → ${newName}`);
        }
      }
    }
    
    // 2. Update categories for specific components
    console.log('🗂️  Updating categories...');
    
    const categoryUpdates = [
      // Base Units
      { component_id: 'db-base-cabinet-30', category: 'Base Units' },
      { component_id: 'db-base-cabinet-40', category: 'Base Units' },
      { component_id: 'db-base-cabinet-50', category: 'Base Units' },
      { component_id: 'db-base-cabinet-60', category: 'Base Units' },
      { component_id: 'db-base-cabinet-80', category: 'Base Units' },
      { component_id: 'db-corner-base-cabinet', category: 'Base Units' },
      
      // Drawer Units
      { component_id: 'db-pan-drawers-50', category: 'Drawer Units' },
      { component_id: 'db-pan-drawers-60', category: 'Drawer Units' },
      { component_id: 'db-pan-drawers-80', category: 'Drawer Units' },
      
      // Wall Units
      { component_id: 'db-wall-cabinet-30', category: 'Wall Units' },
      { component_id: 'db-wall-cabinet-40', category: 'Wall Units' },
      { component_id: 'db-wall-cabinet-50', category: 'Wall Units' },
      { component_id: 'db-wall-cabinet-60', category: 'Wall Units' },
      { component_id: 'db-wall-cabinet-80', category: 'Wall Units' },
      { component_id: 'db-wall-corner-cabinet', category: 'Wall Units' },
      
      // Tall Units
      { component_id: 'db-larder-unit-40', category: 'Tall Units' },
      { component_id: 'db-larder-unit-50', category: 'Tall Units' },
      { component_id: 'db-larder-unit-60', category: 'Tall Units' },
      { component_id: 'db-larder-unit-80', category: 'Tall Units' },
      { component_id: 'db-larder-corner-unit', category: 'Tall Units' },
      
      // Appliances
      { component_id: 'db-dishwasher', category: 'Appliances' },
      { component_id: 'db-fridge-freezer', category: 'Appliances' },
      { component_id: 'db-oven', category: 'Appliances' },
      { component_id: 'db-hob', category: 'Appliances' },
      { component_id: 'db-extractor-hood', category: 'Appliances' },
      { component_id: 'db-washing-machine', category: 'Appliances' },
      { component_id: 'db-tumble-dryer', category: 'Appliances' },
      
      // Worktops
      { component_id: 'db-worktop-horizontal', category: 'Worktops' },
      { component_id: 'db-worktop-vertical', category: 'Worktops' },
      { component_id: 'db-worktop-square', category: 'Worktops' },
      { component_id: 'db-worktop-corner', category: 'Worktops' },
      
      // Finishing
      { component_id: 'db-kitchen-cornice-1', category: 'Finishing' },
      { component_id: 'db-kitchen-cornice-2', category: 'Finishing' },
      { component_id: 'db-kitchen-cornice-3', category: 'Finishing' },
      { component_id: 'db-kitchen-pelmet-1', category: 'Finishing' },
      { component_id: 'db-kitchen-pelmet-2', category: 'Finishing' },
      { component_id: 'db-kitchen-pelmet-3', category: 'Finishing' },
      { component_id: 'db-kitchen-toe-kick-1', category: 'Finishing' },
      { component_id: 'db-kitchen-toe-kick-2', category: 'Finishing' },
      { component_id: 'db-kitchen-toe-kick-3', category: 'Finishing' },
      { component_id: 'db-wall-unit-end-panel', category: 'Finishing' },
      
      // Doors & Windows
      { component_id: 'db-door-single', category: 'Doors & Windows' },
      { component_id: 'db-door-double', category: 'Doors & Windows' },
      { component_id: 'db-window-single', category: 'Doors & Windows' },
      { component_id: 'db-window-double', category: 'Doors & Windows' },
      
      // Flooring
      { component_id: 'db-flooring-wood', category: 'Flooring' },
      { component_id: 'db-flooring-tile', category: 'Flooring' },
      { component_id: 'db-flooring-laminate', category: 'Flooring' },
      { component_id: 'db-flooring-vinyl', category: 'Flooring' }
    ];
    
    let updated = 0;
    for (const update of categoryUpdates) {
      const { error } = await supabase
        .from('components')
        .update({ category: update.category })
        .eq('component_id', update.component_id);
      
      if (error) {
        console.log(`❌ ${update.component_id}: ${error.message}`);
      } else {
        console.log(`✅ ${update.component_id} → ${update.category}`);
        updated++;
      }
    }
    
    console.log(`\n🎉 KITCHEN CATEGORIES FIXED!`);
    console.log(`✅ Updated ${updated} component categories`);
    console.log('✅ Removed DB prefixes from component names');
    console.log('\n📋 NEW CATEGORY STRUCTURE:');
    console.log('  1. Base Units - Floor-level storage cabinets');
    console.log('  2. Drawer Units - Base units with drawer storage');
    console.log('  3. Wall Units - Upper wall-mounted cabinets');
    console.log('  4. Tall Units - Full-height storage solutions');
    console.log('  5. Appliances - Kitchen appliances and equipment');
    console.log('  6. Worktops - Counter surfaces and worktops');
    console.log('  7. Finishing - Decorative and finishing elements');
    console.log('  8. Doors & Windows - Architectural openings');
    console.log('  9. Flooring - Floor materials and finishes');
    
  } catch (error) {
    console.error('💥 ERROR:', error);
  }
}

fixKitchenCategories();
