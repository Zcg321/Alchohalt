import { describe, it, expect, vi } from 'vitest';
vi.mock('../src/lib/notify', () => ({ resyncNotifications: () => Promise.resolve() }));
import { useDB } from '../src/store/db';

describe('persistence flags', () => {
  it('reminders times persist in store state', () => {
    const set = useDB.getState().setReminderTimes;
    set(['20:00','21:00']);
    const times = useDB.getState().db.settings.reminders.times;
    expect(times).toContain('20:00');
    expect(times).toContain('21:00');
  });
});
