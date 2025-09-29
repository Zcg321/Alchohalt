import { getLocalNotifications, getPreferences } from '../capacitor';

describe('capacitor utilities', () => {
  test('getLocalNotifications returns LocalNotifications', async () => {
    const localNotifications = await getLocalNotifications();
    expect(localNotifications).toBeDefined();
    expect(typeof localNotifications).toBe('object');
  });

  test('getPreferences returns Preferences', async () => {
    const preferences = await getPreferences();
    expect(preferences).toBeDefined();
    expect(typeof preferences).toBe('object');
  });
});