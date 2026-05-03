import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /**
   * Per-section label so a localized crash shows "AI Insights couldn't
   * load" instead of the generic top-level message. Used in the
   * fallback heading.
   */
  label?: string;
  /**
   * Custom fallback. If provided, replaces the default fallback UI
   * entirely. Receives error + reset.
   */
  fallback?: (error: Error | null, reset: () => void) => ReactNode;
  /**
   * Mailto address for the support button. Defaults to the GitHub
   * issue tracker since we have no real support email yet.
   */
  supportHref?: string;
  /**
   * When true, this boundary swallows errors silently in the JSX tree
   * below it without taking down its parent. Used to wrap individual
   * tiles so one buggy tile cannot black-screen the home dashboard.
   */
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const DEFAULT_SUPPORT_HREF =
  'https://github.com/Zcg321/Alchohalt/issues/new?title=Crash%20report&body=Steps%20to%20reproduce%3A%0A1.%20%0A2.%20%0A%0AError%20message%3A%0A';

function IsolatedFallback({
  heading,
  reset,
  supportHref,
}: {
  heading: string;
  reset: () => void;
  supportHref: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-border-soft/70 bg-surface-muted/70 p-5 text-sm text-ink-soft"
    >
      <p className="font-medium text-ink">{heading}</p>
      <p className="mt-1 text-ink-soft">
        One section choked. The rest of the app is fine — your data
        stays put. Try again when you&apos;re ready.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-sage-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
        >
          Try again
        </button>
        <a
          href={supportHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-border bg-surface-elevated px-4 py-2 text-xs font-medium text-ink hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
        >
          Report this
        </a>
      </div>
    </div>
  );
}

function FullPageFallback({
  heading,
  errorMessage,
  reset,
  supportHref,
}: {
  heading: string;
  errorMessage: string | undefined;
  reset: () => void;
  supportHref: string;
}) {
  return (
    <div
      role="alert"
      className="mx-auto my-8 max-w-md rounded-2xl border border-border-soft/70 bg-surface-elevated p-6 text-center shadow-card"
    >
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-crisis-100 text-crisis-700 dark:bg-crisis-900/40 dark:text-crisis-300">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold tracking-tight text-ink">{heading}</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
        Your entries are still on your device — none of this lost any
        of them. Try again, or reload if it sticks. If it keeps
        happening, the report button below sends us the technical
        details so we can fix it.
      </p>
      {errorMessage ? (
        <details className="mt-3 text-start text-xs text-ink-subtle">
          <summary className="cursor-pointer hover:text-ink">Technical details</summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-cream-100 p-2 font-mono text-[11px] dark:bg-charcoal-700/60">
            {errorMessage}
          </pre>
        </details>
      ) : null}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-sage-700 px-5 py-2 text-sm font-semibold text-white hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload();
          }}
          className="inline-flex items-center justify-center rounded-full border border-border bg-surface-elevated px-5 py-2 text-sm font-medium text-ink hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
        >
          Reload app
        </button>
        <a
          href={supportHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium text-ink-soft hover:bg-cream-50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
        >
          Report this
        </a>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: unknown) {
    console.error('ErrorBoundary caught', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (!this.state.hasError) return this.props.children;
    const { fallback, label, supportHref = DEFAULT_SUPPORT_HREF, isolate } = this.props;
    if (fallback) return fallback(this.state.error, this.reset);
    const heading = label ? `${label} couldn't load` : 'This screen tripped over something';
    if (isolate) {
      return <IsolatedFallback heading={heading} reset={this.reset} supportHref={supportHref} />;
    }
    return (
      <FullPageFallback
        heading={heading}
        errorMessage={this.state.error?.message}
        reset={this.reset}
        supportHref={supportHref}
      />
    );
  }
}
