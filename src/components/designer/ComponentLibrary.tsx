import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DesignElement, RoomType } from '@/types/project';
import { createSafeSVGElement } from '@/lib/security';
import {
  Refrigerator,
  Microwave,
  Waves,
  Square,
  Archive,
  Box,
  Zap,
  Wind,
  RectangleHorizontal,
  Bed,
  Shirt,
  Bath,
  Tv,
  Sofa,
  Grid3X3,
  Home,
  DoorOpen
} from 'lucide-react';

interface ComponentLibraryProps {
  onAddElement: (element: DesignElement) => void;
  roomType: RoomType;
}

interface ComponentDefinition {
  id: string;
  name: string;
  type: 'cabinet' | 'appliance';
  width: number;
  height: number;
  color: string;
  category: string;
  roomTypes: RoomType[];
  icon: React.ReactNode;
  description: string;
}

const components: ComponentDefinition[] = [
  // KITCHEN COMPONENTS (existing - untouched for safety)
  // Base unit cabinets
  {
    id: 'base-cabinet-30',
    name: 'Base Cabinet 30cm',
    type: 'cabinet',
    width: 30,
    height: 60,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Narrow 30cm base cabinet'
  },
  {
    id: 'base-cabinet-40',
    name: 'Base Cabinet 40cm',
    type: 'cabinet',
    width: 40,
    height: 60,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Compact 40cm base cabinet'
  },
  {
    id: 'base-cabinet-50',
    name: 'Base Cabinet 50cm',
    type: 'cabinet',
    width: 50,
    height: 60,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Medium 50cm base cabinet'
  },
  {
    id: 'base-cabinet-60',
    name: 'Base Cabinet 60cm',
    type: 'cabinet',
    width: 60,
    height: 60,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Standard 60cm base cabinet'
  },
  {
    id: 'corner-cabinet',
    name: 'Corner Base Cabinet',
    type: 'cabinet',
    width: 90,
    height: 90,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner base cabinet'
  },

  // Base unit drawers
  {
    id: 'pan-drawers-50',
    name: 'Pan Drawers 50cm',
    type: 'cabinet',
    width: 50,
    height: 60,
    color: '#8b4513',
    category: 'base-drawers',
    roomTypes: ['kitchen'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Medium 50cm pan drawer unit'
  },
  {
    id: 'pan-drawers-60',
    name: 'Pan Drawers 60cm',
    type: 'cabinet',
    width: 60,
    height: 60,
    color: '#8b4513',
    category: 'base-drawers',
    roomTypes: ['kitchen'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Standard 60cm pan drawer unit'
  },
  {
    id: 'pan-drawers-80',
    name: 'Pan Drawers 80cm',
    type: 'cabinet',
    width: 80,
    height: 60,
    color: '#8b4513',
    category: 'base-drawers',
    roomTypes: ['kitchen'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Wide 80cm pan drawer unit'
  },
  
  // Wall Units
  {
    id: 'wall-cabinet-30',
    name: 'Wall Cabinet 30cm',
    type: 'cabinet',
    width: 30,
    height: 60,
    color: '#a0522d',
    category: 'wall-units',
    roomTypes: ['kitchen'],
    icon: <Box className="h-4 w-4" />,
    description: 'Narrow 30cm wall cabinet'
  },
  {
    id: 'wall-cabinet-40',
    name: 'Wall Cabinet 40cm',
    type: 'cabinet',
    width: 40,
    height: 60,
    color: '#a0522d',
    category: 'wall-units',
    roomTypes: ['kitchen'],
    icon: <Box className="h-4 w-4" />,
    description: 'Compact 40cm wall cabinet'
  },
  {
    id: 'wall-cabinet-50',
    name: 'Wall Cabinet 50cm',
    type: 'cabinet',
    width: 50,
    height: 60,
    color: '#a0522d',
    category: 'wall-units',
    roomTypes: ['kitchen'],
    icon: <Box className="h-4 w-4" />,
    description: 'Medium 50cm wall cabinet'
  },
  {
    id: 'wall-cabinet-60',
    name: 'Wall Cabinet 60cm',
    type: 'cabinet',
    width: 60,
    height: 60,
    color: '#a0522d',
    category: 'wall-units',
    roomTypes: ['kitchen'],
    icon: <Box className="h-4 w-4" />,
    description: 'Standard 60cm wall cabinet'
  },
  {
    id: 'corner-wall-cabinet',
    name: 'Corner Wall Cabinet',
    type: 'cabinet',
    width: 90,
    height: 60,
    color: '#a0522d',
    category: 'wall-units',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner wall cabinet'
  },

  // Kitchen Appliances
  {
    id: 'refrigerator',
    name: 'Refrigerator',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#c0c0c0',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Refrigerator className="h-4 w-4" />,
    description: 'Standard refrigerator'
  },
  {
    id: 'dishwasher',
    name: 'Dishwasher',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#d3d3d3',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Waves className="h-4 w-4" />,
    description: 'Built-in dishwasher'
  },
  {
    id: 'oven',
    name: 'Built-in Oven',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#2c2c2c',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Microwave className="h-4 w-4" />,
    description: 'Built-in electric oven'
  },
  {
    id: 'washing-machine',
    name: 'Washing Machine',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#f0f0f0',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Front-loading washing machine'
  },
  {
    id: 'tumble-dryer',
    name: 'Tumble Dryer',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#e8e8e8',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Wind className="h-4 w-4" />,
    description: 'Tumble dryer with round door'
  },

  // BEDROOM COMPONENTS (new additions)
  {
    id: 'double-bed',
    name: 'Double Bed',
    type: 'appliance',
    width: 140,
    height: 200,
    color: '#8B4513',
    category: 'bedroom-furniture',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Bed className="h-4 w-4" />,
    description: 'Standard double bed frame'
  },
  {
    id: 'king-bed',
    name: 'King Size Bed',
    type: 'appliance',
    width: 160,
    height: 200,
    color: '#8B4513',
    category: 'bedroom-furniture',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Bed className="h-4 w-4" />,
    description: 'King size bed frame'
  },
  {
    id: 'wardrobe-2door',
    name: '2 Door Wardrobe',
    type: 'cabinet',
    width: 100,
    height: 60,
    color: '#654321',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Shirt className="h-4 w-4" />,
    description: 'Two door wardrobe'
  },
  {
    id: 'wardrobe-3door',
    name: '3 Door Wardrobe',
    type: 'cabinet',
    width: 150,
    height: 60,
    color: '#654321',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Shirt className="h-4 w-4" />,
    description: 'Three door wardrobe'
  },
  {
    id: 'chest-drawers',
    name: 'Chest of Drawers',
    type: 'cabinet',
    width: 80,
    height: 40,
    color: '#654321',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Four drawer chest'
  },
  {
    id: 'bedside-table',
    name: 'Bedside Table',
    type: 'cabinet',
    width: 40,
    height: 40,
    color: '#654321',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Box className="h-4 w-4" />,
    description: 'Bedside table with drawer'
  },

  // DRESSING ROOM COMPONENTS (new additions)
  {
    id: 'wardrobe-4door',
    name: '4-Door Wardrobe',
    type: 'cabinet',
    width: 200,
    height: 220,
    color: '#654321',
    category: 'dressing-storage',
    roomTypes: ['dressing-room'],
    icon: <Shirt className="h-4 w-4" />,
    description: 'Large 4-door wardrobe'
  },
  {
    id: 'wardrobe-6door',
    name: '6-Door Wardrobe',
    type: 'cabinet',
    width: 300,
    height: 220,
    color: '#654321',
    category: 'dressing-storage',
    roomTypes: ['dressing-room'],
    icon: <Shirt className="h-4 w-4" />,
    description: 'Extra large 6-door wardrobe'
  },
  {
    id: 'dressing-table',
    name: 'Dressing Table',
    type: 'cabinet',
    width: 120,
    height: 45,
    color: '#8B4513',
    category: 'dressing-furniture',
    roomTypes: ['dressing-room'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Dressing table with mirror'
  },
  {
    id: 'shoe-rack',
    name: 'Shoe Rack',
    type: 'cabinet',
    width: 80,
    height: 100,
    color: '#654321',
    category: 'dressing-storage',
    roomTypes: ['dressing-room'],
    icon: <Box className="h-4 w-4" />,
    description: 'Multi-tier shoe storage'
  },
  {
    id: 'jewelry-cabinet',
    name: 'Jewelry Cabinet',
    type: 'cabinet',
    width: 40,
    height: 60,
    color: '#8B4513',
    category: 'dressing-storage',
    roomTypes: ['dressing-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Wall-mounted jewelry cabinet'
  },

  // BATHROOM COMPONENTS (new additions)
  {
    id: 'vanity-unit-60',
    name: 'Vanity Unit 60cm',
    type: 'cabinet',
    width: 60,
    height: 60,
    color: '#F5F5DC',
    category: 'bathroom-vanities',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Bath className="h-4 w-4" />,
    description: 'Wall-hung vanity unit with basin'
  },
  {
    id: 'vanity-unit-80',
    name: 'Vanity Unit 80cm',
    type: 'cabinet',
    width: 80,
    height: 60,
    color: '#F5F5DC',
    category: 'bathroom-vanities',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Bath className="h-4 w-4" />,
    description: 'Wall-hung vanity unit with basin'
  },
  {
    id: 'toilet',
    name: 'Toilet',
    type: 'appliance',
    width: 40,
    height: 60,
    color: '#FFFFFF',
    category: 'bathroom-fixtures',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Home className="h-4 w-4" />,
    description: 'Wall-hung toilet'
  },
  {
    id: 'shower-tray',
    name: 'Shower Tray',
    type: 'appliance',
    width: 90,
    height: 90,
    color: '#E6E6FA',
    category: 'bathroom-fixtures',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Waves className="h-4 w-4" />,
    description: 'Square shower tray'
  },
  {
    id: 'bathtub',
    name: 'Bathtub',
    type: 'appliance',
    width: 170,
    height: 70,
    color: '#FFFFFF',
    category: 'bathroom-fixtures',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Bath className="h-4 w-4" />,
    description: 'Standard bathtub'
  },

  // MEDIA WALL COMPONENTS (new additions)
  {
    id: 'tv-unit-120',
    name: 'TV Unit 120cm',
    type: 'cabinet',
    width: 120,
    height: 40,
    color: '#2F4F4F',
    category: 'media-furniture',
    roomTypes: ['living-room'],
    icon: <Tv className="h-4 w-4" />,
    description: 'Low TV cabinet unit'
  },
  {
    id: 'tv-unit-160',
    name: 'TV Unit 160cm',
    type: 'cabinet',
    width: 160,
    height: 40,
    color: '#2F4F4F',
    category: 'media-furniture',
    roomTypes: ['living-room'],
    icon: <Tv className="h-4 w-4" />,
    description: 'Wide TV cabinet unit'
  },
  {
    id: 'media-shelving',
    name: 'Media Shelving',
    type: 'cabinet',
    width: 60,
    height: 120,
    color: '#2F4F4F',
    category: 'media-storage',
    roomTypes: ['living-room'],
    icon: <Box className="h-4 w-4" />,
    description: 'Tall media shelving unit'
  },
  {
    id: 'media-cabinet',
    name: 'Media Cabinet',
    type: 'cabinet',
    width: 80,
    height: 80,
    color: '#2F4F4F',
    category: 'media-storage',
    roomTypes: ['living-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Square media storage cabinet'
  },

  // FLOORING COMPONENTS (new additions)
  {
    id: 'hardwood-section',
    name: 'Hardwood Section',
    type: 'appliance',
    width: 100,
    height: 100,
    color: '#DEB887',
    category: 'flooring-materials',
    roomTypes: ['dining-room'],
    icon: <Grid3X3 className="h-4 w-4" />,
    description: 'Hardwood flooring section'
  },
  {
    id: 'tile-section',
    name: 'Tile Section',
    type: 'appliance',
    width: 100,
    height: 100,
    color: '#D3D3D3',
    category: 'flooring-materials',
    roomTypes: ['dining-room'],
    icon: <Square className="h-4 w-4" />,
    description: 'Ceramic tile section'
  },
  {
    id: 'carpet-section',
    name: 'Carpet Section',
    type: 'appliance',
    width: 100,
    height: 100,
    color: '#8FBC8F',
    category: 'flooring-materials',
    roomTypes: ['dining-room'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Carpet flooring section'
  },
  // LIVING ROOM FURNITURE - New additions from EnhancedModels3D.tsx
  {
    id: 'modern-sofa',
    name: 'Modern Sofa',
    type: 'appliance',
    width: 200,
    height: 80,
    color: '#3A6EA5',
    category: 'living-room-furniture',
    roomTypes: ['living-room'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Contemporary 3-seater sofa'
  },
  {
    id: 'armchair',
    name: 'Armchair',
    type: 'appliance',
    width: 80,
    height: 80,
    color: '#3A6EA5',
    category: 'living-room-furniture',
    roomTypes: ['living-room'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Comfortable single armchair'
  },
  {
    id: 'coffee-table',
    name: 'Coffee Table',
    type: 'appliance',
    width: 120,
    height: 60,
    color: '#8B4513',
    category: 'living-room-furniture',
    roomTypes: ['living-room'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Rectangular coffee table'
  },

  // OFFICE FURNITURE - New additions
  {
    id: 'office-desk',
    name: 'Office Desk',
    type: 'appliance',
    width: 150,
    height: 75,
    color: '#2F4F4F',
    category: 'office-furniture',
    roomTypes: ['office', 'bedroom', 'living-room'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Standard office desk'
  },
  {
    id: 'office-chair',
    name: 'Office Chair',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#2F4F4F',
    category: 'office-furniture',
    roomTypes: ['office', 'bedroom', 'living-room'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Ergonomic office chair'
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    type: 'cabinet',
    width: 100,
    height: 200,
    color: '#8B4513',
    category: 'office-furniture',
    roomTypes: ['office', 'bedroom', 'living-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Tall bookshelf'
  },

  // ADDITIONAL BEDROOM FURNITURE
  {
    id: 'dressing-table',
    name: 'Dressing Table',
    type: 'appliance',
    width: 120,
    height: 50,
    color: '#8B4513',
    category: 'bedroom-furniture',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Bedroom dressing table with mirror'
  },
  {
    id: 'bedroom-ottoman',
    name: 'Ottoman',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#6B8E23',
    category: 'bedroom-furniture',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Bedroom ottoman/seat'
  },

  // UTILITY ROOM COMPONENTS - Make available in kitchen as utility area
  {
    id: 'utility-washing-machine',
    name: 'Utility Washing Machine',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#f0f0f0',
    category: 'utility-appliances',
    roomTypes: ['kitchen'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Front-loading washing machine for utility area'
  },
  {
    id: 'utility-tumble-dryer',
    name: 'Utility Tumble Dryer',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#e8e8e8',
    category: 'utility-appliances',
    roomTypes: ['kitchen'],
    icon: <Wind className="h-4 w-4" />,
    description: 'Tumble dryer for utility area'
  },
  {
    id: 'utility-sink',
    name: 'Utility Sink',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#FFFFFF',
    category: 'utility-appliances',
    roomTypes: ['kitchen'],
    icon: <Waves className="h-4 w-4" />,
    description: 'Deep utility sink'
  },
  {
    id: 'utility-storage-cabinet',
    name: 'Utility Storage',
    type: 'cabinet',
    width: 80,
    height: 200,
    color: '#8b4513',
    category: 'utility-storage',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Tall utility storage cabinet'
  }
];

// Add utility room components
const utilityComponents: ComponentDefinition[] = [
  {
    id: 'washing-machine-utility',
    name: 'Washing Machine',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#f0f0f0',
    category: 'utility-appliances',
    roomTypes: ['utility'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Front-loading washing machine'
  },
  {
    id: 'tumble-dryer-utility',
    name: 'Tumble Dryer',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#e8e8e8',
    category: 'utility-appliances',
    roomTypes: ['utility'],
    icon: <Wind className="h-4 w-4" />,
    description: 'Tumble dryer with round door'
  },
  {
    id: 'utility-sink-utility',
    name: 'Utility Sink',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#FFFFFF',
    category: 'utility-appliances',
    roomTypes: ['utility'],
    icon: <Waves className="h-4 w-4" />,
    description: 'Deep utility sink'
  },
  {
    id: 'utility-storage-utility',
    name: 'Utility Storage',
    type: 'cabinet',
    width: 80,
    height: 200,
    color: '#8b4513',
    category: 'utility-storage',
    roomTypes: ['utility'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Tall utility storage cabinet'
  }
];

// Add dining room specific components
const diningRoomComponents: ComponentDefinition[] = [
  {
    id: 'dining-table-6',
    name: 'Dining Table (6)',
    type: 'appliance',
    width: 180,
    height: 90,
    color: '#8B4513',
    category: 'dining-furniture',
    roomTypes: ['dining-room'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Dining table for 6 people'
  },
  {
    id: 'dining-chair-set',
    name: 'Dining Chair',
    type: 'appliance',
    width: 45,
    height: 45,
    color: '#8B4513',
    category: 'dining-furniture',
    roomTypes: ['dining-room'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Dining chair'
  },
  {
    id: 'sideboard',
    name: 'Sideboard',
    type: 'cabinet',
    width: 160,
    height: 45,
    color: '#8B4513',
    category: 'dining-storage',
    roomTypes: ['dining-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Dining room sideboard'
  }
];

// Add under stairs storage components
const underStairsComponents: ComponentDefinition[] = [
  {
    id: 'under-stairs-cabinet',
    name: 'Under Stairs Cabinet',
    type: 'cabinet',
    width: 120,
    height: 90,
    color: '#8b4513',
    category: 'under-stairs-storage',
    roomTypes: ['under-stairs'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Under stairs storage cabinet'
  },
  {
    id: 'under-stairs-drawers',
    name: 'Under Stairs Drawers',
    type: 'cabinet',
    width: 60,
    height: 60,
    color: '#8b4513',
    category: 'under-stairs-storage',
    roomTypes: ['under-stairs'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Under stairs drawer unit'
  },
  {
    id: 'under-stairs-shelf',
    name: 'Under Stairs Shelf',
    type: 'cabinet',
    width: 100,
    height: 30,
    color: '#a0522d',
    category: 'under-stairs-storage',
    roomTypes: ['under-stairs'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Under stairs shelf'
  }
];

// Add all new components to the main components array
components.push(...utilityComponents, ...diningRoomComponents, ...underStairsComponents);

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onAddElement, roomType }) => {
  // Filter components by room type and get available categories
  const roomComponents = components.filter(comp => comp.roomTypes.includes(roomType));
  const availableCategories = [...new Set(roomComponents.map(comp => comp.category))];
  
  const [selectedCategory, setSelectedCategory] = useState<string>(availableCategories[0] || 'base-cabinets');

  // Auto-select first available category when room type changes
  useEffect(() => {
    if (availableCategories.length > 0) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [roomType, availableCategories.join(',')]); // Join categories to create stable dependency

  const filteredComponents = roomComponents.filter(comp => comp.category === selectedCategory);

  const handleAddComponent = (component: ComponentDefinition) => {
    const newElement: DesignElement = {
      id: `${component.id}-${Date.now()}`,
      type: component.type,
      x: 100,
      y: 100,
      width: component.width,
      height: component.height,
      rotation: 0,
      color: component.color,
      style: component.name
    };

    onAddElement(newElement);
  };

  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('component', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create realistic drag image that looks like the component
    const dragImage = document.createElement('div');
    const scaleFactor = Math.min(80 / Math.max(component.width, component.height), 2); // Scale to max 80px
    const displayWidth = component.width * scaleFactor;
    const displayHeight = component.height * scaleFactor;
    
    dragImage.style.width = `${displayWidth}px`;
    dragImage.style.height = `${displayHeight}px`;
    dragImage.style.backgroundColor = component.color;
    dragImage.style.border = '2px solid #333';
    dragImage.style.borderRadius = '6px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.opacity = '0.9';
    dragImage.style.display = 'flex';
    dragImage.style.flexDirection = 'column';
    dragImage.style.alignItems = 'center';
    dragImage.style.justifyContent = 'center';
    dragImage.style.fontSize = '10px';
    dragImage.style.fontWeight = 'bold';
    dragImage.style.color = component.type === 'appliance' ? '#333' : '#fff';
    dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    dragImage.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    // Create icon element safely
    const iconDiv = document.createElement('div');
    iconDiv.style.fontSize = `${Math.min(displayWidth, displayHeight) * 0.3}px`;
    iconDiv.style.marginBottom = '2px';
    
    // Use safe SVG creation instead of innerHTML
    const svgContainer = createSafeSVGElement(getIconSVG(component));
    const svgElement = svgContainer.firstElementChild;
    if (svgElement) {
      iconDiv.appendChild(svgElement);
    }
    
    // Create text element
    const textDiv = document.createElement('div');
    textDiv.style.fontSize = '9px';
    textDiv.style.textAlign = 'center';
    textDiv.style.lineHeight = '1';
    textDiv.textContent = component.name.split(' ')[0];
    
    dragImage.appendChild(iconDiv);
    if (displayHeight > 30) dragImage.appendChild(textDiv); // Only show text if there's room
    
    document.body.appendChild(dragImage);
    
    // Set the custom drag image
    e.dataTransfer.setDragImage(dragImage, displayWidth / 2, displayHeight / 2);
    
    // Clean up the temporary element after drag starts
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  // Helper function to get icon SVG
  const getIconSVG = (component: ComponentDefinition): string => {
    const iconMap: { [key: string]: string } = {
      'refrigerator': '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 5h14v6H5V5zm0 8h14v6H5v-6z"/></svg>',
      'microwave': '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 10H4V8h8v8zm6-1h-2v-2h2v2zm0-4h-2V9h2v2z"/></svg>',
      'oven': '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM20 18H4V8h16v10zM6 10h12v6H6v-6z"/></svg>',
      'dishwasher': '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5h14v14H5V5zm2 2v3h10V7H7zm0 5v5h10v-5H7z"/></svg>',
      'cabinet': '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-9h2v2h-2v-2z"/></svg>',
    };
    
    // Try to match component name/type to icon
    const name = component.name.toLowerCase();
    for (const [key, svg] of Object.entries(iconMap)) {
      if (name.includes(key)) return svg;
    }
    
    // Default cabinet icon
    return iconMap.cabinet;
  };

  // Add office category to display labels
  const getCategoryLabel = (category: string): string => {
    const labels: { [key: string]: string } = {
      'base-cabinets': 'Base Cabinets',
      'base-drawers': 'Base Drawers',
      'wall-units': 'Wall Units',
      'appliances': 'Appliances',
      'bedroom-furniture': 'Furniture',
      'bedroom-storage': 'Storage',
      'bathroom-vanities': 'Vanities',
      'bathroom-fixtures': 'Fixtures',
      'media-furniture': 'TV Units',
      'media-storage': 'Storage',
      'flooring-materials': 'Materials',
      'utility-appliances': 'Appliances',
      'utility-storage': 'Storage',
      'dining-furniture': 'Furniture',
      'dining-storage': 'Storage',
      'under-stairs-storage': 'Storage',
      'living-room-furniture': 'Furniture',
      'office-furniture': 'Office Furniture'
    };
    return labels[category] || category;
  };

  if (roomComponents.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">
          <p>No components available for this room type.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full h-auto gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(availableCategories.length, 2)}, 1fr)` }}>
          {availableCategories.map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs">
              {getCategoryLabel(category)}
            </TabsTrigger>
          ))}
        </TabsList>

        {availableCategories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-3 mt-4">
            <div
              className="space-y-3 overflow-y-auto pr-2"
              style={{
                maxHeight: 'calc(4 * 140px + 3 * 12px)', // 4 cards + gaps
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
            >
              {filteredComponents.map((component) => (
                <Card 
                  key={component.id} 
                  className="group hover:shadow-md transition-shadow cursor-pointer select-none"
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, component)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {component.icon}
                        <CardTitle className="text-sm">{component.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {component.width}×{component.height}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-600 mb-3">{component.description}</p>
                    <div className="flex items-center justify-between">
                      <div
                        className="w-6 h-6 rounded border-2 border-gray-200"
                        style={{ backgroundColor: component.color }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddComponent(component)}
                        className="text-xs"
                      >
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Actions */}
      {roomType === 'kitchen' && (
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Quick Add</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddComponent(components.find(c => c.id === 'base-cabinet-60')!)}
              className="text-xs"
            >
              Base Cabinet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddComponent(components.find(c => c.id === 'pan-drawers-60')!)}
              className="text-xs"
            >
              Pan Drawers
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};