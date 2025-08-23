import React from 'react';
import { useDB } from '../../store/db';
import { isReminderWindowDue } from '../../lib/notify';

export default function ReminderBanner() {
  const db = useDB(s=>s.db);
  const dismissReminderUntil = useDB(s=>s.dismissReminderUntil);
  const now = Date.now();
  const suppressed = db.meta?.reminderSuppressedUntil && db.meta.reminderSuppressedUntil > now;
  const due = db.settings.reminders.enabled && isReminderWindowDue(now, db.settings.reminders.times, db._lastLogAt);
  if (!due || suppressed) return null;

  const logNow = () => { window.location.href = '/log'; };

  return (
    <div className="fixed top-0 inset-x-0 z-40 bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 px-4 py-3 flex items-center justify-between shadow">
      <span className="font-medium">Reminder: log your day?</span>
      <div className="flex gap-2">
        <button aria-label="Log now" className="px-3 py-1 rounded bg-amber-600 text-white" onClick={logNow}>Log now</button>
        <button aria-label="Dismiss" className="px-3 py-1 rounded border border-amber-700" onClick={()=>dismissReminderUntil(now + 60*60*1000)}>Dismiss</button>
      </div>
    </div>
  );
}
