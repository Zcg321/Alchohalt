/**
 * [R25-H] InsightsEmptyPreview — sample-data preview for users with
 * < 7 entries. Always labeled "Sample" — never risks confusing
 * preview with real data.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsightsEmptyPreview from '../InsightsEmptyPreview';

describe('[R25-H] InsightsEmptyPreview', () => {
  it('renders the heading + sample badge', () => {
    render(<InsightsEmptyPreview entryCount={0} />);
    expect(screen.getByTestId('insights-empty-preview')).toBeInTheDocument();
    expect(screen.getByText(/What your Insights will look like/i)).toBeInTheDocument();
    // Multiple "Sample" badges expected across pills + chart
    expect(screen.getAllByText(/Sample/i).length).toBeGreaterThan(0);
  });

  it('shows "log your first drink" copy when entryCount === 0', () => {
    render(<InsightsEmptyPreview entryCount={0} />);
    expect(screen.getByText(/Log your first drink/i)).toBeInTheDocument();
  });

  it('shows "N more entries" copy when 0 < entryCount < 7', () => {
    render(<InsightsEmptyPreview entryCount={3} />);
    expect(screen.getByText(/4 more entries/i)).toBeInTheDocument();
  });

  it('uses singular "entry" when exactly 1 remaining', () => {
    render(<InsightsEmptyPreview entryCount={6} />);
    expect(screen.getByText(/1 more entry/i)).toBeInTheDocument();
  });

  it('renders 4 sample pills with sample numbers', () => {
    render(<InsightsEmptyPreview entryCount={0} />);
    expect(screen.getByText('Trailing 7 days')).toBeInTheDocument();
    expect(screen.getByText('Money saved')).toBeInTheDocument();
    expect(screen.getByText('Peak hour')).toBeInTheDocument();
    expect(screen.getByText('Mood pattern')).toBeInTheDocument();
  });

  it('renders the sample bar chart sketch', () => {
    render(<InsightsEmptyPreview entryCount={0} />);
    expect(screen.getByTestId('insights-empty-preview-chart')).toBeInTheDocument();
  });

  it('explicitly disclaims the preview as illustrative', () => {
    render(<InsightsEmptyPreview entryCount={0} />);
    expect(screen.getByText(/illustrative only/i)).toBeInTheDocument();
  });
});
