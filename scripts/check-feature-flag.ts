/**
 * Script to check and enable the use_dynamic_3d_models feature flag
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env files (.env.local takes precedence)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service key for admin operations, fallback to anon key
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndEnableFlag() {
  console.log('Checking feature flag: use_database_2d_rendering\n');

  // Check current status
  const { data: currentFlag, error: fetchError } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_key', 'use_database_2d_rendering')
    .single();

  if (fetchError) {
    console.error('Error fetching feature flag:', fetchError);
    process.exit(1);
  }

  console.log('Current status:');
  console.log('  flag_key:', currentFlag.flag_key);
  console.log('  enabled (master):', currentFlag.enabled);
  console.log('  enabled_dev:', currentFlag.enabled_dev);
  console.log('  enabled_staging:', currentFlag.enabled_staging);
  console.log('  enabled_production:', currentFlag.enabled_production);
  console.log('  rollout_percentage:', currentFlag.rollout_percentage);
  console.log('  description:', currentFlag.description);
  console.log('  created_at:', currentFlag.created_at);
  console.log('  updated_at:', currentFlag.updated_at);
  console.log('');

  // Check if both enabled and enabled_dev are true
  const fullyEnabled = currentFlag.enabled && currentFlag.enabled_dev;

  if (fullyEnabled) {
    console.log('✅ Feature flag is fully enabled (master=true, dev=true)');
    return;
  }

  console.log('⚠️  Feature flag is not fully enabled');
  if (!currentFlag.enabled) {
    console.log('   - Master "enabled" flag is FALSE (must be true)');
  }
  if (!currentFlag.enabled_dev) {
    console.log('   - Development "enabled_dev" flag is FALSE (must be true)');
  }
  console.log('\nEnabling now...\n');

  // Enable BOTH the master flag and dev flag
  const { error: updateError } = await supabase
    .from('feature_flags')
    .update({
      enabled: true,
      enabled_dev: true,
      rollout_percentage: 100,
      updated_at: new Date().toISOString()
    })
    .eq('flag_key', 'use_database_2d_rendering');

  if (updateError) {
    console.error('Error updating feature flag:', updateError);
    process.exit(1);
  }

  // Fetch the updated flag
  const { data: updatedFlag, error: refetchError } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_key', 'use_database_2d_rendering')
    .single();

  if (refetchError || !updatedFlag) {
    console.error('Error fetching updated flag:', refetchError);
    process.exit(1);
  }

  console.log('✅ Feature flag enabled successfully!');
  console.log('');
  console.log('New status:');
  console.log('  flag_key:', updatedFlag.flag_key);
  console.log('  enabled (master):', updatedFlag.enabled);
  console.log('  enabled_dev:', updatedFlag.enabled_dev);
  console.log('  rollout_percentage:', updatedFlag.rollout_percentage);
  console.log('  updated_at:', updatedFlag.updated_at);
  console.log('');
  console.log('🎉 Database-driven 2D rendering is now enabled in development!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Restart your dev server (npm run dev)');
  console.log('2. Open the Designer page (/designer)');
  console.log('3. Place a component');
  console.log('4. Open browser console (F12)');
  console.log('');
  console.log('Expected console output:');
  console.log('  [DesignCanvas2D] 2D render definitions preloaded');
  console.log('  [Render2DService] ✅ Preloaded 194 definitions in XXXms');
}

checkAndEnableFlag().catch(console.error);
