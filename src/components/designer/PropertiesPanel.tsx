
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DesignElement, RoomType } from '@/types/project';
import { View2DMode } from '@/components/designer/ViewSelector';
import { Ruler, Palette, Settings, Home, Wrench, Layers, Sparkles, RotateCcw, RotateCw } from 'lucide-react';

interface PropertiesPanelProps {
  selectedElement: DesignElement | null;
  onUpdateElement: (elementId: string, updates: Partial<DesignElement>) => void;
  roomDimensions: { width: number; height: number };
  onUpdateRoomDimensions: (dimensions: { width: number; height: number }) => void;
  roomType: RoomType;
  active2DView: View2DMode;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  roomDimensions,
  onUpdateRoomDimensions,
  roomType,
  active2DView
}) => {
  // Helper functions for proper 3D dimension mapping
  const getElementDepth = (element: DesignElement): number => {
    return element.depth ?? 60; // Default depth for cabinets
  };

  const getElementHeight = (element: DesignElement): number => {
    return element.height ?? 90; // Default height for cabinets
  };

  const updateElementDimension = (dimension: 'width' | 'depth' | 'height', value: number) => {
    if (!selectedElement) return;
    
    const updates: Partial<DesignElement> = {};
    updates[dimension] = value;
    
    onUpdateElement(selectedElement.id, updates);
  };

  // Always show height control - it's a fundamental 3D property
  const showHeightControl = true;

  const [roomWidth, setRoomWidth] = useState(roomDimensions.width);
  const [roomHeight, setRoomHeight] = useState(roomDimensions.height);

  // Room-specific color palettes
  const getRoomColors = (roomType: RoomType) => {
    const colorSets = {
      kitchen: [
        { name: 'Oak Brown', value: '#8b4513' },
        { name: 'White', value: '#ffffff' },
        { name: 'Black', value: '#2c2c2c' },
        { name: 'Gray', value: '#808080' },
        { name: 'Navy Blue', value: '#1e3a8a' },
        { name: 'Forest Green', value: '#166534' },
        { name: 'Cherry Red', value: '#dc2626' },
        { name: 'Stainless Steel', value: '#c0c0c0' }
      ],
      bedroom: [
        { name: 'Warm White', value: '#fefefe' },
        { name: 'Soft Gray', value: '#9ca3af' },
        { name: 'Natural Oak', value: '#d2b48c' },
        { name: 'Deep Walnut', value: '#654321' },
        { name: 'Charcoal', value: '#36454f' },
        { name: 'Sage Green', value: '#9caf88' },
        { name: 'Dusty Rose', value: '#dcae96' },
        { name: 'Cream', value: '#f5f5dc' }
      ],
      bathroom: [
        { name: 'Pure White', value: '#ffffff' },
        { name: 'Light Gray', value: '#e5e7eb' },
        { name: 'Soft Beige', value: '#f5f5dc' },
        { name: 'Ocean Blue', value: '#0ea5e9' },
        { name: 'Mint Green', value: '#6ee7b7' },
        { name: 'Warm Taupe', value: '#a8a29e' },
        { name: 'Marble White', value: '#fafafa' },
        { name: 'Chrome', value: '#c0c0c0' }
      ],
      'living-room': [
        { name: 'Charcoal Black', value: '#1f2937' },
        { name: 'Dark Gray', value: '#374151' },
        { name: 'Espresso', value: '#3c2415' },
        { name: 'White', value: '#ffffff' },
        { name: 'Warm Gray', value: '#6b7280' },
        { name: 'Rich Brown', value: '#8b4513' },
        { name: 'Slate Blue', value: '#475569' },
        { name: 'Matte Black', value: '#0f172a' }
      ],
      'dining-room': [
        { name: 'Natural Oak', value: '#deb887' },
        { name: 'Dark Walnut', value: '#8b4513' },
        { name: 'Light Maple', value: '#f4e4c1' },
        { name: 'Gray Stone', value: '#9ca3af' },
        { name: 'White Marble', value: '#f8fafc' },
        { name: 'Charcoal Tile', value: '#374151' },
        { name: 'Warm Beige', value: '#f5f5dc' },
        { name: 'Rustic Pine', value: '#cd853f' }
      ]
    };
    return colorSets[roomType] || colorSets.kitchen;
  };

  const colors = getRoomColors(roomType);

  // Get component-specific options based on room type and element type
  const getComponentOptions = (roomType: RoomType, elementType: string, elementStyle?: string) => {
    if (roomType === 'kitchen' && elementType === 'cabinet') {
      return {
        styles: [
          { value: 'standard', label: 'Standard' },
          { value: 'shaker', label: 'Shaker' },
          { value: 'modern', label: 'Modern' },
          { value: 'traditional', label: 'Traditional' },
          { value: 'handleless', label: 'Handleless' }
        ],
        handles: [
          { value: 'bar', label: 'Bar Handle' },
          { value: 'knob', label: 'Knob' },
          { value: 'recessed', label: 'Recessed' },
          { value: 'none', label: 'No Handle' }
        ],
        finishes: [
          { value: 'matte', label: 'Matte' },
          { value: 'gloss', label: 'High Gloss' },
          { value: 'satin', label: 'Satin' },
          { value: 'textured', label: 'Textured' }
        ]
      };
    }
    
    if (roomType === 'bedroom' && elementType === 'cabinet') {
      return {
        styles: [
          { value: 'modern', label: 'Modern' },
          { value: 'traditional', label: 'Traditional' },
          { value: 'minimal', label: 'Minimalist' },
          { value: 'rustic', label: 'Rustic' }
        ],
        handles: [
          { value: 'bar', label: 'Bar Handle' },
          { value: 'knob', label: 'Round Knob' },
          { value: 'vintage', label: 'Vintage' },
          { value: 'modern', label: 'Modern' }
        ],
        finishes: [
          { value: 'natural', label: 'Natural Wood' },
          { value: 'painted', label: 'Painted' },
          { value: 'veneer', label: 'Wood Veneer' },
          { value: 'laminate', label: 'Laminate' }
        ]
      };
    }

    if (roomType === 'bathroom' && elementType === 'cabinet') {
      return {
        styles: [
          { value: 'floating', label: 'Wall Hung' },
          { value: 'vanity', label: 'Vanity Style' },
          { value: 'modern', label: 'Modern' },
          { value: 'traditional', label: 'Traditional' }
        ],
        handles: [
          { value: 'bar', label: 'Chrome Bar' },
          { value: 'knob', label: 'Chrome Knob' },
          { value: 'recessed', label: 'Recessed Grip' },
          { value: 'none', label: 'Push-to-Open' }
        ],
        finishes: [
          { value: 'moisture-resistant', label: 'Moisture Resistant' },
          { value: 'high-gloss', label: 'High Gloss' },
          { value: 'waterproof', label: 'Waterproof' }
        ]
      };
    }

    if (roomType === 'living-room' && elementType === 'cabinet') {
      return {
        styles: [
          { value: 'low-profile', label: 'Low Profile' },
          { value: 'floating', label: 'Floating' },
          { value: 'modular', label: 'Modular' },
          { value: 'entertainment', label: 'Entertainment Center' }
        ],
        handles: [
          { value: 'hidden', label: 'Hidden' },
          { value: 'minimalist', label: 'Minimal Bar' },
          { value: 'recessed', label: 'Recessed' },
          { value: 'none', label: 'Push-to-Open' }
        ],
        finishes: [
          { value: 'matte', label: 'Matte Black' },
          { value: 'wood-grain', label: 'Wood Grain' },
          { value: 'gloss', label: 'High Gloss' }
        ]
      };
    }

    // Default options
    return {
      styles: [{ value: 'standard', label: 'Standard' }],
      handles: [{ value: 'standard', label: 'Standard' }],
      finishes: [{ value: 'standard', label: 'Standard' }]
    };
  };

  const handleRoomDimensionsUpdate = () => {
    onUpdateRoomDimensions({ width: roomWidth, height: roomHeight });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Room Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Home className="h-4 w-4" />
            <span>Room Dimensions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="room-width" className="text-xs">Width (cm)</Label>
              <Input
                id="room-width"
                type="number"
                value={roomWidth}
                onChange={(e) => setRoomWidth(Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="room-height" className="text-xs">Height (cm)</Label>
              <Input
                id="room-height"
                type="number"
                value={roomHeight}
                onChange={(e) => setRoomHeight(Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={handleRoomDimensionsUpdate}
            className="w-full text-xs"
          >
            Update Room Size
          </Button>
        </CardContent>
      </Card>

      {/* Element Properties */}
      {selectedElement ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Settings className="h-4 w-4" />
              <span>Element Properties</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Type</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {selectedElement.type}
                    </Badge>
                    {selectedElement.style && (
                      <Badge variant="outline" className="text-xs">
                        {selectedElement.style}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Position & Size */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold flex items-center">
                    <Ruler className="h-3 w-3 mr-1" />
                    Position & Size
                  </Label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">X Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElement.x)}
                        onChange={(e) => onUpdateElement(selectedElement.id, { x: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Y Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElement.y)}
                        onChange={(e) => onUpdateElement(selectedElement.id, { y: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Z Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElement.z || 0)}
                        onChange={(e) => onUpdateElement(selectedElement.id, { z: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Width (cm)</Label>
                      <Input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) => updateElementDimension('width', Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Depth (cm)</Label>
                      <Input
                        type="number"
                        value={getElementDepth(selectedElement)}
                        onChange={(e) => updateElementDimension('depth', Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {showHeightControl && (
                    <div className="space-y-1">
                      <Label className="text-xs">Height (cm)</Label>
                      <Input
                        type="number"
                        value={getElementHeight(selectedElement)}
                        onChange={(e) => updateElementDimension('height', Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">Rotation: {Math.round(selectedElement.rotation || 0)}°</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateElement(selectedElement.id, {
                          rotation: ((selectedElement.rotation || 0) - 45 + 360) % 360
                        })}
                        className="flex-1 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        -45°
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateElement(selectedElement.id, {
                          rotation: ((selectedElement.rotation || 0) + 45) % 360
                        })}
                        className="flex-1 text-xs"
                      >
                        <RotateCw className="h-3 w-3 mr-1" />
                        +45°
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Style Tab */}
              <TabsContent value="style" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold flex items-center">
                    <Palette className="h-3 w-3 mr-1" />
                    Appearance
                  </Label>

                  <div className="space-y-2">
                    <Label className="text-xs">Color</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {colors.map((color) => (
                        <button
                          key={color.value}
                          className={`w-8 h-8 rounded border-2 ${
                            selectedElement.color === color.value 
                              ? 'border-blue-500 ring-2 ring-blue-200' 
                              : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => onUpdateElement(selectedElement.id, { color: color.value })}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {selectedElement.type === 'cabinet' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Cabinet Style</Label>
                        <Select
                          value={selectedElement.style || 'standard'}
                          onValueChange={(value) => onUpdateElement(selectedElement.id, { style: value })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getComponentOptions(roomType, selectedElement.type).styles.map((style) => (
                              <SelectItem key={style.value} value={style.value}>
                                {style.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {selectedElement.type === 'appliance' && (
                    <div className="space-y-1">
                      <Label className="text-xs">Material</Label>
                      <Select
                        value={selectedElement.material || 'stainless'}
                        onValueChange={(value) => onUpdateElement(selectedElement.id, { material: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stainless">Stainless Steel</SelectItem>
                          <SelectItem value="black">Black</SelectItem>
                          <SelectItem value="white">White</SelectItem>
                          <SelectItem value="slate">Slate</SelectItem>
                          {roomType === 'bedroom' && (
                            <>
                              <SelectItem value="wood">Wood</SelectItem>
                              <SelectItem value="fabric">Fabric</SelectItem>
                              <SelectItem value="leather">Leather</SelectItem>
                            </>
                          )}
                          {roomType === 'bathroom' && (
                            <>
                              <SelectItem value="ceramic">Ceramic</SelectItem>
                              <SelectItem value="porcelain">Porcelain</SelectItem>
                              <SelectItem value="acrylic">Acrylic</SelectItem>
                            </>
                          )}
                          {roomType === 'dining-room' && (
                            <>
                              <SelectItem value="hardwood">Hardwood</SelectItem>
                              <SelectItem value="laminate">Laminate</SelectItem>
                              <SelectItem value="tile">Tile</SelectItem>
                              <SelectItem value="carpet">Carpet</SelectItem>
                              <SelectItem value="vinyl">Vinyl</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                {selectedElement.type === 'cabinet' && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold flex items-center">
                      <Wrench className="h-3 w-3 mr-1" />
                      Hardware & Details
                    </Label>

                    <div className="space-y-1">
                      <Label className="text-xs">Handle Type</Label>
                      <Select
                        value={selectedElement.material || 'bar'}
                        onValueChange={(value) => onUpdateElement(selectedElement.id, { material: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getComponentOptions(roomType, selectedElement.type).handles.map((handle) => (
                            <SelectItem key={handle.value} value={handle.value}>
                              {handle.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Finish</Label>
                      <Select
                        value="matte"
                        onValueChange={(value) => {/* Could extend DesignElement to include finish */}}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getComponentOptions(roomType, selectedElement.type).finishes.map((finish) => (
                            <SelectItem key={finish.value} value={finish.value}>
                              {finish.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-xs font-semibold flex items-center">
                    <Layers className="h-3 w-3 mr-1" />
                    Layer & Effects
                  </Label>

                  <div className="space-y-2">
                    <Label className="text-xs">Opacity: 100%</Label>
                    <div className="text-xs text-gray-500">
                      Opacity control coming soon
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Shadow</Label>
                    <Select defaultValue="none">
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Shadow</SelectItem>
                        <SelectItem value="soft">Soft Shadow</SelectItem>
                        <SelectItem value="medium">Medium Shadow</SelectItem>
                        <SelectItem value="hard">Hard Shadow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {roomType === 'dining-room' && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Flooring Specific
                    </Label>

                    <div className="space-y-1">
                      <Label className="text-xs">Pattern</Label>
                      <Select defaultValue="standard">
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="herringbone">Herringbone</SelectItem>
                          <SelectItem value="diagonal">Diagonal</SelectItem>
                          <SelectItem value="brick">Brick</SelectItem>
                          <SelectItem value="chevron">Chevron</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Grout Color</Label>
                      <Select defaultValue="matching">
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="matching">Matching</SelectItem>
                          <SelectItem value="contrasting">Contrasting</SelectItem>
                          <SelectItem value="white">White</SelectItem>
                          <SelectItem value="gray">Gray</SelectItem>
                          <SelectItem value="black">Black</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <Settings className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              Select an element to edit its properties
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full text-xs">
            Duplicate Element
          </Button>
          <Button variant="outline" size="sm" className="w-full text-xs">
            Reset Position
          </Button>
          {selectedElement && (
            <Button variant="destructive" size="sm" className="w-full text-xs">
              Delete Element
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
