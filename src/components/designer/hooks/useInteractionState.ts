import { useState } from 'react';
import type { DesignElement } from '@/types/project';

interface SnapGuidesState {
  vertical: number[];
  horizontal: number[];
  snapPoint: { x: number; y: number } | null;
}

interface UseInteractionStateReturn {
  // Dragging state
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  dragStart: { x: number; y: number };
  setDragStart: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  currentMousePos: { x: number; y: number };
  setCurrentMousePos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  draggedElement: DesignElement | null;
  setDraggedElement: React.Dispatch<React.SetStateAction<DesignElement | null>>;
  draggedElementOriginalPos: { x: number; y: number } | null;
  setDraggedElementOriginalPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  dragThreshold: { exceeded: boolean; startElement: DesignElement | null };
  setDragThreshold: React.Dispatch<React.SetStateAction<{ exceeded: boolean; startElement: DesignElement | null }>>;

  // Hovering state
  hoveredElement: DesignElement | null;
  setHoveredElement: React.Dispatch<React.SetStateAction<DesignElement | null>>;

  // Snap guides
  snapGuides: SnapGuidesState;
  setSnapGuides: React.Dispatch<React.SetStateAction<SnapGuidesState>>;
}

/**
 * Custom hook for managing interaction state (dragging, hovering, snap guides)
 * Extracted from DesignCanvas2D.tsx as part of Story 1.15.3
 */
export function useInteractionState(): UseInteractionStateReturn {
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<DesignElement | null>(null);
  const [draggedElementOriginalPos, setDraggedElementOriginalPos] = useState<{ x: number; y: number } | null>(null);
  const [dragThreshold, setDragThreshold] = useState<{ exceeded: boolean; startElement: DesignElement | null }>({
    exceeded: false,
    startElement: null,
  });

  // Hovering state
  const [hoveredElement, setHoveredElement] = useState<DesignElement | null>(null);

  // Snap guides
  const [snapGuides, setSnapGuides] = useState<SnapGuidesState>({
    vertical: [],
    horizontal: [],
    snapPoint: null,
  });

  return {
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    currentMousePos,
    setCurrentMousePos,
    draggedElement,
    setDraggedElement,
    draggedElementOriginalPos,
    setDraggedElementOriginalPos,
    dragThreshold,
    setDragThreshold,
    hoveredElement,
    setHoveredElement,
    snapGuides,
    setSnapGuides,
  };
}
