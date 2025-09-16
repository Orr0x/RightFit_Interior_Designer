import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DesignElement, RoomType } from '@/types/project';
import useOptimizedComponents from '@/hooks/useOptimizedComponents';
import { useIsMobile } from '@/hooks/use-mobile';
import { LoadingSpinner } from '@/components/designer/LoadingSpinner';
// Define DatabaseComponent type locally since it may not be in generated types yet
interface DatabaseComponent {
  id: string;
  component_id: string;
  name: string;
  description: string | null;
  type: string;
  category: string;
  width: number;
  height: number;
  depth: number;
  room_types: string[];
  icon_name: string;
  model_url: string | null;
  thumbnail_url: string | null;
  price: number | null;
  deprecated: boolean;
  tags: string[] | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  color?: string; // Optional color property
}
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Grid3X3, 
  List, 
  Filter,
  Clock,
  Square,
  Archive,
  Refrigerator,
  Waves,
  Package
} from 'lucide-react';

interface CompactComponentSidebarProps {
  onAddElement: (element: DesignElement) => void;
  roomType: RoomType;
}


type ViewMode = 'grid' | 'list';
type SizeFilter = 'all' | 'small' | 'medium' | 'large';

// Simple icon mapping function
const getIconComponent = (iconName: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    'Square': <Square className="h-4 w-4" />,
    'Archive': <Archive className="h-4 w-4" />,
    'Refrigerator': <Refrigerator className="h-4 w-4" />,
    'Waves': <Waves className="h-4 w-4" />,
    'Package': <Package className="h-4 w-4" />
  };
  
  return iconMap[iconName] || <Square className="h-4 w-4" />;
};

const CompactComponentSidebar: React.FC<CompactComponentSidebarProps> = ({ 
  onAddElement, 
  roomType 
}) => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['base-cabinets']));
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);

  // 🚀 DATABASE-DRIVEN COMPONENTS! Load all 154 components from Supabase
  const { components, loading, error, refetch } = useOptimizedComponents();
  
  // Use database components directly (no conversion needed)
  const allComponents = useMemo(() => {
    return components || [];
  }, [components]);

  // Filter components for current room type with debugging - only when not loading
  const availableComponents = useMemo(() => {
    // Don't filter if still loading or no components yet
    if (loading || allComponents.length === 0) {
      return [];
    }
    
    console.log(`🔍 [CompactComponentSidebar] Filtering components for room type: ${roomType}`);
    console.log(`🔍 [CompactComponentSidebar] Total components loaded: ${allComponents.length}`);
    
    const filtered = allComponents.filter(component => 
      component.room_types.includes(roomType)
    );
    
    console.log(`🔍 [CompactComponentSidebar] Components available for ${roomType}: ${filtered.length}`);
    
    // Debug wall units specifically - check both possible category formats
    const wallUnitsLowercase = filtered.filter(comp => comp.category === 'wall-units');
    const wallUnitsTitle = filtered.filter(comp => comp.category === 'Wall Units');
    const totalWallUnits = wallUnitsLowercase.length + wallUnitsTitle.length;
    
    console.log(`🏠 [CompactComponentSidebar] Wall units available for ${roomType}: ${totalWallUnits} (lowercase: ${wallUnitsLowercase.length}, title: ${wallUnitsTitle.length})`);
    if (totalWallUnits > 0) {
      const allWallUnits = [...wallUnitsLowercase, ...wallUnitsTitle];
      console.log('🏠 [CompactComponentSidebar] Available wall units:', allWallUnits.map(w => w.name));
    } else {
      console.warn(`⚠️ [CompactComponentSidebar] NO WALL UNITS AVAILABLE for room type: ${roomType}`);
    }
    
    return filtered;
  }, [allComponents, roomType, loading]);

  // Apply search and size filters
  const filteredComponents = useMemo(() => {
    let filtered = availableComponents;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(component =>
        component.name.toLowerCase().includes(term) ||
        (component.description && component.description.toLowerCase().includes(term)) ||
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

  // Group components by category with debugging
  const componentsByCategory = useMemo(() => {
    console.log(`📂 [CompactComponentSidebar] Grouping ${filteredComponents.length} filtered components by category`);
    
    const groups: Record<string, DatabaseComponent[]> = {};
    filteredComponents.forEach(component => {
      if (!groups[component.category]) {
        groups[component.category] = [];
      }
      groups[component.category].push(component);
    });
    
    const categoryList = Object.keys(groups).sort();
    console.log('📂 [CompactComponentSidebar] Final categories with components:', categoryList);
    
    // Debug each category count
    categoryList.forEach(category => {
      const count = groups[category].length;
      console.log(`📂 [CompactComponentSidebar] ${category}: ${count} components`);
      
      // Check for wall units in both possible formats
      if (category === 'wall-units' || category === 'Wall Units') {
        console.log('🏠 [CompactComponentSidebar] Wall units in final group:', groups[category].map(w => w.name));
      }
    });
    
    // Check if wall units category exists (check both formats)
    const hasWallUnitsLowercase = !!groups['wall-units'];
    const hasWallUnitsTitle = !!groups['Wall Units'];
    
    if (!hasWallUnitsLowercase && !hasWallUnitsTitle) {
      console.error('❌ [CompactComponentSidebar] WALL UNITS CATEGORY MISSING FROM FINAL GROUPS!');
      console.log('📂 [CompactComponentSidebar] Available categories:', categoryList);
    } else {
      const wallUnitsCount = (groups['wall-units']?.length || 0) + (groups['Wall Units']?.length || 0);
      console.log(`✅ [CompactComponentSidebar] Wall units category found with ${wallUnitsCount} components`);
    }
    
    return groups;
  }, [filteredComponents]);

  // Get recently used components
  const recentComponents = useMemo(() => {
    return recentlyUsed
      .map(id => availableComponents.find(c => c.component_id === id))
      .filter(Boolean) as DatabaseComponent[];
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

  // Handle mobile click-to-add - directly add component to canvas center
  const handleMobileClickToAdd = (component: DatabaseComponent) => {
    console.log('📱 [Mobile Click-to-Add] Adding component:', component.name);
    
    // Create a new design element positioned at canvas center
    const newElement: DesignElement = {
      id: `${component.component_id}-${Date.now()}`,
      type: component.type as any,
      x: 200, // Center-ish position (will be adjustable by dragging)
      y: 150, // Center-ish position
      z: 0, // Will be set by component behavior logic
      width: component.width,
      height: component.height,
      depth: component.depth,
      rotation: 0,
      color: component.color || '#8B4513',
      name: component.name,
      category: component.category
    };

    // Add to canvas and update recently used
    onAddElement(newElement);
    
    // Update recently used components
    setRecentlyUsed(prev => {
      const updated = [component.component_id, ...prev.filter(id => id !== component.component_id)];
      return updated.slice(0, 5); // Keep only 5 most recent
    });
    
    console.log('✅ [Mobile Click-to-Add] Component added to canvas at (200, 150)');
  };

  // Handle drag start - only serialize essential data (no React components)
  const handleDragStart = (e: React.DragEvent, component: DatabaseComponent) => {
    // Create clean data object without React components for serialization
    const dragData = {
      id: component.component_id,
      name: component.name,
      type: component.type,
      width: component.width,
      depth: component.depth,
      height: component.height,
      color: component.color,
      category: component.category,
      roomTypes: component.room_types,
      description: component.description
    };
    
    e.dataTransfer.setData('component', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    
    // 🎯 CREATE A COMPONENT-SHAPED DRAG PREVIEW (WORKING VERSION)
    // Show the actual footprint/shape of the component with size adjustment
    const dragPreview = document.createElement('div');

    // Calculate scale to make drag preview match canvas size better
    const scaleFactor = 1.15; // Increase by 15% to better match canvas components
    
    // Check if this is a corner component that uses L-shaped footprint (90x90cm)
    // Check both component_id and name since we're using DatabaseComponent interface
    const componentIdentifier = component.component_id || component.name || '';
    const isCornerComponent = componentIdentifier.toLowerCase().includes('corner') ||
                             componentIdentifier.toLowerCase().includes('larder corner');
    
    // Debug logging to see what's happening
    console.log('🔍 [Drag Preview Debug]:', {
      id: component.component_id,
      name: component.name,
      isCornerComponent,
      originalDimensions: `${component.width}x${component.depth}x${component.height}`,
      previewDimensions: isCornerComponent ? '90x90' : `${component.width}x${component.depth}`
    });
    
    // Tall corner unit dimensions are now correct (90x90cm) after database migration
    
    let previewWidth, previewDepth;
    if (isCornerComponent) {
      // L-shaped components use 90x90 footprint for drag preview
      previewWidth = 90 * scaleFactor;
      previewDepth = 90 * scaleFactor;
    } else {
      // Standard components use their actual dimensions
      previewWidth = component.width * scaleFactor;
      previewDepth = component.depth * scaleFactor;
    }

    // Style to look like the actual component footprint
    dragPreview.style.width = `${previewWidth}px`;
    dragPreview.style.height = `${previewDepth}px`; // depth becomes height in 2D
    dragPreview.style.backgroundColor = component.color || '#8b5cf6';
    dragPreview.style.border = '2px solid #333';
    dragPreview.style.borderRadius = '3px';
    dragPreview.style.opacity = '0.8';
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-1000px';
    dragPreview.style.left = '-1000px';
    dragPreview.style.pointerEvents = 'none';

    // For corner components, create L-shaped visual by adding inner divs
    if (isCornerComponent) {
      dragPreview.style.backgroundColor = 'transparent';
      
      // Create two rectangles to form L-shape
      const legSize = 90 * scaleFactor / 2; // Each leg is half the total size
      
      // Horizontal leg (top)
      const horizontalLeg = document.createElement('div');
      horizontalLeg.style.width = `${90 * scaleFactor}px`;
      horizontalLeg.style.height = `${legSize}px`;
      horizontalLeg.style.backgroundColor = component.color || '#8b5cf6';
      horizontalLeg.style.border = '1px solid #333';
      horizontalLeg.style.position = 'absolute';
      horizontalLeg.style.top = '0px';
      horizontalLeg.style.left = '0px';
      
      // Vertical leg (left)
      const verticalLeg = document.createElement('div');
      verticalLeg.style.width = `${legSize}px`;
      verticalLeg.style.height = `${90 * scaleFactor}px`;
      verticalLeg.style.backgroundColor = component.color || '#8b5cf6';
      verticalLeg.style.border = '1px solid #333';
      verticalLeg.style.position = 'absolute';
      verticalLeg.style.top = '0px';
      verticalLeg.style.left = '0px';
      
      dragPreview.appendChild(horizontalLeg);
      dragPreview.appendChild(verticalLeg);
    }
    dragPreview.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    dragPreview.style.display = 'flex';
    dragPreview.style.alignItems = 'center';
    dragPreview.style.justifyContent = 'center';

    // Add dimensions label
    const label = document.createElement('div');
    label.textContent = `${component.width}×${component.depth}`;
    label.style.fontSize = '10px';
    label.style.fontWeight = 'bold';
    label.style.color = '#fff';
    label.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
    label.style.whiteSpace = 'nowrap';

    dragPreview.appendChild(label);
    document.body.appendChild(dragPreview);

    // Set the component-shaped preview as drag image
    e.dataTransfer.setDragImage(dragPreview, previewWidth / 2, previewDepth / 2);

    // Clean up after drag
    setTimeout(() => {
      if (document.body.contains(dragPreview)) {
        document.body.removeChild(dragPreview);
      }
    }, 0);
  };

  // Handle component selection (track recently used)
  const handleComponentSelect = (component: DatabaseComponent) => {
    // Add to recently used (limit to 6 items)
    setRecentlyUsed(prev => {
      const filtered = prev.filter(id => id !== component.component_id);
      return [component.component_id, ...filtered].slice(0, 6);
    });

    // Set default Z position based on component type
    let defaultZ = 0; // Default for floor-mounted components
    if (component.type === 'cornice') {
      defaultZ = 200; // 200cm height for cornice (top of wall units)
    } else if (component.type === 'pelmet') {
      defaultZ = 140; // 140cm height for pelmet (FIXED: bottom of wall units)
    } else if (component.type === 'counter-top') {
      defaultZ = 90; // 90cm height for counter tops
    } else if (component.type === 'cabinet' && component.component_id.includes('wall-cabinet')) {
      defaultZ = 140; // 140cm height for wall cabinets
    } else if (component.type === 'wall-unit-end-panel') {
      defaultZ = 200; // 200cm height for wall unit end panels
    } else if (component.type === 'window') {
      defaultZ = 90; // 90cm height for windows
    }

    // Create design element with proper structure and default Z positioning
    const element: DesignElement = {
      id: `${component.id}-${Date.now()}`,
      name: component.name,
      type: component.type as any,
      x: 100,
      y: 100,
      z: defaultZ,
      width: component.width,
      depth: component.depth,
      height: component.height,
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

  // 🚀 Loading and error states for database components with debugging
  if (loading) {
    console.log('⏳ [CompactComponentSidebar] Component sidebar in loading state');
    return (
      <div className="p-3 h-full flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="text-sm text-gray-600 mt-2">Loading components from database...</p>
        <p className="text-xs text-gray-500 mt-1">Network: {navigator.onLine ? '🟢 Online' : '🔴 Offline'}</p>
      </div>
    );
  }

  if (error) {
    console.error('💥 [CompactComponentSidebar] Component sidebar in error state:', error);
    console.log('🌐 [CompactComponentSidebar] Network status:', {
      online: navigator.onLine,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    
    return (
      <div className="p-3 h-full flex flex-col items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="font-medium">Failed to load components</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          <p className="text-xs text-gray-500 mt-1">
            Network: {navigator.onLine ? '🟢 Online' : '🔴 Offline'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={() => {
              console.log('🔄 [CompactComponentSidebar] Manual retry requested');
              refetch();
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Debug summary when components are successfully loaded
  console.log(`✅ [CompactComponentSidebar] Component sidebar rendered successfully`);
  console.log(`✅ [CompactComponentSidebar] Summary: ${allComponents.length} total, ${availableComponents.length} for ${roomType}, ${Object.keys(componentsByCategory).length} categories`);

  return (
    <div className="h-full flex flex-col">
      {/* 🎉 DATABASE-DRIVEN COMPONENT LIBRARY - {allComponents.length} components loaded! */}
      {/* Header Controls - Fixed at top */}
      <div className="p-3 space-y-3 flex-shrink-0 border-b">
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

      {/* Component Content - Scrollable */}
      <div 
        className="flex-1 overflow-y-scroll p-3 space-y-4" 
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#9ca3af #f3f4f6',
          maxHeight: 'calc(100vh - 200px)' // Constrain height to force scrolling
        }}
      >
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
                  isMobile={isMobile}
                  onMobileClickToAdd={handleMobileClickToAdd}
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
                      isMobile={isMobile}
                      onMobileClickToAdd={handleMobileClickToAdd}
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
  component: DatabaseComponent;
  viewMode: ViewMode;
  onDragStart: (e: React.DragEvent, component: DatabaseComponent) => void;
  onSelect: (component: DatabaseComponent) => void;
  isMobile: boolean;
  onMobileClickToAdd: (component: DatabaseComponent) => void;
}

const CompactComponentCard: React.FC<CompactComponentCardProps> = ({
  component,
  viewMode,
  onDragStart,
  onSelect,
  isMobile,
  onMobileClickToAdd
}) => {
  if (viewMode === 'list') {
    return (
      <Card
        className={`group hover:shadow-sm transition-all select-none border-l-4 hover:border-l-blue-500 ${
          isMobile ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
        }`}
        style={{ borderLeftColor: component.color }}
        draggable={!isMobile}
        onDragStart={isMobile ? undefined : (e) => onDragStart(e, component)}
        onClick={() => isMobile ? onMobileClickToAdd(component) : onSelect(component)}
      >
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {getIconComponent(component.icon_name)}
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
      className={`group hover:shadow-md transition-all select-none ${
        isMobile ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
      }`}
      draggable={!isMobile}
      onDragStart={isMobile ? undefined : (e) => onDragStart(e, component)}
      onClick={() => isMobile ? onMobileClickToAdd(component) : onSelect(component)}
    >
      <CardContent className="p-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              {getIconComponent(component.icon_name)}
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
