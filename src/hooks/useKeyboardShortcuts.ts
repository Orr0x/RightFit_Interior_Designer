import { useEffect } from 'react';

interface KeyboardShortcuts {
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onFitToScreen?: () => void;
  onToggleGrid?: () => void;
  onToggleRuler?: () => void;
  onSelectTool?: () => void;
  onPanTool?: () => void;
  onEscape?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      const { ctrlKey, metaKey, shiftKey, altKey, key } = event;
      const isModifierPressed = ctrlKey || metaKey;

      // Undo - Ctrl/Cmd + Z
      if (isModifierPressed && !shiftKey && key === 'z' && shortcuts.onUndo) {
        event.preventDefault();
        shortcuts.onUndo();
        return;
      }

      // Redo - Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((isModifierPressed && shiftKey && key === 'z') || 
          (isModifierPressed && key === 'y')) {
        if (shortcuts.onRedo) {
          event.preventDefault();
          shortcuts.onRedo();
        }
        return;
      }

      // Copy - Ctrl/Cmd + C
      if (isModifierPressed && key === 'c' && shortcuts.onCopy) {
        event.preventDefault();
        shortcuts.onCopy();
        return;
      }

      // Save - Ctrl/Cmd + S
      if (isModifierPressed && key === 's' && shortcuts.onSave) {
        event.preventDefault();
        shortcuts.onSave();
        return;
      }

      // Delete - Delete or Backspace
      if ((key === 'Delete' || key === 'Backspace') && shortcuts.onDelete) {
        event.preventDefault();
        shortcuts.onDelete();
        return;
      }

      // Fit to screen - F
      if (key === 'f' && !isModifierPressed && shortcuts.onFitToScreen) {
        event.preventDefault();
        shortcuts.onFitToScreen();
        return;
      }

      // Toggle grid - G
      if (key === 'g' && !isModifierPressed && shortcuts.onToggleGrid) {
        event.preventDefault();
        shortcuts.onToggleGrid();
        return;
      }

      // Toggle ruler - R
      if (key === 'r' && !isModifierPressed && shortcuts.onToggleRuler) {
        event.preventDefault();
        shortcuts.onToggleRuler();
        return;
      }

      // Select tool - V or S
      if ((key === 'v' || key === 's') && !isModifierPressed && shortcuts.onSelectTool) {
        event.preventDefault();
        shortcuts.onSelectTool();
        return;
      }

      // Pan tool - H or Space
      if ((key === 'h' || key === ' ') && !isModifierPressed && shortcuts.onPanTool) {
        event.preventDefault();
        shortcuts.onPanTool();
        return;
      }

      // Escape - Clear selection or cancel current action
      if (key === 'Escape' && shortcuts.onEscape) {
        event.preventDefault();
        shortcuts.onEscape();
        return;
      }

      // Arrow keys for nudging
      if (key === 'ArrowLeft' && shortcuts.onArrowLeft) {
        event.preventDefault();
        shortcuts.onArrowLeft();
        return;
      }

      if (key === 'ArrowRight' && shortcuts.onArrowRight) {
        event.preventDefault();
        shortcuts.onArrowRight();
        return;
      }

      if (key === 'ArrowUp' && shortcuts.onArrowUp) {
        event.preventDefault();
        shortcuts.onArrowUp();
        return;
      }

      if (key === 'ArrowDown' && shortcuts.onArrowDown) {
        event.preventDefault();
        shortcuts.onArrowDown();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Hook for displaying keyboard shortcuts help
export const useKeyboardShortcutsHelp = () => {
  const shortcuts = [
    { key: 'Ctrl/Cmd + Z', action: 'Undo' },
    { key: 'Ctrl/Cmd + Y', action: 'Redo' },
    { key: 'Ctrl/Cmd + C', action: 'Copy selected element' },
    { key: 'Ctrl/Cmd + S', action: 'Save design' },
    { key: 'Delete/Backspace', action: 'Delete selected element' },
    { key: 'F', action: 'Fit to screen' },
    { key: 'G', action: 'Toggle grid' },
    { key: 'R', action: 'Toggle ruler' },
    { key: 'V or S', action: 'Select tool' },
    { key: 'H or Space', action: 'Pan tool' },
    { key: 'Escape', action: 'Clear selection' },
    { key: 'Arrow Keys', action: 'Nudge selected element (1px)' }
  ];

  return shortcuts;
};