import React, { useState } from 'react';
import { DesignElement } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight,
  Square,
  Box,
  Layers,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';

interface ComponentSelectorProps {
  elements: DesignElement[];
  selectedElement: DesignElement | null;
  onSelectElement: (element: DesignElement | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onDeleteElement: (id: string) => void;
}

interface GroupedElements {
  [category: string]: DesignElement[];
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  elements,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  onDeleteElement
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['cabinet', 'appliance']));
  const [sortBy, setSortBy] = useState<'type' | 'name' | 'position'>('type');

  // Group elements by type
  const groupedElements: GroupedElements = elements.reduce((acc, element) => {
    const category = element.type;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(element);
    return acc;
  }, {} as GroupedElements);

  // Sort elements within each group
  Object.keys(groupedElements).forEach(category => {
    groupedElements[category].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.style || a.id).localeCompare(b.style || b.id);
        case 'position':
          return a.x - b.x || a.y - b.y;
        case 'type':
        default:
          return (a.style || a.id).localeCompare(b.style || b.id);
      }
    });
  });

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'cabinet': return <Box className="h-4 w-4" />;
      case 'appliance': return <Square className="h-4 w-4" />;
      case 'counter-top': return <Layers className="h-4 w-4" />;
      case 'end-panel': return <Square className="h-4 w-4" />;
      default: return <Box className="h-4 w-4" />;
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
    // For now, we'll use a custom property to track visibility
    // In a full implementation, this might be part of the element state
    const isHidden = (element as any).hidden;
    onUpdateElement(element.id, { ...(element as any), hidden: !isHidden });
  };

  if (elements.length === 0) {
    return (
      <Card className="w-80 h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Layers className="h-4 w-4 mr-2" />
            Components ({elements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No components on canvas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 h-fit max-h-96 overflow-hidden flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Layers className="h-4 w-4 mr-2" />
            Components ({elements.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 h-6 w-6"
          >
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        </div>
        
        {isOpen && (
          <div className="flex items-center gap-2 mt-2">
            <Select value={sortBy} onValueChange={(value: 'type' | 'name' | 'position') => setSortBy(value)}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="type">Group by Type</SelectItem>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="position">Sort by Position</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent className="flex-1 overflow-auto sidebar-scroll">
          <CardContent className="pt-0 space-y-2">
            {Object.entries(groupedElements).map(([category, categoryElements]) => (
              <div key={category} className="border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto rounded-none"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span className="text-xs font-medium">
                      {getCategoryLabel(category)} ({categoryElements.length})
                    </span>
                  </div>
                  {expandedCategories.has(category) ? 
                    <ChevronDown className="h-3 w-3" /> : 
                    <ChevronRight className="h-3 w-3" />
                  }
                </Button>
                
                {expandedCategories.has(category) && (
                  <div className="bg-muted/20 max-h-40 overflow-auto sidebar-scroll">
                    {categoryElements.map((element) => {
                      const isSelected = selectedElement?.id === element.id;
                      const isHidden = (element as any).hidden;
                      
                      return (
                        <div
                          key={element.id}
                          className={`flex items-center gap-2 p-2 text-xs border-b border-border/50 last:border-b-0 hover:bg-muted/30 cursor-pointer ${
                            isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                          } ${isHidden ? 'opacity-50' : ''}`}
                          onClick={() => onSelectElement(isSelected ? null : element)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {getElementDisplayName(element)}
                            </div>
                            <div className="text-muted-foreground flex items-center gap-2">
                              <span>
                                {Math.round(element.width)}×{Math.round(element.depth || element.height)}cm
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {Math.round(element.x)},{Math.round(element.y)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleElementVisibilityToggle(element);
                              }}
                            >
                              {isHidden ? 
                                <EyeOff className="h-3 w-3" /> : 
                                <Eye className="h-3 w-3" />
                              }
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteElement(element.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
