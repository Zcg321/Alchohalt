import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import About from '../About';

describe('[R17-6] About.tsx — clinician-judge disclaimer', () => {
  it('still includes the original "not medical care" disclaimer', () => {
    render(<About />);
    /* The original line stays — R17-6 only ADDS a clarifier, doesn't
     * replace the existing disclaimer. */
    expect(screen.getByText(/does not provide medical advice/i)).toBeInTheDocument();
  });

  it('includes the new "not delivery of clinical care" clarifier', () => {
    render(<About />);
    /* The R17-6 clarifier names the gap between "not medical care"
     * and the intervention-resembling features (self-monitoring,
     * goal-setting, pattern insights). */
    expect(
      screen.getByText(/resemble components of clinical interventions but are not delivery of clinical care/i),
    ).toBeInTheDocument();
  });

  it('still routes urgent-help requests to the Crisis tab', () => {
    render(<About />);
    expect(screen.getByText(/Crisis tab has direct numbers/i)).toBeInTheDocument();
  });
});
