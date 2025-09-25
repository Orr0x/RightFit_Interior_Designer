// Supabase image URL utilities for handling WebP images and other assets

export interface SupabaseImageUrlOptions {
  bucket?: string;
  folder?: string;
  quality?: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  resize?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface SupabaseImageTransform {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  resize?: string;
}

/**
 * Generate a Supabase storage URL for an image with optional transformations
 */
export const getSupabaseImageUrl = (
  imagePath: string,
  options: SupabaseImageUrlOptions = {}
): string => {
  const {
    bucket = 'images',
    folder,
    quality = 80,
    width,
    height,
    format = 'auto',
    resize = 'cover'
  } = options;

  // Construct the base URL
  let url = `https://your-supabase-url.supabase.co/storage/v1/object/public/${bucket}`;

  // Add folder path if specified
  if (folder) {
    url += `/${folder}`;
  }

  // Add the image path
  url += `/${imagePath}`;

  // Build transformation parameters
  const transforms: string[] = [];

  if (width) transforms.push(`width=${width}`);
  if (height) transforms.push(`height=${height}`);
  if (quality !== 80) transforms.push(`quality=${quality}`);
  if (format !== 'auto') transforms.push(`format=${format}`);
  if (resize !== 'cover') transforms.push(`resize=${resize}`);

  // Add transformations to URL if any exist
  if (transforms.length > 0) {
    url += `?${transforms.join('&')}`;
  }

  return url;
};

/**
 * Generate a thumbnail URL for an image
 */
export const getThumbnailUrl = (
  imagePath: string,
  options: Omit<SupabaseImageUrlOptions, 'width' | 'height'> & {
    thumbnailWidth?: number;
    thumbnailHeight?: number;
  } = {}
): string => {
  const {
    thumbnailWidth = 300,
    thumbnailHeight = 300,
    ...otherOptions
  } = options;

  return getSupabaseImageUrl(imagePath, {
    ...otherOptions,
    width: thumbnailWidth,
    height: thumbnailHeight,
    quality: 75
  });
};

/**
 * Generate a full-size image URL with optimal quality
 */
export const getFullSizeUrl = (
  imagePath: string,
  options: SupabaseImageUrlOptions = {}
): string => {
  return getSupabaseImageUrl(imagePath, {
    ...options,
    quality: 90,
    format: 'auto'
  });
};

/**
 * Generate a download URL for an image
 */
export const getDownloadUrl = (imagePath: string): string => {
  return `https://your-supabase-url.supabase.co/storage/v1/object/public/images/${imagePath}?download=true`;
};

/**
 * Generate multiple image URLs for responsive images
 */
export const getResponsiveImageUrls = (
  imagePath: string,
  breakpoints: number[] = [400, 800, 1200, 1600]
): { url: string; width: number }[] => {
  return breakpoints.map(width => ({
    url: getSupabaseImageUrl(imagePath, {
      width,
      height: Math.round(width * 0.75), // Maintain aspect ratio
      quality: 85
    }),
    width
  }));
};

/**
 * Get image metadata from Supabase (would need actual Supabase client)
 */
export const getImageMetadata = async (imagePath: string): Promise<{
  width: number;
  height: number;
  size: number;
  format: string;
} | null> => {
  try {
    // This would typically use the Supabase client to get file metadata
    // For now, return null as a placeholder
    console.log('Getting metadata for:', imagePath);
    return null;
  } catch (error) {
    console.error('Error getting image metadata:', error);
    return null;
  }
};

/**
 * Upload an image to Supabase storage
 */
export const uploadImageToSupabase = async (
  file: File,
  path: string,
  options: SupabaseImageUrlOptions = {}
): Promise<string | null> => {
  try {
    // This would typically use the Supabase client to upload the file
    console.log('Uploading image:', file.name, 'to path:', path);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return the path as if upload was successful
    return path;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

/**
 * Delete an image from Supabase storage
 */
export const deleteImageFromSupabase = async (imagePath: string): Promise<boolean> => {
  try {
    // This would typically use the Supabase client to delete the file
    console.log('Deleting image:', imagePath);

    // Simulate delete operation
    await new Promise(resolve => setTimeout(resolve, 500));

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Check if an image exists in Supabase storage
 */
export const imageExistsInSupabase = async (imagePath: string): Promise<boolean> => {
  try {
    // This would typically check if the file exists
    console.log('Checking if image exists:', imagePath);

    // For now, assume it exists if path is provided
    return !!imagePath;
  } catch (error) {
    console.error('Error checking image existence:', error);
    return false;
  }
};

// Default image fallback URL
export const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/800x600?text=No+Image+Available';

// WebP detection and fallback
export const supportsWebP = (): Promise<boolean> => {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};
