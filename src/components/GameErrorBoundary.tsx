import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import I18nContext from '@/i18n/I18nContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GameErrorBoundary extends Component<Props, State> {
  static contextType = I18nContext;
  declare context: React.ContextType<typeof I18nContext>;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GameErrorBoundary] Game error:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    const { t } = this.context || { t: (key: string) => key };
    
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {t('game_error_boundary.title')}
                </h1>
                <p className="text-muted-foreground">
                  {t('game_error_boundary.message')}
                </p>
              </div>

              <Button 
                onClick={this.handleRestart}
                className="w-full"
                variant="default"
              >
                {t('game_error_boundary.back')}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
