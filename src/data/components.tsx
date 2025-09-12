import React from 'react';
import { RoomType } from '@/types/project';

export interface ComponentDefinition {
  id: string;
  name: string;
  type: 'cabinet' | 'appliance' | 'counter-top' | 'end-panel' | 'window' | 'door' | 'flooring' | 'toe-kick' | 'cornice' | 'pelmet' | 'wall-unit-end-panel';
  width: number;
  depth: number;
  height: number;
  color: string;
  category: string;
  roomTypes: RoomType[];
  icon: React.ReactNode;
  description: string;
}

// We'll extract the components from EnhancedSidebar later
// For now, let's create a comprehensive but manageable set for the kitchen
export const components: ComponentDefinition[] = [
  // COUNTER TOPS - Available in all rooms
  {
    id: 'counter-top-horizontal',
    name: 'Counter Top Horizontal',
    type: 'counter-top',
    width: 300,
    depth: 60,
    height: 4,
    color: '#D2B48C',
    category: 'counter-tops',
    roomTypes: ['kitchen', 'bedroom', 'bathroom', 'living-room', 'office', 'dining-room', 'dressing-room', 'utility', 'under-stairs', 'media-wall', 'internal-doors', 'flooring'],
    icon: <Square className="h-4 w-4" />,
    description: 'Horizontal counter top - 300cm x 60cm x 4cm'
  },
  {
    id: 'counter-top-square',
    name: 'Counter Top Square',
    type: 'counter-top',
    width: 60,
    depth: 60,
    height: 4,
    color: '#D2B48C',
    category: 'counter-tops',
    roomTypes: ['kitchen', 'bedroom', 'bathroom', 'living-room', 'office', 'dining-room', 'dressing-room', 'utility', 'under-stairs', 'media-wall', 'internal-doors', 'flooring'],
    icon: <Square className="h-4 w-4" />,
    description: 'Square counter top - 60cm x 60cm x 4cm'
  },
  {
    id: 'counter-top-corner',
    name: 'Counter Top Corner',
    type: 'counter-top',
    width: 90,
    depth: 90,
    height: 4,
    color: '#D2B48C',
    category: 'counter-tops',
    roomTypes: ['kitchen', 'bedroom', 'bathroom', 'living-room', 'office', 'dining-room', 'dressing-room', 'utility', 'under-stairs', 'media-wall', 'internal-doors', 'flooring'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner counter top - 90cm x 90cm x 4cm'
  },

  // BASE CABINETS - Kitchen
  {
    id: 'base-cabinet-30',
    name: 'Base Cabinet 30cm',
    type: 'cabinet',
    width: 30,
    depth: 60,
    height: 90,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Narrow 30cm base cabinet'
  },
  {
    id: 'corner-cabinet',
    name: 'Corner Base Cabinet',
    type: 'cabinet',
    width: 90,
    depth: 90,
    height: 90,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner base cabinet'
  },
  {
    id: 'base-cabinet-40',
    name: 'Base Cabinet 40cm',
    type: 'cabinet',
    width: 40,
    depth: 60,
    height: 90,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Standard 40cm base cabinet'
  },
  {
    id: 'base-cabinet-50',
    name: 'Base Cabinet 50cm',
    type: 'cabinet',
    width: 50,
    depth: 60,
    height: 90,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Standard 50cm base cabinet'
  },
  {
    id: 'base-cabinet-60',
    name: 'Base Cabinet 60cm',
    type: 'cabinet',
    width: 60,
    depth: 60,
    height: 90,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Standard 60cm base cabinet'
  },
  {
    id: 'base-cabinet-80',
    name: 'Base Cabinet 80cm',
    type: 'cabinet',
    width: 80,
    depth: 60,
    height: 90,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Wide 80cm base cabinet'
  },
  {
    id: 'base-cabinet-100',
    name: 'Base Cabinet 100cm',
    type: 'cabinet',
    width: 100,
    depth: 60,
    height: 90,
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Extra wide 100cm base cabinet'
  },

  // WALL CABINETS - Kitchen
  {
    id: 'wall-cabinet-30',
    name: 'Wall Cabinet 30cm',
    type: 'cabinet',
    width: 30,
    depth: 35,
    height: 75,
    color: '#8b4513',
    category: 'wall-cabinets',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'Narrow 30cm wall cabinet'
  },
  {
    id: 'wall-cabinet-40',
    name: 'Wall Cabinet 40cm',
    type: 'cabinet',
    width: 40,
    depth: 35,
    height: 75,
    color: '#8b4513',
    category: 'wall-cabinets',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'Standard 40cm wall cabinet'
  },
  {
    id: 'wall-cabinet-60',
    name: 'Wall Cabinet 60cm',
    type: 'cabinet',
    width: 60,
    depth: 35,
    height: 75,
    color: '#8b4513',
    category: 'wall-cabinets',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'Standard 60cm wall cabinet'
  },
  {
    id: 'wall-cabinet-80',
    name: 'Wall Cabinet 80cm',
    type: 'cabinet',
    width: 80,
    depth: 35,
    height: 75,
    color: '#8b4513',
    category: 'wall-cabinets',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'Wide 80cm wall cabinet'
  },
  {
    id: 'wall-cabinet-100',
    name: 'Wall Cabinet 100cm',
    type: 'cabinet',
    width: 100,
    depth: 35,
    height: 75,
    color: '#8b4513',
    category: 'wall-cabinets',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'Extra wide 100cm wall cabinet'
  },
  {
    id: 'corner-wall-cabinet',
    name: 'Corner Wall Cabinet',
    type: 'cabinet',
    width: 90,
    depth: 35,
    height: 60,
    color: '#a0522d',
    category: 'wall-units',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner wall cabinet'
  },

  // TALL UNITS - Kitchen
  {
    id: 'tall-unit-60',
    name: 'Tall Unit 60cm',
    type: 'cabinet',
    width: 60,
    depth: 60,
    height: 200,
    color: '#8b4513',
    category: 'tall-units',
    roomTypes: ['kitchen'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Standard tall unit - 60cm wide'
  },
  {
    id: 'tall-unit-pantry',
    name: 'Pantry Unit',
    type: 'cabinet',
    width: 60,
    depth: 60,
    height: 240,
    color: '#8b4513',
    category: 'tall-units',
    roomTypes: ['kitchen'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Full height pantry unit'
  },
  {
    id: 'tall-unit-oven',
    name: 'Oven Housing Unit',
    type: 'cabinet',
    width: 60,
    depth: 60,
    height: 200,
    color: '#8b4513',
    category: 'tall-units',
    roomTypes: ['kitchen'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Tall unit for built-in oven'
  },
  {
    id: 'larder-corner-unit',
    name: 'Corner Larder Unit',
    type: 'cabinet',
    width: 90,
    depth: 90,
    height: 200,
    color: '#F5F5F5',
    category: 'kitchen-larder',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner larder unit maximizing space efficiency'
  },

  // APPLIANCES - Kitchen
  {
    id: 'fridge-freezer',
    name: 'Fridge Freezer',
    type: 'appliance',
    width: 60,
    depth: 60,
    height: 180,
    color: '#f0f0f0',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Refrigerator className="h-4 w-4" />,
    description: 'Standard fridge freezer unit'
  },
  {
    id: 'american-fridge',
    name: 'American Style Fridge',
    type: 'appliance',
    width: 90,
    depth: 70,
    height: 180,
    color: '#f0f0f0',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Refrigerator className="h-4 w-4" />,
    description: 'Large American style fridge freezer'
  },
  {
    id: 'dishwasher',
    name: 'Dishwasher',
    type: 'appliance',
    width: 60,
    depth: 60,
    height: 90,
    color: '#e8e8e8',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Waves className="h-4 w-4" />,
    description: 'Built-in dishwasher'
  },
  {
    id: 'washing-machine',
    name: 'Washing Machine',
    type: 'appliance',
    width: 60,
    depth: 60,
    height: 90,
    color: '#f0f0f0',
    category: 'appliances',
    roomTypes: ['kitchen', 'utility'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Front loading washing machine'
  },
  {
    id: 'oven-built-in',
    name: 'Built-in Oven',
    type: 'appliance',
    width: 60,
    depth: 55,
    height: 60,
    color: '#2c2c2c',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Box className="h-4 w-4" />,
    description: 'Built-in single oven'
  },
  {
    id: 'microwave-built-in',
    name: 'Built-in Microwave',
    type: 'appliance',
    width: 60,
    depth: 55,
    height: 40,
    color: '#2c2c2c',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Microwave className="h-4 w-4" />,
    description: 'Built-in microwave oven'
  },
  {
    id: 'hob-gas',
    name: 'Gas Hob',
    type: 'appliance',
    width: 60,
    depth: 55,
    height: 10,
    color: '#2c2c2c',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Zap className="h-4 w-4" />,
    description: '4-burner gas hob'
  },
  {
    id: 'extractor-hood',
    name: 'Extractor Hood',
    type: 'appliance',
    width: 60,
    depth: 50,
    height: 15,
    color: '#c0c0c0',
    category: 'appliances',
    roomTypes: ['kitchen'],
    icon: <Wind className="h-4 w-4" />,
    description: 'Wall mounted extractor hood'
  },

  // SINKS & TAPS
  {
    id: 'sink-single-bowl',
    name: 'Single Bowl Sink',
    type: 'appliance',
    width: 60,
    depth: 50,
    height: 20,
    color: '#f8f8f8',
    category: 'sinks',
    roomTypes: ['kitchen'],
    icon: <Waves className="h-4 w-4" />,
    description: 'Single bowl kitchen sink'
  },
  {
    id: 'sink-double-bowl',
    name: 'Double Bowl Sink',
    type: 'appliance',
    width: 80,
    depth: 50,
    height: 20,
    color: '#f8f8f8',
    category: 'sinks',
    roomTypes: ['kitchen'],
    icon: <Waves className="h-4 w-4" />,
    description: 'Double bowl kitchen sink'
  },
  {
    id: 'sink-belfast',
    name: 'Belfast Sink',
    type: 'appliance',
    width: 60,
    depth: 45,
    height: 25,
    color: '#ffffff',
    category: 'sinks',
    roomTypes: ['kitchen'],
    icon: <Waves className="h-4 w-4" />,
    description: 'Traditional Belfast style sink'
  },

  // END PANELS
  {
    id: 'end-panel-base',
    name: 'End Panel Base',
    type: 'end-panel',
    width: 1.8,
    depth: 60,
    height: 90,
    color: '#8B4513',
    category: 'end-panels',
    roomTypes: ['kitchen', 'bedroom', 'bathroom'],
    icon: <PanelLeft className="h-4 w-4" />,
    description: 'Base unit end panel'
  },
  {
    id: 'end-panel-wall',
    name: 'End Panel Wall',
    type: 'end-panel',
    width: 1.8,
    depth: 35,
    height: 75,
    color: '#8B4513',
    category: 'end-panels',
    roomTypes: ['kitchen', 'bedroom', 'bathroom'],
    icon: <PanelLeft className="h-4 w-4" />,
    description: 'Wall unit end panel'
  },
  {
    id: 'end-panel-tall',
    name: 'End Panel Tall',
    type: 'end-panel',
    width: 1.8,
    depth: 60,
    height: 200,
    color: '#8B4513',
    category: 'end-panels',
    roomTypes: ['kitchen', 'bedroom', 'bathroom'],
    icon: <PanelLeft className="h-4 w-4" />,
    description: 'Tall unit end panel'
  },

  // ACCESSORIES
  {
    id: 'wine-rack',
    name: 'Wine Rack Insert',
    type: 'cabinet',
    width: 30,
    depth: 35,
    height: 75,
    color: '#8b4513',
    category: 'accessories',
    roomTypes: ['kitchen'],
    icon: <Grid3X3 className="h-4 w-4" />,
    description: 'Wine storage rack insert'
  },
  {
    id: 'spice-rack',
    name: 'Spice Rack',
    type: 'cabinet',
    width: 15,
    depth: 35,
    height: 75,
    color: '#8b4513',
    category: 'accessories',
    roomTypes: ['kitchen'],
    icon: <Grid3X3 className="h-4 w-4" />,
    description: 'Pull-out spice rack'
  },
  {
    id: 'corner-carousel',
    name: 'Corner Carousel',
    type: 'cabinet',
    width: 80,
    depth: 80,
    height: 90,
    color: '#8b4513',
    category: 'accessories',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Corner cabinet with rotating shelves'
  },

  // CORNER FINISHING COMPONENTS
  {
    id: 'toe-kick-corner',
    name: 'Corner Toe Kick',
    type: 'toe-kick',
    width: 90,
    depth: 10,
    height: 15,
    color: '#FFFFFF',
    category: 'accessories',
    roomTypes: ['kitchen'],
    icon: <PanelLeft className="h-4 w-4" />,
    description: 'L-shaped toe kick for corner units - 90cm x 10cm x 15cm'
  },
  {
    id: 'cornice-corner',
    name: 'Corner Cornice',
    type: 'cornice',
    width: 90,
    depth: 5,
    height: 15,
    color: '#FFFFFF',
    category: 'accessories',
    roomTypes: ['kitchen'],
    icon: <Crown className="h-4 w-4" />,
    description: 'L-shaped cornice for corner wall units - 90cm x 5cm x 15cm'
  },
  {
    id: 'pelmet-corner',
    name: 'Corner Pelmet',
    type: 'pelmet',
    width: 90,
    depth: 8,
    height: 15,
    color: '#FFFFFF',
    category: 'accessories',
    roomTypes: ['kitchen'],
    icon: <PanelRight className="h-4 w-4" />,
    description: 'L-shaped pelmet for corner wall units - 90cm x 8cm x 15cm'
  }
];

// Helper functions
export const getComponentsByRoomType = (roomType: RoomType): ComponentDefinition[] => {
  return components.filter(component => component.roomTypes.includes(roomType));
};

export const getComponentsByCategory = (category: string, roomType?: RoomType): ComponentDefinition[] => {
  let filtered = components.filter(component => component.category === category);
  if (roomType) {
    filtered = filtered.filter(component => component.roomTypes.includes(roomType));
  }
  return filtered;
};

export const getCategoriesForRoomType = (roomType: RoomType): string[] => {
  const categories = new Set<string>();
  components.forEach(component => {
    if (component.roomTypes.includes(roomType)) {
      categories.add(component.category);
    }
  });
  return Array.from(categories).sort();
};
