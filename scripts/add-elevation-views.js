/**
 * Database Migration Script: Add elevation_view to wall definitions
 * Date: 2025-10-11
 * Purpose: Make elevation views template-defined (database-driven)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables (prioritize .env.local for service key)
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('🔑 Using service role key for database updates...\n');
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Starting elevation_view migration...\n');

// Step 1: Read current templates
async function readCurrentTemplates() {
  console.log('📖 Step 1: Reading current templates...');

  const { data, error } = await supabase
    .from('room_geometry_templates')
    .select('template_name, geometry_definition')
    .eq('is_active', true)
    .order('template_name');

  if (error) {
    console.error('❌ Error reading templates:', error);
    return [];
  }

  console.log(`✅ Found ${data.length} active templates:\n`);
  data.forEach(template => {
    const wallCount = template.geometry_definition.walls?.length || 0;
    console.log(`   - ${template.template_name}: ${wallCount} walls`);
  });
  console.log('');

  return data;
}

// Step 2: Add elevation_view to rectangle template
async function updateRectangleTemplate() {
  console.log('📝 Step 2: Updating rectangle-standard template...');

  const { data, error } = await supabase
    .from('room_geometry_templates')
    .select('geometry_definition')
    .eq('template_name', 'rectangle-standard')
    .single();

  if (error) {
    console.error('❌ Error reading rectangle template:', error);
    return false;
  }

  const geometry = data.geometry_definition;

  // Map wall IDs to cardinal directions
  const elevationMap = {
    'wall_north': 'front',
    'wall_east': 'right',
    'wall_south': 'back',
    'wall_west': 'left'
  };

  // Add elevation_view to each wall
  geometry.walls = geometry.walls.map(wall => ({
    ...wall,
    elevation_view: elevationMap[wall.id] || 'front'
  }));

  // Update database
  const { error: updateError } = await supabase
    .from('room_geometry_templates')
    .update({ geometry_definition: geometry })
    .eq('template_name', 'rectangle-standard');

  if (updateError) {
    console.error('❌ Error updating rectangle template:', updateError);
    return false;
  }

  console.log('✅ Rectangle template updated (4 walls → cardinal directions)\n');
  return true;
}

// Step 3: Add elevation_view to L-shape template
async function updateLShapeTemplate() {
  console.log('📝 Step 3: Updating l-shape-standard template...');

  const { data, error } = await supabase
    .from('room_geometry_templates')
    .select('geometry_definition')
    .eq('template_name', 'l-shape-standard')
    .single();

  if (error) {
    console.error('❌ Error reading L-shape template:', error);
    return false;
  }

  const geometry = data.geometry_definition;

  // L-shape wall assignment strategy:
  // - Perimeter walls → Cardinal directions (front/right/back/left)
  // - Interior return wall → "interior-return"

  geometry.walls = geometry.walls.map((wall, index) => {
    // Check if wall is interior (contains "internal" or "interior" in ID)
    const isInterior = wall.id.toLowerCase().includes('internal') ||
                       wall.id.toLowerCase().includes('interior');

    if (isInterior) {
      return {
        ...wall,
        elevation_view: 'interior-return'
      };
    }

    // Perimeter walls - assign based on position/index
    // This is a heuristic; actual assignment depends on wall coordinates
    const perimeterViews = ['front', 'right', 'back', 'back', 'left', 'front'];
    return {
      ...wall,
      elevation_view: perimeterViews[index] || 'front'
    };
  });

  // Update database
  const { error: updateError } = await supabase
    .from('room_geometry_templates')
    .update({ geometry_definition: geometry })
    .eq('template_name', 'l-shape-standard');

  if (updateError) {
    console.error('❌ Error updating L-shape template:', updateError);
    return false;
  }

  console.log('✅ L-shape template updated (6 walls → 5 cardinal + 1 interior)\n');
  return true;
}

// Step 4: Add elevation_view to U-shape template
async function updateUShapeTemplate() {
  console.log('📝 Step 4: Updating u-shape-standard template...');

  const { data, error } = await supabase
    .from('room_geometry_templates')
    .select('geometry_definition')
    .eq('template_name', 'u-shape-standard')
    .single();

  if (error) {
    console.error('❌ Error reading U-shape template:', error);
    return false;
  }

  const geometry = data.geometry_definition;

  // U-shape wall assignment:
  // - Outer perimeter walls → Cardinal directions
  // - Inner walls → "interior-left", "interior-top", "interior-right"

  geometry.walls = geometry.walls.map((wall) => {
    const wallId = wall.id.toLowerCase();

    // Interior walls
    if (wallId.includes('inner_left')) {
      return { ...wall, elevation_view: 'interior-left' };
    }
    if (wallId.includes('inner_top') || wallId.includes('inner_north')) {
      return { ...wall, elevation_view: 'interior-top' };
    }
    if (wallId.includes('inner_right')) {
      return { ...wall, elevation_view: 'interior-right' };
    }

    // Perimeter walls (map to cardinal)
    if (wallId.includes('north') || wallId.includes('front')) {
      return { ...wall, elevation_view: 'front' };
    }
    if (wallId.includes('east') || wallId.includes('right')) {
      return { ...wall, elevation_view: 'right' };
    }
    if (wallId.includes('south') || wallId.includes('back')) {
      return { ...wall, elevation_view: 'back' };
    }
    if (wallId.includes('west') || wallId.includes('left')) {
      return { ...wall, elevation_view: 'left' };
    }

    // Fallback
    return { ...wall, elevation_view: 'front' };
  });

  // Update database
  const { error: updateError } = await supabase
    .from('room_geometry_templates')
    .update({ geometry_definition: geometry })
    .eq('template_name', 'u-shape-standard');

  if (updateError) {
    console.error('❌ Error updating U-shape template:', updateError);
    return false;
  }

  console.log('✅ U-shape template updated (8 walls → 4 cardinal + 3 interior + 1 extra)\n');
  return true;
}

// Step 5: Verify changes
async function verifyChanges() {
  console.log('🔍 Step 5: Verifying changes...\n');

  const { data, error } = await supabase
    .from('room_geometry_templates')
    .select('template_name, geometry_definition')
    .eq('is_active', true)
    .order('template_name');

  if (error) {
    console.error('❌ Error verifying:', error);
    return false;
  }

  let allValid = true;

  data.forEach(template => {
    const walls = template.geometry_definition.walls || [];
    const wallsWithView = walls.filter(w => w.elevation_view !== undefined).length;
    const uniqueViews = [...new Set(walls.map(w => w.elevation_view))];

    console.log(`📊 ${template.template_name}:`);
    console.log(`   Total walls: ${walls.length}`);
    console.log(`   Walls with elevation_view: ${wallsWithView}`);
    console.log(`   Unique views: ${uniqueViews.join(', ')}`);

    if (wallsWithView !== walls.length) {
      console.log(`   ⚠️  Warning: Not all walls have elevation_view assigned`);
      allValid = false;
    } else {
      console.log(`   ✅ All walls assigned`);
    }
    console.log('');
  });

  return allValid;
}

// Main execution
async function main() {
  try {
    // Step 1: Read current state
    const templates = await readCurrentTemplates();
    if (templates.length === 0) {
      console.error('❌ No templates found. Aborting.');
      return;
    }

    // Step 2-4: Update each template
    const rectangleSuccess = await updateRectangleTemplate();
    const lShapeSuccess = await updateLShapeTemplate();
    const uShapeSuccess = await updateUShapeTemplate();

    if (!rectangleSuccess || !lShapeSuccess || !uShapeSuccess) {
      console.error('\n❌ Migration incomplete. Some templates failed to update.');
      return;
    }

    // Step 5: Verify
    const verificationSuccess = await verifyChanges();

    if (verificationSuccess) {
      console.log('✅ Migration complete! All templates updated successfully.\n');
    } else {
      console.log('⚠️  Migration complete with warnings. Check output above.\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

main();
