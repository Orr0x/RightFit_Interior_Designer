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

interface EnhancedSidebarProps {
  onAddElement: (element: DesignElement) => void;
  roomType: RoomType;
}

interface ComponentDefinition {
  id: string;
  name: string;
  type: 'cabinet' | 'appliance';
  width: number; // X-axis dimension (left-to-right)
  depth: number; // Y-axis dimension (front-to-back)
  height: number; // Z-axis dimension (bottom-to-top)
  color: string;
  category: string;
  roomTypes: RoomType[];
  icon: React.ReactNode;
  description: string;
}


const components: ComponentDefinition[] = [
  // KITCHEN COMPONENTS
  {
    id: 'base-cabinet-30',
    name: 'Base Cabinet 30cm',
    type: 'cabinet',
    width: 30, // X-axis dimension (left-to-right)
    depth: 60, // Y-axis dimension (front-to-back)
    height: 90, // Z-axis dimension (bottom-to-top)
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
    width: 40, // X-axis dimension (left-to-right)
    depth: 60, // Y-axis dimension (front-to-back)
    height: 90, // Z-axis dimension (bottom-to-top)
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
    width: 50, // X-axis dimension (left-to-right)
    depth: 60, // Y-axis dimension (front-to-back)
    height: 90, // Z-axis dimension (bottom-to-top)
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
    width: 60, // X-axis dimension (left-to-right)
    depth: 60, // Y-axis dimension (front-to-back)
    height: 90, // Z-axis dimension (bottom-to-top)
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
    width: 90, // X-axis dimension (left-to-right)
    depth: 90, // Y-axis dimension (front-to-back)
    height: 90, // Z-axis dimension (bottom-to-top)
    color: '#8b4513',
    category: 'base-cabinets',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner base cabinet'
  },
  {
    id: 'pan-drawers-50',
    name: 'Pan Drawers 50cm',
    type: 'cabinet',
    width: 50,
    depth: 60,
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
    depth: 60,
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
    depth: 60,
    height: 60,
    color: '#8b4513',
    category: 'base-drawers',
    roomTypes: ['kitchen'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Wide 80cm pan drawer unit'
  },
  {
    id: 'wall-cabinet-30',
    name: 'Wall Cabinet 30cm',
    type: 'cabinet',
    width: 30,
    depth: 35,
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
    depth: 35,
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
    depth: 35,
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
    depth: 35,
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
    depth: 35,
    height: 60,
    color: '#a0522d',
    category: 'wall-units',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner wall cabinet'
  },
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

  // KITCHEN LARDER UNITS - Custom Built-in Solutions
  {
    id: 'larder-full-height',
    name: 'Full Height Larder Unit',
    type: 'cabinet',
    width: 60, // X-axis dimension (left-to-right)
    depth: 60, // Y-axis dimension (front-to-back)
    height: 200, // Z-axis dimension (bottom-to-top)
    color: '#F5F5F5',
    category: 'kitchen-larder',
    roomTypes: ['kitchen'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Full-height pantry larder with adjustable shelving'
  },
  {
    id: 'larder-built-in-fridge',
    name: 'Built-in Fridge Larder',
    type: 'cabinet',
    width: 60, // X-axis dimension (left-to-right)
    depth: 60, // Y-axis dimension (front-to-back)
    height: 200, // Z-axis dimension (bottom-to-top)
    color: '#F5F5F5',
    category: 'kitchen-larder',
    roomTypes: ['kitchen'],
    icon: <Refrigerator className="h-4 w-4" />,
    description: 'Integrated refrigerator disguised as larder unit'
  },
  {
    id: 'larder-single-oven',
    name: 'Single Built-in Oven Larder',
    type: 'cabinet',
    width: 60, // X-axis dimension (left-to-right)
    depth: 60, // Y-axis dimension (front-to-back)
    height: 200, // Z-axis dimension (bottom-to-top)
    color: '#F5F5F5',
    category: 'kitchen-larder',
    roomTypes: ['kitchen'],
    icon: <Microwave className="h-4 w-4" />,
    description: 'Single built-in oven with storage above and below'
  },
  {
    id: 'larder-double-oven',
    name: 'Double Built-in Oven Larder',
    type: 'cabinet',
    width: 60, // X-axis dimension (left-to-right)
    depth: 60, // Y-axis dimension (front-to-back)
    height: 200, // Z-axis dimension (bottom-to-top)
    color: '#F5F5F5',
    category: 'kitchen-larder',
    roomTypes: ['kitchen'],
    icon: <Microwave className="h-4 w-4" />,
    description: 'Double built-in oven stack with storage compartments'
  },
  {
    id: 'larder-oven-microwave',
    name: 'Oven + Microwave Larder',
    type: 'cabinet',
    width: 60, // X-axis dimension (left-to-right)
    depth: 60, // Y-axis dimension (front-to-back)
    height: 200, // Z-axis dimension (bottom-to-top)
    color: '#F5F5F5',
    category: 'kitchen-larder',
    roomTypes: ['kitchen'],
    icon: <Microwave className="h-4 w-4" />,
    description: 'Combined oven and microwave in single larder unit'
  },
  {
    id: 'larder-coffee-machine',
    name: 'Coffee Machine Larder',
    type: 'cabinet',
    width: 60, // X-axis dimension (left-to-right)
    depth: 60, // Y-axis dimension (front-to-back)
    height: 200, // Z-axis dimension (bottom-to-top)
    color: '#F5F5F5',
    category: 'kitchen-larder',
    roomTypes: ['kitchen'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Integrated coffee machine with storage above and below'
  },
  {
    id: 'larder-corner-unit',
    name: 'Corner Larder Unit',
    type: 'cabinet',
    width: 90, // X-axis dimension (left-to-right) - matches original corner cabinet
    depth: 90, // Y-axis dimension (front-to-back) - matches original corner cabinet
    height: 200, // Z-axis dimension (bottom-to-top)
    color: '#F5F5F5',
    category: 'kitchen-larder',
    roomTypes: ['kitchen'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner larder unit maximizing space efficiency'
  },

  // BEDROOM COMPONENTS
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

  // BATHROOM COMPONENTS
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

  // MEDIA WALL COMPONENTS
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

  // FLOORING COMPONENTS
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

  // ENHANCED LIVING ROOM COMPONENTS - Comprehensive Collection

  // CUSTOM ENTERTAINMENT UNITS (Your Carpentry Expertise)
  {
    id: 'entertainment-wall-unit',
    name: 'Entertainment Wall Unit',
    type: 'cabinet',
    width: 300,
    height: 220,
    color: '#2F4F4F',
    category: 'living-room-built-ins',
    roomTypes: ['living-room'],
    icon: <Tv className="h-4 w-4" />,
    description: 'Custom floor-to-ceiling entertainment wall system'
  },
  {
    id: 'media-console-floating',
    name: 'Floating Media Console',
    type: 'cabinet',
    width: 180,
    height: 40,
    color: '#2F4F4F',
    category: 'living-room-built-ins',
    roomTypes: ['living-room'],
    icon: <Tv className="h-4 w-4" />,
    description: 'Wall-mounted floating entertainment unit'
  },
  {
    id: 'corner-entertainment-unit',
    name: 'Corner Entertainment Unit',
    type: 'cabinet',
    width: 120,
    height: 180,
    color: '#2F4F4F',
    category: 'living-room-built-ins',
    roomTypes: ['living-room'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner entertainment unit maximizing space'
  },

  // CUSTOM BOOKCASES & SHELVING
  {
    id: 'floor-to-ceiling-bookshelf',
    name: 'Floor-to-Ceiling Bookshelf',
    type: 'cabinet',
    width: 80,
    height: 240,
    color: '#8B4513',
    category: 'living-room-shelving',
    roomTypes: ['living-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Tall custom bookshelf with adjustable shelving'
  },
  {
    id: 'wall-mounted-shelves-wide',
    name: 'Wide Wall Shelves',
    type: 'cabinet',
    width: 200,
    height: 30,
    color: '#F5DEB3',
    category: 'living-room-shelving',
    roomTypes: ['living-room'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Wide wall-mounted display shelves'
  },
  {
    id: 'recessed-bookshelves',
    name: 'Recessed Bookshelves',
    type: 'cabinet',
    width: 100,
    height: 180,
    color: '#8B4513',
    category: 'living-room-shelving',
    roomTypes: ['living-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Built-in recessed bookshelf alcove'
  },

  // LIVING ROOM SEATING & TABLES
  {
    id: 'sectional-sofa-left-arm',
    name: 'Sectional Sofa (Left Arm)',
    type: 'appliance',
    width: 280,
    height: 90,
    color: '#3A6EA5',
    category: 'living-room-furniture',
    roomTypes: ['living-room'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Large left-arm sectional sofa'
  },
  {
    id: 'loveseat-sofa',
    name: 'Loveseat Sofa',
    type: 'appliance',
    width: 140,
    height: 80,
    color: '#3A6EA5',
    category: 'living-room-furniture',
    roomTypes: ['living-room'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Compact 2-seater loveseat'
  },
  {
    id: 'chaise-lounge',
    name: 'Chaise Lounge',
    type: 'appliance',
    width: 160,
    height: 70,
    color: '#3A6EA5',
    category: 'living-room-furniture',
    roomTypes: ['living-room'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Comfortable chaise lounge chair'
  },

  // LIVING ROOM STORAGE SOLUTIONS
  {
    id: 'ottoman-storage-large',
    name: 'Large Storage Ottoman',
    type: 'cabinet',
    width: 100,
    height: 50,
    color: '#6B8E23',
    category: 'living-room-storage',
    roomTypes: ['living-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Large upholstered ottoman with internal storage'
  },
  {
    id: 'console-table-storage',
    name: 'Console Table with Storage',
    type: 'cabinet',
    width: 120,
    height: 80,
    color: '#8B4513',
    category: 'living-room-storage',
    roomTypes: ['living-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Console table with drawers and cabinets'
  },

  // LIVING ROOM PROPS & ACCESSORIES
  {
    id: 'floor-lamp-modern',
    name: 'Modern Floor Lamp',
    type: 'appliance',
    width: 40,
    height: 160,
    color: '#C0C0C0',
    category: 'living-room-props',
    roomTypes: ['living-room'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Contemporary floor lamp with adjustable height'
  },
  {
    id: 'area-rug-large',
    name: 'Large Area Rug',
    type: 'appliance',
    width: 300,
    height: 200,
    color: '#8B4513',
    category: 'living-room-props',
    roomTypes: ['living-room'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Large patterned area rug for living room'
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

  // ENHANCED OFFICE COMPONENTS - Professional Collection

  // ADVANCED OFFICE DESKS (Your Carpentry Expertise)
  {
    id: 'executive-desk',
    name: 'Executive Desk',
    type: 'appliance',
    width: 180,
    height: 80,
    color: '#8B4513',
    category: 'office-furniture',
    roomTypes: ['office'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Large executive desk with multiple drawers'
  },
  {
    id: 'l-shaped-desk',
    name: 'L-Shaped Desk',
    type: 'appliance',
    width: 160,
    height: 140,
    color: '#8B4513',
    category: 'office-furniture',
    roomTypes: ['office'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Corner L-shaped desk maximizing workspace'
  },
  {
    id: 'standing-desk',
    name: 'Height Adjustable Desk',
    type: 'appliance',
    width: 160,
    height: 80,
    color: '#2F4F4F',
    category: 'office-furniture',
    roomTypes: ['office'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Electric height-adjustable standing desk'
  },

  // OFFICE STORAGE SOLUTIONS
  {
    id: 'filing-cabinet-4drawer',
    name: '4-Drawer Filing Cabinet',
    type: 'cabinet',
    width: 45,
    height: 130,
    color: '#2F4F4F',
    category: 'office-storage',
    roomTypes: ['office'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Tall metal filing cabinet with lock'
  },
  {
    id: 'storage-credenza',
    name: 'Storage Credenza',
    type: 'cabinet',
    width: 180,
    height: 60,
    color: '#8B4513',
    category: 'office-storage',
    roomTypes: ['office'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Low credenza with multiple storage compartments'
  },

  // CUSTOM OFFICE BOOKCASES & SHELVING
  {
    id: 'bookshelf-barrister',
    name: 'Barrister Bookshelf',
    type: 'cabinet',
    width: 80,
    height: 180,
    color: '#8B4513',
    category: 'office-shelving',
    roomTypes: ['office'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Traditional barrister bookcase with glass doors'
  },
  {
    id: 'wall-mounted-shelves-office',
    name: 'Wall-Mounted Office Shelves',
    type: 'cabinet',
    width: 150,
    height: 30,
    color: '#F5DEB3',
    category: 'office-shelving',
    roomTypes: ['office'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Wall-mounted shelves above desk'
  },

  // OFFICE ACCESSORIES & PROPS
  {
    id: 'desk-lamp-led',
    name: 'LED Desk Lamp',
    type: 'appliance',
    width: 25,
    height: 40,
    color: '#C0C0C0',
    category: 'office-props',
    roomTypes: ['office'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Modern LED desk lamp with adjustable arm'
  },
  {
    id: 'whiteboard-wall',
    name: 'Wall-Mounted Whiteboard',
    type: 'appliance',
    width: 120,
    height: 90,
    color: '#FFFFFF',
    category: 'office-props',
    roomTypes: ['office'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Magnetic whiteboard for brainstorming'
  },

  // ENHANCED BEDROOM COMPONENTS - Comprehensive Collection

  // BEDROOM FURNITURE
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
  {
    id: 'king-bed-storage',
    name: 'King Bed with Storage',
    type: 'appliance',
    width: 180,
    height: 200,
    color: '#8B4513',
    category: 'bedroom-furniture',
    roomTypes: ['bedroom', 'master-bedroom'],
    icon: <Bed className="h-4 w-4" />,
    description: 'King size bed with under-bed storage drawers'
  },
  {
    id: 'super-king-bed',
    name: 'Super King Bed',
    type: 'appliance',
    width: 200,
    height: 200,
    color: '#8B4513',
    category: 'bedroom-furniture',
    roomTypes: ['bedroom', 'master-bedroom'],
    icon: <Bed className="h-4 w-4" />,
    description: 'Super king size bed frame'
  },
  {
    id: 'single-bed',
    name: 'Single Bed',
    type: 'appliance',
    width: 100,
    height: 200,
    color: '#8B4513',
    category: 'bedroom-furniture',
    roomTypes: ['bedroom', 'guest-bedroom'],
    icon: <Bed className="h-4 w-4" />,
    description: 'Single bed for guest rooms or children'
  },
  {
    id: 'bunk-bed-system',
    name: 'Bunk Bed System',
    type: 'appliance',
    width: 100,
    height: 180,
    color: '#8B4513',
    category: 'bedroom-furniture',
    roomTypes: ['bedroom', 'guest-bedroom'],
    icon: <Bed className="h-4 w-4" />,
    description: 'Two-tier bunk bed with storage underneath'
  },
  {
    id: 'upholstered-bench',
    name: 'Upholstered Storage Bench',
    type: 'appliance',
    width: 120,
    height: 50,
    color: '#6B8E23',
    category: 'bedroom-furniture',
    roomTypes: ['bedroom', 'master-bedroom'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'End-of-bed bench with internal storage'
  },
  {
    id: 'reading-chair',
    name: 'Reading Chair',
    type: 'appliance',
    width: 70,
    height: 80,
    color: '#8B4513',
    category: 'bedroom-furniture',
    roomTypes: ['bedroom', 'master-bedroom'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Comfortable armchair for bedroom reading nook'
  },

  // ADVANCED BEDROOM STORAGE SOLUTIONS (Your Carpentry Expertise)
  {
    id: 'wardrobe-walk-in',
    name: 'Walk-in Wardrobe Unit',
    type: 'cabinet',
    width: 200,
    height: 60,
    color: '#654321',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom'],
    icon: <Shirt className="h-4 w-4" />,
    description: 'Custom walk-in wardrobe with hanging rails and shelves'
  },
  {
    id: 'wardrobe-built-in',
    name: 'Built-in Wardrobe',
    type: 'cabinet',
    width: 240,
    height: 60,
    color: '#654321',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Shirt className="h-4 w-4" />,
    description: 'Floor-to-ceiling built-in wardrobe system'
  },
  {
    id: 'wardrobe-corner',
    name: 'Corner Wardrobe',
    type: 'cabinet',
    width: 120,
    height: 120,
    color: '#654321',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner wardrobe maximizing space'
  },
  {
    id: 'wardrobe-sliding-door',
    name: 'Sliding Door Wardrobe',
    type: 'cabinet',
    width: 180,
    height: 60,
    color: '#654321',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Shirt className="h-4 w-4" />,
    description: 'Space-saving sliding door wardrobe system'
  },
  {
    id: 'bed-storage-drawers',
    name: 'Bed Storage Drawers',
    type: 'cabinet',
    width: 160,
    height: 40,
    color: '#8B4513',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Under-bed storage drawers for seasonal items'
  },
  {
    id: 'tallboy-6-drawer',
    name: 'Tallboy Chest',
    type: 'cabinet',
    width: 50,
    height: 120,
    color: '#654321',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Narrow 6-drawer tallboy for tight spaces'
  },
  {
    id: 'shoe-storage-tower',
    name: 'Shoe Storage Tower',
    type: 'cabinet',
    width: 60,
    height: 120,
    color: '#654321',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Box className="h-4 w-4" />,
    description: 'Vertical shoe storage with adjustable shelves'
  },
  {
    id: 'bed-head-unit',
    name: 'Bed Head Storage Unit',
    type: 'cabinet',
    width: 160,
    height: 30,
    color: '#8B4513',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Custom bed head unit with integrated storage'
  },
  {
    id: 'floating-bedside',
    name: 'Floating Bedside Cabinet',
    type: 'cabinet',
    width: 50,
    height: 40,
    color: '#8B4513',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Box className="h-4 w-4" />,
    description: 'Wall-mounted floating bedside cabinet'
  },
  {
    id: 'corner-shelving',
    name: 'Corner Display Shelving',
    type: 'cabinet',
    width: 60,
    height: 180,
    color: '#F5DEB3',
    category: 'bedroom-storage',
    roomTypes: ['bedroom', 'master-bedroom'],
    icon: <Square className="h-4 w-4" />,
    description: 'Corner shelving unit for books and decor'
  },

  // BEDROOM PROPS & ACCESSORIES
  {
    id: 'bedside-lamp',
    name: 'Bedside Lamp',
    type: 'appliance',
    width: 25,
    height: 50,
    color: '#F5F5DC',
    category: 'bedroom-props',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Table lamp for bedside lighting'
  },
  {
    id: 'wall-mirror-oval',
    name: 'Oval Wall Mirror',
    type: 'appliance',
    width: 60,
    height: 80,
    color: '#C0C0C0',
    category: 'bedroom-props',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Oval framed wall mirror'
  },
  {
    id: 'bedroom-rug-large',
    name: 'Large Bedroom Rug',
    type: 'appliance',
    width: 250,
    height: 180,
    color: '#8B4513',
    category: 'bedroom-props',
    roomTypes: ['bedroom', 'master-bedroom'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Large area rug for bedroom floor'
  },
  {
    id: 'curtains-floor-length',
    name: 'Floor Length Curtains',
    type: 'appliance',
    width: 100,
    height: 250,
    color: '#F5F5DC',
    category: 'bedroom-props',
    roomTypes: ['bedroom', 'master-bedroom', 'guest-bedroom'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Floor-to-ceiling window curtains'
  },

  // ENHANCED DRESSING ROOM COMPONENTS - Comprehensive Collection

  // CUSTOM DRESSING ROOM STORAGE (Your Carpentry Expertise)
  {
    id: 'walk-in-wardrobe-system',
    name: 'Walk-in Wardrobe System',
    type: 'cabinet',
    width: 300,
    height: 60,
    color: '#654321',
    category: 'dressing-storage',
    roomTypes: ['dressing-room'],
    icon: <Shirt className="h-4 w-4" />,
    description: 'Complete walk-in wardrobe system with hanging rails'
  },
  {
    id: 'wardrobe-island-unit',
    name: 'Wardrobe Island Unit',
    type: 'cabinet',
    width: 120,
    height: 80,
    color: '#654321',
    category: 'dressing-storage',
    roomTypes: ['dressing-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Central island unit with drawers and storage'
  },
  {
    id: 'shoe-storage-tower-dressing',
    name: 'Shoe Storage Tower',
    type: 'cabinet',
    width: 60,
    height: 200,
    color: '#654321',
    category: 'dressing-storage',
    roomTypes: ['dressing-room'],
    icon: <Box className="h-4 w-4" />,
    description: 'Tall shoe storage with automatic shutters'
  },
  {
    id: 'jewelry-armoire-large',
    name: 'Jewelry Armoire',
    type: 'cabinet',
    width: 50,
    height: 150,
    color: '#654321',
    category: 'dressing-storage',
    roomTypes: ['dressing-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Large jewelry armoire with compartments'
  },

  // DRESSING ROOM FURNITURE
  {
    id: 'dressing-table-vanity-large',
    name: 'Large Vanity Dressing Table',
    type: 'cabinet',
    width: 160,
    height: 50,
    color: '#8B4513',
    category: 'dressing-furniture',
    roomTypes: ['dressing-room'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Large vanity table with integrated lighting'
  },
  {
    id: 'dressing-bench-storage-large',
    name: 'Storage Dressing Bench',
    type: 'appliance',
    width: 120,
    height: 50,
    color: '#8B4513',
    category: 'dressing-furniture',
    roomTypes: ['dressing-room'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Upholstered bench with under-seat storage'
  },

  // DRESSING ROOM PROPS & ACCESSORIES
  {
    id: 'full-length-mirror-stand-large',
    name: 'Full-Length Mirror',
    type: 'appliance',
    width: 60,
    height: 180,
    color: '#C0C0C0',
    category: 'dressing-props',
    roomTypes: ['dressing-room'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Floor-standing full-length mirror'
  },
  {
    id: 'dressing-room-mirror-lighted',
    name: 'Lighted Dressing Mirror',
    type: 'appliance',
    width: 80,
    height: 100,
    color: '#C0C0C0',
    category: 'dressing-props',
    roomTypes: ['dressing-room'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Hollywood-style lighted vanity mirror'
  },

  // ENHANCED BATHROOM COMPONENTS - Comprehensive Collection

  // CUSTOM VANITY UNITS (Your Carpentry Expertise)
  {
    id: 'vanity-double-120',
    name: 'Double Vanity 120cm',
    type: 'cabinet',
    width: 120,
    height: 60,
    color: '#F5F5DC',
    category: 'bathroom-vanities',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Bath className="h-4 w-4" />,
    description: 'His & hers double vanity unit with integrated storage'
  },
  {
    id: 'vanity-floating-100',
    name: 'Floating Vanity 100cm',
    type: 'cabinet',
    width: 100,
    height: 50,
    color: '#F5F5DC',
    category: 'bathroom-vanities',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Bath className="h-4 w-4" />,
    description: 'Wall-mounted floating vanity with open shelving'
  },
  {
    id: 'vanity-corner-unit',
    name: 'Corner Vanity Unit',
    type: 'cabinet',
    width: 80,
    height: 80,
    color: '#F5F5DC',
    category: 'bathroom-vanities',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Square className="h-4 w-4" />,
    description: 'L-shaped corner vanity maximizing bathroom space'
  },
  {
    id: 'vanity-compact-45',
    name: 'Compact Vanity 45cm',
    type: 'cabinet',
    width: 45,
    height: 60,
    color: '#F5F5DC',
    category: 'bathroom-vanities',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Bath className="h-4 w-4" />,
    description: 'Narrow vanity for powder rooms or small bathrooms'
  },

  // BATHROOM STORAGE SOLUTIONS
  {
    id: 'bathroom-linen-cupboard',
    name: 'Linen Cupboard',
    type: 'cabinet',
    width: 60,
    height: 180,
    color: '#F5F5DC',
    category: 'bathroom-storage',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Tall linen storage cupboard with adjustable shelves'
  },
  {
    id: 'bathroom-mirror-cabinet',
    name: 'Illuminated Mirror Cabinet',
    type: 'cabinet',
    width: 70,
    height: 80,
    color: '#C0C0C0',
    category: 'bathroom-storage',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Mirror-fronted cabinet with integrated lighting'
  },
  {
    id: 'bathroom-towel-rack',
    name: 'Towel Storage Rack',
    type: 'cabinet',
    width: 80,
    height: 40,
    color: '#F5F5DC',
    category: 'bathroom-storage',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Wall-mounted towel storage with baskets'
  },
  {
    id: 'bathroom-under-sink-storage',
    name: 'Under-Sink Pull-Out Storage',
    type: 'cabinet',
    width: 60,
    height: 80,
    color: '#F5F5DC',
    category: 'bathroom-storage',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Custom under-sink storage with pull-out drawers'
  },

  // BATHROOM FIXTURES (Props - Non-Carpentry)
  {
    id: 'toilet-compact',
    name: 'Compact Toilet',
    type: 'appliance',
    width: 35,
    height: 60,
    color: '#FFFFFF',
    category: 'bathroom-fixtures',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Home className="h-4 w-4" />,
    description: 'Space-saving compact toilet design'
  },
  {
    id: 'shower-enclosure-rectangular',
    name: 'Rectangular Shower Enclosure',
    type: 'appliance',
    width: 80,
    height: 200,
    color: '#E6E6FA',
    category: 'bathroom-fixtures',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Waves className="h-4 w-4" />,
    description: 'Walk-in shower enclosure with frameless glass'
  },
  {
    id: 'shower-enclosure-corner',
    name: 'Corner Shower Enclosure',
    type: 'appliance',
    width: 90,
    height: 90,
    color: '#E6E6FA',
    category: 'bathroom-fixtures',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Square className="h-4 w-4" />,
    description: 'Corner shower enclosure with sliding doors'
  },
  {
    id: 'freestanding-bathtub',
    name: 'Freestanding Bathtub',
    type: 'appliance',
    width: 170,
    height: 75,
    color: '#FFFFFF',
    category: 'bathroom-fixtures',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Bath className="h-4 w-4" />,
    description: 'Classic freestanding roll-top bathtub'
  },
  {
    id: 'walk-in-bathtub',
    name: 'Walk-in Bathtub',
    type: 'appliance',
    width: 150,
    height: 90,
    color: '#FFFFFF',
    category: 'bathroom-fixtures',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Bath className="h-4 w-4" />,
    description: 'Accessible walk-in bathtub with low step entry'
  },

  // BATHROOM ACCESSORIES & PROPS
  {
    id: 'bathroom-mirror-large',
    name: 'Large Bathroom Mirror',
    type: 'appliance',
    width: 80,
    height: 100,
    color: '#C0C0C0',
    category: 'bathroom-props',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Large frameless bathroom mirror'
  },
  {
    id: 'bathroom-extractor-fan',
    name: 'Extractor Fan',
    type: 'appliance',
    width: 30,
    height: 30,
    color: '#FFFFFF',
    category: 'bathroom-props',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Wind className="h-4 w-4" />,
    description: 'Wall-mounted bathroom extractor fan'
  },
  {
    id: 'bathroom-heated-towel-rail',
    name: 'Heated Towel Rail',
    type: 'appliance',
    width: 60,
    height: 120,
    color: '#C0C0C0',
    category: 'bathroom-props',
    roomTypes: ['bathroom', 'ensuite'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Electric heated towel rail'
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
  // UTILITY APPLIANCES
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
    id: 'stacked-laundry-pair',
    name: 'Stacked Laundry Pair',
    type: 'appliance',
    width: 60,
    height: 180,
    color: '#f0f0f0',
    category: 'utility-appliances',
    roomTypes: ['utility'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Stacked washer and dryer unit'
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
    id: 'utility-sink',
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

  // UTILITY STORAGE SOLUTIONS (Your Carpentry Expertise)
  {
    id: 'utility-storage',
    name: 'Utility Storage',
    type: 'cabinet',
    width: 80,
    height: 200,
    color: '#8b4513',
    category: 'utility-storage',
    roomTypes: ['utility'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Tall utility storage cabinet'
  },
  {
    id: 'laundry-folding-station',
    name: 'Laundry Folding Station',
    type: 'cabinet',
    width: 120,
    height: 90,
    color: '#F5DEB3',
    category: 'utility-storage',
    roomTypes: ['utility'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Built-in folding station with storage below'
  },
  {
    id: 'floor-to-ceiling-pantry',
    name: 'Floor-to-Ceiling Pantry',
    type: 'cabinet',
    width: 80,
    height: 240,
    color: '#8B4513',
    category: 'utility-storage',
    roomTypes: ['utility'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Tall pantry storage with multiple shelves'
  },

  // UTILITY ROOM PROPS & ACCESSORIES
  {
    id: 'iron-board-cabinet',
    name: 'Ironing Board Cabinet',
    type: 'appliance',
    width: 40,
    height: 120,
    color: '#C0C0C0',
    category: 'utility-props',
    roomTypes: ['utility'],
    icon: <Box className="h-4 w-4" />,
    description: 'Wall-mounted fold-out ironing board'
  }
];

// Add dining room specific components
const diningRoomComponents: ComponentDefinition[] = [
  // ENHANCED DINING TABLES (Your Carpentry Expertise)
  {
    id: 'dining-table-4',
    name: 'Dining Table (4)',
    type: 'appliance',
    width: 120,
    height: 80,
    color: '#8B4513',
    category: 'dining-furniture',
    roomTypes: ['dining-room'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Compact dining table for 4 people'
  },
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
    id: 'dining-table-8',
    name: 'Dining Table (8)',
    type: 'appliance',
    width: 220,
    height: 90,
    color: '#8B4513',
    category: 'dining-furniture',
    roomTypes: ['dining-room'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Large dining table for 8 people'
  },
  {
    id: 'dining-table-extendable',
    name: 'Extendable Dining Table',
    type: 'appliance',
    width: 160,
    height: 90,
    color: '#8B4513',
    category: 'dining-furniture',
    roomTypes: ['dining-room'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Extendable dining table (6-10 seats)'
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
    id: 'dining-chair-upholstered',
    name: 'Upholstered Dining Chair',
    type: 'appliance',
    width: 50,
    height: 45,
    color: '#8B4513',
    category: 'dining-furniture',
    roomTypes: ['dining-room'],
    icon: <Sofa className="h-4 w-4" />,
    description: 'Comfortable upholstered dining chair'
  },
  {
    id: 'bench-dining',
    name: 'Dining Bench',
    type: 'appliance',
    width: 150,
    height: 45,
    color: '#8B4513',
    category: 'dining-furniture',
    roomTypes: ['dining-room'],
    icon: <RectangleHorizontal className="h-4 w-4" />,
    description: 'Long dining bench for casual seating'
  },

  // CUSTOM CHINA CABINETS & DISPLAY
  {
    id: 'china-cabinet-tall',
    name: 'Tall China Cabinet',
    type: 'cabinet',
    width: 60,
    height: 200,
    color: '#F5DEB3',
    category: 'dining-display',
    roomTypes: ['dining-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Tall china cabinet with glass doors and shelving'
  },
  {
    id: 'hutch-dining',
    name: 'Dining Hutch',
    type: 'cabinet',
    width: 120,
    height: 180,
    color: '#8B4513',
    category: 'dining-display',
    roomTypes: ['dining-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Traditional dining hutch with plate rack'
  },

  // DINING ROOM STORAGE SOLUTIONS
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
  },
  {
    id: 'sideboard-large',
    name: 'Large Sideboard',
    type: 'cabinet',
    width: 180,
    height: 45,
    color: '#8B4513',
    category: 'dining-storage',
    roomTypes: ['dining-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Large sideboard with multiple drawers and cabinets'
  },
  {
    id: 'wine-rack-storage',
    name: 'Wine Rack Storage',
    type: 'cabinet',
    width: 60,
    height: 120,
    color: '#8B4513',
    category: 'dining-storage',
    roomTypes: ['dining-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Wine rack with bottle storage and stemware holders'
  },

  // DINING ROOM PROPS & ACCESSORIES
  {
    id: 'dining-chandelier',
    name: 'Crystal Chandelier',
    type: 'appliance',
    width: 60,
    height: 60,
    color: '#E6E6FA',
    category: 'dining-props',
    roomTypes: ['dining-room'],
    icon: <Zap className="h-4 w-4" />,
    description: 'Elegant crystal chandelier for dining room'
  },
  {
    id: 'bar-cart-mobile',
    name: 'Mobile Bar Cart',
    type: 'appliance',
    width: 60,
    height: 80,
    color: '#8B4513',
    category: 'dining-props',
    roomTypes: ['dining-room'],
    icon: <Archive className="h-4 w-4" />,
    description: 'Mobile bar cart for entertaining'
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

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  onAddElement,
  roomType
}) => {
  // Filter components by room type and get available categories
  const roomComponents = components.filter(comp => comp.roomTypes.includes(roomType));
  const availableCategories = [...new Set(roomComponents.map(comp => comp.category))];
  
  const [selectedCategory, setSelectedCategory] = useState<string>(availableCategories[0] || 'base-cabinets');

  // Auto-select first available category when room type changes
  useEffect(() => {
    if (availableCategories.length > 0) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [roomType, availableCategories.join(',')]);

  const filteredComponents = roomComponents.filter(comp => comp.category === selectedCategory);

  const handleAddComponent = (component: ComponentDefinition) => {
    const newElement: DesignElement = {
      id: `${component.id}-${Date.now()}`,
      type: component.type,
      x: 100,
      y: 100,
      width: component.width, // X-axis dimension
      depth: component.depth, // Y-axis dimension (front-to-back)
      height: component.height, // Z-axis dimension (bottom-to-top)
      rotation: 0,
      color: component.color,
      style: component.name
    };

    onAddElement(newElement);
  };

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
    
    const iconDiv = document.createElement('div');
    iconDiv.style.fontSize = `${Math.min(displayWidth, displayHeight) * 0.3}px`;
    iconDiv.style.marginBottom = '2px';
    
    const svgContainer = createSafeSVGElement(getIconSVG(component));
    const svgElement = svgContainer.firstElementChild;
    if (svgElement) {
      iconDiv.appendChild(svgElement);
    }
    
    const textDiv = document.createElement('div');
    textDiv.style.fontSize = '9px';
    textDiv.style.textAlign = 'center';
    textDiv.style.lineHeight = '1';
    textDiv.textContent = component.name.split(' ')[0];
    
    dragImage.appendChild(iconDiv);
    if (displayHeight > 30) dragImage.appendChild(textDiv);
    
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, displayWidth / 2, displayHeight / 2);
    
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const getIconSVG = (component: ComponentDefinition): string => {
    const iconMap: { [key: string]: string } = {
      'refrigerator': '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 5h14v6H5V5zm0 8h14v6H5v-6z"/></svg>',
      'microwave': '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 10H4V8h8v8zm6-1h-2v-2h2v2zm0-4h-2V9h2v2z"/></svg>',
      'oven': '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM20 18H4V8h16v10zM6 10h12v6H6v-6z"/></svg>',
      'dishwasher': '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5h14v14H5V5zm2 2v3h10V7H7zm0 5v5h10v-5H7z"/></svg>',
      'cabinet': '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-9h2v2h-2v-2z"/></svg>',
    };
    
    const name = component.name.toLowerCase();
    for (const [key, svg] of Object.entries(iconMap)) {
      if (name.includes(key)) return svg;
    }
    
    return iconMap.cabinet;
  };

  const getCategoryLabel = (category: string): string => {
    const labels: { [key: string]: string } = {
      'base-cabinets': 'Base Cabinets',
      'base-drawers': 'Base Drawers', 
      'wall-units': 'Wall Units',
      'appliances': 'Appliances',
      'kitchen-larder': 'Larder Units',
      'bedroom-furniture': 'Furniture',
      'bedroom-storage': 'Storage',
      'bedroom-props': 'Decor Props',
      'bathroom-vanities': 'Vanities',
      'bathroom-storage': 'Storage',
      'bathroom-fixtures': 'Fixtures',
      'bathroom-props': 'Accessories',
      'media-furniture': 'TV Units',
      'media-storage': 'Storage',
      'flooring-materials': 'Materials',
      'utility-appliances': 'Appliances',
      'utility-storage': 'Storage',
      'dining-furniture': 'Furniture',
      'dining-storage': 'Storage',
      'under-stairs-storage': 'Storage',
      'living-room-built-ins': 'Built-in Units',
      'living-room-shelving': 'Shelving',
      'living-room-storage': 'Storage',
      'living-room-furniture': 'Furniture',
      'living-room-props': 'Decor Props',
      'office-furniture': 'Office Furniture',
      'office-storage': 'Storage',
      'office-shelving': 'Shelving',
      'office-props': 'Accessories',
      'dining-display': 'Display Cabinets',
      'dining-props': 'Decor Props',
      'dressing-furniture': 'Furniture',
      'dressing-storage': 'Storage',
      'dressing-props': 'Accessories',
      'utility-props': 'Accessories'
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
      {/* Component Categories */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Components</h3>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-2 h-auto gap-1 p-1">
            {availableCategories.map((category) => (
              <TabsTrigger 
                key={category} 
                value={category} 
                className="text-xs p-2"
              >
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
                        {component.width}×{component.depth}×{component.height}
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
      </div>

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