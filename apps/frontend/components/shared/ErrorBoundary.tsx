'use client';

import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Centralized error tracking function.
 * Replace with Sentry.captureException or your own implementation.
 */
function trackError(error: Error, errorInfo: React.ErrorInfo): void {
  // Example: Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  // TODO: Integrate with Sentry or other error tracking service
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    try {
      // Log to console in development for debugging
      if (isDevelopment) {
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
      }

      // Call the passed-in onError prop if provided
      if (this.props.onError) {
        this.props.onError(error, errorInfo);
      }

      // Send to centralized error tracking (e.g., Sentry)
      trackError(error, errorInfo);
    } catch (trackingError) {
      // Ensure the handler never throws
      if (isDevelopment) {
        console.error('[ErrorBoundary] Error in error handler:', trackingError);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {this.state.error && (
                <div className="mb-4 rounded-md bg-muted p-3">
                  <p className="text-sm font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full"
              >
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

