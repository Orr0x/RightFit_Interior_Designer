import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, getUserTierPermissions } from '@/types/user-tiers';
import { useMediaFiles, MediaFile } from '@/hooks/useMediaFiles';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Search,
  Loader2,
  Move,
  FolderTree
} from 'lucide-react';

const MediaManager: React.FC = () => {
  const { user } = useAuth();
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);
  const { toast } = useToast();

  // Real API integration
  const { 
    files: mediaFiles, 
    loading, 
    error, 
    uploadProgress,
    uploadFiles, 
    deleteFile,
    moveFile,
    updateFile,
    getStorageStats,
    formatFileSize
  } = useMediaFiles();

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'general' | 'gallery' | 'assets' | 'blog'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [storageStats, setStorageStats] = useState<any>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedFileForMove, setSelectedFileForMove] = useState<MediaFile | null>(null);
  const [targetCategory, setTargetCategory] = useState<'general' | 'gallery' | 'blog' | 'assets'>('general');
  const [moveOperation, setMoveOperation] = useState<'move' | 'copy'>('move');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      // Determine category based on current filter
      let category: 'general' | 'gallery' | 'blog' | 'assets' = 'general';
      if (selectedCategory === 'general') category = 'general';
      else if (selectedCategory === 'gallery') category = 'gallery';
      else if (selectedCategory === 'blog') category = 'blog';
      else if (selectedCategory === 'assets') category = 'assets';

      await uploadFiles(files, category);
      
      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`
      });

      // Refresh storage stats
      const stats = await getStorageStats();
      setStorageStats(stats);

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await deleteFile(fileId);
      toast({
        title: "Success",
        description: "File deleted successfully"
      });

      // Refresh storage stats
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const handleMoveFile = (file: MediaFile, operation: 'move' | 'copy') => {
    setSelectedFileForMove(file);
    setMoveOperation(operation);
    setTargetCategory(file.category === 'general' ? 'gallery' : 'general'); // Default to different category
    setMoveDialogOpen(true);
  };

  const executeMoveFile = async () => {
    if (!selectedFileForMove) return;

    try {
      await moveFile(selectedFileForMove.id, targetCategory, moveOperation === 'copy');
      
      toast({
        title: "Success",
        description: `File ${moveOperation === 'copy' ? 'copied' : 'moved'} to ${targetCategory} successfully`
      });

      // Refresh storage stats
      const stats = await getStorageStats();
      setStorageStats(stats);

      // Close dialog
      setMoveDialogOpen(false);
      setSelectedFileForMove(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${moveOperation} file`,
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const filteredFiles = mediaFiles.filter(file => {
    let matchesCategory = false;
    
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'general') {
      // Show files with general category in media bucket
      matchesCategory = file.category === 'general' && file.bucket_id === 'media';
    } else if (selectedCategory === 'gallery') {
      // Show files in gallery bucket OR with gallery category
      matchesCategory = file.bucket_id === 'gallery' || 
                       file.category === 'gallery' ||
                       (file.category && file.category.toLowerCase() === 'gallery');
    } else if (selectedCategory === 'blog') {
      // Show files in blog-media bucket OR with blog category
      matchesCategory = file.bucket_id === 'blog-media' || 
                       file.category === 'blog' ||
                       file.category === 'blog-media' ||
                       (file.category && file.category.toLowerCase() === 'blog');
    } else if (selectedCategory === 'assets') {
      // Show files in media bucket with assets category only (exclude general)
      matchesCategory = (file.bucket_id === 'media' && file.category === 'assets') ||
                       file.category === 'assets' ||
                       (file.category && file.category.toLowerCase() === 'assets');
    } else {
      // Fallback for other categories
      matchesCategory = file.category && file.category.toLowerCase() === selectedCategory.toLowerCase();
    }
    
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Load storage stats on component mount
  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getStorageStats();
        setStorageStats(stats);
      } catch (error) {
        console.error('Error loading storage stats:', error);
        // Set default stats to prevent crashes
        setStorageStats({
          totalSize: 0,
          totalSizeFormatted: '0 Bytes',
          byBucket: {},
          byCategory: {},
          fileCount: 0
        });
      }
    };
    loadStats();
  }, [mediaFiles]);

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
            {loading ? 'Loading...' : `${filteredFiles.length} files`}
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
            {Object.keys(uploadProgress).length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop files here or click to upload</p>
                  <p className="text-sm text-gray-500">
                    Supports: JPG, PNG, GIF, WebP, MP4, MOV, PDF, DOC (50MB max)
                  </p>
                  <p className="text-xs text-gray-400">
                    Files will be uploaded to: {selectedCategory === 'all' ? 'General' : selectedCategory}
                  </p>
                </div>
                <Input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
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
                {Object.entries(uploadProgress).map(([fileId, progress]) => (
                  <div key={fileId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{progress.file.name}</span>
                      <div className="flex items-center space-x-2">
                        {progress.status === 'uploading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        {progress.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {progress.status === 'error' && (
                          <div className="text-red-500 text-xs">{progress.error}</div>
                        )}
                      </div>
                    </div>
                    <Progress value={progress.progress} className="w-full" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Files</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="assets">App Assets</TabsTrigger>
              <TabsTrigger value="blog">Blog Media</TabsTrigger>
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

          <TabsContent value={selectedCategory} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Media Library</CardTitle>
                <CardDescription>
                  All uploaded media files and assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    <span className="ml-2 text-gray-500">Loading media files...</span>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-600">Error loading files: {error}</p>
                  </div>
                )}

                {/* Files Grid */}
                {!loading && !error && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredFiles.map(file => (
                        <div key={file.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          {/* File Preview */}
                          <div className="mb-3">
                            {file.mime_type.startsWith('image/') ? (
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img 
                                  src={file.url} 
                                  alt={file.alt_text || file.file_name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                {getFileIcon(file.mime_type)}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-3 mb-3">
                            {getFileIcon(file.mime_type)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate" title={file.file_name}>
                                {file.file_name}
                              </p>
                              <p className="text-xs text-gray-500">{file.size_formatted}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="text-xs">
                              {file.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(file.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 min-w-0"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(file.url || '');
                                toast({ title: "Copied!", description: "File URL copied to clipboard" });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = file.url || '';
                                a.download = file.file_name;
                                a.click();
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex space-x-1 mt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleMoveFile(file, 'move')}
                            >
                              <Move className="h-3 w-3 mr-1" />
                              Move
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleMoveFile(file, 'copy')}
                            >
                              <FolderTree className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteFile(file.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredFiles.length === 0 && !loading && (
                      <div className="text-center py-8">
                        <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">
                          {searchTerm ? 'No files match your search' : 'No files found'}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Upload some files to get started!
                        </p>
                      </div>
                    )}
                  </>
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
            {storageStats ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Used: {storageStats.totalSizeFormatted}</span>
                  <span>Files: {storageStats.fileCount}</span>
                </div>
                
                {/* Storage by bucket */}
                {storageStats.byCategory && Object.keys(storageStats.byCategory).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">By Category:</p>
                    {Object.entries(storageStats.byCategory).map(([category, size]) => (
                      <div key={category} className="flex justify-between text-xs">
                        <span className="capitalize">{category}:</span>
                        <span>{formatFileSize(size as number)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Simple progress bar - you can enhance this with actual limits */}
                <div className="space-y-1">
                  <Progress value={Math.min((storageStats.totalSize / (1024 * 1024 * 1024)) * 20, 100)} className="w-full" />
                  <p className="text-xs text-gray-500">
                    Storage usage (no limits set)
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="ml-2 text-sm text-gray-500">Loading storage stats...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Move/Copy Dialog */}
        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {moveOperation === 'move' ? 'Move' : 'Copy'} File
              </DialogTitle>
              <DialogDescription>
                {moveOperation === 'move' 
                  ? 'Move this file to a different category. This will change its storage location.' 
                  : 'Copy this file to a different category. The original file will remain in its current location.'
                }
              </DialogDescription>
            </DialogHeader>
            
            {selectedFileForMove && (
              <div className="space-y-4">
                {/* File Preview */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {selectedFileForMove.mime_type.startsWith('image/') ? (
                    <img 
                      src={selectedFileForMove.url} 
                      alt={selectedFileForMove.file_name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      {getFileIcon(selectedFileForMove.mime_type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedFileForMove.file_name}</p>
                    <p className="text-xs text-gray-500">
                      Current: {selectedFileForMove.category} • {selectedFileForMove.size_formatted}
                    </p>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="target-category">
                    {moveOperation === 'move' ? 'Move to' : 'Copy to'} Category:
                  </Label>
                  <Select value={targetCategory} onValueChange={(value: any) => setTargetCategory(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="gallery">Gallery</SelectItem>
                      <SelectItem value="blog">Blog Media</SelectItem>
                      <SelectItem value="assets">App Assets</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {targetCategory === 'gallery' && 'Files will be stored in the gallery bucket for project showcases'}
                    {targetCategory === 'blog' && 'Files will be stored in the blog-media bucket for blog posts'}
                    {targetCategory === 'assets' && 'Files will be stored in the media bucket as app assets'}
                    {targetCategory === 'general' && 'Files will be stored in the general media bucket'}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={executeMoveFile}>
                {moveOperation === 'move' ? (
                  <>
                    <Move className="h-4 w-4 mr-2" />
                    Move File
                  </>
                ) : (
                  <>
                    <FolderTree className="h-4 w-4 mr-2" />
                    Copy File
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MediaManager;
