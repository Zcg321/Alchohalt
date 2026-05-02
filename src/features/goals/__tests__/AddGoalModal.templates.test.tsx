/**
 * [R9-4] Goal template picker. The modal opens on the template phase;
 * selecting a template advances to the detail phase with title /
 * description / target / type prefilled. "Build my own" skips the
 * template phase entirely.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AddGoalModal from '../AddGoalModal';
import { goalTypes } from '../types';

describe('AddGoalModal — templates [R9-4]', () => {
  it('opens on the template picker phase by default', () => {
    render(<AddGoalModal goalTypes={goalTypes} onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('goal-template-picker')).toBeInTheDocument();
    expect(screen.getByTestId('goal-template-monthOff')).toBeInTheDocument();
    expect(screen.getByTestId('goal-template-cutToSeven')).toBeInTheDocument();
    expect(screen.getByTestId('goal-template-ninetyDayReset')).toBeInTheDocument();
  });

  it('selecting a template advances to detail phase with title prefilled', () => {
    render(<AddGoalModal goalTypes={goalTypes} onAdd={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('goal-template-monthOff'));
    expect(screen.queryByTestId('goal-template-picker')).toBeNull();
    expect((screen.getByLabelText(/Goal Title/i) as HTMLInputElement).value).toBe('30 days clean');
  });

  it('"Build my own" skips template phase to empty form', () => {
    render(<AddGoalModal goalTypes={goalTypes} onAdd={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText(/Build my own/i));
    expect(screen.queryByTestId('goal-template-picker')).toBeNull();
    expect((screen.getByLabelText(/Goal Title/i) as HTMLInputElement).value).toBe('');
  });

  it('submitting from a template fires onAdd with prefilled values', () => {
    const onAdd = vi.fn();
    render(<AddGoalModal goalTypes={goalTypes} onAdd={onAdd} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('goal-template-cutToSeven'));
    // Submit the prefilled form. Use the form's submit button (Create Goal).
    fireEvent.click(screen.getByText(/Create Goal/i));
    expect(onAdd).toHaveBeenCalledTimes(1);
    const arg = onAdd.mock.calls[0][0];
    expect(arg.type).toBe('reduction');
    expect(arg.title).toBe('Cut to 7 drinks per week');
    expect(arg.target).toBe(7);
  });
});
