import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/Alert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>App error</AlertTitle>
          <AlertDescription>
            Something went wrong. Please reload the app.
          </AlertDescription>
        </Alert>
      );
    }
    return this.props.children;
  }
}
