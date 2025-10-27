import { useState, useEffect } from 'react';

interface TapeMeasurement {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

interface UseToolStateProps {
  // Tape measure props from parent (optional)
  completedMeasurements?: TapeMeasurement[];
  currentMeasureStart?: { x: number; y: number } | null;
  tapeMeasurePreview?: { x: number; y: number } | null;
}

interface UseToolStateReturn {
  // Tape measure state (local or from props)
  currentMeasureStart: { x: number; y: number } | null;
  setCurrentMeasureStart: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  tapeMeasurePreview: { x: number; y: number } | null;
  setTapeMeasurePreview: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  completedMeasurements: TapeMeasurement[];
  setCompletedMeasurements: React.Dispatch<React.SetStateAction<TapeMeasurement[]>>;

  // Effective values (prop or local)
  effectiveCurrentMeasureStart: { x: number; y: number } | null;
  effectiveTapeMeasurePreview: { x: number; y: number } | null;
  effectiveCompletedMeasurements: TapeMeasurement[];
}

/**
 * Custom hook for managing tool state (tape measure, etc.)
 * Supports hybrid prop/local state pattern for standalone or parent-controlled usage
 * Extracted from DesignCanvas2D.tsx as part of Story 1.15.3
 */
export function useToolState({
  completedMeasurements: propCompletedMeasurements,
  currentMeasureStart: propCurrentMeasureStart,
  tapeMeasurePreview: propTapeMeasurePreview,
}: UseToolStateProps): UseToolStateReturn {
  // Local state with prop defaults
  const [localCurrentMeasureStart, setCurrentMeasureStart] = useState<{ x: number; y: number } | null>(
    propCurrentMeasureStart || null
  );
  const [localTapeMeasurePreview, setTapeMeasurePreview] = useState<{ x: number; y: number } | null>(
    propTapeMeasurePreview || null
  );
  const [localCompletedMeasurements, setCompletedMeasurements] = useState<TapeMeasurement[]>(
    propCompletedMeasurements || []
  );

  // Sync local state with props when props change
  useEffect(() => {
    if (propCurrentMeasureStart !== undefined) {
      setCurrentMeasureStart(propCurrentMeasureStart);
    }
  }, [propCurrentMeasureStart]);

  useEffect(() => {
    if (propTapeMeasurePreview !== undefined) {
      setTapeMeasurePreview(propTapeMeasurePreview);
    }
  }, [propTapeMeasurePreview]);

  useEffect(() => {
    if (propCompletedMeasurements !== undefined) {
      setCompletedMeasurements(propCompletedMeasurements);
    }
  }, [propCompletedMeasurements]);

  // Use prop values if provided, otherwise use local state
  const effectiveCurrentMeasureStart =
    propCurrentMeasureStart !== undefined ? propCurrentMeasureStart : localCurrentMeasureStart;
  const effectiveTapeMeasurePreview =
    propTapeMeasurePreview !== undefined ? propTapeMeasurePreview : localTapeMeasurePreview;
  const effectiveCompletedMeasurements =
    propCompletedMeasurements !== undefined ? propCompletedMeasurements : localCompletedMeasurements;

  return {
    // Local state setters
    currentMeasureStart: localCurrentMeasureStart,
    setCurrentMeasureStart,
    tapeMeasurePreview: localTapeMeasurePreview,
    setTapeMeasurePreview,
    completedMeasurements: localCompletedMeasurements,
    setCompletedMeasurements,

    // Effective values (hybrid prop/local)
    effectiveCurrentMeasureStart,
    effectiveTapeMeasurePreview,
    effectiveCompletedMeasurements,
  };
}
