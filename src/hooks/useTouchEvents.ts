import { useRef, useCallback } from 'react';

export interface TouchPoint {
  x: number;
  y: number;
  identifier: number;
}

export interface TouchEventHandlers {
  onTouchStart?: (point: TouchPoint, event: TouchEvent) => void;
  onTouchMove?: (point: TouchPoint, event: TouchEvent) => void;
  onTouchEnd?: (point: TouchPoint, event: TouchEvent) => void;
  onPinchStart?: (distance: number, center: TouchPoint, event: TouchEvent) => void;
  onPinchMove?: (distance: number, scale: number, center: TouchPoint, event: TouchEvent) => void;
  onPinchEnd?: (event: TouchEvent) => void;
  onLongPress?: (point: TouchPoint, event: TouchEvent) => void;
}

export interface TouchState {
  isActive: boolean;
  touches: TouchPoint[];
  initialDistance: number | null;
  initialScale: number;
  longPressTimer: NodeJS.Timeout | null;
}

/**
 * Custom hook for handling touch events with support for:
 * - Single touch (tap, drag)
 * - Multi-touch (pinch-to-zoom)
 * - Long press detection
 * - Touch position tracking
 */
export const useTouchEvents = (handlers: TouchEventHandlers = {}) => {
  const touchStateRef = useRef<TouchState>({
    isActive: false,
    touches: [],
    initialDistance: null,
    initialScale: 1,
    longPressTimer: null
  });

  const LONG_PRESS_DURATION = 500; // ms
  const MIN_PINCH_DISTANCE = 10; // pixels

  // Convert touch to point with canvas coordinates
  const getTouchPoint = useCallback((touch: Touch, element: HTMLElement): TouchPoint => {
    const rect = element.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      identifier: touch.identifier
    };
  }, []);

  // Calculate distance between two points
  const getDistance = useCallback((p1: TouchPoint, p2: TouchPoint): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  // Calculate center point between two touches
  const getCenter = useCallback((p1: TouchPoint, p2: TouchPoint): TouchPoint => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
      identifier: -1 // Center point has no identifier
    };
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    event.preventDefault(); // Prevent default touch behaviors
    
    const element = event.currentTarget as HTMLElement;
    const touches = Array.from(event.touches).map(touch => getTouchPoint(touch, element));
    
    touchStateRef.current.isActive = true;
    touchStateRef.current.touches = touches;

    // Clear any existing long press timer
    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
    }

    if (touches.length === 1) {
      // Single touch - start long press timer
      const touch = touches[0];
      touchStateRef.current.longPressTimer = setTimeout(() => {
        if (handlers.onLongPress && touchStateRef.current.isActive) {
          handlers.onLongPress(touch, event);
        }
      }, LONG_PRESS_DURATION);

      handlers.onTouchStart?.(touch, event);
    } else if (touches.length === 2) {
      // Multi-touch - start pinch gesture
      const distance = getDistance(touches[0], touches[1]);
      const center = getCenter(touches[0], touches[1]);
      
      touchStateRef.current.initialDistance = distance;
      touchStateRef.current.initialScale = 1;

      if (distance > MIN_PINCH_DISTANCE) {
        handlers.onPinchStart?.(distance, center, event);
      }
    }
  }, [getTouchPoint, getDistance, getCenter, handlers, LONG_PRESS_DURATION, MIN_PINCH_DISTANCE]);

  // Handle touch move
  const handleTouchMove = useCallback((event: TouchEvent) => {
    event.preventDefault();
    
    if (!touchStateRef.current.isActive) return;

    const element = event.currentTarget as HTMLElement;
    const touches = Array.from(event.touches).map(touch => getTouchPoint(touch, element));
    
    touchStateRef.current.touches = touches;

    // Clear long press timer on move
    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
      touchStateRef.current.longPressTimer = null;
    }

    if (touches.length === 1) {
      // Single touch move
      handlers.onTouchMove?.(touches[0], event);
    } else if (touches.length === 2 && touchStateRef.current.initialDistance) {
      // Pinch gesture
      const distance = getDistance(touches[0], touches[1]);
      const center = getCenter(touches[0], touches[1]);
      const scale = distance / touchStateRef.current.initialDistance;

      if (distance > MIN_PINCH_DISTANCE) {
        handlers.onPinchMove?.(distance, scale, center, event);
      }
    }
  }, [getTouchPoint, getDistance, getCenter, handlers, MIN_PINCH_DISTANCE]);

  // Handle touch end
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    const element = event.currentTarget as HTMLElement;
    const remainingTouches = Array.from(event.touches).map(touch => getTouchPoint(touch, element));
    
    // Clear long press timer
    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
      touchStateRef.current.longPressTimer = null;
    }

    if (remainingTouches.length === 0) {
      // All touches ended
      if (touchStateRef.current.touches.length === 1) {
        handlers.onTouchEnd?.(touchStateRef.current.touches[0], event);
      } else if (touchStateRef.current.touches.length === 2) {
        handlers.onPinchEnd?.(event);
      }

      touchStateRef.current.isActive = false;
      touchStateRef.current.touches = [];
      touchStateRef.current.initialDistance = null;
      touchStateRef.current.initialScale = 1;
    } else {
      // Some touches remain - update state
      touchStateRef.current.touches = remainingTouches;
      
      if (remainingTouches.length === 1 && touchStateRef.current.touches.length === 2) {
        // Transitioned from pinch to single touch
        handlers.onPinchEnd?.(event);
        touchStateRef.current.initialDistance = null;
      }
    }
  }, [getTouchPoint, handlers]);

  // Attach event listeners to an element
  const attachTouchEvents = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {};

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Get current touch state
  const getTouchState = useCallback(() => ({
    isActive: touchStateRef.current.isActive,
    touchCount: touchStateRef.current.touches.length,
    touches: [...touchStateRef.current.touches]
  }), []);

  return {
    attachTouchEvents,
    getTouchState,
    isActive: touchStateRef.current.isActive
  };
};
