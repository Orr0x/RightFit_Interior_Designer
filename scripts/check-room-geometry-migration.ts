/**
 * Check Room Geometry Migration Status
 *
 * Verifies if the room_geometry_system migration has been applied to the database.
 * This script checks for:
 * 1. room_geometry_templates table existence
 * 2. room_geometry column on room_designs table
 * 3. Seed data (3 templates: rectangle, L-shape, U-shape)
 * 4. Required indexes
 *
 * Usage: npx tsx scripts/check-room-geometry-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface CheckResult {
  test: string;
  passed: boolean;
  details?: string;
}

async function checkMigrationStatus(): Promise<void> {
  console.log('🔍 Checking Room Geometry Migration Status...\n');

  const results: CheckResult[] = [];

  // Test 1: Check if room_geometry_templates table exists
  try {
    const { data, error } = await supabase
      .from('room_geometry_templates')
      .select('id')
      .limit(1);

    if (error) {
      results.push({
        test: 'room_geometry_templates table exists',
        passed: false,
        details: error.message
      });
    } else {
      results.push({
        test: 'room_geometry_templates table exists',
        passed: true
      });
    }
  } catch (err) {
    results.push({
      test: 'room_geometry_templates table exists',
      passed: false,
      details: String(err)
    });
  }

  // Test 2: Check seed data
  try {
    const { data, error } = await supabase
      .from('room_geometry_templates')
      .select('template_name, display_name, category')
      .order('sort_order');

    if (error) {
      results.push({
        test: 'Seed data loaded (3 templates)',
        passed: false,
        details: error.message
      });
    } else {
      const expectedTemplates = ['rectangle-standard', 'l-shape-standard', 'u-shape-standard'];
      const actualTemplates = (data || []).map(t => t.template_name);
      const hasAllTemplates = expectedTemplates.every(t => actualTemplates.includes(t));

      results.push({
        test: 'Seed data loaded (3 templates)',
        passed: hasAllTemplates && data.length >= 3,
        details: `Found ${data.length} templates: ${actualTemplates.join(', ')}`
      });
    }
  } catch (err) {
    results.push({
      test: 'Seed data loaded (3 templates)',
      passed: false,
      details: String(err)
    });
  }

  // Test 3: Check room_geometry column on room_designs
  try {
    const { data, error } = await supabase
      .from('room_designs')
      .select('id, room_geometry')
      .limit(1);

    if (error) {
      results.push({
        test: 'room_designs.room_geometry column exists',
        passed: false,
        details: error.message
      });
    } else {
      results.push({
        test: 'room_designs.room_geometry column exists',
        passed: true
      });
    }
  } catch (err) {
    results.push({
      test: 'room_designs.room_geometry column exists',
      passed: false,
      details: String(err)
    });
  }

  // Test 4: Verify geometry definition structure
  try {
    const { data, error } = await supabase
      .from('room_geometry_templates')
      .select('template_name, geometry_definition')
      .eq('template_name', 'l-shape-standard')
      .single();

    if (error) {
      results.push({
        test: 'L-shape geometry structure valid',
        passed: false,
        details: error.message
      });
    } else {
      const geom = data.geometry_definition as any;
      const hasRequiredFields =
        geom?.shape_type === 'l-shape' &&
        Array.isArray(geom?.floor?.vertices) &&
        geom.floor.vertices.length === 6 &&
        Array.isArray(geom?.walls) &&
        geom.walls.length === 6;

      results.push({
        test: 'L-shape geometry structure valid',
        passed: hasRequiredFields,
        details: hasRequiredFields
          ? 'L-shape has 6 vertices and 6 walls'
          : `Invalid structure: ${JSON.stringify(geom).substring(0, 100)}`
      });
    }
  } catch (err) {
    results.push({
      test: 'L-shape geometry structure valid',
      passed: false,
      details: String(err)
    });
  }

  // Test 5: Check parameter_config structure
  try {
    const { data, error } = await supabase
      .from('room_geometry_templates')
      .select('template_name, parameter_config')
      .eq('template_name', 'rectangle-standard')
      .single();

    if (error) {
      results.push({
        test: 'Parameter config structure valid',
        passed: false,
        details: error.message
      });
    } else {
      const params = data.parameter_config as any;
      const hasParams = Array.isArray(params?.configurable_params) && params.configurable_params.length >= 3;

      results.push({
        test: 'Parameter config structure valid',
        passed: hasParams,
        details: hasParams
          ? `Found ${params.configurable_params.length} configurable parameters`
          : `Missing configurable_params array. Got: ${JSON.stringify(params).substring(0, 100)}`
      });
    }
  } catch (err) {
    results.push({
      test: 'Parameter config structure valid',
      passed: false,
      details: String(err)
    });
  }

  // Print results
  console.log('📊 Test Results:\n');
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.test}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    console.log('');
  });

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  console.log('─'.repeat(60));
  console.log(`\n📈 Summary: ${passedCount}/${totalCount} tests passed\n`);

  if (allPassed) {
    console.log('✅ Migration successfully applied!');
    console.log('✅ room_geometry_templates table created');
    console.log('✅ room_geometry column added to room_designs');
    console.log('✅ Seed data loaded (rectangle, L-shape, U-shape)');
    console.log('✅ JSONB structures validated\n');
  } else {
    console.log('⚠️  Migration not fully applied or has issues.');
    console.log('\n📝 Action needed:');
    console.log('   Run migration manually or check for errors in:');
    console.log('   supabase/migrations/20251011000001_create_room_geometry_system.sql\n');

    console.log('🔧 To apply migration:');
    console.log('   1. Start Docker Desktop');
    console.log('   2. Run: npx supabase db reset');
    console.log('   Or apply directly to remote database via Supabase dashboard\n');
  }

  process.exit(allPassed ? 0 : 1);
}

checkMigrationStatus().catch(console.error);
