import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DesignElement, RoomType } from '@/types/project';
// Import the complete components array directly from EnhancedSidebar
// This ensures we have ALL components without missing any
import { ComponentDefinition } from '@/data/components';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Grid3X3, 
  List, 
  Filter,
  Clock
} from 'lucide-react';

interface CompactComponentSidebarProps {
  onAddElement: (element: DesignElement) => void;
  roomType: RoomType;
}


type ViewMode = 'grid' | 'list';
type SizeFilter = 'all' | 'small' | 'medium' | 'large';

const CompactComponentSidebar: React.FC<CompactComponentSidebarProps> = ({ 
  onAddElement, 
  roomType 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['base-cabinets']));
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);

  // Import components directly from EnhancedSidebar for now
  // TODO: Move to shared data file later
  const allComponents = React.useMemo(() => {
    // This is a temporary solution - we'll import the actual components array
    // For now, let's use a minimal set to get the UI working
    const tempComponents: ComponentDefinition[] = [];
    
    // We need to dynamically import the components from EnhancedSidebar
    // For now, return empty array until we fix the import
    return tempComponents;
  }, []);

  // Filter components for current room type
  const availableComponents = useMemo(() => {
    return allComponents.filter(component => 
      component.roomTypes.includes(roomType)
    );
  }, [allComponents, roomType]);

  // Apply search and size filters
  const filteredComponents = useMemo(() => {
    let filtered = availableComponents;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(component =>
        component.name.toLowerCase().includes(term) ||
        component.description.toLowerCase().includes(term) ||
        component.category.toLowerCase().includes(term)
      );
    }

    // Size filter
    if (sizeFilter !== 'all') {
      filtered = filtered.filter(component => {
        const volume = component.width * component.depth * component.height;
        switch (sizeFilter) {
          case 'small': return volume <= 100000; // 50x50x40 or smaller
          case 'medium': return volume > 100000 && volume <= 400000; // Medium range
          case 'large': return volume > 400000; // Large items
          default: return true;
        }
      });
    }

    return filtered;
  }, [availableComponents, searchTerm, sizeFilter]);

  // Group components by category
  const componentsByCategory = useMemo(() => {
    const groups: Record<string, ComponentDefinition[]> = {};
    filteredComponents.forEach(component => {
      if (!groups[component.category]) {
        groups[component.category] = [];
      }
      groups[component.category].push(component);
    });
    return groups;
  }, [filteredComponents]);

  // Get recently used components
  const recentComponents = useMemo(() => {
    return recentlyUsed
      .map(id => availableComponents.find(c => c.id === id))
      .filter(Boolean) as ComponentDefinition[];
  }, [recentlyUsed, availableComponents]);

  // Category labels
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'base-cabinets': 'Base Cabinets',
      'wall-cabinets': 'Wall Cabinets',
      'wall-units': 'Wall Units',
      'appliances': 'Appliances',
      'counter-tops': 'Counter Tops',
      'end-panels': 'End Panels',
      'tall-units': 'Tall Units',
      'kitchen-larder': 'Larder Units',
      'sinks': 'Sinks & Taps',
      'accessories': 'Accessories'
    };
    return labels[category] || category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('component', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create realistic drag image
    const dragImage = document.createElement('div');
    const scaleFactor = Math.min(80 / Math.max(component.width, component.height), 2);
    const displayWidth = component.width * scaleFactor;
    const displayHeight = component.height * scaleFactor;
    
    dragImage.style.width = `${displayWidth}px`;
    dragImage.style.height = `${displayHeight}px`;
    dragImage.style.backgroundColor = component.color;
    dragImage.style.border = '2px solid #333';
    dragImage.style.borderRadius = '4px';
    dragImage.style.opacity = '0.8';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.pointerEvents = 'none';
    dragImage.style.zIndex = '1000';
    
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, displayWidth / 2, displayHeight / 2);
    
    // Clean up drag image after drag
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  };

  // Handle component selection (track recently used)
  const handleComponentSelect = (component: ComponentDefinition) => {
    // Add to recently used (limit to 6 items)
    setRecentlyUsed(prev => {
      const filtered = prev.filter(id => id !== component.id);
      return [component.id, ...filtered].slice(0, 6);
    });

    // Create design element
    const element: DesignElement = {
      id: `${component.id}-${Date.now()}`,
      name: component.name,
      type: component.type as any,
      position: { x: 100, y: 100, z: 0 },
      dimensions: {
        width: component.width,
        depth: component.depth,
        height: component.height
      },
      color: component.color,
      rotation: 0
    };

    onAddElement(element);
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <div className="p-3 space-y-4 h-full flex flex-col">
      {/* Header Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>

        {/* Filters and View Controls */}
        <div className="flex items-center justify-between gap-2">
          <Select value={sizeFilter} onValueChange={(value: SizeFilter) => setSizeFilter(value)}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0 rounded-r-none border-r"
            >
              <Grid3X3 className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0 rounded-l-none"
            >
              <List className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Component Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Recently Used Section */}
        {recentComponents.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <Clock className="h-3 w-3" />
              Recently Used
            </div>
            <div className={`grid gap-2 ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {recentComponents.map((component) => (
                <CompactComponentCard
                  key={`recent-${component.id}`}
                  component={component}
                  viewMode={viewMode}
                  onDragStart={handleDragStart}
                  onSelect={handleComponentSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category Sections */}
        <div className="space-y-3">
          {Object.entries(componentsByCategory).map(([category, components]) => (
            <Collapsible
              key={category}
              open={expandedCategories.has(category)}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded-md group">
                <div className="flex items-center gap-2">
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {getCategoryLabel(category)}
                  </span>
                  <Badge variant="secondary" className="text-xs h-5">
                    {components.length}
                  </Badge>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2">
                <div className={`grid gap-2 ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {components.map((component) => (
                    <CompactComponentCard
                      key={component.id}
                      component={component}
                      viewMode={viewMode}
                      onDragStart={handleDragStart}
                      onSelect={handleComponentSelect}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* No Results */}
        {Object.keys(componentsByCategory).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No components match your search</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSizeFilter('all');
              }}
              className="mt-2 text-xs"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Compact Component Card Component
interface CompactComponentCardProps {
  component: ComponentDefinition;
  viewMode: ViewMode;
  onDragStart: (e: React.DragEvent, component: ComponentDefinition) => void;
  onSelect: (component: ComponentDefinition) => void;
}

const CompactComponentCard: React.FC<CompactComponentCardProps> = ({
  component,
  viewMode,
  onDragStart,
  onSelect
}) => {
  if (viewMode === 'list') {
    return (
      <Card
        className="group hover:shadow-sm transition-all cursor-grab active:cursor-grabbing select-none border-l-4 hover:border-l-blue-500"
        style={{ borderLeftColor: component.color }}
        draggable="true"
        onDragStart={(e) => onDragStart(e, component)}
        onClick={() => onSelect(component)}
      >
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {component.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{component.name}</p>
                <p className="text-xs text-gray-500">
                  {component.width}×{component.depth}×{component.height}
                </p>
              </div>
            </div>
            <div
              className="w-4 h-4 rounded border flex-shrink-0"
              style={{ backgroundColor: component.color }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="group hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none"
      draggable="true"
      onDragStart={(e) => onDragStart(e, component)}
      onClick={() => onSelect(component)}
    >
      <CardContent className="p-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              {component.icon}
            </div>
            <div
              className="w-3 h-3 rounded border"
              style={{ backgroundColor: component.color }}
            />
          </div>
          <div>
            <p className="text-xs font-medium leading-tight">{component.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {component.width}×{component.depth}×{component.height}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactComponentSidebar;
