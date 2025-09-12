// Generate SQL migration for ALL non-kitchen room components
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the extracted components
const componentsPath = path.join(__dirname, 'extracted-components.json');
const components = JSON.parse(fs.readFileSync(componentsPath, 'utf8'));

// Filter for non-kitchen components (components for other rooms)
const nonKitchenComponents = components.filter(component => {
  // Skip if it's kitchen-only
  const isKitchenOnly = component.room_types.length === 1 && component.room_types[0] === 'kitchen';
  const isKitchenCategory = component.category.includes('kitchen') || 
                           component.category.includes('base-cabinets') ||
                           component.category.includes('wall-units') ||
                           component.category.includes('appliances') && component.room_types.includes('kitchen');
  
  return !isKitchenOnly && !isKitchenCategory;
});

console.log(`Found ${nonKitchenComponents.length} non-kitchen components`);

// Group by primary room type
const byRoom = nonKitchenComponents.reduce((acc, comp) => {
  // Find the primary room (first non-kitchen room, or first room)
  const primaryRoom = comp.room_types.find(rt => rt !== 'kitchen') || comp.room_types[0];
  if (!acc[primaryRoom]) acc[primaryRoom] = [];
  acc[primaryRoom].push(comp);
  return acc;
}, {});

console.log('\n🏠 Components by room type:');
Object.entries(byRoom)
  .sort(([,a], [,b]) => b.length - a.length)
  .forEach(([room, comps]) => {
    console.log(`  ${room}: ${comps.length}`);
  });

// Group by category for better overview
const byCategory = nonKitchenComponents.reduce((acc, comp) => {
  if (!acc[comp.category]) acc[comp.category] = [];
  acc[comp.category].push(comp);
  return acc;
}, {});

console.log('\n📦 Components by category:');
Object.entries(byCategory)
  .sort(([,a], [,b]) => b.length - a.length)
  .forEach(([category, comps]) => {
    console.log(`  ${category}: ${comps.length}`);
  });

// Generate SQL INSERT statements
function generateSQL(components) {
  const sqlValues = components.map(comp => {
    const roomTypesArray = `ARRAY[${comp.room_types.map(rt => `'${rt}'`).join(', ')}]`;
    
    return `('${comp.component_id}', '${comp.name}', '${comp.type}', ${comp.width}, ${comp.depth}, ${comp.height}, '${comp.color}', '${comp.category}', ${roomTypesArray}, '${comp.icon_name}', '${comp.description.replace(/'/g, "''")}', '${comp.version}', ${comp.deprecated}, '{}', '{}')`;
  });

  return `-- Complete Multi-Room Component Library
-- Generated from extracted components
-- Bedrooms, Bathrooms, Living Rooms, Offices, Dining Rooms, and Universal Components

-- Temporarily disable RLS
ALTER TABLE public.components DISABLE ROW LEVEL SECURITY;

-- Insert all non-kitchen components
INSERT INTO public.components (
  component_id, name, type, width, depth, height, color, category, room_types, icon_name, description, version, deprecated, metadata, tags
) VALUES 
${sqlValues.join(',\n')}

ON CONFLICT (component_id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  width = EXCLUDED.width,
  depth = EXCLUDED.depth,
  height = EXCLUDED.height,
  color = EXCLUDED.color,
  category = EXCLUDED.category,
  room_types = EXCLUDED.room_types,
  icon_name = EXCLUDED.icon_name,
  description = EXCLUDED.description,
  version = EXCLUDED.version;

-- Re-enable RLS
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🌅 THE HORIZON IS HERE! Multi-room component library installed! 🏠';
  RAISE NOTICE 'Added ${components.length} components across all room types';
  RAISE NOTICE 'Room types: ${Object.keys(byRoom).join(', ')}';
  RAISE NOTICE 'Categories: ${Object.keys(byCategory).slice(0, 10).join(', ')}...';
  RAISE NOTICE 'Your design empire now spans the entire home! 🚀✨';
END $$;`;
}

// Generate the SQL
const sql = generateSQL(nonKitchenComponents);

// Write to migration file
const migrationPath = path.join(__dirname, '../../supabase/migrations/20250912240000_complete_multiroom_components.sql');
fs.writeFileSync(migrationPath, sql);

console.log(`\n✅ Generated SQL migration: ${migrationPath}`);
console.log(`🏠 Total multi-room components: ${nonKitchenComponents.length}`);
console.log(`🚀 Ready to conquer the horizon: npx supabase db push`);

// Show sample components by room
console.log(`\n🌅 HORIZON PREVIEW - Sample components by room:`);
Object.entries(byRoom)
  .sort(([,a], [,b]) => b.length - a.length)
  .slice(0, 5)
  .forEach(([room, comps]) => {
    console.log(`\n🏠 ${room.toUpperCase()}:`);
    comps.slice(0, 3).forEach((comp, index) => {
      console.log(`  ${index + 1}. ${comp.name} (${comp.category})`);
    });
    if (comps.length > 3) {
      console.log(`  ... and ${comps.length - 3} more ${room} components`);
    }
  });
