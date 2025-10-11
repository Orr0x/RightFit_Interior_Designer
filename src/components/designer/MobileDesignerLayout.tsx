import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Menu, 
  X, 
  Layout, 
  Box, 
  Settings, 
  ChevronUp, 
  ChevronDown,
  Maximize2
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesignElement, RoomType, RoomDimensions } from '@/types/project';
import type { RoomGeometry } from '@/types/RoomGeometry';
import { DesignCanvas2D } from './DesignCanvas2D';
import { Lazy3DView } from './Lazy3DView';
import CompactComponentSidebar from './CompactComponentSidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { ViewSelector } from './ViewSelector';
import { CanvasElementCounter } from './CanvasElementCounter';

interface MobileDesignerLayoutProps {
  // Design data
  design: {
    id: string;
    name: string;
    elements: DesignElement[];
    roomDimensions: RoomDimensions;
    roomType: RoomType;
  };
  
  // Selected element
  selectedElement: DesignElement | null;
  onSelectElement: (element: DesignElement | null) => void;
  
  // Element management
  onAddElement: (element: DesignElement) => void;
  onUpdateElement: (elementId: string, updates: Partial<DesignElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onUpdateRoomDimensions: (dimensions: { width: number; height: number; ceilingHeight?: number }) => void;
  
  // View state
  activeView: '2d' | '3d';
  onViewChange: (view: '2d' | '3d') => void;
  active2DView: 'plan' | 'front' | 'back' | 'left' | 'right';
  onActive2DViewChange: (view: 'plan' | 'front' | 'back' | 'left' | 'right') => void;
  
  // Tools
  activeTool: 'select' | 'fit-screen' | 'pan' | 'tape-measure' | 'none';
  onToolChange: (tool: 'select' | 'fit-screen' | 'pan' | 'tape-measure' | 'none') => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showWireframe: boolean;
  onToggleWireframe: () => void;
  showColorDetail: boolean;
  onToggleColorDetail: () => void;
  fitToScreenSignal: number;
  onFitToScreen: () => void;
  
  // Tape measure (optional)
  completedMeasurements?: { start: { x: number; y: number }, end: { x: number; y: number } }[];
  currentMeasureStart?: { x: number; y: number } | null;
  tapeMeasurePreview?: { x: number; y: number } | null;
  onTapeMeasureClick?: (x: number, y: number) => void;
  onTapeMeasureMouseMove?: (x: number, y: number) => void;
  onClearTapeMeasure?: () => void;

  // Complex room support
  roomGeometry?: RoomGeometry | null;
  selectedWallId?: string;
  onWallChange?: (wallId: string) => void;
}

export const MobileDesignerLayout: React.FC<MobileDesignerLayoutProps> = ({
  design,
  selectedElement,
  onSelectElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onUpdateRoomDimensions,
  activeView,
  onViewChange,
  active2DView,
  onActive2DViewChange,
  activeTool,
  onToolChange,
  showGrid,
  onToggleGrid,
  showWireframe,
  onToggleWireframe,
  showColorDetail,
  onToggleColorDetail,
  fitToScreenSignal,
  onFitToScreen,
  completedMeasurements = [],
  currentMeasureStart = null,
  tapeMeasurePreview = null,
  onTapeMeasureClick,
  onTapeMeasureMouseMove,
  onClearTapeMeasure,
  roomGeometry,
  selectedWallId,
  onWallChange
}) => {
  const isMobile = useIsMobile();
  const [showComponentPanel, setShowComponentPanel] = useState(false);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);

  // Auto-close panels when not mobile
  useEffect(() => {
    if (!isMobile) {
      setShowComponentPanel(false);
      setShowPropertiesPanel(false);
    }
  }, [isMobile]);

  // Mobile-optimized toolbar buttons
  const MobileToolbar = () => (
    <div className="flex items-center justify-between p-2 bg-white border-b border-gray-200">
      {/* Left: Component Panel Toggle */}
      <Sheet open={showComponentPanel} onOpenChange={setShowComponentPanel}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 w-10 p-0">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Components</h2>
            <SheetClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          <div className="flex-1 overflow-hidden">
            <CompactComponentSidebar
              onAddElement={onAddElement}
              roomType={design.roomType}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Center: View Toggle & Tools */}
      <div className="flex items-center space-x-2">
        <Tabs value={activeView} onValueChange={onViewChange} className="w-auto">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="2d" className="text-xs">
              <Layout className="h-4 w-4 mr-1" />
              2D
            </TabsTrigger>
            <TabsTrigger value="3d" className="text-xs">
              <Box className="h-4 w-4 mr-1" />
              3D
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Expandable toolbar */}
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
            className="h-10 w-10 p-0"
          >
            {isToolbarExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Right: Properties Panel Toggle */}
      <Sheet open={showPropertiesPanel} onOpenChange={setShowPropertiesPanel}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 w-10 p-0">
            <Settings className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Properties</h2>
            <SheetClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          <div className="flex-1 overflow-hidden">
            <PropertiesPanel
              selectedElement={selectedElement}
              onUpdateElement={onUpdateElement}
              roomDimensions={design.roomDimensions}
              onUpdateRoomDimensions={onUpdateRoomDimensions}
              roomType={design.roomType}
              active2DView={active2DView}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  // Expanded toolbar with additional tools
  const ExpandedToolbar = () => (
    <div className="p-2 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center justify-center space-x-2 flex-wrap gap-2">
        <Button
          variant={activeTool === 'select' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolChange('select')}
          className="text-xs"
        >
          Select
        </Button>
        <Button
          variant={activeTool === 'pan' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolChange('pan')}
          className="text-xs"
        >
          Pan
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onFitToScreen}
          className="text-xs"
        >
          <Maximize2 className="h-3 w-3 mr-1" />
          Fit
        </Button>
        <Button
          variant={showGrid ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleGrid}
          className="text-xs"
        >
          Grid
        </Button>
        {activeView === '2d' && (
          <div className="flex items-center space-x-1">
            <ViewSelector
              activeView={active2DView}
              onViewChange={onActive2DViewChange}
              roomGeometry={roomGeometry}
              selectedWallId={selectedWallId}
              onWallChange={onWallChange}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Mobile Toolbar */}
      <MobileToolbar />
      
      {/* Expanded Toolbar (when toggled) */}
      {isToolbarExpanded && <ExpandedToolbar />}

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <Card className="h-full design-canvas-card rounded-none border-0">
          {activeView === '2d' ? (
            <div className="h-full relative">
              <DesignCanvas2D
                key={`mobile-canvas-2d-${active2DView}`}
                design={design}
                selectedElement={selectedElement}
                onSelectElement={onSelectElement}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                onUpdateRoomDimensions={onUpdateRoomDimensions}
                onAddElement={onAddElement}
                showGrid={showGrid}
                showRuler={false}
                showWireframe={showWireframe}
                showColorDetail={showColorDetail}
                activeTool={activeTool}
                fitToScreenSignal={fitToScreenSignal}
                active2DView={active2DView}
                selectedWallId={selectedWallId}
                completedMeasurements={completedMeasurements}
                currentMeasureStart={currentMeasureStart}
                tapeMeasurePreview={tapeMeasurePreview}
                onTapeMeasureClick={onTapeMeasureClick}
                onTapeMeasureMouseMove={onTapeMeasureMouseMove}
                onClearTapeMeasure={onClearTapeMeasure}
              />
              
              {/* Element Counter - Bottom Left */}
              <div className="absolute bottom-4 left-4 z-10">
                <CanvasElementCounter elements={design.elements} />
              </div>
            </div>
          ) : (
            <div className="h-full relative">
              <Lazy3DView
                key={`mobile-view3d-${design.id}`}
                design={design}
                selectedElement={selectedElement}
                onSelectElement={onSelectElement}
                activeTool={activeTool === 'tape-measure' ? 'select' : activeTool}
                showGrid={showGrid}
                fitToScreenSignal={fitToScreenSignal}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MobileDesignerLayout;