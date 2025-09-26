import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="max-w-md w-full animate-fade-in shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold">
            Oops! Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground text-sm">
            We encountered an unexpected error. Don't worry - your work is likely still saved.
          </div>

          {isDevelopment && error && (
            <div className="bg-muted p-3 rounded text-xs font-mono overflow-auto max-h-32">
              <div className="text-destructive font-semibold mb-1">
                {error.name}: {error.message}
              </div>
              <div className="text-muted-foreground">
                {error.stack?.split('\n').slice(0, 5).join('\n')}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={resetError}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            If this issue persists, please refresh the page or contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
