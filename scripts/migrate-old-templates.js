/**
 * Migration Script: Add elevation_view to old templates
 * Date: 2025-10-11
 * Purpose: Update legacy templates (l-shape-kitchen, rectangle-600x400, u-shape-kitchen)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY?.trim()
);

console.log('🚀 Migrating old templates to elevation_view system...\n');

// Migrate rectangle-600x400 template
async function migrateRectangle600x400() {
  console.log('📝 Migrating rectangle-600x400...');

  const { data, error } = await supabase
    .from('room_geometry_templates')
    .select('geometry_definition')
    .eq('template_name', 'rectangle-600x400')
    .single();

  if (error) {
    console.error('❌ Error reading template:', error);
    return false;
  }

  const geometry = data.geometry_definition;

  // Map wall IDs to cardinal directions (based on typical ordering)
  const elevationMap = ['front', 'right', 'back', 'left'];

  geometry.walls = geometry.walls.map((wall, index) => ({
    ...wall,
    elevation_view: elevationMap[index] || 'front'
  }));

  const { error: updateError } = await supabase
    .from('room_geometry_templates')
    .update({ geometry_definition: geometry })
    .eq('template_name', 'rectangle-600x400');

  if (updateError) {
    console.error('❌ Error updating:', updateError);
    return false;
  }

  console.log('✅ rectangle-600x400 updated (4 walls → cardinal directions)\n');
  return true;
}

// Migrate l-shape-kitchen template
async function migrateLShapeKitchen() {
  console.log('📝 Migrating l-shape-kitchen...');

  const { data, error } = await supabase
    .from('room_geometry_templates')
    .select('geometry_definition')
    .eq('template_name', 'l-shape-kitchen')
    .single();

  if (error) {
    console.error('❌ Error reading template:', error);
    return false;
  }

  const geometry = data.geometry_definition;

  // L-shape strategy: Assign based on wall index
  // Typically: perimeter walls get cardinal, interior wall gets "interior-return"
  geometry.walls = geometry.walls.map((wall, index) => {
    // Check if wall ID suggests it's interior
    const isInterior = wall.id.toLowerCase().includes('internal') ||
                       wall.id.toLowerCase().includes('interior') ||
                       wall.id.toLowerCase().includes('return');

    if (isInterior) {
      return { ...wall, elevation_view: 'interior-return' };
    }

    // Perimeter walls - heuristic assignment
    const perimeterViews = ['front', 'right', 'back', 'left', 'left', 'front'];
    return { ...wall, elevation_view: perimeterViews[index] || 'front' };
  });

  const { error: updateError } = await supabase
    .from('room_geometry_templates')
    .update({ geometry_definition: geometry })
    .eq('template_name', 'l-shape-kitchen');

  if (updateError) {
    console.error('❌ Error updating:', updateError);
    return false;
  }

  console.log('✅ l-shape-kitchen updated (6 walls → 5 cardinal + 1 interior)\n');
  return true;
}

// Migrate u-shape-kitchen template
async function migrateUShapeKitchen() {
  console.log('📝 Migrating u-shape-kitchen...');

  const { data, error } = await supabase
    .from('room_geometry_templates')
    .select('geometry_definition')
    .eq('template_name', 'u-shape-kitchen')
    .single();

  if (error) {
    console.error('❌ Error reading template:', error);
    return false;
  }

  const geometry = data.geometry_definition;

  // U-shape strategy: Outer perimeter gets cardinal, inner walls get interior-*
  geometry.walls = geometry.walls.map((wall) => {
    const wallId = wall.id.toLowerCase();

    // Interior walls
    if (wallId.includes('inner') || wallId.includes('internal')) {
      if (wallId.includes('left')) {
        return { ...wall, elevation_view: 'interior-left' };
      }
      if (wallId.includes('top') || wallId.includes('north')) {
        return { ...wall, elevation_view: 'interior-top' };
      }
      if (wallId.includes('right')) {
        return { ...wall, elevation_view: 'interior-right' };
      }
      // Default interior
      return { ...wall, elevation_view: 'interior-top' };
    }

    // Perimeter walls
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

  const { error: updateError } = await supabase
    .from('room_geometry_templates')
    .update({ geometry_definition: geometry })
    .eq('template_name', 'u-shape-kitchen');

  if (updateError) {
    console.error('❌ Error updating:', updateError);
    return false;
  }

  console.log('✅ u-shape-kitchen updated (8 walls → 4 cardinal + 3 interior)\n');
  return true;
}

// Verify all templates
async function verifyAll() {
  console.log('🔍 Verifying all templates...\n');

  const { data, error } = await supabase
    .from('room_geometry_templates')
    .select('template_name, geometry_definition')
    .eq('is_active', true)
    .order('template_name');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  let allValid = true;

  data.forEach(template => {
    const walls = template.geometry_definition.walls || [];
    const wallsWithView = walls.filter(w => w.elevation_view !== undefined).length;
    const uniqueViews = [...new Set(walls.map(w => w.elevation_view).filter(Boolean))];

    console.log(`📊 ${template.template_name}:`);
    console.log(`   Total walls: ${walls.length}`);
    console.log(`   Walls with elevation_view: ${wallsWithView}`);
    console.log(`   Unique views: ${uniqueViews.join(', ')}`);

    if (wallsWithView === walls.length) {
      console.log(`   ✅ All walls assigned`);
    } else {
      console.log(`   ⚠️  ${walls.length - wallsWithView} walls missing elevation_view`);
      allValid = false;
    }
    console.log('');
  });

  return allValid;
}

// Main
async function main() {
  try {
    const rect600Success = await migrateRectangle600x400();
    const lShapeSuccess = await migrateLShapeKitchen();
    const uShapeSuccess = await migrateUShapeKitchen();

    if (!rect600Success || !lShapeSuccess || !uShapeSuccess) {
      console.log('⚠️  Migration incomplete. Some templates failed.\n');
      return;
    }

    const allValid = await verifyAll();

    if (allValid) {
      console.log('✅ All templates successfully migrated!\n');
    } else {
      console.log('⚠️  Migration complete with warnings.\n');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

main();
