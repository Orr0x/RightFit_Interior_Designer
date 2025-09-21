import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MousePointer2, 
  Move, 
  Maximize2, 
  Undo2, 
  Redo2, 
  Copy, 
  Trash2, 
  Grid3X3, 
  Ruler, 
  Eye,
  PanelLeft,
  PanelRight,
  RotateCw,
  Layers,
  Home,
  Bed,
  Bath,
  Tv,
  Grid2X2,
  RulerIcon
} from 'lucide-react';
import { RoomType } from '@/types/project';

interface DesignToolbarProps {
  activeView: '2d' | '3d';
  onViewChange: (view: '2d' | '3d') => void;
  activeTool: 'select' | 'fit-screen' | 'pan' | 'tape-measure' | 'none';
  onToolChange: (tool: 'select' | 'fit-screen' | 'pan' | 'tape-measure' | 'none') => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  onReset: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onFitScreen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canCopy: boolean;
  canDelete: boolean;
  canUndo: boolean;
  canRedo: boolean;
  showLeftPanel: boolean;
  onToggleLeftPanel: () => void;
  showRightPanel: boolean;
  onToggleRightPanel: () => void;
  onSave: () => void;
  onSaveNew: () => void;
  roomType: RoomType;
  elementCount: number;
  onValidateDesign: () => void;
}

export const DesignToolbar: React.FC<DesignToolbarProps> = ({
  activeView,
  onViewChange,
  activeTool,
  onToolChange,
  showGrid,
  onToggleGrid,
  showRuler,
  onToggleRuler,
  onReset,
  onCopy,
  onDelete,
  onFitScreen,
  onUndo,
  onRedo,
  canCopy,
  canDelete,
  canUndo,
  canRedo,
  showLeftPanel,
  onToggleLeftPanel,
  showRightPanel,
  onToggleRightPanel,
  onSave,
  onSaveNew,
  roomType,
  elementCount,
  onValidateDesign
}) => {
  const getRoomIcon = (roomType: RoomType) => {
    const iconMap = {
      kitchen: Home,
      bedroom: Bed,
      bathroom: Bath,
      'media-wall': Tv,
      flooring: Grid2X2
    };
    return iconMap[roomType] || Home;
  };

  const getRoomIndicatorClass = (roomType: RoomType) => {
    const classMap = {
      kitchen: 'room-indicator-kitchen',
      bedroom: 'room-indicator-bedroom',
      bathroom: 'room-indicator-bathroom',
      'media-wall': 'room-indicator-media-wall',
      flooring: 'room-indicator-flooring'
    };
    return `room-indicator ${classMap[roomType]}`;
  };

  const RoomIcon = getRoomIcon(roomType);

  return (
    <TooltipProvider>
      <div className="bg-white/95 backdrop-blur-sm border-b shadow-sm animate-fade-in">
        {/* Single Row - All Tools */}
        <div className="flex items-center justify-between w-full p-3">
          {/* Left Section - Left Panel Toggle */}
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={showLeftPanel ? 'default' : 'outline'} 
                  size="sm"
                  onClick={onToggleLeftPanel}
                  className="hover-scale fast-transition"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle component library</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Center Section - Main Tools */}
          <div className="flex items-center space-x-4">
            {/* Selection Tools */}
            <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeTool === 'select' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => onToolChange('select')}
                    className="hover-scale fast-transition"
                  >
                    <MousePointer2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select tool</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeTool === 'fit-screen' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => {
                      onToolChange('fit-screen');
                      onFitScreen();
                    }}
                    className="hover-scale fast-transition"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fit room to screen</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeTool === 'pan' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => onToolChange('pan')}
                    className="hover-scale fast-transition"
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pan around canvas</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Edit Tools */}
            <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="hover-scale fast-transition disabled:opacity-50"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo (Ctrl/Cmd+Z)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="hover-scale fast-transition disabled:opacity-50"
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo (Ctrl/Cmd+Y)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onCopy}
                    disabled={!canCopy}
                    className="hover-scale fast-transition disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Duplicate selected element</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onDelete}
                    disabled={!canDelete}
                    className="hover-scale fast-transition disabled:opacity-50 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete selected element</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* View Tools */}
            <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showGrid ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={onToggleGrid}
                    className="hover-scale fast-transition"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle grid</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showRuler ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={onToggleRuler}
                    className="hover-scale fast-transition"
                  >
                    <Ruler className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Measurement tool - click two points to measure</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeTool === 'tape-measure' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => onToolChange('tape-measure')}
                    className="hover-scale fast-transition"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12h20"/>
                      <path d="M6 12l-4 8"/>
                      <path d="M10 12H4"/>
                      <path d="M14 12h-4"/>
                      <path d="M18 12h-4"/>
                      <path d="M22 12h-4"/>
                      <path d="M6 4l4 8"/>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tape measure - click two points or drag to measure</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeView === '3d' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => onViewChange(activeView === '2d' ? '3d' : '2d')}
                    className="hover-scale fast-transition"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle 3D view</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Reset Tool */}
            <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onReset}
                    className="hover-scale fast-transition hover:bg-destructive/10 text-xs"
                  >
                    <RotateCw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset entire design</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Right Section - Right Panel Toggle */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={showRightPanel ? 'default' : 'outline'} 
                  size="sm"
                  onClick={onToggleRightPanel}
                  className="hover-scale fast-transition"
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle properties panel</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};