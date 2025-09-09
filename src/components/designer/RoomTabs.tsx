import React, { useState } from 'react';
import { Plus, X, Home, ChefHat, Bed, Bath, Sofa, UtensilsCrossed, Wrench, Edit2, Palette, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useProject } from '../../contexts/ProjectContext';
import { RoomType } from '../../types/project';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '../ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

// Room type icons mapping
const roomIcons: Record<RoomType, React.ComponentType<{ className?: string }>> = {
  kitchen: ChefHat,
  bedroom: Bed,
  bathroom: Bath,
  'living-room': Sofa,
  'dining-room': UtensilsCrossed,
  utility: Wrench,
  'under-stairs': Home,
};

// Room type display names
const roomDisplayNames: Record<RoomType, string> = {
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  'living-room': 'Living Room',
  'dining-room': 'Dining Room',
  utility: 'Utility Room',
  'under-stairs': 'Under Stairs',
};

interface RoomTabsProps {
  className?: string;
}

export function RoomTabs({ className }: RoomTabsProps) {
  const {
    currentProject,
    currentRoomId,
    switchToRoom,
    createRoomDesign,
    deleteRoomDesign,
    updateCurrentRoomDesign,
    loading,
  } = useProject();

  // State for editing modes
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Predefined color palette
  const colorPalette = [
    { name: 'Default', value: '' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Emerald', value: '#059669' }
  ];

  if (!currentProject) {
    return (
      <div className={`flex items-center justify-center p-4 text-muted-foreground ${className}`}>
        No project loaded
      </div>
    );
  }

  const handleRoomSwitch = (roomId: string) => {
    if (roomId !== currentRoomId) {
      switchToRoom(roomId);
    }
  };

  const handleCreateRoom = async (roomType: RoomType) => {
    if (!currentProject) return;
    
    await createRoomDesign(currentProject.id, roomType);
  };

  const handleDeleteRoom = async (roomId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteRoomDesign(roomId);
  };

  // Room name editing
  const startEditingRoom = (roomId: string, currentName: string) => {
    setEditingRoomId(roomId);
    setRoomName(currentName);
  };

  const saveRoomName = async () => {
    if (roomName.trim() && editingRoomId) {
      const room = currentProject.room_designs.find(r => r.id === editingRoomId);
      if (room && roomName !== room.name) {
        await updateCurrentRoomDesign({ name: roomName.trim() });
      }
    }
    setEditingRoomId(null);
    setRoomName('');
  };

  const cancelRoomEdit = () => {
    setEditingRoomId(null);
    setRoomName('');
  };

  // Color picker functions
  const handleColorPicker = (roomId: string) => {
    setSelectedRoomId(roomId);
    setColorPickerOpen(true);
  };

  const handleColorChange = async (color: string) => {
    if (!selectedRoomId) return;

    try {
      const room = currentProject.room_designs.find(r => r.id === selectedRoomId);
      if (!room) return;

      // Update room design settings with new wall color
      const updatedSettings = {
        ...room.design_settings,
        wall_color: color || undefined
      };

      await updateCurrentRoomDesign({
        design_settings: updatedSettings
      });

      setColorPickerOpen(false);
      setSelectedRoomId(null);
    } catch (error) {
      console.error('Failed to update room color:', error);
    }
  };

  // Get room color
  const getRoomColor = (roomId: string): string => {
    const room = currentProject.room_designs.find(r => r.id === roomId);
    return room?.design_settings?.wall_color || '';
  };

  const handleRoomDoubleClick = (roomId: string, currentName: string) => {
    startEditingRoom(roomId, currentName);
  };

  const availableRoomTypes = Object.keys(roomDisplayNames) as RoomType[];
  const usedRoomTypes = currentProject.room_designs.map(rd => rd.room_type);

  // Helper function to clean room names
  const getCleanRoomName = (room: any) => {
    const baseName = room.name || roomDisplayNames[room.room_type];
    // Remove "Design" suffix if it exists
    return baseName.replace(/\s*Design\s*$/i, '');
  };

  return (
    <>
      <div className={`flex items-center gap-2 p-2 border-b bg-background ${className}`}>
        {currentProject.room_designs.length > 0 ? (
          <Tabs value={currentRoomId || ''} onValueChange={handleRoomSwitch} className="flex-1 min-w-0">
            <TabsList className="h-auto p-1 bg-muted/50 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30">
              <div className="flex gap-1 min-w-max">
                {currentProject.room_designs.map((room) => {
                  const IconComponent = roomIcons[room.room_type];
                  const isEditing = editingRoomId === room.id;
                  
                  return (
                    <ContextMenu key={room.id}>
                      <ContextMenuTrigger>
                        <TabsTrigger
                          value={room.id}
                          className="relative group flex items-center gap-2 py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-shrink-0"
                          onDoubleClick={() => handleRoomDoubleClick(room.id, getCleanRoomName(room))}
                        >
                          <IconComponent className="h-4 w-4 flex-shrink-0" />
                          
                          {/* Color indicator */}
                          {getRoomColor(room.id) && (
                            <div
                              className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: getRoomColor(room.id) }}
                              title={`Room color: ${getRoomColor(room.id)}`}
                            />
                          )}
                          
                          {isEditing ? (
                            <Input
                              value={roomName}
                              onChange={(e) => setRoomName(e.target.value)}
                              onBlur={saveRoomName}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                  saveRoomName();
                                } else if (e.key === 'Escape') {
                                  cancelRoomEdit();
                                }
                              }}
                              className="font-medium bg-transparent border-none shadow-none h-auto p-0 focus-visible:ring-1 w-24"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium whitespace-nowrap">
                              {getCleanRoomName(room)}
                            </span>
                          )}

                          {/* Delete button - only show if more than one room and not editing */}
                          {!isEditing && currentProject.room_designs.length > 1 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <div
                                  role="button"
                                  tabIndex={0}
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-destructive hover:text-destructive-foreground rounded cursor-pointer flex items-center justify-center flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.stopPropagation();
                                    }
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </div>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Room Design</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{getCleanRoomName(room)}"?
                                    This action cannot be undone and all design elements in this room will be lost.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) => handleDeleteRoom(room.id, e)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Room
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TabsTrigger>
                      </ContextMenuTrigger>
                      
                      {/* Right-click Context Menu */}
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => startEditingRoom(room.id, getCleanRoomName(room))}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Rename
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleColorPicker(room.id)}>
                          <Palette className="h-4 w-4 mr-2" />
                          Add Color
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        {currentProject.room_designs.length > 1 && (
                          <ContextMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteRoom(room.id, {} as React.MouseEvent)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Delete
                          </ContextMenuItem>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            </TabsList>
          </Tabs>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <span className="text-sm">No rooms in this project</span>
          </div>
        )}

        {/* Add Room Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {availableRoomTypes.map((roomType) => {
              const IconComponent = roomIcons[roomType];
              const isUsed = usedRoomTypes.includes(roomType);
              
              return (
                <DropdownMenuItem
                  key={roomType}
                  onClick={() => !isUsed && handleCreateRoom(roomType)}
                  className={`flex items-center gap-2 ${isUsed ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading || isUsed}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{roomDisplayNames[roomType]}</span>
                  {isUsed ? (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Exists
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-auto text-xs">
                      Add
                    </Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Project Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-l pl-2">
          <Home className="h-4 w-4" />
          <Badge variant="outline" className="text-xs">
            {currentProject.room_designs.length} room{currentProject.room_designs.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Color Picker Dialog */}
      <Dialog open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Room Color</DialogTitle>
            <DialogDescription>
              Select a color for the room tab and walls
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-3 py-4">
            {colorPalette.map((color) => {
              const isSelected = getRoomColor(selectedRoomId || '') === color.value;
              
              return (
                <button
                  key={color.name}
                  onClick={() => handleColorChange(color.value)}
                  className={`relative w-16 h-16 rounded-lg border-2 hover:scale-105 transition-transform ${
                    color.value
                      ? `border-gray-200`
                      : 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200'
                  }`}
                  style={{
                    backgroundColor: color.value || undefined,
                    borderColor: isSelected ? '#000' : undefined
                  }}
                  title={color.name}
                >
                  {!color.value && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
                      None
                    </span>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white drop-shadow-lg" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RoomTabs;