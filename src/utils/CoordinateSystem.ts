/**
 * CoordinateSystem - Single source of truth for all coordinate transformations
 *
 * THREE COORDINATE SPACES:
 * 1. WORLD SPACE: Component positions in centimeters (cm)
 *    - Origin: Top-left of room interior
 *    - Units: centimeters
 *    - Example: A cabinet at x=100cm, y=150cm in the room
 *
 * 2. CANVAS SPACE: Pixel positions on the HTML canvas element
 *    - Origin: Top-left of canvas element
 *    - Units: pixels
 *    - Example: A cabinet drawn at x=200px, y=300px on canvas
 *
 * 3. SCREEN SPACE: Browser viewport pixel coordinates (for mouse events)
 *    - Origin: Top-left of browser viewport
 *    - Units: pixels
 *    - Example: Mouse clicked at clientX=500px, clientY=400px
 *
 * CONVERSION FLOW:
 * - Drag & Drop: Screen → Canvas → World (to get component position)
 * - Rendering: World → Canvas (to draw component)
 * - Sizing: Centimeters → Pixels (to determine component size)
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface CanvasInfo {
  width: number;   // Canvas element width in pixels
  height: number;  // Canvas element height in pixels
  offsetX: number; // Room offset from canvas edge (x)
  offsetY: number; // Room offset from canvas edge (y)
}

export class CoordinateSystem {
  // Constants
  private readonly BASE_PIXELS_PER_CM = 1.0; // 1cm = 1px at 100% zoom

  // State
  private zoom: number = 1.0;
  private panOffset: Point2D = { x: 0, y: 0 };
  private canvasInfo: CanvasInfo = {
    width: 1600,
    height: 1200,
    offsetX: 0,
    offsetY: 0
  };

  /**
   * Set the current zoom level
   * @param zoom - Zoom level (1.0 = 100%, 1.5 = 150%, etc.)
   */
  setZoom(zoom: number): void {
    this.zoom = Math.max(0.5, Math.min(4.0, zoom));
  }

  getZoom(): number {
    return this.zoom;
  }

  /**
   * Set the pan offset (for dragging the canvas view)
   * @param offset - Pan offset in pixels
   */
  setPanOffset(offset: Point2D): void {
    this.panOffset = offset;
  }

  getPanOffset(): Point2D {
    return { ...this.panOffset };
  }

  /**
   * Set canvas dimensions and room offset
   * @param info - Canvas and room positioning info
   */
  setCanvasInfo(info: CanvasInfo): void {
    this.canvasInfo = info;
  }

  getCanvasInfo(): CanvasInfo {
    return { ...this.canvasInfo };
  }

  /**
   * Convert centimeters to pixels at current zoom
   * @param cm - Distance in centimeters
   * @returns Distance in pixels
   */
  cmToPixels(cm: number): number {
    return cm * this.BASE_PIXELS_PER_CM * this.zoom;
  }

  /**
   * Convert pixels to centimeters at current zoom
   * @param pixels - Distance in pixels
   * @returns Distance in centimeters
   */
  pixelsToCm(pixels: number): number {
    return pixels / (this.BASE_PIXELS_PER_CM * this.zoom);
  }

  /**
   * Convert world coordinates (cm in room) to canvas coordinates (px on canvas)
   * @param worldX - X position in room (centimeters)
   * @param worldY - Y position in room (centimeters)
   * @returns Canvas coordinates (pixels)
   */
  worldToCanvas(worldX: number, worldY: number): Point2D {
    return {
      x: this.canvasInfo.offsetX + this.cmToPixels(worldX) + this.panOffset.x,
      y: this.canvasInfo.offsetY + this.cmToPixels(worldY) + this.panOffset.y
    };
  }

  /**
   * Convert canvas coordinates (px on canvas) to world coordinates (cm in room)
   * @param canvasX - X position on canvas (pixels)
   * @param canvasY - Y position on canvas (pixels)
   * @returns World coordinates (centimeters)
   */
  canvasToWorld(canvasX: number, canvasY: number): Point2D {
    return {
      x: this.pixelsToCm(canvasX - this.canvasInfo.offsetX - this.panOffset.x),
      y: this.pixelsToCm(canvasY - this.canvasInfo.offsetY - this.panOffset.y)
    };
  }

  /**
   * Convert screen coordinates (browser viewport) to canvas coordinates
   * Requires the canvas element's bounding rect to account for CSS scaling
   * @param screenX - X position in viewport (clientX from mouse event)
   * @param screenY - Y position in viewport (clientY from mouse event)
   * @param canvasBoundingRect - Result of canvas.getBoundingClientRect()
   * @returns Canvas coordinates (pixels)
   */
  screenToCanvas(screenX: number, screenY: number, canvasBoundingRect: DOMRect): Point2D {
    // Account for CSS scaling of canvas element
    const scaleX = this.canvasInfo.width / canvasBoundingRect.width;
    const scaleY = this.canvasInfo.height / canvasBoundingRect.height;

    return {
      x: (screenX - canvasBoundingRect.left) * scaleX,
      y: (screenY - canvasBoundingRect.top) * scaleY
    };
  }

  /**
   * Convert screen coordinates directly to world coordinates (one-step conversion)
   * This is the most common operation for drag & drop
   * @param screenX - X position in viewport (clientX from mouse event)
   * @param screenY - Y position in viewport (clientY from mouse event)
   * @param canvasBoundingRect - Result of canvas.getBoundingClientRect()
   * @returns World coordinates (centimeters)
   */
  screenToWorld(screenX: number, screenY: number, canvasBoundingRect: DOMRect): Point2D {
    const canvasPoint = this.screenToCanvas(screenX, screenY, canvasBoundingRect);
    return this.canvasToWorld(canvasPoint.x, canvasPoint.y);
  }

  /**
   * Get the current pixels-per-cm scale factor (including zoom)
   * Useful for debugging and UI display
   */
  getCurrentScale(): number {
    return this.BASE_PIXELS_PER_CM * this.zoom;
  }
}

/**
 * Create a new coordinate system instance
 */
export function createCoordinateSystem(): CoordinateSystem {
  return new CoordinateSystem();
}
