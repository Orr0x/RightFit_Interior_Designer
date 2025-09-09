-- Multi-Room Project Architecture - Phase 1
-- Create new tables for projects and room designs

-- Create projects table (replaces current designs table concept)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room designs table (individual room designs within projects)
CREATE TABLE public.room_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL CHECK (room_type IN (
    'kitchen', 'bedroom', 'bathroom', 'living-room', 
    'dining-room', 'utility', 'under-stairs'
  )),
  name TEXT, -- Optional custom name for the room
  room_dimensions JSONB NOT NULL DEFAULT '{"width": 400, "height": 300}',
  design_elements JSONB NOT NULL DEFAULT '[]',
  design_settings JSONB NOT NULL DEFAULT '{}', -- Room-specific settings
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one room design per room type per project
  UNIQUE(project_id, room_type)
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_designs ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
CREATE POLICY "Users can view their own projects and public projects" 
ON public.projects FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own projects" 
ON public.projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects FOR DELETE 
USING (auth.uid() = user_id);

-- Room designs RLS policies
CREATE POLICY "Users can view room designs of their projects and public projects" 
ON public.room_designs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = room_designs.project_id 
    AND (projects.user_id = auth.uid() OR projects.is_public = true)
  )
);

CREATE POLICY "Users can create room designs for their projects" 
ON public.room_designs FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = room_designs.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update room designs of their projects" 
ON public.room_designs FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = room_designs.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete room designs of their projects" 
ON public.room_designs FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = room_designs.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_public ON public.projects(is_public) WHERE is_public = true;
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

CREATE INDEX idx_room_designs_project_id ON public.room_designs(project_id);
CREATE INDEX idx_room_designs_room_type ON public.room_designs(room_type);
CREATE INDEX idx_room_designs_project_room ON public.room_designs(project_id, room_type);
CREATE INDEX idx_room_designs_created_at ON public.room_designs(created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_designs_updated_at
  BEFORE UPDATE ON public.room_designs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.projects IS 'Projects containing multiple room designs';
COMMENT ON TABLE public.room_designs IS 'Individual room designs within projects';
COMMENT ON CONSTRAINT room_designs_project_id_room_type_key ON public.room_designs IS 'Ensures one room design per room type per project';