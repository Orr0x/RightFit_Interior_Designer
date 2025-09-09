
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KeyboardShortcutsHelp } from '@/components/designer/KeyboardShortcutsHelp';
import { RoomType } from '@/pages/Designer';
import { 
  MousePointer2, 
  Square, 
  Move, 
  RotateCw, 
  Copy, 
  Trash2,
  Grid3X3,
  Ruler,
  Eye,
  Undo2,
  Redo2,
  PanelLeft,
  PanelRight,
  Save,
  Plus,
  Home,
  Bed,
  Bath,
  Tv,
  Grid2X2,
  Layers,
  Target,
  Maximize2,
  Settings,
  Sparkles
} from 'lucide-react';

interface DesignToolbarProps {
  activeView: '2d' | '3d';
  onViewChange: (view: '2d' | '3d') => void;
  activeTool: 'select' | 'fit-screen' | 'pan' | 'none';
  onToolChange: (tool: 'select' | 'fit-screen' | 'pan' | 'none') => void;
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
  
  // Get room-specific icon and color
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
        {/* First Row - Panel Toggles and Room Info */}
        <div className="flex items-center justify-between w-full p-2 border-b border-gray-100">
          {/* Left Section - Panel Toggle & Room Info */}
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

            {/* Room Type Indicator */}
            <div className={getRoomIndicatorClass(roomType)}>
              <RoomIcon className="h-3 w-3 mr-1" />
              <span className="capitalize">{roomType.replace('-', ' ')}</span>
            </div>

            {/* Element Counter */}
            <Badge variant="secondary" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              {elementCount} elements
            </Badge>
          </div>

          {/* Right Section - Panel Toggle & Quick Actions */}
          <div className="flex items-center gap-2">
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

        {/* Second Row - Tool Groups */}
        <div className="flex items-center justify-center w-full p-2">
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

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onValidateDesign}
                    className="hover-scale fast-transition text-xs hover:bg-primary/10 hover:text-primary"
                  >
                    <Target className="h-4 w-4 mr-1" />
                    Validate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Validate design for completeness (V)</p>
                </TooltipContent>
              </Tooltip>

              <KeyboardShortcutsHelp />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
