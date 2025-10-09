import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkPlinthFormulas() {
  // Get corner-base-cabinet-90 model
  const { data: model } = await supabase
    .from('component_3d_models')
    .select('id, component_id')
    .eq('component_id', 'corner-base-cabinet-90')
    .single();

  if (!model) {
    console.error('Model not found');
    return;
  }

  console.log('Model:', model);
  console.log('');

  // Get all parts for this model
  const { data: allParts, error: allError } = await supabase
    .from('geometry_parts')
    .select('part_name')
    .eq('model_id', model.id);

  console.log('All parts for model:', allParts?.map(p => p.part_name) || []);
  console.log('Error:', allError);
  console.log('');

  // Get plinth parts
  const { data: parts, error } = await supabase
    .from('geometry_parts')
    .select('*')
    .eq('model_id', model.id)
    .in('part_name', ['Plinth X-leg', 'Plinth Z-leg']);

  console.log('Query error:', error);

  console.log('Plinth parts:');
  for (const part of parts || []) {
    console.log('\nPart:', part.part_name);
    console.log('  position_x:', part.position_x);
    console.log('  position_y:', part.position_y);
    console.log('  position_z:', part.position_z);
    console.log('  dimension_width:', part.dimension_width);
    console.log('  dimension_height:', part.dimension_height);
    console.log('  dimension_depth:', part.dimension_depth);
  }
}

checkPlinthFormulas();
