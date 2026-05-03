import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ResetPreferencesPanel from '../ResetPreferencesPanel';
import { useDB } from '../../../store/db';

describe('[R17-3] ResetPreferencesPanel', () => {
  beforeEach(() => {
    /* Set the store to a non-default state so reset is observable. */
    act(() => {
      useDB.setState((s) => ({
        db: {
          ...s.db,
          settings: {
            ...s.db.settings,
            theme: 'dark',
            language: 'es',
            dailyGoalDrinks: 4,
            weeklyGoalDrinks: 14,
            reminders: { enabled: true, times: ['18:00'] },
          },
        },
      }));
    });
  });

  it('shows the collapsed open button by default', () => {
    render(<ResetPreferencesPanel />);
    expect(screen.getByTestId('reset-prefs-open')).toBeInTheDocument();
    expect(screen.queryByTestId('reset-prefs-categories')).not.toBeInTheDocument();
  });

  it('expands the checklist when the open button is clicked', () => {
    render(<ResetPreferencesPanel />);
    fireEvent.click(screen.getByTestId('reset-prefs-open'));
    expect(screen.getByTestId('reset-prefs-categories')).toBeInTheDocument();
  });

  it('disables the Continue button when no categories are selected', () => {
    render(<ResetPreferencesPanel />);
    fireEvent.click(screen.getByTestId('reset-prefs-open'));
    expect(screen.getByTestId('reset-prefs-continue')).toBeDisabled();
  });

  it('lists exactly the selected categories in the confirmation modal', () => {
    render(<ResetPreferencesPanel />);
    fireEvent.click(screen.getByTestId('reset-prefs-open'));
    fireEvent.click(screen.getByTestId('reset-prefs-theme'));
    fireEvent.click(screen.getByTestId('reset-prefs-language'));
    fireEvent.click(screen.getByTestId('reset-prefs-continue'));
    const summary = screen.getByTestId('reset-prefs-summary');
    expect(summary.textContent).toMatch(/Theme/);
    expect(summary.textContent).toMatch(/Language/);
    expect(summary.textContent).not.toMatch(/Notifications/);
    expect(summary.textContent).not.toMatch(/Goal targets/);
  });

  it('Cancel keeps the original settings unchanged', () => {
    render(<ResetPreferencesPanel />);
    fireEvent.click(screen.getByTestId('reset-prefs-open'));
    fireEvent.click(screen.getByTestId('reset-prefs-theme'));
    fireEvent.click(screen.getByTestId('reset-prefs-continue'));
    fireEvent.click(screen.getByTestId('reset-prefs-cancel'));
    expect(useDB.getState().db.settings.theme).toBe('dark');
  });

  it('Reset selected applies the patch and closes the panel', () => {
    render(<ResetPreferencesPanel />);
    fireEvent.click(screen.getByTestId('reset-prefs-open'));
    fireEvent.click(screen.getByTestId('reset-prefs-theme'));
    fireEvent.click(screen.getByTestId('reset-prefs-language'));
    fireEvent.click(screen.getByTestId('reset-prefs-continue'));
    fireEvent.click(screen.getByTestId('reset-prefs-confirm-btn'));
    expect(useDB.getState().db.settings.theme).toBe('system');
    expect(useDB.getState().db.settings.language).toBe('en');
    /* Other settings that were not selected should remain unchanged. */
    expect(useDB.getState().db.settings.dailyGoalDrinks).toBe(4);
    expect(screen.queryByTestId('reset-prefs-confirm')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reset-prefs-categories')).not.toBeInTheDocument();
  });

  it('reset notifications zeroes reminder times + disables the toggle', () => {
    render(<ResetPreferencesPanel />);
    fireEvent.click(screen.getByTestId('reset-prefs-open'));
    fireEvent.click(screen.getByTestId('reset-prefs-notifications'));
    fireEvent.click(screen.getByTestId('reset-prefs-continue'));
    fireEvent.click(screen.getByTestId('reset-prefs-confirm-btn'));
    expect(useDB.getState().db.settings.reminders.enabled).toBe(false);
    expect(useDB.getState().db.settings.reminders.times).toEqual([]);
  });

  it('reset goals zeroes the three goal-target fields without touching advanced goals', () => {
    render(<ResetPreferencesPanel />);
    fireEvent.click(screen.getByTestId('reset-prefs-open'));
    fireEvent.click(screen.getByTestId('reset-prefs-goals'));
    fireEvent.click(screen.getByTestId('reset-prefs-continue'));
    fireEvent.click(screen.getByTestId('reset-prefs-confirm-btn'));
    expect(useDB.getState().db.settings.dailyGoalDrinks).toBe(0);
    expect(useDB.getState().db.settings.weeklyGoalDrinks).toBe(0);
    expect(useDB.getState().db.settings.monthlyBudget).toBe(0);
  });
});
