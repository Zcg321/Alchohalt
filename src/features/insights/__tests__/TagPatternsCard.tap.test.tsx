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

describe('[R15-A] TagPatternsCard tap-through to explorer', () => {
  it('shows tag explorer when a tag is tapped', () => {
    const drinks: Drink[] = [
      drink({ ts: Date.now(), tags: ['stressed'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: Date.now() - 86400000, tags: ['stressed'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: Date.now() - 172800000, tags: ['stressed'], volumeMl: 750, abvPct: 14 }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    expect(screen.queryByTestId('tag-explorer')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tag-pattern-button-stressed'));
    expect(screen.getByTestId('tag-explorer')).toBeInTheDocument();
  });

  it('toggles closed when same tag tapped again', () => {
    const drinks: Drink[] = [
      drink({ ts: Date.now(), tags: ['stressed'] }),
      drink({ ts: Date.now() - 86400000, tags: ['stressed'] }),
      drink({ ts: Date.now() - 172800000, tags: ['stressed'] }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    fireEvent.click(screen.getByTestId('tag-pattern-button-stressed'));
    expect(screen.getByTestId('tag-explorer')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tag-pattern-button-stressed'));
    expect(screen.queryByTestId('tag-explorer')).not.toBeInTheDocument();
  });

  it('closes on explorer close button', () => {
    const drinks: Drink[] = [
      drink({ ts: Date.now(), tags: ['stressed'] }),
      drink({ ts: Date.now() - 86400000, tags: ['stressed'] }),
      drink({ ts: Date.now() - 172800000, tags: ['stressed'] }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    fireEvent.click(screen.getByTestId('tag-pattern-button-stressed'));
    fireEvent.click(screen.getByTestId('tag-explorer-close'));
    expect(screen.queryByTestId('tag-explorer')).not.toBeInTheDocument();
  });

  it('switches explorer when a different tag is tapped', () => {
    const drinks: Drink[] = [
      drink({ ts: Date.now(), tags: ['stressed'] }),
      drink({ ts: Date.now() - 86400000, tags: ['stressed'] }),
      drink({ ts: Date.now() - 172800000, tags: ['stressed'] }),
      drink({ ts: Date.now() - 200, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: Date.now() - 86400200, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: Date.now() - 172800200, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    fireEvent.click(screen.getByTestId('tag-pattern-button-stressed'));
    expect(screen.getByTestId('tag-explorer')).toHaveTextContent('#stressed');
    fireEvent.click(screen.getByTestId('tag-pattern-button-celebrate'));
    expect(screen.getByTestId('tag-explorer')).toHaveTextContent('#celebrate');
  });

  it('aria-expanded reflects open state', () => {
    const drinks: Drink[] = [
      drink({ ts: Date.now(), tags: ['stressed'] }),
      drink({ ts: Date.now() - 86400000, tags: ['stressed'] }),
      drink({ ts: Date.now() - 172800000, tags: ['stressed'] }),
    ];
    render(<TagPatternsCard drinks={drinks} />);
    const btn = screen.getByTestId('tag-pattern-button-stressed');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});
