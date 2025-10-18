import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Square,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Copy,
  X,
  Edit3
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { ElevationViewConfig } from '@/types/project';
import { getDefaultElevationViews, canDuplicateView } from '@/utils/elevationViewHelpers';

export type View2DMode = 'plan' | string; // 'plan' or elevation view ID

interface ViewSelectorProps {
  activeView: View2DMode;
  onViewChange: (view: View2DMode) => void;
  // Custom elevation views (optional - defaults to 4 cardinal directions)
  elevationViews?: ElevationViewConfig[];
  onDuplicateView?: (viewId: string) => void;
  onDeleteView?: (viewId: string) => void;
  onRenameView?: (viewId: string, newLabel: string) => void;
}

// Icon mapping for directions
const DIRECTION_ICONS = {
  front: ArrowUp,
  back: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight
} as const;

interface ContextMenuState {
  viewId: string;
  x: number;
  y: number;
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({
  activeView,
  onViewChange,
  elevationViews,
  onDuplicateView,
  onDeleteView,
  onRenameView
}) => {
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Use provided views or default to 4 cardinal directions
  const views = elevationViews || getDefaultElevationViews();

  // Check if we have custom views (more than 4 default views)
  const hasCustomViews = views.length > 4;

  // Get active view config to determine which direction is active
  const activeViewConfig = views.find(v => v.id === activeView);
  const activeDirection = activeViewConfig?.direction;

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, viewId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Get the position relative to the viewport
    setContextMenu({
      viewId,
      x: e.clientX,
      y: e.clientY
    });
  };

  // Handle rename
  const handleStartRename = (viewId: string, currentLabel: string) => {
    setContextMenu(null); // Close context menu
    setEditingViewId(viewId);
    setEditLabel(currentLabel);
  };

  const handleConfirmRename = (viewId: string) => {
    if (onRenameView && editLabel.trim()) {
      onRenameView(viewId, editLabel.trim());
    }
    setEditingViewId(null);
    setEditLabel('');
  };

  const handleCancelRename = () => {
    setEditingViewId(null);
    setEditLabel('');
  };

  // Handle duplicate
  const handleDuplicate = (viewId: string) => {
    setContextMenu(null);
    if (onDuplicateView) {
      onDuplicateView(viewId);
    }
  };

  // Handle delete
  const handleDelete = (viewId: string) => {
    setContextMenu(null);
    if (onDeleteView) {
      onDeleteView(viewId);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-start gap-1 p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 animate-fade-in">
        {/* Plan View - Always first */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewChange('plan')}
              className={`w-10 h-10 p-0 transition-all duration-200 hover-scale ${
                activeView === 'plan'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg scale-105'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Square className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white text-xs max-w-xs">
            <p className="font-medium">Plan</p>
            <p className="text-gray-300">Top-down view - Shows layout and positioning</p>
          </TooltipContent>
        </Tooltip>

        {/* Separator */}
        <div className="w-full h-px bg-gray-300 my-1" />

        {/* Elevation Views - Only show cardinal direction views (front, back, left, right) */}
        {views
          .filter(view => ['front', 'back', 'left', 'right'].includes(view.direction))
          .map((view) => {
            const Icon = DIRECTION_ICONS[view.direction as keyof typeof DIRECTION_ICONS];
            const isActive = activeView === view.id || (activeView === view.direction && view.is_default);

            return (
              <Tooltip key={view.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewChange(view.id)}
                    onContextMenu={(e) => handleContextMenu(e, view.id)}
                    className={`w-10 h-10 p-0 transition-all duration-200 hover-scale ${
                      isActive
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg scale-105'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gray-900 text-white text-xs max-w-xs">
                  <p className="font-medium">{view.label}</p>
                  <p className="text-gray-300">{view.direction.charAt(0).toUpperCase() + view.direction.slice(1)} wall elevation</p>
                  {view.hidden_elements.length > 0 && (
                    <p className="text-gray-400 text-xs mt-1">
                      {view.hidden_elements.length} element(s) hidden
                    </p>
                  )}
                  <p className="text-gray-400 text-xs mt-1 italic">Right-click for options</p>
                </TooltipContent>
              </Tooltip>
            );
          })}

        {/* Rename dialog - inline */}
        {editingViewId && (
          <div className="w-full p-2 bg-gray-100 rounded border border-gray-300 mt-1">
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmRename(editingViewId);
                if (e.key === 'Escape') handleCancelRename();
              }}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="View name"
              autoFocus
            />
            <div className="flex gap-1 mt-1">
              <Button
                size="sm"
                onClick={() => handleConfirmRename(editingViewId)}
                className="flex-1 h-6 text-xs"
              >
                OK
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelRename}
                className="flex-1 h-6 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (() => {
        const view = views.find(v => v.id === contextMenu.viewId);
        if (!view) return null;

        const canDuplicate = canDuplicateView(view.direction, views);
        const hasActions = (canDuplicate && onDuplicateView) || (!view.is_default && (onRenameView || onDeleteView));

        if (!hasActions) return null;

        return (
          <div
            ref={contextMenuRef}
            className="fixed z-[9999] bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[160px] animate-in fade-in-0 zoom-in-95"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
          >
            {/* Duplicate option */}
            {canDuplicate && onDuplicateView && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
                onClick={() => handleDuplicate(contextMenu.viewId)}
              >
                <Copy className="h-4 w-4 text-gray-600" />
                <span>Duplicate View</span>
              </button>
            )}

            {/* Rename option - only for custom views */}
            {!view.is_default && onRenameView && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
                onClick={() => handleStartRename(contextMenu.viewId, view.label)}
              >
                <Edit3 className="h-4 w-4 text-gray-600" />
                <span>Rename View</span>
              </button>
            )}

            {/* Separator if we have both duplicate and custom view actions */}
            {canDuplicate && onDuplicateView && !view.is_default && (onRenameView || onDeleteView) && (
              <div className="h-px bg-gray-200 my-1" />
            )}

            {/* Delete option - only for custom views */}
            {!view.is_default && onDeleteView && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors"
                onClick={() => handleDelete(contextMenu.viewId)}
              >
                <X className="h-4 w-4" />
                <span>Delete View</span>
              </button>
            )}
          </div>
        );
      })()}
    </TooltipProvider>
  );
};
