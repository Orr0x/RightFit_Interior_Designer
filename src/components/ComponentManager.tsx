import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, getUserTierPermissions } from '@/types/user-tiers';
import { useComponents, DatabaseComponent } from '@/hooks/useComponents';
import { useToast } from '@/hooks/use-toast';
import ComponentForm, { ComponentFormData } from '@/components/ComponentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  Edit3, 
  Archive,
  Search,
  Filter,
  Eye,
  EyeOff,
  Crown,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const ComponentManager: React.FC = () => {
  const { user } = useAuth();
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);
  const { toast } = useToast();

  const {
    components,
    loading,
    error,
    refetch,
    getCategoriesForRoomType,
    createComponent,
    updateComponent,
    deprecateComponent
  } = useComponents();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'manage'>('browse');
  const [selectedComponent, setSelectedComponent] = useState<DatabaseComponent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Check permissions
  if (!permissions.canAccessGitUI && userTier !== UserTier.ADMIN && userTier !== UserTier.GOD) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <CardTitle>Component Manager</CardTitle>
            <CardDescription>Developer access required</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              This tool requires DEV tier access or higher.
            </p>
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
              Current Tier: {userTier}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter components based on search and filters
  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
    const matchesDeprecated = showDeprecated || !component.deprecated;
    
    return matchesSearch && matchesCategory && matchesDeprecated;
  });

  // Get unique categories
  const categories = Array.from(new Set(components.map(c => c.category))).sort();

  const handleCreateComponent = async (componentData: ComponentFormData) => {
    try {
      await createComponent({
        component_id: componentData.component_id,
        name: componentData.name,
        type: componentData.type,
        width: componentData.width,
        depth: componentData.depth,
        height: componentData.height,
        color: componentData.color,
        category: componentData.category,
        room_types: componentData.room_types,
        icon_name: componentData.icon_name,
        description: componentData.description,
        version: componentData.version
      });
      toast({
        title: "Component Created",
        description: `${componentData.name} has been added to the component library.`
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create component. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateComponent = async (id: string, updates: ComponentFormData) => {
    try {
      await updateComponent(id, {
        name: updates.name,
        type: updates.type,
        width: updates.width,
        depth: updates.depth,
        height: updates.height,
        color: updates.color,
        category: updates.category,
        room_types: updates.room_types,
        icon_name: updates.icon_name,
        description: updates.description,
        version: updates.version
      });
      toast({
        title: "Component Updated",
        description: "Component has been updated successfully."
      });
      setIsEditDialogOpen(false);
      setSelectedComponent(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update component. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeprecateComponent = async (id: string, reason: string) => {
    try {
      await deprecateComponent(id, reason);
      toast({
        title: "Component Deprecated",
        description: "Component has been marked as deprecated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deprecate component. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading component library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Error Loading Components</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Component Manager</h1>
              <p className="text-gray-600">Manage your design component library</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-blue-100 text-blue-800">
              {filteredComponents.length} components
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
              <Crown className="h-4 w-4 mr-1" />
              {userTier} Access
            </Badge>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showDeprecated ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDeprecated(!showDeprecated)}
            >
              {showDeprecated ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {showDeprecated ? 'Hide' : 'Show'} Deprecated
            </Button>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Component
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Component</DialogTitle>
                <DialogDescription>
                  Add a new component to the design library
                </DialogDescription>
              </DialogHeader>
              <ComponentForm
                onSubmit={handleCreateComponent}
                onCancel={() => setIsCreateDialogOpen(false)}
                submitLabel="Create Component"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredComponents.map((component) => (
            <Card 
              key={component.id} 
              className={`group hover:shadow-lg transition-all ${component.deprecated ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: component.color }}
                    />
                    <CardTitle className="text-sm">{component.name}</CardTitle>
                  </div>
                  {component.deprecated && (
                    <Badge variant="destructive" className="text-xs">
                      Deprecated
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{component.category}</span>
                  <span>•</span>
                  <span>v{component.version}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{component.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{component.width}×{component.depth}×{component.height}</span>
                  <span>{component.room_types.length} rooms</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedComponent(component);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  {!component.deprecated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeprecateComponent(component.id, 'Manual deprecation')}
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredComponents.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No components found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'No components match your current filters'}
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setShowDeprecated(false);
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Edit Component Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Component</DialogTitle>
              <DialogDescription>
                Modify the component properties
              </DialogDescription>
            </DialogHeader>
            {selectedComponent && (
              <ComponentForm
                initialData={selectedComponent}
                onSubmit={(data) => handleUpdateComponent(selectedComponent.id, data)}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedComponent(null);
                }}
                submitLabel="Update Component"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ComponentManager;
