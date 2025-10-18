/**
 * Lazy3DView - Lazy-loaded 3D view to reduce initial bundle size
 * Only loads Three.js and 3D components when user switches to 3D mode
 */

import React, { Suspense, lazy } from 'react';
import { DesignElement, Design, ElevationViewConfig } from '@/types/project';
import { LoadingSpinner } from './LoadingSpinner';

// Lazy load the heavy 3D components
const AdaptiveView3D = lazy(() => import('./AdaptiveView3D').then(module => ({ default: module.AdaptiveView3D })));

interface Lazy3DViewProps {
  design: Design;
  selectedElement: DesignElement | null;
  onSelectElement: (element: DesignElement | null) => void;
  activeTool?: 'select' | 'fit-screen' | 'pan' | 'tape-measure' | 'none';
  showGrid?: boolean;
  fitToScreenSignal?: number;
  elevationViews?: ElevationViewConfig[];
}

// Loading fallback component
const ThreeDLoadingFallback: React.FC = () => (
  <div className="w-full h-full relative bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner />
      <div className="text-gray-600 text-sm">Loading 3D Engine...</div>
      <div className="text-gray-500 text-xs">Initializing Three.js and 3D models</div>
    </div>
  </div>
);

export const Lazy3DView: React.FC<Lazy3DViewProps> = (props) => {
  return (
    <Suspense fallback={<ThreeDLoadingFallback />}>
      <AdaptiveView3D {...props} />
    </Suspense>
  );
};

export default Lazy3DView;
