import React from 'react';
import { Button } from '../../components/ui/Button';
import { analytics } from '../analytics/analytics';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorId: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError, errorId }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="card text-center">
          <div className="card-header">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
          </div>
          
          <div className="card-content space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-left">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Error ID: {errorId}</p>
              <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                {error.message}
              </p>
            </div>
            
            <div className="space-y-2">
              <Button onClick={resetError} className="w-full">
                Try Again
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
            
            <div className="text-xs text-gray-500">
              <p>If this problem persists, please contact support with the error ID above.</p>
              <p className="mt-2">Your wellness data remains safely stored on your device.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export class ProductionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = 'err-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Log error to analytics
    analytics.captureError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      context: {
        type: 'react-error-boundary',
        errorId,
        componentStack: error.stack
      }
    });

    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Additional error logging
    analytics.captureError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      context: {
        type: 'react-component-did-catch',
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: 'ProductionErrorBoundary'
      }
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in components
export function useErrorHandler() {
  return (error: Error, context?: Record<string, any>) => {
    const errorId = 'async-err-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    analytics.captureError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      context: {
        type: 'async-error',
        errorId,
        ...context
      }
    });

    // In development, also log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('Async error captured:', error, context);
    }
  };
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  return function WrappedComponent(props: P) {
    return (
      <ProductionErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ProductionErrorBoundary>
    );
  };
}

export default ProductionErrorBoundary;