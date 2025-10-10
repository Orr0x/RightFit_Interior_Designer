import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { Project, RoomDesign, RoomType, DesignElement } from '../types/project';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { useAuth } from './AuthContext';
import { Json } from '../integrations/supabase/types';

// Helper function to transform database project to TypeScript interface
function transformProject(dbProject: Record<string, unknown>): Project {
  return {
    id: dbProject.id as string,
    user_id: dbProject.user_id as string,
    name: dbProject.name as string,
    description: (dbProject.description as string) || undefined, // Convert null to undefined
    thumbnail_url: (dbProject.thumbnail_url as string) || undefined, // Convert null to undefined
    is_public: dbProject.is_public as boolean,
    created_at: dbProject.created_at as string,
    updated_at: dbProject.updated_at as string,
    room_designs: Array.isArray(dbProject.room_designs)
      ? dbProject.room_designs.map(transformRoomDesign)
      : [],
  };
}

// Helper function to transform database room design to TypeScript interface
function transformRoomDesign(dbRoomDesign: Record<string, unknown>): RoomDesign {
  return {
    id: dbRoomDesign.id as string,
    project_id: dbRoomDesign.project_id as string,
    room_type: dbRoomDesign.room_type as RoomType,
    name: (dbRoomDesign.name as string) || '',
    design_elements: Array.isArray(dbRoomDesign.design_elements)
      ? dbRoomDesign.design_elements as DesignElement[]
      : [],
    design_settings: (dbRoomDesign.design_settings as Record<string, unknown>) || {},
    room_dimensions: (dbRoomDesign.room_dimensions as { width: number; height: number }) || { width: 800, height: 600 },
    created_at: dbRoomDesign.created_at as string,
    updated_at: dbRoomDesign.updated_at as string,
  };
}

// Context State Interface
interface ProjectState {
  currentProject: Project | null;
  currentRoomId: string | null;
  currentRoomDesign: RoomDesign | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  lastAutoSave: Date | null;
}

// Action Types
type ProjectAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'SET_CURRENT_ROOM'; payload: { roomId: string; roomDesign: RoomDesign } }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_ROOM_DESIGN'; payload: RoomDesign }
  | { type: 'UPDATE_ROOM_DESIGN'; payload: RoomDesign }
  | { type: 'DELETE_ROOM_DESIGN'; payload: string }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'SET_LAST_AUTO_SAVE'; payload: Date };

// Context Interface
interface ProjectContextType extends ProjectState {
  // Project Management
  createProject: (name: string, description?: string) => Promise<Project | null>;
  loadProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  // Room Management
  createRoomDesign: (projectId: string, roomType: RoomType, name?: string) => Promise<RoomDesign | null>;
  switchToRoom: (roomId: string) => Promise<void>;
  updateCurrentRoomDesign: (updates: Partial<RoomDesign>, showLoading?: boolean) => Promise<void>;
  deleteRoomDesign: (roomId: string) => Promise<void>;
  
  // Data Management
  loadUserProjects: () => Promise<void>;
  saveCurrentDesign: (showNotification?: boolean) => Promise<void>;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
}

// Initial State
const initialState: ProjectState = {
  currentProject: null,
  currentRoomId: null,
  currentRoomDesign: null,
  projects: [],
  loading: false,
  error: null,
  hasUnsavedChanges: false,
  lastAutoSave: null,
};

// Reducer
function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload, loading: false };
    
    case 'SET_CURRENT_PROJECT':
      return { 
        ...state, 
        currentProject: action.payload,
        currentRoomId: null,
        currentRoomDesign: null,
        loading: false 
      };
    
    case 'SET_CURRENT_ROOM':
      return {
        ...state,
        currentRoomId: action.payload.roomId,
        currentRoomDesign: action.payload.roomDesign,
        loading: false
      };
    
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
        loading: false
      };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
        currentProject: state.currentProject?.id === action.payload.id 
          ? action.payload 
          : state.currentProject,
        loading: false
      };
    
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject,
        currentRoomId: state.currentProject?.id === action.payload ? null : state.currentRoomId,
        currentRoomDesign: state.currentProject?.id === action.payload ? null : state.currentRoomDesign,
        loading: false
      };
    
    case 'ADD_ROOM_DESIGN': {
      if (!state.currentProject) return state;
      
      const updatedProject = {
        ...state.currentProject,
        room_designs: [...(state.currentProject.room_designs || []), action.payload]
      };
      
      return {
        ...state,
        currentProject: updatedProject,
        projects: state.projects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        ),
        loading: false
      };
    }
    
    case 'UPDATE_ROOM_DESIGN': {
      if (!state.currentProject) return state;
      
      const projectWithUpdatedRoom = {
        ...state.currentProject,
        room_designs: (state.currentProject.room_designs || []).map(rd =>
          rd.id === action.payload.id ? action.payload : rd
        )
      };
      
      return {
        ...state,
        currentProject: projectWithUpdatedRoom,
        projects: state.projects.map(p => 
          p.id === projectWithUpdatedRoom.id ? projectWithUpdatedRoom : p
        ),
        currentRoomDesign: state.currentRoomDesign?.id === action.payload.id 
          ? action.payload 
          : state.currentRoomDesign,
        loading: false
      };
    }
    
    case 'DELETE_ROOM_DESIGN': {
      if (!state.currentProject) return state;
      
      const projectWithRemovedRoom = {
        ...state.currentProject,
        room_designs: (state.currentProject.room_designs || []).filter(rd => rd.id !== action.payload)
      };
      
      return {
        ...state,
        currentProject: projectWithRemovedRoom,
        projects: state.projects.map(p => 
          p.id === projectWithRemovedRoom.id ? projectWithRemovedRoom : p
        ),
        currentRoomId: state.currentRoomId === action.payload ? null : state.currentRoomId,
        currentRoomDesign: state.currentRoomDesign?.id === action.payload ? null : state.currentRoomDesign,
        loading: false
      };
    }
    
    case 'SET_UNSAVED_CHANGES':
      return {
        ...state,
        hasUnsavedChanges: action.payload
      };
    
    case 'SET_LAST_AUTO_SAVE':
      return {
        ...state,
        lastAutoSave: action.payload
      };
    
    default:
      return state;
  }
}

// Create Context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Provider Component
export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

  // Auto-save state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Refs to avoid stale closures in intervals
  const stateRef = useRef(state);
  const saveCurrentDesignRef = useRef<((showNotification?: boolean) => Promise<void>) | null>(null);
  
  // Update refs when values change
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Get current user - now uses AuthContext user instead of direct Supabase call
  const getCurrentUser = async () => {
    // Use the authenticated user from AuthContext instead of making a new Supabase call
    // This prevents race conditions where auth state isn't ready yet
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  };

  // Project Management Functions
  const createProject = useCallback(async (name: string, description?: string): Promise<Project | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name,
          description,
          user_id: user.id,
        })
        .select('*')
        .single();

      if (error) {
        // Check if error is due to missing table
        const errorObj = error as { message?: string; code?: string };
        if (errorObj.message?.includes('relation "projects" does not exist') ||
            errorObj.message?.includes('table "projects" does not exist') ||
            errorObj.code === 'PGRST116' || errorObj.code === '42P01') {

          toast({
            title: "Database Setup Required",
            description: "Please deploy Phase 1 migrations to create projects.",
            variant: "destructive",
          });
          dispatch({ type: 'SET_ERROR', payload: 'Database migrations required for project creation' });
          return null;
        }
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create project');
      }

      const newProject: Project = transformProject(data);

      dispatch({ type: 'ADD_PROJECT', payload: newProject });

      toast({
        title: "Project Created",
        description: `Project "${name}" has been created successfully.`,
      });

      return newProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, [dispatch, toast, getCurrentUser]);

  const loadProject = useCallback(async (projectId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          room_designs (*)
        `)
        .eq('id', projectId)
        .single() as { data: Record<string, unknown> | null; error: unknown };

      if (error) {
        // Check if error is due to missing table
        const errorObj = error as { message?: string; code?: string };
        if (errorObj.message?.includes('relation "projects" does not exist') ||
            errorObj.message?.includes('table "projects" does not exist') ||
            errorObj.code === 'PGRST116' || errorObj.code === '42P01') {

          toast({
            title: "Database Setup Required",
            description: "Please deploy Phase 1 migrations to load projects.",
            variant: "destructive",
          });
          dispatch({ type: 'SET_ERROR', payload: 'Database migrations required for project loading' });
          return;
        }
        throw error;
      }

      if (!data) {
        throw new Error('Project not found');
      }

      const project: Project = transformProject(data);

      dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });

      // Auto-select first room if available
      if (project.room_designs && project.room_designs.length > 0) {
        const firstRoom = project.room_designs[0];
        dispatch({
          type: 'SET_CURRENT_ROOM',
          payload: { roomId: firstRoom.id, roomDesign: firstRoom }
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [dispatch, toast]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select('*')
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Project not found');
      }

      const updatedProject: Project = {
        ...transformProject(data),
        room_designs: state.currentProject?.room_designs || []
      };

      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });

      toast({
        title: "Project Updated",
        description: "Project has been updated successfully.",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [dispatch, toast, state.currentProject?.room_designs]);

  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      dispatch({ type: 'DELETE_PROJECT', payload: projectId });

      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully.",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [dispatch, toast]);

  // Room Management Functions
  const createRoomDesign = useCallback(async (
    projectId: string,
    roomType: RoomType,
    name?: string
  ): Promise<RoomDesign | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Check if room type already exists in the current project
      const existingRoomsOfType = (state.currentProject?.room_designs || []).filter(rd => rd.room_type === roomType);

      if (existingRoomsOfType.length > 0) {
        dispatch({ type: 'SET_LOADING', payload: false });

        const roomDisplayNames: Record<RoomType, string> = {
          kitchen: 'Kitchen',
          bedroom: 'Bedroom',
          'master-bedroom': 'Master Bedroom',
          'guest-bedroom': 'Guest Bedroom',
          bathroom: 'Bathroom',
          ensuite: 'Ensuite',
          'living-room': 'Living Room',
          'dining-room': 'Dining Room',
          office: 'Office',
          'dressing-room': 'Dressing Room',
          utility: 'Utility Room',
          'under-stairs': 'Under Stairs',
        };

        toast({
          title: "Room Already Exists",
          description: `A ${roomDisplayNames[roomType]} already exists in this project. Only one room of each type is allowed.`,
          variant: "destructive",
        });

        return null;
      }

      // Generate room name
      let roomName = name;
      if (!roomName) {
        const roomDisplayNames: Record<RoomType, string> = {
          kitchen: 'Kitchen',
          bedroom: 'Bedroom',
          'master-bedroom': 'Master Bedroom',
          'guest-bedroom': 'Guest Bedroom',
          bathroom: 'Bathroom',
          ensuite: 'Ensuite',
          'living-room': 'Living Room',
          'dining-room': 'Dining Room',
          office: 'Office',
          'dressing-room': 'Dressing Room',
          utility: 'Utility Room',
          'under-stairs': 'Under Stairs',
        };

        roomName = roomDisplayNames[roomType];
      }

      const { data, error } = await supabase
        .from('room_designs')
        .insert({
          project_id: projectId,
          room_type: roomType,
          name: roomName,
          design_elements: [],
          design_settings: {
            canvas_settings: {
              width: 800,
              height: 600,
              grid_size: 20,
              snap_to_grid: true
            }
          },
          room_dimensions: {
            width: 600,  // Updated to match the new default dimensions
            height: 400
          }
        })
        .select('*')
        .single();

      if (error) throw error;

      const newRoomDesign = transformRoomDesign(data);
      dispatch({ type: 'ADD_ROOM_DESIGN', payload: newRoomDesign });

      // Automatically switch to the newly created room
      dispatch({
        type: 'SET_CURRENT_ROOM',
        payload: { roomId: newRoomDesign.id, roomDesign: newRoomDesign }
      });

      toast({
        title: "Room Created",
        description: `${roomName} has been created successfully.`,
      });

      return newRoomDesign;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room design';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, [dispatch, toast, state.currentProject?.room_designs]);

  const switchToRoom = useCallback(async (roomId: string): Promise<void> => {
    try {
      if (!state.currentProject) {
        throw new Error('No project loaded');
      }

      const roomDesign = (state.currentProject.room_designs || []).find(rd => rd.id === roomId);
      if (!roomDesign) {
        throw new Error('Room design not found');
      }

      dispatch({
        type: 'SET_CURRENT_ROOM',
        payload: { roomId, roomDesign }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch room';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [state.currentProject, dispatch, toast]);

  const updateCurrentRoomDesign = useCallback(async (updates: Partial<RoomDesign>, showLoading: boolean = false): Promise<void> => {
    try {
      if (!state.currentRoomDesign) {
        throw new Error('No room design selected');
      }

      // Only show loading state for major updates, not for element position changes
      if (showLoading) {
        dispatch({ type: 'SET_LOADING', payload: true });
      }

      // Transform updates to match database schema
      const dbUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if (key === 'design_elements') {
          dbUpdates[key] = updates[key] as unknown as Json;
        } else if (key === 'design_settings') {
          dbUpdates[key] = updates[key] as unknown as Json;
        } else if (key === 'room_dimensions') {
          dbUpdates[key] = updates[key] as unknown as Json;
        } else {
          dbUpdates[key] = updates[key as keyof RoomDesign];
        }
      });

      const { data, error } = await supabase
        .from('room_designs')
        .update(dbUpdates)
        .eq('id', state.currentRoomDesign.id)
        .select('*')
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_ROOM_DESIGN', payload: transformRoomDesign(data) });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update room design';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [state.currentRoomDesign, dispatch, toast]);

  const deleteRoomDesign = useCallback(async (roomId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { error } = await supabase
        .from('room_designs')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      // Check if we're deleting the currently selected room
      const wasCurrentRoom = state.currentRoomId === roomId;

      // Remove the room from state
      dispatch({ type: 'DELETE_ROOM_DESIGN', payload: roomId });

      // If we deleted the current room, auto-select another room
      if (wasCurrentRoom && state.currentProject) {
        const remainingRooms = (state.currentProject.room_designs || []).filter(rd => rd.id !== roomId);

        if (remainingRooms.length > 0) {
          // Select the first remaining room
          const nextRoom = remainingRooms[0];
          dispatch({
            type: 'SET_CURRENT_ROOM',
            payload: { roomId: nextRoom.id, roomDesign: nextRoom }
          });
        } else {
          // No rooms left, clear current room selection
          dispatch({
            type: 'SET_CURRENT_ROOM',
            payload: { roomId: '', roomDesign: null as any }
          });
        }
      }

      toast({
        title: "Room Deleted",
        description: "Room design has been deleted successfully.",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete room design';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [state.currentRoomId, state.currentProject, dispatch, toast]);

  // Data Management Functions
  const loadUserProjects = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Try to load from new schema first, fallback to empty state if tables don't exist
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          room_designs (*)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        // Check if error is due to missing table (migration not deployed)
        const errorObj = error as { message?: string; code?: string };
        if (errorObj.message?.includes('relation "projects" does not exist') ||
            errorObj.message?.includes('table "projects" does not exist') ||
            errorObj.code === 'PGRST116' || errorObj.code === '42P01') {

          // Projects table does not exist - migrations need to be deployed
          dispatch({ type: 'SET_PROJECTS', payload: [] });
          dispatch({ type: 'SET_ERROR', payload: 'Database migrations pending. Please deploy Phase 1 migrations to use multi-room projects.' });

          toast({
            title: "Database Setup Required",
            description: "Phase 1 database migrations need to be deployed. Using legacy mode for now.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (!data) {
        dispatch({ type: 'SET_PROJECTS', payload: [] });
        return;
      }

      const projects: Project[] = data.map(transformProject);

      dispatch({ type: 'SET_PROJECTS', payload: projects });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load projects';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [dispatch, toast, getCurrentUser]);

  const saveCurrentDesign = useCallback(async (showNotification: boolean = true): Promise<void> => {
    try {
      if (!state.currentRoomDesign) {
        throw new Error('No room design to save');
      }

      console.log('💾 [ProjectContext] Saving current design...', { 
        roomId: state.currentRoomDesign.id, 
        showNotification 
      });

      await updateCurrentRoomDesign({
        updated_at: new Date().toISOString()
      }, showNotification); // Show loading for explicit save operations

      // Update state
      dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
      dispatch({ type: 'SET_LAST_AUTO_SAVE', payload: new Date() });

      if (showNotification) {
        toast({
          title: "Design Saved",
          description: "Your design has been saved successfully.",
        });
      }
      // Auto-save notifications removed - status shown in header instead

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save design';
      console.error('❌ [ProjectContext] Save failed:', errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [state.currentRoomDesign, updateCurrentRoomDesign, dispatch, toast]);

  // Update ref after function is declared
  useEffect(() => {
    saveCurrentDesignRef.current = saveCurrentDesign;
  }, [saveCurrentDesign]);

  // Auto-save functionality - memoized to prevent infinite loops
  const enableAutoSave = useCallback(() => {
    console.log('🔄 [ProjectContext] Enabling auto-save...');
    setAutoSaveEnabled(true);
    
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
    }

    const interval = setInterval(async () => {
      if (state.hasUnsavedChanges && state.currentRoomDesign) {
        console.log('💾 [ProjectContext] Auto-saving design...');
        await saveCurrentDesign(false); // Auto-save without showing main notification
      }
    }, 30000); // Auto-save every 30 seconds

    setAutoSaveInterval(interval);
  }, [state.hasUnsavedChanges, state.currentRoomDesign, autoSaveInterval, saveCurrentDesign]);

  const disableAutoSave = useCallback(() => {
    console.log('⏹️ [ProjectContext] Disabling auto-save...');
    setAutoSaveEnabled(false);
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      setAutoSaveInterval(null);
    }
  }, [autoSaveInterval]);

  // Mark changes as unsaved when room design is updated
  useEffect(() => {
    if (state.currentRoomDesign) {
      dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
    }
  }, [state.currentRoomDesign?.design_elements, state.currentRoomDesign?.room_dimensions]);

  // Initialize auto-save when a room is loaded - simplified to prevent infinite loops
  useEffect(() => {
    console.log('🔧 [ProjectContext] Auto-save initialization check', { 
      autoSaveEnabled, 
      hasInterval: !!autoSaveInterval,
      hasCurrentRoom: !!state.currentRoomDesign,
      roomId: state.currentRoomDesign?.id
    });
    
    // Only start auto-save when we first get a room (and don't have an interval)
    if (autoSaveEnabled && !autoSaveInterval && state.currentRoomDesign?.id) {
      console.log('🚀 [ProjectContext] Initializing auto-save for room:', state.currentRoomDesign.id);
      
      // Create interval directly to avoid dependency issues
      const interval = setInterval(async () => {
        // Use refs to get current values and avoid stale closures
        const currentState = stateRef.current;
        const currentSaveFunction = saveCurrentDesignRef.current;
        
        if (currentState.hasUnsavedChanges && currentState.currentRoomDesign && currentSaveFunction) {
          console.log('💾 [ProjectContext] Auto-saving design...');
          try {
            await currentSaveFunction(false);
          } catch (error) {
            console.error('❌ [ProjectContext] Auto-save failed:', error);
          }
        }
      }, 30000); // Auto-save every 30 seconds

      setAutoSaveInterval(interval);
      setAutoSaveEnabled(true);
    }

    // Clean up interval when room changes or component unmounts
    return () => {
      if (autoSaveInterval) {
        console.log('🧹 [ProjectContext] Cleaning up auto-save interval on room change');
        clearInterval(autoSaveInterval);
        setAutoSaveInterval(null);
      }
    };
  }, [state.currentRoomDesign?.id]); // Only depend on room ID change

  // Load user projects when auth is ready and user is available
  useEffect(() => {
    // Only load projects if:
    // 1. Auth context has finished loading
    // 2. User is authenticated
    if (!isLoading && user) {
      console.log('🔐 [ProjectContext] Auth ready, loading user projects...');
      loadUserProjects();
    } else if (!isLoading && !user) {
      // Auth finished loading but no user - clear any existing projects
      console.log('🔐 [ProjectContext] No authenticated user, clearing projects');
      dispatch({ type: 'SET_PROJECTS', payload: [] });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isLoading, user]);

  const contextValue: ProjectContextType = {
    ...state,
    createProject,
    loadProject,
    updateProject,
    deleteProject,
    createRoomDesign,
    switchToRoom,
    updateCurrentRoomDesign,
    deleteRoomDesign,
    loadUserProjects,
    saveCurrentDesign,
    enableAutoSave,
    disableAutoSave,
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

// Hook to use the context
export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

export default ProjectContext;