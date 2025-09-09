import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  View, 
  Square, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react';

export type View2DMode = 'plan' | 'front' | 'back' | 'left' | 'right';

interface ViewSelectorProps {
  activeView: View2DMode;
  onViewChange: (view: View2DMode) => void;
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({ 
  activeView, 
  onViewChange 
}) => {
  const views = [
    { id: 'plan', name: 'Plan', icon: Square, description: 'Top-down view - Shows layout and positioning' },
    { id: 'front', name: 'Front', icon: ArrowUp, description: 'Front wall elevation - Shows cabinet heights and wall units' },
    { id: 'back', name: 'Back', icon: ArrowDown, description: 'Back wall elevation - Shows cabinet heights and wall units' },
    { id: 'left', name: 'Left', icon: ArrowLeft, description: 'Left wall elevation - Shows cabinet heights and wall units' },
    { id: 'right', name: 'Right', icon: ArrowRight, description: 'Right wall elevation - Shows cabinet heights and wall units' }
  ] as const;

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
};