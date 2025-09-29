// Production-ready analytics and error tracking
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
  userId?: string;
}

interface ErrorReport {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: number;
  userId?: string;
  context?: Record<string, unknown>;
}

class AnalyticsService {
  private userId: string | null = null;
  private isProduction = process.env.NODE_ENV === 'production';
  private queue: AnalyticsEvent[] = [];
  private errorQueue: ErrorReport[] = [];

  constructor() {
    // Initialize user ID from localStorage
    this.userId = localStorage.getItem('analytics-user-id') || this.generateUserId();
    
    // Set up error handling
    this.setupErrorHandling();
    
    // Flush queues periodically
    this.setupPeriodicFlush();
  }

  private generateUserId(): string {
    // Generate a cryptographically secure random user ID
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const id = 'user-' + hex;
    localStorage.setItem('analytics-user-id', id);
    return id;
  }

  private setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        userId: this.userId || undefined,
        context: {
          type: 'javascript-error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        userId: this.userId || undefined,
        context: {
          type: 'unhandled-rejection',
          reason: event.reason
        }
      });
    });
  }

  private setupPeriodicFlush() {
    // Flush analytics and errors every 30 seconds
    setInterval(() => {
      this.flush();
    }, 30000);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  // Track user events
  track(eventName: string, properties?: Record<string, unknown>) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      },
      timestamp: Date.now(),
      userId: this.userId || undefined
    };

    this.queue.push(event);

    // Console log in development
    if (!this.isProduction) {
      console.log('📊 Analytics:', eventName, properties);
    }

    // Flush if queue is getting large
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  // Track specific app events
  trackDrinkLogged(drinkType: string, volume: number) {
    this.track('drink_logged', {
      drink_type: drinkType,
      volume_ml: volume,
      category: 'drink_tracking'
    });
  }

  trackGoalSet(goalType: string, target: number) {
    this.track('goal_set', {
      goal_type: goalType,
      target_value: target,
      category: 'goals'
    });
  }

  trackMoodCheckin(mood: string, intensity: number) {
    this.track('mood_checkin', {
      mood_type: mood,
      intensity_level: intensity,
      category: 'mood_tracking'
    });
  }

  trackSubscriptionEvent(action: string, plan?: string) {
    this.track('subscription_event', {
      action: action, // 'started_trial', 'subscribed', 'cancelled', etc.
      plan_id: plan,
      category: 'subscription'
    });
  }

  trackFeatureUsage(feature: string, context?: Record<string, unknown>) {
    this.track('feature_used', {
      feature_name: feature,
      ...context,
      category: 'feature_usage'
    });
  }

  // Capture errors manually
  captureError(error: ErrorReport) {
    this.errorQueue.push(error);

    // Console log in development
    if (!this.isProduction) {
      console.error('🚨 Error captured:', error);
    }

    // Flush immediately for errors
    if (this.isProduction) {
      this.flush();
    }
  }

  // Performance tracking
  trackPerformance(name: string, duration: number) {
    this.track('performance_metric', {
      metric_name: name,
      duration_ms: duration,
      category: 'performance'
    });
  }

  // User journey tracking
  trackPageView(page: string) {
    this.track('page_view', {
      page_name: page,
      category: 'navigation'
    });
  }

  // Flush queued events
  private async flush() {
    if (this.queue.length === 0 && this.errorQueue.length === 0) {
      return;
    }

    try {
      // In a real implementation, you would send to your analytics service
      // For now, we'll store locally for demo purposes
      if (this.queue.length > 0) {
        const existingEvents = JSON.parse(localStorage.getItem('analytics-events') || '[]');
        localStorage.setItem('analytics-events', JSON.stringify([...existingEvents, ...this.queue]));
        this.queue = [];
      }

      if (this.errorQueue.length > 0) {
        const existingErrors = JSON.parse(localStorage.getItem('analytics-errors') || '[]');
        localStorage.setItem('analytics-errors', JSON.stringify([...existingErrors, ...this.errorQueue]));
        this.errorQueue = [];
      }

    } catch (error) {
      console.error('Failed to flush analytics:', error);
    }
  }

  // Get analytics summary for debugging
  getAnalyticsSummary() {
    const events = JSON.parse(localStorage.getItem('analytics-events') || '[]');
    const errors = JSON.parse(localStorage.getItem('analytics-errors') || '[]');
    
    return {
      totalEvents: events.length,
      totalErrors: errors.length,
      recentEvents: events.slice(-10),
      recentErrors: errors.slice(-5)
    };
  }

  // Clear analytics data (for privacy)
  clearAnalyticsData() {
    localStorage.removeItem('analytics-events');
    localStorage.removeItem('analytics-errors');
    this.queue = [];
    this.errorQueue = [];
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// React hook for analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackDrinkLogged: analytics.trackDrinkLogged.bind(analytics),
    trackGoalSet: analytics.trackGoalSet.bind(analytics),
    trackMoodCheckin: analytics.trackMoodCheckin.bind(analytics),
    trackSubscriptionEvent: analytics.trackSubscriptionEvent.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    captureError: analytics.captureError.bind(analytics)
  };
}

// Performance measurement utility
export function measurePerformance<T>(
  name: string, 
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        analytics.trackPerformance(name, duration);
      });
    } else {
      const duration = performance.now() - start;
      analytics.trackPerformance(name, duration);
      return result;
    }
  } catch (error) {
    const duration = performance.now() - start;
    analytics.trackPerformance(name, duration);
    analytics.captureError({
      message: `Performance measurement failed: ${name}`,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
      context: { performanceOperation: name }
    });
    throw error;
  }
}

export default analytics;