/**
 * Fix elevation_view assignments for user's L-shaped room
 * Room ID: 83ccd659-310f-40c8-adc5-bbdbd71d4b16
 *
 * Current state: All walls assigned to cardinal directions
 * Target state: Interior wall (wall-4) should be 'interior-return'
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY?.trim()
);

const ROOM_ID = '83ccd659-310f-40c8-adc5-bbdbd71d4b16';

console.log('🔧 Fixing L-shaped room elevation views...\n');

// Fetch the room
const { data, error } = await supabase
  .from('room_designs')
  .select('room_geometry')
  .eq('id', ROOM_ID)
  .single();

if (error) {
  console.error('❌ Error reading room:', error);
  process.exit(1);
}

const geometry = data.room_geometry;

console.log('Current wall assignments:');
geometry.walls.forEach((wall, i) => {
  const start = wall.start.join(',');
  const end = wall.end.join(',');
  console.log(`  Wall ${i+1} (${wall.id}): (${start}) → (${end}) = ${wall.elevation_view}`);
});

// L-shape wall assignment based on coordinates:
// Wall 1: (0,0) → (600,0) = Bottom (front)
// Wall 2: (600,0) → (600,300) = Right outer
// Wall 3: (600,300) → (300,300) = Top-right horizontal (back)
// Wall 4: (300,300) → (300,400) = Interior vertical (INTERIOR WALL)
// Wall 5: (300,400) → (0,400) = Top-left horizontal (left)
// Wall 6: (0,400) → (0,0) = Left outer

const elevationAssignments = [
  'front',           // Wall 1: Bottom perimeter
  'right',           // Wall 2: Right perimeter
  'back',            // Wall 3: Top-right perimeter
  'interior-return', // Wall 4: Interior vertical wall
  'left',            // Wall 5: Top-left perimeter
  'left'             // Wall 6: Left perimeter
];

console.log('\nNew assignments:');
geometry.walls = geometry.walls.map((wall, index) => {
  const updated = {
    ...wall,
    elevation_view: elevationAssignments[index]
  };
  const start = wall.start.join(',');
  const end = wall.end.join(',');
  console.log(`  Wall ${index+1} (${wall.id}): (${start}) → (${end}) = ${updated.elevation_view}`);
  return updated;
});

// Update the room
const { error: updateError } = await supabase
  .from('room_designs')
  .update({ room_geometry: geometry })
  .eq('id', ROOM_ID);

if (updateError) {
  console.error('❌ Error updating:', updateError);
  process.exit(1);
}

console.log('\n✅ Room updated successfully!');
console.log('\nVerification:');
console.log('  - Wall 4 is now: interior-return (interior vertical wall)');
console.log('  - Other walls remain on perimeter with cardinal directions');
