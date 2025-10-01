import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import JournalEntry, { JournalDisplay } from '../JournalEntry';

describe('JournalEntry.tsx', () => {
  it('mounts without crashing', () => {
    const mockOnSave = vi.fn();
    const { container } = render(
      <JournalEntry onSave={mockOnSave} />
    );
    expect(container).toBeTruthy();
  });

  it('JournalDisplay mounts without crashing', () => {
    const { container } = render(
      <JournalDisplay
        journal="Test journal entry"
        mood="happy"
        timestamp={Date.now()}
      />
    );
    expect(container).toBeTruthy();
  });
});
