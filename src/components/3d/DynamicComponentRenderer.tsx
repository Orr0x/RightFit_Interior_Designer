/**
 * Dynamic Component Renderer
 *
 * Purpose: Render 3D components dynamically from database definitions
 * Feature Flag: use_dynamic_3d_models
 *
 * Responsibilities:
 * - Load component model from database
 * - Build Three.js geometry using GeometryBuilder
 * - Apply transformations (position, rotation)
 * - Handle auto-rotate logic
 * - Cache loaded models for performance
 *
 * Usage:
 * ```tsx
 * <DynamicComponentRenderer
 *   element={element}
 *   roomDimensions={roomDimensions}
 *   isSelected={isSelected}
 *   onClick={onClick}
 * />
 * ```
 */

import React, { useEffect, useState, useMemo } from 'react';
import { DesignElement } from '@/types/project';
import * as THREE from 'three';
import { Model3DLoaderService } from '@/services/Model3DLoaderService';
import { GeometryBuilder } from '@/utils/GeometryBuilder';
import { mapComponentIdToModelId } from '@/utils/ComponentIDMapper';

interface DynamicComponentRendererProps {
  element: DesignElement;
  roomDimensions: { width: number; height: number };
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Convert 2D coordinates to 3D world coordinates
 */
const convertTo3D = (x: number, y: number, roomWidth: number, roomHeight: number) => {
  const roomWidthMeters = roomWidth / 100;
  const roomHeightMeters = roomHeight / 100;

  return {
    x: (x / 100) - roomWidthMeters / 2,
    z: (y / 100) - roomHeightMeters / 2
  };
};

/**
 * DynamicComponentRenderer - Renders 3D components from database
 */
export const DynamicComponentRenderer: React.FC<DynamicComponentRendererProps> = ({
  element,
  roomDimensions,
  isSelected,
  onClick
}) => {
  const [meshGroup, setMeshGroup] = useState<THREE.Group | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Determine component ID from element using centralized mapper
  const componentId = useMemo(() => {
    // Use ComponentIDMapper for centralized mapping logic
    const mappedId = mapComponentIdToModelId(
      element.id,
      element.width,
      element.height,
      element.depth
    );

    // If mapper returns null, no dynamic model exists - will fallback to hardcoded
    return mappedId || element.id;
  }, [element.id, element.width, element.height, element.depth]);

  // Determine cabinet type
  const isWallCabinet = useMemo(() => {
    return element.style?.toLowerCase().includes('wall') ||
           element.height <= 50 ||
           element.id.includes('wall-cabinet');
  }, [element.style, element.height, element.id]);

  const isCornerCabinet = useMemo(() => {
    return element.id.includes('corner-cabinet') ||
           element.style?.toLowerCase().includes('corner');
  }, [element.id, element.style]);

  // Load and build geometry
  useEffect(() => {
    let isMounted = true;

    const loadAndBuild = async () => {
      try {
        // Load model from database
        const { model, geometry, materials } = await Model3DLoaderService.loadComplete(componentId);

        if (!isMounted) return;

        if (!model) {
          console.warn(`[DynamicRenderer] Model not found: ${componentId}`);
          setLoadError(`Model not found: ${componentId}`);
          return;
        }

        if (geometry.length === 0) {
          console.warn(`[DynamicRenderer] No geometry parts for model: ${componentId}`);
          setLoadError(`No geometry parts found`);
          return;
        }

        // Build Three.js geometry
        const builder = new GeometryBuilder(geometry, materials);

        // Prepare build context
        const context = {
          width: element.width, // cm
          height: element.height, // cm
          depth: element.depth || (isWallCabinet ? 40 : 60), // cm
          isSelected,
          isWallCabinet,
          legLength: model.leg_length || undefined,
          cornerDepth: isWallCabinet
            ? (model.corner_depth_wall || 0.4)
            : (model.corner_depth_base || 0.6),
          plinthHeight: 15, // cm (default 15cm plinth)
          cabinetHeight: element.height - 15, // cm (height minus plinth)
          doorHeight: element.height - 17, // cm (height minus plinth and gap)
        };

        const group = builder.build(context);

        if (isMounted) {
          setMeshGroup(group);
          setLoadError(null);
          console.log(`[DynamicRenderer] Built component: ${componentId} (${group.children.length} parts)`);
        }
      } catch (error) {
        if (isMounted) {
          console.error(`[DynamicRenderer] Error loading component ${componentId}:`, error);
          setLoadError(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    };

    loadAndBuild();

    return () => {
      isMounted = false;
    };
  }, [componentId, element.width, element.height, element.depth, isSelected, isWallCabinet]);

  // Calculate position and rotation
  const { x, z } = convertTo3D(element.x, element.y, roomDimensions.width, roomDimensions.height);

  // Y position depends on cabinet type
  const height = element.height / 100; // meters
  const yPosition = isWallCabinet ? 2.0 - height / 2 : height / 2;

  // Calculate dimensions for rotation pivot
  const width = element.width / 100; // meters
  const depth = (element.depth || (isWallCabinet ? 40 : 60)) / 100; // meters

  // If loading or error, show nothing (fallback to hardcoded will be used)
  if (loadError || !meshGroup) {
    return null;
  }

  // Render the loaded geometry using TOP-LEFT positioning
  // Matches the anchor point fix in EnhancedModels3D.tsx
  return (
    <group
      position={[x, yPosition, z]}
      onClick={onClick}
    >
      {/* Inner group for center-based rotation pivot */}
      <group
        position={[width / 2, 0, depth / 2]}
        rotation={[0, element.rotation * Math.PI / 180, 0]}
      >
        <primitive object={meshGroup} />
      </group>
    </group>
  );
};

/**
 * Preload common components on app startup
 * Call this from main app component
 */
export const preloadCommonComponents = async () => {
  const commonComponents = [
    // Corner cabinets (P0 - most critical)
    'corner-cabinet', // Only corner cabinet in database after cleanup
    'new-corner-wall-cabinet-60',
    'new-corner-wall-cabinet-90',
    // Standard cabinets (P1 - not yet populated in database)
    // Note: base-cabinet-60, base-cabinet-80, wall-cabinet-60, wall-cabinet-80
    // exist in database but may not have 3D models yet
    'base-cabinet-60',
    'base-cabinet-80',
    'wall-cabinet-60',
    'wall-cabinet-80',
    // Appliances (confirmed in database)
    'dishwasher',
    'refrigerator',
  ];

  try {
    await Model3DLoaderService.preload(commonComponents);
    console.log('[DynamicRenderer] Preloaded common components');
  } catch (error) {
    console.warn('[DynamicRenderer] Preload failed:', error);
  }
};
