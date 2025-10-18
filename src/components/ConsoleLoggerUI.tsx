/**
 * ConsoleLoggerUI - Floating UI for console log capture
 * Shows log count and provides download button
 */

import React, { useState, useEffect } from 'react';
import { consoleLogger } from '@/utils/ConsoleLogger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, X, FileText, Trash2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const ConsoleLoggerUI: React.FC = () => {
  const [logCount, setLogCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<Record<string, number>>({});

  // Update log count every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (consoleLogger.isActive()) {
        setLogCount(consoleLogger.getLogCount());
        setSummary(consoleLogger.getSummary());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    consoleLogger.downloadLogs(`browser-console-logs-${timestamp}.txt`);
    setIsOpen(false);
  };

  const handleClear = () => {
    if (confirm('Clear all captured logs? This cannot be undone.')) {
      consoleLogger.clearLogs();
      setLogCount(0);
      setSummary({});
    }
  };

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  if (!consoleLogger.isActive()) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="shadow-lg hover:shadow-xl transition-all gap-2"
          >
            <FileText className="w-4 h-4" />
            <span className="font-mono">{logCount}</span>
            <Badge variant="secondary" className="ml-1">
              Logging
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">Console Logger</h3>
                <p className="text-sm text-muted-foreground">
                  {logCount} logs captured
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Log Summary:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>📝 Logs:</span>
                  <Badge variant="outline">{summary.log || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>ℹ️ Info:</span>
                  <Badge variant="outline">{summary.info || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span>⚠️ Warnings:</span>
                  <Badge variant="outline">{summary.warn || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span>❌ Errors:</span>
                  <Badge variant="outline">{summary.error || 0}</Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleDownload}
                className="w-full"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Logs
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Logs
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p className="font-medium">Usage:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>All console output is being captured</li>
                <li>Download logs when finished testing</li>
                <li>Attach file to test results</li>
              </ul>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ConsoleLoggerUI;
