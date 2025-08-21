import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import {
  requestPermissionIfNeeded,
  scheduleDailyCheckins,
  cancelAll,
} from '../../lib/notify';

export function NotificationsToggle() {
  const [enabled, setEnabled] = useState(false);

  async function enable() {
    await requestPermissionIfNeeded();
    await scheduleDailyCheckins();
    setEnabled(true);
  }

  async function disable() {
    await cancelAll();
    setEnabled(false);
  }

  return (
    <div>
      {enabled ? (
        <Button onClick={disable}>Disable check-in reminders</Button>
      ) : (
        <Button onClick={enable}>Enable check-in reminders</Button>
      )}
    </div>
  );
}
