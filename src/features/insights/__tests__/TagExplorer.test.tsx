import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TagExplorer from '../TagExplorer';
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

describe('[R15-A] TagExplorer', () => {
  it('renders nothing when tag has no matches', () => {
    const { container } = render(
      <TagExplorer drinks={[]} tag="missing" onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders header, count, and avg for matched tag', () => {
    const drinks: Drink[] = [
      drink({ ts: Date.now(), tags: ['stressed'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: Date.now() - 86400000, tags: ['stressed'], volumeMl: 750, abvPct: 14 }),
    ];
    render(<TagExplorer drinks={drinks} tag="stressed" onClose={() => {}} />);
    expect(screen.getByTestId('tag-explorer')).toBeInTheDocument();
    expect(screen.getByText('#stressed')).toBeInTheDocument();
    expect(screen.getByText(/2 entries/)).toBeInTheDocument();
    expect(screen.getByText(/avg \d+\.\d+ std/)).toBeInTheDocument();
  });

  it('renders weekday buckets', () => {
    const drinks: Drink[] = [
      drink({ ts: new Date(2025, 0, 19, 12).getTime(), tags: ['x'] }), // Sunday
      drink({ ts: new Date(2025, 0, 20, 12).getTime(), tags: ['x'] }), // Monday
    ];
    render(<TagExplorer drinks={drinks} tag="x" onClose={() => {}} />);
    expect(screen.getByTestId('tag-explorer-weekday-row')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('renders only active hours in hour row', () => {
    const drinks: Drink[] = [
      drink({ ts: new Date(2025, 0, 15, 8, 30).getTime(), tags: ['x'] }),
      drink({ ts: new Date(2025, 0, 15, 20, 0).getTime(), tags: ['x'] }),
    ];
    render(<TagExplorer drinks={drinks} tag="x" onClose={() => {}} />);
    expect(screen.getByTestId('tag-explorer-hour-row')).toBeInTheDocument();
    expect(screen.getByText('8h')).toBeInTheDocument();
    expect(screen.getByText('20h')).toBeInTheDocument();
    // No bucket for hours with zero entries
    expect(screen.queryByText('0h')).not.toBeInTheDocument();
  });

  it('renders recent entries list', () => {
    const drinks: Drink[] = [];
    for (let i = 0; i < 12; i++) {
      drinks.push(drink({ ts: Date.now() - i * 86400000, tags: ['x'] }));
    }
    render(<TagExplorer drinks={drinks} tag="x" onClose={() => {}} />);
    const recent = screen.getByTestId('tag-explorer-recent');
    expect(recent.querySelectorAll('li')).toHaveLength(10);
  });

  it('fires onClose when close button clicked', () => {
    const drinks: Drink[] = [drink({ ts: Date.now(), tags: ['x'] })];
    const onClose = vi.fn();
    render(<TagExplorer drinks={drinks} tag="x" onClose={onClose} />);
    fireEvent.click(screen.getByTestId('tag-explorer-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
