/**
 * Plan view render handlers for database-driven 2D rendering
 * Date: 2025-10-09
 * Related: docs/session-2025-10-09-2d-database-migration/04-LEGACY-CODE-ARCHIVE.md
 */

import type {
  DesignElement,
  RectangleData,
  CornerSquareData,
  SinkSingleData,
  SinkDoubleData,
  SinkCornerData
} from '@/types/render2d';

// =====================================================
// Rectangle Handler (Standard Components)
// =====================================================

export function renderRectangle(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: RectangleData,
  zoom: number
): void {
  const width = element.width * zoom;
  const depth = (element.depth || element.height) * zoom;

  ctx.fillRect(0, 0, width, depth);
}

// =====================================================
// Corner Square Handler (L-shaped Components)
// =====================================================

export function renderCornerSquare(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: CornerSquareData,
  zoom: number
): void {
  const size = Math.min(element.width, element.depth || element.height) * zoom;

  ctx.fillRect(0, 0, size, size);
}

// =====================================================
// Single Bowl Sink Handler
// =====================================================

export function renderSinkSingle(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: SinkSingleData,
  zoom: number
): void {
  const width = element.width * zoom;
  const depth = (element.depth || element.height) * zoom;

  // Configuration with defaults
  const bowlInsetRatio = data.bowl_inset_ratio ?? 0.15;
  const bowlDepthRatio = data.bowl_depth_ratio ?? 0.8;
  const bowlStyle = data.bowl_style ?? 'stainless';
  const hasDrain = data.has_drain ?? true;
  const hasFaucetHole = data.has_faucet_hole ?? true;
  const faucetHolePosition = data.faucet_hole_position ?? 0.2;
  const hasDrainingBoard = data.has_draining_board ?? false;

  // Colors based on material
  const sinkColor = bowlStyle === 'ceramic' ? '#FFFFFF' : '#C0C0C0';
  const rimColor = bowlStyle === 'ceramic' ? '#F8F8F8' : '#B0B0B0';

  // Draw sink rim (outer edge)
  const currentFillStyle = ctx.fillStyle; // Save current fill
  ctx.fillStyle = rimColor;
  ctx.fillRect(0, 0, width, depth);

  // Add subtle rim highlight (top and left edges)
  ctx.fillStyle = bowlStyle === 'ceramic' ? '#FFFFFF' : '#E0E0E0';
  ctx.fillRect(0, 0, width, depth * 0.1); // Top edge highlight
  ctx.fillRect(0, 0, width * 0.1, depth); // Left edge highlight

  // Draw main bowl with ellipse shape
  ctx.fillStyle = sinkColor;
  const bowlX = width * bowlInsetRatio;
  const bowlY = depth * bowlInsetRatio;
  const bowlWidth = width * (1 - 2 * bowlInsetRatio);
  const bowlDepth = depth * bowlDepthRatio;

  ctx.beginPath();
  ctx.ellipse(
    bowlX + bowlWidth / 2,
    bowlY + bowlDepth / 2,
    (bowlWidth / 2) * 0.9,  // 90% radius for more realistic shape
    (bowlDepth / 2) * 0.95, // 95% radius for depth
    0, 0, 2 * Math.PI
  );
  ctx.fill();

  // Bowl inner shadow/highlight (gives depth appearance)
  ctx.fillStyle = bowlStyle === 'ceramic' ? '#F0F0F0' : '#D0D0D0';
  ctx.beginPath();
  ctx.ellipse(
    bowlX + bowlWidth / 2,
    bowlY + bowlDepth / 2 - bowlDepth * 0.1, // Offset upward
    (bowlWidth / 2) * 0.7,  // Smaller inner ellipse
    (bowlDepth / 2) * 0.3,
    0, 0, 2 * Math.PI
  );
  ctx.fill();

  // Draw drain hole (if enabled)
  if (hasDrain) {
    ctx.fillStyle = '#2F2F2F';
    const drainSize = Math.min(width, depth) * 0.1;
    const drainX = width / 2;
    const drainY = depth / 2;

    ctx.beginPath();
    ctx.arc(drainX, drainY, drainSize / 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw faucet mounting hole (if enabled)
  if (hasFaucetHole) {
    ctx.fillStyle = '#2F2F2F';
    const holeSize = Math.min(width, depth) * 0.03;
    const holeX = width * 0.5;
    const holeY = depth * faucetHolePosition;

    ctx.beginPath();
    ctx.arc(holeX, holeY, holeSize / 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw draining board (if enabled)
  if (hasDrainingBoard) {
    // Main draining board surface
    ctx.fillStyle = rimColor;
    ctx.fillRect(width * 0.05, depth * 0.65, width * 0.9, depth * 0.3);

    // Draining board highlight (top edge)
    ctx.fillStyle = bowlStyle === 'ceramic' ? '#FFFFFF' : '#E8E8E8';
    ctx.fillRect(width * 0.05, depth * 0.65, width * 0.9, depth * 0.05);

    // Draw draining board grooves (10 vertical lines)
    const currentStroke = ctx.strokeStyle;
    const currentLineWidth = ctx.lineWidth;

    ctx.strokeStyle = bowlStyle === 'ceramic' ? '#E0E0E0' : '#D0D0D0';
    ctx.lineWidth = 1;

    for (let i = 0; i < 10; i++) {
      const x = width * 0.05 + (i + 0.5) * (width * 0.9) / 10;

      ctx.beginPath();
      ctx.moveTo(x, depth * 0.65);
      ctx.lineTo(x, depth * 0.95);
      ctx.stroke();

      // Add subtle shadow to grooves (offset by 0.5px)
      ctx.strokeStyle = bowlStyle === 'ceramic' ? '#D0D0D0' : '#C0C0C0';
      ctx.beginPath();
      ctx.moveTo(x + 0.5, depth * 0.65);
      ctx.lineTo(x + 0.5, depth * 0.95);
      ctx.stroke();

      // Reset for next groove
      ctx.strokeStyle = bowlStyle === 'ceramic' ? '#E0E0E0' : '#D0D0D0';
    }

    // Restore stroke style
    ctx.strokeStyle = currentStroke;
    ctx.lineWidth = currentLineWidth;
  }

  // Restore fill style
  ctx.fillStyle = currentFillStyle;
}

// =====================================================
// Double Bowl Sink Handler
// =====================================================

export function renderSinkDouble(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: SinkDoubleData,
  zoom: number
): void {
  const width = element.width * zoom;
  const depth = (element.depth || element.height) * zoom;

  // Configuration with defaults
  const bowlInsetRatio = data.bowl_inset_ratio ?? 0.1;
  const bowlWidthRatio = data.bowl_width_ratio ?? 0.4;
  const centerDividerWidth = (data.center_divider_width ?? 5) * zoom;
  const bowlStyle = data.bowl_style ?? 'stainless';
  const hasDrain = data.has_drain ?? true;
  const hasFaucetHole = data.has_faucet_hole ?? true;

  // Colors based on material
  const sinkColor = bowlStyle === 'ceramic' ? '#FFFFFF' : '#C0C0C0';
  const rimColor = bowlStyle === 'ceramic' ? '#F8F8F8' : '#B0B0B0';

  // Draw sink rim (outer edge)
  const currentFillStyle = ctx.fillStyle;
  ctx.fillStyle = rimColor;
  ctx.fillRect(0, 0, width, depth);

  // Add subtle rim highlight
  ctx.fillStyle = bowlStyle === 'ceramic' ? '#FFFFFF' : '#E0E0E0';
  ctx.fillRect(0, 0, width, depth * 0.1); // Top edge highlight
  ctx.fillRect(0, 0, width * 0.1, depth); // Left edge highlight

  // Calculate bowl dimensions
  const bowlWidth = width * bowlWidthRatio;
  const bowlDepth = depth * 0.8;
  const leftBowlX = width * bowlInsetRatio;
  const rightBowlX = width * 0.5;
  const bowlY = depth * bowlInsetRatio;

  // Draw left bowl
  ctx.fillStyle = sinkColor;
  ctx.beginPath();
  ctx.ellipse(
    leftBowlX + bowlWidth / 2,
    bowlY + bowlDepth / 2,
    (bowlWidth / 2) * 0.9,
    (bowlDepth / 2) * 0.95,
    0, 0, 2 * Math.PI
  );
  ctx.fill();

  // Left bowl inner highlight
  ctx.fillStyle = bowlStyle === 'ceramic' ? '#F0F0F0' : '#D0D0D0';
  ctx.beginPath();
  ctx.ellipse(
    leftBowlX + bowlWidth / 2,
    bowlY + bowlDepth / 2 - bowlDepth * 0.1,
    (bowlWidth / 2) * 0.7,
    (bowlDepth / 2) * 0.3,
    0, 0, 2 * Math.PI
  );
  ctx.fill();

  // Draw right bowl
  ctx.fillStyle = sinkColor;
  ctx.beginPath();
  ctx.ellipse(
    rightBowlX + bowlWidth / 2,
    bowlY + bowlDepth / 2,
    (bowlWidth / 2) * 0.9,
    (bowlDepth / 2) * 0.95,
    0, 0, 2 * Math.PI
  );
  ctx.fill();

  // Right bowl inner highlight
  ctx.fillStyle = bowlStyle === 'ceramic' ? '#F0F0F0' : '#D0D0D0';
  ctx.beginPath();
  ctx.ellipse(
    rightBowlX + bowlWidth / 2,
    bowlY + bowlDepth / 2 - bowlDepth * 0.1,
    (bowlWidth / 2) * 0.7,
    (bowlDepth / 2) * 0.3,
    0, 0, 2 * Math.PI
  );
  ctx.fill();

  // Draw center divider
  ctx.fillStyle = rimColor;
  ctx.fillRect(width * 0.45, bowlY, centerDividerWidth, bowlDepth);

  // Draw drain holes (if enabled)
  if (hasDrain) {
    ctx.fillStyle = '#2F2F2F';
    const drainSize = Math.min(width, depth) * 0.1;

    // Left drain
    ctx.beginPath();
    ctx.arc(leftBowlX + bowlWidth / 2, bowlY + bowlDepth / 2, drainSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Right drain
    ctx.beginPath();
    ctx.arc(rightBowlX + bowlWidth / 2, bowlY + bowlDepth / 2, drainSize / 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw faucet mounting holes (if enabled)
  if (hasFaucetHole) {
    ctx.fillStyle = '#2F2F2F';
    const holeSize = Math.min(width, depth) * 0.03;
    const holeY = depth * 0.2;

    // Left hole
    ctx.beginPath();
    ctx.arc(width * 0.25, holeY, holeSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Right hole
    ctx.beginPath();
    ctx.arc(width * 0.75, holeY, holeSize / 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Restore fill style
  ctx.fillStyle = currentFillStyle;
}

// =====================================================
// Corner Sink Handler (L-shaped)
// =====================================================

export function renderSinkCorner(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: SinkCornerData,
  zoom: number
): void {
  const width = element.width * zoom;
  const depth = (element.depth || element.height) * zoom;

  // Configuration with defaults
  const bowlSizeRatio = data.bowl_size_ratio ?? 0.6;
  const bowlStyle = data.bowl_style ?? 'stainless';
  const hasDrain = data.has_drain ?? true;

  // Colors based on material
  const sinkColor = bowlStyle === 'ceramic' ? '#FFFFFF' : '#C0C0C0';
  const rimColor = bowlStyle === 'ceramic' ? '#F8F8F8' : '#B0B0B0';

  // Draw sink rim (outer edge)
  const currentFillStyle = ctx.fillStyle;
  ctx.fillStyle = rimColor;
  ctx.fillRect(0, 0, width, depth);

  // Add subtle rim highlight
  ctx.fillStyle = bowlStyle === 'ceramic' ? '#FFFFFF' : '#E0E0E0';
  ctx.fillRect(0, 0, width, depth * 0.1);
  ctx.fillRect(0, 0, width * 0.1, depth);

  // Calculate main bowl dimensions
  const mainBowlWidth = width * bowlSizeRatio;
  const mainBowlDepth = depth * bowlSizeRatio;
  const mainBowlX = width * 0.2;
  const mainBowlY = depth * 0.2;

  // Draw main bowl
  ctx.fillStyle = sinkColor;
  ctx.beginPath();
  ctx.ellipse(
    mainBowlX + mainBowlWidth / 2,
    mainBowlY + mainBowlDepth / 2,
    (mainBowlWidth / 2) * 0.9,
    (mainBowlDepth / 2) * 0.95,
    0, 0, 2 * Math.PI
  );
  ctx.fill();

  // Main bowl inner highlight
  ctx.fillStyle = bowlStyle === 'ceramic' ? '#F0F0F0' : '#D0D0D0';
  ctx.beginPath();
  ctx.ellipse(
    mainBowlX + mainBowlWidth / 2,
    mainBowlY + mainBowlDepth / 2 - mainBowlDepth * 0.1,
    (mainBowlWidth / 2) * 0.7,
    (mainBowlDepth / 2) * 0.3,
    0, 0, 2 * Math.PI
  );
  ctx.fill();

  // Draw corner extension (L-shape part)
  const cornerWidth = width * 0.3;
  const cornerDepth = depth * 0.3;
  ctx.fillStyle = sinkColor;
  ctx.fillRect(
    mainBowlX + mainBowlWidth * 0.7,
    mainBowlY + mainBowlDepth * 0.7,
    cornerWidth,
    cornerDepth
  );

  // Corner extension highlight
  ctx.fillStyle = bowlStyle === 'ceramic' ? '#F0F0F0' : '#D0D0D0';
  ctx.fillRect(
    mainBowlX + mainBowlWidth * 0.7,
    mainBowlY + mainBowlDepth * 0.7,
    cornerWidth * 0.8,
    cornerDepth * 0.8
  );

  // Draw drain hole (if enabled)
  if (hasDrain) {
    ctx.fillStyle = '#2F2F2F';
    const drainSize = Math.min(width, depth) * 0.1;
    const drainX = mainBowlX + mainBowlWidth / 2;
    const drainY = mainBowlY + mainBowlDepth / 2;

    ctx.beginPath();
    ctx.arc(drainX, drainY, drainSize / 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Restore fill style
  ctx.fillStyle = currentFillStyle;
}

// =====================================================
// Custom SVG Handler (for future use)
// =====================================================

export function renderCustomSVG(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  svgPath: string,
  zoom: number
): void {
  try {
    const path = new Path2D(svgPath);
    ctx.fill(path);
  } catch (error) {
    console.error('[PlanViewHandlers] Error rendering custom SVG:', error);
    // Fallback to rectangle
    renderRectangle(ctx, element, {}, zoom);
  }
}
