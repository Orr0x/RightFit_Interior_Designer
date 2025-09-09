import { Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'card';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const spinnerClass = sizeClasses[size];
  const textClass = textSizeClasses[size];

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center gap-2">
        <Loader2 className={`${spinnerClass} animate-spin text-primary`} />
        <span className={`${textClass} text-muted-foreground`}>{message}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="relative">
            <Loader2 className={`${spinnerClass} animate-spin text-primary`} />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-primary animate-pulse-soft" />
          </div>
          <div className="text-center space-y-1">
            <p className={`${textClass} font-medium text-foreground`}>{message}</p>
            <p className="text-xs text-muted-foreground">
              Creating something amazing...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 animate-fade-in">
      <div className="relative">
        <Loader2 className={`${spinnerClass} animate-spin text-primary`} />
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse-soft"></div>
      </div>
      <div className="text-center space-y-1">
        <p className={`${textClass} font-medium text-foreground`}>{message}</p>
        <p className="text-xs text-muted-foreground">
          Please wait while we process your request
        </p>
      </div>
    </div>
  );
};