interface DesignCanvas2DProps {
  design: Design;
  selectedElement: DesignElement | null;
  onSelectElement: (element: DesignElement | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<DesignElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onUpdateRoomDimensions: (dimensions: { width: number; height: number }) => void;
  onAddElement: (element: DesignElement) => void;
  showGrid?: boolean;
  showRuler?: boolean;
  activeTool?: 'select' | 'fit-screen' | 'pan' | 'tape-measure' | 'none';
  fitToScreenSignal?: number;
  active2DView: 'plan' | 'front' | 'back' | 'left' | 'right';
  // Tape measure props
  tapeMeasurePoints?: { x: number; y: number }[];
  isMeasuring?: boolean;
  measurementDistance?: number | null;
  onTapeMeasureClick?: (x: number, y: number) => void;
  onTapeMeasureDrag?: (startX: number, startY: number, endX: number, endY: number) => void;
}
