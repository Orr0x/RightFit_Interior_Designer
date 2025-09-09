import React, { useState } from 'react';
import { 
  Plus, 
  FolderOpen, 
  Trash2, 
  Edit3, 
  Calendar, 
  Home,
  Eye,
  EyeOff,
  MoreVertical
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { useProject } from '../../contexts/ProjectContext';
import { Project } from '../../types/project';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface ProjectDashboardProps {
  onProjectSelect: (project: Project) => void;
  className?: string;
}

export function ProjectDashboard({ onProjectSelect, className }: ProjectDashboardProps) {
  const {
    projects,
    createProject,
    updateProject,
    deleteProject,
    loadProject,
    loading,
    error,
  } = useProject();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    const newProject = await createProject(projectName, projectDescription || undefined);
    if (newProject) {
      setIsCreateDialogOpen(false);
      setProjectName('');
      setProjectDescription('');
      setIsPublic(false);
      
      // Auto-load the new project
      await loadProject(newProject.id);
      onProjectSelect(newProject);
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject || !projectName.trim()) return;

    await updateProject(selectedProject.id, {
      name: projectName,
      description: projectDescription || undefined,
      is_public: isPublic,
    });

    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    await deleteProject(selectedProject.id);
    setIsDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const handleProjectSelect = async (project: Project) => {
    await loadProject(project.id);
    onProjectSelect(project);
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setIsPublic(project.is_public);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setProjectName('');
    setProjectDescription('');
    setIsPublic(false);
    setSelectedProject(null);
  };

  const getRoomCount = (project: Project) => {
    return project.room_designs?.length || 0;
  };

  const getTotalElements = (project: Project) => {
    return project.room_designs?.reduce((total, room) => 
      total + (room.design_elements?.length || 0), 0
    ) || 0;
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            Manage your interior design projects
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Start a new interior design project. You can add multiple rooms later.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., My Dream Kitchen"
                />
              </div>
              
              <div>
                <Label htmlFor="project-description">Description (Optional)</Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your project..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="is-public">Make project public</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!projectName.trim() || loading}
              >
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Projects Yet</CardTitle>
              <CardDescription>
                Create your first interior design project to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleProjectSelect(project)}>
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Open Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(project)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(project)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Home className="h-4 w-4" />
                    <span>{getRoomCount(project)} rooms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(project.updated_at))} ago</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {getTotalElements(project)} elements
                    </Badge>
                    {project.is_public ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Private
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleProjectSelect(project)}
                    disabled={loading}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-project-name">Project Name</Label>
              <Input
                id="edit-project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., My Dream Kitchen"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-project-description">Description (Optional)</Label>
              <Textarea
                id="edit-project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="edit-is-public">Make project public</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditProject}
              disabled={!projectName.trim() || loading}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProject?.name}"? 
              This action cannot be undone and will permanently delete all rooms and designs in this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedProject(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProjectDashboard;