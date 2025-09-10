import React, { useState, useEffect } from 'react';
import { DesignElement } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Layers,
  Square,
  Box,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';

interface CanvasElementCounterProps {
  elements: DesignElement[];
  selectedElement: DesignElement | null;
  onSelectElement: (element: DesignElement | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onDeleteElement: (id: string) => void;
}

interface GroupedElements {
  [category: string]: DesignElement[];
}

export const CanvasElementCounter: React.FC<CanvasElementCounterProps> = ({
  elements,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  onDeleteElement
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Group elements by type
  const groupedElements: GroupedElements = elements.reduce((acc, element) => {
    const category = element.type;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(element);
    return acc;
  }, {} as GroupedElements);

  // Sort elements within each group by position
  Object.keys(groupedElements).forEach(category => {
    groupedElements[category].sort((a, b) => {
      return a.x - b.x || a.y - b.y;
    });
  });

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'cabinet': return <Box className="h-3 w-3" />;
      case 'appliance': return <Square className="h-3 w-3" />;
      case 'counter-top': return <Layers className="h-3 w-3" />;
      case 'end-panel': return <Square className="h-3 w-3" />;
      default: return <Box className="h-3 w-3" />;
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'cabinet': return 'Cabinets';
      case 'appliance': return 'Appliances';
      case 'counter-top': return 'Counter Tops';
      case 'end-panel': return 'End Panels';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getElementDisplayName = (element: DesignElement) => {
    return element.style || element.id.split('-').slice(0, -1).join(' ');
  };

  const handleElementVisibilityToggle = (element: DesignElement) => {
    const isHidden = (element as any).hidden;
    onUpdateElement(element.id, { ...(element as any), hidden: !isHidden });
  };

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Add a small delay before hiding to allow cursor movement between badge and dropdown
    const timeout = setTimeout(() => {
      setIsHovered(false);
    }, 150); // 150ms delay
    setHoverTimeout(timeout);
  };

  if (elements.length === 0) {
    return (
      <div className="absolute top-4 right-4 z-20">
        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
          <Layers className="h-3 w-3 mr-1" />
          0 elements
        </Badge>
      </div>
    );
  }

  return (
    <div 
      className="absolute top-4 right-4 z-20"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Element Counter Badge */}
      <Badge 
        variant="outline" 
        className="bg-white/90 backdrop-blur-sm cursor-pointer hover:bg-white transition-colors"
      >
        <Layers className="h-3 w-3 mr-1" />
        {elements.length} elements
      </Badge>

      {/* Dropdown Panel - Shows on Hover */}
      {isHovered && (
        <Card className="absolute top-full right-0 mt-2 w-80 max-h-[630px] overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-[630px] overflow-y-auto">
              {Object.entries(groupedElements).map(([category, categoryElements]) => (
                <div key={category} className="border-b border-border/50 last:border-b-0">
                  {/* Category Header */}
                  <div className="bg-muted/30 px-3 py-2 text-xs font-medium flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span>{getCategoryLabel(category)} ({categoryElements.length})</span>
                  </div>
                  
                  {/* Category Elements */}
                  <div className="divide-y divide-border/30">
                    {categoryElements.map((element) => {
                      const isSelected = selectedElement?.id === element.id;
                      const isHidden = (element as any).hidden;
                      
                      return (
                        <div
                          key={element.id}
                          className={`flex items-center gap-2 p-2 text-xs hover:bg-muted/20 cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                          } ${isHidden ? 'opacity-50' : ''}`}
                          onClick={() => onSelectElement(isSelected ? null : element)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-xs">
                              {getElementDisplayName(element)}
                            </div>
                            <div className="text-muted-foreground flex items-center gap-2 text-[10px]">
                              <span>
                                {Math.round(element.width)}×{Math.round(element.depth || element.height)}cm
                              </span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-auto">
                                {Math.round(element.x)},{Math.round(element.y)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-5 w-5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleElementVisibilityToggle(element);
                              }}
                            >
                              {isHidden ? 
                                <EyeOff className="h-2.5 w-2.5" /> : 
                                <Eye className="h-2.5 w-2.5" />
                              }
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-5 w-5 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteElement(element.id);
                              }}
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
