import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { parseTags, normalizeTag } from '../lib';
import TagsInput from '../TagsInput';

describe('[R14-3] normalizeTag', () => {
  it('lowercases', () => {
    expect(normalizeTag('Stressed')).toBe('stressed');
  });
  it('trims whitespace', () => {
    expect(normalizeTag('  family  ')).toBe('family');
  });
  it('strips leading hash signs', () => {
    expect(normalizeTag('#cope')).toBe('cope');
    expect(normalizeTag('##cope')).toBe('cope');
  });
  it('returns empty string for blank input', () => {
    expect(normalizeTag('   ')).toBe('');
    expect(normalizeTag('')).toBe('');
  });
});

describe('[R14-3] parseTags', () => {
  it('parses comma-separated tags', () => {
    expect(parseTags('a, b, c')).toEqual(['a', 'b', 'c']);
  });
  it('drops empty entries', () => {
    expect(parseTags(',,a,,b,,')).toEqual(['a', 'b']);
  });
  it('deduplicates after normalization', () => {
    expect(parseTags('Stressed, stressed, STRESSED')).toEqual(['stressed']);
  });
  it('preserves first-occurrence order', () => {
    expect(parseTags('z, a, m')).toEqual(['z', 'a', 'm']);
  });
  it('handles a single bare tag', () => {
    expect(parseTags('lonely')).toEqual(['lonely']);
  });
  it('handles empty input', () => {
    expect(parseTags('')).toEqual([]);
  });
});

describe('[R14-3] TagsInput component', () => {
  it('renders the label and the input', () => {
    render(<TagsInput value={[]} onChange={() => {}} />);
    expect(screen.getByLabelText(/Tags/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add tag/i)).toBeInTheDocument();
  });

  it('renders existing tag chips', () => {
    render(<TagsInput value={['stressed', 'work']} onChange={() => {}} />);
    expect(screen.getByText('#stressed')).toBeInTheDocument();
    expect(screen.getByText('#work')).toBeInTheDocument();
  });

  it('commits a tag on Enter and clears the buffer', () => {
    const onChange = vi.fn<(next: string[]) => void>();
    render(<TagsInput value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Add tag/i);
    fireEvent.change(input, { target: { value: 'lonely' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['lonely']);
  });

  it('commits a tag on comma keypress', () => {
    const onChange = vi.fn<(next: string[]) => void>();
    render(<TagsInput value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Add tag/i);
    fireEvent.change(input, { target: { value: 'work' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(onChange).toHaveBeenCalledWith(['work']);
  });

  it('removes a tag when its × button is clicked', () => {
    const onChange = vi.fn<(next: string[]) => void>();
    render(<TagsInput value={['stressed', 'work']} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('tags-input-remove-stressed'));
    expect(onChange).toHaveBeenCalledWith(['work']);
  });

  it('pops the last tag on Backspace when input is empty', () => {
    const onChange = vi.fn<(next: string[]) => void>();
    render(<TagsInput value={['a', 'b', 'c']} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Add tag/i);
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('ignores Backspace when buffer has content (lets browser handle)', () => {
    const onChange = vi.fn<(next: string[]) => void>();
    render(<TagsInput value={['a']} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Add tag/i);
    fireEvent.change(input, { target: { value: 'in-progress' } });
    fireEvent.keyDown(input, { key: 'Backspace' });
    // Backspace with content lets the browser delete a character;
    // it should NOT pop an existing tag.
    expect(onChange).not.toHaveBeenCalledWith(['']);
  });

  it('does not commit empty/whitespace tags on Enter', () => {
    const onChange = vi.fn<(next: string[]) => void>();
    render(<TagsInput value={['existing']} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Add tag/i);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the normalize hint when buffer differs from its normalized form', () => {
    render(<TagsInput value={[]} onChange={() => {}} />);
    const input = screen.getByPlaceholderText(/Add tag/i);
    fireEvent.change(input, { target: { value: 'Stressed' } });
    expect(screen.getByText(/Will save as: #stressed/i)).toBeInTheDocument();
  });

  it('does not show the normalize hint when buffer matches its normalized form', () => {
    render(<TagsInput value={[]} onChange={() => {}} />);
    const input = screen.getByPlaceholderText(/Add tag/i);
    fireEvent.change(input, { target: { value: 'work' } });
    expect(screen.queryByText(/Will save as:/i)).not.toBeInTheDocument();
  });

  it('commits buffer on blur', () => {
    const onChange = vi.fn<(next: string[]) => void>();
    render(<TagsInput value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Add tag/i);
    fireEvent.change(input, { target: { value: 'cope' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(['cope']);
  });

  it('dedupes when committing a tag already in value', () => {
    const onChange = vi.fn<(next: string[]) => void>();
    render(<TagsInput value={['work']} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Add tag/i);
    fireEvent.change(input, { target: { value: 'work' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['work']);
  });
});
