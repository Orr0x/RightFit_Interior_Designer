import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ColourFinish, getThumbnailUrl } from '../../utils/coloursData';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { ExternalLink, ImageIcon, Palette, Eye } from 'lucide-react';
import { Logger } from '@/utils/Logger';

interface ColourCardProps {
  finish: ColourFinish;
  className?: string;
}

export function ColourCard({ finish, className = '' }: ColourCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Debug logging (commented out for production)
  // Logger.debug('🎨 ColourCard render:', { colour_id: finish.colour_id, imageLoaded, imageError });

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

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true); // Show the fallback
  };

  // Start loading image when component comes into view
  useEffect(() => {
    if (isInView && !imageLoaded && !imageError && finish.thumb_url && !finish.thumb_url.startsWith('#')) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = handleImageError;
      img.src = finish.thumb_url;
    }
  }, [isInView, imageLoaded, imageError, finish.thumb_url]);

  // Get the current image to display (hover or thumb)
  const currentImageUrl = isHovered && finish.hover_url ? finish.hover_url : finish.thumb_url;

  return (
    <Card
      ref={cardRef}
      className={`group block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {/* Debug logs removed for cleaner console */}
        
        {/* Loading placeholder */}
        {!isInView && (
          <div className="w-full h-full flex items-center justify-center bg-red-200 animate-pulse border-4 border-red-500">
            <div className="text-center">
              <Palette className="w-12 h-12 text-red-600 mx-auto mb-2" />
              <p className="text-red-800 font-bold">NOT IN VIEW</p>
              <p className="text-xs text-red-600">{finish.name}</p>
            </div>
          </div>
        )}

        {/* Color swatch or image */}
        {isInView && (
          <>
            {/* Display logic for images vs color swatches */}
            
            {/* Check if we have a color swatch (hex color) or image URL */}
            {finish.thumb_url && finish.thumb_url.startsWith('#') ? (
              // Color swatch display
              <div 
                className="w-full h-full transition-all duration-300 group-hover:scale-105"
                style={{ 
                  backgroundColor: finish.thumb_url,
                  background: `linear-gradient(135deg, ${finish.thumb_url} 0%, ${finish.thumb_url}dd 100%)`
                }}
              >
                {/* Optional: Add a subtle pattern or texture */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              </div>
            ) : (
              // Image display (fallback for CSV data)
              <>
                {!imageLoaded && !imageError && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Palette className="w-8 h-8 text-gray-400 animate-spin" />
                  </div>
                )}

                {/* Show actual image if loaded successfully */}
                {imageLoaded && !imageError && (
                  <>
                    {/* Background image (thumb or hover) */}
                    <img
                      src={currentImageUrl}
                      alt={finish.name}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                      loading="lazy"
                      onLoad={() => setImageLoaded(true)}
                      onError={handleImageError}
                    />

                    {/* Show hover image as overlay when hovering */}
                    {isHovered && finish.hover_url && finish.hover_url !== currentImageUrl && (
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <img
                          src={finish.hover_url}
                          alt={`${finish.name} - Hover`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Fallback: Show placeholder with finish info */}
                {imageError && imageLoaded && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300">
                    <div className="text-center p-6">
                      <Palette className="w-16 h-16 mx-auto mb-4 text-red-400" />
                      <h3 className="font-semibold text-lg mb-2 text-red-700">
                        IMAGE FAILED
                      </h3>
                      <h4 className="font-medium text-sm mb-1 text-gray-700">
                        {finish.name}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">
                        No.{finish.number}
                      </p>
                      <div className="flex justify-center">
                        <span className="px-2 py-1 bg-red-200 rounded text-xs text-red-600">
                          {finish.category}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show loading state more clearly */}
                {!imageLoaded && !imageError && finish.thumb_url && !finish.thumb_url.startsWith('#') && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300">
                    <div className="text-center p-6">
                      <Palette className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-blue-600">Loading Image...</p>
                      <p className="text-xs text-gray-500 mt-1">{finish.name}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Farrow & Ball number badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-black/70 text-white border-0 text-xs">
            No.{finish.number}
          </Badge>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 line-clamp-2">
              {finish.name}
            </h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-mono text-gray-500">No.{finish.number}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {finish.category}
            </Badge>
          </div>

          {finish.description && (
            <p className="text-sm text-gray-600 line-clamp-3">
              {finish.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-sm h-9"
            onClick={() => window.open(finish.product_url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Farrow & Ball
          </Button>
          <Button
            size="sm"
            variant="default"
            className="flex-1 text-sm h-9"
            asChild
          >
            <Link to={`/finishes/${finish.colour_id}`}>
              <Eye className="w-4 h-4 mr-2" />
              View Product
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
