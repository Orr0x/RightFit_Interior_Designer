import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, getUserTierPermissions } from '@/types/user-tiers';
import { useBlogPosts, BlogPost, CreateBlogPostData } from '@/hooks/useBlogPosts';
import { useToast } from '@/hooks/use-toast';
import DevToolsHeader from '@/components/DevToolsHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Edit3, 
  Save,
  Eye,
  Trash2,
  Plus,
  Search,
  Crown,
  Calendar,
  Tag,
  Image,
  Settings,
  Loader2
} from 'lucide-react';

const BlogManager: React.FC = () => {
  const { user } = useAuth();
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);
  const { toast } = useToast();

  // Real API integration
  const { 
    posts: blogPosts, 
    loading, 
    error, 
    createPost, 
    updatePost, 
    deletePost,
    generateSlug 
  } = useBlogPosts();

  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const [newPost, setNewPost] = useState<CreateBlogPostData>({
    title: '',
    excerpt: '',
    content: '',
    status: 'draft',
    tags: []
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handle save post (create or update)
  const handleSavePost = async () => {
    if (!newPost.title.trim()) {
      toast({
        title: "Error",
        description: "Post title is required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      if (selectedPost) {
        // Update existing post
        await updatePost({
          id: selectedPost.id,
          ...newPost,
          slug: newPost.slug || generateSlug(newPost.title)
        });
        toast({
          title: "Success",
          description: "Blog post updated successfully"
        });
      } else {
        // Create new post
        await createPost({
          ...newPost,
          slug: newPost.slug || generateSlug(newPost.title)
        });
        toast({
          title: "Success", 
          description: "Blog post created successfully"
        });
      }
      
      // Reset form
      setNewPost({
        title: '',
        excerpt: '',
        content: '',
        status: 'draft',
        tags: []
      });
      setSelectedPost(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save post",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await deletePost(postId);
      toast({
        title: "Success",
        description: "Blog post deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  // Handle edit post
  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    setNewPost({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      status: post.status,
      publish_date: post.publish_date,
      featured_image_url: post.featured_image_url,
      tags: post.tags,
      meta_title: post.meta_title,
      meta_description: post.meta_description
    });
    setActiveTab('editor');
  };

  if (!permissions.canAccessGitUI) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <CardTitle>Blog Manager</CardTitle>
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
        title="Blog Manager"
        description="Create and manage blog content for your website"
        icon={<FileText className="h-5 w-5 text-green-600" />}
      />
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="posts">All Posts</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Posts List */}
          <TabsContent value="posts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Blog Posts</CardTitle>
                    <CardDescription>
                      Manage your blog content and publications
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setSelectedPost(null);
                    setNewPost({
                      title: '',
                      excerpt: '',
                      content: '',
                      status: 'draft',
                      tags: []
                    });
                    setActiveTab('editor');
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search posts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    <span className="ml-2 text-gray-500">Loading blog posts...</span>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-600">Error loading posts: {error}</p>
                  </div>
                )}

                {/* Posts List */}
                {!loading && !error && (
                  <div className="space-y-4">
                    {filteredPosts.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">No blog posts found</p>
                        <Button className="mt-4" onClick={() => {
                          setSelectedPost(null);
                          setNewPost({
                            title: '',
                            excerpt: '',
                            content: '',
                            status: 'draft',
                            tags: []
                          });
                          setActiveTab('editor');
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Post
                        </Button>
                      </div>
                    ) : (
                      filteredPosts.map(post => (
                        <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-lg">{post.title}</h3>
                                <Badge className={getStatusColor(post.status)}>
                                  {post.status}
                                </Badge>
                              </div>
                              <p className="text-gray-600 text-sm mb-3">{post.excerpt || 'No excerpt available'}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Tag className="h-3 w-3" />
                                  <span>{post.tags.length > 0 ? post.tags.join(', ') : 'No tags'}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span>By {post.author_email || 'Unknown'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                Preview
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditPost(post)}>
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Editor */}
          <TabsContent value="editor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Blog Post Editor</CardTitle>
                <CardDescription>
                  Create or edit blog posts with rich content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Editor */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter post title..."
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        placeholder="Brief description of the post..."
                        rows={3}
                        value={newPost.excerpt || ''}
                        onChange={(e) => setNewPost({...newPost, excerpt: e.target.value})}
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Content (Markdown)</Label>
                      <Textarea
                        id="content"
                        placeholder="Write your blog post content in Markdown..."
                        rows={15}
                        className="font-mono"
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Publish Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select 
                            value={newPost.status || 'draft'}
                            onValueChange={(value) => setNewPost({...newPost, status: value as any})}
                            disabled={saving}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="publishDate">Publish Date</Label>
                          <Input
                            id="publishDate"
                            type="date"
                            value={newPost.publish_date ? new Date(newPost.publish_date).toISOString().split('T')[0] : ''}
                            onChange={(e) => setNewPost({...newPost, publish_date: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                            disabled={saving}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tags">Tags</Label>
                          <Input
                            id="tags"
                            placeholder="kitchen, design, trends"
                            value={newPost.tags?.join(', ') || ''}
                            onChange={(e) => setNewPost({...newPost, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)})}
                            disabled={saving}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Featured Image</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Upload featured image</p>
                          <Button size="sm" variant="outline" className="mt-2">
                            Choose Image
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1" 
                        onClick={handleSavePost}
                        disabled={saving || !newPost.title.trim()}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {selectedPost ? 'Update' : 'Save'}
                          </>
                        )}
                      </Button>
                      <Button variant="outline" disabled={saving}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Blog Settings</CardTitle>
                <CardDescription>
                  Configure your blog settings and SEO options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="blogTitle">Blog Title</Label>
                      <Input id="blogTitle" defaultValue="RightFit Blog" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="blogDescription">Blog Description</Label>
                      <Textarea id="blogDescription" defaultValue="Home improvement tips and design inspiration" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="postsPerPage">Posts Per Page</Label>
                      <Input id="postsPerPage" type="number" defaultValue="10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultAuthor">Default Author</Label>
                      <Input id="defaultAuthor" defaultValue="RightFit Team" />
                    </div>
                  </div>
                </div>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BlogManager;
