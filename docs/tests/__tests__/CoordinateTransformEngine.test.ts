/**
 * CoordinateTransformEngine Tests
 * Comprehensive test suite for the unified coordinate transformation system
 */

import { 
  CoordinateTransformEngine, 
  initializeCoordinateEngine,
  clearCoordinateEngine,
  getCoordinateEngine,
  PlanCoordinates,
  WorldCoordinates,
  ElevationCoordinates
} from '../CoordinateTransformEngine';
import { RoomDimensions } from '@/types/project';

describe('CoordinateTransformEngine', () => {
  // Standard test room: 600cm x 400cm (6m x 4m kitchen)
  const testRoomDimensions: RoomDimensions = {
    width: 600,  // 600cm inner usable width
    height: 400, // 400cm inner usable height/depth
    ceilingHeight: 240 // 240cm ceiling height
  };

  let engine: CoordinateTransformEngine;

  beforeEach(() => {
    clearCoordinateEngine();
    engine = new CoordinateTransformEngine(testRoomDimensions);
  });

  afterEach(() => {
    clearCoordinateEngine();
  });

  describe('Initialization', () => {
    test('should initialize with correct inner room dimensions', () => {
      const config = engine.getRoomConfiguration();
      
      expect(config.innerWidth).toBe(600);
      expect(config.innerHeight).toBe(400);
      expect(config.ceilingHeight).toBe(240);
      expect(config.wallConfig.thickness).toBe(10);
      expect(config.wallConfig.innerFaceToInnerFace).toBe(true);
    });

    test('should provide correct inner room bounds', () => {
      const bounds = engine.getInnerRoomBounds();
      
      expect(bounds.minX).toBe(0);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxX).toBe(600);
      expect(bounds.maxY).toBe(400);
      expect(bounds.width).toBe(600);
      expect(bounds.height).toBe(400);
    });
  });

  describe('Plan to World Coordinate Transformation', () => {
    test('should convert inner room corner (0,0) to world center offset', () => {
      const planCoords: PlanCoordinates = { x: 0, y: 0, z: 0 };
      const worldCoords = engine.planToWorld(planCoords);
      
      // (0,0) in plan = (-300, 0, -200) in world (centered)
      expect(worldCoords.x).toBe(-300); // -600/2
      expect(worldCoords.y).toBe(0);    // Height unchanged
      expect(worldCoords.z).toBe(-200); // -400/2
    });

    test('should convert room center to world origin', () => {
      const planCoords: PlanCoordinates = { x: 300, y: 200, z: 90 };
      const worldCoords = engine.planToWorld(planCoords);
      
      // Room center in plan = (0, 90, 0) in world
      expect(worldCoords.x).toBe(0);   // 300 - 600/2
      expect(worldCoords.y).toBe(90);  // Height unchanged
      expect(worldCoords.z).toBe(0);   // 200 - 400/2
    });

    test('should convert opposite corner to positive world coordinates', () => {
      const planCoords: PlanCoordinates = { x: 600, y: 400, z: 240 };
      const worldCoords = engine.planToWorld(planCoords);
      
      // Opposite corner in plan = (300, 240, 200) in world
      expect(worldCoords.x).toBe(300);  // 600 - 600/2
      expect(worldCoords.y).toBe(240);  // Height unchanged
      expect(worldCoords.z).toBe(200);  // 400 - 400/2
    });
  });

  describe('World to Plan Coordinate Transformation', () => {
    test('should be inverse of planToWorld transformation', () => {
      const originalPlan: PlanCoordinates = { x: 150, y: 100, z: 85 };
      
      const world = engine.planToWorld(originalPlan);
      const backToPlan = engine.worldToPlan(world);
      
      expect(backToPlan.x).toBeCloseTo(originalPlan.x, 10);
      expect(backToPlan.y).toBeCloseTo(originalPlan.y, 10);
      expect(backToPlan.z).toBeCloseTo(originalPlan.z!, 10);
    });

    test('should handle world origin correctly', () => {
      const worldCoords: WorldCoordinates = { x: 0, y: 90, z: 0 };
      const planCoords = engine.worldToPlan(worldCoords);
      
      // World origin = room center in plan
      expect(planCoords.x).toBe(300); // 0 + 600/2
      expect(planCoords.y).toBe(200); // 0 + 400/2
      expect(planCoords.z).toBe(90);  // Height unchanged
    });
  });

  describe('Plan to Elevation Coordinate Transformation', () => {
    test('should convert to front wall elevation correctly', () => {
      const planCoords: PlanCoordinates = { x: 150, y: 50, z: 85 };
      const elevationCoords = engine.planToElevation(planCoords, 'front');
      
      expect(elevationCoords.x).toBe(150); // X position unchanged for front wall
      expect(elevationCoords.y).toBe(85);  // Height from plan Z
    });

    test('should convert to back wall elevation with mirroring', () => {
      const planCoords: PlanCoordinates = { x: 150, y: 350, z: 140 };
      const elevationCoords = engine.planToElevation(planCoords, 'back');
      
      expect(elevationCoords.x).toBe(450); // 600 - 150 (mirrored)
      expect(elevationCoords.y).toBe(140); // Height from plan Z
    });

    test('should convert to left wall elevation correctly', () => {
      const planCoords: PlanCoordinates = { x: 100, y: 150, z: 200 };
      const elevationCoords = engine.planToElevation(planCoords, 'left');
      
      expect(elevationCoords.x).toBe(250); // 400 - 150 (Y becomes mirrored X)
      expect(elevationCoords.y).toBe(200); // Height from plan Z
    });

    test('should convert to right wall elevation correctly', () => {
      const planCoords: PlanCoordinates = { x: 500, y: 150, z: 90 };
      const elevationCoords = engine.planToElevation(planCoords, 'right');
      
      expect(elevationCoords.x).toBe(150); // Y becomes X directly
      expect(elevationCoords.y).toBe(90);  // Height from plan Z
    });
  });

  describe('Elevation to Plan Coordinate Transformation', () => {
    test('should be inverse of planToElevation for front wall', () => {
      const originalPlan: PlanCoordinates = { x: 200, y: 50, z: 85 };
      
      const elevation = engine.planToElevation(originalPlan, 'front');
      const backToPlan = engine.elevationToPlan(elevation, 'front');
      
      expect(backToPlan.x).toBe(originalPlan.x);
      expect(backToPlan.y).toBe(0); // Front wall position
      expect(backToPlan.z).toBe(originalPlan.z);
    });

    test('should be inverse of planToElevation for back wall', () => {
      const originalPlan: PlanCoordinates = { x: 200, y: 350, z: 140 };
      
      const elevation = engine.planToElevation(originalPlan, 'back');
      const backToPlan = engine.elevationToPlan(elevation, 'back');
      
      expect(backToPlan.x).toBe(originalPlan.x);
      expect(backToPlan.y).toBe(400); // Back wall position
      expect(backToPlan.z).toBe(originalPlan.z);
    });
  });

  describe('Wall Position Calculations', () => {
    test('should provide correct wall positions', () => {
      const wallPositions = engine.getWallPositions();
      
      // Wall center lines (for rendering)
      expect(wallPositions.front.x).toBe(300); // Room width / 2
      expect(wallPositions.front.y).toBe(-5);  // -thickness/2
      
      expect(wallPositions.back.x).toBe(300);  // Room width / 2
      expect(wallPositions.back.y).toBe(405);  // Room height + thickness/2
      
      expect(wallPositions.left.x).toBe(-5);   // -thickness/2
      expect(wallPositions.left.y).toBe(200);  // Room height / 2
      
      expect(wallPositions.right.x).toBe(605); // Room width + thickness/2
      expect(wallPositions.right.y).toBe(200); // Room height / 2
    });

    test('should provide correct inner face positions', () => {
      const wallPositions = engine.getWallPositions();
      
      expect(wallPositions.innerFaces.front).toBe(0);   // Y = 0
      expect(wallPositions.innerFaces.back).toBe(400);  // Y = room height
      expect(wallPositions.innerFaces.left).toBe(0);    // X = 0
      expect(wallPositions.innerFaces.right).toBe(600); // X = room width
    });
  });

  describe('Coordinate Validation', () => {
    test('should validate coordinates within inner room bounds', () => {
      expect(engine.validatePlanCoordinates({ x: 0, y: 0 })).toBe(true);
      expect(engine.validatePlanCoordinates({ x: 300, y: 200 })).toBe(true);
      expect(engine.validatePlanCoordinates({ x: 600, y: 400 })).toBe(true);
    });

    test('should reject coordinates outside inner room bounds', () => {
      expect(engine.validatePlanCoordinates({ x: -10, y: 200 })).toBe(false);
      expect(engine.validatePlanCoordinates({ x: 300, y: -10 })).toBe(false);
      expect(engine.validatePlanCoordinates({ x: 610, y: 200 })).toBe(false);
      expect(engine.validatePlanCoordinates({ x: 300, y: 410 })).toBe(false);
    });
  });

  describe('Room Dimension Updates', () => {
    test('should update room dimensions correctly', () => {
      const newDimensions: RoomDimensions = {
        width: 800,
        height: 600,
        ceilingHeight: 280
      };
      
      engine.updateRoomDimensions(newDimensions);
      const config = engine.getRoomConfiguration();
      
      expect(config.innerWidth).toBe(800);
      expect(config.innerHeight).toBe(600);
      expect(config.ceilingHeight).toBe(280);
    });

    test('should maintain coordinate consistency after dimension update', () => {
      // Test coordinate before update
      const planCoords: PlanCoordinates = { x: 300, y: 200, z: 90 };
      const worldBefore = engine.planToWorld(planCoords);
      
      // Update dimensions
      engine.updateRoomDimensions({ width: 800, height: 600, ceilingHeight: 280 });
      
      // Same plan coordinates should now map to different world coordinates
      const worldAfter = engine.planToWorld(planCoords);
      
      // Center should shift due to new room size
      expect(worldAfter.x).toBe(-100); // 300 - 800/2
      expect(worldAfter.z).toBe(-100); // 200 - 600/2
      expect(worldAfter.y).toBe(90);   // Height unchanged
      
      expect(worldAfter.x).not.toBe(worldBefore.x);
      expect(worldAfter.z).not.toBe(worldBefore.z);
    });
  });

  describe('Global Instance Management', () => {
    test('should create and retrieve global instance', () => {
      clearCoordinateEngine();
      
      const engine1 = initializeCoordinateEngine(testRoomDimensions);
      const engine2 = getCoordinateEngine();
      
      expect(engine1).toBe(engine2); // Same instance
    });

    test('should throw error when getting uninitialized engine', () => {
      clearCoordinateEngine();
      
      expect(() => getCoordinateEngine()).toThrow('CoordinateTransformEngine not initialized');
    });

    test('should create new instance when providing dimensions to getCoordinateEngine', () => {
      clearCoordinateEngine();
      
      const engine = getCoordinateEngine(testRoomDimensions);
      const config = engine.getRoomConfiguration();
      
      expect(config.innerWidth).toBe(600);
      expect(config.innerHeight).toBe(400);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle zero room dimensions', () => {
      const zeroDimensions: RoomDimensions = { width: 0, height: 0 };
      const zeroEngine = new CoordinateTransformEngine(zeroDimensions);
      
      const planCoords: PlanCoordinates = { x: 0, y: 0 };
      const worldCoords = zeroEngine.planToWorld(planCoords);
      
      expect(worldCoords.x).toBe(0);
      expect(worldCoords.z).toBe(0);
    });

    test('should handle missing ceiling height', () => {
      const noCeiling: RoomDimensions = { width: 400, height: 300 };
      const engine = new CoordinateTransformEngine(noCeiling);
      const config = engine.getRoomConfiguration();
      
      expect(config.ceilingHeight).toBe(240); // Default value
    });

    test('should throw error for invalid wall type', () => {
      const planCoords: PlanCoordinates = { x: 100, y: 100, z: 50 };
      
      expect(() => {
        // @ts-ignore - Testing invalid wall type
        engine.planToElevation(planCoords, 'invalid');
      }).toThrow('Unknown wall type: invalid');
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle typical component placement', () => {
      // Place a 60cm wide cabinet at left wall, 100cm from front
      const cabinetPosition: PlanCoordinates = { x: 30, y: 100, z: 0 }; // 30cm from left wall center
      
      const worldPos = engine.planToWorld(cabinetPosition);
      const frontElevation = engine.planToElevation(cabinetPosition, 'front');
      const leftElevation = engine.planToElevation(cabinetPosition, 'left');
      
      // Should be valid placement
      expect(engine.validatePlanCoordinates(cabinetPosition)).toBe(true);
      
      // World coordinates should be negative (left side of room)
      expect(worldPos.x).toBe(-270); // 30 - 300
      expect(worldPos.z).toBe(-100); // 100 - 200
      
      // Elevation views should show correct positions
      expect(frontElevation.x).toBe(30);  // 30cm from left in front view
      expect(leftElevation.x).toBe(300);  // 400 - 100 = 300cm from front in left view
    });

    test('should handle corner component placement', () => {
      // Place corner component at top-left corner
      const cornerPosition: PlanCoordinates = { x: 0, y: 0, z: 0 };
      
      expect(engine.validatePlanCoordinates(cornerPosition)).toBe(true);
      
      const worldPos = engine.planToWorld(cornerPosition);
      expect(worldPos.x).toBe(-300); // Far left in world
      expect(worldPos.z).toBe(-200); // Far front in world
    });

    test('should handle wall-mounted component height', () => {
      // Wall cabinet at 140cm height
      const wallCabinet: PlanCoordinates = { x: 200, y: 50, z: 140 };
      
      const frontElevation = engine.planToElevation(wallCabinet, 'front');
      expect(frontElevation.y).toBe(140); // Height preserved in elevation
      
      const worldPos = engine.planToWorld(wallCabinet);
      expect(worldPos.y).toBe(140); // Height preserved in world
    });
  });
});
