-- Multi-Room Project Architecture - Phase 1
-- Migrate existing designs to new project structure

-- First, create a backup of existing designs table
CREATE TABLE public.designs_backup AS SELECT * FROM public.designs;

-- Step 1: Create projects from existing designs
-- Group designs by user and create one project per user with multiple designs
-- or create individual projects for each design (safer approach)
INSERT INTO public.projects (user_id, name, description, is_public, created_at, updated_at)
SELECT 
  user_id,
  COALESCE(name, 'Migrated Design') as name,
  CASE 
    WHEN description IS NOT NULL AND description != '' 
    THEN description || ' (Migrated from legacy system)'
    ELSE 'Migrated from legacy design system'
  END as description,
  is_public,
  created_at,
  updated_at
FROM public.designs
ORDER BY created_at;

-- Step 2: Create room designs from existing designs
-- Each existing design becomes a room design within a project
INSERT INTO public.room_designs (
  project_id, 
  room_type, 
  name,
  room_dimensions, 
  design_elements,
  design_settings,
  created_at,
  updated_at
)
SELECT 
  p.id as project_id,
  d.room_type,
  d.name as name, -- Use design name as room name
  -- Extract room dimensions from design_data, with fallbacks
  CASE 
    WHEN d.design_data ? 'roomDimensions' THEN
      jsonb_build_object(
        'width', COALESCE((d.design_data->'roomDimensions'->>'width')::int, 400),
        'height', COALESCE((d.design_data->'roomDimensions'->>'height')::int, 300)
      )
    ELSE
      '{"width": 400, "height": 300}'::jsonb
  END as room_dimensions,
  -- Extract elements from design_data
  COALESCE(d.design_data->'elements', '[]'::jsonb) as design_elements,
  -- Create basic design settings
  jsonb_build_object(
    'migrated', true,
    'original_design_id', d.id,
    'migration_date', now()
  ) as design_settings,
  d.created_at,
  d.updated_at
FROM public.designs d
JOIN public.projects p ON p.user_id = d.user_id 
  AND p.name = COALESCE(d.name, 'Migrated Design')
  AND p.created_at = d.created_at -- Match by creation time to link correct project
ORDER BY d.created_at;

-- Step 3: Handle any designs that might have failed to migrate
-- Check for designs that don't have corresponding room designs
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM public.designs d
  WHERE NOT EXISTS (
    SELECT 1 FROM public.room_designs rd
    JOIN public.projects p ON p.id = rd.project_id
    WHERE p.user_id = d.user_id 
    AND rd.design_settings->>'original_design_id' = d.id::text
  );
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Found % designs that were not migrated. Creating fallback projects.', missing_count;
    
    -- Create fallback projects for any missed designs
    INSERT INTO public.projects (user_id, name, description, is_public, created_at, updated_at)
    SELECT DISTINCT
      d.user_id,
      'Fallback Project - ' || COALESCE(d.name, 'Unnamed Design'),
      'Fallback project created during migration',
      d.is_public,
      d.created_at,
      d.updated_at
    FROM public.designs d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.room_designs rd
      JOIN public.projects p ON p.id = rd.project_id
      WHERE p.user_id = d.user_id 
      AND rd.design_settings->>'original_design_id' = d.id::text
    );
    
    -- Create room designs for fallback projects
    INSERT INTO public.room_designs (
      project_id, 
      room_type, 
      name,
      room_dimensions, 
      design_elements,
      design_settings,
      created_at,
      updated_at
    )
    SELECT 
      p.id as project_id,
      d.room_type,
      d.name as name,
      CASE 
        WHEN d.design_data ? 'roomDimensions' THEN
          jsonb_build_object(
            'width', COALESCE((d.design_data->'roomDimensions'->>'width')::int, 400),
            'height', COALESCE((d.design_data->'roomDimensions'->>'height')::int, 300)
          )
        ELSE
          '{"width": 400, "height": 300}'::jsonb
      END as room_dimensions,
      COALESCE(d.design_data->'elements', '[]'::jsonb) as design_elements,
      jsonb_build_object(
        'migrated', true,
        'fallback_migration', true,
        'original_design_id', d.id,
        'migration_date', now()
      ) as design_settings,
      d.created_at,
      d.updated_at
    FROM public.designs d
    JOIN public.projects p ON p.user_id = d.user_id 
      AND p.name = 'Fallback Project - ' || COALESCE(d.name, 'Unnamed Design')
    WHERE NOT EXISTS (
      SELECT 1 FROM public.room_designs rd2
      JOIN public.projects p2 ON p2.id = rd2.project_id
      WHERE p2.user_id = d.user_id 
      AND rd2.design_settings->>'original_design_id' = d.id::text
    );
  END IF;
END $$;

-- Step 4: Verification queries (for logging/debugging)
DO $$
DECLARE
  original_count INTEGER;
  migrated_count INTEGER;
  project_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO original_count FROM public.designs;
  SELECT COUNT(*) INTO migrated_count FROM public.room_designs WHERE design_settings ? 'migrated';
  SELECT COUNT(*) INTO project_count FROM public.projects;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '- Original designs: %', original_count;
  RAISE NOTICE '- Migrated room designs: %', migrated_count;
  RAISE NOTICE '- Created projects: %', project_count;
  
  IF original_count != migrated_count THEN
    RAISE WARNING 'Migration count mismatch! Original: %, Migrated: %', original_count, migrated_count;
  ELSE
    RAISE NOTICE 'Migration completed successfully - all designs migrated';
  END IF;
END $$;

-- Step 5: Create indexes on the new migrated data
REINDEX TABLE public.projects;
REINDEX TABLE public.room_designs;

-- Add comment about migration
COMMENT ON TABLE public.designs_backup IS 'Backup of original designs table before migration to multi-room architecture';