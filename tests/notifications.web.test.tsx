import { describe, it, expect } from 'vitest';
import { isReminderWindowDue } from '../src/lib/notify';

describe('web reminder window', () => {
  it('due within ±30m when no entry today', () => {
    const now = new Date(); now.setHours(20,0,0,0);
    const due = isReminderWindowDue(now.getTime(), ['20:15'], undefined);
    expect(due).toBe(true);
  });
  it('not due if already logged today', () => {
    const now = Date.now();
    const last = new Date(); last.setHours(8,0,0,0);
    const due = isReminderWindowDue(now, ['20:00'], last.getTime());
    expect(due).toBe(false);
  });
});
