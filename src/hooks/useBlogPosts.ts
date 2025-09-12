import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, getUserTierPermissions } from '@/types/user-tiers';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: 'draft' | 'published' | 'scheduled';
  publish_date?: string;
  author_id: string;
  featured_image_url?: string;
  tags: string[];
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  // Join fields
  author_email?: string;
  categories?: BlogCategory[];
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
}

export interface CreateBlogPostData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  status?: 'draft' | 'published' | 'scheduled';
  publish_date?: string;
  featured_image_url?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string;
}

export const useBlogPosts = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Fetch all blog posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      // If not DEV+ tier, only show published posts
      if (!permissions.canAccessGitUI) {
        query = query.eq('status', 'published');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const postsWithAuthor = (data || []).map(post => ({
        ...post,
        author_email: user?.email || 'Unknown', // Use current user email for now
        tags: post.tags || []
      }));

      setPosts(postsWithAuthor);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Create new blog post
  const createPost = async (postData: CreateBlogPostData): Promise<BlogPost | null> => {
    if (!user?.id || !permissions.canAccessGitUI) {
      throw new Error('Insufficient permissions to create blog posts');
    }

    try {
      const slug = postData.slug || generateSlug(postData.title);
      
      const { data, error: createError } = await supabase
        .from('blog_posts')
        .insert([{
          ...postData,
          slug,
          author_id: user.id,
          publish_date: postData.status === 'published' 
            ? postData.publish_date || new Date().toISOString()
            : postData.publish_date
        }])
        .select('*')
        .single();

      if (createError) {
        throw createError;
      }

      const newPost = {
        ...data,
        author_email: user.email || 'Unknown',
        tags: data.tags || []
      };

      setPosts(prev => [newPost, ...prev]);
      return newPost;
    } catch (err) {
      console.error('Error creating blog post:', err);
      throw err;
    }
  };

  // Update blog post
  const updatePost = async (postData: UpdateBlogPostData): Promise<BlogPost | null> => {
    if (!user?.id || !permissions.canAccessGitUI) {
      throw new Error('Insufficient permissions to update blog posts');
    }

    try {
      const updateData = { ...postData };
      delete updateData.id;

      // Generate new slug if title changed
      if (updateData.title) {
        updateData.slug = updateData.slug || generateSlug(updateData.title);
      }

      // Set publish_date if publishing
      if (updateData.status === 'published' && !updateData.publish_date) {
        updateData.publish_date = new Date().toISOString();
      }

      const { data, error: updateError } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', postData.id)
        .select('*');

      if (updateError) {
        throw updateError;
      }

      const updatedPost = {
        ...(Array.isArray(data) ? data[0] : data),
        author_email: user.email || 'Unknown',
        tags: (Array.isArray(data) ? data[0]?.tags : data?.tags) || []
      };

      setPosts(prev => 
        prev.map(post => post.id === postData.id ? updatedPost : post)
      );

      return updatedPost;
    } catch (err) {
      console.error('Error updating blog post:', err);
      throw err;
    }
  };

  // Delete blog post
  const deletePost = async (postId: string): Promise<void> => {
    if (!user?.id || !permissions.canAccessGitUI) {
      throw new Error('Insufficient permissions to delete blog posts');
    }

    try {
      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (deleteError) {
        throw deleteError;
      }

      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting blog post:', err);
      throw err;
    }
  };

  // Get single post by ID
  const getPost = async (postId: string): Promise<BlogPost | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return {
        ...data,
        author_email: 'Unknown',
        tags: data.tags || []
      };
    } catch (err) {
      console.error('Error fetching blog post:', err);
      return null;
    }
  };

  // Get post by slug (for public viewing)
  const getPostBySlug = async (slug: string): Promise<BlogPost | null> => {
    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug);

      // If not DEV+ tier, only show published posts
      if (!permissions.canAccessGitUI) {
        query = query.eq('status', 'published');
      }

      const { data, error: fetchError } = await query.single();

      if (fetchError) {
        throw fetchError;
      }

      return {
        ...data,
        author_email: 'Unknown',
        tags: data.tags || []
      };
    } catch (err) {
      console.error('Error fetching blog post by slug:', err);
      return null;
    }
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchCategories();
    }
  }, [user, permissions.canAccessGitUI]);

  return {
    posts,
    categories,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    getPost,
    getPostBySlug,
    refetch: fetchPosts,
    generateSlug
  };
};
