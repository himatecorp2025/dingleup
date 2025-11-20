import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to external error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate external error reporting (e.g., Sentry, LogRocket)
      console.warn('[ErrorBoundary] Production error reporting not configured. Consider adding Sentry or similar service.');
    }

    // Log to analytics if available
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: true,
        });
      }
    } catch {}
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Váratlan hiba történt
                </h1>
                <p className="text-muted-foreground">
                  Az alkalmazás futása közben hiba lépett fel. Kérjük, próbáld újra.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="w-full bg-muted p-3 rounded text-left text-xs overflow-auto max-h-32">
                  <code className="text-destructive">
                    {this.state.error.toString()}
                  </code>
                </div>
              )}

              <div className="flex gap-3 w-full">
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="default"
                >
                  Újratöltés
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  Kezdőlap
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
