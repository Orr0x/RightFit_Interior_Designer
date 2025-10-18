/**
 * ComplexRoomGeometry - Renders complex room shapes (L-shape, U-shape, custom polygons)
 * Uses room geometry from database to render floor, walls, and ceiling
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { RoomGeometry } from '@/types/RoomGeometry';
import type { RenderQuality } from '@/services/PerformanceDetector';
import type { RoomColors } from '@/services/RoomService';
import { Text } from '@react-three/drei';

interface ComplexRoomGeometryProps {
  geometry: RoomGeometry;
  quality: RenderQuality;
  roomColors?: RoomColors | null;
  hiddenWalls?: string[]; // Manual array of wall directions to hide: ['north', 'south', 'east', 'west']
  hideInterior?: boolean; // Manual toggle for interior/return walls
  showCeiling?: boolean; // Manual ceiling toggle
}

/**
 * PolygonFloor - Renders floor from polygon vertices
 */
const PolygonFloor: React.FC<{
  vertices: [number, number][];
  elevation: number;
  color: string;
  quality: RenderQuality;
  centerOffset: { x: number; z: number };
}> = ({ vertices, elevation, color, quality, centerOffset }) => {
  // Create Three.js Shape from vertices (NOT centered - we'll position the mesh instead)
  const floorShape = useMemo(() => {
    const shape = new THREE.Shape();

    // Convert vertices from cm to meters (no centering in shape)
    vertices.forEach((vertex, index) => {
      const x = vertex[0] / 100;
      const y = vertex[1] / 100;

      if (index === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    });

    shape.closePath();
    return shape;
  }, [vertices]);

  // Create floor geometry (ShapeGeometry for better performance: 2-20 triangles vs 10-100+)
  const floorGeometry = useMemo(() => {
    return new THREE.ShapeGeometry(floorShape);
  }, [floorShape]);

  // Use simpler material for low quality
  const material = quality.level === 'low'
    ? <meshBasicMaterial color={color} side={THREE.DoubleSide} />
    : <meshLambertMaterial color={color} side={THREE.DoubleSide} />;

  return (
    <mesh
      geometry={floorGeometry}
      position={[centerOffset.x, -0.001, centerOffset.z]}
      rotation={[Math.PI / 2, 0, 0]}
      receiveShadow={quality.shadows}
    >
      {material}
    </mesh>
  );
};

/**
 * WallSegment - Renders a single wall segment
 */
const WallSegment: React.FC<{
  start: [number, number];
  end: [number, number];
  height: number;
  thickness: number;
  color: string;
  quality: RenderQuality;
  centerOffset: { x: number; z: number };
}> = ({ start, end, height, thickness, color, quality, centerOffset }) => {
  const wallData = useMemo(() => {
    // Convert cm to meters
    const startX = start[0] / 100;
    const startZ = start[1] / 100;
    const endX = end[0] / 100;
    const endZ = end[1] / 100;
    const wallHeight = height / 100;
    const wallThickness = thickness / 100;

    // Calculate wall length and angle
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);

    // Calculate center position (with offset to center room at origin)
    const centerX = (startX + endX) / 2 + centerOffset.x;
    const centerZ = (startZ + endZ) / 2 + centerOffset.z;

    return {
      position: [centerX, wallHeight / 2, centerZ] as [number, number, number],
      rotation: [0, -angle, 0] as [number, number, number],
      dimensions: [length, wallHeight, wallThickness] as [number, number, number]
    };
  }, [start, end, height, thickness, centerOffset]);

  // Use simpler material for low quality
  const material = quality.level === 'low'
    ? <meshBasicMaterial color={color} />
    : <meshLambertMaterial color={color} />;

  return (
    <mesh
      position={wallData.position}
      rotation={wallData.rotation}
      receiveShadow={quality.shadows}
      castShadow={quality.shadows}
    >
      <boxGeometry args={wallData.dimensions} />
      {material}
    </mesh>
  );
};

/**
 * FlatCeiling - Renders a flat ceiling from polygon vertices
 */
const FlatCeiling: React.FC<{
  vertices: [number, number][];
  ceilingHeight: number;
  color: string;
  quality: RenderQuality;
  centerOffset: { x: number; z: number };
}> = ({ vertices, ceilingHeight, color, quality, centerOffset }) => {
  // Create Three.js Shape from vertices (NOT centered - we'll position the mesh instead)
  const ceilingShape = useMemo(() => {
    const shape = new THREE.Shape();

    // Convert vertices from cm to meters (no centering in shape)
    vertices.forEach((vertex, index) => {
      const x = vertex[0] / 100;
      const y = vertex[1] / 100;

      if (index === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    });

    shape.closePath();
    return shape;
  }, [vertices]);

  // Create geometry from shape
  const ceilingGeometry = useMemo(() => {
    return new THREE.ShapeGeometry(ceilingShape);
  }, [ceilingShape]);

  // Use simpler material for low quality
  const material = quality.level === 'low'
    ? <meshBasicMaterial color={color} side={THREE.DoubleSide} />
    : <meshLambertMaterial color={color} side={THREE.DoubleSide} />;

  return (
    <mesh
      geometry={ceilingGeometry}
      position={[centerOffset.x, ceilingHeight - 0.001, centerOffset.z]}
      rotation={[Math.PI / 2, 0, 0]}
      receiveShadow={quality.shadows}
    >
      {material}
    </mesh>
  );
};

/**
 * ComplexRoomGeometry - Main component
 */
export const ComplexRoomGeometry: React.FC<ComplexRoomGeometryProps> = ({
  geometry,
  quality,
  roomColors,
  hiddenWalls = [], // Default: show all walls
  hideInterior = false, // Default: show interior walls
  showCeiling = false // Default: hide ceiling
}) => {
  // Room colors from database or fallback to defaults
  const floorColor = roomColors?.floor || "#f5f5f5";
  const wallColor = roomColors?.walls || "#ffffff";
  const ceilingColor = roomColors?.ceiling || "#ffffff";

  // Calculate center offset to center room at origin
  const centerOffset = useMemo(() => {
    const box = new THREE.Box3().setFromPoints(
      geometry.floor.vertices.map(v => new THREE.Vector3(v[0] / 100, 0, v[1] / 100))
    );

    const center = new THREE.Vector3();
    box.getCenter(center);

    return { x: -center.x, z: -center.z };
  }, [geometry.floor.vertices]);

  // Filter walls based on manual hiddenWalls array and hideInterior toggle
  const visibleWalls = useMemo(() => {
    const bbox = geometry.bounding_box;
    const tolerance = 5; // 5cm tolerance for edge detection

    return geometry.walls.filter(wall => {
      // Check if wall is on the perimeter (bounding box edge) or interior
      const isOnNorthEdge = Math.abs(wall.start[1] - bbox.min_y) < tolerance && Math.abs(wall.end[1] - bbox.min_y) < tolerance;
      const isOnSouthEdge = Math.abs(wall.start[1] - bbox.max_y) < tolerance && Math.abs(wall.end[1] - bbox.max_y) < tolerance;
      const isOnWestEdge = Math.abs(wall.start[0] - bbox.min_x) < tolerance && Math.abs(wall.end[0] - bbox.min_x) < tolerance;
      const isOnEastEdge = Math.abs(wall.start[0] - bbox.max_x) < tolerance && Math.abs(wall.end[0] - bbox.max_x) < tolerance;

      const isPerimeterWall = isOnNorthEdge || isOnSouthEdge || isOnWestEdge || isOnEastEdge;

      // Hide interior walls if hideInterior is true
      if (!isPerimeterWall && hideInterior) {
        return false;
      }

      // For perimeter walls, check hiddenWalls array
      if (isPerimeterWall && hiddenWalls.length > 0) {
        const dx = wall.end[0] - wall.start[0];
        const dy = wall.end[1] - wall.start[1];
        const centerX = (wall.start[0] + wall.end[0]) / 2;
        const centerY = (wall.start[1] + wall.end[1]) / 2;
        const roomCenterX = (bbox.max_x + bbox.min_x) / 2;
        const roomCenterY = (bbox.max_y + bbox.min_y) / 2;

        // Wall is more horizontal (runs east-west)
        if (Math.abs(dx) > Math.abs(dy)) {
          const direction = centerY < roomCenterY ? 'north' : 'south';
          return !hiddenWalls.includes(direction);
        } else {
          // Wall is more vertical (runs north-south)
          const direction = centerX > roomCenterX ? 'east' : 'west';
          return !hiddenWalls.includes(direction);
        }
      }

      return true; // Show wall by default
    });
  }, [geometry.walls, hiddenWalls, hideInterior, geometry.bounding_box]);

  // Calculate room dimensions for display text
  const roomDimensions = useMemo(() => {
    const bbox = geometry.bounding_box;
    return {
      width: bbox.max_x - bbox.min_x,
      height: bbox.max_y - bbox.min_y,
      area: geometry.metadata?.total_floor_area || 0
    };
  }, [geometry.bounding_box, geometry.metadata]);

  return (
    <group>
      {/* Floor */}
      <PolygonFloor
        vertices={geometry.floor.vertices}
        elevation={geometry.floor.elevation}
        color={floorColor}
        quality={quality}
        centerOffset={centerOffset}
      />

      {/* Walls */}
      {visibleWalls.map((wall, index) => (
        <WallSegment
          key={wall.id || `wall-${index}`}
          start={wall.start}
          end={wall.end}
          height={wall.height}
          thickness={wall.thickness || 10} // Default 10cm
          color={wallColor}
          quality={quality}
          centerOffset={centerOffset}
        />
      ))}

      {/* Ceiling - controlled by showCeiling prop */}
      {showCeiling && geometry.ceiling && (() => {
        // Use wall height for ceiling position (walls define the room height)
        // This ensures ceiling sits at the top of the walls, not floating above
        const wallHeight = geometry.walls[0]?.height || 240; // Get first wall height or default to 240cm
        const ceilingHeight = wallHeight / 100; // Convert to meters

        return (
          <FlatCeiling
            vertices={geometry.floor.vertices}
            ceilingHeight={ceilingHeight}
            color={ceilingColor}
            quality={quality}
            centerOffset={centerOffset}
          />
        );
      })()}

      {/* Room dimensions text - only show in medium/high quality */}
      {quality.level !== 'low' && (
        <Text
          position={[0, 0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#666"
        >
          {geometry.shape_type} • {Math.round(roomDimensions.width / 10)}×{Math.round(roomDimensions.height / 10)}cm
          {roomDimensions.area > 0 && ` • ${(roomDimensions.area / 10000).toFixed(1)}m²`}
        </Text>
      )}
    </group>
  );
};
