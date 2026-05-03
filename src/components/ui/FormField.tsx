import React from 'react';

/**
 * [R20-B] FormField — label + child input + optional helper + error wiring.
 *
 * The structural pattern that recurs across SyncPanel, AddGoalModal,
 * NotificationsSettings, and similar forms:
 *
 *   <div class="space-y-1">
 *     <label htmlFor="X">Label</label>
 *     <input id="X" ... />
 *     <p id="X-hint">helper</p>
 *   </div>
 *
 * Plus the tedious aria wiring: aria-invalid when there's an error,
 * aria-describedby pointing to the helper id and/or error region id.
 *
 * FormField centralizes the spacing + label class + helper position +
 * aria wiring. The input itself is passed as `children` so callers
 * keep full control over its props (type, autoComplete, value handler).
 *
 * Wiring: pass `id` (used for the input id and label htmlFor). FormField
 * uses React.cloneElement on the child to inject id + aria attributes.
 * The child must be a single React element that accepts these props
 * (input, textarea, select). Wrap multi-element layouts yourself.
 *
 * Single-error contract: `error` is a string shown if non-null and the
 * region gets the aria pointer. `errorId` lets callers point at a shared
 * sibling error region instead (e.g., a form-level <ErrorAlert>).
 */

export interface FormFieldProps {
  /** Used as the input id + the label's htmlFor. Must be unique. */
  id: string;
  /** Visible label text. */
  label: React.ReactNode;
  /** Optional helper text shown under the input. Auto-id'd as `${id}-hint`. */
  description?: React.ReactNode | undefined;
  /**
   * If true, the child input gets aria-invalid="true". Pair with
   * `errorId` to also wire aria-describedby.
   */
  hasError?: boolean | undefined;
  /**
   * Existing region id to point aria-describedby at when hasError.
   * Use this when a form-level error alert lives outside the field.
   */
  errorId?: string | undefined;
  /**
   * Inline per-field error message. Auto-id'd as `${id}-error`. Mutually
   * exclusive with `errorId` — if both are provided, `errorId` wins.
   */
  error?: string | null | undefined;
  /** The input/select/textarea element. Must be a single element. */
  children: React.ReactElement;
  /** Optional override for the wrapper className. */
  className?: string | undefined;
}

export function FormField({
  id, label, description, hasError, errorId, error, children, className,
}: FormFieldProps) {
  const descriptionId = description ? `${id}-hint` : undefined;
  const inlineErrorId = error ? `${id}-error` : undefined;
  const targetErrorId = errorId ?? inlineErrorId;
  const showError = hasError ?? !!error;

  const describedBy = [descriptionId, showError ? targetErrorId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;

  /* cloneElement injects id + aria props. Caller-supplied id /
   * aria-describedby on the child take precedence so a caller can
   * extend describedby (e.g., when an extra screen-reader hint
   * lives elsewhere on the page). */
  const childProps = children.props as Record<string, unknown>;
  const wired = React.cloneElement(children, {
    id: (childProps.id as string | undefined) ?? id,
    'aria-invalid': showError ? true : (childProps['aria-invalid'] as boolean | undefined),
    'aria-describedby': (childProps['aria-describedby'] as string | undefined) ?? describedBy,
  });

  return (
    <div className={className ?? 'space-y-1'}>
      <label htmlFor={id} className="block text-caption font-medium text-ink">
        {label}
      </label>
      {wired}
      {description && (
        <p id={descriptionId} className="text-micro text-ink-subtle">
          {description}
        </p>
      )}
      {error && !errorId && (
        <p id={inlineErrorId} className="text-micro text-crisis-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
