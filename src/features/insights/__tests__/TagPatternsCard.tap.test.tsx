import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

/* [R21-1] All tests are async because the patterns now resolve via
 * the worker client (sync fallback in jsdom but still wrapped in a
 * microtask). Use `findByTestId` to wait for the first render that
 * has data; subsequent `getByTestId` is fine because the data won't
 * disappear in the same test. */
describe('[R15-A] TagPatternsCard tap-through to explorer', () => {
  it('shows tag explorer when a tag is tapped', async () => {
    const drinks: Drink[] = [
      drink({ ts: Date.now(), tags: ['stressed'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: Date.now() - 86400000, tags: ['stressed'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: Date.now() - 172800000, tags: ['stressed'], volumeMl: 750, abvPct: 14 }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    const btn = await screen.findByTestId('tag-pattern-button-stressed');
    expect(screen.queryByTestId('tag-explorer')).not.toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.getByTestId('tag-explorer')).toBeInTheDocument();
  });

  it('toggles closed when same tag tapped again', async () => {
    const drinks: Drink[] = [
      drink({ ts: Date.now(), tags: ['stressed'] }),
      drink({ ts: Date.now() - 86400000, tags: ['stressed'] }),
      drink({ ts: Date.now() - 172800000, tags: ['stressed'] }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    const btn = await screen.findByTestId('tag-pattern-button-stressed');
    fireEvent.click(btn);
    expect(screen.getByTestId('tag-explorer')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByTestId('tag-explorer')).not.toBeInTheDocument();
  });

  it('closes on explorer close button', async () => {
    const drinks: Drink[] = [
      drink({ ts: Date.now(), tags: ['stressed'] }),
      drink({ ts: Date.now() - 86400000, tags: ['stressed'] }),
      drink({ ts: Date.now() - 172800000, tags: ['stressed'] }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    const btn = await screen.findByTestId('tag-pattern-button-stressed');
    fireEvent.click(btn);
    fireEvent.click(screen.getByTestId('tag-explorer-close'));
    expect(screen.queryByTestId('tag-explorer')).not.toBeInTheDocument();
  });

  it('switches explorer when a different tag is tapped', async () => {
    const drinks: Drink[] = [
      drink({ ts: Date.now(), tags: ['stressed'] }),
      drink({ ts: Date.now() - 86400000, tags: ['stressed'] }),
      drink({ ts: Date.now() - 172800000, tags: ['stressed'] }),
      drink({ ts: Date.now() - 200, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: Date.now() - 86400200, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: Date.now() - 172800200, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    const stressedBtn = await screen.findByTestId('tag-pattern-button-stressed');
    fireEvent.click(stressedBtn);
    expect(screen.getByTestId('tag-explorer')).toHaveTextContent('#stressed');
    fireEvent.click(screen.getByTestId('tag-pattern-button-celebrate'));
    expect(screen.getByTestId('tag-explorer')).toHaveTextContent('#celebrate');
  });

  it('aria-expanded reflects open state', async () => {
    const drinks: Drink[] = [
      drink({ ts: Date.now(), tags: ['stressed'] }),
      drink({ ts: Date.now() - 86400000, tags: ['stressed'] }),
      drink({ ts: Date.now() - 172800000, tags: ['stressed'] }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    const btn = await screen.findByTestId('tag-pattern-button-stressed');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});
