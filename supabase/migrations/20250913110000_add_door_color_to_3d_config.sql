-- Add door_color column to model_3d_config table for enhanced door styling
ALTER TABLE model_3d_config 
ADD COLUMN door_color VARCHAR(7) DEFAULT '#654321';

-- Update existing records with corner cabinet door color for consistency
UPDATE model_3d_config 
SET door_color = '#654321' 
WHERE door_color IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN model_3d_config.door_color IS 'Hex color code for door/drawer fronts (for visual definition)';
