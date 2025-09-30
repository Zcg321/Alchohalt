/**
 * Data persistence service abstraction layer
 * Abstracts Capacitor Preferences to enable testing and future platform flexibility
 */

export interface DataPersistenceService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface NotificationService {
  requestPermissions(): Promise<boolean>;
  schedule(notifications: Array<{
    id: number;
    title: string;
    body: string;
    schedule: { at: Date } | { repeats: boolean; every: string };
  }>): Promise<void>;
  cancel(ids: number[]): Promise<void>;
  cancelAll(): Promise<void>;
}

/**
 * Capacitor-based implementation of data persistence
 */
export class CapacitorDataService implements DataPersistenceService {
  private async getPreferences() {
    return (await import("@capacitor/preferences")).Preferences;
  }

  async getItem(key: string): Promise<string | null> {
    const prefs = await this.getPreferences();
    const result = await prefs.get({ key });
    return result.value;
  }

  async setItem(key: string, value: string): Promise<void> {
    const prefs = await this.getPreferences();
    await prefs.set({ key, value });
  }

  async removeItem(key: string): Promise<void> {
    const prefs = await this.getPreferences();
    await prefs.remove({ key });
  }

  async clear(): Promise<void> {
    const prefs = await this.getPreferences();
    await prefs.clear();
  }
}

/**
 * Type for Capacitor LocalNotifications API
 */
interface LocalNotificationsAPI {
  requestPermissions(): Promise<{ display?: 'granted' | 'denied' }>;
  schedule(options: { notifications: Array<{ id: number; title: string; body: string; schedule: { at: Date } | { repeats: boolean; every: string } }> }): Promise<void>;
  cancel(options: { notifications: Array<{ id: number }> }): Promise<void>;
  cancelAll(): Promise<void>;
}

/**
 * Capacitor-based implementation of notifications
 */
export class CapacitorNotificationService implements NotificationService {
  private async getLocalNotifications(): Promise<LocalNotificationsAPI> {
    return (await import("@capacitor/local-notifications")).LocalNotifications as LocalNotificationsAPI;
  }

  async requestPermissions(): Promise<boolean> {
    const localNotifications = await this.getLocalNotifications();
    const result = await localNotifications.requestPermissions();
    return result.display === 'granted';
  }

  async schedule(notifications: Array<{
    id: number;
    title: string;
    body: string;
    schedule: { at: Date } | { repeats: boolean; every: string };
  }>): Promise<void> {
    const localNotifications = await this.getLocalNotifications();
    await localNotifications.schedule({ notifications });
  }

  async cancel(ids: number[]): Promise<void> {
    const localNotifications = await this.getLocalNotifications();
    await localNotifications.cancel({ notifications: ids.map(id => ({ id })) });
  }

  async cancelAll(): Promise<void> {
    const localNotifications = await this.getLocalNotifications();
    await localNotifications.cancelAll();
  }
}

// Service instances - can be swapped for testing
export const dataService: DataPersistenceService = new CapacitorDataService();
export const notificationService: NotificationService = new CapacitorNotificationService();
