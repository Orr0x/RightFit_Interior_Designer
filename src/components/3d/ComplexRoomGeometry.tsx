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
}

/**
 * PolygonFloor - Renders floor from polygon vertices
 */
const PolygonFloor: React.FC<{
  vertices: [number, number][];
  elevation: number;
  color: string;
  quality: RenderQuality;
}> = ({ vertices, elevation, color, quality }) => {
  // Create Three.js Shape from vertices
  const floorShape = useMemo(() => {
    // Calculate center of vertices to center the shape at origin
    const centerX = vertices.reduce((sum, v) => sum + v[0], 0) / vertices.length / 100;
    const centerY = vertices.reduce((sum, v) => sum + v[1], 0) / vertices.length / 100;

    const shape = new THREE.Shape();

    // Convert vertices from cm to meters and create shape centered at origin
    vertices.forEach((vertex, index) => {
      const x = vertex[0] / 100 - centerX; // cm to meters, centered
      const y = vertex[1] / 100 - centerY; // cm to meters, centered

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

  // Center the floor at origin
  const centerOffset = useMemo(() => {
    // Calculate bounding box to center the floor
    const box = new THREE.Box3().setFromPoints(
      vertices.map(v => new THREE.Vector3(v[0] / 100, 0, v[1] / 100))
    );

    const center = new THREE.Vector3();
    box.getCenter(center);

    return { x: -center.x, z: -center.z };
  }, [vertices]);

  // Use simpler material for low quality
  const material = quality.level === 'low'
    ? <meshBasicMaterial color={color} side={THREE.DoubleSide} />
    : <meshLambertMaterial color={color} side={THREE.DoubleSide} />;

  return (
    <mesh
      geometry={floorGeometry}
      position={[0, -0.001, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
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
}> = ({ vertices, ceilingHeight, color, quality }) => {
  // Create Three.js Shape from vertices
  const ceilingShape = useMemo(() => {
    // Calculate center of vertices to center the shape at origin
    const centerX = vertices.reduce((sum, v) => sum + v[0], 0) / vertices.length / 100;
    const centerY = vertices.reduce((sum, v) => sum + v[1], 0) / vertices.length / 100;

    const shape = new THREE.Shape();

    // Convert vertices from cm to meters and create shape centered at origin
    vertices.forEach((vertex, index) => {
      const x = vertex[0] / 100 - centerX; // cm to meters, centered
      const y = vertex[1] / 100 - centerY; // cm to meters, centered

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

  // Center the ceiling at origin
  const centerOffset = useMemo(() => {
    // Calculate bounding box to center the ceiling
    const box = new THREE.Box3().setFromPoints(
      vertices.map(v => new THREE.Vector3(v[0] / 100, 0, v[1] / 100))
    );

    const center = new THREE.Vector3();
    box.getCenter(center);

    return { x: -center.x, z: -center.z };
  }, [vertices]);

  // Use simpler material for low quality
  const material = quality.level === 'low'
    ? <meshBasicMaterial color={color} side={THREE.FrontSide} />
    : <meshLambertMaterial color={color} side={THREE.FrontSide} />;

  return (
    <mesh
      geometry={ceilingGeometry}
      position={[0, ceilingHeight - 0.001, 0]}
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
  roomColors
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
      />

      {/* Walls */}
      {geometry.walls.map((wall, index) => (
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

      {/* Ceiling */}
      {geometry.ceiling && (
        <FlatCeiling
          vertices={geometry.floor.vertices}
          ceilingHeight={geometry.ceiling.elevation / 100}
          color={ceilingColor}
          quality={quality}
        />
      )}

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
