import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Save, Users, Layers, Grid3X3, Ruler, MousePointer2 } from 'lucide-react';
import { RoomType } from '@/pages/Designer';

interface StatusBarProps {
  elementCount: number;
  selectedElementId?: string;
  showGrid: boolean;
  showRuler: boolean;
  activeTool: 'select' | 'fit-screen' | 'pan' | 'none';
  roomType: RoomType;
  roomDimensions: { width: number; height: number };
  lastSaved?: Date;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  elementCount,
  selectedElementId,
  showGrid,
  showRuler,
  activeTool,
  roomType,
  roomDimensions,
  lastSaved
}) => {
  const formatRoomType = (type: RoomType) => {
    return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatLastSaved = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <TooltipProvider>
      <div className="h-8 bg-muted/30 border-t flex items-center justify-between px-4 text-xs text-muted-foreground">
        {/* Left Section - Room Info */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {formatRoomType(roomType)}
          </Badge>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <span>{roomDimensions.width}×{roomDimensions.height}cm</span>
          </div>
        </div>

        {/* Center Section - Element Info */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>{elementCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{elementCount} elements in design</p>
            </TooltipContent>
          </Tooltip>

          {selectedElementId && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                Selected
              </Badge>
            </>
          )}
        </div>

        {/* Right Section - Tools & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <MousePointer2 className="h-3 w-3" />
                  <span className="capitalize">{activeTool}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Current tool: {activeTool}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-4" />

          <div className="flex items-center gap-2">
            {showGrid && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Grid3X3 className="h-3 w-3 text-primary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Grid enabled</p>
                </TooltipContent>
              </Tooltip>
            )}
            {showRuler && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Ruler className="h-3 w-3 text-primary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ruler enabled</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <Separator orientation="vertical" className="h-4" />

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Save className="h-3 w-3" />
                <span>{formatLastSaved(lastSaved)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last saved: {formatLastSaved(lastSaved)}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};