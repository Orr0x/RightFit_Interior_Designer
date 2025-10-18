/**
 * Elevation view render handlers for database-driven 2D rendering
 * Date: 2025-10-09
 * Related: docs/session-2025-10-09-2d-database-migration/04-LEGACY-CODE-ARCHIVE.md
 *
 * Corner Cabinet Logic: Option C (Hybrid) - Database flags + code algorithm
 * Preserved from: docs/session-2025-10-09-2d-database-migration/CORNER-UNIT-DOOR-LOGIC-PRESERVATION.md
 */

import type {
  DesignElement,
  StandardCabinetData,
  ApplianceData,
  SinkElevationData,
  OpenShelfData,
  RoomDimensions
} from '@/types/render2d';

// =====================================================
// Standard Cabinet Handler (with doors, handles, toe kick)
// =====================================================

export function renderStandardCabinet(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: StandardCabinetData,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  roomDimensions?: RoomDimensions,
  currentView?: string
): void {
  // Configuration with defaults
  const doorCount = data.door_count ?? 2;
  const doorStyle = data.door_style ?? 'flat';
  const handleStyle = data.handle_style ?? 'bar';
  const handlePosition = data.handle_position ?? 'center';

  // ✨ FIX: Toe kicks only for base cabinets (floor-mounted)
  // Wall cabinets have Z > 100cm, so they shouldn't show toe kicks
  const isWallMounted = (element.z && element.z > 100) || false;
  const hasToeKick = isWallMounted ? false : (data.has_toe_kick ?? false);

  const toeKickHeight = (data.toe_kick_height ?? 10) * zoom;
  const drawerCount = data.drawer_count ?? 0;
  const drawerHeights = data.drawer_heights ?? [];

  // Corner cabinet detection (Option C - Hybrid)
  const isCorner = data.is_corner ?? element.component_id?.includes('corner') ?? false;

  // If this is a corner cabinet and we have room dimensions, use special rendering
  if (isCorner && roomDimensions) {
    renderCornerCabinetDoors(
      ctx,
      element,
      data,
      x,
      y,
      width,
      height,
      zoom,
      roomDimensions,
      currentView,
      hasToeKick,
      toeKickHeight
    );
    return;
  }

  // Save current fill style
  const currentFillStyle = ctx.fillStyle;

  // Colors
  const cabinetColor = '#8b4513'; // Saddle brown
  const doorColor = '#d2b48c';    // Tan
  const handleColor = '#808080';  // Gray
  const toeKickColor = '#1a1a1a'; // Near black

  // Draw cabinet body
  ctx.fillStyle = cabinetColor;
  ctx.fillRect(x, y, width, height);

  // Draw toe kick (if applicable - base cabinets only)
  if (hasToeKick && toeKickHeight > 0) {
    ctx.fillStyle = toeKickColor;
    ctx.fillRect(x, y + height - toeKickHeight, width, toeKickHeight);
  }

  // Calculate drawable area (excluding toe kick)
  const drawableHeight = hasToeKick ? height - toeKickHeight : height;
  const drawableY = y;

  // Door/drawer configuration
  const doorInset = 2 * zoom;
  const doorGap = 2 * zoom;
  const handleWidth = 2 * zoom;
  const handleHeight = 10 * zoom;

  // Draw drawers (if any) at top
  if (drawerCount > 0) {
    let currentY = drawableY + doorInset;

    for (let i = 0; i < drawerCount; i++) {
      const drawerHeight = drawerHeights[i]
        ? drawerHeights[i] * zoom
        : drawableHeight / (drawerCount + doorCount) - doorInset;

      // Drawer front
      ctx.fillStyle = doorColor;
      ctx.fillRect(
        x + doorInset,
        currentY,
        width - doorInset * 2,
        drawerHeight
      );

      // Drawer handle (centered horizontally, vertically on drawer)
      if (handleStyle !== 'none') {
        ctx.fillStyle = handleColor;
        const handleX = x + width / 2 - handleWidth / 2;
        const handleY = currentY + drawerHeight / 2 - handleHeight / 2;
        ctx.fillRect(handleX, handleY, handleWidth, handleHeight);
      }

      currentY += drawerHeight + doorGap;
    }
  }

  // Calculate door area (remaining space after drawers)
  const doorStartY = drawerCount > 0
    ? drawableY + doorInset + drawerCount * (drawableHeight / (drawerCount + doorCount))
    : drawableY + doorInset;
  const doorAreaHeight = drawableHeight - (doorStartY - drawableY) - doorInset;

  // Draw doors
  if (doorCount > 0) {
    const doorWidth = (width - doorInset * 2 - doorGap * (doorCount - 1)) / doorCount;

    for (let i = 0; i < doorCount; i++) {
      const doorX = x + doorInset + i * (doorWidth + doorGap);

      // Door panel
      ctx.fillStyle = doorColor;
      ctx.fillRect(doorX, doorStartY, doorWidth, doorAreaHeight);

      // Door handle (position based on configuration)
      if (handleStyle !== 'none') {
        ctx.fillStyle = handleColor;

        let handleY: number;
        switch (handlePosition) {
          case 'top':
            handleY = doorStartY + handleHeight;
            break;
          case 'bottom':
            handleY = doorStartY + doorAreaHeight - handleHeight * 2;
            break;
          case 'center':
          default:
            handleY = doorStartY + doorAreaHeight / 2 - handleHeight / 2;
            break;
        }

        // Handle position: left edge for first door, right edge for others
        const handleX = i === 0
          ? doorX + doorWidth - handleWidth - 2
          : doorX + 2;

        if (handleStyle === 'bar') {
          ctx.fillRect(handleX, handleY, handleWidth, handleHeight);
        } else if (handleStyle === 'knob') {
          ctx.beginPath();
          ctx.arc(handleX + handleWidth / 2, handleY + handleHeight / 2, handleWidth, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Door frame detail (for shaker style)
      if (doorStyle === 'shaker') {
        const currentStrokeStyle = ctx.strokeStyle;
        const currentLineWidth = ctx.lineWidth;

        ctx.strokeStyle = '#a0826d'; // Darker brown
        ctx.lineWidth = 1;
        ctx.strokeRect(
          doorX + 3,
          doorStartY + 3,
          doorWidth - 6,
          doorAreaHeight - 6
        );

        ctx.strokeStyle = currentStrokeStyle;
        ctx.lineWidth = currentLineWidth;
      }

      // Glass effect (for glass doors)
      if (doorStyle === 'glass') {
        ctx.fillStyle = 'rgba(173, 216, 230, 0.3)'; // Light blue transparent
        ctx.fillRect(
          doorX + 4,
          doorStartY + 4,
          doorWidth - 8,
          doorAreaHeight - 8
        );
      }
    }
  }

  // Restore fill style
  ctx.fillStyle = currentFillStyle;
}

// =====================================================
// Appliance Handler
// =====================================================

export function renderAppliance(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: ApplianceData,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  roomDimensions?: RoomDimensions,
  currentView?: string
): void {
  // Configuration with defaults
  const panelStyle = data.panel_style ?? 'integrated';
  const hasDisplay = data.has_display ?? false;
  const hasHandle = data.has_handle ?? true;

  // Save current fill style
  const currentFillStyle = ctx.fillStyle;

  // Appliance color (metallic gray)
  const applianceColor = '#808080';
  const panelColor = panelStyle === 'integrated' ? '#d2b48c' : '#a0a0a0';
  const handleColor = '#404040';

  // Draw appliance body
  ctx.fillStyle = applianceColor;
  ctx.fillRect(x, y, width, height);

  // Draw panel (if integrated, matches cabinet style)
  if (panelStyle === 'integrated') {
    ctx.fillStyle = panelColor;
    const panelInset = 2 * zoom;
    ctx.fillRect(
      x + panelInset,
      y + panelInset,
      width - panelInset * 2,
      height - panelInset * 2
    );
  }

  // Draw handle (if enabled)
  if (hasHandle) {
    ctx.fillStyle = handleColor;
    const handleWidth = 2 * zoom;
    const handleHeight = height * 0.4;
    const handleX = x + width - 4 * zoom;
    const handleY = y + height * 0.3;

    ctx.fillRect(handleX, handleY, handleWidth, handleHeight);
  }

  // Draw display (if enabled - for fridges, ovens)
  if (hasDisplay) {
    ctx.fillStyle = '#1a1a1a'; // Dark screen
    const displayWidth = width * 0.6;
    const displayHeight = height * 0.1;
    const displayX = x + width * 0.2;
    const displayY = y + height * 0.1;

    ctx.fillRect(displayX, displayY, displayWidth, displayHeight);

    // Screen highlight
    ctx.fillStyle = '#00ff00'; // Green digital display
    ctx.fillRect(
      displayX + 2,
      displayY + 2,
      displayWidth * 0.3,
      displayHeight - 4
    );
  }

  // Restore fill style
  ctx.fillStyle = currentFillStyle;
}

// =====================================================
// Sink Elevation Handler
// =====================================================

export function renderSinkElevation(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: SinkElevationData,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  roomDimensions?: RoomDimensions,
  currentView?: string
): void {
  // Configuration with defaults
  const hasFrontPanel = data.has_front_panel ?? false;
  const panelHeight = (data.panel_height ?? 10) * zoom;
  const panelStyle = data.panel_style ?? 'under-mount';

  // Save current fill style
  const currentFillStyle = ctx.fillStyle;

  // Detect sink material from component_id
  const isCeramic = element.component_id?.includes('butler') ||
                    element.component_id?.includes('ceramic');
  const sinkColor = isCeramic ? '#FFFFFF' : '#C0C0C0';
  const panelColor = '#8b4513'; // Cabinet color

  if (panelStyle === 'exposed' && hasFrontPanel) {
    // Farmhouse sink - exposed front panel
    ctx.fillStyle = sinkColor;
    ctx.fillRect(x, y + height - panelHeight, width, panelHeight);

    // Add panel texture (horizontal lines)
    const currentStrokeStyle = ctx.strokeStyle;
    const currentLineWidth = ctx.lineWidth;

    ctx.strokeStyle = isCeramic ? '#E0E0E0' : '#B0B0B0';
    ctx.lineWidth = 1;

    for (let i = 1; i < 4; i++) {
      const lineY = y + height - panelHeight + (panelHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x + width, lineY);
      ctx.stroke();
    }

    ctx.strokeStyle = currentStrokeStyle;
    ctx.lineWidth = currentLineWidth;
  } else {
    // Under-mount sink - only visible as cabinet panel
    ctx.fillStyle = panelColor;
    ctx.fillRect(x, y, width, height);

    // Toe kick
    const toeKickHeight = 10 * zoom;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y + height - toeKickHeight, width, toeKickHeight);
  }

  // Restore fill style
  ctx.fillStyle = currentFillStyle;
}

// =====================================================
// Open Shelf Handler
// =====================================================

export function renderOpenShelf(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: OpenShelfData,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  roomDimensions?: RoomDimensions,
  currentView?: string
): void {
  // Configuration with defaults
  const shelfCount = data.shelf_count ?? 3;
  const shelfSpacing = data.shelf_spacing ?? 'equal';

  // Save current styles
  const currentFillStyle = ctx.fillStyle;
  const currentStrokeStyle = ctx.strokeStyle;
  const currentLineWidth = ctx.lineWidth;

  // Colors
  const shelfColor = '#8b4513';
  const frameColor = '#6b4513';

  // Draw frame (sides and back)
  ctx.fillStyle = frameColor;
  const frameWidth = 2 * zoom;

  // Left side
  ctx.fillRect(x, y, frameWidth, height);
  // Right side
  ctx.fillRect(x + width - frameWidth, y, frameWidth, height);
  // Back panel (lighter)
  ctx.fillStyle = 'rgba(139, 69, 19, 0.3)'; // Transparent brown
  ctx.fillRect(x + frameWidth, y, width - frameWidth * 2, height);

  // Draw shelves
  ctx.fillStyle = shelfColor;
  const shelfThickness = 2 * zoom;
  const shelfWidth = width - frameWidth * 2;

  if (shelfSpacing === 'equal') {
    // Equal spacing between shelves
    const spacing = height / (shelfCount + 1);

    for (let i = 1; i <= shelfCount; i++) {
      const shelfY = y + spacing * i - shelfThickness / 2;
      ctx.fillRect(x + frameWidth, shelfY, shelfWidth, shelfThickness);

      // Shelf edge shadow
      ctx.fillStyle = '#5b3513';
      ctx.fillRect(x + frameWidth, shelfY + shelfThickness, shelfWidth, 1);
      ctx.fillStyle = shelfColor;
    }
  } else {
    // Varied spacing (more space at bottom)
    const totalSpacing = height - shelfCount * shelfThickness;
    let currentY = y;

    for (let i = 0; i < shelfCount; i++) {
      const spacingRatio = (i + 1) / (shelfCount + 1);
      const spacing = totalSpacing * spacingRatio / shelfCount;
      currentY += spacing;

      ctx.fillRect(x + frameWidth, currentY, shelfWidth, shelfThickness);

      // Shelf edge shadow
      ctx.fillStyle = '#5b3513';
      ctx.fillRect(x + frameWidth, currentY + shelfThickness, shelfWidth, 1);
      ctx.fillStyle = shelfColor;

      currentY += shelfThickness;
    }
  }

  // Draw frame outline
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Restore styles
  ctx.fillStyle = currentFillStyle;
  ctx.strokeStyle = currentStrokeStyle;
  ctx.lineWidth = currentLineWidth;
}

// =====================================================
// Corner Cabinet Door Rendering (Option C - Hybrid)
// =====================================================

/**
 * Render corner cabinet with proper door positioning
 * Preserved from legacy code - shows 1 door + 1 side panel instead of 2 doors
 *
 * Algorithm:
 * 1. Detect corner position (front-left, front-right, back-left, back-right)
 * 2. Determine door side based on:
 *    - Manual override (element.cornerDoorSide or data.corner_door_side)
 *    - Auto-detect using room centerline
 * 3. Render door (with handle) and side panel (no handle, lighter color)
 */
function renderCornerCabinetDoors(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: StandardCabinetData,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  roomDimensions: RoomDimensions,
  currentView: string | undefined,
  hasToeKick: boolean,
  toeKickHeight: number
): void {
  // Save current styles
  const currentFillStyle = ctx.fillStyle;

  // Colors
  const cabinetColor = '#8b4513'; // Saddle brown
  const doorColor = '#d2b48c';    // Tan (standard door color)
  const panelColor = '#c9b896';   // Lighter tan (side panel - NO handle)
  const handleColor = '#808080';  // Gray
  const toeKickColor = '#1a1a1a'; // Near black

  // Draw cabinet body
  ctx.fillStyle = cabinetColor;
  ctx.fillRect(x, y, width, height);

  // Draw toe kick (if applicable - base cabinets only)
  if (hasToeKick && toeKickHeight > 0) {
    ctx.fillStyle = toeKickColor;
    ctx.fillRect(x, y + height - toeKickHeight, width, toeKickHeight);
  }

  // Calculate drawable area (excluding toe kick)
  const drawableHeight = hasToeKick ? height - toeKickHeight : height;
  const drawableY = y;

  // Door configuration
  const doorInset = 2 * zoom;
  const doorGap = 2 * zoom;
  const handleWidth = 2 * zoom;
  const handleHeight = 10 * zoom;

  // Determine door side (3-tier priority system)
  let doorSide: 'left' | 'right' = 'left';

  // Priority 1: Manual override from element or database
  const manualOverride = element.cornerDoorSide ?? data.corner_door_side;
  if (manualOverride && manualOverride !== 'auto') {
    doorSide = manualOverride;
  } else {
    // Priority 2: Auto-detect based on corner position using centerline algorithm
    const roomCenterX = roomDimensions.width / 2;
    const roomCenterY = roomDimensions.height / 2;

    // Detect which corner this cabinet is in
    const tolerance = 30; // cm tolerance for corner detection
    let cornerPosition: 'front-left' | 'front-right' | 'back-left' | 'back-right' | null = null;

    if (element.x <= tolerance && element.y <= tolerance) {
      cornerPosition = 'front-left';
    } else if (element.x >= roomDimensions.width - width / zoom - tolerance && element.y <= tolerance) {
      cornerPosition = 'front-right';
    } else if (element.x <= tolerance && element.y >= roomDimensions.height - height / zoom - tolerance) {
      cornerPosition = 'back-left';
    } else if (element.x >= roomDimensions.width - width / zoom - tolerance &&
               element.y >= roomDimensions.height - height / zoom - tolerance) {
      cornerPosition = 'back-right';
    }

    // Door placement rules based on corner position AND current elevation view
    // Different logic for each view because we're looking at different walls
    // NOTE: Back view is correct, others were inverted - now fixed

    if (cornerPosition) {
      if (currentView === 'front') {
        // Front view: looking at front wall (Y=0) - INVERTED (same as back)
        // Front-left: door on RIGHT | Front-right: door on LEFT
        doorSide = (cornerPosition === 'front-left') ? 'right' : 'left';

      } else if (currentView === 'back') {
        // Back view: looking at back wall (Y=max) - CORRECT ✅
        // Back-left: door on RIGHT | Back-right: door on LEFT
        doorSide = (cornerPosition === 'back-left') ? 'right' : 'left';

      } else if (currentView === 'left') {
        // Left view: looking at left wall (X=0) - INVERTED
        // Front-left: door on LEFT | Back-left: door on RIGHT
        doorSide = (cornerPosition === 'front-left') ? 'left' : 'right';

      } else if (currentView === 'right') {
        // Right view: looking at right wall (X=max) - INVERTED
        // Front-right: door on RIGHT | Back-right: door on LEFT
        doorSide = (cornerPosition === 'front-right') ? 'right' : 'left';

      } else {
        // Fallback for undefined view
        doorSide = 'left';
      }
    }
  }

  // Calculate door and panel widths (50% each)
  const doorWidth = (width - doorInset * 2 - doorGap) / 2;
  const panelWidth = (width - doorInset * 2 - doorGap) / 2;

  // Render based on door side
  if (doorSide === 'left') {
    // Door on left, panel on right
    const doorX = x + doorInset;
    const panelX = x + doorInset + doorWidth + doorGap;

    // Draw door
    ctx.fillStyle = doorColor;
    ctx.fillRect(doorX, drawableY + doorInset, doorWidth, drawableHeight - doorInset * 2);

    // Draw door handle (on right edge of door)
    if (data.handle_style !== 'none') {
      ctx.fillStyle = handleColor;
      const handleX = doorX + doorWidth - handleWidth - 2;
      const handleY = drawableY + drawableHeight / 2 - handleHeight / 2;

      if (data.handle_style === 'knob') {
        ctx.beginPath();
        ctx.arc(handleX + handleWidth / 2, handleY + handleHeight / 2, handleWidth, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillRect(handleX, handleY, handleWidth, handleHeight);
      }
    }

    // Draw side panel (lighter color, NO handle)
    ctx.fillStyle = panelColor;
    ctx.fillRect(panelX, drawableY + doorInset, panelWidth, drawableHeight - doorInset * 2);

  } else {
    // Door on right, panel on left
    const panelX = x + doorInset;
    const doorX = x + doorInset + panelWidth + doorGap;

    // Draw side panel (lighter color, NO handle)
    ctx.fillStyle = panelColor;
    ctx.fillRect(panelX, drawableY + doorInset, panelWidth, drawableHeight - doorInset * 2);

    // Draw door
    ctx.fillStyle = doorColor;
    ctx.fillRect(doorX, drawableY + doorInset, doorWidth, drawableHeight - doorInset * 2);

    // Draw door handle (on left edge of door)
    if (data.handle_style !== 'none') {
      ctx.fillStyle = handleColor;
      const handleX = doorX + 2;
      const handleY = drawableY + drawableHeight / 2 - handleHeight / 2;

      if (data.handle_style === 'knob') {
        ctx.beginPath();
        ctx.arc(handleX + handleWidth / 2, handleY + handleHeight / 2, handleWidth, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillRect(handleX, handleY, handleWidth, handleHeight);
      }
    }
  }

  // Add shaker style frame if applicable
  if (data.door_style === 'shaker') {
    const currentStrokeStyle = ctx.strokeStyle;
    const currentLineWidth = ctx.lineWidth;

    ctx.strokeStyle = '#a0826d'; // Darker brown
    ctx.lineWidth = 1;

    // Frame on door
    const doorX = doorSide === 'left' ? x + doorInset : x + doorInset + panelWidth + doorGap;
    ctx.strokeRect(
      doorX + 3,
      drawableY + doorInset + 3,
      doorWidth - 6,
      drawableHeight - doorInset * 2 - 6
    );

    ctx.strokeStyle = currentStrokeStyle;
    ctx.lineWidth = currentLineWidth;
  }

  // Restore fill style
  ctx.fillStyle = currentFillStyle;
}

// =====================================================
// Custom SVG Handler (for future use)
// =====================================================

export function renderCustomSVGElevation(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  svgPath: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  roomDimensions?: RoomDimensions,
  currentView?: string
): void {
  try {
    ctx.save();
    ctx.translate(x, y);

    const path = new Path2D(svgPath);
    ctx.fill(path);

    ctx.restore();
  } catch (error) {
    console.error('[ElevationViewHandlers] Error rendering custom SVG:', error);
    // Fallback to standard cabinet
    renderStandardCabinet(ctx, element, {}, x, y, width, height, zoom);
  }
}
