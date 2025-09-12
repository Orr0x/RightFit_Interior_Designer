import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, getUserTierPermissions } from '@/types/user-tiers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Image, 
  Video, 
  File,
  Trash2,
  Download,
  Eye,
  Copy,
  CheckCircle,
  Crown,
  FolderOpen,
  Plus,
  Search
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: string;
  url: string;
  uploadDate: string;
  category: string;
}

const MediaManager: React.FC = () => {
  const { user } = useAuth();
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);

  // Mock data - in real implementation, this would come from your storage API
  const [mediaFiles] = useState<MediaFile[]>([
    {
      id: '1',
      name: 'kitchen-renovation-before.jpg',
      type: 'image',
      size: '2.4 MB',
      url: '/api/media/kitchen-renovation-before.jpg',
      uploadDate: '2024-01-15',
      category: 'Gallery'
    },
    {
      id: '2',
      name: 'rightfit-logo.png',
      type: 'image',
      size: '128 KB',
      url: '/api/media/rightfit-logo.png',
      uploadDate: '2024-01-10',
      category: 'Assets'
    },
    {
      id: '3',
      name: 'installation-process.mp4',
      type: 'video',
      size: '15.2 MB',
      url: '/api/media/installation-process.mp4',
      uploadDate: '2024-01-20',
      category: 'Gallery'
    }
  ]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsUploading(false);
    setUploadProgress(0);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5 text-blue-500" />;
      case 'video': return <Video className="h-5 w-5 text-purple-500" />;
      default: return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesCategory = selectedCategory === 'all' || file.category.toLowerCase() === selectedCategory;
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!permissions.canAccessGitUI) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <CardTitle>Media Manager</CardTitle>
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Upload className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Media Manager</h1>
              <p className="text-gray-600">Upload and manage your app's media assets</p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            {filteredFiles.length} files
          </Badge>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Upload Media</span>
            </CardTitle>
            <CardDescription>
              Upload images, videos, and documents for your app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isUploading ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop files here or click to upload</p>
                  <p className="text-sm text-gray-500">
                    Supports: JPG, PNG, GIF, MP4, MOV, PDF, DOC
                  </p>
                </div>
                <Input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="mt-4 cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-blue-500" />
                  <span>Uploading files...</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setSelectedCategory('all')}>All Files</TabsTrigger>
              <TabsTrigger value="gallery" onClick={() => setSelectedCategory('gallery')}>Gallery</TabsTrigger>
              <TabsTrigger value="assets" onClick={() => setSelectedCategory('assets')}>App Assets</TabsTrigger>
              <TabsTrigger value="blog" onClick={() => setSelectedCategory('blog')}>Blog Media</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Media Library</CardTitle>
                <CardDescription>
                  All uploaded media files and assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredFiles.map(file => (
                    <div key={file.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {file.category}
                        </Badge>
                        <span className="text-xs text-gray-500">{file.uploadDate}</span>
                      </div>

                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredFiles.length === 0 && (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No files found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Storage Info */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
            <CardDescription>
              Monitor your media storage usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Used: 125.8 MB</span>
                <span>Available: 4.87 GB</span>
              </div>
              <Progress value={2.5} className="w-full" />
              <p className="text-xs text-gray-500">
                2.5% of 5 GB storage used
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MediaManager;
