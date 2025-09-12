import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, getUserTierPermissions } from '@/types/user-tiers';
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
  Globe,
  Image,
  Settings
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published' | 'scheduled';
  publishDate: string;
  author: string;
  tags: string[];
  featuredImage?: string;
}

const BlogManager: React.FC = () => {
  const { user } = useAuth();
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);

  // Mock data - in real implementation, this would come from your CMS API
  const [blogPosts] = useState<BlogPost[]>([
    {
      id: '1',
      title: 'Transform Your Kitchen: 2024 Design Trends',
      slug: 'transform-kitchen-2024-trends',
      excerpt: 'Discover the latest kitchen design trends that will make your space both beautiful and functional.',
      content: '# Transform Your Kitchen: 2024 Design Trends\n\nKitchen design is evolving rapidly...',
      status: 'published',
      publishDate: '2024-01-15',
      author: 'RightFit Team',
      tags: ['Kitchen', 'Design', 'Trends', '2024']
    },
    {
      id: '2',
      title: 'The Ultimate Guide to Bathroom Renovations',
      slug: 'ultimate-bathroom-renovation-guide',
      excerpt: 'Everything you need to know about planning and executing a successful bathroom renovation.',
      content: '# The Ultimate Guide to Bathroom Renovations\n\nPlanning a bathroom renovation...',
      status: 'draft',
      publishDate: '2024-02-01',
      author: 'RightFit Team',
      tags: ['Bathroom', 'Renovation', 'Guide']
    }
  ]);

  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Manager</h1>
              <p className="text-gray-600">Create and manage blog content for your website</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800">
            {filteredPosts.length} posts
          </Badge>
        </div>

        <Tabs defaultValue="posts" className="space-y-6">
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
                  <Button onClick={() => setIsEditing(true)}>
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

                {/* Posts List */}
                <div className="space-y-4">
                  {filteredPosts.map(post => (
                    <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg">{post.title}</h3>
                            <Badge className={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{post.excerpt}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{post.publishDate}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Tag className="h-3 w-3" />
                              <span>{post.tags.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedPost(post)}>
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                        value={selectedPost?.title || newPost.title || ''}
                        onChange={(e) => selectedPost ? 
                          setSelectedPost({...selectedPost, title: e.target.value}) :
                          setNewPost({...newPost, title: e.target.value})
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        placeholder="Brief description of the post..."
                        rows={3}
                        value={selectedPost?.excerpt || newPost.excerpt || ''}
                        onChange={(e) => selectedPost ? 
                          setSelectedPost({...selectedPost, excerpt: e.target.value}) :
                          setNewPost({...newPost, excerpt: e.target.value})
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Content (Markdown)</Label>
                      <Textarea
                        id="content"
                        placeholder="Write your blog post content in Markdown..."
                        rows={15}
                        className="font-mono"
                        value={selectedPost?.content || newPost.content || ''}
                        onChange={(e) => selectedPost ? 
                          setSelectedPost({...selectedPost, content: e.target.value}) :
                          setNewPost({...newPost, content: e.target.value})
                        }
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
                            value={selectedPost?.status || newPost.status || 'draft'}
                            onValueChange={(value) => selectedPost ? 
                              setSelectedPost({...selectedPost, status: value as any}) :
                              setNewPost({...newPost, status: value as any})
                            }
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
                            value={selectedPost?.publishDate || newPost.publishDate || ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tags">Tags</Label>
                          <Input
                            id="tags"
                            placeholder="kitchen, design, trends"
                            value={selectedPost?.tags?.join(', ') || ''}
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
                      <Button className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline">
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
