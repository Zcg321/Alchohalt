import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CrisisResources from '../CrisisResources';
import { US_PACK } from '../regions';

/**
 * [R12-6] Round-12 12th-judge (parent of teen) findings landed:
 * teen-specific resources are visible to everyone, all the time —
 * no classifier, no age gate. A teen recognizes themselves in the
 * description; an adult skips past. Same posture as 988.
 *
 * These tests pin the resources so a future PR that removes them
 * (or accidentally drops the "for callers under 18" copy) breaks
 * the suite.
 */
describe('[R12-6] CrisisResources — teen-specific resources', () => {
  it('US pack contains the Teen Line resource', () => {
    const teenLine = US_PACK.immediate.find((r) => r.id === 'us-teen-line');
    expect(teenLine).toBeDefined();
    expect(teenLine?.phone).toBe('1-800-852-8336');
    expect(teenLine?.description).toMatch(/under 18/i);
    expect(teenLine?.description).toMatch(/teens|teen-trained|teen-staffed|trained teens/i);
  });

  it('US pack contains the Crisis Text Line — TEEN keyword variant', () => {
    const teenText = US_PACK.immediate.find((r) => r.id === 'us-crisis-text-teen');
    expect(teenText).toBeDefined();
    expect(teenText?.smsHint).toEqual({ keyword: 'TEEN', number: '741741' });
    expect(teenText?.description).toMatch(/under 18/i);
  });

  it('Teen resources render in the immediate-help section', () => {
    render(<CrisisResources region="US" />);
    expect(screen.getByText(/Teen Line/i)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /Call 1-800-852-8336/i }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /Text TEEN to 741741/i })).toBeTruthy();
  });

  it('Existing adult resources (988, SAMHSA, HOME-keyword text) remain primary', () => {
    render(<CrisisResources region="US" />);
    expect(screen.getByText(/988 Suicide & Crisis Lifeline/i)).toBeTruthy();
    expect(screen.getByText(/SAMHSA National Helpline/i)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /Text HOME to 741741/i }),
    ).toBeTruthy();
  });

  it('988, SAMHSA, and adult Crisis Text Line are listed BEFORE the teen resources', () => {
    // Order matters in the immediate array — primary adult resources
    // first so they remain primary on the rendered page.
    const ids = US_PACK.immediate.map((r) => r.id);
    const idx988 = ids.indexOf('us-988');
    const idxSamhsa = ids.indexOf('us-samhsa');
    const idxAdultText = ids.indexOf('us-crisis-text');
    const idxTeenLine = ids.indexOf('us-teen-line');
    const idxTeenText = ids.indexOf('us-crisis-text-teen');
    expect(idx988).toBeLessThan(idxTeenLine);
    expect(idxSamhsa).toBeLessThan(idxTeenLine);
    expect(idxAdultText).toBeLessThan(idxTeenLine);
    expect(idx988).toBeLessThan(idxTeenText);
  });

  it('Teen resources are not separately gated — same render path as 988', () => {
    // The render path doesn't filter by age, ID prefix, or any other
    // classifier. We confirm by checking the full immediate list
    // renders.
    render(<CrisisResources region="US" />);
    for (const r of US_PACK.immediate) {
      expect(screen.getByText(r.name)).toBeTruthy();
    }
  });
});
