import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY?.trim()
);

console.log('🔧 Fixing u-shape-kitchen elevation views...\n');

const { data, error } = await supabase
  .from('room_geometry_templates')
  .select('geometry_definition')
  .eq('template_name', 'u-shape-kitchen')
  .single();

if (error) {
  console.error('❌ Error reading template:', error);
  process.exit(1);
}

const geometry = data.geometry_definition;

// U-shape-kitchen wall assignment based on coordinates:
// Wall 1: (0,0) → (600,0) = Bottom (front)
// Wall 2: (600,0) → (600,150) = Right outer
// Wall 3: (600,150) → (450,150) = Interior top-right (horizontal)
// Wall 4: (450,150) → (450,350) = Interior center (vertical)
// Wall 5: (450,350) → (600,350) = Interior bottom-right (horizontal)
// Wall 6: (600,350) → (600,500) = Right outer (continued)
// Wall 7: (600,500) → (0,500) = Top (back)
// Wall 8: (0,500) → (0,0) = Left outer

const elevationAssignments = [
  'front',           // Wall 1: Bottom perimeter
  'right',           // Wall 2: Right outer perimeter
  'interior-right',  // Wall 3: Interior top horizontal
  'interior-top',    // Wall 4: Interior vertical (deepest part of U)
  'interior-right',  // Wall 5: Interior bottom horizontal
  'right',           // Wall 6: Right outer perimeter (continued)
  'back',            // Wall 7: Top perimeter
  'left'             // Wall 8: Left perimeter
];

geometry.walls = geometry.walls.map((wall, index) => ({
  ...wall,
  elevation_view: elevationAssignments[index]
}));

const { error: updateError } = await supabase
  .from('room_geometry_templates')
  .update({ geometry_definition: geometry })
  .eq('template_name', 'u-shape-kitchen');

if (updateError) {
  console.error('❌ Error updating:', updateError);
  process.exit(1);
}

console.log('✅ u-shape-kitchen updated!\n');

// Verify
console.log('Verification:\n');
geometry.walls.forEach((wall, i) => {
  console.log(`Wall ${i+1} (${wall.id}): ${wall.elevation_view}`);
});
