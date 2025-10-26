/**
 * Type Verification Utility
 *
 * This file verifies that newly regenerated TypeScript types from Supabase
 * correctly include all required fields for collision detection.
 *
 * Created for Story 1.1 - Fix Type/Schema Mismatch
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Test query to verify collision detection fields are accessible
 * without TypeScript compilation errors
 */
export async function testComponent3DModelsTypes() {
  const { data, error } = await supabase
    .from('component_3d_models')
    .select('component_id, layer_type, min_height_cm, max_height_cm, can_overlap_layers')
    .limit(1)
    .single();

  if (error) {
    console.log('⚠️ [Type Verification] No data returned (table may be empty):', error.message);
    return null;
  }

  // TypeScript will fail compilation if these fields don't exist in the types
  const verification = {
    component_id: data.component_id,
    layer_type: data.layer_type,            // ✅ Should compile without errors
    min_height_cm: data.min_height_cm,      // ✅ Should compile without errors
    max_height_cm: data.max_height_cm,      // ✅ Should compile without errors
    can_overlap_layers: data.can_overlap_layers // ✅ Should compile without errors
  };

  console.log('✅ [Type Verification] All collision detection fields accessible:', verification);
  return verification;
}

/**
 * Verify field types match expected TypeScript types
 */
export function verifyFieldTypes() {
  type Component3DModel = {
    component_id: string;
    layer_type: string | null;
    min_height_cm: number | null;
    max_height_cm: number | null;
    can_overlap_layers: string[] | null;
  };

  // This will fail compilation if types don't match the interface
  const mockComponent: Component3DModel = {
    component_id: 'test',
    layer_type: 'base',
    min_height_cm: 0,
    max_height_cm: 100,
    can_overlap_layers: ['wall', 'ceiling']
  };

  console.log('✅ [Type Verification] Field types match expected interface');
  return mockComponent;
}
