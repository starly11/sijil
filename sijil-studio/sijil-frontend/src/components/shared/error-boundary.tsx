'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardTitle } from '@/components/ui/card';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary captured localized rendering exception:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <Card className="border-destructive/40 bg-destructive/5 p-6 text-destructive">
          <CardTitle className="text-base font-bold">Execution Context Failure</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.state.error?.message || 'An error occurred while loading this element.'}
          </p>
        </Card>
      );
    }

    return this.props.children;
  }
}
