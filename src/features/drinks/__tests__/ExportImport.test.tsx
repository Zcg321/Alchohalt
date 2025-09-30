import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ExportImport from '../ExportImport';

describe('ExportImport', () => {
  it('renders without crashing', () => {
    render(<ExportImport />);
    expect(document.body).toBeTruthy();
  });

  it('renders with export handler', () => {
    const { container } = render(<ExportImport onExport={() => {}} />);
    expect(container).toBeTruthy();
  });

  it('renders with import handler', () => {
    const { container } = render(<ExportImport onImport={() => {}} />);
    expect(container).toBeTruthy();
  });

  it('renders with both handlers', () => {
    const { container } = render(<ExportImport onExport={() => {}} onImport={() => {}} />);
    expect(container).toBeTruthy();
  });
});
