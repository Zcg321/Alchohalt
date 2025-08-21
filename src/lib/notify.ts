import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestPermissionIfNeeded() {
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') {
    await LocalNotifications.requestPermissions();
  }
}

function atHour(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
}

export async function scheduleDailyCheckins() {
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: 'Morning check-in',
        body: 'How are you feeling?',
        schedule: { every: 'day', at: atHour(9) },
      },
      {
        id: 2,
        title: 'Evening check-in',
        body: 'Log your drinks',
        schedule: { every: 'day', at: atHour(21) },
      },
    ],
  });
}

export async function cancelAll() {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications });
  }
}
