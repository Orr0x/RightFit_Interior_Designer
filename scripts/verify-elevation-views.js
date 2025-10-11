import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY?.trim()
);

const { data, error } = await supabase
  .from('room_geometry_templates')
  .select('template_name, geometry_definition')
  .eq('template_name', 'l-shape-standard')
  .single();

if (error) {
  console.error('Error:', error);
} else {
  console.log('\n✅ L-Shape Template - Elevation View Assignments:\n');
  data.geometry_definition.walls.forEach((wall, i) => {
    const view = wall.elevation_view || 'NOT SET';
    const coords = `(${wall.start.join(',')}) → (${wall.end.join(',')})`;
    console.log(`   Wall ${i+1}: ${wall.id.padEnd(20)} | elevation_view: ${view.padEnd(18)} | ${coords}`);
  });
  console.log('');
}
