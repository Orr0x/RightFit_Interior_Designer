/**
 * Coordinate System Demo & Validation
 * Demonstrates the new unified coordinate system in action
 */

import { 
  CoordinateTransformEngine,
  initializeCoordinateEngine,
  PlanCoordinates,
  WorldCoordinates,
  ElevationCoordinates
} from '@/services/CoordinateTransformEngine';
import { RoomDimensions } from '@/types/project';
import { Logger } from '@/utils/Logger';

export interface CoordinateTestResult {
  testName: string;
  passed: boolean;
  details: string;
  input: any;
  output: any;
  expected?: any;
}

/**
 * Run comprehensive coordinate system validation
 */
export const runCoordinateSystemTests = (roomDimensions: RoomDimensions): CoordinateTestResult[] => {
  const results: CoordinateTestResult[] = [];
  
  Logger.debug('🧪 [CoordinateDemo] Starting coordinate system validation...');
  Logger.debug('📐 [CoordinateDemo] Room dimensions (inner usable space):', roomDimensions);
  
  // Initialize the coordinate engine
  const engine = initializeCoordinateEngine(roomDimensions);
  const config = engine.getRoomConfiguration();
  
  // Test 1: Verify inner room bounds
  const bounds = engine.getInnerRoomBounds();
  results.push({
    testName: 'Inner Room Bounds',
    passed: bounds.width === roomDimensions.width && bounds.height === roomDimensions.height,
    details: 'Room bounds should match input dimensions exactly',
    input: roomDimensions,
    output: bounds,
    expected: { width: roomDimensions.width, height: roomDimensions.height }
  });
  
  // Test 2: Corner coordinate transformations
  const corners = [
    { name: 'Top-Left', plan: { x: 0, y: 0, z: 0 } },
    { name: 'Top-Right', plan: { x: roomDimensions.width, y: 0, z: 0 } },
    { name: 'Bottom-Left', plan: { x: 0, y: roomDimensions.height, z: 0 } },
    { name: 'Bottom-Right', plan: { x: roomDimensions.width, y: roomDimensions.height, z: 0 } }
  ];
  
  corners.forEach(corner => {
    const world = engine.planToWorld(corner.plan);
    const backToPlan = engine.worldToPlan(world);
    
    const roundTripAccurate = 
      Math.abs(backToPlan.x - corner.plan.x) < 0.001 &&
      Math.abs(backToPlan.y - corner.plan.y) < 0.001 &&
      Math.abs(backToPlan.z! - corner.plan.z!) < 0.001;
    
    results.push({
      testName: `${corner.name} Corner Round-trip`,
      passed: roundTripAccurate,
      details: 'Plan -> World -> Plan should return to original coordinates',
      input: corner.plan,
      output: { world, backToPlan },
      expected: corner.plan
    });
  });
  
  // Test 3: Room center should map to world origin
  const roomCenter: PlanCoordinates = {
    x: roomDimensions.width / 2,
    y: roomDimensions.height / 2,
    z: 90
  };
  const centerWorld = engine.planToWorld(roomCenter);
  const centerIsOrigin = 
    Math.abs(centerWorld.x) < 0.001 && 
    Math.abs(centerWorld.z) < 0.001 && 
    centerWorld.y === 90;
  
  results.push({
    testName: 'Room Center to World Origin',
    passed: centerIsOrigin,
    details: 'Room center should map to world coordinates (0, height, 0)',
    input: roomCenter,
    output: centerWorld,
    expected: { x: 0, y: 90, z: 0 }
  });
  
  // Test 4: Elevation view transformations
  const testPoint: PlanCoordinates = { x: 150, y: 100, z: 85 };
  const elevations = {
    front: engine.planToElevation(testPoint, 'front'),
    back: engine.planToElevation(testPoint, 'back'),
    left: engine.planToElevation(testPoint, 'left'),
    right: engine.planToElevation(testPoint, 'right')
  };
  
  // Front elevation should preserve X, use Z for height
  const frontCorrect = elevations.front.x === 150 && elevations.front.y === 85;
  results.push({
    testName: 'Front Elevation Transformation',
    passed: frontCorrect,
    details: 'Front elevation should preserve X coordinate and use Z for height',
    input: testPoint,
    output: elevations.front,
    expected: { x: 150, y: 85 }
  });
  
  // Test 5: Wall position calculations
  const wallPositions = engine.getWallPositions();
  const wallsCorrect = 
    wallPositions.innerFaces.front === 0 &&
    wallPositions.innerFaces.back === roomDimensions.height &&
    wallPositions.innerFaces.left === 0 &&
    wallPositions.innerFaces.right === roomDimensions.width;
  
  results.push({
    testName: 'Wall Inner Face Positions',
    passed: wallsCorrect,
    details: 'Wall inner faces should match room boundaries',
    input: roomDimensions,
    output: wallPositions.innerFaces,
    expected: {
      front: 0,
      back: roomDimensions.height,
      left: 0,
      right: roomDimensions.width
    }
  });
  
  // Test 6: Coordinate validation
  const validCoords = [
    { x: 0, y: 0 },
    { x: roomDimensions.width / 2, y: roomDimensions.height / 2 },
    { x: roomDimensions.width, y: roomDimensions.height }
  ];
  
  const invalidCoords = [
    { x: -10, y: 100 },
    { x: 100, y: -10 },
    { x: roomDimensions.width + 10, y: 100 },
    { x: 100, y: roomDimensions.height + 10 }
  ];
  
  const validationCorrect = 
    validCoords.every(coord => engine.validatePlanCoordinates(coord)) &&
    invalidCoords.every(coord => !engine.validatePlanCoordinates(coord));
  
  results.push({
    testName: 'Coordinate Validation',
    passed: validationCorrect,
    details: 'Should correctly identify valid vs invalid coordinates',
    input: { valid: validCoords, invalid: invalidCoords },
    output: {
      validResults: validCoords.map(c => engine.validatePlanCoordinates(c)),
      invalidResults: invalidCoords.map(c => engine.validatePlanCoordinates(c))
    }
  });
  
  // Summary
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  Logger.debug(`✅ [CoordinateDemo] Tests completed: ${passedCount}/${totalCount} passed`);
  
  if (passedCount === totalCount) {
    Logger.debug('🎉 [CoordinateDemo] All coordinate system tests PASSED!');
    Logger.debug('✨ [CoordinateDemo] The unified coordinate system is working correctly');
  } else {
    Logger.warn('⚠️ [CoordinateDemo] Some tests FAILED - coordinate system needs attention');
    results.filter(r => !r.passed).forEach(result => {
      Logger.error(`❌ [CoordinateDemo] FAILED: ${result.testName} - ${result.details}`);
    });
  }
  
  return results;
};

/**
 * Demonstrate coordinate system usage with real-world examples
 */
export const demonstrateCoordinateSystem = (roomDimensions: RoomDimensions): void => {
  Logger.debug('\n🎯 [CoordinateDemo] Real-world coordinate system demonstration');
  
  const engine = initializeCoordinateEngine(roomDimensions);
  
  // Example 1: Kitchen cabinet placement
  Logger.debug('\n📦 Example 1: Kitchen Cabinet Placement');
  const cabinetPosition: PlanCoordinates = { x: 60, y: 50, z: 0 }; // 60cm wide cabinet, 5cm from front wall
  
  Logger.debug('  Plan coordinates (inner room space):', cabinetPosition);
  Logger.debug('  World coordinates (3D scene):', engine.planToWorld(cabinetPosition));
  Logger.debug('  Front elevation view:', engine.planToElevation(cabinetPosition, 'front'));
  Logger.debug('  Left elevation view:', engine.planToElevation(cabinetPosition, 'left'));
  Logger.debug('  Valid placement?', engine.validatePlanCoordinates(cabinetPosition));
  
  // Example 2: Corner unit placement
  Logger.debug('\n🔲 Example 2: Corner Unit Placement');
  const cornerPosition: PlanCoordinates = { x: 0, y: 0, z: 0 }; // Top-left corner
  
  Logger.debug('  Plan coordinates (corner):', cornerPosition);
  Logger.debug('  World coordinates (3D scene):', engine.planToWorld(cornerPosition));
  Logger.debug('  All elevation views:');
  Logger.debug('    Front:', engine.planToElevation(cornerPosition, 'front'));
  Logger.debug('    Back:', engine.planToElevation(cornerPosition, 'back'));
  Logger.debug('    Left:', engine.planToElevation(cornerPosition, 'left'));
  Logger.debug('    Right:', engine.planToElevation(cornerPosition, 'right'));
  
  // Example 3: Wall-mounted component
  Logger.debug('\n🏠 Example 3: Wall-Mounted Component');
  const wallCabinetPosition: PlanCoordinates = { x: 200, y: 30, z: 140 }; // Wall cabinet at 140cm height
  
  Logger.debug('  Plan coordinates (with height):', wallCabinetPosition);
  Logger.debug('  World coordinates (3D scene):', engine.planToWorld(wallCabinetPosition));
  Logger.debug('  Front elevation (shows height):', engine.planToElevation(wallCabinetPosition, 'front'));
  
  // Example 4: Room boundaries
  Logger.debug('\n🏠 Example 4: Room Boundary Information');
  const bounds = engine.getInnerRoomBounds();
  const wallPositions = engine.getWallPositions();
  
  Logger.debug('  Inner room bounds (usable space):', bounds);
  Logger.debug('  Wall inner faces (component boundaries):', wallPositions.innerFaces);
  Logger.debug('  Wall center lines (for rendering):', {
    front: wallPositions.front,
    back: wallPositions.back,
    left: wallPositions.left,
    right: wallPositions.right
  });
};

/**
 * Test coordinate system with current room dimensions
 */
export const testCurrentCoordinateSystem = (design: any): CoordinateTestResult[] => {
  if (!design?.roomDimensions) {
    Logger.error('❌ [CoordinateDemo] No room dimensions available for testing');
    return [];
  }
  
  Logger.debug('🧪 [CoordinateDemo] Testing coordinate system with current room...');
  const results = runCoordinateSystemTests(design.roomDimensions);
  
  // Also run the demonstration
  demonstrateCoordinateSystem(design.roomDimensions);
  
  return results;
};
