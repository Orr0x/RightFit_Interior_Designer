/**
 * AdaptiveView3D - 3D view with adaptive performance and quality settings
 * Automatically adjusts rendering quality based on device capabilities
 */

import React, { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Text } from '@react-three/drei';
import { DesignElement, Design } from '@/types/project';
import { performanceDetector, RenderQuality, DeviceCapabilities } from '@/services/PerformanceDetector';
import { memoryManager } from '@/services/MemoryManager';
import { useIsMobile } from '@/hooks/use-mobile';
import { RoomService, RoomColors } from '@/services/RoomService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, Gauge } from 'lucide-react';
import type { RoomGeometry } from '@/types/RoomGeometry';
import { ComplexRoomGeometry } from '@/components/3d/ComplexRoomGeometry';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import * as THREE from 'three';
import { 
  EnhancedCabinet3D, 
  EnhancedAppliance3D, 
  EnhancedCounterTop3D, 
  EnhancedEndPanel3D,
  EnhancedWindow3D,
  EnhancedDoor3D,
  EnhancedFlooring3D,
  EnhancedToeKick3D,
  EnhancedCornice3D,
  EnhancedPelmet3D,
  EnhancedWallUnitEndPanel3D,
  EnhancedSink3D
} from './EnhancedModels3D';

interface AdaptiveView3DProps {
  design: Design;
  selectedElement: DesignElement | null;
  onSelectElement: (element: DesignElement | null) => void;
  activeTool?: 'select' | 'fit-screen' | 'pan' | 'tape-measure' | 'none';
  showGrid?: boolean;
  fitToScreenSignal?: number;
}

// Convert 2D coordinates to 3D world coordinates accounting for wall thickness
const convertTo3D = (x: number, y: number, roomWidth: number, roomHeight: number) => {
  // CRITICAL FIX: Account for wall thickness in coordinate conversion
  // 2D coordinates now represent positions within the inner room bounds (usable space)
  const WALL_THICKNESS_CM = 10; // 10cm wall thickness (matches DesignCanvas2D)
  const WALL_THICKNESS_METERS = WALL_THICKNESS_CM / 100; // Convert to meters
  
  // Scale down the room to reasonable 3D size
  const roomWidthMeters = roomWidth / 100;
  const roomHeightMeters = roomHeight / 100;
  
  // Convert 2D inner room coordinates to 3D world coordinates
  // 2D coordinates represent positions within the inner usable space (after wall thickness)
  // 3D needs to map these coordinates to the actual inner 3D space
  
  // Calculate the inner 3D room dimensions (subtracting wall thickness)
  const inner3DWidth = roomWidthMeters - WALL_THICKNESS_METERS;
  const inner3DHeight = roomHeightMeters - WALL_THICKNESS_METERS;
  
  // PRECISION FIX: Account for exact wall positioning
  const halfWallThickness = WALL_THICKNESS_METERS / 2; // 5cm in meters
  
  // Calculate 3D inner boundaries (where wall inner faces are)
  const innerLeftBoundary = -roomWidthMeters / 2 + halfWallThickness;
  const innerRightBoundary = roomWidthMeters / 2 - halfWallThickness;
  const innerBackBoundary = -roomHeightMeters / 2 + halfWallThickness;
  const innerFrontBoundary = roomHeightMeters / 2 - halfWallThickness;
  
  // Map 2D coordinates directly to 3D inner space
  const xRange = innerRightBoundary - innerLeftBoundary;
  const zRange = innerFrontBoundary - innerBackBoundary;
  
  return {
    x: innerLeftBoundary + (x / roomWidth) * xRange,
    z: innerBackBoundary + (y / roomHeight) * zRange
  };
};

// Adaptive Room component with quality-based features
const AdaptiveRoom3D: React.FC<{
  roomDimensions: { width: number; height: number; ceilingHeight?: number };
  quality: RenderQuality;
  roomColors?: RoomColors | null;
}> = ({ roomDimensions, quality, roomColors }) => {
  const roomWidth = roomDimensions.width / 100;
  const roomDepth = roomDimensions.height / 100;
  const wallHeight = (roomDimensions.ceilingHeight || 250) / 100;

  // Room colors from database or fallback to defaults
  const floorColor = roomColors?.floor || "#f5f5f5";
  const wallColor = roomColors?.walls || "#ffffff";

  // Use simpler materials for low quality
  const floorMaterial = quality.level === 'low'
    ? <meshBasicMaterial color={floorColor} side={THREE.DoubleSide} />
    : <meshLambertMaterial color={floorColor} side={THREE.DoubleSide} />;

  const wallMaterial = quality.level === 'low'
    ? <meshBasicMaterial color={wallColor} />
    : <meshLambertMaterial color={wallColor} />;

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={quality.shadows}>
        <planeGeometry args={[roomWidth, roomDepth]} />
        {floorMaterial}
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, wallHeight - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow={quality.shadows}>
        <planeGeometry args={[roomWidth, roomDepth]} />
        <meshLambertMaterial color={roomColors?.ceiling || "#ffffff"} side={THREE.FrontSide} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, wallHeight / 2, -roomDepth / 2]} receiveShadow={quality.shadows}>
        <boxGeometry args={[roomWidth, wallHeight, 0.1]} />
        {wallMaterial}
      </mesh>
      
      {/* Left Wall */}
      <mesh position={[-roomWidth / 2, wallHeight / 2, 0]} receiveShadow={quality.shadows}>
        <boxGeometry args={[0.1, wallHeight, roomDepth]} />
        {wallMaterial}
      </mesh>
      
      {/* Right Wall */}
      <mesh position={[roomWidth / 2, wallHeight / 2, 0]} receiveShadow={quality.shadows}>
        <boxGeometry args={[0.1, wallHeight, roomDepth]} />
        {wallMaterial}
      </mesh>
      
      {/* Room dimensions text - only show in medium/high quality */}
      {quality.level !== 'low' && (
        <Text
          position={[0, 0.1, roomDepth / 2 - 0.2]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#666"
        >
          {roomDimensions.width}cm × {roomDimensions.height}cm
        </Text>
      )}
    </group>
  );
};

// Adaptive Lighting component
const AdaptiveLighting: React.FC<{ quality: RenderQuality }> = ({ quality }) => {
  if (quality.level === 'low') {
    // Minimal lighting for performance
    return (
      <>
        <ambientLight intensity={0.8} />
      </>
    );
  }

  if (quality.level === 'medium') {
    // Balanced lighting
    return (
      <>
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow={quality.shadows}
          shadow-mapSize-width={quality.shadowMapSize}
          shadow-mapSize-height={quality.shadowMapSize}
        />
      </>
    );
  }

  // High quality lighting
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow={quality.shadows}
        shadow-mapSize-width={quality.shadowMapSize}
        shadow-mapSize-height={quality.shadowMapSize}
      />
      <pointLight position={[0, 2, 0]} intensity={0.3} />
      <pointLight position={[-2, 1.5, 2]} intensity={0.2} color="#fff8dc" />
    </>
  );
};

// Quality Settings UI
const QualitySettings: React.FC<{
  currentQuality: RenderQuality;
  capabilities: DeviceCapabilities;
  isAutoMode: boolean;
  onQualityChange: (quality: RenderQuality) => void;
  onAutoModeToggle: (auto: boolean) => void;
}> = ({ currentQuality, capabilities, isAutoMode, onQualityChange, onAutoModeToggle }) => {
  const qualityPresets = performanceDetector.getQualityPresets();

  const getQualityColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getGPUColor = (tier: string) => {
    switch (tier) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="absolute top-4 left-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Gauge className="h-4 w-4" />
            <Badge className={`${getQualityColor(currentQuality.level)} text-white px-2 py-1 text-xs`}>
              {currentQuality.level.toUpperCase()}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>3D Rendering Quality</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Device Info */}
          <div className="px-2 py-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>GPU:</span>
              <span className={getGPUColor(capabilities.gpuTier)}>
                {capabilities.gpuTier.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memory:</span>
              <span>{capabilities.memoryGB}GB</span>
            </div>
            <div className="flex justify-between">
              <span>WebGL:</span>
              <span>{capabilities.webglVersion}</span>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Auto Mode Toggle */}
          <DropdownMenuItem onClick={() => onAutoModeToggle(!isAutoMode)}>
            <Zap className="h-4 w-4 mr-2" />
            {isAutoMode ? '✅ Auto-Detect' : '⚙️ Manual Mode (Default)'}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Quality Presets */}
          <DropdownMenuItem 
            onClick={() => onQualityChange(qualityPresets.high)}
            disabled={isAutoMode}
          >
            <div className="flex items-center justify-between w-full">
              <span>High Quality</span>
              <Badge className="bg-green-500 text-white">
                Shadows, AA, Full Detail
              </Badge>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => onQualityChange(qualityPresets.medium)}
            disabled={isAutoMode}
          >
            <div className="flex items-center justify-between w-full">
              <span>Medium Quality</span>
              <Badge className="bg-yellow-500 text-white">
                Balanced Performance
              </Badge>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => onQualityChange(qualityPresets.low)}
            disabled={isAutoMode}
          >
            <div className="flex items-center justify-between w-full">
              <span>Low Quality</span>
              <Badge className="bg-red-500 text-white">
                Maximum Performance
              </Badge>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Fit to Screen Controller
const FitToScreenController: React.FC<{ 
  roomDimensions: { width: number; height: number }; 
  signal: number; 
  controlsRef: React.RefObject<any>; 
}> = ({ roomDimensions, signal, controlsRef }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    if (!signal) return;
    const maxDim = Math.max(roomDimensions.width, roomDimensions.height) / 100;
    const distance = Math.max(4, maxDim * 1.2);
    camera.position.set(distance, distance * 0.8, distance);
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [signal, roomDimensions.width, roomDimensions.height, camera, controlsRef]);
  
  return null;
};

export const AdaptiveView3D: React.FC<AdaptiveView3DProps> = ({
  design,
  selectedElement,
  onSelectElement,
  activeTool = 'select',
  showGrid = true,
  fitToScreenSignal = 0
}) => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [currentQuality, setCurrentQuality] = useState<RenderQuality | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(false); // Default to manual mode
  const [isInitializing, setIsInitializing] = useState(true);
  const [roomColors, setRoomColors] = useState<RoomColors | null>(null);
  const [roomGeometry, setRoomGeometry] = useState<RoomGeometry | null>(null);
  const [loadingGeometry, setLoadingGeometry] = useState(false);
  const controlsRef = useRef<any>(null);
  const isMobile = useIsMobile();

  // Always define roomDimensions (before any early returns)
  const roomDimensions = {
    width: design?.roomDimensions?.width || 600,
    height: design?.roomDimensions?.height || 400,
    ceilingHeight: design?.roomDimensions?.ceilingHeight
  };

  // Load room colors from database
  useEffect(() => {
    const loadRoomColors = async () => {
      if (design?.roomType) {
        try {
          const template = await RoomService.getRoomTypeTemplate(design.roomType);
          if (template.default_colors) {
            setRoomColors(template.default_colors);
            console.log(`✅ [AdaptiveView3D] Loaded room colors from database for ${design.roomType}:`, template.default_colors);
          }
        } catch (error) {
          console.warn(`⚠️ [AdaptiveView3D] Failed to load room colors for ${design.roomType}:`, error);
        }
      }
    };

    loadRoomColors();
  }, [design?.roomType]);

  // Load room geometry from database (Phase 3: Complex Room Shapes)
  useEffect(() => {
    const loadRoomGeometry = async () => {
      // Only try to load if we have a room/design ID
      if (design?.id) {
        setLoadingGeometry(true);
        try {
          const geometry = await RoomService.getRoomGeometry(design.id);
          if (geometry) {
            setRoomGeometry(geometry as RoomGeometry);
            console.log(`✅ [AdaptiveView3D] Loaded complex room geometry for room ${design.id}:`, geometry.shape_type);
          } else {
            // No complex geometry - will use simple rectangular fallback
            setRoomGeometry(null);
            console.log(`ℹ️ [AdaptiveView3D] No complex geometry found for room ${design.id}, using simple rectangular room`);
          }
        } catch (error) {
          console.warn(`⚠️ [AdaptiveView3D] Failed to load room geometry for ${design.id}:`, error);
          setRoomGeometry(null);
        } finally {
          setLoadingGeometry(false);
        }
      } else {
        // No room ID - use simple rectangular room
        setRoomGeometry(null);
        setLoadingGeometry(false);
      }
    };

    loadRoomGeometry();
  }, [design?.id]);

  // Filter elements based on quality settings (always call this hook)
  const visibleElements = useMemo(() => {
    if (!design?.elements) return [];
    
    // Limit elements for performance - use fallback if currentQuality is null
    const maxElements = currentQuality?.maxElements || 100;
    return design.elements.slice(0, maxElements);
  }, [design?.elements, currentQuality?.maxElements]);

  // Initialize performance detection
  useEffect(() => {
    const initializePerformance = async () => {
      try {
        const caps = await performanceDetector.detectCapabilities();
        setCapabilities(caps);
        // Default to medium quality instead of auto-detected
        const mediumQuality = performanceDetector.getQualityPresets().medium;
        setCurrentQuality(mediumQuality);
        setIsInitializing(false);

        console.log('🎮 [AdaptiveView3D] Performance detection complete:', {
          gpu: caps.gpuTier,
          recommended: caps.recommendedQuality.level,
          defaultUsing: 'medium',
          autoMode: false
        });
      } catch (error) {
        console.error('❌ [AdaptiveView3D] Performance detection failed:', error);
        // Fallback to medium quality
        const fallback = performanceDetector.getQualityPresets().medium;
        setCurrentQuality(fallback);
        setIsInitializing(false);
      }
    };

    initializePerformance();
  }, []);

  // Start frame rate monitoring in auto mode
  useEffect(() => {
    if (!isAutoMode || !capabilities) return;

    performanceDetector.startFrameRateMonitoring((newQuality) => {
      console.log('⚡ [AdaptiveView3D] Auto-adjusting quality:', newQuality.level);
      setCurrentQuality(newQuality);
    });

    return () => {
      performanceDetector.stopFrameRateMonitoring();
    };
  }, [isAutoMode, capabilities]);

  // Setup memory management and cleanup
  useEffect(() => {
    // Start memory monitoring
    memoryManager.monitorMemoryUsage();
    memoryManager.setupAutomaticCleanup();

    // Cleanup function for component unmount
    return memoryManager.createCleanupFunction([
      () => performanceDetector.stopFrameRateMonitoring(),
      () => memoryManager.clearComponentCaches(),
      () => console.log('🧹 [AdaptiveView3D] Component cleanup complete')
    ]);
  }, []);

  // Safety checks - AFTER all hooks
  if (!design || !design.roomDimensions || isInitializing || !currentQuality) {
    return (
      <div className="w-full h-full relative bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-gray-500">
          {isInitializing ? 'Optimizing 3D performance...' : 'Loading 3D View...'}
        </div>
      </div>
    );
  }

  const handleElementClick = (element: DesignElement) => {
    if (activeTool === 'select') {
      onSelectElement(selectedElement?.id === element.id ? null : element);
    }
  };

  const handleQualityChange = (newQuality: RenderQuality) => {
    console.log('🎨 [AdaptiveView3D] Manual quality change:', newQuality.level);
    setCurrentQuality(newQuality);
  };

  const handleAutoModeToggle = (auto: boolean) => {
    console.log('🔄 [AdaptiveView3D] Auto mode:', auto ? 'enabled' : 'disabled');
    setIsAutoMode(auto);
    
    if (auto && capabilities) {
      // Reset to recommended quality
      setCurrentQuality(capabilities.recommendedQuality);
    }
  };

  return (
    <div className="w-full h-full relative z-0 bg-gray-50 rounded-lg overflow-hidden">
      {/* Quality Settings UI */}
      {capabilities && (
        <QualitySettings
          currentQuality={currentQuality}
          capabilities={capabilities}
          isAutoMode={isAutoMode}
          onQualityChange={handleQualityChange}
          onAutoModeToggle={handleAutoModeToggle}
        />
      )}

      <Canvas
        camera={{
          position: [5, 4, 5],
          fov: 60
        }}
        shadows={currentQuality.shadows}
        className="w-full h-full"
        gl={{
          antialias: currentQuality.antialias,
          alpha: true, // Enable transparency to show container background
          powerPreference: currentQuality.level === 'high' ? 'high-performance' : 'low-power'
        }}
      >
        <Suspense fallback={null}>
          {/* Adaptive Lighting */}
          <AdaptiveLighting quality={currentQuality} />
          
          {/* Environment - only for medium/high quality */}
          {currentQuality.environmentLighting && (
            <Environment preset="apartment" />
          )}

          {/* Render complex or simple room geometry */}
          {roomGeometry ? (
            // Phase 3: Complex room geometry (L-shape, U-shape, custom polygons)
            <ComplexRoomGeometry
              geometry={roomGeometry}
              quality={currentQuality}
              roomColors={roomColors}
            />
          ) : (
            // Legacy: Simple rectangular room (backward compatible)
            <AdaptiveRoom3D roomDimensions={roomDimensions} quality={currentQuality} roomColors={roomColors} />
          )}
          
          {/* Grid - simplified for low quality */}
          {showGrid && (
            <Grid
              args={[roomDimensions.width / 100, roomDimensions.height / 100]}
              cellSize={0.2}
              cellThickness={currentQuality.level === 'low' ? 0.5 : 1}
              cellColor="#e0e0e0"
              sectionSize={1}
              sectionThickness={currentQuality.level === 'low' ? 1 : 1.5}
              sectionColor="#c0c0c0"
              position={[0, 0, 0]}
            />
          )}
          
          {/* Design Elements - limited by quality */}
          {visibleElements.map((element) => {
            const isSelected = selectedElement?.id === element.id;
            const { x, z } = convertTo3D(element.x, element.y, roomDimensions.width, roomDimensions.height);

            // Render appropriate 3D model based on element type
            switch (element.type) {
              case 'cabinet':
                return (
                  <EnhancedCabinet3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              case 'appliance':
                return (
                  <EnhancedAppliance3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              case 'counter-top':
                return (
                  <EnhancedCounterTop3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              case 'end-panel':
                return (
                  <EnhancedEndPanel3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              case 'window':
                return (
                  <EnhancedWindow3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              case 'door':
                return (
                  <EnhancedDoor3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              case 'flooring':
                return (
                  <EnhancedFlooring3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              case 'toe-kick':
                return (
                  <EnhancedToeKick3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              case 'cornice':
                return (
                  <EnhancedCornice3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              case 'pelmet':
                return (
                  <EnhancedPelmet3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              case 'wall-unit-end-panel':
                return (
                  <EnhancedWallUnitEndPanel3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              case 'sink':
                return (
                  <EnhancedSink3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              // Multi-room furniture types (bedroom, bathroom, living room, office, etc.)
              case 'bed':
              case 'seating':
              case 'storage':
              case 'desk':
              case 'table':
              case 'chair':
                return (
                  <EnhancedCabinet3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
              default:
                // For any unhandled types, try to render with EnhancedCabinet3D
                // which will use DynamicComponentRenderer if feature flag is enabled
                console.log(`[AdaptiveView3D] Rendering unhandled type "${element.type}" with EnhancedCabinet3D`);
                return (
                  <EnhancedCabinet3D
                    key={element.id}
                    element={element}
                    roomDimensions={roomDimensions}
                    isSelected={isSelected}
                    onClick={() => handleElementClick(element)}
                  />
                );
            }
          })}
          
          {/* Controls - Mobile Optimized */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true} // Always enable panning for right-click support
            enableZoom={true}
            enableRotate={activeTool === 'select' || activeTool === 'pan'}
            target={[0, 0, 0]}
            // Mobile-optimized touch settings
            enableDamping={true}
            dampingFactor={isMobile ? 0.1 : 0.05}
            rotateSpeed={isMobile ? 0.8 : 0.5}
            panSpeed={isMobile ? 1.2 : 0.8}
            // Right-click panning support
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN
            }}
            zoomSpeed={isMobile ? 1.5 : 1.0}
            minDistance={isMobile ? 1.5 : 2}
            maxDistance={isMobile ? 20 : 15}
            maxPolarAngle={Math.PI / 2.2}
            // Touch-specific settings
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN
            }}
            mouseButtons={{
              LEFT: activeTool === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN,
            }}
          />
          
          {/* Fit to Screen Controller */}
          <FitToScreenController
            roomDimensions={roomDimensions}
            signal={fitToScreenSignal}
            controlsRef={controlsRef}
          />
        </Suspense>
      </Canvas>
      
      {/* Element count indicator for performance monitoring */}
      {visibleElements.length < (design.elements?.length || 0) && (
        <div className="absolute bottom-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs">
          Showing {visibleElements.length} of {design.elements?.length} elements
        </div>
      )}
    </div>
  );
};
