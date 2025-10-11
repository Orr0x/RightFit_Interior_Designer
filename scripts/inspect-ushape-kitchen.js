import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY?.trim()
);

console.log('🔍 Inspecting u-shape-kitchen template...\n');

const { data, error } = await supabase
  .from('room_geometry_templates')
  .select('geometry_definition')
  .eq('template_name', 'u-shape-kitchen')
  .single();

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('Walls in u-shape-kitchen:\n');
  data.geometry_definition.walls.forEach((wall, i) => {
    const start = wall.start.join(',');
    const end = wall.end.join(',');
    const view = wall.elevation_view || 'NONE';
    console.log(`Wall ${i+1}:`);
    console.log(`  ID: ${wall.id}`);
    console.log(`  Coordinates: (${start}) → (${end})`);
    console.log(`  elevation_view: ${view}`);
    console.log('');
  });
}
