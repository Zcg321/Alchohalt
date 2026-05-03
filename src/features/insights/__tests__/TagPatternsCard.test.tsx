import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import TagPatternsCard from '../TagPatternsCard';
import type { Drink } from '../../../types/common';

function drink(opts: Partial<Drink> & { ts: number; tags?: string[] }): Drink {
  return {
    volumeMl: 350,
    abvPct: 5,
    intention: 'social',
    craving: 0,
    halt: [],
    alt: '',
    ...opts,
  };
}

describe('[R14-3] TagPatternsCard', () => {
  it('renders nothing when no tags meet threshold', () => {
    const { container } = render(<TagPatternsCard drinks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when only sub-threshold tags exist', () => {
    const drinks = [drink({ ts: 0, tags: ['rare'] })];
    const { container } = render(<TagPatternsCard drinks={drinks} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders patterns for tags that meet threshold', () => {
    const drinks: Drink[] = [
      drink({ ts: 0, tags: ['stressed'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 1, tags: ['stressed'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 2, tags: ['stressed'], volumeMl: 750, abvPct: 13 }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    expect(screen.getByTestId('tag-patterns-card')).toBeInTheDocument();
    expect(screen.getByText('#stressed')).toBeInTheDocument();
  });

  it('shows count, avgStd, and overall comparison per tag', () => {
    const drinks: Drink[] = [
      drink({ ts: 0, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: 1, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: 2, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    const item = screen.getByTestId('tag-pattern-celebrate');
    expect(item).toHaveTextContent(/3 entries/);
    expect(item).toHaveTextContent(/avg \d+\.\d+ std/);
    expect(item).toHaveTextContent(/vs overall/);
  });

  it('renders multiple patterns sorted by absolute deviation', () => {
    const drinks: Drink[] = [
      // big positive deviation
      drink({ ts: 0, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: 1, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: 2, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
      // close to overall (small absolute deviation)
      drink({ ts: 3, tags: ['neutral'] }),
      drink({ ts: 4, tags: ['neutral'] }),
      drink({ ts: 5, tags: ['neutral'] }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    const list = screen.getByTestId('tag-patterns-list');
    const items = list.querySelectorAll('[data-testid^="tag-pattern-"]');
    expect(items.length).toBeGreaterThanOrEqual(2);
    // first item should be celebrate (highest abs deviation)
    expect(items[0]).toHaveAttribute('data-testid', 'tag-pattern-celebrate');
  });

  it('renders the explanatory caption about the threshold', () => {
    const drinks: Drink[] = [
      drink({ ts: 0, tags: ['x'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 1, tags: ['x'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 2, tags: ['x'], volumeMl: 750, abvPct: 13 }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    expect(screen.getByText(/at least 3 entries/i)).toBeInTheDocument();
  });
});
