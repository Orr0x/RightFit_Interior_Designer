/**
 * Script to populate component_2d_renders table with existing components
 * Date: 2025-10-09
 * Purpose: Migrate from hardcoded 2D rendering to database-driven system
 * Related: docs/session-2025-10-09-2d-database-migration/
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env files (.env.local takes precedence)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service key for admin operations
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// Helper Functions for Component Type Detection
// =====================================================

function detectPlanViewType(componentId: string, type: string): string {
  // Corner components
  if (componentId.includes('corner')) {
    return 'corner-square';
  }

  // Sink types
  if (componentId.includes('sink')) {
    if (componentId.includes('double-bowl') || componentId.includes('double')) {
      return 'sink-double';
    } else if (componentId.includes('corner-sink')) {
      return 'sink-corner';
    } else {
      return 'sink-single';
    }
  }

  // Default rectangle for all other components
  return 'rectangle';
}

function generatePlanViewData(componentId: string, planViewType: string): Record<string, any> {
  if (planViewType === 'sink-single') {
    // Detect butler sink (ceramic) vs. stainless steel
    const isCeramic = componentId.includes('butler') ||
                      componentId.includes('ceramic') ||
                      componentId.includes('base-unit-sink');

    return {
      bowl_inset_ratio: 0.15,
      bowl_depth_ratio: 0.8,
      bowl_style: isCeramic ? 'ceramic' : 'stainless',
      has_drain: true,
      has_faucet_hole: true,
      faucet_hole_position: 0.2,
      has_draining_board: componentId.includes('draining-board') || componentId.includes('draining')
    };
  }

  if (planViewType === 'sink-double') {
    const isCeramic = componentId.includes('butler') || componentId.includes('ceramic');

    return {
      bowl_inset_ratio: 0.1,
      bowl_width_ratio: 0.4,
      center_divider_width: 5,
      bowl_style: isCeramic ? 'ceramic' : 'stainless',
      has_drain: true,
      has_faucet_hole: true
    };
  }

  if (planViewType === 'sink-corner') {
    return {
      bowl_size_ratio: 0.6,
      bowl_style: 'stainless',
      has_drain: true
    };
  }

  // Rectangle and corner-square need no special data
  return {};
}

function detectElevationType(componentId: string, type: string): string {
  if (type === 'sink' || componentId.includes('sink')) {
    return 'sink';
  }

  if (type === 'appliance' || componentId.includes('fridge') ||
      componentId.includes('dishwasher') || componentId.includes('oven') ||
      componentId.includes('microwave') || componentId.includes('washing') ||
      componentId.includes('freezer')) {
    return 'appliance';
  }

  if (type === 'open-shelf' || componentId.includes('open-shelf') ||
      componentId.includes('open-shelving')) {
    return 'open-shelf';
  }

  // Default to standard cabinet for everything else
  return 'standard-cabinet';
}

function generateElevationData(componentId: string, type: string, elevationType: string): Record<string, any> {
  if (elevationType === 'standard-cabinet') {
    // Determine if it's a corner cabinet
    const isCorner = componentId.includes('corner');

    // Determine if it's a base cabinet (has toe kick)
    const isBaseCabinet = componentId.includes('base-cabinet') ||
                         componentId.includes('base-unit') ||
                         type === 'base-cabinet' ||
                         type === 'cabinet';

    // Determine if it's a wall cabinet
    const isWallCabinet = componentId.includes('wall-cabinet') ||
                         type === 'wall-cabinet';

    // Extract width from component ID (e.g., "base-cabinet-60" -> 60)
    const widthMatch = componentId.match(/(\d+)(?:cm)?$/);
    const width = widthMatch ? parseInt(widthMatch[1]) : 60;

    // Door count logic
    let doorCount = 2;
    if (isCorner) {
      doorCount = 1; // Corner units typically have 1 door
    } else if (width <= 40) {
      doorCount = 1; // Narrow cabinets have 1 door
    } else if (width >= 80) {
      doorCount = 2; // Wide cabinets have 2 doors
    }

    return {
      door_count: doorCount,
      door_style: 'flat',
      handle_style: 'bar',
      handle_position: 'center',
      has_toe_kick: isBaseCabinet,
      toe_kick_height: isBaseCabinet ? 10 : 0,
      drawer_count: 0, // Could be enhanced later
      drawer_heights: []
    };
  }

  if (elevationType === 'appliance') {
    return {
      panel_style: 'integrated',
      has_display: componentId.includes('fridge') || componentId.includes('oven'),
      has_handle: true
    };
  }

  if (elevationType === 'sink') {
    const isFarmhouse = componentId.includes('farmhouse');

    return {
      has_front_panel: isFarmhouse,
      panel_height: isFarmhouse ? 40 : 10,
      panel_style: isFarmhouse ? 'exposed' : 'under-mount'
    };
  }

  if (elevationType === 'open-shelf') {
    return {
      shelf_count: 3,
      shelf_spacing: 'equal'
    };
  }

  return {};
}

function detectFillColor(componentId: string, type: string): string {
  // Sinks - ceramic or stainless
  if (componentId.includes('sink')) {
    if (componentId.includes('butler') || componentId.includes('ceramic')) {
      return '#FFFFFF'; // Ceramic white
    }
    return '#C0C0C0'; // Stainless steel
  }

  // Appliances - gray/metallic
  if (type === 'appliance' || componentId.includes('fridge') ||
      componentId.includes('dishwasher') || componentId.includes('oven')) {
    return '#808080'; // Gray
  }

  // Default cabinet color - saddle brown
  return '#8b4513';
}

// =====================================================
// Main Population Function
// =====================================================

async function populateComponentRenders() {
  console.log('🚀 Starting 2D render population script...\n');

  // Fetch all components from the database
  console.log('📊 Fetching components from database...');
  const { data: components, error: fetchError } = await supabase
    .from('components')
    .select('component_id, type, name, category')
    .order('component_id');

  if (fetchError) {
    console.error('❌ Error fetching components:', fetchError);
    process.exit(1);
  }

  if (!components || components.length === 0) {
    console.error('❌ No components found in database');
    process.exit(1);
  }

  console.log(`✅ Found ${components.length} components\n`);

  // Check if table is already populated
  const { data: existingRenders, error: countError } = await supabase
    .from('component_2d_renders')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error checking existing renders:', countError);
    process.exit(1);
  }

  // Generate 2D render definitions for all components
  console.log('🔨 Generating 2D render definitions...');

  const renders = components.map(comp => {
    const planViewType = detectPlanViewType(comp.component_id, comp.type);
    const planViewData = generatePlanViewData(comp.component_id, planViewType);
    const elevationType = detectElevationType(comp.component_id, comp.type);
    const elevationData = generateElevationData(comp.component_id, comp.type, elevationType);
    const fillColor = detectFillColor(comp.component_id, comp.type);

    return {
      component_id: comp.component_id,
      plan_view_type: planViewType,
      plan_view_data: planViewData,
      elevation_type: elevationType,
      elevation_data: elevationData,
      side_elevation_type: elevationType, // Same for side views
      side_elevation_data: elevationData,
      fill_color: fillColor,
      stroke_color: '#000000',
      stroke_width: 1
    };
  });

  console.log(`✅ Generated ${renders.length} render definitions\n`);

  // Statistics
  const stats = {
    rectangle: renders.filter(r => r.plan_view_type === 'rectangle').length,
    cornerSquare: renders.filter(r => r.plan_view_type === 'corner-square').length,
    sinkSingle: renders.filter(r => r.plan_view_type === 'sink-single').length,
    sinkDouble: renders.filter(r => r.plan_view_type === 'sink-double').length,
    sinkCorner: renders.filter(r => r.plan_view_type === 'sink-corner').length,
    standardCabinet: renders.filter(r => r.elevation_type === 'standard-cabinet').length,
    appliance: renders.filter(r => r.elevation_type === 'appliance').length,
    sink: renders.filter(r => r.elevation_type === 'sink').length,
    openShelf: renders.filter(r => r.elevation_type === 'open-shelf').length
  };

  console.log('📊 Render Type Statistics:');
  console.log('  Plan View Types:');
  console.log(`    - Rectangle: ${stats.rectangle}`);
  console.log(`    - Corner Square: ${stats.cornerSquare}`);
  console.log(`    - Sink Single: ${stats.sinkSingle}`);
  console.log(`    - Sink Double: ${stats.sinkDouble}`);
  console.log(`    - Sink Corner: ${stats.sinkCorner}`);
  console.log('  Elevation Types:');
  console.log(`    - Standard Cabinet: ${stats.standardCabinet}`);
  console.log(`    - Appliance: ${stats.appliance}`);
  console.log(`    - Sink: ${stats.sink}`);
  console.log(`    - Open Shelf: ${stats.openShelf}`);
  console.log('');

  // Bulk insert with conflict handling
  console.log('💾 Inserting render definitions into database...');

  // Insert in batches of 50 to avoid payload limits
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < renders.length; i += batchSize) {
    const batch = renders.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('component_2d_renders')
      .upsert(batch, {
        onConflict: 'component_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(renders.length/batchSize)} inserted (${batch.length} records)`);
    }
  }

  console.log('');
  console.log('📊 Final Results:');
  console.log(`  ✅ Successfully inserted: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
  console.log('');

  if (errorCount === 0) {
    console.log('🎉 Population complete! All components now have 2D render definitions.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Verify data: SELECT COUNT(*) FROM component_2d_renders;');
    console.log('  2. Test queries: SELECT * FROM component_2d_renders LIMIT 10;');
    console.log('  3. Proceed to Phase 2: Implement Render2DService');
  } else {
    console.log('⚠️  Some records failed to insert. Check errors above.');
    process.exit(1);
  }
}

// =====================================================
// Run Script
// =====================================================

populateComponentRenders().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
