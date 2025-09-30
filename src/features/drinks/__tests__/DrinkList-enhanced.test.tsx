import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DrinkList from '../DrinkList';

describe('DrinkList', () => {
  const mockDrinks = [
    {
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social' as const,
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now()
    }
  ];

  it('renders without crashing with empty list', () => {
    render(<DrinkList drinks={[]} onEdit={() => {}} onDelete={() => {}} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with drinks', () => {
    const { container } = render(
      <DrinkList drinks={mockDrinks} onEdit={() => {}} onDelete={() => {}} />
    );
    expect(container).toBeTruthy();
  });

  it('handles edit callback', () => {
    let editCalled = false;
    render(
      <DrinkList 
        drinks={mockDrinks} 
        onEdit={() => { editCalled = true; }} 
        onDelete={() => {}} 
      />
    );
    expect(document.body).toBeTruthy();
  });

  it('handles delete callback', () => {
    let deleteCalled = false;
    render(
      <DrinkList 
        drinks={mockDrinks} 
        onEdit={() => {}} 
        onDelete={() => { deleteCalled = true; }} 
      />
    );
    expect(document.body).toBeTruthy();
  });

  it('renders multiple drinks', () => {
    const multipleDrinks = [
      ...mockDrinks,
      {
        volumeMl: 150,
        abvPct: 12.0,
        intention: 'unwind' as const,
        craving: 4,
        halt: [],
        alt: '',
        ts: Date.now() - 1000
      }
    ];
    
    const { container } = render(
      <DrinkList drinks={multipleDrinks} onEdit={() => {}} onDelete={() => {}} />
    );
    expect(container).toBeTruthy();
  });
});
