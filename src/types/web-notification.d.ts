/* Minimal Notification typing for environments missing DOM lib (vitest) */
interface NotificationOptions { body?: string }
declare const Notification: {
  permission: 'default'|'granted'|'denied';
  requestPermission: () => Promise<'default'|'granted'|'denied'>;
  new(title: string, options?: NotificationOptions): Notification;
} | undefined;
