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
      <div className="flex items-center gap-1 p-1 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 animate-fade-in">
        {views.map(({ id, name, icon: Icon, description }) => (
          <Tooltip key={id} delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={activeView === id ? "default" : "ghost"}
                onClick={() => onViewChange(id as View2DMode)}
                className={`flex items-center gap-1 text-xs px-3 py-2 transition-all duration-300 hover-scale ${
                  activeView === id 
                    ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                    : 'hover:bg-gray-200/70 hover:shadow-sm'
                }`}
              >
                <Icon className={`h-3 w-3 transition-transform duration-200 ${
                  activeView === id ? 'scale-110' : ''
                }`} />
                <span className="hidden sm:inline font-medium">{name}</span>
                {activeView === id && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 text-white text-xs max-w-xs">
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};