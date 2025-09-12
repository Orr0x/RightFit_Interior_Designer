import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, getUserTierPermissions } from '@/types/user-tiers';
import DevToolsHeader from '@/components/DevToolsHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Images, 
  Image, 
  Plus,
  Eye,
  Edit3,
  Trash2,
  Crown,
  Camera,
  Grid,
  List
} from 'lucide-react';

interface GalleryProject {
  id: string;
  title: string;
  category: string;
  beforeImage: string;
  afterImage: string;
  description: string;
  completionDate: string;
  featured: boolean;
}

const GalleryManager: React.FC = () => {
  const { user } = useAuth();
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);

  // Mock data
  const [projects] = useState<GalleryProject[]>([
    {
      id: '1',
      title: 'Modern Kitchen Transformation',
      category: 'Kitchen',
      beforeImage: '/gallery/kitchen-before-1.jpg',
      afterImage: '/gallery/kitchen-after-1.jpg',
      description: 'Complete kitchen renovation with modern appliances and sleek design.',
      completionDate: '2024-01-15',
      featured: true
    },
    {
      id: '2',
      title: 'Luxury Bathroom Renovation',
      category: 'Bathroom',
      beforeImage: '/gallery/bathroom-before-1.jpg',
      afterImage: '/gallery/bathroom-after-1.jpg',
      description: 'Spa-like bathroom with premium fixtures and elegant tilework.',
      completionDate: '2024-01-10',
      featured: false
    }
  ]);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!permissions.canAccessGitUI) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <CardTitle>Gallery Manager</CardTitle>
            <CardDescription>Developer access required</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              This tool requires DEV tier access or higher.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DevToolsHeader 
        title="Gallery Manager"
        description="Showcase your project portfolio"
        icon={<Images className="h-5 w-5 text-purple-600" />}
      />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* View Mode Controls */}
        <div className="flex justify-end space-x-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Gallery</CardTitle>
                    <CardDescription>
                      Before/after showcases of your completed projects
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                      <Card key={project.id} className="overflow-hidden">
                        <div className="relative">
                          <div className="grid grid-cols-2 gap-0">
                            <div className="relative aspect-square bg-gray-200">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                  <p className="text-xs text-gray-500">Before</p>
                                </div>
                              </div>
                            </div>
                            <div className="relative aspect-square bg-gray-200">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                  <p className="text-xs text-gray-500">After</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          {project.featured && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{project.title}</h3>
                            <Badge variant="outline">{project.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{project.completionDate}</span>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-500">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map(project => (
                      <Card key={project.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex space-x-2">
                                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                  <Camera className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                  <Camera className="h-6 w-6 text-gray-400" />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold">{project.title}</h3>
                                  <Badge variant="outline">{project.category}</Badge>
                                  {project.featured && <Badge className="bg-yellow-500">Featured</Badge>}
                                </div>
                                <p className="text-sm text-gray-600">{project.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{project.completionDate}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-500">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GalleryManager;
