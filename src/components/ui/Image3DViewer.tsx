import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Logger } from '@/utils/Logger';
import {
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface Image3DViewerProps {
  images: Array<{
    id: string;
    url: string;
    type: 'webp' | 'png';
    aspectRatio?: string;
  }>;
  className?: string;
}

interface ViewerState {
  zoom: number;
  selectedImageIndex: number;
  isFullscreen: boolean;
}


export function ImageViewer({ images, className = '' }: Image3DViewerProps) {
  // Validate images prop
  if (!images || !Array.isArray(images)) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">📷</div>
        <p className="text-gray-600">No images available</p>
      </div>
    );
  }

  const [state, setState] = useState<ViewerState>({
    zoom: 1, // Default 100% zoom
    selectedImageIndex: 0,
    isFullscreen: false
  });

  const [isLoaded, setIsLoaded] = useState(false);

  const handleZoomIn = () => {
    setState(prev => ({
      ...prev,
      zoom: Math.min(3, prev.zoom + 0.2)
    }));
  };

  const handleZoomOut = () => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(0.5, prev.zoom - 0.2)
    }));
  };

  const updateState = (updates: Partial<ViewerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetView = () => {
    updateState({
      zoom: 1, // Reset to 100% zoom
      selectedImageIndex: 0
    });
  };

  const toggleFullscreen = () => {
    updateState({ isFullscreen: !state.isFullscreen });
  };



  const nextImage = () => {
    if (images.length > 1) {
      updateState({
        selectedImageIndex: (state.selectedImageIndex + 1) % images.length
      });
    }
  };

  const previousImage = () => {
    if (images.length > 1) {
      updateState({
        selectedImageIndex: state.selectedImageIndex === 0 ? images.length - 1 : state.selectedImageIndex - 1
      });
    }
  };

  const currentImage = images[state.selectedImageIndex] || images[0];

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">📷</div>
        <p className="text-gray-600">No board images available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ''}`}>
      {/* Main Viewer */}
      <div className="relative bg-black overflow-hidden">
        {/* Interactive hints */}
        <div className="absolute top-4 left-4 z-10 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-black/70 text-white text-xs px-3 py-2 rounded-lg">
            <div className="font-medium mb-1">Controls:</div>
            <div>• Click arrows to navigate images</div>
            <div>• Click zoom buttons to zoom in/out</div>
            <div>• Click fullscreen for full screen</div>
          </div>
        </div>

        {/* Image container - only this scales */}
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            transform: `scale(${state.zoom})`,
            transformOrigin: 'center center'
          }}
        >
            {/* Simple image display */}
            {currentImage && currentImage.url ? (
              <img
                src={currentImage.url}
                alt={`Image ${state.selectedImageIndex + 1}`}
                className="w-full h-full object-contain"
                style={{
                  filter: 'brightness(1.05) contrast(1.05)'
                }}
                loading="eager"
                onLoad={() => setIsLoaded(true)}
                onError={(e) => {
                  Logger.error('Image failed to load:', currentImage.url);
                  setIsLoaded(true); // Still mark as loaded to prevent infinite loading
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="text-gray-400 text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <p>Image not available</p>
                </div>
              </div>
            )}

          {/* Loading indicator */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* FIXED POSITION FLOATING CONTROLS - Outside scaled container */}
        {/* Cool side arrows for navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                previousImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full z-20 transition-all duration-200"
              aria-label="Previous image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full z-20 transition-all duration-200"
              aria-label="Next image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          </>
        )}

        {/* Floating zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            disabled={state.zoom >= 3}
            className="bg-black/30 hover:bg-black/50 disabled:bg-black/10 text-white disabled:text-gray-400 p-2 rounded-full transition-all duration-200 disabled:cursor-not-allowed"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            disabled={state.zoom <= 0.5}
            className="bg-black/30 hover:bg-black/50 disabled:bg-black/10 text-white disabled:text-gray-400 p-2 rounded-full transition-all duration-200 disabled:cursor-not-allowed"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Floating fullscreen button */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-200"
            aria-label="Toggle fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom level indicator */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-black/30 text-white px-3 py-1 rounded-full text-sm font-medium">
            {Math.round(state.zoom * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
