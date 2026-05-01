/**
 * Data persistence service abstraction layer
 * Abstracts Capacitor Preferences to enable testing and future platform flexibility
 *
 * [BUG-PREFERENCES-SHIM-COVERAGE] All Capacitor.Preferences access in
 * the app MUST route through getPreferences() in src/shared/capacitor.ts
 * — that helper hands back the real plugin on native and a localStorage
 * shim on web. Importing @capacitor/preferences directly from any other
 * module bypasses the web shim and triggers
 * "Preferences.X() is not implemented on web" errors that the analytics
 * service then captures into localStorage forever. The eslint
 * no-restricted-imports rule below enforces this.
 */

import { getPreferences } from "../shared/capacitor";

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
  async getItem(key: string): Promise<string | null> {
    const prefs = await getPreferences();
    const result = await prefs.get({ key });
    return result.value;
  }

  async setItem(key: string, value: string): Promise<void> {
    const prefs = await getPreferences();
    await prefs.set({ key, value });
  }

  async removeItem(key: string): Promise<void> {
    const prefs = await getPreferences();
    await prefs.remove({ key });
  }

  async clear(): Promise<void> {
    const prefs = await getPreferences();
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
