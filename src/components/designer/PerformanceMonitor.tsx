import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, Clock, Zap } from 'lucide-react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  elementCount: number;
  fps: number;
}

interface PerformanceMonitorProps {
  elementCount: number;
  onPerformanceIssue?: (issue: string) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  elementCount,
  onPerformanceIssue
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    elementCount: 0,
    fps: 60
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsSum = 0;

    const updateMetrics = () => {
      const now = performance.now();
      const deltaTime = now - lastTime;
      
      if (deltaTime >= 1000) { // Update every second
        const fps = Math.round((frameCount * 1000) / deltaTime);
        
        setMetrics(prev => ({
          ...prev,
          elementCount,
          fps,
          renderTime: deltaTime / frameCount,
          memoryUsage: (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize / 1024 / 1024 || 0
        }));

        // Performance warnings
        if (fps < 30) {
          onPerformanceIssue?.('Low FPS detected. Consider reducing complexity.');
        }
        if (elementCount > 100) {
          onPerformanceIssue?.('High element count. Performance may degrade.');
        }

        frameCount = 0;
        fpsSum = 0;
        lastTime = now;
      }

      frameCount++;
      animationFrame = requestAnimationFrame(updateMetrics);
    };

    animationFrame = requestAnimationFrame(updateMetrics);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [elementCount, onPerformanceIssue]);

  const getPerformanceColor = (fps: number) => {
    if (fps >= 50) return 'text-green-600';
    if (fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Activity className="h-3 w-3 mr-1" />
              <span className={getPerformanceColor(metrics.fps)}>
                {metrics.fps} FPS
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>FPS:</span>
                <span className={getPerformanceColor(metrics.fps)}>
                  {metrics.fps}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Elements:</span>
                <span>{metrics.elementCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Render Time:</span>
                <span>{metrics.renderTime.toFixed(1)}ms</span>
              </div>
              {metrics.memoryUsage > 0 && (
                <div className="flex justify-between">
                  <span>Memory:</span>
                  <span>{metrics.memoryUsage.toFixed(1)}MB</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {showDetails && (
          <Card className="absolute bottom-full mb-2 right-0 w-64 animate-fade-in">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4" />
                Performance Metrics
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>FPS:</span>
                    <Badge variant="secondary" className={getPerformanceColor(metrics.fps)}>
                      {metrics.fps}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Elements:</span>
                    <Badge variant="outline">{metrics.elementCount}</Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Render:</span>
                    <Badge variant="outline">
                      {metrics.renderTime.toFixed(1)}ms
                    </Badge>
                  </div>
                  {metrics.memoryUsage > 0 && (
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <Badge variant="outline">
                        {metrics.memoryUsage.toFixed(1)}MB
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Live performance monitoring</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};