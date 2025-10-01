import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface ZoomControllerProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  minZoom?: number;
  maxZoom?: number;
}

export const ZoomController: React.FC<ZoomControllerProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  minZoom = 0.5,
  maxZoom = 4.0
}) => {
  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col items-center gap-1">
      {/* Zoom In Button - Top */}
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        className="h-8 w-8 p-0 hover-scale"
      >
        <Plus className="h-4 w-4" />
      </Button>
      
      {/* Zoom Percentage Display */}
      <div className="text-xs font-medium text-gray-700 text-center px-1">
        {zoomPercentage}%
      </div>
      
      {/* Zoom Out Button - Bottom */}
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        className="h-8 w-8 p-0 hover-scale"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  );
};
