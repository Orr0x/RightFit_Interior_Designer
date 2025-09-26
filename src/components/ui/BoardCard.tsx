import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WebPDecorGroup } from '../../utils/webpImagesData';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { ExternalLink, ImageIcon, Images } from 'lucide-react';

interface BoardCardProps {
  decorGroup: WebPDecorGroup;
  className?: string;
}

export function BoardCard({ decorGroup, className = '' }: BoardCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-cycle through images on hover
  useEffect(() => {
    if (!isHovered || decorGroup.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % decorGroup.images.length);
    }, 1500); // Change image every 1.5 seconds

    return () => clearInterval(interval);
  }, [isHovered, decorGroup.images.length]);

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true); // Show the fallback
    setIsHovered(false); // Stop hover cycling on error
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
    if (isInView && !imageLoaded && !imageError && decorGroup.images.length > 0) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = handleImageError;
      img.src = decorGroup.images[currentImageIndex].image_url;
    }
  }, [isInView, imageLoaded, imageError, currentImageIndex, decorGroup.images]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    // Navigate to product page
    window.location.href = `/product/${decorGroup.decor_id}`;
  };

  return (
    <Card
      ref={cardRef}
      className={`group block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {/* Loading placeholder */}
        {!isInView && (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 animate-pulse">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Main product image or fallback */}
        {isInView && decorGroup.images.length > 0 && (
          <>
            {!imageLoaded && !imageError && (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <ImageIcon className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}

            {/* Show actual image if loaded successfully */}
            {imageLoaded && !imageError && (
              <img
                src={decorGroup.images[currentImageIndex].image_url}
                alt={decorGroup.decor_name}
                className="w-full h-full object-cover transition-all duration-300"
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
                    {decorGroup.decor_name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {decorGroup.decor_id}
                  </p>
                  <div className="flex justify-center space-x-2">
                    <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-600">
                      {decorGroup.texture}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Image count badge - show when hovering or multiple images */}
        {decorGroup.images.length > 1 && !imageError && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-black/70 text-white border-0 text-xs">
              <Images className="w-3 h-3 mr-1" />
              {decorGroup.images.length}
            </Badge>
          </div>
        )}

        {/* Image indicator dots - show on hover */}
        {decorGroup.images.length > 1 && !imageError && isHovered && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {decorGroup.images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                  setImageLoaded(false);
                  setImageError(false);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentImageIndex
                    ? 'bg-white shadow-lg scale-125'
                    : 'bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`View image ${index + 1} of ${decorGroup.images.length}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 line-clamp-2">
          {decorGroup.decor_name}
        </h3>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-gray-500 font-mono">
            {decorGroup.decor_id}
          </p>

          {/* Texture and decor badges */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {decorGroup.texture}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {decorGroup.decor}
            </Badge>
          </div>

          {/* Image count indicator */}
          {decorGroup.images.length > 1 && (
            <div className="flex items-center text-xs text-gray-500">
              <Images className="w-3 h-3 mr-1" />
              <span>{decorGroup.images.length} images available</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-sm h-9"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              window.open(decorGroup.product_page_url, '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>

        {/* Click indicator */}
        <div className="mt-3 text-xs text-gray-500 text-center opacity-0 group-hover:opacity-100 transition-opacity">
          Click card to view product details →
        </div>
      </div>
    </Card>
  );
}
