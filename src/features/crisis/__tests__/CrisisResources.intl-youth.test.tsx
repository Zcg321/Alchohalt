import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CrisisResources from '../CrisisResources';
import { UK_PACK, AU_PACK, CA_PACK, IE_PACK } from '../regions';

/**
 * [R13-A] Round-13 carry-forward of the parent-of-teen judge.
 * Round 12 added US Teen Line + Crisis Text TEEN. Round 13 extends
 * the same posture (always-on, never gated, visible to everyone) to
 * UK / AU / CA / IE. A youth recognizes themselves in the description;
 * an adult skips past.
 *
 * These tests pin the resources so a future PR that removes them or
 * accidentally drops the "for callers under N" copy breaks the suite.
 */
describe('[R13-A] CrisisResources — international youth lines', () => {
  it('UK pack contains Childline 0800 1111', () => {
    const r = UK_PACK.immediate.find((x) => x.id === 'uk-childline');
    expect(r).toBeDefined();
    expect(r?.phone).toBe('0800 1111');
    expect(r?.description).toMatch(/under 19/i);
  });

  it('AU pack contains Kids Helpline 1800 55 1800', () => {
    const r = AU_PACK.immediate.find((x) => x.id === 'au-kids-helpline');
    expect(r).toBeDefined();
    expect(r?.phone).toBe('1800 55 1800');
    expect(r?.description).toMatch(/5–25|5-25/);
  });

  it('CA pack contains Kids Help Phone 1-800-668-6868', () => {
    const r = CA_PACK.immediate.find((x) => x.id === 'ca-kids-help-phone');
    expect(r).toBeDefined();
    expect(r?.phone).toBe('1-800-668-6868');
    expect(r?.description).toMatch(/under 20/i);
  });

  it('IE pack contains ISPCC Childline 1800 66 66 66', () => {
    const r = IE_PACK.immediate.find((x) => x.id === 'ie-childline');
    expect(r).toBeDefined();
    expect(r?.phone).toBe('1800 66 66 66');
    expect(r?.description).toMatch(/under 18/i);
  });

  it.each(['UK', 'AU', 'CA', 'IE'] as const)(
    'youth line renders in %s region — same posture as 988 (no age gate)',
    (region) => {
      render(<CrisisResources region={region} />);
      const expectations: Record<typeof region, RegExp> = {
        UK: /Childline/i,
        AU: /Kids Helpline/i,
        CA: /Kids Help Phone/i,
        IE: /Childline.*ISPCC/i,
      };
      expect(screen.getByText(expectations[region])).toBeInTheDocument();
    },
  );

  it('adult resources remain primary — youth lines listed AFTER them', () => {
    const ukIds = UK_PACK.immediate.map((r) => r.id);
    expect(ukIds.indexOf('uk-samaritans')).toBeLessThan(ukIds.indexOf('uk-childline'));

    const auIds = AU_PACK.immediate.map((r) => r.id);
    expect(auIds.indexOf('au-lifeline')).toBeLessThan(auIds.indexOf('au-kids-helpline'));

    const caIds = CA_PACK.immediate.map((r) => r.id);
    expect(caIds.indexOf('ca-talk-suicide')).toBeLessThan(caIds.indexOf('ca-kids-help-phone'));

    const ieIds = IE_PACK.immediate.map((r) => r.id);
    expect(ieIds.indexOf('ie-samaritans')).toBeLessThan(ieIds.indexOf('ie-childline'));
  });

  it('non-US user sees their region’s youth line + US Teen Line below as fallback', () => {
    render(<CrisisResources region="UK" />);
    expect(screen.getByText(/Childline/i)).toBeInTheDocument();
    /* US fallback always remains visible to a non-US user, including
     * the US Teen Line — so a misdetected user still has known-good
     * youth resources to fall back to. */
    expect(screen.getByText(/Teen Line/i)).toBeInTheDocument();
  });
});
