/**
 * [R16-2] User-installable crisis-line tests.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import CrisisResources from '../CrisisResources';
import UserCrisisLineEditor from '../UserCrisisLineEditor';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  // Reset crisis-line setting between tests.
  useDB.setState({
    db: {
      ...useDB.getState().db,
      settings: {
        ...useDB.getState().db.settings,
        userCrisisLine: undefined,
      },
    },
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('[R16-2] UserCrisisLineEditor', () => {
  it('renders the calm CTA copy', () => {
    render(<UserCrisisLineEditor />);
    expect(
      screen.getByText(/If you have a local crisis line you trust, add it here/i),
    ).toBeInTheDocument();
  });

  it('save button is disabled until label and phone are filled', () => {
    render(<UserCrisisLineEditor />);
    const saveBtn = screen.getByTestId('user-crisis-line-save') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);

    fireEvent.change(screen.getByTestId('user-crisis-line-label'), {
      target: { value: 'Lifeline' },
    });
    expect(saveBtn.disabled).toBe(true);

    fireEvent.change(screen.getByTestId('user-crisis-line-phone'), {
      target: { value: '13 11 14' },
    });
    expect(saveBtn.disabled).toBe(false);
  });

  it('persists the entered line to settings.userCrisisLine on save', () => {
    render(<UserCrisisLineEditor />);
    fireEvent.change(screen.getByTestId('user-crisis-line-label'), {
      target: { value: 'Lifeline' },
    });
    fireEvent.change(screen.getByTestId('user-crisis-line-phone'), {
      target: { value: '13 11 14' },
    });
    fireEvent.change(screen.getByTestId('user-crisis-line-description'), {
      target: { value: '24/7 support' },
    });
    fireEvent.click(screen.getByTestId('user-crisis-line-save'));

    const stored = useDB.getState().db.settings.userCrisisLine;
    expect(stored).toEqual({
      label: 'Lifeline',
      phone: '13 11 14',
      description: '24/7 support',
    });
  });

  it('omits description when empty (no empty-string field stored)', () => {
    render(<UserCrisisLineEditor />);
    fireEvent.change(screen.getByTestId('user-crisis-line-label'), {
      target: { value: 'Lifeline' },
    });
    fireEvent.change(screen.getByTestId('user-crisis-line-phone'), {
      target: { value: '13 11 14' },
    });
    fireEvent.click(screen.getByTestId('user-crisis-line-save'));

    const stored = useDB.getState().db.settings.userCrisisLine;
    expect(stored).toEqual({ label: 'Lifeline', phone: '13 11 14' });
    expect(stored).not.toHaveProperty('description');
  });

  it('clears via Remove button (sets userCrisisLine to undefined)', () => {
    useDB.setState({
      db: {
        ...useDB.getState().db,
        settings: {
          ...useDB.getState().db.settings,
          userCrisisLine: { label: 'A', phone: '1' },
        },
      },
    });
    render(<UserCrisisLineEditor />);
    fireEvent.click(screen.getByTestId('user-crisis-line-clear'));
    expect(useDB.getState().db.settings.userCrisisLine).toBeUndefined();
  });

  it('trims whitespace before saving', () => {
    render(<UserCrisisLineEditor />);
    fireEvent.change(screen.getByTestId('user-crisis-line-label'), {
      target: { value: '  Lifeline  ' },
    });
    fireEvent.change(screen.getByTestId('user-crisis-line-phone'), {
      target: { value: '  13 11 14  ' },
    });
    fireEvent.click(screen.getByTestId('user-crisis-line-save'));

    expect(useDB.getState().db.settings.userCrisisLine).toEqual({
      label: 'Lifeline',
      phone: '13 11 14',
    });
  });
});

describe('[R16-2] CrisisResources renders the user line FIRST', () => {
  it('does not render the pinned section when no user line is saved', () => {
    render(<CrisisResources />);
    expect(screen.queryByTestId('user-crisis-line-pinned')).not.toBeInTheDocument();
  });

  it('renders a "Your line" section above the regional pack when a user line is saved', () => {
    useDB.setState({
      db: {
        ...useDB.getState().db,
        settings: {
          ...useDB.getState().db.settings,
          userCrisisLine: {
            label: 'Local Listening Line',
            phone: '01-555-0100',
            description: 'A local trusted helpline',
          },
        },
      },
    });
    render(<CrisisResources />);
    const pinned = screen.getByTestId('user-crisis-line-pinned');
    expect(pinned).toBeInTheDocument();
    expect(within(pinned).getByText(/Your line/i)).toBeInTheDocument();
    expect(within(pinned).getByText('Local Listening Line')).toBeInTheDocument();
    expect(within(pinned).getByText('A local trusted helpline')).toBeInTheDocument();
    /* The phone number renders inside the Call link (e.g. "Call 01-555-0100"). */
    expect(
      within(pinned).getByRole('link', { name: /Call 01-555-0100/i }),
    ).toBeInTheDocument();

    /* Pin order: pinned section's heading must precede the
     * regional-pack 'Immediate help' heading in document order. */
    const pinnedHeading = within(pinned).getByText(/Your line/i);
    const immediateHeading = screen.getByText(/Immediate help —/i);
    const order = pinnedHeading.compareDocumentPosition(immediateHeading);
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('uses fallback description when the saved entry has no description', () => {
    useDB.setState({
      db: {
        ...useDB.getState().db,
        settings: {
          ...useDB.getState().db.settings,
          userCrisisLine: { label: 'Local Line', phone: '01-555-0100' },
        },
      },
    });
    render(<CrisisResources />);
    const pinned = screen.getByTestId('user-crisis-line-pinned');
    expect(within(pinned).getByText(/Saved by you. Stays on your device/i)).toBeInTheDocument();
  });

  it('renders the editor below all crisis lists so a first-time user can add one', () => {
    render(<CrisisResources />);
    expect(screen.getByTestId('user-crisis-line-editor')).toBeInTheDocument();
  });
});
