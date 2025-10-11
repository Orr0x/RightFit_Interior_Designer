import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  View,
  Square,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Grid3x3
} from 'lucide-react';
import type { RoomGeometry } from '@/types/RoomGeometry';
import { calculateWallLength, isWallOnPerimeter } from '@/services/2d-renderers/elevation-helpers';

export type View2DMode = 'plan' | 'front' | 'back' | 'left' | 'right';

interface ViewSelectorProps {
  activeView: View2DMode;
  onViewChange: (view: View2DMode) => void;
  // Wall-count elevation system props (optional, for complex rooms)
  roomGeometry?: RoomGeometry | null;
  selectedWallId?: string | null;
  onWallChange?: (wallId: string) => void;
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({
  activeView,
  onViewChange,
  roomGeometry,
  selectedWallId,
  onWallChange
}) => {
  // Debug logging
  console.log('🎛️ [ViewSelector] Rendering with:', {
    hasRoomGeometry: !!roomGeometry,
    wallCount: roomGeometry?.walls?.length,
    selectedWallId,
    hasOnWallChange: !!onWallChange
  });

  const views = [
    { id: 'plan', name: 'Plan', icon: Square, description: 'Top-down view - Shows layout and positioning' },
    { id: 'front', name: 'Front', icon: ArrowUp, description: 'Front wall elevation - Shows cabinet heights and wall units' },
    { id: 'back', name: 'Back', icon: ArrowDown, description: 'Back wall elevation - Shows cabinet heights and wall units' },
    { id: 'left', name: 'Left', icon: ArrowLeft, description: 'Left wall elevation - Shows cabinet heights and wall units' },
    { id: 'right', name: 'Right', icon: ArrowRight, description: 'Right wall elevation - Shows cabinet heights and wall units' }
  ] as const;

  // Detect complex room: has room geometry with more than 4 walls
  const isComplexRoom = roomGeometry && roomGeometry.walls && roomGeometry.walls.length > 4;

  console.log('🎛️ [ViewSelector] isComplexRoom:', isComplexRoom);

  // Simple room: Show original 5-button layout
  if (!isComplexRoom) {
    return (
      <TooltipProvider>
        <div className="flex flex-col items-center gap-1 p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 animate-fade-in">
          {views.map(({ id, name, icon: Icon, description }) => (
            <Tooltip key={id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewChange(id as View2DMode)}
                  className={`w-10 h-10 p-0 transition-all duration-200 hover-scale ${
                    activeView === id
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg scale-105'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white text-xs max-w-xs">
                <p className="font-medium">{name}</p>
                <p className="text-gray-300">{description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  // Complex room: Show Plan button + Wall dropdown
  const bboxgeometry = roomGeometry.bounding_box;

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-2 p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 animate-fade-in">
        {/* Plan View Button */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewChange('plan')}
              className={`w-10 h-10 p-0 transition-all duration-200 hover-scale ${
                activeView === 'plan'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg scale-105'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Square className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white text-xs max-w-xs">
            <p className="font-medium">Plan View</p>
            <p className="text-gray-300">Top-down view - Shows layout and positioning</p>
          </TooltipContent>
        </Tooltip>

        {/* Wall Selector Dropdown */}
        {activeView !== 'plan' && onWallChange && (
          <div className="w-48">
            <Select value={selectedWallId || undefined} onValueChange={onWallChange}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select wall..." />
              </SelectTrigger>
              <SelectContent>
                {roomGeometry.walls.map((wall, index) => {
                  const length = Math.round(calculateWallLength(wall));
                  const type = isWallOnPerimeter(wall, bboxgeometry) ? 'Perimeter' : 'Interior';
                  return (
                    <SelectItem key={wall.id} value={wall.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Grid3x3 className="h-3 w-3" />
                        <span>Wall {index + 1}</span>
                        <span className="text-muted-foreground">({length}cm - {type})</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Elevation View Toggle (when not in plan view) */}
        {activeView !== 'plan' && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="w-10 h-10 p-0 bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white text-xs max-w-xs">
              <p className="font-medium">Elevation View</p>
              <p className="text-gray-300">Select wall above to change view</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};