import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://akfdezesupzuvukqiggn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Professional kitchen component categories in logical order
const newKitchenCategories = [
  {
    name: 'Base Units',
    description: 'Floor-level storage cabinets',
    display_order: 1,
    components: [
      'db-base-cabinet-30',
      'db-base-cabinet-40', 
      'db-base-cabinet-50',
      'db-base-cabinet-60',
      'db-base-cabinet-80',
      'db-corner-base-cabinet'
    ]
  },
  {
    name: 'Drawer Units',
    description: 'Base units with drawer storage',
    display_order: 2,
    components: [
      'db-pan-drawers-50',
      'db-pan-drawers-60', 
      'db-pan-drawers-80'
    ]
  },
  {
    name: 'Wall Units',
    description: 'Upper wall-mounted cabinets',
    display_order: 3,
    components: [
      'db-wall-cabinet-30',
      'db-wall-cabinet-40',
      'db-wall-cabinet-50', 
      'db-wall-cabinet-60',
      'db-wall-cabinet-80',
      'db-wall-corner-cabinet'
    ]
  },
  {
    name: 'Tall Units',
    description: 'Full-height storage solutions',
    display_order: 4,
    components: [
      'db-larder-unit-40',
      'db-larder-unit-50',
      'db-larder-unit-60',
      'db-larder-unit-80',
      'db-larder-corner-unit'
    ]
  },
  {
    name: 'Appliances',
    description: 'Kitchen appliances and equipment',
    display_order: 5,
    components: [
      'db-dishwasher',
      'db-fridge-freezer',
      'db-oven',
      'db-hob',
      'db-extractor-hood',
      'db-washing-machine',
      'db-tumble-dryer'
    ]
  },
  {
    name: 'Worktops',
    description: 'Counter surfaces and worktops',
    display_order: 6,
    components: [
      'db-worktop-horizontal',
      'db-worktop-vertical',
      'db-worktop-square',
      'db-worktop-corner'
    ]
  },
  {
    name: 'Finishing',
    description: 'Decorative and finishing elements',
    display_order: 7,
    components: [
      'db-kitchen-cornice-1',
      'db-kitchen-cornice-2', 
      'db-kitchen-cornice-3',
      'db-kitchen-pelmet-1',
      'db-kitchen-pelmet-2',
      'db-kitchen-pelmet-3',
      'db-kitchen-toe-kick-1',
      'db-kitchen-toe-kick-2',
      'db-kitchen-toe-kick-3',
      'db-wall-unit-end-panel'
    ]
  },
  {
    name: 'Doors & Windows',
    description: 'Architectural openings',
    display_order: 8,
    components: [
      'db-door-single',
      'db-door-double',
      'db-window-single',
      'db-window-double'
    ]
  },
  {
    name: 'Flooring',
    description: 'Floor materials and finishes',
    display_order: 9,
    components: [
      'db-flooring-wood',
      'db-flooring-tile',
      'db-flooring-laminate',
      'db-flooring-vinyl'
    ]
  }
];

// Remove DB prefix from component names
const removeDBPrefix = async () => {
  console.log('🔄 REMOVING DB PREFIX FROM COMPONENT NAMES...');
  
  try {
    // Get all kitchen components with DB prefix
    const { data: components } = await supabase
      .from('components')
      .select('id, name, component_id')
      .eq('room_type', 'kitchen')
      .like('component_id', 'db-%');
    
    if (!components || components.length === 0) {
      console.log('⚠️  No DB components found');
      return;
    }
    
    let updated = 0;
    for (const component of components) {
      // Remove 'DB-' prefix from name
      const newName = component.name.replace(/^DB-/, '');
      
      if (newName !== component.name) {
        const { error } = await supabase
          .from('components')
          .update({ name: newName })
          .eq('id', component.id);
        
        if (error) {
          console.log(`❌ ${component.name}: ${error.message}`);
        } else {
          console.log(`✅ ${component.name} → ${newName}`);
          updated++;
        }
      }
    }
    
    console.log(`✅ Updated ${updated} component names`);
    
  } catch (error) {
    console.error('💥 Error removing DB prefix:', error);
  }
};

// Update component categories
const updateComponentCategories = async () => {
  console.log('🗂️  UPDATING KITCHEN COMPONENT CATEGORIES...');
  
  try {
    // First, get all current kitchen components
    const { data: allComponents } = await supabase
      .from('components')
      .select('id, component_id, name, category')
      .eq('room_type', 'kitchen');
    
    if (!allComponents) {
      console.log('⚠️  No kitchen components found');
      return;
    }
    
    // Create a map of component_id to new category
    const componentCategoryMap = {};
    for (const category of newKitchenCategories) {
      for (const componentId of category.components) {
        componentCategoryMap[componentId] = category.name;
      }
    }
    
    // Update each component's category
    let updated = 0;
    for (const component of allComponents) {
      const newCategory = componentCategoryMap[component.component_id];
      
      if (newCategory && newCategory !== component.category) {
        const { error } = await supabase
          .from('components')
          .update({ category: newCategory })
          .eq('id', component.id);
        
        if (error) {
          console.log(`❌ ${component.name}: ${error.message}`);
        } else {
          console.log(`✅ ${component.name} → ${newCategory}`);
          updated++;
        }
      }
    }
    
    console.log(`✅ Updated ${updated} component categories`);
    
    // Show the new category structure
    console.log('\n📋 NEW KITCHEN CATEGORY STRUCTURE:');
    for (const category of newKitchenCategories) {
      console.log(`  ${category.display_order}. ${category.name} (${category.components.length} components)`);
    }
    
  } catch (error) {
    console.error('💥 Error updating categories:', error);
  }
};

// Main execution
async function reorganizeKitchenComponents() {
  console.log('🏠 REORGANIZING KITCHEN COMPONENTS...');
  
  try {
    // 1. Remove DB prefix from names
    await removeDBPrefix();
    
    // 2. Update categories
    await updateComponentCategories();
    
    console.log('\n🎉 KITCHEN COMPONENT REORGANIZATION COMPLETE!');
    console.log('✅ Removed DB prefixes from component names');
    console.log('✅ Organized into 9 logical categories');
    console.log('✅ Professional cabinet maker workflow');
    
  } catch (error) {
    console.error('💥 REORGANIZATION FAILED:', error);
  }
}

reorganizeKitchenComponents();
