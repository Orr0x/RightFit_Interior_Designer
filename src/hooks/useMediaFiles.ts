import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, getUserTierPermissions } from '@/types/user-tiers';

export interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  bucket_id: string;
  category: 'general' | 'gallery' | 'blog' | 'assets';
  alt_text?: string;
  caption?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  url?: string;
  size_formatted?: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

export const useMediaFiles = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});

  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get public URL for file
  const getPublicUrl = (bucket: string, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  // Fetch all media files
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const filesWithUrls = (data || []).map(file => ({
        ...file,
        url: getPublicUrl(file.bucket_id, file.file_path),
        size_formatted: formatFileSize(file.file_size)
      }));

      setFiles(filesWithUrls);
    } catch (err) {
      console.error('Error fetching media files:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch media files');
    } finally {
      setLoading(false);
    }
  };

  // Upload multiple files
  const uploadFiles = async (
    fileList: FileList | File[], 
    category: 'general' | 'gallery' | 'blog' | 'assets' = 'general'
  ): Promise<MediaFile[]> => {
    if (!user?.id || !permissions.canAccessGitUI) {
      throw new Error('Insufficient permissions to upload files');
    }

    const filesArray = Array.from(fileList);
    const uploadedFiles: MediaFile[] = [];
    
    // Initialize progress tracking
    const initialProgress: Record<string, UploadProgress> = {};
    filesArray.forEach(file => {
      const fileId = `${file.name}-${Date.now()}`;
      initialProgress[fileId] = {
        file,
        progress: 0,
        status: 'uploading'
      };
    });
    setUploadProgress(initialProgress);

    try {
      for (const file of filesArray) {
        const fileId = `${file.name}-${Date.now()}`;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `${user.id}/${category}/${fileName}`;
        
        // Determine bucket based on category
        let bucket = 'media';
        if (category === 'gallery') bucket = 'gallery';
        if (category === 'blog') bucket = 'blog-media';

        // Update progress to show upload starting
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { ...prev[fileId], progress: 10 }
        }));

        // Upload file to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { 
              ...prev[fileId], 
              status: 'error', 
              error: uploadError.message 
            }
          }));
          continue;
        }

        // Update progress to show upload completed
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { ...prev[fileId], progress: 80 }
        }));

        // Create database record
        const { data: dbData, error: dbError } = await supabase
          .from('media_files')
          .insert([{
            file_name: file.name,
            file_path: uploadData.path,
            file_size: file.size,
            mime_type: file.type,
            bucket_id: bucket,
            category,
            uploaded_by: user.id
          }])
          .select()
          .single();

        if (dbError) {
          // Clean up uploaded file if database insert fails
          await supabase.storage.from(bucket).remove([uploadData.path]);
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { 
              ...prev[fileId], 
              status: 'error', 
              error: dbError.message 
            }
          }));
          continue;
        }

        const mediaFile = {
          ...dbData,
          url: getPublicUrl(bucket, uploadData.path),
          size_formatted: formatFileSize(file.size)
        };

        uploadedFiles.push(mediaFile);

        // Mark as completed
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { 
            ...prev[fileId], 
            progress: 100, 
            status: 'completed',
            url: mediaFile.url
          }
        }));
      }

      // Update files list
      setFiles(prev => [...uploadedFiles, ...prev]);
      
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress({});
      }, 3000);

      return uploadedFiles;
    } catch (err) {
      console.error('Error uploading files:', err);
      throw err;
    }
  };

  // Delete file
  const deleteFile = async (fileId: string): Promise<void> => {
    if (!user?.id || !permissions.canAccessGitUI) {
      throw new Error('Insufficient permissions to delete files');
    }

    const file = files.find(f => f.id === fileId);
    if (!file) {
      throw new Error('File not found');
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(file.bucket_id)
        .remove([file.file_path]);

      if (storageError) {
        throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw dbError;
      }

      // Update files list
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error('Error deleting file:', err);
      throw err;
    }
  };

  // Update file metadata
  const updateFile = async (
    fileId: string, 
    updates: { alt_text?: string; caption?: string; category?: string }
  ): Promise<MediaFile> => {
    if (!user?.id || !permissions.canAccessGitUI) {
      throw new Error('Insufficient permissions to update files');
    }

    try {
      const { data, error } = await supabase
        .from('media_files')
        .update(updates)
        .eq('id', fileId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedFile = {
        ...data,
        url: getPublicUrl(data.bucket_id, data.file_path),
        size_formatted: formatFileSize(data.file_size)
      };

      // Update files list
      setFiles(prev => 
        prev.map(f => f.id === fileId ? updatedFile : f)
      );

      return updatedFile;
    } catch (err) {
      console.error('Error updating file:', err);
      throw err;
    }
  };

  // Get storage usage statistics
  const getStorageStats = async () => {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('file_size, bucket_id, category');

      if (error) {
        throw error;
      }

      const totalSize = data?.reduce((sum, file) => sum + file.file_size, 0) || 0;
      const byBucket = data?.reduce((acc, file) => {
        acc[file.bucket_id] = (acc[file.bucket_id] || 0) + file.file_size;
        return acc;
      }, {} as Record<string, number>) || {};

      const byCategory = data?.reduce((acc, file) => {
        acc[file.category] = (acc[file.category] || 0) + file.file_size;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalSize,
        totalSizeFormatted: formatFileSize(totalSize),
        byBucket,
        byCategory,
        fileCount: data?.length || 0
      };
    } catch (err) {
      console.error('Error getting storage stats:', err);
      return {
        totalSize: 0,
        totalSizeFormatted: '0 Bytes',
        byBucket: {},
        byCategory: {},
        fileCount: 0
      };
    }
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  return {
    files,
    loading,
    error,
    uploadProgress,
    uploadFiles,
    deleteFile,
    updateFile,
    getStorageStats,
    refetch: fetchFiles,
    formatFileSize
  };
};
