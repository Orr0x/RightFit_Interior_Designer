// Script to update Supabase database schema to support new room types
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

// Get credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

const updateRoomTypes = async () => {
  console.log('Updating room_type column in designs table...');
  
  try {
    // First, we need to check the current enum type for room_types
    const { data: typeData, error: typeError } = await supabase.rpc('get_room_type_enum');
    
    if (typeError) {
      // If the function doesn't exist, we need to create it first
      console.log('Creating function to get enum values...');
      
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION get_room_type_enum()
        RETURNS TABLE (enum_value text)
        LANGUAGE SQL
        AS $$
          SELECT enum_range(NULL::room_type)::text[];
        $$;
      `;
      
      const { error: createFnError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
      
      if (createFnError) {
        console.error('Error creating function:', createFnError);
        return;
      }
    }
    
    // Now get the enum values
    const { data: enumData, error: enumError } = await supabase.rpc('get_room_type_enum');
    
    if (enumError) {
      console.error('Error fetching enum values:', enumError);
      return;
    }
    
    console.log('Current room_type enum values:', enumData);
    
    // Update the enum type to include new room types
    const updateTypeSQL = `
      ALTER TYPE room_type ADD VALUE IF NOT EXISTS 'living-room';
      ALTER TYPE room_type ADD VALUE IF NOT EXISTS 'dining-room';
      ALTER TYPE room_type ADD VALUE IF NOT EXISTS 'utility';
      ALTER TYPE room_type ADD VALUE IF NOT EXISTS 'under-stairs';
    `;
    
    const { error: updateError } = await supabase.rpc('exec_sql', { sql: updateTypeSQL });
    
    if (updateError) {
      console.error('Error updating room_type enum:', updateError);
      return;
    };
    
    // Update any existing designs with old room types
    const updateDesignsSQL = `
      UPDATE designs 
      SET room_type = 'living-room' 
      WHERE room_type = 'media-wall';
      
      UPDATE designs 
      SET room_type = 'dining-room' 
      WHERE room_type = 'flooring';
    `;
    
    const { error: updateDesignsError } = await supabase.rpc('exec_sql', { sql: updateDesignsSQL });
    
    if (updateDesignsError) {
      console.error('Error updating existing designs:', updateDesignsError);
      return;
    }
    
    console.log('Room types updated successfully!');
    
    // Verify the new enum values
    const { data: newEnumData, error: newEnumError } = await supabase.rpc('get_room_type_enum');
    
    if (newEnumError) {
      console.error('Error fetching updated enum values:', newEnumError);
      return;
    }
    
    console.log('Updated room_type enum values:', newEnumData);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

// Execute the update
updateRoomTypes().catch(console.error);