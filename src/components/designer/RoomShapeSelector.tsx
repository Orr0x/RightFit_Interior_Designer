/**
 * RoomShapeSelector - Dialog for selecting room shape when creating a new room
 *
 * Allows users to choose between:
 * - Simple rectangle (default)
 * - L-shaped room
 * - U-shaped room
 * - Custom polygon (future)
 *
 * Loads templates from room_geometry_templates table and displays previews.
 */

import React, { useState, useEffect } from 'react';
import { useRoomGeometryTemplates } from '@/hooks/useRoomGeometryTemplates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Square, Shapes, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon mapping for room shapes
const shapeIcons = {
  'rectangle': Square,
  'l-shape': Grid3x3,
  'u-shape': Grid3x3,
  'custom': Shapes,
};

interface RoomShapeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectShape: (templateId: string | null, dimensions?: { width: number; height: number }) => void;
  roomType?: string;
}

export function RoomShapeSelector({
  open,
  onOpenChange,
  onSelectShape,
  roomType
}: RoomShapeSelectorProps) {
  const { templates, loading, error } = useRoomGeometryTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [customDimensions, setCustomDimensions] = useState({ width: 600, height: 400 });

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTemplateId(null);
    }
  }, [open]);

  const handleConfirm = () => {
    onSelectShape(selectedTemplateId, selectedTemplateId ? undefined : customDimensions);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Find the selected template
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose Room Shape</DialogTitle>
          <DialogDescription>
            Select a room shape for your {roomType || 'room'}. You can start with a simple rectangle
            or choose a complex shape like L-shaped or U-shaped.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading room shapes...</span>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load room shapes: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {/* Simple Rectangle Option */}
            <button
              onClick={() => setSelectedTemplateId(null)}
              className={cn(
                "w-full rounded-lg border-2 p-4 text-left transition-all hover:bg-accent",
                selectedTemplateId === null
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                  <Square className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Simple Rectangle</h3>
                    <Badge variant="secondary">Default</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Standard rectangular room. Easy to work with and suitable for most layouts.
                  </p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>Width: {customDimensions.width}cm</span>
                    <span>Height: {customDimensions.height}cm</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Template Options */}
            {templates.map((template) => {
              const Icon = shapeIcons[template.shape_type as keyof typeof shapeIcons] || Shapes;
              const totalArea = template.metadata?.total_floor_area || 0;
              const areaM2 = (totalArea / 10000).toFixed(1); // cm² to m²

              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={cn(
                    "w-full rounded-lg border-2 p-4 text-left transition-all hover:bg-accent",
                    selectedTemplateId === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{template.name}</h3>
                        {template.shape_type === 'l-shape' && (
                          <Badge>L-Shape</Badge>
                        )}
                        {template.shape_type === 'u-shape' && (
                          <Badge>U-Shape</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span>Floor area: {areaM2}m²</span>
                        <span>{template.geometry.walls.length} walls</span>
                        {template.metadata?.suggested_uses && (
                          <span>Ideal for: {template.metadata.suggested_uses.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Create {selectedTemplate ? selectedTemplate.name : 'Rectangle'} Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
