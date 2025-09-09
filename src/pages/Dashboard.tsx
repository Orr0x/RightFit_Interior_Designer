
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Folder, Calendar, Eye, Edit3, Trash2, LogOut, ArrowLeft, Save, X, Home, Bed, Bath, Tv, Grid2X2, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import rightfitLogo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';

interface Design {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  thumbnail: string;
  roomType: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeRoomFilter, setActiveRoomFilter] = useState<string>('all');

  const roomTypes = [
    { key: 'all', name: 'All Designs', icon: Filter },
    { key: 'kitchen', name: 'Kitchen', icon: Home },
    { key: 'bedroom', name: 'Bedroom', icon: Bed },
    { key: 'bathroom', name: 'Bathroom', icon: Bath },
    { key: 'media-wall', name: 'Media Wall', icon: Tv },
    { key: 'flooring', name: 'Flooring', icon: Grid2X2 }
  ];

  const filteredDesigns = activeRoomFilter === 'all' 
    ? designs 
    : designs.filter(design => design.roomType === activeRoomFilter);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate('/app');
      return;
    }

    // Load designs from Supabase database
    const loadDesigns = async () => {
      const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error loading designs:', error);
        toast.error('Failed to load designs');
        return;
      }
      
      // Map database fields to component interface
      const mappedDesigns = data.map((design) => ({
        id: design.id,
        name: design.name,
        description: design.description || '',
        createdAt: design.created_at.split('T')[0],
        updatedAt: design.updated_at.split('T')[0],
        thumbnail: design.thumbnail_url || '/placeholder.svg',
        roomType: design.room_type || 'kitchen' // Support both new column and legacy data
      }));
      
      setDesigns(mappedDesigns);
    };
    
    loadDesigns();
  }, [user, isLoading, navigate]);

  // Get room type display info
  const getRoomTypeInfo = (roomType: string) => {
    const roomTypeMap: { [key: string]: { name: string; color: string; icon: any } } = {
      kitchen: { name: 'Kitchen', color: 'bg-orange-100 text-orange-800', icon: Home },
      bedroom: { name: 'Bedroom', color: 'bg-purple-100 text-purple-800', icon: Bed },
      bathroom: { name: 'Bathroom', color: 'bg-blue-100 text-blue-800', icon: Bath },
      'media-wall': { name: 'Media Wall', color: 'bg-gray-100 text-gray-800', icon: Tv },
      flooring: { name: 'Flooring', color: 'bg-green-100 text-green-800', icon: Grid2X2 }
    };
    return roomTypeMap[roomType] || { name: 'Design', color: 'bg-gray-100 text-gray-800', icon: Folder };
  };

  const handleNewDesign = () => {
    navigate('/designer');
  };

  const handleOpenDesign = (designId: string) => {
    navigate(`/designer/${designId}`);
  };

  const handleDeleteDesign = async (designId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', designId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting design:', error);
      toast.error('Failed to delete design');
      return;
    }
    
    const updatedDesigns = designs.filter(d => d.id !== designId);
    setDesigns(updatedDesigns);
    toast.success('Design deleted successfully');
  };

  const handleEditName = (design: Design) => {
    setEditingId(design.id);
    setEditingName(design.name);
  };

  const handleSaveName = async (designId: string) => {
    if (!editingName.trim()) {
      toast.error('Design name cannot be empty');
      return;
    }
    
    if (!user) return;
    
    const { error } = await supabase
      .from('designs')
      .update({ 
        name: editingName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', designId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error updating design:', error);
      toast.error('Failed to update design name');
      return;
    }
    
    const updatedDesigns = designs.map(d => 
      d.id === designId 
        ? { ...d, name: editingName.trim(), updatedAt: new Date().toISOString().split('T')[0] }
        : d
    );
    
    setDesigns(updatedDesigns);
    setEditingId(null);
    setEditingName('');
    toast.success('Design name updated successfully');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={rightfitLogo} alt="RightFit Interiors logo" className="h-14 w-auto" />
              <h1 className="text-2xl font-bold text-gray-900">RightFit Interior Designer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to RightFit Interiors
              </Link>
              <span className="text-sm text-gray-600">Welcome, {user.profile?.display_name || user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title and Stats */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Design Projects</h2>
          <p className="text-gray-600">Create, edit, and manage your interior design projects across all room types</p>
          <div className="flex gap-4 mt-4">
            {roomTypes.slice(1).map(roomType => {
              const count = designs.filter(d => d.roomType === roomType.key).length;
              if (count === 0) return null;
              return (
                <div key={roomType.key} className="flex items-center gap-2 text-sm text-gray-600">
                  <roomType.icon className="h-4 w-4" />
                  <span>{count} {roomType.name}{count !== 1 ? 's' : ''}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* New Design Button */}
        <div className="mb-8">
          <Button onClick={handleNewDesign} size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-5 w-5 mr-2" />
            Create New Design
          </Button>
        </div>

        {/* Room Type Filter Tabs */}
        <Tabs value={activeRoomFilter} onValueChange={setActiveRoomFilter} className="mb-8">
          <TabsList className="grid grid-cols-6 w-full">
            {roomTypes.map(roomType => {
              const count = roomType.key === 'all' ? designs.length : designs.filter(d => d.roomType === roomType.key).length;
              return (
                <TabsTrigger key={roomType.key} value={roomType.key} className="flex items-center gap-2">
                  <roomType.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{roomType.name}</span>
                  {count > 0 && <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Designs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDesigns.map((design) => {
            const roomInfo = getRoomTypeInfo(design.roomType);
            const RoomIcon = roomInfo.icon;
            
            return (
              <Card key={design.id} className="group hover:shadow-lg transition-shadow duration-200 animate-fade-in">
                <CardHeader className="pb-4">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <RoomIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingId === design.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="text-lg font-semibold"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveName(design.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveName(design.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <CardTitle 
                            className="text-lg mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleEditName(design)}
                          >
                            {design.name}
                          </CardTitle>
                          <CardDescription>{design.description}</CardDescription>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Updated {design.updatedAt}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${roomInfo.color}`}>
                        {roomInfo.name}
                      </Badge>
                      <Badge variant="secondary">2D/3D</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover-scale"
                      onClick={() => handleOpenDesign(design.id)}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDesign(design.id)}
                      className="hover-scale"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDesign(design.id)}
                      className="text-red-600 hover:text-red-700 hover-scale"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDesigns.length === 0 && designs.length > 0 && (
          <div className="text-center py-12">
            <Filter className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No {activeRoomFilter} designs</h3>
            <p className="text-gray-600 mb-6">Try selecting a different room type or create a new design</p>
            <Button onClick={handleNewDesign} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" />
              Create New Design
            </Button>
          </div>
        )}

        {designs.length === 0 && (
          <div className="text-center py-12">
            <Folder className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No designs yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first interior design project</p>
            <Button onClick={handleNewDesign} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Design
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
