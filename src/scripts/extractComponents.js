// Node.js script to extract components from EnhancedSidebar.tsx and prepare for database migration
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the EnhancedSidebar file
const sidebarPath = path.join(__dirname, '../components/designer/EnhancedSidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

// Extract the components array using regex
// This is a simplified extraction - in production you'd want more robust parsing
const componentsMatch = sidebarContent.match(/const components: ComponentDefinition\[\] = \[([\s\S]*?)\];/);

if (!componentsMatch) {
  console.error('Could not find components array in EnhancedSidebar.tsx');
  process.exit(1);
}

// Parse the components (simplified - assumes clean structure)
const componentsText = componentsMatch[1];

// Extract individual component objects with better regex
const componentMatches = componentsText.match(/\{[\s\S]*?\n\s*\}(?:,|\s*$)/g);

if (!componentMatches) {
  console.error('Could not extract individual components');
  process.exit(1);
}

console.log(`Found ${componentMatches.length} component definitions`);

// Map icon names from JSX to strings
const iconMap = {
  'Square': 'Square',
  'Archive': 'Archive', 
  'Refrigerator': 'Refrigerator',
  'Microwave': 'Microwave',
  'Waves': 'Waves',
  'Box': 'Box',
  'Zap': 'Zap',
  'Wind': 'Wind',
  'RectangleHorizontal': 'RectangleHorizontal',
  'Bed': 'Bed',
  'Shirt': 'Shirt',
  'Bath': 'Bath',
  'Tv': 'Tv',
  'Sofa': 'Sofa',
  'Grid3X3': 'Grid3X3',
  'Home': 'Home',
  'DoorOpen': 'DoorOpen',
  'DoorClosed': 'DoorClosed',
  'Layers': 'Layers',
  'Crown': 'Crown',
  'PanelLeft': 'PanelLeft',
  'PanelRight': 'PanelRight'
};

// Function to extract icon name from JSX
function extractIconName(iconText) {
  const match = iconText.match(/<(\w+)/);
  return match ? (iconMap[match[1]] || 'Square') : 'Square';
}

// Parse each component (very basic parsing)
const components = [];
let successCount = 0;
let errorCount = 0;

componentMatches.forEach((componentText, index) => {
  try {
    // Extract basic fields using regex with more flexible patterns
    const id = componentText.match(/id:\s*['"`]([^'"`]+)['"`]/)?.[1];
    const name = componentText.match(/name:\s*['"`]([^'"`\n]+)['"`]/)?.[1];
    const type = componentText.match(/type:\s*['"`]([^'"`]+)['"`]/)?.[1];
    const width = componentText.match(/width:\s*(\d+(?:\.\d+)?)/)?.[1];
    const depth = componentText.match(/depth:\s*(\d+(?:\.\d+)?)/)?.[1];
    const height = componentText.match(/height:\s*(\d+(?:\.\d+)?)/)?.[1];
    const color = componentText.match(/color:\s*['"`]([^'"`]+)['"`]/)?.[1];
    const category = componentText.match(/category:\s*['"`]([^'"`]+)['"`]/)?.[1];
    const description = componentText.match(/description:\s*['"`]([^'"`\n]+)['"`]/)?.[1];
    
    // Extract room types array
    const roomTypesMatch = componentText.match(/roomTypes:\s*\[([\s\S]*?)\]/);
    const roomTypes = roomTypesMatch ? 
      roomTypesMatch[1].split(',').map(rt => rt.trim().replace(/['"`]/g, '')) : 
      [];

    // Extract icon
    const iconMatch = componentText.match(/icon:\s*(<[^>]+>)/);
    const iconName = iconMatch ? extractIconName(iconMatch[1]) : 'Square';

    if (!id || !name || !type || !width || !height || !color || !category) {
      console.warn(`Skipping component ${index + 1}: missing required fields (id, name, type, width, height, color, or category)`);
      errorCount++;
      return;
    }

    // Default depth to width if missing (common for square items like chairs, tables)
    const componentDepth = depth ? parseFloat(depth) : parseFloat(width);

    components.push({
      component_id: id,
      name: name,
      type: type,
      width: parseFloat(width),
      depth: componentDepth,
      height: parseFloat(height),
      color: color,
      category: category,
      room_types: roomTypes.filter(rt => rt && rt !== ''),
      icon_name: iconName,
      description: description || name,
      version: '1.0.0',
      deprecated: false,
      metadata: {},
      tags: []
    });

    successCount++;
  } catch (error) {
    console.error(`Error parsing component ${index + 1}:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Extraction Results:`);
console.log(`✅ Successfully extracted: ${successCount} components`);
console.log(`❌ Failed to extract: ${errorCount} components`);

// Write to JSON file for inspection
const outputPath = path.join(__dirname, 'extracted-components.json');
fs.writeFileSync(outputPath, JSON.stringify(components, null, 2));

console.log(`\n💾 Components saved to: ${outputPath}`);

// Show sample components
console.log(`\n🔍 Sample extracted components:`);
components.slice(0, 3).forEach((comp, index) => {
  console.log(`${index + 1}. ${comp.name} (${comp.category})`);
  console.log(`   - Dimensions: ${comp.width}×${comp.depth}×${comp.height}`);
  console.log(`   - Rooms: ${comp.room_types.join(', ')}`);
  console.log(`   - Icon: ${comp.icon_name}`);
});

// Show categories breakdown
const categories = {};
components.forEach(comp => {
  categories[comp.category] = (categories[comp.category] || 0) + 1;
});

console.log(`\n📋 Components by category:`);
Object.entries(categories)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });

console.log(`\n🚀 Ready for database migration!`);
console.log(`Next step: Run the migration script to populate the database.`);
