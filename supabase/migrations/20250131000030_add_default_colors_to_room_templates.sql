-- =============================================================================
-- Add default_colors to room_type_templates table
-- =============================================================================
-- Purpose: Move hardcoded room appearance colors from AdaptiveView3D.tsx to database
--
-- Current hardcoded values (in AdaptiveView3D.tsx lines 99-104):
-- - floor: #f5f5f5 (light grey)
-- - walls: #ffffff (white)
-- - ceiling: Not currently rendered
-- - text: #666 (dark grey - for dimension labels)
--
-- Benefits:
-- - Admin control over room appearance
-- - Per-room-type customization (e.g., bathroom = blue tint)
-- - Theme support (light/dark modes)
-- - Brand customization
-- =============================================================================

-- Add default_colors column
ALTER TABLE public.room_type_templates
ADD COLUMN IF NOT EXISTS default_colors JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.room_type_templates.default_colors IS 'Default colors for room appearance: {floor, walls, ceiling, text}';

-- Set default colors for all room types
UPDATE public.room_type_templates
SET default_colors = jsonb_build_object(
  'floor', '#f5f5f5',
  'walls', '#ffffff',
  'ceiling', '#fafafa',
  'text', '#666666'
)
WHERE default_colors = '{}'::jsonb OR default_colors IS NULL;

-- Add index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_room_templates_colors
ON public.room_type_templates USING GIN(default_colors);

-- Log completion
DO $$ BEGIN
    RAISE NOTICE 'Migration complete: Added default_colors column to room_type_templates';
    RAISE NOTICE 'All room types updated with default color scheme';
END $$;
