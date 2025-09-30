import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import VoiceInput from '../VoiceInput';

describe('VoiceInput.tsx', () => {
  it('mounts without crashing', () => {
    const mockOnVoiceResult = vi.fn();
    const { container } = render(
      <VoiceInput onVoiceResult={mockOnVoiceResult} />
    );
    expect(container).toBeTruthy();
  });
});
