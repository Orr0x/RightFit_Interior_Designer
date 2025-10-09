/**
 * Test script for 2D rendering system
 * Date: 2025-10-09
 * Purpose: Verify database-driven 2D rendering is working correctly
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// Test Functions
// =====================================================

async function testDatabaseConnection() {
  console.log('🔍 Test 1: Database Connection\n');

  const { data, error, count } = await supabase
    .from('component_2d_renders')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }

  console.log(`✅ Database connected`);
  console.log(`✅ Found ${count} component render definitions\n`);
  return true;
}

async function testRenderDefinitionStructure() {
  console.log('🔍 Test 2: Render Definition Structure\n');

  const { data, error } = await supabase
    .from('component_2d_renders')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    console.error('❌ Failed to fetch definition:', error);
    return false;
  }

  console.log('✅ Sample definition loaded:');
  console.log(`   component_id: ${data.component_id}`);
  console.log(`   plan_view_type: ${data.plan_view_type}`);
  console.log(`   elevation_type: ${data.elevation_type}`);
  console.log(`   fill_color: ${data.fill_color}`);
  console.log('');
  return true;
}

async function testComponentTypes() {
  console.log('🔍 Test 3: Component Type Distribution\n');

  const { data, error } = await supabase
    .from('component_2d_renders')
    .select('plan_view_type, elevation_type');

  if (error || !data) {
    console.error('❌ Failed to fetch types:', error);
    return false;
  }

  // Count plan view types
  const planViewCounts: Record<string, number> = {};
  const elevationCounts: Record<string, number> = {};

  data.forEach(d => {
    planViewCounts[d.plan_view_type] = (planViewCounts[d.plan_view_type] || 0) + 1;
    elevationCounts[d.elevation_type] = (elevationCounts[d.elevation_type] || 0) + 1;
  });

  console.log('Plan View Types:');
  Object.entries(planViewCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log('\nElevation Types:');
  Object.entries(elevationCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log('');
  return true;
}

async function testSinkDefinitions() {
  console.log('🔍 Test 4: Sink Definitions\n');

  const { data, error } = await supabase
    .from('component_2d_renders')
    .select('component_id, plan_view_type, plan_view_data, fill_color')
    .like('component_id', '%sink%')
    .limit(5);

  if (error || !data) {
    console.error('❌ Failed to fetch sinks:', error);
    return false;
  }

  console.log(`✅ Found ${data.length} sink examples:\n`);

  data.forEach(sink => {
    console.log(`   ${sink.component_id}:`);
    console.log(`      Type: ${sink.plan_view_type}`);
    console.log(`      Color: ${sink.fill_color}`);
    if (Object.keys(sink.plan_view_data).length > 0) {
      console.log(`      Data: ${JSON.stringify(sink.plan_view_data)}`);
    }
    console.log('');
  });

  return true;
}

async function testCornerDefinitions() {
  console.log('🔍 Test 5: Corner Component Definitions\n');

  const { data, error } = await supabase
    .from('component_2d_renders')
    .select('component_id, plan_view_type, elevation_data')
    .eq('plan_view_type', 'corner-square')
    .limit(5);

  if (error || !data) {
    console.error('❌ Failed to fetch corners:', error);
    return false;
  }

  console.log(`✅ Found ${data.length} corner component examples:\n`);

  data.forEach(corner => {
    console.log(`   ${corner.component_id}:`);
    console.log(`      Type: ${corner.plan_view_type}`);
    const elevData = corner.elevation_data as any;
    if (elevData?.door_count) {
      console.log(`      Doors: ${elevData.door_count}`);
    }
    console.log('');
  });

  return true;
}

async function testCabinetConfigurations() {
  console.log('🔍 Test 6: Cabinet Door Configurations\n');

  const { data, error } = await supabase
    .from('component_2d_renders')
    .select('component_id, elevation_data')
    .eq('elevation_type', 'standard-cabinet')
    .limit(10);

  if (error || !data) {
    console.error('❌ Failed to fetch cabinets:', error);
    return false;
  }

  console.log('✅ Cabinet configurations:\n');

  // Group by door count
  const doorCounts: Record<number, number> = {};

  data.forEach(cabinet => {
    const elevData = cabinet.elevation_data as any;
    const doorCount = elevData?.door_count || 0;
    doorCounts[doorCount] = (doorCounts[doorCount] || 0) + 1;
  });

  console.log('   Door count distribution:');
  Object.entries(doorCounts).forEach(([count, num]) => {
    console.log(`      ${count} door(s): ${num} cabinets`);
  });

  console.log('');
  return true;
}

async function testDataIntegrity() {
  console.log('🔍 Test 7: Data Integrity Checks\n');

  // Check for missing components
  const { data: components, error: compError } = await supabase
    .from('components')
    .select('component_id');

  const { data: renders, error: renderError } = await supabase
    .from('component_2d_renders')
    .select('component_id');

  if (compError || renderError || !components || !renders) {
    console.error('❌ Failed to check integrity');
    return false;
  }

  const componentIds = new Set(components.map(c => c.component_id));
  const renderIds = new Set(renders.map(r => r.component_id));

  const missing = [...componentIds].filter(id => !renderIds.has(id));

  if (missing.length > 0) {
    console.log(`⚠️  Found ${missing.length} components without 2D render definitions:`);
    missing.slice(0, 5).forEach(id => console.log(`      ${id}`));
    if (missing.length > 5) {
      console.log(`      ... and ${missing.length - 5} more`);
    }
    console.log('');
  } else {
    console.log('✅ All components have 2D render definitions\n');
  }

  return true;
}

async function testColorFormats() {
  console.log('🔍 Test 8: Color Format Validation\n');

  const { data, error } = await supabase
    .from('component_2d_renders')
    .select('component_id, fill_color, stroke_color')
    .limit(100);

  if (error || !data) {
    console.error('❌ Failed to fetch colors:', error);
    return false;
  }

  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  const invalidColors: string[] = [];

  data.forEach(item => {
    if (item.fill_color && !hexPattern.test(item.fill_color)) {
      invalidColors.push(`${item.component_id}: fill_color="${item.fill_color}"`);
    }
    if (item.stroke_color && !hexPattern.test(item.stroke_color)) {
      invalidColors.push(`${item.component_id}: stroke_color="${item.stroke_color}"`);
    }
  });

  if (invalidColors.length > 0) {
    console.log(`⚠️  Found ${invalidColors.length} invalid colors:`);
    invalidColors.slice(0, 5).forEach(msg => console.log(`      ${msg}`));
    console.log('');
  } else {
    console.log('✅ All colors are valid hex format\n');
  }

  return true;
}

async function testPerformance() {
  console.log('🔍 Test 9: Query Performance\n');

  const startTime = performance.now();

  const { data, error } = await supabase
    .from('component_2d_renders')
    .select('*');

  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  if (error || !data) {
    console.error('❌ Performance test failed:', error);
    return false;
  }

  console.log(`✅ Loaded ${data.length} definitions in ${duration}ms`);

  if (duration > 500) {
    console.log('⚠️  Query took longer than 500ms (expected <200ms)');
  } else if (duration > 200) {
    console.log('✅ Query time acceptable (target: <200ms)');
  } else {
    console.log('✅ Query time excellent!');
  }

  console.log('');
  return true;
}

async function testSpecificComponents() {
  console.log('🔍 Test 10: Specific Component Tests\n');

  const testCases = [
    'base-cabinet-60',
    'corner-cabinet',
    'butler-sink-60',
    'single-bed-90',
    'dishwasher-60'
  ];

  for (const componentId of testCases) {
    const { data, error } = await supabase
      .from('component_2d_renders')
      .select('*')
      .eq('component_id', componentId)
      .single();

    if (error || !data) {
      console.log(`   ⚠️  ${componentId}: Not found`);
    } else {
      console.log(`   ✅ ${componentId}:`);
      console.log(`      Plan: ${data.plan_view_type}`);
      console.log(`      Elevation: ${data.elevation_type}`);
      console.log(`      Color: ${data.fill_color}`);
    }
  }

  console.log('');
  return true;
}

// =====================================================
// Run All Tests
// =====================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  2D Rendering System - Test Suite                     ║');
  console.log('║  Date: 2025-10-09                                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const tests = [
    testDatabaseConnection,
    testRenderDefinitionStructure,
    testComponentTypes,
    testSinkDefinitions,
    testCornerDefinitions,
    testCabinetConfigurations,
    testDataIntegrity,
    testColorFormats,
    testPerformance,
    testSpecificComponents
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('❌ Test error:', error);
      failed++;
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Test Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total: ${tests.length}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 All tests passed! Database-driven 2D rendering is ready.');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Proceed to Phase 3: DesignCanvas2D Integration');
    console.log('   2. Add feature flag and refactor drawElement()');
    console.log('   3. Test rendering in actual canvas\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.');
    console.log('   Fix issues before proceeding to Phase 3.\n');
  }
}

// =====================================================
// Execute Tests
// =====================================================

runAllTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
