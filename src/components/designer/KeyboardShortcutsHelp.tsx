import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Command, Zap } from 'lucide-react';
import { useKeyboardShortcutsHelp } from '@/hooks/useKeyboardShortcuts';

export const KeyboardShortcutsHelp: React.FC = () => {
  const [open, setOpen] = useState(false);
  const shortcuts = useKeyboardShortcutsHelp();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 hover-scale focus-ring"
          title="Keyboard shortcuts (Press ? for help)"
        >
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Command className="h-4 w-4" />
            <span>Speed up your workflow with these shortcuts</span>
          </div>
          
          <Separator />
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between py-2 hover:bg-muted/50 rounded-md px-2 smooth-transition">
                <span className="text-sm text-foreground font-medium">
                  {shortcut.action}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {shortcut.key}
                </Badge>
              </div>
            ))}
          </div>
          
          <Separator />
          
          <div className="text-xs text-muted-foreground text-center">
            💡 Press <Badge variant="outline" className="font-mono">?</Badge> anytime to see this help
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};