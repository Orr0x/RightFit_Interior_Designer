// Generate SQL migration for all kitchen components
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the extracted components
const componentsPath = path.join(__dirname, 'extracted-components.json');
const components = JSON.parse(fs.readFileSync(componentsPath, 'utf8'));

// Filter for kitchen-specific components (components that ONLY appear in kitchen)
const kitchenComponents = components.filter(component => {
  return component.room_types.includes('kitchen') && 
         (component.room_types.length === 1 || // Only kitchen
          component.category.includes('kitchen') || // Kitchen-specific category
          component.category.includes('base-cabinets') ||
          component.category.includes('wall-units') ||
          component.category.includes('appliances') ||
          component.category.includes('larder') ||
          component.category.includes('drawer'));
});

console.log(`Found ${kitchenComponents.length} kitchen-specific components`);

// Group by category
const byCategory = kitchenComponents.reduce((acc, comp) => {
  if (!acc[comp.category]) acc[comp.category] = [];
  acc[comp.category].push(comp);
  return acc;
}, {});

console.log('\nKitchen components by category:');
Object.entries(byCategory).forEach(([category, comps]) => {
  console.log(`  ${category}: ${comps.length}`);
});

// Generate SQL INSERT statements
function generateSQL(components) {
  const sqlValues = components.map(comp => {
    const roomTypesArray = `ARRAY[${comp.room_types.map(rt => `'${rt}'`).join(', ')}]`;
    
    return `('${comp.component_id}', '${comp.name}', '${comp.type}', ${comp.width}, ${comp.depth}, ${comp.height}, '${comp.color}', '${comp.category}', ${roomTypesArray}, '${comp.icon_name}', '${comp.description.replace(/'/g, "''")}', '${comp.version}', ${comp.deprecated}, '{}', '{}')`;
  });

  return `-- Complete Kitchen Component Library
-- Generated from extracted components

-- Temporarily disable RLS
ALTER TABLE public.components DISABLE ROW LEVEL SECURITY;

-- Insert all kitchen components
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
  RAISE NOTICE 'Complete kitchen component library installed! 🍳';
  RAISE NOTICE 'Added ${components.length} kitchen components';
  RAISE NOTICE 'Categories: ${Object.keys(byCategory).join(', ')}';
  RAISE NOTICE 'Kitchen design is now fully equipped! 🚀';
END $$;`;
}

// Generate the SQL
const sql = generateSQL(kitchenComponents);

// Write to migration file
const migrationPath = path.join(__dirname, '../../supabase/migrations/20250912230000_complete_kitchen_components.sql');
fs.writeFileSync(migrationPath, sql);

console.log(`\n✅ Generated SQL migration: ${migrationPath}`);
console.log(`📦 Total kitchen components: ${kitchenComponents.length}`);
console.log(`🚀 Ready to run: npx supabase db push`);

// Show sample components
console.log(`\n🔍 Sample kitchen components:`);
kitchenComponents.slice(0, 5).forEach((comp, index) => {
  console.log(`${index + 1}. ${comp.name} (${comp.category}) - ${comp.width}×${comp.depth}×${comp.height}`);
});
