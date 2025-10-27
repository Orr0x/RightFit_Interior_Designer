import { useState, useRef, useEffect, useCallback } from 'react';
import type { RoomGeometry } from '@/types/RoomGeometry';
import { RoomService } from '@/services/RoomService';
import { initializeCoordinateEngine } from '@/services/CoordinateTransformEngine';
import { Logger } from '@/utils/Logger';

interface UseCanvasStateProps {
  roomType: string;
  roomDimensions: { width: number; height: number };
  fitToScreenSignal?: number;
  onZoomChange?: (zoom: number) => void;
}

interface UseCanvasStateReturn {
  // Refs
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;

  // Canvas state
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  panOffset: { x: number; y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  roomGeometry: RoomGeometry | null;
  setRoomGeometry: React.Dispatch<React.SetStateAction<RoomGeometry | null>>;
  loadingGeometry: boolean;
  setLoadingGeometry: React.Dispatch<React.SetStateAction<boolean>>;
  touchZoomStart: number | null;
  setTouchZoomStart: React.Dispatch<React.SetStateAction<number | null>>;

  // Helper functions
  resetView: () => void;
  fitToScreen: () => void;
}

/**
 * Custom hook for managing canvas state (zoom, pan, geometry)
 * Extracted from DesignCanvas2D.tsx as part of Story 1.15.3
 */
export function useCanvasState({
  roomType,
  roomDimensions,
  fitToScreenSignal,
  onZoomChange,
}: UseCanvasStateProps): UseCanvasStateReturn {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas state
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [roomGeometry, setRoomGeometry] = useState<RoomGeometry | null>(null);
  const [loadingGeometry, setLoadingGeometry] = useState(false);
  const [touchZoomStart, setTouchZoomStart] = useState<number | null>(null);

  // Notify parent of zoom changes
  useEffect(() => {
    if (onZoomChange) {
      onZoomChange(zoom);
    }
  }, [zoom, onZoomChange]);

  // Initialize coordinate engine when room dimensions change
  useEffect(() => {
    if (roomDimensions?.width && roomDimensions?.height) {
      try {
        initializeCoordinateEngine({
          width: roomDimensions.width,
          depth: roomDimensions.height, // Legacy: room "height" is actually depth
          height: 240, // Default room height in cm
        });
        Logger.log('✅ Coordinate engine initialized', roomDimensions);
      } catch (error) {
        Logger.error('❌ Failed to initialize coordinate engine', error);
      }
    }
  }, [roomDimensions?.width, roomDimensions?.height]);

  // Load room geometry for complex rooms
  useEffect(() => {
    if (!roomType) return;

    const loadGeometry = async () => {
      setLoadingGeometry(true);
      try {
        const template = await RoomService.getRoomGeometryTemplate(roomType as any);
        if (template) {
          Logger.log('✅ Loaded room geometry template', template);
          setRoomGeometry(template);
        } else {
          setRoomGeometry(null);
        }
      } catch (error) {
        Logger.error('❌ Failed to load room geometry', error);
        setRoomGeometry(null);
      } finally {
        setLoadingGeometry(false);
      }
    };

    loadGeometry();
  }, [roomType]);

  // Reset view to default state
  const resetView = useCallback(() => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
    Logger.log('🔄 Canvas view reset');
  }, []);

  // Fit canvas to screen
  const fitToScreen = useCallback(() => {
    if (!canvasRef.current || !containerRef.current || !roomDimensions) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate zoom to fit room in container with 10% padding
    const zoomX = (containerWidth * 0.9) / roomDimensions.width;
    const zoomY = (containerHeight * 0.9) / roomDimensions.height;
    const newZoom = Math.min(zoomX, zoomY, 2.0); // Cap at 2.0x

    setZoom(newZoom);
    setPanOffset({ x: 0, y: 0 });

    Logger.log('📐 Fit to screen', { zoom: newZoom, container: { containerWidth, containerHeight } });
  }, [roomDimensions]);

  // Handle fit-to-screen signal from parent
  useEffect(() => {
    if (fitToScreenSignal !== undefined && fitToScreenSignal > 0) {
      fitToScreen();
    }
  }, [fitToScreenSignal, fitToScreen]);

  return {
    canvasRef,
    containerRef,
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    roomGeometry,
    setRoomGeometry,
    loadingGeometry,
    setLoadingGeometry,
    touchZoomStart,
    setTouchZoomStart,
    resetView,
    fitToScreen,
  };
}
