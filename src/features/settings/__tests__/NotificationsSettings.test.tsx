import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import NotificationsSettings from '../NotificationsSettings';
import { useDB } from '../../../store/db';

beforeEach(() => {
  // Reset the store to a clean default before each test.
  useDB.setState({
    db: {
      version: 1,
      entries: [],
      trash: [],
      settings: {
        version: 1,
        language: 'en',
        theme: 'system',
        dailyGoalDrinks: 0,
        weeklyGoalDrinks: 0,
        monthlyBudget: 0,
        reminders: { enabled: false, times: [] },
        showBAC: false,
      },
      advancedGoals: [],
      presets: [],
      healthMetrics: [],
      meta: {},
    },
  });
});

describe('NotificationsSettings (UI)', () => {
  it('renders all four notification-type toggles', () => {
    render(<NotificationsSettings />);
    expect(screen.getByTestId('notif-type-dailyCheckin')).toBeInTheDocument();
    expect(screen.getByTestId('notif-type-goalMilestone')).toBeInTheDocument();
    expect(screen.getByTestId('notif-type-retrospective')).toBeInTheDocument();
    expect(screen.getByTestId('notif-type-backupVerification')).toBeInTheDocument();
  });

  it('default state: dailyCheckin on, others off', () => {
    render(<NotificationsSettings />);
    expect(screen.getByTestId('notif-type-dailyCheckin')).toBeChecked();
    expect(screen.getByTestId('notif-type-goalMilestone')).not.toBeChecked();
    expect(screen.getByTestId('notif-type-retrospective')).not.toBeChecked();
    expect(screen.getByTestId('notif-type-backupVerification')).not.toBeChecked();
  });

  it('toggling dailyCheckin off persists to settings', () => {
    render(<NotificationsSettings />);
    const checkbox = screen.getByTestId('notif-type-dailyCheckin') as HTMLInputElement;
    fireEvent.click(checkbox);
    const stored = useDB.getState().db.settings.calmNotifications;
    expect(stored?.types?.dailyCheckin).toBe(false);
  });

  it('toggling goalMilestone on persists to settings', () => {
    render(<NotificationsSettings />);
    const checkbox = screen.getByTestId('notif-type-goalMilestone') as HTMLInputElement;
    fireEvent.click(checkbox);
    const stored = useDB.getState().db.settings.calmNotifications;
    expect(stored?.types?.goalMilestone).toBe(true);
  });

  it('quiet hours default to 23:00 — 07:00', () => {
    render(<NotificationsSettings />);
    const start = screen.getByTestId('quiet-start') as HTMLSelectElement;
    const end = screen.getByTestId('quiet-end') as HTMLSelectElement;
    expect(start.value).toBe('23');
    expect(end.value).toBe('7');
  });

  it('changing quiet-start persists to settings', () => {
    render(<NotificationsSettings />);
    const start = screen.getByTestId('quiet-start');
    fireEvent.change(start, { target: { value: '21' } });
    const stored = useDB.getState().db.settings.calmNotifications;
    expect(stored?.quietHours?.startHour).toBe(21);
  });

  it('daily cap default is 2, and can be raised', () => {
    render(<NotificationsSettings />);
    const cap = screen.getByTestId('daily-cap') as HTMLInputElement;
    expect(cap.value).toBe('2');
    fireEvent.change(cap, { target: { value: '3' } });
    const stored = useDB.getState().db.settings.calmNotifications;
    expect(stored?.dailyCap).toBe(3);
  });

  it('daily cap clamps to [0, 6]', () => {
    render(<NotificationsSettings />);
    const cap = screen.getByTestId('daily-cap');
    fireEvent.change(cap, { target: { value: '99' } });
    expect(useDB.getState().db.settings.calmNotifications?.dailyCap).toBe(6);
    fireEvent.change(cap, { target: { value: '-5' } });
    expect(useDB.getState().db.settings.calmNotifications?.dailyCap).toBe(0);
  });

  it('mentions the app-floor of 23-7 in the UI', () => {
    render(<NotificationsSettings />);
    expect(screen.getByText(/floor.*23:00/i)).toBeInTheDocument();
  });

  it('description mentions toggle-off is permanent', () => {
    render(<NotificationsSettings />);
    expect(screen.getByText(/permanent/i)).toBeInTheDocument();
  });
});
