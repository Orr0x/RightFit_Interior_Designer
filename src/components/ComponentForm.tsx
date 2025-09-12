import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { DatabaseComponent } from '@/hooks/useComponents';

interface ComponentFormProps {
  initialData?: DatabaseComponent;
  onSubmit: (data: ComponentFormData) => void;
  onCancel: () => void;
  submitLabel: string;
}

export interface ComponentFormData {
  component_id: string;
  name: string;
  type: 'cabinet' | 'appliance' | 'counter-top' | 'end-panel' | 'window' | 'door' | 'flooring' | 'toe-kick' | 'cornice' | 'pelmet' | 'wall-unit-end-panel';
  width: number;
  depth: number;
  height: number;
  color: string;
  category: string;
  room_types: string[];
  icon_name: string;
  description: string;
  version: string;
  tags: string[];
}

const componentTypes = [
  'cabinet',
  'appliance', 
  'counter-top',
  'end-panel',
  'window',
  'door',
  'flooring',
  'toe-kick',
  'cornice',
  'pelmet',
  'wall-unit-end-panel'
] as const;

const roomTypes = [
  'kitchen',
  'bedroom',
  'bathroom',
  'living-room',
  'office',
  'dining-room',
  'dressing-room',
  'utility',
  'under-stairs',
  'media-wall',
  'internal-doors',
  'flooring'
];

const iconOptions = [
  'Square',
  'Archive',
  'Refrigerator',
  'Microwave',
  'Waves',
  'Box',
  'Zap',
  'Wind',
  'RectangleHorizontal',
  'Bed',
  'Shirt',
  'Bath',
  'Tv',
  'Sofa',
  'Grid3X3',
  'Home',
  'DoorOpen',
  'DoorClosed',
  'Layers',
  'Crown',
  'PanelLeft',
  'PanelRight'
];

const ComponentForm: React.FC<ComponentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitLabel
}) => {
  const [formData, setFormData] = useState<ComponentFormData>({
    component_id: initialData?.component_id || '',
    name: initialData?.name || '',
    type: initialData?.type || 'cabinet',
    width: initialData?.width || 60,
    depth: initialData?.depth || 60,
    height: initialData?.height || 72,
    color: initialData?.color || '#F5DEB3',
    category: initialData?.category || '',
    room_types: initialData?.room_types || ['kitchen'],
    icon_name: initialData?.icon_name || 'Square',
    description: initialData?.description || '',
    version: initialData?.version || '1.0.0',
    tags: initialData?.tags || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.component_id.trim()) {
      newErrors.component_id = 'Component ID is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.width <= 0) {
      newErrors.width = 'Width must be greater than 0';
    }
    if (formData.depth <= 0) {
      newErrors.depth = 'Depth must be greater than 0';
    }
    if (formData.height <= 0) {
      newErrors.height = 'Height must be greater than 0';
    }
    if (formData.room_types.length === 0) {
      newErrors.room_types = 'At least one room type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleRoomTypeChange = (roomType: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        room_types: [...prev.room_types, roomType]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        room_types: prev.room_types.filter(rt => rt !== roomType)
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Component ID */}
        <div>
          <Label htmlFor="component_id">Component ID *</Label>
          <Input
            id="component_id"
            value={formData.component_id}
            onChange={(e) => setFormData(prev => ({ ...prev, component_id: e.target.value }))}
            placeholder="e.g., base-cabinet-60"
            disabled={!!initialData} // Don't allow editing ID of existing components
          />
          {errors.component_id && <p className="text-sm text-red-500 mt-1">{errors.component_id}</p>}
        </div>

        {/* Name */}
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Base Cabinet 60cm"
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Type */}
        <div>
          <Label htmlFor="type">Type *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {componentTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="e.g., base-cabinets"
          />
          {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <Label>Dimensions (cm) *</Label>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <div>
            <Label htmlFor="width" className="text-sm">Width</Label>
            <Input
              id="width"
              type="number"
              value={formData.width}
              onChange={(e) => setFormData(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
              min="0.1"
              step="0.1"
            />
            {errors.width && <p className="text-sm text-red-500 mt-1">{errors.width}</p>}
          </div>
          <div>
            <Label htmlFor="depth" className="text-sm">Depth</Label>
            <Input
              id="depth"
              type="number"
              value={formData.depth}
              onChange={(e) => setFormData(prev => ({ ...prev, depth: parseFloat(e.target.value) || 0 }))}
              min="0.1"
              step="0.1"
            />
            {errors.depth && <p className="text-sm text-red-500 mt-1">{errors.depth}</p>}
          </div>
          <div>
            <Label htmlFor="height" className="text-sm">Height</Label>
            <Input
              id="height"
              type="number"
              value={formData.height}
              onChange={(e) => setFormData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
              min="0.1"
              step="0.1"
            />
            {errors.height && <p className="text-sm text-red-500 mt-1">{errors.height}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Color */}
        <div>
          <Label htmlFor="color">Color</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="w-16 h-10 p-1"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              placeholder="#F5DEB3"
              className="flex-1"
            />
          </div>
        </div>

        {/* Icon */}
        <div>
          <Label htmlFor="icon">Icon</Label>
          <Select value={formData.icon_name} onValueChange={(value) => setFormData(prev => ({ ...prev, icon_name: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map(icon => (
                <SelectItem key={icon} value={icon}>
                  {icon}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe this component..."
          rows={3}
        />
        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
      </div>

      {/* Room Types */}
      <div>
        <Label>Room Types *</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {roomTypes.map(roomType => (
            <div key={roomType} className="flex items-center space-x-2">
              <Checkbox
                id={roomType}
                checked={formData.room_types.includes(roomType)}
                onCheckedChange={(checked) => handleRoomTypeChange(roomType, checked as boolean)}
              />
              <Label htmlFor={roomType} className="text-sm">
                {roomType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>
        {errors.room_types && <p className="text-sm text-red-500 mt-1">{errors.room_types}</p>}
      </div>

      {/* Version */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            placeholder="1.0.0"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ComponentForm;
