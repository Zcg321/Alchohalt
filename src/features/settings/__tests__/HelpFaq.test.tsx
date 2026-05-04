/**
 * [R28-1] HelpFaq — render, search, deep-link tests.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import HelpFaq, { __FAQS } from '../HelpFaq';

beforeEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
});

afterEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('[R28-1] HelpFaq', () => {
  it('exposes a Help heading the SettingsJumpNav can anchor to', () => {
    render(<HelpFaq />);
    const heading = screen.getByRole('heading', { name: /help/i });
    expect(heading.id).toBe('help-heading');
  });

  it('renders all 11 FAQ entries by default (10 base + R28-5 crisis-support)', () => {
    render(<HelpFaq />);
    expect(__FAQS).toHaveLength(11);
    for (const faq of __FAQS) {
      expect(screen.getByTestId(`help-faq-item-${faq.id}`)).toBeTruthy();
    }
  });

  it('[R28-5] crisis-support entry is present + non-empty', () => {
    render(<HelpFaq />);
    const item = screen.getByTestId('help-faq-item-crisis-support');
    expect(item).toBeTruthy();
    const answer = screen.getByTestId('help-faq-a-crisis-support');
    // Must reference the always-on header pill specifically + 988.
    expect(answer.textContent).toContain('Need help?');
    expect(answer.textContent).toContain('988');
  });

  it('filters by question text (case-insensitive)', () => {
    render(<HelpFaq />);
    const search = screen.getByTestId('help-faq-search') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'DELETE' } });
    expect(screen.getByTestId('help-faq-item-delete-my-data')).toBeTruthy();
    expect(screen.queryByTestId('help-faq-item-set-a-goal')).toBeNull();
  });

  it('filters by answer body text', () => {
    render(<HelpFaq />);
    const search = screen.getByTestId('help-faq-search') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'Argon' } });
    // No FAQ contains the literal "Argon" — should be empty.
    expect(screen.getByTestId('help-faq-empty')).toBeTruthy();
  });

  it('matches "encrypted" body text in multiple entries', () => {
    render(<HelpFaq />);
    const search = screen.getByTestId('help-faq-search') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'encrypted' } });
    // At least the end-to-end + lost-phone + export entries contain it.
    expect(screen.getByTestId('help-faq-item-end-to-end')).toBeTruthy();
    expect(screen.getByTestId('help-faq-item-lost-phone')).toBeTruthy();
    expect(screen.getByTestId('help-faq-item-export-my-data')).toBeTruthy();
  });

  it('shows an empty-state hint when no matches', () => {
    render(<HelpFaq />);
    const search = screen.getByTestId('help-faq-search') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'xxxxxnotamatch' } });
    expect(screen.getByTestId('help-faq-empty')).toBeTruthy();
    expect(screen.queryByTestId('help-faq-list')).toBeNull();
  });

  it('renders a deep-link for entries that have one', () => {
    render(<HelpFaq />);
    const link = screen.getByTestId('help-faq-link-delete-my-data');
    expect(link.getAttribute('href')).toBe('#privacy-and-data-heading');
  });

  it('omits the link for FAQs without one (set-a-goal)', () => {
    render(<HelpFaq />);
    expect(screen.getByTestId('help-faq-item-set-a-goal')).toBeTruthy();
    expect(screen.queryByTestId('help-faq-link-set-a-goal')).toBeNull();
  });

  it('FAQ ids are unique (no testid collisions)', () => {
    const ids = __FAQS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every FAQ has non-empty question and answer', () => {
    for (const faq of __FAQS) {
      expect(faq.question.trim().length).toBeGreaterThan(0);
      expect(faq.answer.trim().length).toBeGreaterThan(0);
    }
  });

  it('every link href starts with # (in-page anchor) for deep-link safety', () => {
    for (const faq of __FAQS) {
      if (faq.link) {
        expect(faq.link.href.startsWith('#')).toBe(true);
      }
    }
  });

  it('typing then clearing the search restores all entries', () => {
    render(<HelpFaq />);
    const search = screen.getByTestId('help-faq-search') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'delete' } });
    expect(screen.queryByTestId('help-faq-item-set-a-goal')).toBeNull();
    fireEvent.change(search, { target: { value: '' } });
    expect(screen.getByTestId('help-faq-item-set-a-goal')).toBeTruthy();
  });

  it('[R28-1 fix] search filter checks the same strings the user sees, not the English fallback only', () => {
    /* Regression guard for Codex review C2: when locale entries are
     * added under settings.help.faq.<id>.q/.a, search should match
     * the localized text. With no locale entries present the
     * fallback IS the English text, so this confirms the filter
     * still works against the resolved string. */
    render(<HelpFaq />);
    const search = screen.getByTestId('help-faq-search') as HTMLInputElement;
    // The crisis-support entry's English answer mentions "988".
    fireEvent.change(search, { target: { value: '988' } });
    expect(screen.getByTestId('help-faq-item-crisis-support')).toBeTruthy();
    // And the entry whose English question contains "phone".
    fireEvent.change(search, { target: { value: 'phone' } });
    expect(screen.getByTestId('help-faq-item-lost-phone')).toBeTruthy();
  });
});
