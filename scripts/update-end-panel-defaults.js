import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Update end panel component defaults with correct dimensions
 *
 * CORRECT VALUES (confirmed 2025-10-27):
 * - End Panel Wall: 43×2×80cm, Z=130cm (wall-mounted)
 * - End Panel Base: 63×2×86cm, Z=0cm (floor-mounted)
 * - End Panel Tall: 63×2×210cm, Z=0cm (floor-to-ceiling)
 */
async function updateEndPanelDefaults() {
  console.log('🔧 Updating end panel component defaults...\n');

  const updates = [
    {
      id: 'a061ad50-8dda-4baa-b6c6-d3cdcf74aa2d',
      name: 'End Panel Wall',
      width: 43,
      depth: 2,
      height: 80,
      default_z_position: 130,
    },
    {
      id: '7e43fadd-c942-4353-89d3-4aab1b92efe3',
      name: 'End Panel Base',
      width: 63,
      depth: 2,
      height: 86,
      default_z_position: 0,
    },
    {
      id: '555e4a01-7d64-432b-aeb1-0a0ca6ad6be5',
      name: 'End Panel Tall',
      width: 63,
      depth: 2,
      height: 210,
      default_z_position: 0,
    },
  ];

  for (const update of updates) {
    const { id, name, ...values } = update;

    console.log(`Updating ${name}...`);

    const { data, error } = await supabase
      .from('components')
      .update(values)
      .eq('id', id)
      .select();

    if (error) {
      console.error(`❌ Error updating ${name}:`, error);
    } else if (!data || data.length === 0) {
      console.error(`❌ Component not found: ${name}`);
    } else {
      console.log(`✅ ${name}: ${values.width}×${values.depth}×${values.height}cm, Z=${values.default_z_position}cm`);
    }
  }

  // Verify all updates
  console.log('\n📋 Verifying updates...\n');

  const { data: verified, error: verifyError } = await supabase
    .from('components')
    .select('name, width, depth, height, default_z_position')
    .in('id', updates.map(u => u.id))
    .order('name');

  if (verifyError) {
    console.error('❌ Verification error:', verifyError);
  } else {
    console.log('✅ Verified values in database:\n');
    verified.forEach(comp => {
      console.log(`   ${comp.name}: ${comp.width}×${comp.depth}×${comp.height}cm, Z=${comp.default_z_position}cm`);
    });
  }

  console.log('\n✅ All end panel defaults updated successfully!');
}

updateEndPanelDefaults().catch(console.error);
