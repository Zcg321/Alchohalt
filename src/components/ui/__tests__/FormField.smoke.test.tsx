/**
 * [R20-B] FormField primitive — smoke + a11y wiring.
 *
 * Pins the contract: id flows to the input + label htmlFor,
 * description renders with `${id}-hint` and aria-describedby points
 * at it, errorId overrides the inline error region, hasError sets
 * aria-invalid, and caller-supplied aria-describedby on the child
 * is preserved (not clobbered).
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { FormField } from '../FormField';

describe('[R20-B] FormField', () => {
  it('wires htmlFor on the label and id on the child input', () => {
    const { container } = render(
      <FormField id="test-email" label="Email">
        <input type="email" />
      </FormField>,
    );
    const label = container.querySelector('label');
    const input = container.querySelector('input');
    expect(label?.getAttribute('for')).toBe('test-email');
    expect(input?.getAttribute('id')).toBe('test-email');
  });

  it('renders description with auto-id and links via aria-describedby', () => {
    const { container } = render(
      <FormField id="test-pass" label="Pass" description="12+ chars.">
        <input type="password" />
      </FormField>,
    );
    const hint = container.querySelector('#test-pass-hint');
    expect(hint?.textContent).toBe('12+ chars.');
    const input = container.querySelector('input');
    expect(input?.getAttribute('aria-describedby')).toContain('test-pass-hint');
  });

  it('sets aria-invalid + aria-describedby to errorId when hasError + errorId given', () => {
    const { container } = render(
      <FormField id="test-x" label="X" hasError errorId="form-level-error">
        <input type="text" />
      </FormField>,
    );
    const input = container.querySelector('input');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expect(input?.getAttribute('aria-describedby')).toBe('form-level-error');
  });

  it('renders inline error when no errorId is provided', () => {
    const { container } = render(
      <FormField id="test-y" label="Y" error="Required.">
        <input type="text" />
      </FormField>,
    );
    const errorEl = container.querySelector('#test-y-error');
    expect(errorEl?.textContent).toBe('Required.');
    expect(errorEl?.getAttribute('role')).toBe('alert');
    const input = container.querySelector('input');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expect(input?.getAttribute('aria-describedby')).toBe('test-y-error');
  });

  it('does not clobber a caller-supplied aria-describedby on the child', () => {
    const { container } = render(
      <FormField id="test-z" label="Z" description="hint">
        <input type="text" aria-describedby="custom-region another-region" />
      </FormField>,
    );
    const input = container.querySelector('input');
    /* Caller's aria-describedby wins to allow extending the relation. */
    expect(input?.getAttribute('aria-describedby')).toBe('custom-region another-region');
  });

  it('combines description + errorId into aria-describedby (space-separated)', () => {
    const { container } = render(
      <FormField id="test-w" label="W" description="hint" hasError errorId="form-err">
        <input type="text" />
      </FormField>,
    );
    const input = container.querySelector('input');
    const desc = input?.getAttribute('aria-describedby');
    expect(desc).toContain('test-w-hint');
    expect(desc).toContain('form-err');
  });
});
