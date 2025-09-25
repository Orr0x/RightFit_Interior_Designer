import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Download,
  Eye,
  FileImage,
  HardDrive,
  Calendar,
  Tag
} from 'lucide-react';

export interface WebpImage {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  fileSize: number;
  format: string;
  aspectRatio: string;
  category: string;
  orientation: 'portrait' | 'landscape';
  sizeRange: string;
  product?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

interface WebpCardProps {
  image: WebpImage;
  onView?: (image: WebpImage) => void;
  onDownload?: (image: WebpImage) => void;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

export const WebpCard: React.FC<WebpCardProps> = ({
  image,
  onView,
  onDownload,
  className = ''
}) => {
  const handleView = () => {
    onView?.(image);
  };

  const handleDownload = () => {
    onDownload?.(image);
  };

  return (
    <Card className={`group overflow-hidden transition-all duration-200 hover:shadow-lg ${className}`}>
      <div className="relative">
        {/* Image Container */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {image.thumbnailUrl ? (
            <img
              src={image.thumbnailUrl}
              alt={image.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileImage className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Overlay with image info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-center justify-between text-white text-xs">
                <span className="flex items-center">
                  <HardDrive className="w-3 h-3 mr-1" />
                  {formatFileSize(image.fileSize)}
                </span>
                <span>{image.format.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Category Badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs">
              {image.category}
            </Badge>
          </div>

          {/* Orientation Badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={image.orientation === 'portrait' ? 'default' : 'outline'}
              className="text-xs"
            >
              {image.orientation}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Image Name */}
          <h3 className="font-semibold text-sm mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {image.name}
          </h3>

          {/* Image Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
            <div className="flex items-center">
              <span className="font-medium">{image.width} × {image.height}</span>
            </div>
            <div className="flex items-center justify-end">
              <span>{image.aspectRatio}</span>
            </div>
          </div>

          {/* Product Info */}
          {image.product && (
            <div className="mb-3">
              <div className="flex items-center text-xs text-gray-500">
                <Tag className="w-3 h-3 mr-1" />
                <span className="truncate">{image.product}</span>
              </div>
            </div>
          )}

          {/* Date */}
          {image.createdAt && (
            <div className="mb-3">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{formatDate(image.createdAt)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              className="flex-1 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
