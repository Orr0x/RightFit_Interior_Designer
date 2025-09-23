import React, { useState, useRef, useEffect } from 'react';
import { EggerBoardProduct, getThumbnailUrl } from '../../utils/eggerBoardsData';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { ExternalLink, ImageIcon } from 'lucide-react';

interface BoardCardProps {
  product: EggerBoardProduct;
  className?: string;
}

export function BoardCard({ product, className = '' }: BoardCardProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const thumbnailUrl = getThumbnailUrl(product.images[0], 'small');

  // Reset loading state when image changes
  const handleImageChange = (index: number) => {
    setSelectedImageIndex(index);
    setImageLoaded(false);
    setImageError(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true); // Show the fallback
  };

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Start loading image when component comes into view
  useEffect(() => {
    if (isInView && !imageLoaded && !imageError) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = handleImageError;
      img.src = product.images[selectedImageIndex];
    }
  }, [isInView, imageLoaded, imageError, selectedImageIndex, product.images]);

  return (
    <Card ref={cardRef} className={`group block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {/* Loading placeholder */}
        {!isInView && (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 animate-pulse">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Main product image or fallback */}
        {isInView && (
          <>
            {!imageLoaded && !imageError && (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <ImageIcon className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}

            {/* Show actual image if loaded successfully */}
            {imageLoaded && !imageError && (
              <img
                src={product.images[selectedImageIndex]}
                alt={product.decor_name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
              />
            )}

            {/* Fallback: Show placeholder with product info */}
            {imageError && imageLoaded && (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="text-center p-6">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-semibold text-lg mb-2 text-gray-700">
                    {product.decor_name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {product.decor_id}
                  </p>
                  <div className="flex justify-center space-x-2">
                    <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-600">
                      {product.texture}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Image navigation dots if multiple images and no error */}
        {product.images.length > 1 && !imageError && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={() => handleImageChange(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === selectedImageIndex
                    ? 'bg-white shadow-lg'
                    : 'bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`View image ${index + 1} of ${product.images.length}`}
              />
            ))}
          </div>
        )}

        {/* Image count badge */}
        {product.images.length > 1 && !imageError && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-black/70 text-white border-0 text-xs">
              <ImageIcon className="w-3 h-3 mr-1" />
              {product.images.length}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 line-clamp-2">
          {product.decor_name}
        </h3>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-gray-500 font-mono">
            {product.decor_id}
          </p>

          {/* Texture and decor badges */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {product.texture}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {product.decor}
            </Badge>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-sm h-9"
            onClick={() => window.open(product.product_page_url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
