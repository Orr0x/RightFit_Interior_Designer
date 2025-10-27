import { useCallback, useEffect } from 'react';
import type { DesignElement } from '@/types/project';
import { render2DService } from '@/services/Render2DService';
import { renderPlanView, renderElevationView } from '@/services/2d-renderers';
import { Logger } from '@/utils/Logger';

interface UseCanvasRenderingProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  zoom: number;
  panOffset: { x: number; y: number };
  roomDimensions: { width: number; height: number };
  elements: DesignElement[];
  selectedElement: DesignElement | null;
  hoveredElement: DesignElement | null;
  draggedElement: DesignElement | null;
  currentViewDirection: 'plan' | 'front' | 'back' | 'left' | 'right';
  hiddenElements: string[];
  showGrid: boolean;
  showWireframe: boolean;
  showColorDetail: boolean;
  snapGuides: { vertical: number[]; horizontal: number[]; snapPoint: { x: number; y: number } | null };
  effectiveCurrentMeasureStart: { x: number; y: number } | null;
  effectiveTapeMeasurePreview: { x: number; y: number } | null;
  effectiveCompletedMeasurements: Array<{ start: { x: number; y: number }, end: { x: number; y: number } }>;
}

/**
 * Custom hook for canvas rendering logic
 * Extracted from DesignCanvas2D.tsx as part of Story 1.15.3
 *
 * Handles:
 * - Canvas drawing operations
 * - Render triggering on state changes
 * - View-specific rendering (plan vs elevation)
 */
export function useCanvasRendering({
  canvasRef,
  zoom,
  panOffset,
  roomDimensions,
  elements,
  selectedElement,
  hoveredElement,
  draggedElement,
  currentViewDirection,
  hiddenElements,
  showGrid,
  showWireframe,
  showColorDetail,
  snapGuides,
  effectiveCurrentMeasureStart,
  effectiveTapeMeasurePreview,
  effectiveCompletedMeasurements,
}: UseCanvasRenderingProps) {

  /**
   * Main render function - delegates to view-specific renderers
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply zoom and pan
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    try {
      // Route to appropriate renderer based on view
      if (currentViewDirection === 'plan') {
        renderPlanView({
          ctx,
          canvas,
          roomDimensions,
          elements,
          selectedElement,
          hoveredElement,
          draggedElement,
          showGrid,
          showWireframe,
          showColorDetail,
          snapGuides,
          zoom,
          panOffset,
        });
      } else {
        renderElevationView({
          ctx,
          canvas,
          roomDimensions,
          elements: elements.filter(el => !hiddenElements.includes(el.id)),
          selectedElement,
          hoveredElement,
          draggedElement,
          direction: currentViewDirection,
          showGrid,
          showWireframe,
          showColorDetail,
          snapGuides,
          zoom,
          panOffset,
        });
      }

      // Draw tape measure (if active)
      if (effectiveCurrentMeasureStart && effectiveTapeMeasurePreview) {
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.beginPath();
        ctx.moveTo(effectiveCurrentMeasureStart.x, effectiveCurrentMeasureStart.y);
        ctx.lineTo(effectiveTapeMeasurePreview.x, effectiveTapeMeasurePreview.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw measurement label
        const dx = effectiveTapeMeasurePreview.x - effectiveCurrentMeasureStart.x;
        const dy = effectiveTapeMeasurePreview.y - effectiveCurrentMeasureStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const midX = (effectiveCurrentMeasureStart.x + effectiveTapeMeasurePreview.x) / 2;
        const midY = (effectiveCurrentMeasureStart.y + effectiveTapeMeasurePreview.y) / 2;

        ctx.fillStyle = '#FF5722';
        ctx.font = `${14 / zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${distance.toFixed(1)} cm`, midX, midY - 5 / zoom);
      }

      // Draw completed measurements
      effectiveCompletedMeasurements.forEach((measurement) => {
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.beginPath();
        ctx.moveTo(measurement.start.x, measurement.start.y);
        ctx.lineTo(measurement.end.x, measurement.end.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw measurement label
        const dx = measurement.end.x - measurement.start.x;
        const dy = measurement.end.y - measurement.start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const midX = (measurement.start.x + measurement.end.x) / 2;
        const midY = (measurement.start.y + measurement.end.y) / 2;

        ctx.fillStyle = '#4CAF50';
        ctx.font = `${14 / zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${distance.toFixed(1)} cm`, midX, midY - 5 / zoom);
      });

    } catch (error) {
      Logger.error('❌ Render error:', error);
    } finally {
      ctx.restore();
    }
  }, [
    canvasRef,
    zoom,
    panOffset,
    roomDimensions,
    elements,
    selectedElement,
    hoveredElement,
    draggedElement,
    currentViewDirection,
    hiddenElements,
    showGrid,
    showWireframe,
    showColorDetail,
    snapGuides,
    effectiveCurrentMeasureStart,
    effectiveTapeMeasurePreview,
    effectiveCompletedMeasurements,
  ]);

  // Trigger render on any state change
  useEffect(() => {
    render();
  }, [render]);

  return {
    render,
  };
}
