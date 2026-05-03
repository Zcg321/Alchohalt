import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StreakBreakPrompt, {
  shouldShowStreakBreakPrompt,
} from '../StreakBreakPrompt';
import type { StreakStatus } from '../../../lib/calc';

/* [R13-3] Reflective prompt fires on streak-break (status === 'restart')
 * exactly once per break — the parent must clear acknowledgedAt when
 * the user starts a new streak. */

describe('[R13-3] shouldShowStreakBreakPrompt', () => {
  function status(kind: StreakStatus['kind'], current = 0, total = 12): StreakStatus {
    return { kind, currentStreak: current, totalAFDays: total };
  }

  it('returns true on a fresh restart that has not been acknowledged', () => {
    expect(shouldShowStreakBreakPrompt(status('restart'), undefined)).toBe(true);
  });

  it('returns false once the user has acknowledged the break', () => {
    expect(shouldShowStreakBreakPrompt(status('restart'), Date.now())).toBe(false);
  });

  it('returns false while the user is building a new streak', () => {
    expect(shouldShowStreakBreakPrompt(status('building', 3, 15), undefined)).toBe(false);
  });

  it('returns false for a brand-new user who has never logged AF', () => {
    expect(shouldShowStreakBreakPrompt(status('starting', 0, 0), undefined)).toBe(false);
  });
});

describe('[R13-3] StreakBreakPrompt component', () => {
  it('renders the longest-streak count in the body copy', () => {
    render(
      <StreakBreakPrompt
        longestStreak={42}
        onAddNote={vi.fn()}
        onKeepGoing={vi.fn()}
      />,
    );
    expect(screen.getByText(/longest one \(42 days\)/i)).toBeInTheDocument();
  });

  it('uses singular grammar when longest streak is 1 day', () => {
    render(
      <StreakBreakPrompt
        longestStreak={1}
        onAddNote={vi.fn()}
        onKeepGoing={vi.fn()}
      />,
    );
    expect(screen.getByText(/longest one \(1 day\)/i)).toBeInTheDocument();
  });

  it('uses no exclamation marks anywhere in the rendered copy', () => {
    const { container } = render(
      <StreakBreakPrompt
        longestStreak={5}
        onAddNote={vi.fn()}
        onKeepGoing={vi.fn()}
      />,
    );
    expect(container.textContent ?? '').not.toMatch(/!/);
  });

  it('"Add a note" button calls onAddNote', () => {
    const onAddNote = vi.fn();
    render(
      <StreakBreakPrompt
        longestStreak={5}
        onAddNote={onAddNote}
        onKeepGoing={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('streak-break-add-note'));
    expect(onAddNote).toHaveBeenCalledOnce();
  });

  it('"Keep going" button calls onKeepGoing', () => {
    const onKeepGoing = vi.fn();
    render(
      <StreakBreakPrompt
        longestStreak={5}
        onAddNote={vi.fn()}
        onKeepGoing={onKeepGoing}
      />,
    );
    fireEvent.click(screen.getByTestId('streak-break-keep-going'));
    expect(onKeepGoing).toHaveBeenCalledOnce();
  });

  it('uses no guilt-laden language ("broke", "lost", "failed", "ruined")', () => {
    const { container } = render(
      <StreakBreakPrompt
        longestStreak={5}
        onAddNote={vi.fn()}
        onKeepGoing={vi.fn()}
      />,
    );
    const text = (container.textContent ?? '').toLowerCase();
    for (const word of ['broke', 'broken', 'lost', 'failed', 'ruined', 'shame']) {
      expect(text).not.toContain(word);
    }
  });
});
