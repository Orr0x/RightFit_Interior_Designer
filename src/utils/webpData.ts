import { WebpImage } from '../components/ui/WebpCard';

export interface WebpGalleryData {
  images: WebpImage[];
  categories: string[];
  aspectRatios: string[];
  sizeRanges: string[];
  orientations: string[];
  totalImages: number;
  metadata: {
    totalSizeBytes: number;
    uniqueProducts: number;
    imageFormats: string[];
  };
}

export interface FilterOptions {
  search?: string;
  category?: string;
  aspectRatio?: string;
  sizeRange?: string;
  orientation?: string;
}

// Sample WebP data for demonstration
const sampleWebpData: WebpGalleryData = {
  images: [
    {
      id: '1',
      name: 'kitchen-cabinet-001.webp',
      url: 'https://example.com/images/kitchen-cabinet-001.webp',
      thumbnailUrl: 'https://example.com/thumbs/kitchen-cabinet-001.webp',
      width: 1920,
      height: 1080,
      fileSize: 245760,
      format: 'webp',
      aspectRatio: '16:9',
      category: 'Kitchen',
      orientation: 'landscape',
      sizeRange: 'Large',
      product: 'Premium Kitchen Cabinet',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'bedroom-wardrobe-001.webp',
      url: 'https://example.com/images/bedroom-wardrobe-001.webp',
      thumbnailUrl: 'https://example.com/thumbs/bedroom-wardrobe-001.webp',
      width: 800,
      height: 1200,
      fileSize: 153600,
      format: 'webp',
      aspectRatio: '2:3',
      category: 'Bedroom',
      orientation: 'portrait',
      sizeRange: 'Medium',
      product: 'Modern Wardrobe',
      createdAt: '2024-01-16T14:20:00Z'
    },
    {
      id: '3',
      name: 'bathroom-vanity-001.webp',
      url: 'https://example.com/images/bathroom-vanity-001.webp',
      thumbnailUrl: 'https://example.com/thumbs/bathroom-vanity-001.webp',
      width: 1600,
      height: 900,
      fileSize: 204800,
      format: 'webp',
      aspectRatio: '16:9',
      category: 'Bathroom',
      orientation: 'landscape',
      sizeRange: 'Medium',
      product: 'Luxury Vanity Unit',
      createdAt: '2024-01-17T09:15:00Z'
    }
  ],
  categories: ['Kitchen', 'Bedroom', 'Bathroom', 'Living Room', 'Office'],
  aspectRatios: ['16:9', '4:3', '1:1', '2:3', '3:2'],
  sizeRanges: ['Small', 'Medium', 'Large', 'Extra Large'],
  orientations: ['landscape', 'portrait'],
  totalImages: 3,
  metadata: {
    totalSizeBytes: 604160,
    uniqueProducts: 3,
    imageFormats: ['webp']
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const parseWebpData = async (): Promise<WebpGalleryData | null> => {
  try {
    // Simulate API call or data loading
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real implementation, you would fetch from an API or load from a file
    // For now, return the sample data
    return sampleWebpData;
  } catch (error) {
    console.error('Error parsing WebP data:', error);
    throw new Error('Failed to load WebP gallery data');
  }
};

export const filterWebpImages = (
  images: WebpImage[],
  filters: FilterOptions
): WebpImage[] => {
  return images.filter(image => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        image.name.toLowerCase().includes(searchLower) ||
        image.category.toLowerCase().includes(searchLower) ||
        (image.product && image.product.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.category && image.category !== filters.category) {
      return false;
    }

    // Aspect ratio filter
    if (filters.aspectRatio && image.aspectRatio !== filters.aspectRatio) {
      return false;
    }

    // Size range filter
    if (filters.sizeRange && image.sizeRange !== filters.sizeRange) {
      return false;
    }

    // Orientation filter
    if (filters.orientation && image.orientation !== filters.orientation) {
      return false;
    }

    return true;
  });
};

export const sortWebpImages = (
  images: WebpImage[],
  sortBy: string
): WebpImage[] => {
  const sortedImages = [...images];

  switch (sortBy) {
    case 'name':
      return sortedImages.sort((a, b) => a.name.localeCompare(b.name));
    case 'size':
      return sortedImages.sort((a, b) => b.fileSize - a.fileSize);
    case 'date':
      return sortedImages.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    case 'product':
      return sortedImages.sort((a, b) => {
        const productA = a.product || '';
        const productB = b.product || '';
        return productA.localeCompare(productB);
      });
    case 'category':
      return sortedImages.sort((a, b) => a.category.localeCompare(b.category));
    default:
      return sortedImages;
  }
};

export const getUniqueCategories = (images: WebpImage[]): string[] => {
  return Array.from(new Set(images.map(img => img.category))).sort();
};

export const getUniqueAspectRatios = (images: WebpImage[]): string[] => {
  return Array.from(new Set(images.map(img => img.aspectRatio))).sort();
};

export const getUniqueSizeRanges = (images: WebpImage[]): string[] => {
  return Array.from(new Set(images.map(img => img.sizeRange))).sort();
};

export const getUniqueOrientations = (images: WebpImage[]): string[] => {
  return Array.from(new Set(images.map(img => img.orientation))).sort();
};
